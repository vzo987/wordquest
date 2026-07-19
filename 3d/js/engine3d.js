// ============ 3D 引擎輔助（Three.js） ============
const E3D = (() => {
  // ---- Emoji → 貼圖（快取） ----
  const texCache = {};
  function emojiTexture(emoji, size = 256) {
    const key = emoji + '@' + size;
    if (texCache[key]) return texCache[key];
    const cv = document.createElement('canvas');
    cv.width = cv.height = size;
    const ctx = cv.getContext('2d');
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = Math.round(size * 0.8) + 'px "Segoe UI Emoji", "Noto Color Emoji", serif';
    ctx.fillText(emoji, size / 2, size / 2 + size * 0.04);
    const tex = new THREE.CanvasTexture(cv);
    tex.anisotropy = 4;
    texCache[key] = tex;
    return tex;
  }

  // Emoji 看板精靈（永遠面向鏡頭）
  function makeEmojiSprite(emoji, scale = 1) {
    const mat = new THREE.SpriteMaterial({ map: emojiTexture(emoji), transparent: true });
    const sp = new THREE.Sprite(mat);
    sp.scale.set(scale, scale, 1);
    sp.userData.emoji = emoji;
    return sp;
  }

  function setSpriteEmoji(sprite, emoji) {
    if (sprite.userData.emoji === emoji) return;
    sprite.material.map = emojiTexture(emoji);
    sprite.material.needsUpdate = true;
    sprite.userData.emoji = emoji;
  }

  // 假陰影（半透明黑圓）
  let shadowTex = null;
  function makeShadow(scale = 1) {
    if (!shadowTex) {
      const cv = document.createElement('canvas');
      cv.width = cv.height = 128;
      const ctx = cv.getContext('2d');
      const g = ctx.createRadialGradient(64, 64, 8, 64, 64, 60);
      g.addColorStop(0, 'rgba(0,0,0,0.4)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 128, 128);
      shadowTex = new THREE.CanvasTexture(cv);
    }
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(scale, scale),
      new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false })
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = 0.02;
    return mesh;
  }

  // ---- 簡易補間動畫 ----
  const tweens = [];
  // tween(500, t => {...})：t 由 0 到 1；回傳 Promise
  function tween(dur, fn) {
    return new Promise(res => {
      tweens.push({ start: performance.now(), dur, fn, res });
    });
  }
  function updateTweens(now) {
    for (let i = tweens.length - 1; i >= 0; i--) {
      const tw = tweens[i];
      const t = Math.min(1, (now - tw.start) / tw.dur);
      try { tw.fn(t); } catch (e) { /* 物件可能已移除 */ }
      if (t >= 1) { tweens.splice(i, 1); tw.res(); }
    }
  }

  // ---- 主渲染迴圈：各模組註冊 {tick(time)} ----
  const updaters = [];
  function register(u) { updaters.push(u); }
  function loop(now) {
    requestAnimationFrame(loop);
    updateTweens(now);
    updaters.forEach(u => { try { u.tick(now); } catch (e) { console.error(e); } });
  }
  requestAnimationFrame(loop);

  // 建立渲染器（自動符合容器大小）
  function makeRenderer(canvas) {
    const r = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    r.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    return r;
  }
  function fitRenderer(renderer, camera) {
    const cv = renderer.domElement;
    const w = cv.clientWidth, h = cv.clientHeight;
    if (!w || !h) return false;
    if (cv.width !== Math.round(w * renderer.getPixelRatio()) || cv.height !== Math.round(h * renderer.getPixelRatio())) {
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    return true;
  }

  const lerp = (a, b, t) => a + (b - a) * t;

  return { emojiTexture, makeEmojiSprite, setSpriteEmoji, makeShadow, tween, register, makeRenderer, fitRenderer, lerp };
})();
