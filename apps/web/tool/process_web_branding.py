"""Generate crisp web logo assets from the designer source PNG."""
from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ROOT / "public"
MOBILE_LOGO = ROOT.parent / "mobile" / "assets" / "branding" / "tharagai_logo.png"
CURSOR_UPLOADS = [
    Path(
        r"C:\Users\USER\.cursor\projects\c-Users-USER-Desktop-t360\assets"
        r"\c__Users_USER_AppData_Roaming_Cursor_User_workspaceStorage_8323a401266c71e73997a3e0239e9d48_images_image-086ba9f6-c1c8-4d5d-bd22-f94cb70c1b14.png"
    ),
    Path(
        r"C:\Users\USER\.cursor\projects\c-Users-USER-Desktop-t360\assets"
        r"\c__Users_USER_AppData_Roaming_Cursor_User_workspaceStorage_8323a401266c71e73997a3e0239e9d48_images_image-ad5f130b-7f59-4095-9876-b2485ed4b947.png"
    ),
    Path(
        r"C:\Users\USER\.cursor\projects\c-Users-USER-Desktop-t360\assets"
        r"\c__Users_USER_AppData_Roaming_Cursor_User_workspaceStorage_8323a401266c71e73997a3e0239e9d48_images_tharagai_logo-da96befa-b071-420b-b0c8-c07512eb7808.png"
    ),
]

MARK_1X = 512
MARK_2X = 1024
FULL_1X = 1024
FULL_2X = 2048


def _load_source() -> Image.Image:
    candidates = [*CURSOR_UPLOADS, MOBILE_LOGO]
    best: Image.Image | None = None
    best_pixels = 0
    for path in candidates:
        if not path.exists():
            continue
        img = Image.open(path).convert("RGBA")
        pixels = img.size[0] * img.size[1]
        if pixels > best_pixels:
            best = img
            best_pixels = pixels
    if best is None:
        raise FileNotFoundError("designer logo not found; expected mobile tharagai_logo.png")
    return best


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
    bottom = int(ih * 0.58)
    left = int(iw * 0.08)
    right = int(iw * 0.92)
    return img.crop((left, top, right, bottom))


def _resize_long_edge(img: Image.Image, long_edge: int) -> Image.Image:
    w, h = img.size
    scale = long_edge / max(w, h)
    new_w = max(1, int(w * scale))
    new_h = max(1, int(h * scale))
    return img.resize((new_w, new_h), Image.Resampling.LANCZOS)


def _save_png(img: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path, "PNG", optimize=True)
    print(f"wrote {path} ({path.stat().st_size} bytes, {img.size[0]}x{img.size[1]})")


def main() -> None:
    source = _load_source()
    transparent_full = _make_transparent(source)
    mark = _crop_mark(transparent_full)

    _save_png(_resize_long_edge(mark, MARK_1X), PUBLIC / "logo-mark.png")
    _save_png(_resize_long_edge(mark, MARK_2X), PUBLIC / "logo-mark@2x.png")
    _save_png(_resize_long_edge(transparent_full, FULL_1X), PUBLIC / "logo-full-transparent.png")
    _save_png(_resize_long_edge(transparent_full, FULL_2X), PUBLIC / "logo-full-transparent@2x.png")
    _save_png(_resize_long_edge(transparent_full, FULL_1X), PUBLIC / "logo.png")
    print("web branding complete")


if __name__ == "__main__":
    main()
