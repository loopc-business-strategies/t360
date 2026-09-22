"""Generate white-background app icon from repo-relative official logo source.

Source of truth: apps/mobile/assets/branding/app-icon-source.jpg
Does not redesign the artwork — only strips black outer corners and centers
the full THARAGAI READYMATES lockup on a pure white 1024x1024 canvas.
"""
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets" / "branding"
APP_ICON_SOURCE = OUT / "app-icon-source.jpg"

WHITE = (255, 255, 255, 255)
ICON_SCALE = 0.88
BLACK_LUMA = 40


def _load(path: Path) -> Image.Image:
    if not path.exists():
        raise FileNotFoundError(f"missing app icon source: {path}")
    return Image.open(path).convert("RGBA")


def _luma(r: int, g: int, b: int) -> float:
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def _fill_black_corners(img: Image.Image, threshold: int = BLACK_LUMA) -> Image.Image:
    """Flood-fill near-black outer corners to white (keeps logo artwork intact)."""
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


def _fit_on_white(img: Image.Image, size: tuple[int, int], scale: float = ICON_SCALE) -> Image.Image:
    canvas = Image.new("RGBA", size, WHITE)
    copy = img.copy()
    max_w = max(1, int(size[0] * scale))
    max_h = max(1, int(size[1] * scale))
    copy.thumbnail((max_w, max_h), Image.Resampling.LANCZOS)
    x = (size[0] - copy.width) // 2
    y = (size[1] - copy.height) // 2
    canvas.paste(copy, (x, y), copy)
    return canvas


def _assert_white_corners(path: Path) -> None:
    img = Image.open(path).convert("RGB")
    w, h = img.size
    assert w == 1024 and h == 1024, f"expected 1024x1024, got {w}x{h}"
    for pt in ((0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)):
        r, g, b = img.getpixel(pt)
        assert r >= 250 and g >= 250 and b >= 250, f"non-white corner at {pt}: {(r, g, b)}"


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    raw = _load(APP_ICON_SOURCE)
    print(f"source {APP_ICON_SOURCE}")

    cleaned = _fill_black_corners(raw)
    icon = _fit_on_white(cleaned, (1024, 1024), scale=ICON_SCALE).convert("RGB")
    icon_path = OUT / "tharagai_icon.png"
    icon.save(icon_path, "PNG", optimize=True)
    print(f"wrote {icon_path} ({icon_path.stat().st_size} bytes, {icon.size[0]}x{icon.size[1]})")
    _assert_white_corners(icon_path)
    print("corner check OK (all white)")

    android12 = _fit_on_white(cleaned, (512, 512), scale=0.82).convert("RGB")
    android12_path = OUT / "tharagai_splash_android12.png"
    android12.save(android12_path, "PNG", optimize=True)
    print(f"wrote {android12_path} ({android12_path.stat().st_size} bytes)")
    print("app icon processing complete (splash full-screen unchanged)")


if __name__ == "__main__":
    main()
