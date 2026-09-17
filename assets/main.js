/* Sorellon shared behaviour: small, dependency-free enhancements. */
(function () {
  "use strict";

  var year = document.getElementById("y");
  if (year) year.textContent = String(new Date().getFullYear());

  /* The menu only needs a small local toggle; no framework JavaScript is required. */
  var menuToggle = document.querySelector('[data-bs-toggle="collapse"]');
  if (menuToggle) {
    var targetSelector = menuToggle.getAttribute("data-bs-target");
    var menu = targetSelector ? document.querySelector(targetSelector) : null;
    if (menu) {
      var setMenuState = function (open) {
        menu.classList.toggle("show", open);
        menuToggle.setAttribute("aria-expanded", String(open));
      };
      menuToggle.addEventListener("click", function () {
        setMenuState(!menu.classList.contains("show"));
      });
      menu.addEventListener("click", function (event) {
        if (event.target.closest("a") && window.innerWidth < 992) setMenuState(false);
      });
      document.addEventListener("keydown", function (event) {
        if (event.key === "Escape" && menu.classList.contains("show")) {
          setMenuState(false);
          menuToggle.focus();
        }
      });
    }
  }

  /* Transparent homepage navigation becomes solid as the hero leaves the viewport. */
  var nav = document.getElementById("mainNav");
  var hero = document.getElementById("hero");
  var logo = document.getElementById("navLogo");
  if (nav && hero && nav.classList.contains("navbar--transparent")) {
    var syncNav = function () {
      var solid = window.scrollY > Math.max(120, hero.offsetHeight * 0.72);
      nav.classList.toggle("navbar--scrolled", solid);
      nav.classList.toggle("navbar--transparent", !solid);
      if (logo) logo.src = solid ? "/assets/logo.svg" : "/assets/logo-white.svg";
    };
    window.addEventListener("scroll", syncNav, { passive: true });
    syncNav();
  }

  /* Add a subtle entrance state without hiding content when JavaScript is unavailable. */
  var animated = document.querySelectorAll(".reveal, .hero-reveal");
  if ("IntersectionObserver" in window && animated.length) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -20px 0px" });
    animated.forEach(function (element) { observer.observe(element); });
  } else {
    animated.forEach(function (element) { element.classList.add("visible"); });
  }

  /* Keep old hash links useful while pointing visitors at clean URLs. */
  var hashRoutes = {
    "#sectors": "/sectors",
    "#/sectors": "/sectors",
    "#capabilities": "/capabilities",
    "#/capabilities": "/capabilities",
    "#contact": "/contact",
    "#/contact": "/contact"
  };
  if (hashRoutes[window.location.hash]) {
    window.location.replace(hashRoutes[window.location.hash]);
  } else if (window.location.hash === "#") {
    history.replaceState(null, "", window.location.pathname + window.location.search);
  }
}());
