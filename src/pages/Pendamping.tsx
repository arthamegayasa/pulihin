import { CheckCircle, Clock, Copy, Fire, ShareNetwork } from '@phosphor-icons/react';
import { BigButton } from '@/components/BigButton';
import { Card } from '@/components/Card';
import { DemoBadge } from '@/components/DemoBadge';
import { KosongDemo } from '@/components/KosongDemo';
import { NonDiagnosisNote } from '@/components/NonDiagnosisNote';
import { PageHeader } from '@/components/PageHeader';
import { StreakCalendar } from '@/components/StreakCalendar';
import { useToast } from '@/components/Toast';
import { TrendChart } from '@/components/TrendChart';
import { WeeklyChart } from '@/components/WeeklyChart';
import { KartuRedFlag } from '@/components/klinisi/RedFlagKlinisi';
import { teksTargetHarian } from '@/features/adherence/adherence';
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

/** Untuk Keluarga (Bab 9.2): status hari ini, red flag, grafik mingguan, tren skor, streak, bagikan ringkasan. */
export default function Pendamping() {
  const sekarang = useSekarang();
  const { data, loading, error } = useDataPasien();
  const lap = useLaporan(data, sekarang);
  const [toast, tampilkanToast] = useToast();

  if (loading && !data) return <p className="py-10 text-center text-teks-2">Memuat ringkasan...</p>;
  if (error) return <p className="py-10 text-center text-teks-2">Data latihan belum bisa dibaca. Coba muat ulang halaman.</p>;
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
    <section className="space-y-4">
      <PageHeader
        judul="Untuk Keluarga"
        sub={
          <span className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-teks">{profile.namaSamaran}</span>
            <span>
              {profile.usia} tahun, {profile.keterangan.toLowerCase()}
            </span>
            {profile.isDemo && <DemoBadge />}
          </span>
        }
      />

      {lap.redFlags.length > 0 && (
        <section className="space-y-3" aria-label="Tanda perlu perhatian">
          {lap.redFlags.map((f) => (
            <KartuRedFlag key={f.id} flag={f} />
          ))}
        </section>
      )}

      <StatusHariIni lap={lap} sessions={sessions} schedule={schedule} program={program} />

      <Card>
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-[1.15rem] font-extrabold">Sesi terjadwal 7 hari terakhir</h2>
          <p className="text-[1.4rem] font-extrabold text-primer tabular">{lap.kepatuhan.persen}%</p>
        </div>
        <p className="mb-2 text-[0.95rem] text-teks-2">
          {lap.kepatuhan.selesai} dari {lap.kepatuhan.target} sesi terjadwal sudah dikerjakan. Jadwal harian:{' '}
          {teksTargetHarian(lap.target)}.
        </p>
        <WeeklyChart data={lap.batang} />
      </Card>

      <Card>
        <h2 className="text-[1.15rem] font-extrabold">Skor latihan 14 hari</h2>
        <ul className="mb-3 mt-1 space-y-0.5 text-[0.95rem]">
          <li>
            Gerak minggu ini:{' '}
            <span className="font-bold">{lap.skorGerak.sekarang === null ? 'belum ada' : `${lap.skorGerak.sekarang} (${labelSkor(lap.skorGerak.sekarang)})`}</span>
            {lap.skorGerak.sekarang !== null && <span className="text-teks-2">, {kataTren(lap.skorGerak)}</span>}
          </li>
          <li>
            Bicara minggu ini:{' '}
            <span className="font-bold">{lap.skorAfasia.sekarang === null ? 'belum ada' : `${lap.skorAfasia.sekarang} (${labelSkor(lap.skorAfasia.sekarang)})`}</span>
            {lap.skorAfasia.sekarang !== null && <span className="text-teks-2">, {kataTren(lap.skorAfasia)}</span>}
          </li>
        </ul>
        <TrendChart data={lap.tren} />
      </Card>

      <Card>
        <div className="mb-3 flex items-start gap-3">
          <Fire size={32} weight="fill" className="shrink-0 text-aksen" aria-hidden />
          <div>
            <h2 className="text-[1.15rem] font-extrabold leading-tight">
              {lap.streak.saatIni > 0 ? `${lap.streak.saatIni} hari berturut-turut berlatih` : 'Siap mulai lagi'}
            </h2>
            <p className="text-[0.95rem] text-teks-2">
              {lap.streak.saatIni === 0
                ? 'Satu latihan ringan hari ini sudah cukup untuk memulai lagi.'
                : lap.streak.perluLanjutHariIni
                  ? 'Hari ini belum latihan. Ajak lanjutkan hari ini.'
                  : 'Hari ini sudah latihan. Terima kasih sudah menemani.'}{' '}
              Paling lama {lap.streak.terpanjang} hari berturut-turut.
            </p>
          </div>
        </div>
        <StreakCalendar hari={lap.kalender} />
      </Card>

      <div className="space-y-3 pt-1">
        <BigButton onClick={() => void salin()} ikon={<Copy size={26} weight="bold" aria-hidden />}>
          Salin Ringkasan Mingguan
        </BigButton>
        <BigButton varian="garis" onClick={() => void kirim()} ikon={<ShareNetwork size={26} weight="bold" aria-hidden />}>
          Kirim lewat WhatsApp
        </BigButton>
        <p className="text-[0.95rem] text-teks-2">
          Ringkasan berisi nama samaran, jumlah latihan, skor, dan tanda perlu perhatian minggu ini. Tidak ada yang dikirim
          sampai Anda sendiri menempel atau membagikannya.
        </p>
      </div>

      <NonDiagnosisNote />
      {toast}
    </section>
  );
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
  return (
    <Card nada={h.adaSesi ? 'sukses' : 'putih'}>
      <div className="flex items-start gap-3">
        {h.adaSesi ? (
          <CheckCircle size={32} weight="fill" className="shrink-0 text-sukses" aria-hidden />
        ) : (
          <Clock size={32} weight="bold" className="shrink-0 text-primer" aria-hidden />
        )}
        <div className="min-w-0 flex-1">
          <h2 className="text-[1.15rem] font-extrabold leading-tight">{h.adaSesi ? 'Sudah latihan hari ini' : 'Belum latihan hari ini'}</h2>
          {h.adaSesi && h.terakhirAt !== null && h.skorTerakhir !== null && (
            <p className="text-[0.95rem]">
              Terakhir pukul {formatJam(h.terakhirAt)}, skor {h.skorTerakhir} ({labelSkor(h.skorTerakhir)}).
            </p>
          )}
          {!h.adaSesi && terakhir && (
            <p className="text-[0.95rem]">
              Latihan terakhir: {namaHari(terakhir.tanggal)}, {formatTanggalPendek(terakhir.tanggal)} pukul{' '}
              {formatJam(terakhir.selesaiAt ?? terakhir.mulaiAt)}, skor {terakhir.skor}.
            </p>
          )}
          {!h.adaSesi && !terakhir && <p className="text-[0.95rem]">Belum ada latihan yang tercatat.</p>}
        </div>
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-2 text-[0.95rem]">
        <div className="rounded-xl bg-white/70 p-2">
          <dt className="text-teks-2">Latihan gerak</dt>
          <dd className="font-bold">{h.gerakSelesai ? gerakSudah : `Belum${schedule ? ` (jadwal ${jamTampil(schedule.jamGerak)})` : ''}`}</dd>
        </div>
        <div className="rounded-xl bg-white/70 p-2">
          <dt className="text-teks-2">Latihan bicara</dt>
          <dd className="font-bold">
            {h.afasiaSelesai ? 'Sudah' : `Belum${schedule ? ` (jadwal ${jamTampil(schedule.jamAfasia)})` : ''}`}
          </dd>
        </div>
      </dl>
    </Card>
  );
}
