/* Felhasználói felület – a döntési logika a logic.js-ben van. */
(function () {
  'use strict';

  var L = window.VertigoLogic;
  var C = window.VertigoContent;

  var state = {};
  var current = 'stability';
  var view = 'exam'; // exam | reference

  var YN = [{ v: 'yes', l: 'Igen' }, { v: 'no', l: 'Nem' }];
  var LR = [{ v: 'left', l: 'Balra' }, { v: 'right', l: 'Jobbra' }];

  function esc(t) {
    return String(t === undefined || t === null ? '' : t)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* ---------------------------------------------------------------- */
  /* Lépések                                                           */
  /* ---------------------------------------------------------------- */
  var STEPS = [
    {
      id: 'stability', title: 'Stabilitás, primer vizsgálat', ref: 'SOP 5.1, 7.1',
      fields: [
        { type: 'yn', key: 'unstable', label: 'Cardiorespiratoricusan instabil a beteg?' },
        { type: 'note', when: function (s) { return s.unstable === 'yes'; }, level: 'danger', html: 'Ellátás ABCDE séma szerint – az SOP ezt nem részletezi.' },
        { type: 'heading', label: 'Primer vizsgálat (minden stabil betegnél)' },
        { type: 'check', key: 'prim.vitals', label: 'Paraméterek: vérnyomás, pulzus, szaturáció' },
        { type: 'check', key: 'prim.physical', label: 'Fizikális és neurológiai vizsgálat' },
        { type: 'check', key: 'prim.history', label: 'Releváns anamnézis' },
        { type: 'check', key: 'prim.vbg', label: 'Vénás vérgáz' },
        { type: 'check', key: 'prim.ekg', label: 'EKG' },
        { type: 'heading', label: 'Labor' },
        { type: 'check', key: 'lab.glucose', label: 'Vércukor' },
        { type: 'check', key: 'lab.renal', label: 'Vesefunkció' },
        { type: 'check', key: 'lab.nak', label: 'Szérum Na, K' },
        { type: 'check', key: 'lab.crp', label: 'CRP' },
        { type: 'check', key: 'lab.cbc', label: 'Nagy vérkép' },
        { type: 'heading', label: '± Orthostasis teszt' },
        { type: 'orth' },
      ],
    },
    {
      id: 'history', title: 'Anamnézis', ref: 'SOP 5.1',
      fields: [
        { type: 'yn', key: 'hx.trauma', label: 'Történt koponyatrauma a közelmúltban?' },
        { type: 'text', key: 'hx.onset', label: 'Mikor kezdődött a szédülés?' },
        { type: 'text', key: 'hx.provoke', label: 'Mi provokálja / enyhíti? Befolyásolja a fej helyzete (melyik irány)?' },
        { type: 'yn', key: 'hx.hearing', label: 'Van halláscsökkenés?' },
        { type: 'yn', key: 'hx.tinnitus', label: 'Van fülzúgás?' },
        { type: 'heading', label: 'Kísérő tünetek / „red flag”' },
        { type: 'check', key: 'rf.nausea', label: 'Hányinger' },
        { type: 'check', key: 'rf.vomiting', label: 'Hányás' },
        { type: 'check', key: 'rf.headache', label: 'Fejfájás' },
        { type: 'check', key: 'rf.diplopia', label: 'Kettőslátás' },
        { type: 'check', key: 'rf.palpitation', label: 'Palpitáció' },
        { type: 'check', key: 'rf.chestPain', label: 'Mellkasi fájdalom' },
        { type: 'check', key: 'rf.dyspnea', label: 'Dyspnoe' },
        { type: 'check', key: 'rf.syncope', label: 'Syncope' },
        { type: 'heading', label: 'Előzmények' },
        { type: 'check', key: 'pmh.stroke', label: 'Korábbi stroke' },
        { type: 'check', key: 'pmh.arrhythmia', label: 'Ritmuszavar' },
        { type: 'check', key: 'pmh.mi', label: 'Szívinfarktus' },
        { type: 'check', key: 'pmh.syncope', label: 'Kivizsgálatlan syncope' },
        { type: 'text', key: 'pmh.vertigo', label: 'Korábban diagnosztizált szédüléses kórkép (pl. BPPV, Ménière)' },
        { type: 'yn', key: 'hx.inflammation', label: 'Gyulladásos betegségre utaló egyéb panasz?' },
      ],
    },
    {
      id: 'focal', title: 'Fokális neurológiai tünet', ref: '1. ábra (2)',
      fields: [
        { type: 'note', level: 'info', html: 'Egyértelmű, novum fokális tünet: agyidegbénulás, dysarthria, végtagataxia, kettőslátás, tekintésbénulás.' },
        { type: 'yn', key: 'focal', label: 'Van egyértelmű, novum fokális neurológiai tünet?' },
        { type: 'note', when: function (s) { return s.focal === 'yes'; }, level: 'danger', html: '<b>Neurológus értesítése, ellátás a stroke protokoll szerint.</b>' },
      ],
    },
    {
      id: 'nonneuro', title: 'Nem neurológiai ok?', ref: '1. ábra (3)',
      fields: [
        { type: 'yn', key: 'nonneuro', label: 'A vizsgálatok alapján nem neurológiai ok valószínű? (pl. ritmuszavar, bradycardia, ion-/elektrolitzavar, hyponatraemia)' },
        { type: 'text', key: 'nonneuro.text', label: 'Milyen ok?', when: function (s) { return s.nonneuro === 'yes'; } },
        { type: 'heading', label: 'Centrális jelek ellenőrzése', when: function (s) { return s.nonneuro === 'yes'; } },
        { type: 'yn', key: 'cs.nystagmus', label: 'Kóros nystagmus?', when: function (s) { return s.nonneuro === 'yes'; } },
        { type: 'yn', key: 'cs.dysmetria', label: 'Felső végtagi dysmetria?', when: function (s) { return s.nonneuro === 'yes'; } },
        { type: 'yn', key: 'cs.truncal', label: 'Törzsataxia ülő helyzetben?', when: function (s) { return s.nonneuro === 'yes'; } },
      ],
    },
    {
      id: 'classify', title: 'Szindróma besorolása', ref: 'SOP 5.2, 1. ábra (4–5)',
      fields: [
        { type: 'yn', key: 'continuous', label: 'A szédülés folyamatos, és jelenleg is fennáll?' },
        { type: 'yn', key: 'triggered', label: 'A szédülés (pozícionálisan) triggerelhető?', when: function (s) { return s.continuous === 'no'; } },
        { type: 'note', level: 'info', html: '<b>AVS:</b> akut, folyamatos, napokig tartó, a vizsgálat alatt is fennálló. <b>s-EVS:</b> spontán rohamok percektől órákig, kiváltó tényező nélkül. <b>t-EVS:</b> egyértelmű pozícionális provokáció, másodpercektől percekig. Az s-EVS első epizódja kezdetben nem mindig különíthető el az AVS-től.' },
      ],
    },
    {
      id: 'avs', title: 'AVS – előzetes kérdések', ref: 'SOP 5.3, 2. ábra',
      fields: [
        { type: 'yn', key: 'avs.trauma', label: 'Trauma (fejsérülés) felmerül?' },
        { type: 'yn', key: 'avs.headache', label: 'Erős, folyamatosan fennálló / erősödő fejfájás?' },
        { type: 'choice', key: 'avs.ct', label: 'Natív koponya CT eredménye', when: function (s) { return s['avs.trauma'] === 'yes' || s['avs.headache'] === 'yes'; },
          options: [{ v: 'neg', l: 'Nincs ICH / SAV' }, { v: 'ich', l: 'ICH / SAV igazolódott' }] },
        { type: 'yn', key: 'avs.drug', label: 'Újonnan bevezetett gyógyszer / gyógyszerhatás felmerül?' },
        { type: 'drugs', when: function (s) { return s['avs.drug'] === 'yes'; } },
        { type: 'yn', key: 'avs.drugClear', label: 'A panaszok kezdete egyértelműen összefügg az új gyógyszerrel?', when: function (s) { return s['avs.drug'] === 'yes'; } },
      ],
    },
    {
      id: 'hints', title: 'AVS – HINTS+ és statokinetikus próbák', ref: 'SOP 6.1–6.4',
      fields: [
        { type: 'note', level: 'info', html: 'Csak aktuálisan szédülő betegnél. Nyaki sérülés (gyanúja) vagy kooperációképtelenség esetén a HIT nem végezhető.' },
        { type: 'choice', key: 'hints.hit', label: 'Head Impulse Test (Halmágyi)', options: [
          { v: 'saccade', l: 'Korrekciós szakkád (perifériás)' }, { v: 'normal', l: 'Negatív – nincs szakkád (centrális)' }, { v: 'nd', l: 'Nem végezhető' }] },
        { type: 'choice', key: 'hints.hitSide', label: 'Szakkád a fej melyik oldalra fordításakor? (= károsodott oldal)', options: LR,
          when: function (s) { return s['hints.hit'] === 'saccade'; } },
        { type: 'illus', name: 'hit' },
        { type: 'choice', key: 'hints.nyst', label: 'Spontán nystagmus jellege', options: [
          { v: 'horiz_unidir', l: 'Iránytartó, horizontális / horizonto-rotatoros' },
          { v: 'vertical', l: 'Vertikális' }, { v: 'torsional', l: 'Tisztán rotatoros' },
          { v: 'gaze_evoked', l: 'Tekintésirányú (irányváltó)' }, { v: 'none', l: 'Nincs nystagmus' }, { v: 'nd', l: 'Nem vizsgálható' }] },
        { type: 'choice', key: 'hints.nystDir', label: 'Gyors komponens iránya', options: LR,
          when: function (s) { return s['hints.nyst'] === 'horiz_unidir'; } },
        { type: 'choice', key: 'hints.nystGrade', label: 'Intenzitás', options: [
          { v: 'I', l: 'I. fok – csak a gyors komponens irányába nézve' }, { v: 'II', l: 'II. fok – előre nézve is' }, { v: 'III', l: 'III. fok – ellentétes irányba nézve is' }],
          when: function (s) { return s['hints.nyst'] === 'horiz_unidir'; } },
        { type: 'illus', name: 'nystagmus' },
        { type: 'choice', key: 'hints.skew', label: 'Skew deviation (szemtakarásos teszt)', options: [
          { v: 'neg', l: 'Negatív' }, { v: 'pos', l: 'Pozitív – vertikális beállító szakkád' }, { v: 'nd', l: 'Nem végezhető' }] },
        { type: 'illus', name: 'skew' },
        { type: 'choice', key: 'hints.hearing', label: 'Tájékozódó hallásvizsgálat', options: [
          { v: 'none', l: 'Nincs új halláscsökkenés' }, { v: 'acute_unilateral', l: 'Akut féloldali halláscsökkenés' }, { v: 'nd', l: 'Nem vizsgálható' }] },
        { type: 'illus', name: 'hearing' },
        { type: 'heading', label: 'Statokinetikus próbák (harmonikus / diszharmonikus)' },
        { type: 'choice', key: 'stat.romberg', label: 'Romberg-próba', options: [
          { v: 'neg', l: 'Negatív' }, { v: 'sway', l: 'Ingadozik' }, { v: 'fall_left', l: 'Balra dől' }, { v: 'fall_right', l: 'Jobbra dől' },
          { v: 'fall_back', l: 'Hátradől' }, { v: 'unable', l: 'Nem végezhető' }] },
        { type: 'illus', name: 'romberg' },
        { type: 'choice', key: 'stat.barany', label: 'Bárány-féle mutatópróba – félremutatás', options: [
          { v: 'none', l: 'Nincs' }, { v: 'left', l: 'Balra' }, { v: 'right', l: 'Jobbra' }, { v: 'nd', l: 'Nem végezhető' }] },
        { type: 'illus', name: 'barany' },
        { type: 'choice', key: 'stat.gait', label: 'Vakjárás', options: [
          { v: 'normal', l: 'Egyenes' }, { v: 'dev_left', l: 'Balra deviál' }, { v: 'dev_right', l: 'Jobbra deviál' },
          { v: 'ataxia', l: 'Kifejezett ataxia' }, { v: 'unable', l: 'Nem járóképes' }] },
        { type: 'illus', name: 'gait' },
        { type: 'yn', key: 'stat.truncal', label: 'Törzsataxia?' },
        { type: 'hintsBox' },
        { type: 'heading', label: 'Súlyosság', when: function (s, r) { return r.hints && r.hints.result === 'peripheral'; } },
        { type: 'yn', key: 'avs.severe', label: 'Súlyos eset? (folyamatos parenterális hányáscsillapítás igénye, vagy a szédülés miatt teljes önellátási képtelenség)',
          when: function (s, r) { return r.hints && r.hints.result === 'peripheral'; } },
      ],
    },
    {
      id: 'sevs', title: 's-EVS – kivizsgálás', ref: 'SOP 5.4, 3. ábra',
      fields: [
        { type: 'note', level: 'info', html: 'A betegek érkezéskor gyakran már tünetmentesek – az anamnézis kiemelten fontos.' },
        { type: 'heading', label: 'ABCD2 score (segédeszköz a TIA-kockázathoz)' },
        { type: 'num', key: 'abcd2.age', label: 'Életkor (év)' },
        { type: 'num2', keys: ['abcd2.sys', 'abcd2.dia'], label: 'Első mért vérnyomás (Hgmm)', ph: ['szisztolés', 'diasztolés'] },
        { type: 'choice', key: 'abcd2.clinical', label: 'Klinikai tünet', options: [
          { v: 'weakness', l: 'Féloldali gyengeség' }, { v: 'speech', l: 'Beszédzavar gyengeség nélkül' }, { v: 'none', l: 'Egyik sem' }] },
        { type: 'choice', key: 'abcd2.dur', label: 'Tünetek időtartama', options: [
          { v: '60+', l: '≥60 perc' }, { v: '10-59', l: '10–59 perc' }, { v: '<10', l: '<10 perc' }] },
        { type: 'yn', key: 'abcd2.dm', label: 'Diabetes mellitus?' },
        { type: 'abcd2Box' },
        { type: 'heading', label: 'Klinikai döntés' },
        { type: 'choice', key: 'sevs.tiaRisk', label: 'Az anamnézis alapján a vertebrobasilaris TIA kockázata', options: [
          { v: 'high', l: 'Magas' }, { v: 'low', l: 'Alacsony' }] },
        { type: 'yn', key: 'sevs.inArea', label: 'ÉPC-HK ellátási területéhez tartozik a beteg?', when: function (s) { return s['sevs.tiaRisk'] === 'high'; } },
        { type: 'heading', label: 'Kísérő tünetek', when: function (s) { return s['sevs.tiaRisk'] === 'low'; } },
        { type: 'check', key: 'sevs.headache', label: 'Epizódokban / szédülés után jelentkező erős fejfájás', when: function (s) { return s['sevs.tiaRisk'] === 'low'; } },
        { type: 'check', key: 'sevs.tinnitus', label: 'Fülzúgás, halláscsökkenés', when: function (s) { return s['sevs.tiaRisk'] === 'low'; } },
        { type: 'check', key: 'sevs.anxiety', label: 'Nagyfokú szorongás, bizonytalanságérzés, szokatlan aprólékosságú beszámoló, gyakori SBO-látogatás', when: function (s) { return s['sevs.tiaRisk'] === 'low'; } },
        { type: 'choice', key: 'sevs.course', label: 'Lefolyás', when: function (s) { return s['sevs.tiaRisk'] === 'low'; }, options: [
          { v: 'mild', l: 'Megszűnt / nem ismétlődik / enyhe, ambulánsan menedzselhető' },
          { v: 'severe', l: 'Súlyos, gyakran ismétlődő, ambulánsan nem menedzselhető' }] },
      ],
    },
    {
      id: 'tevs', title: 't-EVS – pozícionális tesztek', ref: 'SOP 5.5, 6.5, 3. ábra',
      fields: [
        { type: 'choice', key: 'tevs.state', label: 'A beteg jelenlegi állapota', options: [
          { v: 'calm', l: 'Panaszmentes / közel panaszmentes' }, { v: 'severe', l: 'Folyamatosan, erősen szédül' }] },
        { type: 'choice', key: 'dh.right', label: 'Dix-Hallpike – JOBB oldal', when: function (s) { return s['tevs.state'] === 'calm'; }, options: [
          { v: 'neg', l: 'Negatív' }, { v: 'typical', l: 'Tipikus: latencia, horizonto-rotatoros ny., <1 perc' },
          { v: 'atypical', l: 'Atípusos: nincs latencia / irányváltó / nem csökken' }, { v: 'nd', l: 'Nem végezhető' }] },
        { type: 'choice', key: 'dh.left', label: 'Dix-Hallpike – BAL oldal', when: function (s) { return s['tevs.state'] === 'calm'; }, options: [
          { v: 'neg', l: 'Negatív' }, { v: 'typical', l: 'Tipikus: latencia, horizonto-rotatoros ny., <1 perc' },
          { v: 'atypical', l: 'Atípusos: nincs latencia / irányváltó / nem csökken' }, { v: 'nd', l: 'Nem végezhető' }] },
        { type: 'choice', key: 'roll', label: '„Supine roll” teszt', when: function (s) { return s['tevs.state'] === 'calm'; }, options: [
          { v: 'neg', l: 'Negatív' },
          { v: 'geo_right', l: 'Geotrop ny. mindkét oldalon, JOBBRA fordításkor erősebb' },
          { v: 'geo_left', l: 'Geotrop ny. mindkét oldalon, BALRA fordításkor erősebb' },
          { v: 'atypical', l: 'Egyéb / atípusos mintázat' }, { v: 'nd', l: 'Nem végezhető' }] },
        { type: 'choice', key: 'tevs.severity', label: 'Súlyosság', when: function (s, r) { return r.positional.result === 'bppv'; }, options: [
          { v: 'mild', l: 'Enyhe, ambulánsan menedzselhető' }, { v: 'severe', l: 'Súlyos, ambulánsan nem menedzselhető' }] },
        { type: 'heading', label: 'Orthostasis teszt', when: function (s, r) { return r.positional.result === 'negative'; } },
        { type: 'orth', when: function (s, r) { return r.positional.result === 'negative'; } },
      ],
    },
    {
      id: 'therapy', title: 'Terápia és tájékoztatás', ref: 'SOP 8',
      fields: [{ type: 'therapy' }],
    },
    {
      id: 'summary', title: 'Összegzés / dokumentáció', ref: '',
      fields: [{ type: 'summary' }],
    },
  ];

  var STAGE_TO_STEP = {
    stability: 'stability', focal: 'focal', nonneuro: 'nonneuro', classify: 'classify',
    avs_pre: 'avs', hints: 'hints', avs_dispo: 'hints', sevs: 'sevs', tevs: 'tevs', done: 'summary',
  };

  function visibleSteps(r) {
    var s = state;
    return STEPS.filter(function (st) {
      switch (st.id) {
        case 'focal': return s.unstable === 'no';
        case 'nonneuro': return s.unstable === 'no' && s.focal === 'no';
        case 'classify': return s.unstable === 'no' && s.focal === 'no' && r.category !== 'SECONDARY' && !!s.nonneuro &&
          (r.stage === 'classify' || ['AVS', 'SEVS', 'TEVS'].indexOf(r.category) >= 0);
        case 'avs': return r.category === 'AVS';
        case 'hints': return r.category === 'AVS' && r.stage !== 'avs_pre' && !(s['avs.ct'] === 'ich' && (s['avs.trauma'] === 'yes' || s['avs.headache'] === 'yes'));
        case 'sevs': return r.category === 'SEVS';
        case 'tevs': return r.category === 'TEVS';
        case 'therapy': return ['AVS', 'SEVS', 'TEVS'].indexOf(r.category) >= 0;
        default: return true;
      }
    });
  }

  /* ---------------------------------------------------------------- */
  /* Mező-renderelők                                                   */
  /* ---------------------------------------------------------------- */
  function radios(key, options, label) {
    var v = state[key];
    return '<fieldset class="field"><legend>' + esc(label) + '</legend><div class="seg">' +
      options.map(function (o) {
        var id = 'f_' + key.replace(/\W/g, '_') + '_' + o.v.replace(/\W/g, '_');
        return '<input type="radio" id="' + id + '" name="' + esc(key) + '" value="' + esc(o.v) + '" data-key="' + esc(key) + '"' + (v === o.v ? ' checked' : '') + '>' +
          '<label for="' + id + '">' + esc(o.l) + '</label>';
      }).join('') +
      (v ? '<button type="button" class="clear" data-clear="' + esc(key) + '" title="Válasz törlése">×</button>' : '') +
      '</div></fieldset>';
  }

  function renderField(f, r) {
    if (f.when && !f.when(state, r)) return '';
    switch (f.type) {
      case 'yn': return radios(f.key, YN, f.label);
      case 'choice': return radios(f.key, f.options, f.label);
      case 'check':
        return '<label class="check"><input type="checkbox" data-key="' + esc(f.key) + '"' + (state[f.key] ? ' checked' : '') + '> ' + esc(f.label) + '</label>';
      case 'text':
        return '<label class="field"><span>' + esc(f.label) + '</span><input type="text" data-key="' + esc(f.key) + '" value="' + esc(state[f.key]) + '"></label>';
      case 'num':
        return '<label class="field"><span>' + esc(f.label) + '</span><input type="number" inputmode="decimal" data-key="' + esc(f.key) + '" value="' + esc(state[f.key]) + '"></label>';
      case 'num2':
        return '<div class="field"><span>' + esc(f.label) + '</span><div class="row">' + f.keys.map(function (k, i) {
          return '<input type="number" inputmode="decimal" placeholder="' + esc(f.ph[i]) + '" data-key="' + esc(k) + '" value="' + esc(state[k]) + '">';
        }).join('<span class="sep">/</span>') + '</div></div>';
      case 'heading': return '<h3>' + esc(f.label) + '</h3>';
      case 'note': return '<div class="note ' + f.level + '">' + f.html + '</div>';
      case 'orth': return renderOrth(r);
      case 'drugs': return renderDrugs();
      case 'hintsBox': return renderHintsBox(r);
      case 'illus': return renderIllus(f.name);
      case 'abcd2Box': return '<div data-live="abcd2">' + renderAbcd2Box(r) + '</div>';
      case 'therapy': return renderTherapy(r);
      case 'summary': return renderSummary(r);
      default: return '';
    }
  }

  var openIllus = {};
  function renderIllus(name) {
    var I = window.VertigoIllustrations;
    if (!I) return '';
    var open = !!openIllus[name];
    return '<details class="illus" data-illus="' + name + '"' + (open ? ' open' : '') + '><summary>Hogyan néz ki? (animált ábra)</summary>' +
      (open ? I.get(name) : '') + '</details>';
  }

  function renderOrth(r) {
    var o = r.orthostasis;
    var inp = function (k, ph) { return '<input type="number" inputmode="numeric" placeholder="' + ph + '" data-key="' + k + '" value="' + esc(state[k]) + '">'; };
    var html = '<div class="orth"><table><thead><tr><th></th><th>Szisztolés</th><th>Diasztolés</th><th>Pulzus</th></tr></thead><tbody>' +
      '<tr><th>Fekve</th><td>' + inp('orth.supSys', 'Hgmm') + '</td><td>' + inp('orth.supDia', 'Hgmm') + '</td><td>' + inp('orth.supHr', '/perc') + '</td></tr>' +
      '<tr><th>Állva (≤3 perc)</th><td>' + inp('orth.stSys', 'Hgmm') + '</td><td>' + inp('orth.stDia', 'Hgmm') + '</td><td>' + inp('orth.stHr', '/perc') + '</td></tr>' +
      '</tbody></table>';
    return html + '<div data-live="orth">' + orthResult(r) + '</div></div>';
  }

  function orthResult(r) {
    var o = r.orthostasis, html = '';
    if (o.done && !o.manual) {
      html += '<div class="note ' + (o.positive ? 'warn' : (o.pots ? 'warn' : 'ok')) + '">' +
        'Szisztolés esés: ' + o.dSys + ' Hgmm, diasztolés esés: ' + o.dDia + ' Hgmm' + (o.dHr !== null ? ', pulzusemelkedés: ' + o.dHr + '/perc' : '') + ' → ' +
        (o.positive ? '<b>orthostaticus hypotonia</b>' : (o.pots ? '<b>POTS-ra utaló pulzusemelkedés</b> (hypotonia nélkül)' : 'nem kóros')) +
        '<br><small>Kritérium: szisztolés ≥20 vagy diasztolés ≥10 Hgmm esés; POTS: ≥30/perc emelkedés (Freeman et al. 2011 – nem az SOP része).</small></div>';
    } else {
      html += radios('orth.manual', [{ v: 'pos', l: 'Pozitív' }, { v: 'neg', l: 'Negatív' }], 'Vagy az eredmény közvetlenül:');
    }
    return html;
  }

  function renderDrugs() {
    return '<details class="drugs" open><summary>Szédülést okozó gyógyszerek (1. melléklet) – jelölje, ami szóba jön</summary><div class="grid">' +
      C.DRUGS.map(function (d, i) {
        var k = 'drug.' + i;
        return '<label class="check"><input type="checkbox" data-key="' + k + '"' + (state[k] ? ' checked' : '') + '> ' + esc(d) + '</label>';
      }).join('') + '</div></details>' +
      '<div class="note warn">Kerülje a diagnózis elhamarkodását: gyógyszermellékhatás csak akkor véleményezhető, ha a panaszok kezdete egyértelműen összefügg az új gyógyszerrel, és az algoritmus további lépésein végighaladva más kórképeket nagy valószínűséggel kizártunk.</div>';
  }

  function renderHintsBox(r) {
    var h = r.hints || L.hints(state);
    if (!h.result) return '';
    var cls = { central: 'danger', peripheral: 'ok', indeterminate: 'warn' }[h.result];
    var title = { central: 'Centrális ok valószínű', peripheral: 'Perifériás ok valószínű', indeterminate: 'Nem egyértelmű / hiányos' }[h.result];
    var hm = h.harmony.result === 'harmonic' ? 'harmonikus' : h.harmony.result === 'dysharmonic' ? 'diszharmonikus' : 'nem megítélhető';
    return '<div class="note ' + cls + ' hints-box"><b>HINTS+ értékelés: ' + title + '</b>' +
      (h.central.length ? '<div>Centrális jelek: ' + h.central.map(esc).join('; ') + '</div>' : '') +
      (h.peripheral.length ? '<div>Perifériás jelek: ' + h.peripheral.map(esc).join('; ') + '</div>' : '') +
      '<div>Spontán tünetcsoport: ' + hm + '</div>' +
      (h.missing.length && h.result !== 'central' ? '<div>Hiányzik: ' + h.missing.map(esc).join('; ') + '</div>' : '') +
      '<small>Bármely centrális jel → centrális; perifériás csak teljes perifériás mintázatnál (SOP 6.4 táblázat).</small></div>';
  }

  function renderAbcd2Box(r) {
    var a = r.abcd2;
    if (!a.complete) return '<div class="note info">ABCD2: ' + a.score + ' pont eddig (hiányos adatok).</div>';
    return '<div class="note ' + (a.band === 'alacsony' ? 'info' : 'warn') + '"><b>ABCD2 = ' + a.score + '</b> – ' + a.band + ' kockázat (2 napos stroke-kockázat ≈ ' + a.risk2d + ')' +
      (a.parts.length ? '<br><small>' + a.parts.join(', ') + '</small>' : '') +
      '<br><small>Johnston et al., Lancet 2007. Izolált szédülésre nem validált – csak segítség, a klinikai megítélés dönt (SOP 5.4).</small></div>';
  }

  function renderTherapy(r) {
    var html = '<p>Az SBO-n a terápia a tünetek enyhítését célozza; a hatékonyság egyénenként nagyon változó (SOP 8). Hazabocsátott betegnek áthidaló terápiaként:</p>';
    html += C.THERAPY.map(function (g) {
      return '<h3>' + esc(g.group) + '</h3><ul>' + g.items.map(function (i) { return '<li>' + esc(i) + '</li>'; }).join('') + '</ul>';
    }).join('');
    html += '<h3>Oktatóvideók (betegnek is)</h3><ul>' + C.VIDEOS.map(function (v) {
      return '<li><a href="' + v.url + '" target="_blank" rel="noopener">' + esc(v.label) + '</a></li>';
    }).join('') + '</ul>';
    html += '<div class="note info">Fontos a beteg adekvát tájékoztatása a további kivizsgálásról és az otthoni manőverekről; benignus etiológiánál nyugtassuk meg, hogy a panaszok idővel elmúlnak (SOP 8).</div>';
    if (r.positional && r.positional.result === 'bppv') {
      html += '<button type="button" class="btn" data-goto-ref="leaflet">BPPV betegtájékoztató megnyitása / nyomtatása</button>';
    }
    return html;
  }

  /* ---------------------------------------------------------------- */
  /* Összegzés                                                         */
  /* ---------------------------------------------------------------- */
  var CAT = {
    UNSTABLE: 'Instabil beteg – ABCDE', STROKE: 'Fokális neurológiai tünet – stroke protokoll', SECONDARY: 'Szekunder (nem neurológiai) szédülés',
    AVS: 'Akut vestibularis szindróma (AVS)', SEVS: 'Spontán epizodikus vestibularis szindróma (s-EVS)', TEVS: 'Triggerelt epizodikus vestibularis szindróma (t-EVS)',
  };

  function reportText(r) {
    var lines = [];
    var now = new Date();
    lines.push('SZÉDÜLÉS – SBO VIZSGÁLAT ÖSSZEFOGLALÓ (' + now.toLocaleString('hu-HU') + ')');
    lines.push('Az ÉPC-HK SBO „Szédüléssel jelentkező beteg ellátása” SOP (v1.0) alapján, döntéstámogató alkalmazással.');
    lines.push('');
    var rf = [['rf.nausea', 'hányinger'], ['rf.vomiting', 'hányás'], ['rf.headache', 'fejfájás'], ['rf.diplopia', 'kettőslátás'], ['rf.palpitation', 'palpitáció'],
      ['rf.chestPain', 'mellkasi fájdalom'], ['rf.dyspnea', 'dyspnoe'], ['rf.syncope', 'syncope']].filter(function (x) { return state[x[0]]; }).map(function (x) { return x[1]; });
    lines.push('ANAMNÉZIS:');
    if (state['hx.onset']) lines.push('- Kezdet: ' + state['hx.onset']);
    if (state['hx.provoke']) lines.push('- Provokáló/enyhítő tényezők: ' + state['hx.provoke']);
    if (state['hx.trauma']) lines.push('- Koponyatrauma: ' + (state['hx.trauma'] === 'yes' ? 'igen' : 'nem'));
    if (state['hx.hearing']) lines.push('- Halláscsökkenés: ' + (state['hx.hearing'] === 'yes' ? 'igen' : 'nem') + (state['hx.tinnitus'] ? '; fülzúgás: ' + (state['hx.tinnitus'] === 'yes' ? 'igen' : 'nem') : ''));
    lines.push('- Kísérő tünetek: ' + (rf.length ? rf.join(', ') : 'nem jelölt'));
    var pmh = [['pmh.stroke', 'stroke'], ['pmh.arrhythmia', 'ritmuszavar'], ['pmh.mi', 'AMI'], ['pmh.syncope', 'kivizsgálatlan syncope']].filter(function (x) { return state[x[0]]; }).map(function (x) { return x[1]; });
    if (pmh.length) lines.push('- Előzmények: ' + pmh.join(', '));
    if (state['pmh.vertigo']) lines.push('- Ismert szédüléses kórkép: ' + state['pmh.vertigo']);
    var drugs = C.DRUGS.filter(function (d, i) { return state['drug.' + i]; });
    if (drugs.length) lines.push('- Szóba jövő gyógyszerek: ' + drugs.join(', '));
    lines.push('');

    var prim = [['prim.vitals', 'paraméterek'], ['prim.physical', 'fizikális+neurológiai vizsgálat'], ['prim.vbg', 'vénás vérgáz'], ['prim.ekg', 'EKG'],
      ['lab.glucose', 'vércukor'], ['lab.renal', 'vesefunkció'], ['lab.nak', 'Na/K'], ['lab.crp', 'CRP'], ['lab.cbc', 'vérkép']].filter(function (x) { return state[x[0]]; }).map(function (x) { return x[1]; });
    lines.push('ELVÉGZETT VIZSGÁLATOK: ' + (prim.length ? prim.join(', ') : 'nem jelölt'));
    var o = r.orthostasis;
    if (o.done) lines.push('- Orthostasis teszt: ' + (o.manual ? (o.positive ? 'pozitív' : 'negatív') :
      'szisztolés esés ' + o.dSys + ', diasztolés esés ' + o.dDia + ' Hgmm' + (o.dHr !== null ? ', pulzus +' + o.dHr + '/perc' : '') + ' → ' + (o.positive ? 'orthostaticus hypotonia' : o.pots ? 'POTS-ra utaló' : 'negatív')));
    if (r.hints && r.hints.result) {
      lines.push('- HINTS+: ' + { central: 'CENTRÁLIS mintázat', peripheral: 'perifériás mintázat', indeterminate: 'nem egyértelmű' }[r.hints.result]);
      r.hints.central.concat(r.hints.peripheral).forEach(function (x) { lines.push('    • ' + x); });
      if (state['hints.hit'] === 'saccade' && state['hints.hitSide']) lines.push('    • Korrekciós szakkád ' + (state['hints.hitSide'] === 'left' ? 'balra' : 'jobbra') + ' fordításkor');
      if (state['hints.nystDir']) lines.push('    • Nystagmus gyors komponense: ' + (state['hints.nystDir'] === 'left' ? 'balra' : 'jobbra'));
      if (state['hints.nystGrade']) lines.push('    • Nystagmus intenzitás: ' + state['hints.nystGrade'] + '. fok');
      var hm = r.hints.harmony.result;
      if (hm) lines.push('    • Spontán vestibularis tünetcsoport: ' + (hm === 'harmonic' ? 'harmonikus' : 'diszharmonikus'));
    }
    if (r.positional.done) {
      var dhTxt = { neg: 'negatív', typical: 'tipikus pozitív', atypical: 'atípusos', nd: 'nem végezhető' };
      var rollTxt = { neg: 'negatív', geo_right: 'geotrop, jobbra erősebb', geo_left: 'geotrop, balra erősebb', atypical: 'atípusos', nd: 'nem végezhető' };
      if (state['dh.right']) lines.push('- Dix-Hallpike jobb: ' + dhTxt[state['dh.right']]);
      if (state['dh.left']) lines.push('- Dix-Hallpike bal: ' + dhTxt[state['dh.left']]);
      if (state['roll']) lines.push('- Supine roll: ' + rollTxt[state['roll']]);
    }
    if (r.abcd2.complete) lines.push('- ABCD2: ' + r.abcd2.score + ' (' + r.abcd2.band + ' kockázat)');
    lines.push('');
    lines.push('DÖNTÉSI ÚT:');
    r.path.forEach(function (p) { lines.push('- ' + p); });
    lines.push('');
    lines.push('CSOPORTDIAGNÓZIS: ' + (r.category ? CAT[r.category] : 'még nem meghatározott'));
    if (r.workingDx.length) {
      lines.push('MUNKADIAGNÓZIS:');
      r.workingDx.forEach(function (d) { lines.push('- ' + d.text); });
    }
    if (r.actions.length) {
      lines.push('TEENDŐK:');
      r.actions.forEach(function (a) { lines.push('- ' + a.text + ' [' + a.ref + ']'); });
    }
    if (r.disposition.length) {
      lines.push('DISZPOZÍCIÓ:');
      r.disposition.forEach(function (a) { lines.push('- ' + a.text + ' [' + a.ref + ']'); });
    }
    if (state['note']) { lines.push(''); lines.push('MEGJEGYZÉS: ' + state['note']); }
    return lines.join('\n');
  }

  function renderSummary(r) {
    return '<label class="field"><span>Saját megjegyzés (bekerül a szövegbe)</span><textarea data-key="note" rows="3">' + esc(state.note) + '</textarea></label>' +
      '<div class="row gap"><button type="button" class="btn primary" id="copyReport">Szöveg másolása</button>' +
      '<button type="button" class="btn" onclick="window.print()">Nyomtatás</button></div>' +
      '<pre id="report" class="report">' + esc(reportText(r)) + '</pre>';
  }

  /* ---------------------------------------------------------------- */
  /* Döntéstámogató panel                                              */
  /* ---------------------------------------------------------------- */
  function renderPanel(r) {
    var html = '<div class="cat ' + (r.category || 'none') + '">' + (r.category ? esc(CAT[r.category]) : 'Besorolás folyamatban…') + '</div>';
    if (r.path.length) html += '<h4>Döntési út</h4><ol class="path">' + r.path.map(function (p) { return '<li>' + esc(p) + '</li>'; }).join('') + '</ol>';
    if (r.alerts.length) html += r.alerts.map(function (a) { return '<div class="note ' + a.level + '">' + esc(a.text) + ' <span class="ref">' + esc(a.ref) + '</span></div>'; }).join('');
    var list = function (title, arr) {
      return arr.length ? '<h4>' + title + '</h4><ul>' + arr.map(function (a) { return '<li>' + esc(a.text) + ' <span class="ref">' + esc(a.ref) + '</span></li>'; }).join('') + '</ul>' : '';
    };
    html += list('Munkadiagnózis', r.workingDx);
    html += list('Teendők', r.actions);
    html += list('Diszpozíció', r.disposition);
    if (r.differentials.length) {
      html += '<details><summary>Differenciáldiagnózis (SOP 5.2 táblázat)</summary>' + r.differentials.map(function (d) {
        return '<div><b>' + esc(d.group) + ':</b> ' + d.items.map(esc).join(', ') + '</div>';
      }).join('') + '</details>';
    }
    var next = STAGE_TO_STEP[r.stage];
    if (next && next !== current) {
      var st = STEPS.filter(function (x) { return x.id === next; })[0];
      html += '<button type="button" class="btn primary block" data-goto="' + next + '">Következő teendő: ' + esc(st.title) + ' →</button>';
    }
    return html;
  }

  /* ---------------------------------------------------------------- */
  /* Fő renderelés                                                     */
  /* ---------------------------------------------------------------- */
  function render() {
    var r = L.evaluate(state);
    var steps = visibleSteps(r);
    if (!steps.some(function (s) { return s.id === current; })) current = steps[0].id;

    document.getElementById('viewExam').classList.toggle('active', view === 'exam');
    document.getElementById('viewRef').classList.toggle('active', view === 'reference');
    document.getElementById('exam').hidden = view !== 'exam';
    document.getElementById('reference').hidden = view !== 'reference';

    if (view === 'reference') { renderReference(); return; }

    var nextStage = STAGE_TO_STEP[r.stage];
    document.getElementById('steps').innerHTML = steps.map(function (st, i) {
      var cls = st.id === current ? 'current' : '';
      if (st.id === nextStage && st.id !== current) cls += ' todo';
      return '<li><button type="button" class="' + cls + '" data-goto="' + st.id + '"><span class="n">' + (i + 1) + '</span>' + esc(st.title) + '</button></li>';
    }).join('');

    var step = STEPS.filter(function (s) { return s.id === current; })[0];
    var idx = steps.indexOf(step);
    var html = '<h2>' + esc(step.title) + (step.ref ? ' <span class="ref">' + esc(step.ref) + '</span>' : '') + '</h2>';
    html += step.fields.map(function (f) { return renderField(f, r); }).join('');
    html += '<div class="nav">' +
      (idx > 0 ? '<button type="button" class="btn" data-goto="' + steps[idx - 1].id + '">← Vissza</button>' : '<span></span>') +
      (idx < steps.length - 1 ? '<button type="button" class="btn primary" data-goto="' + steps[idx + 1].id + '">Tovább →</button>' : '') +
      '</div>';
    document.getElementById('form').innerHTML = html;
    document.getElementById('panel').innerHTML = renderPanel(r);
    var cur = document.querySelector('#steps .current');
    if (cur && cur.scrollIntoView && window.innerWidth <= 1100) cur.scrollIntoView({ block: 'nearest', inline: 'center' });
  }

  function renderReference() {
    var therapyHtml = C.THERAPY.map(function (g) {
      return '<h4>' + esc(g.group) + '</h4><ul>' + g.items.map(function (i) { return '<li>' + esc(i) + '</li>'; }).join('') + '</ul>';
    }).join('') + '<h4>Oktatóvideók</h4><ul>' + C.VIDEOS.map(function (v) {
      return '<li><a href="' + v.url + '" target="_blank" rel="noopener">' + esc(v.label) + '</a></li>';
    }).join('') + '</ul>';
    var drugs = '<h4>Szédülést okozó gyógyszerek (1. melléklet)</h4><ul class="cols">' + C.DRUGS.map(function (d) { return '<li>' + esc(d) + '</li>'; }).join('') + '</ul>';
    document.getElementById('reference').innerHTML = C.REFERENCE.map(function (sec) {
      var body = sec.id === 'therapy' ? therapyHtml + drugs : sec.html;
      var I = window.VertigoIllustrations;
      var ill = { hints: ['hit', 'nystagmus', 'skew', 'hearing'], statokinetic: ['romberg', 'barany', 'gait'] }[sec.id];
      if (I && ill) body += ill.map(function (n) { return '<div class="ill-ref">' + I.get(n) + '</div>'; }).join('');
      return '<details class="refsec" id="ref-' + sec.id + '"' + (refOpen === sec.id ? ' open' : '') + '><summary>' + esc(sec.title) + '</summary><div>' + body + '</div></details>';
    }).join('');
    if (refOpen) {
      var el = document.getElementById('ref-' + refOpen);
      if (el) el.scrollIntoView();
      refOpen = null;
    }
  }
  var refOpen = null;

  /* ---------------------------------------------------------------- */
  /* Események                                                         */
  /* ---------------------------------------------------------------- */
  function updatePanelOnly() {
    var r = L.evaluate(state);
    document.getElementById('panel').innerHTML = renderPanel(r);
    var rep = document.getElementById('report');
    if (rep) rep.textContent = reportText(r);
    var lo = document.querySelector('[data-live="orth"]');
    if (lo) lo.innerHTML = orthResult(r);
    var la = document.querySelector('[data-live="abcd2"]');
    if (la) la.innerHTML = renderAbcd2Box(r);
  }

  // Az ábrák csak lenyitva renderelődnek; a nyitott állapot megmarad az újrarajzolások között.
  document.addEventListener('toggle', function (e) {
    var d = e.target;
    if (!d.getAttribute || !d.getAttribute('data-illus')) return;
    var name = d.getAttribute('data-illus');
    openIllus[name] = d.open;
    if (d.open && !d.querySelector('svg')) d.insertAdjacentHTML('beforeend', window.VertigoIllustrations.get(name));
  }, true);

  document.addEventListener('change', function (e) {
    var t = e.target, key = t.getAttribute && t.getAttribute('data-key');
    if (!key) return;
    if (t.type === 'checkbox') state[key] = t.checked;
    else if (t.type === 'radio') state[key] = t.value;
    else state[key] = t.value;
    if (t.type === 'radio' || t.type === 'checkbox') render();
    else updatePanelOnly();
  });

  document.addEventListener('input', function (e) {
    var t = e.target, key = t.getAttribute && t.getAttribute('data-key');
    if (!key || (t.type !== 'text' && t.tagName !== 'TEXTAREA' && t.type !== 'number')) return;
    state[key] = t.value;
    updatePanelOnly();
  });

  document.addEventListener('click', function (e) {
    var t = e.target.closest ? e.target.closest('[data-goto],[data-clear],[data-goto-ref],#copyReport,#viewExam,#viewRef,#reset') : null;
    if (!t) return;
    if (t.hasAttribute('data-goto')) { current = t.getAttribute('data-goto'); view = 'exam'; render(); window.scrollTo(0, 0); return; }
    if (t.hasAttribute('data-clear')) { delete state[t.getAttribute('data-clear')]; render(); return; }
    if (t.hasAttribute('data-goto-ref')) { refOpen = t.getAttribute('data-goto-ref'); view = 'reference'; render(); return; }
    if (t.id === 'viewExam') { view = 'exam'; render(); return; }
    if (t.id === 'viewRef') { view = 'reference'; render(); return; }
    if (t.id === 'reset') {
      if (confirm('Új beteg: minden megadott adat törlődik. Folytatja?')) { state = {}; current = 'stability'; view = 'exam'; render(); }
      return;
    }
    if (t.id === 'copyReport') {
      var txt = document.getElementById('report').textContent;
      var done = function () { t.textContent = 'Másolva ✓'; setTimeout(function () { t.textContent = 'Szöveg másolása'; }, 1500); };
      if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(txt).then(done);
      else {
        var ta = document.createElement('textarea'); ta.value = txt; document.body.appendChild(ta); ta.select();
        try { document.execCommand('copy'); done(); } catch (err) { /* nincs vágólap-hozzáférés */ }
        document.body.removeChild(ta);
      }
    }
  });

  // SOP érvényességi figyelmeztetés
  var valid = new Date(C.SOP.validUntil + 'T23:59:59');
  if (new Date() > valid) {
    var b = document.getElementById('validity');
    b.hidden = false;
    b.textContent = 'Figyelem: a forrás SOP (' + C.SOP.version + ') érvényessége ' + C.SOP.validUntil.replace(/-/g, '.') + '. lejárt – ellenőrizze, van-e frissebb változat.';
  }

  render();
})();
