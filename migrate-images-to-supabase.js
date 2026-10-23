#!/usr/bin/env node
/*
 * Mută pozele vechi (base64 în PostgreSQL) în Supabase Storage.
 *
 * Folosire (din folderul proiectului, cu aceleași variabile ca pe Render):
 *   DATABASE_URL=... SUPABASE_URL=... SUPABASE_SERVICE_KEY=... node migrate-images-to-supabase.js            # simulare (nu scrie nimic)
 *   DATABASE_URL=... SUPABASE_URL=... SUPABASE_SERVICE_KEY=... node migrate-images-to-supabase.js --apply    # migrează efectiv
 *
 * Siguranță:
 *  - Implicit rulează în SIMULARE: doar numără ce ar muta.
 *  - Se poate relua oricând: rândurile deja migrate (URL-uri) sunt sărite.
 *  - Un rând se actualizează doar dacă toate pozele lui s-au încărcat și doar dacă nu s-a modificat între timp
 *    (UPDATE ... WHERE images = valoarea citită). Orice eroare lasă rândul neschimbat.
 *  - Nu șterge nimic din Storage și nu modifică alte tabele/coloane.
 *  - Fă un backup al bazei de date înainte de --apply.
 */
const { Pool } = require('pg');
const crypto = require('crypto');

const APPLY = process.argv.includes('--apply');
const BATCH = Number(process.env.MIGRATE_BATCH) || 20;

const DB_URL = process.env.DATABASE_URL || '';
const DB_LOCAL = /localhost|127\.0\.0\.1/.test(DB_URL);
const SUPA_URL = (process.env.SUPABASE_URL || '').trim().replace(/\/(rest|storage|auth)\/v1.*$/, '').replace(/\/+$/, '');
const SUPA_KEY = (process.env.SUPABASE_SERVICE_KEY || '').trim();
const SUPA_BUCKET = (process.env.SUPABASE_BUCKET || 'pieseauto').trim();
const STORAGE_PUBLIC = SUPA_URL + '/storage/v1/object/public/' + SUPA_BUCKET + '/';

// Tabel, coloana cu proprietarul, coloana cu poze.
const TARGETS = [
  { table: 'listings', owner: 'user_id' },
  { table: 'part_requests', owner: 'user_id' },
  { table: 'offers', owner: 'seller_id' },
];

const DATA_IMG_RE = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/=]+)$/;
const isDataImg = s => typeof s === 'string' && DATA_IMG_RE.test(s);

async function uploadImage(dataUrl, userId) {
  const m = DATA_IMG_RE.exec(dataUrl);
  const key = 'u' + userId + '/' + Date.now() + '-' + crypto.randomBytes(6).toString('hex') + '.' + (m[1] === 'jpeg' ? 'jpg' : m[1]);
  const r = await fetch(SUPA_URL + '/storage/v1/object/' + SUPA_BUCKET + '/' + key, {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + SUPA_KEY,
      apikey: SUPA_KEY,
      'Content-Type': 'image/' + m[1],
      'cache-control': 'max-age=31536000',
    },
    body: Buffer.from(m[2], 'base64'),
  });
  if (!r.ok) throw new Error('upload ' + r.status + ' ' + (await r.text()).slice(0, 160));
  return STORAGE_PUBLIC + key;
}

async function migrateTable(pool, { table, owner }, stats) {
  let lastId = 0;
  for (;;) {
    const { rows } = await pool.query(
      `SELECT id, ${owner} AS owner_id, images FROM ${table}
        WHERE id > $1 AND EXISTS (SELECT 1 FROM unnest(images) i WHERE i LIKE 'data:image/%')
        ORDER BY id LIMIT $2`,
      [lastId, BATCH]
    );
    if (!rows.length) break;
    for (const row of rows) {
      lastId = row.id;
      const original = row.images;
      const todo = original.filter(isDataImg);
      stats.rows++;
      stats.images += todo.length;
      stats.bytes += todo.reduce((a, s) => a + s.length, 0);
      if (!APPLY) continue;
      try {
        const next = [];
        for (const img of original) next.push(isDataImg(img) ? await uploadImage(img, row.owner_id) : img);
        const r = await pool.query(
          `UPDATE ${table} SET images = $1::text[] WHERE id = $2 AND images = $3::text[]`,
          [next, row.id, original]
        );
        if (r.rowCount === 1) stats.rowsDone++;
        else { stats.rowsChanged++; console.warn(`  ${table}#${row.id}: modificat între timp, sărit (rulează din nou).`); }
      } catch (e) {
        stats.rowsFailed++;
        console.error(`  ${table}#${row.id}: EȘUAT -> ${e.message}`);
      }
    }
    process.stdout.write(`  ${table}: procesat până la id ${lastId}\r`);
  }
  process.stdout.write('\n');
}

async function main() {
  if (!DB_URL) throw new Error('DATABASE_URL lipsește.');
  if (!SUPA_URL || !SUPA_KEY) throw new Error('SUPABASE_URL / SUPABASE_SERVICE_KEY lipsesc.');
  console.log(APPLY ? 'MOD: APLICARE (scrie în Storage și în baza de date)' : 'MOD: SIMULARE (nu se scrie nimic; adaugă --apply pentru migrare)');
  const pool = new Pool({ connectionString: DB_URL, ssl: DB_LOCAL ? false : { rejectUnauthorized: process.env.DATABASE_SSL_STRICT === 'true' }, max: 2 });
  const total = { rows: 0, images: 0, bytes: 0, rowsDone: 0, rowsFailed: 0, rowsChanged: 0 };
  try {
    for (const t of TARGETS) {
      const stats = { rows: 0, images: 0, bytes: 0, rowsDone: 0, rowsFailed: 0, rowsChanged: 0 };
      console.log(`\n[${t.table}]`);
      await migrateTable(pool, t, stats);
      console.log(`  rânduri cu poze base64: ${stats.rows}, poze: ${stats.images}, ~${(stats.bytes / 1048576).toFixed(1)} MB` +
        (APPLY ? `, migrate: ${stats.rowsDone}, eșuate: ${stats.rowsFailed}, modificate între timp: ${stats.rowsChanged}` : ''));
      for (const k of Object.keys(total)) total[k] += stats[k];
    }
  } finally {
    await pool.end();
  }
  console.log(`\nTOTAL: ${total.rows} rânduri, ${total.images} poze, ~${(total.bytes / 1048576).toFixed(1)} MB` +
    (APPLY ? ` | migrate: ${total.rowsDone}, eșuate: ${total.rowsFailed}, modificate între timp: ${total.rowsChanged}` : ''));
  if (APPLY && total.rowsDone) {
    console.log('\nSpațiul din PostgreSQL se eliberează efectiv abia după:  VACUUM FULL listings, part_requests, offers;');
    console.log('(blochează temporar tabelele — rulează-l într-un moment liniștit).');
  }
  if (APPLY && (total.rowsFailed || total.rowsChanged)) process.exitCode = 2;
}

if (require.main === module) main().catch(e => { console.error('EROARE:', e.message); process.exit(1); });
module.exports = { migrateTable, isDataImg };
