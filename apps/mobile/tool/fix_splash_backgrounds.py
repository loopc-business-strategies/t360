# Re-apply full splash artwork after `dart run flutter_native_splash:create`.
# The generator sometimes writes 1x1 placeholder background.png / LaunchImage files.
#
# Always use (from repo root):
#   pnpm regen:mobile:splash
import re
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "assets" / "branding" / "tharagai_splash.png"
ANDROID12_SRC = ROOT / "assets" / "branding" / "tharagai_splash_android12.png"
# Match pubspec flutter_native_splash color and Dart _splashFill (#070000).
SPLASH_BG_RGB = (7 / 255, 0 / 255, 0 / 255)

BACKGROUND_TARGETS = [
    ROOT / "android" / "app" / "src" / "main" / "res" / "drawable" / "background.png",
    ROOT / "android" / "app" / "src" / "main" / "res" / "drawable-v21" / "background.png",
    ROOT
    / "ios"
    / "Runner"
    / "Assets.xcassets"
    / "LaunchBackground.imageset"
    / "background.png",
]

ANDROID12_DENSITIES = [
    "drawable-mdpi",
    "drawable-hdpi",
    "drawable-xhdpi",
    "drawable-xxhdpi",
    "drawable-xxxhdpi",
    "drawable-night-mdpi",
    "drawable-night-hdpi",
    "drawable-night-xhdpi",
    "drawable-night-xxhdpi",
    "drawable-night-xxxhdpi",
]

LAUNCH_BACKGROUND_XMLS = [
    ROOT / "android" / "app" / "src" / "main" / "res" / "drawable" / "launch_background.xml",
    ROOT
    / "android"
    / "app"
    / "src"
    / "main"
    / "res"
    / "drawable-v21"
    / "launch_background.xml",
]

STORYBOARD = ROOT / "ios" / "Runner" / "Base.lproj" / "LaunchScreen.storyboard"


def write_png_targets(img: Image.Image, paths: list[Path]) -> None:
    for path in paths:
        path.parent.mkdir(parents=True, exist_ok=True)
        img.save(path, "PNG", optimize=True)
        print(f"wrote {path} ({path.stat().st_size} bytes)")


def sync_android12_icon() -> None:
    if not ANDROID12_SRC.exists():
        print(f"skip android12 sync — missing {ANDROID12_SRC}")
        return
    icon = Image.open(ANDROID12_SRC).convert("RGBA")
    res = ROOT / "android" / "app" / "src" / "main" / "res"
    for folder in ANDROID12_DENSITIES:
        target = res / folder / "android12splash.png"
        write_png_targets(icon, [target])


def patch_launch_background_gravity() -> None:
    for path in LAUNCH_BACKGROUND_XMLS:
        if not path.exists():
            continue
        text = path.read_text(encoding="utf-8")
        updated = re.sub(
            r'android:gravity="fill"',
            'android:gravity="center"',
            text,
        )
        if updated != text:
            path.write_text(updated, encoding="utf-8")
            print(f"patched gravity=center in {path}")


def patch_storyboard() -> None:
    if not STORYBOARD.exists():
        return
    text = STORYBOARD.read_text(encoding="utf-8")

    # Dark brand background instead of white flash.
    text = re.sub(
        r'<color key="backgroundColor" red="1" green="1" blue="1" alpha="1" '
        r'colorSpace="custom" customColorSpace="sRGB"/>',
        f'<color key="backgroundColor" red="{SPLASH_BG_RGB[0]}" green="{SPLASH_BG_RGB[1]}" '
        f'blue="{SPLASH_BG_RGB[2]}" alpha="1" colorSpace="custom" customColorSpace="sRGB"/>',
        text,
    )

    # Aspect-fit full artwork on LaunchBackground.
    text = text.replace(
        'contentMode="scaleToFill" image="LaunchBackground"',
        'contentMode="scaleAspectFit" image="LaunchBackground"',
    )

    # Remove broken LaunchImage overlay (unused duplicate layer).
    text = re.sub(
        r'\s*<imageView opaque="NO" clipsSubviews="YES" multipleTouchEnabled="YES" '
        r'contentMode="scaleAspectFit" image="LaunchImage" '
        r'translatesAutoresizingMaskIntoConstraints="NO" id="YRO-k0-Ey4"></imageView>',
        "",
        text,
    )
    text = re.sub(
        r'\s*<constraint firstItem="YRO-k0-Ey4"[^/]*/>\n?',
        "",
        text,
    )
    text = re.sub(
        r'\s*<constraint[^>]*secondItem="YRO-k0-Ey4"[^/]*/>\n?',
        "",
        text,
    )
    text = re.sub(r'\s*<image name="LaunchImage"[^/]*/>\n?', "", text)

    STORYBOARD.write_text(text, encoding="utf-8")
    print(f"patched {STORYBOARD}")


def main() -> None:
    if not SRC.exists():
        raise SystemExit(f"missing source splash asset: {SRC}")

    img = Image.open(SRC).convert("RGB")
    write_png_targets(img, BACKGROUND_TARGETS)
    patch_launch_background_gravity()
    patch_storyboard()
    sync_android12_icon()
    print("splash fix complete")


if __name__ == "__main__":
    main()
