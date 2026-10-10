import React from 'react';
import { AbsoluteFill } from 'remotion';
import { Board, WORLD } from './app/Board';
import { Logo, MarkOnly } from './brand/Mark';
import { C } from './brand/tokens';
import { camera } from './lib/camera';
import { FontGate } from './lib/FontGate';
import { W } from './timeline';

/** The mark at a fixed size (the 16 px legibility check). */
export const MarkStill: React.FC<{ size: number }> = ({ size }) => (
  <AbsoluteFill style={{ background: C.paper, alignItems: 'center', justifyContent: 'center' }}>
    <MarkOnly size={size} />
  </AbsoluteFill>
);

/** The end card's logo at hero size. */
export const LogoStill: React.FC = () => (
  <FontGate>
    <AbsoluteFill style={{ background: C.paper, alignItems: 'center', justifyContent: 'center' }}>
      <Logo height={220} />
    </AbsoluteFill>
  </FontGate>
);

/** Style frame: the board at absolute frame f, framed wide. */
export const BoardStill: React.FC<{ f: number; k?: number; ax?: number; ay?: number }> = ({ f, k = W / (WORLD.w + 40), ax = 1000, ay = 600 }) => (
  <FontGate>
    <AbsoluteFill style={{ background: C.paper, overflow: 'hidden' }}>
      <div style={camera({ ax, ay, sx: 960, sy: 540, k })}>
        <Board f={f} />
      </div>
    </AbsoluteFill>
  </FontGate>
);
