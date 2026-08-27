"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  LoadingState,
  Select,
  Table,
  TBody,
  TD,
  TH,
  THead,
  TR,
} from "@t360/ui";
import { apiFetch } from "../../lib/api";

type Review = {
  id: string;
  rating: number;
  title: string;
  body: string;
  status: string;
  createdAt: string;
  product: { id: string; name: string; slug: string };
  customer: { id: string; name: string | null };
};

type ReviewList = {
  items: Review[];
  meta: { page: number; pageSize: number; total: number };
};

export default function ReviewsPage() {
  const qc = useQueryClient();
  const [status, setStatus] = React.useState("pending");
  const query = useQuery({
    queryKey: ["admin-reviews", status],
    queryFn: () =>
      apiFetch<ReviewList>(`/admin/reviews?status=${encodeURIComponent(status)}&pageSize=50`),
  });

  const moderate = useMutation({
    mutationFn: ({ id, next }: { id: string; next: "approved" | "rejected" }) =>
      apiFetch(`/admin/reviews/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: next }),
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["admin-reviews"] });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-display text-3xl">Reviews</h1>
        <Select
          label="Status"
          value={status}
          onValueChange={setStatus}
          options={[
            { value: "pending", label: "Pending" },
            { value: "approved", label: "Approved" },
            { value: "rejected", label: "Rejected" },
            { value: "", label: "All" },
          ]}
        />
      </div>

      {query.isLoading ? <LoadingState label="Loading…" /> : null}
      {query.isError ? <ErrorState title="Failed" description={query.error.message} /> : null}
      {query.data?.data.items.length === 0 ? <EmptyState title="No reviews" /> : null}

      {query.data && query.data.data.items.length > 0 ? (
        <Table>
          <THead>
            <TR>
              <TH>Product</TH>
              <TH>Customer</TH>
              <TH>Rating</TH>
              <TH>Review</TH>
              <TH>Status</TH>
              <TH />
            </TR>
          </THead>
          <TBody>
            {query.data.data.items.map((r) => (
              <TR key={r.id}>
                <TD>{r.product.name}</TD>
                <TD>{r.customer.name ?? "Customer"}</TD>
                <TD>{r.rating}★</TD>
                <TD>
                  <p className="font-medium">{r.title}</p>
                  <p className="text-sm text-muted">{r.body}</p>
                </TD>
                <TD>{r.status}</TD>
                <TD>
                  {r.status === "pending" ? (
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        disabled={moderate.isPending}
                        onClick={() => moderate.mutate({ id: r.id, next: "approved" })}
                      >
                        Approve
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={moderate.isPending}
                        onClick={() => moderate.mutate({ id: r.id, next: "rejected" })}
                      >
                        Reject
                      </Button>
                    </div>
                  ) : null}
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      ) : null}

      {query.data?.data.meta ? (
        <Card>
          <p className="text-sm text-muted">
            {query.data.data.meta.total} total reviews
          </p>
        </Card>
      ) : null}
    </div>
  );
}
