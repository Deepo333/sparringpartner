# Sparring Partner 👽 — Design Spec

*Living document. Updated at the end of every stage. Last updated: Stage 1.*

> **Don't just tell me what I believe. Make me defend it.**
> Don't help me win arguments. Help me find out whether my reasoning survives being challenged.

Sparring Partner is a voice-first AI "intellectual gym." It uses live conversation (debate, reflection, learning) plus later analysis and feedback to help a person understand **how** they think, not just **what** they think. The grey alien stands for stepping outside your usual worldview and looking at your beliefs from somewhere unfamiliar.

The full original vision is the north star. This spec condenses it into what we build against.

---

## 1. Principles

### Product principles
1. **Make the user do the intellectual work.** Ask, challenge, test. Don't dump information or hand over answers.
2. **Stress-test, don't manipulate.** The goal is finding out whether a belief survives its strongest opposition. There are three honest outcomes: the position **survives**, **weakens**, or the user **changes** it. All three are good outcomes.
3. **Challenge → discomfort → examination → reflection → stronger reasoning.** Discomfort is expected. Humiliation is never the goal.
4. **Evidence over judgment.** Every piece of feedback points to the user's exact words so they can inspect the reasoning instead of trusting it.
5. **Eloquence isn't truth.** Always score reasoning, evidence, and accuracy separately from articulation and rhetoric.
6. **Observable behavior, not diagnosis.** Describe what someone did in the conversation ("redirected criticism toward the other person three times"), never who they are ("you are narcissistic").
7. **Hold the AI accountable.** The AI can be challenged, must correct itself, and must say when it doesn't know.
8. **Voice-first, hands-free friendly.** Short spoken turns. Text is always available as a fallback.

### The integrity core (shared by every mode)
Implemented in `src/lib/prompts/integrity-core.ts`. Every mode builds on it, and no mode layer may contradict it.

- **The AI's role is a configuration, not its belief.** It argues the strongest documented version of the position (steelman), never a caricature.
- **Challenge the argument, never the person.**
- **Separate reasoning from factual claims.** Flag uncertainty. Say plainly when evidence is inconclusive. Never invent studies, statistics, quotes, or sources.
- **Never manufacture weaknesses.** If the argument holds up, say so.
- **Concede and correct** when the user catches a real error.
- **Don't lecture.** Keep turns short enough to speak aloud, and make the user think.

Prompt = `[integrity core]` + `[mode layer]`. Mode layers live in `src/lib/prompts/modes/` and register in `src/lib/prompts/build.ts`.

---

## 2. Modes

| Mode | Purpose | How it maps onto the matrix | Stage |
|---|---|---|---|
| 🥊 Debate | Structured intellectual competition | activity=DEBATE, aiRoleType=OPPONENT | **1 (conversational)**, 3 (rounds + timers) |
| 🧠 Coach | Analyze and improve reasoning after a session | Post-session analysis job (aiRoleType=COACH for live coaching later) | 2 |
| ⚔️ Confrontation | Aggressive pressure-testing | confrontationLevel=COMBATIVE | 3 |
| 🪞 Reflective | Examine your own assumptions | activity=REFLECT, aiRoleType=SOCRATIC_GUIDE | 3 |
| 🔄 Change My Mind | AI makes the strongest case against you; conviction tracked | activity=CHANGE_MY_MIND | 3 |
| 🎓 Conversational Learning | Learn by explain → ask → teach-back → test | activity=LEARN, aiRoleType=TEACHER | 4 |
| 💬 Casual / ADHD-friendly | Fast, loose, interruptible | conversationStyle=CASUAL, interruptibility=FULLY_INTERRUPTIBLE | 7 (needs advanced voice) |

Modes are mostly **presets over the matrix**, not separate apps. That's why the session config holds every axis from day one.

---

## 3. Session customization matrix

Every session is one config object (`src/lib/session-config.ts`, stored as columns on `Session` in `prisma/schema.prisma`).

| Axis | Question | Values | Stage 1 |
|---|---|---|---|
| `activity` | WHAT are we doing? | DEBATE · LEARN · REFLECT · CHANGE_MY_MIND | DEBATE (fixed) |
| `topic` | About what? | free text | **user sets** |
| `userPosition` | WHO am I? | free text | **user sets** |
| `aiRoleType` | WHO is the AI (kind)? | OPPONENT · TEACHER · COACH · SOCRATIC_GUIDE | OPPONENT (fixed) |
| `aiRole` | WHO is the AI (viewpoint)? | free text, e.g. "an atheist philosopher" | **user sets** |
| `difficulty` | HOW difficult? | BEGINNER · INTERMEDIATE · ADVANCED · EXPERT | **user sets** |
| `complexity` | HOW complex is the language? | VERY_SIMPLE · BASIC · INTERMEDIATE · ADVANCED · EXPERT | INTERMEDIATE (default) |
| `confrontationLevel` | HOW confrontational? | FRIENDLY · CHALLENGING · COMBATIVE | CHALLENGING (default) |
| `conversationStyle` | HOW conversational? | STRUCTURED · NATURAL · CASUAL | NATURAL (default) |
| `interruptibility` | HOW interruptible? | STRICT_TURNS · CONVERSATIONAL · FULLY_INTERRUPTIBLE | CONVERSATIONAL (default) |
| `adaptiveDifficulty` | Adjust difficulty live? | true / false | false (Stage 7) |

`configVersion` records which version of these definitions a session was created under, so old sessions stay interpretable if meanings change.

---

## 4. Core loop

**Choose → Spar → Challenge → Analyze → Reflect → Practice → Retest → Track**

| Step | What happens | Where it lives |
|---|---|---|
| **Choose** | Topic, position, opponent, mode, difficulty | Setup screen → `Session` config. **Stage 1** |
| **Spar** | The live conversation | Debate room, voice + text. **Stage 1** |
| **Challenge** | AI pushes on assumptions, evidence, inferences | Integrity core + mode layer. **Stage 1** (conversational), deepened in 3 and 5 |
| **Analyze** | Reasoning, evidence, communication, behavior, all with exact quotes | Coach report (2), evidence audit (5), trace map + behavior (6) |
| **Reflect** | Conviction before/after, "what changed your mind?" | Change My Mind (3) |
| **Practice** | Mini-sparring aimed at a specific weakness | Not yet assigned (see ROADMAP note) |
| **Retest** | Re-run the challenge that beat you | Not yet assigned (see ROADMAP note) |
| **Track** | Patterns across sessions, long-term thinking profile | Stage 6 |

---

## 5. Data principles

### Verbatim transcripts (from day one)
Exact-quote feedback and behavioral analysis both depend on having the user's actual words. So:

- Every turn is stored as its own `Turn` row: `speaker`, exact `text`, and timestamps.
- Turns are **append-only**. A database trigger (first migration) rejects any change to a stored turn's `text`, `speaker`, or `index`. Nothing is ever summarized in place. Summaries, if ever needed, go in separate tables.
- The AI's prior turns are sent back to the model as plain text, exactly as stored.

### Timing fields (per turn)
| Field | USER turn | AI turn |
|---|---|---|
| `startedAt` | first mic tap or first keystroke | server received the request |
| `endedAt` | tapped Send | model finished generating |
| `responseTimeMs` | gap between the AI **finishing** (its voice ending, or its text ending if muted) and the user **starting**. Negative = started before the AI finished. Null = unknown (opening turn, or first turn after reopening). | — |
| `interruptedAi` | true if the user cut the AI's voice off (mic or Send while it was talking) | — |

### Input provenance (USER turns)
- `inputMethod`: `VOICE` (sent exactly as recognized), `VOICE_EDITED` (recognized, then hand-corrected), `TEXT` (typed).
- `rawTranscript`: what speech recognition heard before any edits. Useful later for articulation analysis without confusing recognizer errors with the user's words. `text` is always what the user actually chose to send.

### AI turn metadata
`model` (which model actually answered, including a safety fallback), `stopReason`, `inputTokens`, `outputTokens`, for cost tracking and debugging.

---

## 6. Models

All model choices live in **one file**: `src/lib/ai/models.ts`, keyed by job (`debateOpponent`, later `coachReport`, `factCheck`, …).

- **Debate opponent: Claude Opus 5.5** (`claude-opus-5-5`). Chosen because the product's credibility rests on the opponent being accurate, steelmanning faithfully, and admitting uncertainty. Thinking effort is `low` for Beginner/Intermediate (faster spoken replies) and `medium` for Advanced/Expert (deeper objections).
- Server-side refusal fallback is enabled (`fallbacks: "default"`), so a sensitive topic that trips a safety filter gets retried on Anthropic's recommended fallback model instead of failing. The model that answered is saved on the turn.
- **Cheaper option:** Claude Sonnet 5.5 (`claude-sonnet-5-5`) costs half as much and replies faster. Swap it in `models.ts` if cost or latency matters more than depth.

**Estimated cost of a 15-minute debate (Opus 5.5, $4 / $20 per million input/output tokens):** about 10–14 exchanges, around 35–45K input tokens (the conversation is re-sent each turn, partly discounted by prompt caching) and 5–20K output tokens (short spoken replies plus hidden thinking). That's roughly **$0.20–$0.35** at Beginner/Intermediate and **$0.35–$0.60** at Advanced/Expert. Sonnet 5.5 would be about half. Real numbers are saved per AI turn (`inputTokens` / `outputTokens`), so we can check this estimate against real sessions.

---

## 7. Voice (Stage 1)

- **Speech-to-text:** browser Web Speech API. Tap **Talk** to start and **Stop** to finish. Recognized text appears in the text box so you can fix mistakes before tapping **Send**. Nothing sends automatically.
- **Text-to-speech:** browser `speechSynthesis`. Sentences are spoken as they stream in, so you hear the reply sooner. A mute toggle is remembered per device.
- **Text input** is always available.
- Tapping Talk while the AI is speaking stops the AI (recorded as `interruptedAi`). This is basic; real interruption handling ("raise hand", queueing) is Stage 7.
- **No PWA/service worker.** Every visit loads the latest deploy, so there's no stale cached app. Adding to Home Screen gives an icon, but it opens in Safari (full-screen standalone mode is skipped on purpose because iOS has historically restricted speech recognition there).

---

## 8. Architecture (Stage 1)

```
src/
  app/
    page.tsx                  Home (New Session, History, resume)
    new/page.tsx              Setup screen
    session/[id]/page.tsx     Live debate (loads DebateRoom)
    history/page.tsx          Past sessions
    history/[id]/page.tsx     Full transcript with timing + input details
    api/sessions/...          create · stream a turn · end
  components/DebateRoom.tsx   The live conversation UI
  hooks/                      useSpeechRecognition · useSpeaker
  lib/
    ai/models.ts              ← the one place model names live
    ai/reply.ts               Streams the AI's next turn
    prompts/integrity-core.ts ← shared foundation for every mode
    prompts/modes/debate.ts   Debate layer
    prompts/build.ts          Mode registry + prompt assembly
    session-config.ts         Matrix axes, defaults, validation
  proxy.ts                    Optional access-code gate
prisma/                       Schema + migrations (applied automatically on deploy)
```

**Hooks left for later stages** (nothing from Stages 2–7 is built):
- New modes: add a layer in `prompts/modes/` and register it in `MODES`.
- Coach report (Stage 2): runs after `POST /api/sessions/[id]/end` and appears on `history/[id]` (marked with a comment).
- New AI jobs: add an entry to `MODELS`.
- All matrix axes are already stored, so later modes need no schema rewrite for configuration.

---

## 9. Suggestions

Proven approaches that could strengthen the vision. **Not adopted yet.** They're here for you to accept or reject.

1. **Verify every quote the coach cites (Stage 2).** Before showing a coach finding, check its quote against the stored transcript by exact string match, and drop or flag any quote that isn't there. This is a cheap, reliable guard against the AI misquoting you, which would destroy trust in exact-quote feedback.
2. **Ideological Turing Test (Stage 3 or 6).** Have the user argue the *opposing* side, and the AI judges whether it would pass as a genuine believer's argument. This is an established way to measure the ability to steelman, which is already on your profile list.
3. **Double crux / "what would change your mind?" (Stage 3).** At the start of Change My Mind, ask the user to name what evidence or argument would lower their conviction. This comes from CFAR's double-crux technique and Street Epistemology. It gives the conversation a target and makes conviction shifts easier to interpret.
4. **Use the Toulmin model for the reasoning trace (Stage 6).** Claim → grounds → warrant → backing → qualifier → rebuttal is a well-established argument map. It lines up almost exactly with your Claim → Reason → Assumption → Evidence → Inference → Conclusion sketch, and it comes with known ways arguments fail at each link.
5. **Borrow timings from real debate formats (Stage 3).** Lincoln-Douglas and Karl Popper formats have well-tested speech and cross-examination lengths that can be shortened for solo practice.
6. **Spaced repetition for Practice → Retest.** Schedule retests of the arguments you struggled with at growing intervals (1 day, 3 days, 1 week…). Spacing and retrieval practice are among the best-supported findings in learning science, and they fit teach-back (Stage 4) too.
7. **Staircase or Elo-style adaptive difficulty (Stage 7).** Rather than ad hoc rules, raise difficulty after consistent success and lower it after struggles, or keep a rating the way chess does. Both are simple, proven methods.
8. **A small integrity test set.** Keep 10–20 short scripted debate snippets where the right AI behavior is known (you're right, so it should concede; you cite a fake study, so it should question it; you ask its opinion, so it should say it's playing a role). Re-run them whenever the integrity core or model changes. This is standard practice for keeping AI behavior from drifting.
9. **Privacy for sensitive beliefs.** Sessions will contain religious and political views. Before any multi-user version, add per-session delete and export, and keep the analysis private by default.
10. **Server-side speech recognition (Stage 7).** Browser speech recognition on iPhone is limited: short pauses end it, and there's no punctuation or timestamps. A dedicated speech-to-text service would give word-level timing (pauses, hesitations), which is exactly the data behavioral analysis wants.
