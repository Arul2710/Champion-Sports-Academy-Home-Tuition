/* Dashboard Logic - Champion Sports Academy */

document.addEventListener('DOMContentLoaded', () => {
    initDashboardTabs();
    initDashboardMobileSidebar();
    initAdminModalActions();
    initParentEnrollmentForm();
    initParentPaymentButtons();
});

/* Sidebar Tab Switching */
function initDashboardTabs() {
    const sidebarLinks = document.querySelectorAll('.dash-nav-item');
    const sections = document.querySelectorAll('.dash-section');

    sidebarLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const targetId = link.getAttribute('data-target');
            if (!targetId) return;
            e.preventDefault();

            // Deactivate all links
            sidebarLinks.forEach(item => {
                item.classList.remove('bg-primary-600', 'text-white', 'font-semibold');
                item.classList.add('text-slate-300', 'hover:bg-slate-800', 'hover:text-white');
            });

            // Activate clicked link
            link.classList.add('bg-primary-600', 'text-white', 'font-semibold');
            link.classList.remove('text-slate-300', 'hover:bg-slate-800', 'hover:text-white');

            // Hide all sections
            sections.forEach(sec => sec.classList.add('hidden'));

            // Show active section
            const activeSection = document.getElementById(targetId);
            if (activeSection) {
                activeSection.classList.remove('hidden');
                
                // Update page title top header if present
                const headerTitle = document.getElementById('dash-header-title');
                if (headerTitle) {
                    const titleText = link.querySelector('span')?.textContent || 'Dashboard';
                    headerTitle.textContent = titleText;
                }
            }

            // Close mobile sidebar if open
            closeMobileSidebar();
        });
    });
}

/* Mobile Sidebar Drawer */
function initDashboardMobileSidebar() {
    const toggleBtn = document.getElementById('dash-sidebar-toggle');
    const sidebar = document.getElementById('dash-sidebar');
    const overlay = document.getElementById('dash-sidebar-overlay');

    if (toggleBtn && sidebar) {
        toggleBtn.addEventListener('click', () => {
            sidebar.classList.remove('-translate-x-full');
            if (overlay) overlay.classList.remove('hidden');
        });
    }

    if (overlay) {
        overlay.addEventListener('click', closeMobileSidebar);
    }
}

function closeMobileSidebar() {
    const sidebar = document.getElementById('dash-sidebar');
    const overlay = document.getElementById('dash-sidebar-overlay');
    if (sidebar) sidebar.classList.add('-translate-x-full');
    if (overlay) overlay.classList.add('hidden');
}

/* Parent Dashboard Demo Enrollment Handler */
function initParentEnrollmentForm() {
    const enrollForm = document.getElementById('parent-enroll-form');
    if (enrollForm) {
        enrollForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const childName = document.getElementById('enroll-child-select')?.value;
            const sport = document.getElementById('enroll-sport-select')?.value;
            const location = document.getElementById('enroll-location-select')?.value;
            const batch = document.getElementById('enroll-batch-select')?.value;

            if (!childName || !sport || !location || !batch) {
                showToast('Please fill out all enrollment details.', 'error');
                return;
            }

            showToast(`Enrollment request submitted for ${childName} in ${sport}! Admin approval pending.`, 'success');
            enrollForm.reset();
        });
    }
}

/* Parent Payment Modal / Action */
function initParentPaymentButtons() {
    const payNowBtns = document.querySelectorAll('.pay-now-btn');
    payNowBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const invoice = btn.getAttribute('data-invoice') || 'INV-2026-09';
            const amount = btn.getAttribute('data-amount') || '$120.00';
            
            showToast(`Demo payment of ${amount} for ${invoice} successful! Receipt generated.`, 'success');
            
            // Visual state update
            const parentRow = btn.closest('tr');
            if (parentRow) {
                const statusBadge = parentRow.querySelector('.payment-status-badge');
                if (statusBadge) {
                    statusBadge.className = 'px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300';
                    statusBadge.textContent = 'Paid';
                }
                btn.remove();
            }
        });
    });
}

/* Admin Dashboard Modal Utilities */
function initAdminModalActions() {
    // Open Modal buttons
    document.querySelectorAll('[data-modal-open]').forEach(btn => {
        btn.addEventListener('click', () => {
            const modalId = btn.getAttribute('data-modal-open');
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.classList.remove('hidden');
                modal.classList.add('flex');
            }
        });
    });

    // Close Modal buttons
    document.querySelectorAll('[data-modal-close]').forEach(btn => {
        btn.addEventListener('click', () => {
            const modal = btn.closest('.modal-container');
            if (modal) {
                modal.classList.add('hidden');
                modal.classList.remove('flex');
            }
        });
    });

    // Generic Add Item Form Handler for Demo CRUD
    document.querySelectorAll('.admin-add-form').forEach(form => {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const entity = form.getAttribute('data-entity') || 'Item';
            showToast(`New ${entity} added successfully to demo records!`, 'success');
            
            const modal = form.closest('.modal-container');
            if (modal) {
                modal.classList.add('hidden');
                modal.classList.remove('flex');
            }
            form.reset();
        });
    });

    // Generic Delete Action buttons
    document.querySelectorAll('.admin-delete-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (confirm('Are you sure you want to delete this record? (Demo Action)')) {
                const row = btn.closest('tr') || btn.closest('.data-card');
                if (row) {
                    row.classList.add('opacity-0', 'transition-all', 'duration-300');
                    setTimeout(() => row.remove(), 300);
                }
                showToast('Record deleted successfully.', 'info');
            }
        });
    });
}
