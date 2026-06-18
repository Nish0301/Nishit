from PIL import Image
from rembg import remove
import io, os

OUT = "/home/user/Nishit/assets"

# Sheet layout (704x1507):
# Top-left:     Victory / arms-up jumping
# Top-right:    Sitting cross-legged
# Mid-left:     Arms crossed
# Mid-right:    Casual standing (attitude lean)
# Bottom-left:  Crouching / thinking

CROPS = {
    "victory":       (0,    0,    352, 650),
    "sitting":       (352,  0,    704, 650),
    "arms-crossed":  (0,    620,  370, 1200),
    "lean-casual":   (340,  570,  704, 1220),
    "crouching":     (50,   1150, 500, 1507),
}

def process(name, img, box=None):
    if box:
        img = img.crop(box)
    # Remove background
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    out_bytes = remove(buf.getvalue())
    result = Image.open(io.BytesIO(out_bytes)).convert("RGBA")
    # Trim transparent edges
    bbox = result.getbbox()
    if bbox:
        result = result.crop(bbox)
    out_path = os.path.join(OUT, f"pose-{name}-cutout.png")
    result.save(out_path)
    print(f"  saved {out_path} ({result.size})")
    return result

print("Processing casual (single image)...")
casual = Image.open(os.path.join(OUT, "pose-casual-raw.png"))
process("casual", casual)

print("Processing sheet poses...")
sheet = Image.open(os.path.join(OUT, "poses-sheet-raw.png"))
for name, box in CROPS.items():
    print(f"  {name}...")
    process(name, sheet, box)

print("Done. Cutouts saved.")
