"""Process the uploaded cinematic splash into apps/mobile/assets/branding/."""
from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets" / "branding"
SPLASH_SOURCE = Path(
    r"C:\Users\USER\.cursor\projects\c-Users-USER-Desktop-t360\assets"
    r"\c__Users_USER_AppData_Roaming_Cursor_User_workspaceStorage_8323a401266c71e73997a3e0239e9d48_images"
    r"_ChatGPT_Image_Aug_29__2026__11_45_47_AM-cfcbd25e-7350-4f96-af5c-65b8fbb1f612.jpg"
)

# Sampled from darkest edge pixels of the upload (~bottom silk / water).
FILL = (7, 0, 0)
TARGET = (1080, 1920)


def _load(path: Path) -> Image.Image:
    if not path.exists():
        raise FileNotFoundError(f"missing splash: {path}")
    return Image.open(path).convert("RGB")


def _fit_portrait(img: Image.Image, size: tuple[int, int], fill: tuple[int, int, int]) -> Image.Image:
    canvas = Image.new("RGB", size, fill)
    copy = img.copy()
    copy.thumbnail(size, Image.Resampling.LANCZOS)
    x = (size[0] - copy.width) // 2
    y = (size[1] - copy.height) // 2
    canvas.paste(copy, (x, y))
    return canvas


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    raw = _load(SPLASH_SOURCE)
    raw.save(OUT / "splash-source.jpg", "JPEG", quality=95, optimize=True)
    print(f"wrote {OUT / 'splash-source.jpg'} ({raw.size[0]}x{raw.size[1]})")

    splash = _fit_portrait(raw, TARGET, FILL)
    path = OUT / "tharagai_splash.png"
    splash.save(path, "PNG", optimize=True)
    print(f"wrote {path} ({path.stat().st_size} bytes, {splash.size[0]}x{splash.size[1]})")
    print(f"fill=#{FILL[0]:02X}{FILL[1]:02X}{FILL[2]:02X}")
    print("splash processing complete (android12 icon + logos unchanged)")


if __name__ == "__main__":
    main()
