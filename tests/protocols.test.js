// Szerződés-teszt: az index.html-ben betöltött összes eljárásrend-modult egy szimulált böngésző-
// környezetben betölti, és ellenőrzi, hogy a motor által elvárt szerkezetnek megfelel.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const scripts = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map((m) => m[1]).filter((f) => !f.endsWith('engine.js'));

const sandbox = { console };
sandbox.window = sandbox;
vm.createContext(sandbox);
for (const f of scripts) vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), sandbox, { filename: f });

// A sablon nincs az index.html-ben, de érvényes kiindulópontnak kell maradnia: külön környezetben töltjük be.
const tpl = { console };
tpl.window = tpl;
vm.createContext(tpl);
for (const f of ['js/core/registry.js', 'protocols/_sablon/protocol.js']) vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), tpl, { filename: f });

const SBO = { protocols: sandbox.SBO.protocols.concat(tpl.SBO.protocols) };

const FIELD_TYPES = ['yn', 'choice', 'check', 'text', 'textarea', 'num', 'num2', 'heading', 'note', 'illus', 'widget', 'summary'];

test('legalább egy eljárásrend regisztrálva (a sablonon kívül)', () => {
  assert.ok(sandbox.SBO.protocols.length >= 1);
  assert.ok(!sandbox.SBO.protocols.some((p) => p.id === 'sablon'), 'a sablon ne legyen betöltve az index.html-ben');
});

for (const p of SBO.protocols) {
  test(`${p.id}: szerződés`, () => {
    assert.match(p.id, /^[a-z0-9-]+$/, 'az azonosító csak kisbetű, szám, kötőjel lehet');
    for (const k of ['title', 'short']) assert.ok(p[k], `hiányzik: ${k}`);
    for (const k of ['title', 'issuer', 'version']) assert.ok(p.sop[k], `hiányzik: sop.${k}`);
    if (p.sop.validUntil) assert.match(p.sop.validUntil, /^\d{4}-\d{2}-\d{2}$/);
    if (p.icon) assert.ok(sandbox.SBO.icons.names.includes(p.icon), `ismeretlen ikon: ${p.icon}`);

    const ids = p.steps.map((s) => s.id);
    assert.equal(new Set(ids).size, ids.length, 'duplikált lépés-azonosító');
    assert.ok(p.steps.some((s) => s.fields.some((f) => f.type === 'summary')), 'kell egy összegző lépés (summary mező)');
    for (const target of Object.values(p.stageToStep)) assert.ok(ids.includes(target), `stageToStep ismeretlen lépésre mutat: ${target}`);

    for (const st of p.steps) {
      for (const f of st.fields) {
        assert.ok(FIELD_TYPES.includes(f.type), `${st.id}: ismeretlen mezőtípus: ${f.type}`);
        if (['yn', 'choice', 'check', 'text', 'textarea', 'num'].includes(f.type)) assert.ok(f.key, `${st.id}: hiányzó key`);
        if (f.type === 'choice') assert.ok(Array.isArray(f.options) && f.options.length, `${st.id}/${f.key}: nincs opció`);
        if (f.type === 'widget') assert.ok(p.widgets && p.widgets[f.name] && typeof p.widgets[f.name].render === 'function', `${st.id}: hiányzó widget: ${f.name}`);
        if (f.type === 'illus') assert.ok(p.illustrations && p.illustrations.get(f.name), `${st.id}: hiányzó ábra: ${f.name}`);
      }
    }
  });

  test(`${p.id}: üres állapotra is kiértékelhető, a kimenet szerkezete helyes`, () => {
    const r = p.evaluate({});
    for (const k of ['path', 'alerts', 'workingDx', 'actions', 'disposition']) assert.ok(Array.isArray(r[k]), `evaluate().${k} tömb kell legyen`);
    assert.ok(r.stage in p.stageToStep, `ismeretlen stage: ${r.stage}`);
    if (r.category) assert.ok(p.categories[r.category]);
    if (p.docSections) {
      const secs = p.docSections({}, r);
      assert.ok(Array.isArray(secs) && secs.every((x) => x.id && x.title && typeof x.text === 'string'));
    }
    if (p.reference) assert.ok(p.reference((t) => String(t)).every((x) => x.id && x.title && typeof x.html === 'string'));
  });
}
