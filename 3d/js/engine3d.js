// ============ 3D 引擎輔助（Three.js） ============
const E3D = (() => {
  // ---- Emoji → 貼圖（快取；stage 2/3 加銀/金光環與皇冠，呈現進化繼承） ----
  const texCache = {};
  function emojiTexture(emoji, size = 256, stage = 1) {
    const key = emoji + '@' + size + '@' + stage;
    if (texCache[key]) return texCache[key];
    const cv = document.createElement('canvas');
    cv.width = cv.height = size;
    const ctx = cv.getContext('2d');
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (stage > 1) {
      ctx.shadowColor = stage === 3 ? '#ffb300' : '#90caf9';
      ctx.shadowBlur = size * 0.09;
    }
    ctx.font = Math.round(size * 0.76) + 'px "Segoe UI Emoji", "Noto Color Emoji", serif';
    ctx.fillText(emoji, size / 2, size / 2 + size * 0.05);
    if (stage === 3) {
      ctx.shadowBlur = 0;
      ctx.font = Math.round(size * 0.3) + 'px "Segoe UI Emoji", "Noto Color Emoji", serif';
      ctx.fillText('👑', size * 0.72, size * 0.17);
    }
    const tex = new THREE.CanvasTexture(cv);
    tex.anisotropy = 4;
    texCache[key] = tex;
    return tex;
  }

  // 圖片怪獸貼圖（快取）：載入前先畫替代 emoji，圖到後重繪
  function speciesTexture(spData, size = 256) {
    const stage = spData.stage || 1;
    if (!spData.img) return emojiTexture(spData.emoji, size, stage);
    const key = spData.img + '@' + size + '@' + stage;
    if (texCache[key]) return texCache[key];
    const cv = document.createElement('canvas');
    cv.width = cv.height = size;
    const ctx = cv.getContext('2d');
    const tex = new THREE.CanvasTexture(cv);
    tex.anisotropy = 4;
    const paint = (im) => {
      ctx.clearRect(0, 0, size, size);
      const fx = stage > 1 && !spData.baked; // 烘焙圖效果已在圖檔內
      if (fx) {
        ctx.shadowColor = stage === 3 ? '#ffb300' : '#90caf9';
        ctx.shadowBlur = size * 0.09;
      }
      if (im) {
        const box = size * (spData.baked ? 0.96 : 0.84);
        const k = Math.min(box / im.width, box / im.height);
        const w = im.width * k, h = im.height * k;
        ctx.drawImage(im, (size - w) / 2, (size - h) / 2 + size * 0.02, w, h);
      } else {
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = Math.round(size * 0.76) + 'px "Segoe UI Emoji", serif';
        ctx.fillText(spData.emoji || '❓', size / 2, size / 2 + size * 0.05);
      }
      ctx.shadowBlur = 0;
      if (stage === 3 && !spData.baked) {
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = Math.round(size * 0.3) + 'px "Segoe UI Emoji", serif';
        ctx.fillText('👑', size * 0.72, size * 0.17);
      }
      tex.needsUpdate = true;
    };
    const im = new Image();
    im.onload = () => paint(im);
    im.src = ASSET_PREFIX + spData.img;
    paint(null);
    texCache[key] = tex;
    return tex;
  }

  // 怪獸看板精靈（永遠面向鏡頭；spData = SPECIES 資料物件）
  function makeSpeciesSprite(spData, scale = 1) {
    const mat = new THREE.SpriteMaterial({ map: speciesTexture(spData), transparent: true });
    const sp = new THREE.Sprite(mat);
    sp.scale.set(scale, scale, 1);
    sp.userData.spKey = (spData.img || spData.emoji) + '@' + (spData.stage || 1);
    return sp;
  }

  function setSpriteSpecies(sprite, spData) {
    const key = (spData.img || spData.emoji) + '@' + (spData.stage || 1);
    if (sprite.userData.spKey === key) return;
    sprite.material.map = speciesTexture(spData);
    sprite.material.needsUpdate = true;
    sprite.userData.spKey = key;
  }

  // Emoji 看板精靈（永遠面向鏡頭）
  function makeEmojiSprite(emoji, scale = 1, stage = 1) {
    const mat = new THREE.SpriteMaterial({ map: emojiTexture(emoji, 256, stage), transparent: true });
    const sp = new THREE.Sprite(mat);
    sp.scale.set(scale, scale, 1);
    sp.userData.emoji = emoji;
    sp.userData.stage = stage;
    return sp;
  }

  function setSpriteEmoji(sprite, emoji, stage = 1) {
    if (sprite.userData.emoji === emoji && sprite.userData.stage === stage) return;
    sprite.material.map = emojiTexture(emoji, 256, stage);
    sprite.material.needsUpdate = true;
    sprite.userData.emoji = emoji;
    sprite.userData.stage = stage;
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

  return { emojiTexture, makeEmojiSprite, setSpriteEmoji, speciesTexture, makeSpeciesSprite, setSpriteSpecies, makeShadow, tween, register, makeRenderer, fitRenderer, lerp };
})();
