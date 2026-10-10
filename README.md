# Veyr

A decentralized community forum on **GenLayer**. Every post is moderated by validator LLM consensus inside a Python Intelligent Contract. The verdict, the post and the author's reputation are stored on-chain. There is no admin, moderation API, keyword filter or backend.

```text
Browser ──wallet / genlayer-js──▶ GenLayer Studionet ──▶ Veyr Intelligent Contract
                                                          ├─ leader: LLM moderation → APPROVE/REJECT proposal
                                                          ├─ validators: independent LLM moderation each
                                                          ├─ agree only if decision == leader decision
                                                          └─ persist post + verdict + reputation
```

## Live deployment

**Try it: [veyr-eight.vercel.app](https://veyr-eight.vercel.app/)**

| | |
|---|---|
| App | **[veyr-eight.vercel.app](https://veyr-eight.vercel.app/)** (Vercel, auto-deploys from `main`) |
| Network | GenLayer **Studionet** (`https://studio.genlayer.com/api`, chain id `61999`) |
| Contract | [`0x5EBea25E6E8c412eE95Cba374D726C0F19A53CB6`](https://explorer-studio.genlayer.com/address/0x5EBea25E6E8c412eE95Cba374D726C0F19A53CB6) |
| Deployment tx | [`0xd041910b…b83d2b3a6e`](https://explorer-studio.genlayer.com/tx/0xd041910b924ef54f5b1fef718540ba4b3a9d66275b9beeeca76aacb83d2b3a6e) |
| Topic | `GenLayer and blockchain development` |

This is the launch contract: it started with an empty feed, and its on-chain code is byte-identical to `contract/veyr.py`. Records:

- [deployments/studionet.json](deployments/studionet.json): the launch contract above.
- [deployments/studionet-smoke-test.json](deployments/studionet-smoke-test.json): a separate contract from the same source. The live smoke test runs there, so its example posts (including a deliberately toxic one) never appear in the public feed. The latest run passed all 18 assertions: one APPROVE and one REJECT, with counts, reputation and feed visibility checked (it waits out the per-author cooldown between posts).
- [deployments/archive/](deployments/archive/): retired contracts: the development contract, and the v1 launch and smoke-test contracts from before verdict enforcement, abuse limits and pagination were added. Contracts are immutable, so those changes needed a new address.

`npm run live-test` targets the smoke-test contract by default. It refuses to post into the launch contract unless run with `--allow-launch-contract`, and `LIVE_TEST_CONTRACT=0x…` points it at any other contract.

## How moderation works

`submit_post(text)` in [contract/veyr.py](contract/veyr.py):

1. Trims the text and rejects empty posts or posts over 2,000 characters.
2. Runs the **deterministic gates** (see below): suspension, cooldown, duplicate. A refused submission reverts before any LLM call, so it costs validators nothing and stores nothing.
3. Builds a moderation prompt from the on-chain topic and the board policy. The post sits inside `<post>…</post>` delimiters, is declared untrusted data, and any delimiter tags inside it are escaped.
4. Runs `gl.vm.run_nondet_unsafe(leader, validator)`:
   - **Leader**: `gl.nondet.exec_prompt(..., response_format="json")`, normalized to `{decision, category, reason}`.
   - **Validator**: rejects a leader error or malformed proposal, runs its **own** independent moderation, and agrees only if its `APPROVE`/`REJECT` matches. The category and reason wording may differ.
5. After consensus accepts, it stores the post (approved **or** rejected), records its text fingerprint and the author's post time, applies reputation `+1`/`−1`, and indexes it in the public feed only on approval. A rejection that takes reputation to −3 or below suspends the author.

Malformed model output (non-JSON, unknown decision, non-object) raises an error. It never defaults to approval. A disagreement or `UNDETERMINED` outcome writes nothing.

**Policy.** A post is approved only if it is not toxic, contains no sexual or graphically violent content, is on-topic (technology, software, blockchain or GenLayer), and is not spam or advertising.

## Enforcement, abuse limits and scale

All of these are enforced in the contract, not the UI. Time is the transaction timestamp (`datetime.now()` in GenVM), so every validator computes the same result.

| Concern | Rule |
|---|---|
| **Verdicts have consequences** | The public feed (`get_feed_page`) serves **approved posts only**. Rejected posts never appear there; they stay on-chain with their reason for audit (`get_posts_page`). Reputation is enforced: reaching **−3** (three net rejections) **suspends the author for 24 hours**, and each further rejection while at or below −3 suspends again from that moment. Approved posts rebuild reputation. |
| **Spam / flooding** | One submission per author per **60 s**. |
| **Duplicate and replay abuse** | Text identical to **any** earlier submission (case-folded, whitespace-collapsed, stored as a SHA-256 fingerprint) is refused, so a rejected post can't be resubmitted to re-roll the verdict. |
| **Cost abuse** | Every gate above runs before `run_nondet_unsafe`, so refused submissions never trigger the paid LLM consensus step. |
| **Read scaling** | Every list read is paginated with a hard cap of **50** records. The feed walks an index of approved post ids, so a page costs O(page size), not O(board). `get_stats` returns all counts in one call. |

**Residual risk (documented, not solved).** Limits are per address, so a determined attacker can spread spam across many fresh accounts (Sybil). Each one still faces the cooldown, the duplicate check, and suspension after three net rejections, and on a fee-bearing network each submission pays gas. Stronger Sybil resistance, such as staking a deposit that rejections slash, is the next step, and the contract's reputation map is where it would plug in. Storage grows with posts (append-only, by design for auditability); reads stay bounded.

The constants are exposed by `get_limits()` so clients never hard-code them.

**Public interface.** Writes: `submit_post(text)`. Views: `get_topic`, `get_stats`, `get_limits`, `get_author(author)` (reputation, suspended_until, last_post_at), `get_feed_page(offset, limit)` (approved, newest first), `get_posts_page(offset, limit)` (all, newest first, for audit), `get_post(index)`, plus the v1 views `get_post_count`, `get_approved_count`, `get_reputation(author)` and `get_posts()` (now capped to the newest 50).

## Project layout

```text
contract/veyr.py            Intelligent Contract (Python, py-genlayer runner pinned for Studionet)
src/lib/                    config, genlayer client, wallet, consensus polling, errors, retry (+ unit tests)
src/state/                  React hooks: wallet, board, submission, reputation, context
src/components/             UI (built to frontend.md: shadcn tokens, morphing navbar, bento, FAQ…)
src/content.ts              all page copy as typed data
scripts/deploy.mjs          repeatable Studionet deployment (resumable)
scripts/live-test.mjs       live smoke test through real validator consensus
tests/direct/               fast contract tests (gltest direct mode, mocked LLM)
tests/integration/          Studionet tests with real consensus (gltest)
deployments/studionet.json  recorded deployment
```

## Setup

Requirements: Node 20+ (tested on 22), Python 3.12, a browser wallet such as MetaMask.

```bash
npm install
python3 -m venv .venv && .venv/bin/pip install -r requirements-dev.txt
cp .env.example .env     # then fill it in (see below)
```

| Variable | Used by | Purpose |
|---|---|---|
| `VITE_GENLAYER_NETWORK` | browser | `studionet` (or `localnet`). Other values are rejected. |
| `VITE_GENLAYER_CONTRACT_ADDRESS` | browser, live test | Deployed Veyr contract |
| `VITE_GENLAYER_RPC_URL` | browser, scripts | Optional RPC override |
| `VITE_GENLAYER_ACCOUNT_PRIVATE_KEY` | browser | Optional **dev-only** signer used when no wallet is installed. It ships in the bundle, so never use a real key. |
| `GENLAYER_PRIVATE_KEY` | scripts only | Deployer / live-test account |
| `MODERATION_TOPIC` | deploy | Constructor topic |

`.env` is git-ignored. Never commit private keys or seed phrases.

## Run the app

```bash
npm run dev        # http://localhost:5173
npm run build      # type-check + production build to dist/
```

Connect your wallet. Veyr asks it to add or switch to Studionet, and signs `submit_post` with your account. Studionet's gas price is 0, so posting needs no funds. The app:

- reads topic, posts and stats directly from the contract, sequentially and with bounded backoff on rate limits;
- waits for the transaction to reach `ACCEPTED`/`FINALIZED`, showing the live transaction status alongside friendly pipeline labels;
- treats `UNDETERMINED`, `CANCELED`, validator or leader timeouts, rolled-back executions and polling timeouts as errors that never produce a verdict;
- shows the final verdict only after reading the new post back from contract state.

For speed, the GenLayer SDK loads lazily, in parallel with first render, and the board renders each contract read as it arrives. On repeat visits the last board snapshot (kept in `localStorage`) paints immediately. It is labelled as such and always replaced by a fresh read from the contract, so it is a display cache only.

## Deploy

```bash
npm run deploy
```

The script checks that the RPC chain id matches, tops up test GEN via Studionet's `sim_fundAccount` if the balance is low, and pre-flights the contract with `gen_getContractSchemaForCode`. It then deploys with `MODERATION_TOPIC`, waits for acceptance, and verifies the stored topic. Finally it writes `deployments/<network>.json` and prints the address to put in `VITE_GENLAYER_CONTRACT_ADDRESS`.

If a run is interrupted, the tx hash is kept in `.deploy-state.json` and the next `npm run deploy` resumes tracking it instead of redeploying. You can also pass a known hash with `npm run deploy -- --resume 0x<hash>`, or ignore saved state with `--fresh`.

## Tests

```bash
npm run test:contract      # 33 direct-mode contract tests (mocked LLM, ~2s)
npm test                   # 49 frontend unit tests (vitest)
npm run test:integration   # deploys a fresh contract to Studionet, real consensus
npm run live-test          # smoke test on the smoke-test contract (never the launch feed)
```

- **Direct tests** (42) cover suspension at −3 and its expiry and extension, the approved-only feed vs the audit pages, cooldown, duplicate refusal (any author, case and spacing changes), refused submissions leaving state untouched, page bounds and limits. They also cover initialization, validation, persistence, newest-first ordering, counts and reputation. They also cover output normalization (fences, prose, casing, unknown categories, bounded reasons), malformed output never mutating state, the agreement rule via `run_validator()` (agree, disagree, leader error, malformed proposal), and prompt-injection framing including delimiter-escape attempts.
- **Integration and live tests** submit a clean on-topic post (expect `APPROVE`) and a toxic post (expect `REJECT`) through real validators. They then assert the stored verdict, category, reason, counts, reputation, and that the public feed shows the approval and hides the rejection. The integration suite also checks on-chain that a re-cased duplicate is refused. The live test prints every value and exits non-zero on any failed assertion.

## Notes

- The contract pins `py-genlayer:1jb45aa8…`, the runner Studionet accepted at build time. Direct tests resolve it from the GenVM `v0.2.16` release.
- `genlayer-js` is pinned to the stable `1.1.x` line. The `2.0` release candidate is deliberately not mixed in.
- On Studionet, `txExecutionResultName` is unset and contract errors appear only on the **leader** receipt. Validator receipts follow it in the same list, and an idle validator reports `ERROR`/`idle`. Veyr reads the leader receipt only.

Specs: [PRD(2).md](<PRD(2).md>) (behaviour) and [frontend.md](frontend.md) (UI).
