"""Process the THARAGAI READYMATES logo into apps/mobile/assets/branding/."""
from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets" / "branding"
SOURCE = Path(
    r"C:\Users\USER\.cursor\projects\c-Users-USER-Desktop-t360\assets"
    r"\c__Users_USER_AppData_Roaming_Cursor_User_workspaceStorage_8323a401266c71e73997a3e0239e9d48_images"
    r"_ChatGPT_Image_Aug_29__2026__11_20_55_AM-b244bd27-b14d-4088-b88d-e7c56aab46a3.jpg"
)

BLACK = (0, 0, 0, 255)


def _load(path: Path) -> Image.Image:
    if not path.exists():
        raise FileNotFoundError(f"missing upload: {path}")
    return Image.open(path).convert("RGBA")


def _fit_on_black(img: Image.Image, size: tuple[int, int], scale: float = 0.86) -> Image.Image:
    canvas = Image.new("RGBA", size, BLACK)
    copy = img.copy()
    copy.thumbnail((int(size[0] * scale), int(size[1] * scale)), Image.Resampling.LANCZOS)
    x = (size[0] - copy.width) // 2
    y = (size[1] - copy.height) // 2
    canvas.paste(copy, (x, y), copy)
    return canvas


def _crop_mark(img: Image.Image) -> Image.Image:
    iw, ih = img.size
    top = int(ih * 0.02)
    bottom = int(ih * 0.62)
    band = img.crop((0, top, iw, bottom))
    bw, bh = band.size
    side = min(bw, bh)
    left = (bw - side) // 2
    return band.crop((left, 0, left + side, side))


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    src = _load(SOURCE)

    # Canonical source copy inside branding folder
    src.convert("RGB").save(OUT / "source.jpg", "JPEG", quality=95, optimize=True)
    print(f"wrote {OUT / 'source.jpg'}")

    logo = _fit_on_black(src, (1024, 1024), scale=0.92)
    logo_rgb = logo.convert("RGB")
    logo_path = OUT / "tharagai_logo.png"
    logo_rgb.save(logo_path, "PNG", optimize=True)
    print(f"wrote {logo_path} ({logo_path.stat().st_size} bytes)")

    # Keep filename for BrandedLogo; artwork stays black-backed (no knock-out)
    transparent_path = OUT / "tharagai_logo_transparent.png"
    logo_rgb.save(transparent_path, "PNG", optimize=True)
    print(f"wrote {transparent_path} ({transparent_path.stat().st_size} bytes)")

    mark = _crop_mark(src)
    icon = _fit_on_black(mark, (1024, 1024), scale=0.9).convert("RGB")
    icon_path = OUT / "tharagai_icon.png"
    icon.save(icon_path, "PNG", optimize=True)
    print(f"wrote {icon_path} ({icon_path.stat().st_size} bytes)")

    splash = _fit_on_black(src, (1080, 1920), scale=0.82).convert("RGB")
    splash_path = OUT / "tharagai_splash.png"
    splash.save(splash_path, "PNG", optimize=True)
    print(f"wrote {splash_path} ({splash_path.stat().st_size} bytes)")

    a12 = _fit_on_black(mark, (1152, 1152), scale=0.72).convert("RGB")
    a12_path = OUT / "tharagai_splash_android12.png"
    a12.save(a12_path, "PNG", optimize=True)
    print(f"wrote {a12_path} ({a12_path.stat().st_size} bytes)")
    print("upload processing complete")


if __name__ == "__main__":
    main()
