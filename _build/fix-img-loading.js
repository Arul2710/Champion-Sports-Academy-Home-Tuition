const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

// Any <img> with no loading attribute sits above the fold => load eagerly and prioritise.
const FILES = ['about.html', 'locations.html', 'login.html', 'signup.html', 'parent-dashboard.html'];

for (const f of FILES) {
  const p = path.join(ROOT, f);
  let text = fs.readFileSync(p, 'utf8');
  let n = 0;
  text = text.replace(/<img\b[^>]*>/g, (tag) => {
    if (/\bloading=/.test(tag)) return tag;
    n++;
    return tag.replace(/\s*\/>$/, ' loading="eager" fetchpriority="high" />').replace(/>$/, ' loading="eager" fetchpriority="high">');
  });
  if (n) {
    fs.writeFileSync(p, text);
    console.log(`${f.padEnd(24)} ${n} image(s) marked eager`);
  } else {
    console.log(`${f.padEnd(24)} no change`);
  }
}
