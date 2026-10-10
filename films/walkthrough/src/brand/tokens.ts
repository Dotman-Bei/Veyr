// Brand tokens: the only place a colour, face or type size is written down. Acts import these;
// scripts/lint-film.mjs fails any hex colour that is not declared here.
//
// Veyr's own palette, taken from the live app (src/index.css in the repo) and its logo
// (brand/README.md). The banned-family entries are the brand's identity, recorded in BRIEF.md.
import type React from 'react';
import { safeInsets } from '../lib/safe';
import { H, W } from '../timeline';

export const C = {
  // The product's paper stage (the app is light-only).
  paper: '#FFFFFF',
  ink: '#09090B', // body text
  mute: '#5D5D65', // secondary text: 6.4:1 on paper
  line: '#E4E4E7', // hairlines and card borders
  input: '#D4D4D9', // input borders
  mist: '#F4F4F5', // wells, chips, the selected filter
  white: '#FFFFFF',
  // Product semantics: the app's own approve / reject badge colours (UI size only).
  approve: '#1B744A',
  reject: '#C52020',
  // Veyr's brand ink: logo, primary buttons, caption plates. // cinetic:brand-supplied indigo (Veyr ink)
  brand: '#1E174F', // cinetic:brand-supplied indigo (Veyr ink)
  // The one accent. It means "written on-chain": ACCEPTED, a verdict landing, the new feed row's edge, the logo's block.
  accent: '#B83A14', // cinetic:brand-supplied orange (Veyr ember)
  accentBright: '#E2622B', // cinetic:brand-supplied orange (Veyr bright ember, for the accent on the ink stage)
  cream: '#F7F1E9', // cinetic:brand-supplied cream (the V on the ink stage only)
  // The contract chapter's ink stage: Veyr ink, deepened. // cinetic:brand-supplied indigo (Veyr ink stage)
  stage: '#110D26', // cinetic:brand-supplied indigo (Veyr ink stage)
  stage2: '#1B1736', // cinetic:brand-supplied indigo (raised surfaces on the stage)
  stageLine: '#302B50', // cinetic:brand-supplied indigo (hairlines on the stage)
  stageMute: '#AFAFC0', // secondary text on the stage: 8.6:1
};

export const FONT = {
  text: '"Outfit Variable", system-ui, sans-serif', // Veyr's sans: every role
  mono: '"JetBrains Mono Variable", ui-monospace, monospace', // addresses, statuses, the URL
};

/** Faces the FontGate waits for before anything renders or measures (one entry per weight in use). */
export const FACES = [
  '400 16px "Outfit Variable"',
  '600 16px "Outfit Variable"',
  '400 16px "JetBrains Mono Variable"',
  '600 16px "JetBrains Mono Variable"',
];

/** Layout unit: 1 at 1080p, scales every size with the short side of the frame. */
export const U = Math.min(W, H) / 1080;

// One token per role (size in px at 1080p). Captions sit on a solid plate in the lower third.
export const TYPE = {
  display: { size: 120, weight: 600, track: -0.04, lead: 1.0 }, // the end card URL's companion: the logo carries the name
  caption: { size: 46, weight: 600, track: -0.015, lead: 1.15 }, // burned-in captions (>= 28 px)
  secondary: { size: 44, weight: 400, track: -0.01, lead: 1.15 }, // the end card's URL line
  ui: { size: 24, weight: 400, track: 0, lead: 1.35 }, // product UI body at world scale
};

/** CSS for a type role at a size (px). Tabular figures always, so numbers never jitter in width. */
export const typeStyle = (role: keyof typeof TYPE, size = TYPE[role].size * U): React.CSSProperties => ({
  fontFamily: FONT.text,
  fontSize: size,
  fontWeight: TYPE[role].weight,
  letterSpacing: `${TYPE[role].track}em`,
  lineHeight: TYPE[role].lead,
  fontVariantNumeric: 'tabular-nums',
  whiteSpace: 'pre',
});

/** Safe margins for a w x h frame as a symmetric envelope (96 x 64 px at 1920x1080). */
export const safeArea = (w: number, h: number) => {
  const i = safeInsets(undefined, w, h);
  return { x: Math.max(i.left, i.right), y: Math.max(i.top, i.bottom) };
};
/** The film's safe margins; text stays inside them (scripts/layout-audit.sh checks). */
export const SAFE = safeArea(W, H);
