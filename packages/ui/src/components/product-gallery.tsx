"use client";

import * as React from "react";
import { cn } from "../lib/cn";

export interface ProductGalleryImage {
  src: string;
  alt: string;
  mediaType?: "image" | "video";
}

export function ProductGallery({
  images,
  className,
}: {
  images: ProductGalleryImage[];
  className?: string;
}) {
  const [index, setIndex] = React.useState(0);
  const [videoFailed, setVideoFailed] = React.useState(false);
  const current = images[index] ?? images[0];

  React.useEffect(() => {
    setVideoFailed(false);
  }, [index, current?.src]);

  if (!current) return null;

  const isVideo = current.mediaType === "video" && !videoFailed;
  const fallbackImage =
    images.find((img) => img.mediaType !== "video") ?? images.find((img) => img.src !== current.src);

  return (
    <div className={cn("grid gap-3", className)}>
      <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-linen">
        {isVideo ? (
          <video
            key={current.src}
            src={current.src}
            className="h-full w-full object-cover"
            controls
            muted
            playsInline
            preload="metadata"
            onError={() => setVideoFailed(true)}
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={videoFailed && fallbackImage ? fallbackImage.src : current.src}
            src={videoFailed && fallbackImage ? fallbackImage.src : current.src}
            alt={current.alt}
            className="h-full w-full object-cover animate-fade-in"
          />
        )}
      </div>
      <div className="flex gap-2 overflow-x-auto">
        {images.map((image, i) => (
          <button
            key={`${image.src}-${i}`}
            type="button"
            onClick={() => setIndex(i)}
            className={cn(
              "relative h-16 w-14 shrink-0 overflow-hidden rounded-md border transition-colors",
              i === index ? "border-wine" : "border-border",
            )}
            aria-label={`Show media ${i + 1}`}
          >
            {image.mediaType === "video" ? (
              <span className="absolute inset-0 flex items-center justify-center bg-ink/40 text-[10px] font-medium text-elevated">
                VIDEO
              </span>
            ) : null}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image.mediaType === "video" ? (fallbackImage?.src ?? image.src) : image.src}
              alt=""
              className="h-full w-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
