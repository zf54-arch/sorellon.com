/* ===== Sorellon Shared Scripts ===== */

// Year stamp
(function() {
  var el = document.getElementById('y');
  if (el) el.textContent = new Date().getFullYear();
})();

// Scroll-reveal observer
(function() {
  var reveals = document.querySelectorAll('.reveal, .section-divider');
  if (!reveals.length) return;

  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -30px 0px' });

  reveals.forEach(function(el) { observer.observe(el); });
})();

// Hero text entrance on load
(function() {
  var heroReveals = document.querySelectorAll('.hero-reveal');
  if (!heroReveals.length) return;

  setTimeout(function() {
    heroReveals.forEach(function(el, i) {
      el.style.transitionDelay = (i * 0.12) + 's';
      el.classList.add('visible');
    });
  }, 100);
})();

// Legacy hash route redirects (homepage only)
(function() {
  if (window.location.hash === '#sectors' || window.location.hash === '#/sectors') {
    window.location.href = '/sectors.html'; return;
  }
  if (window.location.hash === '#capabilities' || window.location.hash === '#/capabilities') {
    window.location.href = '/capabilities.html'; return;
  }
  if (window.location.hash === '#contact' || window.location.hash === '#/contact') {
    window.location.href = '/contact.html'; return;
  }
  if (window.location.hash === '#' || /#$/.test(window.location.href)) {
    history.replaceState(null, '', window.location.href.replace(/#$/, ''));
  }
})();
