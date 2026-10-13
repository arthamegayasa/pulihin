import type { ReactNode } from 'react';
import type { Kata } from './types';

/**
 * Gambar besar untuk satu kata afasia. Kata yang tidak punya emoji Unicode yang tepat (meja, gelas,
 * handuk, bantal, kipas, gula) memakai ilustrasi SVG sederhana; selebihnya memakai emoji dari bank kata.
 */

function kubusGula(cx: number, cy: number): ReactNode {
  const s = 11; // setengah lebar
  const t = 6; // setengah tinggi bidang atas
  const h = 12; // tinggi sisi
  return (
    <g key={`${cx}-${cy}`} stroke="#9AA9AD" strokeWidth="1.5" strokeLinejoin="round">
      <polygon points={`${cx},${cy - t} ${cx + s},${cy} ${cx},${cy + t} ${cx - s},${cy}`} fill="#FFFFFF" />
      <polygon points={`${cx - s},${cy} ${cx},${cy + t} ${cx},${cy + t + h} ${cx - s},${cy + h}`} fill="#EEF2F3" />
      <polygon points={`${cx + s},${cy} ${cx},${cy + t} ${cx},${cy + t + h} ${cx + s},${cy + h}`} fill="#D5DEE0" />
    </g>
  );
}

const SVG: Record<string, ReactNode> = {
  meja: (
    <>
      <rect x="17" y="36" width="4" height="16" rx="1.5" fill="#8E5A2B" />
      <rect x="43" y="36" width="4" height="16" rx="1.5" fill="#8E5A2B" />
      <rect x="4" y="24" width="56" height="9" rx="2.5" fill="#C1843F" />
      <rect x="4" y="31" width="56" height="5" rx="1.5" fill="#9C6430" />
      <rect x="8" y="36" width="9" height="22" rx="2" fill="#A86C34" />
      <rect x="47" y="36" width="9" height="22" rx="2" fill="#A86C34" />
    </>
  ),
  gelas: (
    <>
      <path d="M16 6h32l-4 50a4 4 0 0 1-4 3.7H24a4 4 0 0 1-4-3.7z" fill="#EEF6FA" stroke="#7FA8BB" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M18.4 26h27.2l-2.5 29.6a2 2 0 0 1-2 1.9H22.9a2 2 0 0 1-2-1.9z" fill="#8FCBE8" />
      <path d="M18.4 26h27.2" stroke="#5FAFD6" strokeWidth="2" />
      <path d="M22 11l1.6 11" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
    </>
  ),
  handuk: (
    <>
      <rect x="6" y="8" width="52" height="5" rx="2.5" fill="#7A8A8C" />
      <path d="M14 10h36v42a4 4 0 0 1-4 4H18a4 4 0 0 1-4-4z" fill="#4E9CC4" />
      <path d="M14 10h36v9H14z" fill="#3A84AB" />
      <rect x="14" y="40" width="36" height="4" fill="#FFFFFF" opacity="0.9" />
      <rect x="14" y="47" width="36" height="2" fill="#FFFFFF" opacity="0.9" />
      <path d="M18 56v4M24 56v4M30 56v4M36 56v4M42 56v4M46 56v4" stroke="#3A84AB" strokeWidth="1.6" strokeLinecap="round" />
    </>
  ),
  bantal: (
    <>
      <path
        d="M7 24c0-7 4-11 11-10 9 2 19 2 28 0 7-1 11 3 11 10v16c0 7-4 11-11 10-9-2-19-2-28 0-7 1-11-3-11-10z"
        fill="#FBF8F1"
        stroke="#C8BFAE"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path d="M17 26c9 3 21 3 30 0M17 38c9-3 21-3 30 0" stroke="#E2DACB" strokeWidth="2" fill="none" strokeLinecap="round" />
    </>
  ),
  kipas: (
    <>
      <rect x="30" y="44" width="4" height="12" fill="#5E7174" />
      <rect x="18" y="55" width="28" height="5" rx="2.5" fill="#5E7174" />
      <circle cx="32" cy="25" r="20" fill="#EEF5F4" stroke="#5E7174" strokeWidth="2.5" />
      <g fill="#3E97AA">
        <ellipse cx="32" cy="15" rx="5.5" ry="9.5" />
        <ellipse cx="32" cy="15" rx="5.5" ry="9.5" transform="rotate(120 32 25)" />
        <ellipse cx="32" cy="15" rx="5.5" ry="9.5" transform="rotate(240 32 25)" />
      </g>
      <circle cx="32" cy="25" r="4" fill="#2F4F52" />
      <path d="M32 5v40M12 25h40M18 11l28 28M46 11L18 39" stroke="#5E7174" strokeWidth="0.8" opacity="0.35" />
    </>
  ),
  gula: <>{[kubusGula(21, 36), kubusGula(43, 36), kubusGula(32, 20)]}</>,
};

export function GambarKata({ kata, ukuranRem, className = '' }: { kata: Kata; ukuranRem: number; className?: string }) {
  const svg = SVG[kata.id];
  if (svg) {
    return (
      <svg
        viewBox="0 0 64 64"
        role="img"
        aria-label={`Gambar ${kata.kata}`}
        className={`inline-block shrink-0 ${className}`}
        style={{ width: `${ukuranRem}rem`, height: `${ukuranRem}rem` }}
      >
        {svg}
      </svg>
    );
  }
  return (
    <span
      role="img"
      aria-label={`Gambar ${kata.kata}`}
      className={`inline-block shrink-0 select-none text-center leading-none ${className}`}
      style={{ fontSize: `${ukuranRem}rem`, minWidth: `${ukuranRem}rem` }}
    >
      {kata.emoji}
    </span>
  );
}
