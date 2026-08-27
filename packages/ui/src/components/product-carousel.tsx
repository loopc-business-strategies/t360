"use client";

import * as React from "react";
import { cn } from "../lib/cn";

export interface ProductCarouselProps {
  title: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function ProductCarousel({ title, action, children, className }: ProductCarouselProps) {
  const ref = React.useRef<HTMLDivElement>(null);

  return (
    <section className={cn("space-y-6", className)}>
      <div className="flex items-end justify-between gap-4">
        <h2 className="font-display text-2xl text-ink sm:text-3xl">{title}</h2>
        {action}
      </div>
      <div
        ref={ref}
        className="lookbook-scroll flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2"
      >
        {children}
      </div>
    </section>
  );
}

export function ProductCarouselItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("w-[min(72vw,16rem)] shrink-0 snap-start sm:w-64", className)}>
      {children}
    </div>
  );
}
