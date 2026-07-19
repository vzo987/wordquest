// ============ 地圖資料 ============
// 圖例：# 障礙物　~ 水/岩漿（不可走）　. 可走
//       P 玩家起點　M 怪獸出沒點　C 營火(存檔點)　S 商店　X 寶箱（可多個）
//       B Boss　E 出口（往下一關）　R 返回門（回上一關）
//       小寫字母 = 可走的裝飾地物（定義於 theme.deco）
const MAPS = {
  map1: {
    id: 'map1', name: '翠綠草原', elem: '木',
    lvRange: [1, 3], bossLv: 5, wordLv: 1,
    pool: ['caterpie', 'mushroom', 'bluefish', 'sandmouse'],
    bossId: 'boss_oak',
    prev: null, next: 'map2',
    chest: { gold: 100, item: 'potion' },
    theme: {
      ground: '#7ec850', ground2: '#74be49', block: '🌲', blockBg: '#4e9134',
      liquid: '#4fa8e0', name2: '木屬性怪獸出沒',
      deco: { f: '🌼', g: '🌾' },
    },
    grid: [
      '###############',
      '#P...fM..f#.fX#',
      '#.##..#....#..#',
      '#.C#.fM.#..M..#',
      '#...g##.#..M..#',
      '#.M...#g##...##',
      '#..#..M...f#X.#',
      '#S.#..#.M...B.#',
      '#...f..#g.....E',
      '###############',
    ],
  },
  map2: {
    id: 'map2', name: '碧水湖畔', elem: '水',
    lvRange: [4, 7], bossLv: 8, wordLv: 2,
    pool: ['bluefish', 'bubblecrab', 'icepen', 'mushroom'],
    bossId: 'boss_squid',
    prev: 'map1', next: 'map3',
    chest: { gold: 200, item: 'ball' },
    theme: {
      ground: '#e8d9a0', ground2: '#e0d095', block: '🌴', blockBg: '#3f9959',
      liquid: '#3d9be9', name2: '水屬性怪獸出沒',
      deco: { f: '🌺', s: '⛱️' },
    },
    grid: [
      '###############',
      '#P...~~~~~..MX#',
      '#R.M.~~~~~.#..#',
      '#.#..~~X~~....#',
      '#C......~~.M..#',
      '#..M.~~....#..#',
      '#.#..~~~~~.M..#',
      '#..M.f.~~~~B..#',
      '#S..s....~~...E',
      '###############',
    ],
  },
  map3: {
    id: 'map3', name: '烈焰火山', elem: '火',
    lvRange: [8, 12], bossLv: 13, wordLv: 3,
    pool: ['lizard', 'magmouse', 'flamebird', 'molemon'],
    bossId: 'boss_dragon',
    prev: 'map2', next: 'map4',
    chest: { gold: 400, item: 'big_potion' },
    theme: {
      ground: '#9a5a40', ground2: '#8f5138', block: '🌋', blockBg: '#5e3020',
      liquid: '#f4511e', name2: '火屬性怪獸出沒（水系剋制！）',
      deco: { f: '💎', g: '🦴' },
    },
    grid: [
      '###############',
      '#P..M...~~..fX#',
      '#R#...#.~~.M..#',
      '#.#.M.#..~...##',
      '#C#...##.~~.X.#',
      '#...#..M.~..M.#',
      '#.#...#.#~~f..#',
      '#.#.M.#..~.B..#',
      '#S..g.f.M.....E',
      '###############',
    ],
  },
  map4: {
    id: 'map4', name: '金石礦山', elem: '金',
    lvRange: [12, 16], bossLv: 18, wordLv: 3,
    pool: ['magnet', 'gearmon', 'steelbird', 'rockturtle'],
    bossId: 'boss_golem',
    prev: 'map3', next: null, // 最終地圖：擊敗 Boss 後由出口通關
    chest: { gold: 800, item: 'big_potion' },
    theme: {
      ground: '#9e9e9e', ground2: '#949494', block: '⛰️', blockBg: '#616161',
      liquid: '#455a64', name2: '金屬性怪獸出沒（火系剋制！）',
      deco: { f: '⛏️', g: '🕸️' },
    },
    grid: [
      '###############',
      '#P...#..M..f#X#',
      '#R#M.#.##.#...#',
      '#.#..M....#.M.#',
      '#C##.##.#...###',
      '#..f.M..#.M...#',
      '#.##.#.##..#.X#',
      '#.M..#..M..B..#',
      '#S...#g.......E',
      '###############',
    ],
  },
};

const MAP_ORDER = ['map1', 'map2', 'map3', 'map4'];
const TILE = 44; // 像素
