// Interactions: work index with live preview, viewer (images, video, 3D), one-time reveals, nav + side rail highlight, copy email.
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
  prev.hidden = next.hidden = items.length < 2;
  strip.querySelectorAll('button').forEach((b, k) => b.setAttribute('aria-current', k === i));
}
function step(d) { i = (i + d + items.length) % items.length; show(d); }
function go(k) { const d = k - i; i = k; show(d); }

function openProject(key) {
  const p = data[key];
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
}
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
let sx = null; // swipe on touch
stage.addEventListener('pointerdown', e => { if (e.pointerType === 'touch') sx = e.clientX; });
stage.addEventListener('pointerup', e => {
  if (sx === null || items.length < 2) return;
  const dx = e.clientX - sx; sx = null;
  if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
});

/* ---------- work index: hover/focus a row, the preview on the right follows ---------- */
document.querySelectorAll('.work').forEach(work => {
  const rows = [...work.querySelectorAll('.row')];
  const frame = work.querySelector('.pv-frame');
  const img = frame.querySelector('img');
  const cap = work.querySelector('figcaption');
  let vid = null;
  function aim(row) {
    const p = data[row.dataset.key];
    rows.forEach(r => r.classList.toggle('on', r === row));
    if (img.getAttribute('src') !== p.thumb) img.src = p.thumb;
    cap.innerHTML = '';
    const t = document.createElement('span'); t.className = 'cap-t'; t.textContent = p.title;
    cap.append(t, `${p.label}. ${p.desc}`);
    vid?.remove(); vid = null;
    if (row.dataset.preview && hoverOK && !reduce) {
      vid = Object.assign(document.createElement('video'), { src: row.dataset.preview, muted: true, loop: true, playsInline: true });
      frame.append(vid);
      vid.play().catch(() => {});
    }
  }
  rows.forEach(r => {
    r.addEventListener('click', () => openProject(r.dataset.key));
    if (hoverOK) { r.addEventListener('pointerenter', () => aim(r)); }
    r.addEventListener('focus', () => aim(r));
  });
  aim(rows[0]);
  rows[0].classList.remove('on');
});

/* ---------- header and rail switch colors while the dark hero is on screen ---------- */
const heroEl = document.getElementById('home');
new IntersectionObserver(([e]) => document.body.classList.toggle('hero-dark', e.isIntersecting), { rootMargin: '-64px 0px 0px 0px' }).observe(heroEl);

/* ---------- copy email ---------- */
const copy = document.getElementById('copy');
copy?.addEventListener('click', async () => {
  try { await navigator.clipboard.writeText('maxmasocol@gmail.com'); copy.textContent = 'Copied'; }
  catch { copy.textContent = 'maxmasocol@gmail.com'; }
  setTimeout(() => { copy.textContent = 'Copy email'; }, 2000);
});

/* ---------- one-time reveals (content stays visible without JS or with reduced motion) ---------- */
if (!reduce && 'IntersectionObserver' in window) {
  const targets = document.querySelectorAll('.head, .list li, .about-photo, .about > div > *:not(.head), .contact > *:not(.head)');
  targets.forEach(el => el.classList.add('reveal'));
  const io = new IntersectionObserver(entries => {
    entries.filter(e => e.isIntersecting).forEach((e, k) => {
      e.target.style.transitionDelay = `${Math.min(k, 5) * 45}ms`;
      e.target.classList.add('seen'); io.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
  targets.forEach(el => io.observe(el));
}

/* ---------- nav and side rail: highlight the section in view ---------- */
const links = [...document.querySelectorAll('nav a, .rail a')];
const spy = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    const id = e.target.id === 'home' ? 'top' : e.target.id;
    links.forEach(a => a.classList.toggle('on', a.getAttribute('href') === '#' + id));
  });
}, { rootMargin: '-45% 0px -50% 0px' });
document.querySelectorAll('main section[id]').forEach(s => spy.observe(s));
