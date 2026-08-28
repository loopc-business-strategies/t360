"""Process uploaded designer branding into apps/mobile/assets/branding/.

Fixes:
- Converts JPG uploads to PNG
- Removes LOADING bar from bottom of full splash
- Builds Android 12 square icon from app icon (not phone mockup)
"""
from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets" / "branding"
CURSOR_ASSETS = Path(
    r"C:\Users\USER\.cursor\projects\c-Users-USER-Desktop-t360\assets"
)

UPLOADS = {
    "tharagai_splash": CURSOR_ASSETS
    / "c__Users_USER_AppData_Roaming_Cursor_User_workspaceStorage_8323a401266c71e73997a3e0239e9d48_images_tharagai_splash-0511a318-d229-4e3f-abc7-8c1cc9c00885.jpg",
    "tharagai_icon": CURSOR_ASSETS
    / "c__Users_USER_AppData_Roaming_Cursor_User_workspaceStorage_8323a401266c71e73997a3e0239e9d48_images_tharagai_icon-65ab924f-8d1a-4a4c-a586-dcfa2cfc6598.jpg",
    "tharagai_logo": CURSOR_ASSETS
    / "c__Users_USER_AppData_Roaming_Cursor_User_workspaceStorage_8323a401266c71e73997a3e0239e9d48_images_tharagai_logo-da96befa-b071-420b-b0c8-c07512eb7808.png",
}

CREAM = (243, 238, 230)


def _load(path: Path) -> Image.Image:
    if not path.exists():
        raise FileNotFoundError(f"missing upload: {path}")
    return Image.open(path).convert("RGBA")


def _crop_loading_footer(img: Image.Image) -> Image.Image:
    """Remove LOADING... + progress bar + bottom fabric from splash."""
    w, h = img.size
    cut = int(h * 0.82)
    return img.crop((0, 0, w, cut))


def _android12_from_icon(icon: Image.Image) -> Image.Image:
    """Square centered mark for Android 12+ system splash."""
    size = 1152
    canvas = Image.new("RGBA", (size, size), (*CREAM, 255))
    iw, ih = icon.size
    top = int(ih * 0.02)
    bottom = int(ih * 0.72)
    left = int(iw * 0.08)
    right = int(iw * 0.92)
    mark = icon.crop((left, top, right, bottom))
    mark.thumbnail((int(size * 0.72), int(size * 0.72)), Image.Resampling.LANCZOS)
    mx = (size - mark.width) // 2
    my = (size - mark.height) // 2
    canvas.paste(mark, (mx, my), mark)
    return canvas


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)

    splash_src = _load(UPLOADS["tharagai_splash"])
    icon_src = _load(UPLOADS["tharagai_icon"])
    logo_src = _load(UPLOADS["tharagai_logo"])

    splash_path = OUT / "tharagai_splash.png"
    splash = _crop_loading_footer(splash_src).convert("RGB")
    splash.save(splash_path, "PNG", optimize=True)
    print(f"wrote {splash_path} ({splash_path.stat().st_size} bytes)")

    icon_path = OUT / "tharagai_icon.png"
    icon_src.convert("RGB").save(icon_path, "PNG", optimize=True)
    print(f"wrote {icon_path} ({icon_path.stat().st_size} bytes)")

    logo_path = OUT / "tharagai_logo.png"
    logo_src.save(logo_path, "PNG", optimize=True)
    print(f"wrote {logo_path} ({logo_path.stat().st_size} bytes)")

    a12_path = OUT / "tharagai_splash_android12.png"
    _android12_from_icon(icon_src).convert("RGB").save(a12_path, "PNG", optimize=True)
    print(f"wrote {a12_path} ({a12_path.stat().st_size} bytes)")
    print("upload processing complete")


if __name__ == "__main__":
    main()
