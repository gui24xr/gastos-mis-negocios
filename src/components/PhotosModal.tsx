"use client";

import { useEffect, useRef, useState } from "react";

interface Image {
  url: string;
  detail?: string;
}

interface PhotosModalProps {
  images: Image[];
  title: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function PhotosModal({ images, title, isOpen, onClose }: PhotosModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const isOpenRef = useRef(isOpen);

  useEffect(() => {
    if (isOpen && !isOpenRef.current) {
      setCurrentIndex(0);
    }
    isOpenRef.current = isOpen;
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/80" onClick={onClose} />
      <div className="relative z-10 max-w-4xl w-full mx-4">
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-white hover:text-zinc-300 transition-colors"
        >
          <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div className="bg-white dark:bg-zinc-900 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">{title}</h2>
            <p className="text-sm text-zinc-500">{images.length} foto{images.length !== 1 ? "s" : ""}</p>
          </div>
          <div className="relative">
            {images.length > 1 && (
              <button
                onClick={() => setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1))}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors cursor-pointer"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <div className="p-4">
              <img
                src={images[currentIndex].url}
                alt={images[currentIndex].detail || `Foto ${currentIndex + 1}`}
                className={`max-h-[70vh] mx-auto object-contain rounded-lg ${images.length > 1 ? "cursor-pointer" : ""}`}
              />
              {images[currentIndex].detail && (
                <p className="mt-3 text-center text-sm text-zinc-600 dark:text-zinc-400">
                  {images[currentIndex].detail}
                </p>
              )}
            </div>
            {images.length > 1 && (
              <button
                onClick={() => setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1))}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors cursor-pointer"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex justify-center gap-2 p-4 border-t border-zinc-200 dark:border-zinc-800">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-2 h-2 rounded-full transition-colors cursor-pointer ${
                    index === currentIndex ? "bg-zinc-900 dark:bg-zinc-50" : "bg-zinc-300 dark:bg-zinc-600"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
