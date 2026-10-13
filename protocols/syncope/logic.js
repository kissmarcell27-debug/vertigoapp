/*
 * Döntési logika – „Syncope eljárásrend” (ÉPC-HK SBC SOP 5., v1.0, 2026.02.10.)
 * Tiszta függvények; böngészőben window.SyncopeLogic, Node-ban module.exports.
 */
(function (root) {
  'use strict';

  var num = function (v) {
    if (v === null || v === undefined || v === '') return null;
    var n = Number(String(v).replace(',', '.'));
    return isFinite(n) ? n : null;
  };

  /* ------------------------------------------------------------------ */
  /* Aktív állás vizsgálat – SOP 4.3–4.4                                 */
  /* OH: >20 Hgmm szisztolés vagy >10 Hgmm diasztolés esés, vagy <90 Hgmm */
  /* szisztolés érték. POTS: >30/perc emelkedés vagy >120/perc (10 perc)  */
  /* OH nélkül.                                                          */
  /* ------------------------------------------------------------------ */
  function activeStanding(s) {
    var sup = { sys: num(s['as.supSys']), dia: num(s['as.supDia']), hr: num(s['as.supHr']) };
    var pts = [
      { t: '0 perc', sys: num(s['as.0Sys']), dia: num(s['as.0Dia']), hr: num(s['as.0Hr']) },
      { t: '3 perc', sys: num(s['as.3Sys']), dia: num(s['as.3Dia']), hr: num(s['as.3Hr']) },
      { t: '10 perc', sys: null, dia: null, hr: num(s['as.10Hr']) },
    ];
    var anyStanding = pts.some(function (p) { return p.sys !== null; });
    if (sup.sys === null || !anyStanding) {
      if (s['as.manual'] === 'pos') return { done: true, oh: true, manual: true };
      if (s['as.manual'] === 'neg') return { done: true, oh: false, manual: true };
      return { done: false };
    }
    var maxSysDrop = null, maxDiaDrop = null, minSys = null, reasons = [];
    pts.forEach(function (p) {
      if (p.sys !== null) {
        var d = sup.sys - p.sys;
        if (maxSysDrop === null || d > maxSysDrop) maxSysDrop = d;
        if (minSys === null || p.sys < minSys) minSys = p.sys;
        if (d > 20) reasons.push(p.t + ': szisztolés esés ' + d + ' Hgmm (>20)');
        if (p.sys < 90) reasons.push(p.t + ': szisztolés ' + p.sys + ' Hgmm (<90)');
      }
      if (p.dia !== null && sup.dia !== null) {
        var dd = sup.dia - p.dia;
        if (maxDiaDrop === null || dd > maxDiaDrop) maxDiaDrop = dd;
        if (dd > 10) reasons.push(p.t + ': diasztolés esés ' + dd + ' Hgmm (>10)');
      }
    });
    var oh = reasons.length > 0;
    var maxHr = null, hrRise = null;
    pts.forEach(function (p) {
      if (p.hr !== null) {
        if (maxHr === null || p.hr > maxHr) maxHr = p.hr;
        if (sup.hr !== null) { var r = p.hr - sup.hr; if (hrRise === null || r > hrRise) hrRise = r; }
      }
    });
    var pots = !oh && ((hrRise !== null && hrRise > 30) || (maxHr !== null && maxHr > 120));
    return { done: true, oh: oh, reasons: reasons, maxSysDrop: maxSysDrop, maxDiaDrop: maxDiaDrop, minSys: minSys, hrRise: hrRise, maxHr: maxHr, pots: pots };
  }

  // OH okozta syncope bizonyossága (SOP 4.4)
  function ohCertainty(s, as) {
    if (!as.done || !as.oh) return null;
    var rep = s['as.reproduced'], hx = s['as.history'];
    if (!rep || !hx) return null;
    if (rep === 'yes') return hx === 'full' ? 'igazolt' : 'valószínű';
    return hx === 'full' ? 'valószínű' : 'lehetséges';
  }

  /* ------------------------------------------------------------------ */
  /* Carotis sinus masszázs – SOP 4.2                                    */
  /* ------------------------------------------------------------------ */
  function csm(s) {
    var age = num(s['pt.age']);
    var res = { indicated: age !== null && age > 40, cautions: [] };
    if (s['csm.strokeTia']) res.cautions.push('korábbi stroke / TIA');
    if (s['csm.stenosis']) res.cautions.push('>70%-os carotis stenosis');
    if (s['csm.result'] === 'pos') {
      res.positive = true;
      res.dx = s['csm.reproduced'] === 'yes' ? (s['hx.prevSyncope'] === 'yes' ? 'CSS' : 'CSH') : 'CSH';
    } else if (s['csm.result'] === 'neg') res.positive = false;
    return res;
  }

  /* ------------------------------------------------------------------ */
  /* Kritérium-listák                                                     */
  /* ------------------------------------------------------------------ */
  // EKG – egyértelmű aritmogén syncope (4.5.2) ÉS magas kockázat (5.2)
  var EKG_CERTAIN = {
    'e.sinusbrady': 'Perzisztens sinus bradycardia <40/perc, ismétlődő SA-blokk vagy >3 mp-es pauza éber állapotban, terhelés nélkül',
    'e.avb': 'Másodfokú Mobitz II vagy harmadfokú AV-blokk',
    'e.altbbb': 'Alternáló BTSZB és JTSZB',
    'e.vt': 'Kamrai tachycardia (tartós vagy nem tartós)',
    'e.svt': 'Magas kamrai frekvenciájú SVT',
    'e.pvtqt': 'Nem tartós polimorf kamrai tachycardia és rövid vagy hosszú QT',
    'e.pm': 'Pacemaker / ICD diszfunkció pauzákkal',
  };
  // EKG – magas kockázat (5.2), nem egyértelmű diagnózis
  var EKG_HIGH = {
    'e.ischemia': 'Akut ischaemia jelei',
    'e.slowaf': 'Lassú frekvenciájú pitvarfibrilláció (<40/perc)',
    'e.conduction': 'Tawara-szár-blokk, intraventricularis vezetési zavar, kamrai hypertrophia, ISZB-nek megfelelő Q-hullám, cardiomyopathiára típusos EKG',
    'e.brugada': 'I-es típusú Brugada-jel',
    'e.longqt': 'Hosszú QT szindróma (QTc >460 ms)',
  };
  // Csak korábbi aritmogén syncope esetén magas kockázat (5.2)
  var EKG_COND = {
    'c.mobitz1': 'Mobitz I másodfokú AV-blokk és markánsan megnyúlt PR-szakaszú elsőfokú AV-blokk',
    'c.brady': 'Aszimptomatikus, enyhe inappropriate sinus bradycardia (40–50/perc) vagy lassú PF (40–50/perc)',
    'c.psvt': 'Paroxizmális SVT vagy PF',
    'c.preexc': 'Preexcitált QRS-komplexusok',
    'c.brugada': 'Atípusos Brugada-mintázat',
    'c.arvc': 'Negatív T-hullám jobb precordialis elvezetésekben, ARVC-re utaló epsilon-hullám',
  };
  var HIGH = {
    'h.newsymptom': 'Újkeletű mellkasi diszkomfort, légszomj, hasi fájdalom vagy fejfájás',
    'h.exertion': 'Fizikai terhelés alatt vagy fekvő helyzetben jelentkező syncope',
    'h.palp': 'Hirtelen kezdődő palpitáció, melyet közvetlenül syncope követ',
    'h.structural': 'Anamnesztikus súlyos strukturális szív- vagy koronáriabetegség (szívelégtelenség, alacsony EF, korábbi AMI)',
    'h.hypotension': 'A sürgősségi osztályon mással nem magyarázható hypotonia (szisztolés <90 Hgmm)',
    'h.brady': 'Perzisztáló bradycardia (<40/perc) éber állapotban, fizikai megterhelés nélkül',
    'h.murmur': 'Kivizsgálatlan systolés zörej',
    'h.gib': 'Rektális vizsgálat során felmerülő GIV',
  };
  var HIGH_HD = {
    'hd.noprodrome': 'megelőző tünet nélküli vagy <10 mp-es prodromával',
    'hd.family': 'fiatalkori hirtelen szívhalál a családi anamnézisben',
    'hd.sitting': 'ülő helyzetben jelentkező syncope',
  };
  var LOW = {
    'l.prodrome': 'Prodromával induló reflex syncope',
    'l.trigger': 'Kellemetlen látványt, hangot, szagot vagy fájdalmat követően jelentkezik',
    'l.standing': 'Tartós állást követően, vagy zsúfolt / meleg helyen',
    'l.meal': 'Étkezés közben vagy postprandiálisan',
    'l.neck': 'Fej elfordítására vagy a carotis sinusra gyakorolt nyomásra (szűk ruházat, borotválkozás, tumor)',
    'l.history': 'Strukturális szívbetegség hiánya; évekkel korábbi, a jelenlegivel megegyező jegyű alacsony kockázatú syncope',
  };
  var MID = {
    'm.recurrent': 'Alacsony kockázatot mutató, de ismétlődő, az életminőséget rontó syncopék',
    'm.shortprodrome': 'Rövid (≈5–10 mp) vagy hiányzó prodromájú reflex syncope, trauma veszélyével',
    'm.activity': 'Magas kockázatú tevékenység (vezetés, repülés, gépi munkavégzés) közben jelentkező syncope',
  };

  function picked(s, map) { return Object.keys(map).filter(function (k) { return s[k]; }).map(function (k) { return map[k]; }); }

  function certainDx(s, as) {
    var out = [];
    if (s['cert.vvs']) out.push({ code: 'VVS', text: 'Vasovagalis syncope (erősen valószínű)', ref: 'SOP 4.5.1' });
    if (s['cert.situational']) out.push({ code: 'SIT', text: 'Szituációs syncope', ref: 'SOP 4.5.1' });
    if (s['cert.orthostatic']) {
      if (as.done && as.oh) out.push({ code: 'OH', text: 'Ortosztatikus syncope', ref: 'SOP 4.5.1' });
    }
    var ekg = picked(s, EKG_CERTAIN);
    if (ekg.length) out.push({ code: 'ARR', text: 'Aritmogén syncope (' + ekg.join('; ') + ')', ref: 'SOP 4.5.2' });
    if (s['cert.ischemia']) out.push({ code: 'ISCH', text: 'Ischaemiás szívbetegséggel összefüggő syncope (igazolt akut myocardialis ischaemia)', ref: 'SOP 4.5.2' });
    if (s['cert.structural']) out.push({ code: 'STRUCT', text: 'Strukturális szívbetegség okozta syncope' + (s['cert.structural.text'] ? ' (' + s['cert.structural.text'] + ')' : ''), ref: 'SOP 4.5.2' });
    return out;
  }

  function riskLevel(s, as) {
    var high = picked(s, HIGH).concat(picked(s, EKG_CERTAIN), picked(s, EKG_HIGH));
    if (s['hd.present']) {
      var hd = picked(s, HIGH_HD);
      if (hd.length) high.push('Szívbetegséghez / kóros EKG-hoz társuló syncope: ' + hd.join(', '));
    }
    if (s['hx.arrSync']) high = high.concat(picked(s, EKG_COND).map(function (x) { return x + ' (korábbi aritmogén syncope mellett)'; }));
    if (s['cert.ischemia']) high.push('Igazolt akut myocardialis ischaemia');
    if (s['cert.structural']) high.push('Bizonyított strukturális szívbetegség');
    var mid = picked(s, MID);
    var low = picked(s, LOW);
    var level = null;
    if (high.length) level = 'high';
    else if (s['h.none']) {
      if (mid.length) level = 'intermediate';
      else if (low.length && s['l.physical'] === 'yes' && s['l.ekg'] === 'yes') level = 'low';
      else level = 'intermediate';
    }
    return { level: level, high: high, mid: mid, low: low };
  }

  /* ------------------------------------------------------------------ */
  /* Fő kiértékelés – 4. ábra                                             */
  /* ------------------------------------------------------------------ */
  function evaluate(s) {
    s = s || {};
    var r = { category: null, stage: 'start', path: [], alerts: [], workingDx: [], actions: [], disposition: [], differentials: [] };
    var add = function (list, text, ref) { r[list].push({ text: text, ref: ref }); };
    var alert = function (level, text, ref) { r.alerts.push({ level: level, text: text, ref: ref }); };
    r.as = activeStanding(s);
    r.ohCertainty = ohCertainty(s, r.as);
    r.csm = csm(s);

    if (!s.unstable) { r.stage = 'start'; return r; }
    if (s.unstable === 'yes') {
      r.category = 'UNSTABLE';
      r.path.push('Cardiorespiratorikusan instabil');
      alert('danger', 'Kardiorespiratorikusan instabil beteg: ellátás ABCDE szerint – az SOP ezt nem részletezi.', 'SOP 4.1.4');
      r.stage = 'done';
      return r;
    }
    r.path.push('Cardiorespiratorikusan stabil');
    if (s.presyncope) alert('info', 'Presyncope: a prognózis hasonló a syncopéhoz – ugyanolyan alapossággal kell vizsgálni és rizikóstratifikálni.', 'SOP 4.1.3');

    if (!s.tloc) { r.stage = 'start'; return r; }
    if (s.tloc === 'trauma') {
      r.category = 'OTHER';
      r.path.push('Fejtrauma okozta átmeneti eszméletvesztés');
      alert('warn', 'A trauma okozta eszméletvesztés nem ennek az eljárásrendnek a tárgya – a fejsérülés eljárásrend szerint vizsgálja.', 'SOP 1.');
      add('actions', 'Fejsérülés eljárásrend (SOP 17.) szerinti ellátás.', 'SOP 1.');
      r.stage = 'done';
      return r;
    }
    if (s.tloc === 'not_tloc') {
      r.category = 'OTHER';
      r.path.push('Nem átmeneti eszméletvesztés');
      add('actions', 'A tartós tudatzavar okának kivizsgálása – nem a syncope eljárásrend tárgya.', '4. ábra');
      r.stage = 'done';
      return r;
    }
    if (s.tloc === 'tloc_other') {
      r.category = 'OTHER';
      r.path.push('Átmeneti eszméletvesztés, nem syncope');
      add('actions', 'A valószínű ok (epilepsziás roham, pszichogén pseudosyncope / PNES, ritka ok: subclavian steal, vertebrobasilaris TIA, SAV) szerinti kivizsgálás.', 'SOP 2., 1. ábra');
      r.stage = 'done';
      return r;
    }
    // syncope
    if (s.leading === 'no') {
      r.category = 'OTHER';
      r.path.push('Syncope, de nem ez a vezető panasz');
      add('actions', 'A vezető panasz kivizsgálása és az alapbetegség kezelése (pl. nehézlégzéssel, mellkasi fájdalommal és syncopéval jelentkező pulmonális embólia).', 'SOP 4.1.5');
      r.stage = 'done';
      return r;
    }
    if (!s.leading) { r.stage = 'start'; return r; }
    r.path.push('Syncope mint vezető panasz');

    // Kezdeti vizsgálatok
    add('actions', 'Kezdeti vizsgálatok: alapos auto- és heteroanamnézis, fizikális vizsgálat, fekvő és álló vérnyomás folyamatos EKG-monitorozás mellett (aktív állás), 12 elvezetéses EKG.', 'SOP 4.1.1, 4. ábra');
    if (!r.as.done) alert('info', 'Aktív állás vizsgálat: vérnyomás és pulzus fekve, 0 perces és 3 perces állás után.', 'SOP 4.3');
    if (r.as.done && r.as.oh) alert('warn', 'Az aktív állás vizsgálat ortosztatikus hypotoniát mutat' + (r.as.reasons ? ': ' + r.as.reasons.join('; ') : '') + (r.ohCertainty ? ' – OH okozta syncope ' + r.ohCertainty + '.' : '.'), 'SOP 4.4');
    if (r.as.done && r.as.pots) alert('info', 'OH nélküli ortosztatikus pulzusemelkedés (>30/perc vagy >120/perc): POTS megfontolandó, ha a panaszokat reprodukálja.', 'SOP 4.4');
    if (r.csm.indicated && s['csm.result'] === undefined) {
      add('actions', 'Carotis sinus masszázs (40 év felett, feltételezett reflex mechanizmusú, ismeretlen etiológiájú syncope) – fekve és állva.' + (r.csm.cautions.length ? ' Óvatosan / elhagyható: ' + r.csm.cautions.join(', ') + '.' : ''), 'SOP 4.2');
    }
    if (r.csm.positive) {
      alert('warn', r.csm.dx === 'CSS' ? 'Pozitív CSM, reprodukált tünetekkel és korábbi syncopéval: carotis sinus szindróma (CSS).' : 'Pozitív CSM: carotis sinus hyperaesthesia (CSH) – tisztázatlan syncopéban nem specifikus lelet.', 'SOP 4.2');
    }
    if (s['x.arrhythmia']) add('actions', 'Azonnali EKG-monitorozás (aritmogén syncope gyanúja).', 'SOP 4.1.2');
    if (s['x.structural']) add('actions', 'Echokardiográfia (ismert vagy felmerülő strukturális szívbetegség, kardiovaszkuláris etiológia).', 'SOP 4.1.2');
    if (s['x.lab']) add('actions', 'Labor a klinikum függvényében (troponin ischaemiás szívbetegség, D-dimer PE gyanújánál, vérgáz hypoxiánál).', 'SOP 4.1.2');

    var cert = certainDx(s, r.as);
    r.certain = cert;
    if (s['cert.orthostatic'] && !(r.as.done && r.as.oh)) alert('warn', 'Ortosztatikus syncope csak akkor igazolható, ha jelentős ortosztatikus hypotonia ki is mutatható – töltse ki az aktív állás vizsgálatot.', 'SOP 4.5.1');
    cert.forEach(function (d) { r.workingDx.push({ text: d.text, ref: d.ref }); });
    if (r.csm.dx === 'CSS') r.workingDx.push({ text: 'Carotis sinus szindróma', ref: 'SOP 4.2' });
    if (cert.length) {
      r.path.push('Egyértelmű vagy erősen valószínű diagnózis');
      add('actions', 'Egyértelmű / erősen valószínű diagnózis: további vizsgálat nem szükséges, a kezelés megkezdhető.', 'SOP 4.5, 4. ábra');
    } else {
      // Felvethető diagnózisok (4.6)
      if (s['sug.reflex']) r.workingDx.push({ text: 'Reflex syncope felvethető', ref: 'SOP 4.6.1' });
      if (s['sug.orth']) r.workingDx.push({ text: 'Ortosztatikus syncope felvethető', ref: 'SOP 4.6.2' });
      if (s['sug.cardiac']) r.workingDx.push({ text: 'Kardiogén syncope felvethető', ref: 'SOP 4.6.3' });
    }

    // Rizikóbecslés
    var risk = riskLevel(s, r.as);
    r.risk = risk;
    var cardiac = cert.some(function (d) { return ['ARR', 'ISCH', 'STRUCT'].indexOf(d.code) >= 0; });
    var benignCertain = cert.length && !cardiac;
    if (!risk.level) {
      r.stage = cert.length ? 'risk' : (s.dxReviewed ? 'risk' : 'dx');
      if (benignCertain) alert('info', 'Reflex / ortosztatikus syncope csak akkor valószínűsíthető, ha kardiogén syncopéra utaló tényező nincs – nézze át a magas kockázati jegyeket.', 'SOP 4.5.1');
      return r;
    }
    var label = { low: 'Alacsony', intermediate: 'Közepes', high: 'Magas' }[risk.level];
    r.category = { low: 'LOW', intermediate: 'INTERMEDIATE', high: 'HIGH' }[risk.level];
    r.path.push(label + ' kockázat');

    if (risk.level === 'low') {
      if (!r.workingDx.length) r.workingDx.push({ text: 'Valószínűleg reflex, szituációs vagy ortosztatikus syncope', ref: 'SOP 6.1' });
      add('disposition', 'Alacsony kockázat: további sürgősségi kivizsgálás nem szükséges, a sürgősségi osztályról emittálható (egyéb kórképek, sérülések, szociális okok miatt felvétel lehet indokolt).', 'SOP 6.1, 4. ábra');
      add('actions', 'Betegtájékoztatás, megnyugtatás, betegoktatás, életmód-változtatás (provokáló tényezők kerülése, adekvát folyadék- és sóbevitel hypertonia hiányában), ellenmanőverek betanítása.', 'SOP 6.1, 7.');
      if (s['rf.present']) add('actions', 'Rizikófaktorok miatt járóbeteg-ellátásba (kardiológiai szakrendelés) irányítás.', 'SOP 6.1');
    } else if (risk.level === 'intermediate') {
      add('disposition', 'Közepes kockázat: hazabocsátás a primer vizsgálatok után nem javasolt; SBO-n monitorozás 12 órán át. Magas kockázatú, felvételt igénylő ok igazolódása esetén osztályos felvétel, ennek hiányában korai szakirányú járóbeteg-kivizsgálás.', 'SOP 6.2, 4. ábra');
      if (s['obs.result'] === 'high') add('disposition', 'Az obszerváció alatt magas kockázatú ok igazolódott: osztályos felvétel a diagnózis és kezelés céljából.', 'SOP 6.2');
      else if (s['obs.result'] === 'clear') add('disposition', 'Az obszerváció alatt magas kockázatra utaló eltérés nem igazolódott: korai szakirányú járóbeteg-kivizsgálásra irányítás.', 'SOP 6.2');
    } else {
      alert('danger', 'Magas kockázat: ' + risk.high.join('; ') + '.', 'SOP 5.2');
      add('disposition', 'Magas kockázat: monitorozás resuscitatiós készenlét mellett (jellemzően 6 óráig az SBO-n, legfeljebb 24 óráig kórházban), korai, gyors és intenzív kivizsgálás, sürgős kezelés, szükség esetén osztályos felvétel.', 'SOP 6.3, 4. ábra');
      var adm = picked(s, ADMIT);
      var obs = picked(s, OBSERVE);
      if (adm.length) add('disposition', 'Osztályos felvétel javasolt: ' + adm.join('; ') + '.', 'SOP 6.4.2');
      else if (obs.length) add('disposition', 'SBO fektetős obszerváció, monitorozás javasolt: ' + obs.join('; ') + '.', 'SOP 6.4.1');
    }
    if (risk.level !== 'low' && risk.low.length && !risk.high.length && !risk.mid.length && (s['l.physical'] !== 'yes' || s['l.ekg'] !== 'yes')) {
      alert('info', 'Alacsony kockázathoz negatív fizikális vizsgálat és eltérés nélküli EKG is szükséges.', 'SOP 5.1');
    }
    alert('info', 'Kockázatbecslő pontrendszerek (CSRS, EGSYS, San Francisco, OESIL, ROSE) önmagukban nem javasoltak a rizikóbecslésre.', 'SOP 5.4');
    r.stage = 'done';
    return r;
  }

  var OBSERVE = {
    'o.structural': 'stabil, ismert strukturális szívbetegség',
    'o.chronic': 'súlyos krónikus betegség',
    'o.position': 'syncope fekve vagy ülve, terhelés során',
    'o.palp': 'palpitáció a syncope alatt',
    'o.brady': 'inadekvát sinus bradycardia vagy SA-blokk',
    'o.device': 'beültethető eszköz diszfunkciójának gyanúja',
    'o.preexc': 'preexcitált QRS',
    'o.svt': 'SVT vagy paroxizmális PF',
    'o.inherited': 'öröklött aritmia szindrómára / ARVC-re típusos EKG',
  };
  var ADMIT = {
    'a.comorb': 'osztályos ellátást igénylő társbetegség',
    'a.injury': 'a syncope során keletkezett sérülés',
    'a.workup': 'sürgős kivizsgálás / kezelés, amely más módon nem szervezhető meg (EKG-monitor, echo, terheléses, EPS, angiográfia, eszközdiszfunkció)',
    'a.treatment': 'a kezeléshez osztályos felvétel szükséges',
    'a.recurrent': 'recurráló reflex syncope nagyon rövid vagy hiányzó prodromával (ILR)',
    'a.cardioinhib': 'kardioinhibitoros túlsúlyú reflex syncope (pacing / cardioneuroabláció)',
    'a.oh': 'OH, amelynél megfelelő volumenpótlás után is pozitív az aktív állás vizsgálat',
  };

  var api = {
    evaluate: evaluate, activeStanding: activeStanding, ohCertainty: ohCertainty, csm: csm, riskLevel: riskLevel, certainDx: certainDx,
    EKG_CERTAIN: EKG_CERTAIN, EKG_HIGH: EKG_HIGH, EKG_COND: EKG_COND, HIGH: HIGH, HIGH_HD: HIGH_HD, LOW: LOW, MID: MID, OBSERVE: OBSERVE, ADMIT: ADMIT,
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.SyncopeLogic = api;
})(typeof window !== 'undefined' ? window : this);
