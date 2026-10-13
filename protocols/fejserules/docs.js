/*
 * Ambuláns lapba illeszthető szövegrészek – fejsérülés / intracranialis vérzés.
 * Elv: csak a megadott adatokból állít; „negál” csak kifejezett nemleges válasznál; hiány helyén „___”.
 */
(function (root) {
  'use strict';

  var SBO = root.SBO || (typeof require === 'function' ? require('../../js/core/registry.js') : null);
  var T = SBO.text;
  var B = T.BLANK;

  var PUP = { eq: 'Pupillák egyenlők, fényre jól reagálnak.', aniso: 'Anisocoria.', fixed: 'Fénymerev, tág pupilla(k).' };
  var CTTYPE = { 'ct.edh': 'epiduralis vérzés', 'ct.sdh': 'subduralis vérzés', 'ct.sah': 'subarachnoidealis vérzés', 'ct.iph': 'intraparenchymalis vérzés / contusio', 'ct.ivh': 'intraventricularis vérzés', 'ct.fx': 'koponyatörés' };

  function gcsText(s, r) {
    var g = r.gcs;
    return g && g.complete ? 'GCS: ' + g.total + ' (E' + g.e + ' V' + g.v + ' M' + g.m + ')' : 'GCS: ' + B;
  }

  function complaint(s) {
    var t = [];
    if (s.etiology === 'nontrauma') {
      t.push('Panaszai kezdete: ' + T.or(T.val(s, 'hx.onset')) + '.');
      if (T.val(s, 'hx.symptoms')) t.push(T.cap(T.val(s, 'hx.symptoms')) + '.');
      if (s['sp.anticoag'] === 'vka' || s['sp.anticoag'] === 'noac') t.push('Antikoaguláns terápiában részesül (' + (s['sp.anticoag'] === 'vka' ? 'K-vitamin-antagonista' : 'NOAC') + (T.val(s, 'ac.drug') ? ': ' + T.val(s, 'ac.drug') : '') + ').');
      return t.join(' ');
    }
    var first = (T.val(s, 'inj.time') ? T.val(s, 'inj.time') + ' ' : '') + (T.val(s, 'inj.mech') ? T.val(s, 'inj.mech') + ' következtében elszenvedett ' : '') + 'fejsérülés miatt jelentkezett.';
    t.push(T.cap(first));
    if (s['mr.loc']) t.push('Eszméletvesztése volt.');
    else if (s['loc.no'] === 'yes') t.push('Eszméletvesztése nem volt.');
    if (s['mr.pta']) t.push('Poszttraumás amnézia áll fenn.');
    var v = Number(s['vomit.n'] || 0);
    if (v > 0) t.push(v + ' alkalommal hányt.');
    else if (s['vomit.n'] === '0') t.push('Hányása nem volt.');
    if (s['mr.headache']) t.push('Progresszív / elviselhetetlen fejfájást, zavartságot jelez.');
    if (s['mr.seizure']) t.push('Epilepsziás görcs / arra utaló adat.');
    if (s['mr.intox']) t.push('Alkohol- / drogintoxikáció felmerül.');
    if (s['sp.anticoag'] === 'vka' || s['sp.anticoag'] === 'noac') t.push('Antikoaguláns terápiában részesül (' + (s['sp.anticoag'] === 'vka' ? 'K-vitamin-antagonista' : 'NOAC') + (T.val(s, 'ac.drug') ? ': ' + T.val(s, 'ac.drug') : '') + ').');
    else if (s['sp.anticoag'] === 'none') t.push('Antikoagulánst nem szed.');
    if (s['sp.tag'] === 'yes') t.push('Thrombocytaaggregáció-gátlót szed' + (T.val(s, 'tag.drug') ? ' (' + T.val(s, 'tag.drug') + ')' : '') + '.');
    else if (s['sp.tag'] === 'no') t.push('Thrombocytaaggregáció-gátlót nem szed.');
    return t.join(' ');
  }

  function status(s, r) {
    var L = [T.vitalsLine(s)];
    var d = [gcsText(s, r) + '.'];
    if (s.pupils) d.push(PUP[s.pupils]);
    if (s['mr.focal'] || s['hr.neuro']) d.push('Fokális neurológiai jel: ' + B + '.');
    else if (s['neuro.nofocal'] === 'yes') d.push('Durva neurológiai gócjel nem észlelhető.');
    L.push(d.join(' '));
    if (T.val(s, 'inj.wound')) L.push('Külsérelmi nyom: ' + T.val(s, 'inj.wound') + '.');
    if (s['mr.basal']) L.push('Koponyaalapi törés fizikális jele: ' + B + '.');
    if (T.val(s, 'inr')) L.push('INR: ' + T.val(s, 'inr'));
    L.push('Labor: ' + T.or(T.val(s, 'lab.text')));
    return L.join('\n');
  }

  function imaging(s) {
    if (!s['ct.result']) return 'Koponya CT: ' + B;
    if (s['ct.result'] === 'neg') return 'Non-contrast koponya CT: intracranialis vérzés, traumás eltérés nem ábrázolódott.' + (T.val(s, 'ct.text') ? ' ' + T.val(s, 'ct.text') : '');
    var types = Object.keys(CTTYPE).filter(function (k) { return s[k]; }).map(function (k) { return CTTYPE[k]; });
    return 'Non-contrast koponya CT: ' + (types.length ? types.join(', ') : 'intracranialis vérzés / traumás eltérés') + ' ábrázolódott.' + (T.val(s, 'ct.text') ? ' ' + T.val(s, 'ct.text') : ' Részletek: ' + B + '.');
  }

  function epicrisis(s, r) {
    var t = [];
    if (s.etiology === 'nontrauma') {
      t.push('A fentebb részletezett anamnézisű beteget intracranialis vérzés miatt vizsgáltuk ambulanciánkon.');
      t.push(imaging(s));
      if (r.workingDx.length) t.push('A CT alapján ' + r.workingDx[0].text.charAt(0).toLowerCase() + r.workingDx[0].text.slice(1) + ' igazolódott.');
      if (s['nt.large'] === 'yes') t.push('Nagyméretű / sebészileg hozzáférhető vérzés, illetve hydrocephalus miatt idegsebészeti konzultáció történt: ' + B + '.');
      t.push('További ellátása: ' + (r.disposition.length ? r.disposition.map(function (d) { return d.text; }).join(' ') : B) + ' Elhelyezés: ' + B + '.');
      return t.join(' ');
    }
    t.push('Mai napon fejsérülés miatt jelentkezett ambulanciánkon.');
    if (r.risk && r.risk.level) t.push('Az SOP szerinti besorolás alapján ' + { low: 'alacsony', moderate: 'közepes', high: 'magas' }[r.risk.level] + ' kockázatú fejsérült.');
    if (s.critical === 'no') t.push('Vizsgálóba érkezéskor cardiorespiratorikusan stabil.');
    if (s['ct.result']) t.push(imaging(s));
    else if (r.risk && r.risk.level === 'low') t.push('Alacsony kockázatú sérülés miatt koponya CT nem volt indokolt.');
    if (s['ct.result'] === 'pos') {
      t.push('Idegsebészeti konzílium véleménye: ' + T.or(T.val(s, 'ns.text')) + '.');
      var dec = { op: 'műtőbe kerül', ito: 'intenzív osztályra kerül', obs: 'SBO fektető részlegen obszerváljuk', other: 'elhelyezése egyeztetés alatt' }[s['ns.decision']];
      t.push(dec ? 'A konzílium alapján ' + dec + '.' : 'Elhelyezés: ' + B + '.');
      return t.join(' ');
    }
    if (r.special && r.special.obs12 && s['obs.result'] === 'free') t.push('12 órás obszervációnk során a beteg cardiorespiratorikusan mindvégig stabil és panaszmentes volt.');
    else if (r.risk && r.risk.level === 'high' && r.discharge) t.push('Obszervációnk során a beteg cardiorespiratorikusan mindvégig stabil, tünetei megszűntek.');
    if (r.discharge) {
      t.push('További akut teendő hiányában, jó általános állapotban otthonába bocsátjuk.');
      t.push(s['leaflet.given'] ? 'A fejsérülteknek szóló tájékoztatót megkapta.' : 'Fejsérülteknek szóló tájékoztató átadása: ' + B + '.');
    } else if (r.disposition.length) {
      t.push('További ellátása: ' + r.disposition.map(function (d) { return d.text; }).join(' '));
    }
    return t.join(' ');
  }

  function advice(s, r) {
    var J = [];
    if (s.etiology === 'trauma' && r.discharge) {
      J.push('Következő 48 órában ne maradjon egyedül, felügyelete biztosított legyen.');
      var anticoag = s['sp.anticoag'] === 'vka' || s['sp.anticoag'] === 'noac' || s['sp.tag'] === 'yes';
      J.push('24 órán át paracetamolnál erősebb fájdalomcsillapítót ne vegyen be; nem-szteroid gyulladáscsökkentőt ne szedjen' +
        (anticoag ? '' : ', vérhígító szert ne szedjen') + ', alkoholt ne fogyasszon, néhány napig kerülje a szellemi / fizikai terhelést.');
      // Antikoagulált / TAG-gátlót szedő betegnél a tájékoztató általános tanácsa nem alkalmazható automatikusan
      if (anticoag) J.push('Alvadásgátló / thrombocytaaggregáció-gátló gyógyszerének további szedése: ' + B + '.');
      J.push('Haladéktalanul jelentkezzen ismét, ha: ' + (root.HeadInjuryContent || (typeof require === 'function' ? require('./content.js') : { LEAFLET_WARNINGS: [] })).LEAFLET_WARNINGS.join('; ') + '.');
      J.push('Ambuláns leleteivel mielőbb keresse fel háziorvosát.');
    } else {
      J.push('Az idegsebészeti konzílium / fogadó osztály javaslata szerint: ' + B + '.');
    }
    return J.map(function (j) { return '- ' + j; }).join('\n');
  }

  // BNO-10 javaslat (WHO ICD-10) – ellenőrizendő
  function bno(s, r) {
    var out = [];
    if (s.etiology === 'nontrauma') {
      if (s['nt.type'] === 'deep') out.push('I61.0 Agyvérzés a féltekében, subcorticalis');
      if (s['nt.type'] === 'lobar') out.push('I61.1 Agyvérzés a féltekében, corticalis');
      if (s['nt.type'] === 'sah') out.push('I60.9 Subarachnoidealis vérzés, k.m.n.');
      return out;
    }
    if (s['ct.result'] === 'pos') {
      if (s['ct.edh']) out.push('S06.4 Epiduralis vérzés');
      if (s['ct.sdh']) out.push('S06.5 Traumás subduralis vérzés');
      if (s['ct.sah']) out.push('S06.6 Traumás subarachnoidealis vérzés');
      if (s['ct.iph']) out.push('S06.3 Körülírt agysérülés');
    }
    if (!out.length && s.etiology === 'trauma') out.push(s['mr.loc'] ? 'S06.0 Agyrázkódás' : 'S09.9 A fej k.m.n. sérülése');
    return out;
  }

  function diagnosis(s, r) {
    var dx = r.workingDx.map(function (d) { return d.text; });
    var b = bno(s, r);
    return (dx.length ? dx.join('; ') : B) + (b.length ? '\nBNO-javaslat (ellenőrizendő): ' + b.join(', ') : '');
  }

  function sections(s, r) {
    s = s || {};
    return [
      { id: 'complaint', title: 'Jelen panasz', text: complaint(s) },
      { id: 'status', title: 'Status', text: status(s, r) },
      { id: 'imaging', title: 'Képalkotás', text: imaging(s) },
      { id: 'epicrisis', title: 'Epikrízis', text: epicrisis(s, r) },
      { id: 'dx', title: 'Diagnózis', text: diagnosis(s, r) },
      { id: 'advice', title: 'Javaslat', text: advice(s, r) },
    ];
  }

  var api = { sections: sections, bno: bno };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.HeadInjuryDocs = api;
})(typeof window !== 'undefined' ? window : this);
