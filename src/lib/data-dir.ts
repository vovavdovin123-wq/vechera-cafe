import { existsSync } from "fs";
import path from "path";

export function vecheraDataDir() {
  const fromEnv = process.env.VECHERA_DATA_DIR?.trim();
  if (fromEnv) return fromEnv;
  const prod = "/var/www/vechera-cafe/data";
  if (existsSync("/var/www/vechera-cafe")) return prod;
  return path.join(process.cwd(), "data");
}
