
// ==========================================
// AI 人格教練模組 (#8)
// ==========================================
window.AICoachModule = (function() {
    'use strict';

    function _esc(str) {
        if (typeof MBTI64Utils !== 'undefined') return MBTI64Utils.escapeHtml(str);
        return String(str||'').replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
    }

    let chatHistory = [];
    let isTyping = false;

    function renderCoachScreen() {
        const fs = window._showFeatureScreen ? window._showFeatureScreen() : null;
        if (!fs) return;

        const historyData = JSON.parse((typeof safeLocalGet === 'function' ? safeLocalGet('mbti64_history') : localStorage.getItem('mbti64_history')) || '[]');
        const lastType = historyData.length > 0 ? (historyData[0].fullCode || '') : '';
        const mbtiLabel = lastType ? `[${lastType}]` : '';

        fs.innerHTML = `
            <div class="p-4 md:p-6 flex flex-col h-full max-h-[85vh] fade-in-up">
                <div class="text-center mb-4 flex-none">
                    <div class="inline-block px-4 py-1 rounded-full glass-panel text-fuchsia-300 text-xs font-bold tracking-widest uppercase mb-2 mx-auto">AI Personal Coach</div>
                    <h1 class="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-indigo-400">專屬 AI 人格教練</h1>
                    <p class="text-slate-400 text-xs mt-1">基於你的 ${mbtiLabel} 性格，提供客製化深度建議</p>
                </div>

                <div class="flex-1 glass-panel rounded-2xl p-4 flex flex-col overflow-hidden w-full max-w-2xl mx-auto border border-fuchsia-500/20 relative">
                    <div id="ai-chat-box" class="flex-1 overflow-y-auto custom-scrollbar space-y-4 mb-4 pr-2">
                        <!-- Initial Message -->
                        <div class="flex items-start gap-3 w-[90%]">
                            <div class="w-8 h-8 rounded-full bg-gradient-to-br from-fuchsia-500 to-indigo-500 flex items-center justify-center flex-none shadow-[0_0_10px_rgba(217,70,239,0.3)]">
                                <span class="text-sm">🤖</span>
                            </div>
                            <div class="glass-panel bg-slate-800/80 rounded-2xl rounded-tl-sm p-3 border border-fuchsia-500/20 text-sm text-slate-200 leading-relaxed shadow-lg">
                                你好！我是你的專屬 AI 人格教練。我已經了解了你的性格特質。你有什麼想討論的嗎？（例如：職涯發展、人際溝通、或是最近遇到的煩惱？）
                            </div>
                        </div>
                    </div>
                    
                    <!-- Pre-defined prompts -->
                    <div id="ai-quick-prompts" class="flex flex-wrap gap-2 mb-3 flex-none">
                        <button onclick="AICoachModule.sendMsg('我最近壓力很大，以我的性格該如何調適？')" class="text-[10px] md:text-xs px-3 py-1.5 rounded-full bg-fuchsia-500/10 text-fuchsia-300 border border-fuchsia-500/30 hover:bg-fuchsia-500/20 transition-colors">如何調適壓力？</button>
                        <button onclick="AICoachModule.sendMsg('根據我的性格，我適合什麼樣的潛力職業？')" class="text-[10px] md:text-xs px-3 py-1.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/20 transition-colors">適合的職業？</button>
                        <button onclick="AICoachModule.sendMsg('我的性格在感情中最容易遇到什麼瓶頸？')" class="text-[10px] md:text-xs px-3 py-1.5 rounded-full bg-pink-500/10 text-pink-300 border border-pink-500/30 hover:bg-pink-500/20 transition-colors">感情瓶頸？</button>
                    </div>

                    <div class="flex gap-2 flex-none relative">
                        <input type="text" id="ai-chat-input" placeholder="輸入你想問的問題..." class="flex-1 bg-slate-900/80 border border-slate-600 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-fuchsia-500 transition-all" onkeypress="if(event.key === 'Enter') AICoachModule.sendMsg()">
                        <button id="ai-send-btn" onclick="AICoachModule.sendMsg()" class="bg-gradient-to-r from-fuchsia-600 to-indigo-600 text-white p-3 rounded-xl hover:from-fuchsia-500 hover:to-indigo-500 transition-colors shadow-lg">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
                        </button>
                    </div>
                </div>

                <div class="flex gap-3 justify-center max-w-sm mx-auto w-full mt-4 flex-none">
                    <button onclick="window.resetQuiz()" class="flex-1 bg-slate-800 text-slate-200 border border-slate-600 font-bold py-3 px-6 rounded-xl hover:bg-slate-700 transition-all text-sm">返回首頁</button>
                </div>
            </div>
        `;
        
        chatHistory = [];
        isTyping = false;
        
        // Setup Markdown simple parser for AI responses
        window._parseMD = (text) => {
            let html = _esc(text);
            html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="text-fuchsia-300">$1</strong>');
            html = html.replace(/\*(.*?)\*/g, '<em class="text-indigo-200 italic">$1</em>');
            html = html.replace(/n/g, '<br>');
            return html;
        };
    }

    function appendMessage(role, text) {
        const box = document.getElementById('ai-chat-box');
        if (!box) return;

        const msgDiv = document.createElement('div');
        msgDiv.className = role === 'user' 
            ? 'flex items-start gap-3 w-[90%] ml-auto justify-end fade-in-up'
            : 'flex items-start gap-3 w-[90%] fade-in-up';

        if (role === 'user') {
            msgDiv.innerHTML = `
                <div class="glass-panel bg-fuchsia-900/40 rounded-2xl rounded-tr-sm p-3 border border-fuchsia-500/30 text-sm text-slate-100 leading-relaxed shadow-lg break-words">
                    ${_esc(text)}
                </div>
            `;
        } else if (role === 'ai') {
            msgDiv.innerHTML = `
                <div class="w-8 h-8 rounded-full bg-gradient-to-br from-fuchsia-500 to-indigo-500 flex items-center justify-center flex-none shadow-[0_0_10px_rgba(217,70,239,0.3)] mt-1">
                    <span class="text-sm">🤖</span>
                </div>
                <div class="glass-panel bg-slate-800/80 rounded-2xl rounded-tl-sm p-3 border border-fuchsia-500/20 text-sm text-slate-200 leading-relaxed shadow-lg break-words prose prose-invert prose-sm max-w-none">
                    ${window._parseMD(text)}
                </div>
            `;
        } else if (role === 'loading') {
            msgDiv.id = 'ai-loading-indicator';
            msgDiv.innerHTML = `
                <div class="w-8 h-8 rounded-full bg-gradient-to-br from-fuchsia-500 to-indigo-500 flex items-center justify-center flex-none shadow-[0_0_10px_rgba(217,70,239,0.3)] mt-1">
                    <span class="text-sm animate-pulse">🤖</span>
                </div>
                <div class="glass-panel bg-slate-800/80 rounded-2xl rounded-tl-sm p-3 border border-fuchsia-500/20 flex gap-1 items-center h-10 shadow-lg">
                    <div class="w-2 h-2 bg-fuchsia-400 rounded-full animate-bounce" style="animation-delay: 0ms"></div>
                    <div class="w-2 h-2 bg-fuchsia-400 rounded-full animate-bounce" style="animation-delay: 150ms"></div>
                    <div class="w-2 h-2 bg-fuchsia-400 rounded-full animate-bounce" style="animation-delay: 300ms"></div>
                </div>
            `;
        }

        box.appendChild(msgDiv);
        box.scrollTop = box.scrollHeight;
    }

    function removeLoading() {
        const loader = document.getElementById('ai-loading-indicator');
        if (loader) loader.remove();
    }

    function sendMsg(predefinedText = null) {
        if (isTyping) return;
        
        const input = document.getElementById('ai-chat-input');
        const text = predefinedText || (input ? input.value.trim() : '');
        
        if (!text) return;
        if (input) input.value = '';
        
        const historyData = JSON.parse((typeof safeLocalGet === 'function' ? safeLocalGet('mbti64_history') : localStorage.getItem('mbti64_history')) || '[]');
        const lastType = historyData.length > 0 ? (historyData[0].fullCode || '') : '';
        
        if (!lastType) {
            if (typeof showToast === 'function') showToast('請先完成至少一次測驗！', 'error');
            return;
        }

        // Hide quick prompts after first interaction
        const prompts = document.getElementById('ai-quick-prompts');
        if (prompts) prompts.style.display = 'none';

        isTyping = true;
        appendMessage('user', text);
        appendMessage('loading');

        const token = window.adminSessionToken || localStorage.getItem('mbti64_admin_token') || 'anon';

        if (typeof gasCall === 'function') {
            gasCall({
                fn: 'askAICoach',
                args: [lastType, text, token],
                success: function(res) {
                    removeLoading();
                    isTyping = false;
                    if (res && res.success) {
                        appendMessage('ai', res.answer);
                    } else {
                        appendMessage('ai', '❌ ' + (res.message || '發生錯誤，請稍後再試。'));
                    }
                },
                error: function(err) {
                    removeLoading();
                    isTyping = false;
                    appendMessage('ai', '⚠️ 網路連線錯誤或系統超載，請稍後再試。');
                }
            });
        } else {
            removeLoading();
            isTyping = false;
            appendMessage('ai', '⚠️ 系統連線模組未就緒。');
        }
    }

    return { renderCoachScreen, sendMsg };
})();
