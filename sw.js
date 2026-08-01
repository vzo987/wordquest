// ============ Service Worker：離線遊玩支援 ============
// 策略：安裝時預先快取全部資源；執行時「網路優先、離線用快取」
// （有網路時永遠拿最新版，斷網時用上次快取的版本繼續玩）
const VERSION = 'wordquest-v19';

const PRECACHE = [
  './',
  './index.html',
  './manifest.json',
  './css/style.css',
  './js/core/utils.js',
  './js/core/audio.js',
  './js/core/avatar.js',
  './js/core/state.js',
  './js/core/learning.js',
  './js/data/words.js',
  './js/data/skills.js',
  './js/data/monsters.js',
  './js/data/items.js',
  './js/data/maps.js',
  './js/systems/monster.js',
  './js/systems/battle.js',
  './js/ui/screens.js',
  './js/ui/map.js',
  './js/main.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon3d-192.png',
  './icons/icon3d-512.png',
  './photo/mon_nail1.png',
  './photo/mon_nail2.png',
  './photo/mon_nail3.png',
  './photo/mon_apple1.png',
  './photo/mon_apple2.png',
  './photo/mon_apple3.png',
  './photo/mon_firetooth.png',
  './photo/evo_iron2.png',
  './photo/evo_iron3.png',
  './photo/evo_wood2.png',
  './photo/evo_wood3.png',
  './photo/evo_water2.png',
  './photo/evo_water3.png',
  './photo/evo_fire2.png',
  './photo/evo_fire3.png',
  './photo/evo_earth2.png',
  './photo/evo_earth3.png',
  './photo/evo_caterpie2.png',
  './photo/evo_caterpie3.png',
  './photo/evo_mushroom2.png',
  './photo/evo_mushroom3.png',
  './photo/evo_cactus2.png',
  './photo/evo_cactus3.png',
  './photo/evo_bluefish2.png',
  './photo/evo_bluefish3.png',
  './photo/evo_bubblecrab2.png',
  './photo/evo_bubblecrab3.png',
  './photo/evo_icepen2.png',
  './photo/evo_icepen3.png',
  './photo/evo_lizard2.png',
  './photo/evo_lizard3.png',
  './photo/evo_magmouse2.png',
  './photo/evo_magmouse3.png',
  './photo/evo_flamebird2.png',
  './photo/evo_flamebird3.png',
  './photo/evo_magnet2.png',
  './photo/evo_magnet3.png',
  './photo/evo_gearmon2.png',
  './photo/evo_gearmon3.png',
  './photo/evo_steelbird2.png',
  './photo/evo_steelbird3.png',
  './photo/evo_sandmouse2.png',
  './photo/evo_sandmouse3.png',
  './photo/evo_rockturtle2.png',
  './photo/evo_rockturtle3.png',
  './photo/evo_molemon2.png',
  './photo/evo_molemon3.png',
  './photo/evo_boss_oak2.png',
  './photo/evo_boss_oak3.png',
  './photo/evo_boss_squid2.png',
  './photo/evo_boss_squid3.png',
  './photo/evo_boss_dragon2.png',
  './photo/evo_boss_dragon3.png',
  './photo/evo_boss_golem2.png',
  './photo/evo_boss_golem3.png',
  './photo/evo_boss_earthlord2.png',
  './photo/evo_boss_earthlord3.png',
  './3d/index.html',
  './3d/manifest.json',
  './3d/css/style3d.css',
  './3d/lib/three.min.js',
  './3d/js/engine3d.js',
  './3d/js/map3d.js',
  './3d/js/battle3d.js',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(VERSION)
      .then(cache => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || !req.url.startsWith(self.location.origin)) return;
  e.respondWith(
    fetch(req)
      .then(res => {
        // 成功取得 → 更新快取副本
        if (res.ok) {
          const clone = res.clone();
          caches.open(VERSION).then(cache => cache.put(req, clone));
        }
        return res;
      })
      .catch(() =>
        // 離線 → 用快取；找不到且是頁面導覽 → 回首頁
        caches.match(req).then(hit => hit ||
          (req.mode === 'navigate' ? caches.match('./index.html') : Response.error()))
      )
  );
});
