/*
 * Referencia-tartalom – „Syncope eljárásrend” (ÉPC-HK SBC SOP 5., v1.0), tömörítve.
 */
(function (root) {
  'use strict';

  var SOP = { number: '5', title: 'Syncope eljárásrend', issuer: 'ÉPC-HK SBC', version: 'v1.0, 2026.02.10.', validUntil: '2027-01-01' };

  var COUNTER = [
    { name: 'Lábkeresztezés és izomfeszítés', how: 'keresztezze a lábait, feszítse meg erősen a láb-, has- és farizmait, és tartsa, amíg bírja vagy amíg a tünetek elmúlnak' },
    { name: 'Kézszorítás', how: 'szorítson össze egy gumilabdát vagy puha tárgyat a lehető legerősebben, amíg jobban nem lesz' },
    { name: 'Karfeszítés', how: 'kulcsolja össze a kezeit, és húzza a karjait egymással szemben erősen megfeszítve, amíg bírja vagy amíg a rosszullét elmúlik' },
  ];

  var REFERENCE = [
    {
      id: 'tloc', title: 'Átmeneti eszméletvesztés (TLOC), elkülönítés (2.)',
      html:
        '<p><b>Syncope:</b> hirtelen, rövid, átmeneti eszméletvesztés, hátterében az agy hypoperfúziója; spontán, tiszta tudattal tér magához. Amíg a rosszullét természete nem tisztázott, érdemes a tágabb TLOC megnevezést használni.</p>' +
        '<p><b>TLOC típusai:</b> nem traumás – syncope (reflex, ortosztatikus, kardiális), epilepsziás roham (tónusos, klónusos, tónusos-klónusos, atóniás), pszichogén (PPS, PNES), ritka okok (subclavian steal, vertebrobasilaris TIA, SAV); ill. fejtrauma okozta TLOC (külön eljárásrend).</p>' +
        '<table class="ref-table"><thead><tr><th>Jellemző</th><th>Syncope</th><th>Epilepsziás roham</th></tr></thead><tbody>' +
        '<tr><td>Trigger</td><td>nagyon gyakori</td><td>ritka (villanó fények)</td></tr>' +
        '<tr><td>Prodroma</td><td>gyakran presyncope</td><td>ismétlődő, betegspecifikus aura</td></tr>' +
        '<tr><td>Myoclonus</td><td>&lt;10 mp, irreguláris, aszinkron, aszimmetrikus; az eszméletvesztés után indul</td><td>20–100 szinkron, szimmetrikus vagy féloldali; az eszméletvesztéssel együtt indul; automatizmusok (rágás, csámcsogás)</td></tr>' +
        '<tr><td>Nyelvharapás</td><td>ritka, inkább a nyelvcsúcs</td><td>nyelvszél (ritkán kétoldali)</td></tr>' +
        '<tr><td>Tudat visszanyerése</td><td>10–30 mp</td><td>percek</td></tr>' +
        '<tr><td>Utána</td><td>&lt;10 mp zavartság, majd teljes éberség</td><td>memóriadeficit, dezorientáltság percekig</td></tr>' +
        '<tr><td colspan="3"><i>Limitált értékű jegyek:</i> inkontinencia (előfordul / gyakori), nyitott szem (gyakran / szinte mindig), roham utáni fáradtság (gyakori / nagyon gyakori), a fejet érintő cianózis (ritka / gyakori).</td></tr>' +
        '</tbody></table>' +
        '<p><b>Tévesen syncope-nak diagnosztizálható:</b> generalizált és komplex parciális rohamok, absence; PPS; kataplexia; ICH / SAV (fokozatos tudatcsökkenés, fejfájás, neurológiai jelek); vertebrobasilaris TIA (fokális jelek); subclavian steal; elesések; szívmegállás.</p>',
    },
    {
      id: 'types', title: 'A syncope típusai (3.)',
      html:
        '<table class="ref-table"><thead><tr><th>Reflex</th><th>Ortosztatikus</th><th>Kardiális</th></tr></thead><tbody><tr>' +
        '<td><b>Vasovagalis:</b> ortosztatikus (állás, ülés), emocionális (félelem, fájdalom, haemofóbia). <b>Szituációs:</b> mikció, GI stimulus (nyelés, székelés), köhögés, tüsszentés, terhelés utáni, nevetés, fúvós hangszer. <b>Carotis sinus szindróma.</b> <b>Nem klasszikus</b> (prodroma / kiváltó ok nélkül).</td>' +
        '<td><b>Gyógyszer:</b> vazodilatátorok, diuretikumok, fenotiazinok, antidepresszánsok. <b>Folyadékhiány:</b> vérzés, hasmenés, hányás. <b>Neurogén OH:</b> diabeteses autonóm neuropathia, gerincvelő-sérülés, polyneuropathiák, veseelégtelenség, Parkinson-kór, MSA, Lewy-testes demencia.</td>' +
        '<td><b>Aritmogén:</b> bradycardia (sinuscsomó-diszfunkció, brady-tachy, AV-vezetési zavar), tachycardia (SVT, kamrai). <b>Strukturális:</b> aortastenosis, AMI, HCM, szívtumor, pericardium/tamponád, műbillentyű-diszfunkció. <b>Kardiopulmonális:</b> PE, aortadisszekció, pulmonális hypertonia.</td>' +
        '</tr></tbody></table><p>Leggyakoribb a vasovagalis, majd az ortosztatikus és az aritmogén syncope.</p>',
    },
    {
      id: 'tests', title: 'Diagnosztika: CSM, aktív állás, OH (4.1–4.4)',
      html:
        '<p><b>Primer vizsgálat:</b> alapos auto- és heteroanamnézis, fizikális vizsgálat, fekvő és álló vérnyomás folyamatos EKG-monitor mellett, 12 elvezetéses EKG. <b>További:</b> azonnali monitor aritmogén gyanúnál; echo strukturális szívbetegségnél; CSM 40 év felett; labor a klinikum szerint (troponin, D-dimer, vérgáz).</p>' +
        '<p><b>Carotis sinus masszázs:</b> 40 év feletti, feltételezett reflex mechanizmusú, ismeretlen etiológiájú syncopéban; fekve és állva. Pozitív: >3 mp-es kamrai pauza és/vagy >50 Hgmm szisztolés esés, a tünetek reprodukálódnak. Korábbi syncope mellett CSS, anélkül CSH (idősek 40%-ában jelen lehet, nem specifikus). Korábbi stroke/TIA, >70%-os carotis stenosis esetén óvatosan, magas kockázatnál elhagyható.</p>' +
        '<p><b>Aktív állás:</b> RR és pulzus fekve, 0 perces, majd 3 perces állás után; rövid ingadozás gyanújánál folyamatos monitorozás.</p>' +
        '<p><b>OH kritérium:</b> >20 Hgmm szisztolés vagy >10 Hgmm diasztolés esés, vagy <90 Hgmm szisztolés érték. <i>Igazolt</i> OH-syncope: a panaszok a vizsgálat alatt jelentkeznek. <i>Valószínű:</i> tünetmentes a vizsgálatkor, de az anamnézis OH-nak megfelel; vagy reprodukálható, de az anamnézis nem mindenben utal OH-ra. <i>Lehetséges:</i> tünetmentes, és az anamnézis kevésbé felel meg. <b>POTS:</b> OH nélküli >30/perc emelkedés vagy >120/perc (10 perc állás), a panaszokat reprodukálja.</p>' +
        '<table class="ref-table"><thead><tr><th>Ortosztatikus intolerancia</th><th>Idő</th><th>Jellemző</th></tr></thead><tbody>' +
        '<tr><td>Kezdeti OH</td><td>0–15 mp</td><td>fiatal, aszténiás; idős; alfa-blokkoló</td></tr>' +
        '<tr><td>Klasszikus OH</td><td>&lt;3 perc</td><td>elesett idősek; vazoaktív szerek, diuretikum; hypovolaemia; autonóm zavar</td></tr>' +
        '<tr><td>Késői OH (± reflex syncope)</td><td>&gt;3 perc</td><td>elesett idősek; kezdődő autonóm zavar; gyógyszer; társbetegségek</td></tr>' +
        '<tr><td>Ortosztatikus VVS</td><td>hosszabb állás</td><td>női nem; krónikus ortosztatikus intolerancia</td></tr>' +
        '<tr><td>POTS</td><td>&lt;10 perc, kóros frekvencia</td><td>fiatal nők; lezajlott fertőzés; trauma; hipermobilitás</td></tr>' +
        '</tbody></table>',
    },
    {
      id: 'dx', title: 'Egyértelmű és felvethető diagnózisok (4.5–4.6)',
      html:
        '<p><b>Vasovagalis (erősen valószínű):</b> fájdalom, félelem vagy állás váltotta ki, típusos progresszív prodroma (sápadtság, verejtékezés, hányinger). <b>Szituációs (igazolható):</b> mikció, nyelés, székelés, köhögés, tüsszentés, terhelés, nevetés, fúvós hangszer. <b>Ortosztatikus (igazolható):</b> állás közben, egyidejűleg kimutatható jelentős OH. Ezek hiányában reflex/ortosztatikus syncope valószínűsíthető, ha a jegyek jelen vannak és kardiogén tényező nincs.</p>' +
        '<p><b>Aritmogén (bizonyítható):</b> perzisztens sinus bradycardia <40/perc vagy >3 mp pauza ébren, terhelés nélkül; Mobitz II / III. fokú AV-blokk; alternáló BTSZB és JTSZB; VT vagy gyors SVT; nem tartós polimorf VT és rövid/hosszú QT; PM/ICD diszfunkció pauzákkal. <b>Ischaemiás:</b> igazolt akut myocardialis ischaemia mellett. <b>Strukturális:</b> súlyos AS, pitvari myxoma, bal pitvari gömbthrombus, PE, akut aortadisszekció.</p>' +
        '<p><b>Reflex syncopéra utal:</b> korábbi syncope (gyakran 40 év előtt); kellemetlen látvány/hang/szag/fájdalom; tartós állás; étkezés; zsúfolt/meleg hely; autonóm prodroma; fejfordítás / carotis-nyomás; szívbetegség hiánya. <b>Ortosztatikusra:</b> állás alatt/után; tartós állás; terhelést követő állás; postprandiális hypotonia; autonóm neuropathia / parkinsonismus; időben egybeeső gyógyszermódosítás. <b>Kardiogénre:</b> terhelés alatt vagy fekve; hirtelen palpitáció, majd syncope; fiatalkori hirtelen szívhalál a családban; strukturális / koszorúér-betegség; aritmogén EKG-eltérések (tri-/bifascicularis blokk, QRS >0,12 s, Mobitz I + megnyúlt PR, inappropriate bradycardia 40–50/perc, NSVT, rövid/hosszú QT, korai repolarizáció, Brugada I, negatív T jobb precordialisan / epsilon, preexcitáció, HCM-re típusos LVH).</p>',
    },
    {
      id: 'risk', title: 'Rizikóbecslés és diszpozíció (5–6.)',
      html:
        '<p><b>Alacsony:</b> prodromával induló reflex syncope; kellemetlen inger; tartós állás / zsúfolt, meleg hely; étkezés / postprandiális; fejfordítás / carotis-nyomás; strukturális szívbetegség hiánya, évekkel korábbi hasonló syncope; negatív fizikális vizsgálat; EKG eltérés nélkül. → További sürgősségi kivizsgálás nem kell, emittálható; tájékoztatás, életmód; rizikófaktoroknál kardiológiai szakrendelés.</p>' +
        '<p><b>Magas:</b> újkeletű mellkasi diszkomfort, légszomj, hasi fájdalom, fejfájás; terhelés alatt / fekve; hirtelen palpitáció, majd syncope; szívbetegséghez / kóros EKG-hoz társulva prodroma nélkül vagy <10 mp prodromával, fiatalkori hirtelen szívhalál a családban, ülve jelentkező syncope; súlyos strukturális / koronáriabetegség; mással nem magyarázható hypotonia (<90); perzisztáló bradycardia <40; kivizsgálatlan systolés zörej; GIV; EKG: akut ischaemia, Mobitz II/III, lassú PF <40, sinus bradycardia <40 / SA-blokk / >3 mp pauza, Tawara-szár-blokk, IV vezetési zavar, kamrai hypertrophia, Q-hullám, cardiomyopathia, VT, PM/ICD diszfunkció, Brugada I, QTc >460 ms; korábbi aritmogén syncope mellett további EKG-eltérések. → Monitorozás resuscitatiós készenlétben (jellemzően 6 óra SBO, max. 24 óra kórház), gyors kivizsgálás, szükség esetén felvétel.</p>' +
        '<p><b>Közepes:</b> sem alacsony, sem magas; ismétlődő, életminőséget rontó alacsony kockázatú syncopék; rövid/hiányzó prodromájú reflex syncope trauma veszélyével; magas kockázatú tevékenység közben. → Nem bocsátható haza a primer vizsgálatok után; 12 órás SBO-monitorozás; magas kockázatú ok esetén felvétel, egyébként korai szakirányú járóbeteg-kivizsgálás.</p>' +
        '<p><b>Pontrendszerek</b> (CSRS, EGSYS, San Francisco, OESIL, ROSE) önmagukban nem javasoltak.</p>' +
        '<p><b>Fektetős obszerváció (magas kockázat):</b> stabil, ismert strukturális szívbetegség; súlyos krónikus betegség; syncope fekve/ülve, terhelés során; palpitáció a syncope alatt; inadekvát sinus bradycardia / SA-blokk; eszközdiszfunkció gyanúja; preexcitáció; SVT / paroxizmális PF; öröklött aritmia szindróma / ARVC EKG. <b>Osztályos felvétel:</b> osztályos ellátást igénylő társbetegség; a syncope során keletkezett sérülés; más módon nem szervezhető sürgős kivizsgálás / kezelés; recurráló reflex syncope nagyon rövid / hiányzó prodromával (ILR); kardioinhibitoros reflex syncope; volumenpótlás után is pozitív aktív állás.</p>' +
        '<p><b>Obszerváció után:</b> a monitorozás időtartama a súlyosság és a várható recidíva szerint; ha ICD/PM-indikáció egyértelmű, monitorozás nem kell; aritmia hiányában a presyncope nem egyenértékű a syncopéval, de ha alatta szignifikáns aritmia rögzül, diagnosztikus; syncope alatt detektált aritmia hiánya kizárja az aritmogén syncopét.</p>' +
        '<p><b>Kezelés:</b> súlyos/gyakori reflex syncope alacsony vérnyomás fenotípussal vagy hipotonizáló gyógyszerrel → szakirányú kivizsgálás. Esésre hajlamosaknál ACE-gátló, ARB, Ca-csatorna-blokkoló előnyben a diuretikummal és béta-blokkolóval szemben. Hypertonia hiányában 2–3 l folyadék és 10 g só naponta.</p>',
    },
    {
      id: 'leaflet', title: 'Betegtájékoztató – reflex syncope (7.)',
      html:
        '<p>A syncope (ájulás) rövid, általában 1–2 perces eszméletvesztés, oka az agy átmeneti vérellátás-csökkenése. Leggyakoribb formája a vazovagális syncope; az emberek negyede élete során legalább egyszer átéli.</p>' +
        '<p><b>Ha ájulásérzése van:</b> a legjobb lefeküdni és a lábait megemelni; ha erre nincs lehetőség, üljön le, vagy alkalmazzon ellenmanővert. Gyakori ájulásnál bőséges folyadékfogyasztás (kb. 2 liter) és sóban gazdagabb étrend javasolt (kivéve, ha orvosi okból sómegszorítás szükséges).</p>' +
        '<p><b>Ellenmanőverek</b> (szédülés, gyengeség, homályos látás, verejtékezés, „mindjárt elájulok” érzés esetén azonnal):</p><ul>' +
        COUNTER.map(function (c) { return '<li><b>' + c.name + ':</b> ' + c.how + '.</li>'; }).join('') + '</ul>',
    },
    {
      id: 'sources', title: 'Források',
      html: '<ul><li>ÉPC-HK SBC: Syncope eljárásrend, SOP 5., v1.0 (2026.02.10.) – az app döntési fája ezen alapul.</li>' +
        '<li>Az SOP irodalma: ESC 2018 Syncope Guideline; Wieling W et al. J Intern Med 2013;273:345–358 (carotis sinus hyperaesthesia).</li>' +
        '<li>Az OH-kritériumok itt az SOP szerint szigorú egyenlőtlenséggel (>20 / >10 Hgmm) és a <90 Hgmm abszolút értékkel értékelődnek – ez eltér a szédülés-modulban használt (≥20 / ≥10) konszenzus-definíciótól.</li></ul>',
    },
  ];

  var api = { SOP: SOP, REFERENCE: REFERENCE, COUNTER: COUNTER };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.SyncopeContent = api;
})(typeof window !== 'undefined' ? window : this);
