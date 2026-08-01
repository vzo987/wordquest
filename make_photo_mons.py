"""照片怪獸處理：白底去背（從四角泛洪）＋縮至 512px，輸出 photo/mon_*.png"""
from PIL import Image, ImageDraw
import os

SRC = {
    'nail1': '1_1_小金鼠_金.jpg',
    'nail2': '1_2_丁小子_金.jpg',
    'nail3': '1_3_丁頭_金.jpg',
    'apple1': '2_1_蘋果小藤_木.jpg',
    'apple2': '2_2_蘋果大師_木.jpg',
    'apple3': '2_3_蘋果大神_金.jpg',
    'firetooth': '3_1_火大牙_火.jpg',
}
SENTINEL = (255, 0, 255, 255)

for mid, fname in SRC.items():
    img = Image.open(os.path.join('photo', fname)).convert('RGBA')
    # 從四角泛洪，把連通的白色背景填為哨兵色（保留圖內部的白色如眼睛牙齒）
    w, h = img.size
    for seed in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1), (w // 2, 0), (w // 2, h - 1)]:
        try:
            ImageDraw.floodfill(img, seed, SENTINEL, thresh=42)
        except Exception:
            pass
    px = img.load()
    for y in range(h):
        for x in range(w):
            if px[x, y][:3] == SENTINEL[:3]:
                px[x, y] = (0, 0, 0, 0)
    # 裁掉透明邊界再等比縮到 512
    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)
    img.thumbnail((512, 512), Image.LANCZOS)
    out = os.path.join('photo', f'mon_{mid}.png')
    img.save(out, optimize=True)
    print(mid, img.size, os.path.getsize(out) // 1024, 'KB')
