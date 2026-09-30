# AutoPiese – versiune extinsă

Această versiune pornește de la backend-ul existent și adaugă catalog auto + identificare din text + fundație SEO.

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
