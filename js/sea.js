/* Azoki Studios hero: a small sea drawn in text.
   An original browser sketch in the spirit of Code Sea (it shares no code with the app).
   Everything is written into a grid of character cells, then drawn once per frame. */
(function () {
  const cv = document.getElementById('sea');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const PAL = [
    '#1b3657', // 0 light shafts
    '#63e6e2', // 1 plankton cyan
    '#b48cff', // 2 plankton violet
    '#cfe6ff', // 3 fish silver
    '#ffc857', // 4 amber
    '#58a866', // 5 kelp
    '#ff5fa2', // 6 coral pink
    '#f2d94e', // 7 coral yellow
    '#86abe0', // 8 whale mid
    '#eef5ff', // 9 bright
    '#ffe9a8', // 10 food
    '#2b4666', // 11 floor
    '#ff8fc7', // 12 jelly
    '#456a9c', // 13 whale dim
    '#3d7a4c'  // 14 kelp dim
  ];
  const RAMP = '.:;!1icoaqdbOQ08B@';

  let W = 0, H = 0, cw = 8, ch = 17, cols = 0, rows = 0, FS = 14, dpr = 1;
  let chr, col, lists;
  let fish = [], plankton = [], kelp = [], corals = [], jellies = [], food = [];
  let t = 0, last = 0, running = false, visible = true;
  const whale = { on: false, t0: 0, next: 5 };
  const ptr = { x: -999, y: -999, px: -999, py: -999, speed: 0, rest: 0, inside: false, drop: 0 };

  const rnd = (a, b) => a + Math.random() * (b - a);
  const hash = (x, y) => (((x * 73856093) ^ (y * 19349663)) >>> 0) % 100;

  function resize() {
    const r = cv.getBoundingClientRect();
    W = r.width; H = r.height;
    if (!W || !H) return;
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    FS = W < 700 ? 12 : 14;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.font = '500 ' + FS + 'px "JetBrains Mono", ui-monospace, Menlo, Consolas, monospace';
    ctx.textBaseline = 'top';
    cw = ctx.measureText('M').width || FS * 0.6;
    ch = Math.round(FS * 1.22);
    cols = Math.ceil(W / cw) + 1; rows = Math.ceil(H / ch) + 1;
    chr = new Uint16Array(cols * rows); col = new Int8Array(cols * rows);
    lists = PAL.map(() => []);
    seed();
  }

  function seed() {
    const nFish = Math.round(Math.min(170, Math.max(50, W / 9)));
    fish = [];
    for (let i = 0; i < nFish; i++) {
      fish.push({
        x: rnd(W * 0.4, W * 0.9), y: rnd(H * 0.2, H * 0.6),
        vx: rnd(-60, 60), vy: rnd(-30, 30),
        big: Math.random() < 0.45, k: Math.random() < 0.12 ? 4 : 3, flash: 0
      });
    }
    plankton = [];
    const nP = Math.round(cols * rows / 95);
    for (let i = 0; i < nP; i++) {
      plankton.push({ x: rnd(0, W), y: rnd(0, H), d: rnd(3, 11), ph: rnd(0, 6.3), sp: rnd(0.6, 2),
        k: Math.random() < 0.3 ? 2 : 1, c: Math.random() < 0.5 ? '+' : (Math.random() < 0.5 ? '.' : '*') });
    }
    kelp = [];
    for (let x = 2; x < cols; x += Math.round(rnd(5, 13))) {
      kelp.push({ x, h: Math.round(rnd(5, Math.min(20, rows * 0.36))), ph: rnd(0, 6.3), bend: 0 });
    }
    const T = [
      { k: 6, s: ['\\ | /', '\\\\|//', ' \\|/ '] },
      { k: 7, s: [' .~~~~. ', '(~sSs~Ss)', '(SsS~sSsS)'] },
      { k: 4, s: ['(0) (0)', '( ) ( )', '( )_( )'] },
      { k: 2, s: [' \\|/ ', '--*--', ' /|\\ '] },
      { k: 6, s: ['x\\|/x', '\\x|x/', ' \\|/ '] }
    ];
    corals = [];
    for (let x = 1; x < cols - 8; x += Math.round(rnd(11, 22))) {
      corals.push({ x, tpl: T[(Math.random() * T.length) | 0] });
    }
    jellies = [];
    const nJ = W < 700 ? 2 : 4;
    for (let i = 0; i < nJ; i++) jellies.push({ x: rnd(W * 0.08, W * 0.95), y: rnd(H * 0.2, H), ph: rnd(0, 6.3), vx: 0 });
    food = [];
  }

  function put(x, y, c, k) {
    x |= 0; y |= 0;
    if (x < 0 || y < 0 || x >= cols || y >= rows) return;
    const i = y * cols + x; chr[i] = c; col[i] = k;
  }
  function text(x, y, s, k) {
    for (let i = 0; i < s.length; i++) { const c = s.charCodeAt(i); if (c !== 32) put(x + i, y, c, k); }
  }

  /* ---------- simulation ---------- */
  function update(dt) {
    // pointer
    const dx = ptr.x - ptr.px, dy = ptr.y - ptr.py;
    const sp = Math.hypot(dx, dy) / Math.max(dt, 0.001);
    ptr.speed += (sp - ptr.speed) * 0.35; ptr.px = ptr.x; ptr.py = ptr.y;
    if (ptr.inside && ptr.speed < 8) ptr.rest += dt; else ptr.rest = 0;

    // food drifts down from a resting pointer
    const floorY = H - ch * 4;
    if (ptr.rest > 0.9 && ptr.y < floorY - 30 && food.length < 14) {
      ptr.drop -= dt;
      if (ptr.drop <= 0) { food.push({ x: ptr.x + rnd(-16, 16), y: ptr.y + 8, life: 14 }); ptr.drop = 0.45; }
    }
    for (let i = food.length - 1; i >= 0; i--) {
      const f = food[i]; f.y += 20 * dt; f.x += Math.sin(t * 2 + i) * 6 * dt; f.life -= dt;
      if (f.life <= 0 || f.y > floorY) food.splice(i, 1);
    }

    // the school: a figure-eight to follow, plus the usual three flocking rules
    const a = Math.min(W * 0.24, 420), cx = W * 0.62, cy = H * 0.42, tt = t * 0.22;
    const den = 1 + Math.sin(tt) * Math.sin(tt);
    const tx = cx + a * Math.cos(tt) / den, ty = cy + a * 0.62 * Math.sin(tt) * Math.cos(tt) / den;
    const n = fish.length;
    for (let i = 0; i < n; i++) {
      const f = fish[i];
      let ax = 0, ay = 0, mx = 0, my = 0, avx = 0, avy = 0, c = 0;
      for (let j = 0; j < n; j++) {
        if (j === i) continue;
        const o = fish[j], ox = o.x - f.x, oy = o.y - f.y, d2 = ox * ox + oy * oy;
        if (d2 < 5200) {
          mx += o.x; my += o.y; avx += o.vx; avy += o.vy; c++;
          if (d2 < 520 && d2 > 0.01) { ax -= ox / d2 * 900; ay -= oy / d2 * 900; }
        }
      }
      if (c) {
        ax += (mx / c - f.x) * 0.5; ay += (my / c - f.y) * 0.5;
        ax += (avx / c - f.vx) * 0.9; ay += (avy / c - f.vy) * 0.9;
      }
      // nearest food wins over the figure-eight
      let gx = tx, gy = ty, gain = 0.55, best = 1e9, bi = -1;
      for (let k = 0; k < food.length; k++) {
        const d = (food[k].x - f.x) ** 2 + (food[k].y - f.y) ** 2;
        if (d < best) { best = d; bi = k; }
      }
      if (bi >= 0 && best < 520 * 520) {
        gx = food[bi].x; gy = food[bi].y; gain = 1.5;
        if (best < 150) { food.splice(bi, 1); f.flash = 0.5; }
      }
      ax += (gx - f.x) * gain; ay += (gy - f.y) * gain;
      // bolt from a moving pointer
      if (ptr.inside && ptr.speed > 60) {
        const px = f.x - ptr.x, py = f.y - ptr.y, d = Math.hypot(px, py);
        if (d < 170 && d > 0.1) { const s = (170 - d) * 30; ax += px / d * s; ay += py / d * s; f.flash = 0.35; }
      }
      // keep clear of the floor and the surface
      if (f.y > floorY - 40) ay -= (f.y - (floorY - 40)) * 8;
      if (f.y < 30) ay += (30 - f.y) * 8;
      f.vx += ax * dt; f.vy += ay * dt;
      const v = Math.hypot(f.vx, f.vy), vmax = f.flash > 0 ? 330 : 120, vmin = 45;
      if (v > vmax) { f.vx *= vmax / v; f.vy *= vmax / v; }
      else if (v < vmin && v > 0.01) { f.vx *= vmin / v; f.vy *= vmin / v; }
      f.vy *= 0.985;
      f.x += f.vx * dt; f.y += f.vy * dt;
      if (f.flash > 0) f.flash -= dt;
    }

    for (const p of plankton) {
      p.y -= p.d * dt * 0.6; p.x += Math.sin(t * 0.3 + p.ph) * 4 * dt;
      if (p.y < -5) { p.y = H + 5; p.x = rnd(0, W); }
    }
    for (const j of jellies) {
      const pulse = Math.sin(t * 1.7 + j.ph);
      j.y -= (7 + Math.max(0, pulse) * 14) * dt;
      const px = j.x - ptr.x, py = j.y - ptr.y, d = Math.hypot(px, py);
      if (ptr.inside && d < 120) j.vx += (px / (d || 1)) * 60 * dt;
      j.vx *= 0.97; j.x += j.vx * dt + Math.sin(t * 0.4 + j.ph) * 3 * dt;
      if (j.y < -ch * 6) { j.y = H + ch * 2; j.x = rnd(W * 0.05, W * 0.95); }
    }
    for (const k of kelp) {
      const kx = k.x * cw, d = ptr.x - kx;
      const target = (ptr.inside && Math.abs(d) < 70 && ptr.y > H - (k.h + 4) * ch) ? (d > 0 ? -2.5 : 2.5) : 0;
      k.bend += (target - k.bend) * Math.min(1, dt * 4);
    }
    if (!whale.on && t > whale.next) { whale.on = true; whale.t0 = t; }
    if (whale.on && t - whale.t0 > 44) { whale.on = false; whale.next = t + 26; }
  }

  /* ---------- drawing into the grid ---------- */
  function drawShafts() {
    const lim = Math.floor(rows * 0.78);
    for (let y = 0; y < lim; y++) {
      for (let x = 0; x < cols; x++) {
        if (hash(x, y) > 30) continue;
        const s = x + y * 0.9;
        const b = Math.sin(s * 0.045 + t * 0.06) + 0.5 * Math.sin(s * 0.013 - t * 0.03);
        if (b > 0.95 + y / lim * 0.45) put(x, y, 47, 0);
      }
    }
  }
  function drawWhale() {
    if (!whale.on) return;
    const p = (t - whale.t0) / 44;
    const L = Math.min(W * 0.62, 980), half = L / 2;
    const x0 = W + half * 1.25, y0 = H * 0.78, x1 = -half * 1.25, y1 = H * 0.16;
    const wx = x0 + (x1 - x0) * p, wy = y0 + (y1 - y0) * p + Math.sin(t * 0.5) * 10;
    const ang = Math.atan2(y1 - y0, x1 - x0), ca = Math.cos(ang), sa = Math.sin(ang);
    const c0 = Math.max(0, Math.floor((wx - half * 1.2) / cw)), c1 = Math.min(cols - 1, Math.ceil((wx + half * 1.2) / cw));
    const r0 = Math.max(0, Math.floor((wy - half * 0.75) / ch)), r1 = Math.min(rows - 1, Math.ceil((wy + half * 0.75) / ch));
    for (let y = r0; y <= r1; y++) {
      for (let x = c0; x <= c1; x++) {
        const dx = x * cw - wx, dy = y * ch - wy;
        const u = (dx * ca + dy * sa) / half;
        let v = (-dx * sa + dy * ca) / half;
        if (u > 1 || u < -1.16) continue;
        const q = (u + 1) / 2;
        v += 0.07 * Math.sin(t * 1.1 + u * 2.4) * (1 - Math.max(0, q));
        let h;
        if (u < -0.86) h = 0.2 * Math.pow((-0.86 - u) / 0.3, 0.75);
        else h = 0.245 * Math.pow(Math.max(0, Math.sin(Math.PI * Math.pow(q, 1.55))), 0.6) + 0.012;
        const av = Math.abs(v);
        if (av > h) continue;
        const d = av / h;
        const hu = Math.floor(u * 46), hv = Math.floor(v * 60);
        if (Math.abs(u - 0.7) < 0.014 && Math.abs(v - 0.035) < 0.02) { put(x, y, 64, 9); continue; }
        if (d > 0.84) { put(x, y, v < 0 ? 45 : 95, 13); continue; }
        if (v > h * 0.3 && u > 0.05 && u < 0.86 && (hu & 1) === 0) { put(x, y, 47, 13); continue; }
        const shade = (1 - d) * 0.55 + (v < 0 ? 0.45 : 0.12);
        let idx = Math.floor(shade * (RAMP.length - 1)) - (hash(hu, hv) % 3);
        if (idx < 0) idx = 0;
        put(x, y, RAMP.charCodeAt(idx), shade > 0.74 ? 9 : 8);
      }
    }
  }
  const JA = [' .-~-. ', '(  ~  )', " ')|(' ", '  )|(  ', '  ( )  '];
  const JB = ['  .-.  ', ' (~~~) ', '  )|(  ', '  (|)  ', '   |   '];
  function drawJellies() {
    for (const j of jellies) {
      const s = Math.sin(t * 1.7 + j.ph) > 0 ? JB : JA;
      const x = Math.round(j.x / cw) - 3, y = Math.round(j.y / ch);
      for (let r = 0; r < s.length; r++) text(x, y + r, s[r], r < 2 ? 12 : 2);
    }
  }
  function drawFloor() {
    const fr = rows - 2;
    const P = '_.-~_ ._-. ~_';
    for (let x = 0; x < cols; x++) { const c = P.charCodeAt((x * 7 + (x >> 2)) % P.length); if (c !== 32) put(x, fr, c, 11); }
    for (const k of kelp) {
      for (let j = 0; j < k.h; j++) {
        const f = j / k.h;
        const xx = k.x + Math.round((Math.sin(t * 0.8 + k.ph + j * 0.35) * 2.2 + k.bend) * f);
        put(xx, fr - 1 - j, (j & 1) ? 40 : 41, f > 0.7 ? 14 : 5);
        if (j % 3 === 1) put(xx + 1, fr - 1 - j, 126, 14);
      }
    }
    for (const c of corals) {
      const s = c.tpl.s;
      for (let r = 0; r < s.length; r++) text(c.x, fr - s.length + r, s[r], c.tpl.k);
    }
  }
  function drawPlankton() {
    for (const p of plankton) {
      if (Math.sin(t * p.sp + p.ph) < -0.55) continue;
      const near = ptr.inside && (p.x - ptr.x) ** 2 + (p.y - ptr.y) ** 2 < 8100;
      put(p.x / cw, p.y / ch, near ? 42 : p.c.charCodeAt(0), near ? 9 : p.k);
    }
  }
  function drawFish() {
    for (const f of fish) {
      const x = Math.round(f.x / cw), y = Math.round(f.y / ch), k = f.flash > 0 ? 9 : f.k;
      const right = f.vx >= 0;
      if (f.big) text(x - 1, y, right ? '><>' : '<><', k);
      else put(x, y, right ? 62 : 60, k);
    }
    for (const o of food) put(o.x / cw, o.y / ch, 111, 10);
  }

  function draw() {
    chr.fill(0); col.fill(-1);
    drawShafts(); drawWhale(); drawPlankton(); drawJellies(); drawFloor(); drawFish();
    for (const l of lists) l.length = 0;
    for (let i = 0, n = cols * rows; i < n; i++) if (col[i] >= 0) lists[col[i]].push(i);
    ctx.clearRect(0, 0, W, H);
    for (let k = 0; k < PAL.length; k++) {
      const l = lists[k]; if (!l.length) continue;
      ctx.fillStyle = PAL[k];
      for (let m = 0; m < l.length; m++) {
        const i = l[m];
        ctx.fillText(String.fromCharCode(chr[i]), (i % cols) * cw, ((i / cols) | 0) * ch);
      }
    }
  }

  function frame(now) {
    if (!running) return;
    requestAnimationFrame(frame);
    if (now - last < 55) return;               // about 18 frames a second, like the app
    const dt = Math.min(0.1, (now - last) / 1000 || 0.05);
    last = now; t += dt;
    update(dt); draw();
  }
  function start() { if (running || reduce || !chr || !visible || document.hidden) return; running = true; last = performance.now(); requestAnimationFrame(frame); }
  function stop() { running = false; }

  const host = cv.parentElement;
  host.addEventListener('pointermove', (e) => {
    const r = cv.getBoundingClientRect();
    ptr.x = e.clientX - r.left; ptr.y = e.clientY - r.top; ptr.inside = true;
    if (ptr.px < -900) { ptr.px = ptr.x; ptr.py = ptr.y; }
  });
  host.addEventListener('pointerleave', () => { ptr.inside = false; ptr.rest = 0; });
  new IntersectionObserver((es) => { visible = es[0].isIntersecting; visible ? start() : stop(); }).observe(cv);
  document.addEventListener('visibilitychange', () => { document.hidden ? stop() : start(); });
  let rt, booted = false;
  const onSize = () => {
    if (!booted) return;
    const r = cv.getBoundingClientRect();
    if (Math.abs(r.width - W) < 2 && Math.abs(r.height - H) < 2) return;
    clearTimeout(rt); rt = setTimeout(() => { resize(); if (!chr) return; if (reduce) still(); else { draw(); start(); } }, 150);
  };
  if ('ResizeObserver' in window) new ResizeObserver(onSize).observe(cv); else addEventListener('resize', onSize);

  function still() { t = 9; whale.on = true; whale.t0 = t - 20; for (let i = 0; i < 40; i++) update(0.05); draw(); }
  function boot() { booted = true; resize(); if (!chr) return; if (reduce) still(); else { for (let i = 0; i < 30; i++) update(0.05); draw(); start(); } }
  if (document.fonts && document.fonts.load) document.fonts.load('500 14px "JetBrains Mono"').then(boot, boot); else boot();

  // test hooks
  window.__sea = { get fish() { return fish.length; }, get food() { return food.length; }, get cells() { let n = 0; for (let i = 0; i < col.length; i++) if (col[i] >= 0) n++; return n; }, whale };
})();
