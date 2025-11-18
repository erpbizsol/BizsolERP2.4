// BabyCare theme initialization
document.addEventListener('DOMContentLoaded', function () {
    try {
        document.body.classList.add('babycare-theme');

        // Bootstrap tooltips
        if (window.bootstrap) {
            var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
            tooltipTriggerList.forEach(function (tooltipTriggerEl) {
                new bootstrap.Tooltip(tooltipTriggerEl);
            });
        }

        // Back-to-top button (optional)
        var backTop = document.getElementById('backToTop');
        if (backTop) {
            window.addEventListener('scroll', function () {
                if (window.scrollY > 200) backTop.style.display = 'block'; else backTop.style.display = 'none';
            });
            backTop.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
        }
    } catch (e) {
        // Safe fail
        console.warn('Theme init error:', e);
    }
});


