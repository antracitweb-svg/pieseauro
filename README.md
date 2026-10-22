# AutoPiese – V26

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
| `DATABASE_URL` | da | conexiunea PostgreSQL (Supabase: adresa „Session pooler”) |
| `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` | pentru poze în Storage | adresa proiectului și cheia `service_role` (secretă, doar în Render); fără ele pozele rămân în PostgreSQL |
| `SUPABASE_BUCKET` | nu | numele bucketului public (implicit `pieseauto`) |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | da (prima pornire) | creează contul de administrator |
| `APP_URL` | recomandat | adresa publică, folosită în linkurile din emailuri |
| `RESEND_API_KEY`, `RESEND_FROM` | pentru emailuri | recuperare parolă, schimbare email (sender verificat în Resend) |
| `REQUIRE_VERIFIED_EMAIL` | nu | `true` = doar conturile cu email confirmat pot publica anunțuri, cereri, oferte și mesaje (merge doar dacă `RESEND_*` e configurat, altfel e ignorat) |

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

## Mutare pe Supabase (baza de date + poze)
1. supabase.com → **New project** (alege regiunea cea mai apropiată, ex. Frankfurt) și o parolă pentru baza de date.
2. **Project Settings → Database → Connection string → Session pooler**: copiază adresa și înlocuiește `[YOUR-PASSWORD]`. O pui în Render ca `DATABASE_URL`. Nu folosi „Direct connection” (IPv6, nu merge de pe Render gratuit).
3. **Storage → New bucket**: nume `pieseauto`, bifează **Public bucket**.
4. **Project Settings → API**: copiază *Project URL* (`SUPABASE_URL`) și cheia **service_role** (`SUPABASE_SERVICE_KEY`). Cheia service_role e secretă: o pui doar în Render, nu în cod sau frontend.
5. Render → Environment: setează `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` (și `SUPABASE_BUCKET` dacă ai alt nume) → **Save** → serverul repornește.
6. La prima pornire se creează tabelele și contul de administrator (`ADMIN_EMAIL`, `ADMIN_PASSWORD`). Dacă baza veche are date de păstrat: `pg_dump` din baza veche și `psql` în Supabase.
7. Test: publică un anunț cu poză; în Supabase → Storage → `pieseauto` trebuie să apară folderul `u<id>/`.

Atenție: pozele rămân în bucket și după ștergerea anunțului (curățarea se poate face manual din Storage).

## Poze anunțuri
- Formularul „Vinde o piesă” acceptă până la 8 imagini JPG, PNG sau WebP de pe telefon, tabletă, laptop și desktop.
- Imaginile sunt redimensionate și comprimate în browser înainte de trimitere, pentru încărcare mai rapidă.
- Cu `SUPABASE_URL` și `SUPABASE_SERVICE_KEY` setate, pozele noi se încarcă în Supabase Storage (bucket public) și în coloanele `images` rămâne doar linkul. Fără ele, pozele se salvează ca base64 în PostgreSQL (coloanele `images`). Pozele vechi din baza de date continuă să funcționeze.
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
- Confirmarea emailului: la înregistrare se trimite un link (24 h) dacă `RESEND_*` e configurat; contul poate retrimite linkul din Contul meu. Rămâne opțională până setezi `REQUIRE_VERIFIED_EMAIL=true`. Conturile existente nu sunt marcate ca confirmate: administratorii sunt scutiți, ceilalți își confirmă emailul din Contul meu.

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

## Mesagerie
- Contul meu → **Mesaje** deschide pagina `#/mesagerie`, cu tab-uri **Primite**, **Trimise**, **Arhivate** și **Trimite un mesaj** (după nickname), buton **Filtrare** (căutare + doar necitite), selectare multiplă cu Arhivează / Dezarhivează / Marchează citite și paginare de 30.
- Fiecare mesaj arată expeditorul, data, textul și, dacă a pornit dintr-un anunț, linia `Ref: <titlu anunț>` (link către anunț). Apăsarea pe mesaj deschide conversația.
- Butonul „Trimite mesaj” din anunț atașează anunțul ca referință.
- Endpointuri noi: `GET /api/messages/box?box=inbox|sent|archived`, `POST /api/messages/archive`, `POST /api/messages/read`; `POST /api/messages` acceptă `listing_id` și `to_nick`. Coloane noi în `messages` (`listing_id`, `ref_title`, `arch_r`, `arch_s`), create automat la pornire.

## Legal (ciorne — de validat juridic înainte de lansare)
- Pagini: `#/terms`, `#/privacy`, `#/cookies`, `#/rules` (Regulament de publicare), `#/contact` (contact + raportare conținut). Linkuri în subsol.
- Completează în `index.html` toate câmpurile `[DENUMIRE FIRMĂ SRL]`, `[CUI]`, `[J../…/….]`, `[ADRESĂ]`, `[EMAIL CONTACT]`, `[TELEFON]`, `[DATA]` (caută „[” în fișier).
- Înregistrare: checkbox obligatoriu „18+ și accept Termenii/Confidențialitatea”; serverul refuză fără `accept_terms:true` și salvează momentul în `users.terms_accepted_at` (coloană creată automat).
- Subsol: date firmă + atribuire VehiclesDB (CC-BY 4.0).

## Viteză și stabilitate (final V26)
- Răspunsurile sunt comprimate (pachetul `compression`; dacă lipsește, serverul pornește oricum).
- Căutările publice (`GET /api/listings`) au cache de 10 secunde în memorie, golit automat la orice modificare de anunțuri; numărătoarea și lista rulează în paralel.
- Pozele din liste se decodează asincron, fără să blocheze afișarea.
- Erorile din handlerele async ajung la handlerul global (răspuns 500) în loc să lase cererea agățată.

## Poze la cereri și oferte
- Formularele „Cerere de piese” și „Trimite o ofertă” au acum „Adaugă poze” (opțional, maximum 6 poze JPG/PNG/WebP, comprimate în browser ca la anunțuri).
- Pozele se salvează în coloanele noi `part_requests.images` și `offers.images` (create automat la pornire).
- Cota de 60 MB de poze per utilizator numără acum anunțurile, cererile și ofertele la un loc.
- Listele (cereri publice, cererile mele, ofertele mele) trimit doar prima poză; galeria completă se încarcă la deschiderea detaliilor (`GET /api/requests/:id`, `GET /api/offers/mine?id=`).
- Cumpărătorul vede pozele din ofertele primite; vânzătorul vede pozele din cerere. Ofertele se pot edita cu poze (`PATCH /api/offers/:id` păstrează pozele dacă nu trimiți `images`).
- Atenție: cererile și ofertele nu trec prin moderare, deci pozele lor apar imediat.

## Statistici anunțuri (Contul meu → Utile)
- Panou cu stilizare completă (înainte lipsea CSS pentru tabel și grafic): carduri pentru vizualizări, apăsări pe telefon/WhatsApp, favorite, mesaje și total de la publicare.
- Filtru de perioadă (7 zile / toate zilele păstrate), grafic pe zile, tabel pe zile (pliabil) și tabel pe fiecare anunț, ordonat după vizualizări, cu rată de contact (apăsări ÷ vizualizări). Apăsarea pe un anunț îi arată graficul.
- `GET /api/stats/mine` întoarce acum și `fav` (favorite) și `msgs` (mesaje primite din anunț) pentru fiecare anunț.

## Statistici cont (Contul meu → Utile)
- Pagina Statistici are acum un selector sus: **Statistici cont** (tabel cu tab-uri 14 zile / 6 luni / 12 luni, rânduri cu bife și buton „Afișează grafic”) și **Statistici anunțuri** (panoul detaliat de mai înainte).
- Endpoint nou: `GET /api/stats/account?range=14d|6m|12m`. Date reale: anunțuri adăugate, vizualizări, afișări telefon, oferte, oferte câștigătoare/necâștigătoare/inactive, valoare comenzi din oferte. Rândurile pentru credite, calificative, comenzi din anunțuri și statistici la oferte afișează 0 până există backend pentru ele.
- Contoarele zilnice se păstrează acum `STATS_KEEP_DAYS` zile (implicit 400) ca să existe istoric pe 12 luni; `STATS_RETENTION_DAYS` rămâne fereastra graficului din „Statistici anunțuri” (15 zile). Istoricul de dinainte de această versiune nu poate fi recuperat (era șters după 15 zile).

## V27 — carduri și pagină de anunț mai informative
- Card de anunț: număr de poze, cod OEM, „Livrare”, cantitate, „negociabil”, stare, vânzător cu tip (Parc dezmembrări / Firmă / Particular) și număr de anunțuri active, județ și „Actualizat azi la 14:20 / ieri / la 09 oct. 2026”. Data vine din `created_at`, pe care butonul „Reactualizează” (`/bump`) îl actualizează.
- Rezultate: contoare **Toate / Nou / Second hand** pentru căutarea curentă (`facets.condition` în `GET /api/listings`, calculate fără filtrul de stare), „Vezi și:” cu categorii și modele din rezultate, bloc „Cere oferte” sub listă și în pagina fără rezultate.
- Pagina anunțului: chipuri cu stare/cantitate/livrare/negociabil, statistici vânzător („14 anunțuri active · pe AutoPiese din 2025”), mesaj rapid „Propune un preț” (doar la prețuri negociabile) și secțiunea „Anunțuri similare”.
- Server: `image_count`, `seller_since`, `seller_ads` în listări; index `listings(user_id,status)`. Nicio coloană nouă.
- Culorile, fonturile și identitatea vizuală au rămas neschimbate.

## V29 — format compact pentru anunțuri și cereri
Toate listele de anunțuri (rezultate, favorite, anunțurile unui vânzător, dezmembrări, anunțuri similare, coș) și lista de cereri (publice și „Cererile mele”) folosesc acum același rând compact ca „Anunțurile mele”: poză în stânga, titlu albastru, butoane sub titlu, iar jos vizualizări · bucăți · preț.
- `script.js`: `adRowHtml()` (anunțuri), `reqRowHtml()` (cereri); `card()` le folosește peste tot.
- `style.css`: blocul „V29” de la final (clase `ar-*`); aspectul din „Anunțurile mele” a fost aliniat la același model.
- `index.html`: containerele listelor au clasa `ar-list`.


## V30 — Profil de magazin și logo-uri în subsol
- Prima pagină a rămas neschimbată. Logo-urile apar într-un rând deasupra liniilor legale din subsol, pe toate paginile, doar dacă există cel puțin un logo.
- Se afișează utilizatorii activi cu logo setat și minimum un anunț aprobat (cei cu cele mai multe anunțuri primii, maximum 30). Apăsarea pe logo deschide profilul vânzătorului.
- **Setări cont → 4. Profil magazin**: nume magazin, site (opțional) și logo (JPG/PNG/WebP, redimensionat în browser la maximum 480×240). Cu `SUPABASE_*` setate, logo-ul merge în Storage, altfel rămâne în baza de date.
- Coloane noi în `users` (create automat): `store_name`, `store_site`, `store_logo`.
- Endpointuri noi: `GET /api/stores/logos`, `GET /api/stores/:id/logo`, `PUT /api/account/store`. Admin: butonul „Șterge logo” în lista de utilizatori (`PATCH /api/admin/users/:id` cu `status:"remove_logo"`, înregistrat în jurnal).

## V31 — Notificări email, export date, ștergere cont (Setări cont)
- **Notificări pe email** (secțiunea 5): mesaje noi, oferte la cereri, comenzi. Coloane noi în `users`: `mail_msg`, `mail_offer`, `mail_order` (implicit activ). Emailul pleacă doar dacă `RESEND_*` e setat, adresa e confirmată și opțiunea e bifată, cel mult unul la 10 minute pentru fiecare tip și utilizator. Notificările din site rămân neschimbate (`notify(uid,text,kind)`).
- **Descarcă datele mele**: `GET /api/account/export` (JSON, limită 3 pe oră). Conține profil, telefoane, anunțuri (fără poze, doar numărul lor), favorite, cereri, oferte, comenzi, mesaje, notificări, raportări. Parola nu se exportă.
- **Șterge contul**: `POST /api/account/delete` cu parola curentă. Șterge anunțurile și cererile (care altfel ar rămâne orfane din cauza `ON DELETE SET NULL`) și apoi utilizatorul; ofertele, mesajele, favoritele și sesiunile se șterg în cascadă. Refuzat dacă există comenzi în curs (`new`/`confirmed`/`shipped`) sau dacă utilizatorul e administrator. Comenzile încheiate rămân anonimizate. Pozele din Supabase Storage nu se șterg automat (curățare manuală din bucket).

## V32 — Sesiuni active, mod vacanță, utilizatori blocați, alerte pentru căutări salvate
Toate sunt în **Setări cont** (secțiunile 6–8 noi; „Datele mele” a devenit 9) și în pagina **Căutări salvate**. Tabelele și coloanele noi se creează automat la pornire.

- **Sesiuni active** (Setări → 8): lista dispozitivelor conectate (browser + sistem, ultima activitate), buton „Deconectează” per dispozitiv și „Deconectează toate celelalte dispozitive”. Sesiunea curentă e marcată și nu se poate închide de aici (folosește „Ieșire din cont”). Endpointuri: `GET /api/auth/sessions` (acum cu `current`, doar sesiuni neexpirate), `DELETE /api/auth/sessions/others` (nou), `DELETE /api/auth/sessions/:id` (acum validează id-ul și răspunde 404 dacă nu e al tău).
- **Mod vacanță** (Setări → 6): `PUT /api/account/vacation` cu `{on, until}`. Coloane noi în `users`: `vacation`, `vacation_until`. Cât e activ, anunțurile nu apar în căutări, liste de vânzători, `sitemap.xml`, iar comenzile noi sunt refuzate (`VANZATOR_IN_VACANTA`). Pagina anunțului rămâne accesibilă prin link, cu banner și buton „Comandă” dezactivat; mesajele merg în continuare. Data „Până la” e inclusivă (maximum 365 de zile); anunțurile reapar singure a doua zi, fără job periodic. Anunțurile publicate în vacanță rămân ascunse până la întoarcere.
- **Utilizatori blocați** (Setări → 7, butonul „Blochează” din conversație și din profilul vânzătorului): tabelă nouă `user_blocks`; endpointuri `GET/POST /api/blocks`, `DELETE /api/blocks/:uid`. Un utilizator blocat nu poate trimite mesaje, comenzi sau oferte către cel care l-a blocat (răspuns `BLOCAT`), iar mesajele lui dispar din Primite, din conversații și din contorul de necitite. Administratorii nu pot fi blocați; limită 200 de blocări. Nu are legătură cu blocarea contului de către admin (`users.status='blocked'`).
- **Alerte pentru căutările salvate**: căutările salvate cu cont logat se păstrează acum pe server (`saved_searches`, maximum 30) și au comutator „🔔 Alerte”. Când un anunț este aprobat (de admin, „Aprobă tot” sau publicare automată), se verifică căutările cu alerte, cu aceleași filtre ca în căutarea publică (`buildListingFilter`, comun), și se creează o notificare în site, plus email dacă `RESEND_*` e setat, adresa e confirmată și e bifat „Alerte pentru căutările salvate” (coloana nouă `users.mail_alert`; limita de un email la 10 minute se aplică și aici). `saved_search_hits` împiedică alerta dublă pentru același anunț. Nu se alertează pentru anunțurile proprii, pentru vânzători în vacanță sau pentru vânzători blocați. Căutările salvate local pe dispozitiv se mută automat pe cont la prima deschidere a paginii (cu alertele oprite); pentru vizitatori fără cont rămân locale, fără alerte. Endpointuri: `GET/POST /api/saved-searches`, `PATCH/DELETE /api/saved-searches/:id`.
- Export de date (`/api/account/export`): include acum și `blocked_users`, `saved_searches` și setările de vacanță/alerte.
- Notă de scalare: la fiecare aprobare se rulează o interogare pe fiecare căutare cu alerte (limită 5000). Merge bine la început; dacă numărul de căutări crește mult, se poate muta într-o coadă sau se poate pre-filtra după marcă/categorie.

## V33 — Pagini SEO pe categorie, marcă și model
Pagini HTML randate pe server (fără JavaScript), indexabile de Google, create automat din anunțurile aprobate.
- `/piese-auto` – hub cu toate categoriile și mărcile care au anunțuri.
- `/piese-auto/<categorie>` (ex. `/piese-auto/frane`) – anunțurile din categorie + linkuri către mărcile prezente.
- `/piese-auto/<marcă>` (ex. `/piese-auto/skoda`) – anunțurile mărcii + linkuri către modele.
- `/piese-auto/<marcă>/<model>` (ex. `/piese-auto/skoda/superb`) – anunțurile modelului + categoriile prezente.
- Fiecare pagină are `title`, `meta description`, `canonical`, Open Graph, date structurate (BreadcrumbList + CollectionPage/ItemList), paginare `?p=2` cu `rel=prev/next`, listă de 30 de anunțuri cu linkuri către `/piese/<id>-<slug>`.
- Apar doar combinațiile cu cel puțin un anunț aprobat (fără vânzători în vacanță și fără „mașini la dezmembrat”); altfel răspunsul este 404 cu `noindex`, deci nu se indexează pagini goale.
- Slug-urile se potrivesc fără diacritice/majuscule/spații; `LandRover` și `Land Rover` ajung în aceeași pagină.
- `sitemap.xml` include hubul, categoriile, mărcile și modelele. Previzualizările WhatsApp/Facebook funcționează și pentru aceste pagini.
- Indexul categoriilor/mărcilor/modelelor stă 5 minute în memorie și se reface imediat după modificări de anunțuri. Nicio tabelă sau coloană nouă.
- Subsolul site-ului are linkul „Categorii și mărci” către `/piese-auto`.

### Pagini combinate categorie + marcă + model
- `/piese-auto/<marcă>/<model>/<categorie>` (ex. `/piese-auto/skoda/superb/caroserie`): anunțurile din acea categorie pentru modelul respectiv, cu linkuri către restul categoriilor modelului.
- Există doar dacă au cel puțin `SEO_MIN_COMBO` anunțuri aprobate (implicit 2, variabilă de mediu opțională); sub prag răspunsul este 404 cu `noindex`, iar combinația nu apare în `sitemap.xml`. Paginile se activează singure când cresc anunțurile.
- Pagina modelului leagă categoriile care trec pragul direct către aceste pagini; celelalte rămân linkuri către căutarea din aplicație.

## V34 — Admin: evenimente și funcții noi
Două taburi noi în panoul de admin (`#/admin`), ca administratorul să vadă ce se schimbă pe site, nu doar acțiunile lui.
- **Evenimente**: jurnal cu ce fac utilizatorii, filtrabil pe tip: anunț nou, anunț editat, marcat vândut, repus la vânzare, import CSV (câte anunțuri au intrat și câte au fost respinse), vacanță pornită/oprită, blocare/deblocare, calificativ nou/modificat (cu comentariul) și cont șters. Ultimele 300 de evenimente, păstrate 180 de zile. Tabel nou `site_events` (creat automat) și funcția `logEvent(...)` din `server.js`; evenimentele se scriu fără să încetinească sau să strice cererea.
- **Funcții noi**: carduri cu sesiuni active, vânzători în vacanță, blocări, căutări salvate (cu alerte), calificative (medie vânzători/cumpărători) și importuri din ultimele 30 de zile; liste cu vânzătorii în vacanță, blocările recente și calificativele recente. Butonul **Șterge calificativul** elimină un calificativ abuziv și rămâne înregistrat în tabul Activitate (`delete_rating`).
- Endpointuri noi (doar admin): `GET /api/admin/events?kind=`, `GET /api/admin/features`, `DELETE /api/admin/ratings/:seller|buyer/:id`.
- Evenimentele apar doar de la această versiune încolo; ce s-a întâmplat înainte nu poate fi recuperat.


## V36 — Meniul „Contul meu” reorganizat + instrumente Utile
- Secțiuni: Vânzător (Anunțurile mele, Oferte la cereri, Comenzi din oferte, Întrebări pe oferte), Cumpărător (+ Căutări salvate), Mesagerie, **Utile**, Financiar, **Calificative**, Setări.
- **Utile**: Import CSV (mutat din „Anunțurile mele”), Actualizare prețuri, Generator de anunțuri, Statistici cont, B2B.
- **Actualizare prețuri**: `POST /api/listings/bulk-price` `{direction:'up'|'down', mode:'percent'|'amount', value, condition?, preview?}`. Doar anunțurile proprii active (publicate sau în așteptare) și cu preț; rezultatul rămâne între 5 și 10.000.000 lei; cu `preview:true` nu scrie nimic.
- **Generator de anunțuri**: doar în browser (titlu + descriere de copiat), fără endpoint nou.
- **Calificative**: folosește `GET /api/sellers/:id/ratings` pentru utilizatorul logat.
- **Întrebări pe oferte** și **B2B** sunt deocamdată ecrane simple (trimit către Mesaje / Import CSV / Actualizare prețuri).
- Statistici cont: tabelele (14 zile / 6 luni / 12 luni) sunt compacte (font 12px, coloane înguste), ca să încapă mai multe rânduri și luni pe telefon.
- „Anunțurile mele”: cardul începe imediat sub „Înapoi”, iar rândurile sunt compacte (poză 80×80, titlu 14px, butoane cu iconițe SVG, vizualizări / buc. / preț pe un rând).

## V37 – Notificări, tooltip-uri, glisare poze
- Buton „Notificări” în Contul meu (cu număr roșu) care deschide un rezumat cu link către fiecare secțiune.
- Numere și pe titlurile secțiunilor (Vânzător / Cumpărător / Mesagerie), nu doar pe butoane.
- Tooltip-uri pe pictograme: mouse (~0,5 s), tastatură (focus), telefon (apăsare lungă).
- Poze glisabile stânga/dreapta pe telefon: anunțuri, lightbox, cereri, oferte, poza principală din admin.

## Poză de profil, destinatar la comandă, facturare persoană fizică
- **Poză de profil:** în Contul meu, apeși pe cercul din cardul de sus și alegi o poză (JPG/PNG/WebP). Se decupează pătrat și se comprimă în browser (320×320). Se salvează în Supabase Storage (sau în baza de date dacă Storage nu e configurat), în coloana nouă `users.avatar`. Apare în: Contul meu, oferte la cereri, comenzi, mesaje și conversații, profilul vânzătorului, detaliul anunțului, lista de vânzători, cereri. Dacă utilizatorul nu are poză, dar are logo de magazin, se folosește logo-ul; altfel rămâne litera inițială.
- Endpointuri noi: `GET /api/users/:id/avatar` (public), `PUT /api/account/avatar` (`{avatar:"data:image/..."}` sau `{remove:true}`).
- **Comandă pe alt nume/telefon:** formularul de comandă are „Nume destinatar” și „Telefon destinatar” (opționale). Goale = se folosesc datele din cont. Se salvează în `orders.recipient_name` / `orders.recipient_phone` și apar în cardul comenzii, pentru vânzător și cumpărător.
- **Facturare:** în Setări → „3. Date de facturare” se alege Persoană fizică (nume complet) sau Persoană juridică (firmă, CUI, Reg. Com.). Coloane noi: `users.bill_type`, `users.bill_name`.
- Toate coloanele noi se creează automat la pornirea serverului.
