"use client";

import { useState, type FormEvent } from "react";
import { BadgePercent, Plus, Trash2 } from "lucide-react";
import { AdminShell } from "@/components/AdminShell";
import { ImagePicker } from "@/components/ImagePicker";
import {
  DEFAULT_OVERLAY_STRENGTH,
  DEFAULT_OVERLAY_TINT,
  PromoOverlayPicker,
} from "@/components/PromoOverlayPicker";
import { usePromos } from "@/context/PromoContext";
import { PROMO_PHOTO_HINT } from "@/lib/promo-overlay";
import type { PromoOverlayTint } from "@/lib/promo-overlay";

export default function AdminPromosPage() {
  const { slides, addSlide, updateSlide, removeSlide } = usePromos();
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [badge, setBadge] = useState("Акция");
  const [overlayTint, setOverlayTint] =
    useState<PromoOverlayTint>(DEFAULT_OVERLAY_TINT);
  const [overlayStrength, setOverlayStrength] = useState(
    DEFAULT_OVERLAY_STRENGTH,
  );
  const [image, setImage] = useState("");

  function onAdd(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() || !subtitle.trim() || !badge.trim()) return;
    addSlide({
      title: title.trim(),
      subtitle: subtitle.trim(),
      badge: badge.trim(),
      image: image || "",
      overlayTint,
      overlayStrength,
    });
    setTitle("");
    setSubtitle("");
    setBadge("Акция");
    setOverlayTint(DEFAULT_OVERLAY_TINT);
    setOverlayStrength(DEFAULT_OVERLAY_STRENGTH);
    setImage("");
  }

  return (
    <AdminShell
      active="promos"
      title="Акции"
      subtitle="Редактируйте карточки акций на главной странице"
    >
      <form
        onSubmit={onAdd}
        className="mt-6 grid max-w-full gap-3 rounded-[22px] border border-line bg-surface p-4 shadow-[var(--shadow)] sm:mt-8 sm:grid-cols-2 sm:p-5"
      >
        <h2 className="sm:col-span-2 flex items-center gap-2 text-lg font-semibold">
          <BadgePercent className="h-5 w-5 text-accent" />
          Добавить акцию
        </h2>
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Заголовок"
          className="rounded-2xl border border-line bg-bg/40 px-4 py-2.5 text-sm outline-none focus:border-accent"
        />
        <input
          required
          value={badge}
          onChange={(e) => setBadge(e.target.value)}
          placeholder="Бейдж"
          className="rounded-2xl border border-line bg-bg/40 px-4 py-2.5 text-sm outline-none focus:border-accent"
        />
        <input
          required
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
          placeholder="Описание"
          className="rounded-2xl border border-line bg-bg/40 px-4 py-2.5 text-sm outline-none focus:border-accent sm:col-span-2"
        />
        <div className="sm:col-span-2">
          <ImagePicker
            persistOnServer
            uploadPrefix="promo"
            value={image}
            onChange={setImage}
            label="Фото акции"
            hint={PROMO_PHOTO_HINT}
            maxCompressWidth={1400}
            jpegQuality={0.85}
          />
        </div>
        <div className="sm:col-span-2">
          <PromoOverlayPicker
            tint={overlayTint}
            strength={overlayStrength}
            previewImage={image}
            onTintChange={setOverlayTint}
            onStrengthChange={setOverlayStrength}
          />
        </div>
        <button
          type="submit"
          className="btn-soft sm:col-span-2 justify-self-start"
        >
          <Plus className="h-4 w-4 shrink-0" />
          Добавить
        </button>
      </form>

      <ul className="mt-8 space-y-4">
        {slides.map((slide) => (
          <li
            key={slide.id}
            className="rounded-2xl border border-line bg-surface p-4 shadow-[var(--shadow-soft)]"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                value={slide.title}
                onChange={(e) => updateSlide(slide.id, { title: e.target.value })}
                className="rounded-xl border border-line bg-bg/40 px-3 py-2 text-sm outline-none focus:border-accent"
                placeholder="Заголовок"
              />
              <input
                value={slide.badge}
                onChange={(e) => updateSlide(slide.id, { badge: e.target.value })}
                className="rounded-xl border border-line bg-bg/40 px-3 py-2 text-sm outline-none focus:border-accent"
                placeholder="Бейдж"
              />
              <input
                value={slide.subtitle}
                onChange={(e) =>
                  updateSlide(slide.id, { subtitle: e.target.value })
                }
                className="rounded-xl border border-line bg-bg/40 px-3 py-2 text-sm outline-none focus:border-accent sm:col-span-2"
                placeholder="Описание"
              />
              <div className="sm:col-span-2">
                <ImagePicker
                  persistOnServer
                  uploadPrefix="promo"
                  value={slide.image}
                  onChange={(imageValue) =>
                    updateSlide(slide.id, { image: imageValue })
                  }
                  label="Фото акции"
                  hint={PROMO_PHOTO_HINT}
                  maxCompressWidth={1400}
                  jpegQuality={0.85}
                />
              </div>
              <div className="sm:col-span-2">
                <PromoOverlayPicker
                  tint={slide.overlayTint}
                  strength={slide.overlayStrength}
                  previewImage={slide.image}
                  onTintChange={(tint) =>
                    updateSlide(slide.id, { overlayTint: tint })
                  }
                  onStrengthChange={(strength) =>
                    updateSlide(slide.id, { overlayStrength: strength })
                  }
                />
              </div>
            </div>
            <button
              type="button"
              onClick={() => removeSlide(slide.id)}
              className="btn-ghost btn-ghost-danger mt-3"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Удалить
            </button>
          </li>
        ))}
      </ul>
    </AdminShell>
  );
}
