"use client";

import { useState } from "react";
import Link from "next/link";
import PhotosModal from "@/components/PhotosModal";

interface Member {
  full_name: string;
}

interface Expense {
  id: string;
  amount: number;
  description: string;
  category: string | null;
  spent_at: string;
  created_at: string;
  images: { url: string; detail?: string }[] | null;
  people: Member[] | null;
}

interface GastosTableProps {
  businessId: string;
  expenses: Expense[];
}

export default function GastosTable({ businessId, expenses }: GastosTableProps) {
  const [modalImages, setModalImages] = useState<{ url: string; detail?: string }[]>([]);
  const [modalTitle, setModalTitle] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
    }).format(amount);
  };

  const openPhotosModal = (expense: Expense) => {
    setModalImages(expense.images || []);
    setModalTitle(expense.description);
    setIsModalOpen(true);
  };

  if (expenses.length === 0) {
    return (
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
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h3 className="mt-4 text-lg font-medium text-zinc-900 dark:text-zinc-50">
          No hay gastos
        </h3>
        <p className="mt-1 text-sm text-zinc-500">
          Aún no se han registrado gastos para este negocio.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800">
          <thead className="bg-zinc-50 dark:bg-zinc-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Fecha
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Descripción
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Categoría
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Monto
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Miembro
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                Fotos
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-800 dark:bg-zinc-900">
            {expenses.map((expense) => {
              const images = expense.images || [];
              const hasPhotos = images.length > 0;
              return (
                <tr
                  key={expense.id}
                  className="hover:bg-zinc-50 dark:hover:bg-zinc-800"
                >
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-900 dark:text-zinc-50">
                    {new Date(expense.spent_at).toLocaleDateString("es-AR")}
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-900 dark:text-zinc-50">
                    {expense.description}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-500">
                    {expense.category || "-"}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-zinc-900 dark:text-zinc-50">
                    {formatCurrency(expense.amount)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-zinc-500">
                    {expense.people?.[0]?.full_name || "N/A"}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    {hasPhotos ? (
                      <button
                        onClick={() => openPhotosModal(expense)}
                        className="inline-flex items-center gap-1 rounded-lg bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {images.length}
                      </button>
                    ) : (
                      <span className="text-xs text-zinc-400">-</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <PhotosModal
        images={modalImages}
        title={modalTitle}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
