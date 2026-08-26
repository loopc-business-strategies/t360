"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@t360/ui";
import { API_URL, apiFetch, getCustomerToken } from "../../lib/api";
import { useLocale } from "../../lib/locale";

type TryOnSession = {
  id: string;
  status: string;
  resultImageUrl?: string | null;
  inputImageUrl?: string | null;
  errorMessage?: string | null;
  expiredMessage?: string;
  productId: string;
  variantId?: string | null;
};

type Step = "guide" | "capture" | "preview" | "processing" | "result" | "failed";

export function TryOnModal({
  open,
  onClose,
  productId,
  productName,
  productSlug,
  variantId,
  tryOnEnabled,
  reusedPhotoUrl,
}: {
  open: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
  productSlug: string;
  variantId?: string;
  tryOnEnabled: boolean;
  reusedPhotoUrl?: string | null;
}) {
  const { t } = useLocale();
  const [step, setStep] = React.useState<Step>("guide");
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(reusedPhotoUrl ?? null);
  const [uploadedUrl, setUploadedUrl] = React.useState<string | null>(reusedPhotoUrl ?? null);
  const [uploadedPublicId, setUploadedPublicId] = React.useState<string | null>(null);
  const [session, setSession] = React.useState<TryOnSession | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [savePhotoConsent, setSavePhotoConsent] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [cameraOn, setCameraOn] = React.useState(false);
  const streamRef = React.useRef<MediaStream | null>(null);
  const pollRef = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const [cfg, setCfg] = React.useState({
    allowCamera: true,
    allowUpload: true,
    consentRequired: true,
  });

  React.useEffect(() => {
    if (!open) {
      stopCamera();
      if (pollRef.current) clearInterval(pollRef.current);
      return;
    }
    setStep(reusedPhotoUrl ? "preview" : "guide");
    setPreviewUrl(reusedPhotoUrl ?? null);
    setUploadedUrl(reusedPhotoUrl ?? null);
    setSession(null);
    setError(null);
    setSavePhotoConsent(false);
    void apiFetch<{
      allowCamera: boolean;
      allowUpload: boolean;
      consentRequired: boolean;
    }>("/ai/fashion/try-on/config")
      .then((r) => setCfg(r.data))
      .catch(() => undefined);
  }, [open, reusedPhotoUrl]);

  React.useEffect(() => () => stopCamera(), []);

  function stopCamera() {
    streamRef.current?.getTracks().forEach((tr) => tr.stop());
    streamRef.current = null;
    setCameraOn(false);
  }

  async function startCamera() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      setCameraOn(true);
      setStep("capture");
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          void videoRef.current.play();
        }
      });
    } catch {
      setError("Camera is not available. Please upload a photo instead.");
      setStep("capture");
    }
  }

  function captureFrame() {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 720;
    canvas.height = video.videoHeight || 960;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        stopCamera();
        setStep("preview");
        void uploadBlob(blob);
      },
      "image/jpeg",
      0.85,
    );
  }

  async function onFile(file: File) {
    setError(null);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setStep("preview");
    await uploadBlob(file);
  }

  async function uploadBlob(blob: Blob) {
    if (!getCustomerToken()) {
      window.location.href = `/account?redirect=/products/${productSlug}`;
      return;
    }
    setBusy(true);
    try {
      const form = new FormData();
      form.append("file", blob, "person.jpg");
      const res = await fetch(`${API_URL}/ai/fashion/try-on/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getCustomerToken()}` },
        body: form,
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json?.error?.message ?? "Upload failed");
      }
      setUploadedUrl(json.data.url);
      setUploadedPublicId(json.data.publicId ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
      setStep("failed");
    } finally {
      setBusy(false);
    }
  }

  async function startTryOn() {
    if (!uploadedUrl || busy) return;
    if (!getCustomerToken()) {
      window.location.href = `/account?redirect=/products/${productSlug}`;
      return;
    }
    setBusy(true);
    setError(null);
    setStep("processing");
    const idem = crypto.randomUUID();
    try {
      const res = await apiFetch<TryOnSession>("/ai/fashion/try-on", {
        method: "POST",
        headers: { "Idempotency-Key": idem },
        body: JSON.stringify({
          productId,
          variantId: variantId || undefined,
          inputImageUrl: uploadedUrl,
          inputPublicId: uploadedPublicId,
          savePhotoConsent,
        }),
      });
      setSession(res.data);
      pollStatus(res.data.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : t.tryMeFailed);
      setStep("failed");
      setBusy(false);
    }
  }

  function pollStatus(id: string) {
    if (pollRef.current) clearInterval(pollRef.current);
    let delay = 2000;
    const tick = async () => {
      try {
        const res = await apiFetch<TryOnSession>(`/ai/fashion/try-on/${id}`);
        setSession(res.data);
        if (["COMPLETED", "FAILED", "CANCELLED", "EXPIRED"].includes(res.data.status)) {
          if (pollRef.current) clearInterval(pollRef.current);
          setBusy(false);
          setStep(res.data.status === "COMPLETED" ? "result" : "failed");
          if (res.data.status !== "COMPLETED") {
            setError(res.data.errorMessage || res.data.expiredMessage || t.tryMeFailed);
          }
        }
      } catch {
        /* keep polling briefly */
      }
    };
    void tick();
    pollRef.current = setInterval(() => {
      void tick();
      delay = Math.min(delay + 500, 5000);
    }, delay);
  }

  async function addToCart() {
    if (!variantId) return;
    setBusy(true);
    try {
      await apiFetch("/cart/items", {
        method: "POST",
        body: JSON.stringify({ variantId, qty: 1 }),
      });
    } finally {
      setBusy(false);
    }
  }

  async function shareResult() {
    const url = session?.resultImageUrl;
    if (!url) return;
    if (navigator.share) {
      try {
        await navigator.share({ title: productName, url, text: t.tryMeResult });
        return;
      } catch {
        /* fall through */
      }
    }
    await navigator.clipboard.writeText(url);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/50 p-0 sm:items-center sm:p-6">
      <div className="max-h-[95vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-elevated p-6 shadow-soft sm:rounded-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl">{t.tryMeTitle}</h2>
            <p className="mt-1 text-sm text-muted">{productName}</p>
          </div>
          <button type="button" className="text-sm text-muted hover:text-ink" onClick={onClose}>
            ✕
          </button>
        </div>

        {!tryOnEnabled ? (
          <p className="mt-6 text-sm text-muted">{t.tryMeUnavailable}</p>
        ) : null}

        {tryOnEnabled && step === "guide" ? (
          <div className="mt-6 space-y-4">
            <p className="text-sm text-muted">{t.tryMeGuide}</p>
            <ul className="list-disc space-y-1 pl-5 text-sm text-ink">
              <li>One person only</li>
              <li>Face visible, front-facing</li>
              <li>Good lighting</li>
              <li>Stand naturally</li>
            </ul>
            <div className="flex flex-wrap gap-2">
              {cfg.allowCamera ? (
                <Button type="button" onClick={() => void startCamera()}>
                  {t.tryMeTakePhoto}
                </Button>
              ) : null}
              {cfg.allowUpload ? (
                <Button type="button" variant="secondary" onClick={() => fileRef.current?.click()}>
                  {t.tryMeUpload}
                </Button>
              ) : null}
              <Button type="button" variant="outline" onClick={onClose}>
                {t.tryMeCancel}
              </Button>
            </div>
          </div>
        ) : null}

        {tryOnEnabled && step === "capture" ? (
          <div className="mt-6 space-y-4">
            {cameraOn ? (
              <>
                <video ref={videoRef} className="aspect-[3/4] w-full rounded-lg bg-ink object-cover" playsInline muted />
                <Button type="button" onClick={captureFrame} disabled={busy}>
                  {t.tryMeTakePhoto}
                </Button>
              </>
            ) : (
              <Button type="button" variant="secondary" onClick={() => fileRef.current?.click()}>
                {t.tryMeUpload}
              </Button>
            )}
            {error ? <p className="text-sm text-danger">{error}</p> : null}
          </div>
        ) : null}

        {tryOnEnabled && step === "preview" ? (
          <div className="mt-6 space-y-4">
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewUrl} alt="" className="aspect-[3/4] w-full rounded-lg object-cover" />
            ) : null}
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                className="mt-1"
                checked={savePhotoConsent}
                onChange={(e) => setSavePhotoConsent(e.target.checked)}
              />
              <span>
                Save my photo for this try-on session (optional). Without this, your original photo is
                deleted after processing.
              </span>
            </label>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setPreviewUrl(null);
                  setUploadedUrl(null);
                  setStep("guide");
                }}
              >
                {t.tryMeRetake}
              </Button>
              <Button
                type="button"
                onClick={() => void startTryOn()}
                disabled={busy || !uploadedUrl}
              >
                {busy ? "…" : t.tryMeConfirm}
              </Button>
            </div>
            <p className="text-xs text-muted">
              You can continue without saving the original photo; only the AI result may be kept briefly.
            </p>
          </div>
        ) : null}

        {tryOnEnabled && step === "processing" ? (
          <div className="mt-6 space-y-3 text-sm">
            <p className="font-medium">{t.tryMeProcessing}</p>
            <ol className="list-decimal space-y-2 pl-5 text-muted">
              <li>{t.tryMeStepPrepare}</li>
              <li>{t.tryMeStepMatch}</li>
              <li>{t.tryMeStepGenerate}</li>
              <li>{t.tryMeStepFinish}</li>
            </ol>
            <p className="text-xs text-muted">Status: {session?.status ?? "QUEUED"}</p>
            {session?.id && session.status === "QUEUED" ? (
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={() => {
                  void apiFetch(`/ai/fashion/try-on/${session.id}/cancel`, { method: "POST" })
                    .then(() => {
                      if (pollRef.current) clearInterval(pollRef.current);
                      setBusy(false);
                      setStep("failed");
                      setError("Try-on cancelled");
                    })
                    .catch((e: Error) => setError(e.message));
                }}
              >
                Cancel
              </Button>
            ) : null}
          </div>
        ) : null}

        {tryOnEnabled && step === "result" && session?.resultImageUrl ? (
          <div className="mt-6 space-y-4">
            <h3 className="font-display text-xl">{t.tryMeResult}</h3>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={session.resultImageUrl}
              alt={t.tryMeResult}
              className="aspect-[3/4] w-full rounded-lg object-cover"
            />
            <p className="text-xs text-muted">{t.tryMeDisclaimer}</p>
            <div className="flex flex-wrap gap-2">
              <a href={session.resultImageUrl} download target="_blank" rel="noreferrer">
                <Button type="button" variant="secondary">
                  {t.tryMeDownload}
                </Button>
              </a>
              <Button type="button" variant="secondary" onClick={() => void shareResult()}>
                {t.tryMeShare}
              </Button>
              <Button type="button" onClick={() => void addToCart()} disabled={!variantId || busy}>
                {t.addToCart}
              </Button>
              <Link href={`/products/${productSlug}`}>
                <Button type="button" variant="outline">
                  {t.viewProduct}
                </Button>
              </Link>
              <Link href="/products">
                <Button type="button" variant="outline">
                  {t.tryMeAnother}
                </Button>
              </Link>
            </div>
          </div>
        ) : null}

        {tryOnEnabled && step === "failed" ? (
          <div className="mt-6 space-y-4">
            <p className="text-sm text-danger">{error || t.tryMeFailed}</p>
            <div className="flex flex-wrap gap-2">
              <Button type="button" onClick={() => setStep("preview")} disabled={!uploadedUrl}>
                {t.tryMeAgain}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setPreviewUrl(null);
                  setUploadedUrl(null);
                  setStep("guide");
                }}
              >
                {t.tryMeRetake}
              </Button>
            </div>
          </div>
        ) : null}

        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void onFile(f);
          }}
        />
      </div>
    </div>
  );
}
