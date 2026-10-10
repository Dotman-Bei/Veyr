// The sound events of the film, computed from the picture code. scripts/export-cues.ts calls the
// default export and writes out/cues.json; scripts/audio/score.py turns each into a tuned sound.
// Rules (references/sound.md): every sound has a visible cause; discrete state changes are sounded,
// continuous motion is not; a class of action, once sounded, is sounded every time, at one level.
import { CLICKS, REJECT_AT } from './acts/Paper';
import { AGREE_AT, STEP_DONE, LEADER_KEYS, V_DECIDE, V_KEYS } from './acts/Chamber';
import { SEAT_START } from './acts/End';
import { FEED, POST, TRICK, VOTES } from './app/data';
import { HOOK_KEYS, HOOK_TEXT, POST_KEYS } from './app/state';
import { E } from './lib/anim';
import { peak, settleOf } from './lib/sync';
import { ACT, b, CUE, f60, FPS } from './timeline';

export type Kind =
  | 'tick' | 'tock' | 'hit' | 'land' | 'pop' | 'whoosh' | 'riser'
  | 'drop' | 'key' | 'click' | 'snap' | 'swell' | 'bell' | 'suck';

export type SoundEvent = {
  f: number;
  kind: Kind;
  weight?: number;
  pan?: number;
  pitch?: number | string;
  apexFrac?: number;
  dur?: number;
  variant?: string;
  id?: string;
};

const sec = (s: number) => Math.round(s * FPS);

/** A move from frame a to b on `ease`: whoosh as long as the move, apex on its velocity peak. */
const move = (a: number, z: number, ease: (t: number) => number, weight: number, pan: number, id: string): SoundEvent => {
  const apex = peak(a, z, ease);
  const dur = Math.max(sec(0.3), z - a);
  return { f: apex, kind: 'whoosh', weight, pan, dur, apexFrac: (apex - a) / (z - a), id };
};

/** Typing: one key per character, spaces marked so the typing voice can vary. */
/** An exit that accelerates into a cut: its loudest point is the cut frame, its tail rings into the next shot. */
const intoCut = (a: number, cut: number, tail: number, weight: number, pan: number, id: string): SoundEvent => ({
  f: cut,
  kind: 'whoosh',
  weight,
  pan,
  dur: cut - a + tail,
  apexFrac: (cut - a) / (cut - a + tail),
  id,
});

const keys = (frames: number[], text: string, id: string): SoundEvent[] =>
  frames.map((f, i) => ({ f, kind: 'key' as const, variant: text[i] === ' ' ? 'space' : 'word', weight: 0.7, id: `${id}-key${i}` }));

export default function cues(): SoundEvent[] {
  const ev: SoundEvent[] = [];

  // hook: the provocation types; the camera's pull-back into the board is the film's first whoosh
  ev.push(...keys(HOOK_KEYS, HOOK_TEXT, 'hook'));
  ev.push(move(CUE.pullBack, b(6), E.cam, 0.6, 0.2, 'pull-back'));

  // every click the cursor makes, at one level (wallet confirmations get the confirm variant)
  const confirms = new Set([CUE.approveConnect, CUE.approveNetwork, CUE.approveSwitch, CUE.confirmClick, CUE.trickConfirm]);
  for (const c of CLICKS) ev.push({ f: c, kind: 'click', weight: 0.95, variant: confirms.has(c) ? 'confirm' : undefined, id: `click-${c}` });
  ev.push({ f: CUE.draftGone, kind: 'click', weight: 0.6, id: 'draft-deleted' }); // select-all + delete
  ev.push({ f: CUE.paste, kind: 'click', weight: 0.6, id: 'paste' }); // cmd+V

  // board: the feed streams in (crisp ticks per row), the stats land
  FEED.before.forEach((_, i) => ev.push({ f: CUE.rows + 6 * i + 6, kind: 'tick', variant: 'crisp', weight: 0.3, id: `row${i}` }));
  for (const [f, id] of [[CUE.statsIn + 4, 'stats-in'], [CUE.chip, 'stats-connected'], [CUE.statsCount, 'stats-post'], [CUE.rejectCount, 'stats-reject']] as const)
    ev.push({ f, kind: 'tick', variant: 'crisp', weight: 0.5, id });

  // wallet: the sheet arrives, steps swap, the address chip pops into the navbar
  for (const f of [CUE.sheetIn, CUE.confirmIn, CUE.trickConfirmIn]) ev.push({ f: f + 1, kind: 'pop', weight: 0.4, id: `sheet-${f}` });
  for (const f of [CUE.addNetwork, CUE.switchNetwork]) ev.push({ f: f + 6, kind: 'pop', weight: 0.35, id: `sheet-step-${f}` });
  ev.push({ f: CUE.chip + 1, kind: 'pop', weight: 0.7, id: 'chip' });
  ev.push({ f: CUE.accountCheck + 1, kind: 'tick', variant: 'crisp', weight: 0.4, id: 'account-check' });
  [CUE.boardRead1, CUE.boardRead2, CUE.boardRead3].forEach((f, i) => ev.push({ f: f + 1, kind: 'tick', variant: 'crisp', weight: 0.6, id: `board-read${i + 1}` }));
  ev.push({ f: CUE.pendingShown + 1, kind: 'pop', weight: 0.4, id: 'pending-shown' });

  // write: the post types (the music ducks under it)
  ev.push(...keys(POST_KEYS, POST.text, 'post'));

  // submit: the post lifts and flies out into the contract (whoosh 2, across the velocity cut)
  ev.push({ f: CUE.lift + f60(9), kind: 'swell', weight: 0.4, dur: sec(0.4), id: 'lift' });
  ev.push(intoCut(CUE.leave, b(19), f60(30), 0.8, 0.4, 'post-flight'));

  // the contract: the card brakes to rest; the spine checks each status off
  ev.push({ f: settleOf(b(19), b(19) + f60(90), E.out), kind: 'tock', weight: 0.6, id: 'post-arrives' });
  STEP_DONE.slice(0, 3).forEach((f, i) => ev.push({ f: f + 1, kind: 'tick', weight: 0.45, id: `status${i}` }));
  // the progress motif: one rising note per decision (leader, then each validator), resolving on ACCEPTED
  const decisions = [CUE.leaderDecide, ...V_DECIDE];
  decisions.forEach((f, i) => ev.push({ f: f + 1, kind: 'pop', weight: 0.8, id: `rung${i + 1}` }));
  // the leader's and validators' reasons stream in fast: one soft blip per word (typing auto)
  ev.push(...keys(LEADER_KEYS, VOTES[0].reason, 'leader-reason').map((e) => ({ ...e, weight: 0.65 })));
  V_KEYS.forEach((k, i) => ev.push(...keys(k, VOTES[i + 1].reason, `v${i + 2}-reason`).map((e) => ({ ...e, weight: 0.6 }))));
  ev.push({ f: CUE.waiting + 1, kind: 'pop', weight: 0.35, id: 'validators-waiting' });
  // agreement: a light tick on each label swap (two-beat confirm), uneven like the picture
  AGREE_AT.forEach((f, i) => ev.push({ f, kind: 'tick', variant: 'crisp', weight: 0.35, id: `agree${i + 1}` }));
  ev.push({ f: CUE.quorum + 1, kind: 'tick', weight: 0.5, id: 'quorum' });
  ev.push({ f: CUE.revealed + 1, kind: 'tick', weight: 0.45, id: 'status3' });
  // the payoff: ACCEPTED, written on-chain
  ev.push({ f: CUE.accepted, kind: 'drop', weight: 1, id: 'accepted' });
  ev.push({ f: CUE.accepted, kind: 'snap', weight: 0.9, id: 'accepted-snap' });
  ev.push(intoCut(CUE.outOfChamber, b(30), f60(30), 0.6, 0, 'out-of-contract'));

  // verdict: the approval lands (true landing 1); the post inserts at the top of the feed
  ev.push({ f: CUE.verdictLand, kind: 'land', weight: 0.8, id: 'verdict-lands' });
  ev.push({ f: CUE.insert + 3, kind: 'pop', weight: 0.6, id: 'insert-post' });

  // trick: five REJECTs at uneven gaps, falling; the rejection is accepted on-chain
  REJECT_AT.forEach((f, i) => ev.push({ f: f + 1, kind: 'pop', variant: 'down', weight: 0.55, id: `reject${i + 1}` }));
  ev.push({ f: CUE.trickRevealing, kind: 'tick', weight: 0.4, id: 'trick-revealing' });
  ev.push({ f: CUE.trickAccepted, kind: 'snap', weight: 0.7, id: 'trick-accepted' });
  // public: the rejection settles and is stored
  ev.push({ f: CUE.rejectLand + 1, kind: 'tock', weight: 0.6, id: 'reject-settles' });
  ev.push({ f: CUE.rejectInsert + 3, kind: 'pop', weight: 0.6, id: 'insert-trick' });

  // audit: approved rows fold away, top to bottom, 6 f apart
  const approved = FEED.afterTrick.filter((p) => p.approved);
  approved.forEach((_, i) => ev.push({ f: CUE.folds + 6 * i + f60(14), kind: 'tick', variant: 'crisp', weight: 0.5, id: `fold${i}` }));

  // the audit's reading beat: each rejected post's reason inks in
  [CUE.read1, CUE.read2, CUE.read3, CUE.read4].forEach((f, i) => ev.push({ f: f + 1, kind: 'tick', variant: 'crisp', weight: 0.85, id: `read${i + 1}` }));

  // end: the edge lights, the block flies in, the V converges, the block seats (true landing 2), the lettering rises
  ev.push(move(CUE.blockFly, SEAT_START + 2, E.glide, 0.5, 0, 'block-flight'));
  ev.push({ f: CUE.armsIn + f60(12), kind: 'swell', weight: 0.4, dur: sec(0.5), id: 'arms' });
  ev.push({ f: CUE.seat, kind: 'land', weight: 0.7, id: 'seat' });
  ev.push({ f: CUE.lettering + 1, kind: 'pop', weight: 0.5, id: 'lettering' });
  ev.push({ f: CUE.edgeLit + 1, kind: 'tock', weight: 0.5, id: 'edge-lit' });
  ev.push({ f: CUE.pulse1, kind: 'tick', weight: 0.6, id: 'pulse1' });
  ev.push({ f: CUE.pulse2, kind: 'tock', weight: 0.6, id: 'pulse2' });

  void TRICK;
  void ACT;
  return ev;
}
