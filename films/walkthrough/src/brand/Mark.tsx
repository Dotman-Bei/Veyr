import React from 'react';
import { C } from './tokens';
import { LOGOTYPE, MARK } from './veyr-geometry';

// Veyr's logo, from the app's own generated geometry (veyr-geometry.ts). Three pieces so the end
// card can assemble it: the V (two arms converging), the verdict block (the film's accent: written
// on-chain) and the lettering "eyr". Units are the logotype's own (135.6 x 43.3, y from -0.68).
export { LOGOTYPE, MARK };

/** Per-piece pose in logotype units; scale about the piece's own centre. */
export type PieceXf = { x?: number; y?: number; s?: number; sx?: number; sy?: number; o?: number };

const xf = (p: PieceXf | undefined, cx: number, cy: number) => {
  if (!p) return undefined;
  const sx = Math.max(0, (p.s ?? 1) * (p.sx ?? 1));
  const sy = Math.max(0, (p.s ?? 1) * (p.sy ?? 1));
  return `translate(${p.x ?? 0} ${p.y ?? 0}) translate(${cx} ${cy}) scale(${sx} ${sy}) translate(${-cx} ${-cy})`;
};

/** The verdict block's centre, in logotype units (the device lands here). */
export const BLOCK_CENTRE = { x: MARK.block.x + MARK.block.width / 2, y: MARK.block.y + MARK.block.height / 2 };

export const Logo: React.FC<{
  height: number; // px for the logotype's full height
  v?: PieceXf;
  block?: PieceXf;
  text?: PieceXf;
  ink?: string;
  accent?: string;
  style?: React.CSSProperties;
}> = ({ height, v, block, text, ink = C.brand, accent = C.accent, style }) => {
  const k = height / LOGOTYPE.height;
  const b = MARK.block;
  return (
    <svg
      width={LOGOTYPE.width * k}
      height={height}
      viewBox={`0 ${LOGOTYPE.y} ${LOGOTYPE.width} ${LOGOTYPE.height}`}
      style={{ overflow: 'visible', ...style }}
      aria-label="Veyr"
    >
      <path d={MARK.v} fill={ink} transform={xf(v, MARK.width / 2, 15)} opacity={v?.o ?? 1} />
      <rect x={b.x} y={b.y} width={b.width} height={b.height} rx={b.rx} fill={accent} transform={xf(block, BLOCK_CENTRE.x, BLOCK_CENTRE.y)} opacity={block?.o ?? 1} />
      <g transform={xf(text, 90, 15)} opacity={text?.o ?? 1}>
        <path transform={LOGOTYPE.textTransform} d={LOGOTYPE.text} fill={ink} />
      </g>
    </svg>
  );
};

/** The mark alone (V + block), for the 16 px still. */
export const MarkOnly: React.FC<{ size: number; ink?: string; accent?: string }> = ({ size, ink = C.brand, accent = C.accent }) => (
  <svg width={size} height={size} viewBox={`0 0 ${MARK.width} ${MARK.height}`}>
    <path d={MARK.v} fill={ink} />
    <rect x={MARK.block.x} y={MARK.block.y} width={MARK.block.width} height={MARK.block.height} rx={MARK.block.rx} fill={accent} />
  </svg>
);
