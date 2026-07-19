// ============ 技能招式資料 ============
// 五行：金剋木、木剋土、土剋水、水剋火、火剋金
const ELEM_KE = { '金': '木', '木': '土', '土': '水', '水': '火', '火': '金' };   // 相剋
const ELEM_SHENG = { '金': '水', '水': '木', '木': '火', '火': '土', '土': '金' }; // 相生
const ELEM_EMOJI = { '金': '⚙️', '木': '🌿', '水': '💧', '火': '🔥', '土': '🪨' };
const ELEMS = ['金', '木', '水', '火', '土'];

// 屬性倍率：技能屬性 剋 防守方 → 1.5；防守方 剋 技能屬性 → 0.5
function elemMultiplier(atkElem, defElem) {
  if (!atkElem || !defElem) return 1;
  if (ELEM_KE[atkElem] === defElem) return 1.5;
  if (ELEM_KE[defElem] === atkElem) return 0.5;
  return 1;
}

// type: 'atk' 攻擊 / 'heal' 恢復 / 'buff' 輔助
// mult: 傷害倍率；sp: 消耗SP；gainSp: 答對獲得SP；hardQ: 強制高難度題（風險與報酬）
const SKILLS = {
  // ---- 通用 ----
  tackle:      { name: '衝撞',     elem: null, type: 'atk', mult: 1.0, sp: 0, gainSp: 1, fx: '💥', desc: '基本攻擊，答對累積 1 SP' },

  // ---- 金 ----
  metal_claw:  { name: '金屬爪',   elem: '金', type: 'atk', mult: 1.3, sp: 2, fx: '⚔️', desc: '金屬利爪撕裂敵人' },
  iron_wall:   { name: '鐵壁',     elem: '金', type: 'buff', buff: { stat: 'def', mult: 2.0, turns: 2 }, sp: 2, fx: '🛡️', desc: '2 回合內防禦力加倍' },
  steel_storm: { name: '鋼鐵風暴', elem: '金', type: 'atk', mult: 2.0, sp: 4, fx: '🌪️', desc: '鋼刃旋風強力打擊' },
  titan_smash: { name: '泰坦裂擊', elem: '金', type: 'atk', mult: 2.6, sp: 5, hardQ: true, fx: '⚡', desc: '終極大招！題目變難，威力巨大' },

  // ---- 木 ----
  vine_whip:   { name: '藤鞭',     elem: '木', type: 'atk', mult: 1.3, sp: 2, fx: '🌿', desc: '藤蔓抽打敵人' },
  heal_light:  { name: '光之治癒', elem: '木', type: 'heal', heal: 0.3, sp: 3, fx: '✨', desc: '恢復 30% 最大生命' },
  forest_bless:{ name: '森林祝福', elem: '木', type: 'heal', heal: 0.55, sp: 4, fx: '🌸', desc: '恢復 55% 最大生命' },
  wood_burst:  { name: '森羅萬象', elem: '木', type: 'atk', mult: 2.6, sp: 5, hardQ: true, fx: '🌳', desc: '終極大招！題目變難，威力巨大' },

  // ---- 水 ----
  water_gun:   { name: '水槍',     elem: '水', type: 'atk', mult: 1.3, sp: 2, fx: '💦', desc: '高壓水柱噴射' },
  ice_beam:    { name: '冰凍光線', elem: '水', type: 'atk', mult: 1.7, sp: 3, fx: '❄️', desc: '寒冰凍結敵人' },
  aqua_veil:   { name: '水之面紗', elem: '水', type: 'buff', buff: { stat: 'def', mult: 1.8, turns: 3 }, sp: 2, fx: '🫧', desc: '3 回合內防禦提升' },
  tsunami:     { name: '驚濤駭浪', elem: '水', type: 'atk', mult: 2.6, sp: 5, hardQ: true, fx: '🌊', desc: '終極大招！題目變難，威力巨大' },

  // ---- 火 ----
  ember:       { name: '火花',     elem: '火', type: 'atk', mult: 1.3, sp: 2, fx: '🔥', desc: '小小火苗灼燒敵人' },
  flame_burst: { name: '火焰衝擊', elem: '火', type: 'atk', mult: 1.5, sp: 3, fx: '🔥', desc: '爆裂火焰衝擊波' },
  blaze_up:    { name: '燃燒鬥志', elem: '火', type: 'buff', buff: { stat: 'atk', mult: 1.6, turns: 3 }, sp: 2, fx: '💪', desc: '3 回合內攻擊力提升' },
  inferno:     { name: '烈焰煉獄', elem: '火', type: 'atk', mult: 2.6, sp: 5, hardQ: true, fx: '☄️', desc: '終極大招！題目變難，威力巨大' },

  // ---- 土 ----
  rock_throw:  { name: '落石',     elem: '土', type: 'atk', mult: 1.3, sp: 2, fx: '🪨', desc: '巨石從天而降' },
  earth_shield:{ name: '大地之盾', elem: '土', type: 'buff', buff: { stat: 'def', mult: 2.0, turns: 2 }, sp: 2, fx: '🛡️', desc: '2 回合內防禦力加倍' },
  sand_heal:   { name: '大地回春', elem: '土', type: 'heal', heal: 0.35, sp: 3, fx: '🌾', desc: '恢復 35% 最大生命' },
  quake:       { name: '天崩地裂', elem: '土', type: 'atk', mult: 2.6, sp: 5, hardQ: true, fx: '🌋', desc: '終極大招！題目變難，威力巨大' },
};

const SP_MAX = 5;
