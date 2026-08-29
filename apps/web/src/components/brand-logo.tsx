"use client";

import * as React from "react";
import { cn } from "@t360/ui";

type BrandLogoVariant = "icon360" | "header" | "hero" | "footer";

type BrandLogoProps = {
  variant: BrandLogoVariant;
  alt: string;
  className?: string;
  /** Enable 3D spin animation for icon360 (splash/loading only — header stays static). */
  spin?: boolean;
};

const VARIANTS: Record<
  BrandLogoVariant,
  {
    src: string;
    srcSet: string;
    sizes?: string;
    className: string;
    width: number;
    height: number;
  }
> = {
  icon360: {
    src: "/logo-mark.png",
    srcSet: "/logo-mark.png 1x, /logo-mark@2x.png 2x",
    sizes: "(min-width: 768px) 88px, 64px",
    className: "h-14 w-auto aspect-square sm:h-16 md:h-[4.5rem]",
    width: 72,
    height: 72,
  },
  header: {
    src: "/logo-full.png",
    srcSet: "/logo-full.png 1x, /logo-full@2x.png 2x",
    sizes: "(min-width: 768px) 200px, 140px",
    className:
      "h-11 w-auto aspect-[1024/682] drop-shadow-[0_2px_8px_rgba(0,0,0,0.25)] sm:h-12 md:h-14",
    width: 200,
    height: 133,
  },
  hero: {
    src: "/logo-full.png",
    srcSet: "/logo-full.png 1x, /logo-full@2x.png 2x",
    className:
      "h-auto w-full max-w-[min(100%,22rem)] aspect-[1024/682] drop-shadow-[0_10px_28px_rgba(0,0,0,0.45)] sm:max-w-[26rem] md:max-w-[28rem] lg:max-w-[32rem]",
    width: 1024,
    height: 682,
  },
  footer: {
    src: "/logo-full.png",
    srcSet: "/logo-full.png 1x, /logo-full@2x.png 2x",
    className:
      "h-auto w-40 aspect-[1024/682] drop-shadow-[0_4px_14px_rgba(0,0,0,0.55)] sm:w-48",
    width: 256,
    height: 170,
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
      sizes={config.sizes}
      alt={alt}
      width={config.width}
      height={config.height}
      decoding="async"
      draggable={false}
      className={cn(fillCoin ? "h-full w-full object-contain" : config.className, faceClassName, className)}
    />
  );
}

export function BrandLogo({ variant, alt, className, spin: spinProp = false }: BrandLogoProps) {
  const config = VARIANTS[variant];
  const [reduceMotion, setReduceMotion] = React.useState(false);

  React.useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  const spin = variant === "icon360" && spinProp === true && !reduceMotion;

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
