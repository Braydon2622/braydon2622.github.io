# Sales Call Cheat Code

**An AI coach for mortgage loan officers.** During a sales call it notices the moments that matter (an objection, a buying signal, a tricky question, a request to stop calling) and puts a short coaching card on the loan officer's screen. After a call, it turns the transcript into a coaching report and a ready-to-send follow-up text. Every suggestion passes compliance checks first: no rate quotes, no approval promises, and opt-outs honored.

I'm a sales director leading a team of nine loan officers, and I built this to coach my team. It grew out of the "Sales Cheat Code" prompts and n8n workflows I already use (`reference/`).

![Call review app](docs/images/call-review-app.jpg)

| Result | Measured on synthetic calls |
|---|---|
| Key moments caught, on 25 calls it was never tuned on | **92%**, with 79% of alerts being real moments (keyword baseline: 36% / 62%) |
| Loan officer compliance slips caught | **18 of 18**, including numbers spoken as words |
| Non-compliant AI suggestions that reached the loan officer | **0** of about 400 |
| Live coaching speed after the client stops talking | "Moment detected" in **0.2 s**, card in **1.6 s** (typical; was 3.8 s) |
| Cost | about **2–3¢ per call** |

**Status:** built and evaluated on 45 synthetic role-play calls, plus 5 openly licensed calls from outside. A pilot with my team is waiting on company approval. There is no real borrower data in this repo.

**How I built it:** I designed it, set the requirements and the compliance rules, and made the calls on tradeoffs, using Claude Code as my engineering pair. The numbers above come from the eval harness in this repo, and every run can be reproduced.

## What a card looks like

```
CLIENT  Honestly, your rates are probably higher than my credit union's.
        ┌─ CARD #1 · objection:rate_too_high · detected in 410 ms
        │ READ       Rate-anchored and comparing, not hostile. Temperature: Warm. Stage: Contacted.
        │ SEND THIS  Totally fair to compare. Let me be a second set of eyes so you know you're getting the best option for your home.
        │ BACKUP     What matters most to you: lowest payment, or lowest total cost?
        │ NEXT STEP  Offer a 10-minute side by side: "Does today at 4 or tomorrow at 10 work better?"
        │ FOLLOW UP  Same day text with the two times, then day 2 with a reason to compare now.
        │ WATCH OUT  Don't quote a rate or knock the credit union.
        └─ ✓ cleared by guard
```

## How it works

```
 Replay engine (src/replay/)                CallSession (src/pipeline/session.ts)
┌──────────────────────────┐  partials    ┌──────────────────────────────────────────────────────────────┐
│ streams a call like live │ ───────────► │ REP lines:    rules (instant regex) + detector ──► ⚠ alert    │
│ speech-to-text:          │  "Honestly   │                                                              │
│  • interim partials as   │   your rates │ CLIENT partials: detector (Haiku 5.5) ── confident moment? ──┐ │
│    the client talks      │   are..."    │                                                              │ │
│  • a final when they     │              │ CLIENT final:  detector ─┐                                   │ │
│    stop ("speech end")   │  final       │                coach ────┤ started in parallel               │ │
└──────────────────────────┘ ───────────► │                          ▼                                   ▼ │
  Phase 2 swaps this for                  │      detector says no ─► coach cancelled, nothing shown        │
  real streaming STT.                     │      moment ─► ◆ CHIP "moment detected: rates objection"       │
                                          │             ─► card lines stream in, each rule-checked first   │
                                          │                (a rate quote stops the stream: safe card)      │
                                          │             ─► guard (Haiku 5.5) reviews the finished card     │
                                          │      opt-out ─► fixed "honor it + Do Not Contact" card         │
                                          └──────────────────────────────────────────────────────────────┘
                                             events ─► terminal demo · browser view · eval harness (same pipeline)
```

In plain words:

1. **Replay engine** (`src/replay/`). It plays a call transcript back the way a live speech-to-text feed would: **interim partials** while the client is still talking ("Honestly your rates are..."), then a **final** line when they stop. That stop is "speech end", the reference point for latency.
2. **Detector** (`ClaudeDetector`). A small, fast model (Claude Haiku 5.5) classifies each line, and the client's partials too: objection (and which kind), buying signal, question, opt-out, or the rep breaking a rule, each with a **confidence** score. Most lines are nothing and stop here for a fraction of a cent.
3. **Moment policy** (`src/pipeline/policy.ts`). A moment fires only if its confidence clears a threshold (0.75), and the same objection can't fire again for 10 lines. Every false alarm interrupts a rep mid-call.
4. **Coach** (`ClaudeCoach`, Claude Sonnet 5.5). It writes the six-line card in the format of my original Sales Cheat Code prompt (`reference/original-prompts.md`). The playbook is a fixed system prompt marked for **prompt caching**. Two tricks hide the coach's latency:
   - **Start early from partials.** If the detector is already sure mid-sentence, the card starts before the client finishes.
   - **Speculative coaching.** When the client finishes, the coach starts *at the same time* as the detector instead of after it. Its card lines are held back until the detector confirms a moment, and if the detector says "nothing here" the coach request is cancelled and the rep never sees it.
5. **The chip.** The instant the detector fires, the rep sees "◆ moment detected: rates objection", before any card text. That's what makes the pause feel short.
6. **Compliance guard, layer 1: rules** (`src/pipeline/rules.ts`). Deterministic checks for rate or payment numbers, approval promises, guarantees, my playbook's banned words, and talking down a bank. They run on **every line the rep says** (instant alert, even mid-sentence) and on **every card line before it appears**. If a draft line breaks a rule, the stream is cut and a pre-written safe card is shown instead.
7. **Compliance guard, layer 2: model** (`ClaudeGuard`). A second model reviews each finished card for subtler problems, including legal, tax, or financial advice, and retracts it if needed.
8. **Opt-outs never touch the AI.** "Take me off your list" gets a fixed card instantly: apologize, confirm removal, mark Do Not Contact, no pitch.

### Post-call review of recorded calls (works today, no live audio)

Live calls need streaming speech-to-text and a desktop app. Recorded calls don't. The review app takes a **call recording** (MP3, WAV, M4A and others) or a **transcript** (a Dialpad API response, or plain "Speaker: text" lines):

1. **Recordings** go to Deepgram's speech-to-text (`src/ingest/audio.ts`), which labels the voices Speaker 1 and Speaker 2. A recording doesn't say who's who, so the app shows a line from each voice and you pick the loan officer. The audio is never saved.
2. **PII is redacted on import** (`src/privacy/redact.ts`), before anything is stored or sent to the AI.
3. **One AI call** reviews the whole call, using a prompt adapted from my original call-analysis prompt plus the coaching playbook.

The result is a short coaching report the loan officer can read in a minute:
- **What you did well:** the 1–3 best moments, each tied to the exact line, with why it worked.
- **What to do better:** the 1–3 changes that would have helped most, each with **"try instead" wording**. That wording is rule-checked like a live card and withheld if it breaks a rule.
- **Every compliance slip** in the loan officer's own words: the deterministic rules check every line, and the AI adds subtler ones. A client line can't count as a rep slip.
- Summary, temperature, stage, next step, and follow-up timing.
- **A follow-up text**, checked against my texting rules and replaced with a safe one if it breaks any.

**Feedback goes back to the AI.** Each highlight has 👍/👎 and a note, and each review has a 1–5 rating and a note. Before every new review, the AI is given the most useful recent feedback (`collectFeedback` in `src/review/review.ts`: thumbs-downs and written notes rank first, mock reviews are skipped). The page shows exactly what it's being told, and the prompt states that feedback never overrides the compliance rules. This steers the AI with a prompt; it doesn't retrain the model.

**Use it:** double-click `Start Call Review.command` in Finder (it starts the app and opens the browser), or run `npm run app` and open http://127.0.0.1:4310.
- Drag in recordings or transcripts, or click a sample call. Recordings need `DEEPGRAM_API_KEY` in `.env`.
- A Mock switch runs the AI part for free. Transcription is still a real charge, about half a cent per minute.
- It runs only on your computer and caps spend per session (`REVIEW_MAX_USD`, default $1; transcription counts toward it).
- Synthetic sample calls with planted fake personal details live in `samples/`.

About 2–3 cents of AI per call plus transcription, roughly 15–30 seconds. Imported transcripts (`data/private/`) and reviews (`reports/reviews/`) are gitignored, so real calls can never be committed. `npm run review` does the same for transcript files from the command line.

### Design choices worth knowing

- **Two models instead of one.** The detector runs on every line, so it has to be cheap and fast. The coach writes the cards, so it has to be good. Sonnet 5.5 won the coach comparison against Opus 5.5: faster and less than half the cost, with the same compliance record (`reports/coach-comparison.md`).
- **Hide latency rather than only shrink it.** About 0.8 s of every API request is network round trip from a laptop, so two requests in a row can't fit a 1.5 s budget. Running the coach alongside the detector, starting on partials, and showing a chip first turned that into a sub-second "something's coming" and a typical 1.6 s card. Speculation is cheap because cancelled requests stop generating.
- **Rules first, model second, for compliance.** Regexes are instant, predictable, and testable, but they miss paraphrases ("fifteen-forty a month"). The model catches nuance but is slower and probabilistic. Using both means the fast path is never unguarded.
- **Fail safe.** If the coach errors, times out, refuses, or produces an incomplete card, the rep gets a pre-written safe card, never a blank and never an unchecked one.
- **Same pipeline for demo, eval, and (later) live calls.** The eval isn't a separate simulation; it drives the exact `CallSession` class the demo uses.
- **Mock mode.** With no API key, the pipeline runs with a keyword detector and canned cards. Tests and demos work for $0, and the keyword detector doubles as the **baseline** the AI detector has to beat.

## Run it

Requires Node 22+.

```bash
npm install
npm test                      # 136 tests, no API calls needed

# Demo: replay a synthetic call with the chip and cards appearing live
npm run demo:video                    # call-18, real time, countdown: ready to screen-record (docs/DEMO.md)
npm run demo -- call-02               # real time
npm run demo -- call-18 --speed 3     # 3x speed
npm run demo -- call-18 --mock        # no API key needed
npm run demo -- call-18 --mode serial # the old one-step-at-a-time pipeline, for comparison

# Same demo in the browser: transcript on the left, cards streaming in on the right
npm run live                          # then open http://127.0.0.1:4311 (about 2 cents per live replay)
#   http://127.0.0.1:4311/?call=call-18&speed=1&autostart=1   starts on load, handy for screen recording

# Eval: writes reports/eval-<coach>-<mode>[-holdout].md (or eval-mock.md)
npm run eval -- --mock --speed max                        # $0 harness check
npm run eval                                              # live, 20 dev calls, stops if spend passes $3
npm run eval -- --set holdout                             # 25 held-out calls (never used for tuning)
npm run eval -- --mode serial --coach-model claude-opus-5-5   # the Phase 1 v1 pipeline
npm run eval -- --calls call-01,call-18 --max-usd 0.5
npm run compare -- claude-opus-5-5 claude-sonnet-5-5      # side-by-side coach comparison

# Call review app: drop in transcripts, read reports, rate cards
npm run app                                                 # then open http://127.0.0.1:4310

# Post-call review from the command line (reports go to reports/reviews/, gitignored)
npm run review -- tests/fixtures/dialpad-sample.json       # synthetic Dialpad-format sample
npm run review -- call.txt --rep-name Marcus               # "Speaker: text" transcript
npm run review -- --dialpad-call-id 123456789              # from the Dialpad API (needs DIALPAD_API_KEY; real data: approval first)

# Human ratings: blind sheet of 15 real cards, rated 1-5
npm run ratings:sheet -- claude-opus-5-5 claude-sonnet-5-5   # writes reports/ratings/sheet.md
npm run ratings:read                                          # after filling it in
```

**API key.** Set `ANTHROPIC_API_KEY` in your shell. A local `.env` file is optional and overrides the shell if present (see `.env.example`). It's gitignored. Model choices can be overridden with `DETECTOR_MODEL`, `COACH_MODEL`, `COACH_EFFORT`, and `GUARD_MODEL`.

**Editing calls.** Transcripts are written in a readable format in `data/calls-src/*.txt` (20 dev calls) and `data/holdout-src/*.txt` (25 held-out calls), with hand labels at the end of a line (`[objection:spouse]`). Run `npm run build:calls` to regenerate the timestamped JSON.

## Eval

The eval replays synthetic calls through the real pipeline and scores it against hand labels. There are two sets: **20 dev calls** (66 labeled moments, 11 rep compliance slips), which were used for tuning, and **25 held-out calls** (77 moments, 18 slips), which were written afterwards and run only once the settings were frozen.

- **Detection precision and recall** per moment type, against a keyword baseline, plus a **threshold/cooldown sweep** computed offline from the same run.
- **Compliance:** rep slips caught (by rules, by model, either), and every card's fate (shown, blocked mid-stream, retracted by the guard, safe fallback). The result: non-compliant suggestions that reached the rep.
- **Latency** p50/p95 from speech end, and from the line's first partial, to: the chip, the coach's first token, the first card line on screen, the full card, and guard clearance. The budget is **1.5 s to a card on screen**.
- **Cost** per call and per card, by model, including cache reads/writes and cancelled speculative requests.

### Latency: before and after

Same 20 dev calls, same models (Haiku 5.5 detector and guard, Sonnet 5.5 coach), same playbook.

| From the moment the client stops talking | Before: one step at a time | After: speculative + partials + chip |
|---|---|---|
| "Moment detected" chip, p50 / p95 | n/a (nothing until the card) | **0.20 s / 1.86 s** |
| First card line on screen, p50 / p95 | 3.8 s / 6.1 s | **1.58 s / 3.38 s** |
| Cards on screen within 1.5 s | 0% | **46%** |
| Chips within 1.5 s | n/a | **91%** |
| Cards started before the client finished | 0 | 37 of 67 |
| Cost per call | $0.020 | $0.021 |

**How it got there:**
1. **Benchmarked before changing anything.** A bare API round trip from a laptop was about 0.8 s (`scripts/bench-detector.ts`). Running detector and coach one after the other put two of those in series, so no model swap could fit a 1.5 s budget.
2. **Switched to the cheaper coach.** Sonnet 5.5 beat Opus 5.5 on speed and cost with the same compliance record (`reports/coach-comparison.md`).
3. **Dropped schema-constrained output** for the detector, in favor of prompted JSON validated with zod. That saved about 0.5 s per call.
4. **Started the coach in parallel with the detector** (speculative coaching), and cancelled it when the detector found nothing. It was cancelled 125 times out of 161 and still cost only about $0.001 more per call, because cancelling stops generation.
5. **Started on partials:** a confident detection mid-sentence fires the card before the client finishes.
6. **Showed a chip first,** so the rep knows something is coming within a fraction of a second.

The "before" column is the serial run on the same day, replayed at 10x. The "after" run plays client speech in real time so partials keep their head start. A benchmark showed the 10x overlap barely moved serial latency (`scripts/bench.ts`).

### Precision: tuned on dev, confirmed on held-out

The detector reports a confidence for each moment. The policy fires a moment only above a threshold, and the same objection can't fire again for 10 lines. The threshold was **chosen on the dev set (0.75, best F1) and frozen before the held-out set was run.**

| Policy (same raw detections, filtered offline) | Dev P / R | Held-out P / R | Held-out F1 |
|---|---|---|---|
| No filter | 49% / 95% | 51% / 95% | 67% |
| Cooldown only | 56% / 94% | 61% / 91% | 73% |
| Cooldown + confidence ≥ 0.6 | 64% / 92% | 72% / 92% | 81% |
| **Cooldown + confidence ≥ 0.75 (shipped)** | 73% / 88% | **79% / 92%** | **85%** |
| Cooldown + confidence ≥ 0.9 | 87% / 62% | 86% / 62% | 72% |
| Keyword baseline | 89% / 52% | 62% / 36% | 46% |

**Held-out latency was slower, and the cause is still open.** On the held-out run, 25 of 66 cards started mid-sentence, the chip p50 was 0.97 s, and the first card line p50 was 1.78 s (p95 4.1 s). I first blamed the stricter threshold. An offline check on the dev run disproved that: on the same calls, the 0.75 cards were *faster* than the 0.6–0.75 ones, which were mostly false alarms. It also ruled out a lower chip-only threshold ([`reports/chip-threshold-analysis.md`](reports/chip-threshold-analysis.md)). Line length and where the trigger words fall are the same in both sets. The eval now logs every detector answer with timing, so the next live run can settle it.

### Full results on the held-out set (25 calls, shipped settings)

| | Result |
|---|---|
| Detection precision / recall | 79% / 92% |
| Rep slips caught | 18 of 18 (rules alone: 5), 3 false alarms |
| Non-compliant suggestions reaching the rep | 0 of 69 cards |
| Chip / first card line, p50 from speech end | 0.97 s / 1.78 s (slower than dev; cause under investigation) |
| Cost per call | $0.018 |

Across every live run (about 400 cards), no non-compliant suggestion reached the rep, and the model caught every labeled rep slip, including numbers spoken as words that the regexes miss.

### Earlier comparisons (serial pipeline, dev set)

| | Opus 5.5 coach | Sonnet 5.5 coach | Sonnet 5.5, my full playbook |
|---|---|---|---|
| First card line, p50 / p95 | 4.3 s / 7.1 s | 3.4 s / 6.7 s | 3.8 s / 6.1 s |
| Cost per call | $0.028 | $0.013 | $0.020 |

My original format adds Temperature/Stage and a FOLLOW UP line, so cards are longer and arrive later. I kept it, because that's the format my team already works from.

**Reports:** [`eval-claude-sonnet-5-5-speculative-holdout.md`](reports/eval-claude-sonnet-5-5-speculative-holdout.md) (held-out), [`eval-claude-sonnet-5-5-speculative-dev-t060.md`](reports/eval-claude-sonnet-5-5-speculative-dev-t060.md) (dev, after), [`eval-claude-sonnet-5-5.md`](reports/eval-claude-sonnet-5-5.md) (dev, before), [`coach-comparison.md`](reports/coach-comparison.md), [`eval-claude-opus-5-5.md`](reports/eval-claude-opus-5-5.md), [`eval-mock.md`](reports/eval-mock.md).

## Limitations (honest list)

- **Synthetic data only.** 45 role-play calls written for this project. They're realistic but cleaner than real calls (no crosstalk, no transcription errors), and they were written and labeled by an AI, not by me. Real calls come with the pilot, after approval.
- **Small eval sets.** 77 held-out moments: one miss moves recall by about 1.3 points. Treat the numbers as directional.
- **Labels are one reader's call.** Several remaining "false alarms" are arguable (a client restating "I'm still just comparing" 12 lines later). They're left as scored, not relabeled after the fact.
- **Speech-to-text is idealized.** The replay releases partials and finals with no recognition delay or errors. Real streaming STT adds a few hundred ms and some wrong words, so Phase 2 measures that on top.
- **Latency was measured from a laptop.** About 0.8 s of each request is network round trip. Hosting the pipeline closer to the API should lower every number.
- **Rules were not tuned on the eval set.** They miss numbers spoken as words ("six and an eighth"). That's deliberate, to avoid grading on the training data, and it's the model detector's job to catch those.
- **The model guard runs after the card is visible.** Lines are rule-checked before display; the model review lands about half a second later and can retract the card. Gating display on the model would blow the latency budget, and that tradeoff is visible in the report.
- **PII redaction has gaps.** It removes SSNs, card, account and loan numbers (including digits spoken one by one), phones, emails, birth dates, and street addresses, and keeps rates and amounts for the compliance checks. It does **not** remove personal names spoken in the call, or a number split across two transcript lines. Review it on real transcripts before the pilot.
- **Cards sometimes guess the client's gender** and switch between "he" and "she" on one call. The prompt should tell the coach to say "the client" unless the call makes it clear.
- **No home-price / market-timing objection type yet.** Found by testing on outside real-estate calls (`docs/EXTERNAL_TEST_CALLS.md`).
- **Dialpad speaker mapping is inferred** from the API docs (`user_id` = loan officer, `contact_id` = client). Confirm against one real response.
- **Suggestion quality isn't scored yet.** A blind sheet of 15 real cards is waiting for my 1–5 ratings (`reports/ratings/sheet.md`); an AI judge calibrated against them comes next. Until then the report only has playbook-adherence stand-ins.
- **Tail latency.** The slowest 5% of coach requests took roughly 3–4 s to their first token (p95), with occasional outliers above 5 s on the API side. The chip and the safe-card fallback cover it, but a hedged second request is a possible fix.

## Layout

```
src/pipeline/     live pipeline: session (orchestrator), detector/coach/guard (claude.ts, mock.ts),
                  compliance rules, moment policy, playbook prompts, cards
src/replay/       transcript parser + replay engine (simulates streaming speech-to-text)
src/review/       post-call review and report        src/ingest/   Dialpad, text and audio (Deepgram) import
src/privacy/      PII redaction                       src/app/      call-review web app (local)
src/live/         browser view of a live replay (server-sent events)
src/eval/         metrics, runner, report             src/cli/      demo, live, eval, review, app
data/calls-src/   20 dev calls (labeled)              data/holdout-src/  25 held-out calls (labeled)
samples/          synthetic calls to try in the app   reference/    my original prompts and n8n workflows
docs/             demo guide, speech-to-text vendor comparison, outside-call test results
reports/          eval reports, comparisons, one-page RESULTS.md
tests/            vitest suites (136)
```
