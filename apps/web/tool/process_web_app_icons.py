"""Generate web favicon / PWA / header-mark assets from the app icon JPG.

Does not overwrite logo-full / logo.png / og-image (full wordmark).
"""
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageChops

ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ROOT / "public"
APP_ICON_SOURCE = Path(
    r"C:\Users\USER\.cursor\projects\c-Users-USER-Desktop-t360\assets"
    r"\c__Users_USER_AppData_Roaming_Cursor_User_workspaceStorage_8323a401266c71e73997a3e0239e9d48_images"
    r"_ChatGPT_Image_Aug_29__2026__11_39_34_AM-90683553-866c-412b-94e1-58fd5debb180.jpg"
)

BLACK = (0, 0, 0, 255)
MARK_1X = 512
MARK_2X = 1024


def _load() -> Image.Image:
    if not APP_ICON_SOURCE.exists():
        raise FileNotFoundError(f"missing app icon: {APP_ICON_SOURCE}")
    return Image.open(APP_ICON_SOURCE).convert("RGBA")


def _trim_black_letterbox(img: Image.Image, threshold: int = 28) -> Image.Image:
    rgb = img.convert("RGB")
    bg = Image.new("RGB", rgb.size, (0, 0, 0))
    diff = ImageChops.difference(rgb, bg)
    r, g, b = diff.split()
    combined = ImageChops.lighter(ImageChops.lighter(r, g), b)
    mask = combined.point(lambda p: 255 if p > threshold else 0)
    bbox = mask.getbbox()
    if not bbox:
        return img
    pad = 4
    left, top, right, bottom = bbox
    return img.crop(
        (
            max(0, left - pad),
            max(0, top - pad),
            min(img.width, right + pad),
            min(img.height, bottom + pad),
        )
    )


def _fit_on_black(img: Image.Image, size: tuple[int, int], scale: float = 1.0) -> Image.Image:
    canvas = Image.new("RGBA", size, BLACK)
    copy = img.copy()
    copy.thumbnail((max(1, int(size[0] * scale)), max(1, int(size[1] * scale))), Image.Resampling.LANCZOS)
    x = (size[0] - copy.width) // 2
    y = (size[1] - copy.height) // 2
    canvas.paste(copy, (x, y), copy)
    return canvas


def _save_png(img: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    rgb = img.convert("RGB")
    rgb.save(path, "PNG", optimize=True)
    print(f"wrote {path} ({path.stat().st_size} bytes, {rgb.size[0]}x{rgb.size[1]})")


def main() -> None:
    raw = _load()
    trimmed = _trim_black_letterbox(raw)
    side = max(trimmed.size)
    square = Image.new("RGBA", (side, side), BLACK)
    square.paste(trimmed, ((side - trimmed.width) // 2, (side - trimmed.height) // 2), trimmed)

    mark_1x = _fit_on_black(square, (MARK_1X, MARK_1X), scale=1.0)
    mark_2x = _fit_on_black(square, (MARK_2X, MARK_2X), scale=1.0)
    _save_png(mark_1x, PUBLIC / "logo-mark.png")
    _save_png(mark_2x, PUBLIC / "logo-mark@2x.png")

    _save_png(_fit_on_black(square, (16, 16)), PUBLIC / "favicon-16.png")
    _save_png(_fit_on_black(square, (32, 32)), PUBLIC / "favicon-32.png")
    Image.open(PUBLIC / "favicon-32.png").convert("RGBA").save(
        PUBLIC / "favicon.ico",
        format="ICO",
        sizes=[(16, 16), (32, 32)],
    )
    print(f"wrote {PUBLIC / 'favicon.ico'}")

    _save_png(_fit_on_black(square, (192, 192)), PUBLIC / "icon-192.png")
    _save_png(_fit_on_black(square, (180, 180)), PUBLIC / "apple-touch-icon.png")
    print("web app icons complete (logo-full / og-image unchanged)")


if __name__ == "__main__":
    main()
