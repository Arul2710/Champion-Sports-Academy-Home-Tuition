const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const index = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

/* ---------- shared chrome, lifted verbatim from index.html ---------- */
const HEAD = index.slice(index.indexOf('<!DOCTYPE html>'), index.indexOf('</head>'));
const BODY_OPEN = index.match(/<body[^>]*>/)[0];
const NAV = index
  .slice(index.indexOf('<!-- ================= SITE NAVBAR ================= -->'), index.search(/<main\b/))
  .trimEnd();
const FOOTER = index.slice(index.lastIndexOf('<footer')).trimEnd();

/* ---------- verified image pool (already used in this project) ----------
   Images are served locally from ./images (see _build/localize-images.js). The
   manifest maps each original remote URL to its downloaded file; anything missing
   from it could not be downloaded upstream and deliberately keeps its remote URL
   rather than becoming a broken <img>. */
const MANIFEST = (() => {
  try {
    return JSON.parse(fs.readFileSync(path.join(__dirname, 'images-manifest.json'), 'utf8'));
  } catch {
    return { localised: {} };
  }
})();
const REMOTE = (id, w) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;
const U = (id, w = 800) => (/^images\//.test(id) ? id : MANIFEST.localised[REMOTE(id, w)] || REMOTE(id, w));
const IMG = {
  stadium: 'photo-1517649763962-0c623266010b',
  football: 'photo-1526232761682-d26e03ac148e',
  football2: 'photo-1508098682722-e99c43a406b2',
  basketball: 'photo-1546519638-68e109498ffc',
  track: 'photo-1461896836934-ffe607ba8211',
  child: 'photo-1543807535-eceef0bc6599',
  p1: 'photo-1534528741775-53994a69daeb',
  p2: 'photo-1544005313-94ddf0286df2',
  p3: 'photo-1573496359142-b8d87734a5a2',
  p4: 'photo-1517841905240-472988babdf9',
  man: 'photo-1507003211169-0a1dd7228f2d',
};

const LOCAL = {
  juniorSession: 'images/thumbs-junior-football-club-practice-session-youth-sp.webp',
  coachInstruction: 'images/img-youth-soccer-coach-giving-instructions-players.webp',
  floodlitPitch: 'images/images-floodlit-soccer-field-stockcake.jpg',
  agilityDrill: 'images/boosttrainingsystems-agility-training.jpg',
  teamStrategy: 'images/thumbs-netball-strategy-happy-sports-team-coach-plann.webp',
  footballWide: 'images/unsplash-photo-1526232761682-d26e03ac148e-w1600.webp',
  sprinter: 'images/static-pixelated-design-of-woman-sprinter-leaving-sta.jpg',
  homeCoach: 'images/acpe-istock-1306763779-sport-coaching-male-with-you.jpg',
  worldCup: 'images/wccasoccer-world-cup-2026-june-27-predictions-picks-1.webp',
  coachingWide: 'images/wallpapers-coaching-pictures-4096-x-2146-utf3qc6e388d64nq.jpg',
};

/* ---------- Academy location: single source of truth ----------
   The contact map embed, the address card and the "Get Directions" link all read
   from this object. Confirm the real UK address once and every surface follows. */
const HQ = {
  name: 'Westside Hub',
  note: 'Flagship &middot; Full turf, courts, gym',
  line1: '18 Kingsway West',
  line2: 'Westside',
  postcode: '',
  phone: '+1 (555) 000-0000',
  phoneHref: '+15550000000',
  email: 'hello@championsportsacademy.com',
  zoom: 15,
};

/* Google resolves this to a single pin; keeps street, town and postcode separate
   so a postcode can be added later without rewriting the query. */
HQ.mapQuery = [HQ.line1, HQ.line2, HQ.postcode, 'United Kingdom'].filter(Boolean).join(', ');

const gmapsUrl = (mode = 'search') =>
  mode === 'directions'
    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(HQ.mapQuery)}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(HQ.mapQuery)}`;

/* Keyless Google Maps embed. `loading="lazy"` keeps it off the critical path and the
   wrapper has its own height + overflow so the iframe can never break the layout. */
const mapEmbed = () => `
                    <div class="relative w-full overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 shadow-lg">
                        <iframe
                            title="Google Map showing ${HQ.name}, ${HQ.line1}${HQ.postcode ? `, ${HQ.postcode}` : ''}"
                            src="https://www.google.com/maps?q=${encodeURIComponent(HQ.mapQuery)}&amp;z=${HQ.zoom}&amp;output=embed"
                            class="block w-full h-72 sm:h-96 lg:h-[30rem] border-0"
                            loading="lazy"
                            referrerpolicy="no-referrer-when-downgrade"
                            allowfullscreen></iframe>
                    </div>`;

/* Address card that sits beside the map. */
const mapDetails = () => `
                    <div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-8 space-y-5 h-full flex flex-col">
                        <div class="space-y-1.5">
                            <span class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-slate-800 text-blue-700 dark:text-sky-300 text-[10px] font-bold uppercase tracking-widest">
                                <i class="fa-solid fa-location-dot"></i>Head Office
                            </span>
                            <h3 class="text-xl font-extrabold text-slate-900 dark:text-white uppercase leading-tight">${HQ.name}</h3>
                            <p class="text-xs font-semibold text-blue-600 dark:text-sky-400">${HQ.note}</p>
                        </div>

                        <address class="not-italic text-sm text-slate-600 dark:text-slate-400 leading-relaxed space-y-1">
                            <span class="block font-semibold text-slate-900 dark:text-white">${HQ.line1}</span>
                            <span class="block">${HQ.line2}</span>
                            ${HQ.postcode ? `<span class="block">${HQ.postcode}</span>` : ''}
                            <span class="block">United Kingdom</span>
                        </address>

                        <ul class="space-y-3 text-sm">
                            <li>
                                <a href="tel:${HQ.phoneHref}" class="flex items-center gap-3 text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-sky-400 transition-colors">
                                    <span class="w-9 h-9 shrink-0 rounded-xl bg-blue-600 text-white flex items-center justify-center text-xs"><i class="fa-solid fa-phone"></i></span>
                                    <span class="font-medium">${HQ.phone}</span>
                                </a>
                            </li>
                            <li>
                                <a href="mailto:${HQ.email}" class="flex items-center gap-3 text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-sky-400 transition-colors break-all">
                                    <span class="w-9 h-9 shrink-0 rounded-xl bg-blue-600 text-white flex items-center justify-center text-xs"><i class="fa-solid fa-envelope"></i></span>
                                    <span class="font-medium text-xs sm:text-sm">${HQ.email}</span>
                                </a>
                            </li>
                            <li class="flex items-center gap-3 text-slate-700 dark:text-slate-200">
                                <span class="w-9 h-9 shrink-0 rounded-xl bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-sky-400 flex items-center justify-center text-xs"><i class="fa-solid fa-clock"></i></span>
                                <span class="font-medium text-xs sm:text-sm">Open 7 days &middot; 6:00 AM &ndash; 9:00 PM</span>
                            </li>
                        </ul>

                        <div class="flex flex-wrap gap-3 pt-1 mt-auto">
                            <a href="${gmapsUrl('directions')}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider px-5 py-3 rounded-xl shadow-md hover:shadow-lg transition-all">
                                <span>Get Directions</span><i class="fa-solid fa-diamond-turn-right text-xs"></i>
                            </a>
                            <a href="${gmapsUrl()}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold uppercase tracking-wider px-5 py-3 rounded-xl transition-colors">
                                <i class="fa-solid fa-map-location-dot text-xs"></i><span>Open in Maps</span>
                            </a>
                        </div>
                    </div>`;

/* ---------- shared section builders ---------- */
const hero = (n, { kicker, title, sub, img, alt, primary, secondary, bg }) => `
        <!-- SECTION ${n}: HERO SECTION -->
        <section class="hero-section relative bg-blue-950 text-white py-20 overflow-hidden">
            <div class="hero-bg hero-bg-${bg || (img === IMG.arena ? 'arena' : 'stadium')}" role="img" aria-label="${alt}"></div>
            <div class="absolute inset-0 z-[1] bg-gradient-to-b from-blue-950/90 via-blue-950/80 to-blue-900/90"></div>
            <div class="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-5">
                <span class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/20 border border-sky-400/40 text-sky-300 text-xs font-bold uppercase tracking-widest">
                    <i class="fa-solid fa-star"></i>${kicker}
                </span>
                <h1 class="text-4xl sm:text-5xl lg:text-6xl font-black uppercase tracking-tight leading-tight">${title}</h1>
                <p class="text-slate-300 text-sm sm:text-base max-w-3xl mx-auto leading-relaxed">${sub}</p>
                <div class="flex flex-wrap gap-4 justify-center pt-2">
                    ${primary}
                    ${secondary}
                </div>
            </div>
        </section>`;

const head = (kicker, title, sub = '') => `
                <div class="text-center max-w-3xl mx-auto space-y-4 mb-14">
                    <span class="inline-flex items-center gap-2 text-blue-600 dark:text-sky-400 text-xs font-bold uppercase tracking-widest">
                        <i class="fa-solid fa-bullseye"></i>${kicker}
                    </span>
                    <h2 class="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white uppercase leading-tight">${title}</h2>
                    ${sub ? `<p class="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">${sub}</p>` : ''}
                </div>`;

const cta = (n, { title, sub, img, primary, secondary }) => `
        <!-- SECTION ${n}: CTA SECTION -->
        <section class="relative py-20 bg-gradient-to-r from-blue-900 via-blue-800 to-blue-950 text-white overflow-hidden">
            <img src="${U(img, 1600)}" alt="" aria-hidden="true" class="absolute inset-0 w-full h-full object-cover opacity-15" loading="lazy">
            <div class="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
                <h2 class="text-3xl sm:text-4xl font-black uppercase tracking-tight leading-tight">${title}</h2>
                <p class="text-blue-100 text-sm sm:text-base leading-relaxed">${sub}</p>
                <div class="flex flex-wrap gap-4 justify-center">
                    ${primary}
                    ${secondary}
                </div>
            </div>
        </section>`;

const btnPrimary = (href, label, icon = 'fa-arrow-right') =>
  `<a href="${href}" class="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-7 py-3.5 rounded-xl shadow-lg transition-all transform hover:-translate-y-0.5 text-xs uppercase tracking-wider">
                    <span>${label}</span><i class="fa-solid ${icon} text-xs"></i>
                </a>`;

const btnGhost = (href, label) =>
  `<a href="${href}" class="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/25 text-white font-bold px-7 py-3.5 rounded-xl backdrop-blur-md transition-all text-xs uppercase tracking-wider">
                    ${label}
                </a>`;

const btnSky = (href, label, icon = 'fa-bolt') =>
  `<a href="${href}" class="inline-flex items-center gap-2 bg-sky-400 hover:bg-sky-300 text-slate-950 font-extrabold px-7 py-3.5 rounded-xl shadow-lg transition-all transform hover:-translate-y-0.5 text-xs uppercase tracking-wider">
                    <i class="fa-solid ${icon}"></i><span>${label}</span>
                </a>`;

/* ---------- page builder ---------- */
const PAGES = [];

function page({ file, title, desc, sections }) {
  const head_ = HEAD
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${title}</title>`)
    .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${desc}">`);
  const main = `\n${sections.join('\n')}\n`;
  const out = `${head_}\n</head>\n\n${BODY_OPEN}\n\n${NAV}\n\n    <!-- MAIN CONTENT -->\n    <main class="flex-grow">${main}    </main>\n\n${FOOTER}\n`;
  fs.writeFileSync(path.join(ROOT, file), out);
  PAGES.push(file);
}

/* ================================================================== */
/*  SPORTS                                                             */
/* ================================================================== */
const sportCard = (id, icon, name, img, alt, level, fee, blurb, points) => `
                    <article id="${id}" class="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-lg border border-slate-100 dark:border-slate-800 hover:shadow-2xl transition-all duration-300 flex flex-col">
                        <div class="relative h-56 overflow-hidden">
                            <img src="${U(img, 600)}" alt="${alt}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy">
                            <span class="absolute top-4 left-4 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase">${level}</span>
                        </div>
                        <div class="p-6 space-y-4 flex flex-col flex-grow">
                            <div class="flex items-center justify-between">
                                <h3 class="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <i class="fa-solid ${icon} text-blue-600"></i>${name}
                                </h3>
                            </div>
                            <p class="text-slate-600 dark:text-slate-400 text-sm leading-relaxed flex-grow">${blurb}</p>
                            <ul class="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                                ${points.map((p) => `<li class="flex items-start gap-2"><i class="fa-solid fa-circle-check text-blue-500 mt-0.5"></i><span>${p}</span></li>`).join('\n                                ')}
                            </ul>
                            <p class="text-sm"><strong class="text-slate-700 dark:text-slate-300">Monthly Fee:</strong> <span class="text-blue-600 dark:text-sky-400 font-extrabold text-base">${fee}</span></p>
                            <a href="signup.html?sport=${name}" class="block w-full text-center py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-colors shadow-md">Enroll in ${name}</a>
                        </div>
                    </article>`;

page({
  file: 'sports.html',
  title: 'Sports Offered | Football, Basketball & Athletics Coaching',
  desc: 'Professional youth coaching in Football, Basketball and Athletics across Champion Sports Academy multi-location hubs and home tuition sessions.',
  sections: [
    hero(1, {
      kicker: 'Disciplines We Master',
      title: 'Sports <span class="text-sky-400">Offered</span>',
      sub: 'Structured, age-appropriate coaching in the three competitive sports we specialise in &mdash; delivered at our academy hubs or at your home.',
      img: IMG.stadium,
      alt: 'Children training on a floodlit sports pitch',
      primary: btnPrimary('batches.html', 'View Batch Timings'),
      secondary: btnGhost('locations.html', 'Find Your Nearest Hub'),
    }),
    `
        <!-- SECTION 2: SPORTS GRID -->
        <section class="py-20 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                ${head('Our Programmes', 'Choose Your Discipline', 'Every programme follows a progressive curriculum built by certified coaches and reviewed every season.')}
                <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
${sportCard('football', 'fa-futbol', 'Football', IMG.football, 'Young footballers training with a coach', 'Most Popular', '$120 / month', 'Technical mastery, tactical awareness and match conditioning for grassroots to academy-level players.', ['UEFA-aligned technical curriculum', 'Small-sided match play', 'Position-specific drills'])}
${sportCard('basketball', 'fa-basketball-ball', 'Basketball', IMG.basketball, 'Junior basketball players during a training session', 'High Energy', '$110 / month', 'Ball handling, footwork and team offence with an emphasis on decision making under pressure.', ['Dribbling and shooting mechanics', 'Full-court transition play', 'Strength & conditioning'])}
${sportCard('athletics', 'fa-person-running', 'Athletics', IMG.track, 'Young athletes sprinting on a running track', 'Speed & Stamina', '$95 / month', 'Sprint technique, endurance base building and race-specific preparation for track competitors.', ['Sprint start & stride mechanics', 'Interval endurance blocks', 'Event-specific prep'])}
                </div>
            </div>
        </section>`,
    `
        <!-- SECTION 3: TRAINING PATHWAYS -->
        <section class="py-20 bg-slate-50 dark:bg-slate-950">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                ${head('Age Grouped Tracks', 'Structured Development Pathways', 'We place every athlete in a level that matches their age and current ability, then progress them as their skills develop.')}
                <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div class="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-md border border-slate-100 dark:border-slate-800">
                        <img src="${LOCAL.juniorSession}" alt="Young children taking part in a junior football club practice session" class="w-full h-44 object-cover" loading="lazy">
                        <div class="p-6 space-y-3">
                            <span class="text-xs font-bold uppercase text-blue-600 dark:text-sky-400">Ages 5&ndash;8 &middot; Foundation</span>
                            <h3 class="text-lg font-bold text-slate-900 dark:text-white">First Steps</h3>
                            <p class="text-sm text-slate-600 dark:text-slate-400">Fundamentals through play-based drills, balance work and confidence building. Maximum eight athletes per group.</p>
                        </div>
                    </div>
                    <div class="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-md border border-slate-100 dark:border-slate-800">
                        <img src="${LOCAL.coachInstruction}" alt="Junior players receiving technique coaching from their coach" class="w-full h-44 object-cover" loading="lazy">
                        <div class="p-6 space-y-3">
                            <span class="text-xs font-bold uppercase text-blue-600 dark:text-sky-400">Ages 9&ndash;12 &middot; Development</span>
                            <h3 class="text-lg font-bold text-slate-900 dark:text-white">Core Skills</h3>
                            <p class="text-sm text-slate-600 dark:text-slate-400">Refined technique, tactical shape and structured strength work alongside a weekly match fixture.</p>
                        </div>
                    </div>
                    <div class="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-md border border-slate-100 dark:border-slate-800">
                        <img src="${U(IMG.track, 600)}" alt="Advanced athlete on a track during a performance block" class="w-full h-44 object-cover" loading="lazy">
                        <div class="p-6 space-y-3">
                            <span class="text-xs font-bold uppercase text-blue-600 dark:text-sky-400">Ages 13&ndash;17 &middot; Elite</span>
                            <h3 class="text-lg font-bold text-slate-900 dark:text-white">Competitive Edge</h3>
                            <p class="text-sm text-slate-600 dark:text-slate-400">Official tournament entry, video analysis, periodised conditioning and one-to-one mentoring.</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>`,
    `
        <!-- SECTION 4: FACILITIES -->
        <section class="py-20 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
                    <div class="space-y-6">
                        ${head('Our Environment', 'Facilities Built For Training')}
                        <ul class="space-y-4">
                            <li class="flex gap-4"><span class="w-11 h-11 shrink-0 rounded-xl bg-blue-50 dark:bg-blue-900/40 text-blue-600 flex items-center justify-center"><i class="fa-solid fa-futbol"></i></span><div><h3 class="font-bold text-slate-900 dark:text-white text-sm">Floodlit Turfs</h3><p class="text-xs text-slate-600 dark:text-slate-400">Full-size and three-a-side pitches with evening lighting at every hub.</p></div></li>
                            <li class="flex gap-4"><span class="w-11 h-11 shrink-0 rounded-xl bg-blue-50 dark:bg-blue-900/40 text-blue-600 flex items-center justify-center"><i class="fa-solid fa-basketball-ball"></i></span><div><h3 class="font-bold text-slate-900 dark:text-white text-sm">Synthetic Courts</h3><p class="text-xs text-slate-600 dark:text-slate-400">Impact-absorbing indoor courts suitable for year-round basketball.</p></div></li>
                            <li class="flex gap-4"><span class="w-11 h-11 shrink-0 rounded-xl bg-blue-50 dark:bg-blue-900/40 text-blue-600 flex items-center justify-center"><i class="fa-solid fa-dumbbell"></i></span><div><h3 class="font-bold text-slate-900 dark:text-white text-sm">Strength &amp; Conditioning</h3><p class="text-xs text-slate-600 dark:text-slate-400">Age-appropriate resistance, mobility and speed machinery supervised by staff.</p></div></li>
                            <li class="flex gap-4"><span class="w-11 h-11 shrink-0 rounded-xl bg-blue-50 dark:bg-blue-900/40 text-blue-600 flex items-center justify-center"><i class="fa-solid fa-house-chimney"></i></span><div><h3 class="font-bold text-slate-900 dark:text-white text-sm">Home Tuition</h3><p class="text-xs text-slate-600 dark:text-slate-400">One-to-one and pair sessions brought directly to your street or society ground.</p></div></li>
                        </ul>
                        <a href="locations.html" class="inline-flex items-center gap-2 text-blue-600 dark:text-sky-400 font-bold text-xs uppercase tracking-wider hover:underline">See all hub facilities <i class="fa-solid fa-arrow-right text-[10px]"></i></a>
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <img src="${LOCAL.floodlitPitch}" alt="Floodlit stadium pitch at a Champion Sports Academy hub" class="w-full h-56 object-cover rounded-3xl shadow-lg" loading="lazy">
                        <img src="${U(IMG.basketball, 600)}" alt="Indoor synthetic basketball court" class="w-full h-56 object-cover rounded-3xl shadow-lg mt-8" loading="lazy">
                        <img src="${U(IMG.track, 600)}" alt="Running track used for athletics training" class="w-full h-56 object-cover rounded-3xl shadow-lg -mt-8" loading="lazy">
                        <img src="${U(IMG.football, 600)}" alt="Football training session in progress" class="w-full h-56 object-cover rounded-3xl shadow-lg" loading="lazy">
                    </div>
                </div>
            </div>
        </section>`,
    `
        <!-- SECTION 5: COACHING METHOD -->
        <section class="py-20 bg-slate-50 dark:bg-slate-950">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                ${head('Our Method', 'How We Develop Young Athletes', 'A repeatable four-stage cycle that keeps every athlete progressing and every parent informed.')}
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    ${[
                      ['fa-clipboard-check', 'Assessment', 'Skill, fitness and movement screening in week one to set an honest starting level.'],
                      ['fa-bullseye', 'Programme Design', 'A written session plan per athlete with measurable weekly targets.'],
                      ['fa-person-running', 'On-Field Delivery', 'Small-group ratios so every player gets meaningful repetitions.'],
                      ['fa-chart-line', 'Review &amp; Progress', 'Coach notes and video review shared with parents each month.'],
                    ]
                      .map(
                        ([icon, t, d], i) => `
                    <div class="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                        <span class="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center text-lg font-black">${String(i + 1).padStart(2, '0')}</span>
                        <h3 class="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm"><i class="fa-solid ${icon} text-blue-500"></i>${t}</h3>
                        <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">${d}</p>
                    </div>`
                      )
                      .join('')}
                </div>
            </div>
        </section>`,
    cta(6, {
      title: 'Ready to Join a Batch?',
      sub: 'Spaces are limited to keep coach-to-player ratios low. Tell us your child\u2019s age and preferred sport and we will confirm the next available slot.',
      img: IMG.football2,
      primary: btnPrimary('signup.html', 'Enroll Your Child', 'fa-user-plus'),
      secondary: btnGhost('contact.html', 'Ask a Question'),
    }),
  ],
});

/* ================================================================== */
/*  COACHES                                                            */
/* ================================================================== */
const coachCard = (id, name, role, img, alt, badges, line) => `
                    <article class="coach-card bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-md hover:shadow-xl transition-all space-y-4" data-sport="${role}">
                        <div class="flex items-start gap-4">
                            <img src="${U(img, 400)}" alt="${alt}" class="w-20 h-20 rounded-2xl object-cover shrink-0" loading="lazy">
                            <div class="min-w-0">
                                <h3 class="text-lg font-bold text-slate-900 dark:text-white leading-tight">${name}</h3>
                                <p class="text-xs text-blue-600 dark:text-sky-400 font-semibold mt-1">${line}</p>
                            </div>
                        </div>
                        <div class="flex flex-wrap gap-2">
                            ${badges.map((b) => `<span class="text-[10px] font-bold uppercase text-blue-600 dark:text-sky-400 bg-blue-50 dark:bg-blue-900/40 px-2.5 py-1 rounded-md">${b}</span>`).join('\n                            ')}
                        </div>
                        <a href="coach-details.html?id=${id}" class="block w-full text-center py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-blue-600 hover:text-white font-bold text-xs rounded-xl text-slate-800 dark:text-slate-200 transition-colors">View Full Profile</a>
                    </article>`;

page({
  file: 'coaches.html',
  title: 'Certified Coaches | Champion Sports Academy',
  desc: 'Meet the certified football, basketball and athletics coaches at Champion Sports Academy &mdash; licensed, experienced and trained in child development.',
  sections: [
    hero(1, {
      kicker: 'Certified Mentors',
      title: 'Meet Our <span class="text-sky-400">Coaches</span>',
      sub: 'Every coach on our roster holds a recognised qualification and completes annual safeguarding and first-aid certification.',
      img: IMG.football2,
      alt: 'Coach instructing young players during a training session',
      primary: btnPrimary('coach-details.html', 'Coach Profiles'),
      secondary: btnGhost('batches.html', 'See Open Batches'),
    }),
    `
        <!-- SECTION 2: FEATURED COACHES -->
        <section class="py-20 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                ${head('Our Roster', 'Featured Coaching Staff', 'Lead specialists for each discipline, supported by a wider team of session coaches at every hub.')}
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
${coachCard(1, 'Coach Marcus Vance', 'Football', IMG.p1, 'Portrait of football coach Marcus Vance', ['UEFA B', '12 yrs', 'Ex-Professional'], 'UEFA B Licensed Coach &amp; Youth Tactical Specialist')}
${coachCard(2, 'Coach Aisha Rahman', 'Basketball', IMG.p2, 'Portrait of basketball coach Aisha Rahman', ['FIBA Level 2', '9 yrs', 'Ex-National'], 'Former National Player &amp; FIBA Certified')}
${coachCard(3, 'Coach David Miller', 'Athletics', IMG.p3, 'Portrait of athletics coach David Miller', ['UKSCA', '14 yrs', 'Track Director'], 'M.Sc Kinesiology &amp; Sprint Specialist')}
${coachCard(4, 'Coach Sofia Bennett', 'Football', IMG.p4, 'Portrait of football coach Sofia Bennett', ['UEFA C', '7 yrs', 'Youth Development'], 'FA Level 3 Coach &amp; Safeguarding Lead')}
${coachCard(5, 'Coach Daniel Okafor', 'Basketball', IMG.man, 'Portrait of basketball coach Daniel Okafor', ['FIBA Level 1', '6 yrs', 'Skills Coach'], 'Skills Development &amp; Scouting Analyst')}
${coachCard(6, 'Coach Priya Nair', 'Athletics', IMG.child, 'Portrait of athletics coach Priya Nair', ['IAAF Coach', '11 yrs', 'Youth Lead'], 'Endurance Specialist &amp; Talent ID')}
                </div>
            </div>
        </section>`,
    `
        <!-- SECTION 3: CREDENTIALS -->
        <section class="py-20 bg-slate-50 dark:bg-slate-950">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
                    <div class="grid grid-cols-2 gap-4">
                        <img src="${U(IMG.football, 600)}" alt="Coach running a technical drill with players" class="w-full h-60 object-cover rounded-3xl shadow-lg" loading="lazy">
                        <img src="${U(IMG.basketball, 600)}" alt="Coach demonstrating a basketball drill" class="w-full h-60 object-cover rounded-3xl shadow-lg mt-8" loading="lazy">
                    </div>
                    <div class="space-y-6">
                        ${head('Standards We Uphold', 'Qualifications &amp; Safeguarding')}
                        <ul class="space-y-3">
                            ${[
                              'Recognised federation coaching licences (UEFA, FIBA, UKSCA)',
                              'Annual safeguarding &amp; child protection certification',
                              'Current first aid and CPR for every staff member',
                              'Background-verified and DBS-equivalent checks',
                              'Continuing professional development each season',
                            ]
                              .map((t) => `<li class="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300"><i class="fa-solid fa-circle-check text-blue-500 mt-1"></i><span>${t}</span></li>`)
                              .join('\n                            ')}
                        </ul>
                    </div>
                </div>
            </div>
        </section>`,
    `
        <!-- SECTION 4: PHILOSOPHY -->
        <section class="py-20 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                ${head('How We Coach', 'Our Coaching Philosophy', 'Four principles that shape every session we run.')}
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    ${[
                      ['fa-heart', 'Safety Before Performance', 'Correct technique and injury prevention are non-negotiable. We never progress an athlete past what their body is ready for.'],
                      ['fa-users', 'Small Groups', 'Capped at eight to ten athletes per group so every player gets real coaching time rather than queueing.'],
                      ['fa-comments', 'Positive Reinforcement', 'We correct technique firmly but always frame feedback around what the athlete can do next.'],
                      ['fa-people-group', 'Parents Stay Informed', 'Written coach notes after every session and a monthly progress summary in the parent dashboard.'],
                    ]
                      .map(
                        ([icon, t, d]) => `
                    <div class="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 space-y-3">
                        <span class="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center text-lg"><i class="fa-solid ${icon}"></i></span>
                        <h3 class="font-bold text-slate-900 dark:text-white">${t}</h3>
                        <p class="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">${d}</p>
                    </div>`
                      )
                      .join('')}
                </div>
            </div>
        </section>`,
    `
        <!-- SECTION 5: JOIN THE TEAM -->
        <section class="py-20 bg-slate-50 dark:bg-slate-950">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <div class="space-y-6">
                        ${head('Careers', 'Coach With Champion Sports Academy')}
                        <p class="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">We recruit qualified coaches throughout the year to staff our multi-location hubs and build our home tuition network. If you hold a recognised licence and enjoy working with young athletes, we would like to meet you.</p>
                        <div class="flex flex-wrap gap-3">
                            ${btnPrimary('contact.html', 'Send Your CV', 'fa-paper-plane')}
                            ${btnGhost('locations.html', 'View Hub Locations')}
                        </div>
                    </div>
                    <div class="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                        <h3 class="text-lg font-bold text-slate-900 dark:text-white">What We Look For</h3>
                        ${[
                          'Recognised coaching licence in your discipline',
                          'At least one year of youth coaching experience',
                          'Strong communication with parents and players',
                          'A safeguarding and first-aid certification',
                        ]
                          .map(
                            (t) => `<div class="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                            <i class="fa-solid fa-star text-blue-500 text-xs mt-1"></i>
                            <span class="text-xs font-semibold text-slate-700 dark:text-slate-300">${t}</span>
                        </div>`
                          )
                          .join('\n                        ')}
                    </div>
                </div>
            </div>
        </section>`,
    cta(6, {
      title: 'Train With Our Coaches',
      sub: 'Book a trial session and meet the coach who will lead your child\u2019s group. No commitment required for the first visit.',
      img: IMG.p1,
      primary: btnPrimary('signup.html', 'Book a Trial Session', 'fa-user-plus'),
      secondary: btnGhost('contact.html', 'Contact the Academy'),
    }),
  ],
});

/* ================================================================== */
/*  BATCHES                                                            */
/* ================================================================== */
const batchRow = (code, name, slot, age, days, time, coach, seats, price) => `
                        <tr class="border-t border-slate-200 dark:border-slate-700 hover:bg-blue-50/50 dark:hover:bg-slate-800/50 transition-colors">
                            <td class="p-4">
                                <span class="font-bold block text-slate-900 dark:text-white">${code}</span>
                                <span class="text-[10px] text-blue-600 dark:text-sky-400 font-bold">${name}</span>
                            </td>
                            <td class="p-4 text-slate-600 dark:text-slate-400 text-sm">${age}</td>
                            <td class="p-4 text-slate-600 dark:text-slate-400 text-sm">${days}</td>
                            <td class="p-4 text-slate-600 dark:text-slate-400 text-sm">${time}</td>
                            <td class="p-4 text-slate-600 dark:text-slate-400 text-sm">${coach}</td>
                            <td class="p-4">
                                <span class="px-2 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-md text-[10px] font-bold">${seats} / 15 Seats Left</span>
                            </td>
                            <td class="p-4 font-bold text-blue-600 dark:text-sky-400 text-sm">${price}</td>
                            <td class="p-4">
                                <a href="signup.html?batch=${code}" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-[10px] uppercase tracking-wider shadow-md inline-block">Enroll</a>
                            </td>
                        </tr>`;

page({
  file: 'batches.html',
  title: 'Batch Timings & Fees | Champion Sports Academy',
  desc: 'Weekly batch schedules, age groups, coach assignments and monthly fees for football, basketball and athletics at Champion Sports Academy.',
  sections: [
    hero(1, {
      kicker: 'Weekly Schedule',
      title: 'Batch <span class="text-sky-400">Timings</span>',
      sub: 'Live seat availability across all hubs. Groups are capped at fifteen athletes so every player gets individual attention.',
      img: IMG.stadium,
      bg: 'batches',
      alt: 'Floodlit pitch ready for an evening training batch',
      primary: btnPrimary('signup.html', 'Reserve a Seat', 'fa-user-plus'),
      secondary: btnGhost('contact.html', 'Ask About a Batch'),
    }),
    `
        <!-- SECTION 2: WEEKLY SCHEDULE -->
        <section class="py-20 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                ${head('Current Timetable', 'Weekly Batch Schedule', 'Weekday and weekend groups available at all hubs, plus dedicated home tuition slots.')}
                <div class="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <table class="w-full min-w-[900px] text-left">
                        <caption class="sr-only">Weekly batch schedule with codes, age groups, days, times, coaches, seat availability and monthly fees</caption>
                        <thead class="bg-blue-50 dark:bg-slate-800 text-[10px] uppercase tracking-widest text-slate-600 dark:text-slate-300">
                            <tr>
                                <th scope="col" class="p-4">Batch</th>
                                <th scope="col" class="p-4">Age Group</th>
                                <th scope="col" class="p-4">Days</th>
                                <th scope="col" class="p-4">Time</th>
                                <th scope="col" class="p-4">Coach</th>
                                <th scope="col" class="p-4">Seats</th>
                                <th scope="col" class="p-4">Fee</th>
                                <th scope="col" class="p-4"><span class="sr-only">Action</span></th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-200 dark:divide-slate-700">
${batchRow('FB-101', 'Football', 'Morning', '6 - 9 Yrs (Beginner)', 'Mon, Wed, Fri', '4:00 PM - 5:15 PM', 'Coach Marcus Vance', '12', '$120')}
${batchRow('FB-204', 'Football', 'Evening', '9 - 13 Yrs (Intermediate)', 'Tue, Thu, Sat', '5:00 PM - 6:30 PM', 'Coach David Miller', '4', '$110')}
${batchRow('BK-202', 'Basketball', 'Evening', '9 - 13 Yrs (Intermediate)', 'Tue, Thu, Sat', '5:00 PM - 6:30 PM', 'Coach Aisha Rahman', '8', '$110')}
${batchRow('BK-310', 'Basketball', 'Weekend', '13 - 17 Yrs (Advanced)', 'Sat, Sun', '8:00 AM - 10:00 AM', 'Coach Daniel Okafor', '3', '$130')}
${batchRow('AT-303', 'Athletics', 'Morning', '10 - 14 Yrs (Intermediate)', 'Mon, Wed, Fri', '6:00 AM - 7:15 AM', 'Coach Priya Nair', '9', '$95')}
${batchRow('AT-115', 'Athletics', 'Morning', '6 - 9 Yrs (Beginner)', 'Tue, Thu', '6:00 AM - 7:00 AM', 'Coach Priya Nair', '11', '$95')}
${batchRow('HT-901', 'Home Tuition', 'Flexible', 'All Ages (1-on-1)', 'Flexible', 'By Arrangement', 'Assigned Coach', '6', '$180')}
                        </tbody>
                    </table>
                </div>
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-4"><i class="fa-solid fa-circle-info text-blue-500 mr-1"></i>Seat counts update as enrollments are confirmed. Contact us for a current availability check.</p>
            </div>
        </section>`,
    `
        <!-- SECTION 3: HOW ENROLLMENT WORKS -->
        <section class="py-20 bg-slate-50 dark:bg-slate-950">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                ${head('Simple Process', 'How Enrollment Works', 'Four straightforward steps from first enquiry to your first session.')}
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    ${[
                      ['fa-comment-dots', 'Enquire Online', 'Send us your child\u2019s age, sport and preferred hub through the signup form.'],
                      ['fa-clipboard-list', 'Level Assessment', 'We run a short, no-cost assessment to confirm the right level and group.'],
                      ['fa-file-signature', 'Confirm &amp; Pay', 'Receive your batch code and secure monthly payment instructions.'],
                      ['fa-futbol', 'First Session', 'Meet your coach, receive your kit and start training that week.'],
                    ]
                      .map(
                        ([icon, t, d], i) => `
                    <div class="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                        <span class="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center text-lg font-black">${String(i + 1).padStart(2, '0')}</span>
                        <h3 class="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2"><i class="fa-solid ${icon} text-blue-500"></i>${t}</h3>
                        <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">${d}</p>
                    </div>`
                      )
                      .join('')}
                </div>
            </div>
        </section>`,
    `
        <!-- SECTION 4: FEES INCLUDED -->
        <section class="py-20 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
                    <div class="space-y-6">
                        ${head('Transparent Pricing', 'What Your Monthly Fee Includes', 'No hidden charges, no kit surcharges, no session booking fees.')}
                        <ul class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            ${[
                              'All scheduled group sessions',
                              'Coach progress notes each month',
                              'Access to parent dashboard',
                              'Assessment &amp; level reviews',
                              'Loan training kit',
                              'Match &amp; tournament entry',
                            ]
                              .map(
                                (t) => `<li class="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300"><i class="fa-solid fa-check text-blue-500"></i>${t}</li>`
                              )
                              .join('\n                            ')}
                        </ul>
                    </div>
                    <div class="grid grid-cols-1 gap-4">
<img src="${U(LOCAL.agilityDrill)}" alt="Coach taking a group through a training drill" class="w-full h-56 object-cover rounded-3xl shadow-lg" loading="lazy">
<img src="${U(LOCAL.teamStrategy)}" alt="Young athletes in academy training kit going through a plan with their coach" class="w-full h-56 object-cover rounded-3xl shadow-lg" loading="lazy">
                    </div>
                </div>
            </div>
        </section>`,
    `
        <!-- SECTION 5: FAQs -->
        <section class="py-20 bg-slate-50 dark:bg-slate-950">
            <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                ${head('Common Questions', 'Batch FAQs', 'The questions parents ask us most often before enrolling.')}
                <div class="space-y-3">
                    ${[
                        ['Can we switch batches mid-season?', 'Yes. Provided a space is available in your target batch we can move you at the start of any month. Fees are pro-rated.'],
                        ['Do you coach complete beginners?', 'Absolutely. Our foundation groups for ages 5 to 8 start from basic movement and ball familiarity.'],
                        ['Is a trial session available?', 'Yes, the first session is free of charge for every new athlete so you can meet the coach first.'],
                        ['What is your refund policy?', 'Monthly fees are refundable pro-rata with two weeks notice. Tournament entry fees are non-refundable once entered.'],
                        ['Can we pause during exam season?', 'Yes. Tell your coach in advance and we will hold your place for up to eight weeks.'],
                    ]
                      .map(
                        ([q, a]) => `
                    <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                        <button type="button" class="accordion-header w-full flex items-center justify-between gap-4 p-5 text-left hover:bg-blue-50/60 dark:hover:bg-slate-800/60 transition-colors">
                            <span class="text-sm font-bold text-slate-900 dark:text-white">${q}</span>
                            <i class="fa-solid fa-chevron-down accordion-icon text-blue-500 text-xs transition-transform shrink-0"></i>
                        </button>
                        <div class="hidden px-5 pb-5 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">${a}</div>
                    </div>`
                      )
                      .join('')}
                </div>
            </div>
        </section>`,
    cta(6, {
      title: 'Claim Your Seat This Week',
      sub: 'Batches with fewer than four seats remaining are usually full within days. Register your child online to lock in a place.',
      img: LOCAL.footballWide,
      primary: btnPrimary('signup.html', 'Enroll Online Now', 'fa-user-plus'),
      secondary: btnGhost('contact.html', 'Check Availability'),
    }),
  ],
});

/* ================================================================== */
/*  BLOG                                                               */
/* ================================================================== */
const postCard = (id, cat, title, img, alt, date, excerpt) => `
                    <article class="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-lg border border-slate-100 dark:border-slate-800 hover:shadow-2xl transition-all duration-300 flex flex-col">
                        <div class="relative h-48 overflow-hidden">
                            <img src="${U(img, 600)}" alt="${alt}" class="w-full h-full object-cover transition-transform duration-500 hover:scale-110" loading="lazy">
                        </div>
                        <div class="p-6 space-y-3 flex flex-col flex-grow">
                            <div class="flex items-center justify-between gap-3">
                                <span class="text-[10px] font-bold uppercase text-blue-600 dark:text-sky-400 bg-blue-50 dark:bg-blue-900/40 px-2.5 py-1 rounded-md">${cat}</span>
                                <span class="text-[10px] text-slate-500 dark:text-slate-400">${date}</span>
                            </div>
                            <h3 class="text-base font-bold text-slate-900 dark:text-white leading-snug">${title}</h3>
                            <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed flex-grow">${excerpt}</p>
                            <a href="blog-details.html?id=${id}" class="inline-flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-sky-400 hover:underline">
                                Read Article <i class="fa-solid fa-arrow-right text-[10px]"></i>
                            </a>
                        </div>
                    </article>`;

page({
  file: 'blog.html',
  title: 'Blog & News | Champion Sports Academy',
  desc: 'Training tips, coaching insights and academy news from the coaches at Champion Sports Academy on youth sport development.',
  sections: [
    hero(1, {
      kicker: 'Insights &amp; Guidance',
      title: 'Academy <span class="text-sky-400">Blog</span>',
      sub: 'Practical coaching advice, athlete development insight and news from our hubs &mdash; written by the coaches who train our players.',
      img: IMG.stadium,
      bg: 'blog',
      alt: 'Youth sports training in progress at an academy hub',
      primary: btnPrimary('blog-details.html', 'Read Featured Article'),
      secondary: btnGhost('contact.html', 'Suggest a Topic'),
    }),
    `
        <!-- SECTION 2: FEATURED POST -->
        <section class="py-20 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                ${head('Editor\u2019s Pick', 'Featured This Month', 'Our most-read article, chosen by the coaching team.')}
                <article class="grid grid-cols-1 lg:grid-cols-2 gap-0 bg-slate-50 dark:bg-slate-800/60 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-lg">
                    <img src="${U(LOCAL.footballWide)}" alt="Coach running a structured training session with young players" class="w-full h-64 lg:h-full object-cover" loading="lazy">
                    <div class="p-8 lg:p-10 space-y-4 flex flex-col justify-center">
                        <span class="inline-flex self-start px-3 py-1 rounded-full bg-blue-600 text-white text-[10px] font-bold uppercase tracking-widest">Featured</span>
                        <h3 class="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white uppercase leading-tight">
                            The 5 Routines That Build a Match-Winning Footballer
                        </h3>
                        <p class="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                            Technique alone will not carry a young player to the next level. Coach Marcus Vance breaks down the five repeatable
                            routines his academy players run every week &mdash; and how to progress each one safely by age.
                        </p>
                        <div class="flex items-center gap-3 pt-2">
                            <img src="${U(IMG.p1, 200)}" alt="Portrait of Coach Marcus Vance" class="w-10 h-10 rounded-full object-cover" loading="lazy">
                            <div>
                                <span class="block text-xs font-bold text-slate-900 dark:text-white">Coach Marcus Vance</span>
                                <span class="block text-[10px] text-slate-500 dark:text-slate-400">Child Development &middot; Sep 24, 2026</span>
                            </div>
                        </div>
                        <a href="blog-details.html?id=1" class="inline-flex items-center gap-2 self-start mt-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-colors">
                            Read Full Article <i class="fa-solid fa-arrow-right text-[10px]"></i>
                        </a>
                    </div>
                </article>
            </div>
        </section>`,
    `
        <!-- SECTION 3: LATEST ARTICLES -->
        <section class="py-20 bg-slate-50 dark:bg-slate-950">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                ${head('Fresh From The Coaches', 'Latest Articles', 'New writing added every fortnight across all three disciplines.')}
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
${postCard(2, 'Basketball', 'Building Fast-Break Instincts in Young Players', IMG.basketball, 'Young basketball players running a fast-break drill', 'Sep 18, 2026', 'Speed in transition is a skill, not an inherited trait. Here is how we build it from age nine.')}
${postCard(3, 'Athletics', 'Why Sprint Frequency Beats Sprint Distance', IMG.track, 'Young sprinter accelerating away from the starting blocks', 'Sep 11, 2026', 'Short, sharp speed work done often outperforms long, slow sessions for developing athletes.')}
${postCard(4, 'Tournament News', 'Westside Hub Cup: Our U12 Squad Qualifies', LOCAL.floodlitPitch, 'Floodlit pitch during a youth tournament evening', 'Sep 04, 2026', 'Three academy squads advance to the regional round after a strong group stage.')}
${postCard(5, 'Nutrition', 'What Should a 10-Year-Old Eat Before Training?', LOCAL.sprinter, 'Young athlete preparing for a training session', 'Aug 28, 2026', 'A practical guide to pre-session fuel that avoids the common mistakes we see most weeks.')}
${postCard(6, 'Injury Prevention', 'The Warm-Up Routine We Insist On', IMG.football, 'Players going through a structured warm-up routine', 'Aug 21, 2026', 'Ten minutes that prevent the majority of the soft-tissue injuries we see each season.')}
${postCard(7, 'Training', 'Home Tuition: Coaching Without a Pitch', LOCAL.homeCoach, 'Coach running a one-to-one home coaching session', 'Aug 14, 2026', 'How our home coaching network adapts technical sessions for small spaces and shared grounds.')}
                </div>
            </div>
        </section>`,
    `
        <!-- SECTION 4: CATEGORIES -->
        <section class="py-20 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                ${head('Browse By Topic', 'Article Categories', 'Jump straight to the area you are most interested in.')}
                <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    ${[
                      ['fa-futbol', 'Football', '12 articles'],
                      ['fa-basketball-ball', 'Basketball', '9 articles'],
                      ['fa-person-running', 'Athletics', '8 articles'],
                      ['fa-heart-pulse', 'Injury Prevention', '7 articles'],
                      ['fa-utensils', 'Nutrition', '6 articles'],
                      ['fa-trophy', 'Tournaments', '11 articles'],
                    ]
                      .map(
                        ([icon, t, c]) => `
                    <a href="blog.html" class="group bg-slate-50 dark:bg-slate-800/60 hover:bg-blue-600 dark:hover:bg-blue-600 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 text-center transition-all duration-300 hover:-translate-y-1">
                        <i class="fa-solid ${icon} text-2xl text-blue-600 dark:text-sky-400 group-hover:text-white mb-3 block"></i>
                        <span class="block text-sm font-bold text-slate-900 dark:text-white group-hover:text-white">${t}</span>
                        <span class="block text-[10px] text-slate-500 dark:text-slate-400 group-hover:text-blue-100 mt-1">${c}</span>
                    </a>`
                      )
                      .join('')}
                </div>
            </div>
        </section>`,
    `
        <!-- SECTION 5: NEWSLETTER -->
        <section class="py-20 bg-slate-50 dark:bg-slate-950">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <div class="space-y-6">
                        ${head('Stay Updated', 'Get The Newsletter')}
                        <p class="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">One email a fortnight with training tips, batch availability and tournament results. No spam, unsubscribe any time.</p>
                        <form onsubmit="event.preventDefault(); showToast('Subscribed to the academy newsletter!', 'success');" class="flex flex-col sm:flex-row gap-3 max-w-lg">
                            <label for="blog-newsletter-email" class="sr-only">Email address</label>
                            <input id="blog-newsletter-email" type="email" required placeholder="parent@example.com" class="flex-grow px-4 py-3 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none">
                            <button type="submit" class="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-colors shrink-0">Subscribe</button>
                        </form>
                    </div>
                    <div class="grid grid-cols-3 gap-4 text-center">
                        ${[
                          ['53', 'Articles Published'],
                          ['2,400', 'Newsletter Readers'],
                          ['14', 'Topics Covered'],
                        ]
                          .map(
                            ([n, l]) => `
                        <div class="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                            <span class="block text-3xl font-black text-blue-600 dark:text-sky-400">${n}</span>
                            <span class="block text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-2">${l}</span>
                        </div>`
                          )
                          .join('')}
                    </div>
                </div>
            </div>
        </section>`,
    cta(6, {
      title: 'Ready For Your First Session?',
      sub: 'Reading is a start &mdash; the fastest way to improve is on the pitch. Book a free trial session with one of our coaches.',
      img: LOCAL.worldCup,
      primary: btnPrimary('signup.html', 'Book a Free Trial', 'fa-user-plus'),
      secondary: btnGhost('coaches.html', 'Meet The Coaches'),
    }),
  ],
});

/* ================================================================== */
/*  BLOG DETAILS                                                       */
/* ================================================================== */
const relatedRow = (id, title, cat, img, alt) => `
                    <a href="blog-details.html?id=${id}" class="group p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-blue-400 transition-all space-y-3">
                        <img src="${U(img, 400)}" alt="${alt}" class="w-full h-32 object-cover rounded-xl" loading="lazy">
                        <span class="block text-[10px] font-bold uppercase text-blue-600 dark:text-sky-400">${cat}</span>
                        <span class="block text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors leading-snug">${title}</span>
                    </a>`;

page({
  file: 'blog-details.html',
  title: 'The 5 Routines That Build a Match-Winning Footballer | Champion Sports Academy',
  desc: 'Coach Marcus Vance breaks down the five repeatable football training routines used by academy players at Champion Sports Academy.',
  sections: [
    hero(1, {
      kicker: 'Child Development',
      title: 'The 5 Routines That Build a <span class="text-sky-400">Match-Winner</span>',
      sub: 'Technique drills are not enough. These are the five weekly routines we run in every football group, and how to progress them safely by age.',
      img: IMG.football2,
      alt: 'Football coach running a training session with young players',
      primary: btnPrimary('signup.html', 'Join a Football Batch', 'fa-user-plus'),
      secondary: btnGhost('blog.html', 'All Articles'),
    }),
    `
        <!-- SECTION 2: ARTICLE META -->
        <section class="py-12 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
            <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                    <div class="flex items-center gap-4">
                        <img src="${U(IMG.p1, 200)}" alt="Portrait of Coach Marcus Vance" class="w-14 h-14 rounded-full object-cover" loading="lazy">
                        <div>
                            <span class="block text-xs font-bold text-slate-900 dark:text-white">Coach Marcus Vance</span>
                            <span class="block text-[10px] text-slate-500 dark:text-slate-400">Head Football Coach &middot; UEFA B Licensed</span>
                        </div>
                    </div>
                    <div class="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 dark:text-slate-400">
                        <span><i class="fa-regular fa-calendar text-blue-500 mr-1"></i> September 24, 2026</span>
                        <span><i class="fa-regular fa-clock text-blue-500 mr-1"></i> 8 min read</span>
                        <span class="px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-bold">Child Development</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <button type="button" onclick="showToast('Link copied to clipboard!', 'info')" aria-label="Copy article link" class="w-9 h-9 rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center text-xs"><i class="fa-solid fa-link"></i></button>
                        <button type="button" onclick="showToast('Thanks for sharing!', 'success')" aria-label="Share article" class="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-blue-600 hover:text-white text-slate-600 dark:text-slate-200 flex items-center justify-center text-xs"><i class="fa-solid fa-share-nodes"></i></button>
                    </div>
                </div>
            </div>
        </section>`,
    `
        <!-- SECTION 3: ARTICLE BODY -->
        <section class="py-16 bg-white dark:bg-slate-900">
            <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
                <p class="text-base text-slate-700 dark:text-slate-300 leading-relaxed">
                    Every week a parent asks us the same question: <em>what is my child actually doing in training?</em> Most sessions
                    look like a lot of shuffling, passing and shooting &mdash; but behind it sits a deliberate structure. These are
                    the five routines that structure every football group we run, from the foundation squad to the elite pathway.
                </p>
                <h3 class="text-xl font-extrabold text-slate-900 dark:text-white uppercase pt-4">1. The Ball Mastery Circuit</h3>
                <p class="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    Ten minutes, every session, on the footwork patterns that separate a confident dribbler from an unsure one.
                    We work both feet, both directions, and we keep the ball close. It feels repetitive to children &mdash; and that is
                    the point. Repetition under low pressure is how technique becomes automatic.
                </p>
                <img src="${U(IMG.football, 900)}" alt="Young players completing a ball mastery drill on the pitch" class="w-full h-72 object-cover rounded-3xl shadow-md" loading="lazy">
                <h3 class="text-xl font-extrabold text-slate-900 dark:text-white uppercase pt-4">2. Rondo &amp; Possession Pressure</h3>
                <p class="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    A small-sided possession game where the team wins points by keeping the ball rather than scoring. It forces
                    scanning, support angles and decision making &mdash; the parts of football that do not show up in highlights but
                    decide matches. We run it from 3v1 up to 5v2 as players progress.
                </p>
                <h3 class="text-xl font-extrabold text-slate-900 dark:text-white uppercase pt-4">3. The Finishing Ladder</h3>
                <p class="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    A progressive set of finishing stations: static target, moving target, angle, then pressure. Coaches correct the
                    strike &mdash; plant foot, lock ankle, follow through &mdash; rather than simply asking for more shots. Athletes who
                    take twenty deliberate finishes finish far better than athletes who take forty hopeful ones.
                </p>
                <h3 class="text-xl font-extrabold text-slate-900 dark:text-white uppercase pt-4">4. Transition Speed Work</h3>
                <p class="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    Recovery, accelerate, reset. Short bursts with full recovery teach young players to repeat an effort without
                    degrading. We cap the volume carefully by age group, because this is where overuse injuries begin if it is
                    mishandled.
                </p>
                <h3 class="text-xl font-extrabold text-slate-900 dark:text-white uppercase pt-4">5. Weekly Match Fixture</h3>
                <p class="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    Everything above only transfers under pressure, so every group finishes the week with a real match. Coaches take
                    notes on positioning and decision making, and those notes are what we send home in the parent dashboard.
                </p>
            </div>
        </section>`,
    `
        <!-- SECTION 4: KEY TAKEAWAYS -->
        <section class="py-16 bg-slate-50 dark:bg-slate-950">
            <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-8 lg:p-10">
                    <span class="inline-flex items-center gap-2 text-blue-600 dark:text-sky-400 text-xs font-bold uppercase tracking-widest mb-4">
                        <i class="fa-solid fa-list-check"></i>Key Takeaways
                    </span>
                    <h2 class="text-2xl font-extrabold text-slate-900 dark:text-white uppercase mb-6">What To Remember</h2>
                    <ul class="space-y-4">
                        ${[
                          'Structure beats variety &mdash; the same five routines every week build reliable players.',
                          'Repetition under low pressure is what makes technique automatic.',
                          'Possession games develop the decision making that highlights never show.',
                          'Volume of high-speed work must be capped and progressed carefully by age.',
                          'Nothing transfers without match play, and match play is what coaches write home about.',
                        ]
                          .map(
                            (t) => `<li class="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300"><i class="fa-solid fa-circle-check text-blue-500 mt-1"></i><span>${t}</span></li>`
                          )
                          .join('\n                        ')}
                    </ul>
                </div>
            </div>
        </section>`,
    `
        <!-- SECTION 5: RELATED ARTICLES -->
        <section class="py-20 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                ${head('Keep Reading', 'Related Articles', 'More from our coaching team this fortnight.')}
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
${relatedRow(2, 'Building Fast-Break Instincts in Young Players', 'Basketball', IMG.basketball, 'Young basketball players running a fast-break drill')}
${relatedRow(5, 'What Should a 10-Year-Old Eat Before Training?', 'Nutrition', IMG.child, 'Young athlete preparing for a training session')}
${relatedRow(6, 'The Warm-Up Routine We Insist On', 'Injury Prevention', IMG.football, 'Players going through a structured warm-up routine')}
                </div>
            </div>
        </section>`,
    cta(6, {
      title: 'Put These Routines Into Practice',
      sub: 'Join one of our football batches and your child will be running the same five routines from week one.',
      img: IMG.football,
      primary: btnPrimary('signup.html', 'Enroll In Football', 'fa-user-plus'),
      secondary: btnGhost('blog.html', 'Back To Blog'),
    }),
  ],
});

/* ================================================================== */
/*  COACH DETAILS                                                       */
/* ================================================================== */
page({
  file: 'coach-details.html',
  title: 'Coach Profile | Champion Sports Academy',
  desc: 'Full coaching profile including qualifications, philosophy, achievements and session availability at Champion Sports Academy.',
  sections: [
    hero(1, {
      kicker: 'Coaching Staff',
      title: 'Coach <span class="text-sky-400">Profile</span>',
      sub: 'Qualifications, coaching philosophy, competitive record and current session availability.',
      img: IMG.football2,
      alt: 'Coach leading a training session on the pitch',
      primary: btnPrimary('batches.html', 'View Availability'),
      secondary: btnGhost('coaches.html', 'All Coaches'),
    }),
    `
        <!-- SECTION 2: PROFILE AND CREDENTIALS -->
        <section class="py-20 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                    <div class="lg:col-span-4 text-center">
                        <img id="coach-img" src="${U(IMG.p1, 600)}" alt="Coach Marcus Vance, Head Football Coach" class="w-44 h-44 rounded-3xl object-cover border-4 border-blue-600 shadow-lg mx-auto" loading="lazy">
                        <div class="mt-6 space-y-2">
                            <h2 id="coach-name" class="text-2xl font-black text-slate-900 dark:text-white uppercase">Marcus Vance</h2>
                            <div class="inline-block px-3 py-1 bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-bold rounded-full uppercase" id="coach-sport-badge">Football</div>
                            <p id="coach-title" class="text-sm text-blue-600 dark:text-sky-400 font-bold">UEFA B Licensed Coach &amp; Youth Tactical Specialist</p>
                        </div>
                        <a href="signup.html" class="mt-6 inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-6 py-3 rounded-xl shadow-md transition-colors">Enroll Under This Coach</a>
                    </div>
                    <div class="lg:col-span-8 space-y-6">
                        ${head('Qualifications', 'Credentials &amp; Experience', 'Verified qualifications held current by the academy operations team.')}
                        <ul class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            ${[
                              'UEFA B Licence &mdash; Football Coaching',
                              'FA Level 3 Pitch &amp; Venue First Aid',
                              'Safeguarding &amp; Child Protection (Annual)',
                              'B.Sc Physical Education &amp; Sports Science',
                              '12 seasons coaching ages 6&ndash;17',
                              'Former semi-professional player',
                            ]
                              .map(
                                (t) => `<li class="flex items-start gap-2 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300"><i class="fa-solid fa-award text-blue-500 mt-0.5"></i>${t}</li>`
                              )
                              .join('\n                            ')}
                        </ul>
                        <p class="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                            Marcus has coached at Champion Sports Academy since the Westside hub opened, leading both the
                            development and elite football pathways. He currently oversees the U12 squad that qualified for the
                            regional cup.
                        </p>
                    </div>
                </div>
            </div>
        </section>`,
    `
        <!-- SECTION 3: COACHING APPROACH -->
        <section class="py-20 bg-slate-50 dark:bg-slate-950">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
                    <img src="${U(IMG.football, 800)}" alt="Coach demonstrating a technical drill to young players" class="w-full h-80 object-cover rounded-3xl shadow-lg" loading="lazy">
                    <div class="space-y-6">
                        ${head('Method', 'Coaching Approach', 'How this coach structures a session and develops individual players.')}
                        <ol class="space-y-4">
                            ${[
                              ['Assess', 'A short technical and movement screen in week one, repeated each term to track real progress.'],
                              ['Plan', 'A written session plan with two measurable targets per athlete, shared with parents.'],
                              ['Deliver', 'Small-group ratios, lots of ball contact, and corrections given in one clear instruction.'],
                              ['Review', 'Written coach notes after every session, plus a monthly progress summary.'],
                            ]
                              .map(
                                ([t, d], i) => `
                            <li class="flex gap-4">
                                <span class="w-9 h-9 shrink-0 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-sm">${i + 1}</span>
                                <div><h3 class="font-bold text-slate-900 dark:text-white text-sm">${t}</h3><p class="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">${d}</p></div>
                            </li>`
                              )
                              .join('')}
                        </ol>
                    </div>
                </div>
            </div>
        </section>`,
    `
        <!-- SECTION 4: ACHIEVEMENTS -->
        <section class="py-20 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                ${head('Track Record', 'Competitive Achievements', 'Results achieved by squads coached by this coach.')}
                <div class="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
                    ${[
                      ['6', 'Regional Titles'],
                      ['14', 'Tournament Finals'],
                      ['38', 'Players Selected'],
                      ['12', 'Seasons Coaching'],
                    ]
                      .map(
                        ([n, l]) => `
                    <div class="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-8 border border-slate-200 dark:border-slate-700">
                        <span class="block text-4xl font-black text-blue-600 dark:text-sky-400">${n}</span>
                        <span class="block text-[10px] uppercase tracking-widest text-slate-500 dark:text-slate-400 mt-2">${l}</span>
                    </div>`
                      )
                      .join('')}
                </div>
            </div>
        </section>`,
    `
        <!-- SECTION 5: AVAILABILITY -->
        <section class="py-20 bg-slate-50 dark:bg-slate-950">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                ${head('Current Slots', 'Session Availability', 'Live seat counts for the batches this coach leads.')}
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    ${[
                        ['FB-101', 'Football &middot; Ages 6&ndash;9', 'Mon, Wed, Fri &middot; 4:00 PM', '12'],
                        ['FB-204', 'Football &middot; Ages 9&ndash;13', 'Tue, Thu, Sat &middot; 5:00 PM', '4'],
                        ['HT-901', 'Home Tuition &middot; 1-on-1', 'Flexible &middot; By arrangement', '6'],
                    ]
                      .map(
                        ([code, label, when, seats]) => `
                    <div class="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                        <div class="flex items-center justify-between">
                            <span class="font-black text-slate-900 dark:text-white">${code}</span>
                            <span class="px-2 py-1 bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-md text-[10px] font-bold">${seats} Seats Left</span>
                        </div>
                        <p class="text-xs text-blue-600 dark:text-sky-400 font-semibold">${label}</p>
                        <p class="text-xs text-slate-600 dark:text-slate-400">${when}</p>
                        <a href="signup.html?batch=${code}" class="block w-full text-center py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-colors">Enroll Now</a>
                    </div>`
                      )
                      .join('')}
                </div>
            </div>
        </section>`,
    cta(6, {
      title: 'Train With This Coach',
      sub: 'Book a free trial session to meet the coach and confirm the right level for your child before you commit.',
      img: IMG.football2,
      primary: btnPrimary('signup.html', 'Book a Free Trial', 'fa-user-plus'),
      secondary: btnGhost('batches.html', 'See All Batches'),
    }),
  ],
});

/* ================================================================== */
/*  CONTACT                                                            */
/* ================================================================== */
page({
  file: 'contact.html',
  title: 'Contact Us | Champion Sports Academy',
  desc: 'Get in touch with Champion Sports Academy about batches, locations, fees and enrollment. Call, email, message or visit a hub.',
  sections: [
    hero(1, {
      kicker: 'Get In Touch',
      title: 'Contact <span class="text-sky-400">Us</span>',
      sub: 'Questions about batches, fees, locations or enrollment? Our team replies within one working day.',
      img: IMG.stadium,
      bg: 'contact',
      alt: 'Sports academy hub with floodlit pitch at dusk',
      primary: btnPrimary('contact.html#contact-form', 'Send a Message', 'fa-paper-plane'),
      secondary: btnGhost('locations.html', 'Find a Hub'),
    }),
    `
        <!-- SECTION 2: CONTACT METHODS -->
        <section class="py-20 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                ${head('Reach Us', 'How To Contact Us', 'Four ways to get in touch &mdash; whichever suits you best.')}
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    ${[
                        ['fa-location-dot', 'Visit a Hub', 'Westside, Northgate, Riverside and Eastfield hubs. Open 7 days, 6am&ndash;9pm.'],
                        ['fa-phone', 'Call Us', '+1 (555) 000-0000<br>Mon&ndash;Sat, 7am&ndash;8pm'],
                        ['fa-envelope', 'Email Us', 'hello@championsportsacademy.com<br>Replies within one working day'],
                        ['fa-comments', 'Live Chat', 'Weekday evenings 5pm&ndash;8pm<br>Fastest response times'],
                    ]
                      .map(
                        ([icon, t, d]) => `
                    <div class="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 space-y-3 text-center">
                        <span class="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center text-lg mx-auto"><i class="fa-solid ${icon}"></i></span>
                        <h3 class="font-bold text-slate-900 dark:text-white text-sm">${t}</h3>
                        <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">${d}</p>
                    </div>`
                      )
                      .join('')}
                </div>
            </div>
        </section>`,
    `
        <!-- SECTION 3: CONTACT FORM -->
        <section class="py-20 bg-slate-50 dark:bg-slate-950" id="contact-form">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                    <div class="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
                        <h2 class="text-xl font-extrabold text-slate-900 dark:text-white uppercase mb-6">Send Us a Message</h2>
                        <form onsubmit="event.preventDefault(); showToast('Thanks! Your message has been sent.', 'success'); this.reset();" class="space-y-4" novalidate>
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label for="contact-name" class="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1.5">Full Name</label>
                                    <input type="text" id="contact-name" name="name" required placeholder="e.g. Sarah Jenkins" class="w-full p-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none">
                                </div>
                                <div>
                                    <label for="contact-phone" class="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1.5">Phone</label>
                                    <input type="tel" id="contact-phone" name="phone" required placeholder="+1 (555) 000-0000" class="w-full p-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none">
                                </div>
                            </div>
                            <div>
                                <label for="contact-email" class="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1.5">Email Address</label>
                                <input type="email" id="contact-email" name="email" required placeholder="parent@example.com" class="w-full p-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none">
                            </div>
                            <div>
                                <label for="contact-topic" class="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1.5">Topic</label>
                                <select id="contact-topic" name="topic" class="w-full p-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium">
                                    <option>General enquiry</option>
                                    <option>Batch availability</option>
                                    <option>Fees &amp; payment</option>
                                    <option>Home tuition sessions</option>
                                    <option>Coaching careers</option>
                                </select>
                            </div>
                            <div>
                                <label for="contact-message" class="block text-xs font-bold uppercase text-slate-600 dark:text-slate-300 mb-1.5">Message</label>
                                <textarea id="contact-message" name="message" required rows="4" placeholder="Tell us your child's age, sport preference, and any questions..." class="w-full p-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"></textarea>
                            </div>
                            <button type="submit" class="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-2">
                                <i class="fa-solid fa-paper-plane"></i> Send Message
                            </button>
                        </form>
                    </div>
                    <div class="space-y-6">
                        <img src="${U(LOCAL.floodlitPitch)}" alt="Champion Sports Academy main training hub" class="w-full h-64 object-cover rounded-3xl shadow-lg" loading="lazy">
                        <div class="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                            <h3 class="font-bold text-slate-900 dark:text-white flex items-center gap-2"><i class="fa-solid fa-headset text-blue-500"></i>Office Hours</h3>
                            ${[
                                ['Monday &ndash; Friday', '7:00 AM &ndash; 8:00 PM'],
                                ['Saturday', '8:00 AM &ndash; 6:00 PM'],
                                ['Sunday', '9:00 AM &ndash; 2:00 PM'],
                            ]
                              .map(
                                ([d, h]) => `<div class="flex items-center justify-between text-xs border-b border-slate-100 dark:border-slate-800 pb-2 last:border-0 last:pb-0">
                                <span class="text-slate-600 dark:text-slate-400">${d}</span>
                                <span class="font-bold text-slate-900 dark:text-white">${h}</span>
                            </div>`
                              )
                              .join('\n                            ')}
                        </div>
                    </div>
                </div>
            </div>
        </section>`,
    `
        <!-- SECTION 4: LOCATIONS -->
        <section class="py-20 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                ${head('Our Hubs', 'Academy Locations', 'Four training hubs plus our city-wide home tuition network.')}
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    ${[
                        ['Westside Hub', '18 Kingsway West', 'Flagship &middot; Full turf, courts, gym'],
                        ['Northgate Hub', '204 Northgate Road', 'Indoor courts &amp; strength suite'],
                        ['Riverside Hub', '7 Riverside Park', 'Track &amp; field &amp; conditioning'],
                        ['Eastfield Hub', '55 Eastfield Lane', 'Floodlit turf &amp; skills centre'],
                    ]
                      .map(
                        ([name, addr, feat]) => `
                    <div class="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 space-y-2">
                        <h3 class="font-bold text-slate-900 dark:text-white text-sm">${name}</h3>
                        <p class="text-xs text-slate-600 dark:text-slate-400 flex items-start gap-2"><i class="fa-solid fa-location-dot text-blue-500 text-xs mt-0.5"></i>${addr}</p>
                        <p class="text-[10px] text-blue-600 dark:text-sky-400 font-semibold">${feat}</p>
                    </div>`
                      )
                      .join('')}
                </div>
            </div>
        </section>`,
    `
        <!-- SECTION 5: FIND US ON THE MAP -->
        <section class="py-20 bg-slate-50 dark:bg-slate-950" id="find-us-section">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                ${head('Where To Find Us', 'Find The Academy', 'Our flagship hub is the easiest to visit &mdash; free parking, floodlit pitches and viewing lounges on site.')}
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-stretch">
${mapDetails()}
${mapEmbed()}
                </div>
            </div>
        </section>`,
    `
        <!-- SECTION 6: FAQs -->
        <section class="py-20 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
            <div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                ${head('Before You Write', 'Quick Answers', 'These answer most of what parents get in touch about.')}
                <div class="space-y-3">
                    ${[
                        ['Do you offer free trial sessions?', 'Yes &mdash; every new athlete gets one free session so you can meet the coach before committing.'],
                        ['How quickly do you reply?', 'Messages sent during opening hours are answered the same working day, usually within two hours.'],
                        ['Can we visit a hub before enrolling?', 'Absolutely. Book a visit and we will give you a full tour of the facilities and training groups.'],
                        ['Do you coach adults too?', 'Our programmes are designed for ages 5&ndash;17. We can recommend a partner club for adult players.'],
                    ]
                      .map(
                        ([q, a]) => `
                    <div class="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                        <button type="button" class="accordion-header w-full flex items-center justify-between gap-4 p-5 text-left hover:bg-blue-50/60 dark:hover:bg-slate-800/60 transition-colors">
                            <span class="text-sm font-bold text-slate-900 dark:text-white">${q}</span>
                            <i class="fa-solid fa-chevron-down accordion-icon text-blue-500 text-xs transition-transform shrink-0"></i>
                        </button>
                        <div class="hidden px-5 pb-5 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">${a}</div>
                    </div>`
                      )
                      .join('')}
                </div>
            </div>
        </section>`,
    cta(7, {
      title: 'Still Have Questions?',
      sub: 'Call us, email us, or send a message using the form above &mdash; whichever is easiest. We are happy to help you decide.',
      img: IMG.stadium,
      primary: btnPrimary('signup.html', 'Start Enrollment', 'fa-user-plus'),
      secondary: btnGhost('locations.html', 'View All Locations'),
    }),
  ],
});

/* ================================================================== */
/*  404                                                                */
/* ================================================================== */
page({
  file: '404.html',
  title: 'Page Not Found (404) | Champion Sports Academy',
  desc: 'The page you were looking for could not be found. Explore sports, batches, locations and coaching resources instead.',
  sections: [
    hero(1, {
      kicker: 'Error 404',
      title: 'Page <span class="text-sky-400">Not Found</span>',
      sub: 'The page you are looking for has moved or never existed. Use the links below to get back on track.',
      img: IMG.stadium,
      alt: 'Empty floodlit sports pitch at dusk',
      primary: btnPrimary('index.html', 'Back to Homepage', 'fa-house'),
      secondary: btnGhost('contact.html', 'Report a Broken Link'),
    }),
    `
        <!-- SECTION 2: WHAT WENT WRONG -->
        <section class="py-20 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
            <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
                ${head('Error Details', 'What Went Wrong', 'A short explanation of the most common causes.')}
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                    ${[
                        ['fa-link-slash', 'Outdated Link', 'The address may have changed when we reorganised the site.'],
                        ['fa-magnifying-glass', 'Typo in the Address', 'Check the spelling and try the search on our homepage.'],
                        ['fa-clock-rotate-left', 'Removed Content', 'Some legacy pages were retired. The replacements are linked below.'],
                    ]
                      .map(
                        ([icon, t, d]) => `
                    <div class="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 space-y-3">
                        <span class="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center"><i class="fa-solid ${icon}"></i></span>
                        <h3 class="font-bold text-slate-900 dark:text-white text-sm">${t}</h3>
                        <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">${d}</p>
                    </div>`
                      )
                      .join('')}
                </div>
            </div>
        </section>`,
    `
        <!-- SECTION 3: POPULAR PAGES -->
        <section class="py-20 bg-slate-50 dark:bg-slate-950">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                ${head('Shortcuts', 'Popular Pages', 'The pages most visitors were looking for.')}
                <div class="grid grid-cols-2 md:grid-cols-4 gap-5">
                    ${[
                        ['index.html', 'fa-house', 'Homepage'],
                        ['sports.html', 'fa-futbol', 'Sports Offered'],
                        ['batches.html', 'fa-calendar-days', 'Batch Timings'],
                        ['locations.html', 'fa-location-dot', 'Locations'],
                        ['coaches.html', 'fa-user-tie', 'Our Coaches'],
                        ['blog.html', 'fa-newspaper', 'Blog'],
                        ['contact.html', 'fa-envelope', 'Contact Us'],
                        ['signup.html', 'fa-user-plus', 'Enroll'],
                    ]
                      .map(
                        ([href, icon, t]) => `
                    <a href="${href}" class="group bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:border-blue-400 hover:-translate-y-1 transition-all text-center">
                        <i class="fa-solid ${icon} text-2xl text-blue-600 dark:text-sky-400 group-hover:text-blue-500 mb-3 block"></i>
                        <span class="block text-xs font-bold text-slate-900 dark:text-white">${t}</span>
                    </a>`
                      )
                      .join('')}
                </div>
            </div>
        </section>`,
    `
        <!-- SECTION 4: POPULAR SPORTS -->
        <section class="py-20 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                ${head('What We Offer', 'Explore Our Programmes', 'Jump straight into a discipline if you were looking for training details.')}
                <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
${[
  ['Football', IMG.football, 'fa-futbol', 'Technical mastery, tactical shape and match conditioning for ages 5 to 17.'],
  ['Basketball', IMG.basketball, 'fa-basketball-ball', 'Ball handling, footwork and team offence in a year-round indoor court environment.'],
  ['Athletics', IMG.track, 'fa-person-running', 'Sprint technique, endurance development and race-specific preparation.'],
]
  .map(
    ([name, img, icon, d]) => `
                    <a href="sports.html" class="group bg-slate-50 dark:bg-slate-800/60 rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-700 hover:shadow-xl transition-all">
                        <img src="${U(img, 600)}" alt="${name} coaching at Champion Sports Academy" class="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy">
                        <div class="p-6 space-y-2">
                            <h3 class="font-bold text-slate-900 dark:text-white flex items-center gap-2"><i class="fa-solid ${icon} text-blue-600"></i>${name}</h3>
                            <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">${d}</p>
                        </div>
                    </a>`
  )
  .join('')}
                </div>
            </div>
        </section>`,
    `
        <!-- SECTION 5: NEED HELP -->
        <section class="py-20 bg-slate-50 dark:bg-slate-950">
            <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="bg-white dark:bg-slate-900 rounded-3xl p-8 lg:p-10 border border-slate-200 dark:border-slate-800 shadow-sm text-center space-y-6">
                    <span class="inline-flex items-center gap-2 text-blue-600 dark:text-sky-400 text-xs font-bold uppercase tracking-widest">
                        <i class="fa-solid fa-headset"></i>Need Help?
                    </span>
                    <h2 class="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white uppercase">We&rsquo;ll Get You Back on Track</h2>
                    <p class="text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto">If you followed a link from our site and landed here, please tell us &mdash; we fix broken links quickly.</p>
                    <div class="flex flex-wrap gap-3 justify-center">
                        ${btnPrimary('contact.html', 'Report This Link', 'fa-paper-plane')}
                        ${btnGhost('login.html', 'Parent Login')}
                    </div>
                </div>
            </div>
        </section>`,
    cta(6, {
      title: 'Let&rsquo;s Get You Training',
      sub: 'Instead of hunting for the page you wanted, book a free trial session and experience a full coaching session first-hand.',
      img: LOCAL.coachingWide,
      primary: btnPrimary('signup.html', 'Book a Free Trial', 'fa-user-plus'),
      secondary: btnGhost('index.html', 'Back to Homepage'),
    }),
  ],
});

/* ================================================================== */
/*  PRIVACY POLICY                                                     */
/* ================================================================== */
const policyBlock = (title, body) => `
                    <div class="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 space-y-3">
                        <h3 class="font-bold text-slate-900 dark:text-white flex items-start gap-2 text-sm">
                            <i class="fa-solid fa-shield-halved text-blue-500 mt-0.5"></i>${title}
                        </h3>
                        <div class="space-y-2">${body}</div>
                    </div>`;

const p = (t) => `<p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">${t}</p>`;
const li = (t) =>
  `<li class="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed"><i class="fa-solid fa-circle-check text-blue-500 mt-1 shrink-0"></i><span>${t}</span></li>`;

page({
  file: 'privacy-policy.html',
  title: 'Privacy Policy | Champion Sports Academy',
  desc: 'How Champion Sports Academy collects, uses, stores and protects your personal information, and the rights you have over it.',
  sections: [
    hero(1, {
      kicker: 'Legal',
      title: 'Privacy <span class="text-sky-400">Policy</span>',
      sub: 'How we collect, use, store and protect your personal information as a parent or athlete at Champion Sports Academy.',
      img: IMG.stadium,
      alt: 'Academy training ground',
      primary: btnPrimary('contact.html', 'Contact Our Team', 'fa-paper-plane'),
      secondary: btnGhost('terms.html', 'Terms of Service'),
    }),
    `
        <!-- SECTION 2: INFORMATION WE COLLECT -->
        <section class="py-20 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                ${head('Section One', 'Information We Collect', 'We only collect what we need to coach your child and run the academy.')}
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
${policyBlock('Information you provide', `${p('Details you give us directly when you enroll, contact us, or create a parent account:')}
                            <ul class="space-y-2">${li('Parent or guardian name, email address and phone number')}${li('Athlete name, date of birth and age group')}${li('Emergency contact details')}${li('Medical and accessibility information you choose to share')}${li('Payment and billing records')}</ul>`)}
${policyBlock('Information collected automatically', `${p('Standard technical data gathered when you browse the site or use the parent dashboard:')}
                            <ul class="space-y-2">${li('Pages viewed and approximate timestamp')}${li('Device type, browser and screen size')}${li('Approximate region derived from IP address')}${li('Session and preference settings such as theme and text direction')}</ul>`)}
                </div>
            </div>
        </section>`,
    `
        <!-- SECTION 3: HOW WE USE IT -->
        <section class="py-20 bg-slate-50 dark:bg-slate-950">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                ${head('Section Two', 'How We Use Your Information', 'Every use of your data is tied to running the academy safely.')}
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
${policyBlock('Delivering our service', `${p('To manage your enrollment and keep your child safe:')}
                            <ul class="space-y-2">${li('Assign athletes to the correct age and ability group')}${li('Share session plans and progress notes with your child&rsquo;s coach')}${li('Operate the parent dashboard, attendance records and fee schedules')}${li('Handle emergency contacts and medical information')}</ul>`)}
${policyBlock('Communications', `${p('We contact you about your child&rsquo;s training:')}
                            <ul class="space-y-2">${li('Batch confirmations, schedule changes and venue updates')}${li('Fee reminders and payment receipts')}${li('Tournament and competition notifications')}${li('Occasional academy news, only if you opt in')}</ul>`)}
                </div>
            </div>
        </section>`,
    `
        <!-- SECTION 4: SHARING AND RETENTION -->
        <section class="py-20 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                ${head('Section Three', 'Sharing, Storage &amp; Retention', 'We do not sell your data. Here is exactly who can see it.')}
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
${policyBlock('Who we share with', `${p('Your information is visible only where it is genuinely needed:')}
                            <ul class="space-y-2">${li('Your child&rsquo;s assigned coach and hub staff')}${li('Our payment processor, for handling fees')}${li('Competition organisers, only for tournament entry')}${li('Regulators or authorities, where legally required')}</ul>`)}
${policyBlock('How it is stored', `${p('Your information is held in our secure booking and parent portal systems, with access restricted by role. Paper records, where they exist, are kept in locked filing cabinets at our head office and destroyed once no longer required.')}${li('Passwords are never stored in plain text')}${li('Data is transmitted over encrypted connections')}`)}
${policyBlock('How long we keep it', `${p('Retention periods reflect both academy and legal requirements:')}
                            <ul class="space-y-2">${li('Enrolment and attendance records: 7 years')}${li('Payment and billing records: 7 years')}${li('Medical and safeguarding records: 7 years')}${li('Marketing preferences: until you unsubscribe')}</ul>`)}
                </div>
            </div>
        </section>`,
    `
        <!-- SECTION 5: YOUR RIGHTS -->
        <section class="py-20 bg-slate-50 dark:bg-slate-950">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <div class="space-y-6">
                        ${head('Section Four', 'Your Rights', 'You stay in control of your information at all times.')}
                        <ul class="space-y-3">
                            ${li('Request a copy of the personal data we hold about you')}
                            ${li('Ask us to correct anything that is inaccurate')}
                            ${li('Request deletion of data we are not legally required to keep')}
                            ${li('Withdraw consent for marketing communications at any time')}
                            ${li('Object to how your data is used in a particular context')}
                        </ul>
                        <p class="text-xs text-slate-500 dark:text-slate-400">To exercise any of these rights, contact our office and we will respond within 30 days.</p>
                    </div>
                    <div>
                        <img src="${U(IMG.child, 700)}" alt="Young athlete training at Champion Sports Academy" class="w-full h-80 object-cover rounded-3xl shadow-lg" loading="lazy">
                    </div>
                </div>
            </div>
        </section>`,
    cta(6, {
      title: 'Questions About Your Data?',
      sub: 'Our operations team handles every privacy request personally. Get in touch and we will help with access, correction or deletion.',
      img: IMG.stadium,
      primary: btnPrimary('contact.html', 'Contact Us', 'fa-paper-plane'),
      secondary: btnGhost('terms.html', 'Read Terms of Service'),
    }),
  ],
});

/* ================================================================== */
/*  TERMS OF SERVICE                                                   */
/* ================================================================== */
page({
  file: 'terms.html',
  title: 'Terms of Service | Champion Sports Academy',
  desc: 'The terms that apply to enrollment, fees, conduct and participation in coaching programmes at Champion Sports Academy.',
  sections: [
    hero(1, {
      kicker: 'Legal',
      title: 'Terms of <span class="text-sky-400">Service</span>',
      sub: 'The terms that apply to enrollment, fees, conduct and participation in all Champion Sports Academy programmes.',
      img: IMG.stadium,
      alt: 'Academy training ground',
      primary: btnPrimary('contact.html', 'Ask a Question', 'fa-paper-plane'),
      secondary: btnGhost('privacy-policy.html', 'Privacy Policy'),
    }),
    `
        <!-- SECTION 2: ACCEPTANCE -->
        <section class="py-20 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                ${head('Clause One', 'Acceptance Of These Terms', 'Please read these terms before enrolling an athlete.')}
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
${policyBlock('Agreement to terms', `${p('By enrolling an athlete in a Champion Sports Academy programme, submitting an enrollment form, or creating a parent portal account, you confirm that you have read and agree to be bound by these terms on behalf of the athlete.')}${p('If you do not agree with any part of these terms, please do not enroll. Contact our office and we will answer any questions first.')}`)}
${policyBlock('Who these terms cover', `${p('These terms apply to parents and guardians, athletes aged 5 to 17, and any adult accompanying an athlete to sessions.')}${p('Athletes aged 18 and over enrolling independently accept these terms in their own right.')}${p('Champion Sports Academy may update these terms. Material changes will be announced at least 14 days before taking effect.')}`)}
                </div>
            </div>
        </section>`,
    `
        <!-- SECTION 3: ENROLLMENT AND FEES -->
        <section class="py-20 bg-slate-50 dark:bg-slate-950">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                ${head('Clause Two', 'Enrollment &amp; Fees', 'How bookings, payments, changes and cancellations work.')}
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
${policyBlock('Bookings and placements', `${p('Places are confirmed once payment is received and the coach has completed a level assessment.')}<ul class="space-y-2">${li('Group sizes are capped to protect coach-to-player ratios')}${li('Level placement is at the coach&rsquo;s discretion after assessment')}${li('A free trial session does not guarantee a place in a particular batch')}${li('Kit is issued on the first paid session')}</ul>`)}
${policyBlock('Fees, payment and changes', `${p('Fees are charged monthly in advance and cover all scheduled sessions in that month.')}<ul class="space-y-2">${li('Fees are refundable pro-rata with two weeks written notice')}${li('Tournament entry fees are non-refundable once a place is confirmed')}${li('Batches may be paused for up to eight weeks per season on notice')}${li('Changes take effect from the start of the following month')}${li('Two consecutive missed payments may release your place')}</ul>`)}
                </div>
            </div>
        </section>`,
    `
        <!-- SECTION 4: CONDUCT AND SAFETY -->
        <section class="py-20 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                ${head('Clause Three', 'Conduct, Safety &amp; Supervision', 'Our expectations of athletes, parents and staff.')}
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
${policyBlock('Athlete conduct', `${p('Athletes are expected to:')}<ul class="space-y-2">${li('Listen to coaches and follow safety instructions')}${li('Treat teammates, opponents and staff with respect')}${li('Attend regularly and arrive on time')}${li('Refuse to participate if unwell or injured')}</ul>`)}
${policyBlock('Parent responsibilities', `${p('Parents agree to:')}<ul class="space-y-2">${li('Ensure athletes attend with appropriate clothing and footwear')}${li('Update us promptly of any medical change or injury')}${li('Collect athletes promptly after sessions')}${li('Not photograph or record sessions without consent')}</ul>`)}
${policyBlock('Health and liability', `${p('Training carries an inherent risk of injury. By enrolling, you accept that risk.')}<p>We hold appropriate public liability insurance and every staff member is first-aid certified. Mandatory medical clearance is required before an athlete may compete in tournaments. Any injury must be reported to the coach immediately.</p>`)}
                </div>
            </div>
        </section>`,
    `
        <!-- SECTION 5: COMPLAINTS AND CLOSING -->
        <section class="py-20 bg-slate-50 dark:bg-slate-950">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    <div class="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                        <h3 class="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2"><i class="fa-solid fa-scale-balanced text-blue-500"></i>Complaints Procedure</h3>
                        <ol class="space-y-3">
                            ${[
                                'Raise the concern with your child&rsquo;s coach at the session.',
                                'If unresolved, contact the academy manager in writing within 14 days.',
                                'The manager will respond with a written outcome within 10 working days.',
                                'If still unresolved, the matter escalates to the academy director for a final review.',
                            ]
                              .map(
                                (t, i) => `<li class="flex gap-3 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                <span class="w-6 h-6 shrink-0 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black text-[10px]">${i + 1}</span>
                                <span>${t}</span>
                            </li>`
                              )
                              .join('\n                            ')}
                        </ol>
                    </div>
                    <div class="space-y-6">
                        ${head('Clause Four', 'Governing Law', 'How these terms are interpreted and enforced.')}
                        <p class="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">These terms are governed by the laws of the region in which the relevant hub operates. If any provision is found unenforceable, the remaining provisions continue in full force.</p>
                        <ul class="space-y-2">
                            ${li('Terms last updated: September 2026')}
                            ${li('Applies to all hubs and home tuition sessions')}
                            ${li('Supersedes all previous enrollment terms')}
                        </ul>
                    </div>
                </div>
            </div>
        </section>`,
    cta(6, {
      title: 'Agree? Let&rsquo;s Get Started',
      sub: 'Enrollment is straightforward once you have read these terms. Tell us your child&rsquo;s age and sport and we will confirm the right batch.',
      img: IMG.football2,
      primary: btnPrimary('signup.html', 'Enroll Your Child', 'fa-user-plus'),
      secondary: btnGhost('contact.html', 'Ask About Terms'),
    }),
  ],
});

console.log(PAGES.map((f) => `built: ${f}`).join('\n'));


