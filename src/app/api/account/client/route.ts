import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  parseUserSessionToken,
  USER_COOKIE_NAME,
} from "@/lib/user-auth";
import { fetchFrontPadClient } from "@/lib/frontpad";
import type { FranchiseId } from "@/lib/types";

function formatAddress(client: {
  street?: string;
  home?: string;
  pod?: string;
  et?: string;
  apart?: string;
}): string | undefined {
  const parts: string[] = [];
  if (client.street) {
    parts.push(
      [client.street, client.home].filter(Boolean).join(", дом "),
    );
  }
  if (client.apart) parts.push(`кв. ${client.apart}`);
  if (client.et) parts.push(`эт. ${client.et}`);
  if (client.pod) parts.push(`подъезд ${client.pod}`);
  return parts.length ? parts.join(", ") : undefined;
}

export async function GET(request: Request) {
  const jar = await cookies();
  const session = parseUserSessionToken(jar.get(USER_COOKIE_NAME)?.value);

  if (!session) {
    return NextResponse.json({ ok: false, message: "Войдите в кабинет" }, { status: 401 });
  }

  const rawFranchise = new URL(request.url).searchParams.get("franchiseId");
  const franchiseIds: FranchiseId[] =
    rawFranchise === "center" || rawFranchise === "hippodrome"
      ? [rawFranchise]
      : ["center", "hippodrome"];

  for (const franchiseId of franchiseIds) {
    const result = await fetchFrontPadClient(session.phone, franchiseId);
    if (!result.ok || !result.client) continue;

    const c = result.client;
    const address = formatAddress(c);

    return NextResponse.json({
      ok: true,
      franchiseId,
      client: {
        name: c.name,
        address,
        street: c.street,
        home: c.home,
        apart: c.apart,
        sale: c.sale,
        score: c.score,
      },
    });
  }

  return NextResponse.json({
    ok: true,
    client: null,
    message: "Адрес появится после первого заказа с доставкой",
  });
}
