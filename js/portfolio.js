/* The sales coach demo, the live call and text examples, and the Gremlets playground. */
const S = [
 {k:"Rates too high",c:"Honestly rates are just too high right now. I think we're going to wait.",words:"rate rates high wait expensive cost too much interest",
  read:"Not a no. They're anchored on the headline rate and haven't connected it to their real goal yet.",t:"Warm",s:"Contacted",move:"finds the real goal",
  send:"Totally fair, nobody wants to overpay. Quick question so I don't waste your time: is the goal a lower monthly payment, or freeing up cash for something? Is a quick call tonight or Saturday morning easier?",
  key:"Is a quick call tonight or Saturday morning easier?",
  backup:"No pressure at all. If it helps, I can text over a simple comparison you can look at whenever.",
  next:"Find out what they're really trying to do: lower payment, cash out, or pay off debt.",
  fu:"No reply: day 2 with a goal based angle (\"Still thinking about consolidating those cards?\").",
  watch:"Don't promise a rate or payment in the text. Save numbers for the call."},
 {k:"Just shopping around",c:"I'm just shopping around right now, my bank is looking at it too.",words:"shopping around bank compare other lender quote quotes offer beat credit union",
  read:"Comparing options, which means they're active. The goal is to be the easy, clear option.",t:"Warm",s:"Contacted",move:"offers a side by side",
  send:"Smart move, you should compare. Send me whatever your bank quotes and I'll lay it next to mine, closing costs and all, so you see the real difference. Want it by text, or should I walk you through it on a 10 minute call?",
  key:"Want it by text, or should I walk you through it on a 10 minute call?",
  backup:"Totally fair. Whenever your bank sends their numbers, forward them my way and I'll take a look.",
  next:"Get their bank's quote so the comparison is real.",
  fu:"Day 2: \"Did your bank send anything over yet?\"",
  watch:"Never talk down the bank. Position yourself as a second set of eyes."},
 {k:"Talk to my spouse",c:"Sounds good but I need to talk to my wife first before we do anything.",words:"wife husband spouse partner talk first family decide",
  read:"Interested and moving, but the decision is shared. If she isn't on the call, it stalls.",t:"Hot",s:"Soft pull",move:"gets both of them on one call",
  send:"Of course, it's a big decision for both of you. I'm happy to answer her questions directly so you're not stuck relaying everything. Would tonight at 7 or tomorrow at lunch work for both of you?",
  key:"Would tonight at 7 or tomorrow at lunch work for both of you?",
  backup:"Makes total sense. Want me to send a short summary you two can go over together?",
  next:"Get both decision makers on one call.",
  fu:"Tomorrow evening if no reply: \"Did you two get a chance to talk it over?\"",
  watch:"Don't push for an application before the spouse has bought in."},
 {k:"Worried about credit",c:"My credit isn't great. I probably won't even qualify.",words:"credit score bad poor qualify approved denied collections late",
  read:"Worried about being turned down, not uninterested. Lower the fear first.",t:"Warm",s:"Contacted",move:"reassures without promising",
  send:"You'd be surprised, I help people in all kinds of credit situations. Even if now isn't the time, I can show you exactly what would move the needle so you're ready. Want me to take a quick look today, or later this week?",
  key:"Want me to take a quick look today, or later this week?",
  backup:"No pressure. I can send a few simple tips that usually help scores the fastest.",
  next:"Get permission for a soft pull so you're working with real numbers.",
  fu:"Day 3: a short credit tip, then ask again.",
  watch:"Never promise approval or name a score that guarantees it."},
 {k:"Asks for a payment",c:"How much would my payment be on 300k?",words:"payment monthly how much cost 300k price afford numbers estimate",
  read:"Engaged and already doing the math, a good sign. A guessed number by text can sink the deal.",t:"Hot",s:"Contacted",move:"turns a number into a call",
  send:"Great question! It depends on taxes, insurance and your down payment, and I'd hate to guess and be off. Give me 10 minutes and I'll get you a real number. Do you have a few minutes now, or is after work better?",
  key:"Do you have a few minutes now, or is after work better?",
  backup:"Happy to. Send me the price range and down payment you're thinking, and I'll call you with real numbers.",
  next:"Get on the phone while they're engaged.",
  fu:"If no reply in a few hours, call.",
  watch:"Never quote a payment or rate by text."},
 {k:"Ghosted after 4 tries",c:"(No reply to the last 4 follow ups.)",words:"no reply silent ghost ghosted quiet busy later",
  read:"Gone quiet. Usually timing or overwhelm, not a hard no.",t:"Cold",s:"Contacted",move:"a pattern interrupt",
  send:"Hey, I don't want to keep bugging you. Should I close out your file for now, or are you still looking at your home options?",
  key:"Should I close out your file for now, or are you still looking at your home options?",
  backup:"Totally understand if life got busy. Just reply \"later\" and I'll check back next month.",
  next:"Send the pattern interrupt, then move to every 2 weeks.",
  fu:"If still silent, check back in 14 days with something new.",
  watch:"If they reply stop, confirm politely and mark Do Not Contact."},
 {k:"Ready to move",c:"Ok I think we're ready. What do you need from me?",words:"ready next step go start apply application need from me let's do it",
  read:"Buying signal. Speed wins here. Get them into the application today.",t:"Hot",s:"App out",move:"gives a clear plan",
  send:"Love it! Here's the plan: a quick application, about 15 minutes, then I handle the rest. Want to do it together on a call this afternoon, or should I text you the link so you can start right now?",
  key:"Want to do it together on a call this afternoon, or should I text you the link so you can start right now?",
  backup:"Awesome. I'll send the link now and stay on the phone with you while you fill it out.",
  next:"Get the application started today.",
  fu:"If no reply in 2 hours, call. Hot leads go cold fast.",
  watch:"Don't say \"pre approved\" or promise approval in the text."},
 {k:"Asks to stop",c:"Please stop texting me.",words:"stop texting unsubscribe remove leave me alone not interested",
  read:"Clear opt out. Respect it right away.",t:"Cold",s:"Contacted",move:"honors the opt out",
  send:"Understood, I'll stop reaching out. Thanks for letting me know, and best of luck!",
  key:"I'll stop reaching out.",
  backup:"None needed.",
  next:"Mark the lead Do Not Contact in the CRM now.",
  fu:"None. Do not follow up.",
  watch:"Opt outs must be honored. This is a compliance requirement."}
];
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const wait = (ms) => new Promise((r) => setTimeout(r, reduce ? 0 : ms));

// ---------------------------------------------------------------- the preview on the phone: an example that plays itself
{
  const th = document.getElementById('pthread');
  const order = [1, 3, 6];
  let i = 0, alive = true;
  new IntersectionObserver(([e]) => { alive = e.isIntersecting; }).observe(th);
  async function play() {
    const x = S[order[i++ % order.length]];
    th.innerHTML = `<span class="bubble"><small>Client texted</small>${esc(x.c)}</span>`;
    await wait(900);
    th.insertAdjacentHTML('beforeend', '<span class="typing"><i></i><i></i><i></i>&nbsp;Coach is reading it</span>');
    await wait(1300);
    th.querySelector('.typing')?.remove();
    th.insertAdjacentHTML('beforeend', `<span class="coachcard">
      <span class="r"><span class="lbl">Read</span>${esc(x.read)}<span class="tags"><span>${x.t}</span><span>Stage: ${x.s}</span></span></span>
      <span class="r"><span class="lbl">Send this</span><span class="send">${esc(x.send)}</span></span>
      <span class="r"><span class="lbl">Next step</span>${esc(x.next)}</span></span>`);
    const rows = [...th.querySelectorAll('.coachcard > .r')];
    rows.forEach((r) => Object.assign(r.style, { display: 'block', opacity: reduce ? 1 : 0, transform: reduce ? 'none' : 'translateY(4px)', transition: 'opacity .35s, transform .35s' }));
    for (const r of rows) { await wait(380); r.style.opacity = 1; r.style.transform = 'none'; }
  }
  (async () => {
    for (;;) {
      if (alive && !document.hidden) { await play(); if (reduce) break; await wait(5200); }
      else await new Promise((r) => setTimeout(r, 600));
    }
  })();
}

// ---------------------------------------------------------------- the live call example: plays itself while on screen
{
  const box = document.getElementById('cmLines');
  const lo = document.querySelector('.v.lo'), cl = document.querySelector('.v.cl');
  const SCRIPT = [
    ['lo', 'Thanks for hopping on, Dana. What has you looking at your home options?'],
    ['cl', 'Honestly, your rates are probably higher than my credit union’s.'],
    ['chip', '◆ Moment: rate objection · 0.2 s'],
    ['card', '<b>Say this</b>Totally fair to compare. Let me be a second set of eyes so you know you’re getting the best option for your home.<b>Ask next</b>What matters most to you: the lowest payment, or the lowest total cost?<b>Watch out</b>Don’t quote a rate or knock the credit union.'],
    ['lo', 'Totally fair. What matters most to you, the lowest payment or the lowest total cost?'],
    ['cl', 'Probably the payment. Things are tight right now.'],
  ];
  let alive = false, running = false;
  new IntersectionObserver(([e]) => { alive = e.isIntersecting; if (alive && !running) loop(); }, { threshold: 0.3 }).observe(box);
  async function loop() {
    running = true;
    while (alive) {
      box.innerHTML = '';
      for (const [kind, text] of SCRIPT) {
        if (!alive) break;
        let el;
        if (kind === 'lo' || kind === 'cl') {
          el = document.createElement('div'); el.className = 'ln ' + kind;
          el.innerHTML = `<span class="who">${kind === 'lo' ? 'Loan officer' : 'Client'}</span><span>${text}</span>`;
          (kind === 'lo' ? lo : cl).classList.add('talk');
        } else if (kind === 'chip') { el = document.createElement('span'); el.className = 'chip'; el.textContent = text; }
        else { el = document.createElement('div'); el.className = 'ccard'; el.innerHTML = text; }
        box.appendChild(el);
        await wait(40); el.classList.add('on');
        await wait(kind === 'chip' ? 700 : kind === 'card' ? 3800 : 1900);
        lo.classList.remove('talk'); cl.classList.remove('talk');
      }
      if (reduce) break;
      await wait(4500);
    }
    running = false;
  }
}

// ---------------------------------------------------------------- the text reply example: a new client text every few seconds
{
  const mock = document.querySelector('.replymock');
  const inEl = document.getElementById('rmIn'), outEl = document.getElementById('rmOut'), readEl = document.getElementById('rmRead'), dots = document.getElementById('rmDots');
  const order = [0, 3, 2, 4, 1, 5, 6];
  dots.innerHTML = order.map(() => '<i></i>').join('');
  const close = (x) => esc(x.send).replace(esc(x.key), '<mark>' + esc(x.key) + '</mark>');
  let i = 0, alive = false, timer = 0;
  function show() {
    const x = S[order[i % order.length]];
    inEl.textContent = x.c; outEl.innerHTML = close(x); readEl.textContent = `${x.t} · ${x.move}`;
    [...dots.children].forEach((d, k) => d.classList.toggle('on', k === i % order.length));
  }
  function next() {
    if (!alive) return;
    mock.classList.add('swap');
    setTimeout(() => { i++; show(); mock.classList.remove('swap'); }, reduce ? 0 : 380);
    timer = setTimeout(next, 5200);
  }
  show();
  new IntersectionObserver(([e]) => { alive = e.isIntersecting; clearTimeout(timer); if (alive && !reduce) timer = setTimeout(next, 4200); }, { threshold: 0.3 }).observe(mock);
}

// ---------------------------------------------------------------- the demo, opened
const dlg = document.getElementById('coachDemo');
const sits = document.getElementById('sits'), out = document.getElementById('dmThread');
let timers = [];
function coach(i, custom, scroll) {
  timers.forEach(clearTimeout); timers = [];
  [...sits.children].forEach((b, j) => b.setAttribute('aria-checked', String(i === j)));
  const x = S[i];
  const rows = [
    '<h4>Read</h4>' + esc(x.read) + '<div class="tags"><span>' + x.t + '</span><span>Stage: ' + x.s + '</span></div>',
    '<h4>Send this</h4><div class="send">' + esc(x.send) + '</div><button type="button" class="copy">Copy the text</button>',
    '<h4>Backup</h4>' + esc(x.backup),
    '<h4>Next step</h4>' + esc(x.next),
    '<h4>Follow up</h4>' + esc(x.fu),
    '<div class="warn"><h4>Watch out</h4>' + esc(x.watch) + '</div>'];
  out.innerHTML = `<div class="bubble"><small>Client texted</small>${esc(custom || x.c)}</div><div class="typing"><i></i><i></i><i></i>&nbsp;Coach is reading it</div>`;
  timers.push(setTimeout(() => {
    out.querySelector('.typing')?.remove();
    out.insertAdjacentHTML('beforeend', '<div class="coachcard">' + rows.map((r) => '<div>' + r + '</div>').join('') + '</div>');
    out.querySelector('.copy').addEventListener('click', async (e) => { try { await navigator.clipboard.writeText(x.send); e.target.textContent = 'Copied'; } catch { e.target.textContent = 'Select the text to copy'; } });
    out.querySelectorAll('.coachcard > div').forEach((el, k) => { if (reduce) el.classList.add('on'); else timers.push(setTimeout(() => el.classList.add('on'), 120 + k * 170)); });
  }, reduce ? 0 : 700));
  if (scroll && matchMedia('(max-width: 860px)').matches) document.getElementById('dmOut').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
}
S.forEach((x, i) => {
  const b = document.createElement('button');
  b.type = 'button'; b.className = 'sit'; b.setAttribute('role', 'radio'); b.setAttribute('aria-checked', 'false');
  b.innerHTML = `<b>${esc(x.k)}</b><span>"${esc(x.c)}"</span>`;
  b.addEventListener('click', () => coach(i, null, true));
  sits.appendChild(b);
});
document.getElementById('own').addEventListener('submit', (e) => {
  e.preventDefault();
  const raw = document.getElementById('ownText').value.trim(); if (!raw) return;
  const q = raw.toLowerCase();
  let best = 0, score = -1;
  S.forEach((x, i) => { const s = x.words.split(' ').reduce((n, w) => n + (q.includes(w) ? 1 : 0), 0); if (s > score) { score = s; best = i; } });
  coach(best, raw, true);
});
document.querySelectorAll('[data-demo]').forEach((b) => b.addEventListener('click', () => { dlg.showModal(); coach(0); }));
document.getElementById('dmClose').addEventListener('click', () => dlg.close());
dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
dlg.addEventListener('close', () => { timers.forEach(clearTimeout); });

// ---------------------------------------------------------------- the Gremlets playground: the real engine on a mock Mac desktop
const frame = document.getElementById('habitat');
const toastEl = document.getElementById('toast'), loading = document.getElementById('stageLoading');
const GUARDIANS = ['mosswarden', 'sproutbolt', 'orbwarden', 'trundle', 'boilerbit', 'listenling', 'bloomcore', 'slumberbolt', 'rotorlet', 'stridelet', 'pondhead', 'ivybolt', 'beaconbit'];
const pickFour = (avoid = []) => GUARDIANS.filter((id) => !avoid.includes(id)).sort(() => Math.random() - 0.5).slice(0, 4);
let cast = pickFour();
const deskURL = () => `gremlets/desk/?g=${cast.join(',')}`;
document.getElementById('fullLink').href = deskURL();
let g = null, toastT = 0, recent = [], loadingNow = null, sid = 0;

function toast(t) { toastEl.textContent = t; toastEl.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove('on'), 3600); }
function load() {
  if (loadingNow) return loadingNow;
  frame.src = deskURL();
  loadingNow = new Promise((res) => {
    const t0 = performance.now();
    const poll = () => {
      try { const w = frame.contentWindow; if (w?.gremlets?.ready && w.gremlets.world.creatures.length) { g = w.gremlets; loading.hidden = true; return res(); } } catch { /* not yet */ }
      if (performance.now() - t0 < 20000) setTimeout(poll, 120); else { loading.textContent = "The Gremlets didn't load here. Try Full screen."; res(); }
    };
    poll();
  });
  return loadingNow;
}
const doc = () => frame.contentDocument;
const press = (id) => doc()?.getElementById(id)?.click();
const focusStage = () => { try { frame.focus(); frame.contentWindow.focus(); } catch { /* ignore */ } };
const them = () => g.world.creatures;
const mid = () => frame.clientWidth / 2;
function claude(state) {
  const words = { thinking: 'Claude is thinking: a thought cloud over a Gremlet', waiting: 'Claude needs you: a Gremlet takes a lantern to the edge of the screen', done: 'Task done: a flag goes into the moss' };
  const lines = { thinking: ['✻ Thinking… reading src/engine.js', 'y'], waiting: ['? Claude wants to edit 3 files. Allow? (y/n)', 'y'], done: ['✓ Done. 6 files changed, 228 tests pass', 'g'] };
  // Thinking starts a new session (a Gremlet steps up to help); needs you and done carry on with the same one.
  if (state === 'thinking' || !sid) sid++;
  recent.push({ project: 'gremlets', state, at: Date.now() / 1000 }); recent = recent.slice(-4);
  g.terra.status({ sessions: [{ id: 's' + sid, project: 'gremlets', state }], recent });
  g.desk.log(...lines[state]);
  toast(words[state]);
}
const ACT = {
  thinking: () => claude('thinking'),
  waiting: () => claude('waiting'),
  done: () => claude('done'),
  session: () => { g.watchSession(); toast('A Claude session plays: leaves for edits, helpers for subagents, fruit when tests pass'); },
  pet: () => { for (const c of them()) g.world.pet(c, 400); toast('Pet. They love that.'); },
  dance: () => { for (const c of them()) if (c.isGrounded && !c.isAsleep) g.world.startDance(c, 5, false); toast('Dance party'); },
  special: () => { for (const c of them()) if (!c.isAsleep) g.world.startSpecial(c); toast('Every Gremlet has its own signature move'); },
  shuffle: async () => {
    cast = pickFour(cast);
    for (const c of [...them()]) g.remove(c.id);
    await Promise.all(cast.map((id, i) => g.add(id, undefined)));
    document.getElementById('fullLink').href = deskURL();
    toast('Four new Guardians drop in');
  },
  drive: () => {
    const pick = [...them()].sort((a, b) => Math.abs(a.pos.x - mid()) - Math.abs(b.pos.x - mid()))[0];
    if (pick) { g.takeControl(pick); focusStage(); toast(`You're driving ${pick.species.name}. Arrows to move, X for the pickaxe, Esc to let go`); }
  },
  boss: () => { press('boss'); focusStage(); toast('The Grumble King! X to swing, ↑ to jump, five hearts'); },
  window: () => {
    const open = g.desk.isOpen(1);
    if (open) g.desk.close(1); else g.desk.open(1);
    document.getElementById('winLabel').textContent = open ? 'Reopen the browser window' : 'Close the browser window';
    toast(open ? 'Window closed. Whoever was standing on it tumbles' : 'Back again. They can climb on it');
  },
  rain: () => { g.summonCloud(null, null, frame.clientWidth * (0.2 + Math.random() * 0.4)); toast('A rain cloud. It waters the sprouts'); },
  sprout: () => { g.sprout(); toast('A sprout comes up in the moss. They water, pick and share it'); },
  link: () => { press('link'); toast('Scan the code with your phone, then drive a Gremlet off the edge'); },
  add: () => press('add'),
};
document.querySelectorAll('#ctrl [data-act]').forEach((b) => b.addEventListener('click', async () => {
  await load();
  if (!g) return;
  try { ACT[b.dataset.act](); } catch (e) { console.warn(e); }
}));
new IntersectionObserver(([e], o) => { if (e.isIntersecting) { load(); o.disconnect(); } }, { rootMargin: '600px' }).observe(document.getElementById('stage'));

// ---------------------------------------------------------------- small things
const btn = document.getElementById('copyEmail');
btn.addEventListener('click', async () => {
  const t = document.getElementById('email').textContent;
  try { await navigator.clipboard.writeText(t); btn.textContent = 'Copied'; }
  catch { const r = document.createRange(); r.selectNodeContents(document.getElementById('email')); const s = getSelection(); s.removeAllRanges(); s.addRange(r); btn.textContent = 'Selected, press copy'; }
  setTimeout(() => btn.textContent = 'Copy email', 2000);
});
