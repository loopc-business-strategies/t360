# Re-apply full splash artwork after `dart run flutter_native_splash:create`.
# The generator sometimes writes 1x1 placeholder background.png / LaunchImage files.
#
# Always use (from repo root):
#   pnpm regen:mobile:splash
import os
import re
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "assets" / "branding" / "tharagai_splash.png"
CREAM = "#F3EEE6"
# sRGB 243/255, 238/255, 230/255
CREAM_RGB = (243 / 255, 238 / 255, 230 / 255)

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

LAUNCH_IMAGE_DIR = (
    ROOT / "ios" / "Runner" / "Assets.xcassets" / "LaunchImage.imageset"
)
LAUNCH_IMAGE_FILES = [
    LAUNCH_IMAGE_DIR / "LaunchImage.png",
    LAUNCH_IMAGE_DIR / "LaunchImage@2x.png",
    LAUNCH_IMAGE_DIR / "LaunchImage@3x.png",
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

ANDROID_V31_STYLES = [
    ROOT / "android" / "app" / "src" / "main" / "res" / "values-v31" / "styles.xml",
    ROOT / "android" / "app" / "src" / "main" / "res" / "values-night-v31" / "styles.xml",
]

V31_STYLES_XML = """<?xml version="1.0" encoding="utf-8"?>
<resources>
    <!-- Theme applied to the Android Window while the process is starting when the OS's Dark Mode setting is off -->
    <style name="LaunchTheme" parent="@android:style/Theme.Light.NoTitleBar">
        <item name="android:windowBackground">@drawable/launch_background</item>
        <item name="android:forceDarkAllowed">false</item>
        <item name="android:windowFullscreen">true</item>
        <item name="android:windowDrawsSystemBarBackgrounds">true</item>
        <item name="android:windowLayoutInDisplayCutoutMode">shortEdges</item>
    </style>
    <!-- Theme applied to the Android Window as soon as the process has started.
         This theme determines the color of the Android Window while your
         Flutter UI initializes, as well as behind your Flutter UI while its
         running.

         This Theme is only used starting with V2 of Flutter's Android embedding. -->
    <style name="NormalTheme" parent="@android:style/Theme.Light.NoTitleBar">
        <item name="android:windowBackground">@drawable/launch_background</item>
    </style>
</resources>
"""


def write_png_targets(img: Image.Image, paths: list[Path]) -> None:
    for path in paths:
        path.parent.mkdir(parents=True, exist_ok=True)
        img.save(path, "PNG", optimize=True)
        print(f"wrote {path} ({path.stat().st_size} bytes)")


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

    # Cream background instead of white flash.
    text = re.sub(
        r'<color key="backgroundColor" red="1" green="1" blue="1" alpha="1" '
        r'colorSpace="custom" customColorSpace="sRGB"/>',
        f'<color key="backgroundColor" red="{CREAM_RGB[0]}" green="{CREAM_RGB[1]}" '
        f'blue="{CREAM_RGB[2]}" alpha="1" colorSpace="custom" customColorSpace="sRGB"/>',
        text,
    )

    # Aspect-fit full artwork on LaunchBackground.
    text = text.replace(
        'contentMode="scaleToFill" image="LaunchBackground"',
        'contentMode="scaleAspectFit" image="LaunchBackground"',
    )

    # Remove broken LaunchImage overlay (69-byte placeholders).
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


def patch_android12_legacy_splash() -> None:
    """Use full-bleed launch_background on API 31+ instead of centered icon API."""
    for path in ANDROID_V31_STYLES:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(V31_STYLES_XML, encoding="utf-8")
        print(f"patched legacy splash in {path}")


def main() -> None:
    if not SRC.exists():
        raise SystemExit(f"missing source splash asset: {SRC}")

    img = Image.open(SRC).convert("RGB")
    write_png_targets(img, BACKGROUND_TARGETS)
    write_png_targets(img, LAUNCH_IMAGE_FILES)
    patch_launch_background_gravity()
    patch_storyboard()
    patch_android12_legacy_splash()
    print("splash fix complete")


if __name__ == "__main__":
    main()
