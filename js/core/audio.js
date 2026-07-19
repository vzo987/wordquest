// ============ 音效與發音 ============
const Audio2 = (() => {
  let ctx = null;
  function ac() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  // 簡單合成音效
  function tone(freq, dur = 0.15, type = 'square', vol = 0.15, when = 0) {
    try {
      const c = ac();
      const o = c.createOscillator();
      const g = c.createGain();
      o.type = type; o.frequency.value = freq;
      g.gain.setValueAtTime(vol, c.currentTime + when);
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + when + dur);
      o.connect(g); g.connect(c.destination);
      o.start(c.currentTime + when);
      o.stop(c.currentTime + when + dur + 0.05);
    } catch (e) { /* 無法播放時靜默 */ }
  }

  const sfx = {
    correct() { tone(660, .12, 'sine', .2); tone(880, .18, 'sine', .2, .1); },
    wrong() { tone(220, .25, 'sawtooth', .18); tone(160, .3, 'sawtooth', .15, .12); },
    hit() { tone(120, .15, 'square', .25); },
    crit() { tone(150, .1, 'square', .3); tone(100, .2, 'square', .3, .08); },
    heal() { tone(523, .12, 'sine', .18); tone(659, .12, 'sine', .18, .1); tone(784, .2, 'sine', .18, .2); },
    win() { [523, 659, 784, 1047].forEach((f, i) => tone(f, .18, 'sine', .2, i * .13)); },
    lose() { [400, 350, 300, 200].forEach((f, i) => tone(f, .22, 'triangle', .18, i * .18)); },
    levelup() { [523, 587, 659, 784, 1047].forEach((f, i) => tone(f, .15, 'square', .12, i * .1)); },
    capture() { tone(440, .1, 'sine', .2); tone(554, .1, 'sine', .2, .12); tone(659, .25, 'sine', .22, .24); },
    coin() { tone(988, .08, 'sine', .18); tone(1319, .15, 'sine', .18, .07); },
    step() { tone(90, .04, 'triangle', .05); },
    select() { tone(880, .06, 'sine', .1); },
    evolve() { [392, 523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, .25, 'sine', .15, i * .16)); },
  };

  // 英文發音（Web Speech API）
  let voice = null;
  function findVoice() {
    const vs = speechSynthesis.getVoices();
    voice = vs.find(v => v.lang === 'en-US') || vs.find(v => v.lang.startsWith('en')) || null;
  }
  if ('speechSynthesis' in window) {
    findVoice();
    speechSynthesis.onvoiceschanged = findVoice;
  }

  function speak(text, rate = 0.85) {
    if (!('speechSynthesis' in window)) return;
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'en-US';
      if (voice) u.voice = voice;
      u.rate = rate;
      speechSynthesis.speak(u);
    } catch (e) { /* 靜默 */ }
  }

  return { sfx, speak };
})();
