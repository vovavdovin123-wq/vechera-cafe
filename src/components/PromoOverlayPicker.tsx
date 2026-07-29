"use client";

import {
  DEFAULT_OVERLAY_STRENGTH,
  DEFAULT_OVERLAY_TINT,
  overlayGradient,
  PROMO_OVERLAY_TINTS,
  type PromoOverlayTint,
} from "@/lib/promo-overlay";

export function PromoOverlayPicker({
  tint,
  strength,
  previewImage,
  onTintChange,
  onStrengthChange,
}: {
  tint: PromoOverlayTint;
  strength: number;
  previewImage?: string;
  onTintChange: (tint: PromoOverlayTint) => void;
  onStrengthChange: (strength: number) => void;
}) {
  const strengthLabel =
    strength <= 25 ? "Мягкий" : strength <= 55 ? "Средний" : "Насыщенный";

  return (
    <div className="space-y-4 rounded-2xl border border-line bg-bg/30 p-4">
      <div>
        <p className="text-sm font-medium text-ink">Градиент акции</p>
        <p className="mt-1 text-xs text-ink-muted">
          {previewImage
            ? "При загруженном фото градиент на сайте не показывается"
            : "Несколько цветов без затемнения к краю"}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {PROMO_OVERLAY_TINTS.map((opt) => {
            const active = tint === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onTintChange(opt.id)}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition ${
                  active
                    ? "border-[var(--espresso)] bg-[var(--gold-soft)] text-ink"
                    : "border-line bg-surface text-ink-muted hover:border-[var(--gold)]"
                }`}
              >
                <span
                  className="h-4 w-4 rounded-full border border-white/80 shadow-sm"
                  style={{ background: opt.color }}
                />
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-ink">Насыщенность</p>
          <span className="text-xs text-ink-muted">{strengthLabel}</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={strength}
          onChange={(e) => onStrengthChange(Number(e.target.value))}
          className="mt-3 w-full accent-[var(--gold)]"
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-line">
        <p className="border-b border-line bg-surface px-3 py-2 text-xs text-ink-muted">
          Предпросмотр на сайте
        </p>
        <div className="relative h-28 overflow-hidden">
          {previewImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewImage}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <div
              className="absolute inset-0"
              style={{ background: overlayGradient(tint, strength) }}
            />
          )}
          <div className="relative z-10 flex h-full flex-col justify-center px-4">
            <span className="inline-flex w-fit rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-semibold uppercase text-ink">
              Акция
            </span>
            <p className="mt-1 text-sm font-semibold text-white drop-shadow-sm">
              Заголовок акции
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export { DEFAULT_OVERLAY_STRENGTH, DEFAULT_OVERLAY_TINT };
