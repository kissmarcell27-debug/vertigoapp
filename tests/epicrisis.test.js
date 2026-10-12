const test = require('node:test');
const assert = require('node:assert/strict');
const L = require('../js/logic.js');
const C = require('../js/content.js');
const E = require('../js/epicrisis.js');

const epi = (s) => E.epicrisis(s, L.evaluate(s), C);
const stable = { unstable: 'no', focal: 'no', nonneuro: 'no' };

test('perifériás AVS, hazabocsátás: epikrízis + javaslat + BNO', () => {
  const s = {
    ...stable, 'pt.age': '54', 'hx.onset': 'tegnap este', 'rf.nausea': true, 'rf.vomiting': true,
    'vit.sys': '135', 'vit.dia': '82', 'vit.hr': '88', 'vit.spo2': '97',
    continuous: 'yes', 'avs.trauma': 'no', 'avs.headache': 'no', 'avs.drug': 'no',
    'hints.hit': 'saccade', 'hints.hitSide': 'left', 'hints.nyst': 'horiz_unidir', 'hints.nystDir': 'right', 'hints.nystGrade': 'II',
    'hints.skew': 'neg', 'hints.hearing': 'none', 'stat.romberg': 'fall_left', 'avs.severe': 'no',
    'rx.arlevert': true, 'dc.state': 'better',
  };
  const t = epi(s);
  assert.match(t, /A 54 éves beteg szédülés miatt jelentkezett/);
  assert.match(t, /hányinger és hányás/);
  assert.match(t, /RR: 135\/82 Hgmm, P: 88\/perc, SpO2: 97%/);
  assert.match(t, /korrekciós szakkád észlelhető a fej bal oldalra fordításakor/);
  assert.match(t, /jobbra csapó, II\. fokú/);
  assert.match(t, /harmonikus/);
  assert.match(t, /vestibularis neuronitisnek/);
  assert.match(t, /otthonába bocsátható/);
  assert.match(t, /Arlevert/);
  assert.match(t, /fül-orr-gégészeti kontroll/);
  assert.match(t, /H81\.2/);
  assert.match(t, /EKG: ___/); // nem megadott adat → kitöltendő
});

test('centrális AVS: nem bocsát haza, konzílium-helyet hagy', () => {
  const s = { ...stable, continuous: 'yes', 'avs.trauma': 'no', 'avs.headache': 'no', 'avs.drug': 'no', 'hints.hit': 'normal', 'hints.nyst': 'gaze_evoked', 'hints.skew': 'pos', 'hints.hearing': 'none' };
  const t = epi(s);
  assert.match(t, /centrális eredetre utal/);
  assert.match(t, /Neurológiai konzílium véleménye: ___/);
  assert.doesNotMatch(t, /otthonába bocsátható/);
  assert.match(t, /R42/);
});

test('BPPV: Epley, betegtájékoztató, vezetés tilalma, H81.1', () => {
  const s = { ...stable, continuous: 'no', triggered: 'yes', 'tevs.state': 'calm', 'dh.right': 'typical', 'dh.left': 'neg', 'tevs.maneuver': 'yes', 'tevs.maneuverEffect': 'better', 'tevs.severity': 'mild' };
  const t = epi(s);
  assert.match(t, /jobb oldali, posterior ívjárati BPPV/);
  assert.match(t, /Epley-manővert végeztünk, ezt követően panaszai mérséklődtek/);
  assert.match(t, /Epley-torna/);
  assert.match(t, /Gépjárművet ne vezessen/);
  assert.match(t, /H81\.1/);
});

test('nem jelölt tünetet nem tagad és nem állít', () => {
  const t = epi({ ...stable, continuous: 'yes' });
  assert.doesNotMatch(t, /tagad/);
  assert.doesNotMatch(t, /Kísérő tünetként/);
  assert.doesNotMatch(t, /Epley|Arlevert/);
});

test('s-EVS magas TIA kockázat: G45.0, nincs hazabocsátás', () => {
  const t = epi({ ...stable, continuous: 'no', triggered: 'no', 'sevs.tiaRisk': 'high' });
  assert.match(t, /G45\.0/);
  assert.doesNotMatch(t, /otthonába bocsátható/);
});
