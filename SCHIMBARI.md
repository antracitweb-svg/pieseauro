# Ce s-a schimbat față de versiunea încărcată

## Fișiere noi
- `ajutor.html` – pagină de ajutor: cum funcționează, sfaturi de siguranță, mesaje explicate, FAQ. Folosește `style.css` existent.
- `LANSARE.md` – pornire în 5 pași și lista de verificări înainte de lansare.
- `test/catalog.test.js` – teste pentru catalogul de vehicule.
- `test/server.test.js` – teste care pornesc serverul fără bază de date (rute de bază, CSRF, antete de securitate).
- `SCHIMBARI.md` – acest fișier.

## Fișiere modificate
- `server.js` (o singură modificare mică): `PUBLIC_FILES` conține acum și `ajutor.html`. `/api/health` este neschimbat, ca în versiunea ta.
- `package.json` – `npm test` rulează verificarea de sintaxă și testele; nou: `npm run test:unit`.
- `README.md` – secțiune nouă „Pornire rapidă” și mențiuni despre `ajutor.html` și `test/`.

## Nemodificate
`index.html`, `style.css`, `script.js`, `vehicles-catalog.js`, `render.yaml`, `package-lock.json`, `migrate-images-to-supabase.js`, `DEPLOY-AUDIT.md`.

## Ce nu s-a putut verifica
Testele din `test/server.test.js` nu au fost rulate aici (nu se pot instala pachetele). Rulează `npm install` și `npm test` la tine.
