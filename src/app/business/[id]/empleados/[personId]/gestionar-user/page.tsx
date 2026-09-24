"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface MemberDetail {
  membership_id: string;
  business_id: string;
  role: string;
  person_id: string;
  full_name: string;
  person_email: string | null;
  user_id: string | null;
  user_email: string | null;
  confirmed_at: string | null;
  last_sign_in_at: string | null;
  banned_until: string | null;
  user_estado: string;
}

export default function GestionarUserPage({
  params,
}: {
  params: Promise<{ id: string; personId: string }>;
}) {
  const router = useRouter();
  const [businessId, setBusinessId] = useState<string>("");
  const [businessTitle, setBusinessTitle] = useState<string>("");
  const [member, setMember] = useState<MemberDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  useEffect(() => {
    params.then(async ({ id, personId }) => {
      setBusinessId(id);
      await fetchBusiness(id);
      await fetchMemberDetails(id, personId);
    });
  }, [params]);

  async function fetchBusiness(id: string) {
    try {
      const res = await fetch(`/api/businesses/${id}`);
      if (res.ok) {
        const data = await res.json();
        setBusinessTitle(data.title);
      }
    } catch (err) {
      console.error("Error fetching business:", err);
    }
  }

  async function fetchMemberDetails(businessId: string, personId: string) {
    try {
      const res = await fetch(`/api/businesses/${businessId}/members/${personId}`);
      if (res.ok) {
        const data = await res.json();
        setMember(data);
      }
    } catch (err) {
      console.error("Error fetching member:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateUser() {
    if (!member) return;
    setSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch(`/api/people/${member.person_id}/create-user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "Error al crear usuario" });
        return;
      }

      setTempPassword(data.temporaryPassword);
      setMessage({ type: "success", text: "Usuario creado exitosamente" });
      await fetchMemberDetails(businessId, member.person_id);
    } catch (err) {
      setMessage({ type: "error", text: "Error de conexion" });
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleActive() {
    if (!member) return;
    setSubmitting(true);
    setMessage(null);

    const action = member.user_estado === "inactivo" ? "activate" : "deactivate";

    try {
      const res = await fetch(`/api/people/${member.person_id}/${action}-user`, {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage({ type: "error", text: data.error || `Error al ${action} usuario` });
        return;
      }

      setMessage({ type: "success", text: `Usuario ${action === "activate" ? "activado" : "desactivado"} exitosamente` });
      await fetchMemberDetails(businessId, member.person_id);
    } catch (err) {
      setMessage({ type: "error", text: "Error de conexion" });
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="text-zinc-500">Cargando...</div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="text-zinc-500">No se encontro el miembro</div>
      </div>
    );
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "activo": return "Activo";
      case "inactivo": return "Inactivo";
      case "pendiente": return "Pendiente";
      case "sin_user": return "Sin usuario";
      default: return status;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case "activo": return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "inactivo": return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      case "pendiente": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
      case "sin_user": return "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400";
      default: return "bg-zinc-100 text-zinc-600";
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-2xl">
          <Link
            href={`/business/${businessId}/empleados`}
            className="mb-2 inline-flex items-center text-sm text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
          >
            <svg className="mr-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Volver a Miembros
          </Link>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            Gestionar Usuario
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            {member.full_name}
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-8">
        {tempPassword && (
          <div className="mb-6 rounded-lg bg-green-50 p-4 dark:bg-green-900/30">
            <p className="text-sm font-medium text-green-800 dark:text-green-400">
              Password temporario:
            </p>
            <p className="mt-1 font-mono text-lg font-bold text-green-900 dark:text-green-300">
              {tempPassword}
            </p>
            <p className="mt-1 text-xs text-green-600 dark:text-green-500">
              El usuario debera cambiarlo al primer ingreso
            </p>
          </div>
        )}

        {message && (
          <div className={`mb-6 rounded-lg p-4 text-sm ${
            message.type === "success"
              ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400"
              : "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400"
          }`}>
            {message.text}
          </div>
        )}

        <div className="space-y-6">
          <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50 mb-4">
              Datos de la Persona
            </h2>
            <dl className="space-y-3">
              <div className="flex justify-between">
                <dt className="text-sm text-zinc-500">Nombre</dt>
                <dd className="font-medium text-zinc-900 dark:text-zinc-50">{member.full_name}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-zinc-500">Email</dt>
                <dd className="font-medium text-zinc-900 dark:text-zinc-50">{member.person_email || "-"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-zinc-500">Rol</dt>
                <dd className="font-medium text-zinc-900 dark:text-zinc-50">{member.role}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50 mb-4">
              Usuario del Sistema
            </h2>

            {member.user_estado !== "sin_user" ? (
              <dl className="space-y-3">
                <div className="flex justify-between">
                  <dt className="text-sm text-zinc-500">Estado</dt>
                  <dd>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusClass(member.user_estado)}`}>
                      {getStatusLabel(member.user_estado)}
                    </span>
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-zinc-500">Email</dt>
                  <dd className="font-medium text-zinc-900 dark:text-zinc-50">{member.user_email || "-"}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-zinc-500">Ultimo Login</dt>
                  <dd className="font-medium text-zinc-900 dark:text-zinc-50">
                    {member.last_sign_in_at
                      ? new Date(member.last_sign_in_at).toLocaleString("es-AR")
                      : "Nunca"}
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="text-sm text-zinc-500 mb-4">
                Esta persona aun no tiene un usuario del sistema.
              </p>
            )}

            <div className="mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800">
              {member.user_estado === "sin_user" ? (
                <button
                  onClick={handleCreateUser}
                  disabled={submitting}
                  className="w-full rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
                >
                  {submitting ? "Creando..." : "Crear Usuario del Sistema"}
                </button>
              ) : (
                <button
                  onClick={handleToggleActive}
                  disabled={submitting}
                  className={`w-full rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50 ${
                    member.user_estado === "inactivo"
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-red-600 hover:bg-red-700"
                  }`}>
                  {submitting
                    ? "Procesando..."
                    : member.user_estado === "inactivo"
                    ? "Reactivar Usuario"
                    : "Desactivar Usuario"}
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
