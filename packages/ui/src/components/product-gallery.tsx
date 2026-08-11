"use client";

import * as React from "react";
import { cn } from "../lib/cn";

export interface ProductGalleryImage {
  src: string;
  alt: string;
}

export function ProductGallery({
  images,
  className,
}: {
  images: ProductGalleryImage[];
  className?: string;
}) {
  const [index, setIndex] = React.useState(0);
  const current = images[index] ?? images[0];

  if (!current) return null;

  return (
    <div className={cn("grid gap-3", className)}>
      <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-linen">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={current.src}
          src={current.src}
          alt={current.alt}
          className="h-full w-full object-cover animate-fade-in"
        />
      </div>
      <div className="flex gap-2 overflow-x-auto">
        {images.map((image, i) => (
          <button
            key={image.src}
            type="button"
            onClick={() => setIndex(i)}
            className={cn(
              "h-16 w-14 shrink-0 overflow-hidden rounded-md border transition-colors",
              i === index ? "border-wine" : "border-border",
            )}
            aria-label={`Show image ${i + 1}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image.src} alt="" className="h-full w-full object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}
