/*
 * Animált, sematikus SVG-ábrák a HINTS+ és a statokinetikus vizsgálatokhoz.
 * SMIL-animáció (külső függőség nélkül, offline is működik). A színek CSS-változókból jönnek,
 * így világos és sötét módban is olvashatók. Az ábrák az SOP 6.1–6.4 leírását követik.
 */
(function (root) {
  'use strict';

  var A = 'repeatCount="indefinite" calcMode="linear"';

  function svg(viewBox, label, body) {
    return '<svg class="ill" viewBox="' + viewBox + '" role="img" aria-label="' + label + '">' + body + '</svg>';
  }

  function panel(svgHtml, title, cls, caption) {
    return '<figure class="ill-panel ' + (cls || '') + '">' + svgHtml +
      '<figcaption><b>' + title + '</b>' + (caption ? '<br>' + caption : '') + '</figcaption></figure>';
  }

  /* --------------------------------------------------------------- */
  /* Szem (szemből nézve): sclera + íris (+ jelölő a torzióhoz)       */
  /* --------------------------------------------------------------- */
  function eye(id, cx, cy, irisAnim, opts) {
    opts = opts || {};
    return '<clipPath id="' + id + '"><ellipse cx="' + cx + '" cy="' + cy + '" rx="17" ry="11"/></clipPath>' +
      '<ellipse cx="' + cx + '" cy="' + cy + '" rx="17" ry="11" class="ill-sclera"/>' +
      '<g clip-path="url(#' + id + ')"><g>' +
      '<circle cx="' + cx + '" cy="' + cy + '" r="8" class="ill-iris"/>' +
      '<circle cx="' + cx + '" cy="' + cy + '" r="3.2" class="ill-pupil"/>' +
      (opts.marker ? '<line x1="' + cx + '" y1="' + (cy - 8) + '" x2="' + cx + '" y2="' + (cy - 4) + '" class="ill-marker"/>' : '') +
      (irisAnim || '') + '</g></g>' +
      '<ellipse cx="' + cx + '" cy="' + cy + '" rx="17" ry="11" class="ill-outline"/>';
  }

  function translateAnim(values, keyTimes, dur) {
    return '<animateTransform attributeName="transform" type="translate" values="' + values + '" keyTimes="' + keyTimes + '" dur="' + dur + '" ' + A + '/>';
  }

  /* --------------------------------------------------------------- */
  /* Head Impulse Test – felülnézet                                  */
  /* --------------------------------------------------------------- */
  function head(rotateValues, keyTimes, dur) {
    // Halvány kiinduló helyzet (orr) + a gyors fordítás irányát jelző ív
    return '<path d="M114 109 L120 98 L126 109 Z" class="ill-ghost"/>' +
      '<path d="M88 104 A 46 46 0 0 1 104 96" class="ill-arrow"/><path d="M88 104 l1 -8 m-1 8 l7 -3" class="ill-arrow"/>' +
      '<text x="62" y="96" class="ill-text small">20°</text>' +
      '<g>' +
      '<animateTransform attributeName="transform" type="rotate" values="' + rotateValues + '" keyTimes="' + keyTimes + '" dur="' + dur + '" ' + A + '/>' +
      '<ellipse cx="88" cy="141" rx="6" ry="10" class="ill-skin"/><ellipse cx="152" cy="141" rx="6" ry="10" class="ill-skin"/>' +
      '<circle cx="120" cy="140" r="32" class="ill-skin"/>' +
      '<path d="M114 109 L120 98 L126 109 Z" class="ill-skin"/>' +
      '<circle cx="109" cy="113" r="3" class="ill-pupil"/><circle cx="131" cy="113" r="3" class="ill-pupil"/>' +
      '</g>';
  }

  function hit() {
    var dur = '3s';
    // Fej: gyors (~150 ms), kis amplitúdójú (20°) fordítás, majd lassú visszaállítás
    var normKT = '0;0.15;0.2;0.55;0.8;1';
    var normRot = '0 120 140;0 120 140;-20 120 140;-20 120 140;0 120 140;0 120 140';
    // A tekintet kiindulópontja (szemek közepe, a fejjel együtt mozog): (120,113) elforgatva -20°-kal a (120,140) körül → (110.8,114.6)
    var normal = svg('0 0 240 190', 'Normál head impulse: a tekintet a célponton marad',
      '<circle cx="120" cy="16" r="5" class="ill-target"/><text x="130" y="20" class="ill-text">célpont</text>' +
      '<line class="ill-gaze" x1="120" y1="113" x2="120" y2="20">' +
      '<animate attributeName="x1" values="120;120;110.8;110.8;120;120" keyTimes="' + normKT + '" dur="' + dur + '" ' + A + '/>' +
      '<animate attributeName="y1" values="113;113;114.6;114.6;113;113" keyTimes="' + normKT + '" dur="' + dur + '" ' + A + '/>' +
      '</line>' + head(normRot, normKT, dur) +
      '<text x="120" y="186" class="ill-text mid">A szem a fejjel ellentétesen fordul</text>');

    var patKT = '0;0.15;0.2;0.3;0.33;0.55;0.8;1';
    var patRot = '0 120 140;0 120 140;-20 120 140;-20 120 140;-20 120 140;-20 120 140;0 120 140;0 120 140';
    // A célpont (120,20) elforgatva -20°-kal a (120,140) körül → (79.0,27.2)
    var patho = svg('0 0 240 190', 'Kóros head impulse: a tekintet a fejjel elmozdul, majd korrekciós szakkád',
      '<circle cx="120" cy="16" r="5" class="ill-target"/><text x="130" y="20" class="ill-text">célpont</text>' +
      '<line class="ill-gaze" x1="120" y1="113" x2="120" y2="20">' +
      '<animate attributeName="x1" values="120;120;110.8;110.8;110.8;110.8;120;120" keyTimes="' + patKT + '" dur="' + dur + '" ' + A + '/>' +
      '<animate attributeName="y1" values="113;113;114.6;114.6;114.6;114.6;113;113" keyTimes="' + patKT + '" dur="' + dur + '" ' + A + '/>' +
      '<animate attributeName="x2" values="120;120;79;79;120;120;120;120" keyTimes="' + patKT + '" dur="' + dur + '" ' + A + '/>' +
      '<animate attributeName="y2" values="20;20;27.2;27.2;20;20;20;20" keyTimes="' + patKT + '" dur="' + dur + '" ' + A + '/>' +
      '</line>' + head(patRot, patKT, dur) +
      '<text x="58" y="60" class="ill-flag" opacity="0">szakkád!' +
      '<animate attributeName="opacity" values="0;0;1;1;0;0" keyTimes="0;0.3;0.31;0.5;0.55;1" dur="' + dur + '" ' + A + '/></text>' +
      '<text x="120" y="186" class="ill-text mid">A szem „elcsúszik”, majd visszaugrik</text>');

    return '<p class="ill-lead">Felülnézet. A beteg a vizsgáló orrát nézi; a fejét gyorsan, kb. 20°-kal elfordítjuk (mindkét irányba).</p>' +
      '<div class="ill-grid">' +
      panel(normal, 'Nincs korrekciós szakkád („negatív” HIT)', 'central', 'Ép VOR. AVS-ben ez <b>centrális</b> okra utal.') +
      panel(patho, 'Korrekciós szakkád („pozitív” HIT)', 'peripheral', 'A károsodott oldal felé fordításkor → <b>perifériás</b>.') +
      '</div>';
  }

  /* --------------------------------------------------------------- */
  /* Spontán nystagmus típusai – szemből nézve                        */
  /* --------------------------------------------------------------- */
  function eyesPair(prefix, animR, animL, opts) {
    return eye(prefix + 'r', 75, 45, animR, opts) + eye(prefix + 'l', 145, 45, animL, opts) +
      '<text x="75" y="76" class="ill-text mid small">jobb szem</text><text x="145" y="76" class="ill-text mid small">bal szem</text>';
  }

  function nystagmus() {
    // Lassú fázis (lineáris sodródás), majd gyors visszacsapás – a nystagmust a gyors fázisról nevezzük el.
    // Szemből nézve a beteg jobb oldala a kép bal oldala: a jobbra csapó gyors fázis a kép bal széle felé mutat.
    var h = translateAnim('-3 0;3 0;-3 0', '0;0.85;1', '0.9s');
    var horiz = svg('0 0 220 84', 'Horizontális, jobbra csapó nystagmus',
      eyesPair('nh', h, h) + '<path d="M40 14 h-24 m6 -5 l-6 5 l6 5" class="ill-arrow"/>' +
      '<text x="44" y="18" class="ill-text small">gyors fázis</text>');

    var v = translateAnim('0 3;0 -3;0 3', '0;0.85;1', '0.9s');
    var vert = svg('0 0 220 84', 'Vertikális (lefelé csapó) nystagmus',
      eyesPair('nv', v, v) + '<path d="M205 12 v22 m-5 -6 l5 6 l5 -6" class="ill-arrow"/>');

    var rot = function (cx) {
      return '<animateTransform attributeName="transform" type="rotate" values="-14 ' + cx + ' 45;14 ' + cx + ' 45;-14 ' + cx + ' 45" keyTimes="0;0.85;1" dur="0.9s" ' + A + '/>';
    };
    var tors = svg('0 0 220 84', 'Tisztán rotatoros (torziós) nystagmus',
      eyesPair('nt', rot(75), rot(145), { marker: true }));

    // Tekintésirányú: balra nézéskor balra, jobbra nézéskor jobbra csap (irányváltó)
    var kt = '0;0.21;0.25;0.46;0.5;0.52;0.73;0.77;0.98;1';
    var vals = '5 0;2 0;5 0;2 0;5 0;-5 0;-2 0;-5 0;-2 0;-5 0';
    var ge = translateAnim(vals, kt, '3.6s');
    var gaze = svg('0 0 220 84', 'Tekintésirányú, irányváltó nystagmus',
      eyesPair('ng', ge, ge) +
      '<text x="110" y="12" class="ill-text mid small">' +
      '<tspan>a beteg balra néz → balra csap</tspan>' +
      '<animate attributeName="opacity" values="1;1;0;0" keyTimes="0;0.5;0.51;1" dur="3.6s" ' + A + '/></text>' +
      '<text x="110" y="12" class="ill-text mid small" opacity="0">a beteg jobbra néz → jobbra csap' +
      '<animate attributeName="opacity" values="0;0;1;1" keyTimes="0;0.5;0.51;1" dur="3.6s" ' + A + '/></text>');

    return '<p class="ill-lead">Szemből nézve (a beteg jobb szeme a kép bal oldalán). A lassú sodródást gyors visszacsapás követi; a nystagmust a gyors fázis irányáról nevezzük el.</p>' +
      '<div class="ill-grid">' +
      panel(horiz, 'Iránytartó, horizontális', 'peripheral', 'Itt jobbra csapó. Minden tekintési irányban ugyanarra csap → <b>perifériás</b>.') +
      panel(vert, 'Vertikális', 'central', 'Itt lefelé csapó → <b>centrális</b>.') +
      panel(tors, 'Tisztán rotatoros', 'central', 'Az íris a látótengely körül forog → <b>centrális</b>.') +
      panel(gaze, 'Tekintésirányú (irányváltó)', 'central', 'Mindig a tekintés irányába csap → <b>centrális</b>.') +
      '</div>' +
      '<p class="ill-note">Intenzitás: I. fok – csak a gyors fázis irányába nézve; II. fok – előre nézve is; III. fok – ellenkező irányba nézve is.</p>';
  }

  /* --------------------------------------------------------------- */
  /* Skew deviation – váltakozó szemtakarás                          */
  /* --------------------------------------------------------------- */
  function skew() {
    var dur = '4s';
    var cover = '<rect y="22" width="46" height="46" rx="6" class="ill-cover">' +
      '<animate attributeName="x" values="122;122;52;52;122" keyTimes="0;0.45;0.5;0.95;1" dur="' + dur + '" ' + A + '/></rect>';
    // Kóros: a takarás alatt a szem vertikálisan eltér; a takarás alól felszabaduló szem vertikális szakkáddal áll be.
    // Jobb szem (kép bal oldala): 0,5–1 között takarva lefelé tér el; a takarás megszűnésekor (ciklus eleje) felfelé áll be.
    var rAnim = translateAnim('0 4;0 0;0 0;0 4;0 4', '0;0.04;0.5;0.6;1', dur);
    // Bal szem (kép jobb oldala): 0–0,45 között takarva felfelé tér el; 0,5-kor felszabadul és lefelé áll be.
    var lAnim = translateAnim('0 0;0 -4;0 -4;0 0;0 0', '0;0.1;0.5;0.54;1', dur);
    var patho = svg('0 0 220 96', 'Pozitív skew deviation: a takarás alól felszabaduló szem vertikálisan áll be',
      '<circle cx="110" cy="8" r="3" class="ill-target"/>' +
      eyesPair('sp', rAnim, lAnim) + cover +
      '<text x="110" y="92" class="ill-flag mid" opacity="0">vertikális beálló mozgás' +
      '<animate attributeName="opacity" values="0;1;1;0;0;1;1;0;0" keyTimes="0;0.01;0.12;0.15;0.5;0.51;0.62;0.65;1" dur="' + dur + '" ' + A + '/></text>');
    var normal = svg('0 0 220 96', 'Negatív skew: nincs beálló mozgás',
      '<circle cx="110" cy="8" r="3" class="ill-target"/>' + eyesPair('sn', '', '') + cover);
    return '<p class="ill-lead">A beteg egy pontot fixál; felváltva letakarjuk a két szemét, és a takarás alól felszabaduló szemet figyeljük.</p>' +
      '<div class="ill-grid">' +
      panel(normal, 'Negatív', 'peripheral', 'A felszabaduló szem nem mozdul.') +
      panel(patho, 'Pozitív (skew deviation)', 'central', 'A felszabaduló szem <b>vertikális</b> szakkáddal fixál újra → <b>centrális</b>.') +
      '</div>';
  }

  /* --------------------------------------------------------------- */
  /* Tájékozódó hallásvizsgálat – ujjdörzsölés                       */
  /* --------------------------------------------------------------- */
  function hearing() {
    var dur = '4s';
    var s = svg('0 0 240 120', 'Ujjdörzsöléses tájékozódó hallásvizsgálat',
      '<circle cx="60" cy="60" r="40" class="ill-skin"/>' +
      '<path d="M96 48 q14 -2 12 14 q-2 12 -12 12" class="ill-skin-line"/>' +
      '<text x="60" y="64" class="ill-text mid small">beteg</text>' +
      '<g>' + translateAnim('0 0;0 0;80 0;80 0;0 0', '0;0.1;0.75;0.9;1', dur) +
      '<g>' + translateAnim('0 -2;0 2;0 -2', '0;0.5;1', '0.25s') +
      '<ellipse cx="124" cy="54" rx="9" ry="5" class="ill-finger"/></g>' +
      '<ellipse cx="124" cy="64" rx="9" ry="5" class="ill-finger"/>' +
      '<path d="M112 50 q-6 9 0 18" class="ill-wave"><animate attributeName="opacity" values="1;1;0;0;1" keyTimes="0;0.1;0.75;0.9;1" dur="' + dur + '" ' + A + '/></path>' +
      '<path d="M106 45 q-9 14 0 28" class="ill-wave"><animate attributeName="opacity" values="0.7;0.7;0;0;0.7" keyTimes="0;0.1;0.6;0.9;1" dur="' + dur + '" ' + A + '/></path>' +
      '</g>' +
      '<text x="150" y="112" class="ill-text mid small">távolítjuk, amíg már nem hallja</text>');
    return '<div class="ill-grid one">' +
      panel(s, 'Hüvelyk- és mutatóujj-dörzsölés a hallójárat előtt, majd fokozatos távolítás', '',
        'Mindkét oldalon, összehasonlítva. Akut féloldali halláscsökkenés szédülő betegnél → <b>centrális</b> ok (AICA-infarktus) lehetősége. Fülzúgás + mélyhangú halláscsökkenés → Ménière.') +
      '</div>';
  }

  /* --------------------------------------------------------------- */
  /* Statokinetikus próbák                                           */
  /* --------------------------------------------------------------- */
  function figure() {
    return '<circle cx="60" cy="30" r="12" class="ill-skin"/>' +
      '<path d="M54 30 h4 M62 30 h4" class="ill-stroke"/>' + // csukott szem
      '<path d="M60 42 v52 M60 52 l-18 26 M60 52 l18 26 M60 94 l-4 40 M60 94 l4 40" class="ill-stroke wide"/>';
  }

  function romberg() {
    var dur = '5s';
    var s = svg('0 0 120 150', 'Romberg-próba: perifériás laesio esetén a laesio oldalára dől',
      '<line x1="20" y1="136" x2="100" y2="136" class="ill-ground"/>' +
      '<g><animateTransform attributeName="transform" type="rotate" values="0 60 134;3 60 134;-2 60 134;4 60 134;12 60 134;12 60 134;0 60 134" keyTimes="0;0.15;0.3;0.45;0.65;0.85;1" dur="' + dur + '" ' + A + '/>' +
      figure() + '</g>');
    return '<div class="ill-grid one">' +
      panel(s, 'Csukott szem, összezárt láb', 'peripheral',
        'Perifériás laesio: a laesio oldalára dől (itt a beteg bal oldala). <b>Hátradőlés, törzsataxia → centrális.</b> Felállni képtelen beteget ülve vizsgáljuk.') +
      '</div>';
  }

  function barany() {
    var dur = '4s';
    var kt = '0;0.15;0.45;0.75;1';
    var s = svg('0 0 200 170', 'Bárány-féle mutatópróba: félremutatás a károsodott oldal felé',
      '<circle cx="100" cy="24" r="6" class="ill-target"/><text x="110" y="20" class="ill-text small">vizsgáló ujja</text>' +
      '<line x1="100" y1="150" x2="100" y2="30" class="ill-stroke wide">' +
      '<animate attributeName="x2" values="100;100;100;78;78" keyTimes="' + kt + '" dur="' + dur + '" ' + A + '/>' +
      '<animate attributeName="y2" values="30;30;120;32;32" keyTimes="' + kt + '" dur="' + dur + '" ' + A + '/></line>' +
      '<circle cx="100" cy="30" r="5" class="ill-finger">' +
      '<animate attributeName="cx" values="100;100;100;78;78" keyTimes="' + kt + '" dur="' + dur + '" ' + A + '/>' +
      '<animate attributeName="cy" values="30;30;120;32;32" keyTimes="' + kt + '" dur="' + dur + '" ' + A + '/></circle>' +
      '<text x="100" y="168" class="ill-text mid small">a vizsgáló szemszögéből</text>');
    return '<div class="ill-grid one">' +
      panel(s, 'Kinyújtott kar, csukott szemmel le, majd vissza a vizsgáló ujjához', 'peripheral',
        'A félremutatás a <b>károsodott oldal felé</b> történik.') +
      '</div>';
  }

  function gait() {
    var dur = '4s';
    var s = svg('0 0 200 170', 'Vakjárás: perifériás laesio esetén a laesio irányába deviál',
      '<line x1="100" y1="160" x2="100" y2="12" class="ill-dash"/>' +
      '<path id="gaitPath" d="M100 160 C100 110 92 60 62 14" class="ill-path"/>' +
      '<circle r="7" class="ill-finger"><animateMotion dur="' + dur + '" repeatCount="indefinite" keyPoints="0;1;1" keyTimes="0;0.85;1" calcMode="linear"><mpath href="#gaitPath"/></animateMotion></circle>' +
      '<text x="106" y="20" class="ill-text small">elképzelt egyenes</text>' +
      '<text x="100" y="168" class="ill-text mid small">felülnézet</text>');
    return '<div class="ill-grid one">' +
      panel(s, 'Csukott szemmel egy elképzelt egyenes mentén', 'peripheral',
        'Perifériás laesio: a <b>laesio irányába deviál</b>. Centrális laesio: kifejezett ataxia.') +
      '</div>';
  }

  var BUILDERS = { hit: hit, nystagmus: nystagmus, skew: skew, hearing: hearing, romberg: romberg, barany: barany, gait: gait };
  var cache = {};

  var api = {
    get: function (name) {
      if (!BUILDERS[name]) return '';
      if (!cache[name]) cache[name] = BUILDERS[name]();
      return cache[name];
    },
    names: Object.keys(BUILDERS),
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.VertigoIllustrations = api;
})(typeof window !== 'undefined' ? window : this);
