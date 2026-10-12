/*
 * SABLON egy új eljárásrend-modulhoz. Nincs betöltve az index.html-ben – másolja le
 * a protocols/<uj-azonosito>/ mappába, töltse ki, majd vegye fel a szkriptet az index.html-be.
 * Részletes leírás: docs/UJ_ELJARASREND.md
 *
 * Az alábbi példa egy működő, 3 lépéses minimális protokoll (kitalált tartalommal, csak szerkezeti minta).
 */
(function (root) {
  'use strict';

  var SBO = root.SBO;

  /* ------------------------------------------------------------------ */
  /* 1. Döntési logika: tiszta függvény, állapot → eredmény.            */
  /*    Minden következtetés mellé `ref`: az SOP fejezete / ábrája.     */
  /* ------------------------------------------------------------------ */
  function evaluate(s) {
    s = s || {};
    var r = { category: null, stage: 'start', path: [], alerts: [], workingDx: [], actions: [], disposition: [], differentials: [] };
    if (!s.stable) return r;                                   // a következő megválaszolandó lépés: 'start'
    if (s.stable === 'no') {
      r.category = 'UNSTABLE';
      r.path.push('Instabil');
      r.alerts.push({ level: 'danger', text: 'Ellátás ABCDE szerint.', ref: 'SOP 5.1' });
      r.stage = 'done';
      return r;
    }
    r.path.push('Stabil');
    if (!s.finding) { r.stage = 'exam'; return r; }
    r.category = s.finding === 'a' ? 'A' : 'B';
    r.path.push('Lelet: ' + (s.finding === 'a' ? 'A' : 'B'));
    r.workingDx.push({ text: 'Példa munkadiagnózis ' + r.category, ref: 'SOP 6.' });
    r.actions.push({ text: 'Példa teendő', ref: 'SOP 7.' });
    r.disposition.push({ text: 'Példa diszpozíció', ref: 'SOP 9.' });
    r.stage = 'done';
    return r;
  }

  /* ------------------------------------------------------------------ */
  /* 2. Dokumentáció: részenként másolható szöveg az ambuláns lapba.    */
  /*    Csak a megadott adatokból állítson; hiány helyén SBO.text.BLANK */
  /* ------------------------------------------------------------------ */
  function docSections(s, r) {
    var T = SBO.text;
    return [
      { id: 'status', title: 'Status', text: T.vitalsLine(s) },
      { id: 'epicrisis', title: 'Epikrízis', text: 'A fentebb részletezett anamnézisű beteget ' + T.BLANK + ' miatt vizsgáltuk ambulanciánkon. ' +
        (r.workingDx.length ? 'Munkadiagnózis: ' + r.workingDx.map(function (d) { return d.text; }).join('; ') + '.' : '') },
      { id: 'advice', title: 'Javaslat', text: '- Háziorvosánál kontroll céljából jelentkezzen.' },
    ];
  }

  /* ------------------------------------------------------------------ */
  /* 3. Regisztráció                                                     */
  /* ------------------------------------------------------------------ */
  SBO.register({
    id: 'sablon',                                     // URL-ben: #/sablon – kisbetű, szám, kötőjel
    title: 'Minta eljárásrend',
    short: 'Minta',
    description: 'Egysoros leírás a kezdőlapi kártyára.',
    sop: { number: '00', title: 'Minta eljárásrend', issuer: 'ÉPC-HK Sürgősségi Betegellátó Osztály', version: 'v1.0, 2025.01.01.', validUntil: '2027-12-31' },
    steps: [
      { id: 'start', title: 'Stabilitás', ref: 'SOP 5.1', fields: [
        { type: 'yn', key: 'stable', label: 'Cardiorespiratoricusan stabil?' },
      ].concat(SBO.fields.vitals()) },
      { id: 'exam', title: 'Vizsgálat', ref: 'SOP 6.', fields: [
        { type: 'choice', key: 'finding', label: 'Lelet', options: [{ v: 'a', l: 'A' }, { v: 'b', l: 'B' }] },
        { type: 'widget', name: 'example' },
      ] },
      { id: 'summary', title: 'Összegzés / dokumentáció', fields: [{ type: 'summary' }] },
    ],
    stepVisible: function (id, s) { return id !== 'exam' || s.stable === 'yes'; },
    stageToStep: { start: 'start', exam: 'exam', done: 'summary' },
    evaluate: evaluate,
    categories: { UNSTABLE: 'Instabil beteg – ABCDE', A: 'A csoport', B: 'B csoport' },
    dangerCategories: ['UNSTABLE'],
    widgets: {
      example: {
        render: function (ctx) { return '<div class="note info">Egyedi widget: bármilyen HTML. ctx.state, ctx.r, ctx.esc, ctx.radios elérhető.</div>'; },
        live: function (ctx) { return ctx.r.category ? '<div class="note ok">Élő eredmény: ' + ctx.esc(ctx.r.category) + '</div>' : ''; },
      },
    },
    docSections: docSections,
    reference: function () { return [{ id: 'ref1', title: 'Példa referencia', html: '<p>Az SOP tömörített tartalma.</p>' }]; },
  });

  if (typeof module !== 'undefined' && module.exports) module.exports = { evaluate: evaluate };
})(typeof window !== 'undefined' ? window : this);
