// ============ 主角圖像：戴帽子的小冒險者（程式繪製，2D/3D 共用） ============
const Avatar = (() => {
  let cached = null;

  // 色票
  const C = {
    skin: '#ffd9b0', skinShade: '#f2bd8d', blush: '#ffab91',
    hair: '#7b4b2a',
    hat: '#b07d4f', hatDark: '#8d5e3a', hatBand: '#5d4037',
    tunic: '#66bb6a', tunicDark: '#43a047',
    belt: '#5d4037', buckle: '#ffd54f',
    pants: '#8d6e63', boots: '#4e342e', bootsHi: '#6d4c41',
    strap: '#4e342e',
    outline: 'rgba(60,40,30,.55)',
  };

  function rr(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
  }

  function draw() {
    const W = 256, H = 300;
    const cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    const ctx = cv.getContext('2d');
    const cx = W / 2;
    ctx.lineWidth = 5;
    ctx.strokeStyle = C.outline;
    ctx.lineJoin = 'round';

    // ---- 靴子 ----
    ctx.fillStyle = C.boots;
    rr(ctx, cx - 40, 246, 32, 34, [8, 8, 10, 14]); ctx.fill(); ctx.stroke();
    rr(ctx, cx + 8, 246, 32, 34, [8, 8, 14, 10]); ctx.fill(); ctx.stroke();
    ctx.fillStyle = C.bootsHi; // 靴口
    rr(ctx, cx - 40, 242, 32, 10, 5); ctx.fill();
    rr(ctx, cx + 8, 242, 32, 10, 5); ctx.fill();

    // ---- 褲子（短褲） ----
    ctx.fillStyle = C.pants;
    rr(ctx, cx - 38, 212, 32, 34, 9); ctx.fill(); ctx.stroke();
    rr(ctx, cx + 6, 212, 32, 34, 9); ctx.fill(); ctx.stroke();

    // ---- 手臂（自然下垂） ----
    ctx.fillStyle = C.tunicDark;
    rr(ctx, cx - 66, 158, 22, 52, 11); ctx.fill(); ctx.stroke();
    rr(ctx, cx + 44, 158, 22, 52, 11); ctx.fill(); ctx.stroke();
    // 手
    ctx.fillStyle = C.skin;
    ctx.beginPath(); ctx.arc(cx - 55, 214, 11, 0, 7); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx + 55, 214, 11, 0, 7); ctx.fill(); ctx.stroke();

    // ---- 身體（綠色冒險上衣） ----
    ctx.fillStyle = C.tunic;
    rr(ctx, cx - 48, 148, 96, 74, [22, 22, 16, 16]); ctx.fill(); ctx.stroke();
    // 衣襬陰影
    ctx.fillStyle = C.tunicDark;
    rr(ctx, cx - 48, 200, 96, 22, [4, 4, 16, 16]); ctx.fill();
    // 背包肩帶
    ctx.strokeStyle = C.strap; ctx.lineWidth = 9;
    ctx.beginPath(); ctx.moveTo(cx - 26, 150); ctx.lineTo(cx - 18, 200); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + 26, 150); ctx.lineTo(cx + 18, 200); ctx.stroke();
    ctx.lineWidth = 5; ctx.strokeStyle = C.outline;
    // 腰帶與金釦
    ctx.fillStyle = C.belt;
    rr(ctx, cx - 48, 196, 96, 14, 4); ctx.fill();
    ctx.fillStyle = C.buckle;
    rr(ctx, cx - 9, 194, 18, 18, 5); ctx.fill(); ctx.stroke();

    // ---- 頭（大頭 Q 版） ----
    ctx.fillStyle = C.skin;
    ctx.beginPath(); ctx.arc(cx, 104, 54, 0, 7); ctx.fill(); ctx.stroke();
    // 瀏海
    ctx.fillStyle = C.hair;
    ctx.beginPath();
    ctx.arc(cx, 96, 54, Math.PI * 1.05, Math.PI * 1.95);
    ctx.quadraticCurveTo(cx + 30, 84, cx + 12, 78);
    ctx.quadraticCurveTo(cx, 92, cx - 16, 78);
    ctx.quadraticCurveTo(cx - 34, 86, cx - 52, 92);
    ctx.fill();
    // 耳朵
    ctx.fillStyle = C.skin;
    ctx.beginPath(); ctx.arc(cx - 52, 112, 9, 0, 7); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx + 52, 112, 9, 0, 7); ctx.fill(); ctx.stroke();

    // ---- 臉 ----
    // 眼睛（大圓眼＋高光）
    for (const s of [-1, 1]) {
      ctx.fillStyle = '#3e2723';
      ctx.beginPath(); ctx.ellipse(cx + 21 * s, 112, 8.5, 11, 0, 0, 7); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(cx + 21 * s - 3, 108, 3.4, 0, 7); ctx.fill();
    }
    // 微笑
    ctx.strokeStyle = '#8d4b2f'; ctx.lineWidth = 4.5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(cx, 124, 12, Math.PI * 0.18, Math.PI * 0.82); ctx.stroke();
    // 腮紅
    ctx.fillStyle = C.blush; ctx.globalAlpha = 0.55;
    ctx.beginPath(); ctx.ellipse(cx - 36, 128, 8, 5, 0, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx + 36, 128, 8, 5, 0, 0, 7); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = C.outline; ctx.lineWidth = 5;

    // ---- 探險帽（寬簷） ----
    // 帽簷
    ctx.fillStyle = C.hatDark;
    ctx.beginPath(); ctx.ellipse(cx, 66, 80, 20, 0, 0, 7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = C.hat;
    ctx.beginPath(); ctx.ellipse(cx, 62, 76, 17, 0, 0, 7); ctx.fill();
    // 帽冠
    ctx.fillStyle = C.hat;
    ctx.beginPath();
    ctx.moveTo(cx - 46, 62);
    ctx.quadraticCurveTo(cx - 48, 18, cx, 14);
    ctx.quadraticCurveTo(cx + 48, 18, cx + 46, 62);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    // 帽帶
    ctx.fillStyle = C.hatBand;
    rr(ctx, cx - 46, 48, 92, 13, 6); ctx.fill();
    // 帽帶小徽章
    ctx.fillStyle = C.buckle;
    ctx.beginPath(); ctx.arc(cx + 26, 54, 6, 0, 7); ctx.fill();

    return cv;
  }

  return {
    get() { if (!cached) cached = draw(); return cached; },
    ratio: 300 / 256, // 高寬比（供顯示端等比縮放）
  };
})();
