import React from 'react';
import { Composition, Folder, Still } from 'remotion';
import { Film, FilmProps } from './Film';
import { FilmSub, subMetadata } from './FilmSub';
import { ACTS } from './acts';
import { BoardStill, LogoStill, MarkStill } from './Stills';
import { FPS, H, TOTAL, W } from './timeline';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="Film" component={Film} durationInFrames={TOTAL} fps={FPS} width={W} height={H} defaultProps={{ audit: false } as FilmProps} />
    <Composition
      id="FilmSub"
      component={FilmSub}
      durationInFrames={TOTAL}
      fps={FPS}
      width={W}
      height={H}
      defaultProps={{ groups: [] as number[] }}
      calculateMetadata={subMetadata}
    />
    {/* One composition per act, in ACT order (layout-audit.sh relies on ActN = Nth act). */}
    <Folder name="Acts">
      {ACTS.map((a, i) => (
        <Composition key={a.name} id={`Act${i + 1}`} component={a.Solo} durationInFrames={a.dur} fps={FPS} width={W} height={H} defaultProps={{ audit: false } as FilmProps} />
      ))}
    </Folder>
    <Folder name="Stills">
      <Still id="Mark16" component={MarkStill} width={16} height={16} defaultProps={{ size: 16 }} />
      <Still id="LogoLarge" component={LogoStill} width={W} height={H} />
      <Still id="BoardAt" component={BoardStill} width={W} height={H} defaultProps={{ f: 1000 }} />
    </Folder>
  </>
);
