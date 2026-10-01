# AutoPiese – V25

Marketplace de piese auto (Node.js + Express + PostgreSQL), găzduit pe Render.

## Structura proiectului
- `server.js` – backend (API, autentificare, admin, SEO)
- `public/` – tot ce e servit public: `index.html`, `style.css`, `script.js`
- `render.yaml` – configurarea serviciului Render

Doar conținutul din `public/` este accesibil din browser. `server.js`, `package.json` și restul rămân private.

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
Atenție la structură: `index.html`, `style.css` și `script.js` trebuie să fie în `public/`.
