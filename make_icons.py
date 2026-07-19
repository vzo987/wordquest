"""產生 PWA 圖示：戴帽小冒險者（與遊戲內 avatar.js 同造型）。
輸出 icons/icon-192.png, icon-512.png, icon3d-192.png, icon3d-512.png"""
from PIL import Image, ImageDraw, ImageFont
import os

S = 1024  # 高解析繪製後縮小（抗鋸齒）

C = {
    'bg_top': (43, 58, 122), 'bg_bot': (74, 95, 193),
    'skin': (255, 217, 176), 'blush': (255, 171, 145),
    'hair': (123, 75, 42),
    'hat': (176, 125, 79), 'hat_dark': (141, 94, 58), 'band': (93, 64, 55),
    'tunic': (102, 187, 106), 'tunic_dark': (67, 160, 71),
    'belt': (93, 64, 55), 'buckle': (255, 213, 79),
    'pants': (141, 110, 99), 'boots': (78, 52, 46),
    'strap': (78, 52, 46),
    'outline': (60, 40, 30),
    'badge': (244, 81, 30),
}
OW = 10  # 外框線寬


def draw_base(d):
    # 漸層背景
    for y in range(S):
        t = y / S
        col = tuple(int(C['bg_top'][i] + (C['bg_bot'][i] - C['bg_top'][i]) * t) for i in range(3))
        d.line([(0, y), (S, y)], fill=col)


def draw_adventurer(d, cx, top, scale):
    """以 avatar.js 的比例畫 Q 版冒險者。scale=1 時高約 600px"""
    def px(v):
        return int(v * scale)

    o = C['outline']
    # 靴子
    for s in (-1, 1):
        x0 = cx + px(18 * s) - px(34) if s < 0 else cx + px(18 * s)
        d.rounded_rectangle([x0, top + px(500), x0 + px(66), top + px(566)], px(20), fill=C['boots'], outline=o, width=OW)
    # 褲子
    for s in (-1, 1):
        x0 = cx + px(12 * s) - px(64) if s < 0 else cx + px(12 * s)
        d.rounded_rectangle([x0, top + px(432), x0 + px(64), top + px(500)], px(18), fill=C['pants'], outline=o, width=OW)
    # 手臂
    for s in (-1, 1):
        x0 = cx + px(88 * s) - (px(44) if s < 0 else 0)
        d.rounded_rectangle([x0, top + px(316), x0 + px(44), top + px(424)], px(22), fill=C['tunic_dark'], outline=o, width=OW)
        hx = cx + px(110 * s)
        d.ellipse([hx - px(22), top + px(406), hx + px(22), top + px(450)], fill=C['skin'], outline=o, width=OW)
    # 身體
    d.rounded_rectangle([cx - px(96), top + px(296), cx + px(96), top + px(444)], px(40), fill=C['tunic'], outline=o, width=OW)
    # 肩帶
    for s in (-1, 1):
        d.line([cx + px(52 * s), top + px(300), cx + px(36 * s), top + px(400)], fill=C['strap'], width=px(18))
    # 腰帶
    d.rectangle([cx - px(96), top + px(392), cx + px(96), top + px(420)], fill=C['belt'])
    d.rounded_rectangle([cx - px(18), top + px(388), cx + px(18), top + px(424)], px(10), fill=C['buckle'], outline=o, width=OW)
    # 頭
    d.ellipse([cx - px(108), top + px(100), cx + px(108), top + px(316)], fill=C['skin'], outline=o, width=OW)
    # 耳朵
    for s in (-1, 1):
        ex = cx + px(104 * s)
        d.ellipse([ex - px(18), top + px(206), ex + px(18), top + px(242)], fill=C['skin'], outline=o, width=OW)
    # 眼睛與高光
    for s in (-1, 1):
        ex = cx + px(42 * s)
        d.ellipse([ex - px(17), top + px(202), ex + px(17), top + px(246)], fill=(62, 39, 35))
        d.ellipse([ex - px(12), top + px(208), ex, top + px(222)], fill=(255, 255, 255))
    # 微笑
    d.arc([cx - px(24), top + px(230), cx + px(24), top + px(266)], 20, 160, fill=(141, 75, 47), width=px(9))
    # 腮紅
    for s in (-1, 1):
        bx = cx + px(72 * s)
        d.ellipse([bx - px(16), top + px(246), bx + px(16), top + px(266)], fill=C['blush'])
    # 帽簷
    d.ellipse([cx - px(160), top + px(92), cx + px(160), top + px(172)], fill=C['hat_dark'], outline=o, width=OW)
    d.ellipse([cx - px(152), top + px(88), cx + px(152), top + px(156)], fill=C['hat'])
    # 帽冠
    d.pieslice([cx - px(92), top + px(0), cx + px(92), top + px(200)], 180, 360, fill=C['hat'], outline=o, width=OW)
    # 帽帶
    d.rectangle([cx - px(92), top + px(72), cx + px(92), top + px(100)], fill=C['band'])
    d.ellipse([cx + px(40), top + px(74), cx + px(64), top + px(98)], fill=C['buckle'])


def make(path, badge3d=False):
    img = Image.new('RGB', (S, S))
    d = ImageDraw.Draw(img)
    draw_base(d)
    draw_adventurer(d, S // 2, int(S * 0.20), 1.05)
    if badge3d:
        d.rounded_rectangle([S - 380, S - 300, S - 60, S - 80], 60, fill=C['badge'], outline=(255, 255, 255), width=16)
        try:
            font = ImageFont.truetype('arialbd.ttf', 170)
        except OSError:
            font = ImageFont.load_default()
        d.text((S - 220, S - 190), '3D', font=font, fill=(255, 255, 255), anchor='mm')
    os.makedirs('icons', exist_ok=True)
    img.resize((512, 512), Image.LANCZOS).save(path.format(512))
    img.resize((192, 192), Image.LANCZOS).save(path.format(192))


make('icons/icon-{}.png', badge3d=False)
make('icons/icon3d-{}.png', badge3d=True)
print('icons generated:', os.listdir('icons'))
