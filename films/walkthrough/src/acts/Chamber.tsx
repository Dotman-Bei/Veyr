// Inside the contract: the ink chapter. The post arrives (still moving from the paper's cut), the
// status spine runs the real consensus statuses, the leader proposes, paths relay to four
// validators who each re-moderate in their own words, agreement cascades, and ACCEPTED lands in
// the accent: written on-chain.
import React from 'react';
import { AbsoluteFill } from 'remotion';
import { ME, POST, short, STATUSES, VOTES } from '../app/data';
import { Check, S, Spinner } from '../app/ui';
import { C } from '../brand/tokens';
import { typeFrames } from '../fx/TypeOn';
import { arrive, clamp, E, fd, mix, prog } from '../lib/anim';
import { mixColor } from '../lib/color';
import { b, CUE, f60 } from '../timeline';
import { Caption } from './kit';

// ---- layout (screen px)
export const POST_BOX = { x: 520, y: 96, w: 980, h: 150 };
const LEADER = { x: 790, y: 290, w: 440, h: 230 };
const VW = 326;
const VGAP = 24;
const VX0 = 444;
export const VAL = [0, 1, 2, 3].map((i) => ({ x: VX0 + i * (VW + VGAP), y: 620, w: VW, h: 250 }));
const SPINE = { x: 150, y0: 300, pitch: 125 };

// ---- timing
/** When each status step finishes (the spine's head leaves it on that frame). */
export const STEP_DONE = [CUE.pending, CUE.proposed, CUE.committed, CUE.revealed, CUE.accepted];
const LEADER_TYPE = { start: b(20, 1), cps: 32 };
export const LEADER_KEYS = typeFrames(VOTES[0].reason.length, LEADER_TYPE);
const VSTART = [CUE.v1, CUE.v2, CUE.v3, CUE.v4];
const vType = (i: number) => ({ start: VSTART[i] + f60(30), cps: 38 });
/** Each validator's reason keys (the sound reads the same schedule). */
export const V_KEYS = VSTART.map((_, i) => typeFrames(VOTES[i + 1].reason.length, vType(i)));
/** Frame each validator's decision chip pops: its reason finished typing. */
export const V_DECIDE = VSTART.map((_, i) => {
  const keys = typeFrames(VOTES[i + 1].reason.length, vType(i));
  return keys[keys.length - 1] + 6;
});
/** Two-beat confirm cascade: uneven, human gaps (label first, fill 12 f later). */
export const AGREE_AT = [0, 10, 31, 52].map((o) => CUE.agree + o);
/** Path relay: each path's run (60 f), staggered. */
export const RELAY = [0, 8, 16, 24].map((o) => ({ a: CUE.relay + o, b: CUE.relay + o + f60(60) }));

const typedText = (text: string, keys: number[], f: number) => text.slice(0, keys.filter((k) => k <= fd(f)).length);

const chip = (label: string, p: number, tone: string) => (
  <span style={{ ...S.mono(21, 600, C.white), background: tone, borderRadius: 8, padding: '4px 12px', display: 'inline-block', opacity: p, transform: `scale(${mix(0.85, 1, p)})` }}>{label}</span>
);

const Spine: React.FC<{ f: number }> = ({ f }) => {
  const F = fd(f);
  // the head waits at the first unfinished step, travelling between steps over 40 f on E.rest
  let headY = SPINE.y0;
  STEP_DONE.forEach((d, i) => {
    if (i < STEP_DONE.length - 1) headY += SPINE.pitch * prog(f, d, d + f60(36), E.rest);
  });
  const accepted = prog(f, CUE.accepted - 1, CUE.accepted + f60(12), E.out);
  return (
    <>
      <svg width={40} height={700} style={{ position: 'absolute', left: SPINE.x - 20, top: SPINE.y0 - 10 }}>
        <line x1={20} y1={10} x2={20} y2={10 + SPINE.pitch * 4} stroke={C.stageLine} strokeWidth={2} />
        <line x1={20} y1={10} x2={20} y2={headY - SPINE.y0 + 10} stroke={C.cream} strokeWidth={2.5} />
      </svg>
      <div style={{ position: 'absolute', left: 0, top: 0, width: 14, height: 14, borderRadius: 999, background: accepted > 0 ? mixColor(C.cream, C.accentBright, accepted) : C.cream, transform: `translate(${SPINE.x - 7}px, ${headY - 7}px)` }} />
      {STATUSES.map((status, i) => {
        const rowP = prog(f, b(19) + 4 * i, b(19) + 4 * i + f60(14), E.out);
        const started = i === 0 || F >= STEP_DONE[i - 1];
        const done = F >= STEP_DONE[i];
        const dp = prog(f, STEP_DONE[i] - 1, STEP_DONE[i] + f60(11), E.out);
        const isAcc = i === 4;
        const color = done ? (isAcc ? C.accentBright : C.cream) : started ? C.cream : C.stageMute;
        return (
          <div key={status} style={{ position: 'absolute', left: 0, top: 0, display: 'flex', alignItems: 'center', gap: 14, opacity: rowP, transform: `translate(${SPINE.x + 26}px, ${SPINE.y0 + i * SPINE.pitch - 16 + mix(10, 0, arrive(rowP))}px)` }}>
            <span style={{ width: 28, height: 28, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              {done ? <Check p={dp} size={26} color={isAcc ? C.accentBright : C.approve} /> : started ? <Spinner frame={f} size={24} color={C.stageMute} /> : null}
            </span>
            <span style={S.mono(24, done || started ? 600 : 400, color)}>{status}</span>
          </div>
        );
      })}
    </>
  );
};

const PostCard: React.FC<{ f: number }> = ({ f }) => {
  // enters still moving (from bottom left, the paper's exit direction) and brakes to rest
  const p = prog(f, b(19), b(19) + f60(90), E.out);
  const leave = prog(f, CUE.outOfChamber, b(30), E.exit);
  const acc = prog(f, CUE.accepted - 1, CUE.accepted + f60(14), E.out);
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: POST_BOX.w,
        height: POST_BOX.h,
        boxSizing: 'border-box',
        padding: '20px 26px',
        borderRadius: 18,
        background: C.stage2,
        border: `2px solid ${acc > 0 ? mixColor(C.stageLine, C.accentBright, acc) : C.stageLine}`,
        transform: `translate(${POST_BOX.x + mix(-300, 0, p)}px, ${POST_BOX.y + mix(520, 0, p) + leave * 720}px)`,
      }}
    >
      {acc > 0 && <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 8, borderRadius: '18px 0 0 18px', background: C.accentBright, opacity: acc }} />}
      <div style={{ ...S.mono(22, 400, C.stageMute), display: 'flex', justifyContent: 'space-between' }}>
        <span>
          {short(ME)} · post #{POST.index}
        </span>
        <span style={{ color: acc > 0.5 ? C.accentBright : C.stageMute }}>{acc > 0.5 ? 'written on-chain' : 'submit_post'}</span>
      </div>
      <div style={{ ...S.text(27, 400, C.cream), marginTop: 10 }}>{POST.text}</div>
    </div>
  );
};

const Leader: React.FC<{ f: number }> = ({ f }) => {
  const inP = prog(f, b(19, 3), b(19, 3) + f60(16), E.out);
  const F = fd(f);
  const reading = F >= CUE.leaderRead;
  const text = typedText(VOTES[0].reason, LEADER_KEYS, f);
  const decided = prog(f, CUE.leaderDecide - 1, CUE.leaderDecide + f60(10), E.out);
  const agreed = AGREE_AT.filter((a) => F >= a + 12).length;
  const quorum = prog(f, CUE.quorum - 1, CUE.quorum + f60(10), E.out);
  return (
    <div style={{ position: 'absolute', left: 0, top: 0, width: LEADER.w, height: LEADER.h, boxSizing: 'border-box', padding: 24, borderRadius: 18, border: `1.5px solid ${C.stageLine}`, background: C.stage2, opacity: inP, transform: `translate(${LEADER.x}px, ${LEADER.y + mix(14, 0, arrive(inP))}px)` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={S.text(24, 600, C.cream)}>Leader</span>
        {reading && decided < 0.5 && <Spinner frame={f} size={22} color={C.stageMute} />}
        <span style={{ marginLeft: 'auto' }}>{decided > 0 && chip(VOTES[0].decision, decided, C.approve)}</span>
      </div>
      <div style={{ ...S.text(24, 400, C.stageMute), marginTop: 14, height: 96 }}>{reading ? text || 'Moderating…' : ''}</div>
      {agreed > 0 && (
        <div style={{ position: 'absolute', left: 24, bottom: 18, display: 'flex', alignItems: 'center', gap: 10, ...S.text(22, 600, quorum > 0 ? C.cream : C.stageMute) }}>
          <span style={{ ...S.mono(22, 600, C.cream), background: quorum > 0 ? C.approve : C.stageLine, borderRadius: 8, padding: '2px 10px', transform: `scale(${1 + 0.08 * quorum * (1 - quorum)})` }}>
            {agreed} of 4
          </span>
          {quorum > 0 ? 'agree: quorum reached' : 'agree'}
        </div>
      )}
    </div>
  );
};

const Relay: React.FC<{ f: number }> = ({ f }) => {
  const from = { x: LEADER.x + LEADER.w / 2, y: LEADER.y + LEADER.h };
  return (
    <svg width={1920} height={1080} style={{ position: 'absolute', left: 0, top: 0 }}>
      {VAL.map((v, i) => {
        const to = { x: v.x + v.w / 2, y: v.y };
        const d = `M${from.x} ${from.y} C${from.x} ${from.y + 60}, ${to.x} ${to.y - 60}, ${to.x} ${to.y}`;
        const t = prog(f, RELAY[i].a, RELAY[i].b, E.linear);
        const agreed = prog(f, AGREE_AT[i] + 12, AGREE_AT[i] + 20, E.out);
        if (t <= 0) return null;
        return (
          <g key={i}>
            <path d={d} fill="none" stroke={C.stageLine} strokeWidth={2} pathLength={1} strokeDasharray="0.012 0.012" />
            <path d={d} fill="none" stroke={agreed > 0 ? mixColor(C.cream, C.approve, agreed) : C.cream} strokeWidth={2.5} pathLength={1} strokeDasharray="1" strokeDashoffset={1 - t} />
          </g>
        );
      })}
    </svg>
  );
};

const Validator: React.FC<{ f: number; i: number }> = ({ f, i }) => {
  const v = VAL[i];
  const vote = VOTES[i + 1];
  // the card waits as an outline once the proposal goes out, and solidifies when its path arrives
  const wait = prog(f, CUE.waiting + 5 * i, CUE.waiting + 5 * i + f60(14), E.out);
  const inP = prog(f, RELAY[i].b - 4, RELAY[i].b + f60(12), E.out);
  if (wait <= 0) return null;
  const F = fd(f);
  const working = F >= VSTART[i];
  const keys = typeFrames(vote.reason.length, vType(i));
  const text = typedText(vote.reason, keys, f);
  const decided = prog(f, V_DECIDE[i] - 1, V_DECIDE[i] + f60(10), E.out);
  // two-beat confirm: the label swaps first, the fill follows 12 f later
  const label = prog(f, AGREE_AT[i] - 1, AGREE_AT[i] + 6, E.out);
  const fill = prog(f, AGREE_AT[i] + 12, AGREE_AT[i] + 20, E.out);
  return (
    <div style={{ position: 'absolute', left: 0, top: 0, width: v.w, height: v.h, boxSizing: 'border-box', padding: 20, borderRadius: 16, border: `1.5px ${inP > 0.5 ? 'solid' : 'dashed'} ${fill > 0 ? mixColor(C.stageLine, C.approve, fill) : C.stageLine}`, background: fill > 0 ? mixColor(C.stage2, C.approve, 0.16 * fill) : inP > 0 ? mixColor(C.stage, C.stage2, inP) : C.stage, opacity: wait, transform: `translate(${v.x}px, ${v.y + mix(12, 0, arrive(wait))}px)` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={S.text(24, 600, C.cream)}>{vote.who}</span>
        {working && decided < 0.5 && <Spinner frame={f + i * 11} size={20} color={C.stageMute} />}
        <span style={{ marginLeft: 'auto' }}>{decided > 0 && chip(vote.decision, decided, C.approve)}</span>
      </div>
      <div style={{ ...S.text(23, 400, C.stageMute), marginTop: 12, height: 96 }}>{working ? text || 'Re-running the post…' : 'Waiting for the proposal'}</div>
      <div style={{ position: 'absolute', left: 20, bottom: 18, height: 30, overflow: 'hidden', ...S.text(22, 600, C.stageMute) }}>
        <div style={{ transform: `translateY(${-30 * label}px)` }}>
          <div style={{ height: 30, opacity: 1 - label }}>{decided > 0.5 ? 'Comparing with the leader' : ''}</div>
          <div style={{ height: 30, color: fill > 0.5 ? C.cream : C.stageMute, display: 'flex', alignItems: 'center', gap: 8 }}>
            Agrees with the leader
          </div>
        </div>
      </div>
    </div>
  );
};

/** The ink chapter at absolute frame f. */
export const Chamber: React.FC<{ f: number; captions: string[] }> = ({ f, captions }) => {
  const leave = prog(f, CUE.outOfChamber, CUE.outOfChamber + f60(16), E.smooth);
  // a slow push toward the post as the quorum closes (log-space, 6%), carried into the payoff
  const push = Math.exp(Math.log(1.06) * prog(f, CUE.pushIn, CUE.outOfChamber, E.dolly));
  // the stage is never locked off: a slow horizontal drift and a 3% breath across the chapter
  const sway = 60 * Math.sin((f / 960) * Math.PI * 2); // up to ~0.4 px/f, horizontal (sub-pixel)
  const breathK = Math.exp(Math.log(1.05) * prog(f, CUE.arrive, CUE.pushIn, E.linear));
  return (
    <AbsoluteFill style={{ background: C.stage, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, transformOrigin: '1010px 300px', transform: `translateX(${sway}px) scale(${push * breathK})` }}>
      <div style={{ position: 'absolute', inset: 0, opacity: 1 - leave }}>
        <Spine f={f} />
        <Relay f={f} />
        <Leader f={f} />
        {VAL.map((_, i) => (
          <Validator key={i} f={f} i={i} />
        ))}
      </div>
      <PostCard f={f} />
      </div>
      {captions.map((id) => (
        <Caption key={id} id={id} f={f} stage="ink" />
      ))}
    </AbsoluteFill>
  );
};

export const clampUnused = clamp;
