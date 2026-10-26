# Note proiect — AutoParts / pieseauro

## Rulare locală
- `npm install` apoi `PORT=3000 node server.js` (sau `npm start`).
- Fără `DATABASE_URL` serverul pornește, dar API-urile ce ating DB întorc 503 — e comportament normal, nu bug.
- `npm run check` validează sintaxa; `npm test` rulează `node --test` (nu există teste încă).

## Capcane întâlnite
- **CSP strictă** (`script-src 'self'`): scripturile inline în `index.html` sunt BLOCATE. Orice script nou trebuie să fie fișier extern.
- **`PUBLIC_FILES` din `server.js`** e o listă albă: un fișier static nou (ex. `theme-init.js`) dă 404 dacă nu e adăugat acolo.
- `dark-mode.js` există pe disc dar NU e încărcat nicăieri (cod mort, înlocuit de tema din `theme-init.js` + butonul `#themeBtn`).

## Funcționalități adăugate
- **Dark mode**: `theme-init.js` (anti-flash) + buton `#themeBtn` în header + bloc `html.dark` la finalul `style.css`. Preferința în `localStorage['theme']`.
- **Plăți online**: Stripe Checkout. Necesită `STRIPE_SECRET_KEY` în mediu; fără ea butoanele afișează mesaj de indisponibilitate. Tabelă `payments`.
- **Ateliere și servicii** (`#/servicii`): filtre județ + tip, catalog din `GET /api/services` (public, returnează `[]` dacă tabela `services` lipsește).
- **Întrebări pe oferte**: tabelă `offer_questions`; `GET /api/offer-questions`, `POST /api/offers/:id/questions`, `POST /api/offer-questions/:id/answer`, `GET /api/offers/:id/questions`.
- **Filtre avansate** (`#/rezultate`): preț min/max, an fabricație de la/până la, combustibil. Câmpurile sunt în `FILTER_FIELDS` (script.js) și în `SAVED_KEYS`; serverul le aplică în construcția WHERE din `/api/listings`.
- **Analytics**: `analytics.js` expune `window.track(nume,props)` și trimite la `POST /api/track` (răspunde mereu 204). Serverul înaintează la Plausible doar dacă `PLAUSIBLE_DOMAIN` e setat (opțional `PLAUSIBLE_HOST`). Fără scripturi externe — CSP-ul rămâne `script-src 'self'`. Evenimente: `pageview`, `search`, `contact_seller`.
- **Alerte in-app**: deja existente prin `notify(...,'alert')` + badge `#menuBadge`; nu se adaugă tabel nou.
- **PWA**: `manifest.webmanifest` + `sw.js` (înregistrat din `pwa.js`) + iconițe SVG în `assets/`. Service worker-ul NU cache-uiește `/api/*`; navigarea e network-first cu fallback la `index.html`, resursele statice stale-while-revalidate. La schimbarea listei `SHELL` sau a strategiei, crește `VERSION` din `sw.js`, altfel utilizatorii rămân pe cache-ul vechi.
