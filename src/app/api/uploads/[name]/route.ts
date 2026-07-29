import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { getUploadsDirs } from "@/lib/content-store";

const MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
};

type Ctx = { params: Promise<{ name: string }> };

export async function GET(_request: Request, context: Ctx) {
  const { name } = await context.params;

  // Только имя файла, без path traversal
  if (!name || name.includes("..") || name.includes("/") || name.includes("\\")) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  if (!/^[\w.-]+$/.test(name)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const { uploadsDir, legacyUploadsDir } = getUploadsDirs();
  const candidates = [
    path.join(uploadsDir, name),
    path.join(legacyUploadsDir, name),
  ];

  for (const filePath of candidates) {
    try {
      const data = await fs.readFile(filePath);
      const ext = path.extname(name).slice(1).toLowerCase();
      const type = MIME[ext] || "application/octet-stream";
      return new NextResponse(data, {
        status: 200,
        headers: {
          "Content-Type": type,
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    } catch {
      /* try next */
    }
  }

  return NextResponse.json({ ok: false, message: "Not found" }, { status: 404 });
}
