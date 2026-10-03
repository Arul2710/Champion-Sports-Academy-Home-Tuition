const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

// ---- global rules (apply everywhere) ----
const GLOBAL = [
  // invisible success badge: bg and text both blue-300
  [
    /bg-blue-300 dark:bg-blue-300\/40 text-blue-300 dark:text-blue-300/g,
    'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
  ],
  [/\bbg-blue-300 text-blue-300\b/g, 'bg-blue-100 text-blue-700'],
  // invisible category chip
  [
    /text-sky-400 bg-sky-400 dark:bg-sky-400\/40/g,
    'text-sky-700 bg-sky-100 dark:bg-sky-900/40 dark:text-sky-300',
  ],
  // dead hover states left by the collapsed-shade pass
  [/bg-sky-400 hover:bg-sky-400/g, 'bg-sky-400 hover:bg-sky-300'],
];

// ---- per-file rules: sky-400 accents sitting on light surfaces ----
const PER_FILE = {
  'index.html': [
    [/mr-1 text-sky-400/g, 'mr-1 text-sky-600 dark:text-sky-400'],
    [
      /text-xs text-sky-400 font-semibold mb-2/g,
      'text-xs text-sky-600 dark:text-sky-400 font-semibold mb-2',
    ],
  ],
  'batches.html': [
    [
      /text-\[10px\] text-sky-400 font-bold/g,
      'text-[10px] text-sky-600 dark:text-sky-400 font-bold',
    ],
  ],
  'coach-details.html': [
    [
      /class="text-sky-400 font-semibold">Flexible/g,
      'class="text-sky-600 dark:text-sky-400 font-semibold">Flexible',
    ],
  ],
  'coaches.html': [
    [
      /text-xs text-sky-400 font-semibold/g,
      'text-xs text-sky-600 dark:text-sky-400 font-semibold',
    ],
  ],
  'contact.html': [
    [/fa-clock text-sky-400 text-base/g, 'fa-clock text-sky-600 dark:text-sky-400 text-base'],
  ],
  'parent-dashboard.html': [
    [
      /text-xs text-sky-400 font-semibold/g,
      'text-xs text-sky-600 dark:text-sky-400 font-semibold',
    ],
  ],
  'sports.html': [
    [
      /uppercase text-sky-400"/g,
      'uppercase text-sky-600 dark:text-sky-400"',
    ],
    [
      /text-sky-400 font-extrabold text-base/g,
      'text-sky-600 dark:text-sky-400 font-extrabold text-base',
    ],
  ],
};

let total = 0;
for (const [file, rules] of Object.entries(PER_FILE)) {
  const p = path.join(ROOT, file);
  let text = fs.readFileSync(p, 'utf8');
  let n = 0;
  for (const [re, to] of [...GLOBAL, ...rules]) {
    text = text.replace(re, () => {
      n++;
      return to;
    });
  }
  fs.writeFileSync(p, text);
  console.log(`${file.padEnd(24)} ${n}`);
  total += n;
}

// remaining global-only files
for (const file of ['404.html', 'admin-dashboard.html', 'blog.html', 'login.html']) {
  const p = path.join(ROOT, file);
  let text = fs.readFileSync(p, 'utf8');
  let n = 0;
  for (const [re, to] of GLOBAL) {
    text = text.replace(re, () => {
      n++;
      return to;
    });
  }
  fs.writeFileSync(p, text);
  console.log(`${file.padEnd(24)} ${n}`);
  total += n;
}

console.log(`\n${total} contrast fixes applied`);
