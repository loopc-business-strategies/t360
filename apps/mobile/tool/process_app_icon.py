"""Process the uploaded THARAGAI READYMATES app icon into mobile branding."""
from __future__ import annotations

import shutil
from pathlib import Path

from PIL import Image, ImageChops

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets" / "branding"
APP_ICON_SOURCE = OUT / "app-icon-source.jpg"
UPLOAD_FALLBACK = Path(
    r"C:\Users\nandh\.cursor\projects\c-Users-nandh-Desktop-t360\assets"
    r"\c__Users_nandh_AppData_Roaming_Cursor_User_workspaceStorage_988e7a94a872c59ecb96fda6fb724da1_images"
    r"_file_00000000841c82118537fe07d5e2b17a-1a72f96f-e170-45bb-9bbc-945c5cb8b4be.jpg"
)

WHITE = (255, 255, 255, 255)
ICON_SCALE = 0.9


def _resolve_source() -> Path:
    if APP_ICON_SOURCE.exists():
        return APP_ICON_SOURCE
    if UPLOAD_FALLBACK.exists():
        OUT.mkdir(parents=True, exist_ok=True)
        shutil.copy2(UPLOAD_FALLBACK, APP_ICON_SOURCE)
        return APP_ICON_SOURCE
    raise FileNotFoundError(
        f"missing app icon source: {APP_ICON_SOURCE} (also checked {UPLOAD_FALLBACK})"
    )


def _load(path: Path) -> Image.Image:
    return Image.open(path).convert("RGBA")


def _trim_white_letterbox(img: Image.Image, threshold: int = 245) -> Image.Image:
    """Crop outer near-white padding so the logo fills the canvas."""
    rgb = img.convert("RGB")
    bg = Image.new("RGB", rgb.size, (255, 255, 255))
    diff = ImageChops.difference(rgb, bg)
    r, g, b = diff.split()
    combined = ImageChops.lighter(ImageChops.lighter(r, g), b)
    mask = combined.point(lambda p: 255 if p > (255 - threshold) else 0)
    bbox = mask.getbbox()
    if not bbox:
        return img
    pad = 8
    left, top, right, bottom = bbox
    left = max(0, left - pad)
    top = max(0, top - pad)
    right = min(img.width, right + pad)
    bottom = min(img.height, bottom + pad)
    return img.crop((left, top, right, bottom))


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


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    source = _resolve_source()
    raw = _load(source)
    raw.convert("RGB").save(APP_ICON_SOURCE, "JPEG", quality=95, optimize=True)
    print(f"source {source}")

    trimmed = _trim_white_letterbox(raw)
    side = max(trimmed.size)
    square = Image.new("RGBA", (side, side), WHITE)
    square.paste(trimmed, ((side - trimmed.width) // 2, (side - trimmed.height) // 2), trimmed)

    icon = _fit_on_white(square, (1024, 1024), scale=ICON_SCALE).convert("RGB")
    icon_path = OUT / "tharagai_icon.png"
    icon.save(icon_path, "PNG", optimize=True)
    print(f"wrote {icon_path} ({icon_path.stat().st_size} bytes, {icon.size[0]}x{icon.size[1]})")
    print("app icon processing complete (splash assets unchanged)")


if __name__ == "__main__":
    main()
