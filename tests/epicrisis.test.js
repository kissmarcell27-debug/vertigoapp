const test = require('node:test');
const assert = require('node:assert/strict');
const L = require('../js/logic.js');
const C = require('../js/content.js');
const E = require('../js/epicrisis.js');

const secs = (s) => Object.fromEntries(E.sections(s, L.evaluate(s), C).map((x) => [x.id, x.text]));
const stable = { unstable: 'no', focal: 'no', nonneuro: 'no' };

const periphAvs = {
  ...stable, 'hx.onset': 'tegnap este', 'rf.nausea': true, 'rf.vomiting': true, 'hx.hearing': 'no', 'hx.tinnitus': 'no', 'hx.trauma': 'no',
  'vit.sys': '135', 'vit.dia': '82', 'vit.hr': '88', 'vit.spo2': '97',
  continuous: 'yes', 'avs.trauma': 'no', 'avs.headache': 'no', 'avs.drug': 'no',
  'hints.hit': 'saccade', 'hints.hitSide': 'left', 'hints.nyst': 'horiz_unidir', 'hints.nystDir': 'right', 'hints.nystGrade': 'II',
  'hints.skew': 'neg', 'hints.hearing': 'none', 'stat.romberg': 'fall_left', 'avs.severe': 'no',
  'rx.arlevert': true, 'dc.state': 'better',
};

test('perifériás AVS: részek az osztályos fordulatokkal', () => {
  const x = secs(periphAvs);
  assert.match(x.complaint, /Szédülés miatt jelentkezett, panaszai kezdete: tegnap este\./);
  assert.match(x.complaint, /Hányinger és hányás kíséri\./);
  assert.match(x.complaint, /Halláscsökkenést, fülzúgást negál\./);
  assert.match(x.complaint, /Fejsérülés nem érte\./);
  assert.match(x.status, /^BP: 135\/82 Hgmm, P: 88\/min, SpO₂: 97%, T: ___°C/);
  assert.match(x.status, /EKG: ___/);
  assert.match(x.neuro, /Durva neurológiai gócjel nem észlelhető\./);
  assert.match(x.neuro, /Spontán, iránytartó, horizonto-rotatoros, jobbra csapó, II\. fokú nystagmus\./);
  assert.match(x.neuro, /Halmágyi-manőver bal oldalra fordításkor pozitív/);
  assert.match(x.neuro, /Hypacusis nincs\./);
  assert.match(x.epicrisis, /^A fentebb részletezett anamnézisű beteget szédülés miatt vizsgáltuk ambulanciánkon\./);
  assert.match(x.epicrisis, /harmonikus/);
  assert.match(x.epicrisis, /panaszai hátterében vestibularis neuronitis feltételezhető\./);
  assert.match(x.epicrisis, /otthonába emittáljuk/);
  assert.match(x.dx, /H81\.2/);
  assert.match(x.advice, /Arlevert/);
  assert.match(x.advice, /fül-orr-gégészeti szakrendelés/);
  assert.match(x.advice, /legközelebbi sürgősségi osztályon jelentkezzen/);
});

test('negálás csak kifejezett jelölésre', () => {
  const s = { ...stable, continuous: 'yes', 'rf.nausea': true };
  assert.doesNotMatch(secs(s).complaint, /negál/);
  const x = secs({ ...s, 'rf.denyRest': true });
  assert.match(x.complaint, /Hányást, fejfájást, kettőslátást, palpitációt, mellkasi fájdalmat, fulladást, eszméletvesztést negál\./);
  assert.doesNotMatch(x.complaint, /hányingert.*negál/);
});

test('centrális AVS: nem emittál, konzílium-helyet hagy', () => {
  const s = { ...stable, continuous: 'yes', 'avs.trauma': 'no', 'avs.headache': 'no', 'avs.drug': 'no', 'hints.hit': 'normal', 'hints.nyst': 'gaze_evoked', 'hints.skew': 'pos', 'hints.hearing': 'none' };
  const x = secs(s);
  assert.match(x.epicrisis, /centrális eredetre utal/);
  assert.match(x.epicrisis, /Neurológiai konzílium véleménye: ___/);
  assert.doesNotMatch(x.epicrisis, /emittáljuk/);
  assert.match(x.neuro, /Halmágyi-manőver mko\. negatív/);
  assert.match(x.dx, /R42/);
});

test('BPPV: neuro status, Epley, vezetés tilalma, H81.1', () => {
  const s = { ...stable, continuous: 'no', triggered: 'yes', 'tevs.state': 'calm', 'dh.right': 'typical', 'dh.left': 'neg', 'tevs.maneuver': 'yes', 'tevs.maneuverEffect': 'better', 'tevs.severity': 'mild' };
  const x = secs(s);
  assert.match(x.neuro, /Dix-Hallpike-manőver jobb oldalon pozitív/);
  assert.match(x.epicrisis, /jobb oldali, posterior ívjárati BPPV igazolódott/);
  assert.match(x.epicrisis, /Epley-manővert végeztem, ezt követően panaszai mérséklődtek/);
  assert.match(x.epicrisis, /nem észleltünk\. Sürgősségi/);
  assert.match(x.advice, /Epley-torna/);
  assert.match(x.advice, /Gépjárművet ne vezessen/);
  assert.match(x.dx, /H81\.1/);
});

test('kétoldali negatív Dix-Hallpike → „Mko. Dix-Hallpike-manőver negatív”', () => {
  const x = secs({ ...stable, continuous: 'no', triggered: 'yes', 'tevs.state': 'calm', 'dh.right': 'neg', 'dh.left': 'neg' });
  assert.match(x.neuro, /Mko\. Dix-Hallpike-manőver negatív\./);
});

test('s-EVS magas TIA kockázat: G45.0, nem emittál', () => {
  const x = secs({ ...stable, continuous: 'no', triggered: 'no', 'sevs.tiaRisk': 'high' });
  assert.match(x.dx, /G45\.0/);
  assert.doesNotMatch(x.epicrisis, /emittáljuk/);
});

test('teljes szöveg összefűzése', () => {
  const t = E.epicrisis({ ...periphAvs, note: 'teszt' }, L.evaluate(periphAvs), C);
  assert.match(t, /^JELEN PANASZ:\n/);
  assert.match(t, /\n\nEPIKRÍZIS:\n/);
  assert.match(t, /Megjegyzés: teszt$/);
});
