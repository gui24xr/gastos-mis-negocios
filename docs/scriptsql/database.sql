-- ================================================================
-- BORRADO TOTAL: schema public + todos los usuarios de auth
-- ================================================================

-- 1. Tira todo el schema public (tablas, vistas, funciones, tipos — todo)
drop schema public cascade;
create schema public;

-- Restaura los permisos que Supabase necesita para que la API siga funcionando
grant usage on schema public to postgres, anon, authenticated, service_role;
grant all on schema public to postgres, service_role;
alter default privileges in schema public grant all on tables to postgres, service_role;
alter default privileges in schema public grant all on sequences to postgres, service_role;
alter default privileges in schema public grant all on functions to postgres, service_role;

-- 2. Limpia todas las tablas internas de Auth que dependen de auth.users
delete from auth.identities;
delete from auth.sessions;
delete from auth.refresh_tokens;
delete from auth.mfa_factors;
delete from auth.mfa_challenges;
delete from auth.mfa_amr_claims;
delete from auth.one_time_tokens;

-- 3. Borra TODOS los usuarios (no solo los del seed)
delete from auth.users;

-- El trigger sobre auth.users ya se fue junto con el schema public (drop cascade)


do $$
declare
  r record;
begin
  for r in (select tablename from pg_tables where schemaname = 'public') loop
    execute 'drop table if exists public.' || quote_ident(r.tablename) || ' cascade';
  end loop;

  for r in (
    select t.typname
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typtype = 'e'
  ) loop
    execute 'drop type if exists public.' || quote_ident(r.typname) || ' cascade';
  end loop;

  for r in (
    select p.oid::regprocedure as func_sig
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and not exists (
        select 1 from pg_depend d where d.objid = p.oid and d.deptype = 'e'
      )
  ) loop
    execute 'drop function if exists ' || r.func_sig || ' cascade';
  end loop;
end $$;

drop view if exists public.membership_details cascade;
drop trigger if exists on_auth_user_created on auth.users;

delete from auth.users where email like '%@minegocio.com' or email like '%@seed.test';

create type public.member_role as enum ('OWNER', 'MANAGER', 'EMPLOYEE');

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================
-- people
-- ============================================
create table public.people (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid unique references auth.users (id) on delete set null,
  full_name  text not null,
  email      text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger people_set_updated_at
  before update on public.people
  for each row execute function public.set_updated_at();

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.people
  set user_id    = new.id,
      updated_at = now()
  where lower(email) = lower(new.email)
    and user_id is null;

  if not found then
    insert into public.people (user_id, full_name, email)
    values (
      new.id,
      coalesce(new.raw_user_meta_data ->> 'full_name', new.email),
      new.email
    );
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================
-- businesses
-- ============================================
create table public.businesses (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger businesses_set_updated_at
  before update on public.businesses
  for each row execute function public.set_updated_at();

-- ============================================
-- memberships
-- ============================================
create table public.memberships (
  id          uuid primary key default gen_random_uuid(),
  person_id   uuid not null references public.people (id) on delete cascade,
  business_id uuid not null references public.businesses (id) on delete cascade,
  role        public.member_role not null default 'EMPLOYEE',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (person_id, business_id)
);

create index memberships_business_id_idx on public.memberships (business_id);

create trigger memberships_set_updated_at
  before update on public.memberships
  for each row execute function public.set_updated_at();

-- ============================================
-- expenses
-- ============================================
create table public.expenses (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  person_id   uuid not null references public.people (id) on delete restrict,
  amount      numeric(12,2) not null check (amount > 0),
  description text not null,
  category    text,
  spent_at    timestamptz not null default now(),
  images      jsonb not null default '[]',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint expenses_images_is_array check (jsonb_typeof(images) = 'array')
);

create index expenses_business_spent_idx on public.expenses (business_id, spent_at);
create index expenses_person_id_idx on public.expenses (person_id);

create trigger expenses_set_updated_at
  before update on public.expenses
  for each row execute function public.set_updated_at();

-- ============================================
-- cash_closings
-- ============================================
create table public.cash_closings (
  id              uuid primary key default gen_random_uuid(),
  business_id     uuid not null references public.businesses (id) on delete cascade,
  person_id       uuid not null references public.people (id) on delete restrict,
  closing_date    date not null,
  expected_amount numeric(12,2) not null,
  counted_amount  numeric(12,2) not null,
  difference      numeric(12,2) generated always as (counted_amount - expected_amount) stored,
  notes           text,
  images          jsonb not null default '[]',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (business_id, closing_date),
  constraint cash_closings_images_is_array check (jsonb_typeof(images) = 'array')
);

create index cash_closings_person_id_idx on public.cash_closings (person_id);

create trigger cash_closings_set_updated_at
  before update on public.cash_closings
  for each row execute function public.set_updated_at();

-- ============================================
-- notes
-- ============================================
create table public.notes (
  id          uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  person_id   uuid not null references public.people (id) on delete restrict,
  title       text,
  content     text not null check (length(trim(content)) > 0),
  note_date   date not null default current_date,
  images      jsonb not null default '[]',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint notes_images_is_array check (jsonb_typeof(images) = 'array')
);

create index notes_business_date_idx on public.notes (business_id, note_date desc);
create index notes_person_id_idx on public.notes (person_id);

create trigger notes_set_updated_at
  before update on public.notes
  for each row execute function public.set_updated_at();

-- ============================================
-- vista: membership_details
-- ============================================
create view public.membership_details as
select
  m.id            as membership_id,
  m.business_id,
  m.role,
  m.created_at    as joined_at,
  p.id            as person_id,
  p.full_name,
  p.email         as person_email,
  p.user_id,
  au.email        as user_email,
  au.confirmed_at,
  au.last_sign_in_at,
  au.banned_until,
  case
    when p.user_id is null       then 'sin_user'
    when au.banned_until > now() then 'inactivo'
    when au.confirmed_at is null then 'pendiente'
    else 'activo'
  end as user_estado
from public.memberships m
join public.people p     on p.id = m.person_id
left join auth.users au  on au.id = p.user_id;

-- ================================================================
-- SEED
-- ================================================================

insert into public.people (id, full_name, email) values
  ('00000000-0000-0000-0000-000000000001', 'Ana Gómez',       'ana@minegocio.com'),
  ('00000000-0000-0000-0000-000000000002', 'Bruno Pérez',     'bruno@minegocio.com'),
  ('00000000-0000-0000-0000-000000000003', 'Carla Ruiz',      'carla@minegocio.com'),
  ('00000000-0000-0000-0000-000000000004', 'Diego Fernández', 'diego@minegocio.com'),
  ('00000000-0000-0000-0000-000000000005', 'Elena Torres',    'elena@minegocio.com'),
  ('00000000-0000-0000-0000-000000000006', 'Federico Silva',  'fede@minegocio.com'),
  ('00000000-0000-0000-0000-000000000007', 'Gabriela Núñez',  'gabi@minegocio.com'),
  ('00000000-0000-0000-0000-000000000008', 'Hugo Molina',     'hugo@minegocio.com'),
  ('00000000-0000-0000-0000-000000000009', 'Julieta Paz',     'julieta@minegocio.com'),
  ('00000000-0000-0000-0000-000000000010', 'Martín Ibarra',   'martin@minegocio.com'),
  ('00000000-0000-0000-0000-000000000011', 'Roberto (cadete, sin sistema)', null);

insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at)
values
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'ana@minegocio.com',   '{"full_name":"Ana Gómez"}',      now(), now()),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'bruno@minegocio.com', '{"full_name":"Bruno Pérez"}',     now(), now()),
  ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'carla@minegocio.com', '{"full_name":"Carla Ruiz"}',      now(), now()),
  ('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'diego@minegocio.com', '{"full_name":"Diego Fernández"}', now(), now()),
  ('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'elena@minegocio.com', '{"full_name":"Elena Torres"}',    now(), now()),
  ('10000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'fede@minegocio.com',  '{"full_name":"Federico Silva"}',  now(), now()),
  ('10000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'gabi@minegocio.com',  '{"full_name":"Gabriela Núñez"}',  now(), now()),
  ('10000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'hugo@minegocio.com',  '{"full_name":"Hugo Molina"}',     now(), now());

insert into public.businesses (id, title) values
  ('00000000-0000-0000-0000-0000000000b1', 'Panadería La Espiga'),
  ('00000000-0000-0000-0000-0000000000b2', 'Ferretería El Tornillo'),
  ('00000000-0000-0000-0000-0000000000b3', 'Kiosco Central');

insert into public.memberships (person_id, business_id, role) values
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000b1', 'OWNER'),
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-0000000000b2', 'OWNER'),
  ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-0000000000b3', 'OWNER'),
  ('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-0000000000b1', 'MANAGER'),
  ('00000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-0000000000b3', 'MANAGER'),
  ('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-0000000000b2', 'EMPLOYEE'),
  ('00000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-0000000000b2', 'EMPLOYEE'),
  ('00000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-0000000000b1', 'EMPLOYEE'),
  ('00000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-0000000000b3', 'EMPLOYEE'),
  ('00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-0000000000b1', 'EMPLOYEE'),
  ('00000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-0000000000b3', 'EMPLOYEE'),
  ('00000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-0000000000b1', 'EMPLOYEE'),
  ('00000000-0000-0000-0000-000000000010', '00000000-0000-0000-0000-0000000000b2', 'MANAGER'),
  ('00000000-0000-0000-0000-000000000011', '00000000-0000-0000-0000-0000000000b3', 'EMPLOYEE');

insert into public.expenses (business_id, person_id, amount, description, category, spent_at, images) values
  ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-000000000001',  45000.00, 'Compra de harina 000 (50 kg)',  'Insumos',       now() - interval '6 days', '[]'),
  ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-000000000005',   8500.00, 'Levadura fresca',               'Insumos',       now() - interval '5 days', '[]'),
  ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-000000000004',  12000.00, 'Garrafa de gas',                'Servicios',     now() - interval '4 days', '[]'),
  ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-000000000008',   3200.00, 'Bolsas de papel',               'Packaging',     now() - interval '3 days', '[]'),
  ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-000000000001',  68000.00, 'Reparación del horno',          'Mantenimiento', now() - interval '2 days',
    '[{"url": "https://olehvoonmxkgeutoipdf.supabase.co/storage/v1/object/public/attachments/expenses/ticketgasto.webp", "detail": "Ticket del técnico"}]'::jsonb),
  ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-000000000005',   5400.00, 'Manteca y huevos',              'Insumos',       now() - interval '1 day', '[]'),
  ('00000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-000000000002', 120000.00, 'Reposición de herramientas',    'Mercadería',    now() - interval '7 days', '[]'),
  ('00000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-000000000004',   9800.00, 'Flete de proveedor',            'Logística',     now() - interval '5 days', '[]'),
  ('00000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-000000000006',  15600.00, 'Tornillos y bulonería',         'Mercadería',    now() - interval '3 days', '[]'),
  ('00000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-000000000002',  22000.00, 'Factura de electricidad',       'Servicios',     now() - interval '2 days', '[]'),
  ('00000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-000000000006',   4300.00, 'Artículos de limpieza',         'Otros',         now() - interval '1 day', '[]'),
  ('00000000-0000-0000-0000-0000000000b3', '00000000-0000-0000-0000-000000000003',  38000.00, 'Reposición de golosinas',       'Mercadería',    now() - interval '6 days', '[]'),
  ('00000000-0000-0000-0000-0000000000b3', '00000000-0000-0000-0000-000000000007',  17500.00, 'Gaseosas y bebidas',            'Mercadería',    now() - interval '4 days', '[]'),
  ('00000000-0000-0000-0000-0000000000b3', '00000000-0000-0000-0000-000000000006',   2500.00, 'Rollos de papel para ticket',   'Insumos',       now() - interval '2 days', '[]'),
  ('00000000-0000-0000-0000-0000000000b3', '00000000-0000-0000-0000-000000000008',   6700.00, 'Cigarrillos (reposición)',      'Mercadería',    now() - interval '1 day', '[]');

insert into public.cash_closings (business_id, person_id, closing_date, expected_amount, counted_amount, notes, images) values
  ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-000000000005', current_date - 3, 185000.00, 185000.00, null, '[]'),
  ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-000000000004', current_date - 2, 172500.00, 171800.00, 'Faltante de 700, posible error de vuelto',
    '[{"url": "https://olehvoonmxkgeutoipdf.supabase.co/storage/v1/object/public/attachments/cash-closings/ticketcierre.webp", "detail": "Foto del arqueo de caja"}]'::jsonb),
  ('00000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-000000000006', current_date - 2, 310000.00, 310000.00, null, '[]'),
  ('00000000-0000-0000-0000-0000000000b3', '00000000-0000-0000-0000-000000000007', current_date - 1,  94000.00,  94500.00, 'Sobrante de 500', '[]'),
  ('00000000-0000-0000-0000-0000000000b3', '00000000-0000-0000-0000-000000000006', current_date - 2,  88200.00,  88200.00, null, '[]');

insert into public.notes (business_id, person_id, title, content, note_date, images) values
  ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-000000000001', 'Cambio de proveedor de harina',
   'Empezamos a comprarle a Molino Sur porque el precio por bolsa es 8% menor. Revisar la calidad durante las primeras dos semanas.', current_date - 6, '[]'),
  ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-000000000005', 'Horno con problemas',
   'El horno grande tarda más en llegar a temperatura. Se llamó al técnico, viene el jueves.', current_date - 3, '[]'),
  ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-000000000004', null,
   'Se terminaron las bolsas de papel chicas. Pedir 500 unidades más.', current_date - 2, '[]'),
  ('00000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-000000000002', 'Lista de precios nueva',
   'Llegó la lista de precios del proveedor con aumento del 12% en bulonería. Hay que actualizar el sistema antes del viernes.', current_date - 5,
   '[{"url": "https://olehvoonmxkgeutoipdf.supabase.co/storage/v1/object/public/attachments/notes/note1.webp", "detail": "Foto de la lista nueva"}]'::jsonb),
  ('00000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-000000000006', 'Faltante de stock',
   'No quedan mechas de 8 mm ni discos de corte. Varios clientes preguntaron esta semana.', current_date - 2, '[]'),
  ('00000000-0000-0000-0000-0000000000b2', '00000000-0000-0000-0000-000000000004', null,
   'Cliente frecuente (Sr. Álvarez) pidió presupuesto por materiales para una obra. Lo dejé anotado para que lo vea Bruno.', current_date - 1, '[]'),
  ('00000000-0000-0000-0000-0000000000b3', '00000000-0000-0000-0000-000000000003', 'Horarios de feriado',
   'El lunes que viene abrimos solo de 8 a 14. Avisar a todos los empleados.', current_date - 4, '[]'),
  ('00000000-0000-0000-0000-0000000000b3', '00000000-0000-0000-0000-000000000007', 'Heladera de bebidas',
   'La heladera hace ruido y no enfría parejo. Conviene revisarla antes de que llegue el calor.', current_date - 3, '[]'),
  ('00000000-0000-0000-0000-0000000000b3', '00000000-0000-0000-0000-000000000008', null,
   'Diferencia en la caja de ayer: sobraron $500, posible vuelto mal dado. Ver cierre del día.', current_date - 1, '[]');