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
    className: "h-[3.25rem] w-auto aspect-[512/426] sm:h-[3.75rem] md:h-[4.5rem]",
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

function LogoImg({
  config,
  alt,
  className,
  faceClassName,
  fillCoin,
}: {
  config: (typeof VARIANTS)[BrandLogoVariant];
  alt: string;
  className?: string;
  faceClassName?: string;
  fillCoin?: boolean;
}) {
  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={config.src}
      srcSet={config.srcSet}
      alt={alt}
      width={config.width}
      height={config.height}
      decoding="async"
      draggable={false}
      className={cn(fillCoin ? "h-full w-full object-contain" : config.className, faceClassName, className)}
    />
  );
}

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

  if (variant === "icon360" && spin) {
    return (
      <span className={cn("icon360-spin-wrap inline-flex items-center", className)}>
        <span className={cn("icon360-coin relative inline-block shrink-0", config.className)} aria-hidden="true">
          <LogoImg config={config} alt="" fillCoin faceClassName="icon360-face icon360-face-front" />
          <LogoImg config={config} alt="" fillCoin faceClassName="icon360-face icon360-face-back" />
        </span>
        <span className="sr-only">{alt}</span>
      </span>
    );
  }

  return (
    <span className={cn("inline-flex items-center", className)}>
      <LogoImg
        config={config}
        alt={alt}
        className={variant === "icon360" ? "icon360-face-static" : undefined}
      />
    </span>
  );
}
