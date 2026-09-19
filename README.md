# JevSpeak

**Jev is a decision model, not a language model.**

JevSpeak explores whether a model that cannot generate free-form text can still
communicate naturally.

Instead of:

```
LLM → tokens → sentence
```

JevSpeak uses:

```
Jev → decisions → semantic representation →
deterministic language compiler → sentence
```

> **No GPT / Claude / Gemini model is used to generate Jev's responses.**
> Claude was used as a software development tool to build this codebase. It is
> not part of the runtime conversational pipeline, and there is no hidden
> "rewrite", "grammar fix", or fallback call to any generative model anywhere.

---

## The idea

A language model picks the next token. Jev picks *meaning*.

On every turn, Jev is asked ~13 questions in parallel about the user's message —
intent, topic, emotion, which speech act is appropriate, which way a judgment
leans, which finite claim best fits, what caveat applies, what tone, how long.
Each answer is a **probability distribution over finite options**, plus a few
scores (confidence, emotion intensity).

Those decisions are normalized into a typed **Semantic IR**, and a
**deterministic compiler** turns the IR into English. Same IR in, same sentence
out, every time.

```
User:  Will AI replace programmers?

Jev:   intent          question       85%
       stance          mostly_yes     62%
       main_claim      replace_tasks  54%
       qualification   not_all_jobs   64%
       tone            analytical     70%
       confidence      0.66

IR:    { speechAct: "answer", stance: "mostly_yes", confidence: 0.66,
         mainClaim: "replace_tasks", qualification: "not_all_jobs", ... }

Compiler trace:
       confidence(0.66)         → band "I think"
       short_answer             → "I think so"
       claim(replace_tasks)     → "AI is going to take over some programming tasks, not the whole job"
       qualification            → ", though not every role will be affected the same way"

Jev says:
       "I think so. AI is going to take over some programming tasks, not the
        whole job, though not every role will be affected the same way."
```

The **words** come from code. The **meaning** comes from Jev.

## Compiler analogy

| Compiler            | JevSpeak                          |
| ------------------- | --------------------------------- |
| Source              | User message + conversation state |
| Frontend / analysis | Jev (parallel decisions)          |
| AST / IR            | `SemanticResponse`                |
| Backend             | `lib/language` compiler           |
| Target              | English (then speech)             |

## Uncertainty is visible in language

Jev's confidence changes the wording, coarsely and honestly:

| confidence | wording                     |
| ---------- | --------------------------- |
| < 0.50     | declines / asks to clarify  |
| 0.50–0.60  | "Maybe."                    |
| 0.60–0.75  | "I think so." / "I think…"  |
| 0.75–0.90  | "Probably."                 |
| 0.90–0.97  | "Very likely."              |
| 0.97+      | "Yes." / "I'm confident…"   |

Below the threshold Jev does not bluff: *"I'm not confident enough to answer
that directly. Which part are you most interested in?"*

## Compositional, not canned

Responses are assembled from semantic layers, not looked up whole:

```
[acknowledgement] + [short answer] + [claim + hedge] + [qualification] + [follow-up]
```

Which layers appear is decided by the speech act and length; the wording of
each is drawn from small phrase banks, chosen by a seed derived from the IR.
Templates decide wording. The IR decides meaning.

## Same decisions, another language

The strongest evidence that language is only a rendering layer: switch the
locale pack and the *same* Jev decisions come out in Chinese. Nothing about
Jev, the IR or the planner changes — only `lib/language/locales/zh.ts`.

```
IR:  { speechAct: "answer", stance: "mixed", confidence: 0.68,
       mainClaim: "replace_tasks", qualification: "context_dependent" }

en:  Yes and no. AI is going to take over some programming tasks, not the
     whole job, though it depends on the specifics.

zh:  既是也不是。AI会接手一些编程任务,但不是整个职业,不过要看具体情况。
```

A locale pack (`lib/language/locale.ts`) is phrase banks + a handful of
surface-grammar functions (how to attach a clause, how to end a sentence, how
to join). Adding a language is adding a pack. The UI's EN / 中文 toggle
switches both the rendering and the TTS voice.

## Architecture

```
app/api/chat            HTTP entry → runTurn()
lib/conversation        structured memory (last N turns, topic, sentiment, open question)
lib/jev                 Jev adapter
  schema.ts               the parallel questions + raw answer shape
  mock.ts                 deterministic mock scorer (JEV_MODE=mock)
  client.ts               real API client (JEV_MODE=api) — the only file that knows the wire format
  decision.ts             raw answers → JevDecision (distributions) → SemanticResponse (IR)
lib/language            the language engine (extractable as @jevspeak/language)
  compiler.ts             repair IR → plan slots → realize phrases → grammar (locale-independent)
  locale.ts               LocalePack interface: phrase banks + surface grammar
  locales/en.ts, zh.ts    the English and Chinese packs
  confidence.ts           probability → hedge bands
  templates.ts, grammar.ts  English phrase banks and grammar helpers
  seed.ts                 deterministic variation
lib/tts                 pluggable speech provider (browser SpeechSynthesis today)
types/                  Semantic IR, conversation, trace types
components/             chat UI, Jev Brain panel, debug pipeline view
tests/                  compiler, adapter, and memory tests
```

Nothing outside `lib/jev` sees raw Jev payloads. Nothing outside
`lib/language` produces words.

## Running

```bash
npm install
cp .env.example .env.local   # JEV_MODE=mock by default
npm run dev
```

Open http://localhost:3000. `/chat` is the app.

### Modes

- `JEV_MODE=mock` — a deterministic, feature-based scorer that answers the same
  questions with distributions. Realistic enough to develop the whole product
  against. Clearly labelled **JEV MOCK** in the UI. It is not a language model.
- `JEV_MODE=api` — calls the real Jev API (TypeSafe System One,
  `POST https://api.typesafe.ai/v1/systemone`, model `jev-latest`). Requires
  `JEV_API_KEY`; the app refuses to run in api mode without it and reports the
  error rather than falling back to anything. `JEV_API_URL` / `JEV_MODEL` are
  optional overrides (e.g. for another provider that hosts Jev).

The wire format lives entirely in `lib/jev/client.ts` (`toWire` / `fromWire`).
We send the structured conversation state as a JSON `state` and our 13
questions as Jev primitives — 11 `choice` questions (each option with a
criterion), one `score` (emotion intensity, five anchors) and one `noul`
(whether a direct, confident response is warranted). Jev's answers come back as
per-option probabilities plus a calibrated confidence per decision; scores are
normalized from anchor indices to [0, 1].

The criteria text in `lib/jev/schema.ts` is the closest thing this project has
to a "prompt": it is the only prose Jev reads, and tuning it is how you tune
Jev's decisions.

### Failure states

API unavailable, malformed responses, missing key, rate limits, network errors,
and unsupported/contradictory semantic combinations are all surfaced in the UI
with a code and message. The compiler repairs contradictory IR (e.g.
"empathize" with a happy emotion, an "answer" below the confidence threshold)
and records every repair in the trace.

## UI

- **Conversation** — plain chat, with a 🔊 Speak button per reply (browser TTS,
  auto-speak toggle).
- **Jev Brain** — every decision with the full distribution, so the
  alternatives Jev rejected are visible. Dimensions the compiler didn't use for
  this reply are marked *unused*.
- **debug** — the full pipeline for the selected reply: raw state → Jev
  decision → normalized IR (with repairs) → compiler trace → final text.

## Tests

```bash
npm test
```

Covers confidence wording, negation, qualification, questions, punctuation,
emotional responses, missing optional fields, contradictory states, mock
determinism, normalization of malformed Jev answers, and memory windowing.

## Supported domains (MVP)

Factual-style questions, opinion/stance questions, yes/no judgments, emotional
acknowledgement, simple advice, clarification, casual follow-up. Anything else
degrades gracefully to an acknowledgement or a clarifying question — never to a
generated sentence.

A real limitation worth stating plainly: Jev can only select from the finite
claim vocabulary in `types/semantic.ts`. It cannot recall a specific fact it
has no claim for, so *"What's the GDP of Peru in 2019?"* yields a low-confidence
decline rather than a number. Extending the product means extending the claim
vocabulary and its templates — not adding a generator.
