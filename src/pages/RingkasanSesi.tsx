import { ArrowCounterClockwise, ArrowRight, ArrowsClockwise, CheckCircle, House, Info, Lightbulb, Target as IkonTarget, Timer, XCircle } from '@phosphor-icons/react';
import { useEffect, useRef, useState } from 'react';
import { Navigate, useParams } from 'react-router';
import { BigLink } from '@/components/BigButton';
import { NonDiagnosisNote } from '@/components/NonDiagnosisNote';
import { PageHeader } from '@/components/PageHeader';
import { IkonBingkai, KartuStat, Kerangka, KerangkaGrup } from '@/components/premium';
import { ScoreRing } from '@/components/ScoreRing';
import { getSession, listRepLogs } from '@/data/db';
import { useLiveQuery } from '@/data/useLiveQuery';
import { IlustrasiPotong } from '@/features/pasien/IlustrasiPotong';
import { getExercise } from '@/features/pose/exerciseDefinitions';
import { RENTANG_PENUH, urlDetail } from '@/features/pose/sesiParams';
import { ambangAtasRentang, normalisasiRentang } from '@/features/pose/tracker';
import { usePrefs } from '@/lib/prefs';
import { clamp, labelSkor } from '@/lib/score';
import { berandaUntukPeran, PATHS } from '@/router-paths';
import type { Session, SkorKomponen } from '@/types';

/** Label sederhana untuk pasien; bobot perhitungan (Bab 5.3) tidak ditampilkan di layar pasien. */
const KOMPONEN: { kunci: keyof SkorKomponen; label: string }[] = [
  { kunci: 'repetisi', label: 'Jumlah gerakan' },
  { kunci: 'rentang', label: 'Rentang gerak' },
  { kunci: 'tempo', label: 'Irama gerakan' },
];

function judulHangat(s: Session): string {
  if (s.repetisiTercapai >= s.repetisiTarget) return 'Hebat, target latihan tercapai!';
  if (s.repetisiTercapai > 0) return 'Terima kasih sudah berlatih hari ini.';
  // Percobaan yang belum terhitung tetap tercatat (strip sudut puncak di bawah): hargai usahanya.
  return 'Terima kasih sudah mencoba hari ini.';
}

/** Ringkasan sesi gerak (Bab 5.1 langkah 7, Bab 11 Ringkasan). Semua angka dibaca langsung dari catatan tersimpan. */
export default function RingkasanSesi() {
  const { sessionId = '' } = useParams();
  const { role } = usePrefs();
  const { data: sesi, loading } = useLiveQuery(() => getSession(sessionId), [sessionId]);

  if (loading && !sesi) {
    return (
      <section>
        <PageHeader judul="Ringkasan Latihan" />
        <KerangkaGrup label="Memuat ringkasan latihan..." className="space-y-4">
          <Kerangka bentuk="kotak" className="h-[236px] rounded-kartu" />
          <div className="grid grid-cols-2 gap-3">
            <Kerangka bentuk="kotak" className="h-[104px] rounded-kartu" />
            <Kerangka bentuk="kotak" className="h-[104px] rounded-kartu" />
          </div>
        </KerangkaGrup>
      </section>
    );
  }
  if (!sesi) {
    return (
      <section>
        <PageHeader judul="Ringkasan tidak ditemukan" />
        <p className="mb-5 text-teks-2">Catatan latihan ini tidak ada di ponsel ini.</p>
        <BigLink to={berandaUntukPeran(role)}>Kembali ke Beranda</BigLink>
      </section>
    );
  }
  if (sesi.jenis === 'afasia') return <Navigate to={PATHS.afasiaRingkasan(sesi.id)} replace />;

  const def = sesi.latihanId ? getExercise(sesi.latihanId) : undefined;
  const nama = def?.nama ?? 'Latihan gerak';
  const namaSisi = sesi.sisi === 'kanan' ? 'sisi kanan' : sesi.sisi === 'kiri' ? 'sisi kiri' : null;
  const rentang = normalisasiRentang(sesi.rentangPersen);
  // Perayaan (ilustrasi) hanya bila sesi selesai dan target tercapai atau skor >= 60; selain itu tenang, tanpa perayaan.
  const rayakan = sesi.selesai && (sesi.repetisiTercapai >= sesi.repetisiTarget || sesi.skor >= 60);
  const durasi = Math.max(0, Math.round(sesi.durasiDetik));
  const menit = Math.floor(durasi / 60);
  const detik = durasi % 60;

  return (
    <section className="space-y-5">
      <PageHeader judul={judulHangat(sesi)} sub={`${nama}${namaSisi ? `, ${namaSisi}` : ''}`} kembali={false} />

      {!sesi.selesai && (
        <p className="flex gap-3 rounded-kartu border border-peringatan/30 bg-peringatan-terang p-4">
          <Info size={24} weight="bold" className="mt-0.5 shrink-0 text-peringatan" aria-hidden />
          Sesi ini terhenti sebelum selesai, jadi belum dihitung sebagai latihan hari ini.
        </p>
      )}

      {/* Kartu utama: skor (dan ilustrasi perayaan bila pantas). Bertumpuk bila sempit (Huruf Lebih Besar). */}
      <div
        className={`@container overflow-hidden rounded-kartu border shadow-sedang ${rayakan ? 'border-primer-garis/70 bg-ilustrasi' : 'border-garis-halus bg-permukaan'}`}
      >
        <div className={`flex flex-col items-center gap-3 p-5 ${rayakan ? '@min-[17rem]:flex-row @min-[17rem]:justify-around @min-[17rem]:py-4 @min-[17rem]:pl-4 @min-[17rem]:pr-2' : ''}`}>
          <div className="flex flex-col items-center gap-1">
            <ScoreRing skor={sesi.skor} ukuran={rayakan ? 150 : 172} />
            <p className="tipe-keterangan text-teks-2">Skor latihan</p>
          </div>
          {rayakan ? (
            <IlustrasiPotong
              ilustrasi={{ jenis: 'momen', nama: 'selebrasi' }}
              potong={{ x: 90, y: 60, sisi: 500 }}
              prioritas
              className="order-first size-[136px] rounded-kontrol @min-[17rem]:order-none"
            />
          ) : (
            <p className="tipe-isi max-w-[22rem] text-center text-teks">Pelan pelan saja. Setiap latihan tetap berarti, coba lagi saat Anda siap.</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <KartuStat
          label="Repetisi"
          nilai={sesi.repetisiTercapai}
          satuan={`dari ${sesi.repetisiTarget}`}
          nada={sesi.repetisiTercapai >= sesi.repetisiTarget ? 'sukses' : 'putih'}
          ikon={sesi.repetisiTercapai >= sesi.repetisiTarget ? <CheckCircle weight="fill" /> : <ArrowsClockwise weight="bold" />}
        />
        <KartuStat
          label="Durasi"
          nilai={menit > 0 ? menit : detik}
          satuan={menit > 0 ? `menit${detik > 0 ? ` ${detik} detik` : ''}` : 'detik'}
          ikon={<Timer weight="bold" />}
        />
      </div>

      {rentang < RENTANG_PENUH && (
        <p className="flex items-center gap-3 rounded-kartu border border-primer-garis bg-primer-terang p-4 font-bold">
          <IkonTarget size={24} weight="bold" className="shrink-0 text-primer" aria-hidden />
          Target rentang dari terapis: {rentang}%
        </p>
      )}

      {sesi.skorKomponen && (
        <section aria-labelledby="judul-rincian" className="rounded-kartu border border-garis-halus bg-permukaan p-4 shadow-tipis">
          <h2 id="judul-rincian" className="tipe-subjudul mb-3 text-teks">
            Rincian skor
          </h2>
          <ul className="space-y-3.5">
            {KOMPONEN.map(({ kunci, label }) => {
              const nilai = Math.round(clamp(sesi.skorKomponen![kunci], 0, 100));
              return (
                <li key={kunci}>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                    <span className="whitespace-nowrap font-semibold text-teks">{label}</span>
                    <span className="ml-auto font-bold text-primer">
                      {labelSkor(nilai)} <span className="tabular font-semibold text-teks-2">· {nilai}</span>
                    </span>
                  </div>
                  <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-cekung" aria-hidden>
                    <div className="h-full rounded-full bg-primer inset-shadow-sorot" style={{ width: `${nilai}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {def && <StripRepetisi sessionId={sesi.id} ambangAtas={ambangAtasRentang(def, sesi.rentangPersen)} satuan={def.satuan} rentang={rentang} />}

      {sesi.saran && (
        <div className="flex gap-3 rounded-kartu border border-aksen/30 bg-aksen-terang p-4">
          <IkonBingkai nada="putih">
            <Lightbulb weight="fill" className="text-aksen" />
          </IkonBingkai>
          <div className="min-w-0">
            <p className="tipe-label text-aksen-teks">Saran untuk sesi berikutnya</p>
            <p className="mt-0.5 text-teks">{sesi.saran}</p>
          </div>
        </div>
      )}

      <NonDiagnosisNote />

      <div className="space-y-3 pt-1">
        <BigLink to={berandaUntukPeran(role)} replace ikon={<House size={26} weight="fill" aria-hidden />}>
          Kembali ke Beranda
        </BigLink>
        {def && (
          // Ulangi lewat Detail Latihan: peringatan keselamatan & konfirmasi berpegangan selalu dilewati dulu.
          <BigLink
            to={urlDetail(def.id, sesi.repetisiTarget, sesi.sisi ?? undefined, rentang)}
            varian="garis"
            ikon={<ArrowCounterClockwise size={24} weight="bold" aria-hidden />}
          >
            Ulangi Latihan
          </BigLink>
        )}
      </div>
    </section>
  );
}

/**
 * Jejak ukur per gerakan dari repLogs tersimpan: tinggi batang = nilai puncak metrik, garis putus = ambang hitung.
 * Terhitung / belum terhitung selalu ditulis dengan kata (bukan warna saja).
 */
function StripRepetisi({
  sessionId,
  ambangAtas,
  satuan,
  rentang,
}: {
  sessionId: string;
  /** Ambang hitung yang dipakai sesi ini (sudah disesuaikan target rentang terapis). */
  ambangAtas: number;
  satuan: '°' | '%';
  rentang: number;
}) {
  const { data: logs } = useLiveQuery(() => listRepLogs(sessionId), [sessionId]);
  const geserRef = useRef<HTMLDivElement>(null);
  const [bisaGeser, setBisaGeser] = useState(false);
  const jumlah = logs?.length ?? 0;
  // Petunjuk geser hanya bila batang benar-benar melebihi lebar kartu (banyak gerakan / Huruf Lebih Besar).
  useEffect(() => {
    const el = geserRef.current;
    if (!el) return;
    const cek = () => setBisaGeser(el.scrollWidth - el.clientWidth > 1);
    cek();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(cek);
    ro.observe(el);
    return () => ro.disconnect();
  }, [jumlah]);
  if (!logs || logs.length === 0) return null;
  const terhitung = logs.filter((l) => l.dihitung).length;
  const skalaMaks = Math.max(ambangAtas * 1.15, ...logs.map((l) => l.sudutPuncak));
  const tinggiAmbang = (ambangAtas / skalaMaks) * 100;
  const label = satuan === '°' ? 'Sudut puncak tiap gerakan' : 'Nilai puncak tiap gerakan';
  return (
    <section className="rounded-kartu border border-garis-halus bg-permukaan p-4 shadow-tipis">
      <h2 className="tipe-subjudul text-teks">{label}</h2>
      <p className="tipe-keterangan mb-3 mt-0.5 text-teks-2">
        Diukur kamera: {terhitung} dari {logs.length} gerakan terhitung. Garis putus-putus = batas hitung{' '}
        {Math.round(ambangAtas)}
        {satuan}
        {rentang < RENTANG_PENUH ? ` (target rentang dari terapis ${rentang}%)` : ''}.
      </p>
      {/* Batang menyusut mengisi lebar kartu (min 2rem tiap batang); bila tetap tidak muat, kartu bisa digeser dan diberi petunjuk. */}
      <div ref={geserRef} className="overflow-x-auto pb-1">
        <ol
          className="relative grid items-end gap-1 pt-6"
          style={{
            gridTemplateColumns: `repeat(${logs.length}, minmax(0, 1fr))`,
            minWidth: `calc(${logs.length} * 2rem + ${logs.length - 1} * 0.25rem)`,
            maxWidth: `calc(${logs.length} * 3.5rem)`,
          }}
          aria-label={label}
        >
          {/* Di bawah batang: baris nomor (mt-1 + h-6) dan baris ikon (h-6) = 3,25rem. */}
          <li
            className="pointer-events-none absolute inset-x-0 z-10 border-t-2 border-dashed border-aksen/80"
            style={{ bottom: `calc(3.25rem + ${tinggiAmbang / 100} * 8rem)` }}
            aria-hidden
          />
          {logs.map((l) => {
            const nilai = Math.round(l.sudutPuncak);
            return (
              <li
                key={l.nomor}
                className="flex min-w-0 flex-col items-center"
                aria-label={`Gerakan ${l.nomor}: puncak ${nilai}${satuan === '°' ? ' derajat' : ' persen'}, ${l.dihitung ? 'terhitung' : 'belum terhitung'}`}
              >
                <span className="tabular whitespace-nowrap text-[0.8rem] font-bold leading-tight text-teks-2" aria-hidden>
                  {nilai}
                  {satuan}
                </span>
                <div className="flex h-32 w-full items-end rounded-t-[8px] bg-cekung/70" aria-hidden>
                  <div
                    className={`w-full rounded-t-[8px] ${l.dihitung ? 'bg-primer inset-shadow-sorot' : 'border-2 border-dashed border-teks-2/60 bg-primer-terang'}`}
                    style={{ height: `${Math.max(4, (clamp(l.sudutPuncak, 0, skalaMaks) / skalaMaks) * 100)}%` }}
                  />
                </div>
                <span className="tabular mt-1 h-6 text-[1rem] font-bold leading-6" aria-hidden>
                  {l.nomor}
                </span>
                <span className="grid h-6 place-items-center" aria-hidden>
                  {l.dihitung ? (
                    <CheckCircle size="1.25rem" weight="fill" className="text-primer" />
                  ) : (
                    <XCircle size="1.25rem" weight="bold" className="text-teks-2" />
                  )}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
      {bisaGeser && (
        <p className="tipe-keterangan mt-1 flex items-center gap-1.5 font-semibold text-teks-2">
          Geser ke samping untuk melihat semua gerakan
          <ArrowRight size="1.1rem" weight="bold" className="shrink-0 text-primer" aria-hidden />
        </p>
      )}
      <ul className="mt-2 flex flex-col gap-1 text-[0.95rem]" aria-hidden>
        <li className="flex items-center gap-1.5">
          <span className="inline-block size-3.5 shrink-0 rounded-[4px] bg-primer" />
          <CheckCircle size="1.25rem" weight="fill" className="shrink-0 text-primer" />
          Terhitung
        </li>
        <li className="flex items-center gap-1.5">
          <span className="inline-block size-3.5 shrink-0 rounded-[4px] border-2 border-dashed border-teks-2/60 bg-primer-terang" />
          <XCircle size="1.25rem" weight="bold" className="shrink-0 text-teks-2" />
          Belum terhitung (terlalu cepat atau kurang jauh)
        </li>
      </ul>
    </section>
  );
}
