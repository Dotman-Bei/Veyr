// Veyr's board as one world (2000 px wide), drawn from the frame. Acts frame it with the anchor
// camera; LAYOUT gives them the world points to frame.
import React from 'react';
import { C } from '../brand/tokens';
import { Logo } from '../brand/Mark';
import { pressAt } from '../fx/Cursor';
import { arrive, clamp, E, fd, hitPulse, mix, prog, spr, SPR } from '../lib/anim';
import { mixColor } from '../lib/color';
import { delayTo } from '../lib/sync';
import { CUE, f60 } from '../timeline';
import { FEED, ME, POST, short, TOPIC, type Post } from './data';

const FEED_REJECTED = FEED.afterTrick.filter((p) => !p.approved).map((p) => p.index);
import { caretOn, connectedAt, draftAt, feedAt, lastKeyAt, phaseAt, rowIn, statsAt, statsChangeAt, verdictAt } from './state';
import { box, Button, CategoryBadge, PostRow, ROW_GAP, ROW_H, S, Spinner, StatTile } from './ui';

export const WORLD = { w: 2000, h: 2600 };
const PAD = 80;
const COMP = { x: PAD, y: 306, w: 780 };
const FEED_X = 900;
const FEED_W = 2000 - PAD - FEED_X;

/** World points the acts frame (centres unless noted). */
export const LAYOUT = {
  page: { x: 1000, y: 620 },
  navRight: { x: 1700, y: 56 },
  connectBtn: { x: 1790, y: 56 },
  composer: { x: COMP.x + COMP.w / 2, y: 640 },
  field: { x: COMP.x + 36, y: 572 }, // textarea top-left text origin
  fieldCentre: { x: COMP.x + COMP.w / 2, y: 666 },
  submitBtn: { x: COMP.x + 36 + 170, y: 877 },
  verdict: { x: COMP.x + COMP.w / 2, y: 1090 },
  feedTop: { x: FEED_X + FEED_W / 2, y: 520 },
  filterRejected: { x: FEED_X + FEED_W - 330, y: 336 },
  feedRow0: { x: FEED_X + FEED_W / 2, y: 412 + ROW_H / 2 },
  stats: { x: 1000, y: 210 },
};

const RULES = ['Not toxic', 'No sexual or graphic violence', 'On-topic for the board', 'Not spam or ads'];

const WalletIcon: React.FC<{ color: string; size?: number }> = ({ color, size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0 0 4h14a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3v3a1 1 0 0 1-1 1H5a2 2 0 0 1-2-2V5" />
  </svg>
);

const Navbar: React.FC<{ f: number }> = ({ f }) => {
  const c = connectedAt(f);
  const st = statsAt(f);
  const rep = st?.rep ?? 0;
  return (
    <div style={{ ...box(0, 0, WORLD.w, 112), borderBottom: `1.5px solid ${C.line}`, background: C.white }}>
      <div style={box(PAD, 36)}>
        <Logo height={40} />
      </div>
      <div style={{ ...box(640, 38), display: 'flex', gap: 56, ...S.text(26, 400) }}>
        {['Board', 'How it works', 'Features', 'FAQ'].map((l) => (
          <span key={l}>{l}</span>
        ))}
      </div>
      {c < 0.01 ? (
        <div style={box(1660, 26)}>
          <Button label={<><WalletIcon color={C.white} /> Connect wallet</>} h={60} press={pressAt(fd(f), CUE.connectClick)} />
        </div>
      ) : (
        <div
          style={{
            ...box(1560, 26),
            height: 60,
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            padding: '0 10px 0 22px',
            borderRadius: 999,
            border: `1.5px solid ${C.line}`,
            background: C.white,
            transformOrigin: 'right center',
            transform: `translate(1560px, 26px) scale(${mix(0.85, 1, c)})`,
            opacity: clamp(c * 2),
          }}
        >
          <span style={S.mono(22, 400, C.ink)}>{short(ME)}</span>
          <span style={S.mono(20, 600, rep > 0 ? C.approve : rep < 0 ? C.reject : C.mute)}>
            {rep > 0 ? '+' : ''}
            {rep} rep
          </span>
          <svg width={36} height={36} viewBox="0 0 24 24" fill="none" stroke={C.mute} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l5-5-5-5M15 12H4" transform="scale(0.8) translate(3 3)" />
          </svg>
        </div>
      )}
    </div>
  );
};

const Stats: React.FC<{ f: number }> = ({ f }) => {
  const st = statsAt(f);
  const bump = 1 + 0.06 * hitPulse(fd(f) - statsChangeAt(f), 2, 6);
  const v = (n: number | null | undefined) => (n === null || n === undefined ? '—' : String(n));
  const rep = st?.rep;
  const w = (2000 - 2 * PAD - 3 * 24) / 4;
  const tiles = [
    { label: 'Posts on-chain', value: v(st?.total), icon: 'stack' as const },
    { label: 'Approved', value: v(st?.approved), icon: 'check' as const, tone: C.approve },
    { label: 'Rejected', value: v(st?.rejected), icon: 'x' as const, tone: C.reject },
    { label: 'Your reputation', value: rep === null || rep === undefined ? '—' : `${rep > 0 ? '+' : ''}${rep}`, icon: 'user' as const },
  ];
  return (
    <div style={{ ...box(PAD, 150), display: 'flex', gap: 24 }}>
      {tiles.map((t) => (
        <div key={t.label} style={{ transform: `scale(${bump})`, transformOrigin: 'left center' }}>
          <StatTile {...t} w={w} />
        </div>
      ))}
    </div>
  );
};

const VerdictPanel: React.FC<{ post: Post; rep: number; p: number; landing: boolean }> = ({ post, rep, p, landing }) => {
  const tone = post.approved ? C.approve : C.reject;
  return (
    <div
      style={{
        width: COMP.w - 72,
        boxSizing: 'border-box',
        padding: '24px 26px',
        borderRadius: 14,
        border: `1.5px solid ${mixColor(tone, C.white, 0.6)}`,
        background: mixColor(tone, C.white, 0.95),
        opacity: clamp(p * 3),
        transform: landing ? `translateY(${mix(-36, 0, p)}px)` : `translateY(${mix(14, 0, arrive(clamp(p)))}px)`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <svg width={44} height={44} viewBox="0 0 24 24" fill="none" stroke={tone} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          {post.approved ? <path d="m7.5 12.3 3.1 3 6-6.5" /> : <path d="m9 9 6 6M15 9l-6 6" />}
        </svg>
        <div>
          <div style={{ ...S.text(38, 600, C.ink), lineHeight: 1.05 }}>{post.approved ? 'Approved' : 'Rejected'}</div>
          <div style={S.text(19, 400, C.mute)}>Consensus verdict for post #{post.index}, read from contract state</div>
        </div>
        <span style={{ marginLeft: 'auto' }}>
          <CategoryBadge post={post} />
        </span>
      </div>
      <div style={{ ...S.text(23, 400, C.ink), marginTop: 18 }}>
        <span style={{ fontWeight: 600 }}>Reason:</span> {post.reason}
      </div>
      <div style={{ ...S.text(21, 400, C.mute), marginTop: 10 }}>
        Reputation {post.approved ? '+1' : '−1'} · now {rep > 0 ? `+${rep}` : rep}
      </div>
    </div>
  );
};

const Composer: React.FC<{ f: number }> = ({ f }) => {
  const d = draftAt(f);
  const phase = phaseAt(f);
  const connected = connectedAt(f) > 0.5;
  const verdict = verdictAt(f);
  const caret = d.focus && !d.disabled && caretOn(f, lastKeyAt(f));
  const submitPress = pressAt(fd(f), fd(f) < CUE.pasteClick ? CUE.submitClick : CUE.trickSubmit);
  const fieldPress = 0;
  const F = fd(f);
  // hover: the hook's cursor rests on the post button; later it rests on Submit before the click
  const hover = (F >= CUE.hover && F < CUE.pullBack) || (F >= CUE.hoverSubmit && F < CUE.submitClick) ? 1 : 0;
  // the approval lands (contact on its cue, the film's first true landing); the rejection settles without overshoot
  const vp = verdict ? (verdict.post.approved ? spr(f, verdict.at - delayTo(SPR.land), SPR.land) : spr(f, verdict.at - 2, SPR.firm)) : 0;
  const label =
    !connected ? (
      <><WalletIcon color={C.white} /> Connect wallet to post</>
    ) : phase === 'signing' ? (
      <><Spinner frame={f} color={C.white} /> Confirm in wallet…</>
    ) : phase === 'pending' ? (
      <><Spinner frame={f} color={C.white} /> Moderating…</>
    ) : (
      <>Submit for moderation</>
    );
  return (
    <div
      style={{
        ...box(COMP.x, COMP.y, COMP.w),
        boxSizing: 'border-box',
        padding: 36,
        borderRadius: 18,
        border: `1.5px solid ${C.line}`,
        background: C.white,
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
        <span style={{ ...S.text(40, 600, C.ink), lineHeight: 1.1 }}>Write a post</span>
      </div>
      <div style={{ ...S.text(21, 400, C.mute), marginTop: 6 }}>
        Topic: <span style={{ fontWeight: 600, color: C.ink }}>{TOPIC}</span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 16 }}>
        {RULES.map((r) => (
          <span key={r} style={{ ...S.text(19, 400, C.mute), background: C.mist, borderRadius: 999, padding: '4px 14px' }}>
            {r}
          </span>
        ))}
      </div>
      <div
        style={{
          marginTop: 18,
          height: 220,
          boxSizing: 'border-box',
          padding: '14px 18px',
          borderRadius: 12,
          border: `1.5px solid ${d.focus ? C.brand : C.input}`,
          boxShadow: d.focus ? `0 0 0 3px ${mixColor(C.brand, C.white, 0.85)}` : 'none',
          background: C.white,
          opacity: d.disabled ? 0.6 : 1,
          transform: `scale(${1 - 0.01 * fieldPress})`,
        }}
      >
        {d.text.length === 0 ? (
          <span style={S.text(26, 400, C.mute)}>
            {caret && <span style={{ display: 'inline-block', width: 2.5, height: 30, background: C.ink, verticalAlign: 'text-bottom', marginRight: 2 }} />}
            Share something about technology, software, blockchain or GenLayer…
          </span>
        ) : (
          <span style={S.text(26, 400, C.ink)}>
            <span style={{ background: d.selected > 0 ? mixColor(C.white, C.brand, 0.2 * d.selected) : 'transparent' }}>{d.text}</span>
            {caret && <span style={{ display: 'inline-block', width: 2.5, height: 30, background: C.ink, verticalAlign: 'text-bottom', marginLeft: 1 }} />}
          </span>
        )}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, ...S.text(19, 400, C.mute) }}>
        <span>{connected ? <>Signing as <span style={S.mono(19, 400, C.ink)}>{short(ME)}</span></> : 'Posts are signed by your wallet'}</span>
        <span style={S.mono(19)}>{d.text.length}/2000</span>
      </div>
      <div style={{ marginTop: 22 }}>
        <Button label={label} h={62} press={connected ? submitPress : 0} hover={hover} dim={connected && phase === 'idle' && d.text.length === 0 ? 1 : 0} />
      </div>
      {phase === 'pending' && (F >= CUE.pendingShown || F >= CUE.trickConfirm) && (
        <div style={{ opacity: prog(f, F >= CUE.trickConfirm ? CUE.trickConfirm : CUE.pendingShown, (F >= CUE.trickConfirm ? CUE.trickConfirm : CUE.pendingShown) + f60(12), E.out), marginTop: 24, display: 'flex', alignItems: 'center', gap: 14, padding: '18px 22px', borderRadius: 14, border: `1.5px solid ${C.line}`, background: C.mist, ...S.text(23, 600, C.ink) }}>
          <Spinner frame={f} color={C.brand} size={26} /> Validators are reaching consensus
        </div>
      )}
      {verdict && (
        <div style={{ marginTop: 24 }}>
          <VerdictPanel post={verdict.post} rep={verdict.rep} p={vp} landing={verdict.post.approved} />
        </div>
      )}
    </div>
  );
};

/** Feed rows' heights and positions, with the insert FLIP and the filter folds. */
export const feedLayout = (f: number) => {
  const st = feedAt(f);
  const F = fd(f);
  const rows = st.posts.map((post, i) => {
    let keep = 1;
    if (st.filter === 'rejected' && post.approved) {
      // fold top to bottom, 6 f apart, over 28 f each, so survivors climb at <= ~14 px/f
      const order = st.posts.filter((p) => p.approved).indexOf(post);
      keep = 1 - prog(f, st.filterAt + 6 * order, st.filterAt + 6 * order + f60(28), E.ui);
    }
    return { post, i, keep };
  });
  let y = 412;
  const out = rows.map((r) => {
    const h = (ROW_H + ROW_GAP) * r.keep;
    const at = y;
    y += h;
    return { ...r, y: at };
  });
  // insert: everything below the new top row slides down from one pitch higher
  const insP = st.insertAt !== null ? prog(f, st.insertAt, st.insertAt + f60(24), E.ui) : 1;
  return out.map((r) => ({
    ...r,
    y: r.i === 0 || st.insertAt === null ? r.y : r.y - (ROW_H + ROW_GAP) * (1 - insP),
    newP: r.i === 0 && st.insertAt !== null ? prog(f, st.insertAt + 2, st.insertAt + f60(20), E.out) : 1,
    edge: r.i === 0 && st.insertAt !== null && F < st.insertAt + f60(140) ? 1 - prog(f, st.insertAt + f60(60), st.insertAt + f60(100), E.smooth) : 0,
  }));
};

/** The audit's reading beat: each rejected post's reason inks in as the camera reaches it. */
const READS = [CUE.read1, CUE.read2, CUE.read3, CUE.read4];
/** The board's reading beat: the push passes the newest posts and each one's reason inks in, then relaxes. */
const BOARD_READS: Record<number, number> = { 11: CUE.boardRead1, 10: CUE.boardRead2, 9: CUE.boardRead3 };
const readAt = (f: number, post: Post) => {
  const br = BOARD_READS[post.index];
  if (br !== undefined && fd(f) < CUE.toNavbar + f60(60)) return prog(f, br - 1, br + f60(14), E.out) * (1 - prog(f, br + f60(70), br + f60(100), E.smooth));
  const order = FEED_REJECTED.indexOf(post.index);
  if (order < 0 || fd(f) < CUE.read1 - 1) return 0;
  return prog(f, READS[order] - 1, READS[order] + f60(14), E.out) * (1 - prog(f, CUE.clear, CUE.clear + f60(20), E.smooth));
};

const Feed: React.FC<{ f: number }> = ({ f }) => {
  const st = feedAt(f);
  const fp = pressAt(fd(f), CUE.filterClick);
  return (
    <>
      <div style={{ ...box(FEED_X, 306, FEED_W), display: 'flex', alignItems: 'center', gap: 18 }}>
        <span style={{ ...S.text(40, 600, C.ink), marginRight: 'auto' }}>The feed</span>
        <div style={{ display: 'flex', gap: 4, padding: 5, borderRadius: 12, background: C.mist }}>
          {(['All', 'Approved', 'Rejected'] as const).map((l) => {
            const sel = (st.filter === 'all' && l === 'All') || (st.filter === 'rejected' && l === 'Rejected');
            return (
              <span
                key={l}
                style={{
                  ...S.text(21, sel ? 600 : 400, sel ? C.brand : C.mute),
                  padding: '6px 16px',
                  borderRadius: 8,
                  background: sel ? C.white : 'transparent',
                  boxShadow: sel ? `0 0 0 1.5px ${mixColor(C.brand, C.white, 0.7)}` : 'none',
                  transform: l === 'Rejected' ? `scale(${1 - 0.06 * fp})` : undefined,
                  display: 'inline-block',
                }}
              >
                {l}
              </span>
            );
          })}
        </div>
        <Button label="Refresh" variant="outline" h={52} size={21} />
      </div>
      {feedLayout(f).map((r) => {
        const cascade = rowIn(f, r.i);
        const o = Math.min(cascade, r.newP) * clamp(r.keep * 1.6 - 0.6);
        if (o <= 0.001) return null;
        return (
          <div
            key={r.post.index}
            style={{
              ...box(FEED_X, r.y + mix(10, 0, arrive(Math.min(cascade, r.newP))), FEED_W),
              height: ROW_H * r.keep,
              overflow: 'hidden',
              opacity: o,
            }}
          >
            <PostRow post={r.post} w={FEED_W} edge={r.edge} mine={r.post.author === ME} read={readAt(f, r.post)} />
          </div>
        );
      })}
    </>
  );
};

/** The whole board at absolute frame f, in world px. */
export const Board: React.FC<{ f: number }> = ({ f }) => (
  <div style={{ position: 'absolute', left: 0, top: 0, width: WORLD.w, height: WORLD.h, background: C.white }}>
    <Navbar f={f} />
    <Stats f={f} />
    <Composer f={f} />
    <Feed f={f} />
  </div>
);

export { POST };
