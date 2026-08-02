import { NextResponse } from "next/server";
import { FRANCHISES } from "@/lib/franchises";
import type { FranchiseId } from "@/lib/types";

const BESLAN_VIEWBOX = "44.48,43.22,44.60,43.16";

async function geocodeYandex(
  query: string,
  apiKey?: string,
): Promise<[number, number] | null> {
  const url = new URL("https://geocode-maps.yandex.ru/1.x/");
  url.searchParams.set("format", "json");
  url.searchParams.set("geocode", query);
  url.searchParams.set("results", "1");
  if (apiKey) url.searchParams.set("apikey", apiKey);

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) return null;

  const data = (await res.json()) as {
    response?: {
      GeoObjectCollection?: {
        featureMember?: Array<{
          GeoObject?: { Point?: { pos?: string } };
        }>;
      };
    };
  };

  const pos =
    data.response?.GeoObjectCollection?.featureMember?.[0]?.GeoObject?.Point
      ?.pos;
  if (!pos) return null;

  const [lon, lat] = pos.split(" ").map(Number);
  if (!Number.isFinite(lon) || !Number.isFinite(lat)) return null;
  return [lon, lat];
}

async function geocodeNominatim(query: string): Promise<[number, number] | null> {
  async function search(params: Record<string, string>) {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", query);
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "1");
    url.searchParams.set("countrycodes", "ru");
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }

    const res = await fetch(url.toString(), {
      cache: "no-store",
      headers: {
        "User-Agent": "vechera-cafe.ru geocode/1.0",
        Accept: "application/json",
      },
    });
    if (!res.ok) return null;

    const data = (await res.json()) as Array<{ lon?: string; lat?: string }>;
    const hit = data[0];
    if (!hit?.lon || !hit?.lat) return null;

    const lon = Number(hit.lon);
    const lat = Number(hit.lat);
    if (!Number.isFinite(lon) || !Number.isFinite(lat)) return null;
    return [lon, lat] as [number, number];
  }

  return (
    (await search({ viewbox: BESLAN_VIEWBOX })) ??
    (await search({}))
  );
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address")?.trim();
  const franchiseId = searchParams.get("franchiseId") as FranchiseId | null;

  if (!address || address.length < 3) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const franchise = franchiseId ? FRANCHISES[franchiseId] : FRANCHISES.center;
  const query = `Беслан, ${address}`;
  const apiKey = process.env.YANDEX_GEOCODER_API_KEY;

  try {
    let coords =
      apiKey ? await geocodeYandex(query, apiKey) : null;

    if (!coords) {
      coords = await geocodeNominatim(query);
    }

    if (!coords) {
      return NextResponse.json({ ok: false, message: "Адрес не найден" });
    }

    return NextResponse.json({
      ok: true,
      coords,
      center: franchise.coords,
    });
  } catch (error) {
    console.error("[api/geocode]", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
