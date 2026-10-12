/*
 * SBO döntéstámogató – eljárásrend-regiszter és közös segédfüggvények.
 *
 * Minden eljárásrend (SOP) egy modul, amely a SBO.register({...}) hívással jelentkezik be.
 * A modul szerződését (milyen mezőket kell megadni) a docs/UJ_ELJARASREND.md írja le.
 */
(function (root) {
  'use strict';

  var protocols = [];

  function register(p) {
    var required = ['id', 'title', 'sop', 'steps', 'evaluate', 'categories', 'stageToStep'];
    required.forEach(function (k) {
      if (!p[k]) throw new Error('Eljárásrend „' + (p.id || '?') + '”: hiányzó mező: ' + k);
    });
    if (protocols.some(function (x) { return x.id === p.id; })) throw new Error('Duplikált eljárásrend-azonosító: ' + p.id);
    protocols.push(p);
  }

  /* ---------- Szöveg-segédek a dokumentáció-generáláshoz ---------- */
  var BLANK = '___';
  var text = {
    BLANK: BLANK,
    // kitöltött-e egy mező (üres string / undefined → null)
    val: function (s, k) { return s[k] !== undefined && s[k] !== null && String(s[k]).trim() !== '' ? String(s[k]).trim() : null; },
    // hiányzó adat helyén kitöltendő hely
    or: function (v) { return v === null || v === undefined ? BLANK : v; },
    cap: function (t) { return t ? t.charAt(0).toUpperCase() + t.slice(1) : t; },
    // „a, b és c”
    joinHu: function (arr) { return arr.length <= 1 ? arr.join('') : arr.slice(0, -1).join(', ') + ' és ' + arr[arr.length - 1]; },
    // Az osztályos sablon szerinti paramétersor
    vitalsLine: function (s) {
      var v = function (k) { return text.or(text.val(s, k)); };
      return 'BP: ' + v('vit.sys') + '/' + v('vit.dia') + ' Hgmm, P: ' + v('vit.hr') + '/min, SpO₂: ' + v('vit.spo2') + '%, T: ' + v('vit.temp') + '°C';
    },
  };

  /* ---------- Gyakran használt mezőcsoportok ---------- */
  var fields = {
    vitals: function () {
      return [
        { type: 'num2', keys: ['vit.sys', 'vit.dia'], label: 'Vérnyomás (Hgmm)', ph: ['szisztolés', 'diasztolés'] },
        { type: 'num2', keys: ['vit.hr', 'vit.spo2'], label: 'Pulzus (/perc) és SpO₂ (%)', ph: ['pulzus', 'SpO₂'] },
        { type: 'num', key: 'vit.temp', label: 'Testhőmérséklet (°C)' },
      ];
    },
  };

  var api = { register: register, protocols: protocols, text: text, fields: fields };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.SBO = api;
})(typeof window !== 'undefined' ? window : this);
