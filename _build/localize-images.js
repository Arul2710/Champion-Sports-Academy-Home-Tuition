/* Download every external image into ./images and rewrite all references to the
   local copy. Non-images (Tailwind CDN, Google Fonts, FontAwesome, the Google Maps
   iframe) are deliberately left alone, and any URL that does not return real image
   bytes keeps its original URL so nothing breaks.

   Run: node _build/localize-images.js [--dry] */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const IMG_DIR = path.join(ROOT, 'images');
const DRY = process.argv.includes('--dry');

/* Hosts / paths that are not images and must stay external. */
const SKIP = [
  'cdn.tailwindcss.com',
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'cdnjs.cloudflare.com',
  'ajax.googleapis.com',
];
const isSkipped = (u) => {
  try {
    const url = new URL(u);
    if (SKIP.includes(url.hostname)) return true;
    // the contact-page map is an <iframe src>, not a picture
    if (url.hostname.endsWith('google.com') && url.pathname.includes('/maps')) return true;
    if (/\.(css|js|woff2?|ttf|eot|svg)$/i.test(url.pathname) && url.hostname.includes('font')) return true;
    return false;
  } catch { return true; }
};

/* ---- collect target files: root html, css/*, js/* ---- */
const files = [
  ...fs.readdirSync(ROOT).filter((f) => /\.html$/i.test(f)).map((f) => path.join(ROOT, f)),
  ...fs.readdirSync(path.join(ROOT, 'css')).filter((f) => /\.css$/i.test(f)).map((f) => path.join(ROOT, 'css', f)),
  ...fs.readdirSync(path.join(ROOT, 'js')).filter((f) => /\.js$/i.test(f)).map((f) => path.join(ROOT, 'js', f)),
];

/* ---- reference patterns ---- */
/* 1. src="..."   (img tags)  2. url('...') / url("...")  (inline style + stylesheet) */
const PATTERNS = [
  /(\bsrc\s*=\s*")(https?:\/\/[^"]+)(")/gi,
  /(url\(\s*['"]?)(https?:\/\/[^'")\s]+)(['"]?\s*\))/gi,
];

/* ---- sniff real image bytes so we never save an HTML error page as .jpg ---- */
function sniff(buf) {
  if (!buf || buf.length < 12) return null;
  const s = (a, b) => buf.slice(a, b).toString('latin1');
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpg';
  if (s(0, 4) === '\x89PNG') return 'png';
  if (s(0, 3) === 'GIF') return 'gif';
  if (s(0, 4) === 'RIFF' && s(8, 12) === 'WEBP') return 'webp';
  if (s(4, 8) === 'ftyp') {
    const b = s(8, 12);
    if (b.startsWith('avif') || b.startsWith('avis')) return 'avif';
  }
  const head = s(0, 300).replace(/^[\s\uFEFF]+/, '');
  if (/^(<\?xml[\s\S]{0,200}?<svg|<svg[\s>])/i.test(head)) return 'svg';
  return null; // not an image (or an error page)
}

/* ---- build a unique, readable, organised filename ---- */
const used = new Set();
function localName(url, ext) {
  const u = new URL(url);
  let base = decodeURIComponent(u.pathname.split('/').filter(Boolean).pop() || 'image');
  base = base.replace(/\.[a-z0-9]{2,4}$/i, '');
  // strip the giant unsplash/wallpaper descriptive tails, keep the identifying head
  let slug = base.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  if (slug.length > 46) slug = slug.slice(0, 46).replace(/-+$/, '');
  const host = u.hostname.replace(/^www\./, '');
  const prefix = host === 'images.unsplash.com' ? 'unsplash'
    : host.split('.').length > 2 ? host.split('.')[0]          // e.g. thumbs.dreamstime.com
      : host.split('.').slice(0, -1).join('.') || host;       // e.g. static.vecteezy.com
  let parts = [prefix, slug];
  const w = u.searchParams.get('w');
  if (w) parts.push('w' + w);
  let name = parts.filter(Boolean).join('-') + '.' + ext;
  let i = 2;
  while (used.has(name)) name = parts.filter(Boolean).join('-') + '-' + i++ + '.' + ext;
  used.add(name);
  return name;
}

/* ---- download one image ---- */
async function grab(url) {
  const res = await fetch(url, {
    redirect: 'follow',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
      /* Prefer WebP over AVIF: `auto=format` used to degrade to JPEG on browsers
         without AVIF, so storing AVIF locally would break those browsers. WebP is
         supported everywhere since 2020, so nothing regresses. */
      Accept: 'image/webp,image/jpeg,image/png,image/*,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
    },
  });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const buf = Buffer.from(await res.arrayBuffer());
  const ext = sniff(buf);
  if (!ext) throw new Error('not image bytes (' + buf.length + 'B, looks like ' +
    buf.slice(0, 40).toString('latin1').replace(/\s+/g, ' ') + ')');
  return { buf, ext };
}

(async () => {
  /* 1. discover every external image reference */
  const found = new Map(); // url -> Set(file)
  for (const f of files) {
    const txt = fs.readFileSync(f, 'utf8');
    for (const re of PATTERNS) {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(txt))) {
        const url = m[2];
        if (isSkipped(url)) continue;
        if (!found.has(url)) found.set(url, new Set());
        found.get(url).add(path.relative(ROOT, f));
      }
    }
  }

  console.log('Found ' + found.size + ' unique external image URL(s)\n');
  if (!DRY && !fs.existsSync(IMG_DIR)) fs.mkdirSync(IMG_DIR);

  const map = new Map();  // url -> local relative path (only for successful downloads)
  const failed = [];

  const urls = [...found.keys()].sort();
  for (const url of urls) {
    try {
      const { buf, ext } = await grab(url);
      const name = localName(url, ext);
      if (!DRY) fs.writeFileSync(path.join(IMG_DIR, name), buf);
      map.set(url, 'images/' + name);
      const refs = [...found.get(url)];
      console.log(`  OK    ${name.padEnd(58)} ${String(Math.round(buf.length / 1024)).padStart(5)}KB  x${refs.length} ref(s)  ${refs.length > 1 ? '[' + refs.join(', ') + ']' : ''}`);
    } catch (e) {
      failed.push({ url, err: e.message });
      console.log(`  FAIL  ${url}\n          ${e.message}  -> keeping original URL`);
    }
  }

  if (DRY) {
    console.log(`\n(dry run) ${map.size} would be localised, ${failed.length} would be left external`);
    return;
  }

  /* 2. rewrite references, using a path relative to each referencing file */
  let totalRefs = 0;
  const perFile = {};
  for (const f of files) {
    const before = fs.readFileSync(f, 'utf8');
    const dir = path.dirname(f);
    let txt = before;
    for (const [url, local] of map) {
      // relative path from the referencing file to images/
      let rel = path.relative(dir, path.join(IMG_DIR, path.basename(local))).split(path.sep).join('/');
      if (!rel.startsWith('.')) rel = './' + rel;
      const before2 = txt;
      txt = txt.split(url).join(rel);
      const n = before2.length - txt.length;
      if (n) totalRefs += (before2.split(url).length - 1);
    }
    if (txt !== before) {
      fs.writeFileSync(f, txt);
      perFile[path.relative(ROOT, f)] = true;
    }
  }

  console.log('\nRewrote references in ' + Object.keys(perFile).length + ' file(s): ' + Object.keys(perFile).join(', '));
  console.log('Localised ' + map.size + ' image(s) into images/ (' +
    (map.size ? '' : '') + fs.readdirSync(IMG_DIR).length + ' file(s) on disk)');

  /* 3. manifest for traceability / re-runs.
        MERGE, never overwrite: the page generator reads this to resolve
        (photoId, width) -> local file, so an entry discovered in an earlier run
        must survive later runs or the generated pages revert to remote URLs.
        It is also re-seeded from the images/ directory, so the manifest can always
        be rebuilt from the files already on disk. */
  const MANIFEST = path.join(__dirname, 'images-manifest.json');
  let prev = { localised: {}, leftExternal: [] };
  try { prev = JSON.parse(fs.readFileSync(MANIFEST, 'utf8')); } catch { /* first run */ }

  /* re-seed: unsplash local names are deterministic (unsplash-<photoId>-w<width>.<ext>),
     so every downloaded file can be mapped back to the URL the generator builds. */
  const seeded = {};
  if (fs.existsSync(IMG_DIR)) {
    for (const name of fs.readdirSync(IMG_DIR)) {
      const m = name.match(/^unsplash-(photo-[0-9]+-[0-9a-z]+)-w(\d+)\.[a-z0-9]+$/i);
      if (m) seeded[`https://images.unsplash.com/${m[1]}?auto=format&fit=crop&w=${m[2]}&q=80`] = 'images/' + name;
    }
  }

  const localised = { ...seeded, ...prev.localised, ...Object.fromEntries([...map].sort()) };
  const stillExternal = [...prev.leftExternal.filter((f) => !localised[f.url]), ...failed]
    .filter((f, i, a) => a.findIndex((x) => x.url === f.url) === i);
  fs.writeFileSync(MANIFEST, JSON.stringify({
    generatedBy: '_build/localize-images.js',
    localised,
    leftExternal: stillExternal,
  }, null, 2));

  if (failed.length) {
    console.log('\n' + failed.length + ' URL(s) left external (could not be downloaded):');
    failed.forEach((f) => console.log('  - ' + f.url + '  (' + f.err + ')'));
  }
  console.log('\nDone. ' + totalRefs + ' reference(s) rewritten. '
    + 'Manifest resolves ' + Object.keys(localised).length + ' URL(s); '
    + stillExternal.length + ' intentionally left remote.');
})();
