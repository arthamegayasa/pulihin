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
import { type ReactNode, type Ref, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { BigButton } from '@/components/BigButton';
import { Card } from '@/components/Card';
import { PageHeader } from '@/components/PageHeader';
import { IkonBingkai, Kerangka, KerangkaGrup, Lencana } from '@/components/premium';
import { addSpeechAttempt, putSession } from '@/data/db';
import { todayISO } from '@/lib/date';
import { newId } from '@/lib/id';
import { getPrefs } from '@/lib/prefs';
import { cancelSpeech, pramuatSuara, speak } from '@/lib/speak';
import { PATHS } from '@/router-paths';
import type { HasilKata, Session, SpeechAttempt } from '@/types';
import { pramuatGambarKata, simpanGambarSesi, simpanSuaraSesi } from '@/features/speech/asetKata';
import { segmenRingkasanAfasia, segmenSesiAfasia, ucapanBenar, ucapanCobaLagi, ucapanHampir, ucapanUlangBesok } from '@/features/suara/ucapan';
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
  const judul = kategori ? (getKategori(kategori)?.nama ?? 'Latihan Bicara') : 'Latihan Bicara Hari Ini';
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
  // (mis. layanan pengenalan suara diam tanpa hasil maupun galat).
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

  // Ke-10 gambar dan klip suara sesi (termasuk layar ringkasan) disimpan ke cache begitu sesi siap: latihan tetap
  // bergambar dan bersuara bila sinyal hilang di tengah jalan. Sesudahnya klip umpan balik dan contoh dimuat ke
  // memori (dari cache, tanpa unduhan ganda) agar langsung berbunyi.
  useEffect(() => {
    if (!persiapan) return;
    simpanGambarSesi(persiapan.daftar.map((k) => k.id));
    const segmen = segmenSesiAfasia(persiapan.daftar).map((s) => s.teks);
    void simpanSuaraSesi([...segmen, ...segmenRingkasanAfasia(persiapan.daftar.length).map((s) => s.teks)]).then(() =>
      pramuatSuara(segmen),
    );
  }, [persiapan]);

  // Gambar kata berikutnya dimuat lebih dulu agar langsung tampil saat Kata Berikutnya ditekan.
  const idBerikut = persiapan?.daftar[indeks + 1]?.id;
  useEffect(() => {
    if (idBerikut) pramuatGambarKata(idBerikut);
  }, [idBerikut]);

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
        <KerangkaGrup label="Menyiapkan kata…" className="flex flex-col gap-3">
          <Kerangka bentuk="teks" className="h-2" />
          <div className="flex flex-col items-center gap-3 rounded-kartu border border-garis-halus bg-permukaan p-4 shadow-sedang">
            <Kerangka bentuk="kotak" className="size-[min(11rem,24dvh)]" />
            <Kerangka bentuk="judul" className="w-1/2" />
            <Kerangka bentuk="tombol" className="w-[9rem]" />
          </div>
          <Kerangka bentuk="tombol" className="mt-6 h-[80px]" />
        </KerangkaGrup>
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
    if (hasil === 'benar') speak(ucapanBenar());
    else if (akhir) speak(ucapanUlangBesok());
    else if (hasil === 'hampir') speak(ucapanHampir(kata), { rate: 0.8 });
    else speak(ucapanCobaLagi());
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
        <div className="flex items-center justify-between gap-2">
          <span className="tipe-label whitespace-nowrap text-teks">
            Kata <span className="tabular">{indeks + 1}</span> dari <span className="tabular">{daftar.length}</span>
          </span>
          {modeMandiri ? (
            <Lencana nada="primer" ikon={<Hand weight="bold" />}>
              Mandiri
            </Lencana>
          ) : (
            <TitikPercobaan ke={percobaanKini} />
          )}
        </div>
        {/* Satu ruas per kata: selesai = teal, kata sekarang = teal muda. */}
        <div
          role="progressbar"
          aria-label="Kemajuan sesi"
          aria-valuemin={0}
          aria-valuemax={daftar.length}
          aria-valuenow={selesaiKata}
          aria-valuetext={`${selesaiKata} dari ${daftar.length} kata selesai`}
          className="mt-1.5 flex gap-1"
        >
          {daftar.map((k, i) => (
            <span
              key={k.id}
              className={`h-2 flex-1 rounded-full transition-colors ${i < selesaiKata ? 'bg-primer' : i === indeks ? 'bg-primer-garis' : 'bg-cekung'}`}
            />
          ))}
        </div>
      </div>

      {/* Siap: gambar besar, kata + Dengar sebaris di bawahnya. Saat umpan balik tampil, gambar mengecil ke samping
          kata agar tombol utama tetap terlihat tanpa menggulir di layar 360x740. */}
      <Card tingkat="naik" className="mt-2.5 p-3!">
        <div className={`flex items-center ${ringkas ? 'gap-3.5' : 'flex-col gap-2.5'}`}>
          <GambarKata
            key={kata.id}
            kata={kata}
            prioritas
            ukuran={ringkas ? 'min(6rem, 13dvh)' : 'min(10.5rem, 22dvh)'}
            className="rounded-kontrol motion-safe:transition-[width,height] motion-safe:duration-(--durasi-lambat) motion-safe:ease-lembut"
          />
          <div
            className={`flex min-w-0 ${ringkas ? 'flex-1 flex-col items-start gap-1.5' : 'flex-wrap items-center justify-center gap-x-4 gap-y-1.5 self-stretch text-center'}`}
          >
            <p
              className={`max-w-full font-extrabold leading-[1.1] tracking-[-0.01em] break-words ${ringkas ? 'text-[min(2.25rem,10.5vw)]' : 'text-[min(2.75rem,13vw)]'}`}
              lang="id"
              data-kata={kata.kata}
            >
              {kata.kata}
            </p>
            <BigButton
              varian="garis"
              penuh={false}
              onClick={dengarContoh}
              ikon={<SpeakerHigh weight="bold" aria-hidden />}
            >
              Dengar
            </BigButton>
          </div>
        </div>
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
                className="relative flex min-h-[80px] w-full items-center justify-center gap-3 rounded-kontrol border-2 border-primer bg-primer-terang text-[1.25rem] font-bold text-primer shadow-tipis"
              >
                <span aria-hidden className="absolute -inset-[3px] animate-pulse rounded-kontrol ring-4 ring-primer/25" />
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
    <span className="flex items-center gap-2 whitespace-nowrap">
      <span aria-hidden className="tipe-keterangan font-semibold text-teks-2">
        Percobaan
      </span>
      <span className="sr-only">
        Percobaan {ke} dari {MAKS}
      </span>
      <span aria-hidden className="flex gap-1">
        {Array.from({ length: MAKS }, (_, i) => (
          <span
            key={i}
            className={`size-3 rounded-full border-2 border-primer transition-colors ${i < ke ? 'bg-primer' : 'bg-permukaan'}`}
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

type NadaUmpan = 'putih' | 'primer' | 'sukses' | 'peringatan' | 'aksen';

/**
 * Satu bentuk untuk semua umpan balik: ubin ikon + judul + isi di kartu bernada hasil. Makna selalu tertulis
 * (judul), warna dan ikon hanya penguat (Bab 12).
 */
function KartuUmpan({
  nada,
  ikon,
  judul,
  children,
  refIkon,
}: {
  nada: NadaUmpan;
  ikon: ReactNode;
  judul: ReactNode;
  children?: ReactNode;
  refIkon?: Ref<HTMLSpanElement>;
}) {
  return (
    <Card nada={nada} className="flex items-start gap-3 py-3">
      <span ref={refIkon} className="inline-flex shrink-0">
        <IkonBingkai nada={nada === 'putih' ? 'primer' : 'putih'}>{ikon}</IkonBingkai>
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[1.35rem] font-extrabold leading-tight text-teks">{judul}</p>
        {children}
      </div>
    </Card>
  );
}

/** Petunjuk suku kata sebagai keping yang mudah dibaca, mis. "ma-kan". */
function SukuKata({ children }: { children: string }) {
  return (
    <strong
      lang="id"
      className="inline-block rounded-kecil border border-garis-halus bg-permukaan px-2.5 py-0.5 text-[1.25rem] leading-snug font-extrabold tracking-wide whitespace-nowrap text-teks"
    >
      {children}
    </strong>
  );
}

/** Kartu Benar: ikon melonjak dan cahaya hijau lembut sekali, sebagai hadiah kecil. */
function KartuBenar({ children }: { children: ReactNode }) {
  const kartu = useAnimasiMuncul<HTMLDivElement>(BINAR, 900, 120);
  const ikon = useAnimasiMuncul<HTMLSpanElement>(LONJAK, 450);
  return (
    <div ref={kartu} className="rounded-kartu">
      <KartuUmpan
        nada="sukses"
        refIkon={ikon}
        ikon={<CheckCircle weight="fill" className="text-sukses" />}
        judul={<span className="text-[1.6rem] text-sukses">Benar!</span>}
      >
        {children}
      </KartuUmpan>
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
        <KartuUmpan
          nada="primer"
          ikon={<Microphone weight="fill" className="animate-pulse" />}
          judul="Mendengarkan…"
        >
          <p className="mt-0.5 text-[1.05rem] text-teks-2">Ucapkan katanya sekarang.</p>
          {fase.sementara && <p className="mt-0.5 text-[1.4rem] leading-tight font-bold">“{fase.sementara}”</p>}
        </KartuUmpan>
      </Muncul>
    );
  }

  if (fase.jenis === 'galat') {
    const mikrofon = fase.galat.kode === 'izin' || fase.galat.kode === 'mikrofon';
    return (
      <Muncul>
        <Card nada={fase.galat.kode === 'tidak-terdengar' ? 'putih' : 'peringatan'} className="flex items-start gap-3 py-3">
          <IkonBingkai nada={fase.galat.kode === 'tidak-terdengar' ? 'primer' : 'putih'}>
            {mikrofon ? <MicrophoneSlash weight="bold" className="text-peringatan" /> : <ArrowCounterClockwise weight="bold" />}
          </IkonBingkai>
          <p className="min-w-0 self-center text-[1.05rem]">
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
        {modeMandiri ? 'Ucapkan nama gambar ini dengan keras.' : 'Ucapkan nama gambar ini.'}
      </p>
    );
  }

  const terdengar =
    fase.teks && !modeMandiri ? <p className="mt-1 text-teks-2">Terdengar: “{fase.teks}”</p> : null;
  const waktu =
    modeUji && fase.latensiMs !== null ? (
      <p className="mt-0.5 text-[0.95rem] text-teks-2">
        Uji: dinilai {formatDetik(fase.latensiMs)} detik setelah selesai bicara.
      </p>
    ) : null;

  if (fase.hasil === 'benar') {
    return (
      <KartuBenar>
        <p className="mt-0.5 font-semibold">{fase.nomor === 1 ? 'Hebat, langsung tepat.' : 'Berhasil! Usaha Anda terbayar.'}</p>
        {terdengar}
        {waktu}
      </KartuBenar>
    );
  }

  if (fase.akhir) {
    return (
      <Muncul>
        <KartuUmpan
          nada="aksen"
          ikon={<Sparkle weight="fill" className="text-aksen" />}
          judul={
            fase.hasil === 'hampir' ? (
              'Sudah hampir!'
            ) : (
              <>
                Tidak <span className="whitespace-nowrap">apa-apa.</span>
              </>
            )
          }
        >
          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[1.05rem]">
            Kita ulang besok, ya. <SukuKata>{petunjuk}</SukuKata>
          </p>
        </KartuUmpan>
      </Muncul>
    );
  }

  if (fase.hasil === 'hampir') {
    return (
      <Muncul>
        <KartuUmpan
          nada="peringatan"
          ikon={<CircleHalf weight="fill" className="text-peringatan" />}
          judul="Hampir! Sedikit lagi."
        >
          <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[1.05rem]">
            Coba ucapkan: <SukuKata>{petunjuk}</SukuKata>
          </p>
          {terdengar}
          {waktu}
        </KartuUmpan>
      </Muncul>
    );
  }

  return (
    <Muncul>
      <KartuUmpan nada="putih" ikon={<ArrowCounterClockwise weight="bold" />} judul="Coba lagi, ya.">
        <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[1.05rem]">
          {modeMandiri ? 'Ucapkan pelan-pelan:' : 'Dengar, lalu ucapkan:'} <SukuKata>{petunjuk}</SukuKata>
        </p>
        {terdengar}
        {waktu}
      </KartuUmpan>
    </Muncul>
  );
}
