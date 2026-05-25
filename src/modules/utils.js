
// ==========================================
// MBTI-64 工具函式模組 (Optimized v7)
// ==========================================
//
// 本次優化重點：
//   1. safeLocalSet / safeLocalGet 支援自動分片（超過 0.8MB 自動切塊）
//   2. stripCode 修復多連字符 bug（改用 /-/g）
//   3. normalizeCode / displayCode 作為新推薦 API
//   4. gasRun 加入 timeout 與指數退避重試
//   5. 新增 ThemeManager：集中管理主題切換與通知訂閱者
//   6. 新增 ErrorHandler：toast / modal / silent 三層處理
//   7. JSDoc 型別定義
//
// @typedef {Object} ResultPayload
// @property {Object<string,number>} scores
// @property {string} finalCode
// @property {'A'|'O'} dim5
// @property {'H'|'C'} dim6
// @property {string} sessionToken
// @property {number} totalDuration - ms
// @property {number} questionCount
//
// @typedef {Object} GasCallOptions
// @property {string} fn              - 後端函式名稱
// @property {Array}  [args]          - 參數陣列
// @property {number} [timeout=30000] - 逾時毫秒
// @property {number} [retries=2]     - 重試次數（不含首次）
// @property {Function} [onSuccess]
// @property {Function} [onError]
// ==========================================

(function() {
    'use strict';

    const LS_CHUNK_SIZE = 800 * 1024;      // 0.8MB per chunk
    const LS_MAX_SINGLE = 4 * 1024 * 1024; // 單筆警戒值
    const CHUNK_SUFFIX_N = '__n';
    const CHUNK_SUFFIX_PART = '__p';

    const MBTI64Utils = {

        // ==========================================
        // HTML 逃脫
        // ==========================================
        escapeHtml: function(str) {
            if (str === null || str === undefined) return '';
            return String(str)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;')
                .replace(/`/g, '&#96;')
                .replace(/\//g, '&#x2F;');
        },

        // ==========================================
        // 陣列洗牌
        // ==========================================
        fisherYatesShuffle: function(arr) {
            const result = [...arr];
            for (let i = result.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [result[i], result[j]] = [result[j], result[i]];
            }
            return result;
        },

        // ==========================================
        // 分數 / 狀態初始化
        // ==========================================
        createFreshScores: function() {
            return { E:0, I:0, S:0, N:0, T:0, F:0, J:0, P:0, A:0, O:0, H:0, C:0 };
        },

        createFreshState: function() {
            return {
                currentStep: 0,
                scores: this.createFreshScores(),
                times: { E:0, I:0, S:0, N:0, T:0, F:0, J:0, P:0, A:0, O:0, H:0, C:0 },
                counts: { E:0, I:0, S:0, N:0, T:0, F:0, J:0, P:0, A:0, O:0, H:0, C:0 },
                history: [],
                isAnimating: false,
                finalUserName: '匿名',
                shuffledQuestions: [],
                finalCode: '',
                finalDim5: '',
                finalDim6: ''
            };
        },

        textToHtml: function(raw) {
            if (!raw) return '';
            return this.escapeHtml(raw)
                .replace(/\n/g, '<br>')
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/__(.*?)__/g, '<em>$1</em>');
        },

        // ==========================================
        // [優化] localStorage：自動分片 + 安全回收
        // ==========================================
        /**
         * 將資料寫入 localStorage，超過 0.8MB 自動分片為多個 key。
         * 記錄會以 key__n (片數) + key__p0..p(n-1) 形式儲存。
         */
        safeLocalSet: function(key, value) {
            try {
                const serialized = typeof value === 'string' ? value : JSON.stringify(value);

                // 小於 chunk size：單筆儲存（且先移除舊分片避免殘留）
                if (serialized.length < LS_CHUNK_SIZE) {
                    this._clearChunks(key);
                    localStorage.setItem(key, serialized);
                    return true;
                }

                // 過大：主動警告但繼續嘗試分片
                if (serialized.length > LS_MAX_SINGLE) {
                    console.warn('[safeLocalSet] very large payload:', key, serialized.length);
                }

                // 分片儲存
                return this._writeChunked(key, serialized);

            } catch (e) {
                return this._handleQuotaError(e, key, value);
            }
        },

        /**
         * 讀取 localStorage，若是分片儲存的值會自動重組。
         */
        safeLocalGet: function(key, defaultValue = null) {
            try {
                // 優先嘗試分片讀取
                const chunkCountRaw = localStorage.getItem(key + CHUNK_SUFFIX_N);
                if (chunkCountRaw) {
                    const n = parseInt(chunkCountRaw, 10);
                    if (!Number.isFinite(n) || n <= 0) return defaultValue;
                    let combined = '';
                    for (let i = 0; i < n; i++) {
                        const part = localStorage.getItem(key + CHUNK_SUFFIX_PART + i);
                        if (part === null) return defaultValue;
                        combined += part;
                    }
                    return combined;
                }
                const raw = localStorage.getItem(key);
                return raw === null ? defaultValue : raw;
            } catch (e) {
                console.error('[safeLocalGet] error:', e);
                return defaultValue;
            }
        },

        /**
         * 解析 JSON 並支援分片讀取
         */
        safeLocalGetJSON: function(key, defaultValue = null) {
            const raw = this.safeLocalGet(key, null);
            if (raw === null) return defaultValue;
            try { return JSON.parse(raw); } catch (e) { return defaultValue; }
        },

        /**
         * 刪除一個 key（含所有分片）
         */
        safeLocalRemove: function(key) {
            try {
                localStorage.removeItem(key);
                this._clearChunks(key);
                return true;
            } catch (e) { return false; }
        },

        /**
         * 清理超過 N 天未使用的歷史紀錄（LRU）
         * 只作用於含 mbti64_history 的鍵。
         */
        purgeOldRecords: function(maxDays = 180) {
            try {
                const hist = this.safeLocalGetJSON('mbti64_history', []);
                if (!Array.isArray(hist) || hist.length === 0) return 0;
                const cutoff = Date.now() - maxDays * 86400 * 1000;
                const kept = hist.filter(r => {
                    const t = r && r.timestamp ? new Date(r.timestamp).getTime() : 0;
                    return t === 0 || t >= cutoff;
                });
                if (kept.length !== hist.length) {
                    this.safeLocalSet('mbti64_history', kept);
                    return hist.length - kept.length;
                }
                return 0;
            } catch (e) { return 0; }
        },

        _writeChunked: function(key, serialized) {
            const n = Math.ceil(serialized.length / LS_CHUNK_SIZE);
            this._clearChunks(key);
            // 先寫片數再寫內容，讀取時才能知道有幾片
            localStorage.setItem(key + CHUNK_SUFFIX_N, String(n));
            for (let i = 0; i < n; i++) {
                localStorage.setItem(
                    key + CHUNK_SUFFIX_PART + i,
                    serialized.substr(i * LS_CHUNK_SIZE, LS_CHUNK_SIZE)
                );
            }
            // 移除可能存在的舊單筆 key，避免歧義
            localStorage.removeItem(key);
            return true;
        },

        _clearChunks: function(key) {
            try {
                const old = localStorage.getItem(key + CHUNK_SUFFIX_N);
                if (old) {
                    const n = parseInt(old, 10) || 0;
                    for (let i = 0; i < n; i++) {
                        localStorage.removeItem(key + CHUNK_SUFFIX_PART + i);
                    }
                    localStorage.removeItem(key + CHUNK_SUFFIX_N);
                }
            } catch (e) {}
        },

        _handleQuotaError: function(e, key, value) {
            if (e && (e.name === 'QuotaExceededError' || e.code === 22 || e.code === 1014)) {
                // 先嘗試 LRU 清理
                const purged = this.purgeOldRecords(90);
                if (purged > 0) {
                    try {
                        const serialized = typeof value === 'string' ? value : JSON.stringify(value);
                        if (serialized.length < LS_CHUNK_SIZE) {
                            localStorage.setItem(key, serialized);
                        } else {
                            this._writeChunked(key, serialized);
                        }
                        return true;
                    } catch (_) {}
                }
                // 最後手段：只保留最近 3 筆歷史
                try {
                    const hist = this.safeLocalGetJSON('mbti64_history', []);
                    if (Array.isArray(hist) && hist.length > 3) {
                        this.safeLocalSet('mbti64_history', hist.slice(0, 3));
                        const serialized = typeof value === 'string' ? value : JSON.stringify(value);
                        if (serialized.length < LS_CHUNK_SIZE) {
                            localStorage.setItem(key, serialized);
                        } else {
                            this._writeChunked(key, serialized);
                        }
                        return true;
                    }
                } catch (_) {}
                console.error('[safeLocalSet] quota exceeded, giving up:', key);
                this.showError && this.showError('儲存空間不足，部分資料無法保存。');
                return false;
            }
            console.error('[safeLocalSet] error:', e);
            return false;
        },

        // ==========================================
        // [優化] MBTI 代碼正規化：修復多連字符 bug
        // ==========================================
        /**
         * 移除所有非字母字元並轉大寫（推薦新 API）
         */
        normalizeCode: function(code) {
            if (!code) return '';
            return String(code).toUpperCase().replace(/[^A-Z]/g, '');
        },

        /**
         * 轉為帶連字符的顯示格式（INTJAH -> INTJ-AH / INTJAHC -> INTJ-AHC）
         */
        displayCode: function(code) {
            const c = this.normalizeCode(code);
            if (c.length >= 5) return c.slice(0, 4) + '-' + c.slice(4);
            return c;
        },

        // 向後相容別名（但修復了舊的多連字符 bug）
        stripCode: function(code) {
            return this.normalizeCode(code);
        },
        formatCode: function(code) {
            return this.displayCode(code);
        },

        // ==========================================
        // 節流 / 防抖
        // ==========================================
        debounce: function(fn, delay) {
            let timeoutId = null;
            return function(...args) {
                if (timeoutId) clearTimeout(timeoutId);
                timeoutId = setTimeout(() => fn.apply(this, args), delay);
            };
        },

        throttle: function(fn, limit) {
            let lastRun = 0;
            return function(...args) {
                const now = Date.now();
                if (now - lastRun >= limit) {
                    fn.apply(this, args);
                    lastRun = now;
                }
            };
        },

        // ==========================================
        // 日期格式化
        // ==========================================
        formatDate: function(date, format = 'short') {
            if (!date) return '';
            const d = new Date(date);
            if (isNaN(d.getTime())) return '';
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const dd = String(d.getDate()).padStart(2, '0');
            if (format === 'short') return `${y}-${m}-${dd}`;
            if (format === 'full') {
                const h = String(d.getHours()).padStart(2, '0');
                const mi = String(d.getMinutes()).padStart(2, '0');
                const se = String(d.getSeconds()).padStart(2, '0');
                return `${y}-${m}-${dd} ${h}:${mi}:${se}`;
            }
            return d.toLocaleDateString('zh-TW');
        },

        // ==========================================
        // Toast
        // ==========================================
        showToast: function(message, type = 'info', duration = 3000) {
            const toastContainer = this._getOrCreateToastContainer();
            const toast = document.createElement('div');
            toast.className = `toast-item toast-${type} animate-fade-in`;
            toast.setAttribute('role', type === 'error' ? 'alert' : 'status');
            toast.setAttribute('aria-live', type === 'error' ? 'assertive' : 'polite');

            let icon = '✓';
            let bgClass = 'bg-emerald-500/90';
            if (type === 'error') { icon = '✕'; bgClass = 'bg-red-500/90'; }
            else if (type === 'warning') { icon = '⚠'; bgClass = 'bg-yellow-500/90'; }
            else if (type === 'info') { icon = 'ℹ'; bgClass = 'bg-blue-500/90'; }

            toast.innerHTML = `
                <div class="${bgClass} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 max-w-sm">
                    <span class="text-lg font-bold">${icon}</span>
                    <span>${this.escapeHtml(message)}</span>
                </div>
            `;

            toastContainer.appendChild(toast);
            setTimeout(() => {
                toast.classList.add('animate-fade-out');
                setTimeout(() => toast.remove(), 300);
            }, duration);
        },

        showError: function(message) {
            this.showToast(message, 'error', 5000);
        },

        _getOrCreateToastContainer: function() {
            let container = document.getElementById('toast-container');
            if (!container) {
                container = document.createElement('div');
                container.id = 'toast-container';
                container.className = 'fixed top-4 right-4 z-50 flex flex-col gap-2';
                container.setAttribute('aria-live', 'polite');
                document.body.appendChild(container);
            }
            return container;
        },

        // ==========================================
        // [優化] gasRun：加入 timeout + 指數退避重試
        // ==========================================
        /**
         * 呼叫 Google Apps Script 函式（基礎版，保持向後相容）
         */
        gasRun: function(fnName, ...args) {
            return this.gasCall({ fn: fnName, args: args });
        },

        /**
         * 進階呼叫：支援 timeout / retries
         * @param {GasCallOptions} opts
         */
        gasCall: function(opts) {
            const { fn, args = [], timeout = 30000, retries = 2 } = opts || {};

            const attempt = (remaining, backoff) => new Promise((resolve, reject) => {
                const url = window.GAS_WEB_APP_URL; // Set this in index.html or .env
                if (!url) {
                    console.warn('[gasCall] window.GAS_WEB_APP_URL is not set, fallback null for', fn);
                    resolve(null);
                    return;
                }

                let settled = false;
                const timer = setTimeout(() => {
                    if (settled) return;
                    settled = true;
                    reject(new Error('GAS_TIMEOUT:' + fn));
                }, timeout);

                fetch(url, {
                    method: 'POST',
                    body: JSON.stringify({ action: fn, args: args }),
                    headers: { 'Content-Type': 'text/plain' } // Use text/plain to avoid preflight
                })
                .then(res => res.json())
                .then(result => {
                    if (settled) return;
                    settled = true;
                    clearTimeout(timer);
                    if (result && result.success) {
                        resolve(result.data !== undefined ? result.data : result);
                    } else {
                        reject(new Error(result ? result.error : 'API_ERROR'));
                    }
                })
                .catch(err => {
                    if (settled) return;
                    settled = true;
                    clearTimeout(timer);
                    reject(err);
                });
            });

            const run = (remaining, backoff) => attempt(remaining, backoff).catch(err => {
                if (remaining <= 0) throw err;
                console.warn('[gasCall] retrying', fn, 'in', backoff, 'ms, remaining:', remaining);
                return new Promise(r => setTimeout(r, backoff))
                    .then(() => run(remaining - 1, backoff * 2));
            });

            return run(retries, 1000);
        },

        generateUID: function() {
            return 'uid_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        },

        calculatePercentage: function(value, total) {
            if (total === 0) return 0;
            return Math.round((value / total) * 100);
        }
    };

    // ==========================================
    // [新增] ThemeManager：集中管理主題
    // ==========================================
    const ThemeManager = (function() {
        const subscribers = new Set();
        let currentTheme = null;

        function detect() {
            const root = document.documentElement;
            return root.getAttribute('data-theme')
                || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
        }

        function readCssVar(name, fallback = '') {
            try {
                return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
            } catch (e) { return fallback; }
        }

        function notify() {
            subscribers.forEach(fn => {
                try { fn(currentTheme); } catch (e) { console.error('[ThemeManager] subscriber error:', e); }
            });
        }

        function init() {
            currentTheme = detect();
            // 監聽 data-theme 變化
            if (typeof MutationObserver !== 'undefined') {
                const obs = new MutationObserver(() => {
                    const next = detect();
                    if (next !== currentTheme) {
                        currentTheme = next;
                        notify();
                    }
                });
                obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class'] });
            }
            // 監聽系統主題（若未顯式設定 data-theme）
            if (window.matchMedia) {
                try {
                    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
                        if (!document.documentElement.getAttribute('data-theme')) {
                            currentTheme = detect();
                            notify();
                        }
                    });
                } catch (e) {}
            }
        }

        return {
            init: init,
            get: () => currentTheme || detect(),
            isDark: () => (currentTheme || detect()) === 'dark',
            subscribe: (fn) => { subscribers.add(fn); return () => subscribers.delete(fn); },
            readCssVar: readCssVar,
            /**
             * 取得當前主題相容的圖表配色
             */
            chartColors: function() {
                const isDark = this.isDark();
                return {
                    text:   readCssVar('--text-primary',   isDark ? '#f3f4f6' : '#1f2937'),
                    muted:  readCssVar('--text-secondary', isDark ? '#9ca3af' : '#6b7280'),
                    bg:     readCssVar('--bg-primary',     isDark ? '#111827' : '#ffffff'),
                    grid:   readCssVar('--border-color',   isDark ? '#374151' : '#e5e7eb'),
                    accent: readCssVar('--accent-color',   '#3b82f6'),
                    heatBase: isDark ? 'rgba(59, 130, 246,' : 'rgba(37, 99, 235,'
                };
            }
        };
    })();

    // ==========================================
    // [新增] ErrorHandler：統一錯誤處理
    // ==========================================
    const ErrorHandler = {
        /**
         * @param {Error|string} err
         * @param {Object} [opts] - { level: 'toast'|'modal'|'silent', context: string }
         */
        handle: function(err, opts = {}) {
            const level = opts.level || 'toast';
            const msg = this.humanize(err);
            const context = opts.context ? `[${opts.context}] ` : '';
            console.error(context + 'Error:', err);

            if (level === 'silent') return;

            if (level === 'modal' && typeof document !== 'undefined') {
                return this._showModal(context + msg);
            }
            MBTI64Utils.showError(context + msg);
        },

        humanize: function(err) {
            if (!err) return '發生未知錯誤';
            if (typeof err === 'string') return err;
            if (err.message) {
                if (err.message.startsWith('GAS_TIMEOUT')) return '伺服器回應逾時，請稍後再試';
                if (err.message.includes('NetworkError') || err.message.includes('Failed to fetch')) return '網路連線異常';
                return err.message;
            }
            return String(err);
        },

        _showModal: function(message) {
            const overlay = document.createElement('div');
            overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:9999;display:flex;align-items:center;justify-content:center;';
            overlay.setAttribute('role', 'dialog');
            overlay.setAttribute('aria-modal', 'true');
            overlay.innerHTML = `
                <div style="background:var(--bg-primary,#fff);color:var(--text-primary,#000);padding:24px 28px;border-radius:12px;max-width:420px;box-shadow:0 10px 40px rgba(0,0,0,.3);">
                    <h3 style="margin:0 0 12px;font-size:18px;font-weight:700;">發生錯誤</h3>
                    <p style="margin:0 0 16px;line-height:1.6;">${MBTI64Utils.escapeHtml(message)}</p>
                    <button type="button" style="padding:8px 20px;background:var(--accent-color,#3b82f6);color:#fff;border:none;border-radius:6px;cursor:pointer;float:right;">確定</button>
                </div>`;
            const btn = overlay.querySelector('button');
            btn.addEventListener('click', () => overlay.remove());
            document.body.appendChild(overlay);
            btn.focus();
        }
    };

    // ==========================================
    // 全域錯誤監聽
    // ==========================================
    window.addEventListener('error', function(event) {
        console.error('[Global] error:', event.error || event.message);
    });

    window.addEventListener('unhandledrejection', function(event) {
        console.error('[Global] unhandled promise rejection:', event.reason);
    });

    // 等 DOM 就緒後初始化 ThemeManager
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => ThemeManager.init());
    } else {
        ThemeManager.init();
    }

    // ==========================================
    // [v7] callApi - 統一後端呼叫包裝
    // ==========================================
    /**
     * 包裝 gasCall，自動處理 { success, code, message, data } 回應格式
     * @param {string} fn - 後端函式名
     * @param {Array} args - 參數
     * @param {Object} [opts] - { silent: 不顯示 toast, level: 'toast'|'modal'|'silent' }
     * @returns {Promise<any>} 解開後的 data
     */
    MBTI64Utils.callApi = function(fn, args = [], opts = {}) {
        return MBTI64Utils.gasCall({ fn: fn, args: args, timeout: opts.timeout || 30000, retries: opts.retries ?? 1 })
            .then(res => {
                // 後端可能直接回傳資料（向後相容）或 envelope
                if (res && typeof res === 'object' && 'success' in res) {
                    if (res.success) return res.data !== undefined ? res.data : res;
                    const err = new Error(res.message || res.code || 'API_ERROR');
                    err.code = res.code; err.envelope = res;
                    throw err;
                }
                return res;
            })
            .catch(err => {
                if (opts.silent || opts.level === 'silent') {
                    console.warn('[callApi]', fn, err);
                    throw err;
                }
                ErrorHandler.handle(err, { level: opts.level || 'toast', context: fn });
                throw err;
            });
    };
    window.callApi = MBTI64Utils.callApi.bind(MBTI64Utils);

    // ==========================================
    // [v7] Skeleton Helper
    // ==========================================
    MBTI64Utils.skeleton = {
        line: (cls = '') => `<div class="skel skel-line ${cls}"></div>`,
        card: () => `<div class="skel skel-card"></div>`,
        chart: () => `<div class="skel skel-chart"></div>`,
        circle: () => `<div class="skel skel-circle"></div>`,
        list: (count = 3) => Array(count).fill(0).map(() =>
            `<div style="display:flex;gap:12px;align-items:center;margin-bottom:14px"><div class="skel skel-circle"></div><div style="flex:1"><div class="skel skel-line medium"></div><div class="skel skel-line short"></div></div></div>`
        ).join(''),
        // 將容器替換為骨架，回傳一個 restore 函式
        replace: (containerEl, html) => {
            if (!containerEl) return () => {};
            const original = containerEl.innerHTML;
            containerEl.innerHTML = html;
            return () => { containerEl.innerHTML = original; };
        }
    };

    // ==========================================
    // [v7] FocusTrap - Modal 焦點陷阱
    // ==========================================
    MBTI64Utils.focusTrap = function(container, opts = {}) {
        if (!container) return { release: () => {} };
        const focusableSelectors = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
        const previousActive = document.activeElement;
        const onKeyDown = (e) => {
            if (e.key === 'Escape' && opts.onEscape) { e.preventDefault(); opts.onEscape(); return; }
            if (e.key !== 'Tab') return;
            const items = Array.from(container.querySelectorAll(focusableSelectors)).filter(el => !el.disabled && el.offsetParent !== null);
            if (items.length === 0) return;
            const first = items[0]; const last = items[items.length - 1];
            if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
            else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        };
        container.addEventListener('keydown', onKeyDown);
        // 自動聚焦第一個元素
        setTimeout(() => {
            const first = container.querySelector(focusableSelectors);
            if (first) first.focus();
        }, 50);
        return {
            release: () => {
                container.removeEventListener('keydown', onKeyDown);
                if (previousActive && previousActive.focus) previousActive.focus();
            }
        };
    };

    // ==========================================
    // [v7] TTS（Text-To-Speech，用於認知冥想）
    // ==========================================
    MBTI64Utils.tts = {
        isSupported: () => typeof window !== 'undefined' && 'speechSynthesis' in window,
        speak: (text, opts = {}) => {
            if (!MBTI64Utils.tts.isSupported()) return null;
            window.speechSynthesis.cancel();
            const u = new SpeechSynthesisUtterance(text);
            u.lang = opts.lang || 'zh-TW';
            u.rate = opts.rate ?? 0.9;
            u.pitch = opts.pitch ?? 1;
            u.volume = opts.volume ?? 1;
            if (opts.onEnd) u.onend = opts.onEnd;
            window.speechSynthesis.speak(u);
            return u;
        },
        stop: () => MBTI64Utils.tts.isSupported() && window.speechSynthesis.cancel(),
        pause: () => MBTI64Utils.tts.isSupported() && window.speechSynthesis.pause(),
        resume: () => MBTI64Utils.tts.isSupported() && window.speechSynthesis.resume(),
    };

    // ==========================================
    // [v7] PWA 安裝提示控制
    // ==========================================
    MBTI64Utils.pwa = {
        _deferredPrompt: null,
        canInstall: () => !!MBTI64Utils.pwa._deferredPrompt,
        prompt: async () => {
            const p = MBTI64Utils.pwa._deferredPrompt;
            if (!p) return { outcome: 'unavailable' };
            p.prompt();
            const choice = await p.userChoice;
            MBTI64Utils.pwa._deferredPrompt = null;
            return choice;
        },
        registerSW: (path = './sw.js') => {
            if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                    navigator.serviceWorker.register(path).catch(e => console.warn('[SW] register failed', e));
                });
            }
        }
    };
    if (typeof window !== 'undefined') {
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            MBTI64Utils.pwa._deferredPrompt = e;
            window.dispatchEvent(new CustomEvent('mbti64:pwa-installable'));
        });
    }

    // ==========================================
    // [v7] Hero Orb 暫停（節能）
    // ==========================================
    MBTI64Utils.attachHeroOrbObserver = function() {
        if (typeof IntersectionObserver === 'undefined') return;
        document.querySelectorAll('.hero-particles').forEach(el => {
            const io = new IntersectionObserver((entries) => {
                entries.forEach(e => el.classList.toggle('is-paused', !e.isIntersecting));
            }, { threshold: 0 });
            io.observe(el);
        });
    };
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => MBTI64Utils.attachHeroOrbObserver());
    } else {
        MBTI64Utils.attachHeroOrbObserver();
    }

    // ==========================================
    // [v7] 表單字數計數器（自動處理 maxlength + 顏色狀態）
    // ==========================================
    MBTI64Utils.attachInputCounter = function(input, counterEl, max) {
        if (!input || !counterEl) return;
        const update = () => {
            const len = input.value.length;
            counterEl.textContent = `${len} / ${max}`;
            const ratio = len / max;
            if (ratio >= 1) {
                counterEl.dataset.state = 'over';
                input.dataset.state = 'over';
                input.setAttribute('aria-invalid', 'true');
            } else if (ratio >= 0.85) {
                counterEl.dataset.state = 'approaching';
                input.dataset.state = 'approaching';
                input.removeAttribute('aria-invalid');
            } else {
                delete counterEl.dataset.state;
                delete input.dataset.state;
                input.removeAttribute('aria-invalid');
            }
        };
        input.addEventListener('input', update);
        update();
    };

    // ==========================================
    // [v7] 主題三態切換（dark → light → oled → dark）
    // ==========================================
    MBTI64Utils.cycleTheme = function() {
        const cur = document.documentElement.getAttribute('data-theme') || 'dark';
        const next = cur === 'dark' ? 'light' : cur === 'light' ? 'oled' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        try { localStorage.setItem('mbti64_theme', next); } catch(_) {}
        return next;
    };

    // ==========================================
    // [v7] 相對時間（"3 天前"）
    // ==========================================
    MBTI64Utils.relTime = function(date) {
        const d = new Date(date);
        if (isNaN(d.getTime())) return '';
        const diff = (Date.now() - d.getTime()) / 1000; // seconds
        if (diff < 60) return '剛剛';
        if (diff < 3600) return `${Math.floor(diff / 60)} 分鐘前`;
        if (diff < 86400) return `${Math.floor(diff / 3600)} 小時前`;
        if (diff < 604800) return `${Math.floor(diff / 86400)} 天前`;
        if (diff < 2592000) return `${Math.floor(diff / 604800)} 週前`;
        if (diff < 31536000) return `${Math.floor(diff / 2592000)} 個月前`;
        return `${Math.floor(diff / 31536000)} 年前`;
    };

    // ==========================================
    // [v7] CSRF Token 管理
    // ==========================================
    MBTI64Utils.csrf = {
        _token: null,
        get: () => MBTI64Utils.csrf._token,
        set: (t) => { MBTI64Utils.csrf._token = t; try { sessionStorage.setItem('mbti64_csrf', t); } catch(_){} },
        load: async () => {
            try {
                const cached = sessionStorage.getItem('mbti64_csrf');
                if (cached) { MBTI64Utils.csrf._token = cached; return cached; }
            } catch(_) {}
            try {
                const t = await MBTI64Utils.callApi('issueCsrfToken', [], { silent: true });
                MBTI64Utils.csrf.set(t);
                return t;
            } catch(_) { return null; }
        }
    };

    // ==========================================
    // 匯出
    // ==========================================
    window.MBTI64Utils   = MBTI64Utils;
    window.ThemeManager  = ThemeManager;
    window.ErrorHandler  = ErrorHandler;

    // 便捷全域別名（保持向後相容）
    window.escapeHtml    = MBTI64Utils.escapeHtml.bind(MBTI64Utils);
    window.gasRun        = MBTI64Utils.gasRun.bind(MBTI64Utils);
    window.gasCall       = MBTI64Utils.gasCall.bind(MBTI64Utils);
    window.showToast     = MBTI64Utils.showToast.bind(MBTI64Utils);
    window.showError     = MBTI64Utils.showError.bind(MBTI64Utils);
    window.safeLocalSet  = MBTI64Utils.safeLocalSet.bind(MBTI64Utils);
    window.safeLocalGet  = MBTI64Utils.safeLocalGet.bind(MBTI64Utils);
    window.safeLocalGetJSON = MBTI64Utils.safeLocalGetJSON.bind(MBTI64Utils);
    window.formatDate    = MBTI64Utils.formatDate.bind(MBTI64Utils);
    window.generateUID   = MBTI64Utils.generateUID.bind(MBTI64Utils);
    window.normalizeCode = MBTI64Utils.normalizeCode.bind(MBTI64Utils);
    window.displayCode   = MBTI64Utils.displayCode.bind(MBTI64Utils);

})();
