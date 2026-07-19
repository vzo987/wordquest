// ============ UI 畫面：標題 / 選夥伴 / 商店 / 隊伍 / 背包 / 圖鑑 / 單字書 ============

// ---------- 初始夥伴選擇 ----------
function showStarterSelect() {
  showScreen('screen-starter');
  const list = $('#starter-list');
  list.innerHTML = '';
  let selected = null;

  STARTERS.forEach(id => {
    const sp = SPECIES[id];
    const card = document.createElement('div');
    card.className = 'starter-card';
    card.innerHTML = `<div class="s-emoji">${sp.emoji}</div>` +
      `<div class="s-name">${sp.name}</div>` +
      `<div class="s-elem"><span class="badge badge-${sp.elem}">${sp.elem}屬性</span></div>`;
    card.onclick = () => {
      Audio2.sfx.select();
      $$('.starter-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      selected = id;
      const d = $('#starter-detail');
      d.classList.remove('hidden');
      d.innerHTML = `<b style="font-size:20px">${sp.emoji} ${sp.name}</b>` +
        `<div class="d-desc">${STARTER_INTRO[id]}<br><small>${sp.desc}</small></div>` +
        `<div class="d-stats"><span>❤️ HP ${sp.base.hp}</span><span>⚔️ ATK ${sp.base.atk}</span><span>🛡️ DEF ${sp.base.def}</span></div>` +
        `<button class="btn btn-big btn-gold" id="btn-starter-ok">就決定是你了！</button>`;
      $('#btn-starter-ok').onclick = async () => {
        if (G.team.length) return; // 防連點重複建立
        const m = createMonster(selected, 1);
        G.team = [m];
        dexCaught(selected);
        await showModal({
          title: '冒險開始！', emoji: sp.emoji,
          body: `<b>${sp.name}</b> 成為了你的夥伴！<br>在地圖上用 <b>方向鍵 / WASD / 螢幕按鈕</b> 移動，<br>碰到怪獸就會進入單字戰鬥。<br>答對就能攻擊，答錯會被反擊喔！<br>先去找 🔥 營火，那是存檔點。`,
        });
        autoSave();
        MapView.load(G.world.map, { x: G.world.x, y: G.world.y });
        showScreen('screen-map');
      };
    };
    list.appendChild(card);
  });
}

// ---------- 覆蓋層基礎 ----------
function openOverlay(title, html) {
  $('#overlay-title').textContent = title;
  $('#overlay-body').innerHTML = html;
  $('#overlay').classList.remove('hidden');
}
function closeOverlay() { $('#overlay').classList.add('hidden'); MapView.refreshHud(); }

// ---------- 商店 ----------
function openShop() {
  const stock = shopStock(G.player.shopTier);
  let html = `<div class="wb-summary">💰 金幣：<b id="shop-gold">${G.player.gold}</b>　商店等級 ${G.player.shopTier}（擊敗 BOSS 可升級商店）</div>`;
  stock.forEach((it, i) => {
    let owned = '';
    if (it.kind === 'passive' && G.player.passives[it.id]) owned = '✅ 已擁有';
    if (it.kind === 'weapon') owned = `持有 ${G.player.invWeapons[it.id] || 0}`;
    if (it.kind === 'armor') owned = `持有 ${G.player.invArmors[it.id] || 0}`;
    if (it.kind === 'consumable') owned = `持有 ${G.player.items[it.id] || 0}`;
    const stat = it.kind === 'weapon' ? `⚔️+${it.atk}` : it.kind === 'armor' ? `🛡️+${it.def}${it.hp ? ' ❤️+' + it.hp : ''}${it.elem ? ` <span class="badge badge-${it.elem}">${it.elem}</span>` : ''}` : '';
    const disabled = (it.kind === 'passive' && G.player.passives[it.id]) ? 'disabled' : '';
    html += `<div class="shop-item"><div class="si-emoji">${it.emoji}</div>` +
      `<div class="si-info"><div class="si-name">${it.name} ${stat}</div><div class="si-desc">${it.desc}　<small>${owned}</small></div></div>` +
      `<div class="si-price">💰${it.price}</div>` +
      `<button class="btn" data-buy="${i}" ${disabled}>購買</button></div>`;
  });
  openOverlay('🏪 冒險商店', html);
  $('#overlay-body').querySelectorAll('[data-buy]').forEach(b => {
    b.onclick = async () => {
      const it = stock[Number(b.dataset.buy)];
      if (G.player.gold < it.price) {
        await showModal({ title: '金幣不足', emoji: '💸', body: '打敗更多怪獸賺金幣吧！' });
        return;
      }
      G.player.gold -= it.price;
      if (it.kind === 'weapon') G.player.invWeapons[it.id] = (G.player.invWeapons[it.id] || 0) + 1;
      else if (it.kind === 'armor') G.player.invArmors[it.id] = (G.player.invArmors[it.id] || 0) + 1;
      else if (it.kind === 'consumable') G.player.items[it.id] = (G.player.items[it.id] || 0) + 1;
      else if (it.kind === 'passive') G.player.passives[it.id] = true;
      Audio2.sfx.coin();
      autoSave(); // GDD：購買後自動存檔
      openShop(); // 重新整理
    };
  });
}

// ---------- 隊伍管理 ----------
function openTeam() {
  let html = '<div class="wb-summary">出戰隊伍最多 3 隻。點「裝備」幫夥伴穿裝備、點「技能」調整招式。</div>';
  html += '<h4 style="margin:6px 4px">⚔️ 出戰隊伍</h4>';
  G.team.forEach((m, i) => { html += teamCardHtml(m, i, 'team'); });
  if (G.storage.length) {
    html += '<h4 style="margin:10px 4px">📦 怪獸倉庫</h4>';
    G.storage.forEach((m, i) => { html += teamCardHtml(m, i, 'storage'); });
  }
  openOverlay('👥 隊伍與倉庫', html);

  const body = $('#overlay-body');
  body.querySelectorAll('[data-equip]').forEach(b => b.onclick = () => openEquip(b.dataset.equip));
  body.querySelectorAll('[data-skills]').forEach(b => b.onclick = () => openSkills(b.dataset.skills));
  body.querySelectorAll('[data-tostorage]').forEach(b => b.onclick = () => {
    if (G.team.length <= 1) return;
    const idx = Number(b.dataset.tostorage);
    G.storage.push(G.team.splice(idx, 1)[0]);
    autoSave(); openTeam();
  });
  body.querySelectorAll('[data-toteam]').forEach(b => b.onclick = () => {
    if (G.team.length >= 3) return;
    const idx = Number(b.dataset.toteam);
    G.team.push(G.storage.splice(idx, 1)[0]);
    autoSave(); openTeam();
  });
}

function teamCardHtml(m, i, where) {
  const sp = SPECIES[m.sp];
  const s = monsterStats(m);
  const expPct = Math.round(m.exp / expToNext(m.lv) * 100);
  const wName = m.weapon ? `${WEAPONS[m.weapon].emoji}${WEAPONS[m.weapon].name}` : '—';
  const aName = m.armor ? `${ARMORS[m.armor].emoji}${ARMORS[m.armor].name}` : '—';
  const btns = where === 'team'
    ? `<button class="btn" data-equip="${m.uid}">🗡️ 裝備</button>
       <button class="btn" data-skills="${m.uid}">✨ 技能</button>
       ${G.team.length > 1 ? `<button class="btn btn-close" data-tostorage="${i}">送回倉庫</button>` : ''}`
    : `<button class="btn ${G.team.length >= 3 ? '' : 'btn-gold'}" data-toteam="${i}" ${G.team.length >= 3 ? 'disabled' : ''}>加入隊伍</button>
       <button class="btn" data-equip="${m.uid}">🗡️ 裝備</button>`;
  return `<div class="team-card"><div class="t-emoji">${sp.emoji}</div>
    <div class="t-info">
      <div class="t-name">${sp.name} <span class="badge badge-${sp.elem}">${sp.elem}</span> Lv.${m.lv}</div>
      <div class="t-stats">❤️${Math.round(m.hp)}/${s.hpMax}　⚔️${s.totalAtk}　🛡️${s.totalDef}　武器:${wName}　防具:${aName}</div>
      <div class="t-hpbar"><div class="hpfill" style="width:${clamp(m.hp / s.hpMax, 0, 1) * 100}%"></div></div>
      <div class="exp-bar"><div class="exp-fill" style="width:${expPct}%"></div></div>
      <div class="t-stats">EXP ${m.exp}/${expToNext(m.lv)}</div>
    </div>
    <div class="t-btns">${btns}</div></div>`;
}

function findMon(uidStr) {
  return G.team.find(m => m.uid === uidStr) || G.storage.find(m => m.uid === uidStr);
}

// 裝備選擇
async function openEquip(uidStr) {
  const m = findMon(uidStr);
  const sp = SPECIES[m.sp];
  // 可用武器/防具（庫存 > 0）
  const wOpts = Object.entries(G.player.invWeapons).filter(([, n]) => n > 0)
    .map(([id]) => ({ text: `${WEAPONS[id].emoji} ${WEAPONS[id].name}（⚔️+${WEAPONS[id].atk}）`, value: 'w:' + id }));
  const aOpts = Object.entries(G.player.invArmors).filter(([, n]) => n > 0)
    .map(([id]) => {
      const a = ARMORS[id];
      const sheng = a.elem && ELEM_SHENG[a.elem] === sp.elem ? ' 🌟相生加成' : '';
      return { text: `${a.emoji} ${a.name}（🛡️+${a.def}${a.hp ? ' ❤️+' + a.hp : ''}）${sheng}`, value: 'a:' + id };
    });
  const btns = [...wOpts, ...aOpts];
  if (m.weapon) btns.push({ text: `卸下武器 ${WEAPONS[m.weapon].name}`, value: 'unw', cls: 'btn-close' });
  if (m.armor) btns.push({ text: `卸下防具 ${ARMORS[m.armor].name}`, value: 'una', cls: 'btn-close' });
  btns.push({ text: '關閉', value: null });
  if (wOpts.length + aOpts.length === 0 && !m.weapon && !m.armor) {
    await showModal({ title: '沒有裝備', emoji: '🎒', body: '去商店購買武器與防具吧！<br>提示：與夥伴屬性「相生」的聖盾有額外加成。' });
    return openTeam();
  }
  const choice = await showModal({
    title: `${sp.emoji} ${sp.name} 的裝備`,
    body: `目前：武器 ${m.weapon ? WEAPONS[m.weapon].name : '無'}／防具 ${m.armor ? ARMORS[m.armor].name : '無'}<br><small>相生表：金生水、水生木、木生火、火生土、土生金</small>`,
    buttons: btns,
  });
  if (choice) {
    const heal0 = monsterStats(m).hpMax;
    if (choice === 'unw') { G.player.invWeapons[m.weapon] = (G.player.invWeapons[m.weapon] || 0) + 1; m.weapon = null; }
    else if (choice === 'una') { G.player.invArmors[m.armor] = (G.player.invArmors[m.armor] || 0) + 1; m.armor = null; }
    else {
      const [kind, id] = choice.split(':');
      if (kind === 'w') {
        if (m.weapon) G.player.invWeapons[m.weapon] = (G.player.invWeapons[m.weapon] || 0) + 1;
        G.player.invWeapons[id]--; m.weapon = id;
      } else {
        if (m.armor) G.player.invArmors[m.armor] = (G.player.invArmors[m.armor] || 0) + 1;
        G.player.invArmors[id]--; m.armor = id;
      }
    }
    m.hp = clamp(m.hp, 0, monsterStats(m).hpMax);
    void heal0;
    autoSave();
  }
  openTeam();
}

// 技能配置（最多 4 格）
async function openSkills(uidStr) {
  const m = findMon(uidStr);
  const sp = SPECIES[m.sp];
  const btns = m.learned.map(id => {
    const sk = SKILLS[id];
    const on = m.skills.includes(id);
    return { text: `${on ? '✅' : '⬜'} ${sk.fx} ${sk.name}（${sk.desc}）`, value: id };
  });
  btns.push({ text: '完成', value: null, cls: 'btn-gold' });
  const choice = await showModal({
    title: `${sp.emoji} ${sp.name} 的技能`,
    body: `點擊切換裝備中的技能（最多 4 個，戰鬥中使用）。<br>目前裝備：${m.skills.map(id => SKILLS[id].name).join('、')}`,
    buttons: btns,
  });
  if (choice) {
    if (m.skills.includes(choice)) {
      if (m.skills.length > 1) m.skills = m.skills.filter(x => x !== choice);
    } else if (m.skills.length < 4) {
      m.skills.push(choice);
    }
    autoSave();
    return openSkills(uidStr);
  }
  openTeam();
}

// ---------- 背包 ----------
function openBag() {
  let html = '<h4 style="margin:4px">🧪 消耗品</h4>';
  const items = Object.entries(G.player.items).filter(([, n]) => n > 0);
  if (!items.length) html += '<div class="wb-summary">背包空空的～</div>';
  items.forEach(([id, n]) => {
    const it = CONSUMABLES[id];
    html += `<div class="shop-item"><div class="si-emoji">${it.emoji}</div>
      <div class="si-info"><div class="si-name">${it.name} ×${n}</div><div class="si-desc">${it.desc}</div></div></div>`;
  });
  html += '<h4 style="margin:8px 4px">🌟 被動道具</h4>';
  let hasP = false;
  for (const [id, owned] of Object.entries(G.player.passives)) {
    if (!owned) continue;
    hasP = true;
    const p = PASSIVES[id];
    html += `<div class="shop-item"><div class="si-emoji">${p.emoji}</div>
      <div class="si-info"><div class="si-name">${p.name}</div><div class="si-desc">${p.desc}（永久生效）</div></div></div>`;
  }
  if (!hasP) html += '<div class="wb-summary">還沒有被動道具，商店裡有神奇的寶物喔！</div>';

  html += '<h4 style="margin:8px 4px">🗡️ 未裝備的武器防具</h4>';
  let hasG = false;
  for (const [id, n] of Object.entries(G.player.invWeapons)) {
    if (n <= 0) continue; hasG = true;
    html += `<div class="shop-item"><div class="si-emoji">${WEAPONS[id].emoji}</div>
      <div class="si-info"><div class="si-name">${WEAPONS[id].name} ×${n}</div><div class="si-desc">⚔️+${WEAPONS[id].atk}　在「隊伍」畫面幫夥伴裝備</div></div></div>`;
  }
  for (const [id, n] of Object.entries(G.player.invArmors)) {
    if (n <= 0) continue; hasG = true;
    const a = ARMORS[id];
    html += `<div class="shop-item"><div class="si-emoji">${a.emoji}</div>
      <div class="si-info"><div class="si-name">${a.name} ×${n}</div><div class="si-desc">🛡️+${a.def}${a.hp ? ' ❤️+' + a.hp : ''}　在「隊伍」畫面幫夥伴裝備</div></div></div>`;
  }
  if (!hasG) html += '<div class="wb-summary">沒有備用裝備。</div>';
  openOverlay('🎒 背包', html);
}

// ---------- 怪獸圖鑑 ----------
function openDex() {
  const total = Object.keys(SPECIES).length;
  const caught = Object.values(G.dex).filter(v => v === 'caught').length;
  const seen = Object.keys(G.dex).length;
  let html = `<div class="wb-summary">已發現 ${seen} / ${total}　已擁有 ${caught}</div><div class="dex-grid">`;
  for (const [id, sp] of Object.entries(SPECIES)) {
    const st = G.dex[id];
    if (!st) {
      html += `<div class="dex-cell unseen"><div class="d-emoji">❓</div><div class="d-name">???</div></div>`;
    } else {
      html += `<div class="dex-cell"><div class="d-emoji">${sp.emoji}</div>
        <div class="d-name">${sp.name}</div>
        <div><span class="badge badge-${sp.elem}">${sp.elem}</span></div>
        ${st === 'caught' ? '<div class="d-caught">✔ 已擁有</div>' : '<div class="d-caught" style="color:#999">目擊</div>'}</div>`;
    }
  }
  html += '</div>';
  openOverlay('📕 怪獸圖鑑', html);
}

// ---------- 單字書（學習歷程） ----------
function openWordbook() {
  const entries = Object.entries(G.words);
  const learned = entries.length;
  const mastered = entries.filter(([, s]) => s.streak >= 3).length;
  const wrongs = entries.filter(([, s]) => s.ng > 0 && s.streak < 3);
  let html = `<div class="wb-summary">📖 遇過 <b>${learned}</b> 個單字（共 ${WORDS.length} 個）　` +
    `⭐ 已精通 <b>${mastered}</b>（連續答對 3 次）　❗ 待加強 <b>${wrongs.length}</b><br>` +
    `<small>答錯的單字會變成「⭐精英怪」再次出現，把它們都消滅吧！</small></div>`;

  const sorted = entries.map(([en, s]) => ({ en, s, w: WORD_BY_EN[en] })).filter(x => x.w);
  sorted.sort((a, b) => {
    const aw = a.s.ng > 0 && a.s.streak < 3 ? 0 : 1;
    const bw = b.s.ng > 0 && b.s.streak < 3 ? 0 : 1;
    if (aw !== bw) return aw - bw;
    return b.s.seen - a.s.seen;
  });
  if (!sorted.length) html += '<div class="wb-summary">還沒遇過任何單字，去戰鬥吧！</div>';
  sorted.forEach(({ en, s, w }) => {
    const isWrong = s.ng > 0 && s.streak < 3;
    const star = s.streak >= 3 ? '<span class="w-star">⭐精通</span>' : (isWrong ? '<span style="color:#e53935">❗待加強</span>' : '');
    html += `<div class="wb-row ${isWrong ? 'wb-wrong' : ''}">
      <span class="wb-audio" data-say="${esc(en)}">🔊</span>
      <span class="w-en">${esc(en)}</span><span class="w-zh">${esc(w.zh)}</span>
      <span class="w-stat">答對${s.ok} 答錯${s.ng}</span>${star}</div>`;
  });
  openOverlay('📘 我的單字書', html);
  $('#overlay-body').querySelectorAll('.wb-audio').forEach(el => {
    el.onclick = () => Audio2.speak(el.dataset.say);
  });
}
