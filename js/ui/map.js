// ============ 地圖探索系統（明雷遇敵） ============
const MapView = {
  map: null,
  grid: [],           // 二維字元陣列
  monsters: [],       // {idx, spId, lv, elite, x, y, homeX, homeY}
  bossPos: null,
  chests: [],         // 未開啟的寶箱 [{x, y, key}]
  playerEmoji: '🧒',
  busy: false,        // 戰鬥/彈窗中停止操作
  lastMove: 0,
  graceUntil: 0,      // 戰鬥結束後的緩衝時間：怪獸主動碰撞不觸發戰鬥
  wanderTimer: null,
  raf: null,
};

const RESPAWN_MS = 3 * 60 * 1000; // GDD：3 分鐘計時重生

// ---------- 載入地圖 ----------
MapView.load = function (mapId, pos = null) {
  const mv = MapView;
  mv.map = MAPS[mapId];
  mv.grid = mv.map.grid.map(r => r.split(''));
  G.world.map = mapId;

  // 起點
  let startX = 1, startY = 1;
  mv.bossPos = null; mv.chests = [];
  const spawnTiles = [];
  for (let y = 0; y < mv.grid.length; y++) {
    for (let x = 0; x < mv.grid[y].length; x++) {
      const c = mv.grid[y][x];
      if (c === 'P') { startX = x; startY = y; mv.grid[y][x] = '.'; }
      else if (c === 'M') { spawnTiles.push({ x, y }); mv.grid[y][x] = '.'; }
      else if (c === 'B') { mv.bossPos = { x, y }; mv.grid[y][x] = '.'; }
      else if (c === 'X') {
        const key = `${mapId}_${x}_${y}`;
        if (!G.world.chests[key]) mv.chests.push({ x, y, key }); // 已開過的不再出現
        mv.grid[y][x] = '.';
      }
    }
  }
  if (pos) { G.world.x = pos.x; G.world.y = pos.y; }
  else { G.world.x = startX; G.world.y = startY; }

  // 生成野生怪獸（考慮重生計時；GDD：錯題精英怪）
  mv.monsters = [];
  const hasWrong = wrongWordPool(mv.map.wordLv).length > 0;
  spawnTiles.forEach((t, idx) => {
    const key = `${mapId}_${idx}`;
    const defeatedAt = G.world.defeated[key];
    if (defeatedAt && Date.now() - defeatedAt < RESPAWN_MS) return; // 還在冷卻
    delete G.world.defeated[key];
    mv.monsters.push({
      idx, key,
      spId: pick(mv.map.pool),
      lv: randRange(mv.map.lvRange[0], mv.map.lvRange[1]),
      elite: hasWrong && chance(0.35), // 有錯題 → 精英怪帶錯題出現
      x: t.x, y: t.y, homeX: t.x, homeY: t.y,
    });
  });
  mv.spawnStarter();

  mv.refreshHud();
  mv.startLoops();
};

// 初始夥伴稀有出沒點（該屬性地圖限定，5 小時重生，可收服）
MapView.spawnStarter = function () {
  const mv = MapView;
  if (!mv.map.starterId || !mv.map.starterSpawn) return;
  const key = `${mv.map.id}_starter`;
  if (mv.monsters.some(m => m.key === key)) return;
  const defeatedAt = G.world.defeated[key];
  if (defeatedAt && Date.now() - defeatedAt < STARTER_RESPAWN_MS) return; // 5 小時冷卻
  const s = mv.map.starterSpawn;
  if (s.x === G.world.x && s.y === G.world.y) return;
  delete G.world.defeated[key];
  mv.monsters.push({
    idx: 'st', key,
    spId: mv.map.starterId,
    lv: randRange(mv.map.lvRange[0], mv.map.lvRange[1]),
    elite: false, starter: true,
    x: s.x, y: s.y, homeX: s.x, homeY: s.y,
  });
};

// Boss 是否在場（首次未擊敗必在；擊敗後每 5 小時重生，可再挑戰/收服）
MapView.bossActive = function () {
  const mv = MapView;
  if (!mv.map || !mv.bossPos) return false;
  if (!G.world.cleared[mv.map.id]) return true;
  return Date.now() - (G.world.bossDefeated[mv.map.id] || 0) > BOSS_RESPAWN_MS;
};

// ---------- HUD ----------
MapView.refreshHud = function () {
  const mv = MapView;
  if (!mv.map) return;
  $('#hud-mapname').textContent = `🗺️ ${mv.map.name}（Lv.${mv.map.lvRange[0]}~${mv.map.lvRange[1]}）`;
  $('#hud-gold').textContent = `💰 ${G.player.gold}`;
  const mini = $('#hud-team-mini');
  mini.innerHTML = G.team.map(m => {
    const s = monsterStats(m);
    const pct = Math.round(clamp(m.hp / s.hpMax, 0, 1) * 100);
    return `<span class="mini-mon">${speciesIcon(SPECIES[m.sp])}<span class="mini-hp"> ${pct}%</span></span>`;
  }).join('');
};

// ---------- 遊戲迴圈 ----------
MapView.startLoops = function () {
  const mv = MapView;
  cancelAnimationFrame(mv.raf);
  clearInterval(mv.wanderTimer);
  const draw = () => { mv.render(); mv.raf = requestAnimationFrame(draw); };
  draw();
  // 怪獸巡邏（GDD：明雷 — 玩家可觀察並繞開）
  mv.wanderTimer = setInterval(() => {
    if (mv.busy || !Battle) return;
    if (Battle.active) return;
    mv.monsters.forEach(mon => {
      if (!chance(0.55)) return;
      const dirs = shuffle([[0, 1], [0, -1], [1, 0], [-1, 0]]);
      for (const [dx, dy] of dirs) {
        const nx = mon.x + dx, ny = mon.y + dy;
        if (Math.abs(nx - mon.homeX) > 2 || Math.abs(ny - mon.homeY) > 2) continue;
        if (!mv.walkable(nx, ny)) continue;
        if (mv.monsterAt(nx, ny)) continue;
        if (nx === G.world.x && ny === G.world.y) {
          // 怪獸撞到玩家 → 觸發戰鬥（戰後緩衝時間內不觸發，避免連續被襲擊）
          if (Date.now() < mv.graceUntil) continue;
          mv.triggerBattle(mon);
          return;
        }
        mon.x = nx; mon.y = ny;
        break;
      }
    });
  }, 850);
};

MapView.stopLoops = function () {
  cancelAnimationFrame(MapView.raf);
  clearInterval(MapView.wanderTimer);
};

MapView.walkable = function (x, y) {
  const mv = MapView;
  if (y < 0 || y >= mv.grid.length || x < 0 || x >= mv.grid[0].length) return false;
  const c = mv.grid[y][x];
  return c !== '#' && c !== '~';
};

MapView.monsterAt = function (x, y) {
  return MapView.monsters.find(m => m.x === x && m.y === y);
};

// ---------- 玩家移動 ----------
MapView.move = function (dx, dy) {
  const mv = MapView;
  if (mv.busy || Battle.active) return;
  const now = Date.now();
  if (now - mv.lastMove < 140) return;
  mv.lastMove = now;

  const nx = G.world.x + dx, ny = G.world.y + dy;

  // 碰到怪獸 → 戰鬥（明雷接觸觸發）
  const mon = mv.monsterAt(nx, ny);
  if (mon) return mv.triggerBattle(mon);

  // Boss
  if (mv.bossPos && nx === mv.bossPos.x && ny === mv.bossPos.y && mv.bossActive()) {
    return mv.triggerBoss();
  }

  if (!mv.walkable(nx, ny)) return;
  G.world.x = nx; G.world.y = ny;
  Audio2.sfx.step();

  // 地形事件
  const c = mv.grid[ny][nx];
  if (c === 'C') mv.onCampfire();
  else if (c === 'S') mv.onShop();
  else if (c === 'E') mv.onExit();
  else if (c === 'R') mv.onReturn();
  const chest = mv.chests.find(ch => ch.x === nx && ch.y === ny);
  if (chest) mv.onChest(chest);
};

// ---------- 事件：營火（存檔點） ----------
MapView.onCampfire = async function () {
  const mv = MapView;
  mv.busy = true;
  G.team.forEach(m => { m.hp = monsterStats(m).hpMax; });
  G.world.checkpoint = { map: mv.map.id, x: G.world.x, y: G.world.y };
  Audio2.sfx.heal();
  autoSave();
  mapMsg('🔥 在營火旁休息… 全隊 HP 完全恢復！進度已儲存。', 2600);
  mv.refreshHud();
  mv.busy = false;
};

// ---------- 事件：商店 ----------
MapView.onShop = function () {
  openShop();
};

// ---------- 事件：寶箱 ----------
MapView.onChest = async function (chest) {
  const mv = MapView;
  mv.busy = true;
  G.world.chests[chest.key] = true;
  mv.chests = mv.chests.filter(ch => ch !== chest);
  const c = mv.map.chest;
  G.player.gold += c.gold;
  G.player.items[c.item] = (G.player.items[c.item] || 0) + 1;
  Audio2.sfx.coin();
  const it = CONSUMABLES[c.item];
  await showModal({
    title: '發現寶箱！', emoji: '📦',
    body: `獲得 💰${c.gold} 金幣與 ${it.emoji} ${it.name}！`,
  });
  autoSave();
  mv.refreshHud();
  mv.busy = false;
};

// ---------- 事件：返回門（回上一關，地圖具連續性） ----------
MapView.onReturn = async function () {
  const mv = MapView;
  const prevId = mv.map.prev;
  if (!prevId) return;
  mv.busy = true;
  const prev = MAPS[prevId];
  // 尋找上一關的出口 E，重生在它左側（形成雙向通道）
  let ex = 1, ey = 1;
  prev.grid.forEach((row, y) => {
    const x = row.indexOf('E');
    if (x >= 0) { ex = x; ey = y; }
  });
  await showModal({
    title: '返回上一區', emoji: '🔙',
    body: `回到 <b>${prev.name}</b>（Lv.${prev.lvRange[0]}~${prev.lvRange[1]}）`,
  });
  mv.load(prevId, { x: ex - 1, y: ey });
  autoSave();
  mv.refreshHud();
  mv.busy = false;
};

// ---------- 事件：出口 ----------
MapView.onExit = async function () {
  const mv = MapView;
  if (!G.world.cleared[mv.map.id]) {
    mapMsg('🔒 出口被神祕力量封住了…要先打敗這裡的 BOSS！', 2600);
    // 把玩家推回一格
    G.world.x = clamp(G.world.x - 1, 1, mv.grid[0].length - 2);
    return;
  }
  mv.busy = true;
  if (mv.map.next) {
    const nextId = mv.map.next; // 先記下目標（load 之後 mv.map 會變成新地圖）
    const next = MAPS[nextId];
    await showModal({
      title: '前往新地區！', emoji: '🗺️',
      body: `<b>${next.name}</b>（Lv.${next.lvRange[0]}~${next.lvRange[1]}）<br>${next.theme.name2}<br><small>單字難度提升，加油！</small>`,
    });
    mv.load(nextId);
    G.world.checkpoint = { map: nextId, x: G.world.x, y: G.world.y };
    autoSave(); // GDD：切換地圖自動存檔
  } else {
    // 最終通關
    G.world.ending = true;
    autoSave();
    const mastered = Object.values(G.words).filter(s => s.streak >= 3).length;
    await showModal({
      title: '🎉 恭喜通關！🎉', emoji: '🏆',
      body: `你擊敗了所有 BOSS，成為真正的單字勇者！<br><br>` +
        `📊 冒險成績單：<br>戰鬥 ${G.stats.battles} 場／勝利 ${G.stats.wins} 場<br>` +
        `答對 ${G.stats.correct} 題／答錯 ${G.stats.wrong} 題<br>` +
        `精通單字 ${mastered} 個／收服怪獸 ${G.stats.captures} 隻<br><br>` +
        `世界還在等你繼續探索、精通更多單字！`,
    });
  }
  mv.busy = false;
};

// ---------- 戰鬥觸發 ----------
MapView.triggerBattle = async function (mon) {
  const mv = MapView;
  if (mv.busy || Battle.active) return;
  mv.busy = true;
  const outcome = await startBattle({ speciesId: mon.spId, lv: mon.lv, elite: mon.elite });
  mv.afterBattle(outcome, mon);
};

MapView.triggerBoss = async function () {
  const mv = MapView;
  if (mv.busy || Battle.active) return;
  mv.busy = true;
  const bsp = SPECIES[mv.map.bossId];
  const rematch = !!G.world.cleared[mv.map.id];
  const go = await showModal({
    title: rematch ? '👑 BOSS 再次現身！' : '⚠️ BOSS 出現！', emoji: bsp.emoji,
    body: `<b class="elem-${bsp.elem}">${bsp.name}</b>（Lv.${mv.map.bossLv}）<br>${bsp.desc}<br>` +
      (rematch ? '<small>再次擊敗有機會收服牠！</small>' : '準備好了嗎？'),
    buttons: [
      { text: '⚔️ 挑戰！', value: true, cls: 'btn-gold' },
      { text: '再準備一下', value: false },
    ],
  });
  if (!go) { mv.busy = false; return; }
  const outcome = await startBattle({ speciesId: mv.map.bossId, lv: mv.map.bossLv, isBoss: true });
  if (outcome.result === 'win') {
    const first = !G.world.cleared[mv.map.id];
    G.world.cleared[mv.map.id] = true;
    G.world.bossDefeated[mv.map.id] = Date.now(); // 5 小時後重生
    if (first) {
      const unlock = TIER_UNLOCK[mv.map.id];
      if (unlock) G.player.shopTier = Math.max(G.player.shopTier, Math.min(MAX_TIER, unlock));
      await showModal({
        title: '🎊 BOSS 擊破！', emoji: '👑',
        body: `${bsp.name} 被打敗了！<br>出口的封印解除了，商店進貨了更棒的裝備！<br>往 <b>E</b> 出口前進吧！<br><small>BOSS 每 5 小時會重新出現，再次擊敗有機會收服牠！</small>`,
      });
    }
    autoSave();
  }
  mv.afterBattle(outcome, null);
};

MapView.afterBattle = function (outcome, mon) {
  const mv = MapView;
  showScreen('screen-map');
  mv.graceUntil = Date.now() + 3000; // 戰後 3 秒緩衝，避免立刻再被巡邏怪撞上
  if (outcome.result === 'win' && mon) {
    // 怪獸化為光芒消失 → 記錄擊敗時間（計時重生）
    G.world.defeated[mon.key] = Date.now();
    mv.monsters = mv.monsters.filter(m => m !== mon);
  } else if (mon) {
    // 逃跑 / 復活：怪獸退回出生點，避免和玩家重疊馬上再觸發
    mon.x = mon.homeX; mon.y = mon.homeY;
  }
  if (outcome.result === 'lose') {
    // 重生於最近的營火（GDD 進度點重生）
    const cp = G.world.checkpoint;
    mapMsg('🔥 你在營火旁醒來，夥伴們恢復精神了！', 2600);
    if (cp.map !== mv.map.id) mv.load(cp.map, { x: cp.x, y: cp.y });
    else { G.world.x = cp.x; G.world.y = cp.y; }
  }
  mv.refreshHud();
  mv.busy = false;
};

// 檢查重生（定時呼叫）
MapView.checkRespawn = function () {
  const mv = MapView;
  if (!mv.map || Battle.active) return;
  const mapId = mv.map.id;
  const spawnTiles = [];
  mv.map.grid.forEach((row, y) => row.split('').forEach((c, x) => { if (c === 'M') spawnTiles.push({ x, y }); }));
  const hasWrong = wrongWordPool(mv.map.wordLv).length > 0;
  spawnTiles.forEach((t, idx) => {
    const key = `${mapId}_${idx}`;
    if (mv.monsters.some(m => m.key === key)) return;
    const defeatedAt = G.world.defeated[key];
    if (defeatedAt && Date.now() - defeatedAt < RESPAWN_MS) return;
    if ((t.x === G.world.x && t.y === G.world.y)) return;
    delete G.world.defeated[key];
    // 重生（GDD：錯題怪有高機率再現）
    mv.monsters.push({
      idx, key,
      spId: pick(mv.map.pool),
      lv: randRange(mv.map.lvRange[0], mv.map.lvRange[1]),
      elite: hasWrong && chance(0.6),
      x: t.x, y: t.y, homeX: t.x, homeY: t.y,
    });
  });
  mv.spawnStarter(); // 初始夥伴 5 小時重生檢查
};

// ---------- 繪製 ----------
MapView.render = function () {
  const mv = MapView;
  if (!mv.map) return;
  const cv = $('#map-canvas');
  const ctx = cv.getContext('2d');
  const th = mv.map.theme;
  ctx.clearRect(0, 0, cv.width, cv.height);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  for (let y = 0; y < mv.grid.length; y++) {
    for (let x = 0; x < mv.grid[y].length; x++) {
      const c = mv.grid[y][x];
      const px = x * TILE, py = y * TILE;
      // 地面（棋盤格）
      ctx.fillStyle = (x + y) % 2 === 0 ? th.ground : th.ground2;
      ctx.fillRect(px, py, TILE, TILE);
      if (c === '#') {
        ctx.fillStyle = th.blockBg;
        ctx.fillRect(px, py, TILE, TILE);
        ctx.font = '26px serif';
        ctx.fillText(th.block, px + TILE / 2, py + TILE / 2 + 2);
      } else if (c === '~') {
        ctx.fillStyle = th.liquid;
        ctx.fillRect(px, py, TILE, TILE);
        ctx.fillStyle = 'rgba(255,255,255,.25)';
        const wob = Math.sin(Date.now() / 400 + x + y) * 3;
        ctx.fillRect(px + 6, py + 18 + wob, TILE - 12, 3);
      } else if (c === 'C') {
        ctx.font = '26px serif';
        ctx.fillText('🔥', px + TILE / 2, py + TILE / 2 + 2);
      } else if (c === 'S') {
        ctx.font = '26px serif';
        ctx.fillText('🏪', px + TILE / 2, py + TILE / 2 + 2);
      } else if (c === 'E') {
        ctx.font = '26px serif';
        ctx.fillText(G.world.cleared[mv.map.id] ? '🚪' : '🔒', px + TILE / 2, py + TILE / 2 + 2);
      } else if (c === 'R') {
        ctx.font = '26px serif';
        ctx.fillText('🔙', px + TILE / 2, py + TILE / 2 + 2);
      } else if (th.deco && th.deco[c]) {
        // 裝飾地物（可行走）
        ctx.font = '18px serif';
        ctx.fillText(th.deco[c], px + TILE / 2, py + TILE / 2 + 2);
      }
    }
  }

  // 寶箱（每關可有多個）
  ctx.font = '26px serif';
  mv.chests.forEach(ch => {
    ctx.fillText('📦', ch.x * TILE + TILE / 2, ch.y * TILE + TILE / 2 + 2);
  });

  // 依進化階段畫圖示：二階銀光、三階金光＋皇冠（繼承感）；支援圖片怪獸
  const drawSpecies = (sp, px, py, size) => {
    const st = sp.stage || 1;
    const fx = st > 1 && !sp.baked; // 烘焙圖效果已在圖檔內
    if (fx) {
      ctx.save();
      ctx.shadowColor = st === 3 ? '#ffb300' : '#90caf9';
      ctx.shadowBlur = 10;
    }
    const im = speciesImgEl(sp);
    if (im) {
      const box = size * 1.35; // 圖片視覺份量對齊 emoji
      const k = Math.min(box / im.width, box / im.height);
      const w = im.width * k, h = im.height * k;
      ctx.drawImage(im, px - w / 2, py - h / 2, w, h);
    } else {
      ctx.font = size + 'px serif';
      ctx.fillText(sp.emoji, px, py);
    }
    if (fx) ctx.restore();
    if (st === 3 && !sp.baked) {
      ctx.font = Math.round(size * 0.42) + 'px serif';
      ctx.fillText('👑', px + size * 0.38, py - size * 0.52);
    }
  };

  // Boss（首次必在；擊敗後 5 小時重生）
  if (mv.bossActive()) {
    const bsp = SPECIES[mv.map.bossId];
    const bob = Math.sin(Date.now() / 300) * 3;
    drawSpecies(bsp, mv.bossPos.x * TILE + TILE / 2, mv.bossPos.y * TILE + TILE / 2 + bob, 34);
    if ((bsp.stage || 1) < 3) {
      ctx.font = '14px serif';
      ctx.fillText('👑', mv.bossPos.x * TILE + TILE / 2 + 12, mv.bossPos.y * TILE + 8);
    }
  }

  // 野生怪獸（明雷；⭐精英、✨初始夥伴）
  mv.monsters.forEach(mon => {
    const sp = SPECIES[mon.spId];
    const bob = Math.sin(Date.now() / 350 + (mon.starter ? 9 : mon.idx)) * 2;
    drawSpecies(sp, mon.x * TILE + TILE / 2, mon.y * TILE + TILE / 2 + bob, 26);
    if (mon.elite) {
      ctx.font = '13px serif';
      ctx.fillText('⭐', mon.x * TILE + TILE / 2 + 12, mon.y * TILE + 8);
    } else if (mon.starter) {
      ctx.font = '13px serif';
      ctx.fillText('✨', mon.x * TILE + TILE / 2 + 12, mon.y * TILE + 8);
    }
  });

  // 玩家（戴帽子的小冒險者）
  const av = Avatar.get();
  const aw = 38, ah = aw * Avatar.ratio;
  ctx.drawImage(av, G.world.x * TILE + TILE / 2 - aw / 2, G.world.y * TILE + TILE / 2 - ah / 2 - 4, aw, ah);
};
