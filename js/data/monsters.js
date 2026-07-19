// ============ 怪獸圖鑑資料 ============
// base: Lv1 基礎值；grow: 每升 1 級成長；evolveLv/evolveTo: 進化
// learnset: {等級: [技能id]}；catchRate: 基礎收服率（0 = 不可收服）
const SPECIES = {
  // ================= 初始夥伴（五行三段進化） =================
  // --- 金：高防禦 ---
  iron1: { name: '小鐵甲', elem: '金', emoji: '🐞', base: { hp: 40, atk: 9, def: 13 }, grow: { hp: 6, atk: 2.2, def: 3.0 },
    evolveLv: 10, evolveTo: 'iron2', learnset: { 1: ['tackle', 'metal_claw'], 3: ['iron_wall'], 8: ['steel_storm'] },
    catchRate: 0, expYield: 22, desc: '堅硬外殼的小蟲，防禦力一流，慢慢磨也能贏！' },
  iron2: { name: '鋼殼獸', elem: '金', emoji: '🪲', base: { hp: 62, atk: 15, def: 22 }, grow: { hp: 8, atk: 2.8, def: 3.6 },
    evolveLv: 25, evolveTo: 'iron3', learnset: { 15: ['titan_smash'] }, catchRate: 0, expYield: 40, desc: '進化後外殼閃耀金屬光澤，銅牆鐵壁。' },
  iron3: { name: '鎧甲泰坦', elem: '金', emoji: '🦾', base: { hp: 95, atk: 24, def: 34 }, grow: { hp: 10, atk: 3.5, def: 4.2 },
    learnset: {}, catchRate: 0, expYield: 70, desc: '最終進化！全身鎧甲的鋼鐵巨人。' },

  // --- 木：高回復 ---
  wood1: { name: '芽芽獸', elem: '木', emoji: '🌱', base: { hp: 45, atk: 9, def: 9 }, grow: { hp: 7, atk: 2.2, def: 2.2 },
    evolveLv: 10, evolveTo: 'wood2', learnset: { 1: ['tackle', 'vine_whip'], 3: ['heal_light'], 8: ['forest_bless'] },
    catchRate: 0, expYield: 22, desc: '頭上長著嫩芽的小傢伙，擅長治癒自己。' },
  wood2: { name: '花藤獸', elem: '木', emoji: '🌷', base: { hp: 70, atk: 15, def: 15 }, grow: { hp: 9, atk: 2.8, def: 2.8 },
    evolveLv: 25, evolveTo: 'wood3', learnset: { 15: ['wood_burst'] }, catchRate: 0, expYield: 40, desc: '藤蔓與花朵纏繞全身，生命力旺盛。' },
  wood3: { name: '森林巨靈', elem: '木', emoji: '🌳', base: { hp: 105, atk: 24, def: 24 }, grow: { hp: 12, atk: 3.5, def: 3.5 },
    learnset: {}, catchRate: 0, expYield: 70, desc: '最終進化！守護森林的參天巨靈。' },

  // --- 水：均衡 ---
  water1: { name: '小水滴', elem: '水', emoji: '💧', base: { hp: 42, atk: 10, def: 10 }, grow: { hp: 6.5, atk: 2.5, def: 2.5 },
    evolveLv: 10, evolveTo: 'water2', learnset: { 1: ['tackle', 'water_gun'], 3: ['aqua_veil'], 8: ['ice_beam'] },
    catchRate: 0, expYield: 22, desc: '圓滾滾的水滴精靈，攻守均衡的萬能型。' },
  water2: { name: '波浪精', elem: '水', emoji: '🐬', base: { hp: 65, atk: 17, def: 16 }, grow: { hp: 8.5, atk: 3.0, def: 3.0 },
    evolveLv: 25, evolveTo: 'water3', learnset: { 15: ['tsunami'] }, catchRate: 0, expYield: 40, desc: '乘著波浪的水之精靈，靈活自如。' },
  water3: { name: '深海蛟龍', elem: '水', emoji: '🐉', base: { hp: 98, atk: 27, def: 26 }, grow: { hp: 11, atk: 3.8, def: 3.8 },
    learnset: {}, catchRate: 0, expYield: 70, desc: '最終進化！翻江倒海的深海蛟龍。' },

  // --- 火：高爆發 ---
  fire1: { name: '小火苗', elem: '火', emoji: '🔥', base: { hp: 38, atk: 13, def: 8 }, grow: { hp: 6, atk: 3.0, def: 2.0 },
    evolveLv: 10, evolveTo: 'fire2', learnset: { 1: ['tackle', 'ember'], 3: ['blaze_up'], 8: ['flame_burst'] },
    catchRate: 0, expYield: 22, desc: '活潑的小火苗，攻擊力超群，速戰速決！' },
  fire2: { name: '烈焰狐', elem: '火', emoji: '🦊', base: { hp: 58, atk: 21, def: 13 }, grow: { hp: 8, atk: 3.6, def: 2.5 },
    evolveLv: 25, evolveTo: 'fire3', learnset: { 15: ['inferno'] }, catchRate: 0, expYield: 40, desc: '尾巴燃燒烈焰的神秘狐狸。' },
  fire3: { name: '炎獄天虎', elem: '火', emoji: '🐯', base: { hp: 88, atk: 32, def: 20 }, grow: { hp: 10, atk: 4.5, def: 3.0 },
    learnset: {}, catchRate: 0, expYield: 70, desc: '最終進化！烈焰纏身的百獸之王。' },

  // --- 土：高生命 ---
  earth1: { name: '小岩怪', elem: '土', emoji: '🪨', base: { hp: 50, atk: 10, def: 11 }, grow: { hp: 8, atk: 2.3, def: 2.6 },
    evolveLv: 10, evolveTo: 'earth2', learnset: { 1: ['tackle', 'rock_throw'], 3: ['earth_shield'], 8: ['sand_heal'] },
    catchRate: 0, expYield: 22, desc: '圓圓的小石頭精靈，生命力超強。' },
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

  // ================= BOSS（不可收服） =================
  boss_oak: { name: '橡樹王', elem: '木', emoji: '🌳', boss: true, base: { hp: 90, atk: 14, def: 12 }, grow: { hp: 10, atk: 2.5, def: 2.5 },
    learnset: { 1: ['tackle', 'vine_whip', 'forest_bless'] }, catchRate: 0, expYield: 80, desc: '翠綠草原的守護者，甦醒的千年橡樹。' },
  boss_squid: { name: '深湖大王烏賊', elem: '水', emoji: '🦑', boss: true, base: { hp: 120, atk: 18, def: 14 }, grow: { hp: 11, atk: 2.8, def: 2.6 },
    learnset: { 1: ['tackle', 'water_gun', 'ice_beam'] }, catchRate: 0, expYield: 120, desc: '沉睡湖底的巨大烏賊，觸手掀起巨浪。' },
  boss_dragon: { name: '炎龍王', elem: '火', emoji: '🐲', boss: true, base: { hp: 150, atk: 24, def: 16 }, grow: { hp: 12, atk: 3.2, def: 2.8 },
    learnset: { 1: ['tackle', 'flame_burst', 'blaze_up'] }, catchRate: 0, expYield: 180, desc: '統治烈焰火山的龍王，吐息足以熔化岩石。' },
  boss_golem: { name: '鋼鐵魔像', elem: '金', emoji: '🤖', boss: true, base: { hp: 190, atk: 28, def: 22 }, grow: { hp: 13, atk: 3.5, def: 3.2 },
    learnset: { 1: ['tackle', 'steel_storm', 'iron_wall'] }, catchRate: 0, expYield: 300, desc: '金石礦山深處的上古魔像，最終的考驗！' },
};

// 初始夥伴清單（依 GDD 五選一）
const STARTERS = ['iron1', 'wood1', 'water1', 'fire1', 'earth1'];
const STARTER_INTRO = {
  iron1: '高防禦力，技能偏向護甲與鋼鐵衝擊。',
  wood1: '高回復力，擅長治癒，續戰力十足。',
  water1: '均衡型，攻守兼備，還會冰凍敵人。',
  fire1: '高爆發力，強大的火焰傷害，速戰速決。',
  earth1: '高生命值，皮厚耐打，護盾大師。',
};
