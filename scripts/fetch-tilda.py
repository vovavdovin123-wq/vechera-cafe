import io
import re
import shutil
import urllib.request
import zipfile
from pathlib import Path

UA = {"User-Agent": "Mozilla/5.0"}
ROOT = Path(__file__).resolve().parents[1]
fonts = ROOT / "public" / "fonts"
fonts.mkdir(parents=True, exist_ok=True)

src = fonts / "cramaten-src" / "Cramaten.otf"
if src.exists():
    shutil.copy(src, fonts / "Cramaten.otf")
    print("Cramaten ready", (fonts / "Cramaten.otf").stat().st_size)

html = urllib.request.urlopen(
    urllib.request.Request("https://tilda.cc/lp/tildasans/", headers=UA),
    timeout=60,
).read().decode("utf-8", "replace")

urls = set(re.findall(r"https?://[^\s\"']+\.(?:zip|woff2|woff|ttf|otf)", html, re.I))
urls |= set(re.findall(r"[\"'](/[^\s\"']+\.(?:zip|woff2|woff|ttf))[\"']", html, re.I))
for attr in re.findall(r"(?:href|src|data-url|data-download)=[\"']([^\"']+)[\"']", html):
    if any(x in attr.lower() for x in ["font", "tilda", "sans", "woff", "zip", "ttf"]):
        urls.add(attr)

print("candidates:")
for u in sorted(urls):
    print(" ", u[:220])

# Known public mirrors / archives
extra = [
    "https://download.tildacdn.com/tildasans/TildaSans.zip",
    "https://static.tildacdn.com/tildasans/TildaSans.zip",
    "https://tilda.ws/files/tildasans.zip",
]
for u in extra:
    try:
        req = urllib.request.Request(u, headers=UA)
        data = urllib.request.urlopen(req, timeout=30).read()
        print("GOT", u, len(data))
        if u.endswith(".zip") and len(data) > 1000:
            z = zipfile.ZipFile(io.BytesIO(data))
            print(z.namelist()[:20])
            z.extractall(fonts / "tildasans-src")
            break
        dest = fonts / Path(u).name
        dest.write_bytes(data)
    except Exception as e:
        print("FAIL", u, e)

# Fallback: Manrope VF from jsDelivr google fonts
manrope = "https://cdn.jsdelivr.net/fontsource/fonts/manrope@latest/latin-cyrillic-wght-normal.woff2"
try:
    # try fontshare / bunny
    for u, name in [
        (
            "https://api.fontshare.com/v2/css?f[]=satoshi@300,400,500,700&display=swap",
            None,
        ),
        (
            "https://github.com/googlefonts/manrope/raw/main/fonts/variable/Manrope[wght].ttf",
            "Manrope[wght].ttf",
        ),
    ]:
        if name is None:
            continue
        req = urllib.request.Request(u, headers={**UA, "Accept": "*/*"})
        data = urllib.request.urlopen(req, timeout=30).read()
        (fonts / name).write_bytes(data)
        print("fallback", name, len(data))
except Exception as e:
    print("manrope fail", e)

# List fonts dir
for p in fonts.rglob("*"):
    if p.is_file():
        print(p.relative_to(fonts), p.stat().st_size)
