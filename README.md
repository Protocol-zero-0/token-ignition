# Token-Ignition

> The task is the interview. Pass it, and you join the research.

Token-Ignition is a **selection gate for AI-native researchers**.

We don't hire on résumés, pitches, or intro calls. We invert the interview: you define a task, you build a system, and if that system can evolve itself and clear an AI-audited gate, you're invited into the research group.

Tokens are how we make that possible — not why we do it.

---

## Status

This repository hosts the **v0.2 protocol test** of Token-Ignition:

- static frontend (`index.html` + `assets/`) — live at the Token-Ignition submission site
- Vercel Edge API routes under `api/`
- public GitHub ledger writes for submissions
- optional GitHub sign-in + Upstash rate limit guard for submit abuse control
- optional trigger into the audit backend

Submissions are written to `Protocol-zero-0/token-ignition-ledger` and start as
`pending`. The audit backend can pick them up through `NANOBOT_PUBLIC_URL` or by
scanning pending ledger rows.

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

## Vercel environment

Required for live submissions:

```text
LEDGER_REPO=Protocol-zero-0/token-ignition-ledger
LEDGER_BRANCH=main
LEDGER_GITHUB_TOKEN=<GitHub token with contents read/write on the ledger repo>
ADMIN_TOKEN=<admin password for /admin/>
CONTACT_ENCRYPTION_SECRET=<strong random secret for contact encryption>
```

Optional backend trigger:

```text
NANOBOT_PUBLIC_URL=https://<audit-receiver-origin>
NANOBOT_TRIGGER_SECRET=<same value configured on the backend>
```

Optional submit guard:

```text
SUBMIT_GUARD_ENABLED=true
GITHUB_CLIENT_ID=<GitHub OAuth App client id>
GITHUB_CLIENT_SECRET=<GitHub OAuth App client secret>
SESSION_SECRET=<strong random secret for signing the login cookie>
UPSTASH_REDIS_REST_URL=<Upstash Redis REST URL>
UPSTASH_REDIS_REST_TOKEN=<Upstash Redis REST token>
```

When `SUBMIT_GUARD_ENABLED` is not exactly `true`, the current open submit flow
is preserved: no GitHub login requirement and no submit rate limit. This lets
you deploy the code before wiring GitHub OAuth and Upstash.

When `SUBMIT_GUARD_ENABLED=true`, `/api/submit` requires a signed GitHub login
session and checks the Upstash rate limit before writing to the ledger or
triggering the audit backend.

GitHub OAuth callback URL:

```text
https://token-ignition.sora2.today/api/auth/github/callback
```

Admin login remains separate from GitHub OAuth:

```text
https://token-ignition.sora2.today/admin/
```

The admin password is `ADMIN_TOKEN`. It is never shipped to browser JavaScript;
successful admin login sets an HttpOnly cookie.

---

## Submit guard limits

The current limits are intentionally fixed in code to avoid adding many
deployment variables:

```text
GitHub user: 5 submissions / minute
GitHub user: 30 submissions / day
IP address: 20 submissions / minute
```

Implementation notes:

- Rate limit storage uses Upstash Redis REST.
- Keys include a minute or day bucket and have TTLs, so they do not grow forever.
- Any exceeded dimension returns HTTP `429` with `{ "ok": false, "error": "rate limit exceeded" }`.
- A rate-limited request does not write to the ledger and does not call the audit backend.
- Submit logs include `userId`, `ip`, `limited`, and successful `submission_id`.
- Logs do not include contact info, OAuth secrets, Redis tokens, or backend trigger secrets.

If these thresholds need to change often, add one future variable such as
`SUBMIT_RATE_LIMITS=user:5/m,30/d;ip:20/m`. For now they are deliberately kept
out of environment config.

---

## Smoke tests

Guard disabled:

```bash
curl -sS -X POST https://token-ignition.sora2.today/api/submit \
  -H 'content-type: application/json' \
  --data '{}'
```

Expected: `422 invalid` with missing field details.

Guard enabled, not logged in:

```bash
curl -sS -X POST https://token-ignition.sora2.today/api/submit \
  -H 'content-type: application/json' \
  --data '{}'
```

Expected: `401` and `github sign-in required`.

Guard enabled, logged in with GitHub:

1. Open `/api/auth/github/start`.
2. Complete GitHub login.
3. Submit from the page.

Expected: `200`, `status: "pending"`, and a new row in
`submissions/index.json`.

Rate limit:

1. Login with GitHub.
2. Submit more than 5 times in one minute, or more than 30 times in one day.

Expected: `429 rate limit exceeded`; no new ledger row for the rejected attempt.

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
