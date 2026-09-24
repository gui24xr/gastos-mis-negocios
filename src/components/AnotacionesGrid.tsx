"use client";

import { useState } from "react";
import Link from "next/link";
import PhotosModal from "@/components/PhotosModal";

interface Member {
  full_name: string;
}

interface Nota {
  id: string;
  title: string | null;
  content: string | null;
  note_date: string;
  created_at: string;
  images: { url: string; detail?: string }[] | null;
  people: Member | null;
}

interface AnotacionesGridProps {
  businessId: string;
  notes: Nota[];
}

export default function AnotacionesGrid({ businessId, notes }: AnotacionesGridProps) {
  const [modalImages, setModalImages] = useState<{ url: string; detail?: string }[]>([]);
  const [modalTitle, setModalTitle] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openPhotosModal = (note: Nota) => {
    setModalImages(note.images || []);
    setModalTitle(note.title || note.content?.substring(0, 50) || "Nota");
    setIsModalOpen(true);
  };

  if (notes.length === 0) {
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
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
        </div>
        <h3 className="mt-4 text-lg font-medium text-zinc-900 dark:text-zinc-50">
          No hay anotaciones
        </h3>
        <p className="mt-1 text-sm text-zinc-500">
          Aún no se han registrado anotaciones para este negocio.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {notes.map((note) => {
          const images = note.images || [];
          const hasPhotos = images.length > 0;
          return (
            <div
              key={note.id}
              className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  {note.title && (
                    <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
                      {note.title}
                    </h2>
                  )}
                  <p className={`mt-1 text-zinc-700 dark:text-zinc-300 ${!note.title ? "mt-0" : ""}`}>
                    {note.content}
                  </p>
                </div>
                <span className="shrink-0 text-sm text-zinc-500">
                  {new Date(note.note_date).toLocaleDateString("es-AR")}
                </span>
              </div>
              <div className="mt-4 flex items-center justify-between text-sm text-zinc-500">
                <span>
                  {note.people?.full_name || "Sistema"}
                </span>
                <div className="flex items-center gap-3">
                  {hasPhotos && (
                    <button
                      onClick={() => openPhotosModal(note)}
                      className="inline-flex items-center gap-1 rounded-lg bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {images.length}
                    </button>
                  )}
                  <span>
                    {new Date(note.created_at).toLocaleDateString("es-AR", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
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
