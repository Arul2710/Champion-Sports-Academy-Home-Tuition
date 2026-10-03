/* Final verification for the image-localisation pass.
   - every local image reference points at a file that exists
   - every referenced file is a real, decodable image
   - reports orphaned downloads and any remaining external image URL
   Run: node _build/verify-images.js */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const IMG = path.join(ROOT, 'images');

const walk = (dir, out = []) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (e.name !== 'node_modules') walk(p, out); }
    else if (/\.(html|css|js)$/i.test(e.name)) out.push(p);
  }
  return out;
};

const sniff = (buf) => {
  const s = (a, b) => buf.slice(a, b).toString('latin1');
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'JPEG';
  if (s(0, 4) === '\x89PNG') return 'PNG';
  if (s(0, 3) === 'GIF') return 'GIF';
  if (s(0, 4) === 'RIFF' && s(8, 12) === 'WEBP') return 'WEBP';
  if (s(4, 8) === 'ftyp') { const b = s(8, 12); if (b.startsWith('avif')) return 'AVIF'; }
  return null;
};

/* src="images/x"  |  url('images/x')  — anything relative that points into images/ */
const LOCAL = /(?:src\s*=\s*"|url\(\s*['"])((?:\.\.\/|\.\/)?images\/[^'")]+)/gi;
/* external http(s) in an image position */
const EXTERNAL = /(?:src\s*=\s*"|url\(\s*['"])(https?:\/\/[^'")]+)/gi;
const NOT_IMAGE = /tailwindcss|fonts\.googleapis|fonts\.gstatic|cdnjs\.cloudflare|google\.com\/maps/;

let bad = 0;
const missing = [], broken = [], external = new Map(), used = new Set();

for (const f of walk(ROOT)) {
  if (f.startsWith(IMG)) continue;
  const txt = fs.readFileSync(f, 'utf8');
  const rel = path.relative(ROOT, f);

  LOCAL.lastIndex = 0;
  let m;
  while ((m = LOCAL.exec(txt))) {
    const ref = m[1];
    const abs = path.resolve(path.dirname(f), ref);
    const key = path.relative(ROOT, abs).split(path.sep).join('/');
    used.add(key);
    if (!fs.existsSync(abs)) { missing.push(`${rel} -> ${ref}`); continue; }
    const kind = sniff(fs.readFileSync(abs));
    if (!kind) broken.push(`${rel} -> ${ref} (not a valid image)`);
  }

  EXTERNAL.lastIndex = 0;
  while ((m = EXTERNAL.exec(txt))) {
    if (NOT_IMAGE.test(m[1])) continue;
    if (!external.has(m[1])) external.set(m[1], new Set());
    external.get(m[1]).add(rel);
  }
}

for (const x of missing) { console.log('  MISSING   ' + x); bad++; }
for (const x of broken) { console.log('  CORRUPT   ' + x); bad++; }

const onDisk = fs.existsSync(IMG) ? fs.readdirSync(IMG).map((n) => 'images/' + n) : [];
const orphans = onDisk.filter((f) => !used.has(f));
const files = onDisk.map((f) => path.join(IMG, path.basename(f)));
const totalBytes = files.reduce((n, f) => n + fs.statSync(f).size, 0);

console.log(`images/            ${onDisk.length} file(s), ${(totalBytes / 1048576).toFixed(2)} MB`);
console.log(`local references   ${used.size} distinct file(s) referenced`);
console.log(`missing files      ${missing.length}`);
console.log(`corrupt files      ${broken.length}`);
console.log(`orphaned downloads ${orphans.length}${orphans.length ? ' -> ' + orphans.join(', ') : ''}`);
console.log(`external image URLs still present: ${external.size}`);
for (const [u, files2] of external) console.log(`  - ${u}\n      used in: ${[...files2].join(', ')}`);

console.log(bad ? `\n${bad} problem(s)` : '\nAll local image references resolve to real image files.');
