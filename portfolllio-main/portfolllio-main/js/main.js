(function () {
  /* Mobile nav */
  var toggle = document.querySelector('.nav__toggle');
  var navLinks = document.getElementById('nav-links');

  if (toggle && navLinks) {
    toggle.addEventListener('click', function () {
      var isOpen = navLinks.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(isOpen));
      /* Lock body scroll while the mobile menu is open */
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });

    navLinks.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        navLinks.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });

    document.addEventListener('click', function (e) {
      if (!toggle.contains(e.target) && !navLinks.contains(e.target)) {
        navLinks.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      }
    });
  }

  /* Scroll reveal */
  var revealEls = document.querySelectorAll('.reveal');
  if (revealEls.length && 'IntersectionObserver' in window) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    revealEls.forEach(function (el) {
      revealObserver.observe(el);
    });
  } else {
    revealEls.forEach(function (el) {
      el.classList.add('is-visible');
    });
  }

  /* Animated counters */
  var counters = document.querySelectorAll('[data-count]');
  if (counters.length && 'IntersectionObserver' in window) {
    var counterObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var target = parseInt(el.getAttribute('data-count'), 10);
        var duration = 1200;
        var start = performance.now();

        function step(now) {
          var progress = Math.min((now - start) / duration, 1);
          var eased = 1 - Math.pow(1 - progress, 3);
          el.textContent = Math.round(target * eased);
          if (progress < 1) requestAnimationFrame(step);
        }

        requestAnimationFrame(step);
        counterObserver.unobserve(el);
      });
    }, { threshold: 0.5 });

    counters.forEach(function (c) {
      counterObserver.observe(c);
    });
  }

  /* Back to top */
  var backToTop = document.getElementById('back-to-top');
  if (backToTop) {
    backToTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ------------------------------------------------
     3D Scroll Card Animation with Hero Blending
     Sticky scroll section inside a tall trigger.
     progress 0→1 = scrolling through the trigger.
     ------------------------------------------------ */
  var trigger     = document.getElementById('scroll-anim-trigger');
  var cardWrap    = document.getElementById('scroll-card-wrap');
  var cardEl      = document.querySelector('#scroll-showcase .scroll-card');
  var cardInner   = document.querySelector('#scroll-showcase .scroll-card__inner');
  var cardHeader  = document.querySelector('#scroll-showcase .scroll-anim__header');
  var cardContent = document.querySelector('#scroll-showcase .scroll-card__content');
  var cardBar     = document.querySelector('#scroll-showcase .scroll-card__bar');
  var heroEl      = document.getElementById('hero');

  if (trigger && cardWrap && cardEl) {

    /* ---- helpers ---- */
    function lerp(a, b, t) { return a + (b - a) * t; }
    function clamp(v, lo, hi) { return Math.min(Math.max(v, lo), hi); }
    function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
    function easeInOut(t) {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    /* ---- calculate the scale so card corners meet viewport edges ---- */
    var fillScale = 1;
    function calcFillScale() {
      var nW = cardWrap.offsetWidth  || 1;
      var nH = cardWrap.offsetHeight || 1;
      var scaleW = window.innerWidth  / nW;
      var scaleH = window.innerHeight / nH;
      fillScale  = Math.max(scaleW, scaleH) * 1.02;
    }

    /* ---- main update loop ---- */
    function updateCard() {
      /* Hero section: slide up + fade out as the user scrolls */
      if (heroEl) {
        var heroRect = heroEl.getBoundingClientRect();
        var heroH = heroEl.offsetHeight || 1;
        var heroScrolled = -heroRect.top;
        var heroGrid = heroEl.querySelector('.hero__grid');
        var heroDecor = heroEl.querySelector('.hero__decor');
        var heroTickers = heroEl.querySelectorAll('.ticker');

        if (heroScrolled > 0) {
          /* Out transition: slide up + fade out over the first 60% of hero scroll */
          var heroProgress = clamp(heroScrolled / (heroH * 0.6), 0, 1);
          var heroE = easeOut(heroProgress);

          /* Gentler distances on small screens */
          var isMobile = window.matchMedia('(max-width: 768px)').matches;
          var slideDist = isMobile ? -40 : -70;
          var tickerDist = isMobile ? -20 : -40;

          if (heroGrid) {
            heroGrid.style.opacity = (1 - heroE).toFixed(3);
            heroGrid.style.transform = 'translateY(' + lerp(0, slideDist, heroE).toFixed(1) + 'px)';
          }
          if (heroDecor) {
            heroDecor.style.opacity = (1 - heroE).toFixed(3);
          }
          heroTickers.forEach(function (ticker) {
            ticker.style.opacity = (1 - heroE).toFixed(3);
            ticker.style.transform = 'translateY(' + lerp(0, tickerDist, heroE).toFixed(1) + 'px)';
          });
        } else {
          if (heroGrid) {
            heroGrid.style.opacity = '1';
            heroGrid.style.transform = 'translateY(0)';
          }
          if (heroDecor) {
            heroDecor.style.opacity = '';
          }
          heroTickers.forEach(function (ticker) {
            ticker.style.opacity = '';
            ticker.style.transform = '';
          });
        }
      }

      var trigRect = trigger.getBoundingClientRect();
      var viewH    = window.innerHeight;

      /* scrolledPast: px scrolled into the trigger past its entry */
      var scrolledPast = -trigRect.top;
      var scrollable   = trigger.offsetHeight - viewH;
      var progress     = clamp(scrolledPast / scrollable, 0, 1);

      /* ====== PHASE 1 (progress 0 → 0.5): Tilt + Scale to fill viewport ====== */
      var phase1 = clamp(progress / 0.5, 0, 1);

      /* Tilt: 35° → 0° */
      var rotate = lerp(35, 0, easeOut(phase1));

      /* Scale: 0.88 → fillScale (card grows until corners meet viewport) */
      var scale  = lerp(0.88, fillScale, easeInOut(phase1));

      cardWrap.style.transform =
        'rotateX(' + rotate.toFixed(2) + 'deg) scale(' + scale.toFixed(4) + ')';

      /* Header: fade out + slide up (progress 0 → 0.25) */
      if (cardHeader) {
        var hP  = clamp(progress / 0.25, 0, 1);
        var hE  = easeOut(hP);
        cardHeader.style.opacity   = (1 - hE).toFixed(3);
        cardHeader.style.transform = 'translateY(' + lerp(0, -50, hE).toFixed(1) + 'px)';
        if (hP >= 1) cardHeader.style.pointerEvents = 'none';
        else cardHeader.style.pointerEvents = '';
      }

      /* ====== PHASE 2 (progress 0.5 → 1.0): Opening / Flow Transition ====== */
      var phase2 = clamp((progress - 0.5) / 0.5, 0, 1);
      var p2e    = easeOut(phase2);

      /* Border radius + padding melt: 24px → 0 */
      var radius  = lerp(24, 0, p2e);
      var pad     = lerp(8, 0, p2e);
      var innerR  = lerp(18, 0, p2e);

      cardEl.style.borderRadius = radius.toFixed(1) + 'px';
      cardEl.style.padding      = pad.toFixed(1) + 'px';
      if (cardInner) {
        cardInner.style.borderRadius = innerR.toFixed(1) + 'px';
      }

      /* Fade out card content (services, CTA, bar) */
      if (cardContent) {
        cardContent.style.opacity   = (1 - p2e).toFixed(3);
        cardContent.style.transform = 'translateY(' + lerp(0, -40, p2e).toFixed(1) + 'px)';
      }
      if (cardBar) {
        cardBar.style.opacity = (1 - p2e).toFixed(3);
      }

      /* Shadow melts away */
      var shadowA = 1 - p2e;
      cardEl.style.boxShadow =
        '0 20px 60px -15px rgba(17, 17, 22, ' + (0.1 * shadowA).toFixed(3) + '), ' +
        '0 0 1px rgba(17, 17, 22, ' + (0.12 * shadowA).toFixed(3) + ')';
    }

    window.addEventListener('scroll', updateCard, { passive: true });
    window.addEventListener('resize', function () {
      calcFillScale();
      updateCard();
    }, { passive: true });

    calcFillScale();
    updateCard();
  }
})();

/* 3D Tilt Card — mouse-tracking for [data-tilt] elements */
(function () {
  var cards = document.querySelectorAll('[data-tilt]');
  if (!cards.length) return;

  cards.forEach(function (card) {
    card.addEventListener('mousemove', function (e) {
      var rect = card.getBoundingClientRect();
      var x = e.clientX - rect.left;
      var y = e.clientY - rect.top;
      var cx = rect.width / 2;
      var cy = rect.height / 2;
      var ry = ((x - cx) / cx) * 8;
      var rx = -((y - cy) / cy) * 8;
      var mx = ((x / rect.width) * 100).toFixed(1);
      var my = ((y / rect.height) * 100).toFixed(1);

      card.style.setProperty('--rx', rx + 'deg');
      card.style.setProperty('--ry', ry + 'deg');
      card.style.setProperty('--mx', mx + '%');
      card.style.setProperty('--my', my + '%');
    });

    card.addEventListener('mouseleave', function () {
      card.style.setProperty('--rx', '0deg');
      card.style.setProperty('--ry', '0deg');
    });
  });
})();

/* Tabs */
(function () {
  document.querySelectorAll('.tabs').forEach(function (tabs) {
    var triggers = tabs.querySelectorAll('.tabs__trigger');
    var panels = tabs.querySelectorAll('.tabs__panel');

    triggers.forEach(function (trigger) {
      trigger.addEventListener('click', function () {
        triggers.forEach(function (t) { t.classList.remove('tabs__trigger--active'); });
        panels.forEach(function (p) { p.classList.remove('tabs__panel--active'); });

        trigger.classList.add('tabs__trigger--active');
        var target = tabs.querySelector('#' + trigger.getAttribute('data-tab'));
        if (target) target.classList.add('tabs__panel--active');
      });
    });
  });
})();

/* Media Preview Modal & Video Hover Interactivity */
(function () {
  /* Video hover preview on project cards */
  var workCards = document.querySelectorAll('.work-card');
  workCards.forEach(function (card) {
    var video = card.querySelector('video');
    if (video) {
      card.addEventListener('mouseenter', function () {
        video.play().catch(function () {});
      });
      card.addEventListener('mouseleave', function () {
        video.pause();
      });
    }
  });

  /* Autoplay previews on mobile viewport when in view */
  if ('IntersectionObserver' in window && window.matchMedia('(max-width: 768px)').matches) {
    var videoObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var v = entry.target.querySelector('video');
        if (!v) return;
        if (entry.isIntersecting) {
          v.play().catch(function () {});
        } else {
          v.pause();
        }
      });
    }, { threshold: 0.5 });

    workCards.forEach(function (card) {
      videoObserver.observe(card);
    });
  }

  /* Modal setup */
  var overlay = document.getElementById('modal-overlay');
  var modalTitle = document.getElementById('modal-title');
  var modalBody = document.getElementById('modal-body');
  var modalCta = document.getElementById('modal-whatsapp-cta');
  var close1 = document.getElementById('modal-close');
  var close2 = document.getElementById('modal-close2');

  function openMediaModal(type, src, title, ctaUrl) {
    if (!overlay || !modalBody) return;
    if (modalTitle) modalTitle.textContent = title || 'Project Preview';
    if (modalCta && ctaUrl) modalCta.href = ctaUrl;

    modalBody.innerHTML = '';
    if (type === 'video') {
      var vid = document.createElement('video');
      vid.src = src;
      vid.controls = true;
      vid.autoplay = true;
      vid.playsInline = true;
      /* Mobile browsers require muted autoplay */
      if (window.matchMedia('(max-width: 768px)').matches) vid.muted = true;
      vid.className = 'modal__media-player';
      modalBody.appendChild(vid);
    } else {
      var img = document.createElement('img');
      img.src = src;
      img.alt = title || 'Project Preview';
      img.className = 'modal__media-player modal__media-image';
      modalBody.appendChild(img);
    }

    overlay.classList.add('modal-overlay--open');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeMediaModal() {
    if (!overlay) return;
    overlay.classList.remove('modal-overlay--open');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (modalBody) {
      var v = modalBody.querySelector('video');
      if (v) v.pause();
      modalBody.innerHTML = '';
    }
  }

  if (close1) close1.addEventListener('click', closeMediaModal);
  if (close2) close2.addEventListener('click', closeMediaModal);
  if (overlay) {
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeMediaModal();
    });
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && overlay && overlay.classList.contains('modal-overlay--open')) {
      closeMediaModal();
    }
  });

  /* Attach click events to all preview triggers and media wrappers */
  document.querySelectorAll('.btn-preview, .work-card__media-wrap').forEach(function (trigger) {
    trigger.addEventListener('click', function (e) {
      /* Prevent navigating if triggered by an anchor */
      e.preventDefault();
      var card = trigger.closest('.work-card');
      var type = trigger.getAttribute('data-media-type') || (card ? card.getAttribute('data-media-type') : 'video');
      var src = trigger.getAttribute('data-media-src') || (card ? card.getAttribute('data-media-src') : '');
      var title = trigger.getAttribute('data-title') || (card ? card.getAttribute('data-title') : 'Project Preview');
      var cta = trigger.getAttribute('data-cta') || (card ? card.getAttribute('data-cta') : '#');

      if (src) {
        openMediaModal(type, src, title, cta);
      }
    });
  });
})();

/* Preloader with fast, smooth light experience */
(function () {
  var preloader = document.getElementById('preloader');
  var barFill = preloader ? preloader.querySelector('.preloader__bar-fill') : null;
  if (!preloader) return;

  /* Skip if already visited this session */
  if (sessionStorage.getItem('preloader-done')) {
    preloader.remove();
    document.body.classList.remove('preloader-active');
    return;
  }

  /* Lock scroll */
  document.body.classList.add('preloader-active');

  var minTime = 750;
  var startTime = Date.now();
  var progress = 0;
  var assetsLoaded = false;

  /* Animate progress bar */
  var barInterval = setInterval(function () {
    var elapsed = Date.now() - startTime;
    var timeProgress = Math.min(elapsed / minTime, 1);
    var target = assetsLoaded ? 100 : timeProgress * 85;
    progress = Math.min(target, progress + 2);
    if (barFill) barFill.style.width = progress + '%';
    if (progress >= 100) clearInterval(barInterval);
  }, 25);

  /* Wait for fonts */
  var fontPromise = document.fonts ? document.fonts.ready : Promise.resolve();

  /* Wait for critical images */
  var images = Array.from(document.querySelectorAll('img')).slice(0, 3);
  var imagePromises = images.map(function (img) {
    if (img.complete) return Promise.resolve();
    return new Promise(function (resolve) {
      img.addEventListener('load', resolve);
      img.addEventListener('error', resolve);
    });
  });

  /* Resolve when ready */
  Promise.all([fontPromise, Promise.all(imagePromises)]).then(function () {
    assetsLoaded = true;
  });

  function hidePreloader() {
    progress = 100;
    if (barFill) barFill.style.width = '100%';

    setTimeout(function () {
      preloader.classList.add('preloader--hidden');
      document.body.classList.remove('preloader-active');
      sessionStorage.setItem('preloader-done', '1');

      setTimeout(function () {
        preloader.remove();
      }, 500);
    }, 250);
  }

  /* Check every 50ms if ready */
  var checkInterval = setInterval(function () {
    var elapsed = Date.now() - startTime;
    if (assetsLoaded && elapsed >= minTime) {
      clearInterval(checkInterval);
      hidePreloader();
    }
  }, 50);

  /* Safety: always hide after 2.5s */
  setTimeout(function () {
    clearInterval(checkInterval);
    if (!preloader.classList.contains('preloader--hidden')) {
      hidePreloader();
    }
  }, 2500);
})();

