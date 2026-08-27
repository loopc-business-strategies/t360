"use client";

import * as React from "react";
import { apiFetch, getCustomerToken } from "../lib/api";
import type { ProductReviewsData } from "../lib/catalog-api";
import { fetchProductReviews } from "../lib/catalog-api";
import { Button, Input } from "@t360/ui";

function Stars({ rating }: { rating: number }) {
  return (
    <span aria-label={`${rating} out of 5 stars`}>
      {"★".repeat(rating)}
      {"☆".repeat(5 - rating)}
    </span>
  );
}

export function ProductReviews({ slug }: { slug: string }) {
  const [data, setData] = React.useState<ProductReviewsData | null>(null);
  const [rating, setRating] = React.useState(5);
  const [title, setTitle] = React.useState("");
  const [body, setBody] = React.useState("");
  const [message, setMessage] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    void fetchProductReviews(slug)
      .then((res) => setData(res.data))
      .catch(() => setData(null));
  }, [slug]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!getCustomerToken()) {
      window.location.href = `/account?redirect=/products/${slug}`;
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      await apiFetch(`/products/${slug}/reviews`, {
        method: "POST",
        body: JSON.stringify({ rating, title, body }),
      });
      setMessage("Thank you! Your review is pending moderation.");
      setTitle("");
      setBody("");
      const refreshed = await fetchProductReviews(slug);
      setData(refreshed.data);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Could not submit review");
    } finally {
      setBusy(false);
    }
  }

  const summary = data?.summary;

  return (
    <section className="mt-16 border-t border-border pt-12">
      <h2 className="font-display text-2xl">Reviews</h2>
      {summary?.reviewCount ? (
        <p className="mt-2 text-sm text-muted">
          {summary.averageRating?.toFixed(1)} average · {summary.reviewCount} reviews
        </p>
      ) : (
        <p className="mt-2 text-sm text-muted">No reviews yet — be the first.</p>
      )}

      {data?.items.length ? (
        <ul className="mt-8 space-y-6">
          {data.items.map((r) => (
            <li key={r.id} className="rounded-lg border border-border p-4">
              <div className="flex items-center justify-between gap-4">
                <p className="font-medium">{r.authorName}</p>
                <Stars rating={r.rating} />
              </div>
              {r.title ? <p className="mt-2 font-medium">{r.title}</p> : null}
              <p className="mt-1 text-sm text-muted">{r.body}</p>
            </li>
          ))}
        </ul>
      ) : null}

      <form className="mt-10 max-w-lg space-y-3" onSubmit={(e) => void submit(e)}>
        <h3 className="font-medium">Write a review</h3>
        <label className="block text-sm">
          Rating
          <select
            className="mt-1 w-full rounded-md border border-border px-3 py-2"
            value={rating}
            onChange={(e) => setRating(Number(e.target.value))}
          >
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>
                {n} stars
              </option>
            ))}
          </select>
        </label>
        <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
        <label className="block text-sm">
          Review
          <textarea
            className="mt-1 w-full rounded-md border border-border px-3 py-2"
            rows={4}
            required
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
        </label>
        <Button type="submit" disabled={busy}>
          {busy ? "Submitting…" : "Submit review"}
        </Button>
        {message ? <p className="text-sm text-muted">{message}</p> : null}
      </form>
    </section>
  );
}
