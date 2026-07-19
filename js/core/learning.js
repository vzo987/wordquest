// ============ 學習系統：加權出題（間隔重複）與答題介面 ============

// 依學習歷程加權選字：答錯越多權重越高（GDD 間隔重複機制）
function pickQuestionWord(wordLv, elite = false) {
  let pool;
  if (elite) {
    pool = wrongWordPool(wordLv);           // 精英怪帶著錯題出現
    if (pool.length === 0) pool = wordsUpToLv(wordLv);
  } else {
    pool = wordsUpToLv(wordLv);
  }
  // 加權隨機
  const weights = pool.map(w => {
    const s = G.words[w.en];
    let wt = 1;
    if (s) {
      wt += s.ng * 2.5;                      // 答錯過 → 大幅提高出現率
      if (s.seen > 0 && s.streak === 0) wt += 1.5;
      wt -= Math.min(s.streak, 3) * 0.55;    // 連續答對 → 降低出現率
    }
    return Math.max(0.15, wt);
  });
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < pool.length; i++) {
    r -= weights[i];
    if (r <= 0) return pool[i];
  }
  return pool[pool.length - 1];
}

// 取干擾選項（同等級單字優先）
function pickDistractors(word, n) {
  const cands = shuffle(WORDS.filter(w => w.en !== word.en));
  cands.sort((a, b) => Math.abs(a.lv - word.lv) - Math.abs(b.lv - word.lv));
  return shuffle(cands.slice(0, n * 4)).slice(0, n);
}

// ============ 答題主流程 ============
// difficulty: 'easy' 選擇題 / 'normal' 填空 / 'hard' 拼字
// 回傳 Promise<{correct, word, timeRatio, noMistake}>
function askQuestion({ difficulty, wordLv, elite = false, timerSec = 0 }) {
  const word = pickQuestionWord(wordLv, elite);
  const panel = $('#question-panel');
  const body = $('#q-body');
  const prompt = $('#q-prompt');
  panel.classList.remove('hidden');
  $('#action-menu').classList.add('hidden');
  $('#battle-submenu').classList.add('hidden');

  return new Promise(resolve => {
    let done = false;
    let noMistake = true;
    const startTime = Date.now();
    let timerId = null;

    // ---- 計時條 ----
    const twrap = $('#q-timerbar-wrap');
    if (timerSec > 0) {
      twrap.classList.remove('hidden');
      const bar = $('#q-timerbar');
      bar.style.width = '100%';
      const t0 = Date.now();
      timerId = setInterval(() => {
        const remain = 1 - (Date.now() - t0) / (timerSec * 1000);
        bar.style.width = Math.max(0, remain * 100) + '%';
        if (remain <= 0) finish(false, true); // 逾時 = 答錯
      }, 100);
    } else {
      twrap.classList.add('hidden');
    }

    function finish(correct, timeout = false) {
      if (done) return;
      done = true;
      clearInterval(timerId);
      recordAnswer(word.en, correct);
      if (correct) Audio2.sfx.correct(); else Audio2.sfx.wrong();
      // 答錯：顯示正確答案並發音（GDD：加深印象）
      const fbDelay = correct ? 750 : 1900;
      if (!correct) {
        const fb = document.createElement('div');
        fb.style.cssText = 'text-align:center;margin-top:10px;font-size:19px;font-weight:800;color:#d32f2f;';
        fb.innerHTML = (timeout ? '⏰ 時間到！' : '') +
          `正確答案：<span style="color:#1565c0">${esc(word.en)}</span>（${esc(word.zh)}）`;
        body.appendChild(fb);
        Audio2.speak(word.en);
      } else {
        Audio2.speak(word.en);
      }
      const timeRatio = timerSec > 0 ? clamp((Date.now() - startTime) / (timerSec * 1000), 0, 1)
                                     : clamp((Date.now() - startTime) / 12000, 0, 1);
      setTimeout(() => {
        panel.classList.add('hidden');
        resolve({ correct, word, timeRatio, noMistake });
      }, fbDelay);
    }

    // ---- 依難度產生題目 ----
    if (difficulty === 'easy') {
      // 選擇題：中英互譯
      const dir = chance(0.5) ? 'en2zh' : 'zh2en';
      const distractors = pickDistractors(word, 3);
      const options = shuffle([word, ...distractors]);
      if (dir === 'en2zh') {
        prompt.innerHTML = `<span class="q-word">${esc(word.en)}</span>` +
          `<span class="q-audio" title="播放發音">🔊</span><br><small>選出正確的中文意思</small>`;
        Audio2.speak(word.en);
      } else {
        prompt.innerHTML = `<span class="q-word">${esc(word.zh)}</span><br><small>選出正確的英文單字</small>`;
      }
      prompt.querySelector('.q-audio')?.addEventListener('click', () => Audio2.speak(word.en));

      body.innerHTML = '<div class="q-options"></div>';
      const wrap = body.querySelector('.q-options');
      const btns = [];
      options.forEach(opt => {
        const b = document.createElement('button');
        b.className = 'btn-opt';
        b.textContent = dir === 'en2zh' ? opt.zh : opt.en;
        b._word = opt;
        b.onclick = () => {
          if (done) return;
          const isCorrect = opt.en === word.en;
          btns.forEach(x => {
            if (x._word.en === word.en) x.classList.add('opt-correct');
            else if (x === b) x.classList.add('opt-wrong');
            x.disabled = true;
          });
          finish(isCorrect);
        };
        wrap.appendChild(b);
        btns.push(b);
      });
      // 智慧眼鏡：自動消除一個錯誤選項
      if (G.player.passives.glasses) {
        const wrongBtns = btns.filter(b => b._word.en !== word.en);
        pick(wrongBtns).classList.add('opt-removed');
      }
    } else {
      // 填空（normal）或完整拼字（hard）
      const letters = word.en.toLowerCase().split('');
      let hiddenIdx;
      if (difficulty === 'normal') {
        const nHide = clamp(Math.ceil(letters.length * 0.45), 1, 4);
        hiddenIdx = shuffle(letters.map((_, i) => i)).slice(0, nHide).sort((a, b) => a - b);
      } else {
        hiddenIdx = letters.map((_, i) => i); // 全部隱藏
      }
      const hiddenSet = new Set(hiddenIdx);

      prompt.innerHTML = `<span class="q-word">${esc(word.zh)}</span>` +
        `<span class="q-audio" title="播放發音">🔊</span><br>` +
        `<small>${difficulty === 'normal' ? '點字母氣泡，填入缺少的字母' : '聽發音，拼出完整單字！'}</small>`;
      prompt.querySelector('.q-audio').addEventListener('click', () => Audio2.speak(word.en));
      Audio2.speak(word.en);

      // 字母格
      body.innerHTML = '<div class="spell-slots"></div><div class="letter-bank"></div>' +
        '<div class="spell-ctrl"><button class="btn btn-back">⌫ 退回</button></div>';
      const slotWrap = body.querySelector('.spell-slots');
      const bankWrap = body.querySelector('.letter-bank');
      const slots = [];
      letters.forEach((ch, i) => {
        const s = document.createElement('div');
        s.className = 'spell-slot' + (hiddenSet.has(i) ? '' : ' fixed');
        s.textContent = hiddenSet.has(i) ? '' : ch;
        slotWrap.appendChild(s);
        slots.push({ el: s, ch, hidden: hiddenSet.has(i), filledBy: null });
      });

      // 字母氣泡：缺少的字母 + 干擾字母
      const needed = hiddenIdx.map(i => letters[i]);
      const distract = [];
      const alphabet = 'abcdefghijklmnopqrstuvwxyz';
      const nDistract = difficulty === 'normal' ? 3 : Math.min(4, Math.max(2, 8 - needed.length));
      while (distract.length < nDistract) {
        const c = alphabet[rand(26)];
        if (!needed.includes(c) || chance(0.3)) distract.push(c);
      }
      const bank = shuffle([...needed, ...distract]);
      const bankBtns = [];
      bank.forEach(ch => {
        const b = document.createElement('button');
        b.className = 'btn-letter';
        b.textContent = ch.toUpperCase();
        b._ch = ch;
        b.onclick = () => {
          if (done || b.disabled) return;
          const slot = slots.find(s => s.hidden && !s.filledBy);
          if (!slot) return;
          Audio2.sfx.select();
          slot.el.textContent = ch;
          slot.filledBy = b;
          b.disabled = true;
          // 全部填滿 → 判定
          if (!slots.some(s => s.hidden && !s.filledBy)) {
            const spelled = slots.map(s => s.hidden ? s.filledBy._ch : s.ch).join('');
            const isCorrect = spelled === word.en.toLowerCase();
            slots.forEach(s => {
              if (s.hidden) s.el.style.color = isCorrect ? '#2e7d32' : '#d32f2f';
            });
            finish(isCorrect);
          }
        };
        bankWrap.appendChild(b);
        bankBtns.push(b);
      });

      // 退回鍵
      body.querySelector('.btn-back').onclick = () => {
        if (done) return;
        const filled = slots.filter(s => s.hidden && s.filledBy);
        if (filled.length === 0) return;
        noMistake = false; // 用過退回 → 不算完美拼字
        const last = filled[filled.length - 1];
        last.filledBy.disabled = false;
        last.filledBy = null;
        last.el.textContent = '';
      };
    }
  });
}

// 依地圖與敵人決定題目難度（GDD 動態難度）
function pickDifficulty(map, isBoss, forceHard) {
  if (forceHard) return 'hard';         // 終極大招：風險與報酬
  if (map.id === 'map1') return isBoss ? 'normal' : 'easy';
  if (map.id === 'map2') return isBoss ? 'hard' : (chance(0.55) ? 'normal' : 'easy');
  if (map.id === 'map3') return isBoss ? 'hard' : (chance(0.6) ? 'normal' : 'hard');
  return isBoss ? 'hard' : (chance(0.5) ? 'normal' : 'hard');
}

// 題目倒數秒數（新手區不倒數，之後逐步加壓）
function questionTimer(map, difficulty) {
  if (map.id === 'map1') return 0;
  const base = { easy: 15, normal: 25, hard: 35 }[difficulty];
  return base;
}
