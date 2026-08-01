"""Emoji 怪獸進化變體烘焙器：
解析 monsters.js，為所有二、三階的 emoji 怪獸（不含玩家圖片怪獸）
以彩色 emoji 字型渲染後套用階段效果，輸出 photo/evo_<id>.png。
二階 = 銀藍色調＋銀色描邊＋銀星；三階 = 金色調＋金色描邊＋王冠＋金星。
最後印出 sw.js 需要的預快取清單。"""
import re
import os
from PIL import Image, ImageDraw, ImageFont, ImageEnhance, ImageFilter

EXCLUDE_PREFIX = ('nail', 'apple', 'firetooth')  # 玩家圖片怪獸維持原圖
FONT = ImageFont.truetype('C:/Windows/Fonts/seguiemj.ttf', 180)
CANVAS = 288


def tint(img, rf, gf, bf):
    r, g, b, a = img.split()
    r = r.point(lambda v: min(255, int(v * rf)))
    g = g.point(lambda v: min(255, int(v * gf)))
    b = b.point(lambda v: min(255, int(v * bf)))
    return Image.merge('RGBA', (r, g, b, a))


def rim(img, color, grow, blur):
    a = img.split()[3]
    dil = a.filter(ImageFilter.MaxFilter(grow))
    halo = Image.new('RGBA', img.size, color + (0,))
    halo.putalpha(dil.point(lambda v: int(v * 0.85)))
    halo = halo.filter(ImageFilter.GaussianBlur(blur))
    out = Image.new('RGBA', img.size, (0, 0, 0, 0))
    out.alpha_composite(halo)
    out.alpha_composite(img)
    return out


def sparkle(draw, cx, cy, s, color):
    draw.polygon([(cx, cy - s), (cx + s * 0.28, cy - s * 0.28), (cx + s, cy),
                  (cx + s * 0.28, cy + s * 0.28), (cx, cy + s), (cx - s * 0.28, cy + s * 0.28),
                  (cx - s, cy), (cx - s * 0.28, cy - s * 0.28)], fill=color)


def crown(draw, cx, top, cw):
    ch = cw * 0.52
    x0, x1 = cx - cw / 2, cx + cw / 2
    band_top = top + ch * 0.62
    gold, dark = (255, 198, 40, 255), (155, 105, 10, 255)
    for i, tx in enumerate([x0 + cw * 0.12, cx, x1 - cw * 0.12]):
        peak = top if i == 1 else top + ch * 0.2
        draw.polygon([(tx - cw * 0.14, band_top), (tx, peak), (tx + cw * 0.14, band_top)],
                     fill=gold, outline=dark, width=2)
    draw.rounded_rectangle([x0, band_top, x1, band_top + ch * 0.3], radius=ch * 0.1,
                           fill=gold, outline=dark, width=2)
    for tx, col in [(x0 + cw * 0.12, (229, 57, 53, 255)), (cx, (30, 136, 229, 255)), (x1 - cw * 0.12, (67, 160, 71, 255))]:
        r = ch * 0.09
        draw.ellipse([tx - r, band_top + ch * 0.06, tx + r, band_top + ch * 0.24], fill=col, outline=dark, width=2)


def render_emoji(emoji):
    cv = Image.new('RGBA', (CANVAS, CANVAS), (0, 0, 0, 0))
    d = ImageDraw.Draw(cv)
    d.text((CANVAS // 2, CANVAS // 2 + 26), emoji, font=FONT, anchor='mm', embedded_color=True)
    return cv


def make(emoji, stage):
    cv = render_emoji(emoji)
    if stage == 2:
        cv = tint(cv, 0.94, 1.00, 1.14)
        cv = ImageEnhance.Contrast(cv).enhance(1.10)
        cv = rim(cv, (205, 225, 255), 9, 3)
        star = (225, 240, 255, 235)
    else:
        cv = tint(cv, 1.18, 1.03, 0.70)
        cv = ImageEnhance.Contrast(cv).enhance(1.12)
        cv = rim(cv, (255, 208, 70), 11, 3)
        star = (255, 235, 140, 245)
    d = ImageDraw.Draw(cv)
    bbox = cv.getbbox()
    if stage == 3 and bbox:
        crown(d, (bbox[0] + bbox[2]) / 2, max(3, bbox[1] - CANVAS * 0.03), (bbox[2] - bbox[0]) * 0.4)
    spots = [(0.14, 0.22), (0.88, 0.16), (0.08, 0.6), (0.92, 0.52), (0.2, 0.06)]
    for i in range(3 if stage == 2 else 5):
        sx, sy = spots[i]
        sparkle(d, CANVAS * sx, CANVAS * sy, CANVAS * (0.03 if i % 2 else 0.045), star)
    return cv


# 解析 monsters.js
src = open('js/data/monsters.js', encoding='utf-8').read()
pattern = re.compile(r"(\w+):\s*\{\s*name:\s*'([^']*)',\s*elem:\s*'[^']*',\s*emoji:\s*'([^']*)'")
made = []
for mid, name, emoji in pattern.findall(src):
    if not re.search(r'[23]$', mid):
        continue
    if mid.startswith(EXCLUDE_PREFIX):
        continue
    stage = int(mid[-1])
    img = make(emoji, stage)
    path = f'photo/evo_{mid}.png'
    img.save(path, optimize=True)
    made.append((mid, name, os.path.getsize(path) // 1024))

print(f'generated {len(made)} images, total {sum(k for _, _, k in made)} KB')
print('--- sw.js PRECACHE 清單 ---')
for mid, _, _ in made:
    print(f"  './photo/evo_{mid}.png',")
