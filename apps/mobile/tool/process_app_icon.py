"""Process the uploaded THARAGAI READYMATES app icon into mobile branding."""
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageChops

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets" / "branding"
APP_ICON_SOURCE = Path(
    r"C:\Users\USER\.cursor\projects\c-Users-USER-Desktop-t360\assets"
    r"\c__Users_USER_AppData_Roaming_Cursor_User_workspaceStorage_8323a401266c71e73997a3e0239e9d48_images"
    r"_ChatGPT_Image_Aug_29__2026__11_39_34_AM-90683553-866c-412b-94e1-58fd5debb180.jpg"
)

BLACK = (0, 0, 0, 255)


def _load(path: Path) -> Image.Image:
    if not path.exists():
        raise FileNotFoundError(f"missing app icon: {path}")
    return Image.open(path).convert("RGBA")


def _trim_black_letterbox(img: Image.Image, threshold: int = 28) -> Image.Image:
    """Crop outer near-black padding so the squircle fills the canvas."""
    rgb = img.convert("RGB")
    # Mask of non-black pixels
    bg = Image.new("RGB", rgb.size, (0, 0, 0))
    diff = ImageChops.difference(rgb, bg)
    # Treat very dark pixels as background
    mask = diff.point(lambda p: 255 if p > threshold else 0).convert("L")
    # Combine channels: any channel above threshold counts
    r, g, b = diff.split()
    combined = ImageChops.lighter(ImageChops.lighter(r, g), b)
    mask = combined.point(lambda p: 255 if p > threshold else 0)
    bbox = mask.getbbox()
    if not bbox:
        return img
    # Small padding so rounded corners aren't clipped hard
    pad = 4
    left, top, right, bottom = bbox
    left = max(0, left - pad)
    top = max(0, top - pad)
    right = min(img.width, right + pad)
    bottom = min(img.height, bottom + pad)
    return img.crop((left, top, right, bottom))


def _fit_on_black(img: Image.Image, size: tuple[int, int], scale: float = 1.0) -> Image.Image:
    canvas = Image.new("RGBA", size, BLACK)
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
    raw = _load(APP_ICON_SOURCE)
    raw.convert("RGB").save(OUT / "app-icon-source.jpg", "JPEG", quality=95, optimize=True)
    print(f"wrote {OUT / 'app-icon-source.jpg'}")

    trimmed = _trim_black_letterbox(raw)
    # Square canvas: pad to square if crop isn't exact
    side = max(trimmed.size)
    square = Image.new("RGBA", (side, side), BLACK)
    square.paste(trimmed, ((side - trimmed.width) // 2, (side - trimmed.height) // 2), trimmed)

    icon = _fit_on_black(square, (1024, 1024), scale=1.0).convert("RGB")
    icon_path = OUT / "tharagai_icon.png"
    icon.save(icon_path, "PNG", optimize=True)
    print(f"wrote {icon_path} ({icon_path.stat().st_size} bytes, {icon.size[0]}x{icon.size[1]})")

    a12 = _fit_on_black(square, (1152, 1152), scale=0.88).convert("RGB")
    a12_path = OUT / "tharagai_splash_android12.png"
    a12.save(a12_path, "PNG", optimize=True)
    print(f"wrote {a12_path} ({a12_path.stat().st_size} bytes)")
    print("app icon processing complete (logo/splash portrait unchanged)")


if __name__ == "__main__":
    main()
