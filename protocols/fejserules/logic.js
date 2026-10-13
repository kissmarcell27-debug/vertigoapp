/*
 * Döntési logika – „Intracranialis vérzések sürgősségi kezelése” SOP (ÉPC-HK SBC, 17., v1.0, 2024.04.25.)
 * Tiszta függvények; böngészőben window.HeadInjuryLogic, Node-ban module.exports.
 * Minden következtetés mellett `ref`: az SOP fejezete / melléklete.
 */
(function (root) {
  'use strict';

  var yes = function (v) { return v === 'yes' || v === true; };
  var num = function (v) {
    if (v === null || v === undefined || v === '') return null;
    var n = Number(String(v).replace(',', '.'));
    return isFinite(n) ? n : null;
  };

  /* ------------------------------------------------------------------ */
  /* GCS                                                                 */
  /* ------------------------------------------------------------------ */
  function gcs(s) {
    var e = num(s['gcs.e']), v = num(s['gcs.v']), m = num(s['gcs.m']);
    if (e === null || v === null || m === null) return { complete: false, total: null };
    return { complete: true, e: e, v: v, m: m, total: e + v + m };
  }

  /* ------------------------------------------------------------------ */
  /* Rizikócsoport – SOP 4.                                              */
  /* ------------------------------------------------------------------ */
  var HIGH = {
    'hr.neuro': 'Neurológiai kórjelek (aluszékony / soporosus betegnél anisocoria, durva végtaggyengeség, epilepsziás rosszullét)',
    'hr.progressive': 'A tudatzavar progresszív',
    'hr.penetrating': 'Penetráló vagy impressziós koponyasérülés és/vagy súlyos maxillofacialis sérülés',
    'hr.mechanism': 'A baleseti mechanizmus vagy a külsérelem alapján intracranialis sérülés valószínű',
    'hr.atls': 'ATLS-kritérium (eszméletlen; >2 m / testmagasság feletti esés; járműből kirepült; nagy sebességű ütközés: gyalogos >5 km/h, motoros >30 km/h, személygépkocsi >60 km/h; karosszéria-deformitás; elhunyt a járműben; légzsák nyílt)',
  };
  var MODERATE = {
    'mr.loc': 'Bizonyítható eszméletvesztés a sérüléskor vagy azt követően',
    'mr.headache': 'Progresszív (egyértelműen erősödő) vagy elviselhetetlen fejfájás és/vagy zavartság, nyugtalanság',
    'mr.intox': 'Alkohol- vagy drogintoxikáció (feltételezhető vagy bizonyítható)',
    'mr.seizure': 'Epilepsziás görcs vagy arra utaló adat',
    'mr.unreliable': 'Megbízhatatlan anamnézis, anamnézis nem nyerhető',
    'mr.pta': 'Poszttraumás amnézia',
    'mr.basal': 'Koponyaalapi törés fizikális jelei',
    'mr.repeated': 'Többszörösen ismételt trauma',
    'mr.depressed': 'Impressziós koponyatörés gyanúja',
    'mr.nai': 'Bántalmazás (bántalmazott gyermek / családon belüli erőszak) gyanúja',
    'mr.subgaleal': 'Nagy kiterjedésű subgalealis vérzés és duzzanat',
    'mr.coag': 'Antikoagulált, thrombocytaaggregáció-gátlót szedő, dekompenzált májbeteg vagy más coagulopathiás sérült',
    'mr.focal': 'Ismeretlen eredetű / korú fokális neurológiai tünet',
    'mr.multi': 'Változó korú, többszörös sérülésre utaló külsérelmek',
    'mr.xray': 'Koponyatörés RTG-jelei',
  };

  function vomitCount(s) { var n = num(s['vomit.n']); return n === null ? 0 : n; }

  function riskGroup(s) {
    var g = gcs(s);
    var high = Object.keys(HIGH).filter(function (k) { return s[k]; }).map(function (k) { return HIGH[k]; });
    if (g.complete && g.total <= 12) high.unshift('GCS ' + g.total + ' (≤12) – tudatzavar');
    var mod = Object.keys(MODERATE).filter(function (k) { return s[k]; }).map(function (k) { return MODERATE[k]; });
    if (vomitCount(s) >= 2) mod.push('Kettő vagy többszöri hányás (' + vomitCount(s) + '×)');
    var age = num(s['pt.age']);
    if (age !== null && (age < 2 || age > 70) && !s['mr.trivial']) mod.push('Életkor ' + age + ' év (<2 vagy >70 év, nem teljesen jelentéktelen sérülés)');
    var level = null;
    if (high.length) level = 'high';
    else if (mod.length) level = 'moderate';
    else if (s['risk.none']) level = 'low';
    return { level: level, high: high, moderate: mod };
  }

  /* ------------------------------------------------------------------ */
  /* CT-indikáció és időzítés – SOP 7. és 13.                            */
  /* ------------------------------------------------------------------ */
  function ctIndication(s, risk) {
    var g = gcs(s);
    var r1 = [];   // 1 órán belül
    if (g.complete && g.total <= 12) r1.push('GCS ≤12 a kezdeti értékeléskor');
    if (s['ct.gcs2h'] === 'yes') r1.push('GCS <15 a sérülés után 2 órával');
    if (s['mr.depressed'] || s['hr.penetrating']) r1.push('Nyílt vagy impressziós koponyatörés gyanúja');
    if (s['mr.basal']) r1.push('Koponyaalapi törés jele (haemotympanum, pápaszem-haematoma, liquorrhoea)');
    if (s['mr.seizure']) r1.push('Poszttraumás roham');
    if (s['mr.focal'] || s['hr.neuro']) r1.push('Fokális neurológiai deficit');
    if (vomitCount(s) > 1) r1.push('Több mint 1 hányásos epizód');

    var r8 = [];   // eszméletvesztés / amnézia + kockázati tényező → 8 órán belül
    var locAmn = s['mr.loc'] || s['mr.pta'];
    if (locAmn) {
      var age = num(s['pt.age']);
      if (age !== null && age >= 65) r8.push('65 éves vagy idősebb');
      if (s['mr.coag']) r8.push('Vérzési vagy véralvadási zavar');
      if (s['ct.dangerous']) r8.push('Veszélyes sérülési mechanizmus (elütött gyalogos/kerékpáros, járműből kiesett, >1 m vagy 5 lépcsőfok)');
      if (s['ct.retro']) r8.push('>30 perces retrográd amnézia');
    }

    var out = { indicated: false, timing: null, reasons: [], cspine: [], highExtra: false };
    if (r1.length) { out.indicated = true; out.timing = '1h'; out.reasons = r1; }
    else if (r8.length) {
      out.indicated = true;
      out.timing = s['ct.over8h'] ? '1h' : '8h';
      out.reasons = ['Eszméletvesztés / amnézia és: ' + r8.join(', ')];
    }
    // Összegző szabály: minden legalább közepes kockázatú fejsérültnél non-contrast CT
    if (risk.level === 'moderate' || risk.level === 'high') {
      out.indicated = true;
      if (!out.timing) out.timing = 'indicated';
      if (!out.reasons.length) out.reasons = ['Legalább közepes kockázatú fejsérült'];
    }
    if (risk.level === 'high') out.highExtra = true; // CI–CII (optimálisan CI–ThI) CT-vel kiegészítve

    // Nyaki gerinc CT (SOP 7.)
    if (g.complete && g.total <= 12) out.cspine.push('GCS ≤12 a kezdeti értékeléskor');
    if (s['cs.intubated']) out.cspine.push('Intubált beteg');
    if (s['cs.urgent']) out.cspine.push('A nyaki gerinc sérülésének sürgős definitív diagnózisa szükséges');
    if (s['cs.polytrauma']) out.cspine.push('Éber, stabil betegnél a fejet és a mellkast/hasat/medencét is érintő tompa polytrauma');
    if (s['cs.suspicion']) {
      var f = [];
      var a = num(s['pt.age']);
      if (a !== null && a >= 65) f.push('≥65 év');
      if (s['cs.mech']) f.push('veszélyes mechanizmus');
      if (s['cs.focal']) f.push('fokális perifériás neurológiai deficit');
      if (s['cs.paresth']) f.push('paresztézia a végtagokban');
      if (s['mr.intox']) f.push('intoxikáció');
      if (f.length) out.cspine.push('Nyaki gerinc sérülésének klinikai gyanúja és: ' + f.join(', '));
    }
    return out;
  }

  /* Speciális betegcsoport (SOP 13.) – csak közepes kockázatnál */
  function special(s, risk, ct) {
    if (risk.level !== 'moderate') return null;
    var g = gcs(s);
    if (s['sp.anticoag'] === 'vka' || s['sp.anticoag'] === 'noac') {
      var inr = num(s['inr']);
      var res = { group: 'anticoag', inr: inr };
      if (ct.timing === '1h') { res.ctTiming = 'now'; res.symptomatic = true; return res; }
      if (inr === null) { res.ctTiming = null; return res; }
      if (inr > 1.4) { res.ctTiming = 'now'; res.obs12 = true; }
      else if (inr < 1.4) { res.ctTiming = '4h'; }
      else { res.ctTiming = 'now'; res.obs12 = true; res.borderline = true; } // INR = 1,4: az SOP nem definiálja → biztonságosabb út
      return res;
    }
    if (s['sp.tag'] === 'yes') {
      var sym = [];
      if (g.complete && g.total < 15) sym.push('GCS <15');
      if (s['mr.headache']) sym.push('progresszív fejfájás');
      if (vomitCount(s) > 2) sym.push('kettőnél többször hányt');
      if (s['sp.amnesia']) sym.push('elhúzódó amnézia');
      return sym.length ? { group: 'tag', ctTiming: 'now', obs12: true, reasons: sym } : { group: 'tag', ctTiming: '4h', reasons: [] };
    }
    return null;
  }

  /* ------------------------------------------------------------------ */
  /* Fő kiértékelés – 1. melléklet (folyamatábra), 2., 11–13. fejezet     */
  /* ------------------------------------------------------------------ */
  var NONTRAUMA = {
    deep: { dx: 'Nem traumás, hypertoniás (törzsdúci) ICH', dispo: 'Szinte kizárólag stroke-centrumba helyezendő.' },
    lobar: { dx: 'Nem traumás lobáris vérzés', dispo: 'További kivizsgálás (CT-angiográfia, esetleg halasztott DSA), majd SBO fektető / idegsebészeti osztály, esetleg területi neurológia; ritkán műtét.' },
    sah: { dx: 'Nem traumás subarachnoidealis vérzés', dispo: 'Neuroendovascularis ellátás: előzetes referálást követően hétköznap 24 órában intézményünkben; ha ez nem lehetséges, vagy hétvégén, az idegsebész az OMIII-ba referálja.' },
  };

  function admissionReasons(s) {
    var map = {
      'adm.imaging': 'Új, klinikailag fontos eltérés a képalkotás során',
      'adm.gcs': 'A GCS nem tért vissza 15-re / a sérülés előtti alapvonalra',
      'adm.symptoms': 'Folyamatos aggasztó tünetek (tartós hányás, súlyos fejfájás, görcsroham)',
      'adm.other': 'Egyéb aggodalomra okot adó klinikum (intoxikáció, egyéb sérülés, sokk, nem véletlen sérülés gyanúja, meningitis, liquorcsorgás, fennálló poszttraumás amnézia)',
    };
    return Object.keys(map).filter(function (k) { return s[k]; }).map(function (k) { return map[k]; });
  }

  function evaluate(s) {
    s = s || {};
    var r = { category: null, stage: 'start', path: [], alerts: [], workingDx: [], actions: [], disposition: [], differentials: [] };
    var add = function (list, text, ref) { r[list].push({ text: text, ref: ref }); };
    var alert = function (level, text, ref) { r.alerts.push({ level: level, text: text, ref: ref }); };
    r.gcs = gcs(s);

    if (s.critical === 'yes') {
      alert('danger', 'Kritikus állapotú beteg: vizsgálat és ellátás ABCDE szerint, monitorozás (légzés, SpO₂, pulzus/EKG, RR); célzott oxigénterápia (SpO₂ 90–94%).', 'SOP 5.');
    }
    if (r.gcs.complete && r.gcs.total < 8) {
      alert('danger', 'GCS ' + r.gcs.total + ' (<8): emelt szintű légútbiztosítás javasolt (RSI, váltásvezetővel egyeztetve).', 'SOP 5. AB');
    }
    if (s['sp.anticoag'] === 'vka') alert('warn', 'K-vitamin-antagonistát szedő betegnél az INR levétele minden esetben kötelező.', 'SOP 6.');

    if (!s.etiology) { r.stage = 'start'; return r; }

    /* ---------------- Nem traumás ICH ---------------- */
    if (s.etiology === 'nontrauma') {
      r.category = 'NONTRAUMA';
      r.path.push('Nem traumás intracranialis vérzés');
      add('actions', 'Non-contrast koponya CT (gold standard).', 'SOP 7.');
      add('actions', 'Labor: ionok, vese- és májfunkció, vérkép, vércsoport és ellenanyagszűrés, alvadási paraméterek (INR, APTI, TI, TCT, fibrinogén; ClotPro).', 'SOP 6.');
      add('actions', 'Antikoaguláns terápia felfüggesztése: lásd ClotPro eljárásrend.', 'SOP 8.');
      if (!s['nt.type']) { r.stage = 'nontrauma'; return r; }
      var nt = NONTRAUMA[s['nt.type']];
      r.path.push(nt.dx);
      r.workingDx.push({ text: nt.dx, ref: 'SOP 2.' });
      if (s['nt.type'] === 'sah') add('actions', 'SAV esetén még a CT-vizsgálóban idegsebészeti / radiológiai konzultáció a CTA elvégzéséről.', 'SOP 7.');
      if (s['nt.large'] === 'yes') {
        alert('danger', 'Nagyméretű, sebészileg hozzáférhető ICH vagy obstruktív hydrocephalus: az idegsebészeti konzultáció életmentő – a CT után mihamarabb értesítse az idegsebészt.', 'SOP 9.');
        add('actions', 'Azonnali idegsebészeti konzultáció.', 'SOP 9.');
      }
      add('disposition', nt.dispo, 'SOP 2.');
      r.stage = 'treatment';
      return r;
    }

    /* ---------------- Traumás fejsérülés ---------------- */
    r.path.push('Traumás fejsérülés');
    var risk = riskGroup(s);
    r.risk = risk;
    if (!risk.level) { r.stage = 'risk'; return r; }
    var label = { low: 'Alacsony', moderate: 'Közepes', high: 'Magas' }[risk.level];
    r.category = { low: 'LOW', moderate: 'MODERATE', high: 'HIGH' }[risk.level];
    r.path.push(label + ' kockázatú fejsérült');

    if (risk.level === 'low') {
      add('disposition', 'Alacsony kockázat: CT nem szükséges; emisszió, ha nincs más felvételt indokoló tényező, és a biztonságos otthonbocsátás feltételei (pl. otthoni felügyelet) adottak.', 'SOP 12., 1. melléklet');
      add('actions', 'Fejsérülteknek szóló tájékoztató átadása, tényének rögzítése az epikrízisben.', 'SOP 12., 2. melléklet');
      r.ct = { indicated: false, reasons: [], cspine: [] };
      r.stage = 'dispo';
      return evaluateDischarge(s, r, add, alert);
    }

    var ct = ctIndication(s, risk);
    r.ct = ct;
    var sp = special(s, risk, ct);
    r.special = sp;
    if (risk.level === 'moderate' || risk.level === 'high') {
      add('actions', 'Oxigénterápia (legalább orrszonda) már a CT megkezdése előtt.', 'SOP 5. AB');
    }

    // CT időzítése
    if (sp && sp.group === 'anticoag') {
      if (sp.inr === null && sp.ctTiming === null) {
        alert('warn', 'Antikoagulált, közepes kockázatú betegnél a CT időzítése az INR-től függ – adja meg az INR értékét.', 'SOP 13.1');
        r.stage = 'ct';
        return r;
      }
      if (sp.ctTiming === 'now') add('actions', 'Azonnali non-contrast koponya CT' + (sp.symptomatic ? ' (1 órás CT-kritérium áll fenn).' : ' (INR ' + sp.inr + ' > 1,4).'), 'SOP 13.1, 7.');
      else add('actions', 'Non-contrast koponya CT a trauma után 4 órával (INR ' + sp.inr + ' < 1,4).', 'SOP 13.1');
      if (sp.borderline) alert('warn', 'INR = 1,4: az SOP csak az „1,4 felett” és „1,4 alatt” esetet definiálja – a biztonságosabb utat (azonnali CT, negatív CT esetén 12 órás obszerváció) javasoljuk.', 'SOP 13.1; óvatossági elv');
      if (s['sp.anticoag'] === 'noac') alert('info', 'NOAC-hatást az INR nem tükrözi megbízhatóan (nem az SOP része) – a klinikai megítélés és a ClotPro eljárásrend irányadó.', 'nem SOP');
    } else if (sp && sp.group === 'tag') {
      if (sp.ctTiming === 'now') add('actions', 'Azonnali non-contrast koponya CT (TAG-gátló + ' + sp.reasons.join(', ') + ').', 'SOP 13.2');
      else add('actions', 'Tünetmentes, TAG-gátlót szedő beteg: non-contrast koponya CT a trauma után 4 órával.', 'SOP 13.2');
    } else if (ct.timing === '1h') {
      add('actions', 'Non-contrast koponya CT 1 órán belül: ' + ct.reasons.join('; ') + '.', 'SOP 7.');
    } else if (ct.timing === '8h') {
      add('actions', 'Non-contrast koponya CT a fejsérülést követő 8 órán belül: ' + ct.reasons.join('; ') + '.', 'SOP 7.');
    } else {
      add('actions', 'Non-contrast koponya CT (minden legalább közepes kockázatú fejsérültnél).', 'SOP 7.');
    }
    if (ct.highExtra) add('actions', 'Magas kockázat: a CT kiegészítése legalább a CI–CII, optimálisan a CI–ThI szegmentumokkal.', 'SOP 7.');
    if (ct.cspine.length) add('actions', 'Nyaki gerinc CT is szükséges: ' + ct.cspine.join('; ') + '.', 'SOP 7.');
    add('actions', 'Labor: ionok, vese- és májfunkció, vérkép, vércsoport és ellenanyagszűrés, alvadási paraméterek (INR, APTI, TI, TCT, fibrinogén; ClotPro).', 'SOP 6.');

    if (!s['ct.result']) { r.stage = 'ct'; return r; }

    if (s['ct.result'] === 'pos') {
      r.category = 'POSITIVE';
      r.path.push('CT: intracranialis vérzés / traumás eltérés igazolódott');
      r.workingDx.push({ text: 'Traumás intracranialis sérülés (CT-vel igazolt)', ref: 'SOP 7.' });
      alert('danger', 'Pozitív CT: azonnali idegsebészeti konzílium.', '1. melléklet, SOP 9., 13.');
      add('actions', 'Azonnali idegsebészeti konzílium.', 'SOP 9., 13.');
      if (sp && sp.group === 'anticoag') add('actions', 'Antikoagulált beteg, pozitív CT: PCC adása javasolt; antikoaguláció felfüggesztése a ClotPro eljárásrend szerint.', 'SOP 13.1, 8.');
      if (s['ct.sah']) add('actions', 'SAV: még a CT-vizsgálóban idegsebészeti / radiológiai konzultáció a CTA elvégzéséről.', 'SOP 7.');
      add('actions', 'Obszerváció (ha nem kerül azonnal intenzív osztályra vagy műtőbe): GCS, pupilla, végtagmozgások, légzésszám, pulzus, RR, hőmérséklet, SpO₂ – félóránként a 15-ös GCS eléréséig, majd 6 órán át óránként, utána 2 óránként. Kontroll CT az első vizsgálat után 12 órával, neurológiai romlásnál azonnal.', 'SOP 11.');
      var dec = { op: 'Műtő', ito: 'Intenzív osztály', obs: 'SBO fektető részleg – obszerváció', other: 'Elhelyezés egyeztetés alatt / idegsebészeti javaslat alapján' }[s['ns.decision']];
      add('disposition', dec ? dec + ' (idegsebészeti konzílium alapján).' : 'Elhelyezés az idegsebészeti konzílium alapján: műtő / ITO / fektető.', '1. melléklet, SOP 11–12.');
      r.stage = s['ns.decision'] ? 'done' : 'ctresult';
      return r;
    }

    // Negatív CT
    r.path.push('CT: negatív');
    if (risk.level === 'high') {
      r.workingDx.push({ text: 'Magas kockázatú fejsérülés, negatív CT', ref: '1. melléklet' });
      add('disposition', 'Magas kockázatú fejsérült, negatív CT: obszerváció.', '1. melléklet, SOP 11.');
      add('actions', 'Neurológiai megfigyelés: félóránként a 15-ös GCS eléréséig, majd 6 órán át óránként, utána 2 óránként.', 'SOP 11.');
      r.stage = 'dispo';
      return evaluateDischarge(s, r, add, alert, true);
    }
    if (sp && sp.obs12) {
      r.workingDx.push({ text: (sp.group === 'anticoag' ? 'Antikoagulált' : 'TAG-gátlót szedő') + ', közepes kockázatú fejsérült, negatív CT', ref: 'SOP 13.' });
      add('disposition', '12 órás obszerváció; panaszmentesség esetén ezt követően emisszió, panasz esetén kontroll non-contrast CT és idegsebészeti rekonzílium.', 'SOP 13.');
      if (s['obs.result'] === 'symptoms') {
        alert('warn', 'Az obszerváció alatt panasz jelentkezett: kontroll non-contrast CT és idegsebészeti rekonzílium.', 'SOP 13.');
        add('actions', 'Kontroll non-contrast CT és idegsebészeti rekonzílium.', 'SOP 13.');
        r.stage = 'done';
        return r;
      }
      if (s['obs.result'] !== 'free') { r.stage = 'dispo'; return r; }
      r.path.push('12 órás obszerváció alatt panaszmentes');
      return evaluateDischarge(s, r, add, alert);
    }
    r.workingDx.push({ text: 'Közepes kockázatú fejsérülés, negatív CT', ref: '1. melléklet' });
    add('disposition', 'Közepes kockázat, negatív CT: emisszió, ha a feltételek teljesülnek.', '1. melléklet, SOP 12–13.');
    return evaluateDischarge(s, r, add, alert);
  }

  function evaluateDischarge(s, r, add, alert, observed) {
    var adm = admissionReasons(s);
    r.stage = 'dispo';
    if (adm.length) {
      alert('warn', 'Hospitalizációs kritérium: ' + adm.join('; ') + '.', 'SOP 11.');
      add('disposition', 'Hospitalizáció szükséges (' + adm.join('; ') + ').', 'SOP 11.');
      r.discharge = false;
      r.stage = 'done';
      return r;
    }
    var need = [];
    if (r.ct && r.ct.indicated !== false && s['dc.gcs'] !== 'yes') need.push('a GCS visszatért 15-re / a sérülés előtti értékre');
    if (s['dc.noother'] !== 'yes') need.push('nincs más felvételt indokoló tényező');
    if (s['dc.supervision'] !== 'yes') need.push('megfelelő otthoni felügyelet biztosított');
    if (need.length) {
      if (observed) add('actions', 'Obszerváció után hazaengedhető, ha minden jelentős tünet és jel megszűnt, és otthoni felügyelete megfelelő.', 'SOP 12.');
      r.dischargePending = need;
      return r;
    }
    r.discharge = true;
    add('disposition', (observed ? 'Obszervációt követően, a tünetek megszűnése után emittálható.' : 'Emittálható.') + ' A fejsérülteknek szóló tájékoztatót csatolni kell, átadását az epikrízisben rögzíteni.', 'SOP 12., 2. melléklet');
    if (!s['leaflet.given']) alert('info', 'A fejsérülteknek szóló tájékoztató átadását az epikrízisben rögzíteni kell (Összegzés lépés, „Tájékoztató átadva”).', 'SOP 12.');
    if (s['sp.anticoag'] === 'vka' || s['sp.anticoag'] === 'noac' || s['sp.tag'] === 'yes') {
      alert('warn', 'A tájékoztató „vérhígító szert ne szedjen” mondata antikoagulált / TAG-gátlót szedő betegnél egyedi orvosi döntést igényel – az SOP ezt nem részletezi, a Javaslatot ennek megfelelően pontosítsa.', 'SOP 2. melléklet; nem SOP');
    }
    r.stage = 'done';
    return r;
  }

  /* ------------------------------------------------------------------ */
  /* Kalkulátorok – SOP 5. és 10.                                        */
  /* ------------------------------------------------------------------ */
  function bpTargets(s) {
    var sys = num(s['bp.sys']);
    if (sys === null) return null;
    var out = { sys: sys, floor1h: Math.round(sys * 0.85) };
    if (sys < 90) out.zone = 'hypo';
    else if (sys > 220) out.zone = 'over220';
    else if (sys >= 150) out.zone = '150-220';
    else out.zone = 'normal';
    return out;
  }

  function doses(s) {
    var w = num(s['wt']);
    if (w === null || w <= 0) return null;
    var r1 = function (x) { return Math.round(x * 10) / 10; };
    return {
      weight: w,
      diazepam: [r1(0.1 * w), r1(0.2 * w)],
      phenytoin: [Math.round(15 * w), Math.round(20 * w)],
      mannitol: [r1(0.25 * w), r1(1 * w)],
      ketamineIv: [r1(0.1 * w), r1(0.3 * w)],
      ketamineIm: [r1(1 * w), r1(3 * w)],
      fentanyl: [Math.round(1 * w), Math.round(2 * w)],
      noradrenalin: [r1(0.1 * w), r1(1.0 * w)],
      dobutamin: [r1(2 * w), r1(20 * w)],
      tv: [Math.round(4 * w), Math.round(6 * w)],
    };
  }

  var api = { evaluate: evaluate, gcs: gcs, riskGroup: riskGroup, ctIndication: ctIndication, special: special, bpTargets: bpTargets, doses: doses, HIGH: HIGH, MODERATE: MODERATE, NONTRAUMA: NONTRAUMA };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.HeadInjuryLogic = api;
})(typeof window !== 'undefined' ? window : this);
