# MSTR Triage — klinikai logika (specifikáció)

Ez a modul besorolási logikájának irányadó leírása. Forrás: a Magyar Sürgősségi
Triázs Rendszer (MSTR, a kanadai CTAS adaptációja) felnőtt protokollja.
**A kódot ennek alapján kell karbantartani.** A küszöbértékek klinikai adatok;
módosításuk csak a megrendelővel egyeztetve, dokumentáltan történhet.

## Alapelv

- Öt súlyossági szint. Minden rögzített tényező egy **javasolt szintet** ad.
- A végeredmény mindig a **legsúlyosabb** (legalacsonyabb számú) aktív szint.
- A **normál** leletek (pl. SpO₂ > 94%, GCS 14–15, nincs láz) **nem emelnek** szintet.
- Az ápoló **felül-triázsolhat** (magasabb kockázat megítélése alapján).
- Kritikus állapotban a triázs **nem késleltetheti** az ellátást.

## Az öt MSTR szint

| Szint | Név | Újraértékelés | Szín |
|---|---|---|---|
| 1 | Reszuszcitáció / azonnali | folyamatos | piros (#dc2626) |
| 2 | Kritikus | 15 perc | narancs (#f97316) |
| 3 | Sürgős | 30 perc | sárga (#facc15) |
| 4 | Kevésbé sürgős | 60 perc | zöld (#16a34a) |
| 5 | Halasztható | 120 perc | kék (#1e3a8a) |

## A triázs folyamata (a UI sorrendje)

1. **Elsődleges megtekintés (ABCD, 3–5 mp).** Azonnali beavatkozás igénye →
   automatikusan MSTR 1. Fertőző szűrés (csepp/kontakt) → izolációs jelzés.
2. **Vezető panasz** (CEDIS-lista, kereshető; egyéni is megadható).
3. **Vitális paraméterek** (lásd elsődleges módosítók).
4. **Kvalitatív megítélés** (légzési munka, keringés, láz küllem, fájdalom).
5. **Vérzés / baleseti mechanizmus.**
6. **Másodlagos módosítók** (panaszspecifikus).
7. **Felül-triázsolás** (ápolói megítélés).
8. **Diszpozíció** (fast track, konzílium) + **esemény leírása**.

## Elsődleges módosítók (küszöbök)

### Légzés / szaturáció
| Megítélés | SpO₂ | Szint |
|---|---|---|
| Súlyos (cianózis, kimerült, beszédképtelen, lélegeztetés) | < 90% | 1 |
| Közepes (fokozott munka, rövid mondatok, jelentős stridor) | 90–92% | 2 |
| Enyhe (csak terhelésre, összefüggő beszéd) | 92–94% | 3 |
| Nincs nehézlégzés | > 94% | 4–5 (nem emel) |

A mért SpO₂ „padlóként" működik (automatikus minimum szint), a légzési munka
megítélése ezt felfelé írhatja.

### Keringés
| Megítélés | Szint |
|---|---|
| Sokk (hipoperfúzió, hipotónia, hűvös bőr, gyenge pulzus) | 1 |
| Hemodinamikai instabilitás (indokolatlan tahikardia, ortosztázis, ájulásérzés) | 2 |
| Határérték / eltér a megszokottól | 3 |
| Normál | 4–5 (nem emel) |

### Tudat — GCS (Szem 1–4, Verbál 1–5, Mozgás 1–6)
| GCS összeg | Szint |
|---|---|
| 3–9 | 1 |
| 10–13 | 2 |
| 14–15 | 3–5 (nem emel) |

### Láz (> 38 °C, felnőtt) — SIRS-függő
SIRS-kritériumok: testhő > 38 vagy < 36 °C; pulzus > 90/min; légzésszám > 20/min;
FVS-eltérés (> 12 vagy < 4 ezer).

| Küllem | Szint |
|---|---|
| Immunhiányos / csökkent immunválasz | 2 |
| Szeptikus küllem (≥ 3 SIRS, vagy instabil / közepes nehézlégzés / módosult tudat) | 2 |
| Súlyos beteg küllem (< 3 SIRS) | 3 |
| Jó általános állapot (a láz az egyetlen pozitív SIRS) | 4 |

A láz-blokk csak akkor jelenik meg, ha testhő ≥ 38 °C.

### Fájdalom (VAS 0–10) — hely + jelleg szerint
VAS-sáv: enyhe 1–3, mérsékelt 4–7, súlyos 8–10.

| Hely | Jelleg | Súlyos (8–10) | Mérsékelt (4–7) | Enyhe (1–3) |
|---|---|---|---|---|
| Centrális | heveny | 2 | 3 | 4 |
| Centrális | krónikus | 3 | 4 | 5 |
| Perifériás | heveny | 3 | 4 | 5 |
| Perifériás | krónikus | 4 | 5 | 5 |

A hely/jelleg választás csak akkor jelenik meg, ha van VAS-érték.

### Vérzés / alvadás
| Megítélés | Szint |
|---|---|
| Életet/végtagot veszélyeztető súlyos vérzés (vagy alvadászavar/antikoaguláns mellett) | 2 |
| Enyhe / közepes vérzés | 3 |

### Baleseti mechanizmus
Magas rizikójú mechanizmus (kiesés/átfordulás, > 40–60 km/h, > 3 m esés, gázolás,
áthatoló törzssérülés) → **MSTR 2**.

## Másodlagos módosítók (panaszspecifikus)
- Vércukor: hipo (< 3) v. hiper (> 18) tünetekkel → 2; tünet nélkül → 3.
- Magas vérnyomás (≥ 220/130): tünettel → 2; tünet nélkül → 3.
- Szív eredetű (v. jelentős) mellkasi fájdalom → 2.
- Stroke / féloldali gyengeség: kezdet < 4,5 óra → 2; > 4,5 óra v. megszűnt → 3.
- Nyelésképtelenség nyáladzással + stridor → 2.
- Végtagsérülés nyilvánvaló deformitással → 3.
- Kiszáradás: közepes → 2; enyhe → 3.

## Diszpozíció
- **Fast track** jelölő (a beteg fast track vizsgálóba kerül).
- **Konzílium** (több is): Sebészet, Traumatológia, Égéssebészet, Belgyógyászat,
  Kardiológia, Neurológia, Ortopédia, Szemészet, Fül-orr-gége, Nőgyógyászat,
  Urológia, Pszichiátria, + egyéni.

## Kimenet (jegyzőkönyv)
Nyomtatható / letölthető / vágólapra másolható. Tartalma: időpont, érkezés módja,
vezető panasz, vitális paraméterek rácsban, megállapított MSTR szint + meghatározó
tényező, rögzített tényezők listája, diszpozíció, esemény leírása, triázs ápoló,
aláírás-hely. **Betegazonosító helyett 6×3 cm-es etikett-mező.** A lap alján a
klinikai figyelmeztetés kötelező.

## Nem implementált (későbbi)
- Gyermek (pediátriai) MSTR protokoll (életkor-specifikus vitális táblák, PAT,
  gyermek GCS, FLACC/Wong-Baker skálák).
