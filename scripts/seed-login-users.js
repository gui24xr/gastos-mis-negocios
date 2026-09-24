import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Faltan variables de entorno: NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

const testUsers = [
  { email: "owner1@test.com", fullName: "Owner Uno", role: "OWNER" },
  { email: "owner2@test.com", fullName: "Owner Dos", role: "OWNER" },
  { email: "owner3@test.com", fullName: "Owner Tres", role: "OWNER" },
  { email: "owner4@test.com", fullName: "Owner Cuatro", role: "OWNER" },
  { email: "owner5@test.com", fullName: "Owner Cinco", role: "OWNER" },
  { email: "gerente1@test.com", fullName: "Gerente Uno", role: "MANAGER" },
  { email: "gerente2@test.com", fullName: "Gerente Dos", role: "MANAGER" },
  { email: "gerente3@test.com", fullName: "Gerente Tres", role: "MANAGER" },
  { email: "gerente4@test.com", fullName: "Gerente Cuatro", role: "MANAGER" },
  { email: "gerente5@test.com", fullName: "Gerente Cinco", role: "MANAGER" },
  { email: "empleado1@test.com", fullName: "Empleado Uno", role: "EMPLOYEE" },
  { email: "empleado2@test.com", fullName: "Empleado Dos", role: "EMPLOYEE" },
  { email: "empleado3@test.com", fullName: "Empleado Tres", role: "EMPLOYEE" },
  { email: "empleado4@test.com", fullName: "Empleado Cuatro", role: "EMPLOYEE" },
  { email: "empleado5@test.com", fullName: "Empleado Cinco", role: "EMPLOYEE" },
];

const testPassword = "test123456";

async function seedUsers() {
  console.log("Obteniendo businesses...\n");

  const { data: businesses, error: bizError } = await supabase
    .from("businesses")
    .select("id, title");

  if (bizError || !businesses || businesses.length === 0) {
    console.error("No hay businesses en la base de datos. Ejecuta primero el script de seed completo.");
    process.exit(1);
  }

  console.log(`Encontrados ${businesses.length} negocios:\n`);
  businesses.forEach((b) => console.log(`  - ${b.title} (${b.id})`));
  console.log();

  for (const user of testUsers) {
    console.log(`Procesando: ${user.fullName} (${user.role})`);

    let personId;

    const { data: existingPerson, error: personFindError } = await supabase
      .from("people")
      .select("id, user_id")
      .eq("full_name", user.fullName)
      .single();

    if (existingPerson && existingPerson.user_id) {
      console.log(`  Ya existe con user_id, salteando...\n`);
      continue;
    }

    if (existingPerson) {
      personId = existingPerson.id;
      console.log(`  Persona existente: ${personId}`);
    } else {
      const { data: newPerson, error: personError } = await supabase
        .from("people")
        .insert({ full_name: user.fullName })
        .select("id")
        .single();

      if (personError) {
        console.log(`  Error creando persona: ${personError.message}\n`);
        continue;
      }
      personId = newPerson.id;
      console.log(`  Persona creada: ${personId}`);
    }

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: user.email,
      password: testPassword,
      email_confirm: true,
      user_metadata: { full_name: user.fullName },
    });

    if (authError) {
      console.log(`  Error creando auth user: ${authError.message}\n`);
      continue;
    }

    console.log(`  Auth user creado: ${authData.user.id}`);

    await supabase
      .from("people")
      .update({ user_id: authData.user.id })
      .eq("id", personId);

    for (const business of businesses) {
      const { error: membershipError } = await supabase
        .from("memberships")
        .insert({
          person_id: personId,
          business_id: business.id,
          role: user.role,
        });

      if (membershipError) {
        if (membershipError.code === "23505") {
          console.log(`  Ya es miembro de ${business.title}`);
        } else {
          console.log(`  Error membership ${business.title}: ${membershipError.message}`);
        }
      } else {
        console.log(`  Agregado como ${user.role} a ${business.title}`);
      }
    }

    console.log();
  }

  console.log("=".repeat(50));
  console.log("SEED COMPLETADO!");
  console.log("=".repeat(50));
  console.log("\nUsuarios para testing:");
  console.log("  Owners: owner1@test.com - owner5@test.com");
  console.log("  Gerentes: gerente1@test.com - gerente5@test.com");
  console.log("  Empleados: empleado1@test.com - empleado5@test.com");
  console.log(`\nPassword para todos: ${testPassword}`);
}

seedUsers().catch(console.error);
