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
import { useEffect, useRef, useState } from 'react';
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
  | { jenis: 'umpan'; hasil: HasilKata; teks: string; latensiMs: number | null; akhir: boolean }
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

  const catatanRef = useRef<PercobaanRingkas[]>([]);
  const simpananRef = useRef<Promise<void>[]>([]);
  const dengarRef = useRef<SesiDengar | null>(null);

  // Siapkan 10 kata dan buat Session (selesai=false) saat layar dibuka.
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
      await putSession(sesi);
      if (batal) return;
      catatanRef.current = [];
      simpananRef.current = [];
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
      cancelSpeech();
    },
    [],
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

  function catatPercobaan(hasil: HasilKata, teksHasil: string, mode: SpeechAttempt['mode']) {
    const nomor = percobaan + 1;
    const skor = skorPercobaan(hasil, nomor);
    catatanRef.current.push({ kataId: kata.id, kategoriHasil: hasil, nomorPercobaan: nomor });
    // Satu percobaan yang gagal tersimpan tidak boleh menggagalkan seluruh sesi.
    simpananRef.current.push(
      addSpeechAttempt({
        sessionId: sesi.id,
        kataId: kata.id,
        teksHasil,
        kategoriHasil: hasil,
        skor,
        nomorPercobaan: nomor,
        mode,
        at: Date.now(),
      }).catch((e: unknown) => console.warn('Percobaan afasia belum tersimpan', e)),
    );
    setPercobaan(nomor);
    return { nomor, akhir: hasil === 'benar' || nomor >= MAKS };
  }

  function umpanSuara(hasil: HasilKata, akhir: boolean) {
    if (hasil === 'benar') speak('Benar! Bagus sekali.');
    else if (akhir) speak('Tidak apa-apa. Kata ini kita ulang besok.');
    else if (hasil === 'hampir') speak(`Hampir. Coba lagi. ${kata.sukuKata.join('. ')}. ${kata.kata}.`, { rate: 0.8 });
    else speak('Coba sekali lagi, pelan-pelan.');
  }

  function terimaHasil(h: HasilPengenalan) {
    const penilaian = nilaiUcapan(kata, h.alternatif);
    const { akhir } = catatPercobaan(penilaian.hasil, penilaian.teks, 'suara');
    setFase({ jenis: 'umpan', hasil: penilaian.hasil, teks: penilaian.teks, latensiMs: h.latensiMs, akhir });
    umpanSuara(penilaian.hasil, akhir);
  }

  function mulaiBicara() {
    hentikanDengar();
    cancelSpeech();
    setFase({ jenis: 'mendengar', sementara: '' });
    const sesiDengar = mulaiDengar({
      onSementara: (teks) => setFase({ jenis: 'mendengar', sementara: teks }),
      onHasil: terimaHasil,
      onGalat: (galat) => setFase({ jenis: 'galat', galat }),
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
    const { akhir } = catatPercobaan(hasil, '', 'mandiri');
    setFase({ jenis: 'umpan', hasil, teks: '', latensiMs: null, akhir });
    umpanSuara(hasil, akhir);
  }

  function dengarContoh() {
    hentikanDengar();
    setFase((f) => (f.jenis === 'mendengar' ? { jenis: 'siap' } : f));
    speak(kata.kata, {
      force: true,
      rate: 0.8,
      onEnd: () => speak(kata.kalimatContoh, { force: true, interrupt: false }),
    });
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
    cancelSpeech();
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
    setBeralihMandiri(true);
    setFase({ jenis: 'siap' });
  }

  const kataSelesai = fase.jenis === 'umpan' && fase.akhir;
  const mendengar = fase.jenis === 'mendengar';
  const tombolLanjut = terakhir ? 'Lihat Hasil' : 'Kata Berikutnya';

  return (
    <section className="flex min-h-[calc(100dvh-7rem)] flex-col">
      <PageHeader judul={judul} kembali={PATHS.afasia} />

      <div>
        <div className="flex items-baseline justify-between text-[1.05rem]">
          <span className="font-bold">
            Kata {indeks + 1} dari {daftar.length}
          </span>
          <span className="text-teks-2">
            {modeMandiri ? 'Mode mandiri' : `Percobaan ${Math.min(percobaan + (kataSelesai ? 0 : 1), MAKS)} dari ${MAKS}`}
          </span>
        </div>
        <div
          role="progressbar"
          aria-label="Kemajuan sesi"
          aria-valuemin={0}
          aria-valuemax={daftar.length}
          aria-valuenow={indeks + (kataSelesai ? 1 : 0)}
          className="mt-1.5 h-3 overflow-hidden rounded-full bg-primer-terang"
        >
          <div
            className="h-full rounded-full bg-primer transition-[width] duration-300"
            style={{ width: `${((indeks + (kataSelesai ? 1 : 0)) / daftar.length) * 100}%` }}
          />
        </div>
      </div>

      <Card className="mt-3 flex flex-col items-center gap-1 py-4 text-center">
        <GambarKata kata={kata} ukuranRem={7} />
        <p className="text-[2.5rem] font-extrabold leading-tight break-words" lang="id">
          {kata.kata}
        </p>
        <BigButton
          varian="garis"
          penuh={false}
          onClick={dengarContoh}
          ikon={<SpeakerHigh size={26} weight="bold" aria-hidden />}
        >
          Dengar
        </BigButton>
      </Card>

      <div aria-live="polite" className="mt-3 flex flex-col gap-2">
        <PanelUmpan fase={fase} petunjuk={petunjuk} modeMandiri={modeMandiri} />
        {galatSimpan && <Card nada="peringatan">{galatSimpan}</Card>}
      </div>

      {/* Tindakan di separuh bawah layar; tidak sticky agar umpan balik tidak tertutup. */}
      <div className="safe-bottom mt-auto flex flex-col gap-2 pt-4">
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
            ) : fase.jenis === 'galat' && fase.galat.sarankanMandiri ? (
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
            <div className="flex gap-2">
              {modeMandiri && (
                <BigButton
                  varian="garis"
                  className="flex-1"
                  onClick={() => nilaiMandiri('belum')}
                  ikon={<ArrowCounterClockwise size={26} weight="bold" aria-hidden />}
                >
                  Ulangi
                </BigButton>
              )}
              {!modeMandiri && fase.jenis === 'galat' && fase.galat.sarankanMandiri && (
                <BigButton
                  varian="garis"
                  className="flex-[2]"
                  onClick={pakaiModeMandiri}
                  ikon={<Hand size={26} weight="bold" aria-hidden />}
                >
                  Pakai Mode Mandiri
                </BigButton>
              )}
              <BigButton
                varian="teks"
                className="flex-1"
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

function PanelUmpan({ fase, petunjuk, modeMandiri }: { fase: Fase; petunjuk: string; modeMandiri: boolean }) {
  if (fase.jenis === 'mendengar') {
    return (
      <Card nada="primer" className="text-center">
        <p className="flex items-center justify-center gap-2 font-semibold text-primer">
          <Microphone size={24} weight="fill" className="animate-pulse" aria-hidden />
          Mendengarkan… silakan ucapkan katanya.
        </p>
        <p className="mt-1 min-h-[2rem] text-[1.4rem] font-bold">{fase.sementara ? `“${fase.sementara}”` : ''}</p>
      </Card>
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
      <Card nada={fase.galat.kode === 'tidak-terdengar' ? 'putih' : 'peringatan'} className="flex gap-3">
        {ikon}
        <p className="text-[1.05rem]">{fase.galat.pesan}</p>
      </Card>
    );
  }

  if (fase.jenis === 'siap') {
    return (
      <p className="text-center text-[1.05rem] text-teks-2">
        {modeMandiri
          ? 'Ucapkan kata ini dengan keras. Lalu tekan Sudah Benar, atau Ulangi bila belum pas.'
          : 'Tekan Sebutkan Kata, lalu ucapkan nama gambar ini.'}
      </p>
    );
  }

  const terdengar =
    fase.teks && !modeMandiri ? <p className="mt-1 text-teks-2">Terdengar: “{fase.teks}”</p> : null;
  const waktu =
    fase.latensiMs !== null ? (
      <p className="mt-1 text-[0.9rem] text-teks-2">Dinilai {formatDetik(fase.latensiMs)} detik setelah selesai bicara.</p>
    ) : null;

  if (fase.hasil === 'benar') {
    return (
      <Card nada="sukses" className="flex gap-3">
        <CheckCircle size={36} weight="fill" className="shrink-0 text-sukses" aria-hidden />
        <div>
          <p className="text-[1.6rem] font-extrabold leading-tight text-sukses">Benar!</p>
          {terdengar}
          {waktu}
        </div>
      </Card>
    );
  }

  if (fase.akhir) {
    return (
      <Card nada="aksen" className="flex gap-3">
        <Sparkle size={34} weight="fill" className="shrink-0 text-aksen" aria-hidden />
        <div>
          <p className="text-[1.3rem] font-bold leading-tight">
            {fase.hasil === 'hampir' ? 'Hampir! Kata ini kita ulang besok, ya.' : 'Tidak apa-apa. Kata ini kita ulang besok, ya.'}
          </p>
          <p className="mt-1 text-[1.15rem]">
            Suku katanya: <strong>{petunjuk}</strong>
          </p>
          {terdengar}
        </div>
      </Card>
    );
  }

  if (fase.hasil === 'hampir') {
    return (
      <Card nada="peringatan" className="flex gap-3">
        <CircleHalf size={34} weight="fill" className="shrink-0 text-peringatan" aria-hidden />
        <div>
          <p className="text-[1.4rem] font-extrabold leading-tight">
            Hampir! Coba lagi: <span className="text-peringatan">{petunjuk}</span>
          </p>
          {terdengar}
          {waktu}
        </div>
      </Card>
    );
  }

  return (
    <Card className="flex gap-3">
      <ArrowCounterClockwise size={32} weight="bold" className="shrink-0 text-primer" aria-hidden />
      <div>
        <p className="text-[1.3rem] font-bold leading-tight">Coba lagi, ya.</p>
        <p className="mt-1 text-[1.05rem]">
          {modeMandiri
            ? 'Tidak apa-apa. Ucapkan sekali lagi pelan-pelan: '
            : 'Belum pas. Dengarkan contohnya, lalu ucapkan pelan-pelan: '}
          <strong>{petunjuk}</strong>
        </p>
        {terdengar}
        {waktu}
      </div>
    </Card>
  );
}
