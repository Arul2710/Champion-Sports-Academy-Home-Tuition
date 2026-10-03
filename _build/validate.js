const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const VOID = new Set([
  'area','base','br','col','embed','hr','img','input','link','meta',
  'param','source','track','wbr',
]);

function tagBalance(html, label) {
  const stack = [];
  const re = /<(\/?)([a-zA-Z][a-zA-Z0-9-]*)((?:"[^"]*"|'[^']*'|[^>"'])*?)(\/?)>/g;
  let m;
  const errors = [];
  while ((m = re.exec(html))) {
    const [, closing, name, attrs, selfClose] = m;
    const tag = name.toLowerCase();
    if (VOID.has(tag) || selfClose === '/') continue;
    // ignore raw-text / comment-ish regions
    if (closing) {
      const top = stack.pop();
      if (top !== tag) {
        errors.push(`line ${html.slice(0, m.index).split('\n').length}: </${tag}> closes <${top ?? 'NOTHING'}>`);
      }
    } else {
      stack.push(tag);
    }
  }
  if (stack.length) errors.push(`unclosed: ${stack.join(' > ')}`);
  return errors;
}

const NAV_START = '<!-- ================= SITE NAVBAR ================= -->';
const NAV_END = '<!-- MAIN CONTENT';

/* The navbar + mobile drawer, i.e. the block that is copied across every page. */
function navBlock(html) {
  const start = html.indexOf(NAV_START);
  const end = html.indexOf(NAV_END);
  if (start === -1 || end === -1 || end < start) return null;
  return html.slice(start, end);
}

function dupCheck(html, isChromeLess) {
  const issues = [];
  if (isChromeLess) return issues; // auth + dashboard pages intentionally have no nav
  const once = [
    ['id="mobile-menu-drawer"', 'mobile drawer'],
    ['id="mobile-menu-overlay"', 'mobile overlay'],
    ['id="mobile-menu-toggle"', 'mobile toggle'],
    ['<!-- ================= SITE NAVBAR ================= -->', 'site navbar'],
    ['<footer', 'footer'],
  ];
  for (const [needle, name] of once) {
    const n = html.split(needle).length - 1;
    if (n !== 1) issues.push(`${name} appears ${n}x (expected 1)`);
  }

  const nav = navBlock(html);
  if (!nav) {
    issues.push('navbar/drawer block not found');
    return issues;
  }

  // Only the sticky chrome nav is counted: pages may legitimately hold extra
  // in-content <nav> landmarks (e.g. index.html's quick-links nav).
  const chromeNav = nav.split('<nav class="sticky top-0').length - 1;
  if (chromeNav !== 1) issues.push(`sticky site nav appears ${chromeNav}x (expected 1)`);

  // The canonical drawer defines 2 submenus: Home and Dashboard.
  // Contact is a plain link to the single contact page, so it has no submenu.
  const dd = nav.split('mobile-dropdown-btn').length - 1;
  if (dd !== 2) issues.push(`mobile-dropdown-btn appears ${dd}x (expected 2 => stray drawer markup)`);

  // A destination reachable from both the desktop nav and the drawer
  const max = (needle, name) => {
    const n = nav.split(needle).length - 1;
    if (n > 2) issues.push(`${name} appears ${n}x (expected <=2: desktop + drawer)`);
  };
  max('>Enroll Child</a>', '"Enroll Child"');
  max('>Login</a>', '"Login"');
  max('>Sign Up</a>', '"Sign Up"');

  // Contact must be a direct link to the one contact page from both the desktop
  // nav and the drawer, and the old "Contact Us" dropdown entry must be gone.
  const contactLinks = (nav.match(/<a[^>]*href="contact\.html"/g) || []).length;
  if (contactLinks !== 2) issues.push(`contact.html links in nav appear ${contactLinks}x (expected 2: desktop + drawer)`);
  if (nav.includes('Contact Us')) issues.push('"Contact Us" still present in the navbar/drawer');
  if (nav.includes('contact-dropdown-menu')) issues.push('contact-dropdown-menu still present');

  // Dark Mode must be reachable on mobile, but only from inside the drawer:
  // the hamburger control block must not carry a theme toggle of its own.
  const themeBtns = (nav.match(/theme-toggle-btn/g) || []).length;
  if (themeBtns !== 2) issues.push(`theme-toggle-btn appears ${themeBtns}x (expected 2: desktop + drawer)`);
  const mobileCtl = nav.match(/<div class="[^"]*\blg:hidden\b[^"]*">[\s\S]*?<\/div>/);
  if (!mobileCtl) issues.push('mobile hamburger control block not found');
  else if (/theme-toggle-btn/.test(mobileCtl[0])) issues.push('the mobile hamburger block still carries a standalone theme toggle');

  // The account (Login / Sign Up) dropdown must expose exactly those two
  // destinations and be reachable from a real toggle button on desktop.
  const acctMenu = nav.match(/<div id="account-dropdown-menu"[\s\S]*?<\/div>/);
  if (!acctMenu) issues.push('account-dropdown-menu missing');
  else {
    const hrefs = (acctMenu[0].match(/<a\s+href="([^"]+)"/g) || []).map((m) => m.match(/href="([^"]+)"/)[1]);
    const want = ['login.html', 'signup.html'];
    if (hrefs.length !== want.length || hrefs.some((h, i) => h !== want[i])) {
      issues.push(`account dropdown links are [${hrefs}] (expected [${want}])`);
    }
  }
  const acctToggle = nav.match(/<button[^>]*aria-controls="account-dropdown-menu"/);
  if (!acctToggle) issues.push('account dropdown has no button toggle (aria-controls)');
  // The separate Login button must be gone from the desktop chrome.
  if (/>Login<\/a>\s*<\/div>\s*<\/div>/.test(nav)) issues.push('standalone Login button still present in navbar');

  /* Dashboard must not be duplicated *within* a context: the desktop bar and the
     mobile drawer each get exactly one trigger (same as the Contact link). */
  const triggerRe = /data-nav-match="parent-dashboard\.html,admin-dashboard\.html"/g;
  const desktopBar = nav.split('<div id="mobile-menu-drawer"')[0] || '';
  const triggers = (nav.match(triggerRe) || []).length;
  const barTriggers = (desktopBar.match(triggerRe) || []).length;
  if (triggers !== 2) issues.push(`navbar Dashboard trigger appears ${triggers}x (expected 2: desktop + drawer)`);
  if (barTriggers !== 1) issues.push(`desktop navbar has ${barTriggers} Dashboard triggers (expected 1)`);

  /* The Home trigger must be JS-driven (data-nav-match) in both the desktop bar
     and the drawer, so the active state can never be hard-coded onto two links
     at once. Rendered colour is verified by _build/design-check.js. */
  const homeRe = /data-nav-match="index\.html,home2\.html"/g;
  const homeTriggers = (nav.match(homeRe) || []).length;
  if (homeTriggers !== 2) issues.push(`navbar Home trigger appears ${homeTriggers}x (expected 2: desktop + drawer)`);
  if (!nav.includes('drawer-nav-link')) issues.push('drawer nav links have no .drawer-nav-link hook for the active state');

  return issues;
}

const files = fs
  .readdirSync(ROOT)
  .filter((f) => /\.html$/i.test(f))
  .sort();

const NO_CHROME = new Set([
  'login.html', 'signup.html', 'parent-dashboard.html',
  'admin-dashboard.html', 'home-1.html', 'home-2.html',
]);

let bad = 0;
for (const f of files) {
  const html = fs.readFileSync(path.join(ROOT, f), 'utf8');
  const bal = tagBalance(html, f);
  const dup = dupCheck(html, NO_CHROME.has(f));
  const mainMatch = html.match(/<main\b[\s\S]*?<\/main>/);
  const sections = mainMatch ? (mainMatch[0].match(/<section/g) || []).length : 0;

  const problems = [...bal.map((e) => `tag: ${e}`), ...dup.map((e) => `dup: ${e}`)];
  if (problems.length) {
    bad++;
    console.log(`\n${f}  (sections in main: ${sections})`);
    problems.slice(0, 8).forEach((p) => console.log(`   ${p}`));
    if (problems.length > 8) console.log(`   ...+${problems.length - 8} more`);
  } else {
    console.log(`${f.padEnd(22)} OK   sections in main: ${sections}`);
  }
}
console.log(`\n${bad} file(s) with structural problems`);
