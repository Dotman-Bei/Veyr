// The end card: the product clears the stage (le-stage-clears-to-brand). A feed row's edge lights
// in the accent, detaches, and morphs into the verdict block as it flies to centre; the V's arms
// converge and the block seats under them (the film's second true landing); "eyr" rises, then the URL.
import React from 'react';
import { AbsoluteFill } from 'remotion';
import { Logo, LOGOTYPE, MARK, BLOCK_CENTRE } from '../brand/Mark';
import { C, FONT, TYPE } from '../brand/tokens';
import { arrive, clamp, E, hitPulse, mix, prog, spr, SPR, squash, lmix } from '../lib/anim';
import { delayTo } from '../lib/sync';
import { toScreen } from '../lib/camera';
import { copy, CUE, f60, TOTAL } from '../timeline';
import { Paper, paperCam } from './Paper';

/** The logo's resting place: 200 px tall, centred a little above the frame's middle. */
export const LOGO_H = 200;
const K = LOGO_H / LOGOTYPE.height;
export const LOGO_POS = { x: 960 - (LOGOTYPE.width * K) / 2, y: 420 - LOGO_H / 2 };
/** The block's final screen rect. */
const BLOCK_END = {
  x: LOGO_POS.x + MARK.block.x * K,
  y: LOGO_POS.y + (MARK.block.y - LOGOTYPE.y) * K,
  w: MARK.block.width * K,
  h: MARK.block.height * K,
};
/** The world rect of the feed row edge that becomes the block: the fourth rejected post, where the reading dolly ends. */
const EDGE_WORLD = { x: 900, y: 1060, w: 8, h: 196 };
/** The seat spring starts early so its contact lands on CUE.seat. */
export const SEAT_START = CUE.seat - delayTo(SPR.land);

export const End: React.FC<{ f: number }> = ({ f }) => {
  // the board fades slowly enough that the edge lights while the row it belongs to is still visible
  const fade = prog(f, CUE.clear, CUE.edgeLit + f60(30), E.smooth);
  // the edge: lit while the board clears, then it flies and morphs into the block
  const cam = paperCam(Math.min(f, CUE.blockFly));
  const tl = toScreen(cam, { x: EDGE_WORLD.x, y: EDGE_WORLD.y });
  const start = { x: tl.x, y: tl.y, w: EDGE_WORLD.w * cam.k, h: EDGE_WORLD.h * cam.k };
  const lit = prog(f, CUE.edgeLit - 1, CUE.edgeLit + f60(12), E.out);
  const fly = prog(f, CUE.blockFly, SEAT_START + 2, E.glide);
  // the last stretch is the spring's: it lands with a small overshoot and a contact squash
  const s = spr(f, SEAT_START, SPR.land);
  const lift = 14; // px above the seat where the spring takes over (clear of the V, which arrives after)
  const flyEnd = { ...BLOCK_END, y: BLOCK_END.y - lift };
  const bx = mix(start.x, flyEnd.x, fly);
  const by = f < SEAT_START ? mix(start.y, flyEnd.y, fly) : flyEnd.y + lift * s;
  const bw = lmix(start.w, BLOCK_END.w, fly);
  const bh = lmix(start.h, BLOCK_END.h, fly);
  const sq = f >= CUE.seat ? squash(f - CUE.seat) : { along: 1, across: 1 };
  // the V converges, the lettering rises, the URL settles, then a slow creep
  const arms = prog(f, CUE.armsIn, CUE.armsIn + f60(48), E.out);
  const letters = prog(f, CUE.lettering, CUE.lettering + f60(30), E.out);
  const url = copy('url');
  const urlP = prog(f, url.in, url.resolved, E.out);
  // the hold runs past 1.3 s, so it keeps building: a 10% push to the end
  // the card keeps building to the last frame: a 20% push that gently accelerates (no dead tail)
  const creep = lmix(1, 1.2, Math.pow(prog(f, CUE.clear, TOTAL, E.linear), 1.5));
  // the block keeps time through the end card
  const pulse = 1 + 0.06 * Math.max(hitPulse(f - CUE.pulse1, 2, 6), hitPulse(f - CUE.pulse2, 2, 6));
  const seated = f >= CUE.seat;
  return (
    <AbsoluteFill style={{ background: C.paper, overflow: 'hidden' }}>
      {fade < 1 && <Paper f={f} captions={[]} boardStyle={{ opacity: 1 - fade }} />}
      <div style={{ position: 'absolute', inset: 0, transformOrigin: '960px 470px', transform: `scale(${creep})` }}>
        {/* the logo assembles around the block's seat */}
        <div style={{ position: 'absolute', left: 0, top: 0, transform: `translate(${LOGO_POS.x}px, ${LOGO_POS.y}px)` }}>
          <Logo
            height={LOGO_H}
            v={{ o: arms, sx: mix(1.35, 1, arms), y: mix(-6, 0, arms) }}
            block={{ o: seated && sq.along === 1 ? 1 : 0, s: pulse }}
            text={{ o: letters, y: mix(6, 0, arrive(letters)) }}
          />
        </div>
        {/* the travelling block, until it is the logo's own */}
        {!seated && fly > 0 && (
          <div style={{ position: 'absolute', left: 0, top: 0, width: bw, height: bh, borderRadius: mix(0, MARK.block.rx * K, fly), background: C.accent, transform: `translate(${bx + (BLOCK_END.w - bw) * 0}px, ${by}px)` }} />
        )}
        {seated && sq.along !== 1 && (
          <div style={{ position: 'absolute', left: 0, top: 0, width: BLOCK_END.w * sq.across, height: BLOCK_END.h * sq.along, borderRadius: MARK.block.rx * K, background: C.accent, transform: `translate(${BLOCK_END.x - (BLOCK_END.w * (sq.across - 1)) / 2}px, ${BLOCK_END.y + BLOCK_END.h * (1 - sq.along)}px)` }} />
        )}
        <div
          data-text="url"
          style={{ position: 'absolute', left: 0, top: 0, width: 1920, textAlign: 'center', fontFamily: FONT.mono, fontSize: TYPE.secondary.size * 0.9, fontWeight: 400, color: C.mute, opacity: urlP, transform: `translateY(${600 + mix(14, 0, arrive(urlP))}px)` }}
        >
          {url.text}
        </div>
      </div>
      {/* the lit edge on the clearing board */}
      {fly <= 0 && lit > 0 && <div style={{ position: 'absolute', left: 0, top: 0, width: start.w, height: start.h, background: C.accent, opacity: lit, transform: `translate(${start.x}px, ${start.y}px)` }} />}
    </AbsoluteFill>
  );
};

export const clampE = clamp;
export { BLOCK_CENTRE };
