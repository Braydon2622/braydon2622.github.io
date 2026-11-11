// Gremlets living on the portfolio. The same engine as the Mac app, the web habitat and the Chrome extension,
// with every [data-ledge] block on this page as a platform. Nothing on the page is changed or covered for long:
// the creatures are drawn on a transparent layer, clicks pass through everywhere except the creatures themselves,
// and the Gremlets button in the nav turns them off (remembered in this browser).
import { World, Species, V } from './gremlets/engine.js';
import { FX, Particles } from './gremlets/effects.js';

const BASE = new URL('../gremlets/Species/', import.meta.url).href;
const CAST = ['kindlet', 'dandelet', 'flurrie', 'capyzen', 'lilypip', 'bubbit', 'calicat', 'shibun', 'mossfawn', 'marimoss', 'puffcap', 'seedcheek', 'pomble', 'swirlby'];
const PREF = 'gremlets.portfolio';
const NAV_H = 72;

const toggleBtn = document.getElementById('gToggle');
const reduce = matchMedia('(prefers-reduced-motion: reduce)');
const narrow = matchMedia('(max-width: 700px)');

const pref = { get() { try { return localStorage.getItem(PREF); } catch { return null; } }, set(v) { try { localStorage.setItem(PREF, v); } catch { /* storage blocked */ } } };

let world, particles, root, canvas, ctx, bubbleHost, hint;
const art = new Map(), elById = new Map(), ids = new WeakMap(), bubbles = [], said = new Set();
let nextElId = 1, W = 0, H = 0, DPR = 1, running = false, raf = 0, last = 0, chores = 0, chatter = 4, driven = null;
const keys = { left: false, right: false };

// ---------------------------------------------------------------- sprites

const cache = new Map();
function loadSpecies(id) {
  if (cache.has(id)) return cache.get(id);
  const p = (async () => {
    const [sheet, info, blob] = await Promise.all([
      fetch(`${BASE}${id}/sheet.json`).then((r) => r.json()),
      fetch(`${BASE}${id}/species.json`).then((r) => r.json()).catch(() => ({})),
      fetch(`${BASE}${id}/sheet.png`).then((r) => r.blob()),
    ]);
    const image = await createImageBitmap(blob);
    const frames = Array.isArray(sheet.frames) ? sheet.frames : Object.values(sheet.frames);
    const rects = frames.map((f) => f.frame);
    const durations = frames.map((f) => (f.duration ?? 100) / 1000);
    const cv = document.createElement('canvas');
    cv.width = image.width; cv.height = image.height;
    const g = cv.getContext('2d', { willReadFrequently: true });
    g.drawImage(image, 0, 0);
    const masks = rects.map((r) => {
      const d = g.getImageData(r.x, r.y, r.w, r.h).data, m = new Array(r.w * r.h);
      for (let i = 0; i < m.length; i++) m[i] = d[i * 4 + 3] > 24;
      return m;
    });
    const animations = {};
    for (const tag of sheet.meta?.frameTags ?? []) {
      const idx = [];
      for (let i = tag.from; i <= tag.to; i++) idx.push(i);
      animations[tag.name.toLowerCase()] = { frames: idx, durations: idx.map((i) => durations[i]) };
    }
    const species = new Species({
      id, name: info.name ?? id, frameWidth: Math.max(...rects.map((r) => r.w)), frameHeight: Math.max(...rects.map((r) => r.h)),
      scale: 2, animations, masks, walkSpeed: (info.walkSpeed ?? 70) * 0.6, jumpPower: (info.jumpPower ?? 1) * 0.8,
      sleepiness: info.sleepiness ?? 1, flies: false, special: info.special ?? 'sparkle',
    });
    return { species, image, rects };
  })();
  cache.set(id, p);
  return p;
}

// ---------------------------------------------------------------- the page's ledges become platforms

const toScreen = (x, y) => ({ x, y: H - y });
const toWorld = (e) => V(e.clientX, H - e.clientY);

function scan() {
  if (!running) return;
  W = document.documentElement.clientWidth || innerWidth; H = innerHeight;
  elById.clear();
  const ledges = [];
  for (const el of document.querySelectorAll('[data-ledge]')) {
    const r = el.getBoundingClientRect();
    if (r.width < 80 || r.bottom <= NAV_H || r.top >= H || r.top < NAV_H + 8) continue;
    let id = ids.get(el);
    if (!id) { id = nextElId++; ids.set(el, id); }
    elById.set(id, el);
    // The moss sits a few pixels above the box, so stand on the moss.
    ledges.push({ id, x: r.left + 6, y: H - r.bottom, w: r.width - 12, h: r.height + 3 });
  }
  world.setEnvironment([{ x: 0, y: 0, w: W, h: H - NAV_H }], ledges.reverse());
}

function resize() {
  DPR = Math.min(devicePixelRatio || 1, 2);
  W = document.documentElement.clientWidth || innerWidth; H = innerHeight;
  canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
  canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
  scan();
}

async function addGremlet(id) {
  const a = await loadSpecies(id);
  if (!running) return;
  // Drop in onto the first ledge in view, spread out.
  const first = [...elById.values()][0]?.getBoundingClientRect();
  const x = first ? first.left + first.width * (0.15 + Math.random() * 0.7) : W * (0.2 + Math.random() * 0.6);
  const c = world.spawn(a.species, V(x, H - NAV_H - 20));
  art.set(c.id, a);
  particles.burst(FX.sparkle, V(x, H - NAV_H - 30), { count: 3, dx: [-14, 14], dy: [-8, 14], duration: 0.6 });
}

// ---------------------------------------------------------------- talking: a short line when a Gremlet stands on a ledge that has one

function say(id, text, secs) {
  for (const b of bubbles.filter((b) => b.id === id)) { b.el.remove(); bubbles.splice(bubbles.indexOf(b), 1); }
  const el = document.createElement('div');
  el.className = 'say'; el.textContent = text;
  bubbleHost.appendChild(el);
  bubbles.push({ el, id, until: performance.now() / 1000 + secs });
}

function chat() {
  const options = world.creatures.filter((c) => c.isGrounded && !c.isAsleep && elById.get(c.ground)?.dataset.say);
  if (!options.length) return;
  const c = options[Math.floor(Math.random() * options.length)];
  const el = elById.get(c.ground);
  const lines = el.dataset.say.split('|').filter((l) => !said.has(l));
  if (!lines.length) return;
  const line = lines[Math.floor(Math.random() * lines.length)];
  said.add(line);
  say(c.id, line, 3.2);
  if (c.activity === 'walk' || c.activity === 'idle') c.set('wave', 1.2);
}

// ---------------------------------------------------------------- input: poke, pet, drag and throw, double click to drive

let press = null, lastHover = null, lastTap = null;

function onMove(e) {
  if (!running) return;
  const p = toWorld(e);
  if (e.pointerType === 'mouse' || press) world.cursor = p;
  if (press) {
    const t = performance.now() / 1000;
    if (!press.dragging && Math.hypot(p.x - press.start.x, p.y - press.start.y) > 6) { press.dragging = true; world.beginDrag(press.c, press.start, t); canvas.classList.add('grab'); }
    if (press.dragging) world.drag(press.c, p, t);
    return;
  }
  const c = world.creatureAt(p);
  canvas.classList.toggle('live', !!c);
  if (c && lastHover) world.pet(c, Math.hypot(p.x - lastHover.x, p.y - lastHover.y));
  lastHover = c ? p : null;
}

function onDown(e) {
  const p = toWorld(e), c = world.creatureAt(p);
  if (!c) { canvas.classList.remove('live'); return; }
  e.preventDefault();
  const now = performance.now();
  if (lastTap && lastTap.id === c.id && now - lastTap.t < 320 && e.pointerType === 'mouse') { lastTap = null; drive(c); return; }
  lastTap = { id: c.id, t: now };
  try { canvas.setPointerCapture(e.pointerId); } catch { /* ignore */ }
  press = { c, start: p, dragging: false };
}

function onUp(e) {
  if (!press) return;
  const t = performance.now() / 1000;
  if (press.dragging) { world.drag(press.c, toWorld(e), t); world.endDrag(press.c, t); }
  else { world.poke(press.c); if (!said.has('poke')) { said.add('poke'); say(press.c.id, 'Hi! I\'m ' + press.c.species.name + '.', 2.4); } }
  press = null; canvas.classList.remove('grab');
}

function drive(c) {
  const old = world.byId(driven);
  if (old) old.speedBoost = 1;
  driven = c && driven !== c.id ? c.id : null;
  keys.left = keys.right = false;
  const d = world.byId(driven);
  hint.hidden = !d;
  if (d) { say(d.id, 'You drive! 🎮', 1.6); hint.textContent = `Driving ${d.species.name}: arrows to walk, up to jump, Esc to let go`; }
}

function onKey(e) {
  if (driven == null || e.target?.closest?.('input,textarea,select,[contenteditable]')) return;
  const k = e.key, down = e.type === 'keydown';
  const stop = () => { e.preventDefault(); e.stopPropagation(); };
  if (k === 'Escape' && down) { drive(null); stop(); }
  else if (k === 'ArrowLeft') { keys.left = down; stop(); }
  else if (k === 'ArrowRight') { keys.right = down; stop(); }
  else if (k === 'ArrowUp' && down && !e.repeat) {
    const c = world.byId(driven);
    if (c?.isGrounded) world.launch(c, V((keys.left || keys.right) ? c.facing * c.species.walkSpeed * 2.8 : c.facing * 20, Math.sqrt(2 * world.gravity * 150 * (c.species.jumpPower || 1))));
    stop();
  } else if (k === 'ArrowDown') stop();
}

function steer(dt) {
  const c = world.byId(driven);
  if (!c) { if (driven != null) drive(null); return; }
  c.speedBoost = 2.4;
  const dir = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
  if (c.activity === 'airborne') { if (dir) c.vel = V(c.vel.x + (dir * c.species.walkSpeed * 2.8 - c.vel.x) * Math.min(1, dt * 5), c.vel.y); return; }
  if (!c.isGrounded) return;
  if (dir) { c.facing = dir; c.edgeDecided = true; if (c.activity !== 'walk') c.set('walk', 0.3); else c.timer = 0.3; return; }
  if (c.activity === 'walk') { c.idleVariant = 'idle'; c.set('idle', 0.4); }
}

// ---------------------------------------------------------------- loop

function handleEvents(events) {
  for (const e of events) {
    const c = world.byId(e.id ?? e.rider ?? e.a);
    if (!c) continue;
    const top = V(c.pos.x, c.pos.y + c.size.y * 0.8);
    if (e.type === 'poked' || e.type === 'petted' || e.type === 'stacked') particles.burst(FX.heart, top, { dy: [24, 32], duration: 1.1 });
    else if (e.type === 'dizzy') particles.orbit(() => V(c.pos.x, c.pos.y + c.size.y * 0.72));
    else if (e.type === 'danceBeat') particles.burst(null, top, { imgs: [FX.note, FX.note2], dx: [-18, 18], dy: [18, 30], duration: 1 });
    else if (e.type === 'special') particles.burst(null, top, { imgs: [FX.sparkle, FX.smallStar], count: 5, dx: [-26, 26], dy: [-8, 26], duration: 0.8, stagger: 0.05 });
  }
}

function frame(now) {
  if (!running) return;
  const dt = Math.min(0.05, (now - last) / 1000 || 0);
  last = now;
  steer(dt);
  world.step(dt);
  handleEvents(world.drainEvents());
  particles.update(dt);
  chores += dt; chatter -= dt;
  if (chores > 0.5) { chores = 0; scan(); }
  if (chatter <= 0) { chatter = 9 + Math.random() * 8; chat(); }
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.clearRect(0, 0, W, H);
  ctx.imageSmoothingEnabled = false;
  for (const c of world.creatures) {
    const a = art.get(c.id), r = a?.rects[c.currentFrame];
    if (!r) continue;
    const s = toScreen(c.pos.x, c.pos.y);
    if (s.y < NAV_H - 4) continue;   // never draw over the nav
    const w = r.w * 2, h = r.h * 2;
    ctx.save();
    ctx.translate(Math.round(s.x), Math.round(s.y));
    if (c.facing < 0) ctx.scale(-1, 1);
    ctx.drawImage(a.image, r.x, r.y, r.w, r.h, -w / 2, -h, w, h);
    ctx.restore();
    if (c.id === driven) {
      const m = toScreen(c.pos.x, c.pos.y + c.size.y + 8 + Math.abs(Math.sin(now / 200)) * 4);
      ctx.fillStyle = '#f5b83d';
      for (let row = 0; row < 3; row++) ctx.fillRect(Math.round(m.x) - (3 - row) * 2, Math.round(m.y) - (3 - row) * 2, (6 - row * 2) * 2 + 2, 2);
    }
  }
  particles.draw(ctx, toScreen, 2);
  const t = now / 1000;
  for (let i = bubbles.length - 1; i >= 0; i--) {
    const b = bubbles[i], c = world.byId(b.id);
    if (!c || t > b.until) { b.el.remove(); bubbles.splice(i, 1); continue; }
    const s = toScreen(c.pos.x, c.pos.y + c.size.y + 6);
    b.el.style.left = Math.round(Math.min(W - 90, Math.max(90, s.x))) + 'px';
    b.el.style.top = Math.round(Math.max(NAV_H + 26, s.y)) + 'px';
  }
  raf = requestAnimationFrame(frame);
}

// ---------------------------------------------------------------- on and off

function mount() {
  root = document.createElement('div');
  root.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:30;';
  root.setAttribute('aria-hidden', 'true');
  const sh = root.attachShadow({ mode: 'open' });
  sh.innerHTML = `<style>
    canvas{position:fixed;inset:0;pointer-events:none;image-rendering:pixelated}
    canvas.live{pointer-events:auto;cursor:grab} canvas.grab{cursor:grabbing;pointer-events:auto}
    .say{position:fixed;transform:translate(-50%,-100%);background:#fbfcfa;color:#17201b;border:2px solid #17201b;border-radius:6px;padding:3px 9px;
      font:500 14px/1.3 "Pixelify Sans",ui-monospace,monospace;white-space:nowrap;pointer-events:none;box-shadow:2px 2px 0 #17201b}
    .hint{position:fixed;left:50%;bottom:16px;transform:translateX(-50%);background:#f5b83d;color:#2a1d00;padding:8px 14px;border-radius:8px;
      font:700 13.5px "Hanken Grotesk",system-ui,sans-serif;pointer-events:none;white-space:nowrap;max-width:94vw;overflow:hidden;text-overflow:ellipsis}
    [hidden]{display:none!important}
  </style><canvas></canvas><div></div><div class="hint" hidden></div>`;
  canvas = sh.querySelector('canvas'); ctx = canvas.getContext('2d');
  bubbleHost = sh.querySelector('div'); hint = sh.querySelector('.hint');
  document.body.appendChild(root);
  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', onUp);
}

const onScroll = () => { if (running) scan(); };

function start() {
  if (running) return;
  running = true;
  world = new World(); particles = new Particles();
  art.clear(); bubbles.length = 0; driven = null;
  mount();
  resize();
  addEventListener('pointermove', onMove, true);
  addEventListener('keydown', onKey, true);
  addEventListener('keyup', onKey, true);
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', resize);
  const count = narrow.matches ? 1 : 3;
  const pool = [...CAST].sort(() => Math.random() - 0.5);
  for (let i = 0; i < count; i++) setTimeout(() => addGremlet(pool[i]), 500 + i * 450);
  last = performance.now();
  raf = requestAnimationFrame(frame);
  toggleBtn?.setAttribute('aria-pressed', 'true');
  window.gremlets = { world, drive, scan, get driven() { return driven; }, stop };
}

function stop() {
  running = false;
  cancelAnimationFrame(raf);
  removeEventListener('pointermove', onMove, true);
  removeEventListener('keydown', onKey, true);
  removeEventListener('keyup', onKey, true);
  removeEventListener('scroll', onScroll);
  removeEventListener('resize', resize);
  root?.remove();
  toggleBtn?.setAttribute('aria-pressed', 'false');
}

toggleBtn?.addEventListener('click', () => {
  if (running) { stop(); pref.set('off'); } else { start(); pref.set('on'); }
});

// On by default, except for people who asked their device for less motion (they can still turn them on).
const saved = pref.get();
if (saved === 'on' || (saved !== 'off' && !reduce.matches)) start();
