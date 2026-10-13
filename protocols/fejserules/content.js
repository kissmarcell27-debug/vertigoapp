/*
 * Referencia-tartalom – „Intracranialis vérzések sürgősségi kezelése” SOP (ÉPC-HK SBC, 17., v1.0), tömörítve.
 */
(function (root) {
  'use strict';

  var SOP = {
    number: '17',
    title: 'Intracranialis vérzések sürgősségi kezelése',
    issuer: 'ÉPC-HK SBC',
    version: 'v1.0, 2024.04.25.',
    validUntil: '2025-12-31',
  };

  // 2. melléklet – Tájékoztató koponyasérültek részére (tartalmi összefoglaló)
  var LEAFLET_WARNINGS = [
    'aluszékonyság (magára hagyva könnyen elalszik, nehezen vagy nem ébreszthető)',
    'megváltozott viselkedés, fokozódó fejfájás, beszédzavar',
    'kar- vagy lábgyengeség, érzészavar, zsibbadás',
    'ismétlődő hányás',
    'pupillatágulat, a pupilla fényre nem szűkül',
    'epilepsziás vagy más görcsös rángások',
    'a sérülés helyén gyorsan növő dudor',
    'vízszerű vagy véres, szalmasárga váladék a fülből vagy orrból',
  ];

  var REFERENCE = [
    {
      id: 'groups', title: 'Ellátási csoportok, tünettan (2–3.)',
      html:
        '<p><b>1. csoport – traumás fejsérültek:</b> emittálható lesz (alacsony/közepes kockázat), illetve osztályra vagy műtőbe kerül (közepes/magas kockázat).</p>' +
        '<p><b>2. csoport – nem traumás intracranialis vérzés:</b></p><ul>' +
        '<li><b>ICH (hypertoniás, törzsdúci):</b> szinte kizárólag stroke-centrumba. Gyakori.</li>' +
        '<li><b>Lobáris vérzés:</b> további kivizsgálás (CT-angio, esetleg halasztott DSA), majd SBO fektető / idegsebészet, esetleg területi neurológia; ritkán műtét.</li>' +
        '<li><b>Nem traumás SAV:</b> neuroendovascularis ellátás előzetes referálás után hétköznap 24 órában intézményünkben; ha ez nem lehetséges, vagy hétvégén, az idegsebész az OMIII-ba referálja.</li></ul>' +
        '<p><b>Tünetek:</b> tudatszint-változás (~50%), hirtelen erős fejfájás (~40%), hányinger/hányás (40–50%), emelkedett vérnyomás (~90%), roham (6–7%), féloldali gyengeség/zsibbadás, oldalra fixált tekintet, egyensúly-/koordinációzavar, beszéd- és megértési zavar, trauma az anamnézisben.</p>',
    },
    {
      id: 'risk', title: 'Fejsérültek rizikócsoportjai (4.)',
      html:
        '<p><b>Alacsony:</b> tünetmentes, legfeljebb fejfájás, szédülés; nincs közepes vagy magas kockázati kritérium.</p>' +
        '<p><b>Közepes:</b> bizonyítható eszméletvesztés; progresszív vagy elviselhetetlen fejfájás, zavartság, nyugtalanság; alkohol-/drogintoxikáció; epilepsziás görcs; megbízhatatlan vagy nem nyerhető anamnézis; <2 vagy >70 év (kivéve teljesen jelentéktelen sérülés); ≥2 hányás; poszttraumás amnézia; koponyaalapi törés jelei; ismételt trauma; impressziós törés gyanúja; bántalmazás gyanúja; nagy subgalealis vérzés; antikoaguláns / TAG-gátló / dekompenzált májbetegség / coagulopathia; ismeretlen eredetű fokális tünet; változó korú külsérelmek; koponyatörés RTG-jelei.</p>' +
        '<p><b>Magas:</b> GCS ≤12; neurológiai kórjelek (aluszékony/soporosus betegnél anisocoria, durva végtaggyengeség, epilepsziás rosszullét); progresszív tudatzavar; penetráló/impressziós koponyasérülés, súlyos maxillofacialis sérülés; a mechanizmus vagy a külsérelem alapján valószínű intracranialis sérülés; ATLS-kritériumok (eszméletlen; >2 m / testmagasság feletti esés; járműből kirepült; nagy sebességű ütközés: gyalogos >5 km/h, motoros >30 km/h, személygépkocsi >60 km/h; karosszéria-deformitás; elhunyt a járműben; légzsák nyílt).</p>',
    },
    {
      id: 'ct', title: 'Képalkotás (7.)',
      html:
        '<p>Gold standard: <b>non-contrast koponya CT</b>. Minden legalább közepes kockázatú fejsérültnél CT. Magas kockázatnál kiegészítés legalább CI–CII, optimálisan CI–ThI szegmentummal. SAV esetén még a CT-vizsgálóban idegsebészeti/radiológiai konzultáció a CTA-ról.</p>' +
        '<p><b>CT 1 órán belül:</b> GCS ≤12 kezdetben; GCS <15 a sérülés után 2 órával; nyílt vagy impressziós törés gyanúja; koponyaalapi törés jele (haemotympanum, pápaszem-haematoma, liquorrhoea); poszttraumás roham; fokális neurológiai deficit; >1 hányás.</p>' +
        '<p><b>CT 8 órán belül</b> (vagy 1 órán belül, ha a felvételkor már >8 óra telt el), ha eszméletvesztés vagy amnézia volt <u>és</u>: ≥65 év; vérzési/véralvadási zavar; veszélyes mechanizmus (elütött gyalogos/kerékpáros, járműből kiesett, >1 m vagy 5 lépcsőfok); >30 perces retrográd amnézia.</p>' +
        '<p><b>Nyaki gerinc CT is:</b> GCS ≤12; intubált beteg; sürgős definitív diagnózis szükséges; éber, stabil betegnél a fejet és mellkast/hasat/medencét érintő tompa polytrauma; klinikai gyanú és ≥65 év / veszélyes mechanizmus / fokális perifériás deficit / paresztézia / intoxikáció.</p>' +
        '<p><b>Sürgős ismételt CT:</b> klinikai állapot vagy tudatszint romlásakor (GCS-sel dokumentálva).</p>',
    },
    {
      id: 'golden', title: 'Sürgősségi ellátás – aranyóra (5.)',
      html:
        '<p><b>AB:</b> célzott O₂, cél SpO₂ 90–94% (<90% esetén mindenképp). Közepes és magas kockázatnál legalább orrszonda már a CT előtt. GCS <8 vagy gyorsan romló tudat → emelt szintű légútbiztosítás (RSI, váltásvezetővel egyeztetve). Lélegeztetés: TV 4–6 ml/ttkg, PEEP 5–7 vízcm, FiO₂ 0,4–0,6, SpO₂ >94%, PaO₂ 60–100, PaCO₂ 35–40 Hgmm, laktát <2,2 mmol/l.</p>' +
        '<p><b>C – hypotonia</b> (RRsys <90 vagy 40 Hgmm-es esés legalább 15 percig): 250–500 ml iv. krisztalloid 15–30 perc alatt; max. 500 ml után is fennálló hypotoniánál vasopressor: noradrenalin 0,1–1,0 µg/kg/perc, második választás dobutamin 2–20 µg/kg/perc.</p>' +
        '<p><b>C – hypertonia:</b> 150–220 Hgmm szisztolés között, kontraindikáció nélkül 140 Hgmm alá; 220 Hgmm felett folyamatos iv. szerrel, monitorozva. Labetalol 10–20 mg bolus 1–2 perc alatt (kétszer ismételhető, max. hatás 5–10 perc), majd infúzió 1 mg/perc (max. 6 mg/perc). Labetalol-kontraindikáció (tüdőoedema, asthma, bradycardia, allergia, ritmuszavar) esetén urapidil 5 mg-os frakciókban, majd 9–30 mg/óra perfúzorral. Cél: 220/120 Hgmm alá; az első órában a szisztolés csökkenés ne legyen több a kezdeti érték 15%-ánál. Intubált betegnél előbb a megfelelő szedáció.</p>' +
        '<p><b>D:</b> pontos GCS, pupillák és bulbusok, oldaliság, testfélaszimmetria, beszédzavar dokumentálása. Vércukor-cél 4,4–6,1 mmol/l.</p>' +
        '<p><b>E:</b> EKG (pitvarfibrilláció → antikoaguláció?), AVGA, testhőmérséklet; POCUS csak gyakorlott kézben.</p>',
    },
    {
      id: 'adjunct', title: 'Labor és kiegészítő terápia (6., 8., 10.)',
      html:
        '<p><b>Labor:</b> ionok, vese- és májfunkció, vérkép, vércsoport és ellenanyagszűrés, alvadás (INR, APTI, TI, TCT, fibrinogén); vérgáz, laktát, sav-bázis artériás vérből. <b>K-vitamin-antagonistát szedőnél INR kötelező.</b> Dinamikus tesztek (ClotPro) a gyakorlatban jobban használhatók.</p>' +
        '<p><b>Antikoaguláció felfüggesztése:</b> lásd ClotPro eljárásrend.</p>' +
        '<p><b>Láz:</b> kezelendő. <b>Vércukor:</b> 4,4–6,1 mmol/l.</p>' +
        '<p><b>Epilepsziás roham:</b> 1. diazepam 0,1–0,2 mg/ttkg; 2. levetiracetam 250 mg iv. bolus, fennálló rohamnál újabb 250 mg-mal 1500 mg összdózisig; 3. fenitoin 15–20 mg/ttkg vagy levetiracetam (ha még nem kapott).</p>' +
        '<p><b>Ozmoterápia:</b> mannitol 0,25–1 g/ttkg, elsőként refrakter esetben ICP-monitorozás mellett (ICP-cél <22 Hgmm); szérum-ozmolaritás >315 mmol/l kerülendő. ICP-monitorozás nélkül csak beékelődési jeleknél (GCS motoros 2–3, anisocoria vagy kétoldali fénymerev tág pupilla, extenziós tónusfokozódás). <b>Szteroid nem ajánlott.</b></p>' +
        '<p><b>Fájdalomcsillapítás:</b> NSAID nem javasolt (TAG-gátló hatás), kivétel a paracetamol. Ketamin 0,1–0,3 mg/kg lassú iv. bolus vagy 1–3 mg/kg im.; fentanyl 1–2 µg/ttkg.</p>',
    },
    {
      id: 'obs', title: 'Obszerváció, diszpozíció, speciális csoportok (11–13.)',
      html:
        '<p><b>Igazolt IC vérzés:</b> idegsebészeti konzílium után a fektető részlegen obszerválandó, ha nem kerül azonnal ITO-ra vagy műtőbe.</p>' +
        '<p><b>Megfigyelés minimuma:</b> GCS, pupilla mérete és reakciója, végtagmozgások, légzésszám, pulzus, RR, hőmérséklet, SpO₂. Félóránként a 15-ös GCS eléréséig, majd 6 órán át óránként, utána 2 óránként.</p>' +
        '<p><b>Sürgős újraértékelés (és CT):</b> izgatottság, rendellenes viselkedés; legalább 30 percig tartó 1 pontos GCS-csökkenés (különösen motoros); ≥3 pont csökkenés a szemnyitási vagy verbális, ≥2 pont a motoros pontszámban; súlyos vagy fokozódó fejfájás, tartós hányás; új neurológiai jel (pupilla-egyenlőtlenség, végtag/arc aszimmetria). Egyébként kontroll CT az első vizsgálat után 12 órával.</p>' +
        '<p><b>Hospitalizáció:</b> új, klinikailag fontos képalkotó eltérés; a GCS nem tér vissza 15-re / alapvonalra; folyamatos aggasztó tünetek; egyéb aggodalomra okot adó klinikum.</p>' +
        '<p><b>Emisszió (CT nélkül vagy negatív CT után):</b> GCS 15 / alapvonal (CT-nél), nincs más felvételt indokoló tényező, biztonságos otthoni felügyelet. Minden fejsérült ambuláns lapjához csatolni kell a tájékoztatót, átadását az epikrízisben rögzíteni.</p>' +
        '<p><b>Antikoagulált (VKA/NOAC), közepes kockázat, tünetmentes:</b> INR >1,4 → azonnali CT; pozitív → idegsebész + PCC; negatív → 12 órás obszerváció, majd emisszió, panasz esetén kontroll CT + rekonzílium. INR <1,4 → CT a trauma után 4 órával; pozitív → idegsebész; negatív → emisszió.</p>' +
        '<p><b>TAG-gátló, közepes kockázat:</b> tünetmentes → CT 4 óra múlva (pozitív → idegsebész, negatív → emisszió). GCS <15, progresszív fejfájás, >2 hányás vagy elhúzódó amnézia → azonnali CT; negatív → 12 órás obszerváció, panasz esetén kontroll CT + rekonzílium.</p>',
    },
    {
      id: 'leaflet', title: 'Tájékoztató koponyasérültek részére (2. melléklet)',
      html:
        '<p>Ön / hozzátartozója olyan koponyasérülést szenvedett, amely a vizsgálatok alapján könnyű / alacsony kockázatú, ezért fekvőbeteg-osztályos felvétele nem szükséges. Mivel ritkán a látszólag enyhe sérülésnek is lehet késői szövődménye (elsősorban lassan növő vérömleny), kérjük, tartsa be az alábbiakat.</p>' +
        '<p><b>Haladéktalanul keresse fel ismét az ambulanciát, ha:</b></p><ol>' + LEAFLET_WARNINGS.map(function (w) { return '<li>' + w + '</li>'; }).join('') + '</ol>' +
        '<p>24 órán át ne vegyen be paracetamolnál erősebb fájdalomcsillapítót. Ne szedjen nem-szteroid gyulladáscsökkentőt, vérhígító szert, ne fogyasszon alkoholt, néhány napig kerülje a szellemi/fizikai terhelést. Ambuláns leleteivel mielőbb keresse fel háziorvosát.</p>',
    },
    {
      id: 'sources', title: 'Források',
      html:
        '<ul><li>ÉPC-HK SBC: Intracranialis vérzések sürgősségi kezelése, SOP 17., v1.0 (2024.04.25.) – az app döntési fája ezen alapul.</li>' +
        '<li>Az SOP irodalma: Canadian Stroke Best Practices – Emergency Management of ICH; NICE: Head injury: assessment and early management (2023); IJERPH 2022;19:14311 (ismételt CT enyhe TBI-ben).</li>' +
        '<li>A súlyalapú dózisok és a vérnyomás-célérték számítása az SOP-ban megadott értékekből történik (mg/ttkg, µg/kg/perc, 15%).</li></ul>',
    },
  ];

  var api = { SOP: SOP, REFERENCE: REFERENCE, LEAFLET_WARNINGS: LEAFLET_WARNINGS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.HeadInjuryContent = api;
})(typeof window !== 'undefined' ? window : this);
