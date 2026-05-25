
window.GalleryModule = (function() {
    'use strict';
    function _esc(s) { if (typeof MBTI64Utils !== 'undefined') return MBTI64Utils.escapeHtml(s); return String(s||'').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
    const BASE16 = ['INTJ','INTP','ENTJ','ENTP','INFJ','INFP','ENFJ','ENFP','ISTJ','ISFJ','ESTJ','ESFJ','ISTP','ISFP','ESTP','ESFP'];
    const SUFFIXES = ['AH','AC','OH','OC'];
    const SUFFIX_LABELS = { 'AH':'果斷溫暖','AC':'果斷理性','OH':'審慎溫暖','OC':'審慎理性' };
    const GROUP_COLORS = {
        'NT': { bg:'from-purple-600/20 to-indigo-600/20', border:'border-purple-400/30', badge:'bg-purple-500/20 text-purple-300', label:'分析師' },
        'NF': { bg:'from-emerald-600/20 to-teal-600/20', border:'border-emerald-400/30', badge:'bg-emerald-500/20 text-emerald-300', label:'外交家' },
        'SJ': { bg:'from-blue-600/20 to-cyan-600/20', border:'border-blue-400/30', badge:'bg-blue-500/20 text-blue-300', label:'守衛者' },
        'SP': { bg:'from-amber-600/20 to-orange-600/20', border:'border-amber-400/30', badge:'bg-amber-500/20 text-amber-300', label:'探險家' }
    };
    function _getGroup(b) { const sn = b[1], tf = b[2], jp = b[3]; if (sn === 'N' && tf === 'T') return 'NT'; if (sn === 'N' && tf === 'F') return 'NF'; if (sn === 'S' && jp === 'J') return 'SJ'; return 'SP'; }

    function renderGalleryScreen() {
        const fs = window._showFeatureScreen ? window._showFeatureScreen() : null;
        if (!fs) return;
        const sysData = typeof window.sysData !== 'undefined' ? window.sysData : null;
        const mbtiBase = (typeof window.mbtiBase !== 'undefined' ? window.mbtiBase : null) || (sysData ? sysData.mbtiBase : null);
        const combo = (typeof window.combo64CelebNote !== 'undefined' ? window.combo64CelebNote : null) || (sysData ? (sysData.celebs ? sysData.celebs.combo : null) : null);
        fs.innerHTML = '<div class="p-6 md:p-10 flex flex-col gap-6 fade-in-up pb-8"><div class="text-center"><div class="inline-block px-4 py-1 rounded-full glass-panel text-cyan-300 text-xs font-bold tracking-widest uppercase mb-4">64-Type Gallery</div><h1 class="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400 mb-2">64 型全覽圖鑑</h1><p class="text-slate-400 text-sm mb-6 max-w-lg mx-auto">探索所有 64 種擴展人格類型的獨特面貌</p></div><div class="flex flex-wrap gap-2 justify-center mb-4" id="gallery-filters"><button onclick="GalleryModule.filterGroup(\'all\')" class="gallery-filter-btn active px-3 py-1.5 rounded-lg text-xs font-bold transition-all" data-group="all">全部 (64)</button>' +
            Object.entries(GROUP_COLORS).map(([g, c]) => '<button onclick="GalleryModule.filterGroup(\'' + g + '\')" class="gallery-filter-btn px-3 py-1.5 rounded-lg text-xs font-bold transition-all ' + c.badge + '" data-group="' + g + '">' + c.label + ' ' + g + '</button>').join('') +
            '</div><div class="flex gap-2 max-w-sm mx-auto w-full mb-4"><input type="text" id="gallery-search" class="flex-1 glass-panel border-0 rounded-lg px-4 py-2 text-sm placeholder-slate-400" placeholder="搜尋類型代碼或名稱..." oninput="GalleryModule.handleSearch()"></div><div id="gallery-grid" class="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-4xl mx-auto w-full">' + _renderCards(mbtiBase, combo, 'all') + '</div><div class="flex gap-3 justify-center mt-4"><button onclick="window.resetQuiz()" class="bg-slate-800 text-slate-200 border border-slate-600 font-bold py-3 px-6 rounded-xl hover:bg-slate-700 transition-all text-sm">返回首頁</button></div></div>';
    }

    function _renderCards(mbtiBase, combo, gf) {
        let html = '';
        BASE16.forEach(base => {
            const g = _getGroup(base);
            if (gf !== 'all' && g !== gf) return;
            const gc = GROUP_COLORS[g];
            const info = mbtiBase ? mbtiBase[base] : null;
            const tn = info ? (info.name || base) : base;
            SUFFIXES.forEach(suffix => {
                const fc = base + '-' + suffix;
                const cn = combo ? (combo[fc] || '') : '';
                const sl = SUFFIX_LABELS[suffix];
                html += '<div class="gallery-card glass-panel rounded-xl p-3 cursor-pointer hover:scale-[1.02] hover:border-cyan-400/40 transition-all duration-200 group" data-code="' + fc + '" data-group="' + g + '" data-name="' + _esc(tn) + '" onclick="GalleryModule.showDetail(\'' + fc + '\')"><div class="flex items-center justify-between mb-2"><span class="text-xs px-2 py-0.5 rounded-full ' + gc.badge + ' border ' + gc.border + ' font-bold">' + _esc(base) + '</span><span class="text-[10px] text-slate-500">' + _esc(suffix) + '</span></div><div class="text-sm font-bold text-white mb-1 group-hover:text-cyan-300 transition-colors truncate">' + _esc(tn) + '</div><div class="text-[10px] text-slate-400 mb-1">' + _esc(sl) + '</div>' + (cn ? '<div class="text-[10px] text-indigo-300/70 truncate mt-1">' + _esc(cn) + '</div>' : '') + '</div>';
            });
        });
        return html;
    }

    function filterGroup(g) {
        document.querySelectorAll('.gallery-filter-btn').forEach(b => { b.classList.toggle('active', b.dataset.group === g); if (b.dataset.group === g) { b.style.outline = '2px solid var(--accent)'; b.style.outlineOffset = '1px'; } else b.style.outline = 'none'; });
        document.querySelectorAll('.gallery-card').forEach(c => { c.style.display = (g === 'all' || c.dataset.group === g) ? '' : 'none'; });
        // v7: 觸發圖鑑成就追蹤
        if (window.AchievementsModule) { document.querySelectorAll('.gallery-card').forEach(c => { if (c.style.display !== 'none') window.AchievementsModule.autoCheck({ event: 'gallery_view', code: c.dataset.code }); }); }
    }

    function handleSearch() {
        const q = (document.getElementById('gallery-search')?.value || '').trim().toUpperCase();
        document.querySelectorAll('.gallery-card').forEach(c => {
            const code = (c.dataset.code || '').toUpperCase(), name = (c.dataset.name || '').toUpperCase();
            c.style.display = (!q || code.includes(q) || name.includes(q)) ? '' : 'none';
        });
    }

    function showDetail(fc) {
        const baseMbti = fc.substring(0, 4), suffix = fc.substring(5);
        if (window.AchievementsModule) window.AchievementsModule.autoCheck({ event: 'gallery_view', code: fc });
        if (typeof window.QuizState === 'undefined' && typeof window.adminGenerateCard === 'undefined') { if (typeof showToast === 'function') showToast('正在載入結果資料...', 'info'); return; }
        if (typeof window.adminGenerateCard === 'function') {
            const ms = document.getElementById('admin-mbti'), d5 = document.getElementById('admin-dim5'), d6 = document.getElementById('admin-dim6');
            if (ms) ms.value = baseMbti; if (d5) d5.value = suffix[0]; if (d6) d6.value = suffix[1];
            window.adminGenerateCard();
        } else if (typeof showToast === 'function') showToast('查看 ' + fc + ' 需要先載入完整資料', 'info');
    }

    return { renderGalleryScreen, filterGroup, handleSearch, showDetail };
})();
