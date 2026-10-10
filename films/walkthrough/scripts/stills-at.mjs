// stills-at.mjs: bundle once, render the Film at many frames (faster than one `remotion still` each).
// Usage: node scripts/stills-at.mjs out/qa/stills 100 800 1500 ...   (frames are absolute)
import { bundle } from '@remotion/bundler';
import { renderStill, selectComposition } from '@remotion/renderer';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const [outDir, ...frames] = process.argv.slice(2);
if (!outDir || !frames.length) {
  console.error('usage: node scripts/stills-at.mjs <outDir> <frame>...');
  process.exit(1);
}
mkdirSync(outDir, { recursive: true });
const browserExecutable = process.env.REMOTION_BROWSER || '/root/.cache/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-linux64/chrome-headless-shell';
const serveUrl = await bundle({ entryPoint: resolve('src/index.ts'), onProgress: () => {} });
const composition = await selectComposition({ serveUrl, id: process.env.COMP || 'Film', browserExecutable, chromiumOptions: { gl: 'angle' } });
for (const fr of frames.map(Number)) {
  const output = `${outDir}/f${String(fr).padStart(5, '0')}.png`;
  await renderStill({ serveUrl, composition, frame: fr, output, browserExecutable, chromiumOptions: { gl: 'angle' }, scale: Number(process.env.SCALE || 0.5) });
  console.log(output);
}
