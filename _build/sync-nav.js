/* Propagates the shared navbar + mobile drawer from index.html into every page
   that uses the site chrome.

   index.html is the single source of truth for the nav markup. build-pages.js
   already lifts its nav verbatim; this script brings the remaining hand-written
   pages (about, locations, home2) in line so the chrome never drifts.

   Run: node _build/sync-nav.js   (add --check to verify without writing)   */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const START = '<!-- ================= SITE NAVBAR ================= -->';
const END = '<!-- ================= MOBILE / TABLET DRAWER ================= -->';
const CUT = '<!-- MAIN CONTENT';

/* Pages that intentionally ship without the site chrome. */
const NO_CHROME = new Set([
  'login.html',
  'signup.html',
  'parent-dashboard.html',
  'admin-dashboard.html',
  'home-1.html',
  'home-2.html',
]);

/* Returns the canonical nav+drawer block, or null when the markers are missing. */
function extractBlock(html) {
  const start = html.indexOf(START);
  const cut = html.indexOf(CUT);
  if (start === -1 || cut === -1 || cut < start) return null;
  return html.slice(start, cut).trimEnd();
}

const source = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const canonical = extractBlock(source);
if (!canonical) {
  console.error('index.html no longer contains the expected navbar/drawer markers.');
  process.exit(1);
}

const checkOnly = process.argv.includes('--check');
const files = fs
  .readdirSync(ROOT)
  .filter((f) => /\.html$/i.test(f) && f !== 'index.html' && !NO_CHROME.has(f))
  .sort();

const drifted = [];
for (const f of files) {
  const file = path.join(ROOT, f);
  const html = fs.readFileSync(file, 'utf8');
  const current = extractBlock(html);

  if (current === null) {
    console.log(`${f.padEnd(22)} skipped (no site chrome)`);
    continue;
  }
  if (current === canonical) {
    console.log(`${f.padEnd(22)} in sync`);
    continue;
  }
  drifted.push(f);
  if (checkOnly) {
    console.log(`${f.padEnd(22)} OUT OF SYNC`);
    continue;
  }
  fs.writeFileSync(file, html.replace(current, canonical));
  console.log(`${f.padEnd(22)} synced`);
}

if (drifted.length && checkOnly) {
  console.log(`\n${drifted.length} page(s) drifted from index.html. Run: node _build/sync-nav.js`);
  process.exit(1);
}
if (drifted.length) {
  console.log(`\nSynced ${drifted.length} page(s) from index.html.`);
}