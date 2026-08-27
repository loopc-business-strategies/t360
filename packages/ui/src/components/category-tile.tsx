import * as React from "react";
import { cn } from "../lib/cn";

export interface CategoryTileProps {
  name: string;
  href: string;
  imageUrl?: string;
  className?: string;
}

export function CategoryTile({ name, href, imageUrl, className }: CategoryTileProps) {
  return (
    <a
      href={href}
      className={cn(
        "group relative block aspect-[4/5] overflow-hidden rounded-lg border border-border bg-linen",
        className,
      )}
    >
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-linen to-border/40" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/20 to-transparent" />
      <p className="absolute bottom-0 left-0 right-0 p-4 font-display text-lg text-elevated">{name}</p>
    </a>
  );
}
