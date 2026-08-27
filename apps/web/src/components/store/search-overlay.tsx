"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@t360/ui";
import { API_URL } from "../../lib/catalog-api";

const RECENT_KEY = "t360.recentSearches";

function loadRecent(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function saveRecent(q: string) {
  const trimmed = q.trim();
  if (!trimmed) return;
  const next = [trimmed, ...loadRecent().filter((x) => x !== trimmed)].slice(0, 8);
  localStorage.setItem(RECENT_KEY, JSON.stringify(next));
}

export function SearchOverlay({
  open,
  onClose,
  searchLabel = "Search",
  recentLabel = "Recent searches",
}: {
  open: boolean;
  onClose: () => void;
  searchLabel?: string;
  recentLabel?: string;
}) {
  const router = useRouter();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [q, setQ] = React.useState("");
  const [recent, setRecent] = React.useState<string[]>([]);
  const [suggestions, setSuggestions] = React.useState<
    Array<{ text: string; type: string; slug?: string }>
  >([]);

  React.useEffect(() => {
    if (!open) return;
    setRecent(loadRecent());
    inputRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  React.useEffect(() => {
    if (!q.trim() || q.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    const handle = window.setTimeout(() => {
      void fetch(`${API_URL}/products/suggest?q=${encodeURIComponent(q.trim())}&limit=8`)
        .then((r) => r.json())
        .then((json) => setSuggestions(Array.isArray(json.data) ? json.data : []))
        .catch(() => setSuggestions([]));
    }, 200);
    return () => window.clearTimeout(handle);
  }, [q]);

  function goSearch(term: string) {
    saveRecent(term);
    onClose();
    router.push(`/search?q=${encodeURIComponent(term)}`);
  }

  function pickSuggestion(s: { text: string; type: string; slug?: string }) {
    if (s.type === "product" && s.slug) {
      onClose();
      router.push(`/products/${s.slug}`);
      return;
    }
    goSearch(s.text);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-modal flex flex-col bg-elevated/98 backdrop-blur-md">
      <div className="mx-auto w-full max-w-2xl px-6 pt-8">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-display text-2xl">{searchLabel}</h2>
          <button
            type="button"
            className="rounded-md px-3 py-2 text-sm text-muted hover:text-ink"
            aria-label="Close search"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        <form
          className="mt-6"
          onSubmit={(e) => {
            e.preventDefault();
            goSearch(q);
          }}
        >
          <Input
            ref={inputRef}
            label={searchLabel}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            autoComplete="off"
          />
        </form>
        {suggestions.length ? (
          <ul className="mt-4 divide-y divide-border border border-border">
            {suggestions.map((s) => (
              <li key={`${s.type}-${s.text}-${s.slug ?? ""}`}>
                <button
                  type="button"
                  className="flex w-full items-center justify-between px-4 py-3 text-left text-sm hover:bg-linen"
                  onClick={() => pickSuggestion(s)}
                >
                  <span>{s.text}</span>
                  <span className="text-xs uppercase text-muted">{s.type}</span>
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        {!q && recent.length ? (
          <div className="mt-8">
            <p className="text-xs uppercase tracking-wider text-muted">{recentLabel}</p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {recent.map((term) => (
                <li key={term}>
                  <button
                    type="button"
                    className="rounded-full border border-border px-3 py-1 text-sm hover:border-wine hover:text-wine"
                    onClick={() => goSearch(term)}
                  >
                    {term}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        <p className="mt-10 text-center text-sm text-muted">
          <Link href="/products" className="text-wine hover:underline" onClick={onClose}>
            Browse all products
          </Link>
        </p>
      </div>
    </div>
  );
}
