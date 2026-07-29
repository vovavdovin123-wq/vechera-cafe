"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { usePromos } from "@/context/PromoContext";
import {
  DEFAULT_OVERLAY_STRENGTH,
  DEFAULT_OVERLAY_TINT,
  overlayGradient,
} from "@/lib/promo-overlay";

const AUTO_MS = 5000;
const MANUAL_PAUSE_MS = 6000;
const SLIDE_GAP = 16;

/** Карусель акций: фото на весь блок, бесконечный цикл */
export function PromoCarousel() {
  const { slides } = usePromos();
  const count = slides.length;
  const loop = count > 1;

  const extended = useMemo(() => {
    if (!loop) return slides;
    return [slides[count - 1], ...slides, slides[0]];
  }, [slides, count, loop]);

  const [realIndex, setRealIndex] = useState(0);
  const [trackIndex, setTrackIndex] = useState(loop ? 1 : 0);
  const [animate, setAnimate] = useState(true);

  const trackRef = useRef<HTMLDivElement>(null);
  const transitioningRef = useRef(false);
  const resumeAutoAtRef = useRef(0);
  const autoTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const realIndexRef = useRef(realIndex);
  const trackIndexRef = useRef(trackIndex);
  realIndexRef.current = realIndex;
  trackIndexRef.current = trackIndex;

  const pauseAutoTemporarily = useCallback(() => {
    resumeAutoAtRef.current = Date.now() + MANUAL_PAUSE_MS;
  }, []);

  const jumpWithoutAnimation = useCallback(
    (nextTrack: number, nextReal: number) => {
      transitioningRef.current = false;
      setAnimate(false);
      setTrackIndex(nextTrack);
      setRealIndex(nextReal);
    },
    [],
  );

  useLayoutEffect(() => {
    if (animate) return;
    const track = trackRef.current;
    void track?.offsetHeight;
    setAnimate(true);
  }, [trackIndex, animate]);

  const scheduleAuto = useCallback(() => {
    clearTimeout(autoTimerRef.current);
    autoTimerRef.current = setTimeout(() => {
      if (Date.now() < resumeAutoAtRef.current) {
        scheduleAuto();
        return;
      }
      if (transitioningRef.current) {
        scheduleAuto();
        return;
      }

      const next = realIndexRef.current + 1;
      const normalized = ((next % count) + count) % count;
      const current = realIndexRef.current;

      if (loop && current === count - 1 && normalized === 0) {
        transitioningRef.current = true;
        setAnimate(true);
        setTrackIndex(count + 1);
        setRealIndex(0);
        return;
      }

      if (!loop) {
        setAnimate(true);
        setTrackIndex(normalized);
        setRealIndex(normalized);
      } else {
        setAnimate(true);
        setTrackIndex(normalized + 1);
        setRealIndex(normalized);
      }
    }, AUTO_MS);
  }, [count, loop]);

  const goToReal = useCallback(
    (nextReal: number, manual = false) => {
      if (count === 0) return;
      if (manual) pauseAutoTemporarily();

      const normalized = ((nextReal % count) + count) % count;
      if (normalized === realIndexRef.current) return;
      if (transitioningRef.current) return;

      if (!loop) {
        setAnimate(true);
        setTrackIndex(normalized);
        setRealIndex(normalized);
        if (manual) scheduleAuto();
        return;
      }

      const current = realIndexRef.current;

      if (current === count - 1 && normalized === 0) {
        transitioningRef.current = true;
        setAnimate(true);
        setTrackIndex(count + 1);
        setRealIndex(0);
        return;
      }

      if (current === 0 && normalized === count - 1) {
        transitioningRef.current = true;
        setAnimate(true);
        setTrackIndex(0);
        setRealIndex(count - 1);
        return;
      }

      setAnimate(true);
      setTrackIndex(normalized + 1);
      setRealIndex(normalized);
      if (manual) scheduleAuto();
    },
    [count, loop, pauseAutoTemporarily, scheduleAuto],
  );

  const goNext = useCallback(
    (manual = false) => {
      goToReal(realIndexRef.current + 1, manual);
    },
    [goToReal],
  );

  const goPrev = useCallback(
    (manual = false) => {
      goToReal(realIndexRef.current - 1, manual);
    },
    [goToReal],
  );

  useEffect(() => {
    if (!loop) return;
    jumpWithoutAnimation(1, 0);
  }, [count, loop, jumpWithoutAnimation]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || !loop) return;

    function onEnd(e: TransitionEvent) {
      if (e.target !== track || e.propertyName !== "transform") return;

      const current = trackIndexRef.current;

      if (current === 0) {
        jumpWithoutAnimation(count, count - 1);
        scheduleAuto();
        return;
      }

      if (current === count + 1) {
        jumpWithoutAnimation(1, 0);
        scheduleAuto();
        return;
      }

      transitioningRef.current = false;
      scheduleAuto();
    }

    track.addEventListener("transitionend", onEnd);
    return () => track.removeEventListener("transitionend", onEnd);
  }, [count, loop, jumpWithoutAnimation, scheduleAuto]);

  useEffect(() => {
    if (count <= 1) return;
    scheduleAuto();
    return () => clearTimeout(autoTimerRef.current);
  }, [count, scheduleAuto]);

  if (count === 0) return null;

  const slideW = "86vw";

  return (
    <section className="relative w-full pt-3 sm:pt-4">
      <div className="promo-viewport relative w-full overflow-hidden">
        <div
          ref={trackRef}
          className={`flex items-stretch will-change-transform ${
            animate
              ? "transition-transform duration-[520ms] ease-[cubic-bezier(0.25,0.8,0.25,1)]"
              : ""
          }`}
          style={{
            transform: `translate3d(calc((100vw - ${slideW}) / 2 - ${trackIndex} * (${slideW} + ${SLIDE_GAP}px)), 0, 0)`,
          }}
        >
          {extended.map((slide, i) => {
            const slideRealIndex = loop
              ? i === 0
                ? count - 1
                : i === extended.length - 1
                  ? 0
                  : i - 1
              : i;
            const active = slideRealIndex === realIndex;
            const tint = slide.overlayTint ?? DEFAULT_OVERLAY_TINT;
            const strength = slide.overlayStrength ?? DEFAULT_OVERLAY_STRENGTH;
            const gradient = overlayGradient(tint, strength);

            return (
              <article
                key={`${slide.id}-${i}`}
                className={`relative h-[180px] shrink-0 overflow-hidden rounded-[20px] transition-[opacity,transform] duration-[520ms] sm:h-[240px] sm:rounded-[24px] md:h-[280px] md:rounded-[28px] lg:h-[300px] ${
                  active
                    ? "z-[2] scale-100 opacity-100"
                    : "z-[1] scale-[0.985] opacity-[0.55]"
                }`}
                style={{
                  width: slideW,
                  marginRight: i < extended.length - 1 ? SLIDE_GAP : 0,
                }}
              >
                {slide.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={slide.image}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover"
                    draggable={false}
                  />
                ) : (
                  <div
                    className="absolute inset-0"
                    style={{ background: gradient }}
                  />
                )}

                <div className="relative z-10 flex h-full flex-col justify-center px-5 sm:px-8 md:px-12">
                  <span className="inline-flex w-fit rounded-full bg-[color-mix(in_srgb,var(--white)_88%,transparent)] px-3.5 py-1.5 text-sm font-semibold uppercase tracking-wide text-[var(--ink)] shadow-sm sm:text-base">
                    {slide.badge}
                  </span>
                  <h2 className="mt-2 max-w-md font-display text-2xl font-semibold leading-tight text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.55)] sm:mt-3 sm:text-4xl md:text-5xl">
                    {slide.title}
                  </h2>
                  <p className="mt-2 max-w-sm text-base text-white/95 drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)] sm:text-lg md:text-xl">
                    {slide.subtitle}
                  </p>
                </div>
              </article>
            );
          })}
        </div>

        <div className="promo-fade promo-fade-left" aria-hidden />
        <div className="promo-fade promo-fade-right" aria-hidden />

        {count > 1 && (
          <>
            <button
              type="button"
              aria-label="Предыдущая акция"
              onClick={() => goPrev(true)}
              className="absolute left-2 top-1/2 z-30 hidden -translate-y-1/2 rounded-full border border-line bg-surface/95 p-2.5 shadow-md transition hover:border-[var(--orange)] sm:left-4 sm:flex md:left-6"
            >
              <ChevronLeft className="h-5 w-5 text-ink" />
            </button>
            <button
              type="button"
              aria-label="Следующая акция"
              onClick={() => goNext(true)}
              className="absolute right-2 top-1/2 z-30 hidden -translate-y-1/2 rounded-full border border-line bg-surface/95 p-2.5 shadow-md transition hover:border-[var(--orange)] sm:right-4 sm:flex md:right-6"
            >
              <ChevronRight className="h-5 w-5 text-ink" />
            </button>
          </>
        )}
      </div>

      {count > 1 && (
        <div className="mt-3 flex justify-center gap-2 sm:mt-4">
          {slides.map((s, i) => (
            <button
              key={s.id}
              type="button"
              aria-label={`Слайд ${i + 1}`}
              onClick={() => goToReal(i, true)}
              className={`h-1.5 rounded-full transition-all ${
                i === realIndex
                  ? "w-5 bg-[var(--orange)]"
                  : "w-1.5 bg-[var(--brown-light)]/70"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
