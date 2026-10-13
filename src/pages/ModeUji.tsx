import { ArrowLeft, DownloadSimple, PlusCircle, Record as IkonRekam, VideoCamera } from '@phosphor-icons/react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { BigButton } from '@/components/BigButton';
import { hitungAkurasi, JENDELA_COCOK_MS } from '@/features/pose/accuracy';
import { EXERCISES, getExercise } from '@/features/pose/exerciseDefinitions';
import { getPoseStats, type StatistikMesin } from '@/features/pose/PoseEngine';
import { createTracker } from '@/features/pose/tracker';
import type { ExerciseTracker, PoseFrame, TrackerOptions, TrackerSnapshot } from '@/features/pose/types';
import { usePoseCamera } from '@/features/pose/usePoseCamera';
import { useWakeLock } from '@/features/pose/useWakeLock';
import { PATHS } from '@/router-paths';
import type { Sisi } from '@/types';

/**
 * Mode Uji internal (Bab 7.4): sudut live per sendi, state, repetisi, fps, serta alat bantu uji akurasi
 * 50 repetisi (AC-F1-2) dan perekam landmark untuk uji regresi luring. Tidak tampil di menu pasien.
 * Semua unduhan dibuat di perangkat (Blob); tidak ada data yang dikirim ke server.
 */

const SENDI = ['bahu', 'siku', 'lutut', 'pinggul'] as const;
const LAMA_REKAM_MS = 20_000;
const TARGET_UJI = 999;

type ModeSudut = NonNullable<TrackerOptions['modeSudut']>;

interface SampelRekaman {
  t: number;
  frame: PoseFrame | null;
}

function unduhJson(namaBerkas: string, data: unknown): void {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = namaBerkas;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const stempelBerkas = () => new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

const fmt = (v: number | string | boolean | undefined, digit = 1) =>
  v === undefined ? '–' : typeof v === 'number' ? (Number.isFinite(v) ? v.toFixed(digit) : '–') : String(v);

export default function ModeUji() {
  const [latihanId, setLatihanId] = useState(EXERCISES.find((e) => e.id === 'fleksi-siku')?.id ?? EXERCISES[0]?.id ?? '');
  const [sisi, setSisi] = useState<Sisi>('kanan');
  const [modeSudut, setModeSudut] = useState<ModeSudut>('otomatis');
  const [aktif, setAktif] = useState(false);
  const def = getExercise(latihanId);

  const trackerRef = useRef<{ kunci: string; tracker: ExerciseTracker } | null>(null);
  const snapRef = useRef<TrackerSnapshot | null>(null);
  const otomatisRef = useRef<number[]>([]);
  const [manual, setManual] = useState<number[]>([]);
  const [otomatis, setOtomatis] = useState<number[]>([]);
  const rekamRef = useRef<{ mulai: number; frames: SampelRekaman[] } | null>(null);
  const [sisaRekam, setSisaRekam] = useState<number | null>(null);
  const [snap, setSnap] = useState<TrackerSnapshot | null>(null);
  const [stat, setStat] = useState<StatistikMesin>(getPoseStats());

  const kunci = `${latihanId}|${sisi}|${modeSudut}`;

  const aturUlang = () => {
    trackerRef.current = null;
    snapRef.current = null;
    otomatisRef.current = [];
    setOtomatis([]);
    setManual([]);
    setSnap(null);
  };

  const selesaikanRekaman = () => {
    const r = rekamRef.current;
    rekamRef.current = null;
    setSisaRekam(null);
    if (!r) return;
    unduhJson(`pulihin-landmark-${latihanId}-${sisi}-${stempelBerkas()}.json`, {
      app: 'PULIHIN',
      jenis: 'rekaman-landmark',
      versi: 1,
      latihanId,
      sisi,
      modeSudut,
      durasiMs: LAMA_REKAM_MS,
      perangkat: navigator.userAgent,
      // Bentuk sama dengan SesiSintetis.frames (synthetic.ts) agar dapat diputar ulang lewat createTracker.
      frames: r.frames,
    });
  };

  const onFrame = (frame: PoseFrame | null, t: number): readonly number[] => {
    if (!def) return [];
    if (trackerRef.current?.kunci !== kunci) {
      trackerRef.current = { kunci, tracker: createTracker(def, { sisi, targetRepetisi: TARGET_UJI, modeSudut }) };
    }
    const s = trackerRef.current.tracker.update(frame, t);
    snapRef.current = s;
    if (s.repetisiBaru) {
      otomatisRef.current = [...otomatisRef.current, t];
      setOtomatis(otomatisRef.current);
    }
    const r = rekamRef.current;
    if (r) {
      if (t - r.mulai <= LAMA_REKAM_MS) r.frames.push({ t, frame });
      else selesaikanRekaman();
    }
    return s.titikAktif;
  };

  const kamera = usePoseCamera({ aktif, onFrame, tampilan: { isi: 'contain' } });
  useWakeLock(kamera.status.tahap === 'berjalan');

  // Tampilan diperbarui 5x per detik: cukup untuk dibaca, ringan untuk perangkat.
  useEffect(() => {
    if (!aktif) return;
    const id = window.setInterval(() => {
      setSnap(snapRef.current);
      setStat(getPoseStats());
      const r = rekamRef.current;
      if (r) setSisaRekam(Math.max(0, Math.ceil((LAMA_REKAM_MS - (performance.now() - r.mulai)) / 1000)));
    }, 200);
    return () => window.clearInterval(id);
  }, [aktif]);

  const akurasi = hitungAkurasi(manual, otomatis);
  const debug = snap?.debug ?? {};
  const kunciSudut = new Set(SENDI.flatMap((j) => ['kiri', 'kanan'].flatMap((s) => [`sudut.${j}.${s}`, `sudut.${j}.${s}.rata`])));
  const debugLain = Object.entries(debug).filter(([k]) => !kunciSudut.has(k));

  const simpanHasil = () =>
    unduhJson(`pulihin-uji-akurasi-${latihanId}-${sisi}-${stempelBerkas()}.json`, {
      app: 'PULIHIN',
      jenis: 'uji-akurasi-repetisi',
      versi: 1,
      tanggal: new Date().toISOString(),
      latihanId,
      sisi,
      modeSudut,
      jendelaCocokMs: JENDELA_COCOK_MS,
      perangkat: navigator.userAgent,
      delegasi: stat.delegasi,
      fpsRata: Math.round(stat.fps * 10) / 10,
      inferensiMsRata: Math.round(stat.inferensiMs * 10) / 10,
      percobaanTracker: snap?.percobaan ?? 0,
      hasil: { ...akurasi, pasangan: undefined },
      ketukanManualMs: manual,
      hitunganOtomatisMs: otomatis,
      pasangan: akurasi.pasangan,
    });

  const status = kamera.status;

  return (
    <main className="min-h-[100dvh] bg-latar pb-10">
      <header className="sticky top-0 z-20 flex items-center gap-2 border-b border-garis bg-white px-3 py-2">
        <Link to={PATHS.pengaturan} className="grid size-12 place-items-center rounded-xl text-primer hover:bg-primer-terang" aria-label="Kembali ke Pengaturan">
          <ArrowLeft size={28} weight="bold" />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="text-[1.3rem] font-extrabold leading-tight">Mode Uji Algoritma</h1>
          <p className="text-[0.85rem] text-teks-2">Halaman internal untuk pengujian, bukan untuk pasien.</p>
        </div>
      </header>

      <div className="mx-auto grid max-w-5xl gap-4 px-3 pt-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-[0.9rem] font-semibold text-teks-2">Latihan</span>
              <select
                value={latihanId}
                onChange={(e) => {
                  setLatihanId(e.target.value);
                  aturUlang();
                }}
                className="mt-1 block min-h-[56px] w-full rounded-xl border border-garis bg-white px-3 text-[1rem] font-semibold"
              >
                {EXERCISES.map((e, i) => (
                  <option key={e.id} value={e.id}>
                    {i + 1}. {e.nama}
                    {e.inti ? ' (inti)' : ''}
                  </option>
                ))}
              </select>
            </label>
            <div>
              <span className="text-[0.9rem] font-semibold text-teks-2">Sisi{def?.sisi === 'keduanya' ? ' (latihan dua sisi)' : ''}</span>
              <Segmen
                pilihan={[
                  ['kanan', 'Kanan'],
                  ['kiri', 'Kiri'],
                ]}
                nilai={sisi}
                onPilih={(s) => {
                  setSisi(s);
                  aturUlang();
                }}
              />
            </div>
            <div className="sm:col-span-2">
              <span className="text-[0.9rem] font-semibold text-teks-2">Mode sudut</span>
              <Segmen
                pilihan={[
                  ['otomatis', 'Otomatis (3D bila ada)'],
                  ['2d', '2D saja'],
                ]}
                nilai={modeSudut}
                onPilih={(m) => {
                  setModeSudut(m);
                  aturUlang();
                }}
              />
            </div>
          </div>

          <div className="relative aspect-[4/3] overflow-hidden rounded-kartu bg-black">
            <video ref={kamera.videoRef} className="absolute inset-0 size-full -scale-x-100 object-contain" playsInline muted aria-hidden />
            <canvas ref={kamera.canvasRef} className="pointer-events-none absolute inset-0 size-full" aria-hidden />
            {status.tahap !== 'berjalan' && (
              <div className="absolute inset-0 grid place-items-center p-4 text-center text-white">
                <p className="text-[1.05rem] font-semibold">
                  {status.tahap === 'menyiapkan'
                    ? 'Menyiapkan kamera dan model…'
                    : status.tahap === 'galat-kamera'
                      ? `Kamera: ${status.jenis}`
                      : status.tahap === 'galat-model'
                        ? 'Model gagal dimuat'
                        : 'Kamera mati'}
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <BigButton
              varian={aktif ? 'garis' : 'primer'}
              onClick={() => {
                if (aktif) kamera.hentikan();
                setAktif((a) => !a);
              }}
              ikon={<VideoCamera size={24} weight="bold" aria-hidden />}
            >
              {aktif ? 'Matikan Kamera' : 'Nyalakan Kamera'}
            </BigButton>
            <BigButton
              varian="garis"
              disabled={status.tahap !== 'berjalan' || sisaRekam !== null}
              onClick={() => {
                rekamRef.current = { mulai: performance.now(), frames: [] };
                setSisaRekam(Math.ceil(LAMA_REKAM_MS / 1000));
              }}
              ikon={<IkonRekam size={24} weight="fill" className="text-bahaya" aria-hidden />}
            >
              {sisaRekam !== null ? `Merekam… ${sisaRekam} dtk` : 'Rekam landmark 20 detik'}
            </BigButton>
          </div>

          <dl className="grid grid-cols-3 gap-2 text-center">
            <Kotak label="FPS" nilai={fmt(stat.fps)} />
            <Kotak label="Inferensi" nilai={`${fmt(stat.inferensiMs)} ms`} />
            <Kotak label="Delegasi" nilai={stat.delegasi ?? '–'} />
          </dl>
        </div>

        <div className="space-y-3">
          <dl className="grid grid-cols-3 gap-2 text-center">
            <Kotak label="Metrik" nilai={snap?.nilai == null ? '–' : `${snap.nilai.toFixed(1)}${snap.satuan}`} besar />
            <Kotak label="Fase" nilai={snap?.fase ?? '–'} besar />
            <Kotak label="Repetisi" nilai={String(snap?.repetisi ?? 0)} besar />
            <Kotak label="Percobaan" nilai={String(snap?.percobaan ?? 0)} />
            <Kotak label="Siap" nilai={snap ? (snap.siap ? 'ya' : 'belum') : '–'} />
            <Kotak label="Tubuh" nilai={snap ? (snap.tubuhTerlihat ? 'terlihat' : 'tidak') : '–'} />
          </dl>
          {def && (
            <p className="text-[0.9rem] text-teks-2">
              Ambang bawah {def.ambangBawah}
              {def.satuan} · atas {def.ambangAtas}
              {def.satuan} · koreksi: {snap?.koreksi?.pesan ?? '–'}
            </p>
          )}

          <table className="w-full overflow-hidden rounded-kartu bg-white text-left text-[0.95rem] shadow-tipis">
            <thead className="bg-primer-terang">
              <tr>
                <th className="px-3 py-2">Sudut (°)</th>
                <th className="px-3 py-2 text-right">Kiri</th>
                <th className="px-3 py-2 text-right">Kanan</th>
              </tr>
            </thead>
            <tbody className="tabular">
              {SENDI.map((j) => (
                <tr key={j} className="border-t border-garis">
                  <td className="px-3 py-1.5 font-semibold capitalize">{j}</td>
                  {(['kiri', 'kanan'] as const).map((s) => (
                    <td key={s} className="px-3 py-1.5 text-right">
                      {fmt(debug[`sudut.${j}.${s}`])}
                      <span className="text-teks-2"> / {fmt(debug[`sudut.${j}.${s}.rata`])}</span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-[0.8rem] text-teks-2">Mentah / diratakan. Siku = fleksi (0 saat lurus).</p>

          <section className="space-y-3 rounded-kartu border border-garis bg-white p-4 shadow-tipis">
            <h2 className="text-[1.1rem] font-bold">Uji akurasi hitungan</h2>
            <BigButton
              ukuran="besar"
              disabled={status.tahap !== 'berjalan'}
              onClick={() => setManual((m) => [...m, performance.now()])}
              ikon={<PlusCircle size={30} weight="fill" aria-hidden />}
            >
              +1 Repetisi nyata
            </BigButton>
            <dl className="grid grid-cols-3 gap-2 text-center">
              <Kotak label="Manual" nilai={String(akurasi.manual)} besar />
              <Kotak label="Otomatis" nilai={String(akurasi.otomatis)} besar />
              <Kotak label="Akurasi" nilai={akurasi.akurasiPersen === null ? '–' : `${akurasi.akurasiPersen}%`} besar />
              <Kotak label="Benar" nilai={String(akurasi.benar)} />
              <Kotak label="Ganda" nilai={String(akurasi.ganda)} />
              <Kotak label="Hilang" nilai={String(akurasi.hilang)} />
            </dl>
            <p className="text-[0.85rem] text-teks-2">
              Ketuk tepat saat satu repetisi nyata selesai. Hitungan otomatis dicocokkan ke ketukan terdekat dalam ±{JENDELA_COCOK_MS / 1000} detik.
              Akurasi = benar ÷ (manual + ganda).
            </p>
            <div className="grid grid-cols-2 gap-3">
              <BigButton varian="garis" onClick={aturUlang}>
                Atur ulang
              </BigButton>
              <BigButton
                varian="garis"
                disabled={akurasi.manual + akurasi.otomatis === 0}
                onClick={simpanHasil}
                ikon={<DownloadSimple size={22} weight="bold" aria-hidden />}
              >
                Simpan hasil
              </BigButton>
            </div>
          </section>

          {debugLain.length > 0 && (
            <details className="rounded-kartu border border-garis bg-white p-3 shadow-tipis" open>
              <summary className="cursor-pointer font-bold">Data tracker lain</summary>
              <dl className="tabular mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-0.5 text-[0.85rem]">
                {debugLain.map(([k, v]) => (
                  <div key={k} className="contents">
                    <dt className="text-teks-2">{k}</dt>
                    <dd className="break-all">{fmt(v, 2)}</dd>
                  </div>
                ))}
              </dl>
            </details>
          )}
        </div>
      </div>
    </main>
  );
}

function Kotak({ label, nilai, besar }: { label: string; nilai: string; besar?: boolean }) {
  return (
    <div className="rounded-xl border border-garis bg-white px-2 py-2 shadow-tipis">
      <dt className="text-[0.8rem] text-teks-2">{label}</dt>
      <dd className={`tabular font-extrabold ${besar ? 'text-[1.4rem]' : 'text-[1.05rem]'}`}>{nilai}</dd>
    </div>
  );
}

function Segmen<T extends string>({ pilihan, nilai, onPilih }: { pilihan: [T, string][]; nilai: T; onPilih: (v: T) => void }) {
  return (
    <div className="mt-1 grid auto-cols-fr grid-flow-col gap-1 rounded-xl bg-primer-terang p-1" role="radiogroup">
      {pilihan.map(([v, label]) => (
        <button
          key={v}
          type="button"
          role="radio"
          aria-checked={nilai === v}
          onClick={() => onPilih(v)}
          className={`min-h-[48px] rounded-lg px-2 text-[0.95rem] font-bold ${nilai === v ? 'bg-primer text-white' : 'text-primer hover:bg-white/70'}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
