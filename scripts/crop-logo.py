"""Trim transparent padding from logo.png and save as a tight square."""
from __future__ import annotations

from pathlib import Path
import subprocess

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"
APP = ROOT / "app"
SOURCE = PUBLIC / "Gemini_Generated_Image_ax4w6aax4w6aax4w-removebg-preview.png"
OUTPUT = PUBLIC / "logo.png"
ALPHA_THRESHOLD = 10
PAD_RATIO = 0.03


def trim_to_square(source: Path, output: Path) -> tuple[tuple[int, int], tuple[int, int, int, int], tuple[int, int]]:
    img = Image.open(source).convert("RGBA")
    alpha = img.split()[3]
    mask = alpha.point(lambda p: 255 if p > ALPHA_THRESHOLD else 0)
    bbox = mask.getbbox()
    if not bbox:
        raise SystemExit(f"No opaque content found in {source}")

    cropped = img.crop(bbox)
    width, height = cropped.size
    side = max(width, height)
    pad = max(2, int(side * PAD_RATIO))
    canvas = Image.new("RGBA", (side + pad * 2, side + pad * 2), (0, 0, 0, 0))
    offset_x = pad + (side - width) // 2
    offset_y = pad + (side - height) // 2
    canvas.paste(cropped, (offset_x, offset_y), cropped)
    canvas.save(output)
    return img.size, bbox, canvas.size


def regenerate_favicons() -> None:
    targets = [
        (32, APP / "icon.png"),
        (180, APP / "apple-icon.png"),
        (16, PUBLIC / "favicon-16x16.png"),
        (32, PUBLIC / "favicon-32x32.png"),
    ]
    for size, dest in targets:
        subprocess.run(["sips", "-z", str(size), str(size), str(OUTPUT), "--out", str(dest)], check=True)


def main() -> None:
    source = SOURCE if SOURCE.exists() else OUTPUT
    original, bbox, square = trim_to_square(source, OUTPUT)
    regenerate_favicons()
    print(f"Source: {source.name} {original}")
    print(f"Content bbox: {bbox}")
    print(f"Saved square logo: {OUTPUT} {square}")
    print("Regenerated app/icon.png, app/apple-icon.png, and public favicons")


if __name__ == "__main__":
    main()
