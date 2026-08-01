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

  const center =
    options.coords ??
    (() => {
      const lon =
        markers.reduce((s, m) => s + m.coords[0], 0) / markers.length;
      const lat =
        markers.reduce((s, m) => s + m.coords[1], 0) / markers.length;
      return [lon, lat] as [number, number];
    })();

  const [lon, lat] = center;
  const pt = markers
    .map((m) => `${m.coords[0]},${m.coords[1]},${m.style ?? "pm2"}`)
    .join("~");

  const params = new URLSearchParams({
    ll: `${lon},${lat}`,
    z: String(options.zoom ?? 16),
    pt,
    l: "map",
    lang: "ru_RU",
  });
  return `https://yandex.ru/map-widget/v1/?${params.toString()}`;
}
