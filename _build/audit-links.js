/* Static sanity check for the site: internal links, local assets, id uniqueness,
   accessible names on iframes, and JS syntax. Run: node _build/audit-links.js   */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const files = fs.readdirSync(ROOT).filter((f) => /\.html$/i.test(f)).sort();

const problems = [];
const add = (f, msg) => problems.push(`${f.padEnd(22)} ${msg}`);

/* ---------- internal links + local assets ---------- */
const assetExists = (rel) => fs.existsSync(path.join(ROOT, rel.split('#')[0].split('?')[0]));

for (const f of files) {
  const html = fs.readFileSync(path.join(ROOT, f), 'utf8');

  for (const m of html.matchAll(/(?:href|src)\s*=\s*"([^"]+)"/g)) {
    const url = m[1].trim();
    if (!url || url.startsWith('#')) continue;
    if (/^(https?:|mailto:|tel:|data:|javascript:|\/\/)/i.test(url)) continue;
    if (!assetExists(url)) add(f, `broken link -> ${url}`);
  }

  /* duplicate ids break aria-controls / label[for] */
  const ids = [...html.matchAll(/\sid\s*=\s*"([^"]+)"/g)].map((m) => m[1]);
  const dupes = [...new Set(ids.filter((id, i) => ids.indexOf(id) !== i))];
  for (const d of dupes) add(f, `duplicate id "${d}"`);

  /* label[for] and aria-controls must resolve */
  for (const m of html.matchAll(/\sfor\s*=\s*"([^"]+)"/g)) {
    if (!ids.includes(m[1])) add(f, `label[for="${m[1]}"] has no matching element`);
  }
  for (const m of html.matchAll(/aria-controls\s*=\s*"([^"]+)"/g)) {
    if (!ids.includes(m[1])) add(f, `aria-controls="${m[1]}" has no matching element`);
  }

  /* iframes need an accessible name */
  for (const m of html.matchAll(/<iframe\b([^>]*)>/g)) {
    if (!/\stitle\s*=/.test(m[1])) add(f, 'iframe without a title attribute');
  }

  /* href="#" is only dead when nothing wires it up. Anchors carrying an id or a
     data-target are handled in js/ (dashboard section switcher, auth modals). */
  const jsSource = fs.readdirSync(path.join(ROOT, 'js'))
    .filter((f) => f.endsWith('.js'))
    .map((f) => fs.readFileSync(path.join(ROOT, 'js', f), 'utf8'))
    .join('\n');

  let deadHash = 0;
  for (const m of html.matchAll(/<a\b([^>]*\bhref="#"[^>]*)>/g)) {
    const attrs = m[1];
    const wiredByTarget = /\bdata-target\s*=/.test(attrs);
    const idMatch = attrs.match(/\bid\s*=\s*"([^"]+)"/);
    const wiredById = idMatch && jsSource.includes(idMatch[1]);
    if (!wiredByTarget && !wiredById) deadHash++;
  }
  if (deadHash) add(f, `${deadHash} unwired placeholder href="#" link(s)`);
}

/* ---------- duplicate ids across pages must be unique per page only; check js syntax ---------- */
const jsDir = path.join(ROOT, 'js');
for (const f of fs.readdirSync(jsDir).filter((f) => f.endsWith('.js'))) {
  try {
    execFileSync(process.execPath, ['--check', path.join(jsDir, f)], { stdio: 'pipe' });
  } catch (e) {
    add(`js/${f}`, `syntax error: ${String(e.stderr || e).split('\n')[2] || 'parse failed'}`);
  }
}

console.log(`Checked ${files.length} pages, ${fs.readdirSync(jsDir).filter((f) => f.endsWith('.js')).length} scripts.`);
if (problems.length) {
  problems.forEach((p) => console.log('  ' + p));
  console.log(`\n${problems.length} problem(s) found`);
  process.exit(1);
}
console.log('No broken links, duplicate ids, dangling aria references or JS syntax errors.');