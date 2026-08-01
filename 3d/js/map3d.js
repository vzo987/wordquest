// ============ 3D 地圖探索系統（明雷遇敵） ============
// 與 2D 版 ui/map.js 邏輯相同，渲染改為 Three.js 立體場景
const MapView = {
  map: null,
  grid: [],
  monsters: [],
  bossPos: null,
  chests: [],           // 未開啟的寶箱 [{x, y, key}]
  busy: false,
  lastMove: 0,
  graceUntil: 0,
  wanderTimer: null,

  // --- 3D 物件 ---
  renderer: null, scene: null, camera: null,
  boardGroup: null,     // 地形
  playerGroup: null,
  monsterGroups: {},    // key → THREE.Group
  bossGroup: null, chestGroups: {}, exitSprite: null,
  waters: [], fireLight: null,
  // --- 第三人稱鏡頭（固定朝向，位置平滑跟隨 → 避免暈眩） ---
  camAngle: Math.PI, camAngleTarget: Math.PI, // 固定面向北方（與小地圖方位一致）
  playerFlip: 1,                               // 角色左右翻面（1 右 / -1 左）
  minimap: null, lastMiniDraw: 0,
};

// 鏡頭參數（身歷其境的第三人稱跟隨視角）
const CAM_DIST = 4.5;    // 鏡頭在玩家身後的距離
const CAM_HEIGHT = 3.2;  // 鏡頭高度
const CAM_AHEAD = 2.2;   // 視線望向玩家前方幾格

const RESPAWN_MS = 3 * 60 * 1000; // 3 分鐘計時重生
const BOARD_W = 15, BOARD_H = 10;
const gx = x => x - (BOARD_W - 1) / 2;   // 格子 → 世界座標
const gz = y => y - (BOARD_H - 1) / 2;

// 各地圖天空色
const SKY = {
  map1: ['#7ec8e3', '#d8f0c0'], map2: ['#8fd3f4', '#e8f7fb'],
  map3: ['#ff9e80', '#ffd180'], map4: ['#90a4ae', '#cfd8dc'],
  map5: ['#e0c188', '#f5e6c8'],
  map6: ['#3f5e63', '#7fa88b'], map7: ['#7fd4e8', '#eafcff'],
  map8: ['#4e342e', '#8d6e63'], map9: ['#546e7a', '#90a4ae'],
  map10: ['#ffe0b2', '#fff8e1'], map11: ['#b3e5fc', '#e8f5e9'],
  map12: ['#a7d8f0', '#eef9ff'], map13: ['#37121a', '#b71c1c'],
  map14: ['#81aabf', '#cfd8dc'], map15: ['#d7b98a', '#f0e2c0'],
};

// ---------- 3D 初始化（一次） ----------
MapView.init3d = function () {
  const mv = MapView;
  if (mv.renderer) return;
  const canvas = $('#map-canvas');
  mv.renderer = E3D.makeRenderer(canvas);
  mv.scene = new THREE.Scene();
  mv.camera = new THREE.PerspectiveCamera(55, 1.5, 0.1, 100);

  // 左上角小地圖（身歷其境視角的導航輔助）
  const mini = document.createElement('canvas');
  mini.id = 'minimap';
  mini.width = BOARD_W * 8;
  mini.height = BOARD_H * 8;
  $('#map-wrap').appendChild(mini);
  mv.minimap = mini;

  mv.scene.add(new THREE.AmbientLight(0xffffff, 0.75));
  const sun = new THREE.DirectionalLight(0xffffff, 0.7);
  sun.position.set(5, 12, 6);
  mv.scene.add(sun);

  mv.boardGroup = new THREE.Group();
  mv.scene.add(mv.boardGroup);

  // 玩家（戴帽子的小冒險者，程式繪製）
  mv.playerGroup = new THREE.Group();
  const avTex = new THREE.CanvasTexture(Avatar.get());
  avTex.anisotropy = 4;
  const pSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: avTex, transparent: true }));
  pSprite.scale.set(1.05, 1.05 * Avatar.ratio, 1);
  pSprite.position.y = 0.68;
  mv.playerGroup.add(pSprite, E3D.makeShadow(0.9));
  mv.playerGroup.userData.sprite = pSprite;
  mv.scene.add(mv.playerGroup);

  E3D.register({ tick: t => mv.tick3d(t) });
};

// ---------- 載入地圖 ----------
MapView.load = function (mapId, pos = null) {
  const mv = MapView;
  mv.init3d();
  mv.map = MAPS[mapId];
  mv.grid = mv.map.grid.map(r => r.split(''));
  G.world.map = mapId;

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
        if (!G.world.chests[key]) mv.chests.push({ x, y, key });
        mv.grid[y][x] = '.';
      }
    }
  }
  if (pos) { G.world.x = pos.x; G.world.y = pos.y; }
  else { G.world.x = startX; G.world.y = startY; }

  // 生成野生怪獸（重生冷卻 / 錯題精英怪）
  mv.monsters = [];
  const hasWrong = wrongWordPool(mv.map.wordLv).length > 0;
  spawnTiles.forEach((t, idx) => {
    const key = `${mapId}_${idx}`;
    const defeatedAt = G.world.defeated[key];
    if (defeatedAt && Date.now() - defeatedAt < RESPAWN_MS) return;
    delete G.world.defeated[key];
    mv.monsters.push({
      idx, key,
      spId: pick(mv.map.pool),
      lv: randRange(mv.map.lvRange[0], mv.map.lvRange[1]),
      elite: hasWrong && chance(0.35),
      x: t.x, y: t.y, homeX: t.x, homeY: t.y,
    });
  });
  mv.spawnStarter();

  mv.build3dBoard();
  // 玩家瞬移到起點，鏡頭直接就位（不做過場滑動）
  mv.playerGroup.position.set(gx(G.world.x), 0, gz(G.world.y));
  mv.camAngle = mv.camAngleTarget = Math.PI; // 固定朝北（防暈：視角不旋轉）
  const fx0 = Math.sin(mv.camAngle), fz0 = Math.cos(mv.camAngle);
  mv.camera.position.set(gx(G.world.x) - fx0 * CAM_DIST, CAM_HEIGHT, gz(G.world.y) - fz0 * CAM_DIST);

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
  if (defeatedAt && Date.now() - defeatedAt < STARTER_RESPAWN_MS) return;
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

// ---------- 建立 3D 地形 ----------
MapView.build3dBoard = function () {
  const mv = MapView;
  const th = mv.map.theme;

  // 清除舊地形與角色
  const disposeGroup = (grp) => {
    if (!grp) return;
    grp.traverse(o => {
      if (o.geometry) o.geometry.dispose();
      if (o.material && !o.material.map) o.material.dispose();
    });
  };
  disposeGroup(mv.boardGroup);
  mv.boardGroup.clear();
  Object.values(mv.monsterGroups).forEach(g => mv.scene.remove(g));
  mv.monsterGroups = {};
  if (mv.bossGroup) { mv.scene.remove(mv.bossGroup); mv.bossGroup = null; }
  Object.values(mv.chestGroups).forEach(g => mv.scene.remove(g));
  mv.chestGroups = {};
  mv.waters = [];
  mv.exitSprite = null;

  // 天空與霧氣（遠處漸淡，增加立體景深）
  const sky = SKY[mv.map.id] || SKY.map1;
  $('#map-canvas').style.background = `linear-gradient(180deg, ${sky[0]}, ${sky[1]})`;
  mv.scene.fog = new THREE.Fog(new THREE.Color(sky[0]), 9, 24);

  const groundMatA = new THREE.MeshLambertMaterial({ color: new THREE.Color(th.ground) });
  const groundMatB = new THREE.MeshLambertMaterial({ color: new THREE.Color(th.ground2) });
  const blockMat = new THREE.MeshLambertMaterial({ color: new THREE.Color(th.blockBg) });
  const waterMat = new THREE.MeshLambertMaterial({ color: new THREE.Color(th.liquid), transparent: true, opacity: 0.85 });
  const groundGeo = new THREE.BoxGeometry(0.98, 0.18, 0.98);
  const blockGeo = new THREE.BoxGeometry(0.92, 0.7, 0.92);
  const waterGeo = new THREE.BoxGeometry(1, 0.1, 1);

  for (let y = 0; y < mv.grid.length; y++) {
    for (let x = 0; x < mv.grid[y].length; x++) {
      const c = mv.grid[y][x];
      const wx = gx(x), wz = gz(y);
      if (c === '~') {
        const w = new THREE.Mesh(waterGeo, waterMat);
        w.position.set(wx, -0.1, wz);
        w.userData.phase = (x + y) * 0.7;
        mv.boardGroup.add(w);
        mv.waters.push(w);
        continue;
      }
      // 地面
      const g = new THREE.Mesh(groundGeo, (x + y) % 2 === 0 ? groundMatA : groundMatB);
      g.position.set(wx, -0.09, wz);
      mv.boardGroup.add(g);

      if (c === '#') {
        const b = new THREE.Mesh(blockGeo, blockMat);
        b.position.set(wx, 0.35, wz);
        mv.boardGroup.add(b);
        const s = E3D.makeEmojiSprite(th.block, 1.0);
        s.position.set(wx, 1.05, wz);
        mv.boardGroup.add(s);
      } else if (c === 'C') {
        const s = E3D.makeEmojiSprite('🔥', 0.9);
        s.position.set(wx, 0.5, wz);
        mv.boardGroup.add(s);
        if (!mv.fireLight) {
          mv.fireLight = new THREE.PointLight(0xff9040, 1.2, 5);
          mv.scene.add(mv.fireLight);
        }
        mv.fireLight.position.set(wx, 1, wz);
      } else if (c === 'S') {
        const s = E3D.makeEmojiSprite('🏪', 1.0);
        s.position.set(wx, 0.55, wz);
        mv.boardGroup.add(s);
      } else if (c === 'E') {
        const s = E3D.makeEmojiSprite(G.world.cleared[mv.map.id] ? '🚪' : '🔒', 0.9);
        s.position.set(wx, 0.55, wz);
        mv.boardGroup.add(s);
        mv.exitSprite = s;
      } else if (c === 'R') {
        const s = E3D.makeEmojiSprite('🔙', 0.85);
        s.position.set(wx, 0.5, wz);
        mv.boardGroup.add(s);
      } else if (th.deco && th.deco[c]) {
        // 裝飾地物（可行走的小物件）
        const s = E3D.makeEmojiSprite(th.deco[c], 0.55);
        s.position.set(wx, 0.28, wz);
        mv.boardGroup.add(s);
      }
    }
  }

  // 寶箱（每關可有多個）
  mv.chests.forEach(ch => {
    const grp = new THREE.Group();
    const s = E3D.makeEmojiSprite('📦', 0.85);
    s.position.y = 0.45;
    grp.add(s, E3D.makeShadow(0.7));
    grp.position.set(gx(ch.x), 0, gz(ch.y));
    mv.chestGroups[ch.key] = grp;
    mv.scene.add(grp);
  });

  // BOSS
  if (mv.bossPos) {
    const bsp = SPECIES[mv.map.bossId];
    mv.bossGroup = new THREE.Group();
    const s = E3D.makeSpeciesSprite(bsp, 1.5);
    s.position.y = 0.8;
    const crown = E3D.makeEmojiSprite('👑', 0.55);
    crown.position.set(0.35, 1.65, 0);
    mv.bossGroup.add(s, crown, E3D.makeShadow(1.3));
    mv.bossGroup.position.set(gx(mv.bossPos.x), 0, gz(mv.bossPos.y));
    mv.scene.add(mv.bossGroup);
  }
};

// 為怪獸建立 3D 群組
MapView.makeMonsterGroup = function (mon) {
  const grp = new THREE.Group();
  const sp = SPECIES[mon.spId];
  const s = E3D.makeSpeciesSprite(sp, 0.95);
  s.position.y = 0.52;
  grp.add(s, E3D.makeShadow(0.85));
  if (mon.elite) {
    const star = E3D.makeEmojiSprite('⭐', 0.42);
    star.position.set(0.32, 1.05, 0);
    grp.add(star);
  } else if (mon.starter) {
    const spark = E3D.makeEmojiSprite('✨', 0.45);
    spark.position.set(0.32, 1.05, 0);
    grp.add(spark);
  }
  grp.position.set(gx(mon.x), 0, gz(mon.y));
  grp.userData.sprite = s;
  return grp;
};

// ---------- 每幀更新 ----------
MapView.tick3d = function (now) {
  const mv = MapView;
  if (!mv.map || !mv.renderer) return;
  if (!$('#screen-map').classList.contains('active')) return;
  if (!E3D.fitRenderer(mv.renderer, mv.camera)) return;
  const t = now / 1000;

  // 玩家平滑移動 + 走路彈跳 + 左右翻面
  const px = gx(G.world.x), pz = gz(G.world.y);
  mv.playerGroup.position.x = E3D.lerp(mv.playerGroup.position.x, px, 0.22);
  mv.playerGroup.position.z = E3D.lerp(mv.playerGroup.position.z, pz, 0.22);
  const pSpr = mv.playerGroup.userData.sprite;
  pSpr.position.y = 0.68 + Math.abs(Math.sin(t * 4)) * 0.06;
  pSpr.scale.x = 1.05 * mv.playerFlip;

  // 怪獸群組同步（新增/移除/移動）
  const alive = new Set();
  mv.monsters.forEach(mon => {
    alive.add(mon.key);
    let grp = mv.monsterGroups[mon.key];
    if (!grp) {
      grp = mv.makeMonsterGroup(mon);
      mv.monsterGroups[mon.key] = grp;
      mv.scene.add(grp);
    }
    grp.position.x = E3D.lerp(grp.position.x, gx(mon.x), 0.12);
    grp.position.z = E3D.lerp(grp.position.z, gz(mon.y), 0.12);
    grp.userData.sprite.position.y = 0.52 + Math.sin(t * 3 + mon.idx) * 0.05;
  });
  for (const key of Object.keys(mv.monsterGroups)) {
    if (!alive.has(key)) {
      mv.scene.remove(mv.monsterGroups[key]);
      delete mv.monsterGroups[key];
    }
  }

  // BOSS / 寶箱顯示狀態（BOSS 擊敗後 5 小時重生）
  if (mv.bossGroup) {
    mv.bossGroup.visible = mv.bossActive();
    mv.bossGroup.children[0].position.y = 0.8 + Math.sin(t * 2.2) * 0.08;
  }
  for (const [key, grp] of Object.entries(mv.chestGroups)) {
    if (G.world.chests[key]) { mv.scene.remove(grp); delete mv.chestGroups[key]; }
  }
  if (mv.exitSprite) E3D.setSpriteEmoji(mv.exitSprite, G.world.cleared[mv.map.id] ? '🚪' : '🔒');

  // 水波 / 營火光
  mv.waters.forEach(w => { w.position.y = -0.1 + Math.sin(t * 2 + w.userData.phase) * 0.03; });
  if (mv.fireLight) mv.fireLight.intensity = 1.1 + Math.sin(t * 9) * 0.25 + Math.random() * 0.1;

  // 第三人稱跟隨鏡頭：在玩家身後，隨移動方向平滑轉向
  let dAng = mv.camAngleTarget - mv.camAngle;
  dAng = Math.atan2(Math.sin(dAng), Math.cos(dAng)); // 取最短旋轉方向
  mv.camAngle += dAng * 0.09;
  const fx = Math.sin(mv.camAngle), fz = Math.cos(mv.camAngle);
  const p = mv.playerGroup.position;
  mv.camera.position.x = E3D.lerp(mv.camera.position.x, p.x - fx * CAM_DIST, 0.1);
  mv.camera.position.y = E3D.lerp(mv.camera.position.y, CAM_HEIGHT, 0.1);
  mv.camera.position.z = E3D.lerp(mv.camera.position.z, p.z - fz * CAM_DIST, 0.1);
  mv.camera.lookAt(p.x + fx * CAM_AHEAD, 0.6, p.z + fz * CAM_AHEAD);

  mv.renderer.render(mv.scene, mv.camera);
  mv.drawMinimap(now);
};

// ---------- 小地圖 ----------
MapView.drawMinimap = function (now) {
  const mv = MapView;
  if (!mv.minimap || now - mv.lastMiniDraw < 150) return;
  mv.lastMiniDraw = now;
  const ctx = mv.minimap.getContext('2d');
  const th = mv.map.theme;
  const S = 8;
  for (let y = 0; y < mv.grid.length; y++) {
    for (let x = 0; x < mv.grid[y].length; x++) {
      const c = mv.grid[y][x];
      ctx.fillStyle =
        c === '#' ? th.blockBg :
        c === '~' ? th.liquid :
        c === 'C' ? '#ff7043' :
        c === 'S' ? '#ab47bc' :
        c === 'R' ? '#26c6da' :
        c === 'E' ? (G.world.cleared[mv.map.id] ? '#ffd54f' : '#78909c') :
        ((x + y) % 2 === 0 ? th.ground : th.ground2);
      ctx.fillRect(x * S, y * S, S, S);
    }
  }
  // 寶箱 / BOSS / 怪獸 / 玩家
  ctx.fillStyle = '#ffb300';
  mv.chests.forEach(ch => {
    ctx.fillRect(ch.x * S + 2, ch.y * S + 2, S - 4, S - 4);
  });
  if (mv.bossActive()) {
    ctx.fillStyle = '#d500f9';
    ctx.beginPath();
    ctx.arc(mv.bossPos.x * S + S / 2, mv.bossPos.y * S + S / 2, S / 2, 0, 7);
    ctx.fill();
  }
  mv.monsters.forEach(mon => {
    ctx.fillStyle = mon.starter ? '#f06292' : mon.elite ? '#ff6f00' : '#e53935';
    ctx.beginPath();
    ctx.arc(mon.x * S + S / 2, mon.y * S + S / 2, S / 2 - 1.5, 0, 7);
    ctx.fill();
  });
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = '#1a237e';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(G.world.x * S + S / 2, G.world.y * S + S / 2, S / 2 - 1, 0, 7);
  ctx.fill();
  ctx.stroke();
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

// ---------- 遊戲迴圈（怪獸巡邏） ----------
MapView.startLoops = function () {
  const mv = MapView;
  clearInterval(mv.wanderTimer);
  mv.wanderTimer = setInterval(() => {
    if (mv.busy || Battle.active) return;
    mv.monsters.forEach(mon => {
      if (!chance(0.55)) return;
      const dirs = shuffle([[0, 1], [0, -1], [1, 0], [-1, 0]]);
      for (const [dx, dy] of dirs) {
        const nx = mon.x + dx, ny = mon.y + dy;
        if (Math.abs(nx - mon.homeX) > 2 || Math.abs(ny - mon.homeY) > 2) continue;
        if (!mv.walkable(nx, ny)) continue;
        if (mv.monsterAt(nx, ny)) continue;
        if (nx === G.world.x && ny === G.world.y) {
          if (Date.now() < mv.graceUntil) continue; // 戰後緩衝
          mv.triggerBattle(mon);
          return;
        }
        mon.x = nx; mon.y = ny;
        break;
      }
    });
  }, 850);
};

MapView.stopLoops = function () { clearInterval(MapView.wanderTimer); };

MapView.walkable = function (x, y) {
  const mv = MapView;
  if (y < 0 || y >= mv.grid.length || x < 0 || x >= mv.grid[0].length) return false;
  const c = mv.grid[y][x];
  return c !== '#' && c !== '~';
};

MapView.monsterAt = function (x, y) {
  return MapView.monsters.find(m => m.x === x && m.y === y);
};

// ---------- 玩家移動（相機相對：▲=前進、▼=後退、◀▶=左右） ----------
MapView.move = function (sdx, sdy) {
  const mv = MapView;
  if (mv.busy || Battle.active) return;
  const now = Date.now();
  if (now - mv.lastMove < 140) return;
  mv.lastMove = now;

  // 把螢幕方向鍵轉換成以鏡頭面向為基準的世界方向（鏡頭固定朝北 → ▲=上、▼=下、◀▶=左右，與小地圖一致）
  const snap = Math.round(mv.camAngle / (Math.PI / 2)) * (Math.PI / 2);
  const fx = Math.round(Math.sin(snap)), fz = Math.round(Math.cos(snap));
  const ix = sdx, iy = -sdy;           // iy=+1 前進、ix=+1 向右
  const dx = iy * fx - ix * fz;
  const dy = iy * fz + ix * fx;

  const nx = G.world.x + dx, ny = G.world.y + dy;
  if (dx !== 0) mv.playerFlip = dx > 0 ? -1 : 1; // 角色朝移動方向翻面（鏡頭不轉）

  const mon = mv.monsterAt(nx, ny);
  if (mon) return mv.triggerBattle(mon);

  if (mv.bossPos && nx === mv.bossPos.x && ny === mv.bossPos.y && mv.bossActive()) {
    return mv.triggerBoss();
  }

  if (!mv.walkable(nx, ny)) return;
  G.world.x = nx; G.world.y = ny;
  Audio2.sfx.step();

  const c = mv.grid[ny][nx];
  if (c === 'C') mv.onCampfire();
  else if (c === 'S') mv.onShop();
  else if (c === 'E') mv.onExit();
  else if (c === 'R') mv.onReturn();
  const chest = mv.chests.find(ch => ch.x === nx && ch.y === ny);
  if (chest) mv.onChest(chest);
};

// ---------- 地圖事件（與 2D 版相同） ----------
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

MapView.onShop = function () { openShop(); };

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

MapView.onExit = async function () {
  const mv = MapView;
  if (!G.world.cleared[mv.map.id]) {
    mapMsg('🔒 出口被神祕力量封住了…要先打敗這裡的 BOSS！', 2600);
    G.world.x = clamp(G.world.x - 1, 1, mv.grid[0].length - 2);
    return;
  }
  mv.busy = true;
  if (mv.map.next) {
    const next = MAPS[mv.map.next];
    await showModal({
      title: '前往新地區！', emoji: '🗺️',
      body: `<b>${next.name}</b>（Lv.${next.lvRange[0]}~${next.lvRange[1]}）<br>${next.theme.name2}<br><small>單字難度提升，加油！</small>`,
    });
    mv.load(mv.map.next);
    G.world.checkpoint = { map: mv.map.next, x: G.world.x, y: G.world.y };
    autoSave();
  } else {
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
  mv.graceUntil = Date.now() + 3000;
  if (outcome.result === 'win' && mon) {
    G.world.defeated[mon.key] = Date.now();
    mv.monsters = mv.monsters.filter(m => m !== mon);
  } else if (mon) {
    mon.x = mon.homeX; mon.y = mon.homeY;
  }
  if (outcome.result === 'lose') {
    const cp = G.world.checkpoint;
    mapMsg('🔥 你在營火旁醒來，夥伴們恢復精神了！', 2600);
    if (cp.map !== mv.map.id) mv.load(cp.map, { x: cp.x, y: cp.y });
    else {
      G.world.x = cp.x; G.world.y = cp.y;
      mv.playerGroup.position.set(gx(cp.x), 0, gz(cp.y)); // 瞬移
    }
  }
  mv.refreshHud();
  mv.busy = false;
};

// ---------- 計時重生 ----------
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
    if (t.x === G.world.x && t.y === G.world.y) return;
    delete G.world.defeated[key];
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
