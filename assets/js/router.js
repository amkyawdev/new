// assets/js/router.js
export function initRouter() {
    // Handle navigation links
    document.addEventListener('click', (e) => {
        const link = e.target.closest('a[data-nav]');
        if (link) {
            e.preventDefault();
            const href = link.getAttribute('href');
            
            // Don't handle anchor links
            if (href.startsWith('#')) {
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth' });
                }
                return;
            }
            
            navigateTo(href);
        }
    });
    
    // Handle browser back/forward
    window.addEventListener('popstate', () => {
        loadPage(window.location.pathname);
    });
    
    // Handle mobile menu links
    document.querySelectorAll('.mobile-link').forEach(link => {
        link.addEventListener('click', () => {
            const mobileMenu = document.getElementById('mobile-menu');
            if (mobileMenu) {
                mobileMenu.classList.add('hidden');
            }
        });
    });
}

export function navigateTo(url) {
    // Page transition
    document.body.style.opacity = '0';
    document.body.style.transition = 'opacity 0.3s ease';
    
    setTimeout(() => {
        window.location.href = url;
    }, 300);
}

export function loadPage(path) {
    // For SPA navigation if needed
    console.log('Loading page:', path);
}
