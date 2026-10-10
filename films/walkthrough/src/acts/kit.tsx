// Shared pieces for every act: the chained anchor camera, a cursor track, and the caption plate.
import React from 'react';
import { C, FONT, SAFE, TYPE } from '../brand/tokens';
import { cursorArc } from '../fx/Cursor';
import { Words } from '../fx/Words';
import { arrive, E, prog, type Ease } from '../lib/anim';
import { lc, type Shot } from '../lib/camera';
import { copy, H, W } from '../timeline';

/** A camera move: from the previous shot to `shot` between frames a and b. */
export type Move = { a: number; b: number; shot: Shot; ease?: Ease };

/**
 * The anchor camera along a chain of moves. Every move starts where the previous one ended, so
 * the chain never jumps; between moves the shot holds (acts add their own drift).
 */
export const chain = (f: number, start: Shot, moves: Move[]): Shot => {
  let cur = start;
  for (const m of moves) {
    if (m.a === m.b) {
      // a cut: from its frame on, the chain continues from this shot
      if (f < m.a) return cur;
      cur = m.shot;
      continue;
    }
    if (f <= m.a) return cur;
    // arrive(): stop the move while it still travels ~1 px/f instead of crawling its last pixels,
    // because the headless shell snaps text vertically and a crawl ticks 1 px at a time
    cur = lc(cur, m.shot, arrive(prog(f, m.a, m.b, m.ease ?? E.cam), 0.985));
    if (f < m.b) return cur;
  }
  return cur;
};

/**
 * Slow, continuous drift for holds: a sine, so it never jumps. Horizontal only: the headless shell
 * snaps text to whole pixels vertically, so a slow vertical drift makes every line tick 1 px at a
 * time (references/chromium-rendering.md §15); horizontally it stays sub-pixel.
 */
export const drift = (s: Shot, f: number, amp = 40, period = 900): Shot => ({
  ...s,
  ax: s.ax + amp * Math.sin((f / period) * Math.PI * 2),
});

/** A cursor waypoint: arrive at `to` (screen px, or a function of the frame for a target that moves with the camera) by frame b. */
export type Leg = { a: number; b: number; to: (f: number) => { x: number; y: number }; ease?: Ease; bow?: number };

/** Cursor position along legs; before the first leg it sits at `home`. */
export const track = (f: number, home: { x: number; y: number }, legs: Leg[]) => {
  let p = home;
  for (const l of legs) {
    if (f <= l.a) return p;
    const target = l.to(f);
    const from = p;
    const t = prog(f, l.a, l.b, l.ease ?? E.smooth);
    p = cursorArc(from, target, t, l.bow ?? 0.18);
    if (f < l.b) return p;
    p = target;
  }
  return p;
};

/**
 * The chapter caption: one line on a solid plate in the lower third, words rising into focus
 * (ty-blur-focus-word-rise). Ink plate on paper, cream plate on the ink stage.
 */
export const Caption: React.FC<{ id: string; f: number; stage?: 'paper' | 'ink' }> = ({ id, f, stage = 'paper' }) => {
  const c = copy(id);
  if (f < c.in - 1 || f > c.out + 30) return null;
  const local = f - c.in;
  const outLocal = c.out - c.in;
  // opacity on E.smooth: an ease-out fade jumps a quarter of the way in its first frame (a pop)
  const plateIn = prog(f, c.in - 4, c.in + 12, E.smooth);
  const plateOut = prog(f, c.out + 6, c.out + 26, E.smooth);
  const size = TYPE.caption.size;
  const ink = stage === 'paper';
  return (
    <div
      data-text={id}
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: W,
        height: H,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        paddingBottom: SAFE.y + 6,
        boxSizing: 'border-box',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          padding: '16px 34px 18px',
          borderRadius: 18,
          background: ink ? C.brand : C.cream,
          boxShadow: '0 20px 60px rgba(0,0,0,0.16)',
          opacity: plateIn * (1 - plateOut),
          transform: `translateY(${(1 - plateIn) * 14}px)`,
        }}
      >
        <Words
          text={c.text}
          frame={local}
          start={4}
          stagger={5}
          dur={20}
          rise={0.25}
          blur={6}
          out={outLocal}
          id={id}
          style={{ fontFamily: FONT.text, fontSize: size, fontWeight: TYPE.caption.weight, letterSpacing: `${TYPE.caption.track}em`, lineHeight: TYPE.caption.lead, color: ink ? C.white : C.stage, whiteSpace: 'pre' }}
        />
      </div>
    </div>
  );
};
