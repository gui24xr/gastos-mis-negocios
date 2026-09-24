import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function EmpleadosPage({
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

  const { data: members } = await supabase
    .from("membership_details")
    .select("*")
    .eq("business_id", id)
    .order("role", { ascending: true });

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "OWNER": return "Propietario";
      case "MANAGER": return "Gerente";
      case "EMPLOYEE": return "Empleado";
      default: return role;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "activo":
        return { label: "Activo", class: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" };
      case "inactivo":
        return { label: "Inactivo", class: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" };
      case "pendiente":
        return { label: "Pendiente", class: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" };
      case "sin_user":
        return { label: "Sin usuario", class: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400" };
      default:
        return { label: status, class: "bg-zinc-100 text-zinc-600" };
    }
  };

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
              Miembros
            </h1>
          </div>
          <Link
            href={`/business/${id}/empleados/nuevo`}
            className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-700 dark:hover:bg-zinc-600"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Agregar miembro
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        {members && members.length > 0 ? (
          <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
              <thead className="bg-zinc-50 dark:bg-zinc-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Rol
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Usuario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Ult. Login
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-800 dark:bg-zinc-900">
                {members.map((member) => {
                  const status = getStatusBadge(member.user_estado);
                  return (
                    <tr
                      key={member.membership_id}
                      className="hover:bg-zinc-50 dark:hover:bg-zinc-800"
                    >
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-200 font-medium text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
                            {member.full_name?.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) || "??"}
                          </div>
                          <span className="font-medium text-zinc-900 dark:text-zinc-50">
                            {member.full_name || "Sin nombre"}
                          </span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-500">
                        {member.person_email || "-"}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          member.role === "OWNER"
                            ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
                            : member.role === "MANAGER"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                            : "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300"
                        }`}>
                          {getRoleLabel(member.role)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${status.class}`}>
                          {status.label}
                        </span>
                        {member.user_email && (
                          <p className="mt-1 text-xs text-zinc-400">{member.user_email}</p>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-500">
                        {member.last_sign_in_at
                          ? new Date(member.last_sign_in_at).toLocaleDateString("es-AR")
                          : "-"}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <Link
                          href={`/business/${id}/empleados/${member.person_id}/gestionar-user`}
                          className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
                        >
                          Gestionar
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="rounded-full bg-zinc-100 p-4 dark:bg-zinc-800">
              <svg
                className="h-8 w-8 text-zinc-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-medium text-zinc-900 dark:text-zinc-50">
              No hay miembros
            </h3>
            <p className="mt-1 text-sm text-zinc-500">
              Aún no se han agregado miembros a este negocio.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
