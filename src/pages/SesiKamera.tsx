import { ArrowClockwise, CameraSlash, CheckCircle, HandsClapping, Info, StopCircle, WarningCircle } from '@phosphor-icons/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { BigButton, BigLink } from '@/components/BigButton';
import { addRepLogs, deleteSession, putSession } from '@/data/db';
import { PENJELASAN_GALAT_KAMERA } from '@/features/pose/camera';
import { getExercise } from '@/features/pose/exerciseDefinitions';
import { angkaKeKata, daftarTitik } from '@/features/pose/labels';
import { bacaSisi, bacaTarget, urlDetail } from '@/features/pose/sesiParams';
import { createTracker } from '@/features/pose/tracker';
import type { ExerciseDefinition, ExerciseTracker, KoreksiAktif, PoseFrame, TrackerResult, TrackerSnapshot } from '@/features/pose/types';
import { usePoseCamera } from '@/features/pose/usePoseCamera';
import { useWakeLock } from '@/features/pose/useWakeLock';
import { todayISO } from '@/lib/date';
import { newId } from '@/lib/id';
import { getPrefs } from '@/lib/prefs';
import { clamp } from '@/lib/score';
import { cancelSpeech, speak } from '@/lib/speak';
import { PATHS } from '@/router-paths';
import type { Session, Sisi } from '@/types';

const PESAN_TERLALU_CEPAT = 'Gerakan tadi belum terhitung. Coba sekali lagi, pelan pelan.';
const PESAN_RENTANG_KURANG = 'Gerakan tadi belum terhitung. Coba angkat sedikit lebih jauh bila mampu.';
const LAMA_PESAN_LEMBUT_MS = 3500;
const LAMA_SIAP_MS = 1500;
const LAMA_PERAYAAN_MS = 1800;
const TANPA_TITIK: readonly number[] = [];

/**
 * Sesi Kamera (Bab 5.1 langkah 3-7), layar penuh di luar AppShell.
 * Penyimpanan: catatan sesi selesai=false ditulis saat kamera mulai berjalan; saat selesai catatan yang
 * sama ditimpa dengan hasil + repLogs. Hanya id sesi ini yang pernah ditulis, sehingga tab yang ditutup di
 * tengah sesi hanya meninggalkan satu catatan belum selesai dan tidak menyentuh sesi lain (AC-F1-6).
 * Berhenti sebelum repetisi pertama: catatan belum selesai DIHAPUS (bukan latihan) lalu kembali ke Detail.
 */
export default function SesiKamera() {
  const { id = '' } = useParams();
  const def = getExercise(id);
  if (!def) {
    return (
      <main className="mx-auto flex min-h-[100dvh] max-w-md flex-col justify-center gap-5 px-5">
        <h1 className="text-[1.6rem] font-extrabold">Latihan tidak ditemukan</h1>
        <p className="text-teks-2">Silakan pilih latihan dari daftar.</p>
        <BigLink to={PATHS.latihan}>Lihat Daftar Latihan</BigLink>
      </main>
    );
  }
  return <Sesi def={def} />;
}

interface Tampilan {
  repetisi: number;
  siap: boolean;
  tubuhTerlihat: boolean;
  koreksi: KoreksiAktif | null;
}

const samaTampilan = (a: Tampilan, s: TrackerSnapshot) =>
  a.repetisi === s.repetisi &&
  a.siap === s.siap &&
  a.tubuhTerlihat === s.tubuhTerlihat &&
  a.koreksi?.id === s.koreksi?.id &&
  a.koreksi?.sejak === s.koreksi?.sejak;

type Akhir = { tahap: 'perayaan' } | { tahap: 'menyimpan' } | { tahap: 'galat-simpan'; hasil: TrackerResult } | null;

function Sesi({ def }: { def: ExerciseDefinition }) {
  const navigate = useNavigate();
  const [cari] = useSearchParams();
  const [awal] = useState(() => {
    const target = bacaTarget(cari.get('target'), def.targetRepetisiDefault);
    const sisi: Sisi = bacaSisi(cari.get('sisi'), getPrefs().sisiLatihan);
    return { target, sisi, sessionId: newId('sesi') };
  });
  const { target, sisi, sessionId } = awal;

  const trackerRef = useRef<ExerciseTracker | null>(null);
  trackerRef.current ??= createTracker(def, { sisi, targetRepetisi: target });

  const [tampilan, setTampilan] = useState<Tampilan>({ repetisi: 0, siap: false, tubuhTerlihat: false, koreksi: null });
  const [pesanLembut, setPesanLembut] = useState<string | null>(null);
  const [baruSiap, setBaruSiap] = useState(false);
  const [akhir, setAkhir] = useState<Akhir>(null);

  const selesaiRef = useRef(false);
  const repRef = useRef(0);
  const siapRef = useRef(false);
  const dasarRef = useRef<Session | null>(null);
  const sesiAwalRef = useRef<Promise<void> | null>(null);
  const barRef = useRef<HTMLDivElement | null>(null);
  const hidupRef = useRef(true);
  const timerLembut = useRef(0);

  const simpanHasil = useCallback(
    async (hasil: TrackerResult) => {
      await sesiAwalRef.current;
      const dasar = dasarRef.current;
      if (!dasar) throw new Error('Sesi belum dimulai');
      await putSession({
        ...dasar,
        selesai: true,
        selesaiAt: Date.now(),
        skor: hasil.skor,
        skorKomponen: hasil.skorKomponen,
        repetisiTercapai: hasil.repetisi,
        durasiDetik: hasil.durasiDetik,
        saran: hasil.saran,
      });
      await addRepLogs(hasil.repLogs.map((l) => ({ ...l, sessionId })));
    },
    [sessionId],
  );

  const simpanLaluRingkasan = useCallback(
    (hasil: TrackerResult, tunda: number) => {
      const jeda = new Promise((r) => setTimeout(r, tunda));
      Promise.all([simpanHasil(hasil), jeda]).then(
        () => {
          if (hidupRef.current) navigate(PATHS.ringkasan(sessionId), { replace: true });
        },
        (e: unknown) => {
          console.error('Hasil sesi gagal disimpan', e);
          if (hidupRef.current) setAkhir({ tahap: 'galat-simpan', hasil });
        },
      );
    },
    [navigate, sessionId, simpanHasil],
  );

  const kameraRef = useRef<{ hentikan: () => void }>({ hentikan: () => {} });

  const onFrame = (frame: PoseFrame | null, t: number): readonly number[] => {
    const tracker = trackerRef.current;
    if (!tracker || selesaiRef.current) return TANPA_TITIK;
    const s = tracker.update(frame, t);

    if (barRef.current) barRef.current.style.transform = `scaleX(${clamp(s.progres, 0, 1)})`;
    if (s.siap && !siapRef.current) {
      siapRef.current = true;
      setBaruSiap(true);
      setTimeout(() => setBaruSiap(false), LAMA_SIAP_MS);
      speak('Tubuh terdeteksi. Siap. Silakan mulai pelan pelan.');
    }
    if (s.repetisiBaru) {
      repRef.current = s.repetisi;
      speak(angkaKeKata(s.repetisi));
    }
    // Sebelum siap, petunjuk bingkai yang berbicara; koreksi baru diucapkan setelah siap (satu pesan pada satu waktu).
    // Koreksi baru (termasuk yang lebih penting dan menggeser pesan lama) langsung memotong ucapan sebelumnya
    // (AC-F1-3), kecuali hitungan yang baru diucapkan pada frame yang sama.
    if (s.koreksiBaru && siapRef.current) speak(s.koreksiBaru.pesan, { interrupt: !s.repetisiBaru });
    if (s.percobaanTidakDihitung) {
      const pesan = s.alasanTidakDihitung === 'rentang-kurang' ? PESAN_RENTANG_KURANG : PESAN_TERLALU_CEPAT;
      setPesanLembut(pesan);
      window.clearTimeout(timerLembut.current);
      timerLembut.current = window.setTimeout(() => setPesanLembut(null), LAMA_PESAN_LEMBUT_MS);
      speak(pesan, { interrupt: false });
    }
    setTampilan((prev) =>
      samaTampilan(prev, s) ? prev : { repetisi: s.repetisi, siap: s.siap, tubuhTerlihat: s.tubuhTerlihat, koreksi: s.koreksi },
    );

    if (s.repetisi >= target) {
      // Target tercapai: hentikan hitungan & kamera, rayakan sebentar, simpan, lalu ke ringkasan.
      selesaiRef.current = true;
      const hasil = tracker.finish(t);
      kameraRef.current.hentikan();
      setAkhir({ tahap: 'perayaan' });
      speak('Hebat! Target tercapai.', { interrupt: false });
      simpanLaluRingkasan(hasil, LAMA_PERAYAAN_MS);
      return TANPA_TITIK;
    }
    return s.titikAktif;
  };

  const kamera = usePoseCamera({ aktif: true, onFrame });
  kameraRef.current = kamera;
  const tahap = kamera.status.tahap;
  useWakeLock(tahap === 'berjalan');

  // Catatan sesi belum selesai ditulis begitu kamera benar-benar berjalan.
  useEffect(() => {
    if (tahap !== 'berjalan' || dasarRef.current) return;
    const dasar: Session = {
      id: sessionId,
      patientId: getPrefs().activePatientId,
      tanggal: todayISO(),
      mulaiAt: Date.now(),
      selesaiAt: null,
      jenis: 'gerak',
      latihanId: def.id,
      kategoriKata: null,
      repetisiTarget: target,
      repetisiTercapai: 0,
      skor: 0,
      skorKomponen: null,
      ringkasanAfasia: null,
      durasiDetik: 0,
      selesai: false,
      saran: null,
      sisi: def.sisi === 'pilih' ? sisi : null,
      isDemo: false,
    };
    dasarRef.current = dasar;
    sesiAwalRef.current = putSession(dasar).catch((e: unknown) => console.error('Sesi belum tercatat', e));
    speak('Posisikan tubuh Anda di dalam bingkai.');
  }, [tahap, sessionId, def.id, def.sisi, target, sisi]);

  // Keluar tanpa Berhenti (tombol kembali perangkat) sebelum repetisi pertama: buang catatan kosong.
  useEffect(() => {
    hidupRef.current = true;
    return () => {
      hidupRef.current = false;
      window.clearTimeout(timerLembut.current);
      const awalSesi = sesiAwalRef.current;
      if (!selesaiRef.current && repRef.current === 0 && awalSesi) {
        void awalSesi.then(() => deleteSession(sessionId));
      }
    };
  }, [sessionId]);

  const berhenti = () => {
    kamera.hentikan(); // kamera padam seketika (AC-F1-7)
    cancelSpeech();
    if (selesaiRef.current) return;
    selesaiRef.current = true;
    const tracker = trackerRef.current;
    if (tracker && repRef.current >= 1) {
      setAkhir({ tahap: 'menyimpan' });
      simpanLaluRingkasan(tracker.finish(performance.now()), 0);
      return;
    }
    const awalSesi = sesiAwalRef.current;
    if (awalSesi) void awalSesi.then(() => deleteSession(sessionId)).catch((e: unknown) => console.error(e));
    navigate(urlDetail(def.id, target), { replace: true });
  };

  const sedangMenyiapkan = tahap === 'siaga' || tahap === 'menyiapkan';
  const tampilBingkai = tahap === 'berjalan' && (!tampilan.siap || baruSiap) && !akhir;
  const banner = tampilan.koreksi
    ? { teks: tampilan.koreksi.pesan, jenis: 'koreksi' as const }
    : pesanLembut
      ? { teks: pesanLembut, jenis: 'lembut' as const }
      : null;
  const namaSisi = def.sisi === 'pilih' ? (sisi === 'kanan' ? 'Kanan' : 'Kiri') : null;

  return (
    <main className="fixed inset-0 flex flex-col bg-primer-tua text-white">
      {/* Bilah atas: nama latihan + Berhenti yang selalu terlihat (AC-F1-7). */}
      <header className="z-30 flex shrink-0 items-center gap-3 bg-primer-tua px-4 py-2" style={{ paddingTop: 'max(0.5rem, env(safe-area-inset-top))' }}>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[1.3rem] font-extrabold leading-tight">{def.nama}</h1>
          {namaSisi && <p className="text-[0.95rem] text-white/80">Sisi {namaSisi}</p>}
        </div>
        <BigButton varian="bahaya" penuh={false} onClick={berhenti} ikon={<StopCircle size={26} weight="fill" aria-hidden />} className="shrink-0">
          Berhenti
        </BigButton>
      </header>

      {/* Video + skeleton. Elemen selalu ada di DOM agar Coba Lagi dapat menyalakan kamera lagi. */}
      <div className="relative min-h-0 flex-1 overflow-hidden bg-black">
        <video ref={kamera.videoRef} className="absolute inset-0 size-full -scale-x-100 object-cover" playsInline muted aria-hidden />
        <canvas ref={kamera.canvasRef} className="pointer-events-none absolute inset-0 size-full" aria-hidden />

        {tampilBingkai && (
          <Kesiapan siap={tampilan.siap} terlihat={tampilan.tubuhTerlihat} petunjuk={`Pastikan ${daftarTitik(def.titikKunci)} terlihat di layar.`} />
        )}

        {banner && tahap === 'berjalan' && !akhir && !tampilBingkai && (
          <div
            role="status"
            aria-live="polite"
            className={`absolute inset-x-3 bottom-3 z-10 flex items-start gap-3 rounded-kartu border-l-8 bg-white p-4 text-teks shadow-angkat ${
              banner.jenis === 'koreksi' ? 'border-peringatan' : 'border-primer'
            }`}
          >
            {banner.jenis === 'koreksi' ? (
              <WarningCircle size={32} weight="fill" className="mt-0.5 shrink-0 text-peringatan" aria-hidden />
            ) : (
              <Info size={32} weight="fill" className="mt-0.5 shrink-0 text-primer" aria-hidden />
            )}
            <p className="text-[1.35rem] font-bold leading-snug">{banner.teks}</p>
          </div>
        )}

        {sedangMenyiapkan && <Memuat />}
        {kamera.status.tahap === 'galat-kamera' && (
          <LayarKendala
            {...PENJELASAN_GALAT_KAMERA[kamera.status.jenis]}
            onUlangi={kamera.ulangi}
            kembali={urlDetail(def.id, target)}
          />
        )}
        {tahap === 'galat-model' && (
          <LayarKendala
            judul="Pendeteksi gerak belum siap"
            isi="Bagian aplikasi yang mengenali gerakan belum berhasil dimuat. Pastikan internet menyala untuk pemakaian pertama, lalu ketuk Coba Lagi."
            onUlangi={kamera.ulangi}
            kembali={urlDetail(def.id, target)}
          />
        )}
        {akhir && (
          <LayarAkhir
            akhir={akhir}
            target={target}
            onSimpanUlang={(h) => {
              setAkhir({ tahap: 'menyimpan' });
              simpanLaluRingkasan(h, 0);
            }}
          />
        )}
      </div>

      {/* Hitungan besar dengan latar padat agar terbaca di atas video apa pun. Disembunyikan saat memuat/kendala. */}
      {(tahap === 'berjalan' || akhir) && (
        <section className="z-20 shrink-0 rounded-t-3xl bg-white px-5 pt-3 text-teks safe-bottom" aria-label="Hitungan repetisi">
          <div className="flex items-end justify-between gap-4">
            <p className="tabular leading-none" aria-live="polite">
              <span className="text-[4.5rem] font-extrabold text-primer">{tampilan.repetisi}</span>
              <span className="ml-2 text-[2rem] font-bold text-teks-2">/ {target}</span>
              <span className="sr-only"> repetisi</span>
            </p>
            <p className="pb-2 text-right text-[1.05rem] font-semibold text-teks-2">Repetisi</p>
          </div>
          <div className="mt-2">
            <div className="h-5 overflow-hidden rounded-full bg-primer-terang" aria-hidden>
              <div ref={barRef} className="h-full origin-left rounded-full bg-primer" style={{ transform: 'scaleX(0)' }} />
            </div>
            <p className="mt-1 flex justify-between text-[0.9rem] text-teks-2">
              <span>Gerakan</span>
              <span>Puncak</span>
            </p>
          </div>
        </section>
      )}
    </main>
  );
}

function Kesiapan({ siap, terlihat, petunjuk }: { siap: boolean; terlihat: boolean; petunjuk: string }) {
  const judul = siap ? 'Tubuh terdeteksi. Siap!' : terlihat ? 'Tubuh terdeteksi. Tahan sebentar…' : 'Posisikan tubuh Anda di dalam bingkai';
  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center p-4">
      <div
        className={`absolute inset-5 rounded-[28px] border-4 border-dashed ${siap ? 'border-sukses' : terlihat ? 'border-white' : 'border-white/70'}`}
        aria-hidden
      />
      <div role="status" aria-live="polite" className="relative mt-4 max-w-sm rounded-kartu bg-primer-tua/90 px-5 py-3 text-center">
        <p className="flex items-center justify-center gap-2 text-[1.3rem] font-bold leading-snug">
          {siap && <CheckCircle size={28} weight="fill" className="shrink-0 text-sukses-terang" aria-hidden />}
          {judul}
        </p>
        {!terlihat && <p className="mt-1 text-[1rem] text-white/85">{petunjuk}</p>}
      </div>
    </div>
  );
}

function Memuat() {
  return (
    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-5 bg-primer-tua px-6 text-center">
      {/* Siluet skeleton tenang sebagai penanda memuat; denyut mati otomatis bila gerak dikurangi. */}
      <svg viewBox="0 0 100 120" className="h-40 w-auto animate-pulse" aria-hidden>
        <g stroke="rgba(255,255,255,0.55)" strokeWidth={5} strokeLinecap="round" fill="none">
          <circle cx={50} cy={16} r={9} />
          <line x1={30} y1={38} x2={70} y2={38} />
          <polyline points="30,38 24,62 22,84" />
          <polyline points="70,38 76,62 78,84" />
          <line x1={50} y1={38} x2={50} y2={70} />
          <line x1={38} y1={72} x2={62} y2={72} />
          <polyline points="38,72 36,96 36,116" />
          <polyline points="62,72 64,96 64,116" />
        </g>
      </svg>
      <div role="status" aria-live="polite">
        <p className="text-[1.3rem] font-bold">Menyiapkan kamera…</p>
        <p className="mt-1 text-white/80">Bila diminta, pilih Izinkan agar kamera bisa melihat gerakan Anda.</p>
      </div>
    </div>
  );
}

function LayarKendala({ judul, isi, langkah, onUlangi, kembali }: { judul: string; isi: string; langkah?: string[]; onUlangi: () => void; kembali: string }) {
  return (
    <div className="absolute inset-0 z-20 overflow-y-auto bg-latar text-teks">
      <div className="mx-auto flex min-h-full max-w-md flex-col justify-center gap-4 px-5 py-6">
        <CameraSlash size={56} weight="bold" className="text-primer" aria-hidden />
        <h2 className="text-[1.6rem] font-extrabold leading-tight">{judul}</h2>
        <p>{isi}</p>
        {langkah && (
          <ol className="space-y-2 rounded-kartu border border-garis bg-white p-4 shadow-tipis">
            {langkah.map((l, i) => (
              <li key={i} className="flex gap-3">
                <span className="tabular grid size-8 shrink-0 place-items-center rounded-full bg-primer text-[0.95rem] font-bold text-white">{i + 1}</span>
                <span className="pt-0.5">{l}</span>
              </li>
            ))}
          </ol>
        )}
        <div className="mt-2 space-y-3">
          <BigButton onClick={onUlangi} ikon={<ArrowClockwise size={24} weight="bold" aria-hidden />}>
            Coba Lagi
          </BigButton>
          <BigLink to={kembali} replace varian="garis">
            Kembali ke Detail Latihan
          </BigLink>
        </div>
      </div>
    </div>
  );
}

function LayarAkhir({ akhir, target, onSimpanUlang }: { akhir: NonNullable<Akhir>; target: number; onSimpanUlang: (h: TrackerResult) => void }) {
  if (akhir.tahap === 'galat-simpan') {
    return (
      <div className="absolute inset-0 z-20 flex flex-col justify-center gap-4 bg-latar px-5 text-teks">
        <h2 className="text-[1.6rem] font-extrabold">Hasil belum tersimpan</h2>
        <p>Latihan Anda sudah selesai, tetapi hasilnya belum berhasil disimpan di ponsel ini.</p>
        <BigButton onClick={() => onSimpanUlang(akhir.hasil)} ikon={<ArrowClockwise size={24} weight="bold" aria-hidden />}>
          Coba Simpan Lagi
        </BigButton>
      </div>
    );
  }
  const rayakan = akhir.tahap === 'perayaan';
  return (
    <div role="status" aria-live="polite" className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-primer px-6 text-center">
      {rayakan && <HandsClapping size={80} weight="fill" className="text-aksen-terang" aria-hidden />}
      <p className="text-[2.2rem] font-extrabold leading-tight">{rayakan ? 'Hebat!' : 'Latihan selesai'}</p>
      {rayakan && <p className="text-[1.3rem] font-semibold">Target {target} kali tercapai.</p>}
      <p className="text-white/80">Menyimpan hasil latihan…</p>
    </div>
  );
}
