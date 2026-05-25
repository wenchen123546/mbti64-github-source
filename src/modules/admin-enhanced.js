
/**
 * ===============================================
 * 增強版管理員模組 (Optimized v7)
 *
 * 本次優化：
 *   - 新增 session token 自動續期（距到期 5 分鐘前自動 refresh）
 *   - 熱力圖改用 ThemeManager 的 chartColors，跟隨主題
 *   - exportData 的 CSV 欄位正確逃脫換行符
 *   - gasCall 改用 options 物件；封裝 handleAuthError
 *   - 支援「已過期」提示與強制登出
 * ===============================================
 */

window.AdminEnhanced = (function() {
    'use strict';

    // ==========================================
    // Session token 狀態（含到期追蹤）
    // ==========================================
    const SESSION_DURATION_MS = 30 * 60 * 1000;   // 與後端一致
    const REFRESH_BUFFER_MS   = 5  * 60 * 1000;    // 到期前 5 分鐘嘗試續期

    let _sessionToken = null;
    let _sessionExpiresAt = 0;
    let _refreshTimer = null;

    function _scheduleRefresh() {
        if (_refreshTimer) { clearTimeout(_refreshTimer); _refreshTimer = null; }
        const now = Date.now();
        const waitMs = Math.max(10 * 1000, _sessionExpiresAt - now - REFRESH_BUFFER_MS);
        _refreshTimer = setTimeout(_tryRefreshSession, waitMs);
    }

    function _tryRefreshSession() {
        if (!_sessionToken) return;
        // #31 對齊後端 refreshAdminSession v7 回傳格式：{success, token, expiresAt, ttlMs, refreshed}
        if (typeof gasCall === 'function') {
            gasCall({ fn: 'refreshAdminSession', args: [_sessionToken], retries: 1 })
                .then(r => {
                    if (r && r.success && r.token) {
                        _sessionToken = r.token;
                        // 優先使用後端提供的絕對時間 expiresAt，否則由 ttlMs 推算
                        if (typeof r.expiresAt === 'number') {
                            _sessionExpiresAt = r.expiresAt;
                        } else if (typeof r.ttlMs === 'number') {
                            _sessionExpiresAt = Date.now() + r.ttlMs;
                        } else if (typeof r.expiresInMs === 'number') { // 向後相容舊欄位
                            _sessionExpiresAt = Date.now() + r.expiresInMs;
                        } else {
                            _sessionExpiresAt = Date.now() + SESSION_DURATION_MS;
                        }
                        _scheduleRefresh();
                    } else if (r && r.expired) {
                        // 後端明確告知已過期：觸發自動登出
                        _handleAuthError({ message: '管理員驗證失敗' });
                    } else {
                        _notifyExpiring();
                    }
                })
                .catch(() => _notifyExpiring());
        }
    }

    function _notifyExpiring() {
        if (typeof MBTI64Utils !== 'undefined') {
            MBTI64Utils.showToast('管理員工作階段即將過期，請儲存後重新登入。', 'warning', 6000);
        }
    }

    function _handleAuthError(err) {
        const msg = String(err && err.message || err || '');
        if (msg.includes('管理員驗證失敗') || msg.includes('AUTH') || msg.includes('FORBIDDEN')) {
            _sessionToken = null;
            _sessionExpiresAt = 0;
            if (_refreshTimer) { clearTimeout(_refreshTimer); _refreshTimer = null; }
            MBTI64Utils.showError('工作階段已過期，請重新登入');
            if (typeof window.restoreAdminContent === 'function') window.restoreAdminContent();
            return true;
        }
        return false;
    }

    function escapeHtml(text) {
        if (typeof window.MBTI64Utils !== 'undefined') return window.MBTI64Utils.escapeHtml(text);
        const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;', '`': '&#96;', '/': '&#x2F;' };
        return String(text).replace(/[&<>"'`/]/g, m => map[m]);
    }

    function isValidSessionToken(token) {
        return token && typeof token === 'string' && token.length > 0;
    }

    function restoreAdminPanel() {
        if (typeof window.restoreAdminContent === 'function') {
            window.restoreAdminContent();
        }
    }

    // 通用 GAS 呼叫（含重試 + 認證失敗處理）
    function adminGasCall(fnName, successCb, errorCb, ...args) {
        if (typeof google === 'undefined' || !google.script) {
            if (errorCb) errorCb({ message: '非 GAS 環境，無法呼叫後端' });
            return;
        }
        if (typeof gasCall === 'function') {
            gasCall({ fn: fnName, args: args, retries: 1 })
                .then(successCb)
                .catch(err => {
                    if (_handleAuthError(err)) return;
                    console.error('[AdminEnhanced] GAS 呼叫失敗:', fnName, err);
                    if (errorCb) errorCb(err);
                    else MBTI64Utils.showError('後端呼叫失敗：' + (err.message || fnName));
                });
            return;
        }
        // Fallback to direct google.script.run
        let runner = google.script.run
            .withSuccessHandler(successCb)
            .withFailureHandler(err => {
                if (_handleAuthError(err)) return;
                console.error('[AdminEnhanced] GAS 呼叫失敗:', fnName, err);
                if (errorCb) errorCb(err);
                else MBTI64Utils.showError('後端呼叫失敗：' + (err.message || fnName));
            });
        runner[fnName](...args);
    }

    /**
     * #31 支援多種傳入形式：
     *   renderEnhancedDashboard(stats, token, expiresInMs)  // 舊版 caller
     *   renderEnhancedDashboard(stats, token, { expiresAt, ttlMs }) // 新版 caller（對齊後端 adminLogin 回傳）
     */
    function renderEnhancedDashboard(stats, sessionToken, expiresArg) {
        if (!isValidSessionToken(sessionToken)) {
            MBTI64Utils.showError('session token 無效，請重新登入');
            return;
        }
        if (!stats) {
            MBTI64Utils.showError('請先點擊「載入統計」再開啟此面板');
            return;
        }

        _sessionToken = sessionToken;
        // 依傳入格式推算過期時間
        if (expiresArg && typeof expiresArg === 'object') {
            if (typeof expiresArg.expiresAt === 'number') {
                _sessionExpiresAt = expiresArg.expiresAt;
            } else if (typeof expiresArg.ttlMs === 'number') {
                _sessionExpiresAt = Date.now() + expiresArg.ttlMs;
            } else {
                _sessionExpiresAt = Date.now() + SESSION_DURATION_MS;
            }
        } else if (typeof expiresArg === 'number') {
            _sessionExpiresAt = Date.now() + expiresArg;
        } else {
            _sessionExpiresAt = Date.now() + SESSION_DURATION_MS;
        }
        _scheduleRefresh();

        const container = document.getElementById('admin-content');
        if (!container) return;
        if (typeof window.backupAdminContent === 'function') window.backupAdminContent();

        container.innerHTML = `
            <div class="space-y-6 fade-in-up">
                <div class="flex justify-between items-center border-b border-slate-700 pb-4">
                    <h2 class="text-xl font-bold text-cyan-300">增強版數據中心</h2>
                    <span id="admin-session-status" class="text-xs text-slate-400"></span>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button type="button" onclick="AdminEnhanced.render64TypeHeatmap()" aria-label="檢視 64 型熱力圖"
                        class="glass-card rounded-xl p-6 text-left hover:border-cyan-400/50 transition-all cursor-pointer group">
                        <div class="flex items-center justify-between">
                            <div>
                                <h3 class="text-lg font-semibold text-[var(--text-primary)] group-hover:text-cyan-300 transition-colors">🗺️ 64 型熱力圖</h3>
                                <p class="text-sm text-slate-400 mt-1">檢視各型別與後綴的分佈矩陣</p>
                            </div>
                            <span class="text-2xl" aria-hidden="true">→</span>
                        </div>
                    </button>
                    <button type="button" onclick="AdminEnhanced.renderItemAnalysis()" aria-label="題目鑑別度分析"
                        class="glass-card rounded-xl p-6 text-left hover:border-cyan-400/50 transition-all cursor-pointer group">
                        <div class="flex items-center justify-between">
                            <div>
                                <h3 class="text-lg font-semibold text-[var(--text-primary)] group-hover:text-cyan-300 transition-colors">🎯 題目鑑別度分析</h3>
                                <p class="text-sm text-slate-400 mt-1">分析各題選項分佈與異常題目</p>
                            </div>
                            <span class="text-2xl" aria-hidden="true">→</span>
                        </div>
                    </button>
                    <button type="button" onclick="AdminEnhanced.renderFeedbackPanel()" aria-label="用戶反饋管理"
                        class="glass-card rounded-xl p-6 text-left hover:border-cyan-400/50 transition-all cursor-pointer group">
                        <div class="flex items-center justify-between">
                            <div>
                                <h3 class="text-lg font-semibold text-[var(--text-primary)] group-hover:text-cyan-300 transition-colors">💬 用戶反饋管理</h3>
                                <p class="text-sm text-slate-400 mt-1">查看與篩選使用者評價</p>
                            </div>
                            <span class="text-2xl" aria-hidden="true">→</span>
                        </div>
                    </button>
                    <button type="button" onclick="AdminEnhanced.renderAdvancedExport()" aria-label="進階資料匯出"
                        class="glass-card rounded-xl p-6 text-left hover:border-cyan-400/50 transition-all cursor-pointer group">
                        <div class="flex items-center justify-between">
                            <div>
                                <h3 class="text-lg font-semibold text-[var(--text-primary)] group-hover:text-cyan-300 transition-colors">📊 進階匯出</h3>
                                <p class="text-sm text-slate-400 mt-1">根據條件自訂資料匯出</p>
                            </div>
                            <span class="text-2xl" aria-hidden="true">→</span>
                        </div>
                    </button>
                </div>
                <div class="flex gap-3 justify-center mt-6">
                    <button type="button" onclick="AdminEnhanced.restoreAdminPanel()" class="text-slate-400 hover:text-cyan-300 transition-colors py-2 px-6">
                        返回管理面板
                    </button>
                </div>
            </div>
        `;
        _updateSessionStatusLabel();
    }

    function _updateSessionStatusLabel() {
        const el = document.getElementById('admin-session-status');
        if (!el) return;
        const remaining = Math.max(0, _sessionExpiresAt - Date.now());
        const mins = Math.floor(remaining / 60000);
        el.textContent = mins > 0 ? `工作階段剩餘約 ${mins} 分鐘` : '工作階段即將過期';
    }

    // 64 型熱力圖：改用 ThemeManager 的動態顏色
    function render64TypeHeatmap() {
        const container = document.getElementById('admin-content');
        if (!container) return;
        if (typeof window.backupAdminContent === 'function') window.backupAdminContent();

        const stats = window.currentAdminStats;
        const types = ['INTJ','INTP','ENTJ','ENTP','INFJ','INFP','ENFJ','ENFP',
                       'ISTJ','ISFJ','ESTJ','ESFJ','ISTP','ISFP','ESTP','ESFP'];
        const suffixes = ['AH','AC','OH','OC'];
        const dist = stats?.typeDistribution || {};
        const total = stats?.total || 1;

        const maxVal = Math.max(...Object.values(dist), 1);

        // 使用 ThemeManager 取得主題感知顏色
        function heatColor(count) {
            const isDark = (typeof ThemeManager !== 'undefined') ? ThemeManager.isDark() : true;
            const base = isDark
                ? { r: 30,  g: 41,  b: 59  }    // 深色底
                : { r: 241, g: 245, b: 249 };   // 淺色底
            const peak = isDark
                ? { r: 239, g: 68,  b: 68  }    // 深色頂
                : { r: 220, g: 38,  b: 38  };   // 淺色頂
            if (!count) return `rgba(${base.r},${base.g},${base.b},0.5)`;
            const ratio = count / maxVal;
            const r = Math.round(ratio * peak.r + (1 - ratio) * base.r);
            const g = Math.round(ratio * peak.g + (1 - ratio) * base.g);
            const b = Math.round(ratio * peak.b + (1 - ratio) * base.b);
            return `rgba(${r},${g},${b},0.85)`;
        }

        function textColor(count) {
            // 淺色底時文字用深色
            const isDark = (typeof ThemeManager !== 'undefined') ? ThemeManager.isDark() : true;
            if (isDark) return '#fff';
            const ratio = count ? (count / maxVal) : 0;
            return ratio > 0.6 ? '#fff' : '#1f2937';
        }

        const headerCells = suffixes.map(s => `<th class="px-2 py-1 text-xs text-cyan-300 font-bold">${escapeHtml(s)}</th>`).join('');
        const rows = types.map(mbti => {
            const cells = suffixes.map(suf => {
                const key = `${mbti}-${suf}`;
                const count = dist[key] || 0;
                const pct = ((count / total) * 100).toFixed(1);
                const bg = heatColor(count);
                const fg = textColor(count);
                return `<td class="px-2 py-1 text-center text-xs font-mono cursor-default" style="background:${bg};color:${fg}" title="${escapeHtml(key)}: ${count} 人 (${pct}%)">${count || ''}</td>`;
            }).join('');
            return `<tr><td class="pr-3 py-1 text-xs text-[var(--text-primary)] font-bold whitespace-nowrap">${escapeHtml(mbti)}</td>${cells}</tr>`;
        }).join('');

        container.innerHTML = `
            <div class="space-y-4 fade-in-up">
                <div class="flex justify-between items-center border-b border-slate-700 pb-3">
                    <h2 class="text-xl font-bold text-cyan-300">64 型分佈熱力圖</h2>
                    <button type="button" onclick="AdminEnhanced.restoreAdminPanel()" class="text-sm text-slate-400 hover:text-white">返回</button>
                </div>
                <p class="text-xs text-[var(--text-secondary)]">顏色越深代表人數越多。共 ${total} 筆紀錄。</p>
                <div class="overflow-x-auto">
                    <table class="text-sm w-full" role="grid" aria-label="64 型分佈熱力圖">
                        <thead><tr><th></th>${headerCells}</tr></thead>
                        <tbody>${rows}</tbody>
                    </table>
                </div>
                <div class="flex items-center gap-3 mt-2">
                    <span class="text-xs text-[var(--text-secondary)]">少</span>
                    <div class="flex gap-1" aria-hidden="true">${[0.1,0.3,0.5,0.7,0.9,1.0].map(r => `<div class="w-6 h-4 rounded" style="background:${heatColor(Math.round(r*maxVal))}"></div>`).join('')}</div>
                    <span class="text-xs text-[var(--text-secondary)]">多</span>
                </div>
            </div>
        `;

        // 訂閱主題變更 → 重繪
        if (typeof ThemeManager !== 'undefined' && !render64TypeHeatmap._subscribed) {
            ThemeManager.subscribe(() => {
                // 僅當此面板仍顯示時重繪
                if (document.querySelector('.overflow-x-auto table[aria-label="64 型分佈熱力圖"]')) {
                    render64TypeHeatmap();
                }
            });
            render64TypeHeatmap._subscribed = true;
        }
    }

    // ===== 題目鑑別度 =====
    function renderItemAnalysis() {
        const container = document.getElementById('admin-content');
        if (!container) return;
        if (typeof window.backupAdminContent === 'function') window.backupAdminContent();

        container.innerHTML = `
            <div class="space-y-6 fade-in-up">
                <div class="flex justify-between items-center border-b border-slate-700 pb-4">
                    <h2 class="text-xl font-bold text-cyan-300">題目鑑別度分析</h2>
                    <button type="button" onclick="AdminEnhanced.restoreAdminPanel()" class="text-sm text-slate-400 hover:text-white">返回</button>
                </div>
                <div id="item-loading" class="text-center py-10" role="status" aria-live="polite">
                    <div class="inline-block w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" aria-hidden="true"></div>
                    <p class="mt-4 text-[var(--text-secondary)]">正在載入題目分析數據...</p>
                </div>
                <div id="item-content" class="hidden space-y-3"></div>
            </div>
        `;

        adminGasCall('fetchItemAnalysis',
            data => {
                const loadingDiv = document.getElementById('item-loading');
                const contentDiv = document.getElementById('item-content');
                if (!data || !data.questions || data.questions.length === 0) {
                    if (loadingDiv) loadingDiv.innerHTML = '<p class="text-[var(--text-secondary)]">暫無題目數據（需要先有答題記錄）</p>';
                    return;
                }
                let itemHtml = '';
                data.questions.forEach((q, idx) => {
                    const stat = data.itemStats[idx] || { optionCounts: [0,0,0,0] };
                    const totalR = stat.optionCounts.reduce((a, b) => a + b, 0);
                    const maxC = Math.max(...stat.optionCounts);
                    const isProblematic = totalR > 0 && maxC / totalR > 0.8;
                    itemHtml += `
                        <div class="border rounded-lg p-4 mb-3 ${isProblematic ? 'border-red-500/50 bg-red-900/10' : 'border-slate-700'}">
                            <div class="flex justify-between mb-2">
                                <h3 class="font-semibold text-[var(--text-primary)] text-sm">第 ${idx + 1} 題 <span class="text-xs text-[var(--text-secondary)]">[${escapeHtml(q.dimension || '')}]</span> ${isProblematic ? '<span class="text-red-400 text-xs">⚠ 鑑別度不足</span>' : ''}</h3>
                                <span class="text-xs text-[var(--text-secondary)]">${totalR} 人作答</span>
                            </div>
                            <p class="text-xs text-[var(--text-secondary)] mb-2">${escapeHtml(q.text || '')}</p>
                            <div class="space-y-1">
                                ${stat.optionCounts.map((c, i) => {
                                    const pct = totalR ? Math.round(c / totalR * 100) : 0;
                                    return `<div class="flex items-center gap-2"><span class="text-xs text-[var(--text-secondary)] w-12">選項${i+1}</span><div class="flex-1 bg-slate-800 rounded-full h-1.5"><div class="h-1.5 rounded-full bg-cyan-500" style="width:${pct}%"></div></div><span class="text-xs text-[var(--text-secondary)] w-10 text-right">${pct}%</span></div>`;
                                }).join('')}
                            </div>
                        </div>`;
                });
                if (loadingDiv) loadingDiv.classList.add('hidden');
                if (contentDiv) { contentDiv.innerHTML = itemHtml; contentDiv.classList.remove('hidden'); }
            },
            err => {
                const loadingDiv = document.getElementById('item-loading');
                if (loadingDiv) loadingDiv.innerHTML = `<p class="text-red-400">載入失敗：${escapeHtml(err.message || '未知錯誤')}</p>`;
            },
            _sessionToken
        );
    }

    // ===== 用戶反饋 =====
    function renderFeedbackPanel() {
        const container = document.getElementById('admin-content');
        if (!container) return;
        if (typeof window.backupAdminContent === 'function') window.backupAdminContent();

        container.innerHTML = `
            <div class="space-y-6 fade-in-up">
                <div class="flex justify-between items-center border-b border-slate-700 pb-4">
                    <h2 class="text-xl font-bold text-cyan-300">用戶反饋管理</h2>
                    <button type="button" onclick="AdminEnhanced.restoreAdminPanel()" class="text-sm text-slate-400 hover:text-white">返回</button>
                </div>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div class="glass-panel p-4 rounded-lg text-center"><div class="text-2xl font-bold text-[var(--text-primary)]" id="feedback-total">-</div><div class="text-xs text-[var(--text-secondary)]">總反饋數</div></div>
                    <div class="glass-panel p-4 rounded-lg text-center"><div class="text-2xl font-bold text-yellow-400" id="feedback-avg-rating">-</div><div class="text-xs text-[var(--text-secondary)]">平均星級</div></div>
                    <div class="glass-panel p-4 rounded-lg text-center"><div class="text-2xl font-bold text-emerald-400" id="feedback-positive">-</div><div class="text-xs text-[var(--text-secondary)]">好評 (4-5星)</div></div>
                    <div class="glass-panel p-4 rounded-lg text-center"><div class="text-2xl font-bold text-red-400" id="feedback-negative">-</div><div class="text-xs text-[var(--text-secondary)]">差評 (1-2星)</div></div>
                </div>
                <div class="flex gap-2 mb-4">
                    <label for="feedback-rating-filter" class="sr-only">篩選星級</label>
                    <select id="feedback-rating-filter" class="glass-panel border-0 text-sm rounded-lg p-2" onchange="AdminEnhanced.applyFeedbackFilter()">
                        <option value="">所有星級</option>
                        <option value="5">5 星</option><option value="4">4 星</option>
                        <option value="3">3 星</option><option value="2">2 星</option><option value="1">1 星</option>
                    </select>
                </div>
                <div id="feedback-list" class="space-y-3" aria-live="polite">
                    <div class="text-center py-6 text-[var(--text-secondary)]">正在載入反饋...</div>
                </div>
            </div>
        `;
        applyFeedbackFilter();
    }

    function applyFeedbackFilter() {
        const rating = document.getElementById('feedback-rating-filter')?.value || '';
        const listDiv = document.getElementById('feedback-list');

        adminGasCall('fetchFeedback',
            feedbacksArray => {
                if (!feedbacksArray || !Array.isArray(feedbacksArray) || feedbacksArray.length === 0) {
                    if (listDiv) listDiv.innerHTML = '<p class="text-[var(--text-secondary)]">沒有反饋紀錄</p>';
                    return;
                }
                let filtered = feedbacksArray;
                if (rating) filtered = filtered.filter(f => Math.round(f.rating) === parseInt(rating));

                if (filtered.length === 0) {
                    if (listDiv) listDiv.innerHTML = '<p class="text-[var(--text-secondary)]">沒有符合條件的反饋</p>';
                    const el = document.getElementById('feedback-total');
                    if (el) el.textContent = 0;
                    return;
                }

                let totalRating = 0, positive = 0, negative = 0, feedbackHtml = '';
                filtered.forEach(fb => {
                    totalRating += (fb.rating || 0);
                    if (fb.rating >= 4) positive++;
                    if (fb.rating <= 2) negative++;
                    const ratingInt = Math.max(0, Math.min(5, Math.round(fb.rating || 0)));
                    const stars = '⭐'.repeat(ratingInt);
                    feedbackHtml += `
                        <div class="border border-slate-700 rounded-lg p-4 hover:border-cyan-400/50 transition-all">
                            <div class="flex justify-between items-start mb-2">
                                <div>
                                    <p class="font-semibold text-[var(--text-primary)]">${escapeHtml(fb.userName || '匿名')}</p>
                                    <p class="text-xs text-[var(--text-secondary)]">${escapeHtml(fb.type || '未知')} · ${escapeHtml(fb.date || '')}</p>
                                </div>
                                <span class="text-sm text-yellow-300" aria-label="${ratingInt} 星評分">${stars}</span>
                            </div>
                            <p class="text-sm text-[var(--text-primary)]">${escapeHtml(fb.feedback || '(無內容)')}</p>
                        </div>`;
                });

                const el = id => document.getElementById(id);
                if (el('feedback-total')) el('feedback-total').textContent = filtered.length;
                if (el('feedback-avg-rating')) el('feedback-avg-rating').textContent = (totalRating / filtered.length).toFixed(1);
                if (el('feedback-positive')) el('feedback-positive').textContent = positive;
                if (el('feedback-negative')) el('feedback-negative').textContent = negative;
                if (listDiv) listDiv.innerHTML = feedbackHtml;
            },
            err => {
                if (listDiv) listDiv.innerHTML = `<p class="text-red-400">載入失敗：${escapeHtml(err.message || '未知錯誤')}</p>`;
            },
            _sessionToken
        );
    }

    // ===== 進階匯出 =====
    function renderAdvancedExport() {
        const container = document.getElementById('admin-content');
        if (!container) return;
        if (typeof window.backupAdminContent === 'function') window.backupAdminContent();

        container.innerHTML = `
            <div class="space-y-6 fade-in-up">
                <div class="flex justify-between items-center border-b border-slate-700 pb-4">
                    <h2 class="text-xl font-bold text-cyan-300">進階匯出</h2>
                    <button type="button" onclick="AdminEnhanced.restoreAdminPanel()" class="text-sm text-slate-400 hover:text-white">返回</button>
                </div>
                <div class="glass-panel p-6 rounded-xl space-y-4">
                    <div>
                        <label class="block text-sm text-[var(--text-primary)] mb-1" for="export-start-date">日期範圍</label>
                        <div class="flex gap-2">
                            <input type="date" id="export-start-date" class="glass-panel border-0 rounded p-2 flex-1 text-[var(--text-primary)]" aria-label="開始日期">
                            <span class="text-[var(--text-secondary)] self-center" aria-hidden="true">至</span>
                            <input type="date" id="export-end-date" class="glass-panel border-0 rounded p-2 flex-1 text-[var(--text-primary)]" aria-label="結束日期">
                        </div>
                    </div>
                    <div>
                        <label class="block text-sm text-[var(--text-primary)] mb-1" for="export-type-filter">特定人格類型</label>
                        <input type="text" id="export-type-filter" placeholder="例如: INTJ, ENFP（留空匯出全部）" class="w-full glass-panel border-0 rounded p-2 text-[var(--text-primary)] placeholder-slate-500">
                    </div>
                    <div>
                        <label class="block text-sm text-[var(--text-primary)] mb-2">包含欄位</label>
                        <div class="flex flex-wrap gap-4">
                            <label class="flex items-center gap-2 text-[var(--text-primary)]"><input type="checkbox" id="export-field-name" checked> 姓名/暱稱</label>
                            <label class="flex items-center gap-2 text-[var(--text-primary)]"><input type="checkbox" id="export-field-type" checked> MBTI-64 結果</label>
                            <label class="flex items-center gap-2 text-[var(--text-primary)]"><input type="checkbox" id="export-field-score" checked> 各維度分數</label>
                            <label class="flex items-center gap-2 text-[var(--text-primary)]"><input type="checkbox" id="export-field-time" checked> 作答時間</label>
                        </div>
                    </div>
                    <div class="pt-4 flex gap-3">
                        <button type="button" onclick="AdminEnhanced.exportData('csv')" class="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 rounded-lg transition-colors">匯出 CSV</button>
                        <button type="button" onclick="AdminEnhanced.exportData('json')" class="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded-lg transition-colors">匯出 JSON</button>
                    </div>
                </div>
            </div>
        `;
    }

    // CSV 欄位逃脫：處理雙引號 + 換行符
    function csvCell(v) {
        const s = String(v == null ? '' : v);
        // 若包含任何特殊字元即加引號包起來
        if (/[",\n\r]/.test(s)) {
            return '"' + s.replace(/"/g, '""') + '"';
        }
        return s;
    }

    function exportData(format) {
        const startDate = document.getElementById('export-start-date')?.value || '';
        const endDate   = document.getElementById('export-end-date')?.value   || '';
        const typeStr   = document.getElementById('export-type-filter')?.value || '';
        const typeFilter = typeStr ? typeStr.split(',').map(s => s.trim()).filter(Boolean) : [];
        const dateRange  = { start: startDate, end: endDate };

        adminGasCall('exportFilteredRecords',
            records => {
                if (!records || records.length === 0) {
                    MBTI64Utils.showToast('沒有符合條件的資料', 'warning');
                    return;
                }
                if (format === 'csv') {
                    const headers = ['date','name','mbti','dim5','dim6','E','I','S','N','T','F','J','P','A','O','H','C','version'];
                    const csvRows = [headers.map(csvCell).join(',')];
                    records.forEach(r => {
                        const s = r.scores || {};
                        csvRows.push([
                            r.date, r.name, r.mbti, r.dim5, r.dim6,
                            s.E,s.I,s.S,s.N,s.T,s.F,s.J,s.P,s.A,s.O,s.H,s.C, r.version
                        ].map(csvCell).join(','));
                    });
                    // 使用 \r\n 是 CSV 標準
                    const blob = new Blob(['\uFEFF' + csvRows.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
                    const a = document.createElement('a');
                    a.href = URL.createObjectURL(blob);
                    a.download = `MBTI64_${new Date().toISOString().slice(0,10)}.csv`;
                    a.click();
                    URL.revokeObjectURL(a.href);
                } else {
                    const blob = new Blob([JSON.stringify(records, null, 2)], { type: 'application/json' });
                    const a = document.createElement('a');
                    a.href = URL.createObjectURL(blob);
                    a.download = `MBTI64_${new Date().toISOString().slice(0,10)}.json`;
                    a.click();
                    URL.revokeObjectURL(a.href);
                }
                MBTI64Utils.showToast(`匯出完成（${records.length} 筆）`, 'success');
            },
            err => MBTI64Utils.showError('匯出失敗：' + (err.message || '未知錯誤')),
            _sessionToken, { startDate, endDate }, typeFilter
        );
    }

    return {
        renderEnhancedDashboard,
        render64TypeHeatmap,
        renderItemAnalysis,
        renderFeedbackPanel,
        applyFeedbackFilter,
        renderAdvancedExport,
        exportData,
        restoreAdminPanel
    };
})();
