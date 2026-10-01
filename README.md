# AutoPiese – V27

Marketplace de piese auto (Node.js + Express + PostgreSQL), găzduit pe Render.

## Structura proiectului
Totul într-un singur folder, fără subfoldere obligatorii:
- `server.js` – backend (API, autentificare, admin, SEO)
- `index.html`, `style.css`, `script.js` – frontend-ul
- `package.json`, `render.yaml` – configurare Node și Render
- `assets/` (opțional) – imagini, dacă le adaugi mai târziu

Serverul trimite browserului doar `index.html`, `style.css`, `script.js` și conținutul din `assets/`. `server.js` și `package.json` nu pot fi descărcate.

## Variabile de mediu (Render → Environment)
| Variabilă | Obligatorie | Rol |
|---|---|---|
| `DATABASE_URL` | da | conexiunea PostgreSQL |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | da (prima pornire) | creează contul de administrator |
| `APP_URL` | recomandat | adresa publică, folosită în linkurile din emailuri |
| `RESEND_API_KEY`, `RESEND_FROM` | pentru emailuri | recuperare parolă, schimbare email (sender verificat în Resend) |
| `VEHICLE_CATALOG_URL` | nu | sursa catalogului de vehicule (setată deja în `render.yaml`) |

Fără `RESEND_*`, „Ai uitat parola?” răspunde că emailul nu este configurat.

## Funcții
- Interfață nouă (V26): header cu căutare, sub-meniu, pagină principală cu categorii și anunțuri recente, listă de anunțuri cu filtre, detaliu anunț cu telefon/WhatsApp, raportare anunț, pagini pentru cereri, dezmembrări, magazine și parcuri.
- Conturi: înregistrare, login cu email sau nickname, sesiuni revocabile, resetare parolă, schimbare email, până la 4 telefoane (cu marcaj WhatsApp).
- Anunțuri: publicare (intră în moderare), căutare multi-cuvânt, filtre, „Anunțurile mele”, favorite sincronizate pe cont.
- Cereri de piese, raportări, panou admin cu jurnal de activitate.
- Catalog mărci/modele din VehiclesDB (CC-BY 4.0, atribuire vizibilă în interfață), cu fallback local.
- SEO: pagini `/piese/<id>-<slug>`, date structurate Product, `robots.txt`, `sitemap.xml`.

## Securitate
- Parole cu bcrypt, sesiuni în baza de date (token hash-uit), cookie `httpOnly` + `secure` în producție.
- Limitare încercări la login și recuperare parolă; tokenuri de resetare hash-uite, valabile 30 de minute.
- Interogări SQL parametrizate; listările publice arată doar anunțuri aprobate; telefonul apare doar dacă vânzătorul a ales asta.

## Deploy
Commit pe `main` → Render face deploy automat. Nu încărca arhiva ZIP în repository.

## Ce s-a schimbat în V26
- Frontend: anunțurile se încarcă acum din baza de date (înainte se afișau doar exemple locale); căutare fără diacritice, filtre în URL, paginare, favorite, căutări salvate, ștergerea propriilor anunțuri, cereri publice, listă de vânzători.
- Setare nouă „Afișează telefonul” (Setări cont) – fără ea, telefonul nu apărea niciodată în anunțuri.
- Securitate: Content-Security-Policy activă (fără scripturi inline), nickname fără `@` (evită confuzia cu emailul la login), limitare la înregistrare și cereri, validare telefon și categorii, ștergerea sesiunilor expirate la intervale regulate.
- Server: endpointuri noi `GET /api/listings/:id`, `DELETE /api/listings/:id`, `GET /api/requests`, `GET /api/requests/mine`, `GET /api/sellers`, `PATCH /api/account/privacy`; verificări 404 în panoul admin; cache și timeout pentru catalogul de vehicule; oprire curată la SIGTERM; `sitemap.xml` și `robots.txt` folosesc `APP_URL`.


## V27 – catalog auto și fotografii
- Bază de date PostgreSQL pentru mărci, modele și variante auto.
- Mărci și modele încărcate din catalogul extern când este disponibil, plus catalog de rezervă pentru mărcile uzuale.
- Formularul de publicare permite până la 6 fotografii/anunț. Fotografiile sunt redimensionate în browser și stocate persistent în PostgreSQL.
- Fotografia principală apare pe cardul anunțului, iar toate fotografiile apar în detaliul anunțului.
