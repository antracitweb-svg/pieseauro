# AutoPiese – V27

Marketplace de piese auto (Node.js + Express + PostgreSQL), găzduit pe Render.

## Structura proiectului
Totul într-un singur folder, fără subfoldere obligatorii:
- `server.js` – backend (API, autentificare, admin, SEO)
- `index.html`, `style.css`, `script.js` – frontend-ul
- `package.json`, `render.yaml` – configurare Node și Render
- `assets/` (opțional) – imagini, dacă le adaugi mai târziu
- `vehicles.json` (opțional) – snapshot local al catalogului auto; serverul îl creează automat după prima sincronizare dacă are acces la sursa VehiclesDB

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
- Anunțuri: publicare (intră în moderare), căutare multi-cuvânt, filtre, „Anunțurile mele”, favorite sincronizate pe cont, până la 8 poze per anunț cu comprimare automată și galerie responsive pe telefon/tabletă/laptop/desktop.
- Cereri de piese, raportări, panou admin cu jurnal de activitate.
- Catalog mărci/modele din VehiclesDB (CC-BY 4.0), cu sincronizare automată și cache local în același folder. Sunt încercate două surse ale catalogului înainte de fallback.
- Poze pentru anunțuri: până la 8 imagini, comprimate înainte de salvare și păstrate în baza de date.
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

## Poze anunțuri
- Formularul „Vinde o piesă” acceptă până la 8 imagini JPG, PNG sau WebP de pe telefon, tabletă, laptop și desktop.
- Imaginile sunt redimensionate și comprimate în browser înainte de trimitere, pentru încărcare mai rapidă.
- Pozele sunt salvate în PostgreSQL în coloana `listings.images`, fără folder nou în proiect.
- Prima poză apare în cardul anunțului, iar pagina de detaliu afișează galerie cu miniaturi.
- Interfața folosește grile diferite pentru desktop/laptop, tabletă și telefon.

## V26 — Contul meu și fluxuri noi
- Butoanele din Contul meu pentru oferte, comenzi, mesaje, notificări și financiar au rute și interfețe funcționale.
- Backend PostgreSQL pentru oferte, comenzi, mesaje și notificări. Creditele, tranzacțiile și facturile sunt deocamdată doar pagini informative (fără backend).
- Acceptarea unei oferte creează automat o comandă și actualizează cererea.
- Notificări pentru oferte, comenzi și mesaje.
- Săgețile din secțiunile Contului sunt aliniate la dreapta și se rotesc la deschidere.
- Formularul „Trimite o ofertă” este disponibil din cererile publice.

## Corecturi conturi / autentificare
- Login: comparație bcrypt și pentru conturi inexistente (fără scurgere de informații prin timp de răspuns).
- Înregistrare: verificare email fără diferență majuscule/minuscule; conflict de nickname returnează mesajul corect.
- Schimbare email: cere parola curentă (protejează contul dacă o sesiune este furată), limitare încercări, ștergerea cererii dacă emailul nu pleacă, mesaje clare pentru erori Resend.
- Confirmare email nou: gestionează conflictul de email unic fără eroare 500.
- Validări suplimentare pentru body-uri lipsă și telefon la `PATCH /api/me`.

## Corecturi catalog și căutare
- Pornire server: `ah` era folosit înainte de definire (eroare `Cannot access 'ah' before initialization`) – mutat sus.
- Catalog: snapshotul local `vehicles.json` nu mai blochează actualizarea (se reîncearcă sursa online dacă are peste 7 zile); o singură descărcare chiar dacă vin mai multe cereri simultan; nume corecte în fallback (Land Rover, Alfa Romeo, Rolls-Royce, Aston Martin); potrivire mai bună la „Identifică mașina”.
- Căutare: diacritice extinse (Škoda, Citroën etc.), coduri OEM găsite și când sunt scrise cu spații/liniuțe, căutare și în an și combustibil, filtre marcă/model/județ/categorie insensibile la majuscule, spații și cratime, anunțurile fără preț la finalul sortării crescătoare, paginare protejată de valori invalide.
- Frontend: lista de mărci se reîncarcă automat dacă prima cerere eșuează.

- Performanță: listele de anunțuri (căutare, „Anunțurile mele”) trimit doar prima poză; galeria completă se încarcă în pagina de detaliu. Înainte, 30 de anunțuri puteau aduce zeci de MB.

## Corecturi de securitate
- Linkurile din emailuri și pagina SEO nu mai depind de antetul `Host` al clientului (se folosesc `APP_URL` sau `RENDER_EXTERNAL_URL`; altfel host validat). Adresa de bază este escapată în HTML.
- Mesaje și oferte afișează nickname-ul, nu numele real; conturile blocate nu mai pot fi accesate prin `/api/messages/:uid`.
- Login: limită suplimentară per cont (40 încercări / 15 min) împotriva ghicirii distribuite.
- Raportări anunțuri: limită de 20 pe oră per utilizator.

## Întărire suplimentară (fază de test)
- Parole: sunt respinse parolele comune (`12345678`, `parola123` etc.), cele doar cu cifre (sub 12 caractere), caracterele repetate și parolele care conțin partea dinaintea `@` din email sau nickname-ul. Se aplică la înregistrare, resetare și schimbare parolă.
- Login: încercările eșuate se țin și în baza de date (`login_attempts`, 15 minute), deci limitarea rezistă repornirilor serverului.
- Poze: maximum 60 MB de poze per utilizator, în total.
- Baza de date: `DATABASE_SSL_STRICT=true` activează verificarea certificatului SSL (implicit oprit, cum cere de obicei Render).
- La pornire, serverul avertizează în log dacă `ADMIN_PASSWORD` este slabă (sub 12 caractere).
- Verificarea emailului la înregistrare NU este activă (decizie pentru perioada de test).

## Corecturi „Vinde o piesă” / postare anunțuri
- Formular: „Tip anunț” (Piesă / Mașină la dezmembrat) și „Vând ca” (Persoană fizică / Firmă / Parc dezmembrări) sunt acum alegeri vizibile; înainte erau câmpuri ascunse, deci nu se putea posta niciun anunț de dezmembrări și nu se putea alege tipul de vânzător.
- Trimitere: butonul se dezactivează cât se trimite (fără anunțuri duplicate), pozele se așteaptă până se procesează, după publicare utilizatorul este dus la „Anunțurile mele”.
- Poze: PNG-urile transparente nu mai ies cu fundal negru; comprimare adaptivă (rezoluție + calitate) cu țintă care permite 8 poze în limita serverului; dacă selectezi prea multe, se adaugă primele până la 8; mesaje de eroare clare (poză invalidă / poze prea mari).
- An: validat și pe server (1950 – anul viitor).
- Stare anunț: buton „Marchează vândut” / „Repune la vânzare” în Anunțurile mele (`PATCH /api/listings/:id/status`); anunțurile vândute dispar din căutare.

## Editare anunțuri
- „Anunțurile mele” → buton **Editează** (nu apare la anunțurile blocate de admin). Se deschide același formular, completat, la `#/vinde?edit=<id>`.
- Prețul, livrarea, negocierea, județul, starea și tipul de vânzător se salvează direct. Titlul, descrierea, pozele, categoria, marca/modelul, anul, OEM-ul sau tipul anunțului trimit anunțul din nou la moderare (apare „În așteptare”). Anunțurile respinse revin la moderare după editare.
- Endpointuri noi: `GET /api/listings/mine/:id` (anunțul propriu, cu toate pozele) și `PATCH /api/listings/:id`. Validarea e comună cu publicarea (`parseListing`).


## Ce s-a schimbat în V27
- Interfața este reorganizată în jurul celor trei acțiuni principale: caută piesa, caută după mașină și vinde.
- Meniul secundar este ascuns sub „Mai multe”, pentru o pagină mai aerisită.
- „Anunțurile mele” are file orizontale: Toate, Active, În așteptare, Vândute și Arhivă.
- Filtrele și acțiunile secundare sunt ascunse în modul „Anunțurile mele”; funcțiile backend existente rămân păstrate.
- Filtrul de județ pornește din lista completă de 41 de județe definită în `script.js`.
- Nu a fost modificat `server.js` și nu a fost schimbată schema bazei de date.
