# AutoPiese – V24

Această versiune pornește de la backend-ul existent și adaugă catalog auto + identificare din text + fundație SEO.

## V24 – autentificare robustă
- protecție la încercări repetate de autentificare;
- protecție la cereri repetate de recuperare a parolei;
- tokenurile de resetare sunt unice, hash-uite și expiră după 30 de minute;
- tokenul este șters dacă trimiterea emailului eșuează;
- gestionare explicită pentru erorile Resend și limitările de trimitere;
- resetarea parolei revocă sesiunile existente;
- răspunsurile de recuperare nu dezvăluie dacă o adresă există în baza de date.

## Ce este nou
- catalog de mărci și modele din VehiclesDB;
- fallback local dacă sursa catalogului nu răspunde;
- Marcă → Model încărcate din backend;
- anii 1980–2026;
- publicarea permite text liber în titlu;
- identificarea automată a mărcii/modelului/anului din titlu;
- câmpuri PostgreSQL pentru generație, motor, fuel, vehicle_id, cantitate și negociabil;
- căutare după cuvinte multiple în titlu, OEM, descriere, marcă, model, generație și motor;
- URL-uri individuale `/piese/...`;
- `robots.txt` și `sitemap.xml`;
- date structurate Product pe paginile individuale de anunț;
- autentificarea și panoul admin existente sunt păstrate.

## Sursa catalogului
Datele de identitate ale vehiculelor provin din VehiclesDB și sunt folosite conform CC-BY 4.0, cu atribuire vizibilă în interfață.

## Instalare pe GitHub
Înlocuiește fișierele existente cu cele din acest pachet, păstrând repository-ul și branch-ul `main`. Nu încărca ZIP-ul ca fișier în proiect.

## Render
Dacă repository-ul este conectat la Render, commit-ul declanșează deploy-ul. Verifică existența `DATABASE_URL`, `JWT_SECRET`, `ADMIN_EMAIL` și `ADMIN_PASSWORD`. `VEHICLE_CATALOG_URL` este deja setat în `render.yaml`.


## Interfață v15
- header dark, logo AutoPiese și meniu hamburger unic;
- hero albastru cu imagine locală de piese auto;
- căutare + filtre vehicul în cardul principal;
- 10 categorii populare cu iconografie;
- bandă de încredere: plăți, livrare, suport, piese verificate;
- layout responsive pentru telefon și desktop;
- funcțiile existente de autentificare, publicare, cereri, favorite și admin sunt păstrate.

## Verificări efectuate înainte de arhivare
- `node --check` pentru `script.js` și `server.js`;
- verificare structurală HTML și a formularelor/ID-urilor;
- verificare că toate asset-urile locale referite există;
- verificare că meniul, căutarea, categoriile și acțiunile principale au handler-ele necesare în JavaScript;
- PostgreSQL, autentificarea și API-urile rămân în `server.js` și nu sunt înlocuite de localStorage.

## Email securizat – recuperare parolă

Pentru ca „Ai uitat parola?” să trimită emailuri reale, configurează în Render:
- `SMTP_HOST`
- `SMTP_PORT` (de regulă 587)
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM` (opțional; implicit SMTP_USER)
- `SMTP_SECURE` (`false` pentru 587, `true` pentru 465)
- `APP_URL` = adresa publică AutoPiese, de exemplu `https://pieseauto-dez.onrender.com`

Linkurile de resetare sunt token-uri aleatorii, stocate doar hash-uit în baza de date, expiră după 30 de minute și sunt invalidate după folosire. La resetarea parolei, sesiunile existente ale utilizatorului sunt revocate.


## Email SMTP pentru recuperare parolă
Configurează în Render Environment Variables: `SMTP_HOST`, `SMTP_PORT` (de regulă 587), `SMTP_SECURE` (`false` pentru STARTTLS/587 sau `true` pentru SSL), `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` și `APP_URL` (adresa publică AutoPiese). Fără aceste variabile, fluxul de recuperare răspunde că emailul nu este configurat.

## Setări cont
Utilizatorii pot modifica numele/nickname-ul, pot cere schimbarea emailului prin link de confirmare și pot avea maximum 4 numere de telefon. Fiecare număr poate fi marcat pentru WhatsApp.
