// Egyetlen, offline is működő HTML-fájlt készít (szedules-sbo.html) a CSS és JS beágyazásával.
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');

let html = read('index.html');
html = html.replace('<link rel="stylesheet" href="css/style.css">', () => '<style>\n' + read('css/style.css') + '\n</style>');
for (const f of ['js/logic.js', 'js/content.js', 'js/illustrations.js', 'js/app.js']) {
  html = html.replace(`<script src="${f}"></script>`, () => '<script>\n' + read(f) + '\n</script>');
}
fs.writeFileSync(path.join(root, 'szedules-sbo.html'), html);
console.log('szedules-sbo.html elkészült');
