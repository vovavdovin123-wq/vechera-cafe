import re
import urllib.request
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
fonts = ROOT / "public" / "fonts"
brand = ROOT / "public" / "brand"
fonts.mkdir(parents=True, exist_ok=True)
brand.mkdir(parents=True, exist_ok=True)

UA = {"User-Agent": "Mozilla/5.0"}


def fetch(url: str, dest: Path) -> bool:
    try:
        req = urllib.request.Request(url, headers=UA)
        with urllib.request.urlopen(req, timeout=60) as r:
            dest.write_bytes(r.read())
        print("ok", dest.name, dest.stat().st_size, "from", url)
        return True
    except Exception as e:
        print("fail", url, e)
        return False


# Crameten
html = urllib.request.urlopen(
    urllib.request.Request("https://fontlibrary.org/en/font/cramaten", headers=UA),
    timeout=60,
).read().decode("utf-8", "replace")
for href in re.findall(r'href="([^"]+)"', html):
    if any(x in href.lower() for x in [".otf", ".ttf", ".woff", "zip", "assets/font"]):
        print("fl", href)

for u in [
    "https://fontlibrary.org/assets/fonts/cramaten/0/CramatenRegular.otf",
    "https://fontlibrary.org/assets/fonts/cramaten/CrametenRegular.otf",
    "https://www.1001fonts.com/download/font/cramaten.regular.otf",
    "https://dl.dafont.com/dl/?f=cramaten",
]:
    if fetch(u, fonts / "Cramaten-Regular.otf"):
        break

# Tilda Sans / fallbacks
for u, name in [
    (
        "https://static.tildacdn.one/tildasans/TildaSans-VF.woff2",
        "TildaSans-VF.woff2",
    ),
    (
        "https://static.tildacdn.com/lib/tildasans/TildaSans-VF.woff2",
        "TildaSans-VF.woff2",
    ),
    (
        "https://github.com/google/fonts/raw/main/ofl/manrope/Manrope%5Bwght%5D.ttf",
        "Manrope-VF.ttf",
    ),
]:
    if fetch(u, fonts / name):
        if "Tilda" in name:
            break

full = Image.open(ROOT / "public" / "brandbook" / "brandbook-full.png")
full.crop((120, 380, 700, 720)).save(brand / "logo-preview.png")

for src, dst in [
    ("raw-06.png", "lights-wide.png"),
    ("raw-07.png", "lights-arc.png"),
    ("raw-05.png", "lights-glow.png"),
]:
    Image.open(brand / src).save(brand / dst)
    print("saved", dst)

print("done")
