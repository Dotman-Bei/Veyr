// Veyr's product UI, rebuilt for the film from the live app (src/components in the repo):
// the same labels, tokens and structure, sized for a 2000 px world so a push-in keeps it readable.
// Every component is a pure function of its props; acts derive the props from the frame.
import React from 'react';
import { C, FONT } from '../brand/tokens';
import { clamp, E, mix } from '../lib/anim';
import { mixColor } from '../lib/color';
import { categoryLabel, short, type Post } from './data';

export const S = {
  text: (size: number, weight = 400, color: string = C.ink): React.CSSProperties => ({
    fontFamily: FONT.text,
    fontSize: size,
    fontWeight: weight,
    color,
    lineHeight: 1.35,
    fontVariantNumeric: 'tabular-nums',
  }),
  mono: (size: number, weight = 400, color: string = C.mute): React.CSSProperties => ({
    fontFamily: FONT.mono,
    fontSize: size,
    fontWeight: weight,
    color,
    lineHeight: 1.35,
    fontVariantNumeric: 'tabular-nums',
  }),
};

export const box = (x: number, y: number, w?: number, h?: number): React.CSSProperties => ({
  position: 'absolute',
  left: 0,
  top: 0,
  width: w,
  height: h,
  transform: `translate(${x}px, ${y}px)`,
});

/** Approved / Rejected badge, the app's VerdictBadge. */
export const VerdictBadge: React.FC<{ approved: boolean; size?: number }> = ({ approved, size = 20 }) => {
  const c = approved ? C.approve : C.reject;
  return (
    <span
      style={{
        ...S.text(size, 600, c),
        display: 'inline-flex',
        alignItems: 'center',
        gap: size * 0.35,
        padding: `${size * 0.15}px ${size * 0.6}px`,
        borderRadius: 999,
        border: `1.5px solid ${mixColor(c, C.white, 0.7)}`,
        background: mixColor(c, C.white, 0.92),
        whiteSpace: 'nowrap',
      }}
    >
      <svg width={size * 0.85} height={size * 0.85} viewBox="0 0 20 20">
        <circle cx="10" cy="10" r="8" fill="none" stroke={c} strokeWidth="2" />
        {approved ? (
          <path d="M6 10.3 8.8 13 14 7.5" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        ) : (
          <path d="M7 7l6 6M13 7l-6 6" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" />
        )}
      </svg>
      {approved ? 'Approved' : 'Rejected'}
    </span>
  );
};

export const CategoryBadge: React.FC<{ post: Post; size?: number }> = ({ post, size = 20 }) =>
  post.approved ? null : (
    <span style={{ ...S.text(size, 600, C.mute), padding: `${size * 0.15}px ${size * 0.6}px`, borderRadius: 999, background: C.mist }}>
      {categoryLabel(post.category)}
    </span>
  );

/** A button. `press` 0..1 is the click envelope; `variant` matches the app's. */
export const Button: React.FC<{
  label: React.ReactNode;
  variant?: 'default' | 'outline' | 'stage';
  w?: number;
  h?: number;
  size?: number;
  press?: number;
  dim?: number;
  hover?: number;
}> = ({ label, variant = 'default', w, h = 60, size = 24, press = 0, dim = 0, hover = 0 }) => {
  const base = variant === 'default' ? C.brand : variant === 'stage' ? C.cream : C.white;
  const bg = hover > 0 ? mixColor(base, variant === 'default' ? C.white : C.mist, 0.14 * hover) : base;
  const fg = variant === 'default' ? C.white : variant === 'stage' ? C.stage : C.ink;
  return (
    <div
      style={{
        width: w,
        height: h,
        padding: w ? 0 : `0 ${size * 1.2}px`,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: size * 0.45,
        borderRadius: 10,
        background: bg,
        border: variant === 'outline' ? `1.5px solid ${C.input}` : 'none',
        boxShadow: variant === 'default' ? '0 2px 6px rgba(0,0,0,0.18)' : 'none',
        transform: `scale(${1 - 0.04 * press})`,
        opacity: 1 - 0.45 * dim,
        ...S.text(size, 600, fg),
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </div>
  );
};

/** Dashed working ring: one turn per 48 f. */
export const Spinner: React.FC<{ frame: number; size?: number; color?: string }> = ({ frame, size = 22, color = C.mute }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={{ transform: `rotate(${frame * 7.5}deg)` }}>
    <circle cx="12" cy="12" r="10" fill="none" stroke={color} strokeWidth="2.5" strokeDasharray="4 4" />
  </svg>
);

/** A check that draws: ring then tick, p 0..1 over its 11 frames. */
export const Check: React.FC<{ p: number; size?: number; color?: string }> = ({ p, size = 22, color = C.approve }) => {
  const ring = clamp(p / 0.7);
  const tick = clamp((p - 0.27) / 0.73);
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ transform: `scale(${mix(0.6, 1, E.out(ring))})` }}>
      <circle cx="12" cy="12" r="10" fill={mixColor(C.white, color, 0.12 * ring)} stroke={color} strokeWidth="2.5" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - ring} />
      <path d="M7.5 12.3 10.6 15.3 16.6 8.8" fill="none" stroke={color} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - tick} />
    </svg>
  );
};

export const ROW_H = 196;
export const ROW_GAP = 20;

/** One feed row: the app's PostCard. `edge` 0..1 is the accent edge of a just-written post. */
export const PostRow: React.FC<{ post: Post; w: number; edge?: number; mine?: boolean; read?: number }> = ({ post, w, edge = 0, mine = false, read = 0 }) => (
  <div
    style={{
      position: 'relative',
      width: w,
      height: ROW_H,
      boxSizing: 'border-box',
      padding: '22px 28px',
      borderRadius: 16,
      background: C.white,
      border: `1.5px solid ${edge > 0.01 ? mixColor(C.line, C.accent, edge) : C.line}`,
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      overflow: 'hidden',
    }}
  >
    {edge > 0.01 && <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 8, background: C.accent, opacity: edge }} />}
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <VerdictBadge approved={post.approved} />
      <CategoryBadge post={post} />
      <span style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center', ...S.mono(19) }}>
        {short(post.author)}
        {mine && <span style={{ ...S.text(15, 600, C.mute), background: C.mist, borderRadius: 6, padding: '1px 8px' }}>YOU</span>}
        <span>· #{post.index}</span>
      </span>
    </div>
    <div
      style={{
        ...S.text(24, 400, post.approved ? C.ink : C.mute),
        marginTop: 12,
        height: 64,
        overflow: 'hidden',
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
      }}
    >
      {post.text}
    </div>
    <div style={{ ...S.text(19, 400, read > 0 ? mixColor(C.mute, C.ink, read) : C.mute), marginTop: 10, paddingTop: 10, borderTop: `1px solid ${read > 0 ? mixColor(C.line, C.input, read) : C.line}`, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
      <span style={{ fontWeight: 600, color: C.ink }}>Validators:</span> {post.reason}
    </div>
  </div>
);

/** A stats tile: the app's StatsRow. */
export const StatTile: React.FC<{ label: string; value: string; tone?: string; w: number; icon: 'stack' | 'check' | 'x' | 'user' }> = ({ label, value, tone = C.mute, w, icon }) => (
  <div style={{ width: w, height: 112, boxSizing: 'border-box', padding: '0 26px', display: 'flex', alignItems: 'center', gap: 18, borderRadius: 16, border: `1.5px solid ${C.line}`, background: C.white }}>
    <div style={{ width: 56, height: 56, borderRadius: 999, background: C.mist, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke={tone} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        {icon === 'stack' && <path d="M12 3 3 8l9 5 9-5-9-5ZM3 13l9 5 9-5M3 17.5l9 5 9-5" />}
        {icon === 'check' && (
          <>
            <circle cx="12" cy="12" r="9" />
            <path d="m8 12.3 2.8 2.7L16 9.5" />
          </>
        )}
        {icon === 'x' && (
          <>
            <circle cx="12" cy="12" r="9" />
            <path d="m9 9 6 6M15 9l-6 6" />
          </>
        )}
        {icon === 'user' && (
          <>
            <circle cx="12" cy="8" r="4" />
            <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
          </>
        )}
      </svg>
    </div>
    <div>
      <div style={{ ...S.text(40, 600, C.ink), lineHeight: 1 }}>{value}</div>
      <div style={{ ...S.text(20, 400, C.mute), marginTop: 6 }}>{label}</div>
    </div>
  </div>
);
