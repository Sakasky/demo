/* Case page: sticky left info column, scrolling hero + intro, alternating gallery,
   carousel with shared-element lightbox, and a link to the next case. */
(function () {
  'use strict';

  var App = window.App;
  var D = App.data;
  var esc = App.esc;
  var lines = App.lines;

  var id = new URLSearchParams(location.search).get('id') || 'yunzai';
  var idx = Math.max(0, D.cases.findIndex(function (c) { return c.id === id; }));
  var c = D.cases[idx];
  var next = D.cases[(idx + 1) % D.cases.length];
  document.title = c.title + ' — OUTLIER INTERIOR';

  function img(p, extra) {
    return '<img src="' + p.src + '" width="' + p.w + '" height="' + p.h + '" alt="' + esc(c.title) + '"' + (extra || '') + '>';
  }

  var html =
    '<section class="case-top">' +
      '<aside class="case-info">' +
        '<h1 class="case-info__title">' + esc(c.title) + '</h1>' +
        '<p class="case-info__subtitle">' + esc(c.subtitle) + '</p>' +
        '<dl class="case-info__meta">' +
          '<div><dt class="vh">地點</dt><dd>' + esc(c.location) + '</dd></div>' +
          '<div><dt class="vh">年份</dt><dd>' + esc(c.year) + '</dd></div>' +
          '<div><dt class="vh">設計範圍</dt><dd>' + lines(c.scope) + '</dd></div>' +
        '</dl>' +
      '</aside>' +
      '<div class="case-main">' +
        '<figure class="case-hero">' + img(c.hero, ' fetchpriority="high"') + '</figure>' +
        '<div class="case-intro' + (c.pending ? ' case-intro--pending' : '') + '">' +
          c.intro.map(function (p) { return '<p>' + lines(p) + '</p>'; }).join('') +
        '</div>' +
      '</div>' +
    '</section>';

  if (c.gallery) {
    html += '<section class="case-gallery" aria-label="案例照片">' + c.gallery.map(function (g) {
      var cls = 'g-row g-row--' + g.side + (g.square ? ' g-row--square' : '');
      var ratio = g.square ? '1' : g.img.w + '/' + g.img.h;
      return '<figure class="' + cls + '"><div class="g-row__media" style="aspect-ratio:' + ratio + '">' + img(g.img, ' loading="lazy"') + '</div>' +
        '<figcaption class="g-row__cap">' + lines(g.caption) + '</figcaption></figure>';
    }).join('') + '</section>';
  }

  if (c.carousel) {
    html +=
      '<section class="carousel" aria-roledescription="carousel" aria-label="更多照片">' +
        '<div class="carousel__viewport"><ul class="carousel__track">' +
          c.carousel.map(function (p, i) {
            return '<li><button class="carousel__item" type="button" data-index="' + i + '" aria-label="放大照片 ' + (i + 1) + '">' + img(p, ' loading="lazy"') + '</button></li>';
          }).join('') +
        '</ul></div>' +
        '<button class="carousel__arrow carousel__arrow--prev" type="button" aria-label="上一張"><svg viewBox="0 0 16 32" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M14 2 2 16l12 14"/></svg></button>' +
        '<button class="carousel__arrow carousel__arrow--next" type="button" aria-label="下一張"><svg viewBox="0 0 16 32" fill="none" stroke="currentColor" stroke-width="1.6"><path d="m2 2 12 14L2 30"/></svg></button>' +
      '</section>';
  }

  html +=
    '<a class="next-case" href="case.html?id=' + next.id + '">' +
      '<span><span class="next-case__eyebrow">next case</span><span class="next-case__name">' + esc(next.title) + '</span></span>' +
      '<span class="next-case__thumb"><img src="' + next.cover.src + '" alt="" loading="lazy" style="object-position:' + next.cover.pos + '"></span>' +
    '</a>';

  var main = document.getElementById('main');
  main.innerHTML = html;

  App.initLenis();

  var nextLink = main.querySelector('.next-case');
  nextLink.addEventListener('click', function () {
    main.querySelector('.case-hero img').style.viewTransitionName = 'none';
    nextLink.querySelector('img').style.viewTransitionName = 'case-hero';
  });

  if (c.carousel) initCarousel(main.querySelector('.carousel'), c.carousel);

  /* ---------- carousel ---------- */

  function initCarousel(root, photos) {
    var track = root.querySelector('.carousel__track');
    var prev = root.querySelector('.carousel__arrow--prev');
    var next = root.querySelector('.carousel__arrow--next');

    var scroller = new App.HScroller({
      surface: root.querySelector('.carousel__viewport'),
      track: track,
      wheel: 'x',
      ease: 0.085,
      onUpdate: function (s) {
        prev.disabled = s.target <= 1;
        next.disabled = s.target >= s.max - 1;
      }
    });

    function step() {
      var item = track.querySelector('li');
      return item.offsetWidth + parseFloat(getComputedStyle(track).columnGap || 0);
    }
    prev.addEventListener('click', function () { var s = step(); scroller.scrollTo(Math.round(scroller.target / s - 1) * s); });
    next.addEventListener('click', function () { var s = step(); scroller.scrollTo(Math.round(scroller.target / s + 1) * s); });

    var box = createLightbox();
    track.addEventListener('click', function (e) {
      var btn = e.target.closest('.carousel__item');
      if (btn) box.open(btn, photos[+btn.getAttribute('data-index')]);
    });
  }

  /* ---------- lightbox: the photo grows out of its thumbnail and shrinks back into it ---------- */

  function createLightbox() {
    var lb = App.el(
      '<div class="lightbox" role="dialog" aria-modal="true" aria-label="放大照片" hidden>' +
        '<div class="lightbox__scrim"></div>' +
        '<figure class="lightbox__frame"><img alt=""></figure>' +
        '<button class="lightbox__close" type="button">CLOSE</button>' +
      '</div>'
    );
    document.body.appendChild(lb);
    var scrim = lb.querySelector('.lightbox__scrim');
    var frame = lb.querySelector('.lightbox__frame');
    var picture = frame.querySelector('img');
    var closeBtn = lb.querySelector('.lightbox__close');
    var source = null, photo = null, tl = null, isOpen = false;

    function fit() {
      var vw = window.innerWidth, vh = window.innerHeight;
      var s = Math.min((vw * 0.82) / photo.w, (vh * 0.79) / photo.h);
      var w = photo.w * s, h = photo.h * s;
      return { left: (vw - w) / 2, top: Math.max(vh * 0.105, (vh - h) / 2), width: w, height: h };
    }
    function rectOf(node) {
      var r = node.getBoundingClientRect();
      return { left: r.left, top: r.top, width: r.width, height: r.height };
    }
    function placeClose(r) {
      gsap.set(closeBtn, { left: r.left + r.width - closeBtn.offsetWidth, top: r.top - closeBtn.offsetHeight - 10 });
    }

    function open(btn, p) {
      if (isOpen) return;
      isOpen = true;
      source = btn;
      photo = p;
      App.lock();
      picture.src = p.src;
      lb.hidden = false;
      var to = fit();
      placeClose(to);
      gsap.set(frame, rectOf(btn));
      btn.style.visibility = 'hidden';
      if (tl) tl.kill();
      tl = gsap.timeline()
        .fromTo(scrim, { autoAlpha: 0 }, { autoAlpha: 1, duration: App.dur(0.5) }, 0)
        .to(frame, Object.assign({ duration: App.dur(0.9), ease: 'power3.inOut' }, to), 0)
        .fromTo(closeBtn, { autoAlpha: 0 }, { autoAlpha: 1, duration: App.dur(0.35) }, App.dur(0.6));
      closeBtn.focus({ preventScroll: true });
    }

    function close() {
      if (!isOpen) return;
      isOpen = false;
      if (tl) tl.kill();
      tl = gsap.timeline({
        onComplete: function () {
          source.style.visibility = '';
          lb.hidden = true;
          App.unlock();
          source.focus({ preventScroll: true });
        }
      })
        .to(closeBtn, { autoAlpha: 0, duration: App.dur(0.2) }, 0)
        .to(frame, Object.assign({ duration: App.dur(0.8), ease: 'power3.inOut' }, rectOf(source)), 0)
        .to(scrim, { autoAlpha: 0, duration: App.dur(0.5) }, App.dur(0.3));
    }

    closeBtn.addEventListener('click', close);
    scrim.addEventListener('click', close);
    frame.addEventListener('click', close);
    lb.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    window.addEventListener('resize', function () {
      if (!isOpen) return;
      var to = fit();
      gsap.set(frame, to);
      placeClose(to);
    });

    return { open: open, close: close };
  }
})();
