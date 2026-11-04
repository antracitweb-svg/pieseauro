'use strict';
// Sugestii de căutare (stil OLX): expresii frecvente din titlurile anunțurilor + o listă fixă de rezervă.
// Modul pur (fără DB): server.js îi dă titlurile potrivite, el întoarce [{text, cat}] unde cat = 'piese' | 'masini'.
// Testat în test/searchSuggest.test.cjs.

const norm = (s = '') => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

// Cuvinte care duc spre „Mașini avariate / defecte” (prefix de minimum 4 litere: „avar”, „acci”, „defe”…).
const MASINI_ROOTS = ['avariat', 'accidentat', 'defect', 'epava', 'daunat', 'lovit', 'incendiat', 'inundat', 'grindinat', 'dezmembr'];
const MASINI_TYPES = new Set(['avariata', 'defecta', 'masina']);

const PARTS = ['capota', 'far', 'faruri', 'stop', 'bara fata', 'bara spate', 'aripa', 'radiator', 'usa', 'portiera', 'oglinda', 'amortizor',
  'kit ambreiaj', 'volan', 'bord', 'airbag', 'turbina', 'injector', 'alternator', 'electromotor', 'cutie viteze', 'motor', 'jante', 'anvelope',
  'discuri frana', 'placute frana', 'planetara', 'punte spate', 'haion', 'geam'];
const POP_MODELS = ['passat b7', 'golf 6', 'logan 2', 'duster', 'passat b8', 'octavia 2', 'astra h', 'focus 2', 'megane 3', 'a4 b8'];
const MAKES = ['audi', 'bmw', 'dacia', 'volkswagen', 'skoda', 'mercedes', 'ford', 'opel', 'renault', 'seat', 'toyota', 'peugeot'];
const MODELS = ['golf 4', 'golf 5', 'golf 6', 'golf 7', 'golf 8', 'passat b5', 'passat b6', 'passat b7', 'passat b8', 'logan', 'sandero', 'duster',
  'octavia', 'fabia', 'superb', 'karoq', 'kodiaq', 'mondeo', 'focus', 'fiesta', 'kuga', 'astra', 'corsa', 'insignia', 'megane', 'clio', 'a3', 'a4', 'a6',
  'seria 3', 'seria 5', 'x5', 'e90', 'f30', 'ibiza', 'leon', 'corolla', 'rav4', '308', '207'];
const FIXED = [
  ...PARTS.map(text => ({ text, cat: 'piese' })),
  ...MAKES.map(text => ({ text, cat: 'piese' })),
  ...MODELS.map(text => ({ text, cat: 'piese' }))
];

const isMasiniWord = w => w.length >= 4 && MASINI_ROOTS.some(r => r.startsWith(w) || w.startsWith(r));
const catOfType = t => (MASINI_TYPES.has(String(t || '')) ? 'masini' : 'piese');

// Cuvintele de după cele tastate, până la 4 cuvinte în total; se oprește la cuvinte „de umplutură” și la prețuri.
const STOP = new Set(['si', 'cu', 'de', 'pentru', 'la', 'din', 'in', 'pe', 'ptr', 'urgent', 'noua', 'nou', 'originala', 'original', 'second', 'hand']);

function phraseFromTitle(words, tokens) {
  const n = tokens.length;
  for (let i = 0; i + n <= words.length; i++) {
    let ok = true;
    for (let k = 0; k < n; k++) {
      const w = words[i + k];
      if (k < n - 1 ? w !== tokens[k] : !w.startsWith(tokens[k])) { ok = false; break; }
    }
    if (!ok) continue;
    // Ultimul cuvânt tastat se completează; apoi se adaugă până la 2 cuvinte utile.
    let end = i + n;
    while (end < words.length && end - i < Math.min(4, n + 2) && !STOP.has(words[end]) && words[end].length <= 12) end++;
    return words.slice(i, end).join(' ');
  }
  return '';
}

/**
 * @param {string} rawQ    ce a scris utilizatorul
 * @param {{title:string,type:string}[]} rows titluri de anunțuri care conțin cuvintele tastate
 * @param {{cat?:string,limit?:number}} opt cat: 'piese' | 'masini' | undefined (toate)
 */
function buildSuggestions(rawQ, rows = [], opt = {}) {
  const q = norm(rawQ).slice(0, 40);
  if (q.length < 2) return [];
  const tokens = q.split(' ').slice(0, 4);
  const limit = Math.max(1, Math.min(12, opt.limit || 8));
  const want = opt.cat === 'piese' || opt.cat === 'masini' ? opt.cat : null;

  // 1) expresii reale din anunțuri
  const counts = new Map();
  for (const r of rows) {
    const cat = catOfType(r.type);
    if (want && cat !== want) continue;
    const words = norm(r.title).split(' ').filter(Boolean);
    const ph = phraseFromTitle(words, tokens);
    if (!ph) continue;
    const key = ph + '|' + cat;
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  const real = [...counts.entries()].map(([k, n]) => { const [text, cat] = k.split('|'); return { text, cat, n }; })
    .sort((a, b) => b.n - a.n || a.text.length - b.text.length || a.text.localeCompare(b.text));

  const out = [], seen = new Set();
  const push = s => { const k = s.text + '|' + s.cat; if (seen.has(k) || out.length >= limit) return; if (want && s.cat !== want) return; seen.add(k); out.push({ text: s.text, cat: s.cat }); };

  // 2) cuvintele „avariat / defect…” duc direct spre mașini, chiar dacă nu există încă anunțuri
  const first = tokens[0];
  const masiniTyped = tokens.length === 1 && isMasiniWord(first);
  if (masiniTyped) {
    const root = MASINI_ROOTS.find(r => r.startsWith(first) || first.startsWith(r)) || first;
    const word = first.length >= root.length ? first : root;
    push({ text: word, cat: 'masini' });
    for (const s of real) if (s.cat === 'masini') push(s);
    for (const m of MAKES.slice(0, 4)) push({ text: `${word} ${m}`, cat: 'masini' });
  }

  // 3) restul expresiilor reale (ambele categorii dacă un cuvânt are rezultate în ambele)
  for (const s of real) push(s);

  // 4) lista fixă (rezervă când sunt puține anunțuri): cuvinte care încep ca ce s-a tastat
  if (out.length < limit && !masiniTyped) {
    const lastTok = tokens[tokens.length - 1];
    const partHit = tokens.length === 1 && PARTS.find(p => p.startsWith(first));
    if (partHit) for (const m of POP_MODELS) push({ text: `${partHit} ${m}`, cat: 'piese' });
    for (const f of FIXED) if (f.text.startsWith(q) || (tokens.length === 1 && f.text.split(' ').some(w => w.startsWith(first) && first.length >= 3)) || (tokens.length > 1 && f.text.startsWith(tokens.slice(0, -1).join(' ') + ' ') && f.text.split(' ').pop().startsWith(lastTok))) push(f);
  }
  return out.slice(0, limit);
}

module.exports = { buildSuggestions, phraseFromTitle, isMasiniWord, catOfType, norm };
