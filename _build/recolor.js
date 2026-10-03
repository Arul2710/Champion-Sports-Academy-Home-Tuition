const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

// family -> family, shade preserved so contrast relationships survive
const FAMILY = {
  emerald: 'blue',
  green: 'blue',
  lime: 'sky',
  teal: 'sky',
  cyan: 'sky',
  amber: 'sky',
  orange: 'sky',
  yellow: 'sky',
  indigo: 'blue',
  violet: 'blue',
  purple: 'blue',
  fuchsia: 'sky',
  rose: 'sky',
  pink: 'sky',
  red: 'rose',
  slate: 'slate',
};

const HEX = {
  '#16a34a': '#2563eb',
  '#15803d': '#1d4ed8',
  '#14532d': '#1e3a8a',
  '#166534': '#1e3a8a',
  '#22c55e': '#2563eb',
  '#4ade80': '#38bdf8',
  '#86efac': '#93c5fd',
  '#dcfce7': '#eff6ff',
  '#f97316': '#38bdf8',
  '#fb923c': '#38bdf8',
  '#fdba74': '#7dd3fc',
  '#ffedd5': '#eff6ff',
  '#7c3aed': '#1d4ed8',
  '#a78bfa': '#60a5fa',
  '#c4b5fd': '#bfdbfe',
  '#ede9fe': '#eff6ff',
  '#0d9488': '#0284c7',
  '#14b8a6': '#38bdf8',
  '#5eead4': '#7dd3fc',
  '#99f6e4': '#bae6fd',
};

const files = [];
for (const dir of ['.', 'js', 'css']) {
  const full = path.join(ROOT, dir);
  if (!fs.existsSync(full)) continue;
  for (const f of fs.readdirSync(full)) {
    if (/\.(html|js|css)$/i.test(f)) files.push(path.join(full, f));
  }
}

const familyRe = new RegExp(
  `\\b(${Object.keys(FAMILY).join('|')})-(\\d{2,3})\\b`,
  'gi'
);

let totalChanges = 0;
for (const file of files) {
  const rel = path.relative(ROOT, file);
  let text = fs.readFileSync(file, 'utf8');
  let n = 0;

  text = text.replace(familyRe, (m, fam, shade) => {
    const to = FAMILY[fam.toLowerCase()];
    n++;
    return to === fam.toLowerCase() ? m : `${to}-${shade}`;
  });

  text = text.replace(/#(?:16a34a|15803d|14532d|166534|22c55e|4ade80|86efac|dcfce7|f97316|fb923c|fdba74|ffedd5|7c3aed|a78bfa|c4b5fd|ede9fe|0d9488|14b8a6|5eead4|99f6e4)\b/gi, (m) => {
    n++;
    return HEX[m.toLowerCase()];
  });

  if (n) {
    fs.writeFileSync(file, text);
    totalChanges += n;
    console.log(`${rel.padEnd(28)} ${n}`);
  }
}
console.log(`\n${totalChanges} total replacements across ${files.length} files`);
