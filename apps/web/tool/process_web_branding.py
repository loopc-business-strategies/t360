"""Generate crisp web logo assets from the designer source PNG."""
from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ROOT / "public"
MOBILE_LOGO = ROOT.parent / "mobile" / "assets" / "branding" / "tharagai_logo.png"
CURSOR_UPLOAD = Path(
    r"C:\Users\USER\.cursor\projects\c-Users-USER-Desktop-t360\assets"
    r"\c__Users_USER_AppData_Roaming_Cursor_User_workspaceStorage_8323a401266c71e73997a3e0239e9d48_images_tharagai_logo-da96befa-b071-420b-b0c8-c07512eb7808.png"
)

MARK_1X = 512
MARK_2X = 1024
FULL_1X = 1024
FULL_2X = 2048


def _load_source() -> Image.Image:
    for path in (MOBILE_LOGO, CURSOR_UPLOAD):
        if path.exists():
            return Image.open(path).convert("RGBA")
    raise FileNotFoundError("designer logo not found; expected mobile tharagai_logo.png")


def _make_transparent(img: Image.Image, threshold: int = 245) -> Image.Image:
    rgba = img.convert("RGBA")
    pixels = rgba.load()
    width, height = rgba.size
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            if r >= threshold and g >= threshold and b >= threshold:
                pixels[x, y] = (r, g, b, 0)
    return rgba


def _crop_mark(img: Image.Image) -> Image.Image:
    iw, ih = img.size
    top = int(ih * 0.02)
    bottom = int(ih * 0.72)
    left = int(iw * 0.08)
    right = int(iw * 0.92)
    return img.crop((left, top, right, bottom))


def _resize(img: Image.Image, max_side: int) -> Image.Image:
    copy = img.copy()
    copy.thumbnail((max_side, max_side), Image.Resampling.LANCZOS)
    return copy


def _save_png(img: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path, "PNG", optimize=True)
    print(f"wrote {path} ({path.stat().st_size} bytes, {img.size[0]}x{img.size[1]})")


def main() -> None:
    source = _load_source()
    transparent_full = _make_transparent(source)
    mark = _crop_mark(transparent_full)

    _save_png(_resize(mark, MARK_1X), PUBLIC / "logo-mark.png")
    _save_png(_resize(mark, MARK_2X), PUBLIC / "logo-mark@2x.png")
    _save_png(_resize(transparent_full, FULL_1X), PUBLIC / "logo-full-transparent.png")
    _save_png(_resize(transparent_full, FULL_2X), PUBLIC / "logo-full-transparent@2x.png")
    _save_png(_resize(transparent_full, FULL_1X), PUBLIC / "logo.png")
    print("web branding complete")


if __name__ == "__main__":
    main()
