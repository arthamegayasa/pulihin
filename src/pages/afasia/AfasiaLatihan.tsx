import {
  ArrowCounterClockwise,
  ArrowRight,
  CheckCircle,
  CircleHalf,
  Hand,
  Microphone,
  MicrophoneSlash,
  SkipForward,
  SpeakerHigh,
  Sparkle,
  Stop,
} from '@phosphor-icons/react';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { BigButton } from '@/components/BigButton';
import { Card } from '@/components/Card';
import { PageHeader } from '@/components/PageHeader';
import { addSpeechAttempt, putSession } from '@/data/db';
import { todayISO } from '@/lib/date';
import { newId } from '@/lib/id';
import { getPrefs } from '@/lib/prefs';
import { cancelSpeech, speak } from '@/lib/speak';
import { PATHS } from '@/router-paths';
import type { HasilKata, Session, SpeechAttempt } from '@/types';
import { buatPenjagaUcapan, putarContohKata } from '@/features/speech/contohKata';
import { GambarKata } from '@/features/speech/GambarKata';
import { useModeMandiriDipilih } from '@/features/speech/modeMandiri';
import { saranSesiAfasia } from '@/features/speech/pesanAfasia';
import { pilihKataSesi } from '@/features/speech/pilihKata';
import {
  type GalatPengenalan,
  type HasilPengenalan,
  isSpeechRecognitionSupported,
  mulaiDengar,
  type SesiDengar,
} from '@/features/speech/recognizer';
import { muatRiwayatAfasia } from '@/features/speech/riwayat';
import {
  KONFIG_PENILAIAN,
  nilaiUcapan,
  type PercobaanRingkas,
  ringkasSesi,
  skorPercobaan,
} from '@/features/speech/SpeechScorer';
import type { Kata } from '@/features/speech/types';
import { getKategori, isKategoriKata, petunjukSukuKata } from '@/features/speech/wordBank';

type Fase =
  | { jenis: 'siap' }
  | { jenis: 'mendengar'; sementara: string }
  | { jenis: 'umpan'; hasil: HasilKata; teks: string; latensiMs: number | null; nomor: number; akhir: boolean }
  | { jenis: 'galat'; galat: GalatPengenalan };

interface Persiapan {
  sesi: Session;
  daftar: Kata[];
}

const MAKS = KONFIG_PENILAIAN.maksPercobaan;

function formatDetik(ms: number): string {
  return (ms / 1000).toFixed(1).replace('.', ',');
}

export default function AfasiaLatihan() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const kategoriParam = params.get('kategori');
  const kategori = isKategoriKata(kategoriParam) ? kategoriParam : null;
  const judul = kategori ? (getKategori(kategori)?.nama ?? 'Latihan Bicara') : 'Latihan Hari Ini';
  // Info teknis (latensi penilaian) hanya untuk penguji: tambahkan ?uji=1 di alamat.
  const modeUji = params.get('uji') === '1';

  const [didukung] = useState(isSpeechRecognitionSupported);
  const mandiriDipilih = useModeMandiriDipilih();
  const [beralihMandiri, setBeralihMandiri] = useState(false);
  const modeMandiri = !didukung || mandiriDipilih || beralihMandiri;

  const [persiapan, setPersiapan] = useState<Persiapan | null>(null);
  const [galatMuat, setGalatMuat] = useState<string | null>(null);
  const [indeks, setIndeks] = useState(0);
  const [percobaan, setPercobaan] = useState(0);
  const [fase, setFase] = useState<Fase>({ jenis: 'siap' });
  const [menyimpan, setMenyimpan] = useState(false);
  const [galatSimpan, setGalatSimpan] = useState<string | null>(null);
  const [penjaga] = useState(buatPenjagaUcapan);
  // Berapa kali berturut-turut ucapan tidak terdengar; setelah dua kali, tawarkan Mode Latihan Mandiri sebagai jalan keluar
  // (mis. layanan pengenal suara diam tanpa hasil maupun galat).
  const [diamBeruntun, setDiamBeruntun] = useState(0);

  const catatanRef = useRef<PercobaanRingkas[]>([]);
  const simpananRef = useRef<Promise<void>[]>([]);
  // Session baru ditulis saat percobaan pertama tercatat: layar yang hanya dibuka tidak meninggalkan sesi kosong.
  const sesiTersimpanRef = useRef<Promise<void> | null>(null);
  const dengarRef = useRef<SesiDengar | null>(null);

  // Siapkan 10 kata dan Session (belum disimpan) saat layar dibuka.
  useEffect(() => {
    let batal = false;
    (async () => {
      const patientId = getPrefs().activePatientId;
      const riwayat = await muatRiwayatAfasia(patientId);
      const daftar = pilihKataSesi({ kategori, riwayat, benih: `${todayISO()}|${kategori ?? 'campur'}` });
      if (batal) return;
      const sesi: Session = {
        id: newId('afasia'),
        patientId,
        tanggal: todayISO(),
        mulaiAt: Date.now(),
        selesaiAt: null,
        jenis: 'afasia',
        latihanId: null,
        kategoriKata: kategori,
        repetisiTarget: daftar.length,
        repetisiTercapai: 0,
        skor: 0,
        skorKomponen: null,
        ringkasanAfasia: null,
        durasiDetik: 0,
        selesai: false,
        saran: null,
        sisi: null,
        isDemo: false,
      };
      catatanRef.current = [];
      simpananRef.current = [];
      sesiTersimpanRef.current = null;
      setPersiapan({ sesi, daftar });
      setIndeks(0);
      setPercobaan(0);
      setFase({ jenis: 'siap' });
    })().catch(() => {
      if (!batal) setGalatMuat('Latihan belum bisa dimulai karena penyimpanan perangkat bermasalah. Coba muat ulang halaman.');
    });
    return () => {
      batal = true;
    };
  }, [kategori]);

  // Bersihkan mikrofon dan suara saat meninggalkan layar.
  useEffect(
    () => () => {
      dengarRef.current?.abort();
      penjaga.batalkan();
      cancelSpeech();
    },
    [penjaga],
  );

  if (galatMuat) {
    return (
      <section>
        <PageHeader judul={judul} kembali={PATHS.afasia} />
        <Card nada="peringatan">{galatMuat}</Card>
      </section>
    );
  }
  if (!persiapan) {
    return (
      <section>
        <PageHeader judul={judul} kembali={PATHS.afasia} />
        <p className="text-teks-2" aria-live="polite">
          Menyiapkan kata…
        </p>
      </section>
    );
  }

  const { sesi, daftar } = persiapan;
  const kata = daftar[indeks];
  const terakhir = indeks + 1 >= daftar.length;
  const petunjuk = petunjukSukuKata(kata);

  function hentikanDengar() {
    dengarRef.current?.abort();
    dengarRef.current = null;
  }

  /** Hentikan semua suara aplikasi, termasuk kalimat contoh yang belum sempat terputar. */
  function diamkan() {
    penjaga.batalkan();
    cancelSpeech();
  }

  function catatPercobaan(hasil: HasilKata, teksHasil: string, mode: SpeechAttempt['mode']) {
    const nomor = percobaan + 1;
    const skor = skorPercobaan(hasil, nomor);
    catatanRef.current.push({ kataId: kata.id, kategoriHasil: hasil, nomorPercobaan: nomor });
    // Satu percobaan yang gagal tersimpan tidak boleh menggagalkan seluruh sesi.
    sesiTersimpanRef.current ??= putSession(sesi);
    simpananRef.current.push(
      sesiTersimpanRef.current
        .then(() =>
          addSpeechAttempt({
            sessionId: sesi.id,
            kataId: kata.id,
            teksHasil,
            kategoriHasil: hasil,
            skor,
            nomorPercobaan: nomor,
            mode,
            at: Date.now(),
          }),
        )
        .catch((e: unknown) => console.warn('Percobaan afasia belum tersimpan', e)),
    );
    setPercobaan(nomor);
    return { nomor, akhir: hasil === 'benar' || nomor >= MAKS };
  }

  function umpanSuara(hasil: HasilKata, akhir: boolean) {
    penjaga.batalkan();
    if (hasil === 'benar') speak('Benar! Bagus sekali.');
    else if (akhir) speak('Tidak apa-apa. Kata ini kita ulang besok.');
    else if (hasil === 'hampir') speak(`Hampir. Coba lagi. ${kata.sukuKata.join('. ')}. ${kata.kata}.`, { rate: 0.8 });
    else speak('Coba sekali lagi, pelan-pelan.');
  }

  function terimaHasil(h: HasilPengenalan) {
    const penilaian = nilaiUcapan(kata, h.alternatif);
    const { nomor, akhir } = catatPercobaan(penilaian.hasil, penilaian.teks, 'suara');
    setDiamBeruntun(0);
    setFase({ jenis: 'umpan', hasil: penilaian.hasil, teks: penilaian.teks, latensiMs: h.latensiMs, nomor, akhir });
    umpanSuara(penilaian.hasil, akhir);
  }

  function mulaiBicara() {
    hentikanDengar();
    // Suara aplikasi dihentikan dulu agar tidak tertangkap mikrofon dan ikut dinilai.
    diamkan();
    setFase({ jenis: 'mendengar', sementara: '' });
    const sesiDengar = mulaiDengar({
      onSementara: (teks) => setFase({ jenis: 'mendengar', sementara: teks }),
      onHasil: terimaHasil,
      onGalat: (galat) => {
        setFase({ jenis: 'galat', galat });
        setDiamBeruntun((n) => (galat.kode === 'tidak-terdengar' ? n + 1 : 0));
      },
      onSelesai: () => {
        // Sesi dengar lama yang sudah dibatalkan tidak boleh mengubah tampilan sesi dengar baru.
        if (dengarRef.current !== sesiDengar) return;
        dengarRef.current = null;
        setFase((f) => (f.jenis === 'mendengar' ? { jenis: 'siap' } : f));
      },
    });
    dengarRef.current = sesiDengar;
  }

  function nilaiMandiri(hasil: 'benar' | 'belum') {
    const { nomor, akhir } = catatPercobaan(hasil, '', 'mandiri');
    setFase({ jenis: 'umpan', hasil, teks: '', latensiMs: null, nomor, akhir });
    umpanSuara(hasil, akhir);
  }

  function dengarContoh() {
    // Mikrofon ditutup dulu: kalimat contoh tidak boleh terdengar saat aplikasi sedang mendengarkan.
    hentikanDengar();
    setFase((f) => (f.jenis === 'mendengar' ? { jenis: 'siap' } : f));
    putarContohKata(kata, penjaga);
  }

  async function selesaikan() {
    setMenyimpan(true);
    setGalatSimpan(null);
    try {
      await Promise.all(simpananRef.current);
      const r = ringkasSesi(
        daftar.map((k) => k.id),
        catatanRef.current,
      );
      const selesaiAt = Date.now();
      await putSession({
        ...sesi,
        selesai: true,
        selesaiAt,
        repetisiTercapai: r.benar,
        skor: r.skor,
        ringkasanAfasia: { benar: r.benar, hampir: r.hampir, belum: r.belum, kataUlang: r.kataUlang },
        durasiDetik: Math.max(1, Math.round((selesaiAt - sesi.mulaiAt) / 1000)),
        saran: saranSesiAfasia(r),
      });
      navigate(PATHS.afasiaRingkasan(sesi.id), { replace: true });
    } catch {
      setMenyimpan(false);
      setGalatSimpan('Hasil belum tersimpan karena penyimpanan perangkat bermasalah. Tekan tombol di bawah untuk mencoba lagi.');
    }
  }

  function lanjut() {
    hentikanDengar();
    diamkan();
    if (terakhir) {
      void selesaikan();
      return;
    }
    setIndeks(indeks + 1);
    setPercobaan(0);
    setFase({ jenis: 'siap' });
  }

  function pakaiModeMandiri() {
    hentikanDengar();
    diamkan();
    setBeralihMandiri(true);
    setFase({ jenis: 'siap' });
  }

  const kataSelesai = fase.jenis === 'umpan' && fase.akhir;
  const mendengar = fase.jenis === 'mendengar';
  const ringkas = fase.jenis !== 'siap';
  const tombolLanjut = terakhir ? 'Lihat Hasil' : 'Kata Berikutnya';
  const tawarkanMandiri =
    !modeMandiri && fase.jenis === 'galat' && (fase.galat.sarankanMandiri || diamBeruntun >= 2);
  const selesaiKata = indeks + (kataSelesai ? 1 : 0);
  const percobaanKini = Math.min(percobaan + (kataSelesai ? 0 : 1), MAKS);

  return (
    <section className="flex min-h-[calc(100dvh-7rem)] flex-col">
      <PageHeader judul={judul} kembali={PATHS.afasia} />

      <div>
        <div className="flex items-center justify-between gap-2 text-[1rem]">
          <span className="font-bold whitespace-nowrap">
            Kata {indeks + 1} dari {daftar.length}
          </span>
          {modeMandiri ? (
            <span className="flex items-center gap-1.5 whitespace-nowrap text-teks-2">
              <Hand size={20} weight="bold" aria-hidden />
              Mandiri
            </span>
          ) : (
            <TitikPercobaan ke={percobaanKini} />
          )}
        </div>
        <div
          role="progressbar"
          aria-label="Kemajuan sesi"
          aria-valuemin={0}
          aria-valuemax={daftar.length}
          aria-valuenow={selesaiKata}
          className="mt-1.5 h-3 overflow-hidden rounded-full bg-primer-terang"
        >
          <div
            className="h-full rounded-full bg-primer motion-safe:transition-[width] motion-safe:duration-500"
            style={{ width: `${(selesaiKata / daftar.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Saat umpan balik tampil, gambar mengecil dan sejajar kata agar tombol utama tetap terlihat tanpa menggulir. */}
      <Card className="mt-2.5 flex flex-col items-center gap-2 py-3 text-center">
        {/* flex-wrap: kata panjang turun ke bawah gambar, bukan terpotong di tengah kata. */}
        <div
          className={
            ringkas
              ? 'flex w-full flex-wrap items-center justify-center gap-x-3'
              : 'flex w-full flex-col items-center gap-1'
          }
        >
          <GambarKata
            kata={kata}
            ukuran={ringkas ? 'min(4.5rem, 9dvh)' : 'min(7rem, 14dvh)'}
            className="motion-safe:transition-[font-size,width,height] motion-safe:duration-200"
          />
          <p
            className={`max-w-full font-extrabold leading-tight break-words ${ringkas ? 'text-[2.1rem]' : 'text-[2.5rem]'}`}
            lang="id"
            data-kata={kata.kata}
          >
            {kata.kata}
          </p>
        </div>
        <BigButton
          varian="garis"
          penuh={false}
          onClick={dengarContoh}
          ikon={<SpeakerHigh size={26} weight="bold" aria-hidden />}
        >
          Dengar
        </BigButton>
      </Card>

      <div aria-live="polite" className="mt-2.5 flex flex-col gap-2">
        <PanelUmpan
          key={`${indeks}-${percobaan}-${fase.jenis}`}
          fase={fase}
          petunjuk={petunjuk}
          modeMandiri={modeMandiri}
          modeUji={modeUji}
          tawarkanMandiri={tawarkanMandiri}
        />
        {galatSimpan && <Card nada="peringatan">{galatSimpan}</Card>}
      </div>

      {/* Tindakan di separuh bawah layar; tidak sticky agar umpan balik tidak tertutup. */}
      <div className="safe-bottom mt-auto flex flex-col gap-2 pt-3">
        {kataSelesai || menyimpan || galatSimpan ? (
          <BigButton
            ukuran="besar"
            onClick={lanjut}
            disabled={menyimpan}
            ikon={<ArrowRight size={28} weight="bold" aria-hidden />}
          >
            {menyimpan ? 'Menyimpan…' : tombolLanjut}
          </BigButton>
        ) : (
          <>
            {modeMandiri ? (
              <BigButton
                varian="sukses"
                ukuran="besar"
                onClick={() => nilaiMandiri('benar')}
                ikon={<CheckCircle size={28} weight="fill" aria-hidden />}
              >
                Sudah Benar
              </BigButton>
            ) : tawarkanMandiri ? (
              <BigButton ukuran="besar" onClick={mulaiBicara} ikon={<Microphone size={28} weight="fill" aria-hidden />}>
                Coba Lagi
              </BigButton>
            ) : mendengar ? (
              <button
                type="button"
                onClick={() => dengarRef.current?.stop()}
                className="relative flex min-h-[80px] w-full items-center justify-center gap-3 rounded-2xl border-2 border-primer bg-primer-terang text-[1.25rem] font-bold text-primer"
              >
                <span aria-hidden className="absolute inset-0 animate-pulse rounded-2xl ring-4 ring-primer/25" />
                <Stop size={28} weight="fill" aria-hidden />
                <span>Selesai Bicara</span>
              </button>
            ) : (
              <BigButton
                ukuran="besar"
                onClick={mulaiBicara}
                className="min-h-[80px]"
                ikon={<Microphone size={32} weight="fill" aria-hidden />}
              >
                Sebutkan Kata
              </BigButton>
            )}
            {tawarkanMandiri && (
              <BigButton varian="garis" onClick={pakaiModeMandiri} ikon={<Hand size={26} weight="bold" aria-hidden />}>
                Pakai Mode Latihan Mandiri
              </BigButton>
            )}
            <div className="flex gap-2">
              {modeMandiri && (
                <BigButton
                  varian="garis"
                  className="flex-1 px-3!"
                  onClick={() => nilaiMandiri('belum')}
                  ikon={<ArrowCounterClockwise size={26} weight="bold" aria-hidden />}
                >
                  Ulangi
                </BigButton>
              )}
              <BigButton
                varian="teks"
                className="flex-1 px-3!"
                onClick={lanjut}
                aria-label={terakhir ? 'Lewati kata ini dan lihat hasil' : 'Lewati kata ini'}
                ikon={<SkipForward size={22} weight="bold" aria-hidden />}
              >
                Lewati
              </BigButton>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

/** "Percobaan" + titik per percobaan: ringkas agar baris kemajuan muat satu baris di 360px dengan huruf besar. */
function TitikPercobaan({ ke }: { ke: number }) {
  return (
    <span className="flex items-center gap-1.5 whitespace-nowrap text-teks-2">
      <span aria-hidden>Percobaan</span>
      <span className="sr-only">
        Percobaan {ke} dari {MAKS}
      </span>
      <span aria-hidden className="flex gap-1">
        {Array.from({ length: MAKS }, (_, i) => (
          <span
            key={i}
            className={`size-2.5 rounded-full border-2 border-primer ${i < ke ? 'bg-primer' : 'bg-white'}`}
          />
        ))}
      </span>
    </span>
  );
}

const MASUK: Keyframe[] = [
  { opacity: 0, transform: 'translateY(6px)' },
  { opacity: 1, transform: 'none' },
];
const LONJAK: Keyframe[] = [
  { transform: 'scale(0.4)', opacity: 0 },
  { transform: 'scale(1.18)', opacity: 1, offset: 0.6 },
  { transform: 'scale(1)' },
];
const BINAR: Keyframe[] = [
  { boxShadow: '0 0 0 0 rgb(31 122 61 / 0.35)' },
  { boxShadow: '0 0 0 14px rgb(31 122 61 / 0)' },
];

/** Animasi singkat sekali saat elemen muncul; dilewati bila perangkat meminta gerak dikurangi. */
function useAnimasiMuncul<T extends Element>(frames: Keyframe[], durasiMs: number, tundaMs = 0) {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof el.animate !== 'function') return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const a = el.animate(frames, { duration: durasiMs, delay: tundaMs, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)', fill: 'backwards' });
    return () => a.cancel();
  }, [frames, durasiMs, tundaMs]);
  return ref;
}

function Muncul({ children }: { children: ReactNode }) {
  const ref = useAnimasiMuncul<HTMLDivElement>(MASUK, 220);
  return <div ref={ref}>{children}</div>;
}

/** Kartu Benar: ikon melonjak dan cahaya hijau lembut sekali, sebagai hadiah kecil. */
function KartuBenar({ children }: { children: ReactNode }) {
  const kartu = useAnimasiMuncul<HTMLDivElement>(BINAR, 900, 120);
  const ikon = useAnimasiMuncul<HTMLSpanElement>(LONJAK, 450);
  return (
    <div ref={kartu} className="rounded-kartu">
      <Card nada="sukses" className="flex items-center gap-3">
        <span ref={ikon} className="inline-flex shrink-0">
          <CheckCircle size={44} weight="fill" className="text-sukses" aria-hidden />
        </span>
        <div className="min-w-0">{children}</div>
      </Card>
    </div>
  );
}

function PanelUmpan({
  fase,
  petunjuk,
  modeMandiri,
  modeUji,
  tawarkanMandiri,
}: {
  fase: Fase;
  petunjuk: string;
  modeMandiri: boolean;
  modeUji: boolean;
  tawarkanMandiri: boolean;
}) {
  if (fase.jenis === 'mendengar') {
    return (
      <Muncul>
        <Card nada="primer" className="py-3 text-center">
          <p className="flex items-center justify-center gap-2 font-semibold text-primer">
            <Microphone size={24} weight="fill" className="shrink-0 animate-pulse" aria-hidden />
            Mendengarkan… ucapkan katanya.
          </p>
          {fase.sementara && <p className="mt-1 text-[1.4rem] font-bold">“{fase.sementara}”</p>}
        </Card>
      </Muncul>
    );
  }

  if (fase.jenis === 'galat') {
    const ikon =
      fase.galat.kode === 'izin' || fase.galat.kode === 'mikrofon' ? (
        <MicrophoneSlash size={28} weight="bold" className="mt-0.5 shrink-0" aria-hidden />
      ) : (
        <ArrowCounterClockwise size={28} weight="bold" className="mt-0.5 shrink-0" aria-hidden />
      );
    return (
      <Muncul>
        <Card nada={fase.galat.kode === 'tidak-terdengar' ? 'putih' : 'peringatan'} className="flex gap-3">
          {ikon}
          <p className="min-w-0 text-[1.05rem]">
            {tawarkanMandiri && !fase.galat.sarankanMandiri
              ? 'Masih belum terdengar. Coba lagi, atau pakai Mode Latihan Mandiri.'
              : fase.galat.pesan}
          </p>
        </Card>
      </Muncul>
    );
  }

  if (fase.jenis === 'siap') {
    return (
      <p className="text-center text-[1.05rem] text-teks-2">
        {modeMandiri
          ? 'Ucapkan dengan keras.'
          : 'Ucapkan nama gambar ini.'}
      </p>
    );
  }

  const terdengar =
    fase.teks && !modeMandiri ? <p className="mt-0.5 text-teks-2">Terdengar: “{fase.teks}”</p> : null;
  const waktu =
    modeUji && fase.latensiMs !== null ? (
      <p className="mt-0.5 text-[0.95rem] text-teks-2">
        Uji: dinilai {formatDetik(fase.latensiMs)} detik setelah selesai bicara.
      </p>
    ) : null;

  if (fase.hasil === 'benar') {
    return (
      <KartuBenar>
        <p className="text-[1.6rem] font-extrabold leading-tight text-sukses">Benar!</p>
        <p className="font-semibold">{fase.nomor === 1 ? 'Hebat, langsung tepat.' : 'Berhasil! Usaha Anda terbayar.'}</p>
        {terdengar}
        {waktu}
      </KartuBenar>
    );
  }

  if (fase.akhir) {
    return (
      <Muncul>
        <Card nada="aksen" className="flex gap-3">
          <Sparkle size={34} weight="fill" className="shrink-0 text-aksen" aria-hidden />
          <div className="min-w-0">
            <p className="text-[1.3rem] font-bold leading-tight">
              {fase.hasil === 'hampir' ? 'Sudah hampir!' : 'Tidak apa-apa.'}
            </p>
            <p className="mt-0.5 text-[1.05rem]">
              Kita ulang besok, ya. Suku katanya:{' '}
              <strong className="whitespace-nowrap">{petunjuk}</strong>
            </p>
          </div>
        </Card>
      </Muncul>
    );
  }

  if (fase.hasil === 'hampir') {
    return (
      <Muncul>
        <Card nada="peringatan" className="flex gap-3">
          <CircleHalf size={34} weight="fill" className="shrink-0 text-peringatan" aria-hidden />
          <div className="min-w-0">
            <p className="text-[1.4rem] font-extrabold leading-tight">Hampir! Sedikit lagi.</p>
            <p className="mt-0.5 text-[1.1rem]">
              Coba ucapkan: <strong className="whitespace-nowrap text-[1.25rem]">{petunjuk}</strong>
            </p>
            {terdengar}
            {waktu}
          </div>
        </Card>
      </Muncul>
    );
  }

  return (
    <Muncul>
      <Card className="flex gap-3">
        <ArrowCounterClockwise size={32} weight="bold" className="shrink-0 text-primer" aria-hidden />
        <div className="min-w-0">
          <p className="text-[1.3rem] font-bold leading-tight">Coba lagi, ya.</p>
          <p className="mt-0.5 text-[1.05rem]">
            {modeMandiri ? 'Ucapkan pelan-pelan: ' : 'Dengar contohnya, lalu ucapkan: '}
            <strong className="whitespace-nowrap">{petunjuk}</strong>
          </p>
          {terdengar}
          {waktu}
        </div>
      </Card>
    </Muncul>
  );
}
