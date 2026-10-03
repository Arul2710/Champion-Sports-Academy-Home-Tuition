const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const htmlFiles = fs.readdirSync(ROOT).filter((f) => /\.html$/i.test(f));
const jsFiles = fs.readdirSync(path.join(ROOT, 'js')).filter((f) => /\.js$/i.test(f));
const cssFiles = fs.readdirSync(path.join(ROOT, 'css')).filter((f) => /\.css$/i.test(f));

const PUBLIC_PAGES = new Set([
  'index.html', 'home2.html', 'about.html', 'sports.html', 'coaches.html',
  'batches.html', 'locations.html', 'blog.html', 'blog-details.html',
  'coach-details.html', 'contact.html', '404.html', 'privacy-policy.html', 'terms.html',
]);

let problems = 0;
const fail = (msg) => {
  problems++;
  console.log(`  FAIL  ${msg}`);
};

/* ---------- 1. broken internal links ---------- */
console.log('\n[1] Internal link targets');
for (const f of htmlFiles) {
  const html = fs.readFileSync(path.join(ROOT, f), 'utf8');
  const hrefs = [...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
  for (const h of hrefs) {
    if (/^(https?:|mailto:|tel:|#|javascript:)/.test(h)) continue;
    const target = h.split('#')[0].split('?')[0];
    if (!target) continue;
    if (!fs.existsSync(path.join(ROOT, target))) fail(`${f} -> ${h} (missing)`);
  }
}

/* ---------- 2. images: alt text + lazy loading ---------- */
console.log('\n[2] Images (alt text / lazy loading)');
for (const f of htmlFiles) {
  const html = fs.readFileSync(path.join(ROOT, f), 'utf8');
  const imgs = [...html.matchAll(/<img\b[^>]*>/g)].map((m) => m[0]);
  imgs.forEach((tag, i) => {
    if (!/\balt=/.test(tag)) fail(`${f} img#${i + 1} missing alt`);
    if (!/\bloading=/.test(tag)) fail(`${f} img#${i + 1} missing loading attr`);
  });
}

/* ---------- 3. six sections on public pages ---------- */
console.log('\n[3] Exactly six <section> in <main>');
for (const f of [...PUBLIC_PAGES].sort()) {
  const html = fs.readFileSync(path.join(ROOT, f), 'utf8');
  const m = html.match(/<main\b[\s\S]*?<\/main>/);
  if (!m) {
    fail(`${f} has no <main>`);
    continue;
  }
  const n = (m[0].match(/<section\b/g) || []).length;
  if (n !== 6) fail(`${f} has ${n} sections (expected 6)`);
}

/* ---------- 4. hero first, CTA last ---------- */
console.log('\n[4] Hero first / CTA last section');
for (const f of [...PUBLIC_PAGES].sort()) {
  const html = fs.readFileSync(path.join(ROOT, f), 'utf8');
  const m = html.match(/<main\b[\s\S]*?<\/main>/);
  if (!m) continue;
  const comments = [...m[0].matchAll(/<!--\s*SECTION\s+(\d+):\s*([^>]*?)-->/g)];
  if (comments.length !== 6) {
    fail(`${f} has ${comments.length} section comments (expected 6)`);
    continue;
  }
  const first = comments[0];
  if (!/HERO/i.test(first[2])) fail(`${f} first section is not a hero ("${first[2].trim()}")`);
  const last = comments[5];
  if (!/CTA/i.test(last[2])) fail(`${f} last section is not a CTA ("${last[2].trim()}")`);
  const nums = comments.map((c) => Number(c[1]));
  if (nums.join(',') !== '1,2,3,4,5,6') fail(`${f} section numbering is ${nums.join(',')}`);
}

/* ---------- 5. navbar rules ---------- */
console.log('\n[5] Navbar (no top-level Coaches / Home dropdown)');
for (const f of [...PUBLIC_PAGES].sort()) {
  const html = fs.readFileSync(path.join(ROOT, f), 'utf8');
  const nav = html.match(/<nav\b[\s\S]*?<\/nav>/);
  if (!nav) {
    fail(`${f} has no <nav>`);
    continue;
  }
  const n = nav[0];
  // top-level nav-links must not include Coaches
  const topLevel = [...n.matchAll(/<a[^>]*class="[^"]*nav-link[^"]*"[^>]*>([^<]*)</g)].map((m) => m[1].trim());
  if (topLevel.some((t) => /coaches/i.test(t))) fail(`${f} has a top-level Coaches nav-link`);
  // Coaches must exist in the About dropdown
  if (!/href="coaches\.html"/.test(n)) fail(`${f} nav has no coaches.html link`);
  // Home dropdown must point at index.html and home2.html
  if (!/href="index\.html"[\s\S]{0,400}href="home2\.html"/.test(n) && !/home2\.html/.test(n)) {
    fail(`${f} nav missing home2.html link`);
  }
}

/* ---------- 6. theme + RTL hooks on every page ---------- */
console.log('\n[6] Theme / RTL / mobile drawer hooks');
for (const f of htmlFiles) {
  const html = fs.readFileSync(path.join(ROOT, f), 'utf8');
  // redirect stubs have no chrome, no theme toggle and no imagery
  const isStub = f === 'home-1.html' || f === 'home-2.html';
  if (isStub) continue;
  const isChromeLess = ['login.html', 'signup.html', 'parent-dashboard.html', 'admin-dashboard.html'].includes(f);
  if (!/js\/theme\.js/.test(html)) fail(`${f} missing theme.js`);
  if (!/js\/rtl\.js/.test(html)) fail(`${f} missing rtl.js`);
  if (!/dark:bg-/.test(html)) fail(`${f} has no dark-mode classes`);
  if (!isChromeLess && !/id="mobile-menu-toggle"/.test(html)) fail(`${f} missing mobile menu toggle`);
}

/* ---------- 7. auth modal contract ---------- */
console.log('\n[7] Forgot-password modal contract on login.html');
{
  const html = fs.readFileSync(path.join(ROOT, 'login.html'), 'utf8');
  for (const id of ['forgot-password-link', 'forgot-password-modal', 'close-forgot-modal', 'forgot-modal-form', 'reset-modal-email']) {
    if (!html.includes(`id="${id}"`)) fail(`login.html missing #${id}`);
  }
  if (/forgot-password\.html/.test(html)) fail('login.html still links to forgot-password.html');
  if (fs.existsSync(path.join(ROOT, 'forgot-password.html'))) fail('forgot-password.html still exists');
  const auth = fs.readFileSync(path.join(ROOT, 'js', 'auth.js'), 'utf8');
  for (const id of ['forgot-password-link', 'forgot-password-modal', 'reset-modal-email']) {
    if (!auth.includes(id)) fail(`auth.js missing handler for ${id}`);
  }
}

/* ---------- 8. legacy palette / malformed colors ---------- */
console.log('\n[8] Colour tokens');
const allText = [
  ...htmlFiles.map((f) => ['html', f, fs.readFileSync(path.join(ROOT, f), 'utf8')]),
  ...jsFiles.map((f) => ['js', f, fs.readFileSync(path.join(ROOT, 'js', f), 'utf8')]),
  ...cssFiles.map((f) => ['css', f, fs.readFileSync(path.join(ROOT, 'css', f), 'utf8')]),
];
const BAD = [
  ['legacy family', /\b(emerald|green|lime|teal|amber|orange|yellow|indigo|violet|purple|fuchsia|pink|cyan)-\d{2,3}\b/g],
  ['shade-less token', /(?:bg|text|border|from|via|to|ring|fill|stroke|divide|outline|shadow)-(?:blue|sky|slate|rose)(?![\d:/-])/g],
  ['double shade', /\b(?:blue|sky|slate)-\d+-\d+\b/g],
  ['legacy hex', /#(?:16a34a|15803d|14532d|22c55e|f97316|7c3aed|0d9488|4ade80|dcfce7)\b/gi],
];
for (const [kind, file, text] of allText) {
  for (const [label, re] of BAD) {
    const m = text.match(re);
    if (m) fail(`${kind}/${file}: ${label} -> ${[...new Set(m)].slice(0, 4).join(', ')}`);
  }
}

/* ---------- 9. JS referenced files exist ---------- */
console.log('\n[9] Referenced assets exist');
for (const f of htmlFiles) {
  const html = fs.readFileSync(path.join(ROOT, f), 'utf8');
  for (const m of [...html.matchAll(/(?:src|href)="((?:js|css)\/[^"]+)"/g)].map((x) => x[1])) {
    if (!fs.existsSync(path.join(ROOT, m))) fail(`${f} references missing ${m}`);
  }
}

console.log(`\n${problems === 0 ? 'ALL CHECKS PASSED' : `${problems} problem(s) found`}`);
