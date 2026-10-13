/*
 * MSTR Triage – besorolási logika (felnőtt MSTR, a kanadai CTAS magyar adaptációja).
 * Irányadó specifikáció: docs/mstr-triage-logika.md. Átemelve az SBC Portál prototípusából
 * (app/index.html, Triage komponens) – a küszöbök és a döntési szabály VÁLTOZATLANOK:
 * minden rögzített tényező egy javasolt szintet ad, a végeredmény a legsúlyosabb (legkisebb számú) szint.
 * A küszöbértékek módosítása csak a megrendelővel egyeztetve, dokumentáltan történhet.
 * Tiszta függvények; böngészőben window.TriageLogic, Node-ban module.exports.
 */
(function (root) {
  'use strict';

  var LEVELS = {
    1: { name: 'Reszuszcitáció / azonnali', reassess: 'Folyamatos ápolói felügyelet', hex: '#dc2626', fg: '#ffffff' },
    2: { name: 'Kritikus', reassess: '15 percenként', hex: '#f97316', fg: '#ffffff' },
    3: { name: 'Sürgős', reassess: '30 percenként', hex: '#facc15', fg: '#1a1a00' },
    4: { name: 'Kevésbé sürgős', reassess: '60 percenként', hex: '#16a34a', fg: '#ffffff' },
    5: { name: 'Halasztható', reassess: '120 percenként', hex: '#1e3a8a', fg: '#ffffff' },
  };

  var num = function (v) {
    if (v === null || v === undefined || v === '') return null;
    var n = Number(String(v).replace(',', '.'));
    return isFinite(n) ? n : null;
  };

  var RESP = { 1: 'Súlyos', 2: 'Közepes', 3: 'Enyhe', none: 'Nincs' };
  var CIRC = { 1: 'Sokk', 2: 'Instabil', 3: 'Határérték', none: 'Normál' };
  var FEVER = { immuno: [2, 'Immunhiányos'], septic: [2, 'Szeptikus küllem'], ill: [3, 'Súlyos beteg küllem'], well: [4, 'Jó általános állapot'] };
  var COAG = { 2: 'Súlyos vérzés', 3: 'Enyhe/közepes vérzés' };
  // Másodlagos módosítók – a specifikáció sorrendjében (egymástól függetlenül jelölhetők, mint a prototípusban)
  var SEC = [
    ['sec.gluc2', 2, 'Vércukor-eltérés tünetekkel'],
    ['sec.gluc3', 3, 'Vércukor-eltérés tünet nélkül'],
    ['sec.htn2', 2, 'RR ≥220/130 tünetekkel'],
    ['sec.htn3', 3, 'RR ≥220/130 tünet nélkül'],
    ['sec.cp2', 2, 'Szív eredetű mellkasi fájdalom'],
    ['sec.cva2', 2, 'Stroke tünetek <4,5 óra'],
    ['sec.cva3', 3, 'Stroke tünetek >4,5 óra v. megszűnt'],
    ['sec.dys2', 2, 'Nyelészavar nyáladzással + stridor'],
    ['sec.deform3', 3, 'Deformitással járó végtagsérülés'],
    ['sec.dehyd2', 2, 'Közepes kiszáradás'],
    ['sec.dehyd3', 3, 'Enyhe kiszáradás'],
  ];
  var PAIN_TABLE = {
    'central-acute': { severe: 2, moderate: 3, mild: 4 },
    'central-chronic': { severe: 3, moderate: 4, mild: 5 },
    'periph-acute': { severe: 3, moderate: 4, mild: 5 },
    'periph-chronic': { severe: 4, moderate: 5, mild: 5 },
  };

  function vitals(s) {
    var v = { hr: num(s['v.hr']), rr: num(s['v.rr']), sys: num(s['v.sys']), dia: num(s['v.dia']), spo2: num(s['v.spo2']), temp: num(s['v.temp']), pain: num(s['v.pain']) };
    var e = num(s['gcs.e']), vv = num(s['gcs.v']), m = num(s['gcs.m']);
    v.gcs = (e !== null && vv !== null && m !== null) ? { e: e, v: vv, m: m, total: e + vv + m } : null;
    v.gcsLevel = v.gcs === null ? null : v.gcs.total <= 9 ? 1 : v.gcs.total <= 13 ? 2 : null;
    v.spo2Level = v.spo2 === null ? null : v.spo2 < 90 ? 1 : v.spo2 <= 92 ? 2 : v.spo2 <= 94 ? 3 : null;
    v.feverPresent = v.temp !== null && v.temp >= 38;
    v.htnHigh = (v.sys !== null && v.sys >= 220) || (v.dia !== null && v.dia >= 130);
    var sirs = 0;
    if (v.temp !== null && (v.temp > 38 || v.temp < 36)) sirs++;
    if (v.hr !== null && v.hr > 90) sirs++;
    if (v.rr !== null && v.rr > 20) sirs++;
    if (s['wbc.abn']) sirs++;
    v.sirs = sirs;
    v.painSev = v.pain === null ? null : v.pain >= 8 ? 'severe' : v.pain >= 4 ? 'moderate' : v.pain >= 1 ? 'mild' : null;
    var key = s['pain.loc'] && s['pain.onset'] ? s['pain.loc'] + '-' + s['pain.onset'] : null;
    v.painLevel = key && v.painSev ? (PAIN_TABLE[key] || {})[v.painSev] || null : null;
    v.any = ['hr', 'rr', 'sys', 'spo2', 'temp', 'pain'].some(function (k) { return v[k] !== null; }) || v.gcs !== null;
    return v;
  }

  // A rögzített tényezők listája (sorrend = a prototípusé; a „meghatározó” az első, legsúlyosabb szintű tényező)
  function factors(s, v) {
    var f = [];
    if (s.critical) f.push({ label: 'Elsődleges megtekintés: azonnali beavatkozás', level: 1 });
    if (s.resp && s.resp !== 'none') f.push({ label: 'Légzés: ' + RESP[s.resp], level: Number(s.resp) });
    if (v.spo2Level) f.push({ label: 'Szaturáció ' + v.spo2 + '%', level: v.spo2Level });
    if (s.circ && s.circ !== 'none') f.push({ label: 'Keringés: ' + CIRC[s.circ], level: Number(s.circ) });
    if (v.gcsLevel) f.push({ label: 'Tudat (GCS ' + v.gcs.total + ')', level: v.gcsLevel });
    if (v.feverPresent && FEVER[s.fever]) f.push({ label: 'Láz: ' + FEVER[s.fever][1], level: FEVER[s.fever][0] });
    if (v.painLevel) f.push({ label: 'Fájdalom (VAS ' + v.pain + ')', level: v.painLevel });
    if (COAG[s.coag]) f.push({ label: 'Vérzés: ' + COAG[s.coag], level: Number(s.coag) });
    if (s.moi) f.push({ label: 'Magas rizikójú baleseti mechanizmus', level: 2 });
    SEC.forEach(function (x) { if (s[x[0]]) f.push({ label: x[2], level: x[1] }); });
    if (s.over) f.push({ label: 'Ápolói felül-triázsolás', level: Number(s.over) });
    return f;
  }

  function konzilium(s, list) {
    var k = list.filter(function (x, i) { return s['konz.' + i]; });
    if (s['konz.other']) String(s['konz.other']).split(',').map(function (x) { return x.trim(); }).filter(Boolean).forEach(function (x) { if (k.indexOf(x) < 0) k.push(x); });
    return k;
  }

  var KONZ = ['Sebészet', 'Traumatológia', 'Égéssebészet', 'Belgyógyászat', 'Kardiológia', 'Neurológia', 'Ortopédia', 'Szemészet', 'Fül-orr-gége', 'Nőgyógyászat', 'Urológia', 'Pszichiátria'];

  function evaluate(s) {
    s = s || {};
    var r = { category: null, stage: 'start', path: [], alerts: [], workingDx: [], actions: [], disposition: [], differentials: [] };
    var v = vitals(s);
    var f = factors(s, v);
    var levels = f.map(function (x) { return x.level; }).filter(Boolean);
    var level = levels.length ? Math.min.apply(null, levels) : null;
    var driver = f.filter(function (x) { return x.level === level; })[0] || null;
    r.v = v; r.factors = f; r.level = level; r.driver = driver;
    r.konz = konzilium(s, KONZ);
    if (level) r.category = 'L' + level;
    f.forEach(function (x) { r.path.push('MSTR ' + x.level + ' – ' + x.label); });

    if (s.critical) r.alerts.push({ level: 'danger', text: 'Azonnali beavatkozást igényel: MSTR 1 – a triázs nem késleltetheti az ellátást.', ref: 'MSTR spec.' });
    if (s['inf.csepp'] || s['inf.kontakt']) r.alerts.push({ level: 'warn', text: 'Izoláció / védőeszköz indokolt (' + [s['inf.csepp'] ? 'cseppfertőzés gyanú' : null, s['inf.kontakt'] ? 'kontakt fertőzés gyanú' : null].filter(Boolean).join(', ') + ').', ref: 'MSTR spec.' });
    if (v.sirs >= 3 && v.feverPresent) r.alerts.push({ level: 'warn', text: 'SIRS ' + v.sirs + '/4 lázzal – szeptikus küllem lehet.', ref: 'MSTR spec.' });
    if (v.htnHigh && !s['sec.htn2'] && !s['sec.htn3']) r.alerts.push({ level: 'info', text: 'Mért RR ≥220/130 – a másodlagos módosítóknál válassza ki tünet szerint.', ref: 'MSTR spec.' });
    if (level) r.actions.push({ text: 'Újraértékelés: ' + LEVELS[level].reassess + '.', ref: 'MSTR spec.' });
    if (s.fasttrack) r.disposition.push({ text: 'Fast track vizsgálóba kerül.', ref: 'MSTR spec.' });
    if (r.konz.length) r.disposition.push({ text: 'Konzílium: ' + r.konz.join(', ') + '.', ref: 'MSTR spec.' });

    // „Következő teendő” – a felvételi sorrend szerint (nem kötelező lépések, csak irányt mutat)
    if (s.critical) r.stage = 'done';
    else if (!s.complaint) r.stage = 'complaint';
    else if (!v.any) r.stage = 'vitals';
    else if (!s.resp || !s.circ) r.stage = 'qual';
    else r.stage = 'done';
    return r;
  }

  var api = { evaluate: evaluate, vitals: vitals, factors: factors, LEVELS: LEVELS, SEC: SEC, KONZ: KONZ, PAIN_TABLE: PAIN_TABLE };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.TriageLogic = api;
})(typeof window !== 'undefined' ? window : this);
