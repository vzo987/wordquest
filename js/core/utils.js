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
