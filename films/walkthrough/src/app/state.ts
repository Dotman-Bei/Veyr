// The board's state as a pure function of the absolute frame, driven by the timeline's cues. Every
// product act renders the same world from this, so a chapter seam is just the shot continuing.
import { clamp, E, fd, prog } from '../lib/anim';
import { typeFrames } from '../fx/TypeOn';
import { CUE, f60 } from '../timeline';
import { FEED, POST, STATS, TRICK, type Post, type Stats } from './data';

export const HOOK_TEXT = TRICK.text;
export const HOOK_TYPE = { start: CUE.typeHook, cps: 26 };
/** The post types in two bursts with a natural pause between its sentences. */
const SPLIT = POST.text.indexOf('.') + 1;
export const POST_TYPE = { start: CUE.typePost, cps: 26 };
export const POST_TYPE2 = { start: CUE.typePost2, cps: 22 };
/** Whole frames each character first shows (the sound's key events read the same schedule). */
export const HOOK_KEYS = typeFrames(HOOK_TEXT.length, HOOK_TYPE);
export const POST_KEYS = [...typeFrames(SPLIT, POST_TYPE), ...typeFrames(POST.text.length - SPLIT, POST_TYPE2)];

const typed = (keys: number[], f: number) => keys.filter((k) => k <= f).length;

export type Draft = { text: string; focus: boolean; disabled: boolean; selected: number };

export const draftAt = (f: number): Draft => {
  const F = fd(f);
  if (F < CUE.typeHook) return { text: '', focus: F >= CUE.cursorIn, disabled: false, selected: 0 };
  if (F < CUE.draftGone) {
    return {
      text: HOOK_TEXT.slice(0, typed(HOOK_KEYS, F)),
      focus: true,
      disabled: false,
      selected: prog(f, CUE.clearDraft, CUE.clearDraft + 6, E.ui),
    };
  }
  if (F < CUE.fieldClick) return { text: '', focus: false, disabled: false, selected: 0 };
  if (F < CUE.submitClick) return { text: POST.text.slice(0, typed(POST_KEYS, F)), focus: true, disabled: false, selected: 0 };
  if (F < CUE.verdictLand) return { text: POST.text, focus: false, disabled: true, selected: 0 };
  if (F < CUE.pasteClick) return { text: '', focus: false, disabled: false, selected: 0 };
  if (F < CUE.paste) return { text: '', focus: true, disabled: false, selected: 0 };
  if (F < CUE.trickSubmit) return { text: TRICK.text, focus: true, disabled: false, selected: 0 };
  if (F < CUE.rejectLand) return { text: TRICK.text, focus: false, disabled: true, selected: 0 };
  return { text: '', focus: false, disabled: false, selected: 0 };
};

export type Phase = 'idle' | 'signing' | 'pending';
export const phaseAt = (f: number): Phase => {
  const F = fd(f);
  if ((F >= CUE.submitClick && F < CUE.confirmClick) || (F >= CUE.trickSubmit && F < CUE.trickConfirm)) return 'signing';
  if ((F >= CUE.confirmClick && F < CUE.verdictLand) || (F >= CUE.trickConfirm && F < CUE.rejectLand)) return 'pending';
  return 'idle';
};

/** The verdict panel under the composer: which post, and how far its arrival has run. */
export const verdictAt = (f: number): { post: Post; at: number; rep: number } | null => {
  const F = fd(f);
  if (F >= CUE.verdictLand && F < CUE.trickSubmit) return { post: POST, at: CUE.verdictLand, rep: 1 };
  if (F >= CUE.rejectLand) return { post: TRICK, at: CUE.rejectLand, rep: 0 };
  return null;
};

/** Connection: 0 before the chip, then the chip's pop progress. */
export const connectedAt = (f: number) => prog(f, CUE.chip - 1, CUE.chip + f60(14), E.out);

/** The board's numbers (null before they load). */
export const statsAt = (f: number): Stats | null => {
  const F = fd(f);
  if (F < CUE.statsIn) return null;
  if (F < CUE.chip) return STATS.before;
  if (F < CUE.statsCount) return STATS.connected;
  if (F < CUE.rejectCount) return STATS.afterPost;
  return STATS.afterTrick;
};
/** Frame the most recent stats change landed on (counters tick on it). */
export const statsChangeAt = (f: number) => [CUE.statsIn, CUE.chip, CUE.statsCount, CUE.rejectCount].filter((c) => c <= fd(f)).pop() ?? -1;

export type FeedState = { posts: Post[]; insertAt: number | null; filter: 'all' | 'rejected'; filterAt: number };
export const feedAt = (f: number): FeedState => {
  const F = fd(f);
  const posts = F < CUE.insert ? FEED.before : F < CUE.rejectInsert ? FEED.afterPost : FEED.afterTrick;
  const insertAt = F >= CUE.rejectInsert ? CUE.rejectInsert : F >= CUE.insert ? CUE.insert : null;
  return { posts, insertAt, filter: F >= CUE.filterClick ? 'rejected' : 'all', filterAt: CUE.folds };
};

/** Row cascade: row i's 0..1 entrance (4 f stagger, 12 f each). */
export const rowIn = (f: number, i: number) => prog(f, CUE.rows + 6 * i, CUE.rows + 6 * i + 14, E.out);

/** Caret blink: on for 30 f, off for 30 f, solid while typing. */
export const caretOn = (f: number, lastKey: number) => fd(f) - lastKey < 30 || Math.floor((fd(f) - lastKey) / 30) % 2 === 0;
export const lastKeyAt = (f: number) => {
  const F = fd(f);
  const keys = [...HOOK_KEYS, ...POST_KEYS, CUE.paste, CUE.cursorIn, CUE.fieldClick, CUE.pasteClick].filter((k) => k <= F);
  return keys.length ? Math.max(...keys) : 0;
};

export const clamp01 = clamp;
