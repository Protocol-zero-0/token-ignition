# Token-Ignition

> The task is the interview. Pass it, and you join the research.

Token-Ignition is a **selection gate for AI-native researchers**.

We don't hire on résumés, pitches, or intro calls. We invert the interview: you define a task, you build a system, and if that system can evolve itself and clear an AI-audited gate, you're invited into the research group.

Tokens are how we make that possible — not why we do it.

---

## Status

This repository hosts the **v0.1 protocol test** of Token-Ignition:

- static frontend (`index.html` + `assets/`) — live at the Token-Ignition submission site
- meta-rules, protocol spec, and submission schema (see `/spec`)
- public ledger of submission hashes — AI audit results appended by bot (to be wired)

No backend is wired yet. Submissions in v0.1 are captured client-side and hashed into a local ledger for visual/UX testing; the real submission pipeline (GitHub issue / serverless endpoint → AI audit workflow → ledger append) will land in v0.2.

---

## The three gates

| gate | budget | unlock condition |
| --- | --- | --- |
| `gate.1` — admission | 1M tokens | any well-formed submission is admitted |
| `gate.2` — verified | 10M tokens | AI auditor confirms reproducible self-evolution on gate.1 artifact |
| `gate.3` — research | 100M tokens | emergent behavior verified by consensus of ≥3 independent models; standing invitation to join the research group |

Clearing `gate.3` is how you get in. Tokens are the side-effect that lets you keep going.

---

## Meta-rules

- **R1** — you define the task; it must require a system that evolves itself.
- **R2** — you define the evaluation criterion; it must be reproducible and machine-verifiable.
- **R3** — you build the system; the system, not you, produces the final output.
- **R4** — all submissions are AI-judged; human audit is random and post-hoc.
- **R5** — identity is irrelevant; submissions are accepted under pseudonym.
- **R6** — selection is gated; pass a gate, unlock more resources; pass the final gate, join the research.

---

## What counts as a valid submission

1. **Self-evolution, not prompt-engineering.** The system must modify its own behavior across iterations without human edits to prompts, weights, or code between runs.
2. **Machine-verifiable output.** The evaluation criterion must be checkable by an AI auditor with no proprietary access — public endpoint, public artifact.
3. **Live, AI-readable endpoint.** You must provide a URL an AI can crawl. HTML is fine; JSON / OpenAPI / plain text are better. Logins, captchas, GUIs are not accepted.
4. **Reproducibility micro-run.** Attach at least one log of a full run: inputs, intermediate state, final artifact hash. Our auditor re-runs a randomly sampled slice.

If the AI auditor cannot independently verify your artifact, the submission is rejected. We do not email you for clarifications. **The endpoint is the application.**

---

## Local development

```bash
cd token-ignition
python3 -m http.server 5173 --bind 127.0.0.1
# open http://localhost:5173
```

The frontend is vanilla HTML/CSS/JS — no build step. Copy / translate strings live in `assets/app.js` under the `I18N` dictionary (`en` and `zh`). The hero ASCII art is procedurally generated in `renderAsciiArt()`. The subtle background node topology is in `startTopology()`.

---

## Roadmap

- [x] v0.1 — static protocol test site, hybrid terminal + form UX, bilingual EN/ZH
- [ ] v0.2 — GitHub-repo-as-backend: submissions become issues/PRs, AI audit runs as GitHub Action, ledger appends as commit
- [ ] v0.3 — multi-model consensus judge for `gate.3` (3+ independent models), random human audit sampler
- [ ] v0.4 — public API spec for submission endpoint requirements (`/benchmark`, artifact hash conventions)

---

## Host

Research host: **Joule Research**. Token-Ignition is operated as a selection front door for Joule's research group.

This is a protocol test. The selection machinery is intentionally minimal. If you have a clean criticism of the protocol, file an issue.
