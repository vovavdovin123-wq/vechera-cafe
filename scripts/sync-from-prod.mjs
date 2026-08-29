#!/usr/bin/env node
/**
 * Скачивает контент и загрузки с production (vechera-cafe.ru) в data/
 * Usage: node scripts/sync-from-prod.mjs [--base=https://vechera-cafe.ru]
 */
import { mkdir, writeFile, readFile, access } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const DATA = path.join(ROOT, "data");
const UPLOADS = path.join(DATA, "uploads");

const baseArg = process.argv.find((a) => a.startsWith("--base="));
const BASE = (baseArg?.slice("--base=".length) || "https://vechera-cafe.ru").replace(
  /\/$/,
  "",
);

const PUBLIC_ENDPOINTS = {
  "menus.json": "/api/content/menus",
  "menu-categories.json": "/api/content/menu-categories",
  "promos.json": "/api/content/promos",
  "interior.json": "/api/content/interior",
};

function collectUploadPaths(value, out = new Set()) {
  if (typeof value === "string") {
    const m = value.match(/^\/api\/uploads\/([^\/?#]+)$/);
    if (m) out.add(m[1]);
    return out;
  }
  if (Array.isArray(value)) {
    for (const item of value) collectUploadPaths(item, out);
    return out;
  }
  if (value && typeof value === "object") {
    for (const v of Object.values(value)) collectUploadPaths(v, out);
  }
  return out;
}

async function fetchJson(url, init) {
  const res = await fetch(url, init);
  if (!res.ok) {
    throw new Error(`${url} → HTTP ${res.status}`);
  }
  return res.json();
}

async function loginAdmin() {
  const login = process.env.ADMIN_LOGIN?.trim();
  const password = process.env.ADMIN_PASSWORD?.trim();
  if (!login || !password) return null;

  const res = await fetch(`${BASE}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ login, password }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.ok) return null;

  const setCookie = res.headers.getSetCookie?.() ?? [];
  const legacy = res.headers.get("set-cookie");
  const cookies = setCookie.length ? setCookie : legacy ? [legacy] : [];
  const session = cookies.find((c) => c.startsWith("vechera_admin="));
  if (!session) return null;
  return session.split(";")[0];
}

async function downloadUploads(names) {
  await mkdir(UPLOADS, { recursive: true });
  let ok = 0;
  let skip = 0;
  let fail = 0;

  for (const name of [...names].sort()) {
    const dest = path.join(UPLOADS, name);
    try {
      await access(dest);
      skip++;
      continue;
    } catch {
      /* download */
    }

    try {
      const res = await fetch(`${BASE}/api/uploads/${encodeURIComponent(name)}`);
      if (!res.ok) {
        console.warn(`  ✗ upload ${name}: HTTP ${res.status}`);
        fail++;
        continue;
      }
      const buf = Buffer.from(await res.arrayBuffer());
      await writeFile(dest, buf);
      ok++;
    } catch (err) {
      console.warn(`  ✗ upload ${name}:`, err.message);
      fail++;
    }
  }

  return { ok, skip, fail };
}

async function main() {
  console.log(`→ Sync from ${BASE}`);
  await mkdir(DATA, { recursive: true });

  const allUploads = new Set();

  for (const [file, endpoint] of Object.entries(PUBLIC_ENDPOINTS)) {
    const url = `${BASE}${endpoint}`;
    process.stdout.write(`→ ${endpoint} … `);
    const json = await fetchJson(url);
    if (!json.ok || json.data === undefined) {
      throw new Error(`${endpoint}: bad response`);
    }
    const out = path.join(DATA, file);
    await writeFile(out, `${JSON.stringify(json.data, null, 2)}\n`, "utf8");
    collectUploadPaths(json.data, allUploads);
    console.log(`✓ ${file}`);
  }

  const cookie = await loginAdmin();
  if (cookie) {
    process.stdout.write("→ /api/content/coupons (admin) … ");
    try {
      const json = await fetchJson(`${BASE}/api/content/coupons`, {
        headers: { Cookie: cookie },
      });
      if (json.ok && Array.isArray(json.items)) {
        await writeFile(
          path.join(DATA, "coupons.json"),
          `${JSON.stringify(json.items, null, 2)}\n`,
          "utf8",
        );
        collectUploadPaths(json.items, allUploads);
        console.log(`✓ coupons.json (${json.items.length})`);
      } else {
        console.log("skip (bad payload)");
      }
    } catch (err) {
      console.log(`skip (${err.message})`);
    }
  } else {
    console.log("→ coupons: пропуск (нет ADMIN_LOGIN/ADMIN_PASSWORD в env или неверный пароль на проде)");
  }

  console.log(`→ uploads: ${allUploads.size} файлов в JSON`);
  const stats = await downloadUploads(allUploads);
  console.log(
    `  ✓ скачано ${stats.ok}, уже были ${stats.skip}, ошибок ${stats.fail}`,
  );

  const menus = JSON.parse(await readFile(path.join(DATA, "menus.json"), "utf8"));
  const center = menus.center?.length ?? 0;
  const hippodrome = menus.hippodrome?.length ?? 0;
  console.log(`\n✓ Готово: center=${center}, hippodrome=${hippodrome}`);
}

main().catch((err) => {
  console.error("Sync failed:", err.message);
  process.exit(1);
});
