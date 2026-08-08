import { copyFile, mkdir } from "fs/promises";
import { readFile, writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const PHOTO_DIR = path.join("C:", "Users", "vovav", "Desktop", "photovechera");
const MENU_DIR = path.join(ROOT, "public", "menu");
const MENUS_FILE = path.join(ROOT, "data", "menus.json");

/** Имя файла (без расширения) → названия блюд в menus.json */
const FILE_TO_MENU_NAMES = {
  баварский: ["Баварский"],
  брейрутбургер: ["Бейрут"],
  вафлябананнутелла: ["Вафли с бананом"],
  гамбургерклассический: ["Чизбургер"],
  двойнойсендвичсговядиной: ["Двойной Сендвич с говядиной", "Сендвич двойной с говядиной"],
  двойнойсендвичскурицей: ["Двойной Сендвич с курицей", "Двойной сендвич с курицей"],
  жаренныйролл: ["Креветка темпура"],
  запеченнаяфиладельфия: ["Запеченная Филадельфия"],
  запеченныйролл: ["Запеченный с лососем"],
  запечсенныероллы2: ["Запеченный с крабом"],
  картошкафри: ["Картошка фри"],
  лимонад: ["Махито"],
  лимонад2: ["Арбуз", "Базилик Арбуз"],
  нагетсы: ["Наггетсы"],
  онигири: ["Жаренный лосось"],
  панини: ["Панини с курицей"],
  салат: ["Греческий"],
  салатцезарь: ["Цезарь с курицей"],
  сендвичсговядиной: ["Сендвич говяжий", "Сендвич с говядиной"],
  стрипсы: ["Стрипсы"],
  филадельфия: ["Филадельфия"],
  чикенбургер: ["Чикен Бургер"],
  чтотохз: ["Чикен-бокс"],
};

function slugify(key) {
  const map = {
    баварский: "bavarskiy",
    брейрутбургер: "beyrut",
    вафлябананнутелла: "vaflya-banan",
    гамбургерклассический: "cheeseburger",
    двойнойсендвичсговядиной: "double-beef-sandwich",
    двойнойсендвичскурицей: "double-chicken-sandwich",
    жаренныйролл: "fried-roll-tempura",
    запеченнаяфиладельфия: "baked-philadelphia",
    запеченныйролл: "baked-salmon-roll",
    запечсенныероллы2: "baked-crab-roll",
    картошкафри: "fries",
    лимонад: "lemonade",
    лимонад2: "watermelon-drink",
    нагетсы: "nuggets",
    онигири: "fried-salmon-roll",
    панини: "panini-chicken",
    салат: "greek-salad",
    салатцезарь: "caesar-chicken",
    сендвичсговядиной: "beef-sandwich",
    стрипсы: "strips",
    филадельфия: "philadelphia",
    чикенбургер: "chicken-burger",
    чтотохз: "chicken-box",
  };
  return map[key] ?? key.replace(/[^a-z0-9-]/gi, "-");
}

async function main() {
  await mkdir(MENU_DIR, { recursive: true });

  const menus = JSON.parse(await readFile(MENUS_FILE, "utf8"));
  const nameToImage = new Map();

  for (const [fileKey, menuNames] of Object.entries(FILE_TO_MENU_NAMES)) {
    const src = path.join(PHOTO_DIR, `${fileKey}.png`);
    const destName = `${slugify(fileKey)}.png`;
    const dest = path.join(MENU_DIR, destName);
    const publicPath = `/menu/${destName}`;

    await copyFile(src, dest);
    for (const name of menuNames) {
      nameToImage.set(name, publicPath);
    }
    console.log(`✓ ${fileKey}.png → ${publicPath} (${menuNames.join(", ")})`);
  }

  let updated = 0;
  for (const franchiseId of Object.keys(menus)) {
    for (const item of menus[franchiseId]) {
      const image = nameToImage.get(item.name);
      if (image) {
        item.image = image;
        updated++;
      }
    }
  }

  await writeFile(MENUS_FILE, JSON.stringify(menus, null, 2) + "\n", "utf8");
  console.log(`\nОбновлено позиций: ${updated}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
