/*
 * Referencia-tartalom a „Szédüléssel jelentkező beteg ellátása” SOP (ÉPC-HK SBO, v1.0) alapján,
 * tömörített, átfogalmazott formában. A fejezetszámok az SOP fejezeteire utalnak.
 */
(function (root) {
  'use strict';

  var SOP = {
    title: 'Szédüléssel jelentkező beteg ellátása',
    issuer: 'ÉPC-HK Sürgősségi Betegellátó Osztály',
    version: 'v1.0, 2023.09.01.',
    validUntil: '2025-12-31',
  };

  // 1. melléklet – szédülést okozó gyógyszerek
  var DRUGS = [
    'Alkohol', 'Antiarrhythmiás szerek (Class I)', 'Antiepileptikumok', 'Antihisztaminok', 'Vérnyomáscsökkentők',
    'Influenza elleni szerek, gombaellenes szerek, kinolon származékok', 'ADHD gyógyszerek', 'Antiparkinson szerek',
    'Digitalis származékok', 'Dipyridamol', 'Narcoticumok', 'Nitrátok', 'PDE-5 gátlók', 'Izomrelaxánsok',
    'SGLT-2 gátlók', 'Antikolinerg szerek', 'Spasmolyticumok', 'Benzodiazepinek', 'Béta-blokkolók', 'Lítium',
    'Aminoglikozidok',
  ];

  // 8. fejezet – hazabocsátott betegeknek áthidaló, tüneti terápia
  var THERAPY = [
    { group: 'Antihisztaminok', items: [
      'Arlevert (40 mg dimenhydrinat + 20 mg cinnarizin): 3×1 tabletta p.o.',
      'vagy Daedalon (dimenhydrinat): 50 mg p.o. 4–6 óránként',
    ] },
    { group: 'Benzodiazepinek', items: [
      'Xanax, Frontin (alprazolam): 0,5 mg p.o. 8 óránként',
      'vagy Rivotril (clonazepam): 0,25–0,5 mg p.o. 8–12 óránként',
    ] },
    { group: 'Antiemetikum', items: [
      'Cerucal (metoclopramid): 10 mg p.o. 6 óránként',
    ] },
  ];

  var VIDEOS = [
    { label: 'Epley-manőver – magyar nyelvű SOTE oktatóvideó', url: 'https://youtu.be/GIyc2PPahvA' },
    { label: 'Ülve végezhető Epley – angol nyelvű', url: 'https://www.youtube.com/watch?v=mQR6b7CAiqk' },
    { label: 'Barbecue-manőver – oktatóvideó', url: 'https://youtu.be/XZg7dko-MqM' },
  ];

  var REFERENCE = [
    {
      id: 'primary', title: 'Primer vizsgálat és anamnézis (5.1, 7.1)',
      html:
        '<p><b>Minden stabil betegnél:</b> paraméterek (RR, pulzus, SpO₂), ± orthostasis teszt; fizikális és neurológiai vizsgálat; releváns anamnézis; vénás vérgáz; EKG.</p>' +
        '<p><b>Labor:</b> vércukor, vesefunkció, szérum Na és K, CRP, nagy vérkép – a szekunder (nem neurológiai / nem fül-orr-gégészeti) okok feltárására.</p>' +
        '<p><b>Anamnézis:</b> friss fejsérülés; kezdet; folyamatos vagy epizodikus; mi provokálja/enyhíti (fejhelyzet, irány); halláscsökkenés; kísérő tünetek és „red flag”-ek (hányinger, hányás, fejfájás, kettőslátás, palpitáció, mellkasi fájdalom, dyspnoe, syncope); korábbi stroke, ritmuszavar, AMI, kivizsgálatlan syncope, ismert szédüléses kórkép (BPPV, Ménière); gyulladásra utaló panasz.</p>' +
        '<p><b>Paradigmaváltás (4.):</b> a panasz jellege (forgó vs. nem forgó) nem függ össze megbízhatóan az okkal – a besorolás az <b>időbeli lefolyás</b> és a <b>triggerelhetőség</b> alapján történik.</p>',
    },
    {
      id: 'syndromes', title: 'Vestibularis szindrómák (5.2)',
      html:
        '<ul>' +
        '<li><b>AVS</b> (~30%): akut, folyamatos, ≥24 órán át fennálló szédülés (napoktól hetekig); hányinger, hányás, nystagmus, posturalis instabilitás; nyugalomban is fennáll, fejmozgásra rosszabbodhat. Gyakori: vestibularis neuronitis; veszélyes: vertebrobasilaris stroke.</li>' +
        '<li><b>s-EVS</b> (~40%): spontán, kiváltó tényező nélküli rohamok, percektől órákig; nyugalomban többnyire tünetmentes. Gyakori: vestibularis migrén; veszélyes: vertebrobasilaris TIA; egyéb: ritmuszavar, tüdőembólia, pánikroham, Ménière.</li>' +
        '<li><b>t-EVS</b> (~30%): egyértelmű pozícionális provokáció, másodpercektől percekig; ágy mellett (Dix-Hallpike, supine roll) provokálható. Gyakori: BPPV, orthostaticus hypotonia; veszélyes: életveszélyes hátterű orthostaticus hypotonia, CPPV; egyéb: a. vertebralis kompresszió, carotis sinus szindróma, POTS.</li>' +
        '</ul>',
    },
    {
      id: 'nystagmus', title: 'Spontán nystagmus vizsgálata (6.1.1)',
      html:
        '<p><b>Irány:</b> a gyors komponens szerint nevezzük el (balra / jobbra csapó, tekintésirányú). A lassú komponens a vestibularis károsodás oldalára mutat.</p>' +
        '<p><b>Sík:</b> horizontális, vertikális, rotatoros, horizonto-rotatoros, vertico-rotatoros.</p>' +
        '<p><b>Intenzitás:</b> I. fokú – csak a gyors komponens irányába nézve; II. fokú – előre tekintéskor is; III. fokú – ellentétes irányba nézve is (legsúlyosabb, akut kórképekben).</p>',
    },
    {
      id: 'statokinetic', title: 'Statokinetikus próbák, harmonikus tünetcsoport (6.1.2)',
      html:
        '<ul>' +
        '<li><b>Romberg:</b> csukott szem, összezárt láb. Perifériás laesio: a laesio oldalára dől. Hátradőlés, törzsataxia → centrális. Felállni képtelen beteget ülve vizsgáljuk.</li>' +
        '<li><b>Bárány-féle mutatópróba:</b> kinyújtott karral a vizsgáló ujjára mutat, csukott szemmel leengedi, majd visszaemeli. A félremutatás a károsodott oldal felé történik.</li>' +
        '<li><b>Vakjárás:</b> csukott szemmel egyenes vonalon. Perifériás laesio: a laesio irányába deviál; centrális: kifejezett ataxia.</li>' +
        '</ul>' +
        '<p><b>Harmonikus</b> (perifériás): a dőlés/félremutatás iránya <u>ellentétes</u> a nystagmus gyors komponensével. <b>Diszharmonikus</b> (centrális): <u>azonos</u> irányú.</p>',
    },
    {
      id: 'hints', title: 'HINTS+ (6.2–6.4)',
      html:
        '<p><b>Head Impulse Test (Halmágyi):</b> a beteg fix pontra néz (vizsgáló orra), fejét gyorsan, kis amplitúdóval kb. 20°-kal elfordítjuk, mindkét oldalra. Perifériás károsodásnál a károsodott oldal felé fordításkor <b>korrekciós szakkád</b> jelenik meg. Centrális károsodásnál nincs szakkád (a teszt „negatív”). Csak aktuálisan szédülő betegnél értelmes; nyaki sérülés (gyanúja) vagy kooperációképtelenség esetén nem végezhető.</p>' +
        '<p><b>Nystagmus:</b> iránytartó, horizontális / horizonto-rotatoros → perifériás; vertikális, tisztán rotatoros vagy tekintésirányú (irányváltó) → centrális.</p>' +
        '<p><b>Skew deviation (test of skew / szemtakarásos teszt):</b> felváltva letakarjuk a szemeket fixálás közben; ha a takarás alól felszabaduló szem vertikális szakkáddal áll be → centrális laesio.</p>' +
        '<p><b>Tájékozódó hallásvizsgálat:</b> ujjbegyek összedörzsölése a hallójárat előtt, majd távolítás. Szédülő betegnél az <b>akut féloldali halláscsökkenés</b> centrális okra (AICA-infarktus) utalhat; fülzúgás + mély hangokon halláscsökkenés → Ménière.</p>' +
        '<table class="ref-table"><thead><tr><th>Perifériás laesio</th><th>Centrális laesio</th></tr></thead><tbody>' +
        '<tr><td>Harmonikus tünetcsoport</td><td>Diszharmonikus tünetcsoport</td></tr>' +
        '<tr><td>HIT: korrekciós szakkád</td><td>HIT: negatív</td></tr>' +
        '<tr><td>Nystagmus: horizontális / horizonto-rotatoros, iránytartó</td><td>Nystagmus: tekintésirányú / vertikális</td></tr>' +
        '<tr><td>Skew: negatív</td><td>Skew: pozitív</td></tr>' +
        '<tr><td>Nincs halláscsökkenés</td><td>Akut féloldali halláscsökkenés</td></tr>' +
        '</tbody></table>',
    },
    {
      id: 'positional', title: 'Pozícionális tesztek és repozíciós manőverek (6.5)',
      html:
        '<p>Csak nyugalomban tünetmentes (vagy közel tünetmentes) betegnél, ha az anamnézis pozícionális triggerre utal. Folyamatosan, erősen szédülő betegnél értelmetlen.</p>' +
        '<p><b>Dix-Hallpike:</b> az ágyon ülő beteg fejét 45°-kal oldalra fordítjuk, majd gyorsan hanyatt döntjük úgy, hogy a feje kb. 35–40°-ban lelógjon. Mindkét oldalra. <i>Tipikus BPPV:</i> néhány másodperc latencia, heves szédülés, horizonto-rotatoros nystagmus, kb. egy percen belül elmúlik. <i>Centrálisra utal:</i> nincs latencia, irányváltó nystagmus, vagy a szédülés idővel nem csökken → neurológiai konzílium.</p>' +
        '<p><b>Epley-manőver (posterior BPPV):</b></p><ol>' +
        '<li>Indítás az érintett oldali Dix-Hallpike helyzetből (az az oldal, amely felé fordításkor a szédülés provokálódik): fej 45°-ban oldalra, hanyatt döntés, fej kb. 40°-ban lelóg; várunk, míg a szédülés elmúlik (kb. 30–60 mp).</li>' +
        '<li>A lógó fejet középállásba fordítjuk, 10–15 mp-ig tartjuk.</li>' +
        '<li>Az ellenkező oldalra fordítjuk, kb. 30 mp-ig tartjuk.</li>' +
        '<li>A beteg törzzsel a fej után oldalra fordul, a fejet további 90°-kal fordítjuk – az arc a föld felé néz; 30 mp.</li>' +
        '<li>Lefelé néző fejjel, a lábakat az ágy mellé kinyújtva felültetjük (a fej pozícióját tartva), majd a fejet egyenesbe fordítjuk; kb. 20 mp.</li>' +
        '</ol>' +
        '<p><b>„Supine roll” teszt (horizontális ívjárat):</b> hanyatt fekvő betegnél a fejet jobbra, majd balra fordítjuk. BPPV-ben mindkét oldalon a talaj felé csapó nystagmus jelenik meg, az érintett oldal felé fordításkor intenzívebben; rövidebb latencia, hosszabb időtartam, mint pc-BPPV-ben.</p>' +
        '<p><b>Barbecue-manőver (horizontális ívjárat BPPV terápiája):</b> a beteg a hossztengelye körül forog – először a fejét fordítja (az érintett oldal felé kezdve), majd a teste követi.</p>',
    },
    {
      id: 'imaging', title: 'Képalkotás (7.2)',
      html:
        '<p><b>Koponya CT:</b> SBO-n a szédülés miatt végzett CT diagnosztikus értéke nagyon alacsony; kis hátsó skálai ischaemiára érzéketlen, <b>negatív natív CT nem zárja ki a vertebrobasilaris stroke-ot</b>. Akkor javasolt, ha erős fejfájás vagy fokális neurológiai tünet társul (ICH kizárására) – izolált szédülésnél nem.</p>' +
        '<p><b>Koponya MR:</b> érzékenyebb. Centrális eredetű AVS: DWI + MRA; vertebrobasilaris TIA gyanú: MRA. Többnyire neurológussal egyeztetve, osztályos felvételt követően.</p>',
    },
    {
      id: 'therapy', title: 'Sürgősségi tüneti terápia (8.)',
      html: null, // dinamikusan, THERAPY-ból
    },
    {
      id: 'diseases', title: 'Gyakoribb kórképek (3. melléklet)',
      html:
        '<p><b>Ménière-betegség:</b> endolympha hydrops. Epizodikus forgó szédülés (20 perc – 12/24 óra), tinnitus, fluktuáló, kezdetben mélyhangú, progresszív halláscsökkenés; teltségérzés. Kritériumok: ≥2 spontán epizód 20 perc – 12 óra; audiometriával igazolt alacsony-közepes frekvenciás szenzorineurális halláscsökkenés az érintett fülön; fluktuáló hallástünetek; más vestibularis kórkép nem magyarázza jobban. Akut epizód: antihisztamin, benzodiazepin, antiemetikum, diuretikum.</p>' +
        '<p><b>Vestibularis neuronitis:</b> feltehetően virális/postinfekciós; hirtelen kezdet, napokig tartó szédülés, heves vegetatív tünetek, harmonikus tünetcsoport; pozitív HIT, I–III. fokú horizontális vagy rotatoros nystagmus; Romberg negatív, a járás lassú, óvatos, széles alapú. Centrális ok kizárása után tüneti terápia, verbális megnyugtatás; FOG ambulancia; heves vegetatív tünetek esetén hospitalizáció; később vestibularis rehabilitáció.</p>' +
        '<p><b>Vestibularis / agytörzsi migrén:</b> ismétlődő roham-szédülés változatos kísérő tünetekkel (ataxia, látászavar, fejfájás, hányinger, hányás, tudatzavar, meglassultság); időtartam másodpercektől napokig. A leggyakoribb s-EVS. Első rohamnál az akut cerebrovascularis kórképet ki kell zárni. Akut epizód: NSAID + antiemetikum. Agytörzsi migrénben triptán és ergotamin nem javasolt.</p>',
    },
    {
      id: 'leaflet', title: 'Betegtájékoztató – BPPV (2. melléklet)',
      html:
        '<p>A BPPV (jóindulatú, rohamokban jelentkező, fejhelyzet-változással összefüggő forgó szédülés) oka, hogy a belső fül félkörös ívjárataiba apró mészkristályok kerülnek, és bizonyos fejmozdulatokra elmozdulnak.</p>' +
        '<p>Kezelés nélkül is általában néhány hét–hónap alatt, maradványtünet nélkül megszűnik; speciális manőverekkel a gyógyulás gyorsítható. A kezelőorvos az érintett oldalnak és ívjáratnak megfelelő gyakorlatot javasolja. A gyakorlatok után átmenetileg fokozódhat a szédülés, hányinger, bizonytalanság. Lehetőleg naponta 3–4 alkalommal végezze, amíg a panaszok megszűnnek.</p>' +
        '<ul><li>Kerülje a szédülést provokáló fejhelyzeteket!</li><li>Végezze a javasolt manővereket!</li><li>Kerülje az alvást az érintett oldalon!</li>' +
        '<li>Ébredés után lassan üljön fel, és üljön az ágy szélén egy percig felállás előtt!</li><li>Szedje a javasolt gyógyszereket!</li>' +
        '<li>Ne vezessen, amíg a panaszai teljesen meg nem szűnnek!</li></ul>',
    },
    {
      id: 'sources', title: 'Források',
      html:
        '<ul>' +
        '<li>ÉPC-HK SBO: Szédüléssel jelentkező beteg ellátása, SOP v1.0 (2023.09.01.) – az alkalmazás döntési fája ezen alapul.</li>' +
        '<li>Edlow JA et al. Guidelines for reasonable and appropriate care in the emergency department 3 (GRACE-3): Acute dizziness and vertigo in the emergency department. Acad Emerg Med 2023;30:442–486. – az SOP irodalomjegyzékében is szerepel; a „nystagmus nélküli AVS” megjegyzés innen származik.</li>' +
        '<li>Johnston SC et al. Validation and refinement of scores to predict very early stroke risk after transient ischaemic attack. Lancet 2007;369:283–292. – ABCD2 pontozás és kockázati sávok (az SOP hivatkozik az ABCD2-re, a pontozást nem közli).</li>' +
        '<li>Freeman R et al. Consensus statement on the definition of orthostatic hypotension, neurally mediated syncope and the postural tachycardia syndrome. Clin Auton Res 2011;21:69–72. – orthostaticus hypotonia (szisztolés ≥20 / diasztolés ≥10 Hgmm esés 3 percen belül) és POTS (≥30/perc pulzusemelkedés) határértékei (az SOP nem közli).</li>' +
        '</ul>',
    },
  ];

  var api = { SOP: SOP, DRUGS: DRUGS, THERAPY: THERAPY, VIDEOS: VIDEOS, REFERENCE: REFERENCE };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.VertigoContent = api;
})(typeof window !== 'undefined' ? window : this);
