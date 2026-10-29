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

- `index.html` – o singură linie adăugată: linkul „Ajutor și întrebări frecvente” în subsol, coloana „Ajutor rapid”. Folosește stilul existent al linkurilor din subsol (`style.css` nu s-a schimbat).

## Nemodificate
`style.css`, `script.js`, `vehicles-catalog.js`, `render.yaml`, `package-lock.json`, `migrate-images-to-supabase.js`, `DEPLOY-AUDIT.md`.

## Ce nu s-a putut verifica
Testele din `test/server.test.js` nu au fost rulate aici (nu se pot instala pachetele). Rulează `npm install` și `npm test` la tine.

## V43 — Expirarea anunțurilor (30 de zile)
- `listings.expires_at` (implicit NOW()+30 zile), `expiry_notice` (0/1/2). Anunțurile existente primesc expirare = max(creat+30z, acum+10z).
- Job orar `expiryTick()`: avertizare la ≤7 zile și la ≤3 zile (notificare + email, un mesaj/utilizator), apoi la expirare anunțul trece direct în „Șterse”.
- `POST /api/listings/:id/renew` (Activează, +30 zile), `POST /api/listings/bulk` (delete / purge / restore / renew), „Reactualizează” din Șterse respectă limita de anunțuri active.
- UI: fila „Expiră” = anunțuri care expiră în ≤7 zile, buton „Activează” pe rând, „Activează toate / Șterge toate” lângă titlu, „Șterge toate” și în Active, „Reactualizează” în Șterse. Insigna roșie din meniu numără aceleași anunțuri.
