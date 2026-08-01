"""產生視覺圖鑑對照表：82 隻怪獸依進化線排列（每線一列 × 三階段）。
輸出 dex_sheet_*.png 共 5 張（初始夥伴/野生A/野生B/圖片怪獸/BOSS）。"""
import re
import os
from PIL import Image, ImageDraw, ImageFont

EMOJI_FONT = ImageFont.truetype('C:/Windows/Fonts/seguiemj.ttf', 120)
NAME_FONT = ImageFont.truetype('C:/Windows/Fonts/msjh.ttc', 22)
TITLE_FONT = ImageFont.truetype('C:/Windows/Fonts/msjh.ttc', 34)
LABEL_FONT = ImageFont.truetype('C:/Windows/Fonts/msjh.ttc', 18)

ELEM_COLOR = {'金': (201, 162, 39), '木': (67, 160, 71), '水': (30, 136, 229), '火': (244, 81, 30), '土': (141, 110, 99)}
CELL_W, CELL_H, IMG_S = 210, 250, 160

# 解析 monsters.js
src = open('js/data/monsters.js', encoding='utf-8').read()
pattern = re.compile(r"(\w+):\s*\{\s*name:\s*'([^']*)',\s*elem:\s*'([^']*)',\s*emoji:\s*'([^']*)'")
SP = {m[0]: {'name': m[1], 'elem': m[2], 'emoji': m[3]} for m in pattern.findall(src)}


def species_image(mid):
    """取得遊戲內實際使用的圖像"""
    for path in (f'photo/evo_{mid}.png', f'photo/mon_{mid}.png'):
        if os.path.exists(path):
            return Image.open(path).convert('RGBA')
    cv = Image.new('RGBA', (200, 200), (0, 0, 0, 0))
    d = ImageDraw.Draw(cv)
    d.text((100, 108), SP[mid]['emoji'], font=EMOJI_FONT, anchor='mm', embedded_color=True)
    return cv


def draw_cell(sheet, d, x, y, mid, stage_label):
    sp = SP[mid]
    im = species_image(mid)
    k = min(IMG_S / im.width, IMG_S / im.height)
    im = im.resize((max(1, int(im.width * k)), max(1, int(im.height * k))), Image.LANCZOS)
    sheet.alpha_composite(im, (x + (CELL_W - im.width) // 2, y + 14 + (IMG_S - im.height) // 2))
    col = ELEM_COLOR.get(sp['elem'], (80, 80, 80))
    d.text((x + CELL_W // 2, y + IMG_S + 34), sp['name'], font=NAME_FONT, fill=(40, 40, 40), anchor='mm')
    d.text((x + CELL_W // 2, y + IMG_S + 62), f"{stage_label}・{sp['elem']}屬性", font=LABEL_FONT, fill=col, anchor='mm')


def make_sheet(title, lines, fname):
    """lines: list of [id...]（1~3 個一列）"""
    W = CELL_W * 3 + 80
    H = 90 + len(lines) * (CELL_H + 14) + 20
    sheet = Image.new('RGBA', (W, H), (250, 248, 240, 255))
    d = ImageDraw.Draw(sheet)
    d.text((W // 2, 45), title, font=TITLE_FONT, fill=(40, 40, 70), anchor='mm')
    stage_names = ['一階', '二階', '三階']
    for r, line in enumerate(lines):
        y = 90 + r * (CELL_H + 14)
        d.rounded_rectangle([20, y, W - 20, y + CELL_H], radius=16, fill=(255, 255, 255, 255), outline=(220, 215, 200), width=2)
        for c, mid in enumerate(line):
            label = stage_names[c] if len(line) > 1 else '單體'
            draw_cell(sheet, d, 40 + c * CELL_W, y, mid, label)
        # 進化箭頭
        for c in range(len(line) - 1):
            ax = 40 + (c + 1) * CELL_W
            d.text((ax, y + IMG_S // 2 + 14), '→', font=TITLE_FONT, fill=(180, 170, 150), anchor='mm')
    sheet.convert('RGB').save(fname, optimize=True)
    print(fname, sheet.size, os.path.getsize(fname) // 1024, 'KB')


L = lambda base: [base + '1' if (base + '1') in SP else base, base + '2', base + '3']

make_sheet('初始夥伴（五選一・Lv.10/25 進化）',
           [L('iron'), L('wood'), L('water'), L('fire'), L('earth')], 'dex_sheet_1_starters.png')

make_sheet('野生怪獸 A：木・水・火（Lv.20/40 進化）',
           [['caterpie', 'caterpie2', 'caterpie3'], ['mushroom', 'mushroom2', 'mushroom3'], ['cactus', 'cactus2', 'cactus3'],
            ['bluefish', 'bluefish2', 'bluefish3'], ['bubblecrab', 'bubblecrab2', 'bubblecrab3'], ['icepen', 'icepen2', 'icepen3'],
            ['lizard', 'lizard2', 'lizard3'], ['magmouse', 'magmouse2', 'magmouse3'], ['flamebird', 'flamebird2', 'flamebird3']],
           'dex_sheet_2_wild_a.png')

make_sheet('野生怪獸 B：金・土（Lv.20/40 進化）',
           [['magnet', 'magnet2', 'magnet3'], ['gearmon', 'gearmon2', 'gearmon3'], ['steelbird', 'steelbird2', 'steelbird3'],
            ['sandmouse', 'sandmouse2', 'sandmouse3'], ['rockturtle', 'rockturtle2', 'rockturtle3'], ['molemon', 'molemon2', 'molemon3']],
           'dex_sheet_3_wild_b.png')

make_sheet('圖片怪獸（玩家原創美術）',
           [['nail1', 'nail2', 'nail3'], ['apple1', 'apple2', 'apple3'], ['firetooth']],
           'dex_sheet_4_photo.png')

make_sheet('BOSS 五王（三循環鎮守・Lv.25/45 進化）',
           [['boss_oak', 'boss_oak2', 'boss_oak3'], ['boss_squid', 'boss_squid2', 'boss_squid3'],
            ['boss_dragon', 'boss_dragon2', 'boss_dragon3'], ['boss_golem', 'boss_golem2', 'boss_golem3'],
            ['boss_earthlord', 'boss_earthlord2', 'boss_earthlord3']],
           'dex_sheet_5_boss.png')
