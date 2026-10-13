# Új eljárásrend (SOP) hozzáadása

Az app egy közös motorból (`js/core/`) és eljárásrend-modulokból (`protocols/<azonosító>/`) áll.
A motor megjeleníti a lépéseket, az élő döntési panelt, a részenként másolható dokumentációt, a
referencia fület és a kezdőlapi listát. A modul csak az adott SOP tartalmát adja.

## Lépések

1. **Másolja le a sablont:** `protocols/_sablon/` → `protocols/<azonosito>/` (pl. `mellkasi-fajdalom`).
2. **Töltse ki** a `protocol.js`-t (lásd a szerződést lent). Nagyobb modulnál érdemes szétbontani, ahogy
   a `protocols/szedules/` mappa teszi:
   - `logic.js`: döntési logika, tiszta függvények, Node-ból is tesztelhető
   - `content.js`: referencia-szövegek, gyógyszerlisták
   - `docs.js`: az ambuláns lapba kerülő szöveg
   - `illustrations.js`: animált ábrák (opcionális)
   - `protocol.js`: lépések, widgetek, regisztráció
3. **Vegye fel a szkripteket** az `index.html`-be a `js/core/registry.js` után és a `js/core/engine.js` elé.
4. **Írjon teszteket** a `tests/<azonosito>/` mappába az SOP ábráinak minden ágára (minta: `tests/szedules/`).
5. **Futtassa** a teszteket (`npm test`), és készítse el az egyfájlos változatot (`npm run build`).
   A `tests/protocols.test.js` szerződés-teszt automatikusan ellenőrzi az új modult is.

## A modul szerződése (`SBO.register({...})`)

| Mező | Kötelező | Leírás |
|---|---|---|
| `id` | igen | URL-azonosító (`#/<id>`), kisbetű, szám, kötőjel |
| `title`, `short` | igen | Teljes és rövid név (fejléc, böngészőfül, összegzés) |
| `description` | | Egysoros leírás a kezdőlapi kártyára |
| `icon` | | Ikon neve a `js/core/icons.js` csomagból (`vertigo`, `syncope`, `headinjury`, `triage`, `sop`); új ikon ott vehető fel |
| `color` | | Az eljárásrend azonosító színe: `{ base, ink, inkDark }`. `base` = a nyomtatott SOP fejlécszíne; `ink` / `inkDark` = ennek szövegként olvasható (≥4,5:1 kontrasztú) sötét / világos változata |
| `sop` | igen | `{ number, title, issuer, version, validUntil: 'ÉÉÉÉ-HH-NN' }`. Lejárt érvényességnél figyelmeztet az app. |
| `steps` | igen | Lépések: `{ id, title, ref, fields: [...] }`. Egy lépésben `{ type: 'summary' }` mezőnek kell lennie. |
| `stepVisible(id, state, r)` | | Melyik lépés látszik az adott állapotban (alapértelmezés: mind) |
| `evaluate(state)` | igen | Döntési logika. Visszaad: `{ category, stage, path[], alerts[{level,text,ref}], workingDx[{text,ref}], actions[], disposition[], differentials[{group,items}] }` |
| `stageToStep` | igen | `evaluate().stage` → lépés-azonosító (a „Következő teendő” gombhoz) |
| `categories` | igen | Kategóriakód → megjelenített név |
| `dangerCategories` | | Pirossal kiemelt kategóriák |
| `widgets` | | Egyedi mezők: `{ név: { render(ctx), live?(ctx) } }`. A `live` rész minden adatváltozáskor újrarajzolódik. `ctx = { state, r, esc, radios }` |
| `illustrations` | | `{ get(név) → HTML }`, `{ type: 'illus', name }` mezőhöz |
| `docSections(state, r)` | | Ambuláns lap részei: `[{ id, title, text }]` |
| `reportFindings(state, r)` | | A strukturált összegzés protokollspecifikus sorai: `[string]` |
| `reference(esc)` | | Referencia fül: `[{ id, title, html }]` |
| `panelTop(r)` | | Saját HTML a döntési panel tetején (pl. a triage színes MSTR-sávja). Ha meg van adva, ez helyettesíti a kategória-dobozt. |
| `actions` | | Saját gombok: `{ név: function (state, r) }`; a felületen `<button data-action="név">`. Lefutás után a motor újrarajzol. (Pl. nyomtatás, „Most” időpont.) |
| `categoryLabel` | | A kategória címkéje a strukturált összegzésben (alapértelmezés: `CSOPORTDIAGNÓZIS`) |

### Mezőtípusok

`yn` (Igen/Nem), `choice` (`options: [{v, l}]`), `check`, `text` (opcionálisan `input: 'datetime-local'` stb. és
`list: [{v, l}]` gépelés közbeni javaslatlistához), `textarea`, `num`, `num2` (`keys: [a, b]`, `ph`),
`heading`, `note` (`level: info|warn|danger|ok`, `html`), `illus`, `widget`, `summary`.
Bármely mezőhöz megadható egy `when(state, r)` feltétel.

### Közös segédek (`SBO.text`, `SBO.fields`)

- `SBO.fields.vitals()`: RR, pulzus, SpO₂, testhőmérséklet mezők (`vit.*` kulcsok)
- `SBO.text.vitalsLine(state)`: `BP: … Hgmm, P: …/min, SpO₂: …%, T: …°C` az osztályos sablon szerint
- `SBO.text.val`, `or`, `BLANK`, `joinHu`, `cap`: szöveg-segédek a dokumentációhoz

## Tartalmi elvek (minden modulra)

- Minden következtetés mellé `ref` kerül: az SOP fejezete vagy ábrája, illetve a külső forrás, ha az SOP-ban nem szerepel.
- Ahol a logika túlmegy az SOP szövegén, azt a felületen is jelezni kell.
- A dokumentáció csak a megadott adatokból állít. „Negál” csak kifejezett nemleges válasznál szerepelhet, hiányzó adat helyén `___` marad.
- Bizonytalan vagy hiányos vizsgálatnál a biztonságosabb utat kell választani (pl. konzílium).
