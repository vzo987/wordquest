// ============ 遊戲狀態與存檔系統（三個存檔位置） ============
const SAVE_KEY = 'wordquest_save_v1'; // 舊版單一存檔 key（自動遷移到位置 1）
const SLOT_KEYS = ['wordquest_save_s1', 'wordquest_save_s2', 'wordquest_save_s3'];
let currentSlot = 0; // 目前使用中的存檔位置（0~2）

let G = null; // 全域遊戲狀態

function defaultState() {
  return {
    version: 1,
    player: {
      gold: 100,
      items: { potion: 2, big_potion: 0, ball: 1 }, // 消耗品
      passives: { glasses: false, charm: false },    // 被動道具
      invWeapons: {},  // {weaponId: 數量}
      invArmors: {},   // {armorId: 數量}
      shopTier: 1,     // 擊敗 Boss 提升商店等級
    },
    team: [],     // 出戰隊伍（最多 3 隻怪獸實例）
    storage: [],  // 怪獸倉庫
    world: {
      map: 'map1', x: 1, y: 1,
      checkpoint: { map: 'map1', x: 1, y: 1 },      // 最近的營火（重生點）
      cleared: {},   // {mapId: true} 已擊敗 Boss
      chests: {},    // {mapId: true} 已開寶箱
      defeated: {},  // {'mapId_idx': 擊敗時間戳} 用於計時重生
      ending: false, // 是否通關
    },
    words: {},  // 學習歷程 {en: {seen, ok, ng, streak}}
    dex: {},    // 圖鑑 {speciesId: 'seen'|'caught'}
    stats: { battles: 0, wins: 0, correct: 0, wrong: 0, captures: 0 },
  };
}

// ---- 怪獸實例 ----
function createMonster(speciesId, lv = 1) {
  const sp = SPECIES[speciesId];
  const m = {
    uid: uid(),
    sp: speciesId,
    lv,
    exp: 0,
    weapon: null,  // 武器 id
    armor: null,   // 防具 id
    skills: [],    // 已裝備技能（最多 4）
    learned: [],   // 所有學會的技能
  };
  // 依等級套用技能表
  for (const [lvReq, ids] of Object.entries(sp.learnset || {})) {
    if (lv >= Number(lvReq)) {
      ids.forEach(id => {
        if (!m.learned.includes(id)) m.learned.push(id);
      });
    }
  }
  m.skills = m.learned.slice(0, 4);
  m.hp = monsterStats(m).hpMax; // 滿血
  return m;
}

// ---- 存檔 / 載入（三個位置） ----
// 舊版單一存檔 → 自動搬到位置 1（只執行一次）
function migrateOldSave() {
  try {
    const old = localStorage.getItem(SAVE_KEY);
    if (old && !localStorage.getItem(SLOT_KEYS[0])) {
      localStorage.setItem(SLOT_KEYS[0], old);
    }
    if (old) localStorage.removeItem(SAVE_KEY);
  } catch (e) { /* 靜默 */ }
}

function saveGame(silent = false) {
  try {
    G.savedAt = Date.now(); // 記錄存檔時間（顯示於選檔畫面）
    localStorage.setItem(SLOT_KEYS[currentSlot], JSON.stringify(G));
    if (!silent) showSaveToast(); // 羽毛筆提示
  } catch (e) { console.warn('存檔失敗', e); }
}

// 讀取指定位置（成功回傳 true 並切換為目前位置）
function loadSlot(i) {
  try {
    const raw = localStorage.getItem(SLOT_KEYS[i]);
    if (!raw) return false;
    const data = JSON.parse(raw);
    if (!data.version) return false;
    G = data;
    currentSlot = i;
    return true;
  } catch (e) { return false; }
}

// 取得某位置的存檔摘要（給選檔畫面顯示；空位回傳 null）
function slotInfo(i) {
  try {
    const raw = localStorage.getItem(SLOT_KEYS[i]);
    if (!raw) return null;
    const d = JSON.parse(raw);
    if (!d.version || !d.team || !d.team.length) return null;
    const lead = d.team[0];
    const sp = SPECIES[lead.sp];
    let time = '';
    if (d.savedAt) {
      const t = new Date(d.savedAt);
      time = `${t.getMonth() + 1}/${t.getDate()} ${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}`;
    }
    return {
      emoji: sp.emoji, name: sp.name, lv: lead.lv,
      mapName: MAPS[d.world.map] ? MAPS[d.world.map].name : '',
      gold: d.player.gold, time,
    };
  } catch (e) { return null; }
}

function hasAnySave() { return [0, 1, 2].some(i => slotInfo(i)); }

// 在指定位置開新遊戲（首次自動存檔時才會真正寫入）
function newGameInSlot(i) {
  currentSlot = i;
  G = defaultState();
}

function deleteSlot(i) { localStorage.removeItem(SLOT_KEYS[i]); }

// 自動存檔（依 GDD：戰鬥結算後、購買裝備後、升級進化時、切換地圖時）
function autoSave() { if (G) saveGame(false); }

migrateOldSave();

// ---- 學習歷程 ----
function wordStat(en) {
  if (!G.words[en]) G.words[en] = { seen: 0, ok: 0, ng: 0, streak: 0 };
  return G.words[en];
}

function recordAnswer(en, correct) {
  const s = wordStat(en);
  s.seen++;
  if (correct) { s.ok++; s.streak++; G.stats.correct++; }
  else { s.ng++; s.streak = 0; G.stats.wrong++; }
}

// 錯題池：答錯過且尚未連續答對 3 次的單字
function wrongWordPool(maxLv = 3) {
  return Object.entries(G.words)
    .filter(([en, s]) => s.ng > 0 && s.streak < 3 && WORD_BY_EN[en] && WORD_BY_EN[en].lv <= maxLv)
    .map(([en]) => WORD_BY_EN[en]);
}

// 圖鑑登錄
function dexSee(spId) { if (!G.dex[spId]) G.dex[spId] = 'seen'; }
function dexCaught(spId) { G.dex[spId] = 'caught'; }
