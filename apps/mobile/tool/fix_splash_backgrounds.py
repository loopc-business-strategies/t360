# Re-apply full splash artwork after `dart run flutter_native_splash:create`.
# The generator sometimes writes 1x1 placeholder background.png files for this asset.
import os
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "assets", "branding", "tharagai_splash.png")
TARGETS = [
    os.path.join(ROOT, "android", "app", "src", "main", "res", "drawable", "background.png"),
    os.path.join(ROOT, "android", "app", "src", "main", "res", "drawable-v21", "background.png"),
    os.path.join(
        ROOT,
        "ios",
        "Runner",
        "Assets.xcassets",
        "LaunchBackground.imageset",
        "background.png",
    ),
]

img = Image.open(SRC).convert("RGB")
for path in TARGETS:
    os.makedirs(os.path.dirname(path), exist_ok=True)
    img.save(path, "PNG", optimize=True)
    print(f"wrote {path} ({os.path.getsize(path)} bytes)")
