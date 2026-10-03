const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const TARGETS = [
  'admin-dashboard.html',
  'parent-dashboard.html',
  'signup.html',
  path.join('js', 'dashboard.js'),
];

// Ordered: most specific patterns first.
const RULES = [
  // success badges that lost their shade (green-100/green-800 -> blue-300)
  [
    /bg-blue-300 text-blue-300 dark:bg-blue-300\/40 dark:text-blue-300/g,
    'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  ],
  [/bg-blue-300 text-blue-300/g, 'bg-blue-100 text-blue-700'],
  // warning badges that lost their shade (amber-* -> sky-400)
  [
    /bg-sky-400 text-sky-400 dark:bg-sky-400\/40 dark:text-sky-400/g,
    'bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300',
  ],
  [/bg-sky-400\/20 text-sky-400/g, 'bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-300'],
  [/bg-sky-400 text-sky-400/g, 'bg-sky-100 text-sky-700'],
  // leftover un-recolored emerald in signup gradient
  [
    /from-emerald-800 via-emerald-600 to-sky-400/g,
    'from-blue-900 via-blue-600 to-sky-400',
  ],
  // safety nets for any stragglers
  [/\bemergal?d?-\d+/g, 'blue-600'],
  [/\bgreen-\d+/g, 'blue-600'],
  [/\bamber-\d+/g, 'sky-500'],
  [/\bteal-\d+/g, 'sky-500'],
  [/\borange-\d+/g, 'sky-500'],
  [/\blime-\d+/g, 'sky-500'],
  [/\bslate-\d+\/\d+/g, 'slate-900/60'],
];

for (const rel of TARGETS) {
  const file = path.join(ROOT, rel);
  if (!fs.existsSync(file)) {
    console.log(`skip (missing): ${rel}`);
    continue;
  }
  let text = fs.readFileSync(file, 'utf8');
  let changed = 0;
  for (const [re, to] of RULES) {
    text = text.replace(re, (m) => {
      changed++;
      return to;
    });
  }
  fs.writeFileSync(file, text);
  console.log(`updated: ${rel} (${changed} replacements)`);
}
