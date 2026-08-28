"""Generate crisp web logo assets from the designer source PNG."""
from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ROOT / "public"
MOBILE_LOGO = ROOT.parent / "mobile" / "assets" / "branding" / "tharagai_logo.png"
MARK_SOURCES = [
    Path(
        r"C:\Users\USER\.cursor\projects\c-Users-USER-Desktop-t360\assets"
        r"\c__Users_USER_AppData_Roaming_Cursor_User_workspaceStorage_8323a401266c71e73997a3e0239e9d48_images_image-3e8839ea-84bf-4dc0-b24d-09225db60a78.png"
    ),
    Path(
        r"C:\Users\USER\.cursor\projects\c-Users-USER-Desktop-t360\assets"
        r"\c__Users_USER_AppData_Roaming_Cursor_User_workspaceStorage_8323a401266c71e73997a3e0239e9d48_images_image-086ba9f6-c1c8-4d5d-bd22-f94cb70c1b14.png"
    ),
]
FULL_LOGO_SOURCES = [
    Path(
        r"C:\Users\USER\.cursor\projects\c-Users-USER-Desktop-t360\assets"
        r"\c__Users_USER_AppData_Roaming_Cursor_User_workspaceStorage_8323a401266c71e73997a3e0239e9d48_images_image-ad5f130b-7f59-4095-9876-b2485ed4b947.png"
    ),
    Path(
        r"C:\Users\USER\.cursor\projects\c-Users-USER-Desktop-t360\assets"
        r"\c__Users_USER_AppData_Roaming_Cursor_User_workspaceStorage_8323a401266c71e73997a3e0239e9d48_images_tharagai_logo-da96befa-b071-420b-b0c8-c07512eb7808.png"
    ),
    MOBILE_LOGO,
]

MARK_1X = 512
MARK_2X = 1024
FULL_1X = 1024
FULL_2X = 2048
MARK_MIN_LONG_EDGE = 400


def _load_best(candidates: list[Path]) -> Image.Image:
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
        raise FileNotFoundError("designer logo not found")
    return best


def _load_full_source() -> Image.Image:
    return _load_best(FULL_LOGO_SOURCES)


def _load_mark_source() -> Image.Image:
    best: Image.Image | None = None
    best_long = 0
    for path in MARK_SOURCES:
        if not path.exists():
            continue
        img = Image.open(path).convert("RGBA")
        long_edge = max(img.size)
        if long_edge > best_long:
            best = img
            best_long = long_edge
    if best is not None and best_long >= MARK_MIN_LONG_EDGE:
        return best
    transparent_full = _make_transparent(_load_full_source())
    return _crop_mark(transparent_full)


def _make_transparent(img: Image.Image) -> Image.Image:
    rgba = img.convert("RGBA")
    pixels = rgba.load()
    width, height = rgba.size
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            if a == 0:
                continue
            spread = max(r, g, b) - min(r, g, b)
            luminance = 0.299 * r + 0.587 * g + 0.114 * b
            # Near-white background
            if r >= 240 and g >= 240 and b >= 240:
                pixels[x, y] = (r, g, b, 0)
                continue
            # Cream / beige field
            if r >= 175 and g >= 175 and b >= 165 and spread <= 40:
                pixels[x, y] = (r, g, b, 0)
                continue
            # Screenshot black bars and dark UI chrome
            if r <= 35 and g <= 35 and b <= 35:
                pixels[x, y] = (r, g, b, 0)
                continue
            # Soft off-white halo (semi-transparent glow plate)
            if a < 128 and luminance >= 200:
                pixels[x, y] = (r, g, b, 0)
                continue
            # Faint cream shadow baked into exports
            if a < 180 and r >= 200 and g >= 190 and b >= 170 and spread <= 50:
                pixels[x, y] = (r, g, b, 0)
    return rgba


def _trim_alpha_bbox(img: Image.Image, padding: int = 2) -> Image.Image:
    rgba = img.convert("RGBA")
    bbox = rgba.getbbox()
    if not bbox:
        return rgba
    left, top, right, bottom = bbox
    left = max(0, left - padding)
    top = max(0, top - padding)
    right = min(rgba.width, right + padding)
    bottom = min(rgba.height, bottom + padding)
    return rgba.crop((left, top, right, bottom))


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
    source = _load_full_source()
    transparent_full = _trim_alpha_bbox(_make_transparent(source))

    mark_raw = _load_mark_source()
    mark = _trim_alpha_bbox(_make_transparent(mark_raw))

    mark_1x = _resize_long_edge(mark, MARK_1X)
    mark_2x = _resize_long_edge(mark, MARK_2X)
    _save_png(mark_1x, PUBLIC / "logo-mark.png")
    _save_png(mark_2x, PUBLIC / "logo-mark@2x.png")
    _save_png(_resize_long_edge(transparent_full, FULL_1X), PUBLIC / "logo-full-transparent.png")
    _save_png(_resize_long_edge(transparent_full, FULL_2X), PUBLIC / "logo-full-transparent@2x.png")
    _save_png(_resize_long_edge(transparent_full, FULL_1X), PUBLIC / "logo.png")
    print(f"mark aspect: {mark_1x.size[0]}/{mark_1x.size[1]}")
    print("web branding complete")


if __name__ == "__main__":
    main()
