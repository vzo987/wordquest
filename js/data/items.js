// ============ 裝備與道具資料 ============
// 武器：+ATK；防具：+DEF/+HP，可帶五行屬性（與怪獸「相生」時額外 +20% DEF）
const WEAPONS = {
  stick:     { name: '木棒',         emoji: '🪵', atk: 2,  price: 50,  tier: 1, desc: '路邊撿的堅固木棒。' },
  iron_sword:{ name: '鐵劍',         emoji: '🗡️', atk: 5,  price: 150, tier: 1, desc: '鐵匠打造的銳利短劍。' },
  dict_sword:{ name: '英文字典之劍', emoji: '📖', atk: 9,  price: 400, tier: 2, desc: '蘊含單字力量的傳說之劍！' },
  hero_blade:{ name: '勇者聖劍',     emoji: '⚔️', atk: 14, price: 900, tier: 3, desc: '只有真正的勇者能駕馭。' },
};

const ARMORS = {
  cloth:       { name: '布衣',       emoji: '👕', def: 2, hp: 0,  elem: null, price: 50,  tier: 1, desc: '輕便的旅行布衣。' },
  letter_shield:{ name: '字母盾牌',  emoji: '🔤', def: 5, hp: 10, elem: null, price: 150, tier: 1, desc: '刻著 26 個字母的神奇盾牌。' },
  gold_shield: { name: '金之聖盾',   emoji: '🥇', def: 8, hp: 20, elem: '金', price: 350, tier: 2, desc: '金屬性護盾。水屬性夥伴裝備有相生加成！' },
  wood_shield: { name: '木之聖盾',   emoji: '🌲', def: 8, hp: 20, elem: '木', price: 350, tier: 2, desc: '木屬性護盾。火屬性夥伴裝備有相生加成！' },
  water_shield:{ name: '水之聖盾',   emoji: '🌊', def: 8, hp: 20, elem: '水', price: 350, tier: 2, desc: '水屬性護盾。木屬性夥伴裝備有相生加成！' },
  fire_shield: { name: '火之聖盾',   emoji: '🎆', def: 8, hp: 20, elem: '火', price: 350, tier: 2, desc: '火屬性護盾。土屬性夥伴裝備有相生加成！' },
  earth_shield_a:{ name: '土之聖盾', emoji: '🏔️', def: 8, hp: 20, elem: '土', price: 350, tier: 2, desc: '土屬性護盾。金屬性夥伴裝備有相生加成！' },
  dragon_mail: { name: '龍鱗鎧甲',   emoji: '🐲', def: 13, hp: 40, elem: null, price: 900, tier: 3, desc: '用龍鱗打造的最強鎧甲。' },
};

const CONSUMABLES = {
  potion:     { name: '藥水',     emoji: '🧪', price: 30,  desc: '恢復 50% 生命值', effect: { healPct: 0.5 } },
  big_potion: { name: '大藥水',   emoji: '⚗️', price: 80,  desc: '完全恢復生命值', effect: { healPct: 1.0 } },
  ball:       { name: '收服球',   emoji: '🔮', price: 60,  desc: '收服判定時使用，成功率 ×2', effect: { captureBoost: 2 } },
};

// 被動道具（一次購買，永久生效）
const PASSIVES = {
  glasses: { name: '智慧眼鏡', emoji: '👓', price: 500, desc: '選擇題自動消除一個錯誤選項' },
  charm:   { name: '幸運護符', emoji: '🍀', price: 400, desc: '戰鬥勝利的金幣收益 +50%' },
};

// 商店販售清單（依商店等級 tier 解鎖：擊敗 Boss 提升）
function shopStock(tier) {
  const stock = [];
  for (const [id, w] of Object.entries(WEAPONS)) if (w.tier <= tier) stock.push({ kind: 'weapon', id, ...w });
  for (const [id, a] of Object.entries(ARMORS)) if (a.tier <= tier) stock.push({ kind: 'armor', id, ...a });
  for (const [id, c] of Object.entries(CONSUMABLES)) stock.push({ kind: 'consumable', id, ...c });
  for (const [id, p] of Object.entries(PASSIVES)) stock.push({ kind: 'passive', id, ...p });
  return stock;
}
