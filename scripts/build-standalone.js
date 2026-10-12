// Egyetlen, offline is működő HTML-fájlt készít (sbo-dontestamogato.html): az index.html-ben hivatkozott
// összes stíluslapot és szkriptet (közös motor + minden eljárásrend) beágyazza, a megadott sorrendben.
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');

let html = read('index.html');
html = html.replace(/<link rel="stylesheet" href="([^"]+)">/g, (m, f) => '<style>\n' + read(f) + '\n</style>');
html = html.replace(/<script src="([^"]+)"><\/script>/g, (m, f) => '<script>\n' + read(f).replace(/<\/script/gi, '<\\/script') + '\n</script>');
const out = process.argv[2] || 'sbo-dontestamogato.html';
fs.writeFileSync(path.join(root, out), html);
console.log(out + ' elkészült');
