"""Generate web logo assets from the official THARAGAI READYMATES source JPG.

Source (repo-relative): apps/web/public/branding-source.jpg
Synced from apps/mobile/assets/branding/app-icon-source.jpg by mobile branding script.

- logo-full / logo.png: true RGBA (black + white plate knocked out)
- marks / favicons / apple / icon-192: white opaque plates (no black corners)
- og-image: full lockup on ink (#070000) for contrast
"""
from __future__ import annotations

import shutil
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ROOT / "public"
PORTABLE_SOURCE = PUBLIC / "branding-source.jpg"
MOBILE_SOURCE = ROOT.parent / "mobile" / "assets" / "branding" / "app-icon-source.jpg"

WHITE = (255, 255, 255, 255)
INK = (7, 0, 0, 255)
BLACK_LUMA = 40
WHITE_LUMA = 235
MARK_1X = 512
MARK_2X = 1024
FULL_1X = 1024
FULL_2X = 2048
BRASS = (235, 200, 120, 255)


def _luma(r: int, g: int, b: int) -> float:
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def _load_source() -> Image.Image:
    if PORTABLE_SOURCE.exists():
        return Image.open(PORTABLE_SOURCE).convert("RGBA")
    if MOBILE_SOURCE.exists():
        shutil.copy2(MOBILE_SOURCE, PORTABLE_SOURCE)
        return Image.open(PORTABLE_SOURCE).convert("RGBA")
    raise FileNotFoundError(
        f"missing logo source: tried {PORTABLE_SOURCE} and {MOBILE_SOURCE}"
    )


def _fill_black_corners(img: Image.Image, threshold: int = BLACK_LUMA) -> Image.Image:
    out = img.convert("RGBA")
    w, h = out.size
    px = out.load()
    visited = set()
    stack: list[tuple[int, int]] = []
    for seed in ((0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)):
        r, g, b, a = px[seed]
        if a > 0 and _luma(r, g, b) <= threshold:
            stack.append(seed)
    while stack:
        x, y = stack.pop()
        if (x, y) in visited or x < 0 or y < 0 or x >= w or y >= h:
            continue
        r, g, b, a = px[x, y]
        if a == 0 or _luma(r, g, b) > threshold:
            continue
        visited.add((x, y))
        px[x, y] = WHITE
        stack.extend(((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)))
    return out


def _fit_on_color(
    img: Image.Image,
    size: tuple[int, int],
    color: tuple[int, int, int, int],
    scale: float = 0.86,
) -> Image.Image:
    canvas = Image.new("RGBA", size, color)
    copy = img.copy()
    copy.thumbnail((int(size[0] * scale), int(size[1] * scale)), Image.Resampling.LANCZOS)
    x = (size[0] - copy.width) // 2
    y = (size[1] - copy.height) // 2
    canvas.paste(copy, (x, y), copy)
    return canvas


def _crop_mark(img: Image.Image) -> Image.Image:
    iw, ih = img.size
    top = int(ih * 0.02)
    bottom = int(ih * 0.48)
    band = img.crop((0, top, iw, bottom))
    bw, bh = band.size
    side = min(bw, bh)
    left = (bw - side) // 2
    return band.crop((left, 0, left + side, side))


def _resize_long_edge(img: Image.Image, long_edge: int) -> Image.Image:
    w, h = img.size
    scale = long_edge / max(w, h)
    return img.resize((max(1, int(w * scale)), max(1, int(h * scale))), Image.Resampling.LANCZOS)


def _is_gold(r: int, g: int, b: int, a: int) -> bool:
    return a > 200 and g > 105 and r > 145 and b < 125 and g > b + 25


def _brighten_readymates_band(img: Image.Image) -> Image.Image:
    out = img.convert("RGBA")
    px = out.load()
    w, h = out.size
    y_start, y_end = int(h * 0.55), int(h * 0.78)
    bar_ys: list[int] = []
    for y in range(y_start, y_end):
        gc = sum(
            1
            for x in range(int(w * 0.15), int(w * 0.85))
            if _is_gold(*px[x, y])
        )
        if gc > w * 0.12:
            bar_ys.append(y)
    upper = bar_ys[0] if bar_ys else -1
    lower = next((y for y in bar_ys[1:] if y > upper + 8), -1)
    rows = (
        range(upper + 1, lower)
        if upper > 0 and lower > upper + 6 and (lower - upper) < h * 0.12
        else range(int(h * 0.62), int(h * 0.72))
    )
    for y in rows:
        for x in range(int(w * 0.18), int(w * 0.82)):
            r, g, b, a = px[x, y]
            if a < 8 or _is_gold(r, g, b, a):
                continue
            if r > 130 and r > g + 45 and r > b + 45:
                continue
            if _luma(r, g, b) < 200:
                px[x, y] = BRASS
    return out


def _knock_out_plate(img: Image.Image) -> Image.Image:
    out = img.convert("RGBA")
    px = out.load()
    w, h = out.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            luma = _luma(r, g, b)
            if r <= 28 and g <= 28 and b <= 28:
                px[x, y] = (0, 0, 0, 0)
                continue
            if luma >= WHITE_LUMA and abs(r - g) < 25 and abs(g - b) < 25:
                if not (r > 150 and r > g + 30):
                    px[x, y] = (0, 0, 0, 0)
    return out


def _prepare_full_lockup(source: Image.Image, long_edge: int) -> Image.Image:
    cleaned = _fill_black_corners(source)
    resized = _resize_long_edge(cleaned, long_edge)
    brightened = _brighten_readymates_band(resized)
    return _knock_out_plate(brightened)


def _save_png_rgba(img: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    rgba = img.convert("RGBA")
    rgba.save(path, "PNG", optimize=True)
    print(f"wrote {path} ({path.stat().st_size} bytes, {rgba.size[0]}x{rgba.size[1]}, RGBA)")


def _save_png_rgb(img: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    rgb = img.convert("RGB")
    rgb.save(path, "PNG", optimize=True)
    print(f"wrote {path} ({path.stat().st_size} bytes, {rgb.size[0]}x{rgb.size[1]}, RGB)")


def main() -> None:
    # Prefer syncing from mobile official source when present
    if MOBILE_SOURCE.exists():
        shutil.copy2(MOBILE_SOURCE, PORTABLE_SOURCE)
        print(f"synced {PORTABLE_SOURCE} from mobile")

    source = _load_source()
    source.convert("RGB").save(PORTABLE_SOURCE, "JPEG", quality=95, optimize=True)

    cleaned = _fill_black_corners(source)

    full_1x = _prepare_full_lockup(source, FULL_1X)
    full_2x = _prepare_full_lockup(source, FULL_2X)
    _save_png_rgba(full_1x, PUBLIC / "logo-full.png")
    _save_png_rgba(full_2x, PUBLIC / "logo-full@2x.png")
    _save_png_rgba(full_1x, PUBLIC / "logo.png")

    mark = _crop_mark(cleaned)
    # White plates for marks/favicons (no black corners)
    mark_1x = _fit_on_color(mark, (MARK_1X, MARK_1X), WHITE, scale=0.92)
    mark_2x = _fit_on_color(mark, (MARK_2X, MARK_2X), WHITE, scale=0.92)
    _save_png_rgb(mark_1x, PUBLIC / "logo-mark.png")
    _save_png_rgb(mark_2x, PUBLIC / "logo-mark@2x.png")

    fav16 = _fit_on_color(mark, (16, 16), WHITE, scale=0.95)
    fav32 = _fit_on_color(mark, (32, 32), WHITE, scale=0.95)
    _save_png_rgb(fav16, PUBLIC / "favicon-16.png")
    _save_png_rgb(fav32, PUBLIC / "favicon-32.png")
    Image.open(PUBLIC / "favicon-32.png").convert("RGBA").save(
        PUBLIC / "favicon.ico",
        format="ICO",
        sizes=[(16, 16), (32, 32)],
    )
    print(f"wrote {PUBLIC / 'favicon.ico'}")

    _save_png_rgb(_fit_on_color(mark, (192, 192), WHITE, scale=0.9), PUBLIC / "icon-192.png")
    _save_png_rgb(_fit_on_color(mark, (180, 180), WHITE, scale=0.9), PUBLIC / "apple-touch-icon.png")

    # OG: full lockup on ink for social contrast
    og = _fit_on_color(cleaned, (1200, 630), INK, scale=0.78)
    _save_png_rgb(og, PUBLIC / "og-image.png")
    print(f"full aspect: {full_1x.size[0]}/{full_1x.size[1]}")
    print("web branding complete")


if __name__ == "__main__":
    main()
