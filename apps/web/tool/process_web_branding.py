"""Generate web logo assets from the THARAGAI READYMATES source JPG."""
from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ROOT / "public"
SOURCE = Path(
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
    if not SOURCE.exists():
        raise FileNotFoundError(f"missing logo source: {SOURCE}")
    return Image.open(SOURCE).convert("RGBA")


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
    # Upper band containing the star emblem
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


def _save_png(img: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    rgb = img.convert("RGB") if img.mode == "RGBA" else img
    rgb.save(path, "PNG", optimize=True)
    print(f"wrote {path} ({path.stat().st_size} bytes, {rgb.size[0]}x{rgb.size[1]})")


def main() -> None:
    source = _load_source()
    # Keep a copy in public for reference / future regen
    source.convert("RGB").save(PUBLIC / "branding-source.jpg", "JPEG", quality=95, optimize=True)
    print(f"wrote {PUBLIC / 'branding-source.jpg'}")

    full_1x = _resize_long_edge(source, FULL_1X)
    full_2x = _resize_long_edge(source, FULL_2X)
    _save_png(full_1x, PUBLIC / "logo-full.png")
    _save_png(full_2x, PUBLIC / "logo-full@2x.png")
    _save_png(full_1x, PUBLIC / "logo.png")

    mark = _crop_mark(source)
    mark_1x = _fit_on_black(mark, (MARK_1X, MARK_1X), scale=0.92)
    mark_2x = _fit_on_black(mark, (MARK_2X, MARK_2X), scale=0.92)
    _save_png(mark_1x, PUBLIC / "logo-mark.png")
    _save_png(mark_2x, PUBLIC / "logo-mark@2x.png")

    fav16 = _fit_on_black(mark, (16, 16), scale=0.95)
    fav32 = _fit_on_black(mark, (32, 32), scale=0.95)
    _save_png(fav16, PUBLIC / "favicon-16.png")
    _save_png(fav32, PUBLIC / "favicon-32.png")
    fav16.convert("RGBA").save(
        PUBLIC / "favicon.ico",
        format="ICO",
        sizes=[(16, 16), (32, 32)],
    )
    # Pillow ICO from single image — rewrite with both sizes
    Image.open(PUBLIC / "favicon-32.png").convert("RGBA").save(
        PUBLIC / "favicon.ico",
        format="ICO",
        sizes=[(16, 16), (32, 32)],
    )
    print(f"wrote {PUBLIC / 'favicon.ico'}")

    _save_png(_fit_on_black(mark, (192, 192), scale=0.9), PUBLIC / "icon-192.png")
    _save_png(_fit_on_black(mark, (180, 180), scale=0.9), PUBLIC / "apple-touch-icon.png")

    og = _fit_on_black(source, (1200, 630), scale=0.78)
    _save_png(og, PUBLIC / "og-image.png")
    print(f"full aspect: {full_1x.size[0]}/{full_1x.size[1]}")
    print("web branding complete")


if __name__ == "__main__":
    main()
