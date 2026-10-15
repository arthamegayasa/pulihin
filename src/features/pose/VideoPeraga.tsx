import { Pause, Play } from '@phosphor-icons/react';
import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from 'react';
import { BigButton } from '@/components/BigButton';
import type { Sisi } from '@/types';
import { asetPeraga, hematData } from './asetPose';
import { ExerciseDemo } from './ExerciseDemo';

/**
 * Contoh gerakan berupa video peraga 3D (satu siklus, sisi kanan anatomis; sisi kiri dicerminkan).
 *
 * - Diam tanpa suara, berulang, inline; diputar hanya saat kartu terlihat dan halaman aktif (hemat baterai/CPU
 *   di HP kelas bawah; MediaPipe juga sedang dimuat di halaman ini). Tombol Jeda/Putar selalu ada (WCAG 2.2.2).
 * - Video diunduh utuh lewat fetch (melewati SW, cache `pulihin-peraga`) lalu diputar dari blob: satu unduhan
 *   ≤ 400 KB, tersimpan sebagai jawaban 200 sehingga bisa diputar luring.
 * - prefers-reduced-motion atau Penghemat Data/2G: tidak diputar otomatis; dua poster (Mulai, Puncak) dengan
 *   tombol "Putar contoh".
 * - Video gagal (luring tanpa cache, berkas rusak): dua poster. Poster juga gagal: figur 2D `ExerciseDemo`.
 */

export interface VideoPeragaProps {
  exerciseId: string;
  nama: string;
  /** Path dasar aset (`ExerciseDefinition.animasiAtauVideo`, mis. '/peraga/fleksi-bahu'). */
  basePath: string;
  /** Sisi yang dilatih; 'kiri' mencerminkan video. Kosongkan untuk latihan dua sisi. */
  sisi?: Sisi;
  /** Tempo target satu repetisi (detik) dari definisi latihan; teks irama memakai nilai tengahnya. */
  tempoDetik?: { min: number; max: number };
}

const MQ_GERAK = '(prefers-reduced-motion: reduce)';

function langgananGerak(cb: () => void) {
  const mq = window.matchMedia(MQ_GERAK);
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
}

function langgananHalaman(cb: () => void) {
  document.addEventListener('visibilitychange', cb);
  return () => document.removeEventListener('visibilitychange', cb);
}

export function VideoPeraga({ exerciseId, nama, basePath, sisi, tempoDetik }: VideoPeragaProps) {
  const aset = asetPeraga(basePath);
  const gerakDikurangi = useSyncExternalStore(langgananGerak, () => window.matchMedia(MQ_GERAK).matches, () => false);
  const halamanTampil = useSyncExternalStore(langgananHalaman, () => document.visibilityState === 'visible', () => true);
  const [hemat] = useState(hematData);
  /** Pengguna menekan "Putar contoh" pada tampilan poster. */
  const [dipilihPutar, setDipilihPutar] = useState(false);
  const [gagal, setGagal] = useState(false);
  const [posterRusak, setPosterRusak] = useState(false);
  const [dijeda, setDijeda] = useState(false);
  const [terlihat, setTerlihat] = useState(false);
  const [bolehMuat, setBolehMuat] = useState(false);
  const [src, setSrc] = useState<string | null>(null);
  /** Frame video pertama sudah tampil: poster di atasnya memudar. */
  const [siap, setSiap] = useState(false);
  const kotakRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const modusVideo = !gagal && (dipilihPutar || (!gerakDikurangi && !hemat));
  // Mulai mengunduh saat kartu pertama kali terlihat; menggulir menjauh tidak membatalkan unduhan.
  if (modusVideo && terlihat && !bolehMuat) setBolehMuat(true);

  useEffect(() => {
    const kotak = kotakRef.current;
    if (!modusVideo || !kotak) return;
    if (typeof IntersectionObserver === 'undefined') {
      setTerlihat(true);
      return;
    }
    const io = new IntersectionObserver(([e]) => setTerlihat(e.intersectionRatio >= 0.25), { threshold: [0, 0.25] });
    io.observe(kotak);
    return () => io.disconnect();
  }, [modusVideo]);

  useEffect(() => {
    if (!bolehMuat || !modusVideo) return;
    const batal = new AbortController();
    let url: string | null = null;
    fetch(aset.video, { signal: batal.signal })
      .then(async (res) => {
        const jenis = res.headers.get('content-type') ?? '';
        // Rewrite SPA mengembalikan index.html (200) untuk berkas yang belum ada.
        if (!res.ok || !jenis.startsWith('video/')) throw new Error(`${aset.video}: HTTP ${res.status} ${jenis}`);
        const blob = await res.blob();
        if (batal.signal.aborted) return;
        url = URL.createObjectURL(blob);
        setSrc(url);
      })
      .catch((e: unknown) => {
        if (batal.signal.aborted) return;
        console.warn('Video peraga belum bisa dimuat; menampilkan poster', e);
        setGagal(true);
      });
    return () => {
      batal.abort();
      if (url) URL.revokeObjectURL(url);
      setSrc(null);
    };
  }, [bolehMuat, modusVideo, aset.video]);

  const main = src !== null && terlihat && halamanTampil && !dijeda;
  useEffect(() => {
    const video = videoRef.current;
    if (!video || src === null) return;
    if (!main) {
      video.pause();
      return;
    }
    video.play().catch((e: unknown) => {
      // Diputar otomatis ditolak (mis. mode hemat daya iOS): tampilkan tombol Putar.
      if (e instanceof DOMException && e.name === 'NotAllowedError') setDijeda(true);
    });
  }, [main, src]);

  const cermin: CSSProperties | undefined = sisi === 'kiri' ? { transform: 'scaleX(-1)' } : undefined;
  const label = sisi ? `Contoh gerakan ${nama}, sisi ${sisi}` : `Contoh gerakan ${nama}`;
  const judul = sisi ? `Contoh gerakan, sisi ${sisi}` : 'Contoh gerakan';
  // Satu repetisi = tempo tengah, dibatasi 2..6 detik (sama dengan ExerciseDemo).
  const tempo = tempoDetik ? Math.min(6, Math.max(2, (tempoDetik.min + tempoDetik.max) / 2)) : 3;
  const tempoTeks = (Math.round(tempo * 2) / 2).toLocaleString('id-ID');

  if (!modusVideo) {
    if (posterRusak) return <ExerciseDemo exerciseId={exerciseId} nama={nama} sisi={sisi} tempoDetik={tempoDetik} />;
    return (
      <figure className="rounded-kartu bg-primer-terang p-2">
        <p className="px-1 text-[0.95rem] font-bold leading-tight text-primer">{judul}</p>
        {gagal && <p className="mt-1 px-1 text-[0.95rem] leading-snug text-teks-2">Video contoh belum bisa dimuat. Ini dua posisi kuncinya.</p>}
        <div className="mt-1.5 grid grid-cols-2 gap-2">
          {(
            [
              ['1. Mulai', 'mulai', aset.mulai],
              ['2. Puncak', 'puncak', aset.puncak],
            ] as const
          ).map(([teks, posisi, url]) => (
            <div key={posisi} className="overflow-hidden rounded-xl bg-white/60">
              <img
                src={url}
                alt={`${label}: posisi ${posisi}`}
                width={720}
                height={720}
                decoding="async"
                className="block aspect-square h-auto w-full object-cover"
                style={cermin}
                onError={() => setPosterRusak(true)}
              />
              <p className="py-1 text-center font-bold text-primer">{teks}</p>
            </div>
          ))}
        </div>
        <figcaption className="mt-1.5 text-center text-[0.95rem] text-teks-2">
          Gerak pelan dari Mulai ke Puncak, sekitar {tempoTeks} detik tiap gerakan.
        </figcaption>
        {!gagal && (
          <BigButton varian="garis" className="mt-2" ikon={<Play size={24} weight="fill" aria-hidden />} onClick={() => setDipilihPutar(true)}>
            Putar contoh
          </BigButton>
        )}
      </figure>
    );
  }

  return (
    <figure className="rounded-kartu bg-primer-terang p-3">
      <p className="px-1 text-[0.95rem] font-bold leading-tight text-primer">{judul}</p>
      <div ref={kotakRef} className="relative mt-1.5 aspect-square w-full overflow-hidden rounded-xl bg-white/60">
        <video
          ref={videoRef}
          src={src ?? undefined}
          poster={aset.mulai}
          muted
          loop
          playsInline
          autoPlay
          preload="metadata"
          width={720}
          height={720}
          aria-label={label}
          className="absolute inset-0 size-full object-cover"
          style={cermin}
          onPlaying={() => setSiap(true)}
          onError={() => setGagal(true)}
        />
        {!posterRusak && (
          <img
            src={aset.mulai}
            alt=""
            width={720}
            height={720}
            decoding="async"
            className={`pointer-events-none absolute inset-0 size-full object-cover transition-opacity duration-500 ${siap ? 'opacity-0' : 'opacity-100'}`}
            style={cermin}
            onError={() => setPosterRusak(true)}
          />
        )}
        <button
          type="button"
          onClick={() => setDijeda((v) => !v)}
          aria-label={dijeda ? 'Putar contoh gerakan' : 'Jeda contoh gerakan'}
          className="absolute top-2 right-2 inline-flex min-h-12 min-w-12 items-center justify-center gap-1.5 rounded-full bg-white/95 px-3.5 text-[1rem] font-bold text-primer shadow-tipis hover:bg-white"
        >
          {dijeda ? <Play size={22} weight="fill" aria-hidden /> : <Pause size={22} weight="fill" aria-hidden />}
          <span>{dijeda ? 'Putar' : 'Jeda'}</span>
        </button>
      </div>
      <figcaption className="mt-1.5 text-center text-[0.95rem] text-teks-2">
        Ikuti irama pelan ini: sekitar <span className="tabular font-semibold text-teks">{tempoTeks} detik</span> tiap gerakan.
      </figcaption>
    </figure>
  );
}
