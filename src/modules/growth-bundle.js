
(function() {
    'use strict';
    const TimelineModule = {
        renderTimelineScreen: function() {
            const app = document.getElementById('app-container');
            if (!app) return;
            ['screen-start','screen-quiz','screen-loading','screen-result'].forEach(id => { const el = document.getElementById(id); if (el) { el.classList.add('hidden'); el.classList.remove('flex'); } });
            let featureScreen = window._showFeatureScreen ? window._showFeatureScreen() : (() => {
                let fs = document.getElementById('screen-feature');
                if (!fs) { fs = document.createElement('div'); fs.id = 'screen-feature'; document.getElementById('app-container').appendChild(fs); }
                fs.className = 'flex flex-col w-full flex-1 overflow-y-auto custom-scrollbar';
                fs.classList.remove('hidden');
                return fs;
            })();
            const historyData = this.getHistoryData();
            if (!historyData || historyData.records.length === 0) {
                featureScreen.innerHTML = '<div class="p-8 md:p-12 text-center flex flex-col gap-4 fade-in-up pb-8"><h2 class="text-3xl font-black text-cyan-300">人格變化時間軸</h2><p class="text-slate-400">暫無測驗紀錄</p><p class="text-slate-500 text-sm">完成測驗後，你的人格維度變化將顯示在此</p><button onclick="window.resetQuiz(); setTimeout(() => window.startQuiz(), 100);" class="bg-cyan-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-cyan-500 transition-all max-w-xs mx-auto">開始測驗</button></div>';
                return;
            }
            featureScreen.innerHTML = '<div class="p-6 md:p-10 text-center flex flex-col gap-6 fade-in-up pb-8"><div><h2 class="text-3xl font-black text-cyan-300 mb-2">人格變化時間軸</h2><p class="text-slate-400 text-sm">追蹤你的人格六維度在 ' + historyData.records.length + ' 次測驗中的演變</p></div><div class="glass-panel p-6 rounded-xl"><canvas id="timeline-chart" height="300"></canvas></div><div class="glass-panel p-5 rounded-xl border-l-4 border-indigo-400 text-left"><h3 class="text-sm font-bold text-indigo-300 mb-3">📊 趨勢分析</h3><p class="text-sm text-slate-300 font-light leading-relaxed">' + MBTI64Utils.escapeHtml(this._generateInsight(historyData.records)) + '</p></div><div class="glass-panel p-5 rounded-xl text-left max-h-64 overflow-y-auto custom-scrollbar"><h3 class="text-sm font-bold text-slate-300 mb-3">所有記錄</h3><div class="space-y-2">' +
                historyData.records.map((r) => '<div class="p-3 bg-slate-800/50 rounded-lg border border-slate-700 text-xs text-slate-300"><div class="flex justify-between mb-1"><strong>' + MBTI64Utils.escapeHtml(r.fullCode || r.code || '未知') + '</strong><span class="text-slate-500">' + MBTI64Utils.escapeHtml(r.date || '') + '</span></div><div class="text-slate-400">' + MBTI64Utils.escapeHtml(r.name || '(未命名)') + '</div></div>').join('') +
                '</div></div><div class="flex gap-2 justify-center"><button onclick="window.resetQuiz()" class="bg-slate-800 text-slate-200 border border-slate-600 font-bold py-2 px-6 rounded-xl hover:bg-slate-700 transition-all text-sm">返回首頁</button></div></div>';
            setTimeout(() => this.renderTrendChart(historyData), 100);
        },
        getHistoryData: function() {
            try {
                const raw = (typeof MBTI64Utils !== 'undefined' && MBTI64Utils.safeLocalGet) ? MBTI64Utils.safeLocalGet('mbti64_history') : localStorage.getItem('mbti64_history');
                if (!raw) return { records: [] };
                const parsed = JSON.parse(raw);
                const records = Array.isArray(parsed) ? parsed : [];
                records.sort((a, b) => {
                    const ta = a.timestamp || new Date(a.date || 0).getTime() || 0;
                    const tb = b.timestamp || new Date(b.date || 0).getTime() || 0;
                    return tb - ta;
                });
                return { records, dimensions: this._extractDimensions(records) };
            } catch (e) { console.error('Error parsing history:', e); return { records: [] }; }
        },
        _extractDimensions: function(records) {
            const dimensions = { E_I: [], S_N: [], T_F: [], J_P: [], A_O: [], H_C: [] };
            records.forEach(r => {
                const scores = r.scores;
                if (!scores) return;
                const calc = (k1, k2) => {
                    const v1 = Number(scores[k1] || 0), v2 = Number(scores[k2] || 0), total = v1 + v2;
                    return total === 0 ? 0 : ((v1 - v2) / total) * 100;
                };
                dimensions.E_I.push(calc('E', 'I'));
                dimensions.S_N.push(calc('S', 'N'));
                dimensions.T_F.push(calc('T', 'F'));
                dimensions.J_P.push(calc('J', 'P'));
                dimensions.A_O.push(calc('A', 'O'));
                dimensions.H_C.push(calc('H', 'C'));
            });
            return dimensions;
        },
        renderTrendChart: function(historyData) {
            const canvas = document.getElementById('timeline-chart');
            if (!canvas || historyData.records.length === 0) return;
            this._lastRecordsForChart = historyData;
            const dimensions = historyData.dimensions;
            const orderedRecords = [...historyData.records].reverse();
            const labels = orderedRecords.map((_, i) => '第 ' + (i + 1) + ' 次');
            const colors = { E_I:'rgb(56, 189, 248)', S_N:'rgb(168, 85, 247)', T_F:'rgb(239, 68, 68)', J_P:'rgb(34, 197, 94)', A_O:'rgb(251, 146, 60)', H_C:'rgb(59, 130, 246)' };
            const datasets = Object.entries(dimensions).map(([dim, values]) => ({
                label: dim.replace('_', '/'),
                data: [...values].reverse(),
                borderColor: colors[dim], backgroundColor: colors[dim] + '20',
                borderWidth: 2, tension: 0.4, fill: false, pointRadius: 4,
                pointBackgroundColor: colors[dim], pointBorderColor: 'white', pointBorderWidth: 1
            }));
            if (window.timelineChart) window.timelineChart.destroy();
            const isDark = (typeof MBTI64Utils !== 'undefined' && MBTI64Utils.ThemeManager && MBTI64Utils.ThemeManager.isDark) ? MBTI64Utils.ThemeManager.isDark() : ((document.documentElement.getAttribute('data-theme') || 'dark') !== 'light');
            const textColor = isDark ? 'rgba(255,255,255,0.8)' : 'rgba(15,23,42,0.85)';
            const tickColor = isDark ? 'rgba(255,255,255,0.6)' : 'rgba(15,23,42,0.6)';
            const gridColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';
            const xGridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)';
            const pointBorder = isDark ? 'white' : '#0f172a';
            datasets.forEach(ds => { ds.pointBorderColor = pointBorder; });
            window.timelineChart = new Chart(canvas, {
                type: 'line', data: { labels, datasets },
                options: {
                    responsive: true, maintainAspectRatio: false,
                    interaction: { mode: 'index', intersect: false },
                    plugins: { legend: { labels: { color: textColor, font: { size: 11, weight: 'bold' } } } },
                    scales: {
                        y: { min: -100, max: 100, grid: { color: gridColor }, ticks: { color: tickColor, font: { size: 10 }, callback: (v) => v === -100 ? '◀ 負向' : v === 100 ? '正向 ▶' : v === 0 ? '中性' : v } },
                        x: { grid: { color: xGridColor }, ticks: { color: tickColor, font: { size: 10 } } }
                    }
                }
            });
            if (typeof MBTI64Utils !== 'undefined' && MBTI64Utils.ThemeManager && typeof MBTI64Utils.ThemeManager.subscribe === 'function' && !this._timelineThemeSub) {
                this._timelineThemeSub = MBTI64Utils.ThemeManager.subscribe(() => { if (this._lastRecordsForChart) this.renderTrendChart(this._lastRecordsForChart); });
            }
        },
        _generateInsight: function(records) {
            if (records.length < 2) return '紀錄太少，無法進行趨勢分析。再完成幾次測驗後會更有意義。';
            const latest = records[0], earliest = records[records.length - 1];
            let insights = [];
            const getTs = (r) => r.timestamp || new Date(r.date || 0).getTime() || 0;
            const daysDiff = Math.floor((getTs(latest) - getTs(earliest)) / 86400000);
            if (daysDiff > 0) insights.push('你在過去 ' + daysDiff + ' 天內完成了 ' + records.length + ' 次測驗。');
            const codes = records.map(r => r.fullCode || r.baseMbti || '').filter(Boolean);
            const typesUnique = new Set(codes).size;
            if (typesUnique === 1) insights.push('你的人格類型相當穩定，這表示你有清晰而一致的自我認識。');
            else if (typesUnique <= records.length / 2) insights.push('你的人格類型大致穩定，偶有波動可能反映生活環境的變化或自我探索。');
            else insights.push('你的人格類型呈現多樣變化，這可能表示你正在經歷自我探索或生活轉變的階段。');
            if (latest.scores && earliest.scores) {
                const pairs = [['E','I'],['S','N'],['T','F'],['J','P'],['A','O'],['H','C']];
                const changes = [];
                pairs.forEach(([k1, k2]) => {
                    const newV = Number(latest.scores[k1] || 0), oldV = Number(earliest.scores[k1] || 0);
                    if (Math.abs(newV - oldV) > 5) changes.push(k1 + '/' + k2);
                });
                if (changes.length > 0) insights.push('在 ' + changes.join('、') + ' 維度上有明顯變化。');
            }
            insights.push('每次測驗都是一次自我認識的機會，重要的是在變化中找到真實的自己。');
            return insights.join(' ');
        }
    };
    window.TimelineModule = TimelineModule;
})();
