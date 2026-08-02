import type { Franchise, FranchiseId } from "./types";

export const FRANCHISES: Record<FranchiseId, Franchise> = {
  center: {
    id: "center",
    name: "Вечера",
    address:
      "улица Генерала Плиева 22, Республика Северная Осетия — Алания, Правобережный район, Беслан",
    shortAddress: "Беслан, центр",
    hours: "11:00 — 22:30",
    phone: "+7 (928) 000-11-22",
    telegram: "https://t.me/vechera_center",
    // Яндекс: ул. Генерала Плиева, 22 — 43.187266, 44.540511
    coords: [44.540511, 43.187266],
    mapLink: "https://yandex.ru/maps/?pt=44.540511,43.187266&z=17&l=map",
  },
  hippodrome: {
    id: "hippodrome",
    name: "Вечера",
    address:
      "Республика Северная Осетия — Алания, Правобережный район, Ипподром",
    shortAddress: "Беслан, Ипподром",
    hours: "10:00 — 23:00",
    phone: "+7 (928) 000-33-44",
    telegram: "https://t.me/vechera_hippodrome",
    coords: [44.5685, 43.1798],
    mapLink:
      "https://yandex.ru/maps/?text=%D0%91%D0%B5%D1%81%D0%BB%D0%B0%D0%BD%D1%81%D0%BA%D0%B8%D0%B9%20%D0%B8%D0%BF%D0%BF%D0%BE%D0%B4%D1%80%D0%BE%D0%BC&z=15",
  },
};

export const FRANCHISE_LIST = Object.values(FRANCHISES);

export const FRANCHISE_TAB_LABELS: Record<FranchiseId, string> = {
  center: "Центр",
  hippodrome: "Ипподром",
};

/** Интерактивный виджет Яндекс.Карт с метками */
export function mapViewForMarkers(
  markers: Array<{ coords: [number, number]; style?: string }>,
  fallbackZoom = 16,
): { center: [number, number]; zoom: number } {
  if (markers.length === 0) {
    return { center: [44.540511, 43.187266], zoom: fallbackZoom };
  }
  if (markers.length === 1) {
    return { center: markers[0].coords, zoom: fallbackZoom };
  }

  const lons = markers.map((m) => m.coords[0]);
  const lats = markers.map((m) => m.coords[1]);
  const center: [number, number] = [
    (Math.min(...lons) + Math.max(...lons)) / 2,
    (Math.min(...lats) + Math.max(...lats)) / 2,
  ];
  const span = Math.max(
    Math.max(...lons) - Math.min(...lons),
    Math.max(...lats) - Math.min(...lats),
  );

  let zoom = fallbackZoom;
  if (span > 0.12) zoom = 11;
  else if (span > 0.08) zoom = 12;
  else if (span > 0.05) zoom = 13;
  else if (span > 0.03) zoom = 14;
  else if (span > 0.015) zoom = 15;

  return { center, zoom: Math.min(fallbackZoom, zoom) };
}

/** Интерактивный виджет Яндекс.Карт с метками */
export function yandexEmbedUrl(options: {
  coords?: [number, number];
  markers?: Array<{ coords: [number, number]; style?: string }>;
  zoom?: number;
}): string {
  const markers = options.markers?.length
    ? options.markers
    : options.coords
      ? [{ coords: options.coords, style: "pm2" }]
      : [];

  if (markers.length === 0) {
    return "https://yandex.ru/map-widget/v1/?l=map&lang=ru_RU";
  }

  const view =
    markers.length > 1
      ? mapViewForMarkers(markers, options.zoom ?? 16)
      : {
          center: options.coords ?? markers[0].coords,
          zoom: options.zoom ?? 16,
        };

  const [lon, lat] = view.center;
  const pt = markers
    .map((m) => `${m.coords[0]},${m.coords[1]},${m.style ?? "pm2"}`)
    .join("~");

  const params = new URLSearchParams({
    ll: `${lon},${lat}`,
    z: String(view.zoom),
    pt,
    l: "map",
    lang: "ru_RU",
  });
  return `https://yandex.ru/map-widget/v1/?${params.toString()}`;
}
