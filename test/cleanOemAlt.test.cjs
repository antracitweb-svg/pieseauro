// Node.js TAP test for cleanOemAlt functionality
// Tests the cross-reference OEM code normalization function

function cleanOemAlt(raw) {
  const list = Array.isArray(raw) ? raw : String(raw || '').split(/[,;\n|]+/);
  const out = [], seen = new Set();
  for (const item of list) {
    const code = String(item || '').toUpperCase().replace(/[^A-Z0-9 .\/-]/g, '').replace(/\s+/g, ' ').trim().slice(0, 40);
    if (!code) continue;
    const key = code.replace(/[^A-Z0-9]/g, '');
    if (!key || seen.has(key)) continue;
    seen.add(key); out.push(code);
    if (out.length >= 12) break;
  }
  return out.join(', ') || null;
}

const tests = [
  { input: "1k0615301a, 1K0 615 301M ,, 1K0615301A", expected: "1K0615301A, 1K0 615 301M" },
  { input: "abc<script>, 123", expected: "ABCSCRIPT, 123" },
  { input: "", expected: null },
  { input: ["a1", "a1", "b2"], expected: "A1, B2" },
  { input: "1,2,3,4,5,6,7,8,9,10,11,12,13,14", expected: "1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12" },
  { input: "1K0-615-301 | 1K0615301", expected: "1K0-615-301" },
];

let passed = 0;
let failed = 0;

for (const t of tests) {
  const got = cleanOemAlt(t.input);
  if (got !== t.expected) {
    console.log(`FAIL: got ${JSON.stringify(got)}, expected ${JSON.stringify(t.expected)} for input ${JSON.stringify(t.input)}`);
    failed++;
  } else {
    passed++;
    console.log(`PASS ${passed}`);
  }
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);