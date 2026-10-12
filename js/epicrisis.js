/*
 * SBO ambuláns lapba illeszthető epikrízis-minta a kitöltött adatokból.
 * Elv: csak azt állítja, ami a megadott adatokból következik; ami hiányzik, ott „___” kitöltendő hely marad.
 * Tiszta függvény: epicrisis(state, evaluation, content) → szöveg.
 */
(function (root) {
  'use strict';

  var B = '___';
  var SIDE = { left: 'bal', right: 'jobb' };
  var DIR = { left: 'balra', right: 'jobbra' };

  var HIT = { saccade: 'korrekciós szakkád észlelhető', normal: 'korrekciós szakkád nem észlelhető (negatív)', nd: 'nem volt elvégezhető' };
  var NY = {
    vertical: 'vertikális nystagmus', torsional: 'tisztán rotatoros nystagmus', gaze_evoked: 'tekintésirányú (irányváltó) nystagmus',
    none: 'spontán nystagmus nem észlelhető', nd: 'nystagmus nem volt vizsgálható',
  };
  var SKEW = { neg: 'negatív', pos: 'pozitív (vertikális beálló mozgás)', nd: 'nem volt elvégezhető' };
  var HEAR = { none: 'új halláscsökkenés nem észlelhető', acute_unilateral: 'akut féloldali halláscsökkenés', nd: 'nem volt vizsgálható' };
  var ROMB = { neg: 'negatív', sway: 'ingadozik', fall_left: 'balra dől', fall_right: 'jobbra dől', fall_back: 'hátradől', unable: 'nem volt elvégezhető' };
  var BAR = { none: 'félremutatás nincs', left: 'balra mutat félre', right: 'jobbra mutat félre', nd: 'nem volt elvégezhető' };
  var GAIT = { normal: 'egyenes', dev_left: 'balra deviál', dev_right: 'jobbra deviál', ataxia: 'kifejezett ataxia', unable: 'nem járóképes' };
  var DH = { neg: 'negatív', typical: 'tipikus, latenciával jelentkező, kifáradó horizonto-rotatoros nystagmus és szédülés', atypical: 'atípusos (latencia nélküli / irányváltó / nem csökkenő) nystagmus', nd: 'nem volt elvégezhető' };
  var ROLL = { neg: 'negatív', geo_right: 'mindkét oldalon geotrop nystagmus, jobbra fordításkor intenzívebb', geo_left: 'mindkét oldalon geotrop nystagmus, balra fordításkor intenzívebb', atypical: 'atípusos mintázat', nd: 'nem volt elvégezhető' };

  var RX = [
    { key: 'rx.arlevert', text: 'Arlevert (40 mg dimenhydrinat + 20 mg cinnarizin) 3×1 tabletta p.o.' },
    { key: 'rx.daedalon', text: 'Daedalon (dimenhydrinat) 50 mg p.o. 4–6 óránként, szükség szerint' },
    { key: 'rx.xanax', text: 'Xanax / Frontin (alprazolam) 0,5 mg p.o. 8 óránként, szükség szerint' },
    { key: 'rx.rivotril', text: 'Rivotril (clonazepam) 0,25–0,5 mg p.o. 8–12 óránként, szükség szerint' },
    { key: 'rx.cerucal', text: 'Cerucal (metoclopramid) 10 mg p.o. 6 óránként, szükség szerint' },
  ];

  function val(s, k) { return s[k] !== undefined && s[k] !== null && String(s[k]).trim() !== '' ? String(s[k]).trim() : null; }
  function or(v) { return v === null ? B : v; }
  function sentence(t) { t = t.trim(); return t ? t.charAt(0).toUpperCase() + t.slice(1) + (/[.!?]$/.test(t) ? '' : '.') : ''; }
  function joinHu(arr) { return arr.length <= 1 ? arr.join('') : arr.slice(0, -1).join(', ') + ' és ' + arr[arr.length - 1]; }

  /* Hazabocsátható-e a beteg az SOP diszpozíciója szerint */
  function isDischarge(s, r) {
    if (r.category === 'AVS') return r.hints && r.hints.result === 'peripheral' && s['avs.severe'] === 'no';
    if (r.category === 'SEVS') return s['sevs.tiaRisk'] === 'low' && s['sevs.course'] === 'mild';
    if (r.category === 'TEVS') return r.positional.result === 'bppv' && s['tevs.severity'] === 'mild';
    return false;
  }

  function hintsSentence(s, r) {
    var parts = [];
    var hit = s['hints.hit'];
    if (hit) parts.push('Head Impulse Test: ' + HIT[hit] + (hit === 'saccade' && s['hints.hitSide'] ? ' a fej ' + SIDE[s['hints.hitSide']] + ' oldalra fordításakor' : ''));
    var ny = s['hints.nyst'];
    if (ny === 'horiz_unidir') {
      parts.push('spontán nystagmus: iránytartó, horizontális / horizonto-rotatoros' +
        (s['hints.nystDir'] ? ', ' + DIR[s['hints.nystDir']] + ' csapó' : '') +
        (s['hints.nystGrade'] ? ', ' + s['hints.nystGrade'] + '. fokú' : ''));
    } else if (ny) parts.push(NY[ny]);
    if (s['hints.skew']) parts.push('skew deviation: ' + SKEW[s['hints.skew']]);
    if (s['hints.hearing']) parts.push('tájékozódó hallásvizsgálat: ' + HEAR[s['hints.hearing']]);
    var stat = [];
    if (s['stat.romberg']) stat.push('Romberg: ' + ROMB[s['stat.romberg']]);
    if (s['stat.barany']) stat.push('Bárány-féle mutatópróba: ' + BAR[s['stat.barany']]);
    if (s['stat.gait']) stat.push('vakjárás: ' + GAIT[s['stat.gait']]);
    if (s['stat.truncal'] === 'yes') stat.push('törzsataxia észlelhető');
    var out = parts.length ? 'HINTS+ vizsgálat – ' + parts.join('; ') + '.' : 'HINTS+ vizsgálat: ' + B + '.';
    if (stat.length) out += ' Statokinetikus próbák: ' + stat.join('; ') + '.';
    var hm = r.hints && r.hints.harmony && r.hints.harmony.result;
    if (hm) out += ' A spontán vestibularis tünetcsoport ' + (hm === 'harmonic' ? 'harmonikus' : 'diszharmonikus') + '.';
    return out;
  }

  function epicrisis(s, r, C) {
    s = s || {};
    var L = [];
    var age = val(s, 'pt.age') || val(s, 'abcd2.age');

    /* ---------------- EPIKRÍZIS ---------------- */
    L.push('EPIKRÍZIS');
    var intro = (age ? 'A ' + age + ' éves beteg' : 'A beteg') + ' szédülés miatt jelentkezett sürgősségi osztályunkon.';
    if (val(s, 'hx.onset')) intro += ' Panaszai kezdete: ' + val(s, 'hx.onset') + '.';
    if (s.continuous === 'yes') intro += ' Szédülése folyamatos, a vizsgálat alatt is fennáll.';
    else if (s.continuous === 'no' && s.triggered === 'yes') intro += ' Szédülése epizodikus, fejhelyzet-változással provokálható.';
    else if (s.continuous === 'no' && s.triggered === 'no') intro += ' Szédülése spontán, rohamokban jelentkezik, kiváltó tényező nélkül.';
    if (val(s, 'hx.provoke')) intro += ' Provokáló / enyhítő tényezők: ' + val(s, 'hx.provoke') + '.';
    var acc = [['rf.nausea', 'hányinger'], ['rf.vomiting', 'hányás'], ['rf.headache', 'fejfájás'], ['rf.diplopia', 'kettőslátás'],
      ['rf.palpitation', 'palpitáció'], ['rf.chestPain', 'mellkasi fájdalom'], ['rf.dyspnea', 'nehézlégzés'], ['rf.syncope', 'eszméletvesztés']]
      .filter(function (x) { return s[x[0]]; }).map(function (x) { return x[1]; });
    if (acc.length) intro += ' Kísérő tünetként ' + joinHu(acc) + ' jelentkezett.';
    if (s['hx.hearing'] === 'yes') intro += ' Halláscsökkenést jelez' + (s['hx.tinnitus'] === 'yes' ? ', fülzúgással.' : '.');
    else if (s['hx.tinnitus'] === 'yes') intro += ' Fülzúgást jelez.';
    if (s['hx.trauma'] === 'yes') intro += ' A közelmúltban fejsérülés érte.';
    var pmh = [['pmh.stroke', 'stroke'], ['pmh.arrhythmia', 'ritmuszavar'], ['pmh.mi', 'szívinfarktus'], ['pmh.syncope', 'kivizsgálatlan syncope']]
      .filter(function (x) { return s[x[0]]; }).map(function (x) { return x[1]; });
    if (pmh.length) intro += ' Előzményében ' + joinHu(pmh) + ' szerepel.';
    if (val(s, 'pmh.vertigo')) intro += ' Ismert szédüléses kórkép: ' + val(s, 'pmh.vertigo') + '.';
    L.push(intro);

    // Primer vizsgálat
    var p = [];
    if (s.unstable === 'no') p.push('Érkezéskor cardiorespiratorikusan stabil.');
    else if (s.unstable === 'yes') p.push('Érkezéskor cardiorespiratorikusan instabil, ellátása ABCDE szerint történt.');
    p.push('RR: ' + or(val(s, 'vit.sys')) + '/' + or(val(s, 'vit.dia')) + ' Hgmm, P: ' + or(val(s, 'vit.hr')) + '/perc, SpO2: ' + or(val(s, 'vit.spo2')) + '%.');
    var o = r.orthostasis;
    if (o && o.done) {
      p.push('Orthostasis teszt: ' + (o.manual ? (o.positive ? 'pozitív' : 'negatív') :
        (o.positive ? 'pozitív (szisztolés esés ' + o.dSys + ' Hgmm, diasztolés esés ' + o.dDia + ' Hgmm)' :
          o.pots ? 'hypotonia nélkül ' + o.dHr + '/perc pulzusemelkedés' : 'negatív')) + '.');
    }
    if (s.focal === 'no') p.push('Fizikális és neurológiai vizsgálat során egyértelmű, novum fokális neurológiai tünet nem észlelhető.');
    else if (s.focal === 'yes') p.push('Neurológiai vizsgálat során novum fokális neurológiai tünet észlelhető: ' + B + '.');
    p.push('EKG: ' + or(val(s, 'ekg.text')) + '.');
    p.push('Vénás vérgáz, laborvizsgálat: ' + or(val(s, 'lab.text')) + '.');
    L.push(p.join(' '));

    // Kategória-specifikus rész
    var c = [];
    var dx = r.workingDx.map(function (d) { return d.text; });
    if (r.category === 'STROKE') {
      c.push('Egyértelmű fokális neurológiai tünet miatt neurológus értesítése és a stroke protokoll szerinti ellátás indokolt.');
      c.push('Neurológiai vélemény: ' + B + '.');
    } else if (r.category === 'SECONDARY') {
      c.push('A vizsgálatok alapján a szédülés hátterében nem neurológiai ok valószínű' +
        (val(s, 'nonneuro.text') ? ' (' + val(s, 'nonneuro.text') + ')' : '') +
        '; kóros nystagmus, felső végtagi dysmetria, ülő helyzetben törzsataxia nem észlelhető. A további ellátás a megállapított ok szerint történik.');
    } else if (r.category === 'AVS') {
      c.push('A folyamatos, a vizsgálat alatt is fennálló szédülés alapján akut vestibularis szindróma (AVS) képe áll fenn.');
      if (s['avs.trauma'] === 'yes' || s['avs.headache'] === 'yes') {
        c.push((s['avs.trauma'] === 'yes' ? 'Fejsérülés' : 'Erős fejfájás') + ' miatt natív koponya CT készült: ' +
          (s['avs.ct'] === 'neg' ? 'intracranialis vérzés / SAV nem igazolódott' : s['avs.ct'] === 'ich' ? 'intracranialis vérzés / SAV igazolódott' : B) + '.');
      }
      if (s['avs.drug'] === 'yes') {
        var drugs = (C && C.DRUGS ? C.DRUGS : []).filter(function (d, i) { return s['drug.' + i]; });
        c.push('Gyógyszerhatás lehetősége felmerült' + (drugs.length ? ' (' + drugs.join(', ') + ')' : '') +
          (s['avs.drugClear'] === 'yes' ? '; a panaszok kezdete egyértelműen összefügg az új gyógyszerrel.' : '.'));
      }
      if (s['avs.ct'] !== 'ich') {
        c.push(hintsSentence(s, r));
        if (r.hints && r.hints.result === 'central') {
          c.push('A lelet centrális eredetre utal (' + r.hints.central.join('; ') + '), ezért neurológiai konzílium indokolt vertebrobasilaris stroke irányában; képalkotásként koponya MR (DWI) és MRA javasolt.');
          c.push('Neurológiai konzílium véleménye: ' + B + '.');
        } else if (r.hints && r.hints.result === 'peripheral') {
          c.push('A HINTS+ vizsgálat perifériás mintázatot mutatott, centrális eredetre utaló jel nem észlelhető; a kép leginkább vestibularis neuronitisnek felel meg.');
        } else if (r.hints && r.hints.result === 'indeterminate') {
          c.push('A HINTS+ vizsgálat nem adott egyértelmű perifériás mintázatot, ezért neurológiai konzílium indokolt.');
          c.push('Neurológiai konzílium véleménye: ' + B + '.');
        }
      }
    } else if (r.category === 'SEVS') {
      c.push('Spontán, kiváltó tényező nélkül jelentkező, epizodikus szédülés alapján spontán epizodikus vestibularis szindróma (s-EVS) képe áll fenn.');
      if (r.abcd2 && r.abcd2.complete) c.push('ABCD2 score: ' + r.abcd2.score + ' (' + r.abcd2.band + ' kockázat).');
      if (s['sevs.tiaRisk'] === 'high') {
        c.push('Az anamnézis alapján a vertebrobasilaris TIA kockázata magas, ezért neurológiai konzílium indokolt, MRA javasolt.');
        c.push('Neurológiai konzílium véleménye: ' + B + '.');
      } else if (s['sevs.tiaRisk'] === 'low') {
        var lead = [];
        if (s['sevs.headache']) lead.push('az epizódokhoz társuló fejfájás vestibularis migrénre');
        if (s['sevs.tinnitus']) lead.push('a fülzúgás, halláscsökkenés Ménière-betegségre');
        if (s['sevs.anxiety']) lead.push('a kifejezett szorongás pszichogén eredetre');
        c.push('Az anamnézis alapján a TIA kockázata alacsony, perifériás ok valószínű' + (lead.length ? '; ' + joinHu(lead) + ' utalhat.' : '.'));
      }
    } else if (r.category === 'TEVS') {
      c.push('Fejhelyzet-változással provokálható, epizodikus szédülés alapján triggerelt epizodikus vestibularis szindróma (t-EVS) képe áll fenn.');
      if (s['tevs.state'] === 'severe') c.push('A beteg folyamatosan, erősen szédült, ezért pozícionális teszt nem volt értékelhető.');
      var pt = [];
      if (s['dh.right']) pt.push('Dix-Hallpike jobb oldalon: ' + DH[s['dh.right']]);
      if (s['dh.left']) pt.push('Dix-Hallpike bal oldalon: ' + DH[s['dh.left']]);
      if (s.roll) pt.push('supine roll teszt: ' + ROLL[s.roll]);
      if (pt.length) c.push(sentence(pt.join('; ')));
      var pos = r.positional;
      if (pos.result === 'bppv') {
        var canal = pos.canal === 'posterior' ? 'posterior' : 'horizontális';
        var side = pos.side === 'both' ? 'kétoldali' : SIDE[pos.side] + ' oldali';
        c.push('A lelet ' + side + ', ' + canal + ' ívjárati BPPV-nek felel meg.');
        var man = pos.canal === 'posterior' ? 'Epley' : 'Barbecue';
        if (s['tevs.maneuver'] === 'yes') {
          c.push(man + '-manővert végeztünk' + (s['tevs.maneuverEffect'] === 'better' ? ', ezt követően panaszai mérséklődtek.' :
            s['tevs.maneuverEffect'] === 'same' ? ', panaszai érdemben nem változtak.' : '.'));
        } else if (s['tevs.maneuver'] === 'no') {
          c.push(man + '-manőver nem történt.');
        }
      } else if (pos.result === 'central_suspect') {
        c.push('Az atípusos pozícionális nystagmus centrális laesióra utalhat, ezért neurológiai konzílium indokolt.');
        c.push('Neurológiai konzílium véleménye: ' + B + '.');
      } else if (pos.result === 'negative') {
        c.push('Pozícionális tesztekkel a szédülés nem volt provokálható.');
        if (o && o.done && o.positive) c.push('Az orthostasis teszt alapján orthostaticus hypotonia áll fenn, ennek hátterének tisztázása szükséges.');
      }
    }
    if (val(s, 'sbo.therapy')) c.push('Osztályunkon ' + val(s, 'sbo.therapy') + ' terápiában részesült.');
    if (s['dc.state'] === 'better') c.push('Távozáskor panaszai mérséklődtek, állapota stabil.');
    else if (s['dc.state'] === 'free') c.push('Távozáskor panaszmentes, állapota stabil.');
    else if (s['dc.state'] === 'same') c.push('Panaszai érdemben nem változtak.');
    if (c.length) L.push(c.join(' '));

    // Diszpozíció
    var dispo = r.disposition.map(function (d) { return d.text; });
    var discharge = isDischarge(s, r);
    if (discharge) L.push('Állapota alapján tanácsokkal, ambuláns kontroll javaslatával otthonába bocsátható.');
    else if (dispo.length) L.push('Diszpozíció: ' + dispo.join(' ') + ' Elhelyezés: ' + B + '.');
    else L.push('Diszpozíció: ' + B + '.');

    /* ---------------- DIAGNÓZIS ---------------- */
    L.push('');
    L.push('DIAGNÓZIS (munkadiagnózis): ' + (dx.length ? dx.join('; ') : B));
    var bno = bnoSuggest(s, r);
    if (bno.length) L.push('BNO-javaslat (ellenőrizendő): ' + bno.join(', '));

    /* ---------------- JAVASLAT ---------------- */
    L.push('');
    L.push('JAVASLAT');
    var J = [];
    if (discharge) {
      var rx = RX.filter(function (x) { return s[x.key]; }).map(function (x) { return x.text; });
      if (rx.length) J.push('Tüneti terápia: ' + rx.join('; ') + '.');
      if (r.category === 'TEVS') {
        if (r.positional.canal === 'posterior') {
          J.push('Az Epley-torna otthoni végzése naponta 3–4 alkalommal, amíg a panaszok megszűnnek (oktatóvideó: https://youtu.be/GIyc2PPahvA).');
        } else {
          J.push('A Barbecue-manőver otthoni végzése az érintett oldal felé kezdve, naponta 3–4 alkalommal (oktatóvideó: https://youtu.be/XZg7dko-MqM).');
        }
        J.push('Kerülje a szédülést provokáló fejhelyzeteket és az érintett oldalon alvást; ébredés után lassan üljön fel, és üljön egy percig az ágy szélén felállás előtt.');
        J.push('Gépjárművet ne vezessen, amíg panaszai teljesen meg nem szűnnek.');
        J.push('BPPV betegtájékoztató átadása (az app Referencia fülén nyomtatható).');
        J.push('Ambuláns fül-orr-gégészeti kontroll.');
      } else if (r.category === 'AVS') {
        J.push('Ambuláns fül-orr-gégészeti kontroll a további kivizsgálás és specifikus terápia mérlegelése céljából.');
        J.push('Az akut tünetek lezajlását követően vestibularis rehabilitációs gyakorlatok végzése javasolt.');
      } else if (r.category === 'SEVS') {
        var amb = [];
        if (s['sevs.headache']) amb.push('neurológiai szakrendelés (vestibularis migrén irányában)');
        if (s['sevs.tinnitus'] || (!s['sevs.headache'] && !s['sevs.anxiety'])) amb.push('fül-orr-gégészeti szakrendelés (perifériás vestibularis eredet irányában)');
        if (amb.length) J.push('Ambuláns kivizsgálás: ' + amb.join(', ') + '.');
      }
      J.push('Háziorvosa felé a lelet bemutatása.');
    } else if (r.category === 'SECONDARY') {
      J.push('A megállapított ok szerinti további ellátás: ' + B + '.');
    } else {
      J.push('A konzílium / fogadó osztály javaslata szerint: ' + B + '.');
    }
    J.push('Állapotromlás, új neurológiai tünet (kettőslátás, beszédzavar, végtaggyengeség, járászavar), erős fejfájás vagy eszméletvesztés esetén haladéktalanul jelentkezzen ismét (mentő: 112).');
    J.forEach(function (j) { L.push('- ' + j); });
    if (val(s, 'note')) { L.push(''); L.push('Megjegyzés: ' + val(s, 'note')); }
    return L.join('\n');
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

  var api = { epicrisis: epicrisis, isDischarge: isDischarge, bnoSuggest: bnoSuggest };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.VertigoEpicrisis = api;
})(typeof window !== 'undefined' ? window : this);
