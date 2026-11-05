# Braydon Hart: AI Portfolio

I'm a sales director in Metro Detroit who builds AI tools and trains people to actually use them. This repo hosts my portfolio site (`index.html`) and the real n8n workflows behind my biggest project.

**Portfolio:** open `index.html`, or visit the live site at https://braydonhartai.com.
**LinkedIn:** https://www.linkedin.com/in/braydon-hart-392336209/

---

## Case study: Sales Cheat Code, an AI sales assistant

### The problem
My loan officers lost a lot of time deciding what to say. A client would text back "I'm just shopping around," and the rep would spend 10 minutes writing a reply or skip the follow up completely. Leads went cold from hesitation, not lack of effort.

### What I built
First, an AI assistant my team of 9 uses to get a ready to send reply, the next step, and the follow up timing for any client situation. I trained the team on it with real scenarios from their week.

Then I rebuilt it as an automated system in n8n, connecting Claude, OpenAI, Google Sheets and Gmail:

| Part | What it does | File |
| --- | --- | --- |
| 1. Chat coach | Paste a client text or call notes, get a reply to send, a backup, the next step, follow up timing and compliance notes | `workflows/1-chat-coach.json` |
| 2. Morning follow ups | Every weekday at 8am, reads the lead list, finds who is due, drafts a text for each one, and emails the list | `workflows/2-morning-follow-ups.json` |
| 3. Call listening | Upload a call recording, it gets transcribed, analyzed (summary, objections, next step, follow up text), logged to a sheet and emailed as a recap | `workflows/3-call-listening.json` |
| 4. Scoreboard | A game style scoreboard with XP, levels, streaks and daily quests, plus a one click "log a follow up" link | `workflows/4-scoreboard.json`, `workflows/4-log-follow-up.json` |

### Results
- Follow up work is an estimated 20% faster than writing each message from scratch.
- Saves each rep 30 minutes a day, 4.5 hours a day across a 9 person team.
- The automated version was tested end to end with sample data (sample leads and a role play call).

### Built in safeguards
- Texts avoid words texting platforms flag and never quote rates, payments or approvals.
- A privacy rule keeps sensitive details (SSNs, account numbers, birthdates) out of anything the AI writes.
- The AI drafts and a licensed person reviews and sends. Nothing goes to a client automatically.
- Only fake test data was used while building.

### Tools
n8n, Claude (Anthropic), OpenAI (Whisper transcription), Google Sheets, Gmail, JavaScript code nodes.

---

## Using these workflows
In n8n, create a new workflow and import any file from `workflows/`. Then connect your own Anthropic, OpenAI, Google Sheets and Gmail accounts, replace `YOUR_GOOGLE_SHEET_ID` and `you@example.com`, and test with fake data first. Credentials and personal details were removed from these exports.

## Prompts
The prompts that power these workflows are collected in [`prompts.md`](prompts.md).
