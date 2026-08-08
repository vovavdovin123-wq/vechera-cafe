import fs from "fs";

function sampleByCategory(filePath) {
  const html = fs.readFileSync(filePath, "utf8");
  const rows = [...html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)].slice(1);
  const byCat = new Map();

  for (const row of rows) {
    const cells = [...row[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((m) =>
      m[1].replace(/<[^>]+>/g, "").trim(),
    );
    if (cells.length < 5 || !/^\d+$/.test(cells[4])) continue;
    const cat = cells[0];
    if (!byCat.has(cat)) byCat.set(cat, []);
    byCat.get(cat).push(`${cells[4]} ${cells[1]} (${cells[2]}р)`);
  }

  for (const [cat, items] of byCat) {
    console.log(`\n=== ${cat} ===`);
    items.slice(0, 8).forEach((i) => console.log(" ", i));
  }
}

console.log("CENTER");
sampleByCategory("c:/Users/vovav/Downloads/Товары (2).xls");
console.log("\n\nHIPPODROME");
sampleByCategory("c:/Users/vovav/Downloads/Товары (3).xls");
