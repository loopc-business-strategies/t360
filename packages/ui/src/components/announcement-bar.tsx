import * as React from "react";
import { cn } from "../lib/cn";

export interface AnnouncementBarProps {
  message: string;
  href?: string;
  className?: string;
}

export function AnnouncementBar({ message, href, className }: AnnouncementBarProps) {
  const content = (
    <p className="truncate text-center text-xs tracking-[0.12em] uppercase">{message}</p>
  );
  return (
    <div
      className={cn(
        "z-announcement border-b border-border/60 bg-ink px-4 py-2 text-elevated",
        className,
      )}
    >
      {href ? (
        <a href={href} className="block hover:underline">
          {content}
        </a>
      ) : (
        content
      )}
    </div>
  );
}
