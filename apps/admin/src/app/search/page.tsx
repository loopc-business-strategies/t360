"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge, Button, ErrorState, Input, LoadingState, Table, TBody, TD, TH, THead, TR } from "@t360/ui";
import { apiFetch } from "../../lib/api";

type Synonym = {
  id: string;
  term: string;
  aliases: string[];
  locale: string;
  active: boolean;
};

export default function SearchAdminPage() {
  const qc = useQueryClient();
  const [term, setTerm] = React.useState("");
  const [aliases, setAliases] = React.useState("");

  const query = useQuery({
    queryKey: ["admin-search-synonyms"],
    queryFn: () => apiFetch<Synonym[]>("/admin/search/synonyms"),
  });

  const create = useMutation({
    mutationFn: () =>
      apiFetch("/admin/search/synonyms", {
        method: "POST",
        body: JSON.stringify({
          term,
          aliases: aliases
            .split(",")
            .map((a) => a.trim())
            .filter(Boolean),
          locale: "en",
          active: true,
        }),
      }),
    onSuccess: () => {
      setTerm("");
      setAliases("");
      qc.invalidateQueries({ queryKey: ["admin-search-synonyms"] });
    },
  });

  const toggle = useMutation({
    mutationFn: (s: Synonym) =>
      apiFetch(`/admin/search/synonyms/${s.id}`, {
        method: "PATCH",
        body: JSON.stringify({ active: !s.active }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-search-synonyms"] }),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">Search</h1>
        <p className="text-sm text-muted">
          Search engine: Postgres FTS + trigram (OpenSearch deferred — not justified at current scale)
        </p>
      </div>

      <div className="grid max-w-xl gap-3 sm:grid-cols-2">
        <Input label="Term" value={term} onChange={(e) => setTerm(e.target.value)} />
        <Input
          label="Aliases (comma-separated)"
          value={aliases}
          onChange={(e) => setAliases(e.target.value)}
        />
        <Button
          className="sm:col-span-2"
          onClick={() => create.mutate()}
          disabled={!term || !aliases || create.isPending}
        >
          Add synonym
        </Button>
        {create.isError ? <p className="text-sm text-wine sm:col-span-2">{create.error.message}</p> : null}
      </div>

      {query.isLoading ? <LoadingState label="Loading synonyms…" /> : null}
      {query.isError ? (
        <ErrorState
          title="Could not load synonyms"
          description={query.error.message}
          retryLabel="Retry"
          onRetry={() => query.refetch()}
        />
      ) : null}

      {query.data && query.data.data.length > 0 ? (
        <Table>
          <THead>
            <TR>
              <TH>Term</TH>
              <TH>Aliases</TH>
              <TH>Locale</TH>
              <TH>Status</TH>
              <TH />
            </TR>
          </THead>
          <TBody>
            {query.data.data.map((s) => (
              <TR key={s.id}>
                <TD className="font-medium">{s.term}</TD>
                <TD className="text-xs">{(Array.isArray(s.aliases) ? s.aliases : []).join(", ")}</TD>
                <TD>{s.locale}</TD>
                <TD>
                  <Badge tone={s.active ? "success" : "neutral"}>{s.active ? "active" : "off"}</Badge>
                </TD>
                <TD>
                  <Button variant="outline" type="button" onClick={() => toggle.mutate(s)}>
                    Toggle
                  </Button>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      ) : null}
    </div>
  );
}
