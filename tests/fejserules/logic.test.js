const test = require('node:test');
const assert = require('node:assert/strict');
const L = require('../../protocols/fejserules/logic.js');
const D = require('../../protocols/fejserules/docs.js');

const T = { etiology: 'trauma', critical: 'no' };
const gcs15 = { 'gcs.e': '4', 'gcs.v': '5', 'gcs.m': '6' };
const docs = (s) => Object.fromEntries(D.sections(s, L.evaluate(s)).map((x) => [x.id, x.text]));

test('kritérium nélkül nincs besorolás, amíg nincs megerősítve az alacsony kockázat', () => {
  assert.equal(L.evaluate({ ...T, ...gcs15 }).stage, 'risk');
  const r = L.evaluate({ ...T, ...gcs15, 'risk.none': true });
  assert.equal(r.category, 'LOW');
  assert.equal(r.ct.indicated, false);
});

test('alacsony kockázat: CT nélkül emittálható, ha a feltételek teljesülnek (GCS-feltétel nélkül)', () => {
  const r = L.evaluate({ ...T, ...gcs15, 'risk.none': true, 'dc.noother': 'yes', 'dc.supervision': 'yes' });
  assert.equal(r.discharge, true);
  assert.ok(r.disposition.some((d) => /Emittálható/.test(d.text)));
});

test('GCS ≤12 → magas kockázat, CT 1 órán belül, CI–CII kiegészítés, nyaki CT', () => {
  const r = L.evaluate({ ...T, 'gcs.e': '2', 'gcs.v': '3', 'gcs.m': '5' });
  assert.equal(r.gcs.total, 10);
  assert.equal(r.category, 'HIGH');
  assert.equal(r.ct.timing, '1h');
  assert.ok(r.actions.some((a) => /CI–CII/.test(a.text)));
  assert.ok(r.actions.some((a) => /Nyaki gerinc CT/.test(a.text)));
});

test('GCS <8 → emelt szintű légútbiztosítás figyelmeztetés', () => {
  const r = L.evaluate({ ...T, 'gcs.e': '1', 'gcs.v': '2', 'gcs.m': '4' });
  assert.ok(r.alerts.some((a) => /légútbiztosítás/.test(a.text)));
});

test('közepes kockázat: ≥2 hányás, ill. >70 év (de jelentéktelen sérülésnél nem)', () => {
  assert.equal(L.riskGroup({ 'vomit.n': '2' }).level, 'moderate');
  assert.equal(L.riskGroup({ 'pt.age': '75' }).level, 'moderate');
  assert.equal(L.riskGroup({ 'pt.age': '75', 'mr.trivial': true }).level, null);
});

test('CT 8 órás szabály: eszméletvesztés + ≥65 év; >8 óra után 1 órán belül', () => {
  const base = { ...T, ...gcs15, 'mr.loc': true, 'pt.age': '66' };
  assert.equal(L.evaluate(base).ct.timing, '8h');
  assert.equal(L.evaluate({ ...base, 'ct.over8h': true }).ct.timing, '1h');
});

test('CT 1 órás szabály: >1 hányás vagy koponyaalapi törés jele', () => {
  assert.equal(L.evaluate({ ...T, ...gcs15, 'vomit.n': '2' }).ct.timing, '1h');
  assert.equal(L.evaluate({ ...T, ...gcs15, 'mr.basal': true }).ct.timing, '1h');
});

test('közepes kockázat, negatív CT → emisszió a feltételek teljesülésekor', () => {
  const s = { ...T, ...gcs15, 'mr.loc': true, 'ct.result': 'neg' };
  let r = L.evaluate(s);
  assert.equal(r.discharge, undefined);
  assert.deepEqual(r.dischargePending.length, 3);
  r = L.evaluate({ ...s, 'dc.gcs': 'yes', 'dc.noother': 'yes', 'dc.supervision': 'yes' });
  assert.equal(r.discharge, true);
});

test('hospitalizációs kritérium felülírja az emissziót', () => {
  const r = L.evaluate({ ...T, ...gcs15, 'mr.loc': true, 'ct.result': 'neg', 'adm.symptoms': true, 'dc.gcs': 'yes', 'dc.noother': 'yes', 'dc.supervision': 'yes' });
  assert.equal(r.discharge, false);
  assert.ok(r.disposition.some((d) => /Hospitalizáció/.test(d.text)));
});

test('magas kockázat, negatív CT → obszerváció', () => {
  const r = L.evaluate({ ...T, ...gcs15, 'hr.mechanism': true, 'ct.result': 'neg' });
  assert.ok(r.disposition.some((d) => /obszerváció/.test(d.text)));
});

test('pozitív CT → idegsebész; antikoagulált → PCC; SAV → CTA', () => {
  const r = L.evaluate({ ...T, ...gcs15, 'mr.coag': true, 'sp.anticoag': 'vka', inr: '2.5', 'ct.result': 'pos', 'ct.sah': true });
  assert.equal(r.category, 'POSITIVE');
  assert.ok(r.actions.some((a) => /idegsebészeti konzílium/.test(a.text)));
  assert.ok(r.actions.some((a) => /PCC/.test(a.text)));
  assert.ok(r.actions.some((a) => /CTA/.test(a.text)));
});

test('antikoagulált, közepes, tünetmentes: INR >1,4 → azonnali CT és 12 órás obszerváció', () => {
  const s = { ...T, ...gcs15, 'mr.coag': true, 'sp.anticoag': 'vka', inr: '1.8' };
  let r = L.evaluate(s);
  assert.equal(r.special.ctTiming, 'now');
  r = L.evaluate({ ...s, 'ct.result': 'neg' });
  assert.ok(r.disposition.some((d) => /12 órás obszerváció/.test(d.text)));
  r = L.evaluate({ ...s, 'ct.result': 'neg', 'obs.result': 'symptoms' });
  assert.ok(r.actions.some((a) => /Kontroll non-contrast CT és idegsebészeti rekonzílium/.test(a.text)));
  r = L.evaluate({ ...s, 'ct.result': 'neg', 'obs.result': 'free', 'dc.gcs': 'yes', 'dc.noother': 'yes', 'dc.supervision': 'yes' });
  assert.equal(r.discharge, true);
});

test('antikoagulált: INR <1,4 → CT 4 óra múlva, negatív → emisszió; INR = 1,4 → biztonságosabb út', () => {
  const s = { ...T, ...gcs15, 'mr.coag': true, 'sp.anticoag': 'noac', inr: '1.1' };
  assert.equal(L.evaluate(s).special.ctTiming, '4h');
  const r = L.evaluate({ ...s, inr: '1.4' });
  assert.equal(r.special.ctTiming, 'now');
  assert.ok(r.alerts.some((a) => /INR = 1,4/.test(a.text)));
  assert.ok(r.alerts.some((a) => /NOAC/.test(a.text)));
});

test('antikoagulált INR nélkül → kéri az INR-t', () => {
  const r = L.evaluate({ ...T, ...gcs15, 'mr.coag': true, 'sp.anticoag': 'vka' });
  assert.equal(r.stage, 'ct');
  assert.ok(r.alerts.some((a) => /adja meg az INR/.test(a.text)));
  assert.ok(r.alerts.some((a) => /INR levétele minden esetben kötelező/.test(a.text)));
});

test('TAG-gátló: tünetmentes → 4 óra; >2 hányás → azonnali CT', () => {
  const s = { ...T, ...gcs15, 'mr.coag': true, 'sp.tag': 'yes' };
  assert.equal(L.evaluate(s).special.ctTiming, '4h');
  assert.equal(L.evaluate({ ...s, 'sp.amnesia': true }).special.ctTiming, 'now');
  // 3 hányás: a TAG-szabály (>2) szerint tünetes; egyúttal 1 órás CT-kritérium (>1 hányás) is
  assert.equal(L.evaluate({ ...s, 'vomit.n': '3' }).special.ctTiming, 'now');
});

test('nem traumás: SAV → CTA; nagy ICH → idegsebész; diszpozíció a típus szerint', () => {
  const r = L.evaluate({ etiology: 'nontrauma', 'nt.type': 'sah', 'nt.large': 'yes' });
  assert.equal(r.category, 'NONTRAUMA');
  assert.ok(r.actions.some((a) => /CTA/.test(a.text)));
  assert.ok(r.actions.some((a) => /idegsebészeti konzultáció/.test(a.text)));
  assert.ok(r.disposition.some((d) => /OMIII/.test(d.text)));
  assert.ok(L.evaluate({ etiology: 'nontrauma', 'nt.type': 'deep' }).disposition.some((d) => /stroke-centrum/.test(d.text)));
});

test('kalkulátorok: 15%-os vérnyomás-határ és súlyalapú dózisok', () => {
  assert.deepEqual(L.bpTargets({ 'bp.sys': '200' }), { sys: 200, floor1h: 170, zone: '150-220' });
  assert.equal(L.bpTargets({ 'bp.sys': '230' }).zone, 'over220');
  assert.equal(L.bpTargets({ 'bp.sys': '85' }).zone, 'hypo');
  const d = L.doses({ wt: '80' });
  assert.deepEqual(d.diazepam, [8, 16]);
  assert.deepEqual(d.phenytoin, [1200, 1600]);
  assert.deepEqual(d.mannitol, [20, 80]);
  assert.deepEqual(d.fentanyl, [80, 160]);
  assert.deepEqual(d.noradrenalin, [8, 80]);
});

test('dokumentáció: tájékoztató-átadás csak jelölésre; negatív CT szövege', () => {
  const s = { ...T, ...gcs15, 'mr.loc': true, 'ct.result': 'neg', 'dc.gcs': 'yes', 'dc.noother': 'yes', 'dc.supervision': 'yes', 'inj.mech': 'saját magasságból történt elesés' };
  let x = docs(s);
  assert.match(x.complaint, /^Saját magasságból történt elesés következtében elszenvedett fejsérülés/);
  assert.match(x.complaint, /Eszméletvesztése volt/);
  assert.match(x.imaging, /intracranialis vérzés, traumás eltérés nem ábrázolódott/);
  assert.match(x.epicrisis, /otthonába bocsátjuk/);
  assert.match(x.epicrisis, /tájékoztató átadása: ___/);
  x = docs({ ...s, 'leaflet.given': true });
  assert.match(x.epicrisis, /tájékoztatót megkapta/);
  assert.match(x.advice, /48 órában ne maradjon egyedül/);
  assert.match(x.dx, /S06\.0/);
  assert.match(x.status, /GCS: 15 \(E4 V5 M6\)/);
});

test('dokumentáció: pozitív CT – típus, BNO, konzílium-hely', () => {
  const x = docs({ ...T, ...gcs15, 'hr.mechanism': true, 'ct.result': 'pos', 'ct.sdh': true, 'ns.decision': 'obs' });
  assert.match(x.imaging, /subduralis vérzés ábrázolódott/);
  assert.match(x.epicrisis, /Idegsebészeti konzílium véleménye: ___/);
  assert.match(x.epicrisis, /SBO fektető részlegen obszerváljuk/);
  assert.match(x.dx, /S06\.5/);
  assert.doesNotMatch(x.epicrisis, /otthonába/);
});

test('antikoagulált emisszió → figyelmeztetés a „vérhígító” tanácsra', () => {
  const r = L.evaluate({ ...T, ...gcs15, 'mr.coag': true, 'sp.anticoag': 'vka', inr: '1.1', 'ct.result': 'neg', 'dc.gcs': 'yes', 'dc.noother': 'yes', 'dc.supervision': 'yes' });
  assert.equal(r.discharge, true);
  assert.ok(r.alerts.some((a) => /vérhígító/.test(a.text)));
  const adv = D.sections({ ...T, ...gcs15, 'mr.coag': true, 'sp.anticoag': 'vka', inr: '1.1', 'ct.result': 'neg', 'dc.gcs': 'yes', 'dc.noother': 'yes', 'dc.supervision': 'yes' }, r).find((x) => x.id === 'advice').text;
  assert.doesNotMatch(adv, /vérhígító szert ne szedjen/);
  assert.match(adv, /Alvadásgátló \/ thrombocytaaggregáció-gátló gyógyszerének további szedése: ___/);
});

test('Jelen panasz nagybetűvel indul akkor is, ha csak a mechanizmus ismert', () => {
  const x = docs({ ...T, ...gcs15, 'risk.none': true, 'inj.mech': 'saját magasságból történt elesés' });
  assert.match(x.complaint, /^Saját magasságból történt elesés következtében elszenvedett fejsérülés miatt jelentkezett\./);
});
