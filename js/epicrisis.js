/*
 * SBO ambuláns lapba illeszthető szövegrészek (Jelen panasz, Status, Neurológiai status, Epikrízis,
 * Diagnózis, Javaslat) a kitöltött adatokból, az osztályon használt dokumentációs fordulatokkal.
 * Elv: csak azt állítja, ami a megadott adatokból következik. Tagadás („negál”) csak kifejezett
 * „nem” válasz, ill. a „nem jelölt tüneteket negálja” jelölés esetén. Hiányzó adat helyén „___”.
 * Tiszta függvények: sections(state, evaluation, content) → [{id, title, text}], epicrisis(...) → teljes szöveg.
 */
(function (root) {
  'use strict';

  var B = '___';
  var SIDE = { left: 'bal', right: 'jobb' };
  var DIR = { left: 'balra', right: 'jobbra' };

  var NY = { vertical: 'Spontán vertikális nystagmus.', torsional: 'Spontán, tisztán rotatoros nystagmus.', gaze_evoked: 'Tekintésirányú (irányváltó) nystagmus.', none: 'Nystagmus nincs.', nd: 'Nystagmus nem vizsgálható.' };
  var SKEW = { neg: 'Skew deviation (szemtakarásos teszt) negatív.', pos: 'Skew deviation pozitív (vertikális beálló mozgás).', nd: 'Skew deviation nem vizsgálható.' };
  var HEAR = { none: 'Hypacusis nincs.', acute_unilateral: 'Akut féloldali hypacusis.', nd: 'Hallás nem vizsgálható.' };
  var ROMB = { neg: 'Romberg negatív.', sway: 'Rombergben ingadozik.', fall_left: 'Rombergben balra dől.', fall_right: 'Rombergben jobbra dől.', fall_back: 'Rombergben hátradől.', unable: 'Romberg nem végezhető.' };
  var BAR = { none: 'Bárány-féle mutatópróbában félremutatás nincs.', left: 'Bárány-féle mutatópróbában balra mutat félre.', right: 'Bárány-féle mutatópróbában jobbra mutat félre.', nd: 'Bárány-féle mutatópróba nem végezhető.' };
  var GAIT = { normal: 'Vakjárás egyenes.', dev_left: 'Vakjárásban balra deviál.', dev_right: 'Vakjárásban jobbra deviál.', ataxia: 'Vakjárásban kifejezett ataxia.', unable: 'Nem járóképes.' };
  var DH = { neg: 'negatív', typical: 'pozitív (rövid latenciát követően kifáradó, horizonto-rotatoros nystagmus és szédülés)', atypical: 'atípusos (latencia nélküli / irányváltó / nem csökkenő nystagmus)', nd: 'nem végezhető' };
  var ROLL = { neg: 'negatív', geo_right: 'mindkét oldalon geotrop nystagmus, jobbra fordításkor intenzívebb', geo_left: 'mindkét oldalon geotrop nystagmus, balra fordításkor intenzívebb', atypical: 'atípusos mintázat', nd: 'nem végezhető' };

  var RF = [['rf.nausea', 'hányinger'], ['rf.vomiting', 'hányás'], ['rf.headache', 'fejfájás'], ['rf.diplopia', 'kettőslátás'],
    ['rf.palpitation', 'palpitáció'], ['rf.chestPain', 'mellkasi fájdalom'], ['rf.dyspnea', 'fulladás'], ['rf.syncope', 'eszméletvesztés']];
  var ACC = { 'hányinger': 'hányingert', 'hányás': 'hányást', 'fejfájás': 'fejfájást', 'kettőslátás': 'kettőslátást', 'palpitáció': 'palpitációt',
    'mellkasi fájdalom': 'mellkasi fájdalmat', 'fulladás': 'fulladást', 'eszméletvesztés': 'eszméletvesztést' };

  var RX = [
    { key: 'rx.arlevert', text: 'Arlevert (40 mg dimenhydrinat + 20 mg cinnarizin) 3×1 tabletta' },
    { key: 'rx.daedalon', text: 'Daedalon (dimenhydrinat) 50 mg 4–6 óránként, szükség esetén' },
    { key: 'rx.xanax', text: 'Xanax / Frontin (alprazolam) 0,5 mg 8 óránként, szükség esetén' },
    { key: 'rx.rivotril', text: 'Rivotril (clonazepam) 0,25–0,5 mg 8–12 óránként, szükség esetén' },
    { key: 'rx.cerucal', text: 'Cerucal (metoclopramid) 10 mg 6 óránként, szükség esetén' },
  ];

  function val(s, k) { return s[k] !== undefined && s[k] !== null && String(s[k]).trim() !== '' ? String(s[k]).trim() : null; }
  function or(v) { return v === null ? B : v; }
  function cap(t) { return t ? t.charAt(0).toUpperCase() + t.slice(1) : t; }
  function joinHu(arr) { return arr.length <= 1 ? arr.join('') : arr.slice(0, -1).join(', ') + ' és ' + arr[arr.length - 1]; }
  // Rövid, mondatba illeszthető ok a hazabocsátó mondathoz (BPPV-nél a lelet fentebb már szerepel)
  function dischargeCause(s, r) {
    if (r.category === 'AVS') return 'vestibularis neuronitis';
    if (r.category === 'SEVS') {
      var c = [];
      if (s['sevs.headache']) c.push('vestibularis migrén');
      if (s['sevs.tinnitus']) c.push('Ménière-betegség');
      if (s['sevs.anxiety']) c.push('szorongás alapú szédülés');
      return c.length ? c.join(' vagy ') : 'perifériás vestibularis eredet';
    }
    return null;
  }

  /* Hazabocsátható-e a beteg az SOP diszpozíciója szerint */
  function isDischarge(s, r) {
    if (r.category === 'AVS') return !!(r.hints && r.hints.result === 'peripheral' && s['avs.severe'] === 'no');
    if (r.category === 'SEVS') return s['sevs.tiaRisk'] === 'low' && s['sevs.course'] === 'mild';
    if (r.category === 'TEVS') return r.positional.result === 'bppv' && s['tevs.severity'] === 'mild';
    return false;
  }

  /* ---------------- Jelen panasz ---------------- */
  function presentComplaint(s) {
    var t = [];
    t.push('Szédülés miatt jelentkezett' + (val(s, 'hx.onset') ? ', panaszai kezdete: ' + val(s, 'hx.onset') + '.' : '.'));
    if (s.continuous === 'yes') t.push('Szédülése folyamatos, jelenleg is fennáll.');
    else if (s.continuous === 'no' && s.triggered === 'yes') t.push('Szédülése rohamokban jelentkezik, fejhelyzet-változás provokálja.');
    else if (s.continuous === 'no' && s.triggered === 'no') t.push('Szédülése spontán, kiváltó tényező nélkül, rohamokban jelentkezik.');
    if (val(s, 'hx.provoke')) t.push('Provokáló / enyhítő tényezők: ' + val(s, 'hx.provoke') + '.');
    var pos = RF.filter(function (x) { return s[x[0]]; }).map(function (x) { return x[1]; });
    if (pos.length) t.push(cap(joinHu(pos)) + ' kíséri.');
    if (s['rf.denyRest']) {
      var neg = RF.filter(function (x) { return !s[x[0]]; }).map(function (x) { return ACC[x[1]]; });
      if (neg.length) t.push(cap(neg.join(', ')) + ' negál.');
    }
    var hear = s['hx.hearing'], tin = s['hx.tinnitus'];
    if (hear === 'yes' && tin === 'yes') t.push('Halláscsökkenést, fülzúgást jelez.');
    else if (hear === 'yes') t.push('Halláscsökkenést jelez' + (tin === 'no' ? ', fülzúgást negál.' : '.'));
    else if (tin === 'yes') t.push('Fülzúgást jelez' + (hear === 'no' ? ', halláscsökkenést negál.' : '.'));
    else if (hear === 'no' && tin === 'no') t.push('Halláscsökkenést, fülzúgást negál.');
    else if (hear === 'no') t.push('Halláscsökkenést negál.');
    if (s['hx.trauma'] === 'yes') t.push('A közelmúltban fejsérülés érte.');
    else if (s['hx.trauma'] === 'no') t.push('Fejsérülés nem érte.');
    if (s['hx.inflammation'] === 'yes') t.push('Gyulladásos betegségre utaló panaszt jelez: ' + B + '.');
    var pmh = [['pmh.stroke', 'stroke'], ['pmh.arrhythmia', 'ritmuszavar'], ['pmh.mi', 'szívinfarktus'], ['pmh.syncope', 'kivizsgálatlan syncope']]
      .filter(function (x) { return s[x[0]]; }).map(function (x) { return x[1]; });
    if (pmh.length) t.push('Anamnézisében ' + joinHu(pmh) + ' szerepel.');
    if (val(s, 'pmh.vertigo')) t.push('Korábban diagnosztizált szédüléses kórkép: ' + val(s, 'pmh.vertigo') + '.');
    if (s['avs.drug'] === 'yes') t.push('Újonnan bevezetett gyógyszere: ' + B + '.');
    return t.join(' ');
  }

  /* ---------------- Status (paraméterek, EKG, vérgáz/labor) ---------------- */
  function status(s, r) {
    var L = [];
    L.push('BP: ' + or(val(s, 'vit.sys')) + '/' + or(val(s, 'vit.dia')) + ' Hgmm, P: ' + or(val(s, 'vit.hr')) + '/min, SpO₂: ' + or(val(s, 'vit.spo2')) + '%, T: ' + or(val(s, 'vit.temp')) + '°C');
    if (s.unstable === 'no') L.push('Cardiorespiratorikusan stabil.');
    else if (s.unstable === 'yes') L.push('Cardiorespiratorikusan instabil – ellátás ABCDE szerint.');
    var o = r.orthostasis;
    if (o && o.done) {
      if (o.manual) L.push('Orthostasis teszt: ' + (o.positive ? 'pozitív.' : 'negatív.'));
      else {
        L.push('Orthostasis teszt: fekve ' + s['orth.supSys'] + '/' + s['orth.supDia'] + ' Hgmm' + (val(s, 'orth.supHr') ? ', P: ' + s['orth.supHr'] + '/min' : '') +
          '; állva ' + s['orth.stSys'] + '/' + s['orth.stDia'] + ' Hgmm' + (val(s, 'orth.stHr') ? ', P: ' + s['orth.stHr'] + '/min' : '') +
          ' – ' + (o.positive ? 'orthostaticus hypotonia.' : o.pots ? 'hypotonia nélküli, ≥30/min pulzusemelkedés.' : 'negatív.'));
      }
    }
    L.push('EKG: ' + or(val(s, 'ekg.text')));
    L.push('Vénás vérgáz / labor: ' + or(val(s, 'lab.text')));
    return L.join('\n');
  }

  /* ---------------- Neurológiai status (vestibularis rész) ---------------- */
  function neuroStatus(s) {
    var t = [];
    if (s.focal === 'no') t.push('Durva neurológiai gócjel nem észlelhető.');
    else if (s.focal === 'yes') t.push('Novum fokális neurológiai tünet: ' + B + '.');
    var ny = s['hints.nyst'];
    if (ny === 'horiz_unidir') {
      t.push('Spontán, iránytartó, horizonto-rotatoros' + (s['hints.nystDir'] ? ', ' + DIR[s['hints.nystDir']] + ' csapó' : '') +
        (s['hints.nystGrade'] ? ', ' + s['hints.nystGrade'] + '. fokú' : '') + ' nystagmus.');
    } else if (ny) t.push(NY[ny]);
    else if (s['cs.nystagmus'] === 'no') t.push('Kóros nystagmus nincs.');
    else if (s['cs.nystagmus'] === 'yes') t.push('Kóros nystagmus: ' + B + '.');
    var hit = s['hints.hit'];
    if (hit === 'saccade') t.push('Halmágyi-manőver' + (s['hints.hitSide'] ? ' ' + SIDE[s['hints.hitSide']] + ' oldalra fordításkor' : '') + ' pozitív (korrekciós szakkád).');
    else if (hit === 'normal') t.push('Halmágyi-manőver mko. negatív (korrekciós szakkád nincs).');
    else if (hit === 'nd') t.push('Halmágyi-manőver nem végezhető.');
    if (s['hints.skew']) t.push(SKEW[s['hints.skew']]);
    if (s['hints.hearing']) t.push(HEAR[s['hints.hearing']]);
    if (s['cs.dysmetria'] === 'no') t.push('Célkísérletek pontosak.');
    else if (s['cs.dysmetria'] === 'yes') t.push('Felső végtagi dysmetria.');
    if (s['cs.truncal'] === 'no') t.push('Ülő helyzetben törzsataxia nincs.');
    else if (s['cs.truncal'] === 'yes') t.push('Ülő helyzetben törzsataxia.');
    if (s['stat.romberg']) t.push(ROMB[s['stat.romberg']]);
    if (s['stat.barany']) t.push(BAR[s['stat.barany']]);
    if (s['stat.gait']) t.push(GAIT[s['stat.gait']]);
    if (s['stat.truncal'] === 'yes') t.push('Törzsataxia.');
    if (s['dh.right'] === 'neg' && s['dh.left'] === 'neg') t.push('Mko. Dix-Hallpike-manőver negatív.');
    else {
      if (s['dh.right']) t.push('Dix-Hallpike-manőver jobb oldalon ' + DH[s['dh.right']] + '.');
      if (s['dh.left']) t.push('Dix-Hallpike-manőver bal oldalon ' + DH[s['dh.left']] + '.');
    }
    if (s.roll) t.push('Supine roll teszt: ' + ROLL[s.roll] + '.');
    return t.length ? t.join(' ') : B;
  }

  /* ---------------- Epikrízis ---------------- */
  function epicrisisText(s, r, C) {
    var t = [];
    t.push('A fentebb részletezett anamnézisű beteget szédülés miatt vizsgáltuk ambulanciánkon.');
    if (s.unstable === 'no') t.push('A beteg vizsgálóba érkezéskor stabil vitális paraméterekkel rendelkezett.');
    if (s.focal === 'no') t.push('Fizikális vizsgálata során durva neurológiai gócjelet nem észleltem.');
    if (val(s, 'ekg.text')) t.push('EKG: ' + val(s, 'ekg.text') + '.');
    if (val(s, 'lab.text')) t.push('Labor: ' + val(s, 'lab.text') + '.');

    var o = r.orthostasis;
    if (r.category === 'STROKE') {
      t.push('Egyértelmű, novum fokális neurológiai tünet miatt neurológus értesítése, stroke protokoll szerinti ellátás indokolt. Neurológiai vélemény: ' + B + '.');
    } else if (r.category === 'SECONDARY') {
      t.push('A vizsgálatok alapján a szédülés hátterében nem neurológiai ok valószínű' + (val(s, 'nonneuro.text') ? ' (' + val(s, 'nonneuro.text') + ')' : '') +
        '; kóros nystagmus, dysmetria, törzsataxia nem volt. További ellátása a megállapított ok szerint: ' + B + '.');
    } else if (r.category === 'AVS') {
      t.push('Folyamatos, a vizsgálat alatt is fennálló szédülése alapján akut vestibularis szindróma (AVS) áll fenn.');
      if (s['avs.trauma'] === 'yes' || s['avs.headache'] === 'yes') {
        t.push((s['avs.trauma'] === 'yes' ? 'Fejsérülés' : 'Erős fejfájás') + ' miatt natív koponya CT vizsgálat ' +
          (s['avs.ct'] === 'neg' ? 'intracranialis vérzést, SAV-ot nem igazolt.' : s['avs.ct'] === 'ich' ? 'intracranialis vérzést / SAV-ot igazolt.' : 'történt: ' + B + '.'));
      }
      if (s['avs.drug'] === 'yes') {
        var drugs = (C && C.DRUGS ? C.DRUGS : []).filter(function (d, i) { return s['drug.' + i]; });
        t.push('Gyógyszerhatás lehetősége felmerült' + (drugs.length ? ' (' + drugs.join(', ') + ')' : '') + '.');
      }
      var h = r.hints;
      if (h && h.result === 'central') {
        t.push('A HINTS+ vizsgálat centrális eredetre utal (' + h.central.join('; ') + '), ezért vertebrobasilaris stroke irányában neurológiai konzílium indokolt, koponya MR (DWI) és MRA javasolt. Neurológiai konzílium véleménye: ' + B + '.');
      } else if (h && h.result === 'peripheral') {
        t.push('A HINTS+ vizsgálat perifériás mintázatot mutatott' + (h.harmony && h.harmony.result === 'harmonic' ? ', a spontán vestibularis tünetcsoport harmonikus' : '') +
          ', centrális eredetre utaló eltérést nem észleltem.');
      } else if (h && h.result === 'indeterminate') {
        t.push('A HINTS+ vizsgálat nem adott egyértelmű perifériás mintázatot, ezért neurológiai konzílium indokolt. Neurológiai konzílium véleménye: ' + B + '.');
      }
    } else if (r.category === 'SEVS') {
      t.push('Spontán, kiváltó tényező nélkül jelentkező, epizodikus szédülése alapján spontán epizodikus vestibularis szindróma (s-EVS) áll fenn.');
      if (r.abcd2 && r.abcd2.complete) t.push('ABCD2 score: ' + r.abcd2.score + '.');
      if (s['sevs.tiaRisk'] === 'high') t.push('Az anamnézis alapján a vertebrobasilaris TIA kockázata magas, ezért neurológiai konzílium indokolt, MRA javasolt. Neurológiai konzílium véleménye: ' + B + '.');
      else if (s['sevs.tiaRisk'] === 'low') t.push('Az anamnézis alapján a TIA kockázata alacsony.');
    } else if (r.category === 'TEVS') {
      t.push('Fejhelyzet-változással provokálható, epizodikus szédülése alapján triggerelt epizodikus vestibularis szindróma (t-EVS) áll fenn.');
      var pos = r.positional;
      if (s['tevs.state'] === 'severe') t.push('Folyamatos, erős szédülése miatt pozícionális teszt nem volt értékelhető.');
      if (pos.result === 'bppv') {
        var side = pos.side === 'both' ? 'kétoldali' : SIDE[pos.side] + ' oldali';
        t.push('A pozícionális tesztek alapján ' + side + ', ' + (pos.canal === 'posterior' ? 'posterior' : 'horizontális') + ' ívjárati BPPV igazolódott.');
        var man = pos.canal === 'posterior' ? 'Epley' : 'Barbecue';
        if (s['tevs.maneuver'] === 'yes') t.push(man + '-manővert végeztem' + (s['tevs.maneuverEffect'] === 'better' ? ', ezt követően panaszai mérséklődtek.' : s['tevs.maneuverEffect'] === 'same' ? ', panaszai érdemben nem változtak.' : '.'));
      } else if (pos.result === 'central_suspect') {
        t.push('Az atípusos pozícionális nystagmus centrális laesióra utalhat, ezért neurológiai konzílium indokolt. Neurológiai konzílium véleménye: ' + B + '.');
      } else if (pos.result === 'negative') {
        t.push('Pozícionális tesztekkel szédülése nem volt provokálható.');
        if (o && o.done && o.positive) t.push('Orthostasis teszt alapján orthostaticus hypotonia áll fenn, ennek hátterének tisztázása szükséges.');
      }
    }
    if (val(s, 'sbo.therapy')) {
      t.push('Osztályunkon ' + val(s, 'sbo.therapy') + ' adására ' +
        (s['dc.state'] === 'free' ? 'panaszmentessé vált.' : s['dc.state'] === 'better' ? 'panaszai mérséklődtek.' : s['dc.state'] === 'same' ? 'panaszai érdemben nem változtak.' : 'panaszai: ' + B + '.'));
    } else if (s['dc.state'] === 'free') t.push('Távozáskor panaszmentes.');
    else if (s['dc.state'] === 'better') t.push('Távozáskor panaszai mérséklődtek.');

    if (isDischarge(s, r)) {
      var cause = dischargeCause(s, r);
      t.push('Kivizsgálásunk eredményeként sürgősségi teendőt igénylő elváltozást nem észleltünk' +
        (cause ? ', panaszai hátterében ' + cause + ' feltételezhető.' : '.'));
      t.push('Sürgősségi teendő hiányában, jó általános állapotban, javaslatokkal ellátva otthonába emittáljuk.');
    } else if (r.disposition.length) {
      t.push('További ellátása: ' + r.disposition.map(function (d) { return d.text; }).join(' ') + ' Elhelyezés: ' + B + '.');
    } else if (r.category && r.category !== 'STROKE' && r.category !== 'SECONDARY') {
      t.push('Diszpozíció: ' + B + '.');
    }
    return t.join(' ');
  }

  /* ---------------- Javaslat ---------------- */
  function advice(s, r) {
    var J = [];
    if (isDischarge(s, r)) {
      var rx = RX.filter(function (x) { return s[x.key]; }).map(function (x) { return x.text; });
      if (rx.length) J.push('Panaszai enyhítésére: ' + rx.join('; ') + '.');
      if (r.category === 'TEVS') {
        if (r.positional.canal === 'posterior') J.push('Epley-torna otthoni végzése naponta 3–4 alkalommal, a panaszok megszűnéséig (oktatóvideó: https://youtu.be/GIyc2PPahvA).');
        else J.push('Barbecue-manőver otthoni végzése az érintett oldal felé kezdve, naponta 3–4 alkalommal (oktatóvideó: https://youtu.be/XZg7dko-MqM).');
        J.push('Kerülje a szédülést provokáló fejhelyzeteket és az érintett oldalon alvást; ébredés után lassan üljön fel, felállás előtt egy percig üljön az ágy szélén.');
        J.push('Gépjárművet ne vezessen, amíg panaszai teljesen meg nem szűnnek.');
        J.push('BPPV betegtájékoztató átadása.');
        J.push('További kivizsgálás és ellátás céljából javasolt háziorvos érintésével a területileg illetékes fül-orr-gégészeti szakrendelés felkeresése.');
      } else if (r.category === 'AVS') {
        J.push('Az akut tünetek lezajlását követően vestibularis rehabilitációs gyakorlatok végzése.');
        J.push('További kivizsgálás és specifikus terápia mérlegelése céljából javasolt háziorvos érintésével a területileg illetékes fül-orr-gégészeti szakrendelés felkeresése.');
      } else if (r.category === 'SEVS') {
        var amb = [];
        if (s['sevs.headache']) amb.push('neurológiai (vestibularis migrén irányában)');
        if (s['sevs.tinnitus'] || (!s['sevs.headache'] && !s['sevs.anxiety'])) amb.push('fül-orr-gégészeti');
        if (amb.length) J.push('További kivizsgálás céljából javasolt háziorvos érintésével a területileg illetékes ' + amb.join(' és ') + ' szakrendelés felkeresése.');
      }
      J.push('Háziorvosánál kontroll céljából jelentkezzen.');
    } else if (r.category === 'SECONDARY') {
      J.push('A megállapított ok szerinti további ellátás: ' + B + '.');
    } else if (r.category) {
      J.push('A konzílium / fogadó osztály javaslata szerint: ' + B + '.');
    }
    J.push('Panaszai fokozódása, új neurológiai tünet (kettőslátás, beszédzavar, végtaggyengeség, járászavar), erős fejfájás, eszméletvesztés vagy súlyos állapotrosszabbodás esetén a legközelebbi sürgősségi osztályon jelentkezzen.');
    return J.map(function (j) { return '- ' + j; }).join('\n');
  }

  // BNO-10 kódjavaslatok csak az egyértelmű kategóriákhoz (WHO ICD-10 szerint)
  function bnoSuggest(s, r) {
    var out = [];
    if (r.category === 'TEVS' && r.positional.result === 'bppv') out.push('H81.1 Benignus paroxysmalis vertigo');
    else if (r.category === 'TEVS' && r.positional.result === 'negative' && r.orthostasis.done && r.orthostasis.positive) out.push('I95.1 Orthostaticus hypotonia');
    else if (r.category === 'AVS' && r.hints && r.hints.result === 'peripheral') out.push('H81.2 Neuronitis vestibularis');
    else if (r.category === 'SEVS' && s['sevs.tiaRisk'] === 'high') out.push('G45.0 Vertebrobasilaris TIA (gyanú)');
    else if (r.category === 'SEVS' && s['sevs.tiaRisk'] === 'low' && s['sevs.tinnitus'] && !s['sevs.headache'] && !s['sevs.anxiety']) out.push('H81.0 Ménière-betegség');
    if (!out.length && r.category && r.category !== 'UNSTABLE') out.push('R42 Szédülés');
    return out;
  }

  function diagnosis(s, r) {
    var dx = r.workingDx.map(function (d) { return d.text; });
    var bno = bnoSuggest(s, r);
    return (dx.length ? dx.join('; ') : B) + (bno.length ? '\nBNO-javaslat (ellenőrizendő): ' + bno.join(', ') : '');
  }

  function sections(s, r, C) {
    s = s || {};
    return [
      { id: 'complaint', title: 'Jelen panasz', text: presentComplaint(s) },
      { id: 'status', title: 'Status (paraméterek, EKG, labor)', text: status(s, r) },
      { id: 'neuro', title: 'Neurológiai status (vestibularis vizsgálat)', text: neuroStatus(s) },
      { id: 'epicrisis', title: 'Epikrízis', text: epicrisisText(s, r, C) },
      { id: 'dx', title: 'Diagnózis', text: diagnosis(s, r) },
      { id: 'advice', title: 'Javaslat', text: advice(s, r) },
    ];
  }

  function epicrisis(s, r, C) {
    s = s || {};
    var out = sections(s, r, C).map(function (x) { return x.title.toUpperCase() + ':\n' + x.text; }).join('\n\n');
    if (val(s, 'note')) out += '\n\nMegjegyzés: ' + val(s, 'note');
    return out;
  }

  var api = { sections: sections, epicrisis: epicrisis, isDischarge: isDischarge, bnoSuggest: bnoSuggest };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.VertigoEpicrisis = api;
})(typeof window !== 'undefined' ? window : this);
