// ============ 怪獸養成系統 ============

// 計算怪獸實際數值（基礎 + 成長 + 裝備 + 五行相生加成）
function monsterStats(m) {
  const sp = SPECIES[m.sp];
  const lv = m.lv;
  let hpMax = Math.round(sp.base.hp + sp.grow.hp * (lv - 1));
  let atk = Math.round(sp.base.atk + sp.grow.atk * (lv - 1));
  let def = Math.round(sp.base.def + sp.grow.def * (lv - 1));
  let weaponAtk = 0, armorDef = 0;

  if (m.weapon && WEAPONS[m.weapon]) weaponAtk = WEAPONS[m.weapon].atk;
  if (m.armor && ARMORS[m.armor]) {
    const a = ARMORS[m.armor];
    armorDef = a.def;
    hpMax += a.hp;
    // 相生加成：防具屬性「生」怪獸屬性 → 額外 +20% 防禦（GDD 五行相生）
    if (a.elem && ELEM_SHENG[a.elem] === sp.elem) {
      armorDef = Math.round(armorDef * 1.2) + Math.round(def * 0.2);
    }
  }
  return { hpMax, atk, def, weaponAtk, armorDef, totalAtk: atk + weaponAtk, totalDef: def + armorDef };
}

// 升級所需經驗
function expToNext(lv) { return Math.round(25 * Math.pow(lv, 1.4)); }

// 給予經驗值 → 處理升級、學技能、進化（回傳事件清單供 UI 顯示）
function gainExp(m, amount) {
  const events = [];
  m.exp += amount;
  while (m.exp >= expToNext(m.lv)) {
    m.exp -= expToNext(m.lv);
    m.lv++;
    const before = monsterStats(m);
    events.push({ type: 'levelup', lv: m.lv });

    // 學習新技能
    const sp = SPECIES[m.sp];
    const newSkills = (sp.learnset && sp.learnset[m.lv]) || [];
    newSkills.forEach(id => {
      if (!m.learned.includes(id)) {
        m.learned.push(id);
        events.push({ type: 'learn', skill: id });
      }
    });

    // 進化判定
    if (sp.evolveLv && m.lv >= sp.evolveLv && sp.evolveTo) {
      const from = sp;
      m.sp = sp.evolveTo;
      dexCaught(m.sp);
      events.push({ type: 'evolve', from: from.name, to: SPECIES[m.sp].name });
    }

    // 升級全滿血（兒童友善回饋）
    const after = monsterStats(m);
    m.hp = after.hpMax;
    void before;
  }
  return events;
}

// 裝備技能（保持最多 4 格）
function equipSkill(m, skillId, slot = -1) {
  if (!m.learned.includes(skillId)) return false;
  if (m.skills.includes(skillId)) return false;
  if (slot >= 0 && slot < 4) m.skills[slot] = skillId;
  else if (m.skills.length < 4) m.skills.push(skillId);
  else return false;
  return true;
}

// 顯示升級 / 學技能 / 進化的事件彈窗（依序）
async function showGrowthEvents(m, events) {
  for (const ev of events) {
    if (ev.type === 'levelup') {
      Audio2.sfx.levelup();
      // 升級訊息合併在戰鬥結算顯示，這裡略過單獨彈窗
    } else if (ev.type === 'learn') {
      const sk = SKILLS[ev.skill];
      Audio2.sfx.levelup();
      if (m.skills.length < 4) {
        if (!m.skills.includes(ev.skill)) m.skills.push(ev.skill);
        await showModal({
          title: '領悟新技能！', emoji: sk.fx,
          body: `<b>${SPECIES[m.sp].name}</b> 學會了 <b class="elem-${sk.elem || '金'}">${sk.name}</b>！<br><small>${sk.desc}</small>`,
        });
      } else {
        // 技能欄已滿 → 選擇要遺忘的技能
        const btns = m.skills.map((id, i) => ({ text: `忘掉 ${SKILLS[id].name}`, value: i }));
        btns.push({ text: `放棄學習 ${sk.name}`, value: -1, cls: 'btn-close' });
        const choice = await showModal({
          title: '想學新技能！', emoji: sk.fx,
          body: `<b>${SPECIES[m.sp].name}</b> 想學 <b>${sk.name}</b>（${sk.desc}），<br>但技能欄已滿（最多 4 個）。要忘掉哪一招？`,
          buttons: btns,
        });
        if (choice >= 0) m.skills[choice] = ev.skill;
      }
    } else if (ev.type === 'evolve') {
      Audio2.sfx.evolve();
      const spNew = SPECIES[m.sp];
      await showModal({
        title: '✨ 進化！✨',
        emoji: `<span class="evolving">${spNew.emoji}</span>`,
        body: `哇！<b>${ev.from}</b> 進化成 <b class="elem-${spNew.elem}">${ev.to}</b> 了！<br>全部能力大幅提升！<br><small>${spNew.desc}</small>`,
      });
    }
  }
}

// 建立指定等級的野生怪獸（戰鬥用敵人）
function createWildMonster(speciesId, lv, elite = false) {
  const m = createMonster(speciesId, lv);
  m.elite = elite;
  if (elite) {
    // 精英怪（錯題怪）：能力強化、經驗加倍
    m.eliteMult = 1.3;
    m.hp = Math.round(monsterStats(m).hpMax * 1.3);
  }
  return m;
}

// 敵方戰鬥數值（精英怪加成）
function enemyStats(m) {
  const s = monsterStats(m);
  if (m.elite) {
    return { ...s, hpMax: Math.round(s.hpMax * 1.3), totalAtk: Math.round(s.totalAtk * 1.25), totalDef: Math.round(s.totalDef * 1.15) };
  }
  return s;
}
