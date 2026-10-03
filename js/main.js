/* Main JS - Champion Sports Academy (Blue Theme Update) */

document.addEventListener('DOMContentLoaded', () => {
    initMobileMenu();
    initDropdowns();
    initActiveNavLinks();
    initAccordions();
    initTabs();
    initHeroSelectors();
});

/* Mobile Menu Drawer Toggle */
function initMobileMenu() {
    const toggleBtn = document.getElementById('mobile-menu-toggle');
    const closeBtn = document.getElementById('mobile-menu-close');
    const drawer = document.getElementById('mobile-menu-drawer');
    const overlay = document.getElementById('mobile-menu-overlay');

    function closeMenu() {
        if (!drawer) return;
        drawer.classList.add('translate-x-full');
        if (overlay) overlay.classList.add('hidden');
        document.body.classList.remove('overflow-hidden');
        toggleBtn?.setAttribute('aria-expanded', 'false');
    }

    if (toggleBtn && drawer) {
        toggleBtn.setAttribute('aria-expanded', 'false');
        toggleBtn.addEventListener('click', () => {
            const open = drawer.classList.contains('translate-x-full');
            if (!open) return closeMenu();
            drawer.classList.remove('translate-x-full');
            if (overlay) overlay.classList.remove('hidden');
            document.body.classList.add('overflow-hidden');
            toggleBtn.setAttribute('aria-expanded', 'true');
            closeBtn?.focus();
        });
    }

    if (closeBtn) closeBtn.addEventListener('click', closeMenu);
    if (overlay) overlay.addEventListener('click', closeMenu);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && drawer && !drawer.classList.contains('translate-x-full')) {
            closeMenu();
            toggleBtn?.focus();
        }
    });

    // Tapping any destination in the drawer should not leave it hanging open behind the new page
    drawer?.addEventListener('click', (e) => {
        if (e.target.closest('a[href]')) closeMenu();
    });
}

/* Mobile Dropdown Submenus */
function initDropdowns() {
    const mobileDropdownBtns = document.querySelectorAll('.mobile-dropdown-btn');
    mobileDropdownBtns.forEach(btn => {
        const target = btn.nextElementSibling;
        const icon = btn.querySelector('.fa-chevron-down');
        btn.setAttribute('aria-expanded', 'false');
        btn.addEventListener('click', () => {
            if (!target) return;
            const willOpen = target.classList.contains('hidden');
            target.classList.toggle('hidden', !willOpen);
            icon?.classList.toggle('rotate-180', willOpen);
            btn.setAttribute('aria-expanded', String(willOpen));
        });
    });

    // Desktop dropdowns open on hover via CSS, and on click for keyboard/touch users.
    const toggles = document.querySelectorAll('[data-dropdown-toggle]');
    const closeAll = (except) => {
        toggles.forEach(t => {
            if (t === except) return;
            const menu = t.nextElementSibling;
            if (menu) menu.classList.remove('is-open');
            t.setAttribute('aria-expanded', 'false');
        });
    };

    toggles.forEach(toggle => {
        const menu = toggle.nextElementSibling;
        if (!menu) return;

        toggle.setAttribute('aria-expanded', 'false');

        toggle.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const willOpen = !menu.classList.contains('is-open');
            closeAll(toggle);
            menu.classList.toggle('is-open', willOpen);
            toggle.setAttribute('aria-expanded', String(willOpen));
        });

        // Keyboard users open the menu with Enter/Space (handled above) and leave with Escape.
        toggle.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowDown' && !menu.classList.contains('is-open')) {
                e.preventDefault();
                closeAll(toggle);
                menu.classList.add('is-open');
                toggle.setAttribute('aria-expanded', 'true');
                menu.querySelector('a[href]')?.focus();
            }
        });
    });

    // close on outside click, on Escape, and when the viewport grows past the desktop breakpoint
    document.addEventListener('click', () => closeAll(null));
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeAll(null);
    });
    window.matchMedia('(min-width: 1024px)').addEventListener('change', (e) => {
        if (e.matches) closeAll(null);
    });
}

/* Active Nav Link Highlight
   `data-nav-match` lets a dropdown trigger (<button>) light up for the page its
   items point at. Comma-separated lists match any one destination. */
function initActiveNavLinks() {
    let currentPath = window.location.pathname.split('/').pop() || 'index.html';
    if (currentPath === '') currentPath = 'index.html';

    const isActive = (el) =>
        (el.getAttribute('data-nav-match') || el.getAttribute('href') || '')
            .split(',')
            .map((s) => s.trim())
            .some((route) => route === currentPath);

    /* Covers the desktop bar (.nav-link), the mobile drawer (.drawer-nav-link)
       and the dropdown triggers ([data-nav-match]), so the current page is
       highlighted identically on desktop, tablet and mobile. */
    document.querySelectorAll('.nav-link, .drawer-nav-link, [data-nav-match]').forEach((link) => {
        if (!isActive(link)) return;
        link.classList.add('text-blue-600', 'dark:text-sky-400', 'font-bold');
        link.classList.remove('text-slate-700', 'text-slate-800', 'dark:text-slate-200', 'dark:text-slate-300', 'dark:text-slate-400');
    });
}

/* FAQ Accordions */
function initAccordions() {
    const accordionHeaders = document.querySelectorAll('.accordion-header');
    accordionHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const content = header.nextElementSibling;
            const icon = header.querySelector('.accordion-icon');
            
            if (content) {
                content.classList.toggle('hidden');
                if (icon) {
                    icon.classList.toggle('rotate-180');
                }
            }
        });
    });
}

/* Tab Switchers */
function initTabs() {
    const tabButtons = document.querySelectorAll('[data-tab-target]');
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetId = btn.getAttribute('data-tab-target');
            const parent = btn.closest('.tab-container') || document;
            
            parent.querySelectorAll('[data-tab-target]').forEach(b => {
                b.classList.remove('bg-blue-600', 'text-white', 'shadow-md');
                b.classList.add('bg-slate-100', 'dark:bg-slate-800', 'text-slate-600', 'dark:text-slate-300');
            });
            
            btn.classList.add('bg-blue-600', 'text-white', 'shadow-md');
            btn.classList.remove('bg-slate-100', 'dark:bg-slate-800', 'text-slate-600', 'dark:text-slate-300');
            
            parent.querySelectorAll('.tab-pane').forEach(pane => {
                pane.classList.add('hidden');
            });
            
            const targetPane = document.getElementById(targetId);
            if (targetPane) {
                targetPane.classList.remove('hidden');
            }
        });
    });
}

/* Homepage Hero Search Form Helper */
function initHeroSelectors() {
    const searchForm = document.getElementById('hero-search-form');
    if (searchForm) {
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const location = document.getElementById('hero-location-select')?.value;
            const sport = document.getElementById('hero-sport-select')?.value;
            
            if (location || sport) {
                showToast(`Searching batches for ${sport || 'all sports'} in ${location || 'all locations'}...`, 'info');
                setTimeout(() => {
                    window.location.href = `batches.html?sport=${encodeURIComponent(sport || '')}&location=${encodeURIComponent(location || '')}`;
                }, 800);
            } else {
                showToast('Please select a sport or location to search.', 'warning');
            }
        });
    }
}

/* Toast Notifications Helper */
function showToast(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    
    let bgColors = 'bg-slate-900 text-white';
    let icon = 'fa-info-circle text-sky-400';
    
    if (type === 'success') {
        bgColors = 'bg-blue-600 text-white';
        icon = 'fa-check-circle text-white';
    } else if (type === 'error') {
        bgColors = 'bg-rose-600 text-white';
        icon = 'fa-exclamation-triangle text-white';
    } else if (type === 'warning') {
        bgColors = 'bg-sky-600 text-white';
        icon = 'fa-exclamation-circle text-white';
    }

    toast.className = `${bgColors} px-5 py-3 rounded-xl shadow-2xl flex items-center space-x-3 text-sm font-medium transition-all duration-300 transform translate-y-4 opacity-0 border border-white/10`;
    toast.innerHTML = `
        <i class="fa-solid ${icon} text-lg"></i>
        <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.remove('translate-y-4', 'opacity-0');
    }, 10);

    setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-y-2');
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}
