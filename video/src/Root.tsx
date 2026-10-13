import type React from 'react';
import { Composition } from 'remotion';
import './fonts.ts';
import { PulihinDemo } from './PulihinDemo.tsx';
import { FPS, LEBAR, TINGGI, TOTAL_FRAME } from './timeline.ts';

export const RemotionRoot: React.FC = () => (
  <Composition
    id="PulihinDemo"
    component={PulihinDemo}
    durationInFrames={TOTAL_FRAME}
    fps={FPS}
    width={LEBAR}
    height={TINGGI}
    defaultProps={{ subtitle: true }}
  />
);
