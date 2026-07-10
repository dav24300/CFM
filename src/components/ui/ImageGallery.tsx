"use client";

import Image from "next/image";
import { useCallback, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "./primitives/dialog";
import { Button } from "./primitives/button";
import { EmptyState } from "./patterns/empty-state";

type GalleryImage = {
  src: string;
  alt: string;
  caption?: string;
};

type Props = {
  images: readonly GalleryImage[];
  columns?: 2 | 3;
  viewerLabel?: string;
  closeLabel?: string;
  prevLabel?: string;
  nextLabel?: string;
};

export function ImageGallery({
  images,
  columns = 3,
  viewerLabel = "Visionneuse photo",
  closeLabel = "Fermer",
  prevLabel = "Photo précédente",
  nextLabel = "Photo suivante",
}: Props) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  const goPrev = useCallback(() => {
    setIndex((i) => (i > 0 ? i - 1 : images.length - 1));
  }, [images.length]);

  const goNext = useCallback(() => {
    setIndex((i) => (i < images.length - 1 ? i + 1 : 0));
  }, [images.length]);

  const gridClass =
    columns === 2
      ? "grid gap-4 sm:grid-cols-2"
      : "grid gap-4 sm:grid-cols-2 lg:grid-cols-3";

  if (images.length === 0) {
    return (
      <EmptyState
        variant="card"
        title="Aucune image"
        description="La galerie sera bientôt disponible."
      />
    );
  }

  const current = images[index];

  return (
    <>
      <div className={gridClass}>
        {images.map((img, i) => (
          <button
            key={`${img.src}-${i}`}
            type="button"
            className="image-zoom-hover media-frame group relative aspect-[4/3] w-full cursor-pointer text-left"
            onClick={() => {
              setIndex(i);
              setOpen(true);
            }}
            aria-label={`Agrandir : ${img.alt}`}
          >
            <Image
              src={img.src}
              alt={img.alt}
              fill
              className="zoom-target object-cover"
              sizes="(max-width:768px) 100vw, 33vw"
            />
            <span className="absolute inset-0 bg-site-deep/0 transition group-hover:bg-site-deep/20" aria-hidden />
          </button>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          showClose
          closeLabel={closeLabel}
          aria-describedby={undefined}
          onKeyDown={(e) => {
            if (e.key === "ArrowLeft") goPrev();
            if (e.key === "ArrowRight") goNext();
          }}
        >
          <DialogTitle className="sr-only">{viewerLabel}</DialogTitle>
          <DialogDescription className="sr-only">
            {current.caption || current.alt}
          </DialogDescription>
          <div className="relative max-h-[85vh] w-full">
            <div className="relative aspect-video w-full">
              <Image
                src={current.src}
                alt={current.alt}
                fill
                className="object-contain"
                sizes="90vw"
                priority
              />
            </div>
            {(current.caption || current.alt) && (
              <p className="mt-4 text-center text-sm text-gray-300">
                {current.caption || current.alt}
              </p>
            )}
            {images.length > 1 && (
              <div className="mt-4 flex justify-center gap-2">
                <Button
                  type="button"
                  variant="outlineLight"
                  size="sm"
                  onClick={goPrev}
                  aria-label={prevLabel}
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden />
                </Button>
                <Button
                  type="button"
                  variant="outlineLight"
                  size="sm"
                  onClick={goNext}
                  aria-label={nextLabel}
                >
                  <ChevronRight className="h-4 w-4" aria-hidden />
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export { ImageGallery as Lightbox };
