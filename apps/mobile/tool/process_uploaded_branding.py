"""Process official THARAGAI READYMATES logo into mobile branding assets.

Source of truth (repo-relative only):
  apps/mobile/assets/branding/app-icon-source.jpg

Outputs:
  - tharagai_icon.png              white 1024x1024 app icon (no black corners)
  - tharagai_logo_transparent.png  true RGBA full lockup (plate knocked out)
  - tharagai_logo.png              full lockup on white (opaque fallback)
  - tharagai_splash_android12.png  white-bg mark for Android 12 splash

Does not redesign the logo. Does not use hard-coded Cursor absolute paths.
Leaves tharagai_splash.png (cinematic) unchanged.
"""
from __future__ import annotations

import shutil
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets" / "branding"
SOURCE = OUT / "app-icon-source.jpg"
WEB_SOURCE = ROOT.parent / "web" / "public" / "branding-source.jpg"

WHITE = (255, 255, 255, 255)
BLACK_LUMA = 40
WHITE_LUMA = 235
ICON_SCALE = 0.88
BRASS = (235, 200, 120, 255)


def _load(path: Path) -> Image.Image:
    if not path.exists():
        raise FileNotFoundError(f"missing logo source: {path}")
    return Image.open(path).convert("RGBA")


def _luma(r: int, g: int, b: int) -> float:
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def _fill_black_corners(img: Image.Image, threshold: int = BLACK_LUMA) -> Image.Image:
    """Flood-fill near-black outer corners to white."""
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
        if (x, y) in visited:
            continue
        if x < 0 or y < 0 or x >= w or y >= h:
            continue
        r, g, b, a = px[x, y]
        if a == 0 or _luma(r, g, b) > threshold:
            continue
        visited.add((x, y))
        px[x, y] = WHITE
        stack.extend(((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)))

    return out


def _fit_on_white(img: Image.Image, size: tuple[int, int], scale: float) -> Image.Image:
    canvas = Image.new("RGBA", size, WHITE)
    copy = img.copy()
    copy.thumbnail((max(1, int(size[0] * scale)), max(1, int(size[1] * scale))), Image.Resampling.LANCZOS)
    x = (size[0] - copy.width) // 2
    y = (size[1] - copy.height) // 2
    canvas.paste(copy, (x, y), copy)
    return canvas


def _is_gold(r: int, g: int, b: int, a: int) -> bool:
    return a > 200 and g > 105 and r > 145 and b < 125 and g > b + 25


def _brighten_readymates(img: Image.Image) -> Image.Image:
    """Force dark READYMATES glyphs to brass so knock-out does not delete them."""
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
    rows = range(upper + 1, lower) if upper > 0 and lower > upper + 6 else range(int(h * 0.62), int(h * 0.72))
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
    """Make near-black AND near-white plate pixels transparent; keep artwork."""
    out = img.convert("RGBA")
    px = out.load()
    w, h = out.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            luma = _luma(r, g, b)
            # Black outer plate
            if r <= 28 and g <= 28 and b <= 28:
                px[x, y] = (0, 0, 0, 0)
                continue
            # White / near-white rounded plate (not gold/red artwork)
            if luma >= WHITE_LUMA and not (r > 150 and r > g + 30):
                if abs(r - g) < 25 and abs(g - b) < 25:
                    px[x, y] = (0, 0, 0, 0)
    return out


def _assert_white_corners(path: Path) -> None:
    img = Image.open(path).convert("RGB")
    w, h = img.size
    assert w == 1024 and h == 1024, f"expected 1024x1024, got {w}x{h}"
    for pt in ((0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)):
        r, g, b = img.getpixel(pt)
        assert r >= 250 and g >= 250 and b >= 250, f"non-white corner at {pt}: {(r, g, b)}"


def _assert_has_alpha(path: Path) -> None:
    img = Image.open(path).convert("RGBA")
    alphas = {px[3] for px in img.getdata()}
    assert any(a < 255 for a in alphas), f"expected transparent pixels in {path}"


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    raw = _load(SOURCE)
    print(f"source {SOURCE}")

    # Sync portable copy for web pipeline
    raw.convert("RGB").save(SOURCE, "JPEG", quality=95, optimize=True)
    if WEB_SOURCE.parent.exists():
        shutil.copy2(SOURCE, WEB_SOURCE)
        print(f"synced {WEB_SOURCE}")

    cleaned = _fill_black_corners(raw)

    # White app icon (full square, no black corners)
    icon = _fit_on_white(cleaned, (1024, 1024), scale=ICON_SCALE).convert("RGB")
    icon_path = OUT / "tharagai_icon.png"
    icon.save(icon_path, "PNG", optimize=True)
    print(f"wrote {icon_path} ({icon_path.stat().st_size} bytes)")
    _assert_white_corners(icon_path)
    print("icon corner check OK")

    android12 = _fit_on_white(cleaned, (512, 512), scale=0.82).convert("RGB")
    a12_path = OUT / "tharagai_splash_android12.png"
    android12.save(a12_path, "PNG", optimize=True)
    print(f"wrote {a12_path} ({a12_path.stat().st_size} bytes)")

    # Opaque white full logo fallback
    logo_white = _fit_on_white(cleaned, (1024, 1024), scale=0.92).convert("RGB")
    logo_path = OUT / "tharagai_logo.png"
    logo_white.save(logo_path, "PNG", optimize=True)
    print(f"wrote {logo_path} ({logo_path.stat().st_size} bytes)")

    # True transparent full lockup for dark UI (app bar)
    brightened = _brighten_readymates(cleaned)
    transparent = _knock_out_plate(brightened)
    # Normalize to 1024 long edge, keep aspect
    tw, th = transparent.size
    scale = 1024 / max(tw, th)
    transparent = transparent.resize(
        (max(1, int(tw * scale)), max(1, int(th * scale))),
        Image.Resampling.LANCZOS,
    )
    transparent_path = OUT / "tharagai_logo_transparent.png"
    transparent.save(transparent_path, "PNG", optimize=True)
    print(f"wrote {transparent_path} ({transparent_path.stat().st_size} bytes, RGBA)")
    _assert_has_alpha(transparent_path)
    print("transparent alpha check OK")
    print("mobile branding complete (cinematic splash unchanged)")


if __name__ == "__main__":
    main()
