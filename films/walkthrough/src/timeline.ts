// The single source of truth for time. Picture (src/acts), sound (src/sync.ts -> out/cues.json)
// and QA (scripts/grid-check.ts) all import this file. Keep it free of React and CSS imports.
// Veyr walkthrough: 100 BPM -> 36 f per beat, 144 f (2.4 s) per bar, 50 bars + a 60 f tail.

export const FPS = 60;
export const BPM = 100;
export const W = 1920;
export const H = 1080;

/** Frames per beat (whole number: 36 at 100 BPM / 60 fps). */
export const BEAT = (60 / BPM) * FPS;
export const BAR = BEAT * 4;
/** Absolute frame of a grid position: bar is 1-based, beat 0-3, sub = 16ths within the beat (9 f). */
export const b = (bar: number, beat = 0, sub = 0) => Math.round(((bar - 1) * 4 + beat) * BEAT + sub * (BEAT / 4));
/** A choreography length written in 60 fps frames. */
export const f60 = (frames: number) => Math.round((frames * FPS) / 60);
/** After the last bar the picture holds while the audio decays to digital silence. */
export const TAIL = FPS;

const act = (from: number, to: number) => ({ from: b(from), dur: b(to) - b(from) });

// One act per chapter (formats.md §6: long walkthroughs re-render one chapter at a time).
// The product acts share one world and one anchor camera, so a seam between two of them is
// invisible: the shot simply continues.
export const ACT = {
  hook: act(1, 5), // macro on the composer: the provocation is typed
  board: act(5, 9), // pull back to Veyr's board; rows cascade
  connect: act(9, 13), // wallet: connect, add Studionet, switch
  write: act(13, 16), // the real post types
  submit: act(16, 19), // sign; the post lifts and leaves (velocity cut)
  leader: act(19, 23), // INK: the leader proposes
  validators: act(23, 27), // INK: four validators re-check, each in their own words
  agree: act(27, 30), // INK: agreement cascade -> ACCEPTED (the payoff, bar 29)
  verdict: act(30, 34), // PAPER: the verdict lands; stats count; the post enters the feed
  trick: act(34, 39), // the provocation is submitted; split view; the quorum rejects
  public: act(39, 42), // the rejection is stored, with its reason
  audit: act(42, 47), // the Rejected filter narrows the feed
  end: { from: b(47), dur: b(51) + TAIL - b(47) }, // the stage clears to the logo
};

export const TOTAL = b(51) + TAIL;

// Named sync points (absolute frames) on the 16th grid.
export const CUE = {
  // hook
  cursorIn: b(1, 0, 2), // the cursor arrives in the field and clicks
  typeHook: b(1, 3), // the provocation starts typing
  hookHold: b(3), // the camera eases back: the provocation sits there
  cursorDrift: b(3, 2), // the cursor heads for the post button ...
  hover: b(4), // ... and hovers on it
  // board
  pullBack: b(5), // the camera leaves the macro
  clearDraft: b(5, 2), // select-all
  draftGone: b(5, 3), // the draft is deleted
  rows: b(6), // feed rows cascade
  statsIn: b(6, 2), // stats count in from the contract
  boardRead1: b(7), // the push passes the newest posts: each one's validator reason inks in
  boardRead2: b(7, 2),
  boardRead3: b(8),
  toNavbar: b(8, 2), // reframe toward the navbar
  // connect
  connectClick: b(9, 2),
  sheetIn: b(9, 3),
  accountCheck: b(10, 1), // the account row is selected
  approveConnect: b(10, 2),
  addNetwork: b(10, 3),
  approveNetwork: b(11, 1),
  switchNetwork: b(11, 2),
  approveSwitch: b(11, 3),
  sheetOut: b(12),
  chip: b(12, 1), // the address chip pops into the navbar
  toComposer: b(12, 3),
  // write
  fieldClick: b(13, 3),
  typePost: b(14), // first burst: the first sentence
  typePost2: b(15), // a pause, then the second
  toSubmit: b(15, 2), // the cursor heads for Submit
  hoverSubmit: b(16),
  // submit
  submitClick: b(16, 2),
  confirmIn: b(16, 3),
  confirmClick: b(17, 1),
  pendingShown: b(17, 2), // 'Validators are reaching consensus' appears
  lift: b(18), // the post card lifts out of the composer
  leave: b(18, 2), // it accelerates out of frame; cut at b(19)
  // leader (ink)
  arrive: b(19), // the post card enters moving and brakes to rest
  pending: b(19, 2), // spine: PENDING done, PROPOSING spins
  leaderRead: b(20), // the leader's spinner; its reason types
  leaderDecide: b(21, 2), // APPROVE chip pops
  proposed: b(22), // spine: PROPOSING done
  waiting: b(22, 2), // the four validators appear, waiting for the proposal
  // validators
  relay: b(23), // four paths run from the leader
  v1: b(24), // each validator starts its own reasoning (uneven, human gaps)
  v2: b(24, 2),
  v3: b(25),
  v4: b(25, 1, 2),
  committed: b(26, 2), // spine: COMMITTING done, REVEALING spins
  // agree
  agree: b(27), // the agreement cascade starts (offsets in the act)
  quorum: b(27, 2), // the leader shows the count: 4 of 4 agree
  revealed: b(28), // spine: REVEALING done; the head travels to ACCEPTED
  pushIn: b(28, 2), // the chamber pushes in toward the post before the payoff
  accepted: b(29), // ACCEPTED, in the accent: the payoff
  outOfChamber: b(29, 3), // the card drops away; cut at b(30)
  // verdict (paper)
  verdictLand: b(30, 1), // the verdict card lands (true landing 1 of 2)
  statsCount: b(31, 1), // posts 12 -> 13, approved 9 -> 10, reputation -> +1 (as the camera arrives on the wide shot)
  toFeed: b(31, 2),
  camFeed: b(32, 2), // the camera leaves the wide shot for the feed
  feedRead: b(33), // it arrives on the new post
  insert: b(32), // the post inserts at the top of the feed
  // trick
  pasteClick: b(34, 2),
  paste: b(35), // the provocation is pasted back in
  trickSubmit: b(35, 2),
  trickConfirmIn: b(35, 3),
  trickConfirm: b(36),
  split: b(36, 1), // the ink quorum slides in beside the composer
  rejects: b(36, 3), // five REJECTs at uneven gaps from here
  trickRevealing: b(37, 2), // the split panel's status reaches REVEALING
  trickAccepted: b(38), // the REJECT verdict is accepted on-chain
  // public
  rejectLand: b(39, 1), // the rejected verdict card settles (no overshoot: it is not a landing)
  rejectCount: b(40), // posts 13 -> 14, rejected 3 -> 4, reputation +1 -> 0
  rejectInsert: b(40, 2), // the rejected post inserts at the top of the feed
  camFeed2: b(41), // back to the feed
  feedArrive2: b(41, 2),
  // audit
  toFilter: b(42),
  filterClick: b(42, 2),
  folds: b(42, 3), // non-matching rows fold away
  camRow: b(43), // a push onto the first rejected post
  rowArrive: b(43, 3),
  read: b(44), // the camera drifts down the rejected list
  read1: b(44, 2), // each rejected post's reason inks in as the camera reads it
  read2: b(45),
  read3: b(45, 2),
  read4: b(46),
  // end
  clear: b(47), // the UI clears
  edgeLit: b(47, 2), // a feed row's edge lights in the accent
  blockFly: b(48), // the ember edge flies to the centre
  seat: b(48, 2), // the block seats first: the verdict is written (true landing 2 of 2)
  armsIn: b(49), // then the V's arms converge onto it
  lettering: b(49, 2),
  url: b(49, 3), // right after the lettering: no dead second on the finished logo
  pulse1: b(50), // the verdict block keeps time through the end card
  pulse2: b(50, 2),
  end: b(51),
};

export type Copy = {
  id: string;
  text: string;
  in: number;
  resolved: number;
  out: number;
  kind?: 'copy' | 'ui';
};

/** One chapter caption: enters a quarter-bar in, resolves 24 f later, leaves before the chapter ends. */
const cap = (id: string, text: string, from: number, outAt: number): Copy => ({ id, text, in: from, resolved: from + f60(24), out: outAt });

// Every on-screen caption (one per chapter, <= 5 words) plus the end card's URL.
export const COPY: Copy[] = [
  cap('hook', 'One moderator is easily gamed.', b(1, 3, 2), b(4, 2)), // stated by ~2 s
  cap('board', 'Veyr lets validators decide instead.', b(5, 2), b(8, 2)),
  cap('connect', 'Connect a wallet to Studionet.', b(9, 1), b(12, 2)),
  cap('write', 'Write about tech or GenLayer.', b(13, 1), b(15, 3)),
  cap('submit', 'Sign it. No fee.', b(16, 1), b(18, 2)),
  cap('leader', 'A leader proposes a verdict.', b(19, 2), b(22, 2)),
  cap('validators', 'Others re-check it independently.', b(23, 1), b(26, 2)),
  cap('agree', 'Different words. Same decision.', b(27, 1), b(29, 2)),
  cap('verdict', 'Approved, then written on-chain.', b(30, 2), b(33, 2)),
  cap('trick', "Tricks don't move a quorum.", b(34, 1), b(38, 2)),
  cap('public', 'Rejections stay public, with reasons.', b(39, 1), b(41, 3)),
  cap('audit', 'Every verdict stays auditable.', b(42, 3), b(46, 2)),
  { id: 'url', text: 'veyr-eight.vercel.app', in: CUE.url, resolved: CUE.url + f60(20), out: TOTAL, kind: 'ui' },
];

/** One COPY entry by id. */
export const copy = (id: string): Copy => {
  const c = COPY.find((x) => x.id === id);
  if (!c) throw new Error(`timeline: no COPY entry "${id}"`);
  return c;
};

/** Absolute frame of an act-local frame. */
export const abs = (name: keyof typeof ACT, local: number) => ACT[name].from + local;
