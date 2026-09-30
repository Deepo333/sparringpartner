# Sparring Partner 👽 — Roadmap

Staged plan. Each stage ships something usable and updates `docs/SPEC.md`.

| Stage | Scope | Status |
|---|---|---|
| **1** | **Foundation + Debate mode.** Session config covering all matrix axes, verbatim append-only transcripts with timing, integrity-core prompt, model config, conversational debate with push-to-talk + read-aloud + text fallback, End Session, History. | ✅ Built |
| **2** | **Coach report.** Post-session analysis with exact-quote evidence, strongest and weakest argument, reasoning quality kept separate from rhetoric. | Next |
| **3** | **Reflective, Confrontation, Change My Mind** (with conviction before/after and "what changed?"); **structured rounds with timers** (opening, response, rebuttal, cross-examination, closing). | Planned |
| **4** | **Conversational Learning.** Teach-back, knowledge testing ("test me on this book"), no-lecture format. | Planned |
| **5** | **Evidence.** Fact-checking with sources, tap-a-claim inspection, challenging the AI's evidence. | Planned |
| **6** | **Reasoning trace map, behavioral analysis, long-term thinking profile.** | Planned |
| **7** | **Advanced voice** (interruptions, raise-hand, better speech recognition) and **adaptive difficulty**. | Planned |

## Dependency check

The order works as given. I found no dependency that forces a change:

- Stage 2 only needs verbatim transcripts, which Stage 1 already stores.
- Stage 3's conviction tracking and rounds need no analysis features. Rounds will use the `conversationStyle=STRUCTURED` and `interruptibility=STRICT_TURNS` values that already exist.
- Stage 5's fact-checking is independent. When it lands, the Stage 2 coach report can gain an "Evidence audit" section.
- Stage 6 builds on the Stage 2 analysis pipeline and on many stored sessions, so running it later is an advantage.
- Stage 7's adaptive difficulty works best with Stage 6's performance data.

## Unassigned items from the vision

These parts of the vision don't have a stage yet. Suggested homes:

- **Practice → Retest loop** (targeted mini-sparring on a weakness, then retrying it). Suggest **Stage 6**, once weaknesses are tracked across sessions. A simple "practice this weakness" button could come as early as Stage 2.
- **Casual / ADHD-friendly mode.** Suggest **Stage 7**, since it depends on interruptibility and faster voice.
- **Interactive mini-games** (spot the mistake, find the assumption…). Suggest **Stage 4**, alongside Conversational Learning.
- **Question analysis** (analyzing the user's questions). Suggest **Stage 2** (coach report) for single sessions and **Stage 6** for patterns over time.
