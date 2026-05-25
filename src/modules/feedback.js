
// ==========================================
// MBTI-64 結果反饋模組 (Optimized v7)
//
// 本次優化：
//   1. shouldShowFeedbackForm：本次隨機決策寫入 sessionStorage，避免同一階段重複隨機
//   2. 新增「不再顯示」永久略過選項
//   3. 離線同步改為「逐筆移除成功者」+ 指數退避重試
//   4. 提交錯誤情境統一還原按鈕狀態
//   5. 追蹤「最後同步時間」，背景週期性重試
// ==========================================

(function() {
    'use strict';

    const LS_SUBMITTED_PREFIX = 'mbti64_feedback_submitted_';
    const LS_OFFLINE_QUEUE    = 'mbti64_offline_feedback';
    const LS_DISMISS_FOREVER  = 'mbti64_feedback_dismiss_forever';
    const SS_DECISION_PREFIX  = 'mbti64_feedback_decision_';   // sessionStorage
    const SS_DISMISS_SESSION  = 'mbti64_feedback_dismiss_session';
    const LS_LAST_SYNC_AT     = 'mbti64_feedback_last_sync_at';

    // 指數退避序列（毫秒）
    const RETRY_BACKOFF = [60 * 1000, 5 * 60 * 1000, 15 * 60 * 1000];

    function ssGet(key) {
        try { return sessionStorage.getItem(key); } catch (e) { return null; }
    }
    function ssSet(key, val) {
        try { sessionStorage.setItem(key, val); } catch (e) {}
    }

    const FeedbackModule = {

        currentRating: 0,
        _syncInProgress: false,

        renderFeedbackForm: function(mbtiCode) {
            if (!this.shouldShowFeedbackForm(mbtiCode)) return;

            const resultScreen = document.getElementById('screen-result');
            if (!resultScreen) return;

            if (resultScreen.querySelector('#feedback-form-container')) {
                return;
            }

            const safeCode = MBTI64Utils.escapeHtml(mbtiCode);

            const feedbackContainer = document.createElement('div');
            feedbackContainer.id = 'feedback-form-container';
            feedbackContainer.className = 'w-full relative z-10 mb-6 fade-in-up';
            feedbackContainer.setAttribute('role', 'region');
            feedbackContainer.setAttribute('aria-label', '結果準確度反饋');
            feedbackContainer.innerHTML = `
                <div class="glass-panel p-6 rounded-xl border-l-4 border-amber-400 bg-amber-900/20">
                    <h3 class="text-base font-bold text-amber-300 mb-1 flex items-center gap-2">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1m2-1v2.5M3 7l2 1M5 7l2-1m-2 1v2.5"></path>
                        </svg>
                        這個結果準確嗎？
                    </h3>
                    <p class="text-xs text-amber-200 mb-4">你的反饋幫助我們改進測驗準確度</p>

                    <div class="space-y-4">
                        <div>
                            <label class="text-xs text-slate-400 mb-2 block" id="feedback-rating-label">準確度評分</label>
                            <div class="flex gap-2" id="feedback-stars" role="radiogroup" aria-labelledby="feedback-rating-label">
                                ${[1, 2, 3, 4, 5].map(i => `
                                    <button type="button" class="feedback-star text-3xl opacity-50 hover:opacity-100 transition-opacity cursor-pointer"
                                            data-value="${i}"
                                            onclick="window.FeedbackModule.setRating(${i})"
                                            role="radio" aria-checked="false" aria-label="${i} 星">
                                        ⭐
                                    </button>
                                `).join('')}
                            </div>
                        </div>

                        <div>
                            <label class="text-xs text-slate-400 mb-2 block" for="feedback-comment">留下評論（選填）</label>
                            <input type="text" id="feedback-comment"
                                   placeholder="例如：我覺得社交能力部分不太準確..."
                                   maxlength="200"
                                   class="w-full bg-slate-800/50 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-amber-400 placeholder-slate-500">
                            <p class="text-xs text-slate-500 mt-1"><span id="comment-count">0</span>/200</p>
                        </div>

                        <div class="flex gap-2 flex-wrap">
                            <button type="button" id="feedback-submit-btn"
                                    onclick="window.FeedbackModule.submitFeedback('${safeCode}')"
                                    class="flex-1 bg-amber-600 hover:bg-amber-500 text-white font-bold py-2 px-4 rounded-lg transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled>
                                提交反饋
                            </button>
                            <button type="button"
                                    onclick="window.FeedbackModule.skipThisSession()"
                                    class="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-all text-sm">
                                本次略過
                            </button>
                            <button type="button"
                                    onclick="window.FeedbackModule.dismissForever()"
                                    class="px-4 py-2 text-xs text-slate-500 hover:text-slate-300 underline-offset-2 hover:underline transition-colors">
                                不再顯示
                            </button>
                        </div>
                    </div>
                </div>
            `;

            const resultsEnd = resultScreen.querySelector('.p-4:last-of-type') || resultScreen;
            resultsEnd.insertBefore(feedbackContainer, resultsEnd.lastChild);

            const commentInput = document.getElementById('feedback-comment');
            if (commentInput) {
                commentInput.addEventListener('input', function() {
                    const cnt = document.getElementById('comment-count');
                    if (cnt) cnt.textContent = this.value.length;
                    window.FeedbackModule._updateSubmitButtonState();
                });
            }
        },

        setRating: function(value) {
            const stars = document.querySelectorAll('.feedback-star');
            stars.forEach((star, idx) => {
                if (idx < value) {
                    star.classList.add('opacity-100');
                    star.classList.remove('opacity-50');
                    star.setAttribute('aria-checked', 'true');
                } else {
                    star.classList.remove('opacity-100');
                    star.classList.add('opacity-50');
                    star.setAttribute('aria-checked', 'false');
                }
            });
            this.currentRating = value;
            this._updateSubmitButtonState();
        },

        _updateSubmitButtonState: function() {
            const submitBtn = document.getElementById('feedback-submit-btn');
            if (submitBtn) {
                submitBtn.disabled = !this.currentRating || this.currentRating === 0;
            }
        },

        skipThisSession: function() {
            ssSet(SS_DISMISS_SESSION, '1');
            const c = document.getElementById('feedback-form-container');
            if (c) c.style.display = 'none';
        },

        dismissForever: function() {
            try { localStorage.setItem(LS_DISMISS_FOREVER, '1'); } catch (e) {}
            const c = document.getElementById('feedback-form-container');
            if (c) c.style.display = 'none';
            MBTI64Utils.showToast('已設定不再顯示反饋表單', 'info', 2500);
        },

        submitFeedback: async function(mbtiCode) {
            if (!this.currentRating) {
                MBTI64Utils.showError('請先選擇評分');
                return;
            }

            const comment = document.getElementById('feedback-comment')?.value || '';
            const feedbackData = {
                code: mbtiCode,
                rating: this.currentRating,
                comment: comment.trim(),
                timestamp: Date.now(),
                userAgent: navigator.userAgent
            };

            const submitBtn = document.getElementById('feedback-submit-btn');
            const originalText = submitBtn ? submitBtn.textContent : '提交反饋';
            const restoreBtn = () => {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalText;
                }
            };

            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = '提交中...';
            }

            try {
                const result = await MBTI64Utils.gasCall({
                    fn: 'saveFeedback',
                    args: [feedbackData],
                    timeout: 20000,
                    retries: 2
                });

                if (result && result.success !== false) {
                    MBTI64Utils.safeLocalSet(LS_SUBMITTED_PREFIX + mbtiCode, '1');
                    MBTI64Utils.showToast('感謝你的反饋！', 'success', 3000);
                    const formContainer = document.getElementById('feedback-form-container');
                    if (formContainer) formContainer.style.display = 'none';
                } else {
                    const msg = (result && result.message) || '提交失敗，請稍後重試';
                    MBTI64Utils.showError(msg);
                    restoreBtn();
                }
            } catch (e) {
                console.error('[Feedback] submission error:', e);

                // 離線佇列保存
                try {
                    const queue = MBTI64Utils.safeLocalGetJSON(LS_OFFLINE_QUEUE, []);
                    if (Array.isArray(queue)) {
                        queue.push(feedbackData);
                        MBTI64Utils.safeLocalSet(LS_OFFLINE_QUEUE, queue);
                    } else {
                        MBTI64Utils.safeLocalSet(LS_OFFLINE_QUEUE, [feedbackData]);
                    }
                } catch (_) {}

                MBTI64Utils.showToast('反饋已保存，待網路連線後自動上傳', 'info', 4000);

                const formContainer = document.getElementById('feedback-form-container');
                if (formContainer) formContainer.style.display = 'none';

                // 啟動背景重試
                this._scheduleRetry();
            }
        },

        shouldShowFeedbackForm: function(mbtiCode) {
            // 永久關閉
            try {
                if (localStorage.getItem(LS_DISMISS_FOREVER)) return false;
            } catch (e) {}

            // 本次階段關閉
            if (ssGet(SS_DISMISS_SESSION)) return false;

            // 已提交過該代碼
            const hasSubmitted = localStorage.getItem(LS_SUBMITTED_PREFIX + mbtiCode);
            if (hasSubmitted) return false;

            // 本次階段已做過隨機決策
            const decisionKey = SS_DECISION_PREFIX + mbtiCode;
            const stored = ssGet(decisionKey);
            if (stored === 'show') return true;
            if (stored === 'hide') return false;

            const decision = Math.random() < 0.5 ? 'show' : 'hide';
            ssSet(decisionKey, decision);
            return decision === 'show';
        },

        /**
         * 同步離線佇列：逐筆處理，成功者從佇列移除，失敗不中斷其他項目
         */
        syncOfflineFeedback: async function(options = {}) {
            if (this._syncInProgress) return;
            this._syncInProgress = true;
            try {
                let queue = MBTI64Utils.safeLocalGetJSON(LS_OFFLINE_QUEUE, []);
                if (!Array.isArray(queue) || queue.length === 0) return;

                const remaining = [];
                let synced = 0;

                for (const feedback of queue) {
                    try {
                        const result = await MBTI64Utils.gasCall({
                            fn: 'saveFeedback',
                            args: [feedback],
                            timeout: 15000,
                            retries: 1
                        });
                        if (result && result.success !== false) {
                            synced++;
                        } else {
                            // 後端明確拒絕 → 保留但標記失敗次數
                            feedback._fail = (feedback._fail || 0) + 1;
                            if (feedback._fail < 5) remaining.push(feedback);
                            // 失敗 5 次則丟棄，避免無限累積
                        }
                    } catch (e) {
                        // 網路錯誤：保留，繼續下一筆（可能單筆尺寸有問題，不應讓其他也卡住）
                        feedback._fail = (feedback._fail || 0) + 1;
                        if (feedback._fail < 5) remaining.push(feedback);
                    }
                }

                if (remaining.length > 0) {
                    MBTI64Utils.safeLocalSet(LS_OFFLINE_QUEUE, remaining);
                } else {
                    MBTI64Utils.safeLocalRemove(LS_OFFLINE_QUEUE);
                }

                try { localStorage.setItem(LS_LAST_SYNC_AT, String(Date.now())); } catch (_) {}

                if (synced > 0 && !options.silent) {
                    MBTI64Utils.showToast(`已同步 ${synced} 筆離線反饋`, 'success', 2500);
                }

                if (remaining.length > 0) this._scheduleRetry();
            } finally {
                this._syncInProgress = false;
            }
        },

        /**
         * 以指數退避排程下一次重試
         */
        _retryIdx: 0,
        _retryTimer: null,
        _scheduleRetry: function() {
            if (this._retryTimer) return;
            const delay = RETRY_BACKOFF[Math.min(this._retryIdx, RETRY_BACKOFF.length - 1)];
            this._retryTimer = setTimeout(() => {
                this._retryTimer = null;
                this._retryIdx++;
                this.syncOfflineFeedback({ silent: true }).then(() => {
                    const queue = MBTI64Utils.safeLocalGetJSON(LS_OFFLINE_QUEUE, []);
                    if (!Array.isArray(queue) || queue.length === 0) {
                        this._retryIdx = 0;
                    }
                });
            }, delay);
        }
    };

    window.FeedbackModule = FeedbackModule;

    // 頁面載入 + 網路回復時嘗試同步
    window.addEventListener('load', function() {
        FeedbackModule.syncOfflineFeedback({ silent: true });
    });
    window.addEventListener('online', function() {
        FeedbackModule.syncOfflineFeedback();
    });

})();
