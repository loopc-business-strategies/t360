"use client";

import * as React from "react";
import { cn } from "@t360/ui";

type BrandLogoVariant = "icon360" | "hero" | "footer";

type BrandLogoProps = {
  variant: BrandLogoVariant;
  alt: string;
  className?: string;
};

const VARIANTS: Record<
  BrandLogoVariant,
  {
    src: string;
    srcSet: string;
    className: string;
    width: number;
    height: number;
    spin?: boolean;
  }
> = {
  icon360: {
    src: "/logo-mark.png",
    srcSet: "/logo-mark.png 1x, /logo-mark@2x.png 2x",
    className: "h-[3.25rem] w-auto sm:h-[3.75rem] md:h-[4.5rem]",
    width: 180,
    height: 72,
    spin: true,
  },
  hero: {
    src: "/logo-full-transparent.png",
    srcSet: "/logo-full-transparent.png 1x, /logo-full-transparent@2x.png 2x",
    className:
      "h-32 w-auto max-w-[min(100%,22rem)] drop-shadow-[0_10px_28px_rgba(0,0,0,0.45)] sm:h-40 sm:max-w-[26rem] md:h-48 md:max-w-[28rem] lg:h-52",
    width: 448,
    height: 208,
  },
  footer: {
    src: "/logo-full-transparent.png",
    srcSet: "/logo-full-transparent.png 1x, /logo-full-transparent@2x.png 2x",
    className: "h-16 w-auto sm:h-20",
    width: 256,
    height: 80,
  },
};

export function BrandLogo({ variant, alt, className }: BrandLogoProps) {
  const config = VARIANTS[variant];
  const [reduceMotion, setReduceMotion] = React.useState(false);

  React.useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  const spin = config.spin === true && !reduceMotion;

  return (
    <span
      className={cn(
        "inline-flex items-center",
        spin && "icon360-spin-wrap",
        className,
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={config.src}
        srcSet={config.srcSet}
        alt={alt}
        width={config.width}
        height={config.height}
        decoding="async"
        className={cn(
          config.className,
          spin && "icon360-spin drop-shadow-[0_4px_14px_rgba(184,149,42,0.35)]",
        )}
      />
    </span>
  );
}
