// srt.ts: captions.srt from the same COPY data the burned-in captions use, so timings match.
// npx tsx scripts/srt.ts [out/captions.srt]
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { COPY, FPS } from '../src/timeline';

const out = process.argv[2] ?? 'out/captions.srt';
const ts = (f: number) => {
  const ms = Math.round((f / FPS) * 1000);
  const p = (n: number, w = 2) => String(n).padStart(w, '0');
  return `${p(Math.floor(ms / 3600000))}:${p(Math.floor(ms / 60000) % 60)}:${p(Math.floor(ms / 1000) % 60)},${p(ms % 1000, 3)}`;
};
// Chapter captions only: the end card's URL is picture, not dialogue. Each cue spans the
// caption's visible life: first frame in, to its exit (the plate is gone ~26 f after `out`).
const caps = COPY.filter((c) => c.kind !== 'ui');
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, caps.map((c, i) => `${i + 1}\n${ts(c.in)} --> ${ts(c.out + 20)}\n${c.text}\n`).join('\n'));
console.log(`wrote ${out}: ${caps.length} captions`);
