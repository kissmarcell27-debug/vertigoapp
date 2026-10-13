/*
 * Eljárásrend-modul: MSTR Triage segéd (felnőtt) – az SBC Portál triázs-moduljából átemelve.
 * A lépések a prototípus felületi sorrendjét követik (docs/mstr-triage-logika.md, „A triázs folyamata”).
 * Függ: SBO, TriageLogic, TriageContent, TriageDocs.
 */
(function () {
  'use strict';

  var L = window.TriageLogic;
  var C = window.TriageContent;
  var D = window.TriageDocs;
  var LV = L.LEVELS;

  var WARNING = 'Döntéstámogató eszköz, nem helyettesíti a klinikai megítélést. Kritikus állapotban a triázs ne késleltesse az ellátást. Kétség esetén felfelé triázsolj.';
  function esc(t) { return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function badge(l) { return '<span class="mstr l' + l + '">MSTR ' + l + '</span>'; }
  function lvl(l, text) { return text + ' → ' + l; }
  var range = function (a, b) { var o = []; for (var i = a; i <= b; i++) o.push({ v: String(i), l: String(i) }); return o; };
  var hasPain = function (s, r) { return r.v.pain !== null && r.v.pain >= 1; };

  var STEPS = [
    {
      id: 'start', title: 'Felvétel, elsődleges megtekintés', ref: 'MSTR 1. lépés',
      fields: [
        { type: 'note', level: 'info', html: 'Betegazonosító nem kerül rögzítésre – a nyomtatott lapra ragasztható etikett. Az adatok csak a böngésző memóriájában vannak.' },
        { type: 'text', input: 'datetime-local', key: 'time', label: 'Érkezés ideje' },
        { type: 'note', level: 'info', html: '<button type="button" class="btn small" data-action="now">Most</button> – az aktuális időpont beírása.' },
        { type: 'text', key: 'nurse', label: 'Triázs ápoló (név / azonosító)' },
        { type: 'choice', key: 'arrival', label: 'Érkezés módja', options: [{ v: 'Saját láb', l: 'Saját láb' }, { v: 'Mentő', l: 'Mentő' }, { v: 'Egyéb', l: 'Egyéb' }] },
        { type: 'heading', label: 'Azonnali ellátást igényel? (ABCD, 3–5 mp)' },
        { type: 'check', key: 'critical', label: 'Igen – keringés-/légzésmegállás, súlyos sokk, eszméletlenség, zajló görcs → MSTR 1' },
        { type: 'note', level: 'danger', when: function (s) { return !!s.critical; }, html: '<b>MSTR 1.</b> Azonnali ellátás – a további adatfelvétel nem késleltetheti.' },
        { type: 'check', key: 'inf.csepp', label: 'Cseppfertőzés gyanú' },
        { type: 'check', key: 'inf.kontakt', label: 'Kontakt fertőzés gyanú' },
        { type: 'note', level: 'warn', when: function (s) { return s['inf.csepp'] || s['inf.kontakt']; }, html: 'Izoláció / védőeszköz indokolt.' },
      ],
    },
    {
      id: 'complaint', title: 'Vezető panasz', ref: 'MSTR 2. lépés (CEDIS)',
      fields: [
        { type: 'text', key: 'complaint', label: 'Vezető panasz – kezdjen el gépelni a CEDIS-listából választáshoz, vagy írjon be sajátot', list: C.COMPLAINTS.map(function (x) { return { v: x[1], l: x[0] }; }) },
        { type: 'widget', name: 'complaintGroup' },
      ],
    },
    {
      id: 'vitals', title: 'Vitális paraméterek', ref: 'MSTR 3. lépés',
      fields: [
        { type: 'note', level: 'info', html: 'Mérés a kikérdezés közben – az értékek automatikusan jelzik a szintet és a SIRS-t.' },
        { type: 'num', key: 'v.hr', label: 'Pulzus (/min)' },
        { type: 'num', key: 'v.rr', label: 'Légzésszám (/min)' },
        { type: 'num2', keys: ['v.sys', 'v.dia'], ph: ['szisztolés', 'diasztolés'], label: 'Vérnyomás (Hgmm)' },
        { type: 'num', key: 'v.spo2', label: 'Szaturáció (%)' },
        { type: 'num', key: 'v.temp', label: 'Testhő (°C)' },
        { type: 'num', key: 'v.pain', label: 'Fájdalom (VAS 0–10)' },
        { type: 'heading', label: 'GCS – Glasgow Coma Scale' },
        { type: 'choice', key: 'gcs.e', label: 'Szem (1–4)', options: range(1, 4) },
        { type: 'choice', key: 'gcs.v', label: 'Verbál (1–5)', options: range(1, 5) },
        { type: 'choice', key: 'gcs.m', label: 'Mozgás (1–6)', options: range(1, 6) },
        { type: 'check', key: 'wbc.abn', label: 'FVS-eltérés (>12 / <4 ezer)' },
        { type: 'widget', name: 'vitalFlags' },
      ],
    },
    {
      id: 'qual', title: 'Légzés, keringés, láz, fájdalom', ref: 'MSTR 4. lépés',
      fields: [
        { type: 'widget', name: 'respHint' },
        { type: 'choice', key: 'resp', label: 'Légzési munka', options: [
          { v: '1', l: lvl(1, 'Súlyos – cianózis, kimerült, beszédképtelen, lélegeztetés-igény') },
          { v: '2', l: lvl(2, 'Közepes – fokozott munka, rövid mondatok, jelentős stridor') },
          { v: '3', l: lvl(3, 'Enyhe – csak terhelésre, összefüggő beszéd') },
          { v: 'none', l: 'Nincs nehézlégzés' }] },
        { type: 'widget', name: 'circHint' },
        { type: 'choice', key: 'circ', label: 'Keringési állapot', options: [
          { v: '1', l: lvl(1, 'Sokk – hipoperfúzió, hipotónia, hűvös bőr, gyenge pulzus') },
          { v: '2', l: lvl(2, 'Instabil – indokolatlan tahikardia, ortosztázis, ájulásérzés') },
          { v: '3', l: lvl(3, 'Határérték / eltér a megszokottól') },
          { v: 'none', l: 'Normál keringés' }] },
        { type: 'choice', key: 'fever', label: 'Láz megítélése (testhő ≥38 °C) – küllem', when: function (s, r) { return r.v.feverPresent; }, options: [
          { v: 'immuno', l: lvl(2, 'Immunhiányos / csökkent immunválasz (neutropénia, kemoterápia, szteroid)') },
          { v: 'septic', l: lvl(2, 'Szeptikus küllem – ≥3 SIRS / instabil / közepes nehézlégzés / módosult tudat') },
          { v: 'ill', l: lvl(3, 'Súlyos beteg küllem – <3 SIRS') },
          { v: 'well', l: lvl(4, 'Jó általános állapot – a láz az egyetlen pozitív SIRS') }] },
        { type: 'note', level: 'info', when: function (s, r) { return !hasPain(s, r); }, html: 'Fájdalom besorolása: nincs VAS-érték felvéve (a vitális paramétereknél adható meg).' },
        { type: 'choice', key: 'pain.loc', label: 'Fájdalom helye', when: hasPain, options: [
          { v: 'central', l: 'Centrális (fej, mellkas, has, szem, here)' }, { v: 'periph', l: 'Perifériás (bőr, lágyrész, mozgásszervi)' }] },
        { type: 'choice', key: 'pain.onset', label: 'Fájdalom jellege', when: hasPain, options: [
          { v: 'acute', l: 'Heveny (< 1 hónap)' }, { v: 'chronic', l: 'Krónikus' }] },
        { type: 'widget', name: 'painHint', when: hasPain },
      ],
    },
    {
      id: 'bleed', title: 'Vérzés, baleseti mechanizmus', ref: 'MSTR 5. lépés',
      fields: [
        { type: 'choice', key: 'coag', label: 'Vérzés', options: [
          { v: '2', l: lvl(2, 'Életet/végtagot veszélyeztető súlyos vérzés (v. alvadászavar / antikoaguláns mellett)') },
          { v: '3', l: lvl(3, 'Enyhe / közepes vérzés (orrvérzés, ízületi, menstruáció, felszínes seb)') }] },
        { type: 'check', key: 'moi', label: 'Magas rizikójú mechanizmus (kiesés/átfordulás, >40–60 km/h, >3 m esés, gázolás, áthatoló sérülés törzsön) → 2' },
      ],
    },
    {
      id: 'secondary', title: 'Másodlagos módosítók', ref: 'MSTR 6. lépés',
      fields: [
        { type: 'note', level: 'warn', when: function (s, r) { return r.v.htnHigh; }, html: 'Mért RR ≥220/130 – válaszd ki tünet szerint.' },
        { type: 'check', key: 'sec.gluc2', label: 'Vércukor: hipo (<3) v. hiper (>18) tünetekkel → 2' },
        { type: 'check', key: 'sec.gluc3', label: 'Vércukor-eltérés tünet nélkül → 3' },
        { type: 'check', key: 'sec.htn2', label: 'Magas vérnyomás + tünet → 2' },
        { type: 'check', key: 'sec.htn3', label: 'Magas vérnyomás tünet nélkül → 3' },
        { type: 'check', key: 'sec.cp2', label: 'Szív eredetű (v. jelentős) mellkasi fájdalom → 2' },
        { type: 'check', key: 'sec.cva2', label: 'Stroke / féloldali gyengeség <4,5 óra → 2' },
        { type: 'check', key: 'sec.cva3', label: 'Stroke >4,5 óra v. megszűntek → 3' },
        { type: 'check', key: 'sec.dys2', label: 'Nyelésképtelenség nyáladzással, stridorral → 2' },
        { type: 'check', key: 'sec.deform3', label: 'Végtagsérülés deformitással → 3' },
        { type: 'check', key: 'sec.dehyd2', label: 'Kiszáradás: közepes → 2' },
        { type: 'check', key: 'sec.dehyd3', label: 'Kiszáradás: enyhe → 3' },
      ],
    },
    {
      id: 'dispo', title: 'Felül-triázsolás, diszpozíció', ref: 'MSTR 7–8. lépés',
      fields: [
        { type: 'choice', key: 'over', label: 'Ápolói megítélés – felül-triázsolás (ha magasabb kockázatúnak ítéled, mint amit a tényezők adnak)', options: [
          { v: '1', l: 'Felül → MSTR 1' }, { v: '2', l: 'Felül → MSTR 2' }, { v: '3', l: 'Felül → MSTR 3' }] },
        { type: 'heading', label: 'Diszpozíció / továbbküldés' },
        { type: 'check', key: 'fasttrack', label: 'Fast track vizsgálóba kerül' },
        { type: 'heading', label: 'Konzílium' },
      ].concat(L.KONZ.map(function (k, i) { return { type: 'check', key: 'konz.' + i, label: k }; })).concat([
        { type: 'text', key: 'konz.other', label: 'Egyéb konzílium (több is, vesszővel elválasztva)' },
        { type: 'textarea', key: 'narr', rows: 4, label: 'Esemény leírása – néhány mondatban, mi történt / a triázs észrevételei' },
      ]),
    },
    {
      id: 'summary', title: 'Jegyzőkönyv', ref: '',
      fields: [
        { type: 'widget', name: 'printBar' },
        { type: 'summary' },
      ],
    },
  ];

  var WIDGETS = {
    complaintGroup: {
      render: function () { return ''; },
      live: function (c) {
        var v = String(c.state.complaint || '').trim();
        if (!v) return '';
        var hit = C.COMPLAINTS.filter(function (x) { return x[1].toLowerCase() === v.toLowerCase(); })[0];
        return '<p class="muted small">' + (hit ? 'CEDIS-csoport: <b>' + c.esc(hit[0]) + '</b>' : 'Egyéni panasz (nem szerepel a CEDIS-listában).') + '</p>';
      },
    },
    vitalFlags: {
      render: function () { return ''; },
      live: function (c) {
        var v = c.r.v, out = [];
        if (v.hr !== null && v.hr > 90) out.push('Pulzus >90/min: SIRS +');
        if (v.rr !== null && v.rr > 20) out.push('Légzésszám >20/min: SIRS +');
        if (v.htnHigh) out.push('RR ≥220/130: hipertónia – a másodlagos módosítóknál jelölendő');
        if (v.spo2Level) out.push('SpO₂ ' + v.spo2 + '%: ' + badge(v.spo2Level));
        if (v.feverPresent) out.push('Testhő ≥38 °C: láz (a küllem a 4. lépésben)');
        else if (v.temp !== null && v.temp < 36) out.push('Testhő <36 °C: hipotermia, SIRS +');
        if (v.painSev) out.push('VAS ' + v.pain + ': ' + { severe: 'Súlyos (8–10)', moderate: 'Mérsékelt (4–7)', mild: 'Enyhe (1–3)' }[v.painSev]);
        if (v.gcs) out.push('GCS ' + v.gcs.total + (v.gcsLevel ? ': ' + badge(v.gcsLevel) : ' (nem emel szintet)'));
        out.push('SIRS: <b>' + v.sirs + '/4</b>' + (v.sirs >= 3 && v.feverPresent ? ' – szeptikus küllem lehet' : ''));
        return '<div class="note ' + (v.sirs >= 3 ? 'warn' : 'info') + '">' + out.join('<br>') + '</div>';
      },
    },
    respHint: {
      render: function () { return ''; },
      live: function (c) {
        var v = c.r.v;
        return '<p class="muted small">' + (v.spo2Level ? 'Szaturáció (' + v.spo2 + '%) → padló MSTR ' + v.spo2Level + '. A légzési munka felfelé írhatja.' : 'A szaturáció támogató; a légzési munka a meghatározó.') + '</p>';
      },
    },
    circHint: {
      render: function () { return ''; },
      live: function (c) {
        var v = c.r.v;
        return '<p class="muted small">' + (v.hr !== null || v.sys !== null ? 'Mért: P ' + (v.hr === null ? '–' : v.hr) + '/min · RR ' + (v.sys === null ? '–' : v.sys) + '/' + (v.dia === null ? '–' : v.dia) + ' Hgmm' : 'Bőr, pulzusminőség és a mért értékek együtt.') + '</p>';
      },
    },
    painHint: {
      render: function () { return ''; },
      live: function (c) { return c.r.v.painLevel ? '<p>→ Fájdalom alapján: ' + badge(c.r.v.painLevel) + '</p>' : ''; },
    },
    printBar: {
      render: function () {
        return '<div class="row gap"><button type="button" class="btn primary" data-action="print">Nyomtatás / PDF (triázs lap)</button>' +
          '<button type="button" class="btn" data-action="download">Letöltés (HTML)</button></div>' +
          '<p class="muted small">A nyomtatott lap a rögzített adatokból készül, etikett-hellyel és a kötelező figyelmeztetéssel (a lenti szöveg kézi szerkesztése nem kerül rá).</p>';
      },
    },
  };

  function printDoc(s, r) {
    var w = window.open('', '_blank');
    if (!w) { alert('A felugró ablak blokkolva van. Engedélyezd, vagy használd a Letöltés gombot.'); return; }
    w.document.write(D.html(s, r, { autoPrint: true }));
    w.document.close();
    w.focus();
  }
  function downloadDoc(s, r) {
    var blob = new Blob([D.html(s, r, { autoPrint: true })], { type: 'text/html;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = D.fileName(s);
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  SBO.register({
    id: 'triage',
    title: 'MSTR Triage segéd (felnőtt)',
    short: 'Triage',
    description: 'Ötszintű MSTR besorolás: vitális paraméterek, módosítók, felül-triázsolás, nyomtatható triázs lap etikett-hellyel.',
    icon: 'triage',
    color: { base: '#14b8a6', ink: '#0f766e', inkDark: '#5eead4' },
    sop: C.SOP,
    steps: STEPS,
    widgets: WIDGETS,
    evaluate: L.evaluate,
    stageToStep: { start: 'start', complaint: 'complaint', vitals: 'vitals', qual: 'qual', done: 'summary' },
    categories: { L1: 'MSTR 1 – ' + LV[1].name, L2: 'MSTR 2 – ' + LV[2].name, L3: 'MSTR 3 – ' + LV[3].name, L4: 'MSTR 4 – ' + LV[4].name, L5: 'MSTR 5 – ' + LV[5].name },
    dangerCategories: ['L1', 'L2'],
    categoryLabel: 'JAVASOLT TRIÁZS SZINT',
    // A döntési panel teteje: színes MSTR-sáv (a prototípus „Javasolt triázs szint” sávja) + kötelező figyelmeztetés
    panelTop: function (r) {
      var html = r.level
        ? '<div class="mstr-banner l' + r.level + '"><small>Javasolt triázs szint</small><b>MSTR ' + r.level + ' · ' + LV[r.level].name + '</b>' +
          '<span>Újraértékelés: ' + LV[r.level].reassess + '</span>' + (r.driver ? '<span>Meghatározó: ' + esc(r.driver.label) + '</span>' : '') + '</div>'
        : '<div class="mstr-banner none">Vidd fel a paramétereket – a rendszer a legsúlyosabb szintet jelzi.</div>';
      return html + '<div class="note warn">⚠ ' + WARNING + '</div>';
    },
    actions: {
      now: function (s) { s.time = D.nowLocal(); },
      print: printDoc,
      download: downloadDoc,
    },
    docSections: D.sections,
    reportFindings: function (s, r) {
      return ['Vezető panasz: ' + (s.complaint || '___'), 'Javasolt szint: ' + (r.level ? 'MSTR ' + r.level + ' – ' + LV[r.level].name + ' (újraértékelés: ' + LV[r.level].reassess + ')' : 'nincs megállapítva')];
    },
    reference: function () { return C.REFERENCE; },
  });
})();
