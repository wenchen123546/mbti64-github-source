
(function() {
    'use strict';
    function escapeHtml(text) {
        if (typeof window.MBTI64Utils !== 'undefined') return window.MBTI64Utils.escapeHtml(text);
        const map = { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;','`':'&#96;','/':'&#x2F;' };
        return String(text).replace(/[&<>"'`/]/g, m => map[m]);
    }
    const CompatibilityModule = {
        renderCompatScreen: function() {
            const app = document.getElementById('app-container');
            if (!app) return;
            ['screen-start','screen-quiz','screen-loading','screen-result'].forEach(id => { const el = document.getElementById(id); if (el) { el.classList.add('hidden'); el.classList.remove('flex'); } });
            let featureScreen = window._showFeatureScreen ? window._showFeatureScreen() : (() => { let fs = document.getElementById('screen-feature'); if (!fs) { fs = document.createElement('div'); fs.id = 'screen-feature'; app.appendChild(fs); } fs.className = 'flex flex-col w-full flex-1 overflow-y-auto custom-scrollbar'; fs.classList.remove('hidden'); return fs; })();
            const _history = (function() { try { const raw = (typeof safeLocalGet === 'function') ? safeLocalGet('mbti64_history') : localStorage.getItem('mbti64_history'); return raw ? JSON.parse(raw) : []; } catch(e) { return []; } })();
            const _latestResult = _history.length > 0 ? _history[0] : null;
            const mbtiOpts = ['INTJ','INTP','ENTJ','ENTP','INFJ','INFP','ENFJ','ENFP','ISTJ','ISFJ','ESTJ','ESFJ','ISTP','ISFP','ESTP','ESFP'].map(t => '<option value="' + t + '">' + t + '</option>').join('');
            featureScreen.innerHTML = '<div class="p-6 md:p-10 text-center flex flex-col gap-6 fade-in-up pb-8"><div class="inline-block px-4 py-1 rounded-full glass-panel text-cyan-300 text-xs font-bold tracking-widest uppercase mb-4 mx-auto">配對分析</div><h1 class="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400 mb-2">相容度測試</h1><p class="text-slate-400 text-sm md:text-base mb-8 max-w-lg mx-auto">探索兩個人格類型之間的深度互動與相容度評分</p><div class="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto mb-8"><div class="glass-panel p-6 rounded-2xl"><h3 class="text-sm font-bold text-slate-300 mb-4 uppercase tracking-wide">人物 A ' + (_latestResult ? '<span class="text-[10px] text-cyan-400 font-normal normal-case">(已自動帶入)</span>' : '') + '</h3><select id="compat-mbti-1" class="w-full glass-panel border-0 rounded-lg px-4 py-2 text-sm mb-3 outline-none focus:border-cyan-400"><option value="">選擇 16 型類型</option>' + mbtiOpts + '</select><div class="grid grid-cols-2 gap-2"><div><label class="text-xs text-slate-400 mb-1 block">決策模式</label><select id="compat-dim5-1" class="w-full glass-panel border-0 rounded-lg px-3 py-2 text-xs outline-none focus:border-cyan-400"><option value="A">A 果斷</option><option value="O">O 審慎</option></select></div><div><label class="text-xs text-slate-400 mb-1 block">待人態度</label><select id="compat-dim6-1" class="w-full glass-panel border-0 rounded-lg px-3 py-2 text-xs outline-none focus:border-cyan-400"><option value="H">H 溫暖</option><option value="C">C 理性</option></select></div></div></div><div class="glass-panel p-6 rounded-2xl"><h3 class="text-sm font-bold text-slate-300 mb-4 uppercase tracking-wide">人物 B</h3><select id="compat-mbti-2" class="w-full glass-panel border-0 rounded-lg px-4 py-2 text-sm mb-3 outline-none focus:border-cyan-400"><option value="">選擇 16 型類型</option>' + mbtiOpts + '</select><div class="grid grid-cols-2 gap-2"><div><label class="text-xs text-slate-400 mb-1 block">決策模式</label><select id="compat-dim5-2" class="w-full glass-panel border-0 rounded-lg px-3 py-2 text-xs outline-none focus:border-cyan-400"><option value="A">A 果斷</option><option value="O">O 審慎</option></select></div><div><label class="text-xs text-slate-400 mb-1 block">待人態度</label><select id="compat-dim6-2" class="w-full glass-panel border-0 rounded-lg px-3 py-2 text-xs outline-none focus:border-cyan-400"><option value="H">H 溫暖</option><option value="C">C 理性</option></select></div></div></div></div><div class="flex gap-3 max-w-sm mx-auto w-full"><button onclick="window.CompatibilityModule.analyzeCompatibility()" class="flex-1 bg-gradient-to-r from-cyan-500 to-indigo-500 text-white font-bold py-3 px-6 rounded-xl hover:from-cyan-400 hover:to-indigo-400 transition-all duration-300 shadow-[0_0_20px_rgba(56,189,248,0.3)]">分析配對</button><button onclick="window.resetQuiz()" class="bg-slate-800 text-slate-200 border border-slate-600 font-bold py-3 px-6 rounded-xl hover:bg-slate-700 transition-all">返回首頁</button></div></div>';
            if (_latestResult) {
                const m = document.getElementById('compat-mbti-1'), d5 = document.getElementById('compat-dim5-1'), d6 = document.getElementById('compat-dim6-1');
                if (m && _latestResult.baseMbti) m.value = _latestResult.baseMbti;
                if (d5 && _latestResult.dim5) d5.value = _latestResult.dim5;
                if (d6 && _latestResult.dim6) d6.value = _latestResult.dim6;
            }
        },
        analyzeCompatibility: function() {
            const mbti1 = document.getElementById('compat-mbti-1')?.value, mbti2 = document.getElementById('compat-mbti-2')?.value;
            const d51 = document.getElementById('compat-dim5-1')?.value || 'A', d52 = document.getElementById('compat-dim5-2')?.value || 'A';
            const d61 = document.getElementById('compat-dim6-1')?.value || 'H', d62 = document.getElementById('compat-dim6-2')?.value || 'H';
            if (!mbti1 || !mbti2) { MBTI64Utils.showError('請選擇兩個人格類型'); return; }
            const code1 = mbti1 + d51 + d61, code2 = mbti2 + d52 + d62;
            const result = this._calculateCompatibility(code1, code2);
            this._renderCompatResult(result, code1, code2);
        },
        _COGNITIVE_STACKS: { 'INTJ':['Ni','Te','Fi','Se'],'INTP':['Ti','Ne','Si','Fe'],'ENTJ':['Te','Ni','Se','Fi'],'ENTP':['Ne','Ti','Fe','Si'],'INFJ':['Ni','Fe','Ti','Se'],'INFP':['Fi','Ne','Si','Te'],'ENFJ':['Fe','Ni','Se','Ti'],'ENFP':['Ne','Fi','Te','Si'],'ISTJ':['Si','Te','Fi','Ne'],'ISFJ':['Si','Fe','Ti','Ne'],'ESTJ':['Te','Si','Ne','Fi'],'ESFJ':['Fe','Si','Ne','Ti'],'ISTP':['Ti','Se','Ni','Fe'],'ISFP':['Fi','Se','Ni','Te'],'ESTP':['Se','Ti','Fe','Ni'],'ESFP':['Se','Fi','Te','Ni'] },
        _PAIR_TYPES: {
            golden: { 'INTJ':'ENFP','ENFP':'INTJ','INTP':'ENTJ','ENTJ':'INTP','INFJ':'ENTP','ENTP':'INFJ','INFP':'ENFJ','ENFJ':'INFP','ISTJ':'ESFP','ESFP':'ISTJ','ISFJ':'ESTP','ESTP':'ISFJ','ESTJ':'ISFP','ISFP':'ESTJ','ESFJ':'ISTP','ISTP':'ESFJ' },
            mirror: { 'INTJ':'ENTP','ENTP':'INTJ','INTP':'ENTJ','ENTJ':'INTP','INFJ':'ENFP','ENFP':'INFJ','INFP':'ENFJ','ENFJ':'INFP','ISTJ':'ESTP','ESTP':'ISTJ','ISFJ':'ESFP','ESFP':'ISFJ','ESTJ':'ISTP','ISTP':'ESTJ','ESFJ':'ISFP','ISFP':'ESFJ' }
        },
        _calculateCompatibility: function(code1, code2) {
            const t1 = this._extractTraits(code1), t2 = this._extractTraits(code2);
            const scores = { communication: this._calcCommunicationScore(t1, t2), decisionMaking: this._calcDecisionScore(t1, t2), cognitiveFunc: this._calcCognitiveFuncScore(t1, t2), lifeRhythm: this._calcLifeRhythmScore(t1, t2), warmth: this._calcWarmthScore(t1, t2) };
            const totalScore = Math.round(scores.communication * 0.18 + scores.decisionMaking * 0.22 + scores.cognitiveFunc * 0.25 + scores.lifeRhythm * 0.18 + scores.warmth * 0.17);
            const pairType = this._identifyPairType(t1.base, t2.base);
            return { code1, code2, totalScore, scores, pairType, analysis: this._generateCompatAnalysis(code1, code2, scores, totalScore, pairType) };
        },
        _extractTraits: function(code) {
            if (code.length < 6) return null;
            return { base: code.slice(0, 4), e_i: code[0], s_n: code[1], t_f: code[2], j_p: code[3], a_o: code[4], h_c: code[5] };
        },
        _identifyPairType: function(b1, b2) {
            if (this._PAIR_TYPES.golden[b1] === b2) return { type:'golden', label:'💛 黃金搭檔', desc:'認知功能完美互補，天生默契組合' };
            if (this._PAIR_TYPES.mirror[b1] === b2) return { type:'mirror', label:'🪞 鏡像搭檔', desc:'相似的世界觀，但表達方式互補' };
            if (b1 === b2) return { type:'identical', label:'🔄 同型搭檔', desc:'心靈深處的共鳴，但需避免盲區疊加' };
            if (b1[0] !== b2[0] && b1[1] !== b2[1] && b1[2] !== b2[2] && b1[3] !== b2[3]) return { type:'shadow', label:'🌗 對影搭檔', desc:'完全對立的視角，挑戰與成長並存' };
            return { type:'standard', label:null, desc:null };
        },
        _calcCommunicationScore: function(t1, t2) { let s = 50; if (t1.e_i === t2.e_i) s += 15; else s += 5; if (t1.h_c === 'H' && t2.h_c === 'H') s += 10; else if (t1.h_c === 'C' && t2.h_c === 'C') s += 8; else s += 12; return Math.min(100, Math.max(0, s)); },
        _calcDecisionScore: function(t1, t2) { let s = 50; if (t1.t_f !== t2.t_f) s += 10; if (t1.a_o !== t2.a_o) s += 15; else s += 8; if (t1.j_p !== t2.j_p) s += 5; return Math.min(100, Math.max(0, s)); },
        _calcCognitiveFuncScore: function(t1, t2) {
            const s1 = this._COGNITIVE_STACKS[t1.base] || [], s2 = this._COGNITIVE_STACKS[t2.base] || [];
            if (!s1.length || !s2.length) return 60;
            let sc = 40;
            if (s2.includes(s1[0])) sc += 12;
            if (s1.includes(s2[0])) sc += 12;
            const shared = s1.filter(f => s2.includes(f)).length;
            if (shared === 2) sc += 15; else if (shared === 1) sc += 10; else if (shared === 3) sc += 5; else sc += 8;
            if (s1[0]?.[0] === s2[0]?.[0] && s1[0]?.[1] !== s2[0]?.[1]) sc += 8;
            return Math.min(100, Math.max(0, sc));
        },
        _calcLifeRhythmScore: function(t1, t2) { let s = 50; if (t1.j_p === t2.j_p) s += 15; else s += 10; if (t1.a_o === t2.a_o) s += 10; else s += 7; return Math.min(100, Math.max(0, s)); },
        _calcWarmthScore: function(t1, t2) { let s = 50; if (t1.h_c === 'H' && t2.h_c === 'H') s += 15; else if (t1.h_c === 'C' && t2.h_c === 'C') s += 12; else s += 10; if (t1.t_f === 'F' || t2.t_f === 'F') s += 5; return Math.min(100, Math.max(0, s)); },
        _generateCompatAnalysis: function(code1, code2, scores, totalScore, pairType) {
            const m1 = code1.slice(0, 4), m2 = code2.slice(0, 4); let a = {};
            if (totalScore >= 85) a.summary = m1 + ' 與 ' + m2 + ' 是天生一對！高度的相容度意味著你們能輕鬆理解彼此的想法與需求，形成強大的互補動力。';
            else if (totalScore >= 70) a.summary = m1 + ' 與 ' + m2 + ' 有良好的相容度。雖然有些差異需要調適，但這些差異往往能帶來新的視角與成長機會。';
            else if (totalScore >= 50) a.summary = m1 + ' 與 ' + m2 + ' 的關係需要一些努力。你們的差異較大，但若願意溝通與包容，反而能形成強大的配合。';
            else a.summary = m1 + ' 與 ' + m2 + ' 的價值觀與做事方式有明顯差異。這不代表不能相處，只是需要更多的耐心與理解。';
            if (pairType && pairType.label) a.pairType = pairType;
            const strengths = [];
            if (scores.communication >= 60) strengths.push('溝通流暢，容易產生心靈共鳴');
            if (scores.decisionMaking >= 65) strengths.push('決策互補，能制衡彼此的盲點');
            if (scores.cognitiveFunc >= 65) strengths.push('認知功能互補，能相互啟發新思維');
            if (scores.cognitiveFunc >= 55) strengths.push('思考方式有交集，理解對方不費力');
            if (scores.lifeRhythm >= 65) strengths.push('生活節奏匹配，日常配合順暢');
            if (scores.warmth >= 65) strengths.push('情感表達同頻，溫暖與理性平衡');
            if (!strengths.length) strengths.push('能夠互相尊重與學習');
            a.strengths = strengths;
            const conflicts = [];
            if (scores.communication < 50) conflicts.push('溝通方式差異可能造成誤會');
            if (scores.decisionMaking < 50) conflicts.push('決策邏輯不同容易產生摩擦');
            if (scores.cognitiveFunc < 45) conflicts.push('認知功能差異大，需要更多耐心理解對方的觀點');
            if (scores.lifeRhythm < 50) conflicts.push('生活步調不一致可能引發沮喪');
            if (!conflicts.length) conflicts.push('需要留意並主動調適的是尊重對方的獨特性');
            a.conflicts = conflicts;
            a.sceneSuggestions = { work: this._getSceneSuggestion('work', scores, pairType), romance: this._getSceneSuggestion('romance', scores, pairType), friendship: this._getSceneSuggestion('friendship', scores, pairType) };
            a.suggestions = ['花時間理解對方的世界觀與價值觀','在衝突時保持好奇而非評判的態度','定期進行深度對話，確保彼此被理解','欣賞你們的差異，將其視為成長機會'];
            return a;
        },
        _getSceneSuggestion: function(scene, scores, pairType) {
            const pt = pairType?.type || 'standard';
            if (scene === 'work') {
                if (scores.cognitiveFunc >= 70) return '工作上你們能形成高效的互補搭檔，一人負責創意發想，一人負責落實執行。';
                if (scores.decisionMaking >= 70) return '在團隊決策中，你們的觀點互補能帶來更全面的考量。';
                if (pt === 'shadow') return '工作上的分歧可能較多，但這正是「魔鬼代言人」的最佳組合，能發現彼此的盲點。';
                return '明確分工並定期同步進度，能讓你們的工作合作更順暢。';
            }
            if (scene === 'romance') {
                if (pt === 'golden') return '你們是 MBTI 理論中經典的黃金配對！自然的吸引力加上深層的認知互補，是令人羨慕的組合。';
                if (scores.warmth >= 70) return '情感上你們高度同步，能自然地感受並回應彼此的需求。';
                if (scores.communication < 50) return '伴侶關係中，主動學習對方的「愛的語言」會大幅提升關係品質。';
                return '定期安排專屬的深度對話時間，是維持浪漫關係品質的關鍵。';
            }
            if (pt === 'identical') return '你們幾乎不需要語言就能理解彼此，但也要小心「回音室效應」。';
            if (pt === 'mirror') return '你們像一面鏡子般映照出對方的潛力，是最能激發彼此成長的友誼。';
            if (scores.lifeRhythm >= 65) return '你們的生活步調一致，是可以一起旅行、一起冒險的好朋友。';
            return '主動邀約對方進入你的世界，會讓友誼更加深厚。';
        },
        _renderCompatResult: function(result, code1, code2) {
            const { totalScore, scores, analysis } = result;
            const scoreColor = totalScore >= 75 ? 'text-emerald-400' : totalScore >= 50 ? 'text-cyan-400' : 'text-amber-400';
            const scoreBg = totalScore >= 75 ? 'from-emerald-600 to-emerald-400' : totalScore >= 50 ? 'from-cyan-600 to-cyan-400' : 'from-amber-600 to-amber-400';
            const featureScreen = document.getElementById('screen-feature');
            if (!featureScreen) return;
            featureScreen.innerHTML = '<div class="p-6 md:p-10 text-center flex flex-col gap-6 fade-in-up pb-8"><h2 class="text-3xl font-black text-cyan-300">配對分析結果</h2><p class="text-slate-400 text-sm">' + MBTI64Utils.escapeHtml(code1) + ' × ' + MBTI64Utils.escapeHtml(code2) + '</p><div class="inline-block mx-auto"><div class="relative w-40 h-40 rounded-full bg-gradient-to-r ' + scoreBg + ' p-1"><div style="width:100%;height:100%;border-radius:9999px;background:var(--bg-base);display:flex;align-items:center;justify-content:center;flex-direction:column"><div class="' + scoreColor + ' text-5xl font-black">' + totalScore + '%</div><div class="text-slate-400 text-xs mt-1">相容度</div></div></div></div><div class="glass-panel p-5 rounded-xl max-w-lg mx-auto w-full"><h3 class="text-sm font-bold text-slate-300 mb-3">雙人雷達疊加圖</h3><div class="h-56 w-full relative"><canvas id="compat-radar-chart"></canvas></div></div><div class="glass-panel p-5 rounded-xl space-y-3 max-w-lg mx-auto"><h3 class="text-sm font-bold text-slate-300 mb-3">各面向評分</h3>' + this._renderScoreBars(scores) + '</div><div class="space-y-4 max-w-lg mx-auto">' +
                (analysis.pairType ? '<div class="glass-panel p-4 rounded-xl border-l-4 border-purple-400 text-center"><div class="text-2xl mb-1">' + analysis.pairType.label + '</div><p class="text-xs text-purple-300/80 font-light">' + MBTI64Utils.escapeHtml(analysis.pairType.desc) + '</p></div>' : '') +
                '<div class="glass-panel p-4 rounded-xl border-l-4 border-cyan-400"><h4 class="text-sm font-bold text-cyan-300 mb-2">整體評價</h4><p class="text-sm text-slate-300 font-light leading-relaxed">' + MBTI64Utils.escapeHtml(analysis.summary) + '</p></div><div class="glass-panel p-4 rounded-xl border-l-4 border-emerald-400"><h4 class="text-sm font-bold text-emerald-300 mb-2">+ 互動優勢</h4><ul class="text-sm text-slate-300 font-light space-y-1 list-disc pl-5">' + analysis.strengths.map(s => '<li>' + MBTI64Utils.escapeHtml(s) + '</li>').join('') + '</ul></div><div class="glass-panel p-4 rounded-xl border-l-4 border-amber-400"><h4 class="text-sm font-bold text-amber-300 mb-2">⚠ 潛在衝突</h4><ul class="text-sm text-slate-300 font-light space-y-1 list-disc pl-5">' + analysis.conflicts.map(c => '<li>' + MBTI64Utils.escapeHtml(c) + '</li>').join('') + '</ul></div>' +
                (analysis.sceneSuggestions ? '<div class="glass-panel p-4 rounded-xl border-l-4 border-pink-400"><h4 class="text-sm font-bold text-pink-300 mb-3">🎭 場景化建議</h4><div class="space-y-3"><div class="flex gap-2 items-start"><span class="text-sm flex-none">💼</span><div><span class="text-xs font-bold text-slate-300 block mb-0.5">工作搭檔</span><p class="text-xs text-slate-400 font-light leading-relaxed">' + MBTI64Utils.escapeHtml(analysis.sceneSuggestions.work) + '</p></div></div><div class="flex gap-2 items-start"><span class="text-sm flex-none">❤️</span><div><span class="text-xs font-bold text-slate-300 block mb-0.5">戀愛關係</span><p class="text-xs text-slate-400 font-light leading-relaxed">' + MBTI64Utils.escapeHtml(analysis.sceneSuggestions.romance) + '</p></div></div><div class="flex gap-2 items-start"><span class="text-sm flex-none">🤝</span><div><span class="text-xs font-bold text-slate-300 block mb-0.5">友情經營</span><p class="text-xs text-slate-400 font-light leading-relaxed">' + MBTI64Utils.escapeHtml(analysis.sceneSuggestions.friendship) + '</p></div></div></div></div>' : '') +
                '<div class="glass-panel p-4 rounded-xl border-l-4 border-indigo-400"><h4 class="text-sm font-bold text-indigo-300 mb-2">💡 相處建議</h4><ol class="text-sm text-slate-300 font-light space-y-1 list-decimal pl-5">' + analysis.suggestions.map(s => '<li>' + MBTI64Utils.escapeHtml(s) + '</li>').join('') + '</ol></div></div><div class="flex gap-2 justify-center mt-4 pb-8"><button onclick="window.CompatibilityModule.renderCompatScreen()" class="bg-slate-800 text-slate-200 border border-slate-600 font-bold py-2 px-6 rounded-xl hover:bg-slate-700 transition-all text-sm">新增配對</button><button onclick="window.resetQuiz()" class="bg-cyan-600 text-white font-bold py-2 px-6 rounded-xl hover:bg-cyan-500 transition-all text-sm">返回首頁</button></div></div>';
            setTimeout(() => this._renderCompatRadar(code1, code2), 100);
        },
        _renderCompatRadar: function(code1, code2) {
            const ctx = document.getElementById('compat-radar-chart');
            if (!ctx || typeof Chart === 'undefined') return;
            const t1 = this._extractTraits(code1), t2 = this._extractTraits(code2);
            if (!t1 || !t2) return;
            const dimPairs = [['e_i','E'],['s_n','S'],['t_f','T'],['j_p','J'],['a_o','A'],['h_c','H']];
            const labels = ['E 外向','S 實感','T 思考','J 判斷','A 果斷','H 溫暖'];
            const toVal = (t, p) => t[p[0]] === p[1] ? 75 : 25;
            new Chart(ctx.getContext('2d'), {
                type: 'radar',
                data: { labels, datasets: [{ label: code1, data: dimPairs.map(p => toVal(t1, p)), backgroundColor: 'rgba(56,189,248,.25)', borderColor: 'rgba(56,189,248,1)', pointBackgroundColor: '#38bdf8', borderWidth: 2 }, { label: code2, data: dimPairs.map(p => toVal(t2, p)), backgroundColor: 'rgba(168,85,247,.15)', borderColor: 'rgba(168,85,247,.8)', pointBackgroundColor: '#a855f7', borderWidth: 1.5, borderDash: [5, 5] }] },
                options: { animation: { duration: 1000 }, scales: { r: { min: 0, max: 100, angleLines: { color: 'rgba(255,255,255,.08)' }, grid: { color: 'rgba(255,255,255,.08)' }, pointLabels: { color: 'rgba(255,255,255,.7)', font: { size: 10 } }, ticks: { display: false } } }, plugins: { legend: { labels: { color: 'rgba(255,255,255,.7)', font: { size: 10 } } } } }
            });
        },
        _renderScoreBars: function(scores) {
            const labels = [{key:'communication',label:'溝通風格',color:'bg-cyan-500'},{key:'decisionMaking',label:'決策互補',color:'bg-indigo-500'},{key:'cognitiveFunc',label:'思維方式',color:'bg-purple-500'},{key:'lifeRhythm',label:'生活節奏',color:'bg-emerald-500'},{key:'warmth',label:'溫暖互動',color:'bg-amber-500'}];
            return labels.map(({ key, label, color }) => { const v = scores[key], conf = v < 50; return '<div><div class="flex justify-between items-center mb-1"><span class="text-xs ' + (conf ? 'text-amber-300' : 'text-slate-300') + '">' + label + (conf ? ' ⚠️' : '') + '</span><span class="text-xs font-bold ' + (conf ? 'text-amber-400' : 'text-cyan-300') + '">' + v + '</span></div><div class="w-full bg-slate-800 rounded-full h-2"><div class="' + (conf ? 'bg-amber-500' : color) + ' h-2 rounded-full transition-all duration-300" style="width: ' + v + '%"></div></div></div>'; }).join('');
        }
    };
    window.CompatibilityModule = CompatibilityModule;
})();
