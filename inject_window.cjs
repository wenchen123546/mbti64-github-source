const fs = require('fs');
const path = require('path');
const dirs = [
  'c:/Users/Wen/Downloads/AI工具/MBTI 64/mbti64-github-source/src',
  'c:/Users/Wen/Downloads/AI工具/MBTI 64/mbti64-github-source/src/modules'
];

dirs.forEach(dir => {
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'));
  for(const f of files) {
    const p = path.join(dir, f);
    let content = fs.readFileSync(p, 'utf8');
    let appended = false;
    let toAppend = '\n// Expose for Vite UI Clicks\nif(typeof window !== "undefined") {\n';
    
    const matches = [...content.matchAll(/^(?:async\s+)?function\s+([a-zA-Z0-9_]+)\s*\(/gm)];
    
    // Also find let/const/var at top level just in case
    const varMatches = [...content.matchAll(/^(?:let|const|var)\s+([a-zA-Z0-9_]+)\s*=\s*(?:function|\([^)]*\)\s*=>)/gm)];
    
    const allMatches = new Set([...matches.map(m=>m[1]), ...varMatches.map(m=>m[1])]);
    
    for(const name of allMatches) {
       toAppend += `  if(typeof ${name} !== "undefined") window.${name} = ${name};\n`;
       appended = true;
    }
    toAppend += '}\n';
    
    if(appended) {
      fs.appendFileSync(p, toAppend);
      console.log('Patched ' + p);
    }
  }
});
