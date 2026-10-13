import { useEffect, useState, useSyncExternalStore, type ReactNode } from 'react';
import type { Sisi } from '@/types';

/**
 * Contoh gerakan: figur 2D bersendi yang bergerak pelan di antara posisi Mulai dan Puncak.
 * Pose kunci per latihan adalah DATA (sudut segmen), dihitung ke koordinat dengan kinematika maju
 * dan, untuk tangan yang berpegangan, kinematika balik dua ruas.
 * Gerak dikurangi (prefers-reduced-motion): dua pose statis Mulai & Puncak berdampingan.
 */

type V = [number, number];

const P = { badan: 44, leher: 6, kepala: 10, lenganAtas: 27, lenganBawah: 25, paha: 36, betis: 36, telapak: 14 };
const TANAH = 165;
const W_PRIMER = '#0b4f4a';
const W_AKSEN = '#c46a1b';
const W_LATAR = '#eaf2f0';
const W_KURSI = '#9fb7b3';
const W_TANAH = '#c9dcd8';
const DETIK_GERAK = 1.4;
const DETIK_TAHAN = 0.6;

const rad = (d: number) => (d * Math.PI) / 180;
/** Arah segmen dari sudut terhadap garis tegak ke bawah; positif = ke depan (+x). */
const arahBawah = (d: number): V => [Math.sin(rad(d)), Math.cos(rad(d))];
const tambah = (a: V, b: V, s = 1): V => [a[0] + b[0] * s, a[1] + b[1] * s];

/* ---------- model pose ---------- */

/** Tampak samping, figur menghadap ke kanan. Sudut lengan/tungkai mutlak dari garis tegak ke bawah. */
interface PoseSamping {
  /** Posisi pinggul (akar 'pinggul') atau pergelangan kaki dekat (akar 'kaki'). */
  akar: V;
  /** Condong badan dari tegak, positif ke depan. */
  badan: number;
  lengan: V;
  lenganJauh: V;
  tungkai: V;
  tungkaiJauh: V;
  /** Sudut telapak di bawah garis datar; negatif = ujung kaki naik. */
  telapak: number;
  telapakJauh: number;
  /** Bila ada, kedua tangan berpegangan pada titik ini (kinematika balik). */
  tangan?: V;
}

/** Tampak depan. Sisi aktif digambar di kanan penonton (seperti cermin kamera). Sudut positif = menjauhi badan. */
interface PoseDepan {
  pinggulY: number;
  /** Putaran batang tubuh, derajat. */
  rotasi: number;
  lenganAktif: V;
  lenganLain: V;
  tungkaiAktif: number;
  tungkaiLain: number;
  /** Tangan sisi lain berpegangan di titik ini. */
  tanganLain?: V;
}

type BagianSamping = 'lengan' | 'tungkai' | 'tungkaiJauh' | 'telapak';
type BagianDepan = 'lenganAktif' | 'tungkaiAktif' | 'badan';

type KonfigDemo =
  | { tampak: 'samping'; akarDi: 'pinggul' | 'kaki'; kursi: 'duduk' | 'pegangan' | null; aktif: BagianSamping[]; kf: PoseSamping[]; puncak: number }
  | { tampak: 'depan'; duduk: boolean; kursi: 'duduk' | 'pegangan' | null; aktif: BagianDepan[]; kf: PoseDepan[]; puncak: number };

const DUDUK_SAMPING: PoseSamping = {
  akar: [88, 124],
  badan: 0,
  lengan: [6, 8],
  lenganJauh: [-4, 0],
  tungkai: [90, 0],
  tungkaiJauh: [90, 0],
  telapak: 0,
  telapakJauh: 0,
};
const sampingDuduk = (ubah: Partial<PoseSamping> = {}): PoseSamping => ({ ...DUDUK_SAMPING, ...ubah });
const BERDIRI_SAMPING: PoseSamping = {
  ...DUDUK_SAMPING,
  akar: [100, 160],
  tungkai: [0, 0],
  tungkaiJauh: [0, 0],
  tangan: [118, 86],
};

const DUDUK_DEPAN: PoseDepan = { pinggulY: 118, rotasi: 0, lenganAktif: [6, 6], lenganLain: [6, 6], tungkaiAktif: 0, tungkaiLain: 0 };
const BERDIRI_DEPAN: PoseDepan = { ...DUDUK_DEPAN, pinggulY: 88, tanganLain: [70, 92] };
/** Lengan bersilang di dada untuk putaran badan. */
const SILANG: V = [15, -115];

/** Pose kunci per id latihan (exerciseDefinitions.ts). Indeks 0 = Mulai. */
const DEMO: Record<string, KonfigDemo> = {
  'fleksi-bahu': {
    tampak: 'samping',
    akarDi: 'pinggul',
    kursi: 'duduk',
    aktif: ['lengan'],
    kf: [sampingDuduk(), sampingDuduk({ lengan: [160, 162] })],
    puncak: 1,
  },
  'fleksi-siku': {
    tampak: 'samping',
    akarDi: 'pinggul',
    kursi: 'duduk',
    aktif: ['lengan'],
    kf: [sampingDuduk({ lengan: [2, 6] }), sampingDuduk({ lengan: [2, 142] })],
    puncak: 1,
  },
  'abduksi-bahu': {
    tampak: 'depan',
    duduk: true,
    kursi: 'duduk',
    aktif: ['lenganAktif'],
    kf: [DUDUK_DEPAN, { ...DUDUK_DEPAN, lenganAktif: [96, 98] }],
    puncak: 1,
  },
  'ekstensi-lutut': {
    tampak: 'samping',
    akarDi: 'pinggul',
    kursi: 'duduk',
    aktif: ['tungkai', 'telapak'],
    kf: [sampingDuduk(), sampingDuduk({ tungkai: [90, 80], telapak: -72 })],
    puncak: 1,
  },
  'abduksi-pinggul': {
    tampak: 'depan',
    duduk: false,
    kursi: 'pegangan',
    aktif: ['tungkaiAktif'],
    kf: [BERDIRI_DEPAN, { ...BERDIRI_DEPAN, tungkaiAktif: 26 }],
    puncak: 1,
  },
  'duduk-berdiri': {
    tampak: 'samping',
    akarDi: 'kaki',
    kursi: 'duduk',
    aktif: ['tungkai', 'tungkaiJauh'],
    kf: [
      sampingDuduk({ akar: [124, 160], badan: 6, lengan: [24, 50], lenganJauh: [24, 50] }),
      sampingDuduk({ akar: [124, 160], badan: 38, lengan: [40, 70], lenganJauh: [40, 70] }),
      sampingDuduk({ akar: [124, 160], badan: 0, tungkai: [0, 0], tungkaiJauh: [0, 0], lengan: [10, 20], lenganJauh: [10, 20] }),
      sampingDuduk({ akar: [124, 160], badan: 38, lengan: [40, 70], lenganJauh: [40, 70] }),
    ],
    puncak: 2,
  },
  jinjit: {
    tampak: 'samping',
    akarDi: 'kaki',
    kursi: 'pegangan',
    aktif: ['telapak'],
    kf: [BERDIRI_SAMPING, { ...BERDIRI_SAMPING, akar: [100, 153], telapak: 28, telapakJauh: 28 }],
    puncak: 1,
  },
  menggapai: {
    tampak: 'samping',
    akarDi: 'pinggul',
    kursi: 'duduk',
    aktif: ['lengan'],
    kf: [sampingDuduk({ lengan: [10, 122] }), sampingDuduk({ badan: 18, lengan: [86, 90] })],
    puncak: 1,
  },
  'putar-badan': {
    tampak: 'depan',
    duduk: true,
    kursi: 'duduk',
    aktif: ['badan'],
    kf: [
      { ...DUDUK_DEPAN, lenganAktif: SILANG, lenganLain: SILANG },
      { ...DUDUK_DEPAN, lenganAktif: SILANG, lenganLain: SILANG, rotasi: 45 },
      { ...DUDUK_DEPAN, lenganAktif: SILANG, lenganLain: SILANG },
      { ...DUDUK_DEPAN, lenganAktif: SILANG, lenganLain: SILANG, rotasi: -45 },
    ],
    puncak: 1,
  },
  'langkah-duduk': {
    tampak: 'samping',
    akarDi: 'pinggul',
    kursi: 'duduk',
    aktif: ['tungkai', 'tungkaiJauh'],
    kf: [sampingDuduk(), sampingDuduk({ tungkai: [118, 8] }), sampingDuduk(), sampingDuduk({ tungkaiJauh: [118, 8] })],
    puncak: 1,
  },
};

/** Figur netral untuk latihan tanpa pose kunci khusus. */
const DEMO_BAWAAN: KonfigDemo = { tampak: 'samping', akarDi: 'pinggul', kursi: 'duduk', aktif: [], kf: [sampingDuduk()], puncak: 0 };

/* ---------- interpolasi ---------- */

function campur<T>(a: T, b: T, k: number): T {
  if (typeof a === 'number' && typeof b === 'number') return (a + (b - a) * k) as T;
  if (Array.isArray(a) && Array.isArray(b)) return a.map((x: unknown, i) => campur(x, b[i] as unknown, k)) as T;
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    const hasil = { ...a } as Record<string, unknown>;
    for (const kunci of Object.keys(hasil)) hasil[kunci] = campur((a as Record<string, unknown>)[kunci], (b as Record<string, unknown>)[kunci], k);
    return hasil as T;
  }
  return a;
}

/** Pose pada detik `t` dari siklus: tahan di tiap pose kunci, lalu bergerak halus ke pose berikutnya. */
function poseSaat<T>(kf: readonly T[], t: number): T {
  if (kf.length === 1) return kf[0];
  const ruas = DETIK_GERAK + DETIK_TAHAN;
  // Stempel rAF bisa sedikit lebih awal dari waktu mulai: jaga agar t tidak negatif.
  const waktu = Math.max(0, t);
  const i = Math.floor(waktu / ruas) % kf.length;
  const lokal = waktu % ruas;
  if (lokal < DETIK_TAHAN) return kf[i];
  const k = (lokal - DETIK_TAHAN) / DETIK_GERAK;
  return campur(kf[i], kf[(i + 1) % kf.length], (1 - Math.cos(Math.PI * k)) / 2);
}

/* ---------- geometri ---------- */

/** Kinematika balik dua ruas; siku dipilih yang lebih rendah. */
function lenganMenuju(bahu: V, target: V): [V, V] {
  const a = P.lenganAtas;
  const b = P.lenganBawah;
  const dx = target[0] - bahu[0];
  const dy = target[1] - bahu[1];
  const d = Math.min(a + b - 0.01, Math.max(Math.abs(a - b) + 0.01, Math.hypot(dx, dy)));
  const arah = Math.atan2(dy, dx);
  const alfa = Math.acos((a * a + d * d - b * b) / (2 * a * d));
  const s1: V = [bahu[0] + a * Math.cos(arah + alfa), bahu[1] + a * Math.sin(arah + alfa)];
  const s2: V = [bahu[0] + a * Math.cos(arah - alfa), bahu[1] + a * Math.sin(arah - alfa)];
  return [s1[1] > s2[1] ? s1 : s2, [bahu[0] + d * Math.cos(arah), bahu[1] + d * Math.sin(arah)]];
}

interface Garis {
  titik: V[];
  aktif: boolean;
  /** Anggota tubuh sisi jauh (tampak samping): digambar transparan, tanpa tepi. */
  jauh?: boolean;
  tebal: number;
}
interface Bentuk {
  garis: Garis[];
  kepala: V;
  pinggul: V;
  /** Poligon badan (tampak depan) */
  badan?: V[];
  /** Putaran batang tubuh (tampak depan), untuk panah petunjuk. */
  putar?: { rotasi: number; y: number };
}

function bentukSamping(p: PoseSamping, akarDi: 'pinggul' | 'kaki', aktif: readonly BagianSamping[]): Bentuk {
  let pinggul: V;
  let lutut: V;
  let pkaki: V;
  if (akarDi === 'pinggul') {
    pinggul = p.akar;
    lutut = tambah(pinggul, arahBawah(p.tungkai[0]), P.paha);
    pkaki = tambah(lutut, arahBawah(p.tungkai[1]), P.betis);
  } else {
    pkaki = p.akar;
    lutut = tambah(pkaki, arahBawah(p.tungkai[1]), -P.betis);
    pinggul = tambah(lutut, arahBawah(p.tungkai[0]), -P.paha);
  }
  const lututJauh = tambah(pinggul, arahBawah(p.tungkaiJauh[0]), P.paha);
  const kakiJauh = tambah(lututJauh, arahBawah(p.tungkaiJauh[1]), P.betis);
  const atas: V = [Math.sin(rad(p.badan)), -Math.cos(rad(p.badan))];
  const bahu = tambah(pinggul, atas, P.badan);
  const leher = tambah(bahu, atas, P.leher);
  const kepala = tambah(bahu, atas, P.leher + P.kepala);

  const lengan = (s: V): [V, V] => {
    if (p.tangan) return lenganMenuju(bahu, p.tangan);
    const siku = tambah(bahu, arahBawah(s[0]), P.lenganAtas);
    return [siku, tambah(siku, arahBawah(s[1]), P.lenganBawah)];
  };
  const telapak = (k: V, sudut: number): V => tambah(k, [Math.cos(rad(sudut)), Math.sin(rad(sudut))], P.telapak);
  const [sikuJ, tanganJ] = lengan(p.lenganJauh);
  const [siku, tangan] = lengan(p.lengan);
  const aktifkah = (b: BagianSamping) => aktif.includes(b);

  return {
    kepala,
    pinggul,
    garis: [
      { titik: [pinggul, lututJauh, kakiJauh], aktif: aktifkah('tungkaiJauh'), jauh: true, tebal: 9 },
      { titik: [kakiJauh, telapak(kakiJauh, p.telapakJauh)], aktif: aktifkah('telapak'), jauh: true, tebal: 7 },
      { titik: [bahu, sikuJ, tanganJ], aktif: false, jauh: true, tebal: 8 },
      { titik: [pinggul, bahu, leher], aktif: false, tebal: 15 },
      { titik: [pinggul, lutut, pkaki], aktif: aktifkah('tungkai'), tebal: 10 },
      { titik: [pkaki, telapak(pkaki, p.telapak)], aktif: aktifkah('telapak'), tebal: 8 },
      { titik: [bahu, siku, tangan], aktif: aktifkah('lengan'), tebal: 9 },
    ],
  };
}

function bentukDepan(p: PoseDepan, duduk: boolean, aktif: readonly BagianDepan[]): Bentuk {
  const cx = 100;
  const hy = p.pinggulY;
  const sy = hy - P.badan;
  const lebarBahu = 17 * Math.cos(rad(p.rotasi));
  const geser = 5 * Math.sin(rad(p.rotasi));
  const bahuA: V = [cx + lebarBahu + geser, sy];
  const bahuL: V = [cx - lebarBahu + geser, sy];
  const pinggulA: V = [cx + 9, hy];
  const pinggulL: V = [cx - 9, hy];
  const kepala: V = [cx + geser * 2, sy - P.leher - P.kepala];

  const lengan = (bahu: V, s: V, arah: 1 | -1): [V, V] => {
    const siku = tambah(bahu, [arah * Math.sin(rad(s[0])), Math.cos(rad(s[0]))], P.lenganAtas);
    return [siku, tambah(siku, [arah * Math.sin(rad(s[1])), Math.cos(rad(s[1]))], P.lenganBawah)];
  };
  const tungkai = (pg: V, sudut: number, arah: 1 | -1): V[] => {
    if (duduk) {
      const lutut = tambah(pg, [arah * 5, 6]);
      const k = tambah(lutut, [arah, P.betis]);
      return [pg, lutut, k, tambah(k, [arah * 5, 0])];
    }
    const u: V = [arah * Math.sin(rad(sudut)), Math.cos(rad(sudut))];
    const lutut = tambah(pg, u, P.paha);
    const k = tambah(lutut, u, P.betis);
    return [pg, lutut, k, tambah(k, [arah * 5, 0])];
  };
  const [sikuA, tanganA] = lengan(bahuA, p.lenganAktif, 1);
  const [sikuL, tanganL] = p.tanganLain ? lenganMenuju(bahuL, p.tanganLain) : lengan(bahuL, p.lenganLain, -1);
  const putarAktif = aktif.includes('badan');

  return {
    kepala,
    pinggul: [cx, hy],
    badan: [bahuL, bahuA, pinggulA, pinggulL],
    putar: putarAktif ? { rotasi: p.rotasi, y: sy + 14 } : undefined,
    garis: [
      { titik: tungkai(pinggulL, p.tungkaiLain, -1), aktif: false, tebal: 10 },
      { titik: tungkai(pinggulA, p.tungkaiAktif, 1), aktif: aktif.includes('tungkaiAktif'), tebal: 10 },
      { titik: [bahuL, bahuA], aktif: putarAktif, tebal: 9 },
      { titik: [bahuL, sikuL, tanganL], aktif: false, tebal: 9 },
      { titik: [bahuA, sikuA, tanganA], aktif: aktif.includes('lenganAktif'), tebal: 9 },
    ],
  };
}

function bentuk(konfig: KonfigDemo, pose: PoseSamping | PoseDepan): Bentuk {
  return konfig.tampak === 'samping'
    ? bentukSamping(pose as PoseSamping, konfig.akarDi, konfig.aktif)
    : bentukDepan(pose as PoseDepan, konfig.duduk, konfig.aktif);
}

/* ---------- gambar ---------- */

const poin = (t: V[]) => t.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');

function Kursi({ konfig }: { konfig: KonfigDemo }) {
  const g = { stroke: W_KURSI, strokeWidth: 5, strokeLinecap: 'round' as const, fill: 'none' };
  if (konfig.tampak === 'samping') {
    if (konfig.kursi === 'duduk') {
      const awal = konfig.kf[0];
      const { pinggul } = bentukSamping(awal, konfig.akarDi, []);
      const dudukY = pinggul[1] + 7;
      const x0 = pinggul[0] - 18;
      const x1 = pinggul[0] + 16;
      return (
        <g {...g}>
          <polyline points={poin([[x0, dudukY - 48], [x0, dudukY], [x1, dudukY]])} />
          <line x1={x0 + 2} y1={dudukY} x2={x0 + 2} y2={TANAH} />
          <line x1={x1 - 2} y1={dudukY} x2={x1 - 2} y2={TANAH} />
        </g>
      );
    }
    if (konfig.kursi === 'pegangan') {
      const [tx, ty] = konfig.kf[0].tangan ?? [118, 86];
      const x = tx + 3;
      return (
        <g {...g}>
          <polyline points={poin([[x, ty], [x, ty + 36], [x + 30, ty + 36]])} />
          <line x1={x + 2} y1={ty + 36} x2={x + 2} y2={TANAH} />
          <line x1={x + 28} y1={ty + 36} x2={x + 28} y2={TANAH} />
        </g>
      );
    }
    return null;
  }
  if (konfig.kursi === 'duduk') {
    const y = konfig.kf[0].pinggulY + 7;
    return (
      <g {...g}>
        <line x1={80} y1={y} x2={80} y2={y - 46} />
        <line x1={120} y1={y} x2={120} y2={y - 46} />
        <line x1={80} y1={y - 46} x2={120} y2={y - 46} />
        <line x1={74} y1={y} x2={126} y2={y} />
        <line x1={77} y1={y} x2={77} y2={TANAH} />
        <line x1={123} y1={y} x2={123} y2={TANAH} />
      </g>
    );
  }
  if (konfig.kursi === 'pegangan') {
    const [tx, ty] = konfig.kf[0].tanganLain ?? [70, 92];
    return (
      <g {...g}>
        <line x1={tx - 22} y1={ty} x2={tx + 4} y2={ty} />
        <line x1={tx - 20} y1={ty} x2={tx - 20} y2={TANAH} />
        <line x1={tx + 2} y1={ty} x2={tx + 2} y2={TANAH} />
        <line x1={tx - 24} y1={ty + 36} x2={tx + 6} y2={ty + 36} />
      </g>
    );
  }
  return null;
}

function Figur({ konfig, pose, bayangan }: { konfig: KonfigDemo; pose: PoseSamping | PoseDepan; bayangan?: PoseSamping | PoseDepan }) {
  const b = bentuk(konfig, pose);
  const hantu = bayangan ? bentuk(konfig, bayangan).garis.filter((g) => g.aktif) : [];
  return (
    <g strokeLinecap="round" strokeLinejoin="round" fill="none">
      {/* Bayangan pose puncak: petunjuk ke mana gerakan menuju. */}
      {hantu.map((g, i) => (
        <polyline key={`h${i}`} points={poin(g.titik)} stroke={W_AKSEN} strokeOpacity={0.18} strokeWidth={g.tebal} />
      ))}
      {b.badan && <polygon points={poin(b.badan)} fill={W_PRIMER} stroke={W_PRIMER} strokeWidth={8} />}
      {b.garis.map((g, i) => (
        <g key={i} opacity={g.jauh ? (g.aktif ? 0.55 : 0.35) : 1}>
          {/* Tepi warna latar memisahkan anggota tubuh yang saling menutupi. */}
          {!g.jauh && <polyline points={poin(g.titik)} stroke={W_LATAR} strokeWidth={g.tebal + 4} />}
          <polyline points={poin(g.titik)} stroke={g.aktif ? W_AKSEN : W_PRIMER} strokeWidth={g.tebal} />
        </g>
      ))}
      <circle cx={b.kepala[0]} cy={b.kepala[1]} r={P.kepala} fill={W_PRIMER} stroke={W_LATAR} strokeWidth={3} />
      {b.putar && <PanahPutar {...b.putar} />}
    </g>
  );
}

/** Panah melengkung di depan dada yang menunjukkan arah putaran badan. */
function PanahPutar({ rotasi, y }: { rotasi: number; y: number }) {
  const kuat = Math.min(1, Math.abs(rotasi) / 20);
  if (kuat === 0) return null;
  return (
    <g opacity={kuat} transform={rotasi < 0 ? 'translate(200 0) scale(-1 1)' : undefined}>
      <path d={`M68 ${y} A32 8 0 0 0 132 ${y}`} stroke={W_LATAR} strokeWidth={8} />
      <path d={`M68 ${y} A32 8 0 0 0 132 ${y}`} stroke={W_AKSEN} strokeWidth={4} />
      <polyline points={`126,${y + 2} 132,${y - 5} 138,${y + 2}`} stroke={W_AKSEN} strokeWidth={4} />
    </g>
  );
}

function Panggung({ konfig, cermin, children, label }: { konfig: KonfigDemo; cermin: boolean; children: ReactNode; label: string }) {
  return (
    <svg viewBox="0 0 200 172" role="img" aria-label={label} className="h-auto w-full">
      <g transform={cermin ? 'translate(200 0) scale(-1 1)' : undefined}>
        <line x1={18} y1={TANAH + 2} x2={182} y2={TANAH + 2} stroke={W_TANAH} strokeWidth={3} strokeLinecap="round" />
        <Kursi konfig={konfig} />
        {children}
      </g>
    </svg>
  );
}

function subscribeGerak(cb: () => void) {
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
}

function useGerakDikurangi(): boolean {
  return useSyncExternalStore(
    subscribeGerak,
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    () => false,
  );
}

/** Waktu animasi dalam detik, ~30 fps agar ringan di HP kelas bawah. */
function useWaktuAnimasi(aktif: boolean): number {
  const [t, setT] = useState(0);
  useEffect(() => {
    if (!aktif) return;
    let id = 0;
    let terakhir = 0;
    const mulai = performance.now();
    const langkah = (now: number) => {
      id = requestAnimationFrame(langkah);
      if (now - terakhir < 33) return;
      terakhir = now;
      setT((now - mulai) / 1000);
    };
    id = requestAnimationFrame(langkah);
    return () => cancelAnimationFrame(id);
  }, [aktif]);
  return t;
}

export interface ExerciseDemoProps {
  exerciseId: string;
  nama: string;
  /** Sisi yang dilatih; menentukan arah figur. Kosongkan untuk latihan dua sisi. */
  sisi?: Sisi;
}

export function ExerciseDemo({ exerciseId, nama, sisi }: ExerciseDemoProps) {
  const konfig = DEMO[exerciseId] ?? DEMO_BAWAAN;
  const dikurangi = useGerakDikurangi();
  const t = useWaktuAnimasi(!dikurangi && konfig.kf.length > 1);
  // Tampak samping: figur menghadap kanan memperlihatkan sisi kirinya. Tampak depan: sisi aktif di kanan layar.
  const cermin = konfig.tampak === 'samping' ? sisi === 'kanan' : sisi === 'kiri';
  const kf = konfig.kf as readonly (PoseSamping | PoseDepan)[];
  const puncak = kf[konfig.puncak];

  if (dikurangi && kf.length > 1) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {(
          [
            ['Mulai', kf[0]],
            ['Puncak', puncak],
          ] as const
        ).map(([label, pose]) => (
          <figure key={label} className="rounded-kartu bg-primer-terang p-2">
            <Panggung konfig={konfig} cermin={cermin} label={`${nama}: posisi ${label.toLowerCase()}`}>
              <Figur konfig={konfig} pose={pose} />
            </Panggung>
            <figcaption className="pb-1 text-center font-bold text-primer">{label}</figcaption>
          </figure>
        ))}
      </div>
    );
  }

  return (
    <figure className="rounded-kartu bg-primer-terang p-3">
      <Panggung konfig={konfig} cermin={cermin} label={`Contoh gerakan ${nama}`}>
        <Figur konfig={konfig} pose={poseSaat(kf, t)} bayangan={konfig.aktif.length > 0 ? puncak : undefined} />
      </Panggung>
      <figcaption className="mt-1 text-center text-[0.95rem] text-teks-2">Ikuti irama pelan seperti contoh ini.</figcaption>
    </figure>
  );
}
