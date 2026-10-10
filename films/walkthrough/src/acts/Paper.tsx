// The product scene: Veyr's board under one anchor camera, with the cursor, the wallet sheet, the
// post lifting out as the device, the trick's split view and the captions. Every paper act renders
// this at its absolute frame, so chapter seams are invisible.
import React from 'react';
import { AbsoluteFill } from 'remotion';
import { Board, LAYOUT } from '../app/Board';
import { ME, POST, short, STATUSES, TRICK, TRICK_VOTES } from '../app/data';
import { draftAt } from '../app/state';
import { Check, S, Spinner } from '../app/ui';
import { WalletSheet, SHEET_PRIMARY } from '../app/Wallet';
import { C } from '../brand/tokens';
import { Cursor, pressAt } from '../fx/Cursor';
import { arrive, clamp, E, fd, mix, prog } from '../lib/anim';
import { camera, toScreen, type Shot } from '../lib/camera';
import { mixColor } from '../lib/color';
import { b, CUE, f60 } from '../timeline';
import { Caption, chain, drift, track, type Leg, type Move } from './kit';

const shot = (ax: number, ay: number, k: number, sx = 960, sy = 540): Shot => ({ ax, ay, k, sx, sy });

export const SHOTS = {
  macro0: shot(470, 666, 1.7, 960, 520),
  push1: shot(400, 610, 2.1, 960, 520),
  push2: shot(405, 596, 2.55, 960, 520),
  hookHold: shot(430, 700, 1.95, 960, 500), // the provocation sits there, about to be posted
  wide: shot(1000, 575, 0.94),
  board: shot(1180, 640, 1.12), // the slow push toward the feed while rows stream in
  nav: shot(1500, 260, 1.35, 760, 400),
  composer: shot(470, 680, 1.4, 760, 520),
  verdictIn: shot(470, 1150, 1.35, 760, 520),
  verdict: shot(470, 900, 1.35, 760, 520),
  mid: shot(1000, 690, 0.86), // stats, verdict and feed together, the verdict clear of the caption
  feed: shot(1410, 560, 1.35, 960, 500),
  trick: shot(470, 680, 1.3, 560, 520),
  feedHead: shot(1410, 520, 1.35, 960, 500),
  row: shot(1410, 510, 1.5, 960, 470), // the first rejected post, centred on the reading line
  read: shot(1410, 1158, 1.5, 960, 470), // ends on the fourth rejected post
};

/** The product camera at absolute frame f (a cut is a move with a === b). */
export const MOVES: Move[] = [
  { a: 24, b: 66, shot: SHOTS.push1, ease: E.cam },
  { a: 66, b: 110, shot: SHOTS.push2, ease: E.glide },
  { a: CUE.hookHold, b: b(4, 3), shot: SHOTS.hookHold, ease: E.dolly },
  { a: CUE.pullBack, b: b(6), shot: SHOTS.wide, ease: E.cam },
  { a: b(6, 2), b: b(8, 2), shot: SHOTS.board, ease: E.dolly },
  { a: CUE.toNavbar, b: b(9), shot: SHOTS.nav, ease: E.cam },
  { a: CUE.toComposer, b: b(13, 2), shot: SHOTS.composer, ease: E.cam },
  { a: b(30), b: b(30), shot: SHOTS.verdictIn }, // cut: the shot after the contract opens moving down
  { a: b(30), b: b(30) + f60(60), shot: SHOTS.verdict, ease: E.out },
  { a: b(30, 3), b: b(31, 1), shot: SHOTS.mid, ease: E.cam },
  { a: CUE.camFeed, b: CUE.feedRead, shot: SHOTS.feed, ease: E.cam },
  { a: b(33, 3), b: b(34, 2), shot: SHOTS.trick, ease: E.cam },
  { a: b(39, 1), b: b(40), shot: SHOTS.mid, ease: E.cam },
  { a: CUE.camFeed2, b: CUE.feedArrive2, shot: SHOTS.feed, ease: E.cam },
  { a: b(42), b: b(42, 2), shot: SHOTS.feedHead, ease: E.cam },
  { a: CUE.camRow, b: CUE.rowArrive, shot: SHOTS.row, ease: E.cam },
  { a: CUE.read, b: b(46, 2), shot: SHOTS.read, ease: E.dolly },
];

export const paperCam = (f: number): Shot => drift(chain(f, SHOTS.macro0, MOVES), f);

/** Screen point of a world point under the camera at frame f. */
const at = (p: { x: number; y: number }) => (f: number) => toScreen(paperCam(f), p);
const fixed = (p: { x: number; y: number }) => () => p;
const off = (p: { x: number; y: number }, dx: number, dy: number) => ({ x: p.x + dx, y: p.y + dy });

const PARK_HOOK = { x: 760, y: 790 };
const PARK_WRITE = { x: 780, y: 830 };

export const LEGS: Leg[] = [
  { a: 0, b: CUE.cursorIn, to: at(LAYOUT.fieldCentre), ease: E.glide },
  { a: b(1, 2), b: b(1, 3), to: at(PARK_HOOK) },
  { a: CUE.cursorDrift, b: CUE.hover, to: at(off(LAYOUT.submitBtn, 40, 6)), ease: E.glide }, // drifts to the post button and hovers
  // connect
  { a: b(9), b: CUE.connectClick, to: at(LAYOUT.connectBtn), ease: E.glide },
  { a: CUE.sheetIn + 10, b: CUE.approveConnect, to: fixed(SHEET_PRIMARY), ease: E.glide },
  { a: CUE.addNetwork + 4, b: CUE.addNetwork + 34, to: fixed(off(SHEET_PRIMARY, -70, -150)) },
  { a: CUE.addNetwork + 40, b: CUE.approveNetwork, to: fixed(SHEET_PRIMARY), ease: E.glide },
  { a: CUE.switchNetwork + 4, b: CUE.switchNetwork + 26, to: fixed(off(SHEET_PRIMARY, -40, -60)) },
  { a: CUE.switchNetwork + 26, b: CUE.approveSwitch, to: fixed(SHEET_PRIMARY), ease: E.glide },
  { a: CUE.sheetOut + 10, b: b(12, 2), to: fixed({ x: 980, y: 640 }) },
  // write
  { a: b(12, 3), b: CUE.fieldClick, to: at(LAYOUT.fieldCentre), ease: E.glide },
  { a: b(14), b: b(14, 1), to: at(PARK_WRITE) },
  // submit
  { a: CUE.toSubmit, b: CUE.hoverSubmit, to: at(LAYOUT.submitBtn), ease: E.glide },
  { a: CUE.confirmIn + 14, b: CUE.confirmClick, to: fixed(SHEET_PRIMARY), ease: E.glide },
  // trick
  { a: b(34), b: CUE.pasteClick, to: at(LAYOUT.fieldCentre), ease: E.glide },
  { a: CUE.paste + 4, b: CUE.trickSubmit, to: at(LAYOUT.submitBtn), ease: E.glide },
  { a: CUE.trickConfirmIn + 12, b: CUE.trickConfirm, to: fixed(SHEET_PRIMARY), ease: E.glide },
  // audit
  { a: b(42), b: CUE.filterClick, to: at(LAYOUT.filterRejected), ease: E.glide },
];

/** Cursor visible windows [in, out]: it leaves once the product acts on its own. */
const SHOW: [number, number][] = [
  [-20, CUE.pullBack + 20],
  [b(9) - 12, CUE.lift],
  [b(34) - 12, CUE.split],
  [b(42) - 12, b(43, 1)],
];
export const CLICKS = [CUE.cursorIn, CUE.connectClick, CUE.approveConnect, CUE.approveNetwork, CUE.approveSwitch, CUE.fieldClick, CUE.submitClick, CUE.confirmClick, CUE.pasteClick, CUE.trickSubmit, CUE.trickConfirm, CUE.filterClick];

const cursorOpacity = (f: number) => {
  for (const [a, z] of SHOW) {
    if (f >= a && f <= z + 14) return prog(f, a, a + 12, E.smooth) * (1 - prog(f, z, z + 14, E.smooth));
  }
  return 0;
};

/** The post lifting out of the composer: the device leaving for the contract. */
const LiftCard: React.FC<{ f: number }> = ({ f }) => {
  if (f < CUE.lift - 1 || f >= b(19)) return null;
  const cam = paperCam(f);
  const tl = toScreen(cam, { x: LAYOUT.field.x, y: LAYOUT.field.y - 16 });
  const lift = prog(f, CUE.lift, CUE.lift + f60(18), E.outSoft);
  const go = prog(f, CUE.leave, b(19), E.exit);
  const w = 708 * cam.k;
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: w,
        boxSizing: 'border-box',
        padding: `${18 * cam.k}px ${22 * cam.k}px`,
        borderRadius: 14 * cam.k,
        background: C.white,
        border: `${1.5 * cam.k}px solid ${C.line}`,
        boxShadow: `0 ${mix(4, 30, lift)}px ${mix(10, 90, lift)}px rgba(0,0,0,${mix(0.06, 0.2, lift)})`,
        transformOrigin: '50% 50%',
        transform: `translate(${tl.x + go * 320}px, ${tl.y - lift * 26 - go * 760}px) scale(${mix(1, 1.03, lift)})`,
        opacity: clamp(lift * 4),
      }}
    >
      <div style={{ ...S.mono(19 * cam.k), marginBottom: 8 * cam.k }}>
        {short(ME)} · post #{POST.index}
      </div>
      <div style={S.text(26 * cam.k, 400, C.ink)}>{POST.text}</div>
    </div>
  );
};

/** Trick: the quorum on the ink stage beside the composer (live cause-and-effect split). */
const REJECT_AT = [0, 14, 31, 40, 58].map((o) => CUE.rejects + o);
export { REJECT_AT };
const SplitQuorum: React.FC<{ f: number }> = ({ f }) => {
  if (f < CUE.split - 1 || f > b(39) + f60(36)) return null;
  const pin = prog(f, CUE.split - 1, CUE.split + f60(30), E.out);
  const pout = prog(f, b(39), b(39) + f60(36), E.exit); // <= ~36 px/f at its fastest (blur ceiling 80)
  // opacity on its own smooth curves: an ease-out fade-in or accelerating fade-out pops
  const o = prog(f, CUE.split - 1, CUE.split + f60(14), E.smooth) * (1 - prog(f, b(39) + f60(8), b(39) + f60(32), E.smooth));
  const F = fd(f);
  const status = F >= CUE.trickAccepted ? 4 : F >= CUE.trickRevealing ? 3 : F >= REJECT_AT[0] ? 2 : 1;
  const acc = prog(f, CUE.trickAccepted - 1, CUE.trickAccepted + 12, E.out);
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: 760,
        boxSizing: 'border-box',
        padding: 40,
        borderRadius: 28,
        background: C.stage,
        boxShadow: '0 30px 100px rgba(0,0,0,0.22)',
        transform: `translate(${1080 + mix(220, 0, pin) + mix(0, 520, pout)}px, 90px)`,
        opacity: o,
      }}
    >
      <div style={{ padding: '18px 22px', borderRadius: 16, border: `1.5px solid ${acc > 0 ? mixColor(C.stageLine, C.accentBright, acc) : C.stageLine}`, background: C.stage2 }}>
        <div style={S.mono(21, 400, C.stageMute)}>
          {short(ME)} · post #{TRICK.index}
        </div>
        <div style={{ ...S.text(26, 400, C.cream), marginTop: 6 }}>{TRICK.text}</div>
      </div>
      <div style={{ marginTop: 26, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {TRICK_VOTES.map((v, i) => {
          const done = F >= REJECT_AT[i];
          const chip = prog(f, REJECT_AT[i] - 1, REJECT_AT[i] + 10, E.out);
          return (
            <div key={v.who} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 18px', borderRadius: 14, border: `1.5px solid ${C.stageLine}` }}>
              <span style={{ ...S.text(23, 600, C.cream), width: 140 }}>{v.who}</span>
              {done ? (
                <span style={{ ...S.mono(20, 600, C.white), background: C.reject, borderRadius: 8, padding: '3px 10px', transform: `scale(${mix(0.85, 1, chip)})`, opacity: chip }}>{v.decision}</span>
              ) : (
                <Spinner frame={f + i * 9} color={C.stageMute} />
              )}
              <span style={{ ...S.text(22, 400, C.stageMute), opacity: done ? chip : 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.reason}</span>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 26, display: 'flex', alignItems: 'center', gap: 14, ...S.mono(22, 600, status === 4 ? C.accentBright : C.stageMute) }}>
        {status === 4 ? <Check p={acc} color={C.accentBright} size={26} /> : <Spinner frame={f} color={C.stageMute} size={26} />}
        Transaction status: {STATUSES[status]}
      </div>
    </div>
  );
};

/** The paper scene at absolute frame f. */
export const Paper: React.FC<{ f: number; captions: string[]; children?: React.ReactNode; boardStyle?: React.CSSProperties }> = ({ f, captions, children, boardStyle }) => {
  const cam = paperCam(f);
  const cur = track(f, { x: 1560, y: 980 }, LEGS);
  const press = CLICKS.reduce((m, c) => Math.max(m, pressAt(fd(f), c)), 0);
  const co = cursorOpacity(f);
  void draftAt;
  return (
    <AbsoluteFill style={{ background: C.paper, overflow: 'hidden' }}>
      <div style={{ ...camera(cam), ...boardStyle }}>
        <Board f={f} />
      </div>
      <LiftCard f={f} />
      <SplitQuorum f={f} />
      <WalletSheet f={f} />
      {children}
      {co > 0.001 && <Cursor x={cur.x} y={cur.y} scale={1.25} press={press} opacity={co} />}
      {captions.map((id) => (
        <Caption key={id} id={id} f={f} />
      ))}
    </AbsoluteFill>
  );
};

export { arrive };
