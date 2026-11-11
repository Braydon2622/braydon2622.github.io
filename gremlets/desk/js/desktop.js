// A mock macOS desktop for the portfolio's Gremlets demo: wallpaper, menu bar, four app windows and a Dock. The
// windows are the Gremlets' platforms (like real windows in the Mac app): drag one by its title bar and whoever stands
// on it rides along, close one and they tumble. Nothing here is a real app; it's a stage.

const CSS = `
#desk{position:fixed;inset:0;z-index:0;overflow:hidden;font:13px/1.4 -apple-system,BlinkMacSystemFont,"SF Pro Text","Helvetica Neue",system-ui,sans-serif;color:#1d1d1f;user-select:none;-webkit-user-select:none}
#world{z-index:1}
#bar,#hint{display:none!important}
#session{top:calc(var(--menu) + 10px)!important;z-index:4}
#trecent{display:none!important}
body.terrarium #drivehint:not([hidden]){display:block!important;bottom:84px}
body.terrarium #pad:not([hidden]){display:flex!important}
.wall{position:absolute;inset:0;background:
  radial-gradient(60% 50% at 18% 20%,rgba(255,255,255,.7),transparent 70%),
  radial-gradient(45% 40% at 85% 25%,rgba(214,232,251,.9),transparent 70%),
  linear-gradient(170deg,#cfe6f7 0%,#e6f1e6 52%,#f6e7d6 100%)}
.wall svg{position:absolute;left:0;right:0;bottom:0;width:100%;height:46%}
.menubar{position:absolute;left:0;right:0;top:0;height:var(--menu);display:flex;align-items:center;gap:16px;padding:0 12px;background:rgba(255,255,255,.55);-webkit-backdrop-filter:blur(20px) saturate(1.6);backdrop-filter:blur(20px) saturate(1.6);font-weight:500;font-size:13px;z-index:3}
.menubar b{font-weight:700}
.menubar .apple{width:14px;height:14px;display:block}
.menubar .r{margin-left:auto;display:flex;align-items:center;gap:13px}
.menubar .r svg{width:16px;height:16px;display:block}
.menubar .gm{image-rendering:pixelated}
@media (max-width:640px){.menubar .menus{display:none}.menubar{gap:10px;font-size:12px}}
.win{position:absolute;display:flex;flex-direction:column;background:rgba(255,255,255,.93);border-radius:11px;box-shadow:0 22px 50px -18px rgba(30,45,60,.45),0 0 0 .5px rgba(0,0,0,.18);overflow:hidden;transition:opacity .18s,transform .18s}
.win[hidden]{display:flex!important;opacity:0;transform:scale(.94);pointer-events:none}
.win.front{box-shadow:0 30px 70px -18px rgba(30,45,60,.55),0 0 0 .5px rgba(0,0,0,.22)}
.tb{display:flex;align-items:center;gap:8px;height:30px;padding:0 10px;flex:none;cursor:grab;touch-action:none;background:#ececec;border-bottom:1px solid rgba(0,0,0,.08)}
.tb:active{cursor:grabbing}
.lights{display:flex;gap:7px;flex:none}
.lights i{width:12px;height:12px;border-radius:50%;display:block;box-shadow:inset 0 0 0 .5px rgba(0,0,0,.18);cursor:pointer}
.lights .c{background:#ff5f57}.lights .m{background:#febc2e}.lights .z{background:#28c840}
.tb .t{flex:1;text-align:center;font-weight:600;font-size:12.5px;color:#4a4a4a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-right:52px}
.win.dark .tb{background:#2b2d31;border-color:#1b1c1f}.win.dark .tb .t{color:#c7c9cf}
.win.dark{background:#1e1f22;color:#e8e8ea}
.tabs{display:flex;gap:2px;flex:1;min-width:0;align-self:flex-end;height:26px}
.tab{display:flex;align-items:center;gap:6px;min-width:0;max-width:170px;flex:1;padding:0 10px;border-radius:8px 8px 0 0;font-size:12px;color:#555;cursor:pointer;white-space:nowrap;overflow:hidden}
.tab span{overflow:hidden;text-overflow:ellipsis}
.tab i{width:12px;height:12px;border-radius:3px;flex:none}
.tab.on{background:#fff;color:#1d1d1f}
.chrome .tb{height:36px;background:#dfe3e8}
.omni{display:flex;align-items:center;gap:8px;padding:6px 10px;background:#fff;border-bottom:1px solid #e6e6e6;flex:none}
.omni .url{flex:1;background:#f1f3f4;border-radius:999px;padding:4px 12px;font-size:12px;color:#5f6368;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.omni .nav{color:#9aa0a6;letter-spacing:6px}
.page{flex:1;overflow:hidden;padding:16px 18px;display:grid;gap:10px;align-content:start;background:linear-gradient(#f7fbf8,#fff)}
.page h3{margin:0;font:800 clamp(15px,2.2vw,22px)/1.1 -apple-system,system-ui,sans-serif;letter-spacing:-.02em}
.page p{margin:0;color:#5b6660;font-size:12px}
.page .row{display:flex;gap:8px;flex-wrap:wrap}
.page .btn{padding:5px 10px;border-radius:999px;background:#17221d;color:#fff;font-size:11px;font-weight:700}
.page .btn.l{background:#f5b83d;color:#2a1d00}
.page .cards{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}
.page .cards div{height:46px;border-radius:9px;background:#fff;border:1px solid #e7ece9;box-shadow:0 6px 14px -12px rgba(0,0,0,.4)}
.page .line{height:8px;border-radius:4px;background:#e9eeec}
.page .code{font:11px/1.5 ui-monospace,Menlo,monospace;background:#f4f6f8;border-radius:8px;padding:8px 10px;color:#3c4a55;white-space:pre}
.term{flex:1;overflow:hidden;padding:10px 12px;font:11.5px/1.5 ui-monospace,"SF Mono",Menlo,monospace;display:flex;flex-direction:column;justify-content:flex-end}
.term .ln{white-space:pre-wrap;word-break:break-word}
.term .o{color:#d97757}.term .g{color:#9bd286}.term .d{color:#8b939d}.term .y{color:#f5c76b}
.notes{flex:1;display:grid;min-height:0}
.notes .side{background:#f3efe2;padding:8px;font-size:11px;color:#7a6f55;display:grid;gap:4px;align-content:start}
.notes .side b{color:#5a4f35}
.notes .pg{background:#fffdf4;padding:8px 10px;font-size:11.5px;display:grid;gap:3px;align-content:start;overflow:hidden}
.notes .pg b{font-size:13px}
.music{flex:1;display:flex;align-items:center;gap:10px;padding:8px 12px;min-height:0}
.music .art{width:42px;height:42px;border-radius:8px;flex:none;background:linear-gradient(135deg,#8bd66a,#3f7a3a 60%,#f5b83d)}
.music .meta{flex:1;min-width:0;display:grid;gap:3px}
.music .meta b{font-size:12.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.music .meta span{font-size:11px;color:#777}
.music .bar2{height:4px;border-radius:2px;background:#e5e5e5;overflow:hidden}
.music .bar2 i{display:block;height:100%;width:35%;background:#3f7a3a;animation:play 60s linear infinite}
@keyframes play{to{width:100%}}
.dock{position:absolute;left:50%;bottom:6px;transform:translateX(-50%);display:flex;gap:6px;padding:6px 8px;border-radius:18px;background:rgba(255,255,255,.42);border:1px solid rgba(255,255,255,.6);-webkit-backdrop-filter:blur(20px) saturate(1.6);backdrop-filter:blur(20px) saturate(1.6);box-shadow:0 10px 30px -12px rgba(30,45,60,.35);z-index:2}
.dk{position:relative;width:46px;height:46px;border:0;padding:0;background:none;cursor:pointer;transition:transform .15s}
.dk:hover{transform:translateY(-5px) scale(1.08)}
.dk svg,.dk img{width:100%;height:100%;display:block;filter:drop-shadow(0 3px 6px rgba(0,0,0,.18))}
.dk::after{content:"";position:absolute;left:50%;bottom:-5px;width:4px;height:4px;border-radius:50%;background:#333;transform:translateX(-50%);opacity:0}
.dk.run::after{opacity:.7}
.dk.bounce{animation:bounce .6s ease}
@keyframes bounce{30%{transform:translateY(-16px)}60%{transform:translateY(0)}80%{transform:translateY(-6px)}}
.dk .sep{display:none}
.dock .gap{width:1px;align-self:stretch;margin:4px 2px;background:rgba(0,0,0,.15)}
@media (max-width:640px){.dk{width:34px;height:34px}.dock{gap:4px;padding:5px 6px;border-radius:14px}}
`;

const ICON = {
  finder: '<svg viewBox="0 0 32 32"><rect width="32" height="32" rx="7" fill="#5aa9f2"/><path d="M16 0h9a7 7 0 017 7v18a7 7 0 01-7 7h-9z" fill="#e9f2fb"/><path d="M16 0c-3 6-3 13 0 18 0 4 0 9-1 14" stroke="#1f2a44" stroke-width="1.4" fill="none"/><circle cx="10" cy="11" r="1.6" fill="#1f2a44"/><circle cx="22" cy="11" r="1.6" fill="#1f2a44"/><path d="M8 21c4 4 12 4 16 0" stroke="#1f2a44" stroke-width="1.4" fill="none" stroke-linecap="round"/></svg>',
  chrome: '<svg viewBox="0 0 32 32"><rect width="32" height="32" rx="7" fill="#fff"/><circle cx="16" cy="16" r="11" fill="#db4437"/><path d="M16 16L6.5 21.5A11 11 0 0016 27z" fill="#0f9d58"/><path d="M16 16l9.5 5.5A11 11 0 0016 27z" fill="#0f9d58"/><path d="M16 16h11a11 11 0 01-1.5 5.5z" fill="#f4b400"/><path d="M16 16l9.5 5.5A11 11 0 0027 16z" fill="#f4b400"/><circle cx="16" cy="16" r="5" fill="#fff"/><circle cx="16" cy="16" r="3.8" fill="#4285f4"/></svg>',
  terminal: '<svg viewBox="0 0 32 32"><rect width="32" height="32" rx="7" fill="#1f2630"/><path d="M8 11l5 5-5 5" stroke="#9bd286" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M15 21h8" stroke="#eef2fb" stroke-width="2.4" stroke-linecap="round"/></svg>',
  notes: '<svg viewBox="0 0 32 32"><rect width="32" height="32" rx="7" fill="#fff"/><rect width="32" height="9" rx="0" fill="#f6cf45"/><path d="M6 15h20M6 19h20M6 23h14" stroke="#c9c2a8" stroke-width="1.3"/></svg>',
  music: '<svg viewBox="0 0 32 32"><rect width="32" height="32" rx="7" fill="#fa2d48"/><path d="M13 22V10l10-2v12" stroke="#fff" stroke-width="2" fill="none"/><circle cx="11" cy="22" r="2.6" fill="#fff"/><circle cx="21" cy="20" r="2.6" fill="#fff"/></svg>',
  claude: '<svg viewBox="0 0 32 32"><rect width="32" height="32" rx="7" fill="#d97757"/><g stroke="#fff" stroke-width="2.4" stroke-linecap="round"><path d="M16 7v18M7 16h18M9.6 9.6l12.8 12.8M22.4 9.6L9.6 22.4"/></g></svg>',
  gremlets: '<svg viewBox="0 0 32 32" shape-rendering="crispEdges"><rect width="32" height="32" rx="7" fill="#bfe0f2"/><rect x="0" y="23" width="32" height="9" fill="#7cc46a"/><rect x="11" y="9" width="10" height="2" fill="#f5e7c8"/><rect x="9" y="11" width="14" height="10" fill="#f5e7c8"/><rect x="11" y="21" width="10" height="2" fill="#f5e7c8"/><rect x="12" y="14" width="2" height="3" fill="#17201b"/><rect x="18" y="14" width="2" height="3" fill="#17201b"/><rect x="14" y="18" width="4" height="1" fill="#17201b"/><rect x="5" y="22" width="22" height="2" fill="#5e9e4c"/></svg>',
};
const APPLE = '<svg class="apple" viewBox="0 0 14 17"><path fill="#1d1d1f" d="M11.6 9c0-2 1.6-3 1.7-3-1-1.4-2.4-1.6-2.9-1.6-1.2-.1-2.4.7-3 .7s-1.6-.7-2.6-.7C3.4 4.4 2 5.3 1.3 6.6c-1.5 2.6-.4 6.5 1.1 8.6.7 1 1.5 2.2 2.6 2.1 1-.1 1.4-.7 2.7-.7s1.6.7 2.7.6c1.1 0 1.8-1 2.5-2.1.8-1.1 1.1-2.3 1.1-2.3s-2.4-.9-2.4-3.8zM9.6 3c.6-.7 1-1.7.9-2.7-.9 0-1.9.6-2.5 1.3-.5.6-1 1.6-.9 2.6 1 .1 1.9-.5 2.5-1.2z"/></svg>';
const WIFI = '<svg viewBox="0 0 16 16"><path d="M8 13.2l1.6-1.7a2.3 2.3 0 00-3.2 0zM3.9 9.3l1.2 1.2a4.1 4.1 0 015.8 0l1.2-1.2a5.8 5.8 0 00-8.2 0zM1.3 6.8l1.2 1.2a7.8 7.8 0 0111 0l1.2-1.2a9.5 9.5 0 00-13.4 0z" fill="#1d1d1f"/></svg>';
const BATT = '<svg viewBox="0 0 26 12" style="width:24px"><rect x=".5" y=".5" width="22" height="11" rx="3" fill="none" stroke="#1d1d1f" opacity=".5"/><rect x="2" y="2" width="16" height="8" rx="1.6" fill="#1d1d1f"/><rect x="23.5" y="4" width="1.6" height="4" rx=".8" fill="#1d1d1f" opacity=".5"/></svg>';
const LEAF = '<svg class="gm" viewBox="0 0 8 8" shape-rendering="crispEdges"><rect x="2" y="1" width="4" height="1" fill="#3f7a3a"/><rect x="1" y="2" width="6" height="3" fill="#5e9e4c"/><rect x="2" y="5" width="4" height="1" fill="#3f7a3a"/><rect x="3" y="6" width="1" height="2" fill="#6b4428"/><rect x="2" y="3" width="1" height="1" fill="#17201b"/><rect x="5" y="3" width="1" height="1" fill="#17201b"/></svg>';

// The windows: id (the platform's id), app, title, and where they start as fractions of the screen [x, top, w, h].
const WINDOWS = [
  { id: 1, app: 'chrome', wide: [0.025, 0.37, 0.47, 0.5], narrow: [0.02, 0.42, 0.62, 0.42] },
  { id: 2, app: 'terminal', title: 'claude — ~/gremlets', dark: true, bonsai: true, wide: [0.53, 0.45, 0.44, 0.42], narrow: [0.3, 0.6, 0.68, 0.3] },
  { id: 3, app: 'notes', title: 'Notes', wide: [0.03, 0.14, 0.21, 0.17], narrow: [0.03, 0.17, 0.44, 0.16] },
  { id: 4, app: 'music', title: 'Music', wide: [0.75, 0.15, 0.22, 0.13], narrow: [0.53, 0.21, 0.44, 0.12] },
];
const TABS = [
  { name: 'Braydon Hart · AI', color: '#f5b83d', url: 'braydonhartai.com',
    html: '<h3>I build AI tools a whole team actually uses.</h3><p>All 9 loan officers on my team use my AI coach every day.</p><div class="row"><span class="btn">Try the coach</span><span class="btn l">Play with the Gremlets</span></div><div class="cards"><div></div><div></div><div></div></div>' },
  { name: 'Claude Code · Hooks', color: '#d97757', url: 'docs.claude.com/claude-code/hooks',
    html: '<h3>Hooks</h3><p>Run your own commands when Claude starts a tool, finishes, or needs you.</p><div class="code">{ "hooks": { "Stop": [ { "command":\n  "gremlet done" } ] } }</div><div class="line" style="width:80%"></div><div class="line" style="width:60%"></div>' },
  { name: 'Gremlets', color: '#5e9e4c', url: 'braydonhartai.com/gremlets',
    html: '<h3>Fifty pixel creatures for your Mac</h3><p>They show you what Claude Code is doing, and grow a garden out of your work.</p><div class="row"><span class="btn">Download for Mac</span><span class="btn l">Chrome extension</span></div><div class="line" style="width:70%"></div>' },
];

export class Desktop {
  constructor() {
    this.dirty = true;
    this.z = 10;
    this.moved = new Set();
    document.head.insertAdjacentHTML('beforeend', `<style>${CSS}</style>`);
    const root = document.createElement('div');
    root.id = 'desk';
    root.innerHTML = `<div class="wall"><svg viewBox="0 0 100 40" preserveAspectRatio="none"><path d="M0 22 C18 12 30 16 46 20 S78 10 100 16 V40 H0Z" fill="#cfe5cc" opacity=".8"/><path d="M0 30 C20 22 40 30 58 26 S86 22 100 27 V40 H0Z" fill="#b9dcb0" opacity=".85"/><path d="M0 35 C25 30 50 37 75 33 S95 32 100 34 V40 H0Z" fill="#a6d39b"/></svg></div>
      <div class="menubar">${APPLE}<b class="app">Google Chrome</b><span class="menus">File&nbsp;&nbsp;&nbsp;Edit&nbsp;&nbsp;&nbsp;View&nbsp;&nbsp;&nbsp;History&nbsp;&nbsp;&nbsp;Bookmarks&nbsp;&nbsp;&nbsp;Window&nbsp;&nbsp;&nbsp;Help</span>
        <span class="r"><span title="Gremlets">${LEAF}</span>${BATT}${WIFI}<span class="clock"></span></span></div>
      <div class="dock" role="toolbar" aria-label="Dock"></div>`;
    document.body.prepend(root);
    this.root = root;
    this.wins = new Map();
    for (const w of WINDOWS) this.wins.set(w.id, this.makeWindow(w));
    const dock = root.querySelector('.dock');
    for (const [app, label] of [['finder', 'Finder'], ['chrome', 'Google Chrome'], ['terminal', 'Terminal'], ['notes', 'Notes'], ['music', 'Music'], ['claude', 'Claude'], ['gap'], ['gremlets', 'Gremlets']]) {
      if (app === 'gap') { dock.insertAdjacentHTML('beforeend', '<span class="gap"></span>'); continue; }
      const b = document.createElement('button');
      b.className = 'dk'; b.dataset.app = app; b.title = label; b.setAttribute('aria-label', label);
      b.innerHTML = ICON[app];
      b.addEventListener('click', () => {
        b.classList.remove('bounce'); void b.offsetWidth; b.classList.add('bounce');
        const w = [...this.wins.values()].find((o) => o.def.app === app);
        if (w) this.open(w.def.id);
      });
      dock.appendChild(b);
    }
    this.dock = dock;
    for (const app of ['finder', 'chrome', 'terminal', 'notes', 'music']) dock.querySelector(`[data-app="${app}"]`)?.classList.add('run');
    this.tick(); setInterval(() => this.tick(), 20000);
    this.layout();
    addEventListener('resize', () => { this.moved.clear(); this.layout(); });
  }

  tick() {
    const d = new Date();
    d.setHours(11, 30 + Math.floor((performance.now() / 60000)), 0, 0);   // late morning, like the scene
    this.root.querySelector('.clock').textContent = d.toLocaleDateString([], { weekday: 'short' }) + ' ' + d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }

  menuHeight() { return innerWidth < 640 ? 22 : 26; }

  makeWindow(def) {
    const el = document.createElement('section');
    el.className = 'win ' + def.app + (def.dark ? ' dark' : '');
    const lights = '<span class="lights"><i class="c" title="Close"></i><i class="m" title="Minimize"></i><i class="z"></i></span>';
    if (def.app === 'chrome') {
      el.innerHTML = `<div class="tb">${lights}<div class="tabs">${TABS.map((t, i) => `<div class="tab${i ? '' : ' on'}" data-i="${i}"><i style="background:${t.color}"></i><span>${t.name}</span></div>`).join('')}</div></div>
        <div class="omni"><span class="nav">‹ › ↻</span><span class="url">${TABS[0].url}</span></div><div class="page">${TABS[0].html}</div>`;
      el.querySelectorAll('.tab').forEach((t) => t.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        const i = +t.dataset.i;
        el.querySelectorAll('.tab').forEach((o) => o.classList.toggle('on', o === t));
        el.querySelector('.url').textContent = TABS[i].url;
        el.querySelector('.page').innerHTML = TABS[i].html;
        this.front(def.id);
      }));
    } else if (def.app === 'terminal') {
      el.innerHTML = `<div class="tb">${lights}<span class="t">${def.title}</span></div><div class="term"><div class="ln o">╭ Claude Code</div><div class="ln d">  ~/gremlets · Opus 5.5</div><div class="ln">&gt; add a porch with a rain barrel</div><div class="ln g">● Edited 6 files · tests pass</div></div>`;
      this.term = el.querySelector('.term');
    } else if (def.app === 'notes') {
      el.innerHTML = `<div class="tb">${lights}<span class="t">Notes</span></div><div class="notes"><div class="pg"><b>Today</b><span>✓ Porch life</span><span>✓ Terrarium</span><span>☐ Back Office</span></div></div>`;
    } else {
      el.innerHTML = `<div class="tb">${lights}<span class="t">Music</span></div><div class="music"><div class="art"></div><div class="meta"><b>Moss Radio</b><span>Lo-fi garden</span><div class="bar2"><i></i></div></div></div>`;
    }
    this.root.insertBefore(el, this.root.querySelector('.dock'));
    const w = { def, el };
    el.addEventListener('pointerdown', () => this.front(def.id));
    el.querySelector('.c').addEventListener('click', (e) => { e.stopPropagation(); this.close(def.id); });
    el.querySelector('.m').addEventListener('click', (e) => { e.stopPropagation(); this.close(def.id); });
    // Drag by the title bar.
    const tb = el.querySelector('.tb');
    let drag = null;
    tb.addEventListener('pointerdown', (e) => {
      if (e.target.closest('.lights i, .tab')) return;
      drag = { dx: e.clientX - el.offsetLeft, dy: e.clientY - el.offsetTop };
      try { tb.setPointerCapture(e.pointerId); } catch { /* ignore */ }
    });
    tb.addEventListener('pointermove', (e) => {
      if (!drag) return;
      const M = this.menuHeight();
      el.style.left = Math.max(-el.offsetWidth + 80, Math.min(innerWidth - 80, e.clientX - drag.dx)) + 'px';
      el.style.top = Math.max(M + 4, Math.min(innerHeight - 60, e.clientY - drag.dy)) + 'px';
      this.moved.add(def.id); this.dirty = true;
    });
    const end = () => { drag = null; };
    tb.addEventListener('pointerup', end); tb.addEventListener('pointercancel', end);
    el.style.zIndex = def.id === 2 ? 14 : 10 + def.id;
    return w;
  }

  /** Places the windows that haven't been dragged, as fractions of the screen. */
  layout() {
    document.documentElement.style.setProperty('--menu', this.menuHeight() + 'px');
    const narrow = innerWidth < 640, Wd = innerWidth, Hd = innerHeight;
    for (const { def, el } of this.wins.values()) {
      if (this.moved.has(def.id)) continue;
      const [x, y, w, h] = narrow ? def.narrow : def.wide;
      Object.assign(el.style, { left: Math.round(x * Wd) + 'px', top: Math.round(y * Hd) + 'px', width: Math.round(w * Wd) + 'px', height: Math.round(h * Hd) + 'px' });
    }
    this.dirty = true;
  }

  front(id) {
    const w = this.wins.get(id);
    if (!w) return;
    w.el.style.zIndex = ++this.z;
    for (const o of this.wins.values()) o.el.classList.toggle('front', o === w);
    this.root.querySelector('.menubar .app').textContent = { chrome: 'Google Chrome', terminal: 'Terminal', notes: 'Notes', music: 'Music' }[w.def.app];
    this.dirty = true;
  }

  close(id) { const w = this.wins.get(id); if (!w || w.el.hidden) return; w.el.hidden = true; this.dock.querySelector(`[data-app="${w.def.app}"]`)?.classList.remove('run'); this.dirty = true; }
  open(id) { const w = this.wins.get(id); if (!w) return; w.el.hidden = false; this.front(id); this.dock.querySelector(`[data-app="${w.def.app}"]`)?.classList.add('run'); this.dirty = true; }
  isOpen(id) { return !this.wins.get(id)?.el.hidden; }
  takeDirty() { const d = this.dirty; this.dirty = false; return d; }

  /** The open windows, front to back, as platforms in the habitat's world coordinates (y up from the bottom). */
  platforms(canvasRect, H) {
    const out = [];
    const list = [...this.wins.values()].filter((w) => !w.el.hidden).sort((a, b) => (+b.el.style.zIndex) - (+a.el.style.zIndex));
    for (const { def, el } of list) {
      const r = el.getBoundingClientRect();
      const top = r.top - canvasRect.top, bottom = Math.min(H, r.bottom - canvasRect.top);
      if (bottom - top < 20) continue;
      out.push({ id: def.id, x: r.left - canvasRect.left, y: H - bottom, w: r.width, h: bottom - top, mossy: true, window: true, bonsai: !!def.bonsai, seed: def.id * 97 });
    }
    return out;
  }

  /** A line in the Terminal (Claude's session captions and status). */
  log(text, cls = '') {
    if (!this.term) return;
    // A running count ("editing files… 3 edits") updates its line instead of adding one.
    const lastEl = this.term.lastElementChild;
    if (lastEl && lastEl.textContent.slice(0, 22) === text.slice(0, 22)) { lastEl.textContent = text; return; }
    const d = document.createElement('div');
    d.className = 'ln ' + cls;
    d.textContent = text;
    this.term.appendChild(d);
    while (this.term.children.length > 14) this.term.firstElementChild.remove();
  }
}
