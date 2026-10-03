/* Design-consistency probe: asserts the new navbar controls and map section match
   the existing design tokens, and that no new colours were introduced.
   Run: node _build/design-check.js  */
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

const ROOT = path.resolve(__dirname, '..');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9399;
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'csa-d-'));

const chrome = spawn(CHROME, [
  '--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`,
  '--no-first-run', '--disable-gpu', 'about:blank',
], { stdio: 'ignore' });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  let ws;
  for (let i = 0; i < 60; i++) {
    try {
      const l = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
      const p = l.find((t) => t.type === 'page');
      if (p?.webSocketDebuggerUrl) { ws = new WebSocket(p.webSocketDebuggerUrl); break; }
    } catch { /* retry */ }
    await sleep(250);
  }
  await new Promise((r) => ws.addEventListener('open', r, { once: true }));
  let id = 0; const pend = new Map();
  ws.addEventListener('message', (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pend.has(m.id)) { pend.get(m.id)(m.result); pend.delete(m.id); }
  });
  const send = (method, params = {}) => new Promise((res) => {
    const i = ++id; pend.set(i, res); ws.send(JSON.stringify({ id: i, method, params }));
  });
const evaluate = async (expr) =>
  (await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true })).result.value;

  await send('Runtime.enable');
  await send('Page.enable');
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await send('Page.navigate', { url: 'file:///' + path.join(ROOT, 'index.html').replace(/\\/g, '/') });
  await sleep(2600);

  let fail = 0;
  const check = (label, actual, expected) => {
    const ok = JSON.stringify(actual) === JSON.stringify(expected);
    if (!ok) fail++;
    console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label}${ok ? '' : ` (got ${JSON.stringify(actual)}, want ${JSON.stringify(expected)})`}`);
  };

  console.log('Navbar design tokens (1440px):');

  /* The account control must be visually identical to the RTL + theme icon buttons
     it sits beside: same box, radius, colours, and gutter. */
  const acct = await evaluate(`(() => {
    const btn = document.querySelector('nav.sticky [aria-controls="account-dropdown-menu"]');
    const theme = document.querySelector('nav.sticky .theme-toggle-btn');
    const s = getComputedStyle(btn), t = getComputedStyle(theme);
    const b = btn.getBoundingClientRect(), th = theme.getBoundingClientRect();
    const parent = btn.parentElement;
    const pr = parent.getBoundingClientRect();
    // the outermost container carries the responsive gutter (px-4 sm:px-6 lg:px-6 xl:px-8)
    const container = document.querySelector('nav.sticky > div').getBoundingClientRect();
    return {
      tag: btn.tagName,
      size: [Math.round(b.width), Math.round(b.height)],
      themeSize: [Math.round(th.width), Math.round(th.height)],
      radius: s.borderRadius, themeRadius: t.borderRadius,
      bg: s.backgroundColor, themeBg: t.backgroundColor,
      color: s.color, themeColor: t.color,
      hoverBg: s.hover ? s.hover.backgroundColor : null,
      onRight: Math.round(container.right - b.right),
      gapToTheme: Math.round(b.left - th.right),
      gapRtlToTheme: (() => {
        const rtl = document.querySelector('nav.sticky .rtl-toggle-btn');
        return rtl ? Math.round(th.left - rtl.getBoundingClientRect().right) : null;
      })(),
      centred: Math.abs((pr.top + pr.height / 2) - (b.top + b.height / 2)),
      glyph: getComputedStyle(btn.querySelector('i')).fontSize,
      iconCount: btn.querySelectorAll('i').length,
    };
  })()`);
  check('account control is a <button>, not a link', acct.tag, 'BUTTON');
  check('account icon box = navbar-icon-btn 40x40', acct.size, [40, 40]);
  check('account icon box matches the theme toggle exactly', acct.size, acct.themeSize);
  check('account icon radius = rounded-lg (8px)', acct.radius, '8px');
  check('account icon radius matches theme toggle', acct.radius, acct.themeRadius);
  check('account icon bg = slate-100 (same as theme toggle)', acct.bg, acct.themeBg);
  check('account icon colour = slate-600 (same as theme toggle)', acct.color, acct.themeColor);
  check('account icon renders a FontAwesome glyph', acct.iconCount, 1);
  check('account icon is vertically centred in the bar', acct.centred < 2, true);
  check('account icon right inset = container inset (32px)', acct.onRight, 32);
  check('account icon gap matches the existing icon-button gap', acct.gapToTheme, acct.gapRtlToTheme);

  /* the account dropdown itself must match the other dropdowns and open in-bounds */
  const acctMenu = await evaluate(`(() => {
    const btn = document.querySelector('nav.sticky [aria-controls="account-dropdown-menu"]');
    btn.click();
    const menu = document.getElementById('account-dropdown-menu');
    const m = menu.getBoundingClientRect(), b = btn.getBoundingClientRect();
    const items = [...menu.querySelectorAll('a')];
    const cs = getComputedStyle(menu), is = getComputedStyle(items[0]);
    const ref = getComputedStyle(document.querySelector('#home-dropdown-menu'));
    return {
      open: menu.classList.contains('is-open'),
      align: Math.round(m.right - b.right),
      flushRight: m.right <= document.querySelector('nav.sticky > div').getBoundingClientRect().right + 1,
      width: Math.round(m.width), refWidth: Math.round(document.getElementById('home-dropdown-menu').getBoundingClientRect().width),
      radius: cs.borderRadius, refRadius: ref.borderRadius,
      bg: cs.backgroundColor, refBg: ref.backgroundColor,
      below: m.top >= b.bottom - 1,
      itemTokens: [is.fontSize, is.fontWeight, is.paddingLeft, is.paddingTop, is.color],
      items: items.length,
    };
  })()`);
  check('account dropdown opens on click', acctMenu.open, true);
  check('account dropdown right-aligns to its icon', acctMenu.align, 0);
  check('account dropdown stays inside the container (no overflow)', acctMenu.flushRight, true);
  check('account dropdown width = other dropdowns (w-52)', acctMenu.width, acctMenu.refWidth);
  check('account dropdown radius matches existing dropdowns', acctMenu.radius, acctMenu.refRadius);
  check('account dropdown bg matches existing dropdowns', acctMenu.bg, acctMenu.refBg);
  check('account dropdown opens below the icon', acctMenu.below, true);
  check('account dropdown has exactly 2 items', acctMenu.items, 2);
  check('account item rows match existing dropdown rows (14px/500/16px/10px/slate-700)',
    acctMenu.itemTokens, ['14px', '500', '16px', '10px', 'rgb(51, 65, 85)']);

  /* nav link + dropdown item tokens, compared against the pre-existing Home items.
     Home item 1 is deliberately blue/bold (it is the active page), so item 2 is the
     correct reference for a neutral dropdown row. */
  const tokens = await evaluate(`(() => {
    const navLinks = [...document.querySelectorAll('nav.sticky a.nav-link')];
    const link = navLinks.find(a => a.textContent.trim() === 'About');
    const contact = navLinks.find(a => a.textContent.trim() === 'Contact');
    const homeItems = document.querySelectorAll('#home-dropdown-menu a');
    const homeNeutral = homeItems[1];
    const g = (el) => { const s = getComputedStyle(el); return [s.fontSize, s.fontWeight, s.paddingLeft, s.borderRadius, s.color]; };
    const dup = (el) => [el.id, document.querySelectorAll('#' + el.id).length];
    return { link: g(link), home: g(homeNeutral), about: g(link),
      dash: g(document.querySelector('#dashboard-dropdown-menu a')),
      contact: g(contact),
      contactTag: contact ? contact.tagName : null,
      contactHref: contact ? contact.getAttribute('href') : null,
      contactText: contact ? contact.textContent.trim() : null,
      contactUsCount: [...document.querySelectorAll('nav.sticky a, nav.sticky button')]
        .filter(e => e.textContent.trim() === 'Contact Us').length,
      contactDropdown: document.querySelectorAll('#contact-dropdown-menu').length,
      ids: [dup(document.querySelector('#dashboard-dropdown-menu'))],
      gapBetweenContactAndDashboard: Math.round(
        document.querySelector('#dashboard-dropdown-menu').parentElement.getBoundingClientRect().left
        - contact.getBoundingClientRect().right) };
  })()`);
  check('Contact is a direct <a> link, not a dropdown', tokens.contactTag, 'A');
  check('Contact points straight at contact.html', tokens.contactHref, 'contact.html');
  check('Contact label is exactly "Contact"', tokens.contactText, 'Contact');
  check('no "Contact Us" item left in the desktop nav', tokens.contactUsCount, 0);
  check('Contact dropdown removed', tokens.contactDropdown, 0);
  check('Contact nav link matches About nav link tokens', tokens.contact, tokens.link);
  check('new Dashboard items match the neutral Home item exactly', tokens.dash, tokens.home);
  check('dropdown ids are unique', tokens.ids, [['dashboard-dropdown-menu', 1]]);
  /* at xl the center nav uses space-x-2 (8px); every gap must be identical */
  check('Contact -> Dashboard gap equals the xl nav gap (8px)', tokens.gapBetweenContactAndDashboard, 8);

  /* the bar must actually stay pinned while the page scrolls */
  const sticky = await evaluate(`(() => {
    const nav = document.querySelector('nav.sticky');
    const before = Math.round(nav.getBoundingClientRect().top);
    window.scrollTo({ top: 2500, behavior: 'instant' });
    const after = Math.round(nav.getBoundingClientRect().top);
    const scrolled = Math.round(window.scrollY);
    window.scrollTo({ top: 0, behavior: 'instant' });
    return { before, after, scrolled, pos: getComputedStyle(nav).position };
  })()`);
  check('navbar uses position: sticky', sticky.pos, 'sticky');
  check('navbar sits flush at the top before scrolling', sticky.before, 0);
  check('page is actually scrollable', sticky.scrolled > 100, true);
  check('navbar stays pinned at the top after scrolling', sticky.after, 0);

  /* mobile drawer: Login + Sign Up must remain reachable and unbroken */
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await send('Page.navigate', { url: 'file:///' + path.join(ROOT, 'index.html').replace(/\\/g, '/') });
  await sleep(2200);
  const drawer = await evaluate(`(() => {
    const btn = document.getElementById('mobile-menu-toggle');
    if (btn) btn.click();
    const dr = document.getElementById('mobile-menu-drawer');
    const links = [...dr.querySelectorAll('a')];
    const l = links.find(a => a.textContent.trim() === 'Login');
    const su = links.find(a => a.textContent.trim() === 'Sign Up');
    const s = getComputedStyle(l), u = getComputedStyle(su);
    const dd = [...dr.querySelectorAll('.mobile-dropdown-btn')];
    const iconBtn = dr.querySelector('.navbar-icon-btn');
    const shown = (el) => el.getClientRects().length > 0;
    return {
      open: !dr.classList.contains('translate-x-full'),
      bg: s.backgroundColor, weight: s.fontWeight, radius: s.borderRadius,
      suBg: u.backgroundColor, suRadius: u.borderRadius, suBorder: u.borderTopWidth, suWeight: u.fontWeight,
      widthPct: Math.round((l.getBoundingClientRect().width / dr.getBoundingClientRect().width) * 100),
      sameRow: Math.abs(l.getBoundingClientRect().top - su.getBoundingClientRect().top) < 2,
      sameWidth: Math.abs(l.getBoundingClientRect().width - su.getBoundingClientRect().width) < 2,
      gap: Math.round(su.getBoundingClientRect().left - l.getBoundingClientRect().right),
      secondaryVsPrimary: u.backgroundColor !== s.backgroundColor,
      suMatchesLogin: u.borderRadius === s.borderRadius && u.fontWeight === s.fontWeight
        && u.paddingTop === s.paddingTop && u.textAlign === s.textAlign,
      subcounts: dd.map(b => b.nextElementSibling.querySelectorAll('a').length),
      dupLogin: links.filter(a => a.textContent.trim() === 'Login').length,
      dupSignup: links.filter(a => a.textContent.trim() === 'Sign Up').length,
      drawerContact: (() => {
        const c = links.find(a => a.textContent.trim() === 'Contact');
        return c ? [c.getAttribute('href'), c.tagName] : null;
      })(),
      drawerContactUs: links.filter(a => a.textContent.trim() === 'Contact Us').length,
      themeInDrawer: [...dr.querySelectorAll('.theme-toggle-btn')].filter(shown).length,
      themeOutsideDrawer: [...document.querySelectorAll('nav.sticky .theme-toggle-btn')].filter(shown).length,
      hamburgerShown: shown(document.getElementById('mobile-menu-toggle')),
      contactLinkShown: (() => {
        const c = [...document.querySelectorAll('nav.sticky a.nav-link')].find(a => a.textContent.trim() === 'Contact');
        return c ? shown(c) : false;
      })(),
    };
  })()`);
  check('mobile drawer opens', drawer.open, true);
  check('drawer Login uses primary blue', drawer.bg, 'rgb(37, 99, 235)');
  check('drawer Login bold', drawer.weight, '700');
  check('drawer Login radius = rounded-xl', drawer.radius, '12px');
  check('drawer Sign Up present (secondary)', drawer.suBg, 'rgb(255, 255, 255)');
  check('drawer Sign Up bold', drawer.suWeight, '700');
  check('drawer Sign Up has a border like the drawer icon buttons', drawer.suBorder, '1px');
  check('drawer Sign Up radius = rounded-xl', drawer.suRadius, '12px');
  check('drawer Sign Up is secondary (distinct from primary Login)', drawer.secondaryVsPrimary, true);
  check('drawer Sign Up matches drawer Login box style exactly', drawer.suMatchesLogin, true);
  check('drawer buttons are ~40% width each (~2 cols)', drawer.widthPct > 34 && drawer.widthPct < 46, true);
  check('drawer Login + Sign Up share a row', drawer.sameRow, true);
  check('drawer Login + Sign Up are equal width', drawer.sameWidth, true);
  check('drawer button gap = gap-3 (12px)', drawer.gap, 12);
  check('drawer submenu item counts = [2,2] (Home, Dashboard; Contact is a plain link)', drawer.subcounts, [2, 2]);
  check('drawer Contact points straight at contact.html', drawer.drawerContact, ['contact.html', 'A']);
  check('no "Contact Us" item left in the drawer', drawer.drawerContactUs, 0);
  check('exactly one Login in drawer', drawer.dupLogin, 1);
  check('exactly one Sign Up in drawer', drawer.dupSignup, 1);
  check('hamburger is the only mobile control', drawer.hamburgerShown, true);
  check('desktop Contact link is hidden on mobile', drawer.contactLinkShown, false);
  check('Dark Mode button lives inside the drawer', drawer.themeInDrawer, 1);
  check('no Dark Mode button outside the drawer on mobile', drawer.themeOutsideDrawer, 0);

  /* dark mode must still work from inside the drawer */
  const dark = await evaluate(`(() => {
    const dr = document.getElementById('mobile-menu-drawer');
    const btn = dr.querySelector('.theme-toggle-btn');
    const before = document.documentElement.classList.contains('dark');
    btn.click();
    const after = document.documentElement.classList.contains('dark');
    const stored = localStorage.getItem('csa_theme');
    btn.click();
    return { flipped: before !== after, after, stored, restored: document.documentElement.classList.contains('dark') === before };
  })()`);
  check('drawer Dark Mode toggles the theme', dark.flipped, true);
  check('drawer Dark Mode result matches the dark class', dark.after, true);
  check('drawer Dark Mode persists to localStorage', dark.stored, dark.after ? 'dark' : 'light');
  check('drawer Dark Mode toggles back', dark.restored, true);
  await evaluate(`document.getElementById('mobile-menu-close').click()`);
  await sleep(400);

  /* no horizontal scrolling / clipped navbar at any breakpoint */
  console.log('\nResponsive navbar (no horizontal scroll, nothing overlapping):');
  const url = 'file:///' + path.join(ROOT, 'index.html').replace(/\\/g, '/');
  for (const [w, h, label] of [[320, 700, 'small phone'], [390, 844, 'mobile'], [768, 1024, 'tablet'], [1024, 900, 'laptop'], [1280, 900, 'wide'], [1440, 1000, 'desktop']]) {
    await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: w < 768 });
    await send('Page.navigate', { url });
    await sleep(2000);
    const r = await evaluate(`(() => {
      const nav = document.querySelector('nav.sticky');
      const bar = nav.firstElementChild.firstElementChild;
      const n = nav.getBoundingClientRect(), b = bar.getBoundingClientRect();
      const kids = [...bar.firstElementChild.children].filter(e => e.getClientRects().length);
      const boxes = kids.map(e => e.getBoundingClientRect());
      let overlaps = 0;
      for (let i = 0; i < boxes.length; i++)
        for (let j = i + 1; j < boxes.length; j++)
          if (boxes[i].left < boxes[j].right - 1 && boxes[j].left < boxes[i].right - 1
              && boxes[i].top < boxes[j].bottom - 1 && boxes[j].top < boxes[i].bottom - 1) overlaps++;
      return {
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        navFits: b.left >= -1 && b.right <= document.documentElement.clientWidth + 1,
        kidsInside: kids.every(k => { const r = k.getBoundingClientRect(); return r.left >= n.left - 1 && r.right <= n.right + 1; }),
        logoVisible: !!document.querySelector('nav.sticky a[href="index.html"]').offsetParent,
        controls: kids.length,
        overlaps,
        clipped: [...document.querySelectorAll('nav.sticky a.nav-link, nav.sticky button')]
          .filter(e => e.getClientRects().length && e.scrollWidth > e.clientWidth + 1).length,
      };
    })()`);
    check(`${label} (${w}px): no horizontal overflow`, r.overflow <= 0, true);
    check(`${label} (${w}px): navbar content stays inside the bar`, r.navFits && r.kidsInside, true);
    check(`${label} (${w}px): no navbar group overlaps another`, r.overlaps, 0);
    check(`${label} (${w}px): no nav label is clipped`, r.clipped, 0);
    check(`${label} (${w}px): logo visible`, r.logoVisible, true);
  }

  /* Hero backgrounds: each target page must use its own image, it must load,
     and it must actually cover the hero box at every breakpoint. */
  console.log('\nHero backgrounds (distinct + fully covering):');
  const HERO_PAGES = ['batches.html', 'blog.html', 'contact.html'];
  const seenImages = {};
  for (const page of HERO_PAGES) {
    for (const [w, h, label] of [[1440, 900, 'desktop'], [768, 1024, 'tablet'], [390, 844, 'mobile']]) {
      await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: w < 768 });
      await send('Page.navigate', { url: 'file:///' + path.join(ROOT, page).replace(/\\/g, '/') });
      await sleep(2400);
      const r = await evaluate(`(async () => {
        const el = document.querySelector('.hero-bg');
        if (!el) return { missing: true };
        const cs = getComputedStyle(el);
        const url = (cs.backgroundImage.match(/url\\(["']?([^"')]+)["']?\\)/) || [])[1] || '';
        const sec = el.closest('section').getBoundingClientRect();
        const r = el.getBoundingClientRect();
        let loaded = 0;
        try { const im = new Image(); im.src = url; await im.decode(); loaded = im.naturalWidth; } catch (e) { loaded = 0; }
        return { url, size: cs.backgroundSize, repeat: cs.backgroundRepeat,
          coversW: r.width >= sec.width - 1, coversH: r.height >= sec.height - 1,
          fillsSection: Math.abs(r.width - sec.width) <= 1 && Math.abs(r.height - sec.height) <= 1,
          loaded, hasH1: !!document.querySelector('.hero-bg ~ div h1') };
      })()`);
      if (r.missing) { check(`${page}: hero background element exists`, false, true); continue; }
      seenImages[page] = r.url;
      check(`${page} (${label}): hero image loads`, r.loaded > 0, true);
      check(`${page} (${label}): background-size = cover`, r.size, 'cover');
      check(`${page} (${label}): background not tiled`, r.repeat, 'no-repeat');
      check(`${page} (${label}): background covers the whole hero`, r.fillsSection && r.coversW && r.coversH, true);
      if (label === 'desktop') check(`${page}: hero has an <h1> title`, r.hasH1, true);
    }
  }
  const uniq = new Set(Object.values(seenImages));
  check('all three heroes use different background images', uniq.size, HERO_PAGES.length);

  /* Active navbar link: exactly one item highlighted, on desktop AND in the
     drawer, with a clearly different colour from the normal links. */
  console.log('\nActive navbar link (desktop + mobile drawer):');
  const NAV_PAGES = [
    ['index.html', 'Home'], ['batches.html', 'Batch Timings'], ['blog.html', 'Blog'],
    ['contact.html', 'Contact'], ['about.html', 'About'], ['sports.html', 'Sports Offered'],
  ];
  const isBlue = (c) => c === 'rgb(37, 99, 235)' || c === 'rgb(56, 189, 248)' || c === 'rgb(2, 132, 199)';
  const actProbe = `(() => {
    const nav = document.querySelector('nav.sticky');
    if (!nav) return null;
    const desk = [...nav.querySelectorAll('a.nav-link, .dropdown-parent > button[data-dropdown-toggle]')]
      .filter(e => e.getClientRects().length)
      .map(e => { const s = getComputedStyle(e); return { t: e.textContent.trim().replace(/\\s+/g,' '), c: s.color }; });
    const drw = [...document.querySelectorAll('#mobile-menu-drawer .drawer-nav-link')]
      .map(e => { const s = getComputedStyle(e); return { t: e.textContent.trim().replace(/\\s+/g,' '), c: s.color }; });
    return { desk, drw };
  })()`;
  for (const dark of [false, true]) {
    for (const [page, expect] of NAV_PAGES) {
      await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
      await send('Page.navigate', { url: 'file:///' + path.join(ROOT, page).replace(/\\/g, '/') });
      await sleep(2400);
      await evaluate(`localStorage.setItem('csa_theme', '${dark ? 'dark' : 'light'}');
        document.documentElement.classList.toggle('dark', ${dark});`);
      const tag = dark ? 'dark' : 'light';
      const drawer = await evaluate(actProbe);
      const dAct = drawer.drw.filter(i => isBlue(i.c));
      const dNorm = drawer.drw.find(i => !isBlue(i.c));
      check(`${page} (${tag}): drawer highlights exactly one link`, dAct.length, 1);
      check(`${page} (${tag}): drawer active link is "${expect}"`, dAct[0] ? dAct[0].t.replace(/\s+/g, ' ') : '-', expect);
      check(`${page} (${tag}): drawer active colour differs from normal`, !!dNorm && dAct[0] && dAct[0].c !== dNorm.c, true);

      await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
      await sleep(400);
      const dt = await evaluate(actProbe);
      const kAct = dt.desk.filter(i => isBlue(i.c));
      const kNorm = dt.desk.find(i => !isBlue(i.c));
      check(`${page} (${tag}): desktop highlights exactly one link`, kAct.length, 1);
      check(`${page} (${tag}): desktop active link is "${expect}"`, kAct[0] ? kAct[0].t : '-', expect);
      check(`${page} (${tag}): desktop active colour differs from normal`, !!kNorm && kAct[0] && kAct[0].c !== kNorm.c, true);
    }
  }
  await send('Emulation.clearDeviceMetricsOverride');
  await send('Page.navigate', { url: 'file:///' + path.join(ROOT, 'index.html').replace(/\\/g, '/') });
  await sleep(600);
  await evaluate(`localStorage.removeItem('csa_theme'); document.documentElement.classList.remove('dark');`);

  /* map section design tokens */
  await send('Emulation.clearDeviceMetricsOverride');
  await send('Page.navigate', { url: 'file:///' + path.join(ROOT, 'contact.html').replace(/\\/g, '/') });
  await sleep(2600);
  const map = await evaluate(`(() => {
    const sec = document.getElementById('find-us-section');
    const card = sec.querySelector('.rounded-3xl');
    const wrap = document.querySelector('#find-us-section iframe').parentElement;
    const f = document.querySelector('#find-us-section iframe');
    const fs = getComputedStyle(f), ws = getComputedStyle(wrap), cs = getComputedStyle(card);
    const r = f.getBoundingClientRect();
    // does the iframe spill outside its rounded wrapper?
    const wrapR = wrap.getBoundingClientRect();
    return { iframeRadius: fs.borderRadius, wrapRadius: ws.borderRadius, wrapOverflow: ws.overflow,
      cardRadius: cs.borderRadius, cardBg: cs.backgroundColor, cardBorder: cs.borderColor,
      iframeFits: r.width <= wrapR.width + 1 && r.right <= wrapR.right + 1,
      iframeDisplay: fs.display, colGap: getComputedStyle(sec.querySelector('.grid')).columnGap,
      radiusMatchesCard: cs.borderRadius === ws.borderRadius };
  })()`);
  console.log('\nMap section design tokens:');
  check('iframe has no radius (wrapper clips it)', map.iframeRadius, '0px');
  check('map wrapper radius = rounded-3xl (24px)', map.wrapRadius, '24px');
  check('map wrapper clips overflow', map.wrapOverflow, 'hidden');
  check('address card radius = rounded-3xl', map.cardRadius, '24px');
  check('map wrapper + address card share one radius', map.radiusMatchesCard, true);
  check('address card bg = white / slate-900', map.cardBg, 'rgb(255, 255, 255)');
  check('iframe sits fully inside its wrapper', map.iframeFits, true);
  check('iframe display block (no inline gap)', map.iframeDisplay, 'block');
  check('2-column gap = gap-12 (48px)', map.colGap, '48px');

  console.log(fail ? `\n${fail} design check(s) failed` : '\nAll design checks passed');
  ws.close(); chrome.kill(); process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); chrome.kill(); process.exit(1); });