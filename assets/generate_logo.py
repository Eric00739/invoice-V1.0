from PIL import Image, ImageDraw, ImageFont

size = 500
image = Image.new("RGBA", (size, size), (0, 0, 0, 0))
draw = ImageDraw.Draw(image)

blue = (44, 64, 152, 255)
orange = (245, 150, 0, 255)

# Orbit strokes
draw.arc((60, 140, 440, 440), start=10, end=190, fill=blue, width=26)
draw.arc((90, 40, 410, 360), start=200, end=380, fill=blue, width=26)
draw.arc((40, 80, 470, 400), start=220, end=400, fill=blue, width=26)

# Orange nucleus
radius = 48
centre_x, centre_y = 320, 120
draw.ellipse(
    (centre_x - radius, centre_y - radius, centre_x + radius, centre_y + radius),
    fill=orange,
)

# CHJ text
try:
    font = ImageFont.truetype("arial.ttf", 140)
except OSError:
    font = ImageFont.load_default()

text = "CHJ"
text_bbox = draw.textbbox((0, 0), text, font=font)
text_width = text_bbox[2] - text_bbox[0]
text_height = text_bbox[3] - text_bbox[1]
text_position = ((size - text_width) // 2, (size - text_height) // 2 + 20)
draw.text(text_position, text, font=font, fill=blue)

# Registered symbol
rsym = "®"
try:
    font_small = ImageFont.truetype("arial.ttf", 60)
except OSError:
    font_small = font

rsym_bbox = draw.textbbox((0, 0), rsym, font=font_small)
rsym_x = centre_x + radius + 15
rsym_y = centre_y - radius
draw.text((rsym_x, rsym_y), rsym, font=font_small, fill=blue)

image.save("assets/chj-logo.png")
