import React from 'react';
import { AbsoluteFill, getStaticFiles, Html5Audio, Sequence, staticFile } from 'remotion';
import { ACTS } from './acts';
import { C } from './brand/tokens';
import { Audit } from './lib/Audit';
import { FontGate } from './lib/FontGate';
import type { SafeSpec } from './lib/safe';

/** Written by `npm run audio`. Renders are muted and scripts/render.sh muxes it with ffmpeg. */
export const SOUNDTRACK = 'audio/soundtrack.wav';

export type FilmProps = { audit?: boolean; safe?: SafeSpec };

// One Sequence per act, handing off on exact frames.
export const Film: React.FC<FilmProps> = ({ audit = false, safe }) => {
  const hasScore = getStaticFiles().some((s) => s.name === SOUNDTRACK);
  return (
    <FontGate>
      <AbsoluteFill style={{ background: C.paper }}>
        {ACTS.map(({ name, Act, from, dur }) => (
          <Sequence key={name} from={from} durationInFrames={dur} name={name}>
            <Act />
          </Sequence>
        ))}
        {hasScore && <Html5Audio src={staticFile(SOUNDTRACK)} />}
        {audit && <Audit safe={safe} />}
      </AbsoluteFill>
    </FontGate>
  );
};
