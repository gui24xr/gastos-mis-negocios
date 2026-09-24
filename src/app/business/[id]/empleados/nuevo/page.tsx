"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Person {
  id: string;
  full_name: string;
  email: string;
  memberships: {
    business_id: string;
    businesses: {
      title: string;
    };
  }[];
}

export default function NuevoMiembroPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [businessId, setBusinessId] = useState<string>("");
  const [businessTitle, setBusinessTitle] = useState("");
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPerson, setSelectedPerson] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("EMPLOYEE");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function fetchPeople() {
    try {
      const res = await fetch(`/api/people`);
      if (res.ok) {
        const data = await res.json();
        setPeople(data);
      }
    } catch (error) {
      console.error("Error fetching people:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchBusiness(id: string) {
    try {
      const res = await fetch(`/api/businesses/${id}`);
      if (res.ok) {
        const data = await res.json();
        setBusinessTitle(data.title);
      }
    } catch (error) {
      console.error("Error fetching business:", error);
    }
  }

  useEffect(() => {
    params.then(({ id }) => {
      setBusinessId(id);
      fetchPeople();
      fetchBusiness(id);
    });
  }, [params]);

  async function handleAddMember() {
    if (!selectedPerson || !businessId) return;

    setSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch("/api/memberships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          person_id: selectedPerson,
          business_id: businessId,
          role: selectedRole,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "Error al agregar el miembro" });
        return;
      }

      setMessage({ type: "success", text: "Miembro agregado exitosamente" });
      setSelectedPerson("");
      setSelectedRole("EMPLOYEE");
      setTimeout(() => {
        router.push(`/business/${businessId}/empleados`);
      }, 1500);
    } catch (error) {
      setMessage({ type: "error", text: "Error de conexion" });
    } finally {
      setSubmitting(false);
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "OWNER": return "Propietario";
      case "MANAGER": return "Gerente";
      case "EMPLOYEE": return "Empleado";
      default: return role;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="text-zinc-500">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-2xl">
          <Link
            href={`/business/${businessId}/empleados`}
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
            Volver a Miembros
          </Link>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            Agregar Miembro
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Agregar un nuevo miembro a {businessTitle}
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-8">
        <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-4 text-lg font-medium text-zinc-900 dark:text-zinc-50">
            Seleccionar persona
          </h2>

          {message && (
            <div
              className={`mb-4 rounded-lg p-4 text-sm ${
                message.type === "success"
                  ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  : "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400"
              }`}
            >
              {message.text}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Persona
              </label>
              <select
                value={selectedPerson}
                onChange={(e) => {
                  setSelectedPerson(e.target.value);
                  setMessage(null);
                }}
                className="w-full rounded-lg border border-zinc-300 px-4 py-2 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
              >
                <option value="">-- Seleccionar --</option>
                {people.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.full_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Rol
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 px-4 py-2 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
              >
                <option value="EMPLOYEE">Empleado</option>
                <option value="MANAGER">Gerente</option>
                <option value="OWNER">Propietario</option>
              </select>
            </div>

            {selectedPerson && (
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-800">
                {(() => {
                  const person = people.find((p) => p.id === selectedPerson);
                  if (!person) return null;
                  return (
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-200 font-medium text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
                        {getInitials(person.full_name)}
                      </div>
                      <div>
                        <p className="font-medium text-zinc-900 dark:text-zinc-50">
                          {person.full_name}
                        </p>
                        {person.memberships && person.memberships.length > 0 ? (
                          <p className="text-sm text-zinc-500">
                            Ya trabaja en:{" "}
                            {person.memberships.map((m) => m.businesses.title).join(", ")}
                          </p>
                        ) : (
                          <p className="text-sm text-zinc-500">Sin negocios asociados</p>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            <div className="flex items-center gap-4 pt-4">
              <button
                onClick={handleAddMember}
                disabled={!selectedPerson || submitting}
                className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-700 dark:hover:bg-zinc-600"
              >
                {submitting ? "Agregando..." : `Agregar a ${businessTitle}`}
              </button>
              <span className="text-sm text-zinc-500">o</span>
              <Link
                href={`/business/${businessId}/empleados/nuevo/crear`}
                className="text-sm font-medium text-zinc-600 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
              >
                + Crear nueva persona
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
