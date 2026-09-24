import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import GastosTable from "@/components/GastosTable";

export default async function GastosPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: business } = await supabase
    .from("businesses")
    .select("id, title")
    .eq("id", id)
    .single();

  if (!business) {
    notFound();
  }

  const { data: expenses } = await supabase
    .from("expenses")
    .select(`
      id,
      amount,
      description,
      category,
      spent_at,
      created_at,
      images,
      people!person_id (full_name)
    `)
    .eq("business_id", id)
    .order("spent_at", { ascending: false });

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div>
            <Link
              href={`/business/${id}`}
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
              Volver a {business.title}
            </Link>
            <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              Gastos
            </h1>
          </div>
          <Link
            href={`/business/${id}/gastos/nuevo`}
            className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-700 dark:hover:bg-zinc-600"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nuevo gasto
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <GastosTable businessId={id} expenses={expenses || []} />
      </main>
    </div>
  );
}
