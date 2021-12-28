import json, struct
from PIL import Image
with open("map.json", "r") as f:
    data = json.loads(f.read())

img = Image.new('RGB', (1024, 1024))
pixels = [(0, 0, 0) for i in range(1024 * 1024)]
for chunk in data:
    cint = int(chunk)
    if cint < 0:
        cint = cint
    print(cint)
    cx, cy = (cint >> 16) & 0xFFFF, cint & 0xFFFF
    for i, block in enumerate(data[chunk]):
        bx, by = i % 32, i // 32
        tx, ty = bx + cx * 16, by + cy * 16
        print(cx, cy)
        pixels[ty * 1024 + tx] = (255, 0, 0)
img.putdata(pixels)
img.save("map_render.png")
