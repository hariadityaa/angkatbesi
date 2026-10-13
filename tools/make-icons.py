"""Draw the Mono Dark app icons from the colour tokens in app.css.

Run: python3 tools/make-icons.py  (needs Pillow)
"""
from pathlib import Path
from PIL import Image, ImageDraw

BG = "#0a0a0a"       # --bg
PLATE = "#ededed"    # --text
BAR = "#a1a1a1"      # --text-2
SS = 4               # supersampling factor
OUT = Path(__file__).resolve().parent.parent / "icons"


def draw(size, scale):
    s = size * SS
    img = Image.new("RGB", (s, s), BG)
    d = ImageDraw.Draw(img)
    # Barbell side view on a 512 grid, centred on 256.
    k = s / 512 * scale
    o = s / 2 - 256 * k

    def p(*xy):
        return [o + v * k for v in xy]

    d.rounded_rectangle(p(64, 244, 448, 268), 12 * k, fill=BAR)       # bar
    for x0, x1, y0, y1, c in (
        (128, 168, 136, 376, PLATE),   # big plates
        (344, 384, 136, 376, PLATE),
        (176, 204, 176, 336, PLATE),   # small plates
        (308, 336, 176, 336, PLATE),
        (100, 120, 220, 292, BAR),     # collars
        (392, 412, 220, 292, BAR),
    ):
        d.rounded_rectangle(p(x0, y0, x1, y1), 10 * k, fill=c)
    return img.resize((size, size), Image.LANCZOS)


draw(192, 1.0).save(OUT / "icon-192.png", optimize=True)
draw(512, 1.0).save(OUT / "icon-512.png", optimize=True)
draw(180, 1.0).save(OUT / "apple-touch-icon.png", optimize=True)
# Maskable icons must keep artwork inside the central 80% circle.
draw(512, 0.78).save(OUT / "icon-maskable-512.png", optimize=True)
