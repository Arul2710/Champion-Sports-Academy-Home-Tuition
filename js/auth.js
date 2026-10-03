/* Authentication & Demo Auth Manager - Champion Sports Academy (Blue Theme) */

document.addEventListener('DOMContentLoaded', () => {
    initPasswordToggle();
    initLoginForm();
    initSignupForm();
    initForgotPasswordModal();
    initDemoRoleQuickLogin();
});

/* Toggle Password Visibility */
function initPasswordToggle() {
    const toggleBtns = document.querySelectorAll('.toggle-password-btn');
    toggleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const input = btn.previousElementSibling || btn.parentElement.querySelector('input[type="password"], input[type="text"]');
            const icon = btn.querySelector('i');
            if (input) {
                if (input.type === 'password') {
                    input.type = 'text';
                    if (icon) icon.className = 'fa-solid fa-eye-slash text-slate-400';
                } else {
                    input.type = 'password';
                    if (icon) icon.className = 'fa-solid fa-eye text-slate-400';
                }
            }
        });
    });
}

/* Forgot Password Modal Popup on Login Page */
function initForgotPasswordModal() {
    const link = document.getElementById('forgot-password-link');
    const modal = document.getElementById('forgot-password-modal');
    const closeBtn = document.getElementById('close-forgot-modal');
    const form = document.getElementById('forgot-modal-form');
    const emailInput = document.getElementById('reset-modal-email');
    let lastFocused = null;

    const open = () => {
        if (!modal) return;
        lastFocused = document.activeElement;
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        document.body.classList.add('overflow-hidden');
        if (emailInput) setTimeout(() => emailInput.focus(), 50);
    };

    const close = () => {
        if (!modal) return;
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        document.body.classList.remove('overflow-hidden');
        if (lastFocused) lastFocused.focus();
    };

    if (link && modal) {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            open();
        });
    }

    if (closeBtn && modal) {
        closeBtn.addEventListener('click', close);
    }

    // click on the backdrop (not the dialog itself) closes
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) close();
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !modal.classList.contains('hidden')) close();
        });
    }

    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = emailInput ? emailInput.value.trim() : '';
            if (!email) {
                showToast('Please enter your email address.', 'error');
                if (emailInput) emailInput.focus();
                return;
            }
            showToast(`Password reset link sent to ${email}! Check your inbox.`, 'success');
            close();
            form.reset();
        });
    }
}

/* Demo Role Quick Select Buttons on Login Page */
function initDemoRoleQuickLogin() {
    const parentDemoBtn = document.getElementById('demo-parent-btn');
    const adminDemoBtn = document.getElementById('demo-admin-btn');
    const emailInput = document.getElementById('email-input');
    const passwordInput = document.getElementById('password-input');

    if (parentDemoBtn && emailInput && passwordInput) {
        parentDemoBtn.addEventListener('click', () => {
            emailInput.value = 'parent@sportsacademy.com';
            passwordInput.value = 'password123';
            showToast('Loaded demo Parent credentials! Click Sign In.', 'info');
        });
    }

    if (adminDemoBtn && emailInput && passwordInput) {
        adminDemoBtn.addEventListener('click', () => {
            emailInput.value = 'admin@sportsacademy.com';
            passwordInput.value = 'admin123';
            showToast('Loaded demo Admin credentials! Click Sign In.', 'info');
        });
    }
}

/* Login Form Submission Handler */
function initLoginForm() {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('email-input').value.trim();
            const password = document.getElementById('password-input').value;

            if (!email || !password) {
                showToast('Please fill in both email and password.', 'error');
                return;
            }

            let role = 'parent';
            let name = 'Sarah Jenkins';
            if (email.includes('admin')) {
                role = 'admin';
                name = 'Academy Director';
            }

            const userData = {
                name,
                email,
                role,
                loggedInAt: new Date().toISOString()
            };

            localStorage.setItem('csa_user', JSON.stringify(userData));

            showToast(`Welcome back, ${name}! Redirecting to ${role === 'admin' ? 'Admin' : 'Parent'} Dashboard...`, 'success');

            setTimeout(() => {
                if (role === 'admin') {
                    window.location.href = 'admin-dashboard.html';
                } else {
                    window.location.href = 'parent-dashboard.html';
                }
            }, 1000);
        });
    }
}

/* Signup Form Submission Handler */
function initSignupForm() {
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('signup-name').value.trim();
            const email = document.getElementById('signup-email').value.trim();
            const phone = document.getElementById('signup-phone').value.trim();
            const password = document.getElementById('signup-password').value;
            const confirmPassword = document.getElementById('signup-confirm-password').value;
            const terms = document.getElementById('signup-terms').checked;

            if (!name || !email || !phone || !password || !confirmPassword) {
                showToast('Please fill out all required fields.', 'error');
                return;
            }

            if (password !== confirmPassword) {
                showToast('Passwords do not match.', 'error');
                return;
            }

            if (!terms) {
                showToast('You must agree to the Terms & Conditions.', 'warning');
                return;
            }

            const userData = {
                name,
                email,
                phone,
                role: 'parent',
                loggedInAt: new Date().toISOString()
            };

            localStorage.setItem('csa_user', JSON.stringify(userData));

            showToast('Account created successfully! Redirecting to Parent Dashboard...', 'success');

            setTimeout(() => {
                window.location.href = 'parent-dashboard.html';
            }, 1000);
        });
    }
}

/* Logout Helper */
function logoutUser() {
    localStorage.removeItem('csa_user');
    showToast('Logged out successfully.', 'info');
    setTimeout(() => {
        window.location.href = 'login.html';
    }, 800);
}
