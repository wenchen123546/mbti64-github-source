const fs = require('fs');
const path = require('path');
const dir = 'c:/Users/Wen/Downloads/AI工具/MBTI 64/mbti64-github-source/src/modules';

// 1. Patch utils.js
const utilsPath = path.join(dir, 'utils.js');
let utilsCode = fs.readFileSync(utilsPath, 'utf8');
if (!utilsCode.includes('window.createFreshState = MBTI64Utils.createFreshState;')) {
    const injectStr = `
    window.MBTI64Utils = MBTI64Utils;
    window.escapeHtml = MBTI64Utils.escapeHtml;
    window.fisherYatesShuffle = MBTI64Utils.fisherYatesShuffle;
    window.createFreshScores = MBTI64Utils.createFreshScores;
    window.createFreshState = MBTI64Utils.createFreshState;
    window.textToHtml = MBTI64Utils.textToHtml;
    window.safeLocalSet = MBTI64Utils.safeLocalSet;
    window.safeLocalGet = MBTI64Utils.safeLocalGet;
    window.safeLocalGetJSON = MBTI64Utils.safeLocalGetJSON;
    window.safeLocalRemove = MBTI64Utils.safeLocalRemove;
    window.normalizeCode = MBTI64Utils.normalizeCode;
    window.displayCode = MBTI64Utils.displayCode;
    window.formatDate = MBTI64Utils.formatDate;
    window.showToast = MBTI64Utils.showToast;
    window.showError = MBTI64Utils.showError;
    window.gasRun = MBTI64Utils.gasRun;
    window.gasCall = MBTI64Utils.gasCall;
    window.generateUID = MBTI64Utils.generateUID;
    window.calculatePercentage = MBTI64Utils.calculatePercentage;
    window.ThemeManager = ThemeManager;
    window.ErrorHandler = ErrorHandler;
`;
    // Inject before the last })();
    utilsCode = utilsCode.replace(/}\)\(\);\s*$/, injectStr + '\n})();\n');
    fs.writeFileSync(utilsPath, utilsCode);
    console.log('Patched utils.js');
}

// 2. Patch questions.js
const qPath = path.join(dir, 'questions.js');
let qCode = fs.readFileSync(qPath, 'utf8');
if (!qCode.includes('window.sysData = { questions: questions };')) {
    qCode += '\nif (typeof window !== "undefined") {\n  window.questions = questions;\n  window.sysData = { questions: questions };\n}\n';
    fs.writeFileSync(qPath, qCode);
    console.log('Patched questions.js');
}

// 3. Patch database.js
const dbPath = path.join(dir, 'database.js');
let dbCode = fs.readFileSync(dbPath, 'utf8');
if (!dbCode.includes('window.mbtiTypes = mbtiTypes;')) {
    dbCode += '\nif (typeof window !== "undefined") {\n  window.mbtiTypes = typeof mbtiTypes !== "undefined" ? mbtiTypes : null;\n  window.typeRelations = typeof typeRelations !== "undefined" ? typeRelations : null;\n  window.traitDescriptions = typeof traitDescriptions !== "undefined" ? traitDescriptions : null;\n}\n';
    fs.writeFileSync(dbPath, dbCode);
    console.log('Patched database.js');
}

// 4. Patch celebText.js
const cPath = path.join(dir, 'celebText.js');
let cCode = fs.readFileSync(cPath, 'utf8');
if (!cCode.includes('window.celebDatabase = celebDatabase;')) {
    cCode += '\nif (typeof window !== "undefined") {\n  window.celebDatabase = typeof celebDatabase !== "undefined" ? celebDatabase : null;\n}\n';
    fs.writeFileSync(cPath, cCode);
    console.log('Patched celebText.js');
}
