// Interactions: viewer (images, video, 3D), video hover preview, hero pointer drift, one-time reveals, nav highlight.
const data = JSON.parse(document.getElementById('data').textContent);
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const hoverOK = matchMedia('(hover: hover) and (pointer: fine)').matches;
document.documentElement.classList.add('js');

/* ---------- viewer ---------- */
const dlg = document.getElementById('viewer');
const stage = dlg.querySelector('.stage');
const strip = dlg.querySelector('.strip');
const [prev, next] = [dlg.querySelector('.prev'), dlg.querySelector('.next')];
let items = [], i = 0, title = '';

function media(it, n) {
  if (it.t === 'video') return Object.assign(document.createElement('video'), { src: it.src, poster: it.poster, controls: true, autoplay: true, playsInline: true });
  if (it.t === '3d') return Object.assign(document.createElement('iframe'), { src: it.src, title });
  return Object.assign(document.createElement('img'), { src: it.src, alt: `${title}, image ${n + 1} of ${items.length}` });
}
function show(dir = 0) {
  const el = media(items[i], i);
  if (dir && !reduce) el.classList.add(dir > 0 ? 'in-right' : 'in-left');
  stage.replaceChildren(el);
  const multi = items.length > 1;
  prev.hidden = next.hidden = !multi;
  strip.querySelectorAll('button').forEach((b, k) => b.setAttribute('aria-current', k === i));
}
function step(d) { i = (i + d + items.length) % items.length; show(d); }
function go(k) { const d = k - i; i = k; show(d); }

document.querySelectorAll('.tile').forEach(t => t.addEventListener('click', () => {
  const p = data[t.dataset.key];
  items = p.items; i = 0; title = p.title;
  dlg.querySelector('h3').textContent = p.title;
  dlg.querySelector('.cap p').textContent = p.desc;
  strip.replaceChildren(...(items.length > 1 && items[0].t === 'img' ? items.map((it, k) => {
    const b = document.createElement('button');
    b.type = 'button'; b.setAttribute('aria-label', `Image ${k + 1}`);
    b.innerHTML = `<img src="${it.src.replace('img/', 'img/t/')}" alt="" width="64" height="64">`;
    b.addEventListener('click', () => go(k));
    return b;
  }) : []));
  show();
  dlg.showModal();
}));
prev.addEventListener('click', () => step(-1));
next.addEventListener('click', () => step(1));
dlg.addEventListener('keydown', e => {
  if (items.length < 2) return;
  if (e.key === 'ArrowLeft') step(-1);
  if (e.key === 'ArrowRight') step(1);
});
// Close on X or on a click outside the box; clearing the stage stops any playing video.
dlg.addEventListener('click', e => { if (e.target === dlg || e.target.hasAttribute('data-close')) dlg.close(); });
dlg.addEventListener('close', () => stage.replaceChildren());
// Swipe on touch: a quick horizontal drag moves between images.
let sx = null;
stage.addEventListener('pointerdown', e => { if (e.pointerType === 'touch') sx = e.clientX; });
stage.addEventListener('pointerup', e => {
  if (sx === null || items.length < 2) return;
  const dx = e.clientX - sx; sx = null;
  if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
});

/* ---------- video preview on hover (desktop only) ---------- */
if (hoverOK && !reduce) {
  document.querySelectorAll('.tile[data-preview]').forEach(t => {
    const frame = t.querySelector('.frame');
    let v;
    const start = () => {
      if (v) return;
      v = Object.assign(document.createElement('video'), { src: t.dataset.preview, muted: true, loop: true, playsInline: true, className: 'preview' });
      frame.append(v);
      v.play().catch(() => {});
    };
    const stop = () => { v?.remove(); v = null; };
    t.addEventListener('pointerenter', start);
    t.addEventListener('pointerleave', stop);
    t.addEventListener('focus', start);
    t.addEventListener('blur', stop);
  });
}

/* ---------- hero: image drifts toward the pointer with a soft spring ---------- */
const hero = document.querySelector('.hero-img');
if (hero && hoverOK && !reduce) {
  const img = hero.querySelector('img');
  let tx = 0, ty = 0, x = 0, y = 0, raf = 0;
  const tick = () => {
    x += (tx - x) * 0.08; y += (ty - y) * 0.08;
    img.style.transform = `translate(${x.toFixed(2)}px, ${y.toFixed(2)}px) scale(1.03)`;
    raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.05 ? requestAnimationFrame(tick) : 0;
  };
  const aim = () => { raf ||= requestAnimationFrame(tick); };
  document.querySelector('.hero').addEventListener('pointermove', e => {
    const r = hero.getBoundingClientRect();
    tx = ((e.clientX - r.left) / r.width - 0.5) * -18;
    ty = ((e.clientY - r.top) / r.height - 0.5) * -18;
    aim();
  });
  document.querySelector('.hero').addEventListener('pointerleave', () => { tx = ty = 0; aim(); });
}

/* ---------- one-time reveals (content stays visible without JS or with reduced motion) ---------- */
if (!reduce && 'IntersectionObserver' in window) {
  const targets = document.querySelectorAll('.sec h2, .grid > li, .about > *, .contact > *');
  targets.forEach(el => el.classList.add('reveal'));
  const io = new IntersectionObserver(entries => {
    const fresh = entries.filter(e => e.isIntersecting);
    fresh.forEach((e, k) => { e.target.style.transitionDelay = `${Math.min(k, 5) * 45}ms`; e.target.classList.add('seen'); io.unobserve(e.target); });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
  targets.forEach(el => io.observe(el));
}

/* ---------- nav: highlight the section in view ---------- */
const links = [...document.querySelectorAll('nav a')];
const spy = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    links.forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + e.target.id));
  });
}, { rootMargin: '-45% 0px -50% 0px' });
document.querySelectorAll('main section[id]').forEach(s => spy.observe(s));
