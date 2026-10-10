// The browser wallet's sheet, in screen space. A generic wallet (no real wallet's branding),
// showing the real requests Veyr makes: connect, add Studionet, switch, confirm the transaction.
import React from 'react';
import { C } from '../brand/tokens';
import { pressAt } from '../fx/Cursor';
import { arrive, clamp, E, fd, mix, prog } from '../lib/anim';
import { CUE, f60 } from '../timeline';
import { ME, NETWORK, short, SITE } from './data';
import { Button, Check, S } from './ui';

export const SHEET = { x: 1290, y: 120, w: 520, h: 640 };
/** Screen centre of the sheet's primary button (bottom right). */
export const SHEET_PRIMARY = { x: SHEET.x + SHEET.w - 36 - 105, y: SHEET.y + SHEET.h - 36 - 31 };

type Step = { from: number; to: number; title: string; rows: [string, string][]; note?: string; primary: string; secondary: string; press: number };

/** The sheet's steps: shown from `from` to `to`, primary pressed on `press`. */
export const STEPS: Step[] = [
  { from: CUE.sheetIn, to: CUE.addNetwork, title: 'Connect to this site?', rows: [['Account 1', short(ME)]], note: `${SITE} will see your address.`, primary: 'Connect', secondary: 'Cancel', press: CUE.approveConnect },
  {
    from: CUE.addNetwork,
    to: CUE.switchNetwork,
    title: 'Add a network?',
    rows: [
      ['Network', NETWORK.name],
      ['RPC URL', NETWORK.rpc.replace('https://', '')],
      ['Chain ID', String(NETWORK.chainId)],
      ['Currency', NETWORK.currency],
    ],
    primary: 'Approve',
    secondary: 'Cancel',
    press: CUE.approveNetwork,
  },
  { from: CUE.switchNetwork, to: CUE.sheetOut, title: 'Switch network?', rows: [['Switch to', NETWORK.name]], note: 'Veyr runs on GenLayer Studionet.', primary: 'Switch', secondary: 'Cancel', press: CUE.approveSwitch },
  {
    from: CUE.confirmIn,
    to: CUE.confirmClick + f60(10),
    title: 'Confirm transaction',
    rows: [
      ['Site', SITE],
      ['Call', 'submit_post'],
      ['Network', NETWORK.name],
      ['Network fee', NETWORK.fee],
    ],
    primary: 'Confirm',
    secondary: 'Reject',
    press: CUE.confirmClick,
  },
  {
    from: CUE.trickConfirmIn,
    to: CUE.trickConfirm + f60(10),
    title: 'Confirm transaction',
    rows: [
      ['Site', SITE],
      ['Call', 'submit_post'],
      ['Network', NETWORK.name],
      ['Network fee', NETWORK.fee],
    ],
    primary: 'Confirm',
    secondary: 'Reject',
    press: CUE.trickConfirm,
  },
];

/** Contiguous runs of steps share one sheet: it enters once and leaves once. */
const RUNS = [
  { from: CUE.sheetIn, to: CUE.sheetOut },
  { from: CUE.confirmIn, to: CUE.confirmClick + f60(10) },
  { from: CUE.trickConfirmIn, to: CUE.trickConfirm + f60(10) },
];

const Glyph = () => (
  <svg width={40} height={40} viewBox="0 0 40 40">
    <rect x="4" y="9" width="32" height="24" rx="6" fill={C.brand} />
    <rect x="22" y="17" width="14" height="9" rx="3" fill={C.white} />
    <circle cx="28" cy="21.5" r="2" fill={C.brand} />
  </svg>
);

const Body: React.FC<{ step: Step; f: number }> = ({ step, f }) => (
  <>
    <div style={{ ...S.text(32, 600, C.ink), marginTop: 30, lineHeight: 1.15 }}>{step.title}</div>
    <div style={{ marginTop: 22, borderRadius: 14, border: `1.5px solid ${C.line}` }}>
      {step.rows.map(([k, v], i) => (
        <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 18, padding: '14px 18px', borderTop: i ? `1.5px solid ${C.line}` : 'none' }}>
          <span style={{ ...S.text(21, 400, C.mute), display: 'flex', alignItems: 'center', gap: 10 }}>
            {k === 'Account 1' && <Check p={prog(f, CUE.accountCheck - 1, CUE.accountCheck + f60(11), E.out)} size={24} color={C.brand} />}
            {k}
          </span>
          <span style={{ ...(/^[0-9a-z]/.test(v) || v.startsWith('0x') ? S.mono(20, 400, C.ink) : S.text(21, 600, C.ink)), textAlign: 'right' }}>{v}</span>
        </div>
      ))}
    </div>
    {step.note && <div style={{ ...S.text(20, 400, C.mute), marginTop: 18 }}>{step.note}</div>}
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 36, display: 'flex', justifyContent: 'space-between' }}>
      <Button label={step.secondary} variant="outline" w={210} h={62} />
      <Button label={step.primary} w={210} h={62} press={pressAt(fd(f), step.press)} />
    </div>
  </>
);

export const WalletSheet: React.FC<{ f: number }> = ({ f }) => {
  const run = RUNS.find((r) => f >= r.from - 1 && f < r.to + f60(30));
  if (!run) return null;
  const pin = prog(f, run.from - 1, run.from + f60(18), E.out);
  // a large, high-contrast panel: a long, gentle exit, or the fade reads as a pop
  const pout = prog(f, run.to, run.to + f60(28), E.exit); // position accelerates away ...
  const fadeOut = prog(f, run.to, run.to + f60(28), E.smooth); // ... but opacity never drops on an accelerating curve
  const steps = STEPS.filter((s) => s.from >= run.from && s.to <= run.to + f60(10));
  return (
    <div
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: SHEET.w,
        height: SHEET.h,
        boxSizing: 'border-box',
        padding: 36,
        borderRadius: 24,
        background: C.white,
        border: `1.5px solid ${C.line}`,
        boxShadow: '0 30px 90px rgba(0,0,0,0.20)',
        opacity: pin * (1 - fadeOut),
        transform: `translate(${SHEET.x + mix(48, 0, pin) + mix(0, 28, pout)}px, ${SHEET.y}px)`,
        overflow: 'hidden',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <Glyph />
        <div>
          <div style={S.text(25, 600, C.ink)}>Wallet</div>
          <div style={S.mono(17)}>{SITE}</div>
        </div>
      </div>
      {steps.map((s) => {
        const vis = f >= s.from - 1 && f < s.to + 8;
        if (!vis) return null;
        const inP = s.from === run.from ? 1 : prog(f, s.from + 2, s.from + f60(16), E.smooth); // smooth: an ease-out fade pops on its first frame
        const outP = s.to >= run.to ? 0 : prog(f, s.to, s.to + 10, E.smooth);
        return (
          <div key={s.from} style={{ position: 'absolute', left: 36, right: 36, top: 76, bottom: 0, opacity: clamp(inP * (1 - outP)), transform: `translateY(${mix(12, 0, arrive(inP))}px)` }}>
            <Body step={s} f={f} />
          </div>
        );
      })}
    </div>
  );
};
