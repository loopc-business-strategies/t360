import * as React from "react";
import { Button } from "./button";
import { cn } from "../lib/cn";

export interface PaginationProps {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  previousLabel: string;
  nextLabel: string;
  className?: string;
}

export function Pagination({
  page,
  pageCount,
  onPageChange,
  previousLabel,
  nextLabel,
  className,
}: PaginationProps) {
  return (
    <nav
      className={cn("flex items-center justify-center gap-3", className)}
      aria-label="Pagination"
    >
      <Button
        variant="outline"
        size="sm"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        {previousLabel}
      </Button>
      <span className="text-sm text-muted">
        {page} / {pageCount}
      </span>
      <Button
        variant="outline"
        size="sm"
        disabled={page >= pageCount}
        onClick={() => onPageChange(page + 1)}
      >
        {nextLabel}
      </Button>
    </nav>
  );
}
