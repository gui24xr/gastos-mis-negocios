"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";

interface Image {
  url: string;
  detail?: string;
}

interface ImageUploaderProps {
  businessId: string;
  folder: "expenses" | "notes" | "cash-closings";
  images: Image[];
  onImagesChange: (images: Image[]) => void;
}

export default function ImageUploader({ businessId, folder, images, onImagesChange }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const supabase = createClient();

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadError("");

    const newImages: Image[] = [];

    for (const file of Array.from(files)) {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      const filePath = `${folder}/${businessId}/${fileName}`;

      const { data, error: uploadError } = await supabase.storage
        .from("attachments")
        .upload(filePath, file);

      if (uploadError || !data) {
        console.error("Upload error:", uploadError);
        setUploadError(`Error al subir: ${uploadError?.message}`);
        setUploading(false);
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from("attachments")
        .getPublicUrl(filePath);

      newImages.push({ url: publicUrl });
    }

    onImagesChange([...images, ...newImages]);
    setUploading(false);
    e.target.value = "";
  }

  function removeImage(index: number) {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  }

  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
        Imagenes (opcional)
      </label>
      <div className="space-y-3">
        {uploadError && (
          <div className="rounded-lg bg-red-50 p-2 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-400">
            {uploadError}
          </div>
        )}
        {images.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {images.map((image, index) => (
              <div key={index} className="relative group">
                <img
                  src={image.url}
                  alt={`Imagen ${index + 1}`}
                  className="h-20 w-20 rounded-lg object-cover border border-zinc-300 dark:border-zinc-700"
                />
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="absolute -top-2 -right-2 rounded-full bg-red-500 p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
        <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-zinc-300 px-4 py-3 text-sm text-zinc-500 hover:border-zinc-400 hover:text-zinc-600 dark:border-zinc-700 dark:hover:border-zinc-600 dark:hover:text-zinc-400">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {uploading ? "Subiendo..." : "Agregar imagenes"}
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            disabled={uploading}
            className="hidden"
          />
        </label>
      </div>
    </div>
  );
}
