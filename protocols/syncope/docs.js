/*
 * Ambuláns lapba illeszthető szövegrészek – syncope.
 * Elv: csak a megadott adatokból állít; „negál” csak kifejezett nemleges válasznál; hiány helyén „___”.
 */
(function (root) {
  'use strict';

  var SBO = root.SBO || (typeof require === 'function' ? require('../../js/core/registry.js') : null);
  var C = root.SyncopeContent || (typeof require === 'function' ? require('./content.js') : null);
  var T = SBO.text;
  var B = T.BLANK;

  var POS = { standing: 'állás közben', sitting: 'ülő helyzetben', supine: 'fekvő helyzetben', exertion: 'fizikai terhelés alatt' };
  var PRO = { typical: 'típusos prodroma (sápadtság, verejtékezés, hányinger) előzte meg', short: 'rövid (<10 mp) prodroma előzte meg', none: 'előzetes tünet nélkül jelentkezett' };

  function yn(s, k, yesTxt, noTxt) { return s[k] === 'yes' ? yesTxt : s[k] === 'no' ? noTxt : null; }

  function complaint(s) {
    var t = [];
    t.push('Eszméletvesztés miatt jelentkezett' + (T.val(s, 'syn.when') ? ', ' + T.val(s, 'syn.when') : '') + '.');
    if (s.presyncope) t.push('Eszméletvesztés nem történt, presyncopés panaszokkal érkezett.');
    var c = [];
    if (s['syn.position']) c.push('A rosszullét ' + POS[s['syn.position']] + ' jelentkezett');
    if (T.val(s, 'syn.trigger')) c.push('kiváltó tényező: ' + T.val(s, 'syn.trigger'));
    if (c.length) t.push(c.join(', ') + '.');
    if (s['syn.prodrome']) t.push(T.cap(PRO[s['syn.prodrome']]) + '.');
    if (T.val(s, 'syn.duration')) t.push('Az eszméletvesztés időtartama: ' + T.val(s, 'syn.duration') + '.');
    if (T.val(s, 'syn.recovery')) t.push('Magához térés: ' + T.val(s, 'syn.recovery') + '.');
    var w = yn(s, 'syn.witness', 'Heteroanamnézis (szemtanú) elérhető.', 'Szemtanú nem volt.');
    if (w) t.push(w);
    [['syn.palp', 'Palpitációt jelez.', 'Palpitációt negál.'], ['syn.chest', 'Mellkasi fájdalmat jelez.', 'Mellkasi fájdalmat negál.'],
      ['syn.dyspnea', 'Nehézlégzést jelez.', 'Nehézlégzést negál.'], ['syn.injury', 'A rosszullét során sérülés érte.', 'Sérülés nem érte.'],
      ['syn.tongue', 'Nyelvharapás történt.', 'Nyelvharapás nem történt.'], ['syn.incont', 'Inkontinencia volt.', 'Inkontinencia nem volt.'],
      ['hx.prevSyncope', 'Korábban is volt eszméletvesztése.', 'Korábban eszméletvesztése nem volt.']].forEach(function (x) {
      var v = yn(s, x[0], x[1], x[2]); if (v) t.push(v);
    });
    if (s['hd.family']) t.push('Családi anamnézisében fiatalkori hirtelen szívhalál szerepel.');
    if (s['h.structural']) t.push('Anamnézisében súlyos strukturális szív- vagy koronáriabetegség szerepel.');
    if (T.val(s, 'syn.drugs')) t.push('Gyógyszerei / gyógyszermódosítás: ' + T.val(s, 'syn.drugs') + '.');
    return t.join(' ');
  }

  function status(s, r) {
    var L = [T.vitalsLine(s)];
    var a = r.as;
    if (a && a.done) {
      if (a.manual) L.push('Aktív állás vizsgálat: ' + (a.notDone ? 'nem volt elvégezhető.' : a.oh ? 'pozitív.' : 'negatív.'));
      else {
        var p = function (sys, dia, hr) { return (T.val(s, sys) || B) + '/' + (T.val(s, dia) || B) + ' Hgmm' + (T.val(s, hr) ? ', P: ' + T.val(s, hr) + '/min' : ''); };
        var line = 'Aktív állás vizsgálat: fekve ' + p('as.supSys', 'as.supDia', 'as.supHr') + '; 0 perc ' + p('as.0Sys', 'as.0Dia', 'as.0Hr');
        if (T.val(s, 'as.3Sys')) line += '; 3 perc ' + p('as.3Sys', 'as.3Dia', 'as.3Hr');
        line += ' – ' + (a.oh ? 'ortosztatikus hypotonia' + (r.ohCertainty ? ' (OH okozta syncope ' + r.ohCertainty + ')' : '') : a.pots ? 'OH nélküli ortosztatikus pulzusemelkedés' : 'negatív') + '.';
        L.push(line);
      }
    }
    if (s['csm.result'] === 'pos') L.push('Carotis sinus masszázs: pozitív' + (r.csm.dx === 'CSS' ? ', a panaszok reprodukálódtak (carotis sinus szindróma).' : ' (carotis sinus hyperaesthesia).'));
    else if (s['csm.result'] === 'neg') L.push('Carotis sinus masszázs: negatív.');
    if (s['ex.physical'] === 'yes') L.push('Fizikális vizsgálat során kóros eltérés nem észlelhető.');
    L.push('EKG: ' + T.or(T.val(s, 'ekg.text')));
    L.push('Labor: ' + T.or(T.val(s, 'lab.text')));
    return L.join('\n');
  }

  function cause(r) {
    var codes = (r.certain || []).map(function (d) { return d.code; });
    if (codes.indexOf('VVS') >= 0) return 'vasovagalis syncope';
    if (codes.indexOf('SIT') >= 0) return 'szituációs syncope';
    if (codes.indexOf('OH') >= 0) return 'ortosztatikus syncope';
    if (r.workingDx.some(function (d) { return /Reflex/.test(d.text); })) return 'reflex syncope';
    if (r.workingDx.some(function (d) { return /Ortosztatikus/.test(d.text); })) return 'ortosztatikus syncope';
    return 'benignus (reflex / szituációs / ortosztatikus) syncope';
  }

  function epicrisis(s, r) {
    var t = ['A fentebb részletezett anamnézisű beteget ' + (s.presyncope ? 'presyncope' : 'eszméletvesztés') + ' miatt vizsgáltuk ambulanciánkon.'];
    if (s.unstable === 'no') t.push('A beteg vizsgálóba érkezéskor stabil vitális paraméterekkel rendelkezett.');
    if (s['ex.physical'] === 'yes') t.push('Fizikális vizsgálata során alarmírozó eltérést nem észleltem.');
    if (s['ekg.normal'] === 'yes') t.push('EKG-n kóros eltérést nem láttam.');
    else if (T.val(s, 'ekg.text')) t.push('EKG: ' + T.val(s, 'ekg.text') + '.');
    if (r.as && r.as.done && !r.as.notDone) t.push('Az aktív állás vizsgálat ' + (r.as.oh ? 'ortosztatikus hypotoniát igazolt.' : 'negatív volt.'));
    if (r.category === 'OTHER') {
      t.push('További ellátása: ' + (r.actions.length ? r.actions.map(function (a) { return a.text; }).join(' ') : B));
      return t.join(' ');
    }
    if (r.certain && r.certain.length) t.push('A kezdeti vizsgálatok alapján ' + r.certain.map(function (d) { return d.text.charAt(0).toLowerCase() + d.text.slice(1); }).join(', ') + ' állapítható meg.');
    if (r.risk && r.risk.level === 'low') {
      t.push('A rizikóbecslés alapján alacsony kockázatú syncope. Kivizsgálásunk eredményeként sürgősségi teendőt igénylő elváltozást nem észleltünk, panaszai hátterében ' + cause(r) + ' feltételezhető.');
      t.push('Sürgősségi teendő hiányában, jó általános állapotban, javaslatokkal ellátva otthonába emittáljuk.');
    } else if (r.risk && r.risk.level === 'intermediate') {
      t.push('A rizikóbecslés alapján közepes kockázatú syncope, ezért 12 órás SBO-monitorozás történt' + (s['obs.result'] === 'clear' ? ', mely során magas kockázatra utaló eltérés nem igazolódott.' : s['obs.result'] === 'high' ? ', mely során magas kockázatú ok igazolódott: ' + B + '.' : ': ' + B + '.'));
      if (s['obs.result'] === 'clear') t.push('Jó általános állapotban, korai szakirányú járóbeteg-kivizsgálás javaslatával otthonába emittáljuk.');
      else if (s['obs.result'] === 'high') t.push('Osztályos felvétel a diagnózis és kezelés céljából: ' + B + '.');
    } else if (r.risk && r.risk.level === 'high') {
      t.push('A rizikóbecslés alapján magas kockázatú syncope (' + r.risk.high.join('; ') + '). Monitorozás resuscitatiós készenlét mellett, további ellátása: ' + B + '.');
    }
    return t.join(' ');
  }

  function advice(s, r) {
    var J = [];
    var discharge = (r.risk && r.risk.level === 'low') || (r.risk && r.risk.level === 'intermediate' && s['obs.result'] === 'clear');
    if (discharge) {
      if (r.risk.level === 'low') {
        J.push('Ájulásérzés esetén azonnal feküdjön le és emelje meg a lábait, vagy üljön le; alkalmazza a betanított ellenmanővereket: ' + C.COUNTER.map(function (c) { return c.name.toLowerCase(); }).join(', ') + '.');
        J.push('Kerülje a provokáló tényezőket (tartós állás, zsúfolt, meleg hely).');
        J.push(s['htn'] === 'yes' ? 'Folyadék- és sóbevitel a hypertonia miatt egyéni mérlegelés szerint.' : 'Bőséges folyadékfogyasztás (2–3 liter) és sóban gazdagabb étrend (kb. 10 g só naponta), ha orvosi okból nem szükséges sómegszorítás.');
        if (s['rf.present']) J.push('Rizikófaktorai miatt kardiológiai szakrendelés felkeresése javasolt.');
      } else {
        J.push('Korai szakirányú (kardiológiai / syncope) járóbeteg-kivizsgálás.');
      }
      J.push('Háziorvosánál kontroll céljából jelentkezzen.');
    } else if (r.category) {
      J.push('A konzílium / fogadó osztály javaslata szerint: ' + B + '.');
    }
    J.push('Ismételt eszméletvesztés, mellkasi fájdalom, nehézlégzés, szívdobogásérzés vagy állapotrosszabbodás esetén a legközelebbi sürgősségi osztályon jelentkezzen.');
    return J.map(function (j) { return '- ' + j; }).join('\n');
  }

  // BNO-10 javaslat (WHO ICD-10) – ellenőrizendő
  function bno(s, r) {
    var codes = (r.certain || []).map(function (d) { return d.code; });
    if (codes.indexOf('OH') >= 0) return ['I95.1 Orthostaticus hypotonia'];
    if (r.csm && r.csm.dx === 'CSS') return ['G90.0 Idiopathiás perifériás autonóm neuropathia (carotis sinus syncope)'];
    if (codes.indexOf('ARR') >= 0 || codes.indexOf('ISCH') >= 0 || codes.indexOf('STRUCT') >= 0) return ['a kiváltó kórkép szerint (pl. I44.1 / I44.2 AV-blokk)', 'R55 Ájulás és összeesés'];
    return r.category && r.category !== 'UNSTABLE' ? ['R55 Ájulás és összeesés'] : [];
  }

  function sections(s, r) {
    s = s || {};
    var dx = r.workingDx.map(function (d) { return d.text; });
    var b = bno(s, r);
    return [
      { id: 'complaint', title: 'Jelen panasz', text: complaint(s) },
      { id: 'status', title: 'Status', text: status(s, r) },
      { id: 'epicrisis', title: 'Epikrízis', text: epicrisis(s, r) },
      { id: 'dx', title: 'Diagnózis', text: (dx.length ? dx.join('; ') : B) + (b.length ? '\nBNO-javaslat (ellenőrizendő): ' + b.join(', ') : '') },
      { id: 'advice', title: 'Javaslat', text: advice(s, r) },
    ];
  }

  var api = { sections: sections, bno: bno };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.SyncopeDocs = api;
})(typeof window !== 'undefined' ? window : this);
