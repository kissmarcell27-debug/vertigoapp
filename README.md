# SBO döntéstámogató

Böngészőben futó döntéstámogató a sürgősségi osztály eljárásrendjei (SOP) alapján. Több eljárásrendet kezel:
a kezdőlapon választható ki, melyik szerint vizsgálja a beteget. Mindegyikhez tartozik lépésenkénti vizsgálat,
élő döntési panel SOP-hivatkozásokkal, az ambuláns lapba részenként másolható dokumentáció és referencia.

| # | Eljárásrend | Modul | SOP |
|---|---|---|---|
| 14 | Szédüléssel jelentkező beteg ellátása | `protocols/szedules/` | ÉPC-HK SBO, v1.0 (2023.09.01.) – **érvényessége 2025.12.31-én lejárt** |
| 5 | Syncope eljárásrend | `protocols/syncope/` | ÉPC-HK SBC, v1.0 (2026.02.10.) – érvényes 2027.01.01-ig |
| 17 | Intracranialis vérzések sürgősségi kezelése (fejsérülés, IC vérzés) | `protocols/fejserules/` | ÉPC-HK SBC, v1.0 (2024.04.25.) – **érvényessége 2025.12.31-én lejárt** |
| – | MSTR Triage segéd (felnőtt) | `protocols/triage/` | Magyar Sürgősségi Triázs Rendszer (CTAS-adaptáció); az SBC Portál prototípusából átemelve, specifikáció: [`docs/mstr-triage-logika.md`](docs/mstr-triage-logika.md) |

Új eljárásrend hozzáadása: [`docs/UJ_ELJARASREND.md`](docs/UJ_ELJARASREND.md) (sablon: `protocols/_sablon/`).

**Weboldalként közzététel (GitHub Pages):** lépésről lépésre a [`docs/GITHUB_PAGES.md`](docs/GITHUB_PAGES.md) leírásban. A bekapcsolás előtt olvassa el a láthatóságról és a szerzői jogról szóló részt.

> ⚠️ Döntéstámogató eszköz, nem helyettesíti a klinikai ítéletet. Lejárt érvényességű SOP-nál az app figyelmeztet.

## Használat

Nincs telepítés és build. Nyissa meg az `index.html`-t böngészőben, vagy szolgálja ki statikusan
(pl. GitHub Pages). Adatot nem tárol és nem küld: minden a böngésző memóriájában marad.
A kezdőlapon válassza ki az eljárásrendet; eljárásrendek között váltva a megkezdett adatok megmaradnak
(oldalfrissítésig), az „Új beteg” gomb csak az aktuális eljárásrend adatait törli.

A szédülés-modul lépései:

1. **Stabilitás, primer vizsgálat:** ABCDE, paraméterek, EKG, vénás vérgáz, labor, orthostasis teszt (automatikus kiértékeléssel).
2. **Anamnézis:** trauma, kezdet, provokáló tényezők, hallás, „red flag” tünetek, előzmények.
3. **Fokális neurológiai tünet:** ha van, stroke protokoll.
4. **Nem neurológiai ok?** Kóros nystagmus, dysmetria vagy törzsataxia nélkül szekunder szédülés.
5. **Besorolás:** AVS / s-EVS / t-EVS (időbeli lefolyás és triggerelhetőség alapján).
6. **Ágspecifikus kivizsgálás:**
   - **AVS:** trauma/fejfájás (CT), gyógyszerhatás (1. melléklet), **HINTS+**, statokinetikus próbák, harmonikus vagy diszharmonikus tünetcsoport, súlyosság.
   - **s-EVS:** ABCD2 kalkulátor, TIA-kockázat, kísérő tünetek (migrén, Ménière, pszichogén), lefolyás.
   - **t-EVS:** Dix-Hallpike (két oldal), supine roll, BPPV oldal és ívjárat, Epley vagy Barbecue, negatív teszt után orthostasis.
7. **Terápia:** az SOP 8. fejezetének gyógyszerei és az oktatóvideók.
8. **Összegzés:** dokumentációba másolható szöveg (döntési út, munkadiagnózis, teendők, diszpozíció, SOP-hivatkozásokkal), nyomtatás.

A jobb oldali panel minden válasz után frissül: mutatja a döntési utat, a figyelmeztetéseket, a
munkadiagnózist, a teendőket és a diszpozíciót, mindegyik mellett az SOP-fejezettel.
A **Referencia** fülön az SOP vizsgálati leírásai, manőverei, gyógyszerei és a BPPV-betegtájékoztató találhatók.

## Felépítés

| Hely | Tartalom |
|---|---|
| `js/core/registry.js` | Eljárásrend-regiszter (`SBO.register`), közös szöveg- és mező-segédek |
| `js/core/engine.js` | Közös felület: kezdőlap, lépések, mezők, élő panel, dokumentáció, másolás, referencia, útválasztás (`#/<id>`) |
| `protocols/<id>/` | Egy eljárásrend: `logic.js` (döntési logika), `content.js`, `docs.js` (ambuláns lap szövege), `illustrations.js`, `protocol.js` (lépések, regisztráció) |
| `protocols/_sablon/` | Kiinduló minta új eljárásrendhez (nincs betöltve) |
| `tests/protocols.test.js` | Szerződés-teszt: minden betöltött modult (és a sablont) ellenőrzi |
| `tests/<id>/` | Az adott eljárásrend döntési fájának és dokumentációjának tesztjei |
| `scripts/build-standalone.js` | Egyfájlos, offline változat készítése az `index.html` alapján |

Tesztek futtatása: `npm test` (Node ≥18, függőség nélkül).

### Szédülés-modul (SOP 14)

#### Döntési szabályok és források

| Szabály | Forrás |
|---|---|
| Fő algoritmus (stabilitás → fokális tünet → nem neurológiai ok → AVS / s-EVS / t-EVS) | SOP 5.1–5.2, 1. ábra |
| HINTS+: **bármely** centrális jel (HIT negatív, vertikális / rotatoros / tekintésirányú nystagmus, pozitív skew, akut féloldali halláscsökkenés, diszharmonikus tünetcsoport, hátradőlés / törzsataxia) → centrális; perifériás csak **teljes** perifériás mintázatnál; hiányos vizsgálat → nem egyértelmű (neurológiai konzílium) | SOP 5.3, 6.1–6.4, 7. oldali táblázat, 2. ábra |
| Harmonikus = dőlés/félremutatás a nystagmus gyors komponensével ellentétes | SOP 6.1.2 |
| Pozícionális teszt: tipikus → BPPV; nincs latencia / irányváltó / nem csökken → centrális gyanú | SOP 6.5, 3. ábra |
| Nystagmus nélküli AVS-ben a HINTS nem értékelhető, a járás / törzsataxia vizsgálandó | GRACE-3 (Edlow et al., Acad Emerg Med 2023), az SOP irodalomjegyzékéből |
| ABCD2 pontozás és kockázati sávok (0–3 / 4–5 / 6–7) | Johnston et al., Lancet 2007; az SOP csak említi |
| Orthostaticus hypotonia: szisztolés ≥20 vagy diasztolés ≥10 Hgmm esés; POTS: ≥30/perc pulzusemelkedés | Freeman et al., Clin Auton Res 2011; az SOP nem közli |

Ahol a logika túlmegy az SOP szövegén (pl. a hiányos HINTS+ kezelése, külső határértékek),
az alkalmazás ezt a felületen is jelzi.

## Korlátok

- Az SOP az ÉPC-HK SBO belső eljárásrendje; a szerzői jogi megjegyzése szerint a felhasználáshoz a szerzők engedélye szükséges.
- Diagnosztikai döntést támogató szoftverként éles klinikai használat előtt az orvostechnikai eszközökre vonatkozó szabályozást (EU MDR, 11. szabály) is vizsgálni kell.

## Egyfájlos változat

A `sbo-dontestamogato.html` a teljes app (minden eljárásrenddel) egyetlen fájlban (CSS és JS beágyazva): letölthető, és dupla kattintással offline is megnyitható.
A forrásfájlok módosítása után újragenerálandó: `npm run build`.

## Animált ábrák

A HINTS+ lépésben minden vizsgálat alatt egy „Hogyan néz ki?” gomb animált, sematikus SVG-ábrát nyit meg
(`protocols/szedules/illustrations.js`): Head Impulse Test (normál VOR vs. korrekciós szakkád), a nystagmus típusai
(iránytartó horizontális, vertikális, rotatoros, tekintésirányú), skew deviation (váltakozó takarás), ujjdörzsöléses
hallásvizsgálat, Romberg-próba, Bárány-féle mutatópróba, vakjárás. Ugyanezek a Referencia fülön is megtalálhatók.
Szemből nézett ábrákon a beteg jobb oldala a kép bal oldalán van.

## Dokumentáció az SBO ambuláns lapba

Az Összegzés lépés a lap mezőinek megfelelően, **részenként másolható** szöveget készít (`protocols/szedules/docs.js`):
Jelen panasz, Status (paraméterek, EKG, labor), Neurológiai status (vestibularis vizsgálat), Epikrízis,
Diagnózis (BNO-javaslattal, ellenőrizendő), Javaslat. A megfogalmazás az osztályon használt dokumentációs
fordulatokat követi („A fentebb részletezett anamnézisű beteget … vizsgáltuk ambulanciánkon”, „… negál”,
„Mko. Dix-Hallpike-manőver negatív”, „javaslatokkal ellátva otthonába emittáljuk”).

Csak a megadott adatokból következő állítás kerül bele; „negál” csak kifejezett nemleges válasznál vagy a
„nem jelölt tüneteket negálja” jelölésnél. Hiányzó adat helyén `___` kitöltendő hely marad. Minden rész
szerkeszthető; a szerkesztett részt a további adatváltozás nem írja felül, az „Újragenerálás” igen.

### Syncope-modul (SOP 5)

A lépések a SOP 4. ábrájának sorrendjét követik, mindegyik tetején „Mit kell itt tenni?” útmutatóval:
stabilitás és TLOC-besorolás (fejtraumánál átlépés a fejsérülés-modulba) → anamnézis (testhelyzet, prodroma kötelező) →
vizsgálatok → EKG (normál? csak kóros EKG-nál eltéréslista; a bizonyító eltérés automatikusan aritmogén diagnózis és
magas kockázat) → egyértelmű diagnózis (egy választás) → rizikóbecslés három kérdésben (magas? → közepes? → alacsony
feltételei), az eredmény indoklásával → diszpozíció. Részletek: **aktív állás vizsgálat** az SOP 4.4 kritériumaival (>20 / >10 Hgmm esés vagy <90 Hgmm;
POTS: >30/perc vagy >120/perc OH nélkül) és az OH-syncope bizonyosságával (igazolt / valószínű / lehetséges),
carotis sinus masszázs (CSS / CSH), egyértelmű diagnózisok (4.5), rizikóbecslés (5.1–5.3; alacsony kockázathoz
negatív fizikális vizsgálat és normál EKG is kell, a magas kockázati lista áttekintését meg kell erősíteni),
diszpozíció (6.1–6.4), betegtájékoztató ellenmanőverekkel.

### Fejsérülés / IC vérzés modul (SOP 17)

GCS-kalkulátor, rizikócsoport (4.), CT-indikáció és időzítés (1 órás / 8 órás szabály, nyaki gerinc CT, CI–CII
kiegészítés), speciális csoportok (13.: antikoagulált INR >1,4 / <1,4; TAG-gátló tünetes / tünetmentes), CT utáni
diszpozíció és hospitalizációs kritériumok (11–12.), aranyóra (vérnyomás-célérték max. 15%-os csökkenéssel,
testtömeg-alapú dózisok), nem traumás ICH / lobáris vérzés / SAV elhelyezése (2.), fejsérült-tájékoztató.

Ahol a modul túlmegy az SOP szövegén, a felület jelzi:
- **INR = 1,4:** az SOP csak az „1,4 felett / alatt” esetet definiálja, ilyenkor a biztonságosabb utat javasolja.
- **NOAC:** a hatását az INR nem tükrözi megbízhatóan.
- **Antikoagulált beteg tájékoztatója:** a „vérhígítót ne szedjen” tanács helyett egyedi döntés kell.

### MSTR Triage modul (az SBC Portálból)

Az SBC Portál (`sbc-portal`) React-prototípusának triázs-modulja, a közös motorra átírva. A besorolási logika, a küszöbök
és a színek **változatlanok** (`protocols/triage/logic.js`, specifikáció: `docs/mstr-triage-logika.md`): minden rögzített
tényező egy javasolt szintet ad, a végeredmény a legsúlyosabb (legkisebb számú) szint. Lépések: felvétel és elsődleges
megtekintés (azonnali beavatkozás → MSTR 1, fertőzésszűrés) → vezető panasz (72 CEDIS-panasz javaslatlistával, egyéni is
megadható) → vitális paraméterek (SpO₂- és GCS-szint, SIRS-számláló élőben) → légzés, keringés, láz (≥38 °C-nál), fájdalom
(VAS × hely × jelleg) → vérzés, baleseti mechanizmus → másodlagos módosítók → felül-triázsolás, fast track, konzílium,
esemény leírása → jegyzőkönyv. A panel tetején a színes MSTR-sáv (újraértékelési idő, meghatározó tényező) és a kötelező
figyelmeztetés látszik.

A jegyzőkönyv szövege a prototípuséval azonos formátumú (másolható); a nyomtatható / letölthető lap etikett-hellyel
(6×3 cm, betegazonosító nem kerül rögzítésre) és a kötelező figyelmeztetéssel készül. Tesztek: `tests/triage/` (minden küszöb határértéke).

**A portál beosztás-moduljai nem kerültek át:** a portál saját leírása szerint valós kollégák neveit tartalmazzák, és csak
privát repóban tárolhatók; ez a repó nyilvános. Nem implementált (a portálban sem): gyermek MSTR protokoll.

## Ikoncsomag

`js/core/icons.js`: 24×24-es vonalas SVG ikonok (szédülés, syncope, fejsérülés, triage, általános SOP) és az alkalmazás-ikon
(favicon, a logó kék→türkiz átmenetével). Az ikonok a környező szín szerint színeződnek; az eljárásrend az `icon` mezővel
választ. Önálló SVG-fájlként az `assets/icons/` mappában (az `npm run build` újragenerálja).

