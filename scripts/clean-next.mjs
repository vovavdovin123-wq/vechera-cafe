import { rmSync } from "fs";
import { join } from "path";

const targets = [".next", join("node_modules", ".cache")];

for (const dir of targets) {
  try {
    rmSync(dir, { recursive: true, force: true });
    console.log(`Removed ${dir}`);
  } catch (error) {
    console.warn(`Could not remove ${dir}:`, error);
  }
}
