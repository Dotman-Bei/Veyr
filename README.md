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

| | |
|---|---|
| Network | GenLayer **Studionet** (`https://studio.genlayer.com/api`, chain id `61999`) |
| Contract | [`0xC1C38084e9bf9f0A3a7016fA0470b5E4c436bEE3`](https://explorer-studio.genlayer.com/address/0xC1C38084e9bf9f0A3a7016fA0470b5E4c436bEE3) |
| Deployment tx | [`0xf174c2e2…f63c61ad`](https://explorer-studio.genlayer.com/tx/0xf174c2e254ad587360c86d3147a693d7abd65eff24f869fdb6d21052f63c61ad) |
| Topic | `GenLayer and blockchain development` |

The machine-readable record is in [deployments/studionet.json](deployments/studionet.json).

## How moderation works

`submit_post(text)` in [contract/veyr.py](contract/veyr.py):

1. Trims the text and rejects empty posts or posts over 2,000 characters.
2. Builds a moderation prompt from the on-chain topic and the board policy. The post sits inside `<post>…</post>` delimiters, is declared untrusted data, and any delimiter tags inside it are escaped.
3. Runs `gl.vm.run_nondet_unsafe(leader, validator)`:
   - **Leader**: `gl.nondet.exec_prompt(..., response_format="json")`, normalized to `{decision, category, reason}`.
   - **Validator**: rejects a leader error or malformed proposal, runs its **own** independent moderation, and agrees only if its `APPROVE`/`REJECT` matches. The category and reason wording may differ.
4. After consensus accepts, it stores the post (approved **or** rejected), applies reputation `+1`/`−1`, and increments `approved_count` only on approval.

Malformed model output (non-JSON, unknown decision, non-object) raises an error. It never defaults to approval. A disagreement or `UNDETERMINED` outcome writes nothing.

**Policy.** A post is approved only if it is not toxic, contains no sexual or graphically violent content, is on-topic (technology, software, blockchain or GenLayer), and is not spam or advertising.

**Public interface.** `get_topic`, `get_post_count`, `get_approved_count`, `get_reputation(author)`, `get_post(index)`, `get_posts()` (newest first), `submit_post(text)`.

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
npm run live-test          # smoke test against the deployed contract
```

- **Direct tests** cover initialization, validation, persistence, newest-first ordering, counts and reputation. They also cover output normalization (fences, prose, casing, unknown categories, bounded reasons), malformed output never mutating state, the agreement rule via `run_validator()` (agree, disagree, leader error, malformed proposal), and prompt-injection framing including delimiter-escape attempts.
- **Integration and live tests** submit a clean on-topic post (expect `APPROVE`) and a toxic post (expect `REJECT`) through real validators. They then assert the stored verdict, category, reason, counts and reputation. The live test prints every value and exits non-zero on any failed assertion.

## Notes

- The contract pins `py-genlayer:1jb45aa8…`, the runner Studionet accepted at build time. Direct tests resolve it from the GenVM `v0.2.16` release.
- `genlayer-js` is pinned to the stable `1.1.x` line. The `2.0` release candidate is deliberately not mixed in.
- On Studionet, `txExecutionResultName` is unset and contract errors appear only on the **leader** receipt. Validator receipts follow it in the same list, and an idle validator reports `ERROR`/`idle`. Veyr reads the leader receipt only.

Specs: [PRD(2).md](<PRD(2).md>) (behaviour) and [frontend.md](frontend.md) (UI).
