'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { buildSuggestions } = require('../search-suggest');

const rows = [
  { title: 'Capotă Golf 6 originală', type: 'piesa' },
  { title: 'Capota golf 6 gri', type: 'piesa' },
  { title: 'Capota Passat B7', type: 'piesa' },
  { title: 'BMW Seria 3 avariat', type: 'avariata' },
  { title: 'Avariat Audi A4 B8', type: 'avariata' },
  { title: 'Avariat Audi A4 B8', type: 'defecta' }
];

test('prea scurt → nimic', () => assert.deepStrictEqual(buildSuggestions('a', rows), []));

test('capota: expresii reale, cele mai frecvente primele, categorie piese', () => {
  const r = buildSuggestions('Capota', rows);
  assert.strictEqual(r[0].text, 'capota golf 6');
  assert.ok(r.every(x => x.cat === 'piese'));
  assert.ok(r.some(x => x.text === 'capota passat b7'));
});

test('capota: completează din lista fixă când sunt puține anunțuri', () => {
  const r = buildSuggestions('capota', []);
  assert.ok(r.length >= 5);
  assert.ok(r.some(x => x.text === 'capota duster'));
});

test('avariat → mașini, chiar fără anunțuri', () => {
  const r = buildSuggestions('avariat', []);
  assert.deepStrictEqual(r[0], { text: 'avariat', cat: 'masini' });
  assert.ok(r.some(x => x.text === 'avariat bmw' && x.cat === 'masini'));
});

test('avariat cu anunțuri: expresiile reale apar în categoria mașini', () => {
  const r = buildSuggestions('avariat', rows);
  assert.ok(r.some(x => x.text === 'avariat audi a4' && x.cat === 'masini'));
});

test('filtrul de categorie', () => {
  assert.ok(buildSuggestions('golf', rows, { cat: 'masini' }).every(x => x.cat === 'masini'));
  assert.ok(buildSuggestions('avariat', rows, { cat: 'piese' }).every(x => x.cat === 'piese'));
});

test('diacritice și majuscule', () => assert.ok(buildSuggestions('CAPOTĂ', rows).length > 0));

const rows2 = [
  { title: 'Capota Golf 6', type: 'piesa' },
  { title: 'Usa fata stanga Passat B7', type: 'piesa' },
  { title: 'Radiator apa Logan', type: 'piesa' },
  { title: 'Golf 7 avariat frontal', type: 'avariata' },
  { title: 'BMW avariat', type: 'avariata' }
];
test('capote găsește capota', () => assert.ok(buildSuggestions('capote', rows2).some(x => x.text === 'capota golf 6')));
test('usi găsește usa', () => assert.ok(buildSuggestions('usi', rows2).some(x => x.text.startsWith('usa fata'))));
test('radiatoare găsește radiator', () => assert.ok(buildSuggestions('radiatoare', rows2).some(x => x.text === 'radiator apa logan')));
test('avariate găsește titlurile cu avariat, în mașini', () => {
  const r = buildSuggestions('avariate', rows2);
  assert.ok(r.some(x => x.text === 'avariat' && x.cat === 'masini'));
  assert.ok(r.every(x => x.cat === 'masini'));
  assert.ok(buildSuggestions('avariate', rows2, { cat: 'masini' }).length >= 3);
});
test('capote fără anunțuri: lista fixă', () => assert.ok(buildSuggestions('capote', []).some(x => x.text === 'capota golf 6')));
