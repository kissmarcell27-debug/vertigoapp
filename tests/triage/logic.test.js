// MSTR triázs: a docs/mstr-triage-logika.md küszöbei és döntési szabálya.
const test = require('node:test');
const assert = require('node:assert/strict');
const L = require('../../protocols/triage/logic.js');
const D = require('../../protocols/triage/docs.js');

const lvl = (s) => L.evaluate(s).level;

test('üres állapot: nincs szint, első teendő a vezető panasz', () => {
  const r = L.evaluate({});
  assert.equal(r.level, null);
  assert.equal(r.category, null);
  assert.equal(r.stage, 'complaint');
});

test('SpO₂ küszöbök: <90 → 1, 90–92 → 2, 93–94 → 3, >94 nem emel', () => {
  for (const [v, exp] of [[89, 1], [89.9, 1], [90, 2], [92, 2], [93, 3], [94, 3], [95, null], [99, null]]) {
    assert.equal(lvl({ 'v.spo2': String(v) }), exp, 'SpO₂ ' + v);
  }
});

test('GCS: 3–9 → 1, 10–13 → 2, 14–15 nem emel; hiányos GCS nem számol', () => {
  const g = (e, v, m) => ({ 'gcs.e': String(e), 'gcs.v': String(v), 'gcs.m': String(m) });
  assert.equal(lvl(g(1, 1, 1)), 1);
  assert.equal(lvl(g(2, 2, 5)), 1); // 9
  assert.equal(lvl(g(3, 2, 5)), 2); // 10
  assert.equal(lvl(g(3, 4, 6)), 2); // 13
  assert.equal(lvl(g(4, 4, 6)), null); // 14
  assert.equal(lvl(g(4, 5, 6)), null); // 15
  assert.equal(lvl({ 'gcs.e': '1', 'gcs.v': '1' }), null);
});

test('láz csak ≥38 °C-nál számít; a küllem adja a szintet', () => {
  assert.equal(lvl({ 'v.temp': '37.9', fever: 'immuno' }), null);
  assert.equal(lvl({ 'v.temp': '38', fever: 'immuno' }), 2);
  assert.equal(lvl({ 'v.temp': '38,5', fever: 'septic' }), 2);
  assert.equal(lvl({ 'v.temp': '39', fever: 'ill' }), 3);
  assert.equal(lvl({ 'v.temp': '39', fever: 'well' }), 4);
  assert.equal(lvl({ 'v.temp': '39' }), null, 'küllem nélkül a láz nem ad szintet');
});

test('SIRS: testhő >38 v. <36, pulzus >90, légzésszám >20, FVS – határértékek nem számítanak', () => {
  const v = (s) => L.vitals(s).sirs;
  assert.equal(v({ 'v.temp': '38', 'v.hr': '90', 'v.rr': '20' }), 0);
  assert.equal(v({ 'v.temp': '38.1', 'v.hr': '91', 'v.rr': '21', 'wbc.abn': true }), 4);
  assert.equal(v({ 'v.temp': '35.9' }), 1);
  assert.equal(v({ 'v.temp': '36' }), 0);
});

test('SIRS ≥3 lázzal figyelmeztet; ≥220/130 RR módosító nélkül jelez', () => {
  const r = L.evaluate({ 'v.temp': '38.5', 'v.hr': '120', 'v.rr': '24' });
  assert.ok(r.alerts.some((a) => /SIRS 3\/4/.test(a.text)));
  assert.ok(L.evaluate({ 'v.sys': '220' }).alerts.some((a) => /220\/130/.test(a.text)));
  assert.ok(L.evaluate({ 'v.dia': '130' }).alerts.some((a) => /220\/130/.test(a.text)));
  assert.ok(!L.evaluate({ 'v.sys': '219', 'v.dia': '129' }).alerts.some((a) => /220\/130/.test(a.text)));
  assert.ok(!L.evaluate({ 'v.sys': '230', 'sec.htn3': true }).alerts.some((a) => /220\/130/.test(a.text)));
  assert.equal(lvl({ 'v.sys': '230' }), null, 'a mért RR önmagában nem ad szintet');
});

test('fájdalom: VAS-sáv × hely × jelleg táblázat', () => {
  const p = (vas, loc, onset) => lvl({ 'v.pain': String(vas), 'pain.loc': loc, 'pain.onset': onset });
  const cases = [
    [9, 'central', 'acute', 2], [5, 'central', 'acute', 3], [2, 'central', 'acute', 4],
    [8, 'central', 'chronic', 3], [4, 'central', 'chronic', 4], [1, 'central', 'chronic', 5],
    [10, 'periph', 'acute', 3], [7, 'periph', 'acute', 4], [3, 'periph', 'acute', 5],
    [8, 'periph', 'chronic', 4], [4, 'periph', 'chronic', 5], [1, 'periph', 'chronic', 5],
  ];
  for (const [vas, loc, onset, exp] of cases) assert.equal(p(vas, loc, onset), exp, `${vas} ${loc} ${onset}`);
  assert.equal(p(0, 'central', 'acute'), null, 'VAS 0 nem emel');
  assert.equal(lvl({ 'v.pain': '9', 'pain.loc': 'central' }), null, 'jelleg nélkül nincs szint');
});

test('légzés, keringés, vérzés, mechanizmus, másodlagos módosítók', () => {
  assert.equal(lvl({ resp: '1' }), 1);
  assert.equal(lvl({ resp: '3' }), 3);
  assert.equal(lvl({ resp: 'none' }), null);
  assert.equal(lvl({ circ: '2' }), 2);
  assert.equal(lvl({ circ: 'none' }), null);
  assert.equal(lvl({ coag: '2' }), 2);
  assert.equal(lvl({ coag: '3' }), 3);
  assert.equal(lvl({ moi: true }), 2);
  for (const [k, l] of L.SEC) assert.equal(lvl({ [k]: true }), l, k);
});

test('a végeredmény a legsúlyosabb szint; meghatározó az első ilyen szintű tényező', () => {
  const r = L.evaluate({ 'v.spo2': '93', circ: '2', coag: '2', 'sec.deform3': true });
  assert.equal(r.level, 2);
  assert.equal(r.category, 'L2');
  assert.equal(r.driver.label, 'Keringés: Instabil');
  assert.equal(r.factors.length, 4);
  // a légzés felfelé írhatja a SpO₂ padlót
  assert.equal(lvl({ 'v.spo2': '93', resp: '1' }), 1);
});

test('felül-triázsolás csak emelhet, nem csökkenthet', () => {
  assert.equal(lvl({ 'sec.dehyd3': true, over: '2' }), 2);
  assert.equal(lvl({ resp: '1', over: '3' }), 1);
});

test('azonnali beavatkozás: MSTR 1, figyelmeztetés, egyből a jegyzőkönyvhöz', () => {
  const r = L.evaluate({ critical: true });
  assert.equal(r.level, 1);
  assert.equal(r.stage, 'done');
  assert.ok(r.alerts.some((a) => a.level === 'danger'));
});

test('izoláció, újraértékelés, fast track, konzílium (lista + egyéni, ismétlés nélkül)', () => {
  const r = L.evaluate({ 'inf.kontakt': true, 'sec.cp2': true, fasttrack: true, 'konz.4': true, 'konz.other': 'Kardiológia, Toxikológia ,  ' });
  assert.ok(r.alerts.some((a) => /kontakt/.test(a.text)));
  assert.ok(r.actions.some((a) => /15 percenként/.test(a.text)));
  assert.deepEqual(r.konz, ['Kardiológia', 'Toxikológia']);
  assert.ok(r.disposition.some((a) => /Fast track/.test(a.text)));
});

test('következő teendő: panasz → vitálisok → kvalitatív megítélés → kész', () => {
  assert.equal(L.evaluate({ complaint: 'Fejfájás' }).stage, 'vitals');
  assert.equal(L.evaluate({ complaint: 'Fejfájás', 'v.hr': '80' }).stage, 'qual');
  assert.equal(L.evaluate({ complaint: 'Fejfájás', 'v.hr': '80', resp: 'none', circ: 'none' }).stage, 'done');
});

test('jegyzőkönyv: a prototípus formátuma, etikett, kötelező figyelmeztetés', () => {
  const s = { time: '2026-10-13T14:05', arrival: 'Mentő', complaint: 'Mellkasi fájdalom – szív eredetű', 'v.hr': '110', 'v.sys': '150', 'v.dia': '90',
    'gcs.e': '4', 'gcs.v': '5', 'gcs.m': '6', 'sec.cp2': true, nurse: 'Teszt Ápoló', narr: 'Reggel óta tartó szorító fájdalom.' };
  const r = L.evaluate(s);
  const t = D.text(s, r);
  assert.match(t, /^TRIÁZS JEGYZŐKÖNYV – Honvédkórház, Sürgősségi Centrum\nIdőpont: 2026-10-13 14:05\nBeteg azonosító: \(etikett\)\nÉrkezés módja: Mentő/);
  assert.match(t, /  Vérnyomás: 150\/90 Hgmm/);
  assert.match(t, /  GCS: 15 \(Sz4 V5 M6\)/);
  assert.match(t, /  Légzésszám: – \/min/);
  assert.match(t, /MEGÁLLAPÍTOTT TRIÁZS SZINT: MSTR 2 – Kritikus \(újraértékelés: 15 percenként\)/);
  assert.match(t, /  • \[MSTR 2\] Szív eredetű mellkasi fájdalom/);
  assert.match(t, /Diszpozíció: —/);
  assert.ok(t.endsWith(D.WARN_TEXT));
  const h = D.html(s, r);
  assert.match(h, /6 × 3 cm/);
  assert.ok(h.includes(D.WARN_PRINT));
  assert.ok(h.includes('#f97316'));
  assert.ok(!/window\.print/.test(h));
  assert.ok(/window\.print/.test(D.html(s, r, { autoPrint: true })));
  assert.equal(D.fileName(s), 'triazs_2026-10-13-14-05.html');
});

test('jegyzőkönyv: a szabad szöveg HTML-ként escapelve kerül a nyomtatott lapra', () => {
  const s = { complaint: '<script>x</script>', narr: 'a & b' };
  const h = D.html(s, L.evaluate(s));
  assert.ok(!h.includes('<script>x'));
  assert.ok(h.includes('&lt;script&gt;x') && h.includes('a &amp; b'));
});
