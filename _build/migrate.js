/* One-off migration: standardize blue theme, navbar, footer across the project. */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

/* ---------- shared assets ---------- */

const TAILWIND_CONFIG = `    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            darkMode: 'class',
            theme: {
                extend: {
                    colors: {
                        primary: {
                            DEFAULT: '#2563EB',
                            50: '#eff6ff',
                            100: '#dbeafe',
                            200: '#bfdbfe',
                            300: '#93c5fd',
                            400: '#60a5fa',
                            500: '#3b82f6',
                            600: '#2563eb',
                            700: '#1d4ed8',
                            800: '#1e40af',
                            900: '#1e3a8a',
                            950: '#172554'
                        },
                        secondary: '#1E3A8A',
                        accent: '#38BDF8',
                        surface: '#EFF6FF',
                        ink: '#1E293B',
                        night: '#0F172A'
                    },
                    fontFamily: {
                        sans: ['Poppins', 'sans-serif']
                    }
                }
            }
        }
    </script>`;

const NAVBAR = `    <!-- ================= SITE NAVBAR ================= -->
    <nav class="sticky top-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors duration-200">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="flex items-center justify-between h-20 gap-3">
                <!-- Logo -->
                <a href="index.html" class="flex items-center space-x-3 shrink-0 group">
                    <div class="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-900 via-blue-600 to-sky-400 flex items-center justify-center text-white text-xl font-black shadow-lg transition-transform group-hover:scale-105">
                        <i class="fa-solid fa-trophy"></i>
                    </div>
                    <div>
                        <span class="block text-xl font-black tracking-tight uppercase leading-none text-slate-900 dark:text-white">Champion</span>
                        <span class="block text-[10px] font-semibold tracking-widest uppercase text-blue-600 dark:text-sky-400">Sports Academy</span>
                    </div>
                </a>

                <!-- Center Nav Links (Desktop) -->
                <div class="hidden lg:flex items-center space-x-0.5 xl:space-x-2">
                    <!-- Home Dropdown: Home 1 = index.html, Home 2 = home2.html -->
                    <div class="relative dropdown-parent group py-2">
                        <button type="button" data-dropdown-toggle aria-haspopup="true" class="flex items-center gap-1 text-sm font-semibold text-blue-600 dark:text-sky-400 px-3 py-2 rounded-lg hover:bg-blue-50 dark:hover:bg-slate-800 transition-colors">
                            <span>Home</span>
                            <i class="fa-solid fa-chevron-down text-[10px] transition-transform group-hover:rotate-180"></i>
                        </button>
                        <div class="dropdown-menu absolute top-full left-0 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 py-2 z-50">
                            <a href="index.html" class="block px-4 py-2.5 text-sm font-bold text-blue-600 dark:text-sky-400 hover:bg-blue-50 dark:hover:bg-slate-700/50">
                                <i class="fa-solid fa-house w-4 mr-2 text-blue-500"></i>Home 1 &mdash; Academy Main
                            </a>
                            <a href="home2.html" class="block px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-700/50 hover:text-blue-600">
                                <i class="fa-solid fa-bolt w-4 mr-2 text-sky-500"></i>Home 2 &mdash; Competitive Theme
                            </a>
                        </div>
                    </div>

                    <!-- About Dropdown (Coaches link lives here) -->
                    <div class="relative dropdown-parent group py-2">
                        <button type="button" data-dropdown-toggle aria-haspopup="true" class="flex items-center gap-1 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-sky-400 px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                            <span>About</span>
                            <i class="fa-solid fa-chevron-down text-[10px] transition-transform group-hover:rotate-180"></i>
                        </button>
                        <div class="dropdown-menu absolute top-full left-0 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 py-2 z-50">
                            <a href="about.html" class="block px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-700/50 hover:text-blue-600">
                                <i class="fa-solid fa-circle-info w-4 mr-2 text-blue-500"></i>About Academy
                            </a>
                            <a href="coaches.html" class="block px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-700/50 hover:text-blue-600">
                                <i class="fa-solid fa-user-tie w-4 mr-2 text-sky-500"></i>Coaches
                            </a>
                            <a href="blog.html" class="block px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-700/50 hover:text-blue-600">
                                <i class="fa-solid fa-newspaper w-4 mr-2 text-blue-500"></i>Blog &amp; News
                            </a>
                        </div>
                    </div>

                    <a href="sports.html" class="nav-link text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-sky-400 px-3 py-2 rounded-lg transition-colors">Sports Offered</a>
                    <a href="batches.html" class="nav-link text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-sky-400 px-3 py-2 rounded-lg transition-colors">Batch Timings</a>
                    <a href="locations.html" class="nav-link text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-sky-400 px-3 py-2 rounded-lg transition-colors">Locations</a>
                    <a href="blog.html" class="nav-link text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-sky-400 px-3 py-2 rounded-lg transition-colors">Blog</a>
                    <a href="contact.html" class="nav-link text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-sky-400 px-3 py-2 rounded-lg transition-colors">Contact</a>
                </div>

                <!-- Right Nav Controls (Desktop) -->
                <div class="hidden lg:flex items-center space-x-2 xl:space-x-3 shrink-0">
                    <div class="relative dropdown-parent py-2">
                        <button type="button" data-dropdown-toggle aria-haspopup="true" class="flex items-center gap-1.5 text-[10px] xl:text-xs font-bold uppercase tracking-wider bg-blue-50 dark:bg-slate-800 text-blue-700 dark:text-sky-300 px-3 py-2 rounded-lg hover:bg-blue-100 dark:hover:bg-slate-700 transition-colors">
                            <i class="fa-solid fa-gauge-high"></i>
                            <span>Dashboard</span>
                            <i class="fa-solid fa-chevron-down text-[10px]"></i>
                        </button>
                        <div class="dropdown-menu absolute top-full right-0 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700 py-2 z-50">
                            <a href="parent-dashboard.html" class="block px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-700/50 hover:text-blue-600 font-medium">
                                <i class="fa-solid fa-user-gear mr-2 text-blue-600"></i>Parent Dashboard
                            </a>
                            <a href="admin-dashboard.html" class="block px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-700/50 hover:text-blue-600 font-medium">
                                <i class="fa-solid fa-user-shield mr-2 text-sky-500"></i>Admin Dashboard
                            </a>
                        </div>
                    </div>

                    <button type="button" class="rtl-toggle-btn px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                        <span class="rtl-text">RTL</span>
                    </button>

                    <button type="button" class="theme-toggle-btn p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                        <i class="fa-solid fa-moon text-lg"></i>
                    </button>

                    <a href="login.html" class="text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-blue-600 px-2 py-2 transition-colors">Login</a>
                    <a href="signup.html" class="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-4 py-2 rounded-xl shadow-md hover:shadow-lg transition-all">Enroll Child</a>
                </div>

                <!-- Tablet / Mobile Controls -->
                <div class="flex items-center space-x-2 lg:hidden shrink-0">
                    <button type="button" class="theme-toggle-btn p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors">
                        <i class="fa-solid fa-moon"></i>
                    </button>
                    <button type="button" id="mobile-menu-toggle" aria-label="Open navigation menu" aria-controls="mobile-menu-drawer" class="p-2.5 rounded-xl bg-blue-600 text-white shadow-md">
                        <i class="fa-solid fa-bars text-xl"></i>
                    </button>
                </div>
            </div>
        </div>
    </nav>

    <!-- ================= MOBILE / TABLET DRAWER ================= -->
    <div id="mobile-menu-overlay" class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] hidden"></div>
    <div id="mobile-menu-drawer" class="fixed top-0 right-0 bottom-0 w-80 max-w-[85vw] bg-white dark:bg-slate-900 z-[60] translate-x-full transition-transform duration-300 ease-in-out shadow-2xl flex flex-col justify-between overflow-y-auto">
        <div class="p-6">
            <div class="flex items-center justify-between pb-6 border-b border-slate-100 dark:border-slate-800">
                <a href="index.html" class="flex items-center space-x-2">
                    <div class="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">
                        <i class="fa-solid fa-trophy"></i>
                    </div>
                    <span class="font-black text-slate-900 dark:text-white">Champion Sports</span>
                </a>
                <button type="button" id="mobile-menu-close" aria-label="Close navigation menu" class="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white">
                    <i class="fa-solid fa-xmark text-xl"></i>
                </button>
            </div>

            <div class="py-6 space-y-3">
                <div>
                    <button type="button" class="mobile-dropdown-btn w-full flex items-center justify-between py-2 text-blue-600 dark:text-sky-400 font-bold">
                        <span><i class="fa-solid fa-house w-4 mr-2"></i>Home</span>
                        <i class="fa-solid fa-chevron-down text-xs transition-transform"></i>
                    </button>
                    <div class="pl-6 mt-2 space-y-2 hidden">
                        <a href="index.html" class="block text-sm text-blue-600 dark:text-sky-400 font-bold py-1">Home 1 &mdash; Academy Main</a>
                        <a href="home2.html" class="block text-sm text-slate-600 dark:text-slate-400 py-1">Home 2 &mdash; Competitive Theme</a>
                    </div>
                </div>

                <div>
                    <button type="button" class="mobile-dropdown-btn w-full flex items-center justify-between py-2 text-slate-800 dark:text-slate-200 font-semibold">
                        <span><i class="fa-solid fa-circle-info w-4 mr-2 text-blue-600"></i>About</span>
                        <i class="fa-solid fa-chevron-down text-xs transition-transform"></i>
                    </button>
                    <div class="pl-6 mt-2 space-y-2 hidden">
                        <a href="about.html" class="block text-sm text-slate-600 dark:text-slate-400 py-1">About Academy</a>
                        <a href="coaches.html" class="block text-sm text-slate-600 dark:text-slate-400 py-1">Coaches</a>
                        <a href="blog.html" class="block text-sm text-slate-600 dark:text-slate-400 py-1">Blog &amp; News</a>
                    </div>
                </div>

                <a href="sports.html" class="block py-2 text-slate-800 dark:text-slate-200 font-semibold"><i class="fa-solid fa-futbol w-4 mr-2 text-blue-600"></i>Sports Offered</a>
                <a href="batches.html" class="block py-2 text-slate-800 dark:text-slate-200 font-semibold"><i class="fa-solid fa-calendar-days w-4 mr-2 text-blue-600"></i>Batch Timings</a>
                <a href="locations.html" class="block py-2 text-slate-800 dark:text-slate-200 font-semibold"><i class="fa-solid fa-location-dot w-4 mr-2 text-blue-600"></i>Locations</a>
                <a href="blog.html" class="block py-2 text-slate-800 dark:text-slate-200 font-semibold"><i class="fa-solid fa-newspaper w-4 mr-2 text-blue-600"></i>Blog</a>
                <a href="contact.html" class="block py-2 text-slate-800 dark:text-slate-200 font-semibold"><i class="fa-solid fa-envelope w-4 mr-2 text-blue-600"></i>Contact</a>

                <div class="pt-4 border-t border-slate-100 dark:border-slate-800">
                    <span class="text-xs font-bold uppercase tracking-wider text-slate-400">Dashboards</span>
                    <div class="mt-2 space-y-2">
                        <a href="parent-dashboard.html" class="flex items-center text-sm text-slate-700 dark:text-slate-300 py-1.5 font-medium">
                            <i class="fa-solid fa-user-gear mr-2 text-blue-600"></i> Parent Dashboard
                        </a>
                        <a href="admin-dashboard.html" class="flex items-center text-sm text-slate-700 dark:text-slate-300 py-1.5 font-medium">
                            <i class="fa-solid fa-user-shield mr-2 text-sky-500"></i> Admin Dashboard
                        </a>
                    </div>
                </div>
            </div>
        </div>

        <div class="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 space-y-3">
            <div class="flex items-center gap-2">
                <button type="button" class="rtl-toggle-btn flex-1 py-2 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200">
                    Direction: <span class="rtl-text">RTL</span>
                </button>
                <button type="button" class="theme-toggle-btn p-2 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                    <i class="fa-solid fa-moon"></i>
                </button>
            </div>
            <a href="login.html" class="block w-full text-center py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 font-semibold text-slate-800 dark:text-white">Login</a>
            <a href="signup.html" class="block w-full text-center py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md">Enroll Child</a>
        </div>
    </div>`;

const FOOTER = `    <!-- ================= FOOTER ================= -->
    <footer class="bg-slate-950 text-slate-300 pt-16 pb-10 border-t border-slate-800">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-slate-800">
                <div class="space-y-5">
                    <a href="index.html" class="flex items-center space-x-3">
                        <div class="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white text-lg font-black">
                            <i class="fa-solid fa-trophy"></i>
                        </div>
                        <div>
                            <span class="block text-xl font-black text-white uppercase leading-none">Champion</span>
                            <span class="block text-[10px] font-semibold text-sky-400 uppercase tracking-widest">Sports Academy</span>
                        </div>
                    </a>
                    <p class="text-slate-400 text-xs leading-relaxed max-w-sm">
                        Premier multi-location sports tuition and athletic coaching centre dedicated to moulding young talent into champions through professional guidance, structured batches, and safe training environments.
                    </p>
                    <div class="flex items-center space-x-3">
                        <a href="#" aria-label="Facebook" class="w-9 h-9 rounded-lg bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white flex items-center justify-center transition-colors"><i class="fa-brands fa-facebook-f"></i></a>
                        <a href="#" aria-label="Instagram" class="w-9 h-9 rounded-lg bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white flex items-center justify-center transition-colors"><i class="fa-brands fa-instagram"></i></a>
                        <a href="#" aria-label="X" class="w-9 h-9 rounded-lg bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white flex items-center justify-center transition-colors"><i class="fa-brands fa-x-twitter"></i></a>
                        <a href="#" aria-label="YouTube" class="w-9 h-9 rounded-lg bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white flex items-center justify-center transition-colors"><i class="fa-brands fa-youtube"></i></a>
                    </div>
                </div>

                <div>
                    <h4 class="text-white text-sm font-bold uppercase tracking-wider mb-4">Quick Links</h4>
                    <ul class="space-y-2.5 text-xs">
                        <li><a href="about.html" class="hover:text-sky-400 transition-colors">About Academy</a></li>
                        <li><a href="coaches.html" class="hover:text-sky-400 transition-colors">Coaches</a></li>
                        <li><a href="sports.html" class="hover:text-sky-400 transition-colors">Sports Offered</a></li>
                        <li><a href="batches.html" class="hover:text-sky-400 transition-colors">Batch Schedules</a></li>
                        <li><a href="locations.html" class="hover:text-sky-400 transition-colors">Academy Locations</a></li>
                        <li><a href="blog.html" class="hover:text-sky-400 transition-colors">News &amp; Articles</a></li>
                    </ul>
                </div>

                <div>
                    <h4 class="text-white text-sm font-bold uppercase tracking-wider mb-4">Sports &amp; Portals</h4>
                    <ul class="space-y-2.5 text-xs">
                        <li><a href="sports.html#football" class="hover:text-sky-400 transition-colors">Football Coaching</a></li>
                        <li><a href="sports.html#basketball" class="hover:text-sky-400 transition-colors">Basketball Training</a></li>
                        <li><a href="sports.html#athletics" class="hover:text-sky-400 transition-colors">Athletics Track</a></li>
                        <li><a href="parent-dashboard.html" class="hover:text-sky-400 transition-colors">Parent Portal</a></li>
                        <li><a href="admin-dashboard.html" class="hover:text-sky-400 transition-colors">Admin Dashboard</a></li>
                    </ul>
                </div>

                <div>
                    <h4 class="text-white text-sm font-bold uppercase tracking-wider mb-4">Stay Updated</h4>
                    <p class="text-xs text-slate-400 mb-3">Subscribe for batch updates, tournament alerts, and fitness tips.</p>
                    <form id="newsletter-form" class="space-y-2">
                        <input type="email" name="email" placeholder="Enter parent email" required aria-label="Email for newsletter" class="w-full px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-lg focus:outline-none focus:border-blue-500 text-slate-200">
                        <button type="submit" class="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors">Subscribe</button>
                    </form>
                    <p class="text-[10px] text-slate-500 mt-3"><i class="fa-solid fa-location-dot text-blue-500 mr-1"></i> 742 Evergreen Terrace, Downtown</p>
                </div>
            </div>

            <div class="pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
                <p>&copy; 2026 Champion Sports Academy. All rights reserved.</p>
                <div class="flex flex-wrap justify-center gap-6">
                    <a href="privacy-policy.html" class="hover:text-slate-300 transition-colors">Privacy Policy</a>
                    <a href="terms.html" class="hover:text-slate-300 transition-colors">Terms of Service</a>
                    <a href="contact.html" class="hover:text-slate-300 transition-colors">Contact Support</a>
                </div>
            </div>
        </div>
    </footer>`;

/* ---------- colour remap (green / orange -> blue palette) ---------- */

const COLOR_MAP = [
    [/\bemergal?d?-?\d*/gi, 'blue'],
    [/\bteal-\d+/gi, 'sky-400'],
    [/\blime-\d+/gi, 'sky-300'],
    [/\bgreen-\d+/gi, 'blue-300'],
    [/\bgreen\b/gi, 'blue'],
    [/\bamber-\d+/gi, 'sky-400'],
    [/\bamber\b/gi, 'sky'],
    [/\borange-\d+/gi, 'sky-400'],
    [/\borange\b/gi, 'sky'],
    [/#16A34A/gi, '#2563EB'],
    [/#14532D/gi, '#1E3A8A'],
    [/#F97316/gi, '#38BDF8'],
    [/#f0fdf4/gi, '#eff6ff'],
    [/#15803d/gi, '#1d4ed8']
];

/* dark:green-xxx -> dark:blue-xxx  (handled by word map) */

function recolor(text) {
    let out = text;
    COLOR_MAP.forEach(([re, rep]) => { out = out.replace(re, rep); });
    /* fix duplicated 400 shade created by amber/orange/teal -> sky-400 + original shade */
    out = out.replace(/sky-400-(\d+)/g, 'sky-$1');
    return out;
}

/* ---------- helpers ---------- */

function read(p) { return fs.readFileSync(p, 'utf8'); }
function write(p, s) { fs.writeFileSync(p, s, 'utf8'); }

const htmlFiles = fs.readdirSync(ROOT).filter(f => f.endsWith('.html'));
const jsCssFiles = ['css/styles.css', 'js/main.js', 'js/auth.js', 'js/dashboard.js', 'js/theme.js', 'js/rtl.js']
    .filter(f => fs.existsSync(path.join(ROOT, f)));

/* 1. tailwind config block */
function normalizeConfig(html) {
    return html.replace(
        /    <script src="https:\/\/cdn\.tailwindcss\.com"><\/script>\s*\n    <script>\s*\n        tailwind\.config = \{[\s\S]*?\n    <\/script>/,
        TAILWIND_CONFIG
    );
}

/* 2. navbar replacement (public pages only, skip dashboards) */
const SKIP_NAV = ['parent-dashboard.html', 'admin-dashboard.html', 'home-1.html', 'home-2.html'];

function replaceNav(html) {
    return html.replace(/    <!-- (?:MAIN )?NAVBAR -->[\s\S]*?<\/nav>\s*(?:<!-- Mobile Navigation Drawer -->[\s\S]*?<\/div>\s*<\/div>)?/i,
        NAVBAR);
}

const report = [];

htmlFiles.forEach(file => {
    const fp = path.join(ROOT, file);
    let html = read(fp);

    const before = html;

    html = normalizeConfig(html);
    if (!SKIP_NAV.includes(file)) {
        html = replaceNav(html);
    }
    html = recolor(html);

    if (html !== before) {
        write(fp, html);
        report.push('updated ' + file);
    }
});

jsCssFiles.forEach(rel => {
    const fp = path.join(ROOT, rel);
    const before = read(fp);
    const after = recolor(before);
    if (before !== after) {
        write(fp, after);
        report.push('updated ' + rel);
    }
});

console.log(report.join('\n'));
console.log('done');
