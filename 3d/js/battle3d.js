// ============ 3D 戰鬥舞台 ============
// 共用 ../js/systems/battle.js 的完整戰鬥邏輯；此層負責把戰況鏡像成 3D 畫面：
// DOM 裡隱藏的 #player-sprite / #enemy-sprite 動畫 class 由 MutationObserver 轉譯為 3D 補間動畫。
const Battle3D = (() => {
  const PLAYER_POS = { x: -2.3, y: 0, z: 1.6 };   // 左下（GDD 斜對角視角）
  const ENEMY_POS = { x: 2.3, y: 0, z: -2.0 };    // 右上
  const GROUND_COLOR = { '木': '#9ccc65', '水': '#4fc3f7', '火': '#e57373', '金': '#b0bec5', '土': '#bcaaa4' };

  let renderer, scene, camera, ground;
  let playerGrp, enemyGrp, eliteStar;

  function makeBattler(scale) {
    const grp = new THREE.Group();
    const sprite = E3D.makeEmojiSprite('❓', scale);
    sprite.position.y = scale * 0.5;
    grp.add(sprite, E3D.makeShadow(scale * 0.85));
    grp.userData.sprite = sprite;
    grp.userData.scale = scale;
    return grp;
  }

  function init() {
    const canvas = $('#battle-canvas');
    renderer = E3D.makeRenderer(canvas);
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(46, 1.6, 0.1, 100);
    camera.position.set(0, 2.4, 6.2);   // 壓低鏡頭，貼近戰場更有臨場感
    camera.lookAt(0, 1.05, -0.5);

    scene.add(new THREE.AmbientLight(0xffffff, 0.85));
    const sun = new THREE.DirectionalLight(0xffffff, 0.65);
    sun.position.set(4, 8, 5);
    scene.add(sun);

    // 戰鬥地面（圓形舞台）
    ground = new THREE.Mesh(
      new THREE.CircleGeometry(8, 40),
      new THREE.MeshLambertMaterial({ color: 0x9ccc65 })
    );
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    playerGrp = makeBattler(2.4);
    playerGrp.position.set(PLAYER_POS.x, 0, PLAYER_POS.z);
    scene.add(playerGrp);

    enemyGrp = makeBattler(2.0);
    enemyGrp.position.set(ENEMY_POS.x, 0, ENEMY_POS.z);
    scene.add(enemyGrp);

    eliteStar = E3D.makeEmojiSprite('⭐', 0.7);
    eliteStar.position.set(0.8, 2.3, 0);
    eliteStar.visible = false;
    enemyGrp.add(eliteStar);

    observeAnimations();
    E3D.register({ tick });
  }

  // 重置戰鬥者外觀（新戰鬥 / 換人時）
  function resetBattler(grp, base) {
    grp.position.set(base.x, 0, base.z);
    const s = grp.userData.sprite;
    s.material.opacity = 1;
    s.position.y = grp.userData.scale * 0.5;
  }

  // ---------- DOM 動畫 class → 3D 補間 ----------
  function observeAnimations() {
    const map = [
      { el: $('#player-sprite'), grp: () => playerGrp, base: PLAYER_POS, toward: ENEMY_POS, lungeCls: 'anim-lunge' },
      { el: $('#enemy-sprite'), grp: () => enemyGrp, base: ENEMY_POS, toward: PLAYER_POS, lungeCls: 'anim-lunge-enemy' },
    ];
    map.forEach(({ el, grp, base, toward, lungeCls }) => {
      new MutationObserver(() => {
        const cls = el.classList;
        const g = grp();
        if (cls.contains(lungeCls)) {
          // 衝向對方再退回
          const dx = (toward.x - base.x) * 0.45, dz = (toward.z - base.z) * 0.45;
          E3D.tween(450, t => {
            const k = t < 0.4 ? t / 0.4 : 1 - (t - 0.4) / 0.6;
            g.position.x = base.x + dx * k;
            g.position.z = base.z + dz * k;
          });
        }
        if (cls.contains('anim-hit')) {
          E3D.tween(350, t => {
            g.position.x = base.x + Math.sin(t * Math.PI * 4) * 0.22 * (1 - t);
          });
        }
        if (cls.contains('anim-faint')) {
          const s = g.userData.sprite;
          E3D.tween(700, t => {
            s.position.y = g.userData.scale * 0.5 - t * 1.1;
            s.material.opacity = 1 - t;
            s.material.rotation = t * 0.6;
          });
        }
      }).observe(el, { attributes: true, attributeFilter: ['class'] });
    });
  }

  // ---------- 每幀同步 ----------
  function tick(now) {
    if (!$('#screen-battle').classList.contains('active')) return;
    if (!E3D.fitRenderer(renderer, camera)) return;
    const t = now / 1000;

    if (Battle.active && Battle.enemy) {
      // 敵方外觀
      const esp = SPECIES[Battle.enemy.sp];
      const es = enemyGrp.userData.sprite;
      if (es.userData.emoji !== esp.emoji) {
        E3D.setSpriteEmoji(es, esp.emoji);
        es.material.rotation = 0;
        resetBattler(enemyGrp, ENEMY_POS);
      }
      eliteStar.visible = !!Battle.enemy.elite;
      // BOSS 放大
      const targetScale = Battle.isBoss ? 2.8 : 2.0;
      es.scale.x = E3D.lerp(es.scale.x, targetScale, 0.1);
      es.scale.y = E3D.lerp(es.scale.y, targetScale, 0.1);

      // 我方外觀
      const m = G.team[Battle.activeIdx];
      if (m) {
        const msp = SPECIES[m.sp];
        const ps = playerGrp.userData.sprite;
        if (ps.userData.emoji !== msp.emoji) {
          E3D.setSpriteEmoji(ps, msp.emoji);
          ps.material.rotation = 0;
          resetBattler(playerGrp, PLAYER_POS);
        }
      }

      // 地面顏色依地圖屬性
      const col = GROUND_COLOR[(Battle.map && Battle.map.elem) || '木'];
      ground.material.color.set(col);

      // 待機浮動（未倒下時）
      const ps = playerGrp.userData.sprite;
      if (ps.material.opacity > 0.9) ps.position.y = playerGrp.userData.scale * 0.5 + Math.sin(t * 2.6) * 0.08;
      if (es.material.opacity > 0.9) es.position.y = enemyGrp.userData.scale * 0.5 + Math.sin(t * 2.2 + 1) * 0.08;
    }

    renderer.render(scene, camera);
  }

  init();
  // 對外暴露（除錯用）
  return {
    tickOnce: t => tick(t),
    get renderer() { return renderer; },
  };
})();
