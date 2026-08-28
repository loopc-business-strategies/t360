"""Generate Tharagai Readymades splash + icon source PNGs (approved copy spec).

Run from repo root:
  python apps/mobile/tool/generate_branding_assets.py
"""
from __future__ import annotations

import math
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "assets" / "branding"

CREAM = (243, 238, 230)
GOLD = (198, 156, 78)
GOLD_LIGHT = (232, 200, 130)
GOLD_DARK = (150, 110, 50)
INK = (28, 26, 24)
MIST = (235, 228, 218)


def _font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = [
        Path(r"C:\Windows\Fonts\georgiab.ttf" if bold else r"C:\Windows\Fonts\georgia.ttf"),
        Path(r"C:\Windows\Fonts\timesbd.ttf" if bold else r"C:\Windows\Fonts\times.ttf"),
        Path("/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf"),
    ]
    for path in candidates:
        if path.exists():
            return ImageFont.truetype(str(path), size)
    return ImageFont.load_default()


def _sans(size: int, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    candidates = [
        Path(r"C:\Windows\Fonts\segoeuib.ttf" if bold else r"C:\Windows\Fonts\segoeui.ttf"),
        Path("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"),
    ]
    for path in candidates:
        if path.exists():
            return ImageFont.truetype(str(path), size)
    return ImageFont.load_default()


def _cream_gradient(w: int, h: int) -> Image.Image:
    base = Image.new("RGB", (w, h), CREAM)
    draw = ImageDraw.Draw(base)
    for y in range(h):
        t = y / max(h - 1, 1)
        r = int(CREAM[0] * (1 - t * 0.06) + MIST[0] * t * 0.06)
        g = int(CREAM[1] * (1 - t * 0.06) + MIST[1] * t * 0.06)
        b = int(CREAM[2] * (1 - t * 0.06) + MIST[2] * t * 0.06)
        draw.line([(0, y), (w, y)], fill=(r, g, b))
    return base


def _heritage_overlay(img: Image.Image) -> None:
    w, h = img.size
    layer = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    # Faded temple / heritage silhouettes — very low contrast.
    for cx, scale in [(w * 0.78, 1.0), (w * 0.18, 0.7), (w * 0.55, 0.55)]:
        bw = int(180 * scale)
        bh = int(220 * scale)
        x0 = int(cx - bw / 2)
        y0 = int(h * 0.22)
        draw.polygon(
            [
                (x0 + bw * 0.5, y0),
                (x0 + bw, y0 + bh * 0.35),
                (x0 + bw, y0 + bh),
                (x0, y0 + bh),
                (x0, y0 + bh * 0.35),
            ],
            fill=(210, 198, 175, 28),
        )
        draw.ellipse(
            [x0 + bw * 0.15, y0 + bh * 0.05, x0 + bw * 0.85, y0 + bh * 0.45],
            fill=(220, 205, 180, 22),
        )
    layer = layer.filter(ImageFilter.GaussianBlur(radius=6))
    img.paste(Image.alpha_composite(img.convert("RGBA"), layer).convert("RGB"))


def _fabric_bottom(img: Image.Image) -> None:
    w, h = img.size
    layer = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    points = []
    for x in range(0, w + 1, 8):
        t = x / w
        y = int(h * 0.88 + math.sin(t * math.pi * 3) * 18 + (1 - t) * 12)
        points.append((x, y))
    points += [(w, h), (0, h)]
    draw.polygon(points, fill=(225, 210, 185, 120))
    draw.line(points[: len(points) - 2], fill=(*GOLD_LIGHT, 160), width=3)
    img.paste(Image.alpha_composite(img.convert("RGBA"), layer).convert("RGB"))


def _sparkle(draw: ImageDraw.ImageDraw, cx: int, cy: int, r: int, fill: tuple[int, int, int]) -> None:
    draw.polygon(
        [
            (cx, cy - r),
            (cx + r * 0.28, cy - r * 0.28),
            (cx + r, cy),
            (cx + r * 0.28, cy + r * 0.28),
            (cx, cy + r),
            (cx - r * 0.28, cy + r * 0.28),
            (cx - r, cy),
            (cx - r * 0.28, cy - r * 0.28),
        ],
        fill=fill,
    )


def _draw_mark(draw: ImageDraw.ImageDraw, cx: int, cy: int, scale: float = 1.0) -> None:
    s = scale
    # Hanger hook
    hook_top = cy - int(120 * s)
    draw.arc(
        [cx - int(55 * s), hook_top - int(30 * s), cx + int(55 * s), hook_top + int(70 * s)],
        start=200,
        end=340,
        fill=GOLD,
        width=max(3, int(8 * s)),
    )
    draw.line(
        [(cx - int(52 * s), hook_top + int(18 * s)), (cx + int(52 * s), hook_top + int(18 * s))],
        fill=GOLD,
        width=max(3, int(7 * s)),
    )
    # Letter T
    tw = int(36 * s)
    th = int(130 * s)
    tx = cx - tw // 2
    ty = hook_top + int(28 * s)
    draw.rectangle([tx, ty, tx + tw, ty + th], fill=GOLD_DARK)
    draw.rectangle([cx - int(70 * s), ty, cx + int(70 * s), ty + int(28 * s)], fill=GOLD)
    # Wing curve
    wing = [
        (cx + int(75 * s), ty + int(35 * s)),
        (cx + int(130 * s), ty + int(10 * s)),
        (cx + int(150 * s), ty + int(80 * s)),
        (cx + int(95 * s), ty + int(95 * s)),
    ]
    draw.line(wing, fill=GOLD_LIGHT, width=max(2, int(6 * s)), joint="curve")
    _sparkle(draw, cx + int(115 * s), ty - int(8 * s), int(14 * s), GOLD_LIGHT)


def _center_text(
    draw: ImageDraw.ImageDraw,
    text: str,
    y: int,
    font: ImageFont.ImageFont,
    fill: tuple[int, int, int],
    w: int,
    tracking: int = 0,
) -> int:
    if tracking == 0:
        bbox = draw.textbbox((0, 0), text, font=font)
        tw = bbox[2] - bbox[0]
        draw.text(((w - tw) // 2, y), text, font=font, fill=fill)
        return bbox[3] - bbox[1]
    total = sum(draw.textbbox((0, 0), c, font=font)[2] for c in text) + tracking * (len(text) - 1)
    x = (w - total) // 2
    for ch in text:
        draw.text((x, y), ch, font=font, fill=fill)
        x += draw.textbbox((0, 0), ch, font=font)[2] + tracking
    bbox = draw.textbbox((0, 0), text, font=font)
    return bbox[3] - bbox[1]


def generate_splash(path: Path) -> None:
    w, h = 1080, 1920
    img = _cream_gradient(w, h)
    _heritage_overlay(img)
    draw = ImageDraw.Draw(img)
    _draw_mark(draw, w // 2, int(h * 0.28), scale=1.15)
    y = int(h * 0.42)
    y += _center_text(draw, "THARAGAI", y, _font(92, bold=True), INK, w, tracking=6) + 8
    y += _center_text(draw, "READYMADES", y, _font(48), GOLD_DARK, w, tracking=10) + 24
    _sparkle(draw, w // 2, y, 10, GOLD)
    y += 18
    y += _center_text(draw, "STYLE THAT FITS YOU", y, _sans(28), INK, w, tracking=4) + 36
    y += _center_text(draw, "PUDUKKOTTAI", y, _font(36, bold=True), GOLD_DARK, w, tracking=8) + 16
    _center_text(draw, "OUR HERITAGE, YOUR STYLE", y, _sans(22), INK, w, tracking=3)
    _fabric_bottom(img)
    img.save(path, "PNG", optimize=True)
    print(f"wrote {path} ({path.stat().st_size} bytes)")


def generate_mark_square(path: Path, size: int, bg: tuple[int, int, int] = CREAM) -> None:
    img = Image.new("RGB", (size, size), bg)
    draw = ImageDraw.Draw(img)
    _draw_mark(draw, size // 2, int(size * 0.42), scale=size / 520)
    img.save(path, "PNG", optimize=True)
    print(f"wrote {path} ({path.stat().st_size} bytes)")


def generate_logo(path: Path) -> None:
    w, h = 900, 220
    img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    _draw_mark(draw, 110, h // 2 + 10, scale=0.55)
    x = 210
    draw.text((x, 48), "THARAGAI", font=_font(52, bold=True), fill=(255, 255, 255))
    draw.text((x, 108), "READYMADES", font=_sans(26), fill=GOLD_LIGHT)
    img.save(path, "PNG", optimize=True)
    print(f"wrote {path} ({path.stat().st_size} bytes)")


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    generate_splash(OUT / "tharagai_splash.png")
    generate_mark_square(OUT / "tharagai_splash_android12.png", 1152)
    generate_mark_square(OUT / "tharagai_icon.png", 1024)
    generate_logo(OUT / "tharagai_logo.png")
    print("branding assets generated")


if __name__ == "__main__":
    main()
