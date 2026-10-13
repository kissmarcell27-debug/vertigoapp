/*
 * Eljárásrend-modul: „Syncope eljárásrend” (ÉPC-HK SBC SOP 5., v1.0).
 * Függ: SBO, SyncopeLogic, SyncopeContent, SyncopeDocs.
 */
(function () {
  'use strict';

  var L = window.SyncopeLogic;
  var C = window.SyncopeContent;
  var D = window.SyncopeDocs;

  function checks(map, when) {
    return Object.keys(map).map(function (k) { return { type: 'check', key: k, label: map[k], when: when }; });
  }
  var isSyncope = function (s) { return s.tloc === 'syncope' && s.leading === 'yes'; };

  var STEPS = [
    {
      id: 'start', title: 'Stabilitás, TLOC besorolás', ref: 'SOP 2., 4.1, 4. ábra',
      fields: [
        { type: 'yn', key: 'unstable', label: 'Cardiorespiratorikusan instabil a beteg?' },
        { type: 'note', level: 'danger', when: function (s) { return s.unstable === 'yes'; }, html: 'Ellátás ABCDE séma szerint – az SOP ezt nem részletezi.' },
        { type: 'choice', key: 'tloc', label: 'Az anamnézis alapján milyen eszméletvesztésről van szó?', options: [
          { v: 'syncope', l: 'Syncope (átmeneti, hirtelen, rövid, spontán rendeződő)' },
          { v: 'tloc_other', l: 'Átmeneti eszméletvesztés, de nem syncope (epilepszia, pszichogén, ritka ok)' },
          { v: 'not_tloc', l: 'Nem átmeneti eszméletvesztés' },
          { v: 'trauma', l: 'Fejtrauma okozta eszméletvesztés' }] },
        { type: 'note', level: 'warn', when: function (s) { return s.tloc === 'trauma'; }, html: 'A fejsérülésről külön eljárásrend szól. <button type="button" class="btn small" data-open="fejserules">Fejsérülés modul megnyitása →</button>' },
        { type: 'yn', key: 'leading', label: 'A syncope a vezető panasz? (nem egy más akut kórkép – pl. PE – kísérő tünete)', when: function (s) { return s.tloc === 'syncope'; } },
        { type: 'check', key: 'presyncope', label: 'Presyncopéval érkezett (eszméletvesztés nem történt)', when: function (s) { return s.tloc === 'syncope'; } },
        { type: 'widget', name: 'tlocTable' },
      ],
    },
    {
      id: 'initial', title: 'Kezdeti vizsgálatok', ref: 'SOP 4.1–4.4',
      fields: [
        { type: 'num', key: 'pt.age', label: 'Életkor (év)' },
      ].concat(SBO.fields.vitals(), [
        { type: 'heading', label: 'Anamnézis (auto- és hetero-)' },
        { type: 'text', key: 'syn.when', label: 'Mikor történt (pl. „ma reggel, otthon”)' },
        { type: 'choice', key: 'syn.position', label: 'Testhelyzet / körülmény', options: [
          { v: 'standing', l: 'Állás' }, { v: 'sitting', l: 'Ülés' }, { v: 'supine', l: 'Fekvés' }, { v: 'exertion', l: 'Fizikai terhelés' }] },
        { type: 'text', key: 'syn.trigger', label: 'Kiváltó tényező (fájdalom, félelem, mikció, köhögés, étkezés, meleg, zsúfolt hely…)' },
        { type: 'choice', key: 'syn.prodrome', label: 'Prodroma', options: [
          { v: 'typical', l: 'Típusos (sápadtság, verejtékezés, hányinger)' }, { v: 'short', l: 'Rövid (<10 mp)' }, { v: 'none', l: 'Nem volt' }] },
        { type: 'text', key: 'syn.duration', label: 'Az eszméletvesztés időtartama' },
        { type: 'text', key: 'syn.recovery', label: 'Magához térés (gyors, tiszta tudattal / zavartság)' },
        { type: 'yn', key: 'syn.witness', label: 'Volt szemtanú (heteroanamnézis)?' },
        { type: 'yn', key: 'syn.palp', label: 'Palpitáció?' },
        { type: 'yn', key: 'syn.chest', label: 'Mellkasi fájdalom?' },
        { type: 'yn', key: 'syn.dyspnea', label: 'Nehézlégzés?' },
        { type: 'yn', key: 'syn.injury', label: 'Sérülés a rosszullét során?' },
        { type: 'yn', key: 'syn.tongue', label: 'Nyelvharapás?' },
        { type: 'yn', key: 'syn.incont', label: 'Inkontinencia?' },
        { type: 'yn', key: 'hx.prevSyncope', label: 'Volt korábban syncopéja?' },
        { type: 'text', key: 'syn.drugs', label: 'Gyógyszerek, friss gyógyszermódosítás (vazodilatátor, diuretikum, antidepresszáns…)' },
        { type: 'heading', label: 'Aktív állás vizsgálat (folyamatos EKG-monitor mellett)' },
        { type: 'widget', name: 'standing' },
        { type: 'choice', key: 'as.reproduced', label: 'A panaszok reprodukálódtak a vizsgálat alatt?', options: [{ v: 'yes', l: 'Igen' }, { v: 'no', l: 'Nem (tünetmentes)' }],
          when: function (s, r) { return r.as && r.as.oh; } },
        { type: 'choice', key: 'as.history', label: 'Az anamnézisben szereplő tünetek OH-nak megfelelnek?', options: [
          { v: 'full', l: 'Teljesen' }, { v: 'partial', l: 'Nem mindegyik' }, { v: 'less', l: 'Kevésbé' }], when: function (s, r) { return r.as && r.as.oh; } },
        { type: 'heading', label: '12 elvezetéses EKG, labor' },
        { type: 'text', key: 'ekg.text', label: 'EKG lelet (epikrízisbe)' },
        { type: 'text', key: 'lab.text', label: 'Labor (troponin, D-dimer, vérgáz – a klinikum szerint)' },
        { type: 'heading', label: 'További vizsgálatok indikációja' },
        { type: 'check', key: 'x.arrhythmia', label: 'Aritmogén syncope gyanúja → azonnali EKG-monitor' },
        { type: 'check', key: 'x.structural', label: 'Ismert / felmerülő strukturális szívbetegség → echokardiográfia' },
        { type: 'check', key: 'x.lab', label: 'Ischaemia / PE / hypoxia gyanúja → célzott labor' },
        { type: 'heading', label: 'Carotis sinus masszázs (40 év felett, feltételezett reflex mechanizmus, ismeretlen etiológia)' },
        { type: 'check', key: 'csm.strokeTia', label: 'Korábbi stroke / TIA (óvatosan, magas kockázatnál elhagyható)' },
        { type: 'check', key: 'csm.stenosis', label: '>70%-os carotis stenosis (óvatosan, magas kockázatnál elhagyható)' },
        { type: 'choice', key: 'csm.result', label: 'CSM eredménye (fekve és állva)', options: [
          { v: 'neg', l: 'Negatív' }, { v: 'pos', l: 'Pozitív (>3 mp pauza és/vagy >50 Hgmm szisztolés esés)' }, { v: 'nd', l: 'Nem történt' }] },
        { type: 'yn', key: 'csm.reproduced', label: 'A beteg tünetei reprodukálódtak?', when: function (s) { return s['csm.result'] === 'pos'; } },
      ]),
    },
    {
      id: 'dx', title: 'Egyértelmű / felvethető diagnózis', ref: 'SOP 4.5–4.6',
      fields: [
        { type: 'heading', label: 'Egyértelmű vagy erősen valószínű diagnózis' },
        { type: 'check', key: 'cert.vvs', label: 'Vasovagalis: fájdalom, félelem vagy állás váltotta ki, típusos progresszív prodromával (sápadtság, verejtékezés, hányinger)' },
        { type: 'check', key: 'cert.situational', label: 'Szituációs: mikció, nyelés, székelés, köhögés, tüsszentés, terhelés, nevetés, fúvós hangszer váltotta ki' },
        { type: 'check', key: 'cert.orthostatic', label: 'Ortosztatikus: állás közben, egyidejűleg kimutatott jelentős OH (aktív állás vizsgálat)' },
        { type: 'heading', label: 'Aritmogén syncopét bizonyító EKG (egyben magas kockázat)' },
      ].concat(checks(L.EKG_CERTAIN), [
        { type: 'check', key: 'cert.ischemia', label: 'Igazolt akut myocardialis ischaemia mellett jelentkezett syncope' },
        { type: 'check', key: 'cert.structural', label: 'Bizonyított strukturális ok: súlyos AS, pitvari myxoma, bal pitvari gömbthrombus, PE, akut aortadisszekció' },
        { type: 'text', key: 'cert.structural.text', label: 'Melyik?', when: function (s) { return s['cert.structural']; } },
        { type: 'heading', label: 'Ha nincs egyértelmű diagnózis: felvethető mechanizmus' },
        { type: 'check', key: 'sug.reflex', label: 'Reflex syncopéra utal (korábbi syncope 40 év előtt, kellemetlen inger, tartós állás, étkezés, zsúfolt/meleg hely, autonóm prodroma, fejfordítás / carotis-nyomás, szívbetegség hiánya)' },
        { type: 'check', key: 'sug.orth', label: 'Ortosztatikus syncopéra utal (állás alatt/után, tartós állás, terhelést követő állás, postprandiális hypotonia, autonóm neuropathia / parkinsonismus, hypotonizáló gyógyszer-módosítás)' },
        { type: 'check', key: 'sug.cardiac', label: 'Kardiogén syncopéra utal (terhelés alatt / fekve, palpitáció után, fiatalkori hirtelen szívhalál a családban, strukturális / koszorúér-betegség, aritmogén EKG-eltérés)' },
        { type: 'check', key: 'dxReviewed', label: 'Áttekintettem – egyértelmű diagnózis nincs, rizikóbecslés következik' },
      ]),
    },
    {
      id: 'risk', title: 'Rizikóbecslés', ref: 'SOP 5.',
      fields: [
        { type: 'heading', label: 'Magas kockázati jegyek (5.2)' },
      ].concat(checks(L.HIGH), [
        { type: 'check', key: 'hd.present', label: 'Szívbetegséghez vagy kóros EKG-hoz társuló syncope, és…' },
      ], checks(L.HIGH_HD, function (s) { return s['hd.present']; }), [
        { type: 'heading', label: 'Magas kockázatú EKG-eltérések' },
      ], checks(L.EKG_HIGH), [
        { type: 'check', key: 'hx.arrSync', label: 'A kórelőzményben aritmogén syncope szerepel (ekkor az alábbiak is magas kockázatot jelentenek)' },
      ], checks(L.EKG_COND, function (s) { return s['hx.arrSync']; }), [
        { type: 'check', key: 'h.none', label: 'Áttekintettem: egyik magas kockázati jegy sem áll fenn' },
        { type: 'heading', label: 'Alacsony kockázati jegyek (5.1)' },
      ], checks(L.LOW), [
        { type: 'yn', key: 'l.physical', label: 'Negatív fizikális vizsgálat?' },
        { type: 'yn', key: 'l.ekg', label: 'EKG eltérés nélkül?' },
        { type: 'heading', label: 'Közepes kockázati jegyek (5.3)' },
      ], checks(L.MID), [
        { type: 'widget', name: 'risk' },
      ]),
    },
    {
      id: 'dispo', title: 'Diszpozíció, kezelés', ref: 'SOP 6.',
      fields: [
        { type: 'choice', key: 'obs.result', label: '12 órás SBO-monitorozás eredménye', when: function (s, r) { return r.risk && r.risk.level === 'intermediate'; }, options: [
          { v: 'clear', l: 'Magas kockázatra utaló eltérés nem igazolódott' }, { v: 'high', l: 'Magas kockázatú, felvételt igénylő ok igazolódott' }] },
        { type: 'heading', label: 'Osztályos felvétel indikációi (6.4.2)', when: function (s, r) { return r.risk && r.risk.level === 'high'; } },
      ].concat(checks(L.ADMIT, function (s, r) { return r.risk && r.risk.level === 'high'; }), [
        { type: 'heading', label: 'SBO fektetős obszerváció indikációi (6.4.1)', when: function (s, r) { return r.risk && r.risk.level === 'high'; } },
      ], checks(L.OBSERVE, function (s, r) { return r.risk && r.risk.level === 'high'; }), [
        { type: 'heading', label: 'Hazabocsátás esetén', when: function (s, r) { return r.risk && r.risk.level !== 'high'; } },
        { type: 'yn', key: 'htn', label: 'Hypertoniás a beteg? (a folyadék- és sóbevitel javaslatához)', when: function (s, r) { return r.risk && r.risk.level === 'low'; } },
        { type: 'check', key: 'rf.present', label: 'Rizikófaktorok miatt kardiológiai szakrendelésre irányítás', when: function (s, r) { return r.risk && r.risk.level === 'low'; } },
        { type: 'widget', name: 'treatment' },
      ]),
    },
    { id: 'summary', title: 'Összegzés / dokumentáció', ref: '', fields: [{ type: 'summary' }] },
  ];

  function stepVisible(id, s, r) {
    switch (id) {
      case 'initial': case 'dx': case 'risk': return s.unstable === 'no' && isSyncope(s);
      case 'dispo': return s.unstable === 'no' && isSyncope(s) && !!(r.risk && r.risk.level);
      default: return true;
    }
  }

  var widgets = {
    tlocTable: {
      render: function () {
        var t = C.REFERENCE.filter(function (x) { return x.id === 'tloc'; })[0];
        return '<details class="drugs"><summary>Syncope vagy epilepsziás roham? (2. ábra)</summary>' + t.html + '</details>';
      },
    },
    standing: {
      render: function (ctx) {
        var inp = function (k, ph) { return '<input type="number" inputmode="numeric" placeholder="' + ph + '" data-key="' + k + '" value="' + ctx.esc(ctx.state[k]) + '">'; };
        return '<div class="orth"><table><thead><tr><th></th><th>Szisztolés</th><th>Diasztolés</th><th>Pulzus</th></tr></thead><tbody>' +
          '<tr><th>Fekve</th><td>' + inp('as.supSys', 'Hgmm') + '</td><td>' + inp('as.supDia', 'Hgmm') + '</td><td>' + inp('as.supHr', '/perc') + '</td></tr>' +
          '<tr><th>Állva 0 perc</th><td>' + inp('as.0Sys', 'Hgmm') + '</td><td>' + inp('as.0Dia', 'Hgmm') + '</td><td>' + inp('as.0Hr', '/perc') + '</td></tr>' +
          '<tr><th>Állva 3 perc</th><td>' + inp('as.3Sys', 'Hgmm') + '</td><td>' + inp('as.3Dia', 'Hgmm') + '</td><td>' + inp('as.3Hr', '/perc') + '</td></tr>' +
          '<tr><th>Állva 10 perc</th><td></td><td></td><td>' + inp('as.10Hr', '/perc') + '</td></tr>' +
          '</tbody></table></div>';
      },
      live: function (ctx) {
        var a = ctx.r.as;
        if (a.done && !a.manual) {
          return '<div class="note ' + (a.oh || a.pots ? 'warn' : 'ok') + '">' +
            (a.oh ? '<b>Ortosztatikus hypotonia</b>: ' + a.reasons.map(ctx.esc).join('; ') : a.pots ? '<b>OH nélküli ortosztatikus pulzusemelkedés</b> (' + (a.hrRise !== null ? '+' + a.hrRise + '/perc' : '') + (a.maxHr !== null ? ', max. ' + a.maxHr + '/perc' : '') + ') – POTS megfontolandó, ha a panaszokat reprodukálja' : 'Nem kóros') +
            (ctx.r.ohCertainty ? '<br>OH okozta syncope: <b>' + ctx.r.ohCertainty + '</b>' : '') +
            '<br><small>SOP 4.4: >20 Hgmm szisztolés vagy >10 Hgmm diasztolés esés, vagy <90 Hgmm szisztolés; POTS: >30/perc emelkedés vagy >120/perc OH nélkül.</small></div>';
        }
        return ctx.radios('as.manual', [{ v: 'pos', l: 'Pozitív' }, { v: 'neg', l: 'Negatív' }], 'Vagy az eredmény közvetlenül:');
      },
    },
    risk: {
      render: function () { return ''; },
      live: function (ctx) {
        var r = ctx.r.risk;
        if (!r || !r.level) return '<div class="note info">Jelöljön magas kockázati jegyet, vagy erősítse meg, hogy egyik sem áll fenn.</div>';
        var cls = { low: 'ok', intermediate: 'warn', high: 'danger' }[r.level];
        var t = { low: 'Alacsony kockázat', intermediate: 'Közepes kockázat', high: 'Magas kockázat' }[r.level];
        return '<div class="note ' + cls + '"><b>' + t + '</b>' + (r.high.length ? '<br>Magas: ' + r.high.map(ctx.esc).join('; ') : '') +
          (r.mid.length ? '<br>Közepes: ' + r.mid.map(ctx.esc).join('; ') : '') +
          (r.level === 'intermediate' && !r.mid.length ? '<br>Sem az alacsony (negatív fizikális vizsgálat + normál EKG + alacsony kockázati jegy), sem a magas kockázat feltételei nem teljesülnek.' : '') + '</div>';
      },
    },
    treatment: {
      render: function (ctx) {
        return '<div class="note info"><b>Kezelési megfontolások (6.6):</b> súlyos / gyakori reflex syncope alacsony vérnyomás fenotípussal vagy hipotonizáló gyógyszerrel → szakirányú járóbeteg-kivizsgálás. Esésre hajlamosaknál ACE-gátló, ARB, Ca-csatorna-blokkoló előnyben a diuretikummal és béta-blokkolóval szemben. Hypertonia hiányában 2–3 l folyadék és 10 g só naponta.</div>' +
          '<button type="button" class="btn" data-goto-ref="leaflet">Betegtájékoztató (ellenmanőverek) megnyitása / nyomtatása</button>';
      },
    },
  };

  SBO.register({
    id: 'syncope',
    title: 'Syncope',
    short: 'Syncope',
    description: 'TLOC besorolás, aktív állás vizsgálat, CSM, egyértelmű diagnózisok, rizikóbecslés, diszpozíció, betegtájékoztató.',
    sop: C.SOP,
    steps: STEPS,
    stepVisible: stepVisible,
    stageToStep: { start: 'start', dx: 'dx', risk: 'risk', done: 'summary' },
    evaluate: L.evaluate,
    categories: { UNSTABLE: 'Instabil beteg – ABCDE', OTHER: 'Nem a syncope eljárásrend tárgya', LOW: 'Alacsony kockázatú syncope', INTERMEDIATE: 'Közepes kockázatú syncope', HIGH: 'Magas kockázatú syncope' },
    dangerCategories: ['UNSTABLE', 'HIGH'],
    widgets: widgets,
    reportFindings: function (s, r) {
      var lines = [];
      if (r.as && r.as.done) lines.push('AKTÍV ÁLLÁS: ' + (r.as.oh ? 'OH (' + (r.as.reasons || []).join('; ') + ')' : r.as.pots ? 'OH nélküli pulzusemelkedés' : 'negatív') + (r.ohCertainty ? ' – OH-syncope ' + r.ohCertainty : ''));
      if (s['csm.result'] === 'pos' || s['csm.result'] === 'neg') lines.push('CSM: ' + (s['csm.result'] === 'pos' ? 'pozitív (' + r.csm.dx + ')' : 'negatív'));
      if (r.risk && r.risk.level) {
        lines.push('RIZIKÓ: ' + { low: 'alacsony', intermediate: 'közepes', high: 'magas' }[r.risk.level]);
        r.risk.high.concat(r.risk.mid).forEach(function (x) { lines.push('- ' + x); });
      }
      return lines;
    },
    docSections: function (s, r) { return D.sections(s, r); },
    reference: function () { return C.REFERENCE; },
  });
})();
