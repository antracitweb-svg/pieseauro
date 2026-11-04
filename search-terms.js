'use strict';
// Extinderea cuvintelor căutate: plural/singular, sinonime de piese și toleranță la greșeli la marcă/model.
// Modul pur (fără DB), folosit de buildListingFilter din server.js și testat în test/searchTerms.test.cjs.
// Toate cuvintele sunt deja normalizate (fără diacritice, litere mici) de norm() din server.js.

// 1) Forme neregulate: orice formă din grup găsește toate celelalte (cuvânt întreg, nu bucată de cuvânt).
const WORD_GROUPS = [
  ['usa', 'usi', 'usile', 'usii', 'usilor'],
  ['radiator', 'radiatoare', 'radiatorul', 'radiatorului', 'radiatoarele'],
  ['aripa', 'aripi', 'aripile', 'aripii'],
  ['oglinda', 'oglinzi', 'oglinzile', 'oglinzii'],
  ['roata', 'roti', 'rotile'],
  ['punte', 'punti', 'puntile'],
  ['far', 'faruri', 'farul', 'farurile'],
  ['stop', 'stopuri', 'stopul', 'stopurile'],
  ['bara', 'bare', 'barele', 'barei'],
  ['capota', 'capote', 'capotei', 'capotele', 'capot'],
  ['portiera', 'portiere', 'portierele', 'portierei'],
  ['geam', 'geamuri', 'geamul', 'geamurile'],
  ['scaun', 'scaune', 'scaunul', 'scaunele'],
  ['volan', 'volane', 'volanul', 'volanele'],
  ['amortizor', 'amortizoare', 'amortizorul', 'amortizoarele'],
  ['bujie', 'bujii', 'bujiile'],
  ['janta', 'jante', 'jantele', 'jantei'],
  ['anvelopa', 'anvelope', 'anvelopele'],
  ['plansa', 'planse', 'plansele'],
  ['galerie', 'galerii', 'galeriile']
];

// 2) Sinonime de poziție/zonă. Se aplică doar când e adevărat contextul (ex. „motor” = „față” doar lângă „capotă”).
const CAPOT_RE = /^capot/;
const SIDE_SYNONYMS = {
  fata: ['fata', 'motor', 'fronta', 'frontala', 'frontal'],
  motor: ['motor', 'fata', 'fronta', 'frontala', 'frontal']
};

// 3) Cuvinte-calificativ: se potrivesc dacă anunțul le conține (sau un sinonim) SAU dacă anunțul nu menționează opusul.
// Astfel „radiator apă” găsește un anunț care spune doar „radiatoare”, dar „capotă față” NU găsește „capotă spate”.
const QUALIFIERS = {
  fata: { words: ['fata', 'fronta', 'frontala', 'frontal', 'motor'], opposite: ['spate', 'spatele', 'portbagaj', 'haion'] },
  spate: { words: ['spate', 'spatele', 'portbagaj', 'haion'], opposite: ['fata', 'fronta', 'frontala', 'frontal'] },
  stanga: { words: ['stanga', 'stang', 'st'], opposite: ['dreapta', 'drept', 'dr'] },
  dreapta: { words: ['dreapta', 'drept', 'dr'], opposite: ['stanga', 'stang', 'st'] },
  apa: { words: ['apa', 'apei', 'racire', 'racirii', 'lichid'], opposite: ['clima', 'climatizare', 'ac', 'ulei', 'intercooler', 'incalzire', 'caldura', 'aer'] },
  clima: { words: ['clima', 'climatizare', 'ac', 'aer conditionat'], opposite: ['apa', 'racire', 'ulei', 'intercooler'] },
  ulei: { words: ['ulei', 'uleiului'], opposite: ['apa', 'racire', 'clima', 'climatizare', 'intercooler'] }
};

const GROUP_INDEX = new Map();
for (const g of WORD_GROUPS) for (const w of g) GROUP_INDEX.set(w, g);

// Mai mulți termeni de căutare pot cere context (ex. „capotă” în aceeași căutare).
function stemRo(term) {
  if (/\d/.test(term)) return term;
  const s = term.replace(/(ele|ei|a|e|i)$/, '');
  return s.length >= 4 ? s : term;
}

// Variante de rădăcină pentru substring LIKE (pentru cuvinte lungi, ≥4 litere).
function rootVariants(term) {
  const out = new Set();
  out.add(stemRo(term));
  // radiatoare ↔ radiator, amortizoare ↔ amortizor
  if (/oare$/.test(term) && term.length >= 7) out.add(term.slice(0, -4) + 'or');
  if (/oarele$/.test(term) && term.length >= 9) out.add(term.slice(0, -6) + 'or');
  if (/or$/.test(term) && term.length >= 5) out.add(term + 'oar');
  // forme cu -uri (geamuri → geam, faruri → far)
  if (/uri$/.test(term) && term.length >= 6) out.add(term.slice(0, -3));
  if (/urile$/.test(term) && term.length >= 8) out.add(term.slice(0, -5));
  // -ul / -ului (volanul → volan)
  if (/ului$/.test(term) && term.length >= 8) out.add(term.slice(0, -4));
  else if (/ul$/.test(term) && term.length >= 6) out.add(term.slice(0, -2));
  return [...out].filter(Boolean);
}

// Primele litere + restul literelor în ordine: „karq” → 'k%a%r%q%' găsește „karoq”. Doar pentru marcă/model.
function fuzzyPattern(term) {
  if (!/^[a-z]{4,12}$/.test(term)) return null;
  return term.split('').join('%') + '%';
}

/**
 * Returnează pentru fiecare termen:
 *  - like:   lista de modele LIKE (cu %) pentru substring în coloanele de text
 *  - words:  lista de cuvinte întregi (regex \y..\y) pentru formele neregulate / sinonime
 *  - fuzzy:  model LIKE ancorat pentru marcă/model (toleranță la litere lipsă) sau null
 *  - opposite: cuvinte care, dacă apar în anunț, exclud potrivirea prin „calificativ lipsă” (null = termen obligatoriu)
 */
function expandTerm(term, allTerms = []) {
  const hasCapot = allTerms.some(t => CAPOT_RE.test(t));
  const like = new Set(rootVariants(term).map(v => '%' + v + '%'));
  const words = new Set();
  const g = GROUP_INDEX.get(term);
  if (g) for (const w of g) words.add(w);
  let opposite = null;
  const q = QUALIFIERS[term];
  if (q) {
    for (const w of q.words) words.add(w);
    opposite = q.opposite.slice();
  }
  // „capotă motor” ≡ „capotă față”, doar când căutarea conține „capot*”.
  if (hasCapot && SIDE_SYNONYMS[term]) for (const w of SIDE_SYNONYMS[term]) words.add(w);
  // cuvintele scurte (< 4 litere) se potrivesc doar ca cuvânt întreg, ca să nu găsim „usa” în „causa”.
  if (term.length < 4 && !/\d/.test(term)) { like.clear(); words.add(term); }
  return { like: [...like], words: [...words], fuzzy: fuzzyPattern(term), opposite };
}

function escapeRegex(w) { return w.replace(/[^a-z0-9 ]/g, ''); }

// Pattern regex pentru Postgres (word boundary \y) dintr-o listă de cuvinte.
function wordsRegex(words) {
  const alts = words.map(escapeRegex).filter(Boolean);
  return alts.length ? '\\y(' + alts.join('|') + ')\\y' : null;
}

module.exports = { expandTerm, wordsRegex, stemRo, rootVariants, fuzzyPattern, WORD_GROUPS, QUALIFIERS };
