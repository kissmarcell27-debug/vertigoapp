/*
 * Eljárásrend-modul: „Intracranialis vérzések sürgősségi kezelése” (ÉPC-HK SBC SOP 17, v1.0).
 * Függ: SBO, HeadInjuryLogic, HeadInjuryContent, HeadInjuryDocs.
 */
(function () {
  'use strict';

  var L = window.HeadInjuryLogic;
  var C = window.HeadInjuryContent;
  var D = window.HeadInjuryDocs;

  var trauma = function (s) { return s.etiology === 'trauma'; };
  var GCS_E = [{ v: '4', l: '4 – spontán' }, { v: '3', l: '3 – felszólításra' }, { v: '2', l: '2 – fájdalomra' }, { v: '1', l: '1 – nincs' }];
  var GCS_V = [{ v: '5', l: '5 – orientált' }, { v: '4', l: '4 – zavart' }, { v: '3', l: '3 – nem odaillő szavak' }, { v: '2', l: '2 – érthetetlen hangok' }, { v: '1', l: '1 – nincs' }];
  var GCS_M = [{ v: '6', l: '6 – utasítást követ' }, { v: '5', l: '5 – lokalizál' }, { v: '4', l: '4 – elhárít' }, { v: '3', l: '3 – kóros flexió' }, { v: '2', l: '2 – extenzió' }, { v: '1', l: '1 – nincs' }];

  function checks(map) {
    return Object.keys(map).map(function (k) { return { type: 'check', key: k, label: map[k] }; });
  }

  var STEPS = [
    {
      id: 'start', title: 'Beteg, etiológia, ABCDE', ref: 'SOP 2., 5.',
      fields: [
        { type: 'choice', key: 'etiology', label: 'Milyen esetről van szó?', options: [
          { v: 'trauma', l: 'Traumás fejsérülés' }, { v: 'nontrauma', l: 'Nem traumás intracranialis vérzés (igazolt / gyanú)' }] },
        { type: 'yn', key: 'critical', label: 'Kritikus állapotú (ABCDE-ben instabil) a beteg?' },
        { type: 'note', level: 'danger', when: function (s) { return s.critical === 'yes'; }, html: 'Vizsgálat és ellátás <b>ABCDE</b> szerint; monitorozás (légzés, SpO₂, pulzus/EKG, RR). A célértékeket és a gyógyszereket az <b>Aranyóra</b> lépés tartalmazza.' },
        { type: 'num', key: 'pt.age', label: 'Életkor (év)' },
      ].concat(SBO.fields.vitals(), [
        { type: 'heading', label: 'GCS' },
        { type: 'choice', key: 'gcs.e', label: 'Szemnyitás (E)', options: GCS_E },
        { type: 'choice', key: 'gcs.v', label: 'Verbális válasz (V)', options: GCS_V },
        { type: 'choice', key: 'gcs.m', label: 'Motoros válasz (M)', options: GCS_M },
        { type: 'widget', name: 'gcs' },
        { type: 'choice', key: 'pupils', label: 'Pupillák', options: [{ v: 'eq', l: 'Egyenlők, reagálnak' }, { v: 'aniso', l: 'Anisocoria' }, { v: 'fixed', l: 'Fénymerev, tág' }] },
        { type: 'heading', label: 'Alvadásgátlás' },
        { type: 'choice', key: 'sp.anticoag', label: 'Antikoaguláns', options: [{ v: 'none', l: 'Nem szed' }, { v: 'vka', l: 'K-vitamin-antagonista' }, { v: 'noac', l: 'NOAC' }] },
        { type: 'text', key: 'ac.drug', label: 'Készítmény, dózis', when: function (s) { return s['sp.anticoag'] === 'vka' || s['sp.anticoag'] === 'noac'; } },
        { type: 'num', key: 'inr', label: 'INR', when: function (s) { return s['sp.anticoag'] === 'vka' || s['sp.anticoag'] === 'noac'; } },
        { type: 'yn', key: 'sp.tag', label: 'Thrombocytaaggregáció-gátlót szed?' },
        { type: 'text', key: 'tag.drug', label: 'Készítmény', when: function (s) { return s['sp.tag'] === 'yes'; } },
      ]),
    },
    {
      id: 'nontrauma', title: 'Nem traumás vérzés', ref: 'SOP 2., 7., 9.',
      fields: [
        { type: 'text', key: 'hx.onset', label: 'Panaszok kezdete' },
        { type: 'text', key: 'hx.symptoms', label: 'Tünetek (pl. hirtelen erős fejfájás, hányás, féloldali gyengeség, beszédzavar)' },
        { type: 'choice', key: 'nt.type', label: 'A vérzés típusa (CT alapján)', options: [
          { v: 'deep', l: 'Hypertoniás, törzsdúci ICH' }, { v: 'lobar', l: 'Lobáris vérzés' }, { v: 'sah', l: 'Nem traumás SAV' }] },
        { type: 'yn', key: 'nt.large', label: 'Nagyméretű, sebészileg hozzáférhető ICH vagy obstruktív hydrocephalus?' },
        { type: 'textarea', key: 'ct.text', label: 'CT lelet (epikrízisbe)' },
      ],
    },
    {
      id: 'risk', title: 'Rizikócsoport', ref: 'SOP 4.',
      fields: [
        { type: 'heading', label: 'Magas kockázati kritériumok' },
        { type: 'note', level: 'info', html: 'A GCS ≤12 automatikusan magas kockázatot jelent (az első lépésben megadott GCS alapján).' },
      ].concat(checks(L.HIGH), [
        { type: 'heading', label: 'Közepes kockázati kritériumok' },
        { type: 'num', key: 'vomit.n', label: 'Hányások száma (0, ha nem hányt)' },
      ], checks(L.MODERATE), [
        { type: 'check', key: 'mr.trivial', label: '<2 vagy >70 éves, de teljesen jelentéktelen sérülés (az életkor ekkor nem számít kritériumnak)', when: function (s) { var a = Number(s['pt.age']); return s['pt.age'] && (a < 2 || a > 70); } },
        { type: 'heading', label: 'Alacsony kockázat' },
        { type: 'check', key: 'risk.none', label: 'Áttekintettem: egyik közepes vagy magas kockázati kritérium sem áll fenn (tünetmentes, legfeljebb fejfájás, szédülés)' },
        { type: 'widget', name: 'risk' },
      ]),
    },
    {
      id: 'ct', title: 'CT-indikáció és időzítés', ref: 'SOP 7., 13.',
      fields: [
        { type: 'heading', label: 'Kiegészítő CT-kritériumok' },
        { type: 'yn', key: 'ct.gcs2h', label: 'GCS <15 a sérülés után 2 órával?' },
        { type: 'note', level: 'info', html: 'Az alábbiak csak akkor számítanak, ha eszméletvesztés vagy amnézia volt (8 órás CT-szabály).' },
        { type: 'check', key: 'ct.dangerous', label: 'Veszélyes mechanizmus (elütött gyalogos/kerékpáros, járműből kiesett, >1 m vagy 5 lépcsőfok)' },
        { type: 'check', key: 'ct.retro', label: '>30 perces retrográd amnézia' },
        { type: 'check', key: 'ct.over8h', label: 'A felvételkor a sérülés óta már több mint 8 óra telt el' },
        { type: 'heading', label: 'TAG-gátlót szedő betegnél', when: function (s) { return s['sp.tag'] === 'yes'; } },
        { type: 'check', key: 'sp.amnesia', label: 'Elhúzódó amnézia', when: function (s) { return s['sp.tag'] === 'yes'; } },
        { type: 'heading', label: 'Nyaki gerinc CT kritériumai' },
        { type: 'check', key: 'cs.intubated', label: 'Intubált beteg' },
        { type: 'check', key: 'cs.urgent', label: 'A nyaki gerinc sérülésének sürgős definitív diagnózisa szükséges (pl. műtét, érzéstelenítés)' },
        { type: 'check', key: 'cs.polytrauma', label: 'Éber, stabil beteg, a fejet és a mellkast/hasat/medencét is érintő tompa polytrauma' },
        { type: 'check', key: 'cs.suspicion', label: 'A nyaki gerinc sérülésének klinikai gyanúja' },
        { type: 'check', key: 'cs.mech', label: '… és veszélyes mechanizmus (>1 m / 5 lépcsőfok, tengelyirányú terhelés, nagy sebességű ütközés, motorbaleset, kilökődés, kerékpáros ütközés)', when: function (s) { return s['cs.suspicion']; } },
        { type: 'check', key: 'cs.focal', label: '… és fokális perifériás neurológiai deficit', when: function (s) { return s['cs.suspicion']; } },
        { type: 'check', key: 'cs.paresth', label: '… és paresztézia a felső vagy alsó végtagokban', when: function (s) { return s['cs.suspicion']; } },
        { type: 'widget', name: 'ct' },
      ],
    },
    {
      id: 'ctresult', title: 'CT eredmény', ref: '1. melléklet, SOP 9., 13.',
      fields: [
        { type: 'choice', key: 'ct.result', label: 'Non-contrast koponya CT', options: [{ v: 'neg', l: 'Negatív' }, { v: 'pos', l: 'Pozitív (IC vérzés / traumás eltérés)' }] },
        { type: 'heading', label: 'Lelet', when: function (s) { return s['ct.result'] === 'pos'; } },
        { type: 'check', key: 'ct.edh', label: 'Epiduralis vérzés', when: function (s) { return s['ct.result'] === 'pos'; } },
        { type: 'check', key: 'ct.sdh', label: 'Subduralis vérzés', when: function (s) { return s['ct.result'] === 'pos'; } },
        { type: 'check', key: 'ct.sah', label: 'Subarachnoidealis vérzés', when: function (s) { return s['ct.result'] === 'pos'; } },
        { type: 'check', key: 'ct.iph', label: 'Intraparenchymalis vérzés / contusio', when: function (s) { return s['ct.result'] === 'pos'; } },
        { type: 'check', key: 'ct.ivh', label: 'Intraventricularis vérzés', when: function (s) { return s['ct.result'] === 'pos'; } },
        { type: 'check', key: 'ct.fx', label: 'Koponyatörés', when: function (s) { return s['ct.result'] === 'pos'; } },
        { type: 'textarea', key: 'ct.text', label: 'CT lelet részletei (epikrízisbe)' },
        { type: 'heading', label: 'Idegsebészeti konzílium', when: function (s) { return s['ct.result'] === 'pos'; } },
        { type: 'text', key: 'ns.text', label: 'Konzílium véleménye', when: function (s) { return s['ct.result'] === 'pos'; } },
        { type: 'choice', key: 'ns.decision', label: 'Elhelyezés', when: function (s) { return s['ct.result'] === 'pos'; }, options: [
          { v: 'op', l: 'Műtő' }, { v: 'ito', l: 'ITO' }, { v: 'obs', l: 'Fektető – obszerváció' }, { v: 'other', l: 'Egyeztetés alatt / egyéb' }] },
      ],
    },
    {
      id: 'dispo', title: 'Obszerváció, diszpozíció', ref: 'SOP 11–13.',
      fields: [
        { type: 'choice', key: 'obs.result', label: '12 órás obszerváció eredménye', when: function (s, r) { return r.special && r.special.obs12 && s['ct.result'] === 'neg'; }, options: [
          { v: 'free', l: 'Panaszmentes' }, { v: 'symptoms', l: 'Panasz jelentkezett' }] },
        { type: 'heading', label: 'Hospitalizációs kritériumok (SOP 11.)' },
        { type: 'check', key: 'adm.imaging', label: 'Új, klinikailag fontos eltérés a képalkotás során' },
        { type: 'check', key: 'adm.gcs', label: 'A GCS nem tért vissza 15-re / a sérülés előtti alapvonalra' },
        { type: 'check', key: 'adm.symptoms', label: 'Folyamatos aggasztó tünetek (tartós hányás, súlyos fejfájás, görcsroham)' },
        { type: 'check', key: 'adm.other', label: 'Egyéb aggodalomra okot adó klinikum (intoxikáció, egyéb sérülés, sokk, nem véletlen sérülés gyanúja, meningitis, liquorcsorgás, fennálló PTA)' },
        { type: 'heading', label: 'Emisszió feltételei (SOP 12.)' },
        { type: 'yn', key: 'dc.gcs', label: 'A GCS visszatért 15-re / a sérülés előtti értékre?', when: function (s, r) { return !(r.ct && r.ct.indicated === false); } },
        { type: 'yn', key: 'dc.noother', label: 'Nincs más felvételt indokoló tényező?' },
        { type: 'yn', key: 'dc.supervision', label: 'Megfelelő otthoni felügyelet biztosított?' },
        { type: 'heading', label: 'Neurológiai romlás jelei – sürgős újraértékelés és CT' },
        { type: 'widget', name: 'deterioration' },
      ],
    },
    {
      id: 'treatment', title: 'Aranyóra – kezelés', ref: 'SOP 5., 10.',
      fields: [
        { type: 'num', key: 'wt', label: 'Testtömeg (kg) – a dózisok kiszámításához' },
        { type: 'num', key: 'bp.sys', label: 'Kezdeti szisztolés vérnyomás (Hgmm) – a célérték kiszámításához' },
        { type: 'widget', name: 'golden' },
        { type: 'text', key: 'sbo.therapy', label: 'Az SBO-n alkalmazott terápia (epikrízisbe)' },
      ],
    },
    {
      id: 'summary', title: 'Összegzés / dokumentáció', ref: '',
      fields: [
        { type: 'heading', label: 'Az ambuláns laphoz' },
        { type: 'text', key: 'inj.time', label: 'A sérülés ideje (pl. „ma 14 órakor”)', when: trauma },
        { type: 'text', key: 'inj.mech', label: 'Mechanizmus (pl. „saját magasságból történt elesés”)', when: trauma },
        { type: 'text', key: 'inj.wound', label: 'Külsérelmi nyom', when: trauma },
        { type: 'yn', key: 'loc.no', label: 'Kifejezetten rákérdezve: eszméletvesztése NEM volt?', when: function (s) { return trauma(s) && !s['mr.loc']; } },
        { type: 'yn', key: 'neuro.nofocal', label: 'Durva neurológiai gócjel nem észlelhető?', when: function (s) { return !s['mr.focal'] && !s['hr.neuro']; } },
        { type: 'text', key: 'lab.text', label: 'Labor röviden' },
        { type: 'check', key: 'leaflet.given', label: 'A fejsérülteknek szóló tájékoztatót átadtam (SOP 12. – az epikrízisben rögzíteni kell)', when: trauma },
        { type: 'summary' },
      ],
    },
  ];

  function stepVisible(id, s, r) {
    switch (id) {
      case 'nontrauma': return s.etiology === 'nontrauma';
      case 'risk': return s.etiology === 'trauma';
      case 'ct': return s.etiology === 'trauma' && r.risk && (r.risk.level === 'moderate' || r.risk.level === 'high');
      case 'ctresult': return s.etiology === 'trauma' && r.risk && (r.risk.level === 'moderate' || r.risk.level === 'high');
      case 'dispo': return s.etiology === 'trauma' && r.risk && !!r.risk.level && s['ct.result'] !== 'pos';
      default: return true;
    }
  }

  function li(arr, esc) { return '<ul>' + arr.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>'; }

  var widgets = {
    gcs: {
      render: function () { return ''; },
      live: function (ctx) {
        var g = ctx.r.gcs;
        if (!g || !g.complete) return '<div class="note info">GCS: adja meg mindhárom komponenst.</div>';
        var lvl = g.total <= 8 ? 'danger' : g.total <= 12 ? 'warn' : g.total < 15 ? 'info' : 'ok';
        return '<div class="note ' + lvl + '"><b>GCS ' + g.total + '</b> (E' + g.e + ' V' + g.v + ' M' + g.m + ')' +
          (g.total < 8 ? ' – emelt szintű légútbiztosítás javasolt (SOP 5.)' : g.total <= 12 ? ' – magas kockázat, CT 1 órán belül (SOP 4., 7.)' : '') + '</div>';
      },
    },
    risk: {
      render: function () { return ''; },
      live: function (ctx) {
        var r = ctx.r.risk;
        if (!r || !r.level) return '<div class="note info">Jelöljön kritériumot, vagy erősítse meg, hogy egyik sem áll fenn.</div>';
        var cls = { low: 'ok', moderate: 'warn', high: 'danger' }[r.level];
        var t = { low: 'Alacsony kockázat', moderate: 'Közepes kockázat', high: 'Magas kockázat' }[r.level];
        return '<div class="note ' + cls + '"><b>' + t + '</b>' + (r.high.length ? '<br>Magas: ' + r.high.map(ctx.esc).join('; ') : '') +
          (r.moderate.length ? '<br>Közepes: ' + r.moderate.map(ctx.esc).join('; ') : '') + '</div>';
      },
    },
    ct: {
      render: function () { return ''; },
      live: function (ctx) {
        var ct = ctx.r.ct, sp = ctx.r.special;
        if (!ct) return '';
        var t = { '1h': 'CT 1 órán belül', '8h': 'CT a sérülést követő 8 órán belül', indicated: 'CT indokolt (legalább közepes kockázat)' }[ct.timing] || 'CT nem indokolt';
        if (sp && sp.group === 'anticoag') t = sp.ctTiming === 'now' ? 'Azonnali CT (antikoagulált)' : sp.ctTiming === '4h' ? 'CT a trauma után 4 órával (antikoagulált, INR <1,4)' : 'Antikoagulált: adja meg az INR-t';
        if (sp && sp.group === 'tag') t = sp.ctTiming === 'now' ? 'Azonnali CT (TAG-gátló, tünetes)' : 'CT a trauma után 4 órával (TAG-gátló, tünetmentes)';
        var spWhy = [];
        if (sp && sp.group === 'tag' && sp.reasons.length) spWhy.push('TAG-gátló + ' + sp.reasons.join(', ') + ' (SOP 13.2)');
        if (sp && sp.group === 'anticoag' && sp.inr !== null) spWhy.push('INR ' + sp.inr + (sp.symptomatic ? ', 1 órás CT-kritérium áll fenn' : '') + ' (SOP 13.1)');
        return '<div class="note ' + (ct.timing === '1h' || (sp && sp.ctTiming === 'now') ? 'danger' : 'warn') + '"><b>' + t + '</b>' +
          li(spWhy.concat(ct.reasons), ctx.esc) +
          (ct.highExtra ? '<div>Kiegészítés: legalább CI–CII, optimálisan CI–ThI.</div>' : '') +
          (ct.cspine.length ? '<div><b>Nyaki gerinc CT is:</b>' + li(ct.cspine, ctx.esc) + '</div>' : '') + '</div>';
      },
    },
    deterioration: {
      render: function (ctx) {
        return '<div class="note warn">' + li([
          'Izgatottság vagy rendellenes viselkedés',
          'Legalább 30 percig tartó 1 pontos GCS-csökkenés (különösen a motoros pontszámban)',
          '≥3 pont csökkenés a szemnyitási vagy verbális, ≥2 pont a motoros pontszámban',
          'Súlyos vagy fokozódó fejfájás, tartós hányás',
          'Új neurológiai jel (pupilla-egyenlőtlenség, végtag- / arcmozgás aszimmetriája)',
        ], ctx.esc) + 'Ilyenkor sürgős újraértékelés és ismételt CT; egyébként kontroll CT az első vizsgálat után 12 órával (SOP 11.).</div>';
      },
    },
    golden: {
      render: function () { return ''; },
      live: function (ctx) {
        var html = '';
        var bp = L.bpTargets(ctx.state);
        if (bp) {
          var z = {
            hypo: '<b>Hypotonia</b> (<90 Hgmm): 250–500 ml iv. krisztalloid 15–30 perc alatt; max. 500 ml után is fennálló hypotoniánál noradrenalin 0,1–1,0 µg/kg/perc (2. választás dobutamin 2–20 µg/kg/perc).',
            '150-220': '<b>150–220 Hgmm:</b> kontraindikáció nélkül 140 Hgmm alá csökkentendő. Az első órában ne csökkenjen ' + bp.floor1h + ' Hgmm alá (max. 15%).',
            over220: '<b>>220 Hgmm:</b> folyamatosan adagolt iv. szer, RR-monitorozás; cél 220/120 Hgmm alá. Az első órában ne csökkenjen ' + bp.floor1h + ' Hgmm alá (max. 15%).',
            normal: 'Szisztolés ' + bp.sys + ' Hgmm: az SOP vérnyomáscsökkentést nem ír elő.',
          }[bp.zone];
          html += '<div class="note ' + (bp.zone === 'normal' ? 'info' : 'warn') + '">' + z +
            (bp.zone === '150-220' || bp.zone === 'over220' ? '<br>Labetalol 10–20 mg bolus 1–2 perc alatt (kétszer ismételhető), majd 1 mg/perc infúzió (max. 6 mg/perc); kontraindikáció esetén urapidil 5 mg-os frakciókban, majd 9–30 mg/óra. Intubált betegnél előbb a szedáció.' : '') +
            ' <span class="ref">SOP 5. C</span></div>';
        }
        var d = L.doses(ctx.state);
        if (d) {
          var row = function (n, v, u, ref) { return '<tr><td>' + n + '</td><td><b>' + v[0] + '–' + v[1] + ' ' + u + '</b></td><td class="ref">' + ref + '</td></tr>'; };
          html += '<table class="ref-table"><thead><tr><th>Gyógyszer (' + d.weight + ' kg)</th><th>Dózis</th><th></th></tr></thead><tbody>' +
            row('Diazepam (roham, 1. vonal) – 0,1–0,2 mg/ttkg', d.diazepam, 'mg', 'SOP 10.') +
            '<tr><td>Levetiracetam (2. vonal)</td><td><b>250 mg iv. bolus</b>, ismételhető 250 mg-mal 1500 mg-ig</td><td class="ref">SOP 10.</td></tr>' +
            row('Fenitoin (3. vonal) – 15–20 mg/ttkg', d.phenytoin, 'mg', 'SOP 10.') +
            row('Mannitol – 0,25–1 g/ttkg', d.mannitol, 'g', 'SOP 10.') +
            row('Ketamin iv. – 0,1–0,3 mg/kg', d.ketamineIv, 'mg', 'SOP 10.') +
            row('Ketamin im. – 1–3 mg/kg', d.ketamineIm, 'mg', 'SOP 10.') +
            row('Fentanyl – 1–2 µg/ttkg', d.fentanyl, 'µg', 'SOP 10.') +
            row('Noradrenalin – 0,1–1,0 µg/kg/perc', d.noradrenalin, 'µg/perc', 'SOP 5.') +
            row('Dobutamin – 2–20 µg/kg/perc', d.dobutamin, 'µg/perc', 'SOP 5.') +
            row('Lélegeztetés: TV 4–6 ml/ttkg', d.tv, 'ml', 'SOP 5.') +
            '</tbody></table><p class="ill-note">A dózisok az SOP-ban megadott testtömeg-arányos értékekből számolva; ellenőrizze alkalmazás előtt.</p>';
        }
        html += '<div class="note info"><b>Célértékek:</b> SpO₂ 90–94% (lélegeztetve >94%), PaO₂ 60–100, PaCO₂ 35–40 Hgmm, vércukor 4,4–6,1 mmol/l, szérum-ozmolaritás <315 mmol/l, láz kezelendő. <b>Szteroid nem ajánlott. NSAID nem javasolt</b> (kivéve paracetamol). Antikoaguláció felfüggesztése: ClotPro eljárásrend. <span class="ref">SOP 5., 8., 10.</span></div>';
        return html;
      },
    },
  };

  SBO.register({
    id: 'fejserules',
    title: 'Fejsérülés, intracranialis vérzés',
    short: 'Fejsérülés / IC vérzés',
    description: 'Fejsérültek rizikócsoportja, CT-indikáció és időzítés, antikoagulált / TAG-gátlót szedő betegek, obszerváció, aranyóra, nem traumás ICH és SAV.',
    color: { base: '#ed7d31', ink: '#b2561a', inkDark: '#f6a66e' }, // a nyomtatott SOP fejlécszíne
    sop: C.SOP,
    steps: STEPS,
    stepVisible: stepVisible,
    stageToStep: { start: 'start', nontrauma: 'nontrauma', risk: 'risk', ct: 'ct', ctresult: 'ctresult', dispo: 'dispo', treatment: 'treatment', done: 'summary' },
    evaluate: L.evaluate,
    categories: {
      LOW: 'Alacsony kockázatú fejsérült', MODERATE: 'Közepes kockázatú fejsérült', HIGH: 'Magas kockázatú fejsérült',
      POSITIVE: 'CT-vel igazolt traumás intracranialis sérülés', NONTRAUMA: 'Nem traumás intracranialis vérzés',
    },
    dangerCategories: ['HIGH', 'POSITIVE', 'NONTRAUMA'],
    widgets: widgets,
    reportFindings: function (s, r) {
      var lines = [];
      if (r.gcs && r.gcs.complete) lines.push('GCS: ' + r.gcs.total + ' (E' + r.gcs.e + ' V' + r.gcs.v + ' M' + r.gcs.m + ')');
      if (r.risk && r.risk.level) {
        lines.push('RIZIKÓCSOPORT: ' + { low: 'alacsony', moderate: 'közepes', high: 'magas' }[r.risk.level]);
        r.risk.high.concat(r.risk.moderate).forEach(function (x) { lines.push('- ' + x); });
      }
      if (r.ct && r.ct.indicated) lines.push('CT-INDIKÁCIÓ: ' + r.ct.reasons.join('; '));
      if (s['ct.result']) lines.push('CT: ' + (s['ct.result'] === 'pos' ? 'pozitív' : 'negatív'));
      return lines;
    },
    docSections: function (s, r) { return D.sections(s, r); },
    reference: function () { return C.REFERENCE; },
  });
})();
