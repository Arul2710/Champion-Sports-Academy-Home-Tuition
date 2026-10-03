/* Headless smoke test: loads each page in Chrome via CDP, records console errors
   and page exceptions, then asserts the navbar/map contract.

   Run: node _build/smoke.js          */
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

const ROOT = path.resolve(__dirname, '..');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9333;
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'csa-smoke-'));

const chrome = spawn(CHROME, [
  '--headless=new',
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${profile}`,
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-gpu',
  '--window-size=1440,900',
  'about:blank',
], { stdio: 'ignore' });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function targets() {
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${PORT}/json/list`);
      const list = await r.json();
      const page = list.find((t) => t.type === 'page');
      if (page?.webSocketDebuggerUrl) return page.webSocketDebuggerUrl;
    } catch { /* not up yet */ }
    await sleep(250);
  }
  throw new Error('Chrome did not expose a debugging target');
}

function cdp(ws) {
  let id = 0;
  const pending = new Map();
  const events = [];
  ws.addEventListener('message', (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result);
    } else if (msg.method) {
      events.push(msg);
    }
  });
  return {
    events,
    send(method, params = {}) {
      const mid = ++id;
      return new Promise((resolve, reject) => {
        pending.set(mid, { resolve, reject });
        ws.send(JSON.stringify({ id: mid, method, params }));
      });
    },
  };
}

const PAGES = [
  'index.html', 'contact.html', 'about.html', 'sports.html', 'batches.html',
  'blog.html', 'blog-details.html', 'coaches.html', 'coach-details.html',
  'locations.html', 'home2.html', '404.html', 'privacy-policy.html', 'terms.html',
  'login.html', 'signup.html', 'parent-dashboard.html', 'admin-dashboard.html',
];

// Ignore noise from third-party CDNs that cannot be reached from this sandbox.
const IGNORE = /cdn\.tailwindcss\.com|fonts\.googleapis|fonts\.gstatic|cdnjs\.cloudflare|favicon|ERR_(NAME_NOT_RESOLVED|INTERNET_DISCONNECTED|CONNECTION|ADDRESS)/i;

(async () => {
  const wsUrl = await targets();
  const ws = new WebSocket(wsUrl);
  await new Promise((r) => ws.addEventListener('open', r, { once: true }));
  const c = cdp(ws);

  await c.send('Runtime.enable');
  await c.send('Log.enable');
  await c.send('Page.enable');

  let failures = 0;

  for (const page of PAGES) {
    c.events.length = 0;
    const url = 'file:///' + path.join(ROOT, page).replace(/\\/g, '/');
    await c.send('Page.navigate', { url });
    await sleep(2200);

    const errs = c.events
      .filter((e) => e.method === 'Log.entryAdded' || e.method === 'Runtime.exceptionThrown')
      .map((e) =>
        e.method === 'Runtime.exceptionThrown'
          ? e.params.exceptionDetails.exception?.description || e.params.exceptionDetails.text
          : `${e.params.entry.source}: ${e.params.entry.text}`
      )
      .filter((t) => !IGNORE.test(t));

    if (errs.length) {
      failures++;
      console.log(`${page.padEnd(22)} ${errs.length} console error(s)`);
      [...new Set(errs)].slice(0, 4).forEach((e) => console.log('   ! ' + e.split('\n')[0]));
    } else {
      console.log(`${page.padEnd(22)} clean`);
    }
  }

  /* ---- contract assertions on the navbar + map ---- */
  console.log('\nContract checks:');
  const assert = async (page, expr, label) => {
    c.events.length = 0;
    await c.send('Page.navigate', { url: 'file:///' + path.join(ROOT, page).replace(/\\/g, '/') });
    await sleep(1800);
    const r = await c.send('Runtime.evaluate', { expression: expr, returnByValue: true });
    const ok = r.result.value;
    if (!ok) failures++;
    console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label}`);
    return ok;
  };

  await assert('index.html', `
    (() => {
      const nav = document.querySelector('nav.sticky');
      const drawer = document.getElementById('mobile-menu-drawer');
      const contactMenu = document.getElementById('contact-dropdown-menu');
      const acctMenu = document.getElementById('account-dropdown-menu');
      const acctBtn = document.querySelector('nav.sticky [aria-controls="account-dropdown-menu"]');
      if (!nav || !drawer || !contactMenu || !acctMenu || !acctBtn) return false;
      const acctHrefs = [...acctMenu.querySelectorAll('a')].map(a => a.getAttribute('href'));
      return contactMenu.querySelectorAll('a').length === 1
        && contactMenu.querySelector('a').textContent.trim() === 'Contact Us'
        && contactMenu.querySelector('a').getAttribute('href') === 'contact.html'
        && [...nav.querySelectorAll('[data-nav-match]')].filter(n => n.getAttribute('data-nav-match').includes('dashboard')).length === 1
        /* account icon is a button, not a link, and is the last control in the bar */
        && acctBtn.tagName === 'BUTTON'
        && acctBtn.querySelector('i') !== null
        && acctBtn.classList.contains('navbar-icon-btn')
        && acctBtn.getAttribute('aria-label') === 'Account'
        && acctBtn.classList.contains('dropdown-parent') === false
        && [...nav.querySelectorAll('a')].filter(a => a.getAttribute('href') === 'login.html').length === 1
        && [...nav.querySelectorAll('a')].filter(a => a.getAttribute('href') === 'signup.html').length === 1
        && acctHrefs.join(',') === 'login.html,signup.html'
        && acctMenu.querySelectorAll('a')[0].textContent.trim() === 'Login'
        && acctMenu.querySelectorAll('a')[1].textContent.trim() === 'Sign Up'
        && [...drawer.querySelectorAll('.mobile-dropdown-btn')].length === 3
        && [...drawer.querySelectorAll('a')].filter(a => a.getAttribute('href') === 'login.html').length === 1
        && [...drawer.querySelectorAll('a')].filter(a => a.getAttribute('href') === 'signup.html').length === 1;
    })()
  `, 'index.html: Contact = 1 "Contact Us" item; account icon -> Login/Sign Up dropdown; drawer keeps both');

  /* the account dropdown must actually open and toggle closed */
  await assert('index.html', `
    (() => {
      const btn = document.querySelector('nav.sticky [aria-controls="account-dropdown-menu"]');
      const menu = document.getElementById('account-dropdown-menu');
      btn.click();
      const opened = menu.classList.contains('is-open') && btn.getAttribute('aria-expanded') === 'true';
      btn.click();
      const closed = !menu.classList.contains('is-open') && btn.getAttribute('aria-expanded') === 'false';
      return opened && closed;
    })()
  `, 'index.html: account dropdown opens and closes on click');

  await assert('index.html', `
    (() => {
      const btn = document.getElementById('contact-dropdown-menu').previousElementSibling;
      const menu = document.getElementById('contact-dropdown-menu');
      btn.click();
      return menu.classList.contains('is-open') && btn.getAttribute('aria-expanded') === 'true';
    })()
  `, 'index.html: desktop dropdown opens on click');

  await assert('index.html', `
    (() => {
      const btns = [...document.querySelectorAll('#mobile-menu-drawer .mobile-dropdown-btn')];
      const contact = btns.find(b => b.textContent.includes('Contact'));
      const sub = contact.nextElementSibling;
      contact.click();
      const opened = !sub.classList.contains('hidden') && contact.getAttribute('aria-expanded') === 'true';
      contact.click();
      return opened && sub.classList.contains('hidden');
    })()
  `, 'index.html: mobile drawer dropdown toggles');

  await assert('contact.html', `
    (() => {
      const f = document.querySelector('iframe[src*="google.com/maps"]');
      return !!f && f.getAttribute('title') && f.className.includes('w-full') && f.className.includes('h-72')
        && !!document.querySelector('a[href*="google.com/maps/dir"]');
    })()
  `, 'contact.html: keyless Google Map embed present + responsive + titled');

  /* responsive: the map section must be 2 columns on desktop, 1 column on mobile */
  const gridExpr = `
    (() => {
      const g = document.querySelector('#find-us-section .grid');
      if (!g) return false;
      return getComputedStyle(g).gridTemplateColumns.trim().split(/\\s+/).length;
    })()
  `;

  const colsAt = async (page, width, height) => {
    c.events.length = 0;
    await c.send('Emulation.setDeviceMetricsOverride', {
      width, height, deviceScaleFactor: 1, mobile: width < 768,
    });
    await c.send('Page.navigate', { url: 'file:///' + path.join(ROOT, page).replace(/\\/g, '/') });
    await sleep(1600);
    const r = await c.send('Runtime.evaluate', { expression: gridExpr, returnByValue: true });
    return r.result.value;
  };

  const desktopCols = await colsAt('contact.html', 1440, 900);
  const tabletCols = await colsAt('contact.html', 900, 1000);
  const mobileCols = await colsAt('contact.html', 390, 844);
  await c.send('Emulation.clearDeviceMetricsOverride');

  const layoutOk = desktopCols === 2 && tabletCols === 1 && mobileCols === 1;
  if (!layoutOk) failures++;
  console.log(`  ${layoutOk ? 'PASS' : 'FAIL'}  contact.html: map section columns desktop=${desktopCols} tablet=${tabletCols} mobile=${mobileCols}`);

  /* no horizontal overflow at mobile width */
  c.events.length = 0;
  await c.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await c.send('Page.navigate', { url: 'file:///' + path.join(ROOT, 'contact.html').replace(/\\/g, '/') });
  await sleep(1600);
  const overflow = await c.send('Runtime.evaluate', {
    expression: '(() => { window.scrollTo(99999, 0); return window.scrollX; })()',
    returnByValue: true,
  });
  await c.send('Emulation.clearDeviceMetricsOverride');
  const noOverflow = overflow.result.value === 0;
  if (!noOverflow) failures++;
  console.log(`  ${noOverflow ? 'PASS' : 'FAIL'}  contact.html: no horizontal scroll at 390px`);

  /* navbar must fit and stay on one line from the lg breakpoint up */
  for (const w of [1024, 1280, 1440]) {
    c.events.length = 0;
    await c.send('Emulation.setDeviceMetricsOverride', { width: w, height: 900, deviceScaleFactor: 1, mobile: false });
    await c.send('Page.navigate', { url: 'file:///' + path.join(ROOT, 'index.html').replace(/\\/g, '/') });
    await sleep(1400);
    const r = await c.send('Runtime.evaluate', {
      expression: `(() => {
        const bar = document.querySelector('nav.sticky > div > div');
        const box = bar.getBoundingClientRect();
        const mid = box.top + box.height / 2;
        // every flex child must share the bar's vertical centre => single line
        const singleLine = [...bar.children]
          .filter((k) => k.getBoundingClientRect().width > 0)
          .every((k) => Math.abs(k.getBoundingClientRect().top + k.getBoundingClientRect().height / 2 - mid) < 2);
        return { overflow: bar.scrollWidth - bar.clientWidth, singleLine };
      })()`,
      returnByValue: true,
    });
    const { overflow: of, singleLine } = r.result.value;
    const ok = of <= 0 && singleLine;
    if (!ok) failures++;
    console.log(`  ${ok ? 'PASS' : 'FAIL'}  index.html navbar @${w}px: overflow=${of}px singleLine=${singleLine}`);
  }
  await c.send('Emulation.clearDeviceMetricsOverride');

  /* login form submit must be wired (was silently dead: a null demo-button lookup
     used to abort the rest of the auth initialiser) */
  c.events.length = 0;
  await c.send('Page.navigate', { url: 'file:///' + path.join(ROOT, 'login.html').replace(/\\/g, '/') });
  await sleep(1600);
  const loginWired = await c.send('Runtime.evaluate', {
    expression: `(() => {
      const f = document.getElementById('login-form');
      if (!f) return false;
      f.requestSubmit();
      return true;
    })()`,
    returnByValue: true,
  });
  await sleep(600);
  const loginErrs = c.events.filter(
    (e) => e.method === 'Runtime.exceptionThrown' && !IGNORE.test(e.params.exceptionDetails.exception?.description || ''),
  );
  const loginOk = loginWired.result.value && loginErrs.length === 0;
  if (!loginOk) failures++;
  console.log(`  ${loginOk ? 'PASS' : 'FAIL'}  login.html: form submit handler wired (no exception)`);

  /* forgot-password modal opens (same initialiser) */
  const forgotOk = await c.send('Runtime.evaluate', {
    expression: `(() => {
      const l = document.getElementById('forgot-password-link');
      if (!l) return false;
      l.click();
      const m = document.getElementById('forgot-password-modal');
      return m && !m.classList.contains('hidden');
    })()`,
    returnByValue: true,
  });
  if (!forgotOk.result.value) failures++;
  console.log(`  ${forgotOk.result.value ? 'PASS' : 'FAIL'}  login.html: forgot-password modal opens`);

  /* Active-nav state on every chrome page: exactly the dropdown triggers whose
     data-nav-match contains the current page may be highlighted. */
  const CHROME_PAGES = ['index.html', 'about.html', 'sports.html', 'batches.html',
    'blog.html', 'blog-details.html', 'coaches.html', 'coach-details.html',
    'contact.html', 'locations.html', 'home2.html'];
  for (const page of CHROME_PAGES) {
    c.events.length = 0;
    await c.send('Page.navigate', { url: 'file:///' + path.join(ROOT, page).replace(/\\/g, '/') });
    await sleep(1300);
    const r = await c.send('Runtime.evaluate', {
      expression: `(() => {
        const cur = location.pathname.split('/').pop();
        const triggers = [...document.querySelectorAll('nav.sticky [data-nav-match]')];
        const matches = (t) => t.getAttribute('data-nav-match').split(',').map(s => s.trim()).includes(cur);
        const wrong = triggers.filter(t =>
          (matches(t) !== t.classList.contains('text-blue-600')) ||
          (matches(t) !== t.classList.contains('font-bold')));
        const links = [...document.querySelectorAll('nav.sticky a.nav-link[href]')];
        const wrongLinks = links.filter(a =>
          (a.getAttribute('href') === cur) !== a.classList.contains('text-blue-600'));
        return { triggers: triggers.length, wrong: wrong.length + wrongLinks.length };
      })()`,
      returnByValue: true,
    });
    const { triggers, wrong } = r.result.value;
    const ok = wrong === 0 && triggers === 2;
    if (!ok) failures++;
    console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${page}: active nav state exact (${triggers} triggers, ${wrong} wrong)`);
  }

  /* every data-nav-match route must be a real file */
  c.events.length = 0;
  await c.send('Page.navigate', { url: 'file:///' + path.join(ROOT, 'index.html').replace(/\\/g, '/') });
  await sleep(1500);
  const routes = await c.send('Runtime.evaluate', {
    expression: `[...new Set([...document.querySelectorAll('[data-nav-match]')]
      .flatMap(el => el.getAttribute('data-nav-match').split(',').map(s => s.trim())))]`,
    returnByValue: true,
  });
  for (const route of routes.result.value) {
    const exists = fs.existsSync(path.join(ROOT, route));
    if (!exists) failures++;
    console.log(`  ${exists ? 'PASS' : 'FAIL'}  data-nav-match route exists: ${route}`);
  }

  /* Horizontal-scroll sweep: measure what a user can actually scroll, not
     scrollWidth. An `overflow-x-auto` table is intentionally wider than its
     container, so scrollWidth alone reports a false positive. */
  for (const width of [360, 390, 768]) {
    await c.send('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width < 768 });
    const bad = [];
    for (const page of PAGES) {
      await c.send('Page.navigate', { url: 'file:///' + path.join(ROOT, page).replace(/\\/g, '/') });
      await sleep(700);
      const r = await c.send('Runtime.evaluate', {
        expression: '(() => { window.scrollTo(99999, 0); return window.scrollX; })()',
        returnByValue: true,
      });
      if (r.result.value > 0) bad.push(`${page}(${r.result.value}px)`);
    }
    if (bad.length) failures++;
    console.log(`  ${bad.length ? 'FAIL' : 'PASS'}  no page can scroll horizontally @${width}px${bad.length ? ': ' + bad.join(' ') : ''}`);
  }
  await c.send('Emulation.clearDeviceMetricsOverride');

  /* the sticky navbar must still stick (html overflow-x: clip must not break it) */
  await c.send('Emulation.setDeviceMetricsOverride', { width: 390, height: 800, deviceScaleFactor: 1, mobile: true });
  await c.send('Page.navigate', { url: 'file:///' + path.join(ROOT, 'index.html').replace(/\\/g, '/') });
  await sleep(1500);
  const sticky = await c.send('Runtime.evaluate', {
    expression: `(() => {
      window.scrollTo(0, 1200);
      const nav = document.querySelector('nav.sticky');
      return Math.abs(nav.getBoundingClientRect().top) < 2;
    })()`,
    returnByValue: true,
  });
  await c.send('Emulation.clearDeviceMetricsOverride');
  if (!sticky.result.value) failures++;
  console.log(`  ${sticky.result.value ? 'PASS' : 'FAIL'}  sticky navbar still sticks after scroll`);

  /* dark mode + RTL must still toggle without throwing */
  for (const page of ['index.html', 'contact.html']) {
    c.events.length = 0;
    await c.send('Page.navigate', { url: 'file:///' + path.join(ROOT, page).replace(/\\/g, '/') });
    await sleep(1500);
    const r = await c.send('Runtime.evaluate', {
      expression: `(() => {
        document.querySelector('nav.sticky .theme-toggle-btn').click();
        const dark = document.documentElement.classList.contains('dark');
        document.querySelector('nav.sticky .rtl-toggle-btn').click();
        const rtl = document.documentElement.dir;
        document.querySelector('nav.sticky .theme-toggle-btn').click();
        document.querySelector('nav.sticky .rtl-toggle-btn').click();
        return dark && rtl === 'rtl' && !document.documentElement.classList.contains('dark');
      })()`,
      returnByValue: true,
    });
    const threw = c.events.some((e) => e.method === 'Runtime.exceptionThrown');
    const ok = r.result.value === true && !threw;
    if (!ok) failures++;
    console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${page}: dark mode + RTL toggles work`);
  }

  console.log(failures ? `\n${failures} check(s) failed` : '\nAll checks passed');

  ws.close();
  chrome.kill();
  process.exit(failures ? 1 : 0);
})().catch((e) => {
  console.error(e);
  chrome.kill();
  process.exit(1);
});