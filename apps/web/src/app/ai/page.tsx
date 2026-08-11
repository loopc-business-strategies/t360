"use client";

import * as React from "react";
import Link from "next/link";
import { Button, ErrorState, Input, LoadingState } from "@t360/ui";
import { apiFetch, getCustomerToken } from "../../lib/api";

type ChatMessage = { id: string; role: string; content: string; createdAt: string };

export default function AiPage() {
  const [token, setToken] = React.useState<string | null>(null);
  const [conversationId, setConversationId] = React.useState<string | null>(null);
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [input, setInput] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setToken(getCustomerToken());
  }, []);

  async function send() {
    if (!input.trim() || busy) return;
    const text = input.trim();
    setInput("");
    setBusy(true);
    setError(null);
    setMessages((prev) => [
      ...prev,
      { id: `local-${Date.now()}`, role: "user", content: text, createdAt: new Date().toISOString() },
    ]);
    try {
      const res = await apiFetch<{ conversationId: string; reply: string }>("/ai/chat", {
        method: "POST",
        body: JSON.stringify({ conversationId, message: text }),
      });
      setConversationId(res.data.conversationId);
      setMessages((prev) => [
        ...prev,
        {
          id: `asst-${Date.now()}`,
          role: "assistant",
          content: res.data.reply,
          createdAt: new Date().toISOString(),
        },
      ]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Chat failed");
    } finally {
      setBusy(false);
    }
  }

  if (!token) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 px-4 py-10">
        <h1 className="font-display text-3xl">Tharagai AI</h1>
        <p className="text-sm text-muted">Sign in to ask about products, stock, orders, and offers.</p>
        <Link href="/account" className="text-wine underline">
          Go to account
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 px-4 py-8">
      <div>
        <h1 className="font-display text-3xl">Tharagai AI</h1>
        <p className="text-sm text-muted">Answers use live catalogue and order tools — never invented stock or prices.</p>
      </div>

      <div className="min-h-[320px] space-y-3 border border-border bg-elevated p-4">
        {messages.length === 0 ? (
          <p className="text-sm text-muted">Try “Men’s shirts under ₹1500” or ask about your latest order.</p>
        ) : null}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`rounded-md px-3 py-2 text-sm whitespace-pre-wrap ${
              m.role === "user" ? "ml-8 bg-linen" : "mr-8 bg-ink/5"
            }`}
          >
            <p className="mb-1 text-xs uppercase tracking-wide text-muted">{m.role}</p>
            {m.content}
          </div>
        ))}
        {busy ? <LoadingState label="Thinking…" /> : null}
      </div>

      {error ? <ErrorState title="Chat error" description={error} /> : null}

      <div className="flex gap-2">
        <Input
          label="Message"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void send();
          }}
          className="flex-1"
        />
        <Button className="self-end" onClick={() => void send()} disabled={busy || !input.trim()}>
          Send
        </Button>
      </div>
    </div>
  );
}
