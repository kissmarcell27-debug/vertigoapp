// Az ikoncsomag (js/core/icons.js) exportálása önálló SVG-fájlokba: assets/icons/*.svg
const fs = require('fs');
const path = require('path');
const I = require('../js/core/icons.js');
const out = path.join(__dirname, '..', 'assets', 'icons');
fs.mkdirSync(out, { recursive: true });
const COLORS = { vertigo: '#6a5aa8', syncope: '#bf3f3f', headinjury: '#b2561a', triage: '#1e638d', sop: '#1e638d' };
for (const n of I.names) {
  const svg = I.svg(n, 24).replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ').replace('stroke="currentColor"', `stroke="${COLORS[n]}"`);
  fs.writeFileSync(path.join(out, n + '.svg'), svg + '\n');
}
fs.writeFileSync(path.join(out, 'app.svg'), I.APP + '\n');
console.log('ikonok exportálva: ' + I.names.concat('app').map((n) => n + '.svg').join(', '));
