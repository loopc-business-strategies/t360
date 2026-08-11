"use client";

import { useLocale } from "../../../lib/locale";

export default function ShippingPolicyPage() {
  const { t } = useLocale();
  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <p className="mb-4 text-xs uppercase tracking-wide text-muted">{t.legalDraftNotice}</p>
      <h1 className="font-display text-3xl">{t.shippingTitle}</h1>
      <p className="mt-6 text-muted leading-relaxed">{t.shippingBody}</p>
    </main>
  );
}
