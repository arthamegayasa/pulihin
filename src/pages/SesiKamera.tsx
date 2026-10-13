import {
  ArrowClockwise,
  ArrowLeft,
  ArrowsLeftRight,
  CameraSlash,
  CheckCircle,
  CircleNotch,
  HandsClapping,
  Info,
  PersonSimple,
  StopCircle,
  WarningCircle,
} from '@phosphor-icons/react';
import { useCallback, useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { BigButton, BigLink } from '@/components/BigButton';
import { addRepLogs, deleteSession, putSession } from '@/data/db';
import { PENJELASAN_GALAT_KAMERA } from '@/features/pose/camera';
import { getExercise } from '@/features/pose/exerciseDefinitions';
import { angkaKeKata, daftarTitik } from '@/features/pose/labels';
import { sisiLawan } from '@/features/pose/landmarks';
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

const PESAN_TERLALU_CEPAT = { judul: 'Gerakan tadi belum terhitung.', sub: 'Coba sekali lagi, pelan pelan.' };
const PESAN_RENTANG_KURANG = { judul: 'Gerakan tadi belum terhitung.', sub: 'Coba angkat sedikit lebih jauh bila mampu.' };
const LAMA_PESAN_LEMBUT_MS = 3500;
const LAMA_SIAP_MS = 1800;
const LAMA_PERAYAAN_MS = 1800;
/** Tawaran ganti sisi tetap tampil sebentar setelah sinyal hilang agar tidak berkedip. */
const LAMA_TAWAR_GANTI_MS = 2500;
const TANPA_TITIK: readonly number[] = [];

/**
 * Sesi Kamera (Bab 5.1 langkah 3-7), layar penuh di luar AppShell.
 * Tata letak: seluruh gambar kamera tampil (contain, letterbox gelap) agar tidak ada anggota tubuh terpotong;
 * semua pesan berada di panel padat di LUAR gambar sehingga tidak pernah menutupi tubuh.
 * Potret: video di atas, panel di bawah. Lanskap/desktop: video besar di kiri, panel di kanan.
 *
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
  /** Sisi pilihan tidak terlihat tetapi sisi lain terlihat, sebelum repetisi pertama. */
  tawarGanti: boolean;
}

const TAMPILAN_AWAL: Tampilan = { repetisi: 0, siap: false, tubuhTerlihat: false, koreksi: null, tawarGanti: false };

const samaTampilan = (a: Tampilan, b: Tampilan) =>
  a.repetisi === b.repetisi &&
  a.siap === b.siap &&
  a.tubuhTerlihat === b.tubuhTerlihat &&
  a.tawarGanti === b.tawarGanti &&
  a.koreksi?.id === b.koreksi?.id &&
  a.koreksi?.sejak === b.koreksi?.sejak;

type Akhir = { tahap: 'perayaan' } | { tahap: 'menyimpan' } | { tahap: 'galat-simpan'; hasil: TrackerResult } | null;

interface Pesan {
  judul: string;
  sub?: string;
}

function Sesi({ def }: { def: ExerciseDefinition }) {
  const navigate = useNavigate();
  const [cari, setCari] = useSearchParams();
  const [awal] = useState(() => {
    const target = bacaTarget(cari.get('target'), def.targetRepetisiDefault);
    const sisi: Sisi = bacaSisi(cari.get('sisi'), getPrefs().sisiLatihan);
    return { target, sisi, sessionId: newId('sesi') };
  });
  const { target, sessionId } = awal;
  const [sisi, setSisi] = useState<Sisi>(awal.sisi);
  const sisiRef = useRef(sisi);
  sisiRef.current = sisi;

  const trackerRef = useRef<ExerciseTracker | null>(null);
  trackerRef.current ??= createTracker(def, { sisi: awal.sisi, targetRepetisi: target });

  const [tampilan, setTampilan] = useState<Tampilan>(TAMPILAN_AWAL);
  const [pesanLembut, setPesanLembut] = useState<Pesan | null>(null);
  const [baruSiap, setBaruSiap] = useState(false);
  const [akhir, setAkhir] = useState<Akhir>(null);

  const selesaiRef = useRef(false);
  const repRef = useRef(0);
  const siapRef = useRef(false);
  /** Pengingat keselamatan diucapkan sekali per sesi, pada siap pertama (tidak diulang saat ganti sisi). */
  const pengingatRef = useRef(false);
  const sisiLainTerakhirRef = useRef(Number.NEGATIVE_INFINITY);
  const tawarDiucapkanRef = useRef(false);
  const dasarRef = useRef<Session | null>(null);
  const sesiAwalRef = useRef<Promise<void> | null>(null);
  const barRef = useRef<HTMLDivElement | null>(null);
  const hidupRef = useRef(true);
  const timerLembut = useRef(0);
  const timerSiap = useRef(0);
  const pilihSisi = def.sisi === 'pilih';

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
    const s: TrackerSnapshot = tracker.update(frame, t);

    // Bar progres ditulis langsung ke DOM: tanpa render ulang React per frame.
    if (barRef.current) barRef.current.style.transform = `scaleX(${clamp(s.progres, 0, 1)})`;
    if (s.siap && !siapRef.current) {
      siapRef.current = true;
      const pertama = !pengingatRef.current;
      pengingatRef.current = true;
      setBaruSiap(true);
      window.clearTimeout(timerSiap.current);
      timerSiap.current = window.setTimeout(() => setBaruSiap(false), LAMA_SIAP_MS);
      // Pengingat keselamatan diucapkan sebelum "Silakan mulai" agar terdengar utuh sebelum hitungan pertama.
      speak(
        pertama
          ? `Tubuh terdeteksi. ${pengingatKeselamatan(def.wajibBerpegangan)} Silakan mulai pelan pelan.`
          : 'Tubuh terdeteksi. Siap. Silakan mulai pelan pelan.',
      );
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
      speak(`${pesan.judul} ${pesan.sub}`, { interrupt: false });
    }

    if (pilihSisi && s.sisiLainTerlihat === true) sisiLainTerakhirRef.current = t;
    const tawarGanti = pilihSisi && !s.siap && repRef.current === 0 && t - sisiLainTerakhirRef.current < LAMA_TAWAR_GANTI_MS;
    if (tawarGanti && !tawarDiucapkanRef.current) {
      tawarDiucapkanRef.current = true;
      speak(pesanSisi(sisiRef.current).ucap);
    }
    const baru: Tampilan = { repetisi: s.repetisi, siap: s.siap, tubuhTerlihat: s.tubuhTerlihat, koreksi: s.koreksi, tawarGanti };
    setTampilan((prev) => (samaTampilan(prev, baru) ? prev : baru));

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
      sisi: pilihSisi ? sisiRef.current : null,
      isDemo: false,
    };
    dasarRef.current = dasar;
    sesiAwalRef.current = putSession(dasar).catch((e: unknown) => console.error('Sesi belum tercatat', e));
    speak('Posisikan tubuh Anda di dalam bingkai.');
  }, [tahap, sessionId, def.id, pilihSisi, target]);

  // Keluar tanpa Berhenti (tombol kembali perangkat) sebelum repetisi pertama: buang catatan kosong.
  useEffect(() => {
    hidupRef.current = true;
    return () => {
      hidupRef.current = false;
      window.clearTimeout(timerLembut.current);
      window.clearTimeout(timerSiap.current);
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
    navigate(urlDetail(def.id, target, pilihSisi ? sisiRef.current : undefined), { replace: true });
  };

  /** Ganti sisi sebelum repetisi pertama: tracker baru untuk sisi lain, catatan sesi & URL ikut diperbarui. */
  const gantiSisi = () => {
    if (selesaiRef.current || repRef.current > 0) return;
    const baru = sisiLawan(sisi);
    trackerRef.current = createTracker(def, { sisi: baru, targetRepetisi: target });
    siapRef.current = false;
    sisiLainTerakhirRef.current = Number.NEGATIVE_INFINITY;
    tawarDiucapkanRef.current = false;
    if (barRef.current) barRef.current.style.transform = 'scaleX(0)';
    setSisi(baru);
    setTampilan(TAMPILAN_AWAL);
    setCari(
      (p) => {
        const q = new URLSearchParams(p);
        q.set('sisi', baru);
        return q;
      },
      { replace: true },
    );
    const dasar = dasarRef.current;
    if (dasar) {
      const diperbarui = { ...dasar, sisi: baru };
      dasarRef.current = diperbarui;
      sesiAwalRef.current = (sesiAwalRef.current ?? Promise.resolve())
        .then(() => putSession(diperbarui))
        .catch((e: unknown) => console.error('Sisi sesi belum tercatat', e));
    }
    speak(`Baik, sekarang sisi ${baru}. Posisikan tubuh Anda di dalam bingkai.`, { interrupt: true });
  };

  const berjalan = tahap === 'berjalan' && !akhir;
  const sedangMenyiapkan = tahap === 'siaga' || tahap === 'menyiapkan';
  // Layar kendala: kamera tidak menyala, jadi satu-satunya tindakan utama adalah Coba Lagi (Berhenti disembunyikan).
  const adaKendala = tahap === 'galat-kamera' || tahap === 'galat-model';
  const namaSisi = pilihSisi ? (sisi === 'kanan' ? 'Kanan' : 'Kiri') : null;
  const modePanduan = !tampilan.siap || tampilan.tawarGanti;
  const statusBingkai = tampilan.siap ? 'siap' : tampilan.tubuhTerlihat ? 'terlihat' : 'cari';
  const kembaliKeDetail = urlDetail(def.id, target, pilihSisi ? sisi : undefined);

  return (
    <main className="fixed inset-0 flex flex-col bg-primer-tua text-white">
      {/* Bilah atas: nama latihan + Berhenti yang selalu terlihat selama kamera dapat menyala (AC-F1-7). */}
      <header
        className="z-30 flex shrink-0 items-center gap-3 bg-primer-tua px-4 py-2"
        style={{ paddingTop: 'max(0.5rem, env(safe-area-inset-top))' }}
      >
        <div className="min-w-0 flex-1">
          <h1 className="line-clamp-2 text-[1.5rem] font-extrabold leading-[1.15]">{def.nama}</h1>
          {namaSisi && <p className="text-[1rem] font-semibold text-white/85">Sisi {namaSisi}</p>}
        </div>
        {!adaKendala && (
          <BigButton varian="bahaya" penuh={false} onClick={berhenti} ikon={<StopCircle size={26} weight="fill" aria-hidden />} className="shrink-0 gap-2! px-4!">
            Berhenti
          </BigButton>
        )}
      </header>

      <div className="flex min-h-0 flex-1 flex-col landscape:flex-row">
        {/* Panggung video: kotak mengikuti rasio kamera (container query) sehingga gambar utuh & overlay tepat. */}
        <div className="relative min-h-0 min-w-0 flex-1 bg-[#0a2523] [container-type:size]">
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 overflow-hidden bg-black"
            style={
              kamera.rasio
                ? { width: `min(100cqw, 100cqh * ${kamera.rasio.toFixed(4)})`, aspectRatio: String(kamera.rasio) }
                : { width: '100%', height: '100%' }
            }
          >
            {/* Elemen selalu ada di DOM agar Coba Lagi dapat menyalakan kamera lagi. */}
            <video ref={kamera.videoRef} className="absolute inset-0 size-full -scale-x-100 object-contain" playsInline muted aria-hidden />
            <canvas ref={kamera.canvasRef} className="pointer-events-none absolute inset-0 size-full" aria-hidden />
            {berjalan && (modePanduan || baruSiap) && (
              <div
                className={`pointer-events-none absolute inset-[3%] rounded-[24px] border-4 border-dashed transition-colors ${
                  statusBingkai === 'siap' ? 'border-sukses-terang' : statusBingkai === 'terlihat' ? 'border-white' : 'border-white/60'
                }`}
                aria-hidden
              />
            )}
          </div>

          {sedangMenyiapkan && <Memuat />}
          {kamera.status.tahap === 'galat-kamera' && (
            <LayarKendala {...PENJELASAN_GALAT_KAMERA[kamera.status.jenis]} onUlangi={kamera.ulangi} kembali={kembaliKeDetail} />
          )}
          {tahap === 'galat-model' && (
            <LayarKendala
              judul="Pendeteksi gerak belum siap"
              isi="Bagian aplikasi yang mengenali gerakan belum berhasil dimuat. Pastikan internet menyala untuk pemakaian pertama, lalu ketuk Coba Lagi."
              onUlangi={kamera.ulangi}
              kembali={kembaliKeDetail}
            />
          )}
        </div>

        {/* Panel padat: pesan + hitungan. Tidak pernah berada di atas gambar kamera. */}
        {berjalan && (
          <section
            aria-label="Panduan dan hitungan"
            className="z-20 flex min-h-[15.25rem] shrink-0 flex-col bg-white text-teks safe-bottom rounded-t-3xl landscape:min-h-0 landscape:w-[clamp(17rem,34vw,27rem)] landscape:rounded-none landscape:overflow-y-auto"
          >
            {modePanduan ? (
              <PanelPanduan
                status={statusBingkai}
                petunjuk={`Pastikan ${daftarTitik(def.titikKunci)} terlihat.`}
                tawarGanti={tampilan.tawarGanti ? { ...pesanSisi(sisi), onGanti: gantiSisi } : null}
              />
            ) : (
              <PanelHitung
                repetisi={tampilan.repetisi}
                target={target}
                barRef={barRef}
                pesan={
                  baruSiap ? (
                    <Banner jenis="sukses" judul="Siap! Silakan mulai pelan pelan." />
                  ) : tampilan.koreksi ? (
                    <Banner jenis="koreksi" judul={tampilan.koreksi.pesan} />
                  ) : pesanLembut ? (
                    <Banner jenis="lembut" judul={pesanLembut.judul} sub={pesanLembut.sub} />
                  ) : (
                    <Banner
                      jenis="tenang"
                      judul="Lanjutkan pelan pelan."
                      sub={`Berhenti bila nyeri atau pusing.${def.wajibBerpegangan ? ' Tetap berpegangan.' : ''}`}
                    />
                  )
                }
              />
            )}
            {/* Layar lebar (laptop): ruang sisa panel dipakai untuk langkah gerakan sebagai pengingat. */}
            <div className="mx-5 mb-5 mt-auto hidden border-t border-garis pt-4 landscape:lg:block">
              <h2 className="mb-2 text-[1rem] font-bold text-teks-2">Cara melakukan</h2>
              <ol className="space-y-2">
                {def.panduanLangkah.map((langkah, i) => (
                  <li key={i} className="flex gap-3 text-[0.95rem] leading-snug">
                    <span className="tabular grid size-7 shrink-0 place-items-center rounded-full bg-primer-terang text-[0.95rem] font-bold text-primer">
                      {i + 1}
                    </span>
                    <span className="pt-0.5">{langkah}</span>
                  </li>
                ))}
              </ol>
            </div>
          </section>
        )}
      </div>

      {akhir && (
        <LayarAkhir
          akhir={akhir}
          target={target}
          repetisi={tampilan.repetisi}
          onSimpanUlang={(h) => {
            setAkhir({ tahap: 'menyimpan' });
            simpanLaluRingkasan(h, 0);
          }}
        />
      )}
    </main>
  );
}

/** Pengingat keselamatan yang diucapkan sekali saat sesi dimulai (Bab 17.2); latihan berdiri ditambah berpegangan. */
function pengingatKeselamatan(wajibBerpegangan: boolean): string {
  return `Ingat, berhenti bila terasa nyeri atau pusing.${wajibBerpegangan ? ' Tetap berpegangan.' : ''}`;
}

function pesanSisi(sisi: Sisi) {
  const lawan = sisiLawan(sisi);
  return {
    judul: `Sisi ${sisi} belum terlihat.`,
    sub: `Hadapkan badan ke kamera, atau latih sisi ${lawan}.`,
    tombol: `Ganti ke sisi ${lawan}`,
    ucap: `Sisi ${sisi} belum terlihat. Hadapkan badan ke kamera, atau latih sisi ${lawan}.`,
  };
}

type JenisBanner = 'koreksi' | 'lembut' | 'sukses' | 'tenang';

const GAYA_BANNER: Record<JenisBanner, { kotak: string; ikon: ReactNode }> = {
  koreksi: {
    kotak: 'border-peringatan bg-peringatan-terang',
    ikon: <WarningCircle size={30} weight="fill" className="mt-0.5 shrink-0 text-peringatan" aria-hidden />,
  },
  lembut: {
    kotak: 'border-primer bg-primer-terang',
    ikon: <Info size={30} weight="fill" className="mt-0.5 shrink-0 text-primer" aria-hidden />,
  },
  sukses: {
    kotak: 'border-sukses bg-sukses-terang',
    ikon: <CheckCircle size={30} weight="fill" className="mt-0.5 shrink-0 text-sukses" aria-hidden />,
  },
  tenang: {
    kotak: 'border-transparent bg-latar',
    ikon: <CheckCircle size={28} weight="bold" className="mt-0.5 shrink-0 text-primer" aria-hidden />,
  },
};

/**
 * Ukuran judul menurut panjang teks agar pesan koreksi terpanjang (Bab 7.3, mis. "Sedikit lagi, angkat lebih
 * tinggi bila mampu") tetap muat dua baris di layar 360px; tidak pernah di bawah 1,3rem.
 */
function ukuranJudul(judul: string): string {
  if (judul.length <= 32) return 'text-[1.5rem]';
  if (judul.length <= 40) return 'text-[1.375rem]';
  return 'text-[1.3rem]';
}

/** Satu pesan pada satu waktu, maksimal dua baris judul di layar 360px; koreksi ditulis besar (>= 1,3rem). */
function Banner({ jenis, judul, sub }: { jenis: JenisBanner; judul: string; sub?: string }) {
  const gaya = GAYA_BANNER[jenis];
  const tenang = jenis === 'tenang';
  return (
    <div role="status" aria-live="polite" className={`flex items-start gap-2 rounded-kartu border-l-[6px] px-3 py-2.5 ${gaya.kotak}`}>
      {gaya.ikon}
      <div className="min-w-0">
        <p className={`leading-tight ${tenang ? 'text-[1.15rem] font-bold text-teks-2' : `font-extrabold text-teks ${ukuranJudul(judul)}`}`}>{judul}</p>
        {sub && <p className="mt-0.5 text-[1.05rem] font-semibold leading-snug text-teks-2">{sub}</p>}
      </div>
    </div>
  );
}

function PanelPanduan({
  status,
  petunjuk,
  tawarGanti,
}: {
  status: 'cari' | 'terlihat' | 'siap';
  petunjuk: string;
  tawarGanti: { judul: string; sub: string; tombol: string; onGanti: () => void } | null;
}) {
  if (tawarGanti) {
    return (
      <div className="flex flex-1 flex-col justify-center gap-3 px-4 pb-3 pt-4">
        <div role="status" aria-live="polite" className="flex items-start gap-3">
          <ArrowsLeftRight size={36} weight="bold" className="mt-0.5 shrink-0 text-peringatan" aria-hidden />
          <div>
            <p className="text-[1.5rem] font-extrabold leading-tight">{tawarGanti.judul}</p>
            <p className="mt-1 text-[1.05rem] font-semibold leading-snug text-teks-2">{tawarGanti.sub}</p>
          </div>
        </div>
        <BigButton varian="garis" onClick={tawarGanti.onGanti} ikon={<ArrowsLeftRight size={24} weight="bold" aria-hidden />}>
          {tawarGanti.tombol}
        </BigButton>
      </div>
    );
  }
  const terlihat = status !== 'cari';
  return (
    <div role="status" aria-live="polite" className="flex flex-1 flex-col justify-center gap-2 px-5 pb-3 pt-4">
      <p className="flex items-center gap-3 text-[1.5rem] font-extrabold leading-tight">
        {terlihat ? (
          <CircleNotch size={34} weight="bold" className="shrink-0 animate-spin text-sukses motion-reduce:animate-none" aria-hidden />
        ) : (
          <PersonSimple size={34} weight="bold" className="shrink-0 text-primer" aria-hidden />
        )}
        {terlihat ? 'Tubuh terdeteksi. Tahan sebentar…' : 'Posisikan tubuh di dalam bingkai'}
      </p>
      <p className="text-[1.05rem] font-semibold leading-snug text-teks-2">{terlihat ? 'Hitungan dimulai sebentar lagi.' : petunjuk}</p>
    </div>
  );
}

function PanelHitung({
  repetisi,
  target,
  barRef,
  pesan,
}: {
  repetisi: number;
  target: number;
  barRef: RefObject<HTMLDivElement | null>;
  pesan: ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col justify-end gap-2 px-3 pt-3 landscape:justify-start landscape:gap-4 landscape:px-5 landscape:pt-5">
      {/* Potret: pesan tepat di atas hitungan (ruang tetap agar video tidak melompat). Lanskap: hitungan di atas, pesan di bawah. */}
      <div className="flex min-h-[6.4rem] flex-col justify-end landscape:order-2 landscape:min-h-0 landscape:justify-start">{pesan}</div>
      <div className="landscape:order-1">
        <div className="flex items-end justify-between gap-4">
          <p className="tabular leading-none" aria-live="polite">
            <span className="text-[4.25rem] font-extrabold text-primer landscape:lg:text-[6.5rem]">{repetisi}</span>
            <span className="ml-2 text-[2rem] font-bold text-teks-2 landscape:lg:text-[2.6rem]">/ {target}</span>
            <span className="sr-only"> repetisi</span>
          </p>
          <p className="pb-2 text-right text-[1.05rem] font-semibold text-teks-2">Repetisi</p>
        </div>
        <div className="mt-2" aria-hidden>
          <div className="h-5 overflow-hidden rounded-full bg-primer-terang ring-1 ring-primer-garis ring-inset">
            <div ref={barRef} className="h-full origin-left rounded-full bg-primer" style={{ transform: 'scaleX(0)' }} />
          </div>
          <p className="mt-1 flex justify-between text-[0.95rem] font-semibold text-teks-2">
            <span>Posisi awal</span>
            <span>Puncak gerakan</span>
          </p>
        </div>
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

/**
 * Kendala kamera/model: satu tindakan utama (Coba Lagi) tetap di bawah layar; jalan keluar sekunder
 * "Kembali ke Detail Latihan" berupa tautan teks di atas sehingga selalu terlihat tanpa menggulir.
 */
function LayarKendala({ judul, isi, langkah, onUlangi, kembali }: { judul: string; isi: string; langkah?: string[]; onUlangi: () => void; kembali: string }) {
  return (
    <div className="absolute inset-0 z-20 flex flex-col bg-latar text-teks">
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-md flex-col gap-3 px-5 pb-5 pt-1">
          <BigLink to={kembali} replace varian="teks" penuh={false} ikon={<ArrowLeft size={22} weight="bold" aria-hidden />} className="-ml-3 self-start justify-start! px-3! text-left!">
            Kembali ke Detail Latihan
          </BigLink>
          <div className="flex items-center gap-3">
            <CameraSlash size={44} weight="bold" className="shrink-0 text-primer" aria-hidden />
            <h2 className="text-[1.5rem] font-extrabold leading-tight">{judul}</h2>
          </div>
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
        </div>
      </div>
      <div className="shrink-0 border-t border-garis bg-latar px-5 pt-3 safe-bottom">
        <div className="mx-auto max-w-md">
          <BigButton onClick={onUlangi} ikon={<ArrowClockwise size={24} weight="bold" aria-hidden />}>
            Coba Lagi
          </BigButton>
        </div>
      </div>
    </div>
  );
}

function LayarAkhir({
  akhir,
  target,
  repetisi,
  onSimpanUlang,
}: {
  akhir: NonNullable<Akhir>;
  target: number;
  repetisi: number;
  onSimpanUlang: (h: TrackerResult) => void;
}) {
  // Muncul lembut (skala + pudar); transisi otomatis mati bila gerak dikurangi (index.css).
  const [muncul, setMuncul] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMuncul(true));
    return () => cancelAnimationFrame(id);
  }, []);

  if (akhir.tahap === 'galat-simpan') {
    return (
      <div className="fixed inset-0 z-40 flex flex-col justify-center gap-4 bg-latar px-5 text-teks">
        <div className="mx-auto w-full max-w-md space-y-4">
          <h2 className="text-[1.6rem] font-extrabold">Hasil belum tersimpan</h2>
          <p>Latihan Anda sudah selesai, tetapi hasilnya belum berhasil disimpan di ponsel ini.</p>
          <BigButton onClick={() => onSimpanUlang(akhir.hasil)} ikon={<ArrowClockwise size={24} weight="bold" aria-hidden />}>
            Coba Simpan Lagi
          </BigButton>
        </div>
      </div>
    );
  }
  const rayakan = akhir.tahap === 'perayaan';
  return (
    <div role="status" aria-live="polite" className="fixed inset-0 z-40 flex flex-col items-center justify-center bg-primer px-6 text-center text-white">
      <div className={`flex flex-col items-center gap-3 transition-[transform,opacity] duration-500 ease-out ${muncul ? 'scale-100 opacity-100' : 'scale-90 opacity-0'}`}>
        {rayakan ? (
          <span className="grid size-32 place-items-center rounded-full bg-white/10 ring-4 ring-aksen-terang/40">
            <HandsClapping size={76} weight="fill" className="text-aksen-terang" aria-hidden />
          </span>
        ) : (
          <CheckCircle size={80} weight="fill" className="text-sukses-terang" aria-hidden />
        )}
        <p className="mt-2 text-[3rem] font-extrabold leading-none">{rayakan ? 'Hebat!' : 'Latihan selesai'}</p>
        <p className="text-[1.4rem] font-semibold">
          {rayakan ? `Target ${target} kali tercapai.` : `${repetisi} dari ${target} kali tercatat.`}
        </p>
        {rayakan && (
          <p className="tabular mt-1 rounded-full bg-white/10 px-5 py-1.5 text-[1.6rem] font-extrabold">
            {repetisi} / {target}
          </p>
        )}
      </div>
      <p className="mt-8 flex items-center gap-2 text-white/85">
        <CircleNotch size={22} weight="bold" className="animate-spin motion-reduce:animate-none" aria-hidden />
        Menyimpan hasil latihan…
      </p>
    </div>
  );
}
