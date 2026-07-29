"use client";

import { useState, type FormEvent } from "react";
import { Headset, Loader2, Phone, Send } from "lucide-react";
import { useFranchise } from "@/context/FranchiseContext";
import { PAGE } from "@/lib/layout";

function TelegramIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.458.02.702-.15 1.568-.828 5.36-1.17 7.12-.144.742-.426 1.99-.8 1.99-.337.01-.586-.3-.917-.59-.52-.46-1.594-1.403-2.248-1.96-.914-.78-.32-1.21.203-1.91.137-.184 2.504-2.31 2.55-2.51.006-.025.014-.117-.043-.166s-.15-.03-.214-.018c-.093.024-1.555.99-4.39 2.91-.415.285-.79.424-1.125.417-.37-.008-1.082-.209-1.61-.38-.65-.21-1.166-.32-1.122-.677.023-.186.35-.377.964-.573 3.78-1.647 6.3-2.733 7.566-3.26 3.605-1.5 4.355-1.76 4.846-1.77z" />
    </svg>
  );
}

function InstagramIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

export function FeedbackSection() {
  const { franchise, franchiseId } = useFranchise();
  const [message, setMessage] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const telegramUrl = franchise.telegram || "https://t.me/vechera_cafe";
  const instagramUrl = "https://instagram.com/vechera.cafe";
  const phoneDisplay = franchise.phone || "+7 (928) 555-12-34";
  const phoneHref = `tel:${phoneDisplay.replace(/[^\d+]/g, "")}`;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          franchiseId,
          message,
          name: name || undefined,
          phone: phone || undefined,
        }),
      });
      const data = await res.json();
      setStatus(data.message);
      if (res.ok) {
        setMessage("");
        setName("");
        setPhone("");
      }
    } catch {
      setStatus("Не удалось отправить. Попробуйте позже.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section id="contacts" className={`${PAGE} py-8 sm:py-12 md:py-14`}>
      <div className="mb-6 sm:mb-8">
        <p className="brand-section-label inline-flex items-center gap-2 text-sm">
          <Headset className="h-4 w-4" />
          Связь с нами
        </p>
        <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl md:text-5xl">
          Обратная связь
        </h2>

        <div className="mt-4 flex flex-wrap items-center gap-2 sm:mt-5 sm:gap-3">
          <a
            href={phoneHref}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--white)] px-3.5 py-2 text-sm text-ink transition hover:border-[var(--gold)] sm:px-4 sm:py-2.5 sm:text-base"
          >
            <Phone className="h-4 w-4 shrink-0 text-[var(--gold)]" />
            <span className="truncate">{phoneDisplay}</span>
          </a>
          <a
            href={telegramUrl}
            target="_blank"
            rel="noreferrer"
            aria-label="Telegram"
            className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--white)] px-3.5 py-2 text-sm text-ink transition hover:border-[var(--gold)] sm:px-4 sm:py-2.5 sm:text-base"
          >
            <TelegramIcon className="h-4 w-4 text-[var(--gold)]" />
            Telegram
          </a>
          <a
            href={instagramUrl}
            target="_blank"
            rel="noreferrer"
            aria-label="Instagram"
            className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--white)] px-3.5 py-2 text-sm text-ink transition hover:border-[var(--gold)] sm:px-4 sm:py-2.5 sm:text-base"
          >
            <InstagramIcon className="h-4 w-4 text-[var(--gold)]" />
            Instagram
          </a>
        </div>
      </div>

      <form
        onSubmit={onSubmit}
        className="rounded-2xl border border-[var(--line)] bg-white p-4 shadow-[var(--shadow-soft)] sm:p-5 md:p-7"
      >
        <textarea
          required
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Ваши мысли, пожелания или жалобы"
          rows={4}
          className="w-full resize-none rounded-2xl border border-line bg-bg/40 px-4 py-3 text-base outline-none focus:border-accent"
        />
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto]">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Имя (необязательно)"
            className="rounded-2xl border border-line bg-bg/40 px-4 py-3 text-base outline-none focus:border-accent"
          />
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Телефон (необязательно)"
            className="rounded-2xl border border-line bg-bg/40 px-4 py-3 text-base outline-none focus:border-accent"
          />
          <button
            type="submit"
            disabled={loading || !message.trim()}
            className="btn-soft w-full gap-2 disabled:opacity-50 sm:col-span-2 lg:col-span-1 lg:w-auto"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Отправить
          </button>
        </div>
        {status && <p className="mt-4 text-sm text-ink-muted">{status}</p>}
      </form>
    </section>
  );
}
