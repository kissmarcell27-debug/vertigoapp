const test = require('node:test');
const assert = require('node:assert/strict');
const L = require('../../protocols/syncope/logic.js');
const D = require('../../protocols/syncope/docs.js');

const S = { unstable: 'no', tloc: 'syncope', leading: 'yes' };
// kezdeti vizsgálatok kész: negatív fizikális, negatív aktív állás, normál EKG
const EXAM = { 'syn.position': 'standing', 'syn.prodrome': 'typical', 'ex.physical': 'yes', 'as.supSys': 120, 'as.supDia': 75, 'as.0Sys': 116, 'as.0Dia': 76, 'ekg.normal': 'yes' };
const docs = (s) => Object.fromEntries(D.sections(s, L.evaluate(s)).map((x) => [x.id, x.text]));

test('4. ábra: instabil → ABCDE; nem syncope / nem vezető panasz / trauma → kilép', () => {
  assert.equal(L.evaluate({ unstable: 'yes' }).category, 'UNSTABLE');
  assert.equal(L.evaluate({ unstable: 'no', tloc: 'tloc_other' }).category, 'OTHER');
  assert.equal(L.evaluate({ unstable: 'no', tloc: 'not_tloc' }).category, 'OTHER');
  assert.ok(L.evaluate({ unstable: 'no', tloc: 'trauma' }).alerts.some((a) => /Fejsérülés modult/.test(a.text)));
  assert.ok(L.evaluate({ ...S, leading: 'no' }).actions.some((a) => /vezető panasz kivizsgálása/.test(a.text)));
});

test('lépések sorrendje: vizsgálatok → EKG → diagnózis → rizikó', () => {
  const H = { 'syn.position': 'standing', 'syn.prodrome': 'none' };
  assert.equal(L.evaluate(S).stage, 'history');
  assert.equal(L.evaluate({ ...S, ...H }).stage, 'exam');
  assert.equal(L.evaluate({ ...S, ...H, 'ex.physical': 'yes' }).stage, 'exam'); // aktív állás még hiányzik
  assert.equal(L.evaluate({ ...S, ...H, 'ex.physical': 'yes', 'as.manual': 'nd' }).stage, 'ekg'); // nem végezhető → továbbléphet
  assert.equal(L.evaluate({ ...S, ...EXAM, 'ekg.normal': undefined }).stage, 'ekg');
  assert.equal(L.evaluate({ ...S, ...EXAM }).stage, 'dx');
  assert.equal(L.evaluate({ ...S, ...EXAM, 'dx.certain': 'none' }).stage, 'risk');
});

test('aktív állás – SOP 4.4 kritériumok (szigorú > és <90), POTS', () => {
  const base = { 'as.supSys': 130, 'as.supDia': 80, 'as.supHr': 70 };
  assert.equal(L.activeStanding({ ...base, 'as.0Sys': 110, 'as.0Dia': 80 }).oh, false); // pontosan 20 → nem
  assert.equal(L.activeStanding({ ...base, 'as.0Sys': 109, 'as.0Dia': 80 }).oh, true);
  assert.equal(L.activeStanding({ ...base, 'as.0Sys': 125, 'as.0Dia': 69 }).oh, true);
  assert.equal(L.activeStanding({ 'as.supSys': 100, 'as.supDia': 60, 'as.0Sys': 88, 'as.0Dia': 58 }).oh, true);
  const p = L.activeStanding({ ...base, 'as.0Sys': 128, 'as.0Dia': 82, 'as.10Hr': 105 });
  assert.equal(p.oh, false);
  assert.equal(p.pots, true);
});

test('OH-syncope bizonyossága', () => {
  const oh = { 'as.supSys': 130, 'as.supDia': 80, 'as.0Sys': 100, 'as.0Dia': 70 };
  const c = (rep, hx) => L.ohCertainty({ ...oh, 'as.reproduced': rep, 'as.history': hx }, L.activeStanding(oh));
  assert.equal(c('yes', 'full'), 'igazolt');
  assert.equal(c('yes', 'partial'), 'valószínű');
  assert.equal(c('no', 'full'), 'valószínű');
  assert.equal(c('no', 'less'), 'lehetséges');
});

test('CSM: CSS csak reprodukált tünetekkel és korábbi syncopéval', () => {
  assert.equal(L.csm({ 'pt.age': 70, 'csm.result': 'pos', 'csm.reproduced': 'yes', 'hx.prevSyncope': 'yes' }).dx, 'CSS');
  assert.equal(L.csm({ 'pt.age': 70, 'csm.result': 'pos', 'csm.reproduced': 'yes', 'hx.prevSyncope': 'no' }).dx, 'CSH');
  assert.equal(L.csm({ 'pt.age': 35 }).indicated, false);
});

test('ortosztatikus diagnózis csak kimutatott OH mellett', () => {
  let r = L.evaluate({ ...S, ...EXAM, 'dx.certain': 'orthostatic' });
  assert.equal(r.certain.length, 0);
  assert.ok(r.alerts.some((a) => /csak akkor igazolható/.test(a.text)));
  r = L.evaluate({ ...S, ...EXAM, 'as.0Sys': 95, 'as.0Dia': 70, 'dx.certain': 'orthostatic' });
  assert.equal(r.certain[0].code, 'OH');
});

test('rizikó: 1. kérdés megválaszolása nélkül nincs eredmény', () => {
  const r = L.evaluate({ ...S, ...EXAM, 'dx.certain': 'vvs' });
  assert.equal(r.risk.level, null);
  assert.equal(r.risk.needs, 'high');
  assert.equal(r.stage, 'risk');
});

test('alacsony kockázat: nincs magas, nincs közepes, van alacsony jegy, negatív fizikális, normál EKG', () => {
  const r = L.evaluate({ ...S, ...EXAM, 'dx.certain': 'vvs', 'h.any': 'no', 'm.any': 'no', 'l.prodrome': true });
  assert.equal(r.category, 'LOW');
  assert.ok(r.disposition.some((d) => /emittálható/.test(d.text)));
});

test('alacsony jegy nélkül közepes, és megmondja, mi hiányzik', () => {
  const r = L.evaluate({ ...S, ...EXAM, 'dx.certain': 'none', 'h.any': 'no', 'm.any': 'no' });
  assert.equal(r.category, 'INTERMEDIATE');
  assert.deepEqual(r.risk.lowMissing, ['legalább egy alacsony kockázati jegy (5.1)']);
  assert.ok(r.alerts.some((a) => /hiányzik/.test(a.text)));
});

test('pozitív fizikális vizsgálat mellett nem lehet alacsony', () => {
  const r = L.evaluate({ ...S, ...EXAM, 'ex.physical': 'no', 'dx.certain': 'vvs', 'h.any': 'no', 'm.any': 'no', 'l.prodrome': true });
  assert.equal(r.category, 'INTERMEDIATE');
  assert.ok(r.risk.lowMissing.includes('negatív fizikális vizsgálat'));
});

test('közepes kockázati jegy → 12 órás monitor, eredmény szerinti diszpozíció', () => {
  const s = { ...S, ...EXAM, 'dx.certain': 'none', 'h.any': 'no', 'm.any': 'yes', 'm.activity': true };
  let r = L.evaluate(s);
  assert.equal(r.category, 'INTERMEDIATE');
  assert.ok(r.disposition.some((d) => /12 órán át/.test(d.text)));
  r = L.evaluate({ ...s, 'obs.result': 'clear' });
  assert.ok(r.disposition.some((d) => /korai szakirányú járóbeteg/.test(d.text)));
});

test('magas: igen a 1. kérdésre (részletezés nélkül is magas)', () => {
  assert.equal(L.evaluate({ ...S, ...EXAM, 'dx.certain': 'none', 'h.any': 'yes' }).category, 'HIGH');
  const r = L.evaluate({ ...S, ...EXAM, 'dx.certain': 'none', 'h.any': 'yes', 'h.exertion': true, 'a.injury': true });
  assert.ok(r.disposition.some((d) => /Osztályos felvétel javasolt/.test(d.text)));
});

test('kóros EKG bizonyító eltéréssel: automatikus aritmogén diagnózis és magas kockázat, kérdések nélkül', () => {
  const r = L.evaluate({ ...S, ...EXAM, 'ekg.normal': 'no', 'e.avb': true });
  assert.equal(r.certain[0].code, 'ARR');
  assert.equal(r.category, 'HIGH');
  assert.ok(r.risk.auto.length > 0);
});

test('EKG-listák csak kóros EKG mellett számítanak', () => {
  const r = L.evaluate({ ...S, ...EXAM, 'ekg.normal': 'yes', 'e.avb': true, 'dx.certain': 'none', 'h.any': 'no', 'm.any': 'no', 'l.prodrome': true });
  assert.equal(r.category, 'LOW');
});

test('feltételes EKG-jegyek csak korábbi aritmogén syncope mellett', () => {
  const base = { ...S, ...EXAM, 'ekg.normal': 'no', 'c.psvt': true, 'dx.certain': 'none' };
  assert.equal(L.evaluate(base).risk.level, null);
  assert.equal(L.evaluate({ ...base, 'hx.arrSync': true }).category, 'HIGH');
});

test('kardiális diagnózis (ischaemia) → magas kockázat automatikusan', () => {
  const r = L.evaluate({ ...S, ...EXAM, 'dx.certain': 'cardiac', 'dx.cardiacType': 'ischemia' });
  assert.equal(r.category, 'HIGH');
});

test('dokumentáció: alacsony kockázatú vasovagalis syncope', () => {
  const s = { ...S, ...EXAM, 'dx.certain': 'vvs', 'h.any': 'no', 'm.any': 'no', 'l.prodrome': true, 'syn.position': 'standing', 'syn.prodrome': 'typical', 'syn.palp': 'no', 'syn.injury': 'no', htn: 'no' };
  const x = docs(s);
  assert.match(x.complaint, /állás közben jelentkezett/);
  assert.match(x.complaint, /Palpitációt negál\./);
  assert.doesNotMatch(x.complaint, /Mellkasi fájdalmat/);
  assert.match(x.status, /Fizikális vizsgálat során kóros eltérés nem észlelhető/);
  assert.match(x.epicrisis, /^A fentebb részletezett anamnézisű beteget eszméletvesztés miatt vizsgáltuk ambulanciánkon\./);
  assert.match(x.epicrisis, /EKG-n kóros eltérést nem láttam/);
  assert.match(x.epicrisis, /vasovagalis syncope feltételezhető/);
  assert.match(x.epicrisis, /otthonába emittáljuk/);
  assert.match(x.advice, /ellenmanővereket/);
  assert.match(x.advice, /10 g só/);
  assert.match(x.dx, /R55/);
});

test('dokumentáció: magas kockázatnál nincs emisszió; hypertoniásnál nincs sójavaslat', () => {
  let x = docs({ ...S, ...EXAM, 'ekg.normal': 'no', 'e.vt': true });
  assert.match(x.epicrisis, /magas kockázatú syncope/);
  assert.doesNotMatch(x.epicrisis, /emittáljuk/);
  x = docs({ ...S, ...EXAM, 'dx.certain': 'vvs', 'h.any': 'no', 'm.any': 'no', 'l.prodrome': true, htn: 'yes' });
  assert.doesNotMatch(x.advice, /10 g só/);
});

test('dokumentáció: nem végezhető aktív állás', () => {
  const x = docs({ ...S, 'syn.position': 'sitting', 'syn.prodrome': 'none', 'ex.physical': 'yes', 'as.manual': 'nd' });
  assert.match(x.status, /Aktív állás vizsgálat: nem volt elvégezhető\./);
});
