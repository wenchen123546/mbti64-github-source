
(function () {
  'use strict';

  const APP_NAME = 'MBTI-64 擴展人格';
  const APP_SHORT = 'MBTI-64';
  const THEME_COLOR = '#22d3ee';
  const BG_COLOR = '#080e1a';

  function injectManifest() {
    const manifest = {
      name: APP_NAME, short_name: APP_SHORT,
      description: '64 種人格的深度自我探索',
      start_url: location.href, display: 'standalone',
      background_color: BG_COLOR, theme_color: THEME_COLOR, orientation: 'portrait',
      icons: [
        { src: 'data:image/svg+xml;utf8,' + encodeURIComponent(generateIconSvg(192)), sizes: '192x192', type: 'image/svg+xml', purpose: 'any maskable' },
        { src: 'data:image/svg+xml;utf8,' + encodeURIComponent(generateIconSvg(512)), sizes: '512x512', type: 'image/svg+xml', purpose: 'any maskable' }
      ]
    };
    try {
      const blob = new Blob([JSON.stringify(manifest)], { type: 'application/manifest+json' });
      const url = URL.createObjectURL(blob);
      let link = document.querySelector('link[rel="manifest"]');
      if (!link) { link = document.createElement('link'); link.rel = 'manifest'; document.head.appendChild(link); }
      link.href = url;

      let mt = document.querySelector('meta[name="theme-color"]');
      if (!mt) { mt = document.createElement('meta'); mt.name = 'theme-color'; document.head.appendChild(mt); }
      mt.content = THEME_COLOR;

      const iosMetas = [
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
        { name: 'apple-mobile-web-app-title', content: APP_SHORT }
      ];
      iosMetas.forEach(m => {
        let el = document.querySelector('meta[name="' + m.name + '"]');
        if (!el) { el = document.createElement('meta'); el.name = m.name; document.head.appendChild(el); }
        el.content = m.content;
      });

      let appleIcon = document.querySelector('link[rel="apple-touch-icon"]');
      if (!appleIcon) { appleIcon = document.createElement('link'); appleIcon.rel = 'apple-touch-icon'; document.head.appendChild(appleIcon); }
      appleIcon.href = 'data:image/svg+xml;utf8,' + encodeURIComponent(generateIconSvg(180));
    } catch (e) { console.warn('[PWA] manifest injection failed:', e); }
  }

  function generateIconSvg(size) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + size + ' ' + size + '">' +
      '<defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">' +
      '<stop offset="0%" stop-color="#22d3ee"/><stop offset="100%" stop-color="#6366f1"/>' +
      '</linearGradient></defs>' +
      '<rect width="' + size + '" height="' + size + '" rx="' + (size * 0.22) + '" fill="url(#g)"/>' +
      '<text x="' + (size / 2) + '" y="' + (size * 0.62) + '" font-family="Arial Black, sans-serif" font-weight="900" font-size="' + (size * 0.42) + '" fill="white" text-anchor="middle">M</text>' +
      '<text x="' + (size / 2) + '" y="' + (size * 0.86) + '" font-family="Arial, sans-serif" font-weight="700" font-size="' + (size * 0.14) + '" fill="white" text-anchor="middle" opacity="0.9">64</text>' +
      '</svg>';
  }

  function tryRegisterSW() {
    if (!('serviceWorker' in navigator)) return false;
    try {
      const swCode = "const CACHE='mbti64-v7';self.addEventListener('install',e=>self.skipWaiting());self.addEventListener('activate',e=>e.waitUntil(clients.claim()));self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;if(e.request.url.startsWith(self.location.origin)){e.respondWith(caches.open(CACHE).then(c=>c.match(e.request).then(h=>h||fetch(e.request).then(r=>{if(r.ok)c.put(e.request,r.clone());return r;}).catch(()=>h))));}});";
      const blob = new Blob([swCode], { type: 'text/javascript' });
      const url = URL.createObjectURL(blob);
      navigator.serviceWorker.register(url, { scope: './' })
        .then(() => console.log('[PWA] SW registered'))
        .catch(err => console.info('[PWA] SW skip:', err.message));
      return true;
    } catch (e) { return false; }
  }

  function renderInstallButton() {
    if (document.getElementById('pwa-install-btn')) return;
    if (!window.MBTI64Utils || !window.MBTI64Utils.pwa.canInstall()) return;
    const btn = document.createElement('button');
    btn.id = 'pwa-install-btn';
    btn.className = 'btn btn-secondary btn-sm';
    btn.style.cssText = 'position:fixed; bottom:16px; right:16px; z-index:80; box-shadow:0 6px 20px rgba(0,0,0,.3);';
    btn.innerHTML = '📱 安裝至桌面';
    btn.addEventListener('click', async () => {
      const r = await window.MBTI64Utils.pwa.prompt();
      if (r.outcome === 'accepted') { btn.remove(); window.showToast && window.showToast('已加入主畫面', 'success'); }
    });
    document.body.appendChild(btn);
  }

  function init() {
    injectManifest();
    tryRegisterSW();
    window.addEventListener('mbti64:pwa-installable', renderInstallButton);
    if (/iPhone|iPad|iPod/.test(navigator.userAgent) && !window.matchMedia('(display-mode: standalone)').matches) {
      const dismissed = sessionStorage.getItem('pwa_ios_dismissed');
      if (!dismissed) {
        setTimeout(() => {
          if (document.getElementById('pwa-ios-tip')) return;
          const tip = document.createElement('div');
          tip.id = 'pwa-ios-tip';
          tip.style.cssText = 'position:fixed; bottom:16px; left:16px; right:16px; background:var(--bg-elevated); border:1px solid var(--border-default); border-radius:12px; padding:14px; z-index:80; box-shadow:0 6px 20px rgba(0,0,0,.4); font-size:13px;';
          tip.innerHTML = '<button onclick="this.parentElement.remove(); sessionStorage.setItem(\'pwa_ios_dismissed\',\'1\')" style="float:right; background:none; border:none; color:var(--text-muted); cursor:pointer; font-size:18px;">✕</button><div style="font-weight:700; margin-bottom:4px;">📱 安裝為 App</div><div style="color:var(--text-secondary);">點選 Safari 下方的「分享」按鈕，再選「加入主畫面」即可。</div>';
          document.body.appendChild(tip);
        }, 8000);
      }
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();

  window.PWAModule = {
    renderInstallButton: renderInstallButton,
    showInstallTip: () => {
      if (window.MBTI64Utils && window.MBTI64Utils.pwa.canInstall()) window.MBTI64Utils.pwa.prompt();
      else if (/iPhone|iPad|iPod/.test(navigator.userAgent)) alert('在 iOS 上：請點擊下方分享按鈕 → 「加入主畫面」');
      else alert('請使用支援 PWA 的瀏覽器（Chrome、Edge、Safari 等）。');
    }
  };
})();
