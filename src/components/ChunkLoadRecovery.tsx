"use client";

import { useEffect } from "react";

const RELOAD_KEY = "vechera-chunk-reload";

function isChunkLoadError(value: unknown): boolean {
  const message =
    value instanceof Error
      ? value.message
      : typeof value === "string"
        ? value
        : "";

  return (
    message.includes("ChunkLoadError") ||
    message.includes("Loading chunk") ||
    message.includes("Failed to fetch dynamically imported module")
  );
}

/** Дублирует inline-скрипт из layout — подстраховка после монтирования React. */
export function ChunkLoadRecovery() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;

    try {
      sessionStorage.removeItem(RELOAD_KEY);
    } catch {
      /* private mode */
    }

    function reloadOnce() {
      try {
        if (sessionStorage.getItem(RELOAD_KEY)) return;
        sessionStorage.setItem(RELOAD_KEY, "1");
      } catch {
        /* private mode */
      }
      window.location.reload();
    }

    function onError(event: ErrorEvent) {
      const target = event.target;
      if (
        target instanceof HTMLScriptElement &&
        target.src.includes("/_next/static/chunks/")
      ) {
        reloadOnce();
        return;
      }
      if (isChunkLoadError(event.error ?? event.message)) {
        reloadOnce();
      }
    }

    function onUnhandledRejection(event: PromiseRejectionEvent) {
      if (isChunkLoadError(event.reason)) {
        reloadOnce();
      }
    }

    window.addEventListener("error", onError, true);
    window.addEventListener("unhandledrejection", onUnhandledRejection);
    return () => {
      window.removeEventListener("error", onError, true);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
    };
  }, []);

  return null;
}
