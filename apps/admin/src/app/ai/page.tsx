"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, ErrorState, Input, LoadingState } from "@t360/ui";
import { apiFetch } from "../../lib/api";

type Conversation = { id: string; title: string | null; updatedAt: string };

export default function AdminAiPage() {
  const qc = useQueryClient();
  const [conversationId, setConversationId] = React.useState<string | null>(null);
  const [input, setInput] = React.useState("");
  const [thread, setThread] = React.useState<Array<{ role: string; content: string }>>([]);

  const list = useQuery({
    queryKey: ["admin-ai-conversations"],
    queryFn: () => apiFetch<Conversation[]>("/admin/ai/conversations"),
  });

  const chat = useMutation({
    mutationFn: (message: string) =>
      apiFetch<{ conversationId: string; reply: string }>("/admin/ai/chat", {
        method: "POST",
        body: JSON.stringify({ conversationId, message }),
      }),
    onSuccess: (res, message) => {
      setConversationId(res.data.conversationId);
      setThread((prev) => [...prev, { role: "user", content: message }, { role: "assistant", content: res.data.reply }]);
      qc.invalidateQueries({ queryKey: ["admin-ai-conversations"] });
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl">Tharagai AI</h1>
        <p className="text-sm text-muted">Admin assistant — sales, best sellers, low stock, product captions</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <aside className="space-y-2">
          <p className="text-xs uppercase tracking-wide text-muted">Conversations</p>
          {list.isLoading ? <LoadingState label="…" /> : null}
          {list.isError ? (
            <ErrorState title="Failed" description={list.error.message} onRetry={() => list.refetch()} retryLabel="Retry" />
          ) : null}
          {(list.data?.data ?? []).map((c) => (
            <button
              key={c.id}
              type="button"
              className={`block w-full truncate border border-border px-2 py-1.5 text-left text-sm ${
                conversationId === c.id ? "bg-linen" : ""
              }`}
              onClick={() => {
                setConversationId(c.id);
                setThread([]);
              }}
            >
              {c.title ?? c.id.slice(0, 8)}
            </button>
          ))}
        </aside>

        <div className="space-y-3">
          <div className="min-h-[280px] space-y-2 border border-border p-4">
            {thread.length === 0 ? (
              <p className="text-sm text-muted">Ask for a sales summary, best sellers, or low-stock items.</p>
            ) : null}
            {thread.map((m, i) => (
              <div key={i} className="whitespace-pre-wrap text-sm">
                <span className="text-xs uppercase text-muted">{m.role}: </span>
                {m.content}
              </div>
            ))}
            {chat.isPending ? <LoadingState label="Thinking…" /> : null}
          </div>
          {chat.isError ? <p className="text-sm text-wine">{chat.error.message}</p> : null}
          <div className="flex gap-2">
            <Input
              label="Message"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1"
            />
            <Button
              className="self-end"
              disabled={!input.trim() || chat.isPending}
              onClick={() => {
                const msg = input.trim();
                setInput("");
                chat.mutate(msg);
              }}
            >
              Send
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
