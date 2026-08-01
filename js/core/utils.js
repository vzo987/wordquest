// ============ 共用工具 ============
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

function rand(n) { return Math.floor(Math.random() * n); }
function randRange(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
function chance(p) { return Math.random() < p; }
function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
function pick(arr) { return arr[rand(arr.length)]; }
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = rand(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function wait(ms) { return new Promise(r => setTimeout(r, ms)); }
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// 遊戲版本（與 sw.js 的 VERSION 同步更新；顯示於標題畫面供確認更新狀態）
const GAME_VERSION = 'v19';

// 資源路徑前綴（3D 版位於 /3d/ 子目錄，需回上層取用共用圖片）
const ASSET_PREFIX = /\/3d\//.test(location.pathname) ? '../' : '';

// 怪獸圖示（DOM 用）：支援圖片怪獸；二階銀色光環、三階金色光環＋皇冠
// （烘焙變體圖 baked=true 的效果已在圖檔內，不再疊加即時光環）
function speciesIcon(sp) {
  if (!sp) return '';
  const stage = sp.stage || 1;
  const inner = sp.img
    ? `<img class="sp-img" src="${ASSET_PREFIX}${sp.img}" alt="${esc(sp.name || '')}">`
    : sp.emoji;
  if (stage < 2 && !sp.img) return sp.emoji;
  const evoCls = (stage >= 2 && !sp.baked) ? ' evo' + stage : '';
  return `<span class="evo-wrap${evoCls}">${inner}</span>`;
}

// 圖片怪獸的 Image 快取（2D 畫布用；載入完成前回傳 null → 先畫替代 emoji）
const _spImgCache = {};
function speciesImgEl(sp) {
  if (!sp || !sp.img) return null;
  let im = _spImgCache[sp.img];
  if (!im) {
    im = new Image();
    im.src = ASSET_PREFIX + sp.img;
    _spImgCache[sp.img] = im;
  }
  return (im.complete && im.naturalWidth) ? im : null;
}

// 畫面切換
function showScreen(id) {
  $$('.screen').forEach(s => s.classList.remove('active'));
  $('#' + id).classList.add('active');
}

// 通用彈窗：buttons = [{text, cls, value}]，回傳 Promise<value>
function showModal({ title = '', emoji = '', body = '', buttons = [{ text: '確定', value: true }] }) {
  return new Promise(resolve => {
    const box = $('#modal-box');
    box.innerHTML =
      (title ? `<h3>${title}</h3>` : '') +
      (emoji ? `<div class="m-emoji">${emoji}</div>` : '') +
      (body ? `<div class="m-body">${body}</div>` : '') +
      `<div class="m-buttons"></div>`;
    const btnWrap = box.querySelector('.m-buttons');
    buttons.forEach(b => {
      const el = document.createElement('button');
      el.className = 'btn ' + (b.cls || '');
      el.textContent = b.text;
      el.onclick = () => { $('#modal-mask').classList.add('hidden'); resolve(b.value); };
      btnWrap.appendChild(el);
    });
    $('#modal-mask').classList.remove('hidden');
  });
}

// 地圖上的短訊息
let _mapMsgTimer = null;
function mapMsg(text, ms = 2200) {
  const el = $('#map-msg');
  el.textContent = text;
  el.classList.remove('hidden');
  clearTimeout(_mapMsgTimer);
  _mapMsgTimer = setTimeout(() => el.classList.add('hidden'), ms);
}

// 自動存檔提示（羽毛筆）
function showSaveToast() {
  const t = $('#save-toast');
  t.classList.remove('hidden');
  // 重新觸發動畫
  t.style.animation = 'none';
  void t.offsetWidth;
  t.style.animation = '';
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.add('hidden'), 1900);
}
