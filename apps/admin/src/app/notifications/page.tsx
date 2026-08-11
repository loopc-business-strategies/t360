"use client";

import { useQuery } from "@tanstack/react-query";
import { ErrorState, LoadingState, Table, TBody, TD, TH, THead, TR } from "@t360/ui";
import { apiFetch } from "../../lib/api";

type Template = {
  id: string;
  code: string;
  channel: string;
  locale: string;
  subject: string | null;
  body: string;
};

type NotificationRow = {
  id: string;
  channel: string;
  templateCode: string;
  to: string;
  status: string;
  createdAt: string;
};

export default function AdminNotificationsPage() {
  const templates = useQuery({
    queryKey: ["admin-notification-templates"],
    queryFn: () => apiFetch<Template[]>("/admin/notification-templates"),
  });
  const sends = useQuery({
    queryKey: ["admin-notifications"],
    queryFn: () => apiFetch<NotificationRow[]>("/admin/notifications"),
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl">Notifications</h1>
        <p className="text-sm text-muted">Templates and recent outbound sends</p>
      </div>

      <section className="space-y-3">
        <h2 className="font-display text-xl">Templates</h2>
        {templates.isLoading ? <LoadingState label="Loading templates…" /> : null}
        {templates.isError ? (
          <ErrorState
            title="Templates failed"
            description={templates.error.message}
            retryLabel="Retry"
            onRetry={() => templates.refetch()}
          />
        ) : null}
        {templates.data && templates.data.data.length > 0 ? (
          <Table>
            <THead>
              <TR>
                <TH>Code</TH>
                <TH>Channel</TH>
                <TH>Locale</TH>
                <TH>Subject</TH>
              </TR>
            </THead>
            <TBody>
              {templates.data.data.map((t) => (
                <TR key={t.id}>
                  <TD>{t.code}</TD>
                  <TD>{t.channel}</TD>
                  <TD>{t.locale}</TD>
                  <TD>{t.subject ?? "—"}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        ) : null}
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl">Recent sends</h2>
        {sends.isLoading ? <LoadingState label="Loading sends…" /> : null}
        {sends.isError ? (
          <ErrorState
            title="Sends failed"
            description={sends.error.message}
            retryLabel="Retry"
            onRetry={() => sends.refetch()}
          />
        ) : null}
        {sends.data && sends.data.data.length > 0 ? (
          <Table>
            <THead>
              <TR>
                <TH>Template</TH>
                <TH>Channel</TH>
                <TH>To</TH>
                <TH>Status</TH>
                <TH>When</TH>
              </TR>
            </THead>
            <TBody>
              {sends.data.data.map((n) => (
                <TR key={n.id}>
                  <TD>{n.templateCode}</TD>
                  <TD>{n.channel}</TD>
                  <TD>{n.to}</TD>
                  <TD>{n.status}</TD>
                  <TD>{new Date(n.createdAt).toLocaleString()}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        ) : null}
      </section>
    </div>
  );
}
