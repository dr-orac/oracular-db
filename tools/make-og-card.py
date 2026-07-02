#!/usr/bin/env python3
"""
make-og-card.py — generate the 1200×630 Open Graph card used by Discord/Twitter
when there's no per-character image. Uses the Fallout pixel font from fonts/.

Run from the project root:
    python3 tools/make-og-card.py
Writes: og-card.png  (drop this at the deployed site root)
"""
import os, sys
from PIL import Image, ImageDraw, ImageFont

W, H   = 1200, 630
BG     = (4, 6, 10)            # deep phosphor-dark
GREEN  = (60, 255, 122)        # primary phosphor
BRIGHT = (182, 255, 206)       # title catch-light
DIM    = (31, 138, 71)         # sub-text
GROOVE = (8, 7, 2)
FONT_PATH = os.path.join("fonts", "Fallout12.ttf")

def main():
    if not os.path.exists(FONT_PATH):
        sys.exit("font not found at " + FONT_PATH + " — run from project root.")
    img = Image.new("RGB", (W, H), BG)
    d   = ImageDraw.Draw(img, "RGBA")

    # subtle scanlines (1px dark every 4px)
    for y in range(0, H, 4):
        d.line([(0, y), (W, y)], fill=(0, 0, 0, 60))

    # corner reticles + dotted border for the in-screen terminal feel
    INSET = 40
    d.rectangle([INSET, INSET, W - INSET, H - INSET], outline=DIM, width=2)
    # corner ticks
    T = 26
    for cx, cy in [(INSET, INSET), (W - INSET, INSET), (INSET, H - INSET), (W - INSET, H - INSET)]:
        d.line([(cx - T // 2, cy), (cx + T // 2, cy)], fill=GREEN, width=3)
        d.line([(cx, cy - T // 2), (cx, cy + T // 2)], fill=GREEN, width=3)

    title    = ImageFont.truetype(FONT_PATH, 132)
    subtitle = ImageFont.truetype(FONT_PATH, 36)
    tagline  = ImageFont.truetype(FONT_PATH, 28)

    # title block, vertically balanced
    def measure(text, font):
        l, t, r, b = d.textbbox((0, 0), text, font=font)
        return r - l, b - t

    tw1, th1 = measure("THE TRIBE", title)
    tw2, th2 = measure("DATABASE",  title)
    sw,  sh  = measure("// PIP-LINK · ROBCO ARCHIVE", subtitle)
    pw,  ph  = measure("dossiers · spirits · screenshots", tagline)

    block_h = th1 + th2 + sh + ph + 30 + 24 + 18
    y = (H - block_h) // 2

    d.text(((W - tw1) // 2, y),                     "THE TRIBE", font=title, fill=BRIGHT)
    y += th1 + 6
    d.text(((W - tw2) // 2, y),                     "DATABASE",  font=title, fill=BRIGHT)
    y += th2 + 30
    d.text(((W - sw)  // 2, y), "// PIP-LINK · ROBCO ARCHIVE",   font=subtitle, fill=GREEN)
    y += sh + 24
    d.text(((W - pw)  // 2, y), "dossiers · spirits · screenshots", font=tagline,  fill=DIM)

    # blinking-cursor block at the end of the tagline
    d.rectangle([(W + pw) // 2 + 12, y + 2, (W + pw) // 2 + 30, y + ph],
                fill=BRIGHT)

    # vignette darken the corners
    overlay = Image.new("L", (W, H), 0)
    od = ImageDraw.Draw(overlay)
    for r in range(0, 240, 6):
        a = int(r * 0.6)
        od.rectangle([r, r, W - r, H - r], outline=255 - a)
    img.paste((0, 0, 0), (0, 0), overlay.point(lambda v: max(0, 90 - v // 3)))

    out = "og-card.png"
    img.save(out, "PNG", optimize=True)
    print("wrote " + out + "  (" + str(os.path.getsize(out) // 1024) + " kB)")

if __name__ == "__main__":
    main()
