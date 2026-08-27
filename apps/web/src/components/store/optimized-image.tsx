"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@t360/ui";

export type OptimizedImageProps = {
  src: string;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  /** When true (default), uses fill inside a positioned parent. */
  fill?: boolean;
  width?: number;
  height?: number;
  loading?: "lazy" | "eager";
  onError?: React.ReactEventHandler<HTMLImageElement>;
};

const PLACEHOLDER =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500"><rect fill="#F3EEE6" width="100%" height="100%"/></svg>`,
  );

/** Storefront stills via next/image; falls back to unoptimized for data: URLs. */
export function OptimizedImage({
  src,
  alt,
  className,
  sizes = "(max-width: 640px) 50vw, 25vw",
  priority,
  fill = true,
  width = 800,
  height = 1000,
  loading,
  onError,
}: OptimizedImageProps) {
  const [failed, setFailed] = React.useState(false);
  const resolved = failed || !src || src.startsWith("data:") ? PLACEHOLDER : src;
  const unoptimized = resolved.startsWith("data:");

  if (fill) {
    return (
      <Image
        src={resolved}
        alt={alt}
        className={cn(className)}
        sizes={sizes}
        priority={priority}
        fill
        loading={priority ? undefined : loading ?? "lazy"}
        unoptimized={unoptimized}
        onError={(e) => {
          setFailed(true);
          onError?.(e);
        }}
      />
    );
  }

  return (
    <Image
      src={resolved}
      alt={alt}
      className={cn(className)}
      sizes={sizes}
      priority={priority}
      width={width}
      height={height}
      loading={priority ? undefined : loading ?? "lazy"}
      unoptimized={unoptimized}
      onError={(e) => {
        setFailed(true);
        onError?.(e);
      }}
    />
  );
}

export function renderCardImage(props: {
  src: string;
  alt: string;
  className?: string;
  loading?: "lazy" | "eager";
  onError?: React.ReactEventHandler<HTMLImageElement>;
}) {
  return (
    <OptimizedImage
      src={props.src}
      alt={props.alt}
      className={cn("object-cover", props.className)}
      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
      loading={props.loading}
      onError={props.onError}
    />
  );
}

export function renderGalleryMainImage(props: {
  src: string;
  alt: string;
  className?: string;
  loading?: "lazy" | "eager";
  onError?: React.ReactEventHandler<HTMLImageElement>;
}) {
  return (
    <OptimizedImage
      src={props.src}
      alt={props.alt}
      className={cn("object-cover", props.className)}
      sizes="(max-width: 768px) 100vw, 50vw"
      loading={props.loading}
      onError={props.onError}
    />
  );
}

export function renderGalleryThumbImage(props: {
  src: string;
  alt: string;
  className?: string;
  loading?: "lazy" | "eager";
  onError?: React.ReactEventHandler<HTMLImageElement>;
}) {
  return (
    <OptimizedImage
      src={props.src}
      alt={props.alt}
      className={cn("object-cover", props.className)}
      sizes="56px"
      loading={props.loading ?? "lazy"}
      onError={props.onError}
    />
  );
}

export function renderTileImage(props: {
  src: string;
  alt: string;
  className?: string;
  loading?: "lazy" | "eager";
  onError?: React.ReactEventHandler<HTMLImageElement>;
}) {
  return (
    <OptimizedImage
      src={props.src}
      alt={props.alt}
      className={cn("object-cover", props.className)}
      sizes="(max-width: 640px) 50vw, 20vw"
      loading={props.loading}
      onError={props.onError}
    />
  );
}
