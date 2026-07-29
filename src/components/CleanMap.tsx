"use client";

import { yandexEmbedUrl } from "@/lib/franchises";

export interface MapMarker {
  coords: [number, number];
  /** pm2 — кафе, pm2rdm — адрес доставки */
  style?: string;
}

/** Интерактивная Яндекс.Карта с метками */
export function CleanMap({
  coords,
  markers,
  title,
  className = "",
  zoom = 16,
}: {
  coords?: [number, number];
  markers?: MapMarker[];
  title: string;
  className?: string;
  zoom?: number;
}) {
  const mapMarkers =
    markers ??
    (coords ? [{ coords, style: "pm2" }] : []);

  const mapKey = mapMarkers.map((m) => `${m.coords.join(",")}-${m.style}`).join("|");

  return (
    <div
      className={`clean-map relative overflow-hidden bg-bg-deep ${className}`}
    >
      <iframe
        key={`${mapKey}-${zoom}`}
        title={title}
        src={yandexEmbedUrl({ coords, markers: mapMarkers, zoom })}
        className="clean-map-iframe absolute inset-0 h-full w-full border-0"
        loading="lazy"
        allowFullScreen
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  );
}
