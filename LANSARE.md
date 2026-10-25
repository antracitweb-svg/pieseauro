# AutoParts — pornire și verificări înainte de lansare

## Pornire în 5 pași
1. Render → Environment: setează `DATABASE_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` (minimum 12 caractere), `APP_URL`.
2. Pentru poze: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, bucket public `pieseauto`.
3. Pentru emailuri: `RESEND_API_KEY`, `RESEND_FROM` (expeditor verificat).
4. Deploy, apoi deschide `/api/health`. Trebuie să răspundă `ok: true`.
5. Intră cu contul de administrator, publică un anunț cu poză și aprobă-l din `#/admin`.

## Verificări înainte de lansare
- [ ] Completat în `index.html`: `[DENUMIRE FIRMĂ SRL]`, `[CUI]`, `[J../…/….]`, `[ADRESĂ]`, `[EMAIL CONTACT]`, `[TELEFON]`, `[DATA]`
- [ ] Termenii, confidențialitatea și cookie-urile validate juridic
- [ ] Backup activ la baza de date
- [ ] Resend configurat și `REQUIRE_VERIFIED_EMAIL=true`
- [ ] Plan Render care nu adoarme serverul (sau ping de monitorizare)
- [ ] Testat pe telefon: înregistrare, postare cu poze, mesaj, cerere și ofertă
- [ ] Dacă publicarea devine cu plată, adaugă în `ajutor.html` o întrebare despre tarife

## Pagina de ajutor
`ajutor.html` este adăugată în lista serverului (`/ajutor.html`) și are link în subsolul site-ului, în coloana „Ajutor rapid”.
