// ============ 遊戲啟動 ============
(function () {
  // ---------- 標題畫面（三個存檔位置） ----------
  function slotLabel(i) {
    const info = slotInfo(i);
    if (!info) return `📄 位置 ${i + 1}（空）`;
    return `💾 位置 ${i + 1}：${info.emoji} ${info.name} Lv.${info.lv}｜${info.mapName}｜💰${info.gold}` +
      (info.time ? `｜🕐 ${info.time}` : '');
  }

  function initTitle() {
    $('#btn-continue').classList.toggle('hidden', !hasAnySave());

    // 繼續冒險：從有存檔的位置中選一個讀取
    $('#btn-continue').onclick = async () => {
      Audio2.sfx.select();
      const btns = [0, 1, 2].filter(i => slotInfo(i)).map(i => ({ text: slotLabel(i), value: i }));
      btns.push({ text: '取消', value: 'cancel', cls: 'btn-close' });
      const pick = await showModal({
        title: '📖 選擇要繼續的冒險', emoji: '',
        body: '要從哪一個存檔繼續呢？', buttons: btns,
      });
      if (pick === 'cancel' || pick === undefined || pick === null) return;
      if (!loadSlot(pick)) return;
      MapView.load(G.world.map, { x: G.world.x, y: G.world.y });
      showScreen('screen-map');
    };

    // 新的冒險：選一個位置開始（占用中的位置需確認覆蓋）
    $('#btn-newgame').onclick = async () => {
      Audio2.sfx.select();
      const btns = [0, 1, 2].map(i => ({
        text: slotLabel(i), value: i, cls: slotInfo(i) ? '' : 'btn-gold',
      }));
      btns.push({ text: '取消', value: 'cancel', cls: 'btn-close' });
      const pick = await showModal({
        title: '✨ 選擇存檔位置', emoji: '',
        body: '新的冒險要記錄在哪個位置？', buttons: btns,
      });
      if (pick === 'cancel' || pick === undefined || pick === null) return;
      if (slotInfo(pick)) {
        const sure = await showModal({
          title: '覆蓋這個存檔？', emoji: '⚠️',
          body: `${slotLabel(pick)}<br>開始新遊戲會覆蓋這個位置的冒險進度喔！`,
          buttons: [
            { text: '沒關係，重新開始', value: true, cls: 'btn-close' },
            { text: '取消', value: false },
          ],
        });
        if (!sure) return;
        deleteSlot(pick);
      }
      newGameInSlot(pick);
      showStarterSelect();
    };
    showScreen('screen-title');
  }

  // ---------- 輸入：鍵盤 ----------
  const KEYMAP = {
    ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0],
    w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0],
    W: [0, -1], S: [0, 1], A: [-1, 0], D: [1, 0],
  };
  const keysDown = new Set();
  document.addEventListener('keydown', e => {
    if (KEYMAP[e.key]) {
      e.preventDefault();
      keysDown.add(e.key);
      if (isOnMap()) MapView.move(...KEYMAP[e.key]);
    }
  });
  document.addEventListener('keyup', e => keysDown.delete(e.key));
  // 長按持續移動
  setInterval(() => {
    if (!isOnMap()) return;
    for (const k of keysDown) {
      if (KEYMAP[k]) { MapView.move(...KEYMAP[k]); break; }
    }
  }, 150);

  function isOnMap() {
    return $('#screen-map').classList.contains('active') &&
      !Battle.active && !MapView.busy &&
      $('#overlay').classList.contains('hidden') &&
      $('#modal-mask').classList.contains('hidden');
  }

  // ---------- 輸入：螢幕方向鍵 ----------
  $$('.dpad-btn').forEach(btn => {
    const dirs = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
    const dir = dirs[btn.dataset.dir];
    let holdTimer = null;
    const start = (e) => {
      e.preventDefault();
      if (isOnMap()) MapView.move(...dir);
      holdTimer = setInterval(() => { if (isOnMap()) MapView.move(...dir); }, 160);
    };
    const stop = () => clearInterval(holdTimer);
    btn.addEventListener('touchstart', start, { passive: false });
    btn.addEventListener('touchend', stop);
    btn.addEventListener('mousedown', start);
    btn.addEventListener('mouseup', stop);
    btn.addEventListener('mouseleave', stop);
  });

  // ---------- HUD 按鈕 ----------
  $('#btn-team').onclick = openTeam;
  $('#btn-bag').onclick = openBag;
  $('#btn-dex').onclick = openDex;
  $('#btn-wordbook').onclick = openWordbook;
  $('#btn-overlay-close').onclick = closeOverlay;

  // ---------- 重生檢查（每 10 秒） ----------
  setInterval(() => { if (isOnMap()) MapView.checkRespawn(); }, 10000);

  // ---------- 離開頁面時自動存檔（GDD） ----------
  window.addEventListener('beforeunload', () => { if (G && G.team.length) saveGame(true); });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && G && G.team.length) saveGame(true);
  });

  // 啟動
  initTitle();
})();
