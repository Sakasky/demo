/* Home: horizontal showcase of up to 6 selected cases. */
(function () {
  'use strict';

  var App = window.App;
  var D = App.data;
  var esc = App.esc;
  var list = document.getElementById('showcase');

  list.innerHTML = D.cases.slice(0, D.maxShowcase).map(function (c) {
    var veil = c.hoverLogo
      ? '<img class="card__logo" src="' + c.hoverLogo.src + '" alt="" style="width:' + c.hoverLogo.width + '%">'
      : '<span class="card__veil-text"><span class="card__script">' + esc(c.hoverText.script) + '</span><span class="card__zh">' + esc(c.hoverText.zh) + '</span></span>';
    return '<li class="card"><a class="card__link" href="case.html?id=' + c.id + '">' +
      '<p class="card__label"><span>' + esc(c.label) + '</span><span class="card__sep" aria-hidden="true"></span><span>' + esc(c.category) + '</span></p>' +
      '<div class="card__media"><img src="' + c.cover.src + '" alt="' + esc(c.title) + '" width="' + c.cover.w + '" height="' + c.cover.h + '" style="object-position:' + c.cover.pos + '">' +
      '<div class="card__veil" aria-hidden="true">' + veil + '</div></div>' +
      '</a></li>';
  }).join('');

  App.pageScroller = new App.HScroller({
    surface: document.documentElement,
    viewport: document.getElementById('main'),
    track: list
  });
  App.bindKeys(function () { return App.pageScroller; });

  // The clicked cover becomes the case hero during the page transition.
  list.addEventListener('click', function (e) {
    var link = e.target.closest('.card__link');
    if (link) link.querySelector('.card__media > img').style.viewTransitionName = 'case-hero';
  });
  window.addEventListener('pageshow', function () {
    list.querySelectorAll('.card__media > img').forEach(function (img) { img.style.viewTransitionName = ''; });
  });
})();
