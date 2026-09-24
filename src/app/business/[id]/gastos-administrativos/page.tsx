import Link from "next/link";

export default async function GastosAdministrativosPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-6xl">
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
            Volver al negocio
          </Link>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            Gastos Administrativos
          </h1>
        </div>
      </header>

      <main className="flex flex-col items-center justify-center px-6 py-24">
        <div className="text-6xl">🚧</div>
        <h2 className="mt-4 text-xl font-medium text-zinc-900 dark:text-zinc-50">
          En construccion
        </h2>
        <p className="mt-2 text-zinc-500">
          Esta seccion esta siendo desarrollada.
        </p>
      </main>
    </div>
  );
}
