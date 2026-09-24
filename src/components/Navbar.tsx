import { createClient } from "@/utils/supabase/server";
import Link from "next/link";

export default async function Navbar() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: person } = await supabase
    .from("people")
    .select("full_name")
    .eq("user_id", user.id)
    .single();

  return (
    <nav className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <Link href="/" className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          Gastos Mi Negocio
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-sm text-zinc-500">
            {person?.full_name || user.email}
          </span>
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800 cursor-pointer"
            >
              Cerrar sesion
            </button>
          </form>
        </div>
      </div>
    </nav>
  );
}
