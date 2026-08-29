"""Generate web logo assets from the THARAGAI READYMATES source JPG."""
from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ROOT / "public"
PORTABLE_SOURCE = PUBLIC / "branding-source.jpg"
# Legacy absolute upload path (fallback only)
LEGACY_SOURCE = Path(
    r"C:\Users\USER\.cursor\projects\c-Users-USER-Desktop-t360\assets"
    r"\c__Users_USER_AppData_Roaming_Cursor_User_workspaceStorage_8323a401266c71e73997a3e0239e9d48_images"
    r"_ChatGPT_Image_Aug_29__2026__11_20_55_AM-b244bd27-b14d-4088-b88d-e7c56aab46a3.jpg"
)

BLACK = (0, 0, 0, 255)
MARK_1X = 512
MARK_2X = 1024
FULL_1X = 1024
FULL_2X = 2048


def _load_source() -> Image.Image:
    if PORTABLE_SOURCE.exists():
        return Image.open(PORTABLE_SOURCE).convert("RGBA")
    if LEGACY_SOURCE.exists():
        return Image.open(LEGACY_SOURCE).convert("RGBA")
    raise FileNotFoundError(
        f"missing logo source: tried {PORTABLE_SOURCE} and {LEGACY_SOURCE}"
    )


def _fit_on_black(img: Image.Image, size: tuple[int, int], scale: float = 0.86) -> Image.Image:
    canvas = Image.new("RGBA", size, BLACK)
    copy = img.copy()
    copy.thumbnail((int(size[0] * scale), int(size[1] * scale)), Image.Resampling.LANCZOS)
    x = (size[0] - copy.width) // 2
    y = (size[1] - copy.height) // 2
    canvas.paste(copy, (x, y), copy)
    return canvas


def _crop_mark(img: Image.Image) -> Image.Image:
    """Square crop focused on the star+T mark (upper-center of the lockup)."""
    iw, ih = img.size
    top = int(ih * 0.02)
    bottom = int(ih * 0.62)
    band = img.crop((0, top, iw, bottom))
    bw, bh = band.size
    side = min(bw, bh)
    left = (bw - side) // 2
    return band.crop((left, 0, left + side, side))


def _resize_long_edge(img: Image.Image, long_edge: int) -> Image.Image:
    w, h = img.size
    scale = long_edge / max(w, h)
    return img.resize((max(1, int(w * scale)), max(1, int(h * scale))), Image.Resampling.LANCZOS)


def _knock_out_black(img: Image.Image, threshold: int = 18) -> Image.Image:
    """Set near-black pixels to fully transparent."""
    out = img.convert("RGBA")
    px = out.load()
    w, h = out.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            if r <= threshold and g <= threshold and b <= threshold:
                px[x, y] = (0, 0, 0, 0)
    return out


def _brighten_readymates_band(img: Image.Image) -> Image.Image:
    """
    READYMATES sits under THARAGAI as near-black type. Remap dark pixels in that
    horizontal band toward brass/gold so the word stays readable on dark footers.
    """
    out = img.convert("RGBA")
    px = out.load()
    w, h = out.size
    y0 = int(h * 0.60)
    y1 = int(h * 0.80)
    brass = (212, 175, 95)
    for y in range(y0, min(y1, h)):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a < 8:
                continue
            luma = 0.2126 * r + 0.7152 * g + 0.0722 * b
            is_strong_red = r > 120 and r > g + 40 and r > b + 40
            is_gold = g > 100 and r > 140 and b < 120
            if is_strong_red or is_gold:
                continue
            if luma < 130:
                t = max(0.75, min(1.0, 1.0 - (luma / 130.0)))
                nr = int(r * (1 - t) + brass[0] * t)
                ng = int(g * (1 - t) + brass[1] * t)
                nb = int(b * (1 - t) + brass[2] * t)
                px[x, y] = (nr, ng, nb, 255)
    return out


def _prepare_full_lockup(source: Image.Image, long_edge: int) -> Image.Image:
    resized = _resize_long_edge(source, long_edge)
    knocked = _knock_out_black(resized)
    return _brighten_readymates_band(knocked)


def _save_png_rgba(img: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    rgba = img.convert("RGBA")
    rgba.save(path, "PNG", optimize=True)
    print(f"wrote {path} ({path.stat().st_size} bytes, {rgba.size[0]}x{rgba.size[1]}, RGBA)")


def _save_png_rgb(img: Image.Image, path: Path) -> None:
    """Marks / favicons stay on opaque black plates."""
    path.parent.mkdir(parents=True, exist_ok=True)
    rgb = img.convert("RGB")
    rgb.save(path, "PNG", optimize=True)
    print(f"wrote {path} ({path.stat().st_size} bytes, {rgb.size[0]}x{rgb.size[1]}, RGB)")


def main() -> None:
    source = _load_source()
    # Keep a portable RGB copy for future regen (do not overwrite if we loaded from it)
    if not PORTABLE_SOURCE.exists() or LEGACY_SOURCE.exists():
        source.convert("RGB").save(PORTABLE_SOURCE, "JPEG", quality=95, optimize=True)
        print(f"wrote {PORTABLE_SOURCE}")

    full_1x = _prepare_full_lockup(source, FULL_1X)
    full_2x = _prepare_full_lockup(source, FULL_2X)
    _save_png_rgba(full_1x, PUBLIC / "logo-full.png")
    _save_png_rgba(full_2x, PUBLIC / "logo-full@2x.png")
    _save_png_rgba(full_1x, PUBLIC / "logo.png")

    mark = _crop_mark(source)
    mark_1x = _fit_on_black(mark, (MARK_1X, MARK_1X), scale=0.92)
    mark_2x = _fit_on_black(mark, (MARK_2X, MARK_2X), scale=0.92)
    _save_png_rgb(mark_1x, PUBLIC / "logo-mark.png")
    _save_png_rgb(mark_2x, PUBLIC / "logo-mark@2x.png")

    fav16 = _fit_on_black(mark, (16, 16), scale=0.95)
    fav32 = _fit_on_black(mark, (32, 32), scale=0.95)
    _save_png_rgb(fav16, PUBLIC / "favicon-16.png")
    _save_png_rgb(fav32, PUBLIC / "favicon-32.png")
    Image.open(PUBLIC / "favicon-32.png").convert("RGBA").save(
        PUBLIC / "favicon.ico",
        format="ICO",
        sizes=[(16, 16), (32, 32)],
    )
    print(f"wrote {PUBLIC / 'favicon.ico'}")

    _save_png_rgb(_fit_on_black(mark, (192, 192), scale=0.9), PUBLIC / "icon-192.png")
    _save_png_rgb(_fit_on_black(mark, (180, 180), scale=0.9), PUBLIC / "apple-touch-icon.png")

    og = _fit_on_black(source, (1200, 630), scale=0.78)
    _save_png_rgb(og, PUBLIC / "og-image.png")
    print(f"full aspect: {full_1x.size[0]}/{full_1x.size[1]}")
    print("web branding complete")


if __name__ == "__main__":
    main()
