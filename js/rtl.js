/* RTL Manager - Champion Sports Academy */
(function() {
    // Apply saved dir immediately to prevent flash
    const savedDir = localStorage.getItem('csa_dir') || 'ltr';
    document.documentElement.setAttribute('dir', savedDir);
    if (savedDir === 'rtl') {
        document.documentElement.classList.add('rtl-mode');
    }
})();

function toggleRTL() {
    const currentDir = document.documentElement.getAttribute('dir') || 'ltr';
    const newDir = currentDir === 'ltr' ? 'rtl' : 'ltr';
    
    document.documentElement.setAttribute('dir', newDir);
    if (newDir === 'rtl') {
        document.documentElement.classList.add('rtl-mode');
    } else {
        document.documentElement.classList.remove('rtl-mode');
    }
    
    localStorage.setItem('csa_dir', newDir);
    updateRTLToggleBtns();
}

function updateRTLToggleBtns() {
    const currentDir = document.documentElement.getAttribute('dir') || 'ltr';
    const toggleBtns = document.querySelectorAll('.rtl-toggle-btn');
    
    toggleBtns.forEach(btn => {
        const textSpan = btn.querySelector('.rtl-text');
        if (textSpan) {
            textSpan.textContent = currentDir === 'rtl' ? 'LTR' : 'RTL';
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    updateRTLToggleBtns();
    
    const toggleBtns = document.querySelectorAll('.rtl-toggle-btn');
    toggleBtns.forEach(btn => {
        btn.addEventListener('click', toggleRTL);
    });
});
