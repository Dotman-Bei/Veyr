// The acts, in ACT order. Each is a window onto one of three scenes rendered at the absolute frame,
// so a chapter re-renders on its own (Root registers ActN = the Nth entry) and seams are exact.
import React from 'react';
import { useCurrentFrame } from 'remotion';
import { C } from '../brand/tokens';
import { Audit } from '../lib/Audit';
import { FontGate } from '../lib/FontGate';
import type { FilmProps } from '../Film';
import { ACT } from '../timeline';
import { Chamber } from './Chamber';
import { End } from './End';
import { Paper } from './Paper';

type Name = keyof typeof ACT;
const scene = (name: Name, render: (f: number) => React.ReactNode) => {
  const Act: React.FC = () => {
    const f = useCurrentFrame() + ACT[name].from;
    return <>{render(f)}</>;
  };
  Act.displayName = `Act_${name}`;
  return Act;
};

const paper = (name: Name, captions: string[]) => scene(name, (f) => <Paper f={f} captions={captions} />);
const ink = (name: Name, captions: string[]) => scene(name, (f) => <Chamber f={f} captions={captions} />);

const DEFS: Array<[Name, React.FC]> = [
  ['hook', paper('hook', ['hook'])],
  ['board', paper('board', ['hook', 'board'])],
  ['connect', paper('connect', ['board', 'connect'])],
  ['write', paper('write', ['connect', 'write'])],
  ['submit', paper('submit', ['write', 'submit'])],
  ['leader', ink('leader', ['leader'])],
  ['validators', ink('validators', ['leader', 'validators'])],
  ['agree', ink('agree', ['validators', 'agree'])],
  ['verdict', paper('verdict', ['verdict'])],
  ['trick', paper('trick', ['verdict', 'trick'])],
  ['public', paper('public', ['trick', 'public'])],
  ['audit', paper('audit', ['public', 'audit'])],
  ['end', scene('end', (f) => <End f={f} />)],
];

export const ACTS = DEFS.map(([name, Act]) => {
  const Solo: React.FC<FilmProps> = ({ audit = false, safe }) => (
    <FontGate>
      <div style={{ position: 'absolute', inset: 0, background: C.paper }}>
        <Act />
        {audit && <Audit safe={safe} />}
      </div>
    </FontGate>
  );
  return { name, Act, Solo, from: ACT[name].from, dur: ACT[name].dur };
});
