/*
 * MSTR Triage – tartalom: CEDIS vezetőpanasz-lista (az SBC Portál prototípusából, változatlanul) és referencia.
 */
(function (root) {
  'use strict';

  var SOP = {
    number: 'MSTR',
    title: 'MSTR Triage segéd (felnőtt)',
    issuer: 'Magyar Sürgősségi Triázs Rendszer (CTAS-adaptáció)',
    version: 'SBC Portál prototípusából átemelve',
  };

  // [csoport, panasz]
  var COMPLAINTS = [
  ["Szív/ér","Mellkasi fájdalom (szív eredetű)"],["Szív/ér","Mellkasi fájdalom (nem szív eredetű)"],["Szív/ér","Szívdobogásérzés / ritmuszavar"],["Szív/ér","Ájulás / ájulásközeli állapot"],["Szív/ér","Hipertenzió"],["Szív/ér","Általános gyengeség"],
  ["Légzés","Légszomj / nehézlégzés"],["Légzés","Köhögés / torokszűkület"],["Légzés","Vérköpés"],["Légzés","Stridor"],["Légzés","Allergiás reakció"],["Légzés","Légzésleállás"],
  ["Neurológia","Fejfájás"],["Neurológia","Görcsroham"],["Neurológia","Módosult tudatállapot"],["Neurológia","Zavartság"],["Neurológia","Végtaggyengeség / stroke tünetek"],["Neurológia","Szédülés"],["Neurológia","Fejsérülés"],
  ["Gasztrointesztinális","Hasi fájdalom"],["Gasztrointesztinális","Hányás / hányinger"],["Gasztrointesztinális","Vérhányás"],["Gasztrointesztinális","Hasmenés"],["Gasztrointesztinális","Véres széklet / meléna"],["Gasztrointesztinális","Sárgaság"],
  ["Urológia","Húgyúti fertőzéses panasz"],["Urológia","Vérvizelés"],["Urológia","Vizeletretenció"],["Urológia","Deréktáji fájdalom"],["Urológia","Herefájdalom / duzzanat"],
  ["Nőgyógyászat","Hüvelyi vérzés"],["Nőgyógyászat","Terhesség < 20 hét"],["Nőgyógyászat","Terhesség > 20 hét"],["Nőgyógyászat","Nemi erőszak"],
  ["Mozgásszervi","Felsővégtagi sérülés"],["Mozgásszervi","Alsóvégtagi sérülés"],["Mozgásszervi","Hátfájdalom"],["Mozgásszervi","Traumás gerincsérülés"],["Mozgásszervi","Amputáció"],
  ["Trauma","Súlyos trauma – tompa"],["Trauma","Súlyos trauma – áthatoló"],["Trauma","Izolált hasi sérülés"],["Trauma","Izolált mellkasi sérülés"],
  ["Bőr","Tépett / szúrt seb"],["Bőr","Égés"],["Bőr","Harapás"],["Bőr","Kiütés"],["Bőr","Sebellenőrzés"],["Bőr","Kötéscsere"],
  ["Mentális","Szorongás / krízishelyzet"],["Mentális","Depresszió / öngyilkossági szándék"],["Mentális","Hallucináció / téveszme"],["Mentális","Erőszakos / közveszélyes viselkedés"],
  ["Szemészet","Szemfájdalom"],["Szemészet","Látászavar"],["Szemészet","Idegen test a szemben"],["Szemészet","Kémiai szemártalom"],
  ["FOG","Torokfájás"],["FOG","Nyelési nehezítettség / dysphagia"],["FOG","Orrvérzés"],["FOG","Nyaki trauma"],
  ["Exogén","Kémiai ártalom"],["Exogén","Gázmérgezés"],["Exogén","Hipotermia"],["Exogén","Fulladásközeli állapot"],
  ["Toxikológia","Szájon át túladagolás"],["Toxikológia","Gyógyszer/szer visszaélés"],
  ["Egyéb","Láz"],["Egyéb","Hiperglikémia"],["Egyéb","Hipoglikémia"],["Egyéb","Gyógyszerfelírás"],["Egyéb","Konzultáció"],
  ];

  var REFERENCE = [
    {
      id: 'levels', title: 'Az öt MSTR szint',
      html: '<table class="ref-table"><thead><tr><th>Szint</th><th>Név</th><th>Újraértékelés</th></tr></thead><tbody>' +
        '<tr><td><span class="mstr l1">1</span></td><td>Reszuszcitáció / azonnali</td><td>folyamatos</td></tr>' +
        '<tr><td><span class="mstr l2">2</span></td><td>Kritikus</td><td>15 perc</td></tr>' +
        '<tr><td><span class="mstr l3">3</span></td><td>Sürgős</td><td>30 perc</td></tr>' +
        '<tr><td><span class="mstr l4">4</span></td><td>Kevésbé sürgős</td><td>60 perc</td></tr>' +
        '<tr><td><span class="mstr l5">5</span></td><td>Halasztható</td><td>120 perc</td></tr></tbody></table>' +
        '<p><b>Alapelv:</b> minden rögzített tényező egy javasolt szintet ad; a végeredmény mindig a <b>legsúlyosabb</b> (legkisebb számú) aktív szint. A normál leletek nem emelnek szintet. Az ápoló felül-triázsolhat. Kritikus állapotban a triázs nem késleltetheti az ellátást.</p>',
    },
    {
      id: 'primary', title: 'Elsődleges módosítók (küszöbök)',
      html: '<p><b>Légzés / SpO₂:</b> súlyos (cianózis, kimerült, beszédképtelen, lélegeztetés) vagy SpO₂ &lt;90% → 1; közepes (fokozott munka, rövid mondatok, jelentős stridor) vagy 90–92% → 2; enyhe (csak terhelésre, összefüggő beszéd) vagy 92–94% → 3; &gt;94% nem emel. A mért SpO₂ „padló”, a légzési munka felfelé írhatja.</p>' +
        '<p><b>Keringés:</b> sokk → 1; hemodinamikai instabilitás (indokolatlan tachycardia, ortosztázis, ájulásérzés) → 2; határérték / eltér a megszokottól → 3.</p>' +
        '<p><b>GCS:</b> 3–9 → 1; 10–13 → 2; 14–15 nem emel.</p>' +
        '<p><b>Láz (≥38 °C), SIRS-függő</b> (SIRS: testhő &gt;38 v. &lt;36 °C; pulzus &gt;90; légzésszám &gt;20; FVS &gt;12 v. &lt;4 ezer): immunhiányos → 2; szeptikus küllem (≥3 SIRS, instabil, közepes nehézlégzés, módosult tudat) → 2; súlyos beteg küllem (&lt;3 SIRS) → 3; jó általános állapot (a láz az egyetlen pozitív SIRS) → 4.</p>' +
        '<p><b>Fájdalom (VAS):</b> enyhe 1–3, mérsékelt 4–7, súlyos 8–10.</p>' +
        '<table class="ref-table"><thead><tr><th>Hely / jelleg</th><th>Súlyos</th><th>Mérsékelt</th><th>Enyhe</th></tr></thead><tbody>' +
        '<tr><td>Centrális, heveny</td><td>2</td><td>3</td><td>4</td></tr><tr><td>Centrális, krónikus</td><td>3</td><td>4</td><td>5</td></tr>' +
        '<tr><td>Perifériás, heveny</td><td>3</td><td>4</td><td>5</td></tr><tr><td>Perifériás, krónikus</td><td>4</td><td>5</td><td>5</td></tr></tbody></table>' +
        '<p><b>Vérzés:</b> életet/végtagot veszélyeztető (vagy alvadászavar/antikoaguláns mellett) → 2; enyhe/közepes → 3. <b>Magas rizikójú baleseti mechanizmus</b> (kiesés/átfordulás, &gt;40–60 km/h, &gt;3 m esés, gázolás, áthatoló törzssérülés) → 2.</p>',
    },
    {
      id: 'secondary', title: 'Másodlagos módosítók (panaszspecifikus)',
      html: '<ul><li>Vércukor: hipo (&lt;3) v. hiper (&gt;18) tünetekkel → 2; tünet nélkül → 3.</li><li>Magas vérnyomás (≥220/130): tünettel → 2; tünet nélkül → 3.</li>' +
        '<li>Szív eredetű (v. jelentős) mellkasi fájdalom → 2.</li><li>Stroke / féloldali gyengeség: kezdet &lt;4,5 óra → 2; &gt;4,5 óra v. megszűnt → 3.</li>' +
        '<li>Nyelésképtelenség nyáladzással + stridor → 2.</li><li>Végtagsérülés nyilvánvaló deformitással → 3.</li><li>Kiszáradás: közepes → 2; enyhe → 3.</li></ul>',
    },
    {
      id: 'sources', title: 'Forrás, korlátok',
      html: '<ul><li>Magyar Sürgősségi Triázs Rendszer (MSTR), a kanadai CTAS adaptációja – felnőtt protokoll. Irányadó leírás: <code>docs/mstr-triage-logika.md</code>.</li>' +
        '<li>A logika az SBC Portál prototípusából változatlanul átemelve; a küszöbértékek módosítása csak egyeztetve, dokumentáltan.</li>' +
        '<li>Nem implementált: gyermek (pediátriai) MSTR protokoll.</li>' +
        '<li>A triázs nem tárol betegazonosítót; a nyomtatott lapon 6×3 cm-es etikett-hely van.</li></ul>',
    },
  ];

  var api = { SOP: SOP, COMPLAINTS: COMPLAINTS, REFERENCE: REFERENCE };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.TriageContent = api;
})(typeof window !== 'undefined' ? window : this);
