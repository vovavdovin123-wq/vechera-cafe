import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const { INITIAL_MENUS } = await import(
  pathToFileURL(join(root, "src/lib/menu-data.ts")).href
);

const outDir = join(root, "data");
mkdirSync(outDir, { recursive: true });
writeFileSync(
  join(outDir, "menus.json"),
  `${JSON.stringify(INITIAL_MENUS, null, 2)}\n`,
  "utf8",
);

console.log(
  `menus.json: center ${INITIAL_MENUS.center.length}, hippodrome ${INITIAL_MENUS.hippodrome.length}`,
);
