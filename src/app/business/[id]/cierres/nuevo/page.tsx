import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import NuevoCierreForm from "@/components/NuevoCierreForm";

export default async function NuevoCierrePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: person } = await supabase
    .from("people")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!person) {
    redirect("/login");
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("id, title")
    .eq("id", id)
    .single();

  if (!business) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-lg">
          <Link
            href={`/business/${id}/cierres`}
            className="mb-2 inline-flex items-center text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
          >
            <svg
              className="mr-1 h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Volver a Cierres de Caja
          </Link>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            Nuevo Cierre - {business.title}
          </h1>
        </div>
      </header>

      <main className="flex flex-col items-center justify-center px-6 py-8">
        <div className="w-full">
          <NuevoCierreForm businessId={id} personId={person.id} />
        </div>
      </main>
    </div>
  );
}
