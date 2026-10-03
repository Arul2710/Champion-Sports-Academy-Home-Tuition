const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const TARGETS = [
  'index.html',
  '404.html',
  'batches.html',
  'blog-details.html',
  'coaches.html',
  'privacy-policy.html',
  'sports.html',
  'terms.html',
  'blog.html',
  'coach-details.html',
  'contact.html',
];

// The canonical drawer ends with:  <a ...>Enroll Child</a> </div> </div>
// Everything between that close and <main> is leftover markup from the old drawer.
const DRAWER_END = /(<a href="signup\.html" class="[^"]*">Enroll Child<\/a>\s*<\/div>\s*<\/div>)([\s\S]*?)(<main\b)/;

let fixed = 0;
for (const f of TARGETS) {
  const p = path.join(ROOT, f);
  if (!fs.existsSync(p)) continue;
  const before = fs.readFileSync(p, 'utf8');
  const m = before.match(DRAWER_END);
  if (!m) {
    console.log(`${f.padEnd(22)} no orphan found`);
    continue;
  }
  const junk = m[2].trim();
  if (!junk) {
    console.log(`${f.padEnd(22)} clean`);
    continue;
  }
  const after = before.replace(DRAWER_END, `$1\n\n    $3`);
  fs.writeFileSync(p, after);
  console.log(`${f.padEnd(22)} removed ${junk.split('\n').length} orphan line(s)`);
  fixed++;
}
console.log(`\n${fixed} file(s) repaired`);
