import { CalendarCheck, ChatCircleText, CheckCircle, Clock, Copy, Fire, PersonArmsSpread, ShareNetwork } from '@phosphor-icons/react';
import type { ReactNode } from 'react';
import { BigButton } from '@/components/BigButton';
import { Card } from '@/components/Card';
import { KosongDemo } from '@/components/KosongDemo';
import { NonDiagnosisNote } from '@/components/NonDiagnosisNote';
import { PageHeader } from '@/components/PageHeader';
import { StreakCalendar } from '@/components/StreakCalendar';
import { useToast } from '@/components/Toast';
import { TrendChart } from '@/components/TrendChart';
import { WeeklyChart } from '@/components/WeeklyChart';
import { KartuRedFlag } from '@/components/klinisi/RedFlagKlinisi';
import { IkonBingkai, JudulBagian, KartuHero, KartuStat, KeadaanKosong, Kerangka, KerangkaGrup, KerangkaKartu } from '@/components/premium';
import { teksTargetHarian, type PerbandinganSkor } from '@/features/adherence/adherence';
import { useDataPasien, useLaporan, useSekarang } from '@/features/adherence/hooks';
import { kataTren, teksRingkasanMingguan, type LaporanKepatuhan } from '@/features/adherence/laporan';
import { statusProgramHariIni } from '@/features/adherence/program';
import { jamTampil } from '@/features/adherence/reminders';
import { formatJam, formatTanggalPendek, namaHari } from '@/lib/date';
import { labelSkor } from '@/lib/score';
import type { Program, Schedule, Session } from '@/types';

async function salinTeks(teks: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(teks);
    return true;
  } catch {
    // Cadangan untuk browser lama / konteks tanpa izin clipboard.
    const ta = document.createElement('textarea');
    ta.value = teks;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  }
}

/** Untuk Keluarga (Bab 9.2): red flag, status hari ini, angka utama, grafik mingguan, tren skor, streak, bagikan ringkasan. */
export default function Pendamping() {
  const sekarang = useSekarang();
  const { data, loading, error } = useDataPasien();
  const lap = useLaporan(data, sekarang);
  const [toast, tampilkanToast] = useToast();

  if (loading && !data) {
    return (
      <KerangkaGrup label="Memuat ringkasan..." className="space-y-4">
        <Kerangka bentuk="judul" className="h-[3rem]" />
        <Kerangka bentuk="kotak" className="aspect-[16/9]" />
        <div className="grid grid-cols-2 gap-3">
          <Kerangka bentuk="kotak" className="h-[7.5rem]" />
          <Kerangka bentuk="kotak" className="h-[7.5rem]" />
        </div>
        <KerangkaKartu baris={3} />
      </KerangkaGrup>
    );
  }
  if (error) {
    return (
      <section>
        <PageHeader judul="Untuk Keluarga" />
        <KeadaanKosong judul="Data latihan belum bisa dibaca">Coba muat ulang halaman. Data tetap tersimpan di ponsel ini.</KeadaanKosong>
      </section>
    );
  }
  if (!data?.profile || !lap) {
    return (
      <section>
        <PageHeader judul="Untuk Keluarga" />
        <KosongDemo />
      </section>
    );
  }

  const { profile, program, schedule, sessions } = data;
  const teks = teksRingkasanMingguan(profile, lap);
  const h = lap.hariIni;

  const salin = async () => {
    const ok = await salinTeks(teks);
    tampilkanToast(ok ? 'Ringkasan disalin. Tempel di WhatsApp untuk terapis.' : 'Ringkasan belum bisa disalin otomatis. Coba tombol Kirim lewat WhatsApp.', ok ? 'sukses' : 'info');
  };

  const kirim = async () => {
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ text: teks });
        return;
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') return;
      }
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(teks)}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <section className="space-y-6">
      <div className="space-y-4">
        <PageHeader judul="Untuk Keluarga" />

        {/* Tanda perlu perhatian selalu paling atas: hal pertama yang perlu diketahui keluarga. */}
        {lap.redFlags.length > 0 && (
          <section className="space-y-3" aria-label="Tanda perlu perhatian">
            {lap.redFlags.map((f) => (
              <KartuRedFlag key={f.id} flag={f} />
            ))}
          </section>
        )}

        {/* Teks hero sengaja pendek: di ponsel 360px kolom teksnya hanya ~10rem agar tidak menutupi ilustrasi. */}
        <KartuHero
          ilustrasi={{ jenis: 'momen', nama: 'keluarga' }}
          label={profile.isDemo ? 'Pasien demo' : 'Pasien'}
          judul={profile.namaSamaran}
          sub={
            <span className="flex items-start gap-1.5 font-bold text-teks">
              {h.adaSesi ? (
                <CheckCircle size={22} weight="fill" className="mt-[3px] shrink-0 text-sukses" aria-hidden />
              ) : (
                <Clock size={22} weight="bold" className="mt-[3px] shrink-0 text-teks-2" aria-hidden />
              )}
              <span className="min-w-0 text-balance">{h.adaSesi ? 'Sudah latihan hari ini' : 'Belum latihan hari ini'}</span>
            </span>
          }
        />
      </div>

      <StatusHariIni lap={lap} sessions={sessions} schedule={schedule} program={program} />

      <section aria-labelledby="judul-angka">
        <JudulBagian id="judul-angka" judul="Minggu ini" sub="Dihitung dari 7 hari terakhir. Skor rata-rata, 0 sampai 100." />
        {/* Dua kolom di ponsel normal; satu kolom bila Huruf Lebih Besar (8.5rem ikut membesar). */}
        <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,8.5rem),1fr))] gap-3">
          <KartuStat
            label="Kepatuhan"
            nilai={`${lap.kepatuhan.persen}%`}
            keterangan={`${lap.kepatuhan.selesai} dari ${lap.kepatuhan.target} sesi`}
            ikon={<CalendarCheck weight="bold" />}
            nada="primer"
          />
          <KartuStat
            label="Beruntun"
            nilai={lap.streak.saatIni}
            satuan="hari"
            keterangan={`terpanjang ${lap.streak.terpanjang} hari`}
            ikon={<Fire weight="fill" />}
            nada="aksen"
          />
          <StatSkor label="Skor gerak" skor={lap.skorGerak} />
          <StatSkor label="Skor bicara" skor={lap.skorAfasia} />
        </div>
      </section>

      <BagianGrafik
        id="judul-mingguan"
        judul="Sesi terjadwal 7 hari"
        sub={`${lap.kepatuhan.selesai} dari ${lap.kepatuhan.target} sesi terjadwal sudah dikerjakan. Jadwal harian: ${teksTargetHarian(lap.target)}.`}
      >
        <WeeklyChart data={lap.batang} />
      </BagianGrafik>

      <BagianGrafik id="judul-tren" judul="Tren skor 14 hari" sub="Rata-rata skor latihan per hari, 0 sampai 100.">
        <TrendChart data={lap.tren} />
      </BagianGrafik>

      <BagianGrafik
        id="judul-streak"
        judul={lap.streak.saatIni > 0 ? `${lap.streak.saatIni} hari berturut-turut` : 'Siap mulai lagi'}
        sub={
          lap.streak.saatIni === 0
            ? 'Satu latihan ringan hari ini sudah cukup untuk memulai lagi.'
            : lap.streak.perluLanjutHariIni
              ? 'Hari ini belum latihan. Ajak lanjutkan hari ini.'
              : 'Hari ini sudah latihan. Terima kasih sudah menemani.'
        }
      >
        <StreakCalendar hari={lap.kalender} />
      </BagianGrafik>

      {/* Tombol selebar layar (di luar kartu) agar "Salin Ringkasan Mingguan" muat satu baris di 360px. */}
      <section aria-labelledby="judul-bagikan" className="space-y-3">
        <div className="flex items-start gap-3 rounded-kartu border border-primer-garis bg-primer-terang p-4">
          <IkonBingkai nada="putih">
            <ShareNetwork weight="bold" />
          </IkonBingkai>
          <div className="min-w-0">
            <h2 id="judul-bagikan" className="tipe-subjudul text-teks">
              Kirim ringkasan ke terapis
            </h2>
            <p className="tipe-keterangan text-teks-2">
              Berisi nama samaran, jumlah latihan, skor, dan tanda perlu perhatian minggu ini. Tidak ada yang dikirim sampai Anda
              sendiri menempel atau membagikannya.
            </p>
          </div>
        </div>
        <BigButton onClick={() => void salin()} ikon={<Copy weight="bold" aria-hidden />}>
          Salin Ringkasan Mingguan
        </BigButton>
        <BigButton varian="garis" onClick={() => void kirim()} ikon={<ShareNetwork weight="bold" aria-hidden />}>
          Kirim lewat WhatsApp
        </BigButton>
      </section>

      <NonDiagnosisNote />
      {toast}
    </section>
  );
}

/** Bagian grafik: judul + penjelasan di luar kartu, grafik di dalam kartu putih. */
function BagianGrafik({ id, judul, sub, children }: { id: string; judul: string; sub: ReactNode; children: ReactNode }) {
  return (
    <section aria-labelledby={id}>
      <JudulBagian id={id} judul={judul} sub={sub} />
      {/* relative + overflow-hidden: tabel sr-only di dalam grafik tidak boleh melebarkan halaman ponsel. */}
      <Card className="relative overflow-hidden">{children}</Card>
    </section>
  );
}

/** Skor rata-rata 7 hari; label pendek tanpa ikon agar muat satu baris di kartu setengah lebar (360px). */
function StatSkor({ label, skor }: { label: string; skor: PerbandinganSkor }) {
  if (skor.sekarang === null) {
    return <KartuStat label={label} nilai={<span aria-label="belum ada">-</span>} keterangan="belum ada sesi minggu ini" />;
  }
  return <KartuStat label={label} nilai={skor.sekarang} keterangan={`${labelSkor(skor.sekarang)}, ${kataTren(skor)}`} />;
}

function StatusHariIni({
  lap,
  sessions,
  schedule,
  program,
}: {
  lap: LaporanKepatuhan;
  sessions: Session[];
  schedule: Schedule | undefined;
  program: Program | undefined;
}) {
  const h = lap.hariIni;
  const terakhir = sessions.at(-1);
  // Hitungan butir sama persis dengan "Latihan Hari Ini" di Beranda pasien.
  const daftar = statusProgramHariIni(program?.items ?? [], sessions, lap.today);
  const tuntas = daftar.filter((d) => d.selesai).length;
  const gerakSudah =
    daftar.length === 0 ? `Sudah, ${h.jumlahGerak} sesi` : `${tuntas > 0 ? 'Sudah' : 'Sudah dicoba'}, ${tuntas} dari ${daftar.length} latihan selesai`;

  let sub: string;
  if (h.adaSesi && h.terakhirAt !== null && h.skorTerakhir !== null) {
    sub = `Terakhir pukul ${formatJam(h.terakhirAt)}, skor ${h.skorTerakhir} (${labelSkor(h.skorTerakhir)}).`;
  } else if (terakhir) {
    sub = `Latihan terakhir: ${namaHari(terakhir.tanggal)}, ${formatTanggalPendek(terakhir.tanggal)} pukul ${formatJam(terakhir.selesaiAt ?? terakhir.mulaiAt)}, skor ${terakhir.skor}.`;
  } else {
    sub = 'Belum ada latihan yang tercatat.';
  }

  return (
    <section aria-labelledby="judul-hari-ini">
      <JudulBagian id="judul-hari-ini" judul="Hari ini" sub={sub} />
      <Card>
        <ul className="divide-y divide-garis-halus">
          <BarisStatus
            ikon={<PersonArmsSpread weight="bold" />}
            judul="Latihan gerak"
            selesai={h.gerakSelesai}
            detail={h.gerakSelesai ? gerakSudah : `Belum${schedule ? `, jadwal pukul ${jamTampil(schedule.jamGerak)}` : ''}`}
          />
          <BarisStatus
            ikon={<ChatCircleText weight="bold" />}
            judul="Latihan bicara"
            selesai={h.afasiaSelesai}
            detail={h.afasiaSelesai ? 'Sudah' : `Belum${schedule ? `, jadwal pukul ${jamTampil(schedule.jamAfasia)}` : ''}`}
          />
        </ul>
      </Card>
    </section>
  );
}

function BarisStatus({ ikon, judul, detail, selesai }: { ikon: ReactNode; judul: string; detail: string; selesai: boolean }) {
  return (
    <li className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
      <IkonBingkai nada={selesai ? 'sukses' : 'primer'}>{ikon}</IkonBingkai>
      <div className="min-w-0 flex-1">
        <p className="font-bold text-teks">{judul}</p>
        <p className="tipe-keterangan text-teks-2">{detail}</p>
      </div>
      {selesai && <CheckCircle size={28} weight="fill" className="shrink-0 text-sukses" aria-hidden />}
    </li>
  );
}
