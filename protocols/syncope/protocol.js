/*
 * Eljárásrend-modul: „Syncope eljárásrend” (ÉPC-HK SBC SOP 5., v1.0).
 * Lépések a 4. ábra szerint: TLOC → anamnézis → vizsgálatok → EKG → diagnózis → rizikó → diszpozíció.
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
  function guide(html) { return { type: 'note', level: 'info', html: '<b>Mit kell itt tenni?</b> ' + html }; }
  var isSyncope = function (s) { return s.unstable === 'no' && s.tloc === 'syncope' && s.leading === 'yes'; };
  var ekgAbn = function (s) { return s['ekg.normal'] === 'no'; };
  var noAutoHigh = function (s, r) { return !(r.risk && r.risk.auto && r.risk.auto.length); };

  var STEPS = [
    {
      id: 'start', title: 'Stabilitás, eszméletvesztés típusa', ref: 'SOP 2., 4.1, 4. ábra',
      fields: [
        guide('Döntse el, hogy syncope-e a vezető panasz. Ha nem, az app megmondja, merre tovább.'),
        { type: 'yn', key: 'unstable', label: 'Cardiorespiratorikusan instabil a beteg?' },
        { type: 'note', level: 'danger', when: function (s) { return s.unstable === 'yes'; }, html: 'Ellátás ABCDE séma szerint – az SOP ezt nem részletezi.' },
        { type: 'choice', key: 'tloc', label: 'Az anamnézis alapján milyen eszméletvesztés volt?', when: function (s) { return s.unstable === 'no'; }, options: [
          { v: 'syncope', l: 'Syncope (hirtelen, rövid, spontán rendeződő)' },
          { v: 'tloc_other', l: 'Átmeneti, de nem syncope (epilepszia, pszichogén, ritka ok)' },
          { v: 'not_tloc', l: 'Nem átmeneti eszméletvesztés' },
          { v: 'trauma', l: 'Fejtrauma okozta' }] },
        { type: 'note', level: 'warn', when: function (s) { return s.tloc === 'trauma'; }, html: 'A fejsérülésről külön eljárásrend szól. <button type="button" class="btn small" data-open="fejserules">Fejsérülés modul megnyitása →</button>' },
        { type: 'widget', name: 'tlocTable', when: function (s) { return s.unstable === 'no'; } },
        { type: 'yn', key: 'leading', label: 'A syncope a vezető panasz? („Nem”, ha egy más akut kórkép – pl. PE – kísérő tünete)', when: function (s) { return s.tloc === 'syncope'; } },
        { type: 'check', key: 'presyncope', label: 'Presyncopéval érkezett (eszméletvesztés nem történt) – ugyanígy kell vizsgálni', when: function (s) { return s.tloc === 'syncope'; } },
      ],
    },
    {
      id: 'history', title: 'Anamnézis', ref: 'SOP 4.1.1, 4.6',
      fields: [
        guide('Az anamnézis a legfontosabb – gyakran már ebből megvan a diagnózis. A <b>testhelyzet</b> és a <b>prodroma</b> kötelező (ezek nélkül a rizikóbecslés nem megalapozott); a többi válasz a dokumentációba kerül, a kitöltetlen kérdés nem.'),
        { type: 'num', key: 'pt.age', label: 'Életkor (év)' },
        { type: 'text', key: 'syn.when', label: 'Mikor, hol történt? (pl. „ma reggel, otthon”)' },
        { type: 'choice', key: 'syn.position', label: 'Milyen helyzetben?', options: [
          { v: 'standing', l: 'Állás' }, { v: 'sitting', l: 'Ülés' }, { v: 'supine', l: 'Fekvés' }, { v: 'exertion', l: 'Fizikai terhelés' }] },
        { type: 'text', key: 'syn.trigger', label: 'Kiváltó tényező (fájdalom, félelem, mikció, köhögés, étkezés, meleg / zsúfolt hely…)' },
        { type: 'choice', key: 'syn.prodrome', label: 'Előzte meg valami (prodroma)?', options: [
          { v: 'typical', l: 'Igen, típusos (sápadtság, verejtékezés, hányinger)' }, { v: 'short', l: 'Rövid (<10 mp)' }, { v: 'none', l: 'Nem' }] },
        { type: 'text', key: 'syn.duration', label: 'Meddig tartott az eszméletvesztés?' },
        { type: 'text', key: 'syn.recovery', label: 'Hogyan tért magához? (gyorsan, tiszta tudattal / zavartan)' },
        { type: 'yn', key: 'syn.witness', label: 'Volt szemtanú?' },
        { type: 'yn', key: 'syn.palp', label: 'Palpitáció?' },
        { type: 'yn', key: 'syn.chest', label: 'Mellkasi fájdalom?' },
        { type: 'yn', key: 'syn.dyspnea', label: 'Nehézlégzés?' },
        { type: 'yn', key: 'syn.injury', label: 'Sérülés a rosszullét során?' },
        { type: 'yn', key: 'syn.tongue', label: 'Nyelvharapás?' },
        { type: 'yn', key: 'syn.incont', label: 'Inkontinencia?' },
        { type: 'yn', key: 'hx.prevSyncope', label: 'Volt korábban syncopéja?' },
        { type: 'text', key: 'syn.drugs', label: 'Gyógyszerek, friss gyógyszermódosítás (vazodilatátor, diuretikum, antidepresszáns…)' },
      ],
    },
    {
      id: 'exam', title: 'Vizsgálatok', ref: 'SOP 4.1–4.4',
      fields: [
        guide('Kötelező: a fizikális vizsgálat eredménye és az <b>aktív állás vizsgálat</b> (fekve, 0 és 3 perc állás után, monitor mellett; ha nem végezhető, jelölje). Az eredményt az app azonnal kiértékeli.'),
      ].concat(SBO.fields.vitals(), [
        { type: 'yn', key: 'ex.physical', label: 'A fizikális vizsgálat negatív (kóros eltérés nincs)?' },
        { type: 'heading', label: 'Aktív állás vizsgálat' },
        { type: 'widget', name: 'standing' },
        { type: 'choice', key: 'as.reproduced', label: 'A panaszok reprodukálódtak a vizsgálat alatt?', options: [{ v: 'yes', l: 'Igen' }, { v: 'no', l: 'Nem (tünetmentes maradt)' }],
          when: function (s, r) { return r.as && r.as.oh && !r.as.manual; } },
        { type: 'choice', key: 'as.history', label: 'Az anamnézisben szereplő tünetek OH-nak felelnek meg?', options: [
          { v: 'full', l: 'Igen, teljesen' }, { v: 'partial', l: 'Nem mindegyik' }, { v: 'less', l: 'Kevésbé' }], when: function (s, r) { return r.as && r.as.oh && !r.as.manual; } },
        { type: 'heading', label: 'Carotis sinus masszázs (CSM)', when: function (s) { return Number(s['pt.age']) > 40; } },
        { type: 'note', level: 'info', when: function (s) { return Number(s['pt.age']) > 40; }, html: '40 év felett, feltételezett reflex mechanizmusú, ismeretlen etiológiájú syncopéban; fekve és állva. Pozitív: >3 mp pauza és/vagy >50 Hgmm szisztolés esés.' },
        { type: 'check', key: 'csm.strokeTia', label: 'Korábbi stroke / TIA (óvatosan, magas kockázatnál elhagyható)', when: function (s) { return Number(s['pt.age']) > 40; } },
        { type: 'check', key: 'csm.stenosis', label: '>70%-os carotis stenosis (óvatosan, magas kockázatnál elhagyható)', when: function (s) { return Number(s['pt.age']) > 40; } },
        { type: 'choice', key: 'csm.result', label: 'CSM eredménye', when: function (s) { return Number(s['pt.age']) > 40; }, options: [
          { v: 'neg', l: 'Negatív' }, { v: 'pos', l: 'Pozitív' }, { v: 'nd', l: 'Nem történt' }] },
        { type: 'yn', key: 'csm.reproduced', label: 'A beteg tünetei reprodukálódtak a CSM alatt?', when: function (s) { return s['csm.result'] === 'pos'; } },
        { type: 'heading', label: 'Labor, további vizsgálatok (a klinikum szerint)' },
        { type: 'text', key: 'lab.text', label: 'Labor eredménye (troponin, D-dimer, vérgáz…)' },
        { type: 'check', key: 'x.arrhythmia', label: 'Aritmogén syncope gyanúja → azonnali EKG-monitor' },
        { type: 'check', key: 'x.structural', label: 'Ismert / felmerülő strukturális szívbetegség → echokardiográfia' },
        { type: 'check', key: 'x.lab', label: 'Ischaemia / PE / hypoxia gyanúja → célzott labor' },
      ]),
    },
    {
      id: 'ekg', title: 'EKG', ref: 'SOP 4.5.2, 5.2',
      fields: [
        guide('Először azt döntse el, hogy az EKG normál-e. Csak kóros EKG esetén kell az eltéréseket kiválasztani – ezek automatikusan bekerülnek a diagnózisba és a rizikóbecslésbe.'),
        { type: 'text', key: 'ekg.text', label: 'EKG lelet (a dokumentációba kerül)' },
        { type: 'yn', key: 'ekg.normal', label: 'Az EKG eltérés nélküli?' },
        { type: 'heading', label: 'Aritmogén syncopét bizonyító eltérés (egyértelmű diagnózis + magas kockázat)', when: ekgAbn },
      ].concat(checks(L.EKG_CERTAIN, ekgAbn), [
        { type: 'heading', label: 'Magas kockázatú eltérés', when: ekgAbn },
      ], checks(L.EKG_HIGH, ekgAbn), [
        { type: 'check', key: 'hx.arrSync', label: 'A kórelőzményben aritmogén syncope szerepel (ekkor az alábbiak is magas kockázatot jelentenek)', when: ekgAbn },
      ], checks(L.EKG_COND, function (s) { return ekgAbn(s) && s['hx.arrSync']; }), [
        { type: 'note', level: 'info', when: function (s, r) { return ekgAbn(s) && !(r.risk && r.risk.auto && r.risk.auto.length) && !Object.keys(L.EKG_CERTAIN).concat(Object.keys(L.EKG_HIGH)).some(function (k) { return s[k]; }); },
          html: 'Kóros, de a fenti listákban nem szereplő eltérés: írja le a leletben; a kockázatot a rizikóbecslés lépésben ítélje meg.' },
      ]),
    },
    {
      id: 'dx', title: 'Diagnózis', ref: 'SOP 4.5–4.6',
      fields: [
        guide('Egyértelmű vagy erősen valószínű-e a diagnózis a kezdeti vizsgálatok alapján? Ha igen, a kezelés megkezdhető; ha nem, a rizikóbecslés dönt.'),
        { type: 'widget', name: 'arrNote' },
        { type: 'choice', key: 'dx.certain', label: 'Egyértelmű / erősen valószínű diagnózis', options: [
          { v: 'vvs', l: 'Vasovagalis' }, { v: 'situational', l: 'Szituációs' }, { v: 'orthostatic', l: 'Ortosztatikus' },
          { v: 'cardiac', l: 'Kardiális (ischaemia / strukturális)' }, { v: 'none', l: 'Nincs egyértelmű diagnózis' }] },
        { type: 'widget', name: 'dxCriteria' },
        { type: 'choice', key: 'dx.cardiacType', label: 'Kardiális ok', when: function (s) { return s['dx.certain'] === 'cardiac'; }, options: [
          { v: 'ischemia', l: 'Igazolt akut myocardialis ischaemia mellett' },
          { v: 'structural', l: 'Bizonyított strukturális ok' }] },
        { type: 'text', key: 'dx.structural', label: 'Melyik? (súlyos AS, pitvari myxoma, bal pitvari gömbthrombus, PE, akut aortadisszekció)', when: function (s) { return s['dx.certain'] === 'cardiac' && s['dx.cardiacType'] === 'structural'; } },
        { type: 'heading', label: 'Felvethető mechanizmus (nem kötelező)', when: function (s) { return s['dx.certain'] === 'none'; } },
        { type: 'check', key: 'sug.reflex', label: 'Reflex syncopéra utal (korábbi syncope 40 év előtt, kellemetlen inger, tartós állás, étkezés, zsúfolt/meleg hely, autonóm prodroma, fejfordítás / carotis-nyomás, szívbetegség hiánya)', when: function (s) { return s['dx.certain'] === 'none'; } },
        { type: 'check', key: 'sug.orth', label: 'Ortosztatikus syncopéra utal (állás alatt/után, tartós állás, terhelést követő állás, postprandiális hypotonia, autonóm neuropathia / parkinsonismus, hypotonizáló gyógyszer)', when: function (s) { return s['dx.certain'] === 'none'; } },
        { type: 'check', key: 'sug.cardiac', label: 'Kardiogén syncopéra utal (terhelés alatt / fekve, palpitáció után, fiatalkori hirtelen szívhalál a családban, strukturális / koszorúér-betegség, aritmogén EKG-eltérés)', when: function (s) { return s['dx.certain'] === 'none'; } },
      ],
    },
    {
      id: 'risk', title: 'Rizikóbecslés', ref: 'SOP 5.',
      fields: [
        guide('Három kérdés, sorban: <b>1.</b> van-e magas kockázati jegy? <b>2.</b> ha nincs: van-e közepes? <b>3.</b> ha az sincs: teljesülnek-e az alacsony kockázat feltételei? Az eredmény és az indoklása alul látható.'),
        { type: 'widget', name: 'autoHigh' },
        { type: 'heading', label: '1. kérdés – magas kockázat (5.2)', when: noAutoHigh },
        { type: 'yn', key: 'h.any', label: 'Fennáll az alábbi magas kockázati jegyek bármelyike?', when: noAutoHigh },
      ].concat(checks(L.HIGH, function (s) { return s['h.any'] === 'yes'; }), [
        { type: 'check', key: 'hd.present', label: 'Szívbetegséghez vagy kóros EKG-hoz társuló syncope, és…', when: function (s) { return s['h.any'] === 'yes'; } },
      ], checks(L.HIGH_HD, function (s) { return s['h.any'] === 'yes' && s['hd.present']; }), [
        { type: 'widget', name: 'highList', when: function (s, r) { return noAutoHigh(s, r) && s['h.any'] !== 'yes'; } },
        { type: 'heading', label: '2. kérdés – közepes kockázat (5.3)', when: function (s, r) { return noAutoHigh(s, r) && s['h.any'] === 'no'; } },
        { type: 'yn', key: 'm.any', label: 'Fennáll az alábbi közepes kockázati jegyek bármelyike?', when: function (s, r) { return noAutoHigh(s, r) && s['h.any'] === 'no'; } },
      ], checks(L.MID, function (s, r) { return noAutoHigh(s, r) && s['h.any'] === 'no' && s['m.any'] === 'yes'; }), [
        { type: 'widget', name: 'midList', when: function (s, r) { return noAutoHigh(s, r) && s['h.any'] === 'no' && s['m.any'] !== 'yes'; } },
        { type: 'heading', label: '3. kérdés – alacsony kockázat feltételei (5.1)', when: function (s, r) { return noAutoHigh(s, r) && s['h.any'] === 'no' && s['m.any'] === 'no'; } },
        { type: 'note', level: 'info', when: function (s, r) { return noAutoHigh(s, r) && s['h.any'] === 'no' && s['m.any'] === 'no'; }, html: 'Alacsony kockázat = legalább egy alábbi jegy <b>és</b> negatív fizikális vizsgálat (3. lépés) <b>és</b> eltérés nélküli EKG (4. lépés).' },
      ], checks(L.LOW, function (s, r) { return noAutoHigh(s, r) && s['h.any'] === 'no' && s['m.any'] === 'no'; }), [
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
        { type: 'heading', label: 'Hazabocsátás esetén', when: function (s, r) { return r.risk && r.risk.level === 'low'; } },
        { type: 'yn', key: 'htn', label: 'Hypertoniás a beteg? (a folyadék- és sóbevitel javaslatához)', when: function (s, r) { return r.risk && r.risk.level === 'low'; } },
        { type: 'check', key: 'rf.present', label: 'Rizikófaktorok miatt kardiológiai szakrendelésre irányítás', when: function (s, r) { return r.risk && r.risk.level === 'low'; } },
        { type: 'widget', name: 'treatment' },
      ]),
    },
    { id: 'summary', title: 'Összegzés / dokumentáció', ref: '', fields: [{ type: 'summary' }] },
  ];

  function stepVisible(id, s, r) {
    switch (id) {
      case 'start': case 'summary': return true;
      case 'dispo': return isSyncope(s) && !!(r.risk && r.risk.level);
      default: return isSyncope(s);
    }
  }

  function li(arr, esc) { return '<ul>' + arr.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>'; }

  var widgets = {
    tlocTable: {
      render: function () {
        var t = C.REFERENCE.filter(function (x) { return x.id === 'tloc'; })[0];
        return '<details class="drugs"><summary>Segítség: syncope vagy epilepsziás roham? (2. ábra)</summary>' + t.html + '</details>';
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
            (a.oh ? '<b>Ortosztatikus hypotonia</b>: ' + a.reasons.map(ctx.esc).join('; ') : a.pots ? '<b>OH nélküli ortosztatikus pulzusemelkedés</b> (' + (a.hrRise !== null ? '+' + a.hrRise + '/perc' : '') + (a.maxHr !== null ? ', max. ' + a.maxHr + '/perc' : '') + ') – POTS megfontolandó, ha a panaszokat reprodukálja' : '<b>Nem kóros</b> (nincs ortosztatikus hypotonia)') +
            (ctx.r.ohCertainty ? '<br>OH okozta syncope: <b>' + ctx.r.ohCertainty + '</b>' : '') +
            '<br><small>SOP 4.4: >20 Hgmm szisztolés vagy >10 Hgmm diasztolés esés, vagy <90 Hgmm szisztolés; POTS: >30/perc emelkedés vagy >120/perc OH nélkül.</small></div>';
        }
        return '<p class="muted small">Adja meg a fekvő és legalább a 0 perces álló értékeket – vagy válasszon:</p>' +
          ctx.radios('as.manual', [{ v: 'pos', l: 'Pozitív' }, { v: 'neg', l: 'Negatív' }, { v: 'nd', l: 'Nem végezhető' }], 'Aktív állás eredménye');
      },
    },
    arrNote: {
      render: function (ctx) {
        var arr = (ctx.r.certain || []).filter(function (d) { return d.code === 'ARR'; })[0];
        return arr ? '<div class="note danger"><b>Az EKG alapján aritmogén syncope igazolt</b> (' + ctx.esc(arr.text.replace(/^Aritmogén syncope \(|\)$/g, '')) + '). Ez egyértelmű diagnózis és egyben magas kockázat. Ha más egyértelmű diagnózis nincs, válassza a „Nincs egyértelmű diagnózis” lehetőséget, vagy lépjen tovább.</div>' : '';
      },
    },
    dxCriteria: {
      render: function (ctx) {
        var c = ctx.state['dx.certain'];
        var crit = {
          vvs: 'Fájdalom, félelem vagy állás váltotta ki, és típusos progresszív prodroma (sápadtság, verejtékezés, hányinger) előzte meg.',
          situational: 'Mikció, nyelés, székelés, köhögés, tüsszentés, terhelés, nevetés vagy fúvós hangszeren játszás váltotta ki.',
          orthostatic: 'Állás közben történt, és az aktív állás vizsgálat jelentős ortosztatikus hypotoniát mutat.' + (ctx.r.as && ctx.r.as.oh ? ' <b>✓ Az aktív állás OH-t mutat.</b>' : ' <b>⚠ Az aktív állás nem mutatott OH-t – így nem igazolható.</b>'),
          cardiac: 'Igazolt akut myocardialis ischaemia, vagy bizonyított strukturális ok (súlyos AS, pitvari myxoma, bal pitvari gömbthrombus, PE, akut aortadisszekció).',
          none: 'A rizikóbecslés dönt a további teendőről.',
        }[c];
        return crit ? '<div class="note ' + (c === 'orthostatic' && !(ctx.r.as && ctx.r.as.oh) ? 'warn' : 'info') + '"><b>Feltétel (SOP 4.5):</b> ' + crit + '</div>' : '';
      },
    },
    autoHigh: {
      render: function (ctx) {
        var r = ctx.r.risk;
        return r && r.auto && r.auto.length ? '<div class="note danger"><b>Magas kockázat már a korábbi lépések alapján:</b>' + li(r.auto, ctx.esc) + 'Az 1–3. kérdésre nincs szükség; a diszpozíció a magas kockázat szerint történik.</div>' : '';
      },
    },
    highList: {
      render: function (ctx) {
        var items = Object.keys(L.HIGH).map(function (k) { return L.HIGH[k]; }).concat(['Szívbetegséghez vagy kóros EKG-hoz társuló syncope, és: ' + Object.keys(L.HIGH_HD).map(function (k) { return L.HIGH_HD[k]; }).join(' / ')]);
        return '<details class="drugs" open><summary>A magas kockázati jegyek listája</summary>' + li(items, ctx.esc) + '</details>';
      },
    },
    midList: {
      render: function (ctx) {
        return '<details class="drugs"' + (ctx.state['m.any'] ? '' : ' open') + '><summary>A közepes kockázati jegyek listája</summary>' + li(Object.keys(L.MID).map(function (k) { return L.MID[k]; }), ctx.esc) + '</details>';
      },
    },
    risk: {
      render: function () { return ''; },
      live: function (ctx) {
        var r = ctx.r.risk;
        if (!r) return '';
        if (!r.level) {
          var q = r.needs === 'high' ? 'Válaszoljon az 1. kérdésre.' : r.needs === 'mid' ? 'Válaszoljon a 2. kérdésre.' : '';
          return q ? '<div class="note info">' + q + '</div>' : '';
        }
        var cls = { low: 'ok', intermediate: 'warn', high: 'danger' }[r.level];
        var t = { low: 'Alacsony kockázat', intermediate: 'Közepes kockázat', high: 'Magas kockázat' }[r.level];
        var why = '';
        if (r.level === 'high') why = 'Indok:' + li(r.high, ctx.esc);
        else if (r.level === 'intermediate' && r.mid.length) why = 'Indok:' + li(r.mid, ctx.esc);
        else if (r.level === 'intermediate') why = 'Az alacsony kockázathoz hiányzik:' + li(r.lowMissing, ctx.esc);
        else why = 'Teljesül: ' + ctx.esc(r.low.join('; ')) + '; negatív fizikális vizsgálat; eltérés nélküli EKG.';
        return '<div class="note ' + cls + '"><b>Eredmény: ' + t + '</b><br>' + why + '</div>';
      },
    },
    treatment: {
      render: function () {
        return '<div class="note info"><b>Kezelési megfontolások (6.6):</b> súlyos / gyakori reflex syncope alacsony vérnyomás fenotípussal vagy hipotonizáló gyógyszerrel → szakirányú járóbeteg-kivizsgálás. Esésre hajlamosaknál ACE-gátló, ARB, Ca-csatorna-blokkoló előnyben a diuretikummal és béta-blokkolóval szemben. Hypertonia hiányában 2–3 l folyadék és 10 g só naponta.</div>' +
          '<button type="button" class="btn" data-goto-ref="leaflet">Betegtájékoztató (ellenmanőverek) megnyitása / nyomtatása</button>';
      },
    },
  };

  SBO.register({
    id: 'syncope',
    title: 'Syncope',
    short: 'Syncope',
    description: 'TLOC besorolás, aktív állás vizsgálat, CSM, EKG, egyértelmű diagnózis, rizikóbecslés (magas → közepes → alacsony), diszpozíció, betegtájékoztató.',
    color: { base: '#ff6969', ink: '#bf3f3f', inkDark: '#ff9a9a' }, // a nyomtatott SOP fejlécszíne
    sop: C.SOP,
    steps: STEPS,
    stepVisible: stepVisible,
    stageToStep: { start: 'start', history: 'history', exam: 'exam', ekg: 'ekg', dx: 'dx', risk: 'risk', done: 'summary' },
    evaluate: L.evaluate,
    categories: { UNSTABLE: 'Instabil beteg – ABCDE', OTHER: 'Nem a syncope eljárásrend tárgya', LOW: 'Alacsony kockázatú syncope', INTERMEDIATE: 'Közepes kockázatú syncope', HIGH: 'Magas kockázatú syncope' },
    dangerCategories: ['UNSTABLE', 'HIGH'],
    widgets: widgets,
    reportFindings: function (s, r) {
      var lines = [];
      if (r.as && r.as.done) lines.push('AKTÍV ÁLLÁS: ' + (r.as.notDone ? 'nem végezhető' : r.as.oh ? 'OH' + (r.as.reasons ? ' (' + r.as.reasons.join('; ') + ')' : '') : r.as.pots ? 'OH nélküli pulzusemelkedés' : 'negatív') + (r.ohCertainty ? ' – OH-syncope ' + r.ohCertainty : ''));
      if (s['csm.result'] === 'pos' || s['csm.result'] === 'neg') lines.push('CSM: ' + (s['csm.result'] === 'pos' ? 'pozitív (' + r.csm.dx + ')' : 'negatív'));
      if (s['ekg.normal']) lines.push('EKG: ' + (s['ekg.normal'] === 'yes' ? 'eltérés nélkül' : 'kóros') + (s['ekg.text'] ? ' – ' + s['ekg.text'] : ''));
      if (r.risk && r.risk.level) {
        lines.push('RIZIKÓ: ' + { low: 'alacsony', intermediate: 'közepes', high: 'magas' }[r.risk.level]);
        r.risk.high.concat(r.risk.mid).forEach(function (x) { lines.push('- ' + x); });
        if (r.risk.lowMissing.length) lines.push('- alacsony kockázathoz hiányzik: ' + r.risk.lowMissing.join(', '));
      }
      return lines;
    },
    docSections: function (s, r) { return D.sections(s, r); },
    reference: function () { return C.REFERENCE; },
  });
})();
