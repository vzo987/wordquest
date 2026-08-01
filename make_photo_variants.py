"""圖片怪獸進化變體產生器：以一階圖為基底，
二階 = 銀藍色調 + 銀色描邊 + 銀星；三階 = 金色調 + 金色描邊 + 頭頂王冠 + 金星。
輸出覆蓋 mon_*2.png / mon_*3.png（原始美術 jpg 仍保留於 photo/）。"""
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter
import os

LINES = ['nail', 'apple']  # 以 mon_<line>1.png 為基底


def tint(img, rf, gf, bf):
    r, g, b, a = img.split()
    r = r.point(lambda v: min(255, int(v * rf)))
    g = g.point(lambda v: min(255, int(v * gf)))
    b = b.point(lambda v: min(255, int(v * bf)))
    return Image.merge('RGBA', (r, g, b, a))


def rim(img, color, grow, blur):
    """以 alpha 膨脹做出描邊光暈"""
    a = img.split()[3]
    dil = a.filter(ImageFilter.MaxFilter(grow))
    edge = Image.new('L', img.size, 0)
    edge.paste(dil, (0, 0))
    halo = Image.new('RGBA', img.size, color + (0,))
    halo.putalpha(edge.point(lambda v: int(v * 0.85)))
    halo = halo.filter(ImageFilter.GaussianBlur(blur))
    out = Image.new('RGBA', img.size, (0, 0, 0, 0))
    out.alpha_composite(halo)
    out.alpha_composite(img)
    return out


def sparkle(draw, cx, cy, s, color):
    """四角星"""
    draw.polygon([(cx, cy - s), (cx + s * 0.28, cy - s * 0.28), (cx + s, cy),
                  (cx + s * 0.28, cy + s * 0.28), (cx, cy + s), (cx - s * 0.28, cy + s * 0.28),
                  (cx - s, cy), (cx - s * 0.28, cy - s * 0.28)], fill=color)


def crown(draw, cx, top, cw):
    """頭頂黃金王冠"""
    ch = cw * 0.52
    x0, x1 = cx - cw / 2, cx + cw / 2
    band_top = top + ch * 0.62
    gold, dark = (255, 198, 40, 255), (155, 105, 10, 255)
    # 三個尖角
    for i, tx in enumerate([x0 + cw * 0.12, cx, x1 - cw * 0.12]):
        peak = top if i == 1 else top + ch * 0.2
        draw.polygon([(tx - cw * 0.14, band_top), (tx, peak), (tx + cw * 0.14, band_top)],
                     fill=gold, outline=dark, width=3)
    # 帽帶
    draw.rounded_rectangle([x0, band_top, x1, band_top + ch * 0.3], radius=ch * 0.1,
                           fill=gold, outline=dark, width=3)
    # 寶石
    for tx, col in [(x0 + cw * 0.12, (229, 57, 53, 255)), (cx, (30, 136, 229, 255)), (x1 - cw * 0.12, (67, 160, 71, 255))]:
        r = ch * 0.09
        draw.ellipse([tx - r, band_top + ch * 0.06, tx + r, band_top + ch * 0.24], fill=col, outline=dark, width=2)


def make_variant(base, stage):
    # 外擴畫布：預留描邊與王冠空間
    w, h = base.size
    pad_x, pad_top = int(w * 0.10), int(h * 0.22)
    cv = Image.new('RGBA', (w + pad_x * 2, h + pad_top + int(h * 0.06)), (0, 0, 0, 0))
    cv.alpha_composite(base, (pad_x, pad_top))

    if stage == 2:
        cv = tint(cv, 0.94, 1.00, 1.14)                       # 銀藍色調
        cv = ImageEnhance.Contrast(cv).enhance(1.10)
        cv = rim(cv, (205, 225, 255), 11, 3)                  # 銀色描邊
        star_color = (225, 240, 255, 235)
    else:
        cv = tint(cv, 1.18, 1.03, 0.70)                       # 黃金色調
        cv = ImageEnhance.Contrast(cv).enhance(1.12)
        cv = rim(cv, (255, 208, 70), 15, 4)                   # 金色描邊
        star_color = (255, 235, 140, 245)

    draw = ImageDraw.Draw(cv)
    W, H = cv.size
    bbox = cv.getbbox()
    if stage == 3 and bbox:
        # 王冠放在生物頂端
        crown(draw, (bbox[0] + bbox[2]) / 2, max(4, bbox[1] - H * 0.02), (bbox[2] - bbox[0]) * 0.34)
    # 火花點綴
    n = 3 if stage == 2 else 5
    spots = [(0.16, 0.24), (0.86, 0.18), (0.10, 0.62), (0.90, 0.55), (0.24, 0.08)]
    for i in range(n):
        sx, sy = spots[i]
        sparkle(draw, W * sx, H * sy, W * (0.035 if i % 2 else 0.05), star_color)

    cv.thumbnail((512, 512), Image.LANCZOS)
    return cv


for line in LINES:
    base = Image.open(f'photo/mon_{line}1.png').convert('RGBA')
    for stage in (2, 3):
        out = make_variant(base, stage)
        path = f'photo/mon_{line}{stage}.png'
        out.save(path, optimize=True)
        print(path, out.size, os.path.getsize(path) // 1024, 'KB')
