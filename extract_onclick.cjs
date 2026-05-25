const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const regex = /onclick="([^"]+)"/g;
let match;
const set = new Set();
while((match = regex.exec(html)) !== null) {
  set.add(match[1]);
}
console.log(Array.from(set).join('\n'));
