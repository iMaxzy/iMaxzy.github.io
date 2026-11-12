// Viewer: one dialog for images, videos and 3D viewers. Arrow keys move between a project's images.
const data = JSON.parse(document.getElementById('data').textContent);
const dlg = document.getElementById('viewer');
const stage = dlg.querySelector('.stage');
const [prev, next] = [dlg.querySelector('.prev'), dlg.querySelector('.next')];
let items = [], i = 0, title = '';

function show() {
  const it = items[i];
  stage.replaceChildren();
  let el;
  if (it.t === 'video') {
    el = Object.assign(document.createElement('video'), { src: it.src, poster: it.poster, controls: true, autoplay: true, playsInline: true });
  } else if (it.t === '3d') {
    el = Object.assign(document.createElement('iframe'), { src: it.src, title });
  } else {
    el = Object.assign(document.createElement('img'), { src: it.src, alt: `${title}, image ${i + 1} of ${items.length}` });
  }
  stage.append(el);
  prev.hidden = next.hidden = items.length < 2;
}
function step(d) { i = (i + d + items.length) % items.length; show(); }

document.querySelectorAll('.tile').forEach(t => t.addEventListener('click', () => {
  const p = data[t.dataset.key];
  items = p.items; i = 0; title = p.title;
  dlg.querySelector('h3').textContent = p.title;
  dlg.querySelector('.cap p').textContent = p.desc;
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
// Close on the X or on a click outside the box; stop media so it does not play on in the background.
dlg.addEventListener('click', e => { if (e.target === dlg || e.target.hasAttribute('data-close')) dlg.close(); });
dlg.addEventListener('close', () => stage.replaceChildren());
