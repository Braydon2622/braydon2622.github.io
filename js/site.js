/* braydonhartai.com: the small behaviours of the page.
   The sales coach demo and the Gremlets playground live in portfolio.js; the text sea is sea.js. */
(function () {
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* things arrive as you reach them */
  function reveals() {
    const els = $$('.reveal');
    if (!('IntersectionObserver' in window)) { els.forEach((e) => e.classList.add('in')); return; }
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }), { threshold: 0.08, rootMargin: '0px 0px -5% 0px' });
    els.forEach((e) => io.observe(e));
  }

  /* the waterline: rows of text waves, written twice so the drift can loop */
  function waves() {
    const bits = ['~', '~~', '~~~', ' ', '  ', '   ', '    ', '~ ~', '-~', '~-'];
    const fishy = ['><>', '<><', '°', '.'];
    $$('.waves').forEach((box, b) => {
      let seed = 7 + b * 13;
      const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
      $$('span', box).forEach((row, i) => {
        let s = '';
        const need = Math.ceil(Math.max(innerWidth, 1200) / 8) + 20;
        while (s.length < need) s += (i > 2 && rnd() < 0.035 ? '  ' + fishy[(rnd() * fishy.length) | 0] + '  ' : bits[(rnd() * bits.length) | 0]);
        row.textContent = s + s;
      });
    });
  }

  /* Code Sea: one scene at a time, on a slow turn until you pick one */
  function tabs() {
    $$('[data-tabs]').forEach((scr) => {
      const imgs = $$('img', scr), btns = $$('.tabs button', scr.parentElement);
      let i = 0, timer = null, hold = false;
      const go = (n) => {
        i = (n + imgs.length) % imgs.length;
        imgs.forEach((im, k) => im.classList.toggle('on', k === i));
        btns.forEach((b, k) => b.setAttribute('aria-selected', k === i ? 'true' : 'false'));
      };
      btns.forEach((b, k) => b.addEventListener('click', () => { hold = true; go(k); }));
      if (!reduce && 'IntersectionObserver' in window) {
        new IntersectionObserver((es) => {
          clearInterval(timer);
          if (es[0].isIntersecting) timer = setInterval(() => { if (!hold) go(i + 1); }, 4200);
        }, { threshold: 0.4 }).observe(scr);
      }
    });
  }

  /* Product footage: nothing downloads until a product is on screen. Each one tours its
     scenes until you pick one; then it loops that scene. Off screen, it pauses. */
  function clips() {
    $$('.show').forEach((box) => {
      const v = $('video', box); if (!v) return;
      const btns = $$('.show-tabs button', box), names = btns.map((b) => b.dataset.clip);
      let cur = v.dataset.clip, picked = false, seen = false;
      const load = (name, play) => {
        cur = name;
        v.poster = 'video/studio/' + name + '.jpg';
        v.src = 'video/studio/' + name + '.mp4';
        btns.forEach((b) => b.setAttribute('aria-selected', b.dataset.clip === name ? 'true' : 'false'));
        if (play) v.play().catch(() => {});
      };
      btns.forEach((b) => b.addEventListener('click', () => { picked = true; v.loop = true; load(b.dataset.clip, true); }));
      v.addEventListener('ended', () => { if (!picked && names.length > 1) load(names[(names.indexOf(cur) + 1) % names.length], true); });
      if (reduce || !('IntersectionObserver' in window)) { v.controls = true; v.preload = 'metadata'; v.src = 'video/studio/' + cur + '.mp4'; return; }
      new IntersectionObserver((es) => {
        if (es[0].isIntersecting) { if (!seen) { seen = true; load(cur, true); } else v.play().catch(() => {}); }
        else v.pause();
      }, { threshold: 0.35 }).observe(v);
    });
  }

  /* Hearthside: drag the clock from noon through sunset into night */
  function dial() {
    const d = $('#dial'), scr = $('#daylight'); if (!d || !scr) return;
    const imgs = $$('img', scr), out = $('#dialTime');
    const stops = [12, 18.6, 23];
    const ease = (f) => f * f * (3 - 2 * f);
    const set = () => {
      const h = parseFloat(d.value);
      let a = [1, 0, 0];
      if (h >= stops[2]) a = [0, 0, 1];
      else if (h > stops[1]) a = [0, 1, ease((h - stops[1]) / (stops[2] - stops[1]))];
      else if (h > stops[0]) a = [1, ease((h - stops[0]) / (stops[1] - stops[0])), 0];
      imgs.forEach((im, k) => { im.style.transition = 'none'; im.style.opacity = a[k]; });
      const hh = Math.floor(h) % 24, mm = Math.floor((h % 1) * 60);
      out.textContent = String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0');
    };
    d.addEventListener('input', set); set();
  }

  /* Desktop Reef: move across the picture to look around the lagoon */
  function pan() {
    const p = $('#reefPan'); if (!p) return;
    const im = $('img', p);
    const move = (x, y) => { im.style.transform = 'scale(1.28) translate(' + ((0.5 - x) * 18).toFixed(2) + '%,' + ((0.5 - y) * 18).toFixed(2) + '%)'; };
    p.addEventListener('pointermove', (e) => { const r = p.getBoundingClientRect(); move((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height); });
    p.addEventListener('pointerleave', () => move(0.5, 0.5));
  }

  /* A live site in a frame: nothing loads until it is asked for. It is drawn at a fixed
     desktop size and scaled to fit, and gives the mouse back when the pointer leaves. */
  function embeds() {
    $$('.view.live[data-embed]').forEach((s) => {
      const w = +s.dataset.w || 1180, h = +s.dataset.h || 664, go = $('.live-go', s);
      let fr = null;
      const fit = () => { if (fr) fr.style.transform = 'scale(' + (s.clientWidth / w) + ')'; };
      go.addEventListener('click', () => {
        if (!fr) {
          fr = document.createElement('iframe');
          fr.src = s.dataset.embed; fr.title = s.dataset.title || 'Live demo';
          fr.width = w; fr.height = h; fr.style.width = w + 'px'; fr.style.height = h + 'px';
          fr.setAttribute('allow', 'autoplay');
          fr.addEventListener('load', () => { const im = $('img', s); if (im) im.classList.remove('on'); });
          s.appendChild(fr); fit();
        }
        s.classList.add('on'); fr.focus();
      });
      s.addEventListener('pointerleave', () => { if (fr) { s.classList.remove('on'); go.textContent = '▶ Click to use it again'; } });
      if ('ResizeObserver' in window) new ResizeObserver(fit).observe(s); else addEventListener('resize', fit);
    });
  }

  /* "the whale comes at the top of every hour" */
  function whaleClock() {
    const el = $('#whaleClock'); if (!el) return;
    const f = () => {
      const n = new Date(), m = 60 - n.getMinutes();
      const hm = String(n.getHours()).padStart(2, '0') + ':' + String(n.getMinutes()).padStart(2, '0');
      el.textContent = '> it is ' + hm + ' where you are. the whale is due in ' + (m === 60 ? 'under a minute' : m + ' min') + '.';
    };
    f(); setInterval(f, 20000);
  }

  /* Code Realm lights each painting by the real clock */
  function realmClock() {
    const el = $('#realmClock'); if (!el) return;
    const f = () => {
      const n = new Date(), h = n.getHours() + n.getMinutes() / 60;
      const light = h < 5 ? 'night' : h < 8 ? 'dawn' : h < 11 ? 'morning' : h < 14 ? 'noon' : h < 17.5 ? 'afternoon' : h < 20.5 ? 'dusk' : 'night';
      const hm = String(n.getHours()).padStart(2, '0') + ':' + String(n.getMinutes()).padStart(2, '0');
      el.textContent = '> it is ' + hm + ' where you are. the realm would be in ' + light + ' light.';
    };
    f(); setInterval(f, 60000);
  }

  /* Winterville's clock tower counts down to Christmas. So does its card. */
  function xmasClock() {
    const el = $('#xmasClock'); if (!el) return;
    const n = new Date(), x = new Date(n.getFullYear(), 11, 25);
    const days = Math.ceil((x - new Date(n.getFullYear(), n.getMonth(), n.getDate())) / 864e5);
    if (days < 0 || days > 60) { el.remove(); return; }
    el.textContent = days === 0 ? '> it is christmas day. the square is full.' : '> christmas is in ' + days + (days === 1 ? ' day' : ' days') + '. the clock tower is counting too.';
  }

  reveals(); waves(); clips(); tabs(); dial(); pan(); embeds(); whaleClock(); realmClock(); xmasClock();
})();
