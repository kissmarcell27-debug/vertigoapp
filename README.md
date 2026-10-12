# Szédülés SBO – döntéstámogató

Böngészőben futó döntéstámogató a szédüléssel jelentkező beteg sürgősségi vizsgálatához, az
**ÉPC-HK SBO „Szédüléssel jelentkező beteg ellátása” SOP (v1.0, 2023.09.01.)** alapján.

> ⚠️ Döntéstámogató eszköz, nem helyettesíti a klinikai ítéletet. A forrás SOP érvényessége
> 2025.12.31-én lejárt. Az alkalmazás ezt induláskor jelzi; használat előtt ellenőrizze, van-e frissebb változat.

## Használat

Nincs telepítés és build. Nyissa meg az `index.html`-t böngészőben, vagy szolgálja ki statikusan
(pl. GitHub Pages). Adatot nem tárol és nem küld: minden a böngésző memóriájában marad.

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

| Fájl | Tartalom |
|---|---|
| `js/logic.js` | Döntési logika (tiszta függvények, DOM nélkül): `evaluate`, `hints`, `harmony`, `abcd2`, `orthostasis`, `positional` |
| `js/content.js` | Referencia-tartalom (gyógyszerlista, terápia, leírások) |
| `js/app.js` | Felület: lépések, élő panel, összegzés |
| `tests/logic.test.js` | Az SOP 1–3. ábrájának összes ágát lefedő tesztek |

Tesztek futtatása: `npm test` (Node ≥18, függőség nélkül).

## Döntési szabályok és források

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
