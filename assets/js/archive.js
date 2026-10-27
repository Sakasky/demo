/* Archive: photos only. Wheel/drag browses horizontally; clicking a thumbnail grows it in place
   (FLIP / shared-element transition), clicking it again or the white background shrinks it back. */
(function () {
  'use strict';

  var App = window.App;
  var D = App.data;
  var track = document.getElementById('archive-track');
  var strip = track.parentElement;

  track.innerHTML = D.archive.map(function (p, i) {
    return '<li class="archive__item" style="--ar:' + p.w + '/' + p.h + '">' +
      '<button class="archive__btn" type="button" aria-expanded="false" aria-label="放大照片 ' + (i + 1) + '">' +
        '<img src="' + p.src + '" alt="" width="' + p.w + '" height="' + p.h + '">' +
      '</button></li>';
  }).join('');

  var scroller = new App.HScroller({ surface: document.documentElement, viewport: strip, track: track });
  App.pageScroller = scroller;
  App.bindKeys(function () { return App.pageScroller; });

  var items = track.querySelectorAll('.archive__item');
  var openItem = null;
  var flip = null;

  function setOpen(item, isOpen) {
    item.classList.toggle('is-open', isOpen);
    item.firstElementChild.setAttribute('aria-expanded', String(isOpen));
  }

  function toggle(item) {
    var state = Flip.getState(items);
    var r = item.getBoundingClientRect();
    var anchor = r.left + r.width / 2;
    var prev = openItem;

    if (prev) setOpen(prev, false);
    openItem = prev === item ? null : item;
    if (openItem) setOpen(openItem, true);

    // New layout is in place: centre the opened photo, or keep a closing photo under the cursor.
    scroller.measure();
    var centre = item.offsetLeft + item.offsetWidth / 2;
    scroller.jumpTo(openItem ? centre - strip.clientWidth / 2 : centre - anchor);

    if (flip) flip.kill();
    flip = Flip.from(state, {
      duration: App.dur(0.95),
      ease: 'power3.inOut',
      scale: true,
      onComplete: function () { flip = null; }
    });
  }

  track.addEventListener('click', function (e) {
    var btn = e.target.closest('.archive__btn');
    if (btn) toggle(btn.parentElement);
  });

  // Clicking the white background shrinks the open photo back.
  document.addEventListener('click', function (e) {
    if (!openItem || e.target.closest('.archive__btn, .site-header, .menu, .contact')) return;
    toggle(openItem);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && openItem && !document.documentElement.classList.contains('is-locked')) toggle(openItem);
  });

  window.addEventListener('resize', function () {
    if (openItem) scroller.jumpTo(openItem.offsetLeft + openItem.offsetWidth / 2 - strip.clientWidth / 2);
  });
})();
