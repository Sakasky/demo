/* Shared chrome and behaviour: header, menu (booklets), contact modal,
   momentum scrolling (Lenis for vertical pages, HScroller for horizontal ones). */
(function () {
  'use strict';

  var D = window.OUTLIER_DATA;
  var BRAND = 'assets/img/brand/';
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var page = document.body.getAttribute('data-page');
  var App = (window.App = { page: page, data: D, reduceMotion: reduceMotion });

  if (window.gsap && window.Flip) gsap.registerPlugin(Flip);

  /* ---------- helpers ---------- */

  function clamp(v, min, max) { return Math.min(max, Math.max(min, v)); }
  function dur(s) { return reduceMotion ? 0 : s; }
  function el(html) {
    var t = document.createElement('template');
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function lines(arr) { return arr.map(esc).join('<br>'); }

  App.clamp = clamp;
  App.dur = dur;
  App.el = el;
  App.esc = esc;
  App.lines = lines;

  /* ---------- HScroller: vertical wheel / drag → horizontal movement with inertia ---------- */

  function HScroller(opts) {
    this.surface = opts.surface;
    this.track = opts.track;
    this.viewport = opts.viewport || this.track.parentElement;
    this.ease = opts.ease || 0.075;
    this.wheelMode = opts.wheel || 'all'; // 'all' maps vertical wheel to horizontal; 'x' only takes horizontal swipes
    this.fling = opts.fling == null ? 320 : opts.fling;
    this.onUpdate = opts.onUpdate || null;
    this.target = 0;
    this.current = 0;
    this.max = 0;
    this.enabled = true;
    this._drag = null;
    this._suppressClick = false;
    this._bind();
    this.measure();
    this.render();
  }

  HScroller.prototype._bind = function () {
    var self = this;

    this._tick = function () { self.update(); };
    gsap.ticker.add(this._tick);

    this.surface.addEventListener('wheel', function (e) {
      if (!self.enabled || e.ctrlKey) return;
      var horizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY);
      if (self.wheelMode === 'x' && !horizontal) return;
      e.preventDefault();
      var d = horizontal ? e.deltaX : e.deltaY;
      if (e.deltaMode === 1) d *= 32;
      else if (e.deltaMode === 2) d *= self.viewport.clientWidth;
      self.scrollTo(self.target + d);
    }, { passive: false });

    this.surface.addEventListener('pointerdown', function (e) {
      if (!self.enabled || e.button !== 0) return;
      if (e.target.closest('input, textarea, select, label')) return;
      self._drag = { x: e.clientX, y: e.clientY, start: self.target, lastX: e.clientX, lastT: performance.now(), v: 0, moved: false, id: e.pointerId };
    });

    window.addEventListener('pointermove', function (e) {
      var d = self._drag;
      if (!d || e.pointerId !== d.id) return;
      var dx = e.clientX - d.x;
      if (!d.moved) {
        if (Math.abs(dx) < 6) return;
        if (self.wheelMode === 'x' && Math.abs(e.clientY - d.y) > Math.abs(dx)) { self._drag = null; return; }
        d.moved = true;
        self.surface.classList.add('is-dragging');
      }
      var t = d.start - dx;
      if (t < 0) t *= 0.35;
      else if (t > self.max) t = self.max + (t - self.max) * 0.35;
      self.target = t;
      var now = performance.now();
      var dt = now - d.lastT;
      if (dt > 0) {
        d.v = 0.8 * ((d.lastX - e.clientX) / dt) + 0.2 * d.v;
        d.lastX = e.clientX;
        d.lastT = now;
      }
    });

    function release(e) {
      var d = self._drag;
      if (!d || e.pointerId !== d.id) return;
      self._drag = null;
      if (!d.moved) return;
      self.surface.classList.remove('is-dragging');
      self._suppressClick = true;
      setTimeout(function () { self._suppressClick = false; }, 0);
      var idle = performance.now() - d.lastT;
      self.scrollTo(self.target + (idle < 90 ? d.v * self.fling : 0));
    }
    window.addEventListener('pointerup', release);
    window.addEventListener('pointercancel', release);

    // A drag must not turn into a click on a card or thumbnail.
    this.surface.addEventListener('click', function (e) {
      if (self._suppressClick) {
        e.preventDefault();
        e.stopPropagation();
        self._suppressClick = false;
      }
    }, true);
    this.surface.addEventListener('dragstart', function (e) { e.preventDefault(); });

    window.addEventListener('resize', function () { self.measure(); });
  };

  HScroller.prototype.measure = function () {
    this.max = Math.max(0, this.track.offsetWidth - this.viewport.clientWidth);
    this.target = clamp(this.target, 0, this.max);
    this.current = clamp(this.current, 0, this.max);
  };

  HScroller.prototype.scrollTo = function (x) {
    this.target = clamp(x, 0, this.max);
  };

  HScroller.prototype.jumpTo = function (x) {
    this.target = this.current = clamp(x, 0, this.max);
    this.render();
  };

  HScroller.prototype.update = function () {
    var dragging = this._drag && this._drag.moved;
    var diff = this.target - this.current;
    if (!dragging && Math.abs(diff) < 0.1) {
      if (diff !== 0) { this.current = this.target; this.render(); }
      return;
    }
    var ease = reduceMotion ? 1 : dragging ? 0.3 : this.ease;
    var k = 1 - Math.pow(1 - ease, gsap.ticker.deltaRatio(60));
    this.current += diff * k;
    this.render();
  };

  HScroller.prototype.render = function () {
    this.track.style.transform = 'translate3d(' + (-this.current).toFixed(2) + 'px,0,0)';
    if (this.onUpdate) this.onUpdate(this);
  };

  App.HScroller = HScroller;

  /* ---------- page-level scrolling & locking ---------- */

  App.pageScroller = null; // set by horizontal pages
  App.lenis = null;        // set on vertical pages

  App.initLenis = function () {
    if (!window.Lenis) return null;
    var lenis = new Lenis({ lerp: reduceMotion ? 1 : 0.085, smoothWheel: true, wheelMultiplier: 1 });
    gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
    App.lenis = lenis;
    return lenis;
  };

  var locks = 0;
  App.lock = function () {
    locks++;
    if (App.lenis) App.lenis.stop();
    if (App.pageScroller) App.pageScroller.enabled = false;
    document.documentElement.classList.add('is-locked');
  };
  App.unlock = function () {
    locks = Math.max(0, locks - 1);
    if (locks) return;
    if (App.lenis) App.lenis.start();
    if (App.pageScroller) App.pageScroller.enabled = true;
    document.documentElement.classList.remove('is-locked');
  };

  // Arrow / Page keys move horizontal pages, since there is no native scrollbar there.
  App.bindKeys = function (getScroller) {
    document.addEventListener('keydown', function (e) {
      var s = getScroller();
      if (!s || !s.enabled || e.target.closest('input, textarea')) return;
      var step = s.viewport.clientWidth * 0.5;
      var map = { ArrowRight: step, ArrowDown: step, PageDown: step * 1.6, ArrowLeft: -step, ArrowUp: -step, PageUp: -step * 1.6 };
      if (e.key === 'Home') s.scrollTo(0);
      else if (e.key === 'End') s.scrollTo(s.max);
      else if (map[e.key]) s.scrollTo(s.target + map[e.key]);
      else return;
      e.preventDefault();
    });
  };

  /* ---------- focus trap for dialogs ---------- */

  function trapFocus(container, e) {
    if (e.key !== 'Tab') return;
    var f = container.querySelectorAll('a[href], button:not([disabled]), input, textarea, [tabindex]:not([tabindex="-1"])');
    f = Array.prototype.filter.call(f, function (n) { return n.offsetParent !== null; });
    if (!f.length) return;
    var first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
  App.trapFocus = trapFocus;

  /* ---------- header ---------- */

  function buildHeader() {
    var header = el(
      '<header class="site-header">' +
        '<a class="site-header__logo" href="index.html" aria-label="OUTLIER INTERIOR 首頁">' +
          '<img src="' + BRAND + 'logo-outlier.svg" alt="OUTLIER INTERIOR" width="98" height="36">' +
        '</a>' +
        '<span class="site-header__sig"><img src="' + BRAND + 'signature.svg" alt="Andrew liu" width="105" height="64"></span>' +
        '<button class="site-header__link" type="button" data-open="menu" aria-haspopup="dialog">MENU</button>' +
        '<button class="site-header__link" type="button" data-open="contact" aria-haspopup="dialog">CONTACT</button>' +
      '</header>'
    );
    document.body.insertBefore(header, document.body.firstChild);
  }

  /* ---------- menu (booklets) ---------- */

  var BOOKLET_ORDER = ['cases', 'podcasts', 'about', 'archive'];
  var PAGE_TO_BOOKLET = { home: 'cases', 'case': 'cases', podcasts: 'podcasts', about: 'about', archive: 'archive' };

  function bookletHTML(key) {
    var head =
      '<div class="booklet__head"><span class="booklet__brand">OUTLIER<br>DESIGN</span>' +
      '<img class="booklet__sig" src="' + BRAND + 'signature.svg" alt="" width="105" height="64"></div>';
    var body = '';
    var href = key === 'cases' ? 'index.html' : key + '.html';

    if (key === 'cases') {
      body = '<div class="booklet__cases">' + D.cases.slice(0, 2).map(function (c) {
        return '<div class="mini-card"><p class="card__label"><span>' + esc(c.label) + '</span><span class="card__sep" aria-hidden="true"></span><span>' + esc(c.category) + '</span></p>' +
          '<img src="' + c.cover.src + '" alt="" style="object-position:' + c.cover.pos + '"></div>';
      }).join('') + '</div>';
    } else if (key === 'podcasts') {
      body = '<div class="booklet__strip booklet__strip--inset">' + D.podcasts.map(function (p) {
        return '<img src="' + p.src + '" alt="" style="aspect-ratio:' + p.w + '/' + p.h + '">';
      }).join('') + '</div>';
    } else if (key === 'about') {
      body = '<div class="booklet__portrait"><img src="' + D.about.src + '" alt=""></div>';
    } else if (key === 'archive') {
      body = '<div class="booklet__strip">' + D.archive.slice(0, 5).map(function (p) {
        return '<img src="' + p.src + '" alt="" style="aspect-ratio:' + p.w + '/' + p.h + '">';
      }).join('') + '</div>';
    }

    return '<li class="booklet-item"><a class="booklet" href="' + href + '" data-key="' + key + '">' + head +
      '<h2 class="booklet__title">' + (key === 'podcasts' ? 'podcasts' : key) + '</h2>' + body + '</a></li>';
  }

  var menu = { el: null, scroller: null, tl: null, open: false, opener: null };

  function buildMenu() {
    var current = PAGE_TO_BOOKLET[page];
    // Optional requirement: the page you are on is listed first.
    var order = BOOKLET_ORDER.slice();
    if (current && current !== order[0]) order = [current].concat(order.filter(function (k) { return k !== current; }));

    menu.el = el(
      '<div class="menu" role="dialog" aria-modal="true" aria-label="選單" hidden>' +
        '<div class="menu__bg" aria-hidden="true"></div>' +
        '<button class="menu__close" type="button">CLOSE</button>' +
        '<div class="menu__viewport"><ul class="menu__track" role="list">' + order.map(bookletHTML).join('') + '</ul></div>' +
      '</div>'
    );
    document.body.appendChild(menu.el);

    menu.scroller = new HScroller({
      surface: menu.el,
      viewport: menu.el.querySelector('.menu__viewport'),
      track: menu.el.querySelector('.menu__track'),
      ease: 0.07
    });
    menu.scroller.enabled = false;

    menu.el.querySelector('.menu__close').addEventListener('click', closeMenu);
    menu.el.addEventListener('click', function (e) {
      // Clicking the terracotta background (not a booklet) closes the menu.
      if (!e.target.closest('.booklet, .menu__close')) closeMenu();
    });
    menu.el.addEventListener('keydown', function (e) { trapFocus(menu.el, e); });
    menu.el.querySelectorAll('.booklet').forEach(function (b) {
      b.addEventListener('click', function (e) {
        var key = b.getAttribute('data-key');
        // Already here (except "cases" from a case page, which returns home): just close.
        if (key === current && page !== 'case') {
          e.preventDefault();
          closeMenu();
        }
      });
    });
  }

  function openMenu(opener) {
    if (menu.open) return;
    menu.open = true;
    menu.opener = opener || null;
    App.lock();
    menu.el.hidden = false;
    menu.scroller.measure();
    menu.scroller.jumpTo(0);
    menu.scroller.enabled = true;

    var items = menu.el.querySelectorAll('.booklet-item');
    if (menu.tl) menu.tl.kill();
    menu.tl = gsap.timeline()
      .fromTo(menu.el.querySelector('.menu__bg'), { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: dur(0.75), ease: 'power4.inOut' })
      .fromTo(items, { yPercent: 115, rotation: function (i) { return i % 2 ? 3 : -3; } },
        { yPercent: 0, rotation: 0, duration: dur(1.1), ease: 'power3.out', stagger: dur(0.08) }, dur(0.3))
      .fromTo(menu.el.querySelector('.menu__close'), { autoAlpha: 0 }, { autoAlpha: 1, duration: dur(0.4) }, dur(0.6));

    menu.el.querySelector('.menu__close').focus({ preventScroll: true });
  }

  function closeMenu() {
    if (!menu.open) return;
    menu.open = false;
    menu.scroller.enabled = false;
    var items = menu.el.querySelectorAll('.booklet-item');
    if (menu.tl) menu.tl.kill();
    menu.tl = gsap.timeline({
      onComplete: function () {
        menu.el.hidden = true;
        App.unlock();
        if (menu.opener) menu.opener.focus({ preventScroll: true });
      }
    })
      .to(menu.el.querySelector('.menu__close'), { autoAlpha: 0, duration: dur(0.2) })
      .to(items, { yPercent: -115, duration: dur(0.6), ease: 'power3.in', stagger: dur(0.04) }, 0)
      .to(menu.el.querySelector('.menu__bg'), { clipPath: 'inset(0% 0% 100% 0%)', duration: dur(0.6), ease: 'power4.inOut' }, dur(0.3));
  }

  App.openMenu = openMenu;
  App.closeMenu = closeMenu;

  /* ---------- contact modal ---------- */

  var contact = { el: null, lenis: null, open: false, opener: null, tl: null };

  function buildContact() {
    var c = D.company;
    var categories = ['住家設計裝潢', '商業空間設計', '建築設計', '品牌設計', '藝術指導'];
    var budgets = ['100萬以下', '200萬', '300萬', '400萬', '500萬', '需洽談資訊'];

    function options(name, type, list) {
      return list.map(function (label) {
        return '<label class="opt"><input type="' + type + '" name="' + name + '" value="' + esc(label) + '">' +
          '<span class="opt__box" aria-hidden="true"></span><span class="opt__text">' + esc(label) + '</span></label>';
      }).join('');
    }

    contact.el = el(
      '<div class="contact" role="dialog" aria-modal="true" aria-labelledby="contact-title" hidden>' +
        '<div class="contact__scrim" aria-hidden="true"></div>' +
        '<div class="contact__scroller">' +
          '<div class="contact__content">' +
            '<section class="contact__panel">' +
              '<button class="contact__close" type="button">CLOSE</button>' +
              '<h2 class="contact__title" id="contact-title">lets build<br>together</h2>' +
              '<form class="contact__form" novalidate>' +
                '<div class="contact__info">' +
                  '<p class="contact__lead">請填寫案件需求，我們將會盡快與您聯繫。</p>' +
                  '<img class="contact__logo" src="' + BRAND + 'logo-outlier-word.svg" alt="OUTLIER" width="130" height="28">' +
                  '<address>' + esc(c.name) + '<br>' + esc(c.address) + '<br>' + esc(c.phone) + '</address>' +
                '</div>' +
                '<div class="contact__fields">' +
                  '<div class="field field--group" role="group" aria-labelledby="c-cat"><span class="field__label" id="c-cat">01.類別</span><div class="field__input opts">' + options('category', 'checkbox', categories) + '</div></div>' +
                  '<div class="field field--group field--budget" role="group" aria-labelledby="c-budget"><span class="field__label" id="c-budget">02.預算</span><div class="field__input opts">' + options('budget', 'radio', budgets) + '</div></div>' +
                  '<div class="field field--line"><label class="field__label" for="c-name">03.姓名</label><div class="field__input"><input id="c-name" name="name" type="text" autocomplete="name" placeholder="輸入姓名" required><p class="field__error" id="c-name-err"></p></div></div>' +
                  '<div class="field field--line"><label class="field__label" for="c-email">04.Email</label><div class="field__input"><input id="c-email" name="email" type="email" autocomplete="email" placeholder="輸入Email" required><p class="field__error" id="c-email-err"></p></div></div>' +
                  '<div class="field field--line field--area"><label class="field__label" for="c-msg">05.其他</label><div class="field__input"><textarea id="c-msg" name="message" rows="3" placeholder="任何您對案件合作相關的期待，資訊，或疑問。"></textarea></div></div>' +
                  '<div class="field field--submit"><span></span><div class="field__input"><button class="contact__submit" type="submit">送出</button><p class="contact__status" role="status" aria-live="polite"></p></div></div>' +
                '</div>' +
              '</form>' +
            '</section>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
    document.body.appendChild(contact.el);

    var scroller = contact.el.querySelector('.contact__scroller');
    if (window.Lenis) {
      contact.lenis = new Lenis({ wrapper: scroller, content: contact.el.querySelector('.contact__content'), lerp: reduceMotion ? 1 : 0.085, smoothWheel: true });
      contact.lenis.stop();
      gsap.ticker.add(function (time) { contact.lenis.raf(time * 1000); });
    }

    contact.el.querySelector('.contact__close').addEventListener('click', closeContact);
    scroller.addEventListener('click', function (e) {
      if (!e.target.closest('.contact__panel')) closeContact();
    });
    contact.el.addEventListener('keydown', function (e) { trapFocus(contact.el, e); });

    var form = contact.el.querySelector('form');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true;
      var name = form.elements.name, email = form.elements.email;
      function setErr(input, msg) {
        var err = document.getElementById(input.id + '-err');
        err.textContent = msg;
        input.setAttribute('aria-invalid', msg ? 'true' : 'false');
        if (msg) input.setAttribute('aria-describedby', err.id); else input.removeAttribute('aria-describedby');
        if (msg && ok) { input.focus(); ok = false; }
      }
      setErr(name, name.value.trim() ? '' : '請輸入姓名');
      setErr(email, !email.value.trim() ? '請輸入 Email' : /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim()) ? '' : 'Email 格式不正確');
      var status = contact.el.querySelector('.contact__status');
      if (!ok) { status.textContent = ''; return; }
      status.textContent = '已收到您的需求，我們將盡快與您聯繫。（Demo：資料未實際送出）';
      form.reset();
    });
  }

  function openContact(opener) {
    if (contact.open) return;
    contact.open = true;
    contact.opener = opener || null;
    App.lock();
    contact.el.hidden = false;
    contact.el.querySelector('.contact__scroller').scrollTop = 0;
    if (contact.lenis) { contact.lenis.scrollTo(0, { immediate: true }); contact.lenis.start(); }
    if (contact.tl) contact.tl.kill();
    contact.tl = gsap.timeline()
      .fromTo(contact.el.querySelector('.contact__scrim'), { autoAlpha: 0 }, { autoAlpha: 1, duration: dur(0.45), ease: 'power2.out' })
      .fromTo(contact.el.querySelector('.contact__panel'), { y: 90, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: dur(0.9), ease: 'power3.out' }, dur(0.1));
    contact.el.querySelector('.contact__close').focus({ preventScroll: true });
  }

  function closeContact() {
    if (!contact.open) return;
    contact.open = false;
    if (contact.lenis) contact.lenis.stop();
    if (contact.tl) contact.tl.kill();
    contact.tl = gsap.timeline({
      onComplete: function () {
        contact.el.hidden = true;
        App.unlock();
        if (contact.opener) contact.opener.focus({ preventScroll: true });
      }
    })
      .to(contact.el.querySelector('.contact__panel'), { y: 50, autoAlpha: 0, duration: dur(0.45), ease: 'power2.in' })
      .to(contact.el.querySelector('.contact__scrim'), { autoAlpha: 0, duration: dur(0.4) }, dur(0.2));
  }

  App.openContact = openContact;
  App.closeContact = closeContact;

  /* ---------- boot ---------- */

  buildHeader();
  buildMenu();
  buildContact();

  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-open]');
    if (!btn) return;
    if (btn.getAttribute('data-open') === 'menu') openMenu(btn);
    else openContact(btn);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (contact.open) closeContact();
    else if (menu.open) closeMenu();
  });

  // Deep links for demo/review: index.html#menu or #contact opens that overlay.
  window.addEventListener('load', function () {
    if (location.hash === '#menu') openMenu();
    if (location.hash === '#contact') openContact();
  });
})();
