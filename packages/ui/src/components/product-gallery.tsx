"use client";

import * as React from "react";
import { cn } from "../lib/cn";
import type { RenderImage } from "./product-card";

export interface ProductGalleryImage {
  src: string;
  alt: string;
  mediaType?: "image" | "video";
}

const PLACEHOLDER =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500"><rect fill="#F3EEE6" width="100%" height="100%"/><text x="50%" y="50%" text-anchor="middle" fill="#8A8076" font-family="sans-serif" font-size="14">Image unavailable</text></svg>`,
  );

function dedupeImages(images: ProductGalleryImage[]): ProductGalleryImage[] {
  const seen = new Set<string>();
  const out: ProductGalleryImage[] = [];
  for (const img of images) {
    const key = `${img.mediaType ?? "image"}:${img.src}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(img);
  }
  return out;
}

function DefaultImg({
  src,
  alt,
  className,
  loading,
  onError,
}: {
  src: string;
  alt: string;
  className?: string;
  loading?: "lazy" | "eager";
  onError?: React.ReactEventHandler<HTMLImageElement>;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} loading={loading} className={className} onError={onError} />
  );
}

export function ProductGallery({
  images,
  className,
  renderImage,
  renderThumbImage,
}: {
  images: ProductGalleryImage[];
  className?: string;
  renderImage?: RenderImage;
  renderThumbImage?: RenderImage;
}) {
  const unique = React.useMemo(() => dedupeImages(images), [images]);
  const [index, setIndex] = React.useState(0);
  const [videoFailed, setVideoFailed] = React.useState(false);
  const [mainFailed, setMainFailed] = React.useState(false);
  const current = unique[index] ?? unique[0];
  const MainImg = renderImage ?? DefaultImg;
  const ThumbImg = renderThumbImage ?? renderImage ?? DefaultImg;

  React.useEffect(() => {
    setVideoFailed(false);
    setMainFailed(false);
  }, [index, current?.src]);

  if (!current) return null;

  const isVideo = current.mediaType === "video" && !videoFailed;
  const fallbackImage =
    unique.find((img) => img.mediaType !== "video") ?? unique.find((img) => img.src !== current.src);
  const mainSrc = mainFailed
    ? PLACEHOLDER
    : videoFailed && fallbackImage
      ? fallbackImage.src
      : current.src;

  return (
    <div className={cn("grid gap-3", className)}>
      <div className="relative aspect-[4/5] min-h-[12rem] overflow-hidden rounded-lg bg-linen">
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
          <MainImg
            key={mainSrc}
            src={mainSrc}
            alt={current.alt}
            className="h-full w-full object-cover animate-fade-in"
            onError={() => setMainFailed(true)}
          />
        )}
      </div>
      <div className="flex gap-2 overflow-x-auto">
        {unique.map((image, i) => (
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
              <span className="absolute inset-0 z-[1] flex items-center justify-center bg-ink/40 text-[10px] font-medium text-elevated">
                VIDEO
              </span>
            ) : null}
            <ThumbImg
              src={image.mediaType === "video" ? (fallbackImage?.src ?? image.src) : image.src}
              alt=""
              loading="lazy"
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
