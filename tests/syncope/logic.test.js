const test = require('node:test');
const assert = require('node:assert/strict');
const L = require('../../protocols/syncope/logic.js');
const D = require('../../protocols/syncope/docs.js');

const S = { unstable: 'no', tloc: 'syncope', leading: 'yes' };
const docs = (s) => Object.fromEntries(D.sections(s, L.evaluate(s)).map((x) => [x.id, x.text]));

test('4. ábra: instabil → ABCDE; nem syncope / nem vezető panasz / trauma → kilép', () => {
  assert.equal(L.evaluate({ unstable: 'yes' }).category, 'UNSTABLE');
  assert.equal(L.evaluate({ unstable: 'no', tloc: 'tloc_other' }).category, 'OTHER');
  assert.equal(L.evaluate({ unstable: 'no', tloc: 'not_tloc' }).category, 'OTHER');
  const tr = L.evaluate({ unstable: 'no', tloc: 'trauma' });
  assert.ok(tr.alerts.some((a) => /fejsérülés eljárásrend/.test(a.text)));
  const pe = L.evaluate({ unstable: 'no', tloc: 'syncope', leading: 'no' });
  assert.ok(pe.actions.some((a) => /vezető panasz kivizsgálása/.test(a.text)));
});

test('presyncope: ugyanolyan alapos vizsgálat', () => {
  assert.ok(L.evaluate({ ...S, presyncope: true }).alerts.some((a) => /Presyncope/.test(a.text)));
});

test('aktív állás – SOP 4.4 kritériumok (szigorú > és <90)', () => {
  const base = { 'as.supSys': 130, 'as.supDia': 80, 'as.supHr': 70 };
  assert.equal(L.activeStanding({ ...base, 'as.0Sys': 110, 'as.0Dia': 80 }).oh, false); // pontosan 20 → nem
  assert.equal(L.activeStanding({ ...base, 'as.0Sys': 109, 'as.0Dia': 80 }).oh, true);
  assert.equal(L.activeStanding({ ...base, 'as.0Sys': 125, 'as.0Dia': 69 }).oh, true);  // >10 diasztolés
  assert.equal(L.activeStanding({ 'as.supSys': 100, 'as.supDia': 60, 'as.0Sys': 88, 'as.0Dia': 58 }).oh, true); // <90
  const p = L.activeStanding({ ...base, 'as.0Sys': 128, 'as.0Dia': 82, 'as.3Sys': 126, 'as.3Dia': 80, 'as.10Hr': 105 });
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

test('CSM: pozitív + reprodukált + korábbi syncope → CSS; anélkül CSH', () => {
  assert.equal(L.csm({ 'pt.age': 70, 'csm.result': 'pos', 'csm.reproduced': 'yes', 'hx.prevSyncope': 'yes' }).dx, 'CSS');
  assert.equal(L.csm({ 'pt.age': 70, 'csm.result': 'pos', 'csm.reproduced': 'yes', 'hx.prevSyncope': 'no' }).dx, 'CSH');
  assert.equal(L.csm({ 'pt.age': 35 }).indicated, false);
});

test('ortosztatikus syncope csak kimutatott OH mellett igazolható', () => {
  let r = L.evaluate({ ...S, 'cert.orthostatic': true });
  assert.equal(r.certain.length, 0);
  assert.ok(r.alerts.some((a) => /csak akkor igazolható/.test(a.text)));
  r = L.evaluate({ ...S, 'cert.orthostatic': true, 'as.supSys': 130, 'as.supDia': 80, 'as.0Sys': 100, 'as.0Dia': 75 });
  assert.equal(r.certain[0].code, 'OH');
});

test('rizikó: magas kockázati jegy nélkül megerősítés kell', () => {
  const r = L.evaluate({ ...S, 'cert.vvs': true });
  assert.equal(r.risk.level, null);
  assert.equal(r.stage, 'risk');
});

test('alacsony kockázat: reflex jegy + negatív fizikális + normál EKG → emisszió', () => {
  const r = L.evaluate({ ...S, 'cert.vvs': true, 'h.none': true, 'l.prodrome': true, 'l.physical': 'yes', 'l.ekg': 'yes' });
  assert.equal(r.category, 'LOW');
  assert.ok(r.disposition.some((d) => /emittálható/.test(d.text)));
});

test('alacsony jegy, de EKG nem normál → közepes', () => {
  const r = L.evaluate({ ...S, 'h.none': true, 'l.prodrome': true, 'l.physical': 'yes', 'l.ekg': 'no' });
  assert.equal(r.category, 'INTERMEDIATE');
});

test('közepes kockázat → 12 órás monitorozás, eredmény szerinti diszpozíció', () => {
  const s = { ...S, 'h.none': true, 'm.activity': true };
  let r = L.evaluate(s);
  assert.equal(r.category, 'INTERMEDIATE');
  assert.ok(r.disposition.some((d) => /12 órán át/.test(d.text)));
  r = L.evaluate({ ...s, 'obs.result': 'clear' });
  assert.ok(r.disposition.some((d) => /korai szakirányú járóbeteg/.test(d.text)));
});

test('magas kockázat: EKG-eltérés; aritmogén EKG egyben egyértelmű diagnózis', () => {
  const r = L.evaluate({ ...S, 'e.avb': true });
  assert.equal(r.category, 'HIGH');
  assert.equal(r.certain[0].code, 'ARR');
  assert.ok(r.disposition.some((d) => /resuscitatiós készenlét/.test(d.text)));
});

test('szívbetegség + kóros EKG: csak a kiegészítő jeggyel magas', () => {
  assert.equal(L.riskLevel({ 'hd.present': true }, { done: false }).level, null);
  assert.equal(L.riskLevel({ 'hd.present': true, 'hd.sitting': true }, { done: false }).level, 'high');
});

test('feltételes EKG-jegyek csak korábbi aritmogén syncope mellett', () => {
  assert.equal(L.riskLevel({ 'c.psvt': true, 'h.none': true }, { done: false }).level, 'intermediate');
  assert.equal(L.riskLevel({ 'c.psvt': true, 'hx.arrSync': true }, { done: false }).level, 'high');
});

test('magas kockázat: felvételi indikáció → osztályos felvétel; különben fektetős obszerváció', () => {
  let r = L.evaluate({ ...S, 'h.exertion': true, 'a.injury': true });
  assert.ok(r.disposition.some((d) => /Osztályos felvétel javasolt/.test(d.text)));
  r = L.evaluate({ ...S, 'h.exertion': true, 'o.palp': true });
  assert.ok(r.disposition.some((d) => /fektetős obszerváció/.test(d.text)));
});

test('pontrendszerek önmagukban nem javasoltak – figyelmeztetés', () => {
  const r = L.evaluate({ ...S, 'h.none': true });
  assert.ok(r.alerts.some((a) => /pontrendszerek/.test(a.text)));
});

test('dokumentáció: alacsony kockázatú vasovagalis syncope', () => {
  const s = { ...S, 'cert.vvs': true, 'h.none': true, 'l.prodrome': true, 'l.physical': 'yes', 'l.ekg': 'yes', 'syn.position': 'standing', 'syn.prodrome': 'typical', 'syn.palp': 'no', 'syn.injury': 'no', htn: 'no' };
  const x = docs(s);
  assert.match(x.complaint, /állás közben jelentkezett/);
  assert.match(x.complaint, /Palpitációt negál\./);
  assert.match(x.complaint, /Sérülés nem érte\./);
  assert.doesNotMatch(x.complaint, /Mellkasi fájdalmat/);
  assert.match(x.epicrisis, /^A fentebb részletezett anamnézisű beteget eszméletvesztés miatt vizsgáltuk ambulanciánkon\./);
  assert.match(x.epicrisis, /vasovagalis syncope feltételezhető/);
  assert.match(x.epicrisis, /otthonába emittáljuk/);
  assert.match(x.advice, /ellenmanővereket/);
  assert.match(x.advice, /10 g só/);
  assert.match(x.dx, /R55/);
});

test('dokumentáció: magas kockázatnál nincs emisszió, hely marad a további ellátásnak', () => {
  const x = docs({ ...S, 'e.vt': true });
  assert.match(x.epicrisis, /magas kockázatú syncope/);
  assert.doesNotMatch(x.epicrisis, /emittáljuk/);
  assert.match(x.advice, /___/);
});

test('dokumentáció: hypertoniásnál nem javasol sóbevitelt', () => {
  const x = docs({ ...S, 'cert.vvs': true, 'h.none': true, 'l.prodrome': true, 'l.physical': 'yes', 'l.ekg': 'yes', htn: 'yes' });
  assert.doesNotMatch(x.advice, /10 g só/);
});
