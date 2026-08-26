"use client";

import * as React from "react";
import { Button } from "@t360/ui";
import { apiUpload } from "../lib/api";

type MediaAsset = { url: string; publicId?: string };

type Props = {
  label?: string;
  value?: string;
  onChange: (url: string, asset?: MediaAsset) => void;
  /** When set, shows a gallery of existing URLs with remove */
  urls?: string[];
  onUrlsChange?: (urls: string[]) => void;
  className?: string;
};

export function MediaImagePicker({
  label = "Image",
  value,
  onChange,
  urls,
  onUrlsChange,
  className,
}: Props) {
  const fileRef = React.useRef<HTMLInputElement>(null);
  const cameraRef = React.useRef<HTMLInputElement>(null);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [cameraOpen, setCameraOpen] = React.useState(false);
  const streamRef = React.useRef<MediaStream | null>(null);

  const list = urls ?? (value ? [value] : []);

  React.useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  async function uploadFile(file: File) {
    setUploading(true);
    setError(null);
    try {
      const res = await apiUpload<MediaAsset>("/admin/media/upload", file);
      const url = res.data.url;
      onChange(url, res.data);
      if (onUrlsChange) onUrlsChange([...list, url]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function openLiveCamera() {
    setError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      cameraRef.current?.click();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;
      setCameraOpen(true);
      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          void videoRef.current.play();
        }
      });
    } catch {
      cameraRef.current?.click();
    }
  }

  function closeCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraOpen(false);
  }

  async function captureFrame() {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    closeCamera();
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.9),
    );
    if (!blob) {
      setError("Could not capture photo");
      return;
    }
    await uploadFile(new File([blob], `capture_${Date.now()}.jpg`, { type: "image/jpeg" }));
  }

  function removeAt(index: number) {
    if (!onUrlsChange) return;
    onUrlsChange(list.filter((_, i) => i !== index));
  }

  return (
    <div className={className ?? "space-y-2"}>
      <p className="text-sm font-medium">{label}</p>
      {list.length ? (
        <div className="grid grid-cols-3 gap-2">
          {list.map((url, i) => (
            <div key={`${url}-${i}`} className="relative overflow-hidden rounded-md border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="aspect-[4/5] w-full object-cover" />
              {onUrlsChange ? (
                <button
                  type="button"
                  className="absolute right-1 top-1 rounded bg-black/60 px-1.5 text-xs text-white"
                  onClick={() => removeAt(i)}
                >
                  Remove
                </button>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" disabled={uploading} onClick={() => fileRef.current?.click()}>
          {uploading ? "Uploading…" : "Upload"}
        </Button>
        <Button type="button" variant="outline" disabled={uploading} onClick={() => void openLiveCamera()}>
          Camera
        </Button>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) void uploadFile(f);
        }}
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) void uploadFile(f);
        }}
      />

      {cameraOpen ? (
        <div className="fixed inset-0 z-50 flex flex-col bg-black/90 p-4">
          <video ref={videoRef} playsInline muted className="mx-auto max-h-[70vh] w-full max-w-lg rounded-md object-contain" />
          <div className="mt-4 flex justify-center gap-3">
            <Button type="button" variant="outline" onClick={closeCamera}>
              Cancel
            </Button>
            <Button type="button" onClick={() => void captureFrame()} disabled={uploading}>
              Capture
            </Button>
          </div>
        </div>
      ) : null}

      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {value && !urls ? (
        <p className="truncate text-xs text-muted" title={value}>
          {value}
        </p>
      ) : null}
    </div>
  );
}
