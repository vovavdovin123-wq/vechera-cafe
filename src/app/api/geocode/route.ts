import { NextResponse } from "next/server";
import { FRANCHISES } from "@/lib/franchises";
import type { FranchiseId } from "@/lib/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address")?.trim();
  const franchiseId = searchParams.get("franchiseId") as FranchiseId | null;

  if (!address || address.length < 3) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const franchise = franchiseId ? FRANCHISES[franchiseId] : FRANCHISES.center;
  const query = `Беслан, ${address}, Республика Северная Осетия`;
  const apiKey = process.env.YANDEX_GEOCODER_API_KEY;
  const url = new URL("https://geocode-maps.yandex.ru/1.x/");
  url.searchParams.set("format", "json");
  url.searchParams.set("geocode", query);
  url.searchParams.set("results", "1");
  if (apiKey) url.searchParams.set("apikey", apiKey);

  try {
    const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
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

    if (!pos) {
      return NextResponse.json({ ok: false, message: "Адрес не найден" });
    }

    const [lon, lat] = pos.split(" ").map(Number);
    if (!Number.isFinite(lon) || !Number.isFinite(lat)) {
      return NextResponse.json({ ok: false, message: "Адрес не найден" });
    }

    return NextResponse.json({
      ok: true,
      coords: [lon, lat] as [number, number],
      center: franchise.coords,
    });
  } catch (error) {
    console.error("[api/geocode]", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
