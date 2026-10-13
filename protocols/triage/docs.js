/*
 * MSTR Triage – triázs jegyzőkönyv (szöveg és nyomtatható lap).
 * A formátum az SBC Portál prototípusáé (buildText / buildHtml) változatlan tartalommal:
 * betegazonosító helyett 6×3 cm-es etikett-mező, a lap alján kötelező klinikai figyelmeztetés.
 * Függ: TriageLogic. Böngészőben window.TriageDocs, Node-ban module.exports.
 */
(function (root) {
  'use strict';

  var L = (typeof module !== 'undefined' && module.exports) ? require('./logic.js') : root.TriageLogic;
  var LEVELS = L.LEVELS;
  var DASH = '—';
  var WARN_TEXT = 'Döntéstámogató eszközzel készült; a végső besorolás a triázs ápoló klinikai megítélésén alapul.';
  var WARN_PRINT = 'Döntéstámogató eszközzel készült. A végső triázs besorolás a triázs ápoló klinikai megítélésén alapul; kritikus állapotban az ellátás nem késleltethető.';

  function esc(t) {
    return String(t === undefined || t === null ? '' : t)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function raw(s, k) { return s[k] === undefined || s[k] === null || s[k] === '' ? '' : String(s[k]); }
  function fmtTime(v) { return v ? String(v).replace('T', ' ') : DASH; }

  function nowLocal(d) {
    d = d || new Date();
    var p = function (n) { return String(n).padStart(2, '0'); };
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + 'T' + p(d.getHours()) + ':' + p(d.getMinutes());
  }

  function gcsStr(v) { return v.gcs ? v.gcs.total + ' (Sz' + v.gcs.e + ' V' + v.gcs.v + ' M' + v.gcs.m + ')' : '–'; }

  function paramPairs(s, r) {
    var d = function (k) { return raw(s, k) || '–'; };
    return [
      ['Pulzus', d('v.hr') + ' /min'], ['Légzésszám', d('v.rr') + ' /min'],
      ['Vérnyomás', d('v.sys') + '/' + d('v.dia') + ' Hgmm'], ['Szaturáció', d('v.spo2') + ' %'],
      ['Testhő', d('v.temp') + ' °C'], ['GCS', gcsStr(r.v)], ['Fájdalom (VAS)', d('v.pain')], ['SIRS', r.v.sirs + '/4'],
    ];
  }

  function dispoList(s, r) {
    var d = [];
    if (s.fasttrack) d.push('FAST TRACK vizsgáló');
    if (r.konz.length) d.push('Konzílium: ' + r.konz.join(', '));
    return d;
  }

  function levelLine(r) {
    return r.level ? 'MSTR ' + r.level + ' – ' + LEVELS[r.level].name + ' (újraértékelés: ' + LEVELS[r.level].reassess + ')' : 'Nincs megállapítva';
  }

  // Szöveges jegyzőkönyv – a prototípus buildText() kimenetével azonos sorrend és megfogalmazás
  function text(s, r) {
    var disp = dispoList(s, r);
    return ['TRIÁZS JEGYZŐKÖNYV – Honvédkórház, Sürgősségi Centrum',
      'Időpont: ' + fmtTime(s.time),
      'Beteg azonosító: (etikett)',
      'Érkezés módja: ' + (raw(s, 'arrival') || DASH),
      'Vezető panasz: ' + (raw(s, 'complaint') || DASH),
      '',
      'Vitális paraméterek:']
      .concat(paramPairs(s, r).map(function (p) { return '  ' + p[0] + ': ' + p[1]; }))
      .concat(['',
        'MEGÁLLAPÍTOTT TRIÁZS SZINT: ' + levelLine(r),
        r.driver ? 'Meghatározó tényező: ' + r.driver.label : '',
        '',
        'Rögzített tényezők:',
        r.factors.length ? r.factors.map(function (f) { return '  • [MSTR ' + f.level + '] ' + f.label; }).join('\n') : '  • ' + DASH,
        '',
        'Diszpozíció: ' + (disp.length ? disp.join(' · ') : DASH),
        '',
        'Esemény leírása:',
        raw(s, 'narr') || '  ' + DASH,
        '',
        'Triázs ápoló: ' + (raw(s, 'nurse') || DASH),
        '',
        WARN_TEXT]).join('\n');
  }

  // Rövid, egysoros változat (pl. az ambuláns lap „Jelen panasz” rovatába)
  function shortLine(s, r) {
    var v = r.v;
    return 'Triázs' + (s.time ? ' (' + fmtTime(s.time) + ')' : '') + ': ' + (r.level ? 'MSTR ' + r.level + ' – ' + LEVELS[r.level].name : 'nincs megállapítva') +
      (r.driver ? '; meghatározó: ' + r.driver.label : '') +
      '. Vezető panasz: ' + (raw(s, 'complaint') || DASH) +
      '. P ' + (raw(s, 'v.hr') || '–') + '/min · L ' + (raw(s, 'v.rr') || '–') + '/min · RR ' + (raw(s, 'v.sys') || '–') + '/' + (raw(s, 'v.dia') || '–') +
      ' Hgmm · SpO₂ ' + (raw(s, 'v.spo2') || '–') + '% · ' + (raw(s, 'v.temp') || '–') + '°C · GCS ' + gcsStr(v) + ' · VAS ' + (raw(s, 'v.pain') || '–') + ' · SIRS ' + v.sirs + '/4.';
  }

  function sections(s, r) {
    return [
      { id: 'jkv', title: 'Triázs jegyzőkönyv', text: text(s, r) },
      { id: 'short', title: 'Rövid összefoglaló (egy sor)', text: shortLine(s, r) },
    ];
  }

  // Nyomtatható lap – a prototípus buildHtml() elrendezése (etikett-mező, szintdoboz, paraméter-rács, aláírás, figyelmeztetés)
  function html(s, r, opts) {
    opts = opts || {};
    var lvl = r.level ? LEVELS[r.level] : null;
    var factorRows = r.factors.length ? r.factors.map(function (f) {
      return '<tr><td style="width:72px"><span style="display:inline-block;min-width:48px;text-align:center;padding:2px 6px;border-radius:10px;font-weight:700;white-space:nowrap;background:' + LEVELS[f.level].hex + ';color:' + LEVELS[f.level].fg + '">MSTR ' + f.level + '</span></td><td>' + esc(f.label) + '</td></tr>';
    }).join('') : '<tr><td colspan="2" style="color:#888">—</td></tr>';
    var paramCells = paramPairs(s, r).map(function (p) { return '<div class="param"><div class="pl">' + esc(p[0]) + '</div><div class="pv">' + esc(p[1]) + '</div></div>'; }).join('');
    var disp = dispoList(s, r).map(esc);
    var dispHtml = disp.length ? disp.join(' &nbsp;·&nbsp; ') : DASH;
    return '<!doctype html><html lang="hu"><head><meta charset="utf-8"><title>Triázs jegyzőkönyv</title><style>*{box-sizing:border-box}body{font-family:Arial,sans-serif;color:#1f2937;margin:0;padding:28px;font-size:13px;line-height:1.5}h1{font-size:18px;margin:0}.sub{color:#6b7280;font-size:12px;margin:2px 0 0}.head{display:flex;justify-content:space-between;align-items:flex-start;gap:16px}.label-box{flex:0 0 auto;width:6cm;height:3cm;border:1.5px dashed #9ca3af;border-radius:6px;display:flex;align-items:center;justify-content:center;text-align:center;color:#9ca3af;font-size:10px;padding:4px}.metarow{margin:14px 0 4px;color:#374151}.metarow b{color:#111}.sec-title{font-weight:700;font-size:12px;text-transform:uppercase;letter-spacing:.04em;color:#374151;margin:18px 0 6px;border-bottom:2px solid #111;padding-bottom:4px}.params{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.param{border:1px solid #e5e7eb;border-radius:8px;padding:6px 8px}.param .pl{font-size:10px;color:#6b7280;text-transform:uppercase;letter-spacing:.03em}.param .pv{font-size:15px;font-weight:700;margin-top:1px}.levelbox{margin:16px 0;padding:14px 16px;border-radius:10px;background:' + (lvl ? lvl.hex : '#e5e7eb') + ';color:' + (lvl ? lvl.fg : '#111') + ';-webkit-print-color-adjust:exact;print-color-adjust:exact}.levelbox .big{font-size:20px;font-weight:800}table{width:100%;border-collapse:collapse;margin-top:4px}td{padding:4px 6px;border-bottom:1px solid #eee;vertical-align:top}td span{-webkit-print-color-adjust:exact;print-color-adjust:exact}.dispo{border:1px solid #cbd5e1;background:#f8fafc;border-radius:8px;padding:10px 12px;font-weight:600}.narr{white-space:pre-wrap;border:1px solid #e5e7eb;border-radius:8px;padding:10px;min-height:46px}.foot{margin-top:22px;color:#6b7280;font-size:11px;border-top:1px solid #e5e7eb;padding-top:10px}.sign{margin-top:26px;display:flex;justify-content:space-between}.sign div{border-top:1px solid #9ca3af;padding-top:4px;width:45%;text-align:center;color:#6b7280;font-size:11px}@media print{body{padding:14px}}</style></head><body>' +
      '<div class="head"><div><h1>Triázs jegyzőkönyv</h1><div class="sub">Honvédkórház – Sürgősségi Centrum · MSTR (felnőtt)</div></div><div class="label-box">Beteg azonosító<br>etikett helye<br>(6 × 3 cm)</div></div>' +
      '<div class="metarow">Időpont: <b>' + esc(fmtTime(s.time)) + '</b> &nbsp;·&nbsp; Érkezés módja: <b>' + (esc(raw(s, 'arrival')) || DASH) + '</b> &nbsp;·&nbsp; Vezető panasz: <b>' + (esc(raw(s, 'complaint')) || DASH) + '</b></div>' +
      '<div class="sec-title">Vitális paraméterek</div><div class="params">' + paramCells + '</div>' +
      '<div class="levelbox"><div style="font-size:11px;text-transform:uppercase;opacity:.85">Megállapított triázs szint</div><div class="big">' + (lvl ? 'MSTR ' + r.level + ' · ' + esc(lvl.name) : 'Nincs megállapítva') + '</div>' +
      (lvl ? '<div style="font-size:12px;opacity:.9;margin-top:2px">Újraértékelés: ' + esc(lvl.reassess) + (r.driver ? ' · Meghatározó: ' + esc(r.driver.label) : '') + '</div>' : '') + '</div>' +
      '<div class="sec-title">Rögzített tényezők</div><table>' + factorRows + '</table>' +
      '<div class="sec-title">Diszpozíció</div><div class="dispo">' + dispHtml + '</div>' +
      '<div class="sec-title">Esemény leírása</div><div class="narr">' + (esc(raw(s, 'narr')) || DASH) + '</div>' +
      '<div class="sign"><div>Triázs ápoló: ' + (esc(raw(s, 'nurse')) || '&nbsp;') + '</div><div>Dátum / aláírás</div></div>' +
      '<div class="foot">' + WARN_PRINT + '</div>' +
      (opts.autoPrint ? '<scr' + 'ipt>window.onload=function(){setTimeout(function(){window.print()},250)}</scr' + 'ipt>' : '') +
      '</body></html>';
  }

  function fileName(s) { return 'triazs_' + String(s.time || nowLocal()).replace(/[:T ]/g, '-') + '.html'; }

  var api = { text: text, shortLine: shortLine, sections: sections, html: html, fileName: fileName, nowLocal: nowLocal, fmtTime: fmtTime, WARN_TEXT: WARN_TEXT, WARN_PRINT: WARN_PRINT };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.TriageDocs = api;
})(typeof window !== 'undefined' ? window : this);
