/*
 * SBO ikoncsomag – 24×24-es vonalas SVG ikonok (stroke = currentColor, így a környező szín szerint színeződnek).
 * Önálló SVG-fájlként is elérhetők: assets/icons/*.svg
 */
(function (root) {
  'use strict';

  var PATHS = {
    // Szédülés – spirál
    vertigo: '<path d="M12.60 12.00 L12.70 12.19 L12.73 12.42 L12.69 12.69 L12.55 12.95 L12.31 13.17 L12.00 13.34 L11.62 13.41 L11.21 13.37 L10.79 13.21 L10.41 12.92 L10.11 12.51 L9.92 12.00 L9.88 11.43 L9.99 10.84 L10.27 10.27 L10.72 9.78 L11.30 9.40 L12.00 9.19 L12.76 9.16 L13.53 9.35 L14.25 9.75 L14.86 10.35 L15.31 11.11 L15.55 12.00 L15.55 12.95 L15.29 13.90 L14.77 14.77 L14.02 15.50 L13.08 16.03 L12.00 16.29 L10.86 16.26 L9.73 15.93 L8.70 15.30 L7.86 14.39 L7.26 13.27 L6.97 12.00 L7.02 10.67 L7.43 9.36 L8.18 8.18 L9.24 7.22 L10.54 6.55 L12.00 6.23 L13.52 6.31 L15.01 6.79 L16.34 7.66 L17.42 8.87 L18.17 10.35 L18.51 12.00 L18.40 13.72 L17.85 15.38 L16.86 16.86 L15.50 18.06 L13.84 18.88 L12.00 19.24 L10.09 19.12 L8.25 18.49 L6.62 17.38 L5.30 15.87 L4.41 14.03 L4.02 12.00 L4.17 9.90 L4.87 7.89 L6.09 6.09 L7.76 4.66 L9.77 3.69"/>',
    // Syncope – földön fekvő alak, feje fölött kis spirállal
    syncope: '<circle cx="5" cy="13.6" r="2.6"/><path d="M8.2 14.6H16l2.6-4.4 2.6 4.4M11.2 14.6l2-3.6M2.5 18.5h19"/><path d="M5 5.2a1 1 0 1 1-1 1.6 2 2 0 1 1 2.8 1.4"/>',
    // Fejsérülés / IC vérzés – fejprofil becsapódás-jellel
    headinjury: '<path d="M7 21v-3.4A7.6 7.6 0 1 1 18.4 12.6l1.9 3.2-2 .6V19a2 2 0 0 1-2 2H14"/><path d="m11.2 5.2 1.9 2.7-2.1 1.3 2 2.8"/>',
    // Triage – prioritási sorrend
    triage: '<circle cx="5" cy="6" r="1.6"/><circle cx="5" cy="12" r="1.6"/><circle cx="5" cy="18" r="1.6"/><path d="M9 6h11M9 12h8M9 18h5"/>',
    // Általános eljárásrend (dokumentum)
    sop: '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h6M9 9h2"/>',
  };

  function svg(name, size, title) {
    var p = PATHS[name] || PATHS.sop;
    return '<svg class="icon" viewBox="0 0 24 24" width="' + (size || 24) + '" height="' + (size || 24) + '" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"' +
      (title ? ' role="img" aria-label="' + title + '"' : ' aria-hidden="true"') + '>' + p + '</svg>';
  }

  // Alkalmazás-ikon (favicon): lekerekített négyzet a logó kék→türkiz átmenetével, fehér kereszt
  var APP = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1e638d"/><stop offset="1" stop-color="#0db2c8"/></linearGradient></defs>' +
    '<rect width="64" height="64" rx="14" fill="url(#g)"/><path d="M26 14h12v12h12v12H38v12H26V38H14V26h12z" fill="#fff"/></svg>';

  var api = { svg: svg, names: Object.keys(PATHS), PATHS: PATHS, APP: APP };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else (root.SBO || (root.SBO = {})).icons = api;
})(typeof window !== 'undefined' ? window : this);
