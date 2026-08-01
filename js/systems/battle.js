// ============ 戰鬥系統（嚴格交互回合制） ============
// 依 GDD：玩家回合（技能/道具/換人，施放技能需答題：答對=攻擊成功、答錯=落空只擦傷）
//         → 敵方回合（自動攻擊，機率觸發 QTE 完美格擋減半）→ 交替進行
const Battle = {
  active: false,
  enemy: null, enemyHp: 0, enemyMaxHp: 0,
  activeIdx: 0,          // 出戰中的隊伍索引
  spMap: {},             // {uid: SP}
  buffMap: {},           // {uid: {stat, mult, turns}}
  perfect: true,         // 本場是否全對（影響收服率）
  isBoss: false,
  map: null,
  resolveEnd: null,
};

function activeMon() { return G.team[Battle.activeIdx]; }

// ---------- 進入戰鬥 ----------
function startBattle({ speciesId, lv, elite = false, isBoss = false }) {
  return new Promise(resolve => {
    const B = Battle;
    B.active = true;
    B.resolveEnd = resolve;
    B.map = MAPS[G.world.map];
    B.enemy = createWildMonster(speciesId, lv, elite);
    const es = enemyStats(B.enemy);
    B.enemyHp = es.hpMax;
    B.enemyMaxHp = es.hpMax;
    B.isBoss = isBoss;
    B.perfect = true;
    B.wrongCount = 0; // 本場答錯次數（敵方怒氣加成）
    B.spMap = {};
    B.buffMap = {};
    // 選出第一隻存活怪獸
    B.activeIdx = G.team.findIndex(m => m.hp > 0);
    G.stats.battles++;
    dexSee(speciesId);

    // 戰鬥背景依地圖屬性
    const themes = {
      '木': 'linear-gradient(180deg,#a5d6a7,#dcedc8)', '水': 'linear-gradient(180deg,#81d4fa,#e1f5fe)',
      '火': 'linear-gradient(180deg,#ff8a65,#ffe0b2)', '金': 'linear-gradient(180deg,#cfd8dc,#eceff1)',
      '土': 'linear-gradient(180deg,#bcaaa4,#efebe9)',
    };
    $('#screen-battle').style.background = themes[B.map.elem] || themes['木'];

    showScreen('screen-battle');
    renderBattlers();
    const sp = SPECIES[speciesId];
    blog(`${elite ? '⭐ 精英' : (isBoss ? '👑 BOSS' : '野生的')} ${sp.name} 出現了！`);
    Audio2.sfx.hit();
    setTimeout(() => playerTurn(), 900);
  });
}

// ---------- 畫面渲染 ----------
function renderBattlers() {
  const B = Battle;
  const e = B.enemy, esp = SPECIES[e.sp];
  const m = activeMon(), msp = SPECIES[m.sp];
  const ms = monsterStats(m);

  $('#enemy-name').innerHTML = `${e.elite ? '⭐' : ''}${B.isBoss ? '👑' : ''}${esp.name} <span class="badge badge-${esp.elem}">${esp.elem}</span>`;
  $('#enemy-lv').textContent = 'Lv.' + e.lv;
  $('#enemy-sprite').innerHTML = speciesIcon(esp) + (e.elite ? '<span class="elite-star">⭐</span>' : '');
  setHpBar('#enemy-hp', '#enemy-hptext', B.enemyHp, B.enemyMaxHp);

  $('#player-name').innerHTML = `${msp.name} <span class="badge badge-${msp.elem}">${msp.elem}</span>`;
  $('#player-lv').textContent = 'Lv.' + m.lv;
  $('#player-sprite').innerHTML = speciesIcon(msp);
  setHpBar('#player-hp', '#player-hptext', m.hp, ms.hpMax);
  renderSp();
}

function setHpBar(barSel, textSel, hp, max) {
  const pct = clamp(hp / max, 0, 1);
  const bar = $(barSel);
  bar.style.width = (pct * 100) + '%';
  bar.className = 'hpfill' + (pct < 0.25 ? ' hp-low' : pct < 0.55 ? ' hp-mid' : '');
  $(textSel).textContent = `${Math.max(0, Math.round(hp))} / ${max}`;
}

function renderSp() {
  const sp = Battle.spMap[activeMon().uid] || 0;
  let s = 'SP ';
  for (let i = 0; i < SP_MAX; i++) s += i < sp ? '🔷' : '◇';
  $('#player-sp').textContent = s;
}

function blog(msg) { $('#battle-log').innerHTML = msg; }

function showDamage(side, text, cls = '') {
  const stage = $('#battle-stage');
  const el = document.createElement('div');
  el.className = 'dmg-num ' + cls;
  el.textContent = text;
  if (side === 'enemy') { el.style.right = '80px'; el.style.top = '90px'; }
  else { el.style.left = '90px'; el.style.bottom = '120px'; }
  stage.appendChild(el);
  setTimeout(() => el.remove(), 1700);
}

function showFx(emoji) {
  const fx = $('#battle-fx');
  fx.innerHTML = `<span class="fx-burst">${emoji}</span>`;
  setTimeout(() => fx.innerHTML = '', 600);
}

// ---------- 玩家回合 ----------
function playerTurn() {
  const B = Battle;
  B.turnLock = false; // 解除回合鎖（防止連點造成重複行動）
  const m = activeMon();
  const sp = B.spMap[m.uid] || 0;
  renderBattlers();

  const menu = $('#action-menu');
  menu.classList.remove('hidden');
  $('#question-panel').classList.add('hidden');
  $('#battle-submenu').classList.add('hidden');

  // 技能按鈕
  const wrap = $('#skill-buttons');
  wrap.innerHTML = '';
  m.skills.forEach(id => {
    const sk = SKILLS[id];
    const b = document.createElement('button');
    b.className = 'btn btn-skill';
    const elemTag = sk.elem ? `<span class="badge badge-${sk.elem}">${sk.elem}</span> ` : '';
    b.innerHTML = `${sk.fx} ${elemTag}${sk.name}` +
      `<span class="sk-cost">${sk.sp > 0 ? sk.sp + ' SP' : '+1 SP'}</span>` +
      `<span class="sk-desc">${sk.desc}${sk.hardQ ? '（高難度題）' : ''}</span>`;
    b.disabled = sk.sp > sp;
    b.onclick = () => useSkill(id);
    wrap.appendChild(b);
  });

  $('#btn-b-item').onclick = showItemMenu;
  $('#btn-b-switch').onclick = showSwitchMenu;
  $('#btn-b-run').onclick = tryRun;
  $('#btn-b-run').disabled = B.isBoss;
  blog('要怎麼做呢？答對題目就能攻擊！');
}

// ---------- 使用技能（核心：答題→攻防） ----------
async function useSkill(skillId) {
  const B = Battle;
  if (B.turnLock) return; // 防連點
  B.turnLock = true;
  const m = activeMon();
  const ms = monsterStats(m);
  const msp = SPECIES[m.sp];
  const sk = SKILLS[skillId];

  // 出題（GDD：終極大招強制高難度題＝風險與報酬）
  const difficulty = pickDifficulty(B.map, B.isBoss, sk.hardQ);
  const timerSec = questionTimer(B.map, difficulty);
  const result = await askQuestion({
    difficulty, wordLv: B.map.wordLv, elite: B.enemy.elite, timerSec,
  });

  if (result.correct) {
    // === 玩家回合：答對 → 攻擊成功 ===
    // 暴擊判定（GDD：拼字神速或完全無錯 → 1.5 倍暴擊）
    const crit = result.timeRatio < 0.35 || (difficulty !== 'easy' && result.noMistake && result.timeRatio < 0.75);

    // 消耗 / 獲得 SP
    if (sk.sp > 0) B.spMap[m.uid] = (B.spMap[m.uid] || 0) - sk.sp;
    if (sk.gainSp) B.spMap[m.uid] = Math.min(SP_MAX, (B.spMap[m.uid] || 0) + sk.gainSp);

    $('#player-sprite').classList.add('anim-lunge');
    setTimeout(() => $('#player-sprite').classList.remove('anim-lunge'), 500);
    await wait(250);

    if (sk.type === 'atk') {
      const es = enemyStats(B.enemy);
      const esp = SPECIES[B.enemy.sp];
      // 傷害公式（GDD）：夥伴總攻擊力 × 技能倍率 × 屬性 × 本系加成 × 暴擊 − 敵方防禦
      const elemMult = elemMultiplier(sk.elem, esp.elem);
      const stab = sk.elem && sk.elem === msp.elem ? 1.2 : 1;   // 本系加成
      const critMult = crit ? 1.5 : 1;
      let dmg = Math.round(ms.totalAtk * sk.mult * elemMult * stab * critMult) - es.totalDef;
      dmg = Math.max(1, Math.round(dmg * (0.9 + Math.random() * 0.2)));

      B.enemyHp -= dmg;
      showFx(sk.fx);
      if (crit) Audio2.sfx.crit(); else Audio2.sfx.hit();
      $('#enemy-sprite').classList.add('anim-hit');
      setTimeout(() => $('#enemy-sprite').classList.remove('anim-hit'), 400);
      showDamage('enemy', '-' + dmg, crit ? 'crit' : '');

      let msg = `${msp.name} 使出 ${sk.name}！`;
      if (crit) msg += ' 💥暴擊！';
      if (elemMult > 1) msg += ' 效果拔群！';
      if (elemMult < 1) msg += ' 效果不太好…';
      blog(msg);
      renderBattlers();
      await wait(1350); // 停留久一點，讓扣血動畫完整播放

      if (B.enemyHp <= 0) return battleVictory();
    } else if (sk.type === 'heal') {
      const healAmt = Math.round(ms.hpMax * sk.heal);
      m.hp = Math.min(ms.hpMax, m.hp + healAmt);
      Audio2.sfx.heal();
      showFx(sk.fx);
      showDamage('player', '+' + healAmt, 'heal');
      blog(`${msp.name} 使出 ${sk.name}，恢復了 ${healAmt} HP！`);
      renderBattlers();
      await wait(900);
    } else if (sk.type === 'buff') {
      B.buffMap[m.uid] = { ...sk.buff };
      Audio2.sfx.heal();
      showFx(sk.fx);
      blog(`${msp.name} 使出 ${sk.name}，${sk.buff.stat === 'def' ? '防禦力' : '攻擊力'}提升了！`);
      renderBattlers();
      await wait(900);
    }
  } else {
    // === 玩家回合：答錯 → 攻擊落空（Miss，正解已朗讀顯示） ===
    B.perfect = false;
    B.wrongCount++; // 敵方怒氣上升（攻擊力加成）
    if (sk.sp > 0) B.spMap[m.uid] = Math.max(0, (B.spMap[m.uid] || 0) - sk.sp); // 施放失敗仍損失 SP（風險與報酬）

    if (sk.type === 'atk') {
      // 極微弱的擦傷（正常傷害的 10%）
      const es = enemyStats(B.enemy);
      const esp = SPECIES[B.enemy.sp];
      const elemMult = elemMultiplier(sk.elem, esp.elem);
      const stab = sk.elem && sk.elem === msp.elem ? 1.2 : 1;
      const full = Math.max(1, Math.round(ms.totalAtk * sk.mult * elemMult * stab) - es.totalDef);
      const graze = Math.max(1, Math.round(full * 0.1));
      B.enemyHp -= graze;
      showDamage('enemy', '-' + graze);
      blog(`${msp.name} 分心了，攻擊落空…只造成了擦傷。⚠️ 對手氣勢上漲！`);
      renderBattlers();
      await wait(1100);
      if (B.enemyHp <= 0) return battleVictory();
    } else {
      blog(`${msp.name} 分心了，${sk.name} 施放失敗…⚠️ 對手氣勢上漲！`);
      await wait(800);
    }
  }

  // === 敵方回合（交互回合制：玩家行動後必定輪到敵方） ===
  await enemyTurn();
  if (activeMon().hp <= 0) return handleFaint();
  tickBuff(m);
  playerTurn();
}

// ---------- 敵方回合（交互回合制） ----------
async function enemyTurn() {
  const B = Battle;
  if (B.enemyHp <= 0) return;
  const m = activeMon();
  const ms = monsterStats(m);
  const es = enemyStats(B.enemy);
  const esp = SPECIES[B.enemy.sp];

  const atkSkills = B.enemy.skills.filter(id => SKILLS[id].type === 'atk');
  const skName = atkSkills.length ? SKILLS[pick(atkSkills)].name : '衝撞';
  blog(`⚔️ 敵方回合 — ${esp.name} 準備攻擊！`);
  await wait(650);

  // QTE 完美格擋彩蛋（GDD）：閃現極簡單字，限時點對 → 傷害減半
  let blockMult = 1;
  if (chance(0.4)) {
    const blocked = await qteBlock();
    if (blocked) {
      blockMult = 0.5;
      Audio2.sfx.heal();
      showFx('🛡️');
      blog('🛡️ 完美格擋！傷害減半！');
      await wait(650);
    }
  }

  // 防禦 Buff
  const buff = B.buffMap[m.uid];
  const defMult = buff && buff.stat === 'def' ? buff.mult : 1;

  $('#enemy-sprite').classList.add('anim-lunge-enemy');
  setTimeout(() => $('#enemy-sprite').classList.remove('anim-lunge-enemy'), 500);
  await wait(250);

  // 傷害公式：敵方攻擊力 × 1.25（基礎強化）× 怒氣（本場每答錯 +15%，疊加無上限）− 玩家總防禦
  const rage = 1 + (B.wrongCount || 0) * 0.15;
  let dmg = Math.round(es.totalAtk * 1.25 * rage) - Math.round(ms.totalDef * defMult);
  dmg = Math.max(1, Math.round(dmg * (0.9 + Math.random() * 0.2) * blockMult));
  m.hp = Math.max(0, m.hp - dmg);

  Audio2.sfx.hit();
  $('#player-sprite').classList.add('anim-hit');
  setTimeout(() => $('#player-sprite').classList.remove('anim-hit'), 400);
  showDamage('player', '-' + dmg);
  blog(`${esp.name} 使出 ${skName}！` +
    (rage > 1 ? `🔥怒氣 +${Math.round((rage - 1) * 100)}%！` : '') +
    (blockMult < 1 ? '（已格擋減半）' : ''));
  renderBattlers();
  await wait(1350); // 停留久一點，讓扣血動畫完整播放
}

// QTE 完美格擋：閃現缺一個字母的簡單單字，限時內點選正確字母
const QTE_TIME_MS = 2500;
function qteBlock() {
  return new Promise(resolve => {
    const word = pick(wordsUpToLv(1));
    const letters = word.en.toLowerCase().split('');
    const hideIdx = rand(letters.length);
    const correct = letters[hideIdx];
    const display = letters.map((ch, i) => i === hideIdx ? '_' : ch).join(' ');

    // 3 個字母選項
    const alphabet = 'abcdefghijklmnopqrstuvwxyz';
    const opts = [correct];
    while (opts.length < 3) {
      const c = alphabet[rand(26)];
      if (!opts.includes(c)) opts.push(c);
    }

    const box = document.createElement('div');
    box.id = 'qte-box';
    box.innerHTML =
      `<div class="qte-title">⚡ 快速格擋！點出缺少的字母</div>` +
      `<div class="qte-word">${esc(display.toUpperCase())}</div>` +
      `<div class="qte-timer"><div class="qte-timer-fill"></div></div>` +
      `<div class="qte-btns">${shuffle(opts).map(c =>
        `<button class="btn-letter qte-letter" data-ch="${c}">${c.toUpperCase()}</button>`).join('')}</div>`;
    $('#battle-stage').appendChild(box);

    // 倒數條動畫（時長與限時同步）
    requestAnimationFrame(() => {
      const fill = box.querySelector('.qte-timer-fill');
      if (fill) {
        fill.style.transitionDuration = (QTE_TIME_MS / 1000) + 's';
        fill.style.width = '0%';
      }
    });

    let done = false;
    const finish = ok => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      box.remove();
      resolve(ok);
    };
    const timer = setTimeout(() => finish(false), QTE_TIME_MS);
    box.querySelectorAll('.qte-letter').forEach(b => {
      b.onclick = () => {
        const ok = b.dataset.ch === correct;
        if (ok) Audio2.sfx.select();
        finish(ok);
      };
    });
  });
}

function tickBuff(m) {
  const buff = Battle.buffMap[m.uid];
  if (buff && --buff.turns <= 0) delete Battle.buffMap[m.uid];
}

// ---------- 我方倒下 ----------
async function handleFaint() {
  const B = Battle;
  const m = activeMon();
  const msp = SPECIES[m.sp];
  $('#player-sprite').classList.add('anim-faint');
  Audio2.sfx.lose();
  blog(`${msp.name} 倒下了…`);
  await wait(1000);
  $('#player-sprite').classList.remove('anim-faint');

  const aliveIdx = G.team.findIndex(x => x.hp > 0);
  if (aliveIdx === -1) return battleDefeat();

  // 選擇下一隻
  const btns = G.team.map((x, i) => x.hp > 0
    ? { text: `${SPECIES[x.sp].emoji} ${SPECIES[x.sp].name} (HP ${Math.round(x.hp)})`, value: i }
    : null).filter(Boolean);
  const choice = await showModal({ title: '換誰上場？', body: '選擇下一隻夥伴繼續戰鬥！', buttons: btns });
  B.activeIdx = choice;
  renderBattlers();
  playerTurn();
}

// ---------- 道具選單 ----------
function showItemMenu() {
  const sub = $('#battle-submenu');
  const items = Object.entries(G.player.items).filter(([id, n]) => n > 0 && CONSUMABLES[id] && CONSUMABLES[id].effect.healPct);
  let html = '<div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;padding:8px">';
  if (items.length === 0) html += '<span style="color:#999">沒有可用的藥水，去商店買吧！</span>';
  items.forEach(([id, n]) => {
    const it = CONSUMABLES[id];
    html += `<button class="btn" data-item="${id}">${it.emoji} ${it.name} ×${n}</button>`;
  });
  html += '<button class="btn btn-close" data-item="back">返回</button></div>';
  sub.innerHTML = html;
  sub.classList.remove('hidden');
  $('#action-menu').classList.add('hidden');
  sub.querySelectorAll('button').forEach(b => {
    b.onclick = async () => {
      const id = b.dataset.item;
      if (id === 'back') return playerTurn();
      if (Battle.turnLock) return;
      Battle.turnLock = true;
      const m = activeMon();
      const ms = monsterStats(m);
      const eff = CONSUMABLES[id].effect;
      G.player.items[id]--;
      if (eff.team) {
        // 團隊聖水：全隊恢復
        G.team.forEach(x => {
          const s = monsterStats(x);
          x.hp = Math.min(s.hpMax, x.hp + Math.round(s.hpMax * eff.healPct));
        });
        Audio2.sfx.heal();
        showDamage('player', '全隊恢復', 'heal');
        blog(`使用了 ${CONSUMABLES[id].name}！全隊生命完全恢復！`);
      } else {
        const heal = Math.round(ms.hpMax * eff.healPct);
        m.hp = Math.min(ms.hpMax, m.hp + heal);
        Audio2.sfx.heal();
        showDamage('player', '+' + heal, 'heal');
        blog(`使用了 ${CONSUMABLES[id].name}！恢復 ${heal} HP`);
      }
      renderBattlers();
      await wait(800);
      // 使用道具消耗一個回合 → 敵方回合（交互回合制）
      await enemyTurn();
      if (activeMon().hp <= 0) return handleFaint();
      tickBuff(activeMon());
      playerTurn();
    };
  });
}

// ---------- 換人選單（GDD：戰術輪替消耗一回合） ----------
function showSwitchMenu() {
  const B = Battle;
  const sub = $('#battle-submenu');
  let html = '<div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;padding:8px">';
  G.team.forEach((x, i) => {
    if (i === B.activeIdx || x.hp <= 0) return;
    const sp = SPECIES[x.sp];
    html += `<button class="btn" data-sw="${i}">${sp.emoji} ${sp.name} <span class="badge badge-${sp.elem}">${sp.elem}</span> HP ${Math.round(x.hp)}</button>`;
  });
  html += '<button class="btn btn-close" data-sw="back">返回</button></div>';
  sub.innerHTML = html;
  sub.classList.remove('hidden');
  $('#action-menu').classList.add('hidden');
  if (G.team.filter((x, i) => i !== B.activeIdx && x.hp > 0).length === 0) {
    sub.querySelector('div').insertAdjacentHTML('afterbegin', '<span style="color:#999;width:100%;text-align:center">沒有其他可以上場的夥伴</span>');
  }
  sub.querySelectorAll('button').forEach(b => {
    b.onclick = async () => {
      if (b.dataset.sw === 'back') return playerTurn();
      if (B.turnLock) return;
      B.turnLock = true;
      B.activeIdx = Number(b.dataset.sw);
      const sp = SPECIES[activeMon().sp];
      blog(`換你了，${sp.name}！`);
      renderBattlers();
      await wait(700);
      // 換人消耗一個回合 → 敵方回合（交互回合制）
      await enemyTurn();
      if (activeMon().hp <= 0) return handleFaint();
      playerTurn();
    };
  });
}

// ---------- 逃跑 ----------
async function tryRun() {
  if (Battle.isBoss) return;
  if (Battle.turnLock) return;
  Battle.turnLock = true;
  blog('成功逃走了！');
  await wait(700);
  endBattle({ result: 'run' });
}

// ---------- 勝利結算 ----------
async function battleVictory() {
  const B = Battle;
  const e = B.enemy;
  const esp = SPECIES[e.sp];
  $('#enemy-sprite').classList.add('anim-faint');
  Audio2.sfx.win();
  blog(`打敗了 ${esp.name}！🎉`);
  G.stats.wins++;
  await wait(1100);
  $('#enemy-sprite').classList.remove('anim-faint');

  // --- 經驗值與金幣 ---
  const eliteMult = e.elite ? 1.5 : 1;
  const expCharm = G.player.passives.exp_charm ? 1.5 : 1; // 經驗護符 +50%
  const exp = Math.round(esp.expYield * (0.7 + e.lv * 0.18) * eliteMult * expCharm);
  let gold = Math.round((10 + e.lv * 4) * eliteMult * (G.player.passives.charm ? 1.5 : 1));
  G.player.gold += gold;
  Audio2.sfx.coin();

  // --- 裝備掉落（機率） ---
  let dropMsg = '';
  if (chance(0.08)) {
    const pool = [...Object.keys(WEAPONS).filter(k => WEAPONS[k].tier <= G.player.shopTier),
                  ...Object.keys(ARMORS).filter(k => ARMORS[k].tier <= G.player.shopTier)];
    const dropId = pick(pool);
    if (WEAPONS[dropId]) {
      G.player.invWeapons[dropId] = (G.player.invWeapons[dropId] || 0) + 1;
      dropMsg = `<br>🎁 獲得掉落裝備：${WEAPONS[dropId].emoji} ${WEAPONS[dropId].name}！`;
    } else {
      G.player.invArmors[dropId] = (G.player.invArmors[dropId] || 0) + 1;
      dropMsg = `<br>🎁 獲得掉落裝備：${ARMORS[dropId].emoji} ${ARMORS[dropId].name}！`;
    }
  }

  // --- 分配經驗（出戰全額、待命一半） ---
  const growthEvents = [];
  G.team.forEach((m, i) => {
    if (m.hp <= 0) return;
    const amt = i === B.activeIdx ? exp : Math.round(exp * 0.5);
    const evs = gainExp(m, amt);
    if (evs.length) growthEvents.push({ m, evs });
  });

  const lvUps = growthEvents.flatMap(g => g.evs.filter(ev => ev.type === 'levelup').map(ev => `${SPECIES[g.m.sp].name} 升到 Lv.${ev.lv}！`));
  await showModal({
    title: '🏆 勝利！', emoji: '🎉',
    body: `獲得 <b>${exp} EXP</b> 與 <b>💰${gold} 金幣</b>${dropMsg}` +
      (lvUps.length ? '<br><b style="color:#7b1fa2">⬆ ' + lvUps.join('　') + '</b>' : ''),
  });

  // 升級 / 學技 / 進化事件
  for (const g of growthEvents) await showGrowthEvents(g.m, g.evs);

  // --- 收服判定（GDD：擊敗後機率收服；完美答題 1.5 倍；BOSS 與初始夥伴也是稀有收服目標） ---
  if (esp.catchRate > 0 && !e.elite) {
    await tryCapture(e, esp);
  }

  autoSave(); // GDD：戰鬥結算後自動存檔
  endBattle({ result: 'win' });
}

// ---------- 收服 ----------
async function tryCapture(e, esp) {
  let rate = esp.catchRate;
  let bonusText = `基礎機率 ${Math.round(rate * 100)}%`;
  if (Battle.perfect) { rate *= 1.5; bonusText += ' × 完美答題 1.5'; }

  // 詢問是否使用收服道具（收服球 ×2 / 大師球 ×3）
  const hasBall = (G.player.items.ball || 0) > 0;
  const hasMaster = (G.player.items.master_ball || 0) > 0;
  if (hasBall || hasMaster) {
    const btns = [];
    if (hasMaster) btns.push({ text: `🟣 用大師球！成功率 ×3（剩 ${G.player.items.master_ball}）`, value: 'master', cls: 'btn-gold' });
    if (hasBall) btns.push({ text: `🔮 用收服球！成功率 ×2（剩 ${G.player.items.ball}）`, value: 'ball', cls: hasMaster ? '' : 'btn-gold' });
    btns.push({ text: '直接嘗試', value: null });
    const choice = await showModal({
      title: '要收服牠嗎？', emoji: '🔮',
      body: `${speciesIcon(esp)} ${esp.name} 搖搖晃晃地看著你…<br>${bonusText}`,
      buttons: btns,
    });
    if (choice === 'master') { G.player.items.master_ball--; rate *= 3; }
    else if (choice === 'ball') { G.player.items.ball--; rate *= 2; }
  }
  rate = Math.min(0.9, rate);

  blog('收服判定中…');
  await wait(600);
  if (chance(rate)) {
    Audio2.sfx.capture();
    G.stats.captures++;
    const newMon = createMonster(e.sp, Math.max(1, e.lv - 1));
    dexCaught(e.sp);
    let dest;
    if (G.team.length < 3) { G.team.push(newMon); dest = '加入了你的隊伍！'; }
    else { G.storage.push(newMon); dest = '被送到怪獸倉庫（隊伍已滿 3 隻）。'; }
    await showModal({
      title: '✨ 收服成功！', emoji: speciesIcon(esp),
      body: `<b>${esp.name}</b> ${dest}<br><small>${esp.desc}</small>`,
    });
  } else {
    await showModal({ title: '收服失敗…', emoji: '💨', body: `${esp.name} 化成光芒消失了。下次再努力！` });
  }
}

// ---------- 戰敗（GDD：自動讀取營火存檔點＋錯題複習恢復狀態） ----------
async function battleDefeat() {
  Audio2.sfx.lose();
  await showModal({
    title: '全隊倒下了…', emoji: '😵',
    body: '夥伴們都沒力氣了，將回到最近的營火。<br>出發前，先透過「<b>錯題複習</b>」恢復大家的精神吧！',
    buttons: [{ text: '📖 開始錯題複習', value: true, cls: 'btn-gold' }],
  });

  // 錯題複習：3 題（優先出答錯過的單字），複習完全隊恢復
  blog('📖 錯題複習時間！');
  let okCount = 0;
  for (let i = 0; i < 3; i++) {
    const r = await askQuestion({ difficulty: 'easy', wordLv: Battle.map.wordLv, elite: true, timerSec: 0 });
    if (r.correct) okCount++;
  }
  G.team.forEach(m => { m.hp = monsterStats(m).hpMax; });
  Audio2.sfx.heal();
  await showModal({
    title: '複習完成！', emoji: '💪',
    body: `答對 ${okCount} / 3 題！複習的力量讓夥伴們恢復精神。<br>🔥 回到營火，重新出發！`,
  });
  autoSave();
  endBattle({ result: 'lose' }); // 地圖端會自動載入最近的營火存檔點
}

// ---------- 結束戰鬥 ----------
function endBattle(outcome) {
  const resolve = Battle.resolveEnd;
  if (!resolve) return; // 已結束（防重複呼叫）
  Battle.resolveEnd = null;
  Battle.active = false;
  $('#question-panel').classList.add('hidden');
  $('#action-menu').classList.add('hidden');
  $('#battle-submenu').classList.add('hidden');
  resolve(outcome);
}
