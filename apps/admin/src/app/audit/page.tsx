"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, ErrorState, LoadingState } from "@t360/ui";
import { apiFetch } from "../../lib/api";
import { RequirePerm } from "../../components/require-perm";

type AuditRow = {
  id: string;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  createdAt: string;
  actorId?: string | null;
  metadata?: unknown;
};

function AuditPageInner() {
  const query = useQuery({
    queryKey: ["admin-audit"],
    queryFn: () => apiFetch<AuditRow[]>("/audit?take=100"),
  });

  if (query.isLoading) return <LoadingState label="Loading audit…" />;
  if (query.isError) {
    return (
      <ErrorState
        title="Failed"
        description={query.error.message}
        onRetry={() => query.refetch()}
        retryLabel="Retry"
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">Audit logs</h1>
        <p className="text-sm text-muted">Sensitive admin actions</p>
      </div>
      <Card className="overflow-x-auto p-0">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-linen/50 text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-3">When</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Entity</th>
              <th className="px-4 py-3">Actor</th>
            </tr>
          </thead>
          <tbody>
            {(query.data?.data ?? []).map((row) => (
              <tr key={row.id} className="border-b border-border">
                <td className="px-4 py-2 whitespace-nowrap">
                  {new Date(row.createdAt).toLocaleString()}
                </td>
                <td className="px-4 py-2">{row.action}</td>
                <td className="px-4 py-2">
                  {row.entityType ?? "—"}
                  {row.entityId ? ` · ${row.entityId.slice(0, 8)}` : ""}
                </td>
                <td className="px-4 py-2 font-mono text-xs">{row.actorId?.slice(0, 8) ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

export default function AuditPage() {
  return (
    <RequirePerm anyOf={["audit.read"]}>
      <AuditPageInner />
    </RequirePerm>
  );
}
