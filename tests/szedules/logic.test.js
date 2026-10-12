const test = require('node:test');
const assert = require('node:assert/strict');
const L = require('../../protocols/szedules/logic.js');

const stable = { unstable: 'no', focal: 'no', nonneuro: 'no' };
const avsBase = { ...stable, continuous: 'yes', 'avs.trauma': 'no', 'avs.headache': 'no', 'avs.drug': 'no' };
const periphHints = {
  'hints.hit': 'saccade', 'hints.nyst': 'horiz_unidir', 'hints.nystDir': 'right',
  'hints.skew': 'neg', 'hints.hearing': 'none', 'stat.romberg': 'fall_left',
};

test('1. ábra: instabil beteg → ABCDE', () => {
  const r = L.evaluate({ unstable: 'yes' });
  assert.equal(r.category, 'UNSTABLE');
  assert.equal(r.stage, 'done');
});

test('1. ábra: fokális neurológiai tünet → stroke protokoll', () => {
  const r = L.evaluate({ unstable: 'no', focal: 'yes' });
  assert.equal(r.category, 'STROKE');
});

test('1. ábra: nem neurológiai ok, centrális jelek nélkül → szekunder', () => {
  const r = L.evaluate({ unstable: 'no', focal: 'no', nonneuro: 'yes', 'cs.nystagmus': 'no', 'cs.dysmetria': 'no', 'cs.truncal': 'no' });
  assert.equal(r.category, 'SECONDARY');
});

test('1. ábra: nem neurológiai ok, de kóros nystagmus → vestibularis út folytatódik', () => {
  const r = L.evaluate({ unstable: 'no', focal: 'no', nonneuro: 'yes', 'cs.nystagmus': 'yes', continuous: 'yes' });
  assert.equal(r.category, 'AVS');
});

test('1. ábra: nem neurológiai ok, centrális jelek még nincsenek kitöltve → vár', () => {
  const r = L.evaluate({ unstable: 'no', focal: 'no', nonneuro: 'yes', 'cs.nystagmus': 'no' });
  assert.equal(r.category, null);
  assert.equal(r.stage, 'nonneuro');
});

test('1. ábra: besorolás AVS / s-EVS / t-EVS', () => {
  assert.equal(L.evaluate({ ...stable, continuous: 'yes' }).category, 'AVS');
  assert.equal(L.evaluate({ ...stable, continuous: 'no', triggered: 'no' }).category, 'SEVS');
  assert.equal(L.evaluate({ ...stable, continuous: 'no', triggered: 'yes' }).category, 'TEVS');
});

test('2. ábra: AVS + trauma → CT; ICH → stop', () => {
  let r = L.evaluate({ ...avsBase, 'avs.trauma': 'yes' });
  assert.equal(r.stage, 'avs_pre');
  assert.ok(r.actions.some((a) => /CT/.test(a.text)));
  r = L.evaluate({ ...avsBase, 'avs.trauma': 'yes', 'avs.ct': 'ich' });
  assert.equal(r.stage, 'done');
  r = L.evaluate({ ...avsBase, 'avs.trauma': 'yes', 'avs.ct': 'neg' });
  assert.equal(r.stage, 'hints');
  assert.ok(r.alerts.some((a) => /NEM zárja ki/.test(a.text)));
});

test('2. ábra: teljes perifériás HINTS+ + harmonikus → perifériás, enyhe → emisszió', () => {
  const r = L.evaluate({ ...avsBase, ...periphHints, 'avs.severe': 'no' });
  assert.equal(r.hints.result, 'peripheral');
  assert.equal(r.hints.harmony.result, 'harmonic');
  assert.ok(r.disposition.some((d) => /emittálható/.test(d.text)));
});

test('2. ábra: perifériás, súlyos → hospitalizáció', () => {
  const r = L.evaluate({ ...avsBase, ...periphHints, 'avs.severe': 'yes' });
  assert.ok(r.disposition.some((d) => /hospitalizáció/.test(d.text)));
});

test('HINTS+: bármely centrális jel → centrális', () => {
  for (const [k, v] of [['hints.hit', 'normal'], ['hints.nyst', 'vertical'], ['hints.nyst', 'gaze_evoked'],
    ['hints.nyst', 'torsional'], ['hints.skew', 'pos'], ['hints.hearing', 'acute_unilateral'], ['stat.romberg', 'fall_back']]) {
    const r = L.evaluate({ ...avsBase, ...periphHints, [k]: v });
    assert.equal(r.hints.result, 'central', `${k}=${v}`);
    assert.ok(r.actions.some((a) => /Neurológiai konzílium/.test(a.text)));
  }
});

test('HINTS+: diszharmonikus tünetcsoport → centrális', () => {
  // gyors komponens jobbra, dőlés jobbra = azonos irány
  const r = L.evaluate({ ...avsBase, ...periphHints, 'stat.romberg': 'fall_right' });
  assert.equal(r.hints.harmony.result, 'dysharmonic');
  assert.equal(r.hints.result, 'central');
});

test('HINTS+: hiányos vizsgálat → nem egyértelmű, nem perifériás', () => {
  const r = L.evaluate({ ...avsBase, 'hints.hit': 'saccade', 'hints.nyst': 'horiz_unidir', 'hints.skew': 'nd' });
  assert.equal(r.hints.result, 'indeterminate');
  assert.equal(r.disposition.length, 0);
});

test('HINTS+: nystagmus hiányában nem értékelhető (GRACE-3 megjegyzés)', () => {
  const r = L.evaluate({ ...avsBase, ...periphHints, 'hints.nyst': 'none' });
  assert.equal(r.hints.result, 'indeterminate');
  assert.ok(r.alerts.some((a) => /GRACE-3/.test(a.text)));
});

test('3. ábra: s-EVS magas TIA kockázat → neurológia', () => {
  const r = L.evaluate({ ...stable, continuous: 'no', triggered: 'no', 'sevs.tiaRisk': 'high', 'sevs.inArea': 'no' });
  assert.ok(r.disposition.some((d) => /illetékes neurológiai/.test(d.text)));
});

test('3. ábra: s-EVS alacsony kockázat, kísérő tünetek szerinti munkadiagnózis', () => {
  const r = L.evaluate({ ...stable, continuous: 'no', triggered: 'no', 'sevs.tiaRisk': 'low', 'sevs.headache': true, 'sevs.tinnitus': true, 'sevs.course': 'mild' });
  const txt = r.workingDx.map((d) => d.text).join('|');
  assert.match(txt, /migrén/);
  assert.match(txt, /Ménière/);
  assert.ok(r.disposition.some((d) => /emittálható/.test(d.text)));
});

test('3. ábra: t-EVS erősen szédülő beteg → pozícionális teszt értelmetlen', () => {
  const r = L.evaluate({ ...stable, continuous: 'no', triggered: 'yes', 'tevs.state': 'severe' });
  assert.ok(r.alerts.some((a) => /értelmetlen/.test(a.text)));
  assert.notEqual(r.stage, 'done');
});

test('3. ábra: t-EVS Dix-Hallpike pozitív → pc-BPPV, Epley érintett oldalról', () => {
  const r = L.evaluate({ ...stable, continuous: 'no', triggered: 'yes', 'tevs.state': 'calm', 'dh.right': 'neg', 'dh.left': 'typical', 'tevs.severity': 'mild' });
  assert.equal(r.positional.canal, 'posterior');
  assert.equal(r.positional.side, 'left');
  assert.ok(r.actions.some((a) => /Epley.*bal/.test(a.text)));
  assert.ok(r.disposition.some((d) => /Enyhe/.test(d.text)));
});

test('6.5: supine roll geotrop → horizontális BPPV, Barbecue', () => {
  const r = L.evaluate({ ...stable, continuous: 'no', triggered: 'yes', 'tevs.state': 'calm', roll: 'geo_right', 'tevs.severity': 'severe' });
  assert.equal(r.positional.canal, 'horizontal');
  assert.ok(r.actions.some((a) => /Barbecue.*jobb/.test(a.text)));
  assert.ok(r.disposition.some((d) => /hospitalizáció/.test(d.text)));
});

test('6.5: atípusos pozícionális nystagmus → centrális gyanú (CPPV)', () => {
  const r = L.evaluate({ ...stable, continuous: 'no', triggered: 'yes', 'tevs.state': 'calm', 'dh.right': 'atypical' });
  assert.equal(r.positional.result, 'central_suspect');
  assert.ok(r.actions.some((a) => /Neurológiai konzílium/.test(a.text)));
});

test('3. ábra: negatív pozícionális teszt → orthostasis teszt', () => {
  const base = { ...stable, continuous: 'no', triggered: 'yes', 'tevs.state': 'calm', 'dh.right': 'neg', 'dh.left': 'neg', roll: 'neg' };
  let r = L.evaluate(base);
  assert.equal(r.stage, 'tevs');
  r = L.evaluate({ ...base, 'orth.supSys': 130, 'orth.supDia': 80, 'orth.stSys': 105, 'orth.stDia': 78 });
  assert.ok(r.workingDx.some((d) => /Orthostaticus hypotonia/.test(d.text)));
  r = L.evaluate({ ...base, 'orth.supSys': 130, 'orth.supDia': 80, 'orth.stSys': 125, 'orth.stDia': 78 });
  assert.ok(r.alerts.some((a) => /s-EVS/.test(a.text)));
});

test('orthostasis: határértékek (≥20 / ≥10 Hgmm, POTS ≥30/perc)', () => {
  assert.equal(L.orthostasis({ 'orth.supSys': 120, 'orth.supDia': 80, 'orth.stSys': 100, 'orth.stDia': 80 }).positive, true);
  assert.equal(L.orthostasis({ 'orth.supSys': 120, 'orth.supDia': 80, 'orth.stSys': 101, 'orth.stDia': 71 }).positive, false);
  assert.equal(L.orthostasis({ 'orth.supSys': 120, 'orth.supDia': 80, 'orth.stSys': 118, 'orth.stDia': 70 }).positive, true);
  const p = L.orthostasis({ 'orth.supSys': 120, 'orth.supDia': 80, 'orth.supHr': 70, 'orth.stSys': 118, 'orth.stDia': 78, 'orth.stHr': 100 });
  assert.equal(p.positive, false);
  assert.equal(p.pots, true);
});

test('ABCD2: pontozás és sávok (Johnston 2007)', () => {
  const max = L.abcd2({ 'abcd2.age': 72, 'abcd2.sys': 160, 'abcd2.dia': 85, 'abcd2.clinical': 'weakness', 'abcd2.dur': '60+', 'abcd2.dm': 'yes' });
  assert.equal(max.score, 7);
  assert.equal(max.band, 'magas');
  const low = L.abcd2({ 'abcd2.age': 40, 'abcd2.sys': 120, 'abcd2.dia': 70, 'abcd2.clinical': 'none', 'abcd2.dur': '<10', 'abcd2.dm': 'no' });
  assert.equal(low.score, 0);
  assert.equal(low.band, 'alacsony');
  const mid = L.abcd2({ 'abcd2.age': 65, 'abcd2.sys': 120, 'abcd2.dia': 95, 'abcd2.clinical': 'speech', 'abcd2.dur': '10-59', 'abcd2.dm': 'no' });
  assert.equal(mid.score, 4);
  assert.equal(mid.band, 'közepes');
  assert.equal(L.abcd2({ 'abcd2.age': 65 }).complete, false);
});
