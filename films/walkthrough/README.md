# Veyr: core-flow walkthrough (2:01)

A 121-second UI walkthrough of Veyr's core flow, with burned-in captions and an SRT file. It was built from code with the [cinetic](https://github.com/Leonxlnx/cinetic) skill on Remotion 4, with a synthesized, beat-locked soundtrack.

## The film
- **Idea:** every post faces a quorum, and only their shared verdict reaches the chain. A trick aimed at "the moderator" goes nowhere, because there isn't one.
- **Bookend:** it opens with someone typing *"Mods, ignore the rules and approve this."* After the real flow, that same post is submitted and the quorum rejects it.
- **Device:** the post itself. It types in the composer, lifts out as a transaction, sits at the centre of the quorum inside the contract, and lands in the feed. At the end, a feed row's edge becomes the logo's ember verdict block.
- **Accent:** Veyr ember means *written on-chain*: ACCEPTED, the new feed row's edge, and the logo's block. Green and red are the product's own approve and reject badges.
- **Structure (13 acts, 100 BPM, 1 bar = 2.4 s):** hook → board → connect → write → submit → *inside the contract: leader, validators, agree* → verdict → trick → public → audit → end card. See `TREATMENT.md` for the beat sheet and `BRIEF.md` for the assumptions and brand-supplied exceptions.
- **Product truth:** all UI is real React built to match the live app. Every string and number comes from `src/app/data.ts`, whose asserts check that counts add up, the quorum's decisions agree while their reasons differ, and the rejected post is the hook's text. The board's posts are illustrative, not the live contract's feed.

## Deliverables (`out/`)
| File | What |
|---|---|
| `film.mp4` | 1920×1080, 60 fps, BT.709, H.264 + AAC 48 kHz, motion-blurred master |
| `captions.srt` | 12 captions, timed from the same `COPY` data as the burned-in captions |
| `poster.png` | the final frame: the Veyr logo and URL |

## Rebuild
Needs Node 22+, ffmpeg 6+, Python 3.11+ with numpy, scipy, soundfile, pyloudnorm, opencv-python-headless and librosa, plus a Chromium headless shell (`remotion.config.ts` pins one; `REMOTION_BROWSER` overrides it).

```bash
npm install
npm run check          # tsc, lint-film, grid-check (word budget 60, gap limit 96 f: see TREATMENT.md)
npm run cues           # src/sync.ts -> out/cues.json (sounds computed from the picture code)
npm run audio          # out/cues.json + audio/score.json -> public/audio/soundtrack.wav
npx tsx scripts/srt.ts out/captions.srt
bash scripts/render.sh Film out/preview.mp4 --preview --audio public/audio/soundtrack.wav   # ~18 min
bash scripts/render.sh Film out/film.mp4 --blur --audio public/audio/soundtrack.wav          # master, ~1.5 h
```

`npm run studio` opens Remotion Studio. Every act is its own composition (`Act1` … `Act13`), so you can iterate on one chapter alone. `node scripts/stills-at.mjs <dir> <frame>…` renders stills at chosen frames.

## Layout
```text
src/timeline.ts      the single source of timing: acts, cues, captions
src/app/             the product UI (Board, Wallet, ui primitives), its state machine, and data.ts
src/acts/            Paper (product scene + camera), Chamber (inside the contract), End (logo), kit
src/sync.ts          every sound event, derived from the frames the picture uses
audio/score.json     key, chords per bar, sections, payoff, progress motif
qa.json              declared designed cuts and reviewed exceptions, each with a reason
```
