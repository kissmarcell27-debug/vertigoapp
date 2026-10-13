# Az app közzététele weboldalként (GitHub Pages)

A GitHub Pages ingyenesen kiszolgálja az appot egy webcímen, így letöltés nélkül, böngészőben
(telefonon is) megnyitható. Az app statikus (HTML/CSS/JS), szerver és telepítés nem kell hozzá.

**A cím a bekapcsolás után:** <https://kissmarcell27-debug.github.io/vertigoapp/>

Közvetlen linkek az egyes eljárásrendekhez:

| Eljárásrend | Link |
|---|---|
| Szédülés | `https://kissmarcell27-debug.github.io/vertigoapp/#/szedules` |
| Syncope | `https://kissmarcell27-debug.github.io/vertigoapp/#/syncope` |
| Fejsérülés / IC vérzés | `https://kissmarcell27-debug.github.io/vertigoapp/#/fejserules` |

## ⚠️ Mielőtt bekapcsolja: ki fogja látni?

- **A repó jelenleg nyilvános (public).** A teljes tartalma (forráskód, az SOP-kból összefoglalt szövegek)
  már most bárki számára látható a GitHubon.
- **A Pages-oldal is nyilvános lesz:** bárki megnyithatja, aki ismeri a címet. Az app `noindex` jelzést
  tartalmaz, így a keresők elvileg nem indexelik, de ez nem hozzáférés-védelem.
- **Szerzői jog:** az SOP-k első oldala szerint a tartalom „engedélyük nélküli felhasználása, illetve
  megjelentetése szigorúan tilos”. A nyilvános közzétételhez kérje a szerzők / a jóváhagyók engedélyét.
- **Validálás:** az app döntéstámogató eszköz; éles klinikai használat előtt klinikusnak át kell néznie.

### Ha nem szeretné, hogy nyilvános legyen

| Lehetőség | Mit jelent |
|---|---|
| **A repó privátra állítása** | *Settings → General* → lap alja, *Danger Zone* → **Change visibility** → *Make private*. A kód és az SOP-szövegek így csak Önnek (és meghívottaknak) láthatók. Az ingyenes GitHub-csomagban privát repóból **nem** lehet Pages-oldalt indítani (ehhez GitHub Pro / Team szükséges), és a Pages-oldal akkor is nyilvános címen érhető el. |
| **Pages nélkül, fájlként** | A `sbo-dontestamogato.html` fájl letöltve, dupla kattintással offline is működik – e-mailben vagy belső meghajtón megosztható. |

## A bekapcsolás lépései

1. Nyissa meg a repót: <https://github.com/kissmarcell27-debug/vertigoapp>
2. Felül kattintson a **Settings** (Beállítások) fülre. (Csak a repó tulajdonosa látja.)
3. A bal oldali menüben, a *Code and automation* csoportban válassza a **Pages** pontot.
4. A *Build and deployment* résznél:
   - **Source:** `Deploy from a branch`
   - **Branch:** `claude/vertigo-diagnostic-app-1zqy83` (ez a repó jelenlegi alapértelmezett ága),
     mellette a mappa: `/ (root)`
   - Kattintson a **Save** gombra.
5. Várjon 1–2 percet. A közzététel állapota az **Actions** fülön látszik
   („pages build and deployment”, zöld pipa = kész).
6. Frissítse a *Settings → Pages* oldalt: felül megjelenik a „Your site is live at …” sor a címmel.
7. Nyissa meg a címet, és ellenőrizze, hogy a kezdőlapon mindhárom eljárásrend megjelenik.

## Frissítés

Minden új változtatás, amely a fenti ágra kerül, néhány percen belül automatikusan megjelenik a weboldalon.
Ha a böngésző a régi változatot mutatja, frissítsen (Ctrl+F5 / telefonon a lap újratöltése).

## Kikapcsolás

*Settings → Pages* → a *Build and deployment* résznél a Branch legyen **None**, majd **Save**.
Az oldal néhány percen belül elérhetetlenné válik.

## Hibaelhárítás

| Jelenség | Teendő |
|---|---|
| 404-es hiba a címen | Várjon még pár percet; ellenőrizze az *Actions* fülön, hogy a közzététel lefutott-e, és a *Settings → Pages* alatt a helyes ág és a `/ (root)` mappa van-e kiválasztva. |
| Nem látszik a **Settings** fül | Be kell jelentkeznie a repó tulajdonosaként (kissmarcell27-debug). |
| A *Source* listában nincs „Deploy from a branch” | Ellenőrizze, hogy a repó nyilvános-e (ingyenes csomagban privát repóhoz nincs Pages). |
