// Общее для концептов cielou: прелоадер, шапка, появление блоков, окно заказа
(function () {
  var TG = 'https://t.me/cielou_s';

  // прелоадер
  function done() { document.documentElement.classList.add('loaded'); }
  window.addEventListener('load', function () { setTimeout(done, 900); });
  setTimeout(done, 2600);

  // шапка ужимается при скролле
  var hd = document.querySelector('[data-head]');
  function onScroll() { if (hd) hd.classList.toggle('small', window.scrollY > 40); }
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  // блоки появляются при прокрутке
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
  document.querySelectorAll('.rv').forEach(function (el) { io.observe(el); });

  // окно заказа
  var m = document.createElement('div');
  m.className = 'order'; m.setAttribute('aria-hidden', 'true');
  m.innerHTML =
    '<div class="order-bg" data-close></div>' +
    '<form class="order-box" novalidate>' +
      '<button type="button" class="order-x" data-close aria-label="Закрыть">×</button>' +
      '<div class="order-pic"><img alt=""></div>' +
      '<div class="order-body">' +
        '<p class="order-kick">заказ у Саши</p>' +
        '<h3 class="order-title"></h3>' +
        '<p class="order-price"></p>' +
        '<label>как вас зовут<input name="n" autocomplete="name"></label>' +
        '<label>телефон или ник в телеграме<input name="c" required></label>' +
        '<label>пожелания<textarea name="w" rows="2" placeholder="цвет, количество, вопрос"></textarea></label>' +
        '<button class="order-go" type="submit">отправить Саше в телеграм</button>' +
        '<p class="order-note">текст заявки скопируется, останется вставить его в чат</p>' +
      '</div>' +
    '</form>';
  document.body.appendChild(m);
  var f = m.querySelector('form'), cur = {};

  function open(o) {
    cur = o;
    m.querySelector('.order-title').textContent = o.name;
    m.querySelector('.order-price').textContent = o.price || '';
    var pic = m.querySelector('.order-pic');
    pic.style.display = o.img ? '' : 'none';
    if (o.img) pic.querySelector('img').src = o.img;
    if (o.wish) f.w.value = o.wish;
    m.classList.add('on'); m.setAttribute('aria-hidden', 'false');
    setTimeout(function () { f.n.focus(); }, 300);
  }
  function close() { m.classList.remove('on'); m.setAttribute('aria-hidden', 'true'); }
  window.cielouOrder = open;

  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-order]');
    if (t) {
      e.preventDefault();
      open({ name: t.dataset.order, price: t.dataset.price, img: t.dataset.img, wish: t.dataset.wish || '' });
    }
    if (e.target.closest('[data-close]')) close();
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });

  f.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!f.c.value.trim()) { f.c.focus(); f.c.classList.add('err'); return; }
    var txt = 'Привет, Саша! Хочу заказать: ' + cur.name + (cur.price ? ' (' + cur.price + ')' : '') +
      '\nИмя: ' + (f.n.value || '—') + '\nКонтакт: ' + f.c.value + (f.w.value ? '\nПожелания: ' + f.w.value : '');
    try { navigator.clipboard.writeText(txt); } catch (err) {}
    window.open(TG, '_blank');
    f.querySelector('.order-go').textContent = 'скопировано, открываю телеграм';
    setTimeout(function () { f.querySelector('.order-go').textContent = 'отправить Саше в телеграм'; close(); f.reset(); }, 1800);
  });
  f.c.addEventListener('input', function () { f.c.classList.remove('err'); });
})();
