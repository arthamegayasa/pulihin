import { Easing, interpolate, useCurrentFrame } from 'remotion';

/** Opasitas fade-in lembut mulai `mulaiFrame` (relatif terhadap Sequence). */
export const useMuncul = (mulaiFrame = 0, lamaFrame = 12): number => {
  const frame = useCurrentFrame();
  return interpolate(frame, [mulaiFrame, mulaiFrame + lamaFrame], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.ease),
  });
};

/** Opasitas tampil dalam jendela [mulai, selesai) dengan fade masuk dan keluar. */
export const useJendela = (mulaiFrame: number, selesaiFrame: number, lamaFrame = 12): number => {
  const frame = useCurrentFrame();
  return interpolate(
    frame,
    [mulaiFrame, mulaiFrame + lamaFrame, selesaiFrame - lamaFrame, selesaiFrame],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.ease) },
  );
};
