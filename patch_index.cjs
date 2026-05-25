const fs = require('fs');
const path = 'c:/Users/Wen/Downloads/AI工具/MBTI 64/mbti64-github-source/index.html';
let html = fs.readFileSync(path, 'utf8');

// Replace invalid GAS template tags
html = html.replace('const needsInit = <?= needsInit ?>;', 'const needsInit = false;');
html = html.replace('sysData.questions = <?!= questionsData ?>;', 'sysData.questions = typeof window.questions !== "undefined" ? window.questions : [];');
html = html.replace('sysData.mbtiBase = <?!= databaseData ?>;', 'sysData.mbtiBase = typeof window.mbtiTypes !== "undefined" ? window.mbtiTypes : {};');
html = html.replace('sysData.suffixModifiers = <?!= modifiersData ?>;', 'sysData.suffixModifiers = typeof window.suffixModifiers !== "undefined" ? window.suffixModifiers : {};');
html = html.replace('sysData.celebs = <?!= celebsData ?>;', 'sysData.celebs = typeof window.celebDatabase !== "undefined" ? { base: window.celebDatabase, suffix: window.suffixCelebData || {}, combo: window.combo64CelebNote || {} } : {base:{}, suffix:{}, combo:{}};');

// Ensure start button is enabled at the end of DOMContentLoaded
const btnEnableScript = `
            // 強制確保開始按鈕可用
            setTimeout(() => {
                if (DOM.startBtn) {
                    DOM.startBtn.innerText = "開始測驗";
                    DOM.startBtn.disabled = false;
                    DOM.startBtn.classList.remove('opacity-70', 'cursor-not-allowed');
                }
            }, 500);
        });`;
html = html.replace('        });\n\n        let lastKeyTime = 0;', btnEnableScript + '\n\n        let lastKeyTime = 0;');

fs.writeFileSync(path, html);
console.log('Patched index.html');
