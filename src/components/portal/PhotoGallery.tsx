"use client";

import { useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface Photo {
  id: string;
  url: string;
  thumbnailUrl: string | null;
  date: string;
  category: string | null;
  phase: string | null;
  caption: string | null;
}

interface PhotoGalleryProps {
  photos: {
    before: Photo[];
    during: Photo[];
    after: Photo[];
  };
}

const tabLabels: Record<string, string> = {
  before: "시공 전",
  during: "시공 중",
  after: "시공 후",
};

export function PhotoGallery({ photos }: PhotoGalleryProps) {
  const [activeTab, setActiveTab] = useState<"before" | "during" | "after">("during");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const currentPhotos = photos[activeTab];
  const totalCount = photos.before.length + photos.during.length + photos.after.length;

  if (totalCount === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        등록된 사진이 없습니다.
      </div>
    );
  }

  const openLightbox = (index: number) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);

  const goNext = () => {
    if (lightboxIndex !== null && lightboxIndex < currentPhotos.length - 1) {
      setLightboxIndex(lightboxIndex + 1);
    }
  };

  const goPrev = () => {
    if (lightboxIndex !== null && lightboxIndex > 0) {
      setLightboxIndex(lightboxIndex - 1);
    }
  };

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-gray-100 rounded-lg p-1">
        {(["before", "during", "after"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
              activeTab === tab
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tabLabels[tab]}
            <span className="ml-1 text-xs text-gray-400">({photos[tab].length})</span>
          </button>
        ))}
      </div>

      {/* Photo grid */}
      {currentPhotos.length === 0 ? (
        <div className="text-center py-6 text-gray-400 text-sm">
          이 단계의 사진이 없습니다.
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {currentPhotos.map((photo, index) => (
            <button
              key={photo.id}
              onClick={() => openLightbox(index)}
              className="aspect-square rounded-lg overflow-hidden bg-gray-100 hover:opacity-90 transition-opacity"
            >
              <img
                src={photo.thumbnailUrl || photo.url}
                alt={photo.caption || "시공 사진"}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightboxIndex !== null && currentPhotos[lightboxIndex] && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={closeLightbox}
        >
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 text-white/80 hover:text-white z-10"
          >
            <X className="w-8 h-8" />
          </button>

          {lightboxIndex > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); goPrev(); }}
              className="absolute left-4 text-white/80 hover:text-white z-10"
            >
              <ChevronLeft className="w-10 h-10" />
            </button>
          )}

          {lightboxIndex < currentPhotos.length - 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); goNext(); }}
              className="absolute right-4 text-white/80 hover:text-white z-10"
            >
              <ChevronRight className="w-10 h-10" />
            </button>
          )}

          <div className="max-w-4xl max-h-[85vh] px-4" onClick={(e) => e.stopPropagation()}>
            <img
              src={currentPhotos[lightboxIndex].url}
              alt={currentPhotos[lightboxIndex].caption || "시공 사진"}
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
            />
            {currentPhotos[lightboxIndex].caption && (
              <p className="text-white text-center mt-3 text-sm">
                {currentPhotos[lightboxIndex].caption}
              </p>
            )}
            <p className="text-white/60 text-center mt-1 text-xs">
              {currentPhotos[lightboxIndex].date}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
