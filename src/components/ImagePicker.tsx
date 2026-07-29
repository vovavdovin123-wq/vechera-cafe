"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";

async function fileToDataUrl(
  file: File,
  maxW: number,
  quality: number,
): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxW / bitmap.width);
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();

  return canvas.toDataURL("image/jpeg", quality);
}

export function ImagePicker({
  value,
  onChange,
  label = "Фото",
  hint,
  maxCompressWidth = 900,
  jpegQuality = 0.78,
  persistOnServer = false,
  uploadPrefix = "upload",
  allowClear = true,
}: {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  hint?: string;
  maxCompressWidth?: number;
  jpegQuality?: number;
  persistOnServer?: boolean;
  uploadPrefix?: string;
  allowClear?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewBump, setPreviewBump] = useState(0);

  async function onFile(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Выберите изображение (JPG, PNG, WebP)");
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      setError("Файл слишком большой (макс. 12 МБ)");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const dataUrl = await fileToDataUrl(file, maxCompressWidth, jpegQuality);
      if (persistOnServer) {
        const res = await fetch("/api/content/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ dataUrl, prefix: uploadPrefix }),
        });
        const json = (await res.json()) as {
          ok: boolean;
          url?: string;
          message?: string;
        };
        if (res.status === 401) {
          setError("Сессия истекла — выйдите и войдите в админку снова");
          return;
        }
        if (!res.ok || !json.ok || !json.url) {
          setError(json.message || "Не удалось сохранить фото на сервере");
          return;
        }
        onChange(json.url);
        setPreviewBump((n) => n + 1);
      } else {
        onChange(dataUrl);
        setPreviewBump((n) => n + 1);
      }
    } catch {
      setError("Не удалось обработать фото. Попробуйте JPG или PNG.");
    } finally {
      setLoading(false);
    }
  }

  function clearPhoto() {
    if (!value) return;
    if (!confirm("Удалить фото?")) return;
    setError(null);
    onChange("");
    setPreviewBump((n) => n + 1);
    if (inputRef.current) inputRef.current.value = "";
  }

  const previewSrc =
    value && !value.startsWith("data:")
      ? `${value}${value.includes("?") ? "&" : "?"}v=${previewBump}`
      : value;

  return (
    <div className="min-w-0 space-y-2">
      <div className="flex min-w-0 items-start gap-3">
        <div className="h-20 w-28 shrink-0 overflow-hidden rounded-xl border border-line bg-bg-deep">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={`${value}-${previewBump}`}
              src={previewSrc}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-ink-muted">
              <ImagePlus className="h-6 w-6" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-ink">{label}</p>
          {hint && (
            <p className="mt-1 text-xs leading-relaxed text-ink-muted">{hint}</p>
          )}
          <div className="mt-2 flex min-w-0 flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={loading}
              onClick={() => inputRef.current?.click()}
              className="btn-ghost shrink-0 disabled:opacity-60"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ImagePlus className="h-4 w-4 text-accent" />
              )}
              {value ? "Сменить" : "Выбрать"}
            </button>
            {allowClear && value ? (
              <button
                type="button"
                disabled={loading}
                onClick={clearPhoto}
                className="btn-ghost btn-ghost-danger shrink-0 disabled:opacity-60"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Удалить
              </button>
            ) : null}
          </div>
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          void onFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
