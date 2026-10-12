/*
 * Döntési logika – "Szédüléssel jelentkező beteg ellátása" SOP (ÉPC-HK SBO, v1.0, 2023.09.01.)
 *
 * Tiszta függvények, DOM nélkül: a böngészőben window.VertigoLogic, Node-ban module.exports.
 * Minden következtetés mellett `ref` jelöli az SOP fejezetét / ábráját, vagy – ha nem az SOP
 * része – a külső forrást.
 */
(function (root) {
  'use strict';

  var yes = function (v) { return v === 'yes' || v === true; };
  var no = function (v) { return v === 'no'; };
  var num = function (v) {
    if (v === null || v === undefined || v === '') return null;
    var n = Number(String(v).replace(',', '.'));
    return isFinite(n) ? n : null;
  };

  /* ------------------------------------------------------------------ */
  /* Orthostasis teszt                                                   */
  /* Kritérium: Freeman R. et al., Clin Auton Res 2011;21:69–72          */
  /* (konszenzus definíció – az SOP nem definiálja a határértékeket)     */
  /* ------------------------------------------------------------------ */
  function orthostasis(s) {
    var supSys = num(s['orth.supSys']), supDia = num(s['orth.supDia']), supHr = num(s['orth.supHr']);
    var stSys = num(s['orth.stSys']), stDia = num(s['orth.stDia']), stHr = num(s['orth.stHr']);
    if (supSys === null || stSys === null || supDia === null || stDia === null) {
      if (s['orth.manual'] === 'pos') return { done: true, positive: true, manual: true };
      if (s['orth.manual'] === 'neg') return { done: true, positive: false, manual: true };
      return { done: false };
    }
    var dSys = supSys - stSys;
    var dDia = supDia - stDia;
    var dHr = (supHr !== null && stHr !== null) ? stHr - supHr : null;
    var oh = dSys >= 20 || dDia >= 10;
    var pots = !oh && dHr !== null && dHr >= 30;
    return { done: true, positive: oh, dSys: dSys, dDia: dDia, dHr: dHr, pots: pots };
  }

  /* ------------------------------------------------------------------ */
  /* ABCD2 score – Johnston SC et al., Lancet 2007;369:283–292           */
  /* (az SOP 5.4 említi a TIA-kockázat becslésére)                       */
  /* ------------------------------------------------------------------ */
  function abcd2(s) {
    var age = num(s['abcd2.age']);
    var sys = num(s['abcd2.sys']);
    var dia = num(s['abcd2.dia']);
    var clin = s['abcd2.clinical'];
    var dur = s['abcd2.dur'];
    var dm = s['abcd2.dm'];
    var complete = age !== null && sys !== null && dia !== null && !!clin && !!dur && !!dm;
    var score = 0;
    var parts = [];
    if (age !== null && age >= 60) { score += 1; parts.push('Életkor ≥60 (+1)'); }
    if ((sys !== null && sys >= 140) || (dia !== null && dia >= 90)) { score += 1; parts.push('RR ≥140/90 (+1)'); }
    if (clin === 'weakness') { score += 2; parts.push('Féloldali gyengeség (+2)'); }
    else if (clin === 'speech') { score += 1; parts.push('Beszédzavar gyengeség nélkül (+1)'); }
    if (dur === '60+') { score += 2; parts.push('Időtartam ≥60 perc (+2)'); }
    else if (dur === '10-59') { score += 1; parts.push('Időtartam 10–59 perc (+1)'); }
    if (yes(dm)) { score += 1; parts.push('Diabetes (+1)'); }
    var band = null, risk2d = null;
    if (complete) {
      if (score <= 3) { band = 'alacsony'; risk2d = '1,0%'; }
      else if (score <= 5) { band = 'közepes'; risk2d = '4,1%'; }
      else { band = 'magas'; risk2d = '8,1%'; }
    }
    return { complete: complete, score: score, parts: parts, band: band, risk2d: risk2d };
  }

  /* ------------------------------------------------------------------ */
  /* Spontán vestibularis tünetcsoport: harmonikus / diszharmonikus      */
  /* SOP 6.1.2: harmonikus = dőlés/félremutatás a nystagmus gyors         */
  /* komponensével ellentétes (perifériás); diszharmonikus = azonos        */
  /* irányú (centrális). Hátradőlés, törzsataxia → centrális.             */
  /* ------------------------------------------------------------------ */
  function harmony(s) {
    var fast = s['hints.nystDir']; // 'left' | 'right'
    var devs = [];
    var central = [];
    var romberg = s['stat.romberg'];
    if (romberg === 'fall_left') devs.push({ test: 'Romberg', dir: 'left' });
    if (romberg === 'fall_right') devs.push({ test: 'Romberg', dir: 'right' });
    if (romberg === 'fall_back') central.push('Romberg: hátradőlés');
    var barany = s['stat.barany'];
    if (barany === 'left' || barany === 'right') devs.push({ test: 'Bárány', dir: barany });
    var gait = s['stat.gait'];
    if (gait === 'dev_left') devs.push({ test: 'Vakjárás', dir: 'left' });
    if (gait === 'dev_right') devs.push({ test: 'Vakjárás', dir: 'right' });
    if (gait === 'ataxia') central.push('Vakjárás: kifejezett ataxia');
    if (s['stat.truncal'] === 'yes') central.push('Törzsataxia');

    var result = null;
    var same = 0, opposite = 0;
    if (fast === 'left' || fast === 'right') {
      devs.forEach(function (d) { if (d.dir === fast) same++; else opposite++; });
      if (same > 0) result = 'dysharmonic';
      else if (opposite > 0) result = 'harmonic';
    }
    return { result: result, deviations: devs, centralSigns: central, same: same, opposite: opposite };
  }

  /* ------------------------------------------------------------------ */
  /* HINTS+ (SOP 5.3, 6.2–6.4, 7. oldali táblázat, 2. ábra)              */
  /* Centrális: HIT negatív (nincs korrekciós szakkád), vertikális /     */
  /* rotatoros / tekintésirányú nystagmus, pozitív skew, akut féloldali  */
  /* halláscsökkenés, diszharmonikus tünetcsoport.                       */
  /* Perifériás: minden elem perifériás mintázatú (ÉS kapcsolat).         */
  /* ------------------------------------------------------------------ */
  function hints(s) {
    var central = [], peripheral = [], missing = [], notes = [];
    var hit = s['hints.hit'];
    if (hit === 'saccade') peripheral.push('Head Impulse Test: korrekciós szakkád');
    else if (hit === 'normal') central.push('Head Impulse Test: negatív (nincs korrekciós szakkád)');
    else missing.push('Head Impulse Test');

    var ny = s['hints.nyst'];
    if (ny === 'horiz_unidir') peripheral.push('Nystagmus: iránytartó, horizontális / horizonto-rotatoros');
    else if (ny === 'vertical') central.push('Nystagmus: vertikális');
    else if (ny === 'torsional') central.push('Nystagmus: tisztán rotatoros');
    else if (ny === 'gaze_evoked') central.push('Nystagmus: tekintésirányú (irányváltó)');
    else if (ny === 'none') {
      missing.push('Nystagmus (nem látható)');
      notes.push('Spontán nystagmus hiányában a HINTS nem értékelhető megbízhatóan; a járás/törzsataxia ' +
        'vizsgálata javasolt, súlyos járásképtelenség centrális okra gyanús (GRACE-3, Edlow et al. 2023).');
    } else missing.push('Nystagmus');

    var skew = s['hints.skew'];
    if (skew === 'neg') peripheral.push('Skew deviation: negatív');
    else if (skew === 'pos') central.push('Skew deviation: pozitív (vertikális beállító szakkád)');
    else missing.push('Skew deviation');

    var hear = s['hints.hearing'];
    if (hear === 'none') peripheral.push('Hallás: nincs új halláscsökkenés');
    else if (hear === 'acute_unilateral') central.push('Akut féloldali halláscsökkenés (AICA-infarktus lehetősége)');
    else missing.push('Tájékozódó hallásvizsgálat');

    var h = harmony(s);
    if (h.result === 'dysharmonic') central.push('Diszharmonikus spontán vestibularis tünetcsoport');
    h.centralSigns.forEach(function (c) { central.push(c); });
    var harmonicOk = h.result === 'harmonic';
    if (h.result === null) missing.push('Harmonikus/diszharmonikus tünetcsoport megítélése (nystagmus iránya + statokinetikus próbák)');

    var result;
    if (central.length > 0) result = 'central';
    else if (hit === 'saccade' && ny === 'horiz_unidir' && skew === 'neg' && hear === 'none' && harmonicOk) result = 'peripheral';
    else if (hit === 'saccade' && ny === 'horiz_unidir' && skew === 'neg' && hear === 'none') {
      result = 'peripheral';
      notes.push('A harmonikus tünetcsoport nem lett dokumentálva – a HINTS+ elemei perifériás mintázatúak.');
    } else result = 'indeterminate';

    var anyDone = !!(hit || ny || skew || hear);
    return { result: anyDone ? result : null, central: central, peripheral: peripheral, missing: missing, notes: notes, harmony: h };
  }

  /* ------------------------------------------------------------------ */
  /* Pozícionális tesztek (SOP 5.5, 6.5, 3. ábra)                        */
  /* ------------------------------------------------------------------ */
  function positional(s) {
    var r = s['dh.right'], l = s['dh.left'], roll = s['roll'];
    var out = { result: null, canal: null, side: null, atypical: false, done: false };
    var dhDone = (r && r !== 'nd') || (l && l !== 'nd');
    var rollDone = roll && roll !== 'nd';
    out.done = !!(dhDone || rollDone);
    if (r === 'atypical' || l === 'atypical' || roll === 'atypical') {
      out.result = 'central_suspect';
      out.atypical = true;
      return out;
    }
    if (r === 'typical' || l === 'typical') {
      out.result = 'bppv';
      out.canal = 'posterior';
      out.side = (r === 'typical' && l === 'typical') ? 'both' : (r === 'typical' ? 'right' : 'left');
      return out;
    }
    if (roll === 'geo_right' || roll === 'geo_left') {
      out.result = 'bppv';
      out.canal = 'horizontal';
      out.side = roll === 'geo_right' ? 'right' : 'left';
      return out;
    }
    if (out.done) out.result = 'negative';
    return out;
  }

  /* ------------------------------------------------------------------ */
  /* Fő folyamat – 1. ábra                                               */
  /* ------------------------------------------------------------------ */
  var SIDE = { left: 'bal', right: 'jobb', both: 'kétoldali' };

  function evaluate(s) {
    s = s || {};
    var r = {
      category: null,        // UNSTABLE | STROKE | SECONDARY | AVS | SEVS | TEVS
      stage: 'stability',    // a következő megválaszolandó lépés azonosítója
      path: [],
      alerts: [],            // {level: danger|warn|info|ok, text, ref}
      workingDx: [],
      actions: [],
      disposition: [],
      differentials: [],
      hints: null,
      abcd2: abcd2(s),
      orthostasis: orthostasis(s),
      positional: positional(s),
    };
    var add = function (list, text, ref) { r[list].push({ text: text, ref: ref }); };
    var alert = function (level, text, ref) { r.alerts.push({ level: level, text: text, ref: ref }); };

    // Red flag figyelmeztetések az anamnézisből (SOP 5.1)
    var rf = ['rf.headache', 'rf.diplopia', 'rf.palpitation', 'rf.chestPain', 'rf.dyspnea', 'rf.syncope'];
    var rfNames = { 'rf.headache': 'fejfájás', 'rf.diplopia': 'kettőslátás', 'rf.palpitation': 'palpitáció',
      'rf.chestPain': 'mellkasi fájdalom', 'rf.dyspnea': 'dyspnoe', 'rf.syncope': 'syncope' };
    var presentRf = rf.filter(function (k) { return s[k]; }).map(function (k) { return rfNames[k]; });
    if (presentRf.length) {
      alert('warn', '„Red flag” tünet(ek) az anamnézisben: ' + presentRf.join(', ') + '. Vegye figyelembe a további lépéseknél.', 'SOP 5.1');
    }
    if (yes(s['hx.trauma'])) {
      alert('warn', 'Közelmúltbeli fejsérülés – folyamatos szédülésnél traumás SAV/ICH kizárása (natív koponya CT) szükséges.', 'SOP 5.3, 2. ábra');
    }

    // 1. lépés – stabilitás
    if (!s['unstable']) { r.stage = 'stability'; return r; }
    if (yes(s['unstable'])) {
      r.category = 'UNSTABLE';
      r.path.push('Cardiorespiratoricusan instabil');
      alert('danger', 'Cardiorespiratoricusan instabil beteg: ellátás ABCDE séma szerint. Az SOP ezt részleteiben nem tárgyalja.', 'SOP 5.1');
      add('actions', 'ABCDE szerinti ellátás, stabilizálás.', 'SOP 5.1');
      r.stage = 'done';
      return r;
    }
    r.path.push('Cardiorespiratoricusan stabil');

    // 2. lépés – egyértelmű fokális neurológiai tünet
    if (!s['focal']) { r.stage = 'focal'; return r; }
    if (yes(s['focal'])) {
      r.category = 'STROKE';
      r.path.push('Egyértelmű, novum fokális neurológiai tünet');
      alert('danger', 'Egyértelmű fokális neurológiai tünet: neurológus értesítése, további ellátás a stroke protokoll szerint.', 'SOP 5.1, 1. ábra (2)');
      add('actions', 'Neurológus azonnali értesítése, stroke protokoll indítása.', '1. ábra (2)');
      add('disposition', 'Stroke protokoll szerinti ellátás.', '1. ábra (2)');
      r.stage = 'done';
      return r;
    }
    r.path.push('Nincs egyértelmű fokális neurológiai tünet');

    // 3. lépés – nem neurológiai ok valószínű?
    if (!s['nonneuro']) { r.stage = 'nonneuro'; return r; }
    if (yes(s['nonneuro'])) {
      var cs = ['cs.nystagmus', 'cs.dysmetria', 'cs.truncal'];
      var unanswered = cs.some(function (k) { return !s[k]; });
      var anyCentral = cs.some(function (k) { return yes(s[k]); });
      if (!anyCentral && unanswered) { r.stage = 'nonneuro'; return r; }
      if (!anyCentral) {
        r.category = 'SECONDARY';
        r.path.push('Nem neurológiai ok valószínű' + (s['nonneuro.text'] ? ' (' + s['nonneuro.text'] + ')' : '') +
          '; nincs kóros nystagmus, dysmetria, törzsataxia');
        alert('info', 'Szekunder (nem neurológiai/fül-orr-gégészeti) szédülés valószínű: további vizsgálat, terápia és diszpozíció a megállapított ok alapján.', 'SOP 5.1, 1. ábra (3)');
        add('actions', 'A megállapított ok (pl. ritmuszavar, bradycardia, elektrolitzavar, hyponatraemia) szerinti ellátás.', '1. ábra (3)');
        r.stage = 'done';
        return r;
      }
      r.path.push('Nem neurológiai ok felmerült, DE kóros nystagmus / dysmetria / törzsataxia van → vestibularis szindróma irányában tovább');
      alert('warn', 'Bár nem neurológiai ok is felmerült, a kóros nystagmus / felső végtagi dysmetria / törzsataxia miatt a vestibularis szindróma algoritmusa folytatandó.', '1. ábra (3) szaggatott nyíl');
    } else {
      r.path.push('Nem neurológiai ok nem valószínű');
    }

    // 4–5. lépés – besorolás
    if (!s['continuous']) { r.stage = 'classify'; return r; }
    if (yes(s['continuous'])) {
      r.category = 'AVS';
      r.path.push('Folyamatos, jelenleg is fennálló szédülés → AVS');
      return evaluateAVS(s, r, add, alert);
    }
    if (!s['triggered']) { r.stage = 'classify'; return r; }
    if (no(s['triggered'])) {
      r.category = 'SEVS';
      r.path.push('Epizodikus, nem triggerelhető → s-EVS');
      return evaluateSEVS(s, r, add, alert);
    }
    r.category = 'TEVS';
    r.path.push('Epizodikus, pozícionálisan triggerelhető → t-EVS');
    return evaluateTEVS(s, r, add, alert);
  }

  function evaluateAVS(s, r, add, alert) {
    r.differentials = [
      { group: 'Gyakori, nem életveszélyes', items: ['Vestibularis neuronitis'] },
      { group: 'Potenciálisan életveszélyes', items: ['Vertebrobasilaris stroke'] },
      { group: 'Ritkább', items: ['Wernicke-encephalopathia', 'Labyrinthitis', 'Sclerosis multiplex', 'Gyógyszer/egyéb toxin okozta károsodás'] },
    ];
    if (!s['avs.trauma'] || !s['avs.headache'] || !s['avs.drug']) { r.stage = 'avs_pre'; return r; }

    var ich = yes(s['avs.trauma']) || yes(s['avs.headache']);
    if (ich) {
      r.path.push(yes(s['avs.trauma']) ? 'Koponyatrauma' : 'Erős, folyamatos/erősödő fejfájás');
      alert('danger', 'Koponyatrauma és/vagy erős fejfájás: natív koponya CT spontán vagy traumás SAV / ICH irányában.', 'SOP 5.3, 7.2.1, 2. ábra');
      add('actions', 'Natív koponya CT (ICH / SAV kizárása).', 'SOP 5.3, 7.2.1');
      if (s['avs.ct'] === 'ich') {
        alert('danger', 'Igazolt ICH: a HINTS+ ilyenkor nem indokolt; idegsebészeti/neurológiai ellátás.', 'SOP 5.3');
        add('disposition', 'Igazolt ICH – a vérzés szerinti szakellátás.', 'SOP 5.3');
        r.stage = 'done';
        return r;
      }
      if (!s['avs.ct']) { r.stage = 'avs_pre'; return r; }
      r.path.push('Koponya CT: nincs ICH/SAV → HINTS+');
      alert('info', 'A negatív natív CT NEM zárja ki a vertebrobasilaris stroke-ot – a HINTS+ vizsgálat elvégzendő.', 'SOP 7.2.1');
    }
    if (yes(s['avs.drug'])) {
      if (!s['avs.drugClear']) { r.stage = 'avs_pre'; return r; }
      if (yes(s['avs.drugClear'])) {
        alert('warn', 'Gyógyszerhatás csak akkor véleményezhető, ha a panaszok kezdete egyértelműen összefügg az új gyógyszerrel ÉS a többi kórképet nagy valószínűséggel kizártuk – a HINTS+ ettől függetlenül elvégzendő.', 'SOP 5.3');
        add('actions', 'Gyógyszerelés módosítása a kezelőorvos bevonásával (1. melléklet).', '2. ábra');
      }
    }

    // HINTS+
    var h = hints(s);
    r.hints = h;
    if (!h.result) { r.stage = 'hints'; return r; }
    r.stage = 'avs_dispo';
    if (h.result === 'central') {
      r.path.push('HINTS+: centrális ok valószínű');
      alert('danger', 'HINTS+ alapján centrális ok valószínű: ' + h.central.join('; ') + '.', 'SOP 5.3, 6.4 táblázat, 2. ábra');
      r.workingDx.push({ text: 'Valószínűleg centrális eredetű AVS – vertebrobasilaris stroke gyanú', ref: 'SOP 9' });
      add('actions', 'Neurológiai konzílium vertebrobasilaris stroke irányában.', 'SOP 5.3, 9');
      add('actions', 'Képalkotás: koponya MR (DWI) és MRA javasolt – neurológussal egyeztetve, többnyire osztályos felvételt követően.', 'SOP 7.2.2');
      add('disposition', 'Neurológiai konzílium; elhelyezés a neurológus javaslata szerint.', 'SOP 9');
    } else if (h.result === 'peripheral') {
      r.path.push('HINTS+: perifériás ok valószínű');
      alert('ok', 'HINTS+ alapján perifériás ok valószínű: ' + h.peripheral.join('; ') + '.', 'SOP 5.3, 6.4 táblázat, 2. ábra');
      r.workingDx.push({ text: 'Valószínűleg perifériás eredetű AVS – leggyakrabban vestibularis neuronitis (esetleg s-EVS-t okozó kórkép első epizódja)', ref: 'SOP 5.3' });
      add('actions', 'További vizsgálat az SBO-n nem szükséges.', 'SOP 5.3');
      if (!s['avs.severe']) { r.stage = 'avs_dispo'; }
      else if (yes(s['avs.severe'])) {
        add('disposition', 'Súlyos eset (folyamatos parenterális hányáscsillapítás igénye / teljes önellátási képtelenség): hospitalizáció – területileg illetékes fül-orr-gégészeti elhelyezés.', 'SOP 5.3, 9');
        r.stage = 'done';
      } else {
        add('disposition', 'Tanáccsal emittálható, ambuláns fül-orr-gégészeti kontroll javaslatával.', 'SOP 5.3, 9');
        add('actions', 'Tüneti terápia (antihisztamin, benzodiazepin, antiemetikum), verbális megnyugtatás; az akut tünetek lezajlása után vestibularis rehabilitációs gyakorlatok.', 'SOP 8, 3. melléklet');
        r.stage = 'done';
      }
    } else {
      r.path.push('HINTS+: nem egyértelmű / hiányos');
      alert('warn', 'A HINTS+ nem ad egyértelmű perifériás mintázatot (hiányzó/ellentmondó elemek: ' +
        (h.missing.length ? h.missing.join(', ') : '—') + '). Az SOP szerint perifériás ok csak teljes perifériás mintázatnál valószínűsíthető – ' +
        'ilyenkor a biztonságos út a neurológiai konzílium.', 'SOP 6.4 táblázat; óvatossági elv');
      add('actions', 'Hiányzó HINTS+ elemek pótlása, ha kivitelezhető; ellenkező esetben neurológiai konzílium.', 'SOP 5.3');
    }
    h.notes.forEach(function (n) { alert('info', n, 'GRACE-3 / SOP 6'); });
    return r;
  }

  function evaluateSEVS(s, r, add, alert) {
    r.differentials = [
      { group: 'Gyakori, nem életveszélyes', items: ['Vestibularis migrén'] },
      { group: 'Potenciálisan életveszélyes', items: ['Vertebrobasilaris TIA'] },
      { group: 'Ritkább / egyéb', items: ['Szívritmuszavar', 'Tüdőembólia', 'Pánikroham', 'Ménière-betegség'] },
    ];
    if (r.abcd2.complete) {
      alert(r.abcd2.band === 'alacsony' ? 'info' : 'warn',
        'ABCD2 = ' + r.abcd2.score + ' (' + r.abcd2.band + ' kockázat, 2 napos stroke-kockázat ≈ ' + r.abcd2.risk2d + '). ' +
        'Az ABCD2 csak segítség – izolált szédülésre nem validált, a klinikai megítélés dönt.', 'SOP 5.4; Johnston et al. 2007');
    }
    if (!s['sevs.tiaRisk']) { r.stage = 'sevs'; return r; }
    if (s['sevs.tiaRisk'] === 'high') {
      r.path.push('Anamnézis alapján a TIA kockázata magas');
      r.workingDx.push({ text: 'Valószínűleg centrális eredetű s-EVS – vertebrobasilaris TIA gyanú', ref: 'SOP 5.4, 9' });
      alert('danger', 'Magas TIA-kockázat: neurológiai konzílium / neurológiai elhelyezés vertebrobasilaris TIA irányában.', 'SOP 5.4, 3. ábra');
      add('actions', 'Neurológiai konzílium. Vertebrobasilaris TIA gyanújánál MRA javasolt.', 'SOP 5.4, 7.2.2');
      if (s['sevs.inArea'] === 'no') add('disposition', 'Területen kívüli beteg: az illetékes neurológiai osztályra helyezendő.', 'SOP 9');
      else add('disposition', 'ÉPC-HK területi beteg: neurológiai konzílium kérése vertebrobasilaris TIA irányában.', 'SOP 9');
      r.stage = 'done';
      return r;
    }
    r.path.push('Anamnézis alapján a TIA kockázata alacsony → perifériás ok valószínű');
    var dx = [];
    if (s['sevs.headache']) dx.push({ text: 'Vestibularis migrén (epizódokban jelentkező / szédülést követő erős fejfájás)', ref: 'SOP 5.4, 3. ábra, 3. melléklet' });
    if (s['sevs.tinnitus']) dx.push({ text: 'Ménière-betegség (fülzúgás, halláscsökkenés)', ref: 'SOP 5.4, 3. ábra, 3. melléklet' });
    if (s['sevs.anxiety']) dx.push({ text: 'Pánik / szorongás alapú (pszichogén) szédülés', ref: 'SOP 5.4, 3. ábra' });
    if (!dx.length) dx.push({ text: 'Valószínűleg perifériás eredetű s-EVS – a kísérő tünetek alapján nem pontosítható', ref: 'SOP 5.4' });
    r.workingDx = r.workingDx.concat(dx);
    if (s['sevs.anxiety']) {
      alert('info', 'Pszichogén ok csak a organikus okok mérlegelése után mondható ki; a ritmuszavar és tüdőembólia is s-EVS-t okozhat.', 'SOP 5.2 táblázat, 5.4');
    }
    if (!s['sevs.course']) { r.stage = 'sevs'; return r; }
    if (s['sevs.course'] === 'mild') {
      add('disposition', 'Nem ismétlődik / enyhe, ambulánsan menedzselhető: tanáccsal emittálható.', 'SOP 5.4, 3. ábra');
      add('actions', 'Ambuláns szakrendelés: perifériás vestibularis eredet → fül-orr-gégészet; vestibularis migrén → neurológia.', 'SOP 5.4');
    } else {
      add('disposition', 'Ismétlődő, súlyos, ambulánsan nem menedzselhető: organikus eredet esetén hospitalizáció megfontolandó (területileg illetékes fül-orr-gégészeti/neurológiai elhelyezés).', 'SOP 5.4, 9, 3. ábra');
    }
    r.stage = 'done';
    return r;
  }

  function evaluateTEVS(s, r, add, alert) {
    r.differentials = [
      { group: 'Gyakori, nem életveszélyes', items: ['BPPV', 'Orthostaticus hypotonia (nem életveszélyes háttérrel)'] },
      { group: 'Potenciálisan életveszélyes', items: ['Orthostaticus hypotonia életveszélyes háttérrel', 'CPPV (hátsó skálai térfoglalás/ischaemia)'] },
      { group: 'Ritkább', items: ['A. vertebralis kompressziós szindróma', 'Carotis sinus szindróma', 'Posturalis orthostaticus tachycardia szindróma (POTS)'] },
    ];
    if (!s['tevs.state']) { r.stage = 'tevs'; return r; }
    if (s['tevs.state'] === 'severe') {
      alert('warn', 'Folyamatosan, erősen szédülő betegnél a pozícionális vizsgálat felesleges és értelmetlen. Ha a szédülés folyamatos, a beteg AVS-ként értékelendő.', 'SOP 5.5, 6.5');
      r.stage = 'tevs';
      return r;
    }
    var p = r.positional;
    if (!p.done) { r.stage = 'tevs'; return r; }
    if (p.result === 'central_suspect') {
      r.path.push('Pozícionális teszt: atípusos (nincs latencia / irányváltó / nem csökkenő)');
      r.workingDx.push({ text: 'Centrális pozícionális vertigo (CPPV) gyanúja', ref: 'SOP 6.5, 5.2 táblázat' });
      alert('danger', 'Atípusos pozícionális nystagmus (latencia hiánya, irányváltó nystagmus vagy idővel nem csökkenő szédülés) centrális laesióra utalhat: neurológiai konzílium.', 'SOP 6.5');
      add('actions', 'Neurológiai konzílium.', 'SOP 6.5');
      r.stage = 'done';
      return r;
    }
    if (p.result === 'bppv') {
      var canalTxt = p.canal === 'posterior' ? 'posterior (hátsó) ívjárat' : 'horizontális ívjárat';
      r.path.push('Pozícionális teszt pozitív → BPPV (' + canalTxt + ', ' + SIDE[p.side] + ' oldal)');
      r.workingDx.push({ text: 'BPPV – ' + canalTxt + ', ' + SIDE[p.side] + ' oldal', ref: 'SOP 5.5, 6.5' });
      if (p.canal === 'posterior') {
        add('actions', 'Epley-manőver az érintett (' + SIDE[p.side] + ') oldalról indítva; Epley-torna betanítása otthoni ismétlésre.', 'SOP 6.5, 8');
      } else {
        add('actions', 'Barbecue-manőver, az érintett (' + SIDE[p.side] + ') oldal felé kezdve.', 'SOP 6.5');
      }
      add('actions', 'Betegtájékoztató átadása (BPPV, 2. melléklet).', 'SOP 8, 2. melléklet');
      if (!s['tevs.severity']) { r.stage = 'tevs'; return r; }
      if (s['tevs.severity'] === 'mild') add('disposition', 'Enyhe, ambulánsan menedzselhető: emisszió, Epley-torna betanítása, ambuláns fül-orr-gégészeti kontroll.', 'SOP 5.5, 9, 3. ábra');
      else add('disposition', 'Súlyos, ambulánsan nem menedzselhető: hospitalizáció a területileg illetékes fül-orr-gégészeti osztályon.', 'SOP 5.5, 9, 3. ábra');
      r.stage = 'done';
      return r;
    }
    // negatív pozícionális teszt
    r.path.push('Pozícionális tesztekkel nem provokálható');
    var o = r.orthostasis;
    if (!o.done) {
      alert('info', 'Orthostasis teszt elvégzése javasolt (ha még nem történt meg).', 'SOP 5.5, 3. ábra');
      r.stage = 'tevs';
      return r;
    }
    if (o.positive) {
      r.workingDx.push({ text: 'Orthostaticus hypotonia', ref: 'SOP 5.2 táblázat, 3. ábra' });
      alert('warn', 'Orthostaticus hypotonia: keresse az életveszélyes hátteret (pl. vérzés, dehidráció, aritmia) – az SOP szerint lehet életveszélyes kórkép tünete.', 'SOP 5.2 táblázat');
      add('actions', 'Az orthostaticus hypotonia hátterének kivizsgálása, ok szerinti ellátás.', 'SOP 5.5');
    } else if (o.pots) {
      r.workingDx.push({ text: 'POTS lehetősége (pulzusemelkedés ≥30/perc, hypotonia nélkül)', ref: 'SOP 5.2 táblázat; Freeman et al. 2011' });
      add('actions', 'POTS gyanú – ambuláns kivizsgálás mérlegelése.', 'SOP 5.2 táblázat');
    } else {
      r.path.push('Orthostasis teszt negatív → s-EVS okok mérlegelése');
      alert('info', 'Negatív pozícionális és orthostasis teszt: az s-EVS okainak mérlegelése javasolt (állítsa a besorolást „nem triggerelhető”-re, ha indokolt).', 'SOP 5.5');
    }
    r.stage = 'done';
    return r;
  }

  var api = {
    evaluate: evaluate,
    hints: hints,
    harmony: harmony,
    abcd2: abcd2,
    orthostasis: orthostasis,
    positional: positional,
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.VertigoLogic = api;
})(typeof window !== 'undefined' ? window : this);
