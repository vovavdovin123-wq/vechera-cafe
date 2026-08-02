import { NextResponse } from "next/server";
import { verifyFrontPadSecret } from "@/lib/frontpad";
import {
  readFrontPadAccountsPublic,
  saveFrontPadSecret,
} from "@/lib/frontpad-accounts-store";
import { isAdminSession } from "@/lib/require-admin";
import type { FranchiseId } from "@/lib/types";

export async function GET() {
  if (!(await isAdminSession())) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const accounts = await readFrontPadAccountsPublic();

  return NextResponse.json({
    ok: true,
    accounts,
    dualAccounts:
      accounts.find((a) => a.franchiseId === "center")?.configured &&
      accounts.find((a) => a.franchiseId === "hippodrome")?.configured,
  });
}

export async function PUT(request: Request) {
  if (!(await isAdminSession())) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      franchiseId?: string;
      secret?: string;
      test?: boolean;
    };

    const franchiseId = body.franchiseId;
    if (franchiseId !== "center" && franchiseId !== "hippodrome") {
      return NextResponse.json(
        { ok: false, message: "Укажите franchiseId: center или hippodrome" },
        { status: 400 },
      );
    }

    const secret = String(body.secret ?? "").trim();
    if (!secret) {
      return NextResponse.json(
        { ok: false, message: "Введите секрет FrontPad" },
        { status: 400 },
      );
    }

    const check = await verifyFrontPadSecret(secret);
    if (!check.ok) {
      return NextResponse.json(
        { ok: false, message: check.message },
        { status: 400 },
      );
    }

    await saveFrontPadSecret(franchiseId as FranchiseId, secret);
    const accounts = await readFrontPadAccountsPublic();

    return NextResponse.json({
      ok: true,
      message: "Аккаунт FrontPad сохранён и проверен",
      accounts,
    });
  } catch (error) {
    console.error("[api/admin/frontpad]", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!(await isAdminSession())) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const franchiseId = new URL(request.url).searchParams.get("franchiseId");
  if (franchiseId !== "center" && franchiseId !== "hippodrome") {
    return NextResponse.json(
      { ok: false, message: "Укажите franchiseId" },
      { status: 400 },
    );
  }

  await saveFrontPadSecret(franchiseId, "");
  const accounts = await readFrontPadAccountsPublic();
  return NextResponse.json({ ok: true, accounts });
}
