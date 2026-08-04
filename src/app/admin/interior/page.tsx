"use client";

import { useState, type FormEvent } from "react";
import { Trash2 } from "lucide-react";
import { AdminShell } from "@/components/AdminShell";
import { ImagePicker } from "@/components/ImagePicker";
import { useFranchise } from "@/context/FranchiseContext";
import { useInterior } from "@/context/InteriorContext";

export default function AdminInteriorPage() {
  const { franchise } = useFranchise();
  const { photos, addPhoto, updatePhoto, removePhoto } = useInterior();
  const [interiorDraft, setInteriorDraft] = useState("");

  function onAddInterior(e: FormEvent) {
    e.preventDefault();
    if (!interiorDraft) return;
    addPhoto(interiorDraft);
    setInteriorDraft("");
  }

  return (
    <AdminShell
      active="interior"
      title="Интерьер"
      subtitle={`${franchise.shortAddress} · фото блока «Атмосфера»`}
    >
      <section className="mt-8">
        <p className="text-sm text-ink-muted">
          Если фото больше 4–5, на сайте появится горизонтальный скролл.
        </p>

        <form
          onSubmit={onAddInterior}
          className="mt-5 grid max-w-full gap-3 rounded-[22px] border border-line bg-surface p-4 shadow-[var(--shadow)] sm:p-5"
        >
          <ImagePicker
            persistOnServer
            uploadPrefix="interior"
            value={interiorDraft}
            onChange={setInteriorDraft}
            label="Новое фото интерьера"
          />
          <button
            type="submit"
            disabled={!interiorDraft}
            className="btn-soft justify-self-start"
          >
            Добавить
          </button>
        </form>

        <ul className="mt-5 grid gap-3 sm:grid-cols-2">
          {photos.map((photo) => (
            <li
              key={photo.id}
              className="rounded-2xl border border-line bg-surface p-3 shadow-[var(--shadow-soft)]"
            >
              <ImagePicker
                persistOnServer
                uploadPrefix="interior"
                value={photo.src}
                onChange={(src) => updatePhoto(photo.id, src)}
                label="Фото"
              />
              <button
                type="button"
                onClick={() => removePhoto(photo.id)}
                className="btn-ghost btn-ghost-danger mt-2"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Удалить
              </button>
            </li>
          ))}
        </ul>
      </section>
    </AdminShell>
  );
}
