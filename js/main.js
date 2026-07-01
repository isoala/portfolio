/**
 * main.js — Ismaeel Alarcon Portfolio
 *
 * Responsibilities:
 *   1. Navbar — scroll-triggered background
 *   2. Mobile menu — toggle with ARIA state
 *   3. Active nav link — tracks current section via IntersectionObserver
 *   4. Scroll animations — reveals elements as they enter the viewport
 */

(function () {
  'use strict';

  /* ── Helpers ─────────────────────────────────────────────── */

  /** Run callback after the DOM is fully parsed. */
  function ready(fn) {
    if (document.readyState !== 'loading') {
      fn();
    } else {
      document.addEventListener('DOMContentLoaded', fn);
    }
  }

  /* ── 1. Navbar scroll state ──────────────────────────────── */

  function initNavbar() {
    var navbar = document.getElementById('navbar');
    if (!navbar) return;

    function onScroll() {
      if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // Run once on load in case page is already scrolled
  }

  /* ── 2. Mobile menu ──────────────────────────────────────── */

  function initMobileMenu() {
    var hamburger  = document.getElementById('hamburger');
    var mobileMenu = document.getElementById('mobileMenu');
    if (!hamburger || !mobileMenu) return;

    function openMenu() {
      mobileMenu.classList.add('open');
      hamburger.setAttribute('aria-expanded', 'true');
      mobileMenu.setAttribute('aria-hidden', 'false');
    }

    function closeMenu() {
      mobileMenu.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
      mobileMenu.setAttribute('aria-hidden', 'true');
    }

    function toggleMenu() {
      var isOpen = mobileMenu.classList.contains('open');
      if (isOpen) {
        closeMenu();
      } else {
        openMenu();
      }
    }

    hamburger.addEventListener('click', toggleMenu);

    /* Close when a menu link is clicked */
    var mobileLinks = mobileMenu.querySelectorAll('.mobile-link');
    mobileLinks.forEach(function (link) {
      link.addEventListener('click', closeMenu);
    });

    /* Close when clicking anywhere outside the menu or hamburger */
    document.addEventListener('click', function (e) {
      if (!hamburger.contains(e.target) && !mobileMenu.contains(e.target)) {
        closeMenu();
      }
    });

    /* Close on Escape key */
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && mobileMenu.classList.contains('open')) {
        closeMenu();
        hamburger.focus();
      }
    });
  }

  /* ── 3. Active nav link ──────────────────────────────────── */

  function initActiveNav() {
    var sections   = document.querySelectorAll('section[id]');
    var navAnchors = document.querySelectorAll('[data-section]');

    if (!sections.length || !navAnchors.length) return;

    /* IntersectionObserver isn't available in very old browsers —
       bail gracefully rather than throwing. */
    if (!('IntersectionObserver' in window)) return;

    function setActive(id) {
      navAnchors.forEach(function (a) {
        if (a.getAttribute('data-section') === id) {
          a.classList.add('active');
        } else {
          a.classList.remove('active');
        }
      });
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            setActive(entry.target.id);
          }
        });
      },
      /* Trigger when a section occupies the middle third of the viewport */
      { rootMargin: '-35% 0px -55% 0px' }
    );

    sections.forEach(function (section) {
      observer.observe(section);
    });
  }

  /* ── 4. Scroll reveal animations ─────────────────────────── */

  function initScrollReveal() {
    var elements = document.querySelectorAll('.reveal');
    if (!elements.length) return;

    /* If the user prefers reduced motion, mark everything visible immediately
       so CSS transitions don't run (the CSS rule also handles this, but this
       ensures elements aren't left invisible if the CSS rule somehow doesn't fire). */
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      elements.forEach(function (el) {
        el.classList.add('in-view');
      });
      return;
    }

    if (!('IntersectionObserver' in window)) {
      /* Fallback: show all elements immediately */
      elements.forEach(function (el) {
        el.classList.add('in-view');
      });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            /* Stop observing once revealed — no need to re-trigger */
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.9 }
    );

    elements.forEach(function (el) {
      observer.observe(el);
    });
  }

  /* ── 5. Hero name expansion with scroll lock ─────────────── */

  function initNameExpansion() {
    var heroName = document.getElementById('heroName');
    if (!heroName) return;

    /* Skip animation entirely for users who prefer reduced motion */
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      heroName.classList.add('is-expanded');
      return;
    }

    var triggered = false;

    /*
     * CSS animation: name-full transitions over 1.5s with 0.1s delay = 1.6s total.
     * Add 200ms buffer so scroll resumes only after the animation fully settles.
     */
    var ANIMATION_DURATION = 600;

    /* Lock the page at the top immediately */
    document.documentElement.classList.add('scroll-locked');

    function unlock() {
      document.documentElement.classList.remove('scroll-locked');
      window.removeEventListener('wheel',      onScrollIntent, { passive: false });
      window.removeEventListener('touchmove',  onScrollIntent, { passive: false });
      window.removeEventListener('touchstart', onScrollIntent);
      window.removeEventListener('keydown',    onKeyIntent);
    }

    function trigger() {
      if (triggered) return;
      triggered = true;
      /*
       * Double-RAF ensures the browser has committed a frame with the
       * compositor layers pre-promoted (via will-change / translateZ) before
       * we add the class that starts the transition. This eliminates the
       * dropped-first-frame jank.
       */
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          heroName.classList.add('is-expanded');
        });
      });
      setTimeout(unlock, ANIMATION_DURATION);
    }

    function onScrollIntent(e) {
      /* Prevent actual scrolling while locked */
      if (!triggered) e.preventDefault();
      trigger();
    }

    function onKeyIntent(e) {
      /* Space, PgUp, PgDn, End, Home, arrow keys */
      var scrollKeys = [32, 33, 34, 35, 36, 37, 38, 39, 40];
      if (scrollKeys.indexOf(e.keyCode) > -1) {
        if (!triggered) e.preventDefault();
        trigger();
      }
    }

    window.addEventListener('wheel',      onScrollIntent, { passive: false });
    window.addEventListener('touchmove',  onScrollIntent, { passive: false });
    window.addEventListener('touchstart', onScrollIntent, { passive: true });
    window.addEventListener('keydown',    onKeyIntent);
  }

  /* ── Init ─────────────────────────────────────────────────── */

  ready(function () {
    initNavbar();
    initMobileMenu();
    initActiveNav();
    initScrollReveal();
    initNameExpansion();
  });

}());
