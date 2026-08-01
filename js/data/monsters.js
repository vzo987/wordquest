// ============ 怪獸圖鑑資料 ============
// base: Lv1 基礎值；grow: 每升 1 級成長；evolveLv/evolveTo: 進化
// learnset: {等級: [技能id]}；catchRate: 基礎收服率（0 = 不可收服）
const SPECIES = {
  // ================= 初始夥伴（五行三段進化） =================
  // --- 金：高防禦 ---
  iron1: { name: '小鐵甲', elem: '金', emoji: '🐞', base: { hp: 40, atk: 9, def: 13 }, grow: { hp: 6, atk: 2.2, def: 3.0 },
    evolveLv: 10, evolveTo: 'iron2', learnset: { 1: ['tackle', 'metal_claw'], 3: ['iron_wall'], 8: ['steel_storm'] },
    catchRate: 0.15, expYield: 22, desc: '堅硬外殼的小蟲，防禦力一流，慢慢磨也能贏！' },
  iron2: { name: '鋼殼獸', elem: '金', emoji: '🪲', base: { hp: 62, atk: 15, def: 22 }, grow: { hp: 8, atk: 2.8, def: 3.6 },
    evolveLv: 25, evolveTo: 'iron3', learnset: { 15: ['titan_smash'] }, catchRate: 0, expYield: 40, desc: '進化後外殼閃耀金屬光澤，銅牆鐵壁。' },
  iron3: { name: '鎧甲泰坦', elem: '金', emoji: '🪲', base: { hp: 95, atk: 24, def: 34 }, grow: { hp: 10, atk: 3.5, def: 4.2 },
    learnset: {}, catchRate: 0, expYield: 70, desc: '最終進化！鋼殼鍍上黃金的泰坦甲蟲。' },

  // --- 木：高回復 ---
  wood1: { name: '芽芽獸', elem: '木', emoji: '🌱', base: { hp: 45, atk: 9, def: 9 }, grow: { hp: 7, atk: 2.2, def: 2.2 },
    evolveLv: 10, evolveTo: 'wood2', learnset: { 1: ['tackle', 'vine_whip'], 3: ['heal_light'], 8: ['forest_bless'] },
    catchRate: 0.15, expYield: 22, desc: '頭上長著嫩芽的小傢伙，擅長治癒自己。' },
  wood2: { name: '花藤獸', elem: '木', emoji: '🌷', base: { hp: 70, atk: 15, def: 15 }, grow: { hp: 9, atk: 2.8, def: 2.8 },
    evolveLv: 25, evolveTo: 'wood3', learnset: { 15: ['wood_burst'] }, catchRate: 0, expYield: 40, desc: '藤蔓與花朵纏繞全身，生命力旺盛。' },
  wood3: { name: '森林巨靈', elem: '木', emoji: '🌲', base: { hp: 105, atk: 24, def: 24 }, grow: { hp: 12, atk: 3.5, def: 3.5 },
    learnset: {}, catchRate: 0, expYield: 70, desc: '最終進化！參天針葉巨木化身的森林巨靈。' },

  // --- 水：均衡 ---
  water1: { name: '小水滴', elem: '水', emoji: '💧', base: { hp: 42, atk: 10, def: 10 }, grow: { hp: 6.5, atk: 2.5, def: 2.5 },
    evolveLv: 10, evolveTo: 'water2', learnset: { 1: ['tackle', 'water_gun'], 3: ['aqua_veil'], 8: ['ice_beam'] },
    catchRate: 0.15, expYield: 22, desc: '圓滾滾的水滴精靈，攻守均衡的萬能型。' },
  water2: { name: '波浪精', elem: '水', emoji: '🐬', base: { hp: 65, atk: 17, def: 16 }, grow: { hp: 8.5, atk: 3.0, def: 3.0 },
    evolveLv: 25, evolveTo: 'water3', learnset: { 15: ['tsunami'] }, catchRate: 0, expYield: 40, desc: '乘著波浪的水之精靈，靈活自如。' },
  water3: { name: '深海蛟龍', elem: '水', emoji: '🐉', base: { hp: 98, atk: 27, def: 26 }, grow: { hp: 11, atk: 3.8, def: 3.8 },
    learnset: {}, catchRate: 0, expYield: 70, desc: '最終進化！翻江倒海的深海蛟龍。' },

  // --- 火：高爆發 ---
  fire1: { name: '小火苗', elem: '火', emoji: '🔥', base: { hp: 38, atk: 13, def: 8 }, grow: { hp: 6, atk: 3.0, def: 2.0 },
    evolveLv: 10, evolveTo: 'fire2', learnset: { 1: ['tackle', 'ember'], 3: ['blaze_up'], 8: ['flame_burst'] },
    catchRate: 0.15, expYield: 22, desc: '活潑的小火苗，攻擊力超群，速戰速決！' },
  fire2: { name: '烈焰狐', elem: '火', emoji: '🦊', base: { hp: 58, atk: 21, def: 13 }, grow: { hp: 8, atk: 3.6, def: 2.5 },
    evolveLv: 25, evolveTo: 'fire3', learnset: { 15: ['inferno'] }, catchRate: 0, expYield: 40, desc: '尾巴燃燒烈焰的神秘狐狸。' },
  fire3: { name: '炎獄天虎', elem: '火', emoji: '🐯', base: { hp: 88, atk: 32, def: 20 }, grow: { hp: 10, atk: 4.5, def: 3.0 },
    learnset: {}, catchRate: 0, expYield: 70, desc: '最終進化！烈焰纏身的百獸之王。' },

  // --- 土：高生命 ---
  earth1: { name: '小岩怪', elem: '土', emoji: '🪨', base: { hp: 50, atk: 10, def: 11 }, grow: { hp: 8, atk: 2.3, def: 2.6 },
    evolveLv: 10, evolveTo: 'earth2', learnset: { 1: ['tackle', 'rock_throw'], 3: ['earth_shield'], 8: ['sand_heal'] },
    catchRate: 0.15, expYield: 22, desc: '圓圓的小石頭精靈，生命力超強。' },
  earth2: { name: '石靈守衛', elem: '土', emoji: '🗿', base: { hp: 78, atk: 16, def: 18 }, grow: { hp: 10, atk: 2.9, def: 3.2 },
    evolveLv: 25, evolveTo: 'earth3', learnset: { 15: ['quake'] }, catchRate: 0, expYield: 40, desc: '古老石像甦醒而成的守護者。' },
  earth3: { name: '大地泰坦', elem: '土', emoji: '⛰️', base: { hp: 115, atk: 25, def: 27 }, grow: { hp: 13, atk: 3.6, def: 3.8 },
    learnset: {}, catchRate: 0, expYield: 70, desc: '最終進化！山岳化身的大地泰坦。' },

  // ================= 野生怪獸（可收服） =================
  // --- 木系 ---
  caterpie: { name: '綠毛蟲', elem: '木', emoji: '🐛', base: { hp: 30, atk: 7, def: 6 }, grow: { hp: 5, atk: 1.8, def: 1.8 },
    learnset: { 1: ['tackle', 'vine_whip'], 8: ['heal_light'] }, catchRate: 0.30, expYield: 15, desc: '慢吞吞的綠毛蟲，是新手冒險者的好對手。' },
  mushroom: { name: '蘑菇寶寶', elem: '木', emoji: '🍄', base: { hp: 34, atk: 8, def: 7 }, grow: { hp: 5.5, atk: 2.0, def: 2.0 },
    learnset: { 1: ['tackle', 'vine_whip'], 6: ['heal_light'] }, catchRate: 0.25, expYield: 17, desc: '頂著紅色蘑菇帽的小可愛。' },
  cactus: { name: '刺刺球', elem: '木', emoji: '🌵', base: { hp: 36, atk: 10, def: 8 }, grow: { hp: 5.5, atk: 2.3, def: 2.0 },
    learnset: { 1: ['tackle', 'vine_whip'], 8: ['forest_bless'] }, catchRate: 0.22, expYield: 19, desc: '渾身是刺的仙人掌精靈，別隨便抱它！' },

  // --- 水系 ---
  bluefish: { name: '小藍魚', elem: '水', emoji: '🐟', base: { hp: 32, atk: 9, def: 7 }, grow: { hp: 5, atk: 2.2, def: 1.8 },
    learnset: { 1: ['tackle', 'water_gun'] }, catchRate: 0.28, expYield: 16, desc: '在淺水裡游來游去的藍色小魚。' },
  bubblecrab: { name: '泡泡蟹', elem: '水', emoji: '🦀', base: { hp: 36, atk: 9, def: 10 }, grow: { hp: 5.5, atk: 2.0, def: 2.4 },
    learnset: { 1: ['tackle', 'water_gun'], 7: ['aqua_veil'] }, catchRate: 0.25, expYield: 18, desc: '會吐泡泡的小螃蟹，鉗子很有力。' },
  icepen: { name: '冰寶企鵝', elem: '水', emoji: '🐧', base: { hp: 40, atk: 11, def: 9 }, grow: { hp: 6, atk: 2.5, def: 2.2 },
    learnset: { 1: ['tackle', 'water_gun'], 8: ['ice_beam'] }, catchRate: 0.20, expYield: 22, desc: '來自冰原的小企鵝，會發射冰凍光線。' },

  // --- 火系 ---
  lizard: { name: '火蜥蜴', elem: '火', emoji: '🦎', base: { hp: 33, atk: 11, def: 7 }, grow: { hp: 5, atk: 2.6, def: 1.8 },
    learnset: { 1: ['tackle', 'ember'] }, catchRate: 0.25, expYield: 18, desc: '尾巴會冒火花的敏捷蜥蜴。' },
  magmouse: { name: '熔岩鼠', elem: '火', emoji: '🐭', base: { hp: 35, atk: 12, def: 8 }, grow: { hp: 5.5, atk: 2.8, def: 2.0 },
    learnset: { 1: ['tackle', 'ember'], 7: ['blaze_up'] }, catchRate: 0.22, expYield: 20, desc: '住在火山岩縫裡的火燙小老鼠。' },
  flamebird: { name: '噴火鳥', elem: '火', emoji: '🐤', base: { hp: 38, atk: 13, def: 8 }, grow: { hp: 6, atk: 3.0, def: 2.0 },
    learnset: { 1: ['tackle', 'ember'], 8: ['flame_burst'] }, catchRate: 0.18, expYield: 24, desc: '噴著火焰飛翔的小鳥，脾氣火爆。' },

  // --- 金系 ---
  magnet: { name: '磁鐵怪', elem: '金', emoji: '🧲', base: { hp: 34, atk: 10, def: 11 }, grow: { hp: 5, atk: 2.3, def: 2.6 },
    learnset: { 1: ['tackle', 'metal_claw'] }, catchRate: 0.24, expYield: 19, desc: '會吸附鐵器的奇妙磁鐵生物。' },
  gearmon: { name: '齒輪獸', elem: '金', emoji: '⚙️', base: { hp: 38, atk: 11, def: 13 }, grow: { hp: 5.5, atk: 2.5, def: 2.8 },
    learnset: { 1: ['tackle', 'metal_claw'], 7: ['iron_wall'] }, catchRate: 0.20, expYield: 22, desc: '齒輪不停轉動的機械小獸。' },
  steelbird: { name: '鋼翼鷹', elem: '金', emoji: '🦅', base: { hp: 40, atk: 13, def: 12 }, grow: { hp: 6, atk: 2.8, def: 2.6 },
    learnset: { 1: ['tackle', 'metal_claw'], 8: ['steel_storm'] }, catchRate: 0.16, expYield: 26, desc: '翅膀如鋼刃般銳利的猛禽。' },

  // --- 土系 ---
  sandmouse: { name: '沙沙鼠', elem: '土', emoji: '🐹', base: { hp: 36, atk: 9, def: 9 }, grow: { hp: 6, atk: 2.0, def: 2.2 },
    learnset: { 1: ['tackle', 'rock_throw'] }, catchRate: 0.28, expYield: 16, desc: '在沙地裡打滾的圓滾滾倉鼠。' },
  rockturtle: { name: '岩石龜', elem: '土', emoji: '🐢', base: { hp: 44, atk: 9, def: 13 }, grow: { hp: 7, atk: 2.0, def: 2.8 },
    learnset: { 1: ['tackle', 'rock_throw'], 7: ['earth_shield'] }, catchRate: 0.22, expYield: 20, desc: '背著岩石龜殼，防禦滴水不漏。' },
  molemon: { name: '鑽地鼠', elem: '土', emoji: '🦫', base: { hp: 42, atk: 12, def: 10 }, grow: { hp: 6.5, atk: 2.6, def: 2.4 },
    learnset: { 1: ['tackle', 'rock_throw'], 8: ['sand_heal'] }, catchRate: 0.18, expYield: 24, desc: '擅長鑽地偷襲的地底居民。' },

  // ================= BOSS（稀有收服目標：擊敗後 10% 機率收服，5 小時重生） =================
  boss_oak: { name: '橡樹王', elem: '木', emoji: '🌳', boss: true, base: { hp: 90, atk: 14, def: 12 }, grow: { hp: 10, atk: 2.5, def: 2.5 },
    learnset: { 1: ['tackle', 'vine_whip', 'forest_bless'] }, catchRate: 0.10, expYield: 80, desc: '翠綠草原的守護者，甦醒的千年橡樹。' },
  boss_squid: { name: '深湖大王烏賊', elem: '水', emoji: '🦑', boss: true, base: { hp: 120, atk: 18, def: 14 }, grow: { hp: 11, atk: 2.8, def: 2.6 },
    learnset: { 1: ['tackle', 'water_gun', 'ice_beam'] }, catchRate: 0.10, expYield: 120, desc: '沉睡湖底的巨大烏賊，觸手掀起巨浪。' },
  boss_dragon: { name: '炎龍王', elem: '火', emoji: '🐲', boss: true, base: { hp: 150, atk: 24, def: 16 }, grow: { hp: 12, atk: 3.2, def: 2.8 },
    learnset: { 1: ['tackle', 'flame_burst', 'blaze_up'] }, catchRate: 0.10, expYield: 180, desc: '統治烈焰火山的龍王，吐息足以熔化岩石。' },
  boss_golem: { name: '鋼鐵魔像', elem: '金', emoji: '🤖', boss: true, base: { hp: 190, atk: 28, def: 22 }, grow: { hp: 13, atk: 3.5, def: 3.2 },
    learnset: { 1: ['tackle', 'steel_storm', 'iron_wall'] }, catchRate: 0.10, expYield: 300, desc: '金石礦山深處的上古魔像，鋼鐵的守護者！' },
  boss_earthlord: { name: '遠古大地龍', elem: '土', emoji: '🦖', boss: true, base: { hp: 230, atk: 32, def: 26 }, grow: { hp: 14, atk: 3.8, def: 3.5 },
    learnset: { 1: ['tackle', 'rock_throw', 'earth_shield', 'quake'] }, catchRate: 0.10, expYield: 400, desc: '沉睡在黃土峽谷的遠古龍王，大地因牠的甦醒而震動——最終的考驗！' },
};

// ================= 野生怪獸二階/三階進化型態（全怪獸三段進化） =================
// 一階 Lv.20 進化二階、二階 Lv.40 進化三階（地圖 6~10 出沒二階、11~15 出沒三階）
Object.assign(SPECIES, {
  // --- 木系 ---
  caterpie2: { name: '彩繭蛹', elem: '木', emoji: '🥚', base: { hp: 53, atk: 12, def: 11 }, grow: { hp: 6.8, atk: 2.4, def: 2.4 },
    learnset: { 1: ['tackle', 'vine_whip', 'heal_light'], 24: ['forest_bless'] }, catchRate: 0.20, expYield: 40, desc: '綠毛蟲結成七彩繭殼沉睡中，防禦悄悄變硬了。' },
  caterpie3: { name: '蝶舞皇', elem: '木', emoji: '🦋', base: { hp: 81, atk: 19, def: 16 }, grow: { hp: 8.5, atk: 3.1, def: 3.1 },
    learnset: { 1: ['tackle', 'vine_whip', 'heal_light', 'forest_bless'], 44: ['wood_burst'] }, catchRate: 0.15, expYield: 70, desc: '最終進化！破繭而出、鱗粉閃耀森林之光的蝶之王者。' },
  mushroom2: { name: '傘菇騎士', elem: '木', emoji: '🍄', base: { hp: 60, atk: 14, def: 12 }, grow: { hp: 7.4, atk: 2.7, def: 2.7 },
    learnset: { 1: ['tackle', 'vine_whip', 'heal_light'], 24: ['forest_bless'] }, catchRate: 0.15, expYield: 42, desc: '長高一倍的蘑菇騎士，菇傘變成堅固的頭盔。' },
  mushroom3: { name: '千年菇皇', elem: '木', emoji: '🍄', base: { hp: 92, atk: 22, def: 19 }, grow: { hp: 9.4, atk: 3.4, def: 3.4 },
    learnset: { 1: ['tackle', 'vine_whip', 'heal_light', 'forest_bless'], 44: ['wood_burst'] }, catchRate: 0.10, expYield: 72, desc: '最終進化！戴上金冠的千年菇王，森林的守護者。' },
  cactus2: { name: '尖刺巨人', elem: '木', emoji: '🌵', base: { hp: 63, atk: 18, def: 14 }, grow: { hp: 7.4, atk: 3.1, def: 2.7 },
    learnset: { 1: ['tackle', 'vine_whip', 'heal_light'], 24: ['forest_bless'] }, catchRate: 0.12, expYield: 44, desc: '長成巨人的仙人掌，渾身尖刺更粗更利。' },
  cactus3: { name: '沙漠刺皇', elem: '木', emoji: '🌵', base: { hp: 97, atk: 27, def: 22 }, grow: { hp: 9.4, atk: 3.9, def: 3.4 },
    learnset: { 1: ['tackle', 'vine_whip', 'heal_light', 'forest_bless'], 44: ['wood_burst'] }, catchRate: 0.07, expYield: 74, desc: '最終進化！頭頂金冠的仙人掌之皇，尖刺如金針。' },

  // --- 水系 ---
  bluefish2: { name: '劍旗魚', elem: '水', emoji: '🐠', base: { hp: 56, atk: 16, def: 12 }, grow: { hp: 6.8, atk: 3.0, def: 2.4 },
    learnset: { 1: ['tackle', 'water_gun', 'aqua_veil'], 24: ['ice_beam'] }, catchRate: 0.18, expYield: 41, desc: '長出劍一般的尖吻，游速快如閃電。' },
  bluefish3: { name: '深海霸鯊', elem: '水', emoji: '🦈', base: { hp: 86, atk: 24, def: 19 }, grow: { hp: 8.5, atk: 3.7, def: 3.1 },
    learnset: { 1: ['tackle', 'water_gun', 'ice_beam', 'aqua_veil'], 44: ['tsunami'] }, catchRate: 0.13, expYield: 71, desc: '最終進化！稱霸深海的鯊魚王者。' },
  bubblecrab2: { name: '鐵甲蟹將', elem: '水', emoji: '🦞', base: { hp: 63, atk: 16, def: 18 }, grow: { hp: 7.4, atk: 2.7, def: 3.2 },
    learnset: { 1: ['tackle', 'water_gun', 'aqua_veil'], 24: ['ice_beam'] }, catchRate: 0.15, expYield: 43, desc: '巨螯進化成鐵鉗，橫著走也沒人敢攔。' },
  bubblecrab3: { name: '深淵蟹皇', elem: '水', emoji: '🦞', base: { hp: 97, atk: 24, def: 27 }, grow: { hp: 9.4, atk: 3.4, def: 4.1 },
    learnset: { 1: ['tackle', 'water_gun', 'ice_beam', 'aqua_veil'], 44: ['tsunami'] }, catchRate: 0.10, expYield: 73, desc: '最終進化！金冠巨螯掀起漩渦的深海蟹皇。' },
  icepen2: { name: '雪羽企鵝', elem: '水', emoji: '🐧', base: { hp: 70, atk: 19, def: 16 }, grow: { hp: 8.1, atk: 3.4, def: 3.0 },
    learnset: { 1: ['tackle', 'water_gun', 'aqua_veil'], 24: ['ice_beam'] }, catchRate: 0.10, expYield: 47, desc: '羽毛結成雪花鎧甲的企鵝，走過的地方都會結霜。' },
  icepen3: { name: '冰晶帝企鵝', elem: '水', emoji: '🐧', base: { hp: 108, atk: 30, def: 24 }, grow: { hp: 10.2, atk: 4.3, def: 3.7 },
    learnset: { 1: ['tackle', 'water_gun', 'ice_beam', 'aqua_veil'], 44: ['tsunami'] }, catchRate: 0.05, expYield: 77, desc: '最終進化！頭戴冰晶金冠的極地帝王企鵝。' },

  // --- 火系 ---
  lizard2: { name: '炎鱗鱷蜥', elem: '火', emoji: '🐊', base: { hp: 58, atk: 19, def: 12 }, grow: { hp: 6.8, atk: 3.5, def: 2.4 },
    learnset: { 1: ['tackle', 'ember', 'blaze_up'], 24: ['flame_burst'] }, catchRate: 0.15, expYield: 43, desc: '鱗片燒得通紅的鱷蜥，咬合力驚人。' },
  lizard3: { name: '烈焰雷龍', elem: '火', emoji: '🦕', base: { hp: 89, atk: 30, def: 19 }, grow: { hp: 8.5, atk: 4.4, def: 3.1 },
    learnset: { 1: ['tackle', 'ember', 'flame_burst', 'blaze_up'], 44: ['inferno'] }, catchRate: 0.10, expYield: 73, desc: '最終進化！足以撼動火山的遠古烈焰巨龍。' },
  magmouse2: { name: '火焰竄鼠', elem: '火', emoji: '🐀', base: { hp: 61, atk: 21, def: 14 }, grow: { hp: 7.4, atk: 3.8, def: 2.7 },
    learnset: { 1: ['tackle', 'ember', 'blaze_up'], 24: ['flame_burst'] }, catchRate: 0.12, expYield: 45, desc: '奔跑時拖著火尾巴，快得只剩殘影。' },
  magmouse3: { name: '熔核鼠皇', elem: '火', emoji: '🐀', base: { hp: 95, atk: 32, def: 22 }, grow: { hp: 9.4, atk: 4.8, def: 3.4 },
    learnset: { 1: ['tackle', 'ember', 'flame_burst', 'blaze_up'], 44: ['inferno'] }, catchRate: 0.07, expYield: 75, desc: '最終進化！尾巴藏著熔岩核心、頭戴金冠的鼠皇。' },
  flamebird2: { name: '烈羽火隼', elem: '火', emoji: '🐦', base: { hp: 67, atk: 23, def: 14 }, grow: { hp: 8.1, atk: 4.1, def: 2.7 },
    learnset: { 1: ['tackle', 'ember', 'blaze_up'], 24: ['flame_burst'] }, catchRate: 0.08, expYield: 49, desc: '俯衝時像一顆流星，羽翼燃著烈焰。' },
  flamebird3: { name: '華彩火鳳', elem: '火', emoji: '🦚', base: { hp: 103, atk: 35, def: 22 }, grow: { hp: 10.2, atk: 5.1, def: 3.4 },
    learnset: { 1: ['tackle', 'ember', 'flame_burst', 'blaze_up'], 44: ['inferno'] }, catchRate: 0.05, expYield: 79, desc: '最終進化！開屏即燃天的傳說火鳳凰。' },

  // --- 金系 ---
  magnet2: { name: '電磁浮磁', elem: '金', emoji: '🧲', base: { hp: 60, atk: 18, def: 19 }, grow: { hp: 6.8, atk: 3.1, def: 3.5 },
    learnset: { 1: ['tackle', 'metal_claw', 'iron_wall'], 24: ['steel_storm'] }, catchRate: 0.14, expYield: 44, desc: '漂浮在空中的大磁鐵，靠近的鐵器都會被吸走。' },
  magnet3: { name: '磁暴核心', elem: '金', emoji: '🧲', base: { hp: 92, atk: 27, def: 30 }, grow: { hp: 8.5, atk: 3.9, def: 4.4 },
    learnset: { 1: ['tackle', 'metal_claw', 'steel_storm', 'iron_wall'], 44: ['titan_smash'] }, catchRate: 0.09, expYield: 74, desc: '最終進化！引發磁暴的金冠磁極之王。' },
  gearmon2: { name: '機匠獸', elem: '金', emoji: '⚙️', base: { hp: 67, atk: 19, def: 23 }, grow: { hp: 7.4, atk: 3.4, def: 3.8 },
    learnset: { 1: ['tackle', 'metal_claw', 'iron_wall'], 24: ['steel_storm'] }, catchRate: 0.10, expYield: 47, desc: '齒輪長出手腳的機械工匠，會自己修理自己。' },
  gearmon3: { name: '齒輪機皇', elem: '金', emoji: '⚙️', base: { hp: 103, atk: 30, def: 35 }, grow: { hp: 9.4, atk: 4.3, def: 4.8 },
    learnset: { 1: ['tackle', 'metal_claw', 'steel_storm', 'iron_wall'], 44: ['titan_smash'] }, catchRate: 0.05, expYield: 77, desc: '最終進化！萬千齒輪同時轉動的機械之皇。' },
  steelbird2: { name: '銀翼戰鷹', elem: '金', emoji: '🦅', base: { hp: 70, atk: 23, def: 21 }, grow: { hp: 8.1, atk: 3.8, def: 3.5 },
    learnset: { 1: ['tackle', 'metal_claw', 'iron_wall'], 24: ['steel_storm'] }, catchRate: 0.06, expYield: 51, desc: '雙翼鍍上銀鋼的戰鷹，俯衝快如箭矢。' },
  steelbird3: { name: '金翼鷹皇', elem: '金', emoji: '🦅', base: { hp: 108, atk: 35, def: 32 }, grow: { hp: 10.2, atk: 4.8, def: 4.4 },
    learnset: { 1: ['tackle', 'metal_claw', 'steel_storm', 'iron_wall'], 44: ['titan_smash'] }, catchRate: 0.05, expYield: 81, desc: '最終進化！金翼破空、突破音障的鷹之皇者。' },

  // --- 土系 ---
  sandmouse2: { name: '沙暴巨鼠', elem: '土', emoji: '🐹', base: { hp: 63, atk: 16, def: 16 }, grow: { hp: 8.1, atk: 2.7, def: 3.0 },
    learnset: { 1: ['tackle', 'rock_throw', 'earth_shield'], 24: ['sand_heal'] }, catchRate: 0.18, expYield: 41, desc: '長大好幾倍的沙沙鼠，打滾就能捲起沙暴。' },
  sandmouse3: { name: '黃金鼠皇', elem: '土', emoji: '🐹', base: { hp: 97, atk: 24, def: 24 }, grow: { hp: 10.2, atk: 3.4, def: 3.7 },
    learnset: { 1: ['tackle', 'rock_throw', 'sand_heal', 'earth_shield'], 44: ['quake'] }, catchRate: 0.13, expYield: 71, desc: '最終進化！毛色如黃金、頭戴金冠的沙漠鼠皇。' },
  rockturtle2: { name: '磐甲巨龜', elem: '土', emoji: '🐢', base: { hp: 77, atk: 16, def: 23 }, grow: { hp: 9.5, atk: 2.7, def: 3.8 },
    learnset: { 1: ['tackle', 'rock_throw', 'earth_shield'], 24: ['sand_heal'] }, catchRate: 0.12, expYield: 45, desc: '龜殼隆起如小山的巨龜，背上還冒著煙。' },
  rockturtle3: { name: '玄武龜神', elem: '土', emoji: '🐢', base: { hp: 119, atk: 24, def: 35 }, grow: { hp: 11.9, atk: 3.4, def: 4.8 },
    learnset: { 1: ['tackle', 'rock_throw', 'sand_heal', 'earth_shield'], 44: ['quake'] }, catchRate: 0.07, expYield: 75, desc: '最終進化！背負金山的傳說玄武神龜。' },
  molemon2: { name: '鋼爪獾', elem: '土', emoji: '🦡', base: { hp: 74, atk: 21, def: 18 }, grow: { hp: 8.8, atk: 3.5, def: 3.2 },
    learnset: { 1: ['tackle', 'rock_throw', 'earth_shield'], 24: ['sand_heal'] }, catchRate: 0.08, expYield: 49, desc: '鑽地鼠鍛出鋼爪進化而成，能挖穿岩層。' },
  molemon3: { name: '地穴獾皇', elem: '土', emoji: '🦡', base: { hp: 113, atk: 32, def: 27 }, grow: { hp: 11.1, atk: 4.4, def: 4.1 },
    learnset: { 1: ['tackle', 'rock_throw', 'sand_heal', 'earth_shield'], 44: ['quake'] }, catchRate: 0.05, expYield: 79, desc: '最終進化！統治地底迷宮、金冠鋼爪的獾之皇。' },
});

// ================= BOSS 二階/三階進化型態（五王神化） =================
// 循環 1 遇基本型、循環 2 遇二階、循環 3 遇三階；收服後 Lv.25 / Lv.45 進化
Object.assign(SPECIES, {
  // --- 木王 ---
  boss_oak2: { name: '巨橡長老', elem: '木', emoji: '🌳', boss: true, base: { hp: 135, atk: 21, def: 18 }, grow: { hp: 10, atk: 2.5, def: 2.5 },
    learnset: { 1: ['tackle', 'vine_whip', 'forest_bless', 'heal_light'] }, catchRate: 0.08, expYield: 120, desc: '橡樹王吸收千年精華，枝幹粗壯得能撐起天空。' },
  boss_oak3: { name: '世界樹神', elem: '木', emoji: '🌳', boss: true, base: { hp: 189, atk: 29, def: 25 }, grow: { hp: 10, atk: 2.5, def: 2.5 },
    learnset: { 1: ['tackle', 'vine_whip', 'forest_bless', 'wood_burst'] }, catchRate: 0.06, expYield: 176, desc: '最終神化！頭戴金冠、根系貫穿大地的世界之樹。' },
  // --- 水王 ---
  boss_squid2: { name: '海嘯烏賊王', elem: '水', emoji: '🦑', boss: true, base: { hp: 180, atk: 27, def: 21 }, grow: { hp: 11, atk: 2.8, def: 2.6 },
    learnset: { 1: ['tackle', 'water_gun', 'ice_beam', 'aqua_veil'] }, catchRate: 0.08, expYield: 180, desc: '長大數倍的烏賊王，一揮觸手就掀起海嘯。' },
  boss_squid3: { name: '深淵海神烏賊', elem: '水', emoji: '🦑', boss: true, base: { hp: 252, atk: 38, def: 29 }, grow: { hp: 11, atk: 2.8, def: 2.6 },
    learnset: { 1: ['tackle', 'ice_beam', 'aqua_veil', 'tsunami'] }, catchRate: 0.06, expYield: 264, desc: '最終神化！金冠加冕、統御七海的深淵之神。' },
  // --- 火王 ---
  boss_dragon2: { name: '熔岩龍帝', elem: '火', emoji: '🐲', boss: true, base: { hp: 225, atk: 36, def: 24 }, grow: { hp: 12, atk: 3.2, def: 2.8 },
    learnset: { 1: ['tackle', 'flame_burst', 'blaze_up'] }, catchRate: 0.08, expYield: 270, desc: '血液化為岩漿的龍帝，怒吼能喚醒火山。' },
  boss_dragon3: { name: '太陽神龍', elem: '火', emoji: '🐲', boss: true, base: { hp: 315, atk: 50, def: 34 }, grow: { hp: 12, atk: 3.2, def: 2.8 },
    learnset: { 1: ['tackle', 'flame_burst', 'blaze_up', 'inferno'] }, catchRate: 0.06, expYield: 396, desc: '最終神化！金冠神龍身披太陽烈焰。' },
  // --- 金王 ---
  boss_golem2: { name: '上古魔像將軍', elem: '金', emoji: '🤖', boss: true, base: { hp: 285, atk: 42, def: 33 }, grow: { hp: 13, atk: 3.5, def: 3.2 },
    learnset: { 1: ['tackle', 'steel_storm', 'iron_wall'] }, catchRate: 0.08, expYield: 450, desc: '換上上古重甲的魔像將軍，無堅不摧。' },
  boss_golem3: { name: '星鋼魔像神', elem: '金', emoji: '🤖', boss: true, base: { hp: 399, atk: 59, def: 46 }, grow: { hp: 13, atk: 3.5, def: 3.2 },
    learnset: { 1: ['tackle', 'steel_storm', 'iron_wall', 'titan_smash'] }, catchRate: 0.06, expYield: 660, desc: '最終神化！以隕星之鋼重鑄、金冠加冕的天界神將。' },
  // --- 土王 ---
  boss_earthlord2: { name: '大漠龍帝', elem: '土', emoji: '🦖', boss: true, base: { hp: 345, atk: 48, def: 39 }, grow: { hp: 14, atk: 3.8, def: 3.5 },
    learnset: { 1: ['tackle', 'rock_throw', 'earth_shield', 'quake'] }, catchRate: 0.08, expYield: 600, desc: '大地龍長成沙漠霸主，鱗片是風化的岩壁。' },
  boss_earthlord3: { name: '星球巨龍', elem: '土', emoji: '🦖', boss: true, base: { hp: 483, atk: 67, def: 55 }, grow: { hp: 14, atk: 3.8, def: 3.5 },
    learnset: { 1: ['tackle', 'rock_throw', 'sand_heal', 'quake'] }, catchRate: 0.06, expYield: 880, desc: '最終神化！金冠大地龍背負整顆星球——真正的最終考驗！' },
});

// BOSS 進化鏈：基本型 Lv.25 → 二階 Lv.45 → 三階
['boss_oak', 'boss_squid', 'boss_dragon', 'boss_golem', 'boss_earthlord'].forEach(id => {
  SPECIES[id].evolveLv = 25; SPECIES[id].evolveTo = id + '2';
  SPECIES[id + '2'].evolveLv = 45; SPECIES[id + '2'].evolveTo = id + '3';
});

// 野生一階 → 二階（Lv.20）→ 三階（Lv.40）進化鏈
['caterpie', 'mushroom', 'cactus', 'bluefish', 'bubblecrab', 'icepen',
 'lizard', 'magmouse', 'flamebird', 'magnet', 'gearmon', 'steelbird',
 'sandmouse', 'rockturtle', 'molemon'].forEach(id => {
  SPECIES[id].evolveLv = 20; SPECIES[id].evolveTo = id + '2';
  SPECIES[id + '2'].evolveLv = 40; SPECIES[id + '2'].evolveTo = id + '3';
});

// 初始夥伴的二、三階也會在後期地圖野外出沒（可收服）
['iron', 'wood', 'water', 'fire', 'earth'].forEach(k => {
  SPECIES[k + '2'].catchRate = 0.10;
  SPECIES[k + '3'].catchRate = 0.08;
});

// ================= 圖片怪獸（玩家自製圖像，img 為圖片路徑、emoji 為載入前替代圖示） =================
Object.assign(SPECIES, {
  // --- 丁釘線（金）：小金鼠 → 丁小子 → 丁頭（Lv.20 / Lv.40 進化） ---
  nail1: { name: '小金鼠', elem: '金', emoji: '🔩', img: 'photo/mon_nail1.png',
    base: { hp: 38, atk: 11, def: 14 }, grow: { hp: 5.5, atk: 2.4, def: 2.9 },
    learnset: { 1: ['tackle', 'metal_claw'], 7: ['iron_wall'] }, catchRate: 0.20, expYield: 20,
    desc: '熔金裡冒出的釘尖小精靈，三根釘子裡各住著一個小火臉。' },
  nail2: { name: '丁小子', elem: '金', emoji: '🔩', img: 'photo/mon_nail2.png',
    base: { hp: 67, atk: 19, def: 24 }, grow: { hp: 7.4, atk: 3.2, def: 3.9 },
    learnset: { 1: ['tackle', 'metal_claw', 'iron_wall'], 24: ['steel_storm'] }, catchRate: 0.10, expYield: 45,
    desc: '鍛成金蛋鎧甲的釘之戰士，尾勾能鉤住任何東西。' },
  nail3: { name: '丁頭', elem: '金', emoji: '🔩', img: 'photo/mon_nail3.png',
    base: { hp: 103, atk: 30, def: 37 }, grow: { hp: 9.4, atk: 4.1, def: 4.9 },
    learnset: { 1: ['tackle', 'metal_claw', 'steel_storm', 'iron_wall'], 44: ['titan_smash'] }, catchRate: 0.06, expYield: 78,
    desc: '最終進化！紅冠釘頭與流動的暗影之軀，一擊釘穿鋼鐵。' },

  // --- 蘋果線（木→木→金）：蘋果小藤 → 蘋果大師 → 蘋果大神（Lv.20 / Lv.40 進化） ---
  apple1: { name: '蘋果小藤', elem: '木', emoji: '🍎', img: 'photo/mon_apple1.png',
    base: { hp: 35, atk: 9, def: 8 }, grow: { hp: 5.5, atk: 2.2, def: 2.0 },
    learnset: { 1: ['tackle', 'vine_whip'], 6: ['heal_light'] }, catchRate: 0.24, expYield: 18,
    desc: '嘴裡伸出藤蔓舌頭的蘋果精靈，看起來呆呆的其實很機警。' },
  apple2: { name: '蘋果大師', elem: '木', emoji: '🍎', img: 'photo/mon_apple2.png',
    base: { hp: 62, atk: 17, def: 14 }, grow: { hp: 7.4, atk: 3.0, def: 2.7 },
    learnset: { 1: ['tackle', 'vine_whip', 'heal_light'], 24: ['forest_bless'] }, catchRate: 0.12, expYield: 46,
    desc: '黑化覺醒的蘋果大師，頭頂燃著藍色火焰、獠牙嚇人。' },
  apple3: { name: '蘋果大神', elem: '金', emoji: '🍎', img: 'photo/mon_apple3.png',
    base: { hp: 98, atk: 26, def: 28 }, grow: { hp: 9.4, atk: 3.8, def: 4.0 },
    learnset: { 1: ['tackle', 'metal_claw', 'steel_storm', 'iron_wall'], 44: ['titan_smash'] }, catchRate: 0.06, expYield: 80,
    desc: '最終進化！披上機械甲冑轉生為金屬性的蘋果大神，能量在裝甲間流動。' },

  // --- 單體怪獸 ---
  firetooth: { name: '火大牙', elem: '火', emoji: '🧱', img: 'photo/mon_firetooth.png',
    base: { hp: 60, atk: 20, def: 16 }, grow: { hp: 8, atk: 3.4, def: 3.0 },
    learnset: { 1: ['tackle', 'ember', 'flame_burst'], 30: ['blaze_up'] }, catchRate: 0.10, expYield: 55,
    desc: '燃燒的熔爐魔方，數十顆眼睛同時盯著你，大牙咬碎一切。' },
});

// 圖片怪獸進化鏈
SPECIES.nail1.evolveLv = 20; SPECIES.nail1.evolveTo = 'nail2';
SPECIES.nail2.evolveLv = 40; SPECIES.nail2.evolveTo = 'nail3';
SPECIES.apple1.evolveLv = 20; SPECIES.apple1.evolveTo = 'apple2';
SPECIES.apple2.evolveLv = 40; SPECIES.apple2.evolveTo = 'apple3';

// 標記進化階段（id 結尾 2/3）並套用烘焙變體圖：
// emoji 怪獸的二、三階使用預先烘焙的圖片（同基底＋銀/金效果＋王冠，make_emoji_variants.py 產生）
// 玩家圖片怪獸（已有 img）維持原創圖，改用即時光環標記階段
Object.keys(SPECIES).forEach(id => {
  const sp = SPECIES[id];
  if (/2$/.test(id)) sp.stage = 2;
  else if (/3$/.test(id)) sp.stage = 3;
  if (sp.stage >= 2 && !sp.img) {
    sp.img = 'photo/evo_' + id + '.png';
    sp.baked = true; // 效果已烘進圖檔 → 渲染時不再疊加即時光環/皇冠
  }
});

// 初始夥伴清單（依 GDD 五選一）
const STARTERS = ['iron1', 'wood1', 'water1', 'fire1', 'earth1'];
const STARTER_INTRO = {
  iron1: '高防禦力，技能偏向護甲與鋼鐵衝擊。',
  wood1: '高回復力，擅長治癒，續戰力十足。',
  water1: '均衡型，攻守兼備，還會冰凍敵人。',
  fire1: '高爆發力，強大的火焰傷害，速戰速決。',
  earth1: '高生命值，皮厚耐打，護盾大師。',
};
