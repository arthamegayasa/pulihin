import { ArrowCounterClockwise, DownloadSimple, Info, Trash, UploadSimple, Wrench } from '@phosphor-icons/react';
import { useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import { BigButton } from '@/components/BigButton';
import { Card } from '@/components/Card';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { DemoBadge } from '@/components/DemoBadge';
import { KosongDemo } from '@/components/KosongDemo';
import { PageHeader } from '@/components/PageHeader';
import { Toggle } from '@/components/Toggle';
import { useToast } from '@/components/Toast';
import { CadanganTidakValidError, exportAll, importAll, putSchedule, validasiCadangan } from '@/data/db';
import { hapusSemuaDataLokal, resetDemoData } from '@/data/seed';
import { useDataPasien } from '@/features/adherence/hooks';
import { izinNotifikasi, jamKeMenit, mintaIzinNotifikasi } from '@/features/adherence/reminders';
import { todayISO } from '@/lib/date';
import { setPrefs, usePrefs } from '@/lib/prefs';
import type { ExportBundle, Role, Schedule, SkenarioDemo } from '@/types';
import { PATHS } from '@/router-paths';

const PERAN: { role: Role; label: string }[] = [
  { role: 'pasien', label: 'Pasien' },
  { role: 'keluarga', label: 'Keluarga' },
  { role: 'terapis', label: 'Terapis' },
];

const SKENARIO: { id: SkenarioDemo; label: string; sub: string }[] = [
  { id: 'stagnasi', label: 'Ada tanda perlu perhatian (stagnasi)', sub: 'Pak Budi tidak berlatih 3 hari terakhir.' },
  { id: 'rajin', label: 'Pasien rajin', sub: 'Pak Budi berlatih hampir setiap hari, tanpa tanda perhatian.' },
];

type Konfirmasi = { jenis: 'reset' } | { jenis: 'hapus' } | { jenis: 'impor'; bundle: ExportBundle; nama: string } | null;

/** Pengaturan dan Demo (Bab 13): jadwal, tampilan, peran, data demo, cadangan, hapus data. */
export default function Pengaturan() {
  const prefs = usePrefs();
  const { data } = useDataPasien();
  const [toast, tampilkanToast] = useToast();
  const [skenario, setSkenario] = useState<SkenarioDemo>(prefs.skenarioDemo);
  const [konfirmasi, setKonfirmasi] = useState<Konfirmasi>(null);
  const [sibuk, setSibuk] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const jalankan = async (aksi: () => Promise<void>, pesan: string) => {
    setSibuk(true);
    try {
      await aksi();
      tampilkanToast(pesan);
    } catch (e) {
      console.error(e);
      tampilkanToast(e instanceof CadanganTidakValidError ? e.message : 'Maaf, ada kendala. Coba sekali lagi.', 'info');
    } finally {
      setSibuk(false);
      setKonfirmasi(null);
    }
  };

  const ekspor = async () => {
    try {
      const bundle = await exportAll();
      const url = URL.createObjectURL(new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `pulihin-cadangan-${todayISO()}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      tampilkanToast('Berkas cadangan sudah diunduh.');
    } catch {
      tampilkanToast('Cadangan belum bisa dibuat. Coba sekali lagi.', 'info');
    }
  };

  const pilihBerkas = async (file: File | undefined) => {
    if (!file) return;
    try {
      const bundle = validasiCadangan(JSON.parse(await file.text()));
      setKonfirmasi({ jenis: 'impor', bundle, nama: file.name });
    } catch {
      tampilkanToast('Berkas ini tidak bisa dibaca. Pilih berkas cadangan PULIHIN berakhiran .json.', 'info');
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const profiles = data?.profiles ?? [];

  return (
    <section className="space-y-5">
      <PageHeader judul="Pengaturan dan Demo" />

      {data?.profile && data.schedule ? (
        <FormJadwal key={`${data.profile.id}-${data.schedule.jamGerak}-${data.schedule.jamAfasia}-${data.schedule.notifikasiAktif}`} awal={data.schedule} namaPasien={data.profile.namaSamaran} onTersimpan={() => tampilkanToast('Jadwal tersimpan.')} />
      ) : (
        <Bagian judul="Jadwal Latihan">
          <p className="text-teks-2">Jadwal tersedia setelah ada data pasien.</p>
        </Bagian>
      )}

      <Bagian judul="Tampilan">
        <Toggle
          label="Huruf Lebih Besar"
          keterangan="Memperbesar teks 20 persen."
          aktif={prefs.hurufBesar}
          onUbah={(v) => setPrefs({ hurufBesar: v })}
        />
        <Toggle
          label="Petunjuk suara"
          keterangan="Membacakan petunjuk dalam Bahasa Indonesia."
          aktif={prefs.suaraAktif}
          onUbah={(v) => setPrefs({ suaraAktif: v })}
        />
      </Bagian>

      <Bagian judul="Peran di ponsel ini">
        <div className="space-y-2" role="radiogroup" aria-label="Peran">
          {PERAN.map((p) => (
            <PilihanTombol key={p.role} terpilih={prefs.role === p.role} onPilih={() => setPrefs({ role: p.role })}>
              {p.label}
            </PilihanTombol>
          ))}
        </div>
      </Bagian>

      {profiles.length > 0 && (
        <Bagian judul="Pasien demo aktif" aksi={<DemoBadge />}>
          <div className="space-y-2" role="radiogroup" aria-label="Pasien demo aktif">
            {profiles.map((p) => (
              <PilihanTombol key={p.id} terpilih={data?.profile?.id === p.id} onPilih={() => setPrefs({ activePatientId: p.id })}>
                <span className="block">{p.namaSamaran}</span>
                <span className="block text-[0.85rem] font-normal text-teks-2">
                  {p.usia} tahun, {p.keterangan.toLowerCase()}
                </span>
              </PilihanTombol>
            ))}
          </div>
        </Bagian>
      )}

      <Bagian judul="Data Demo" aksi={<DemoBadge />}>
        {profiles.length === 0 && <KosongDemo />}
        <p className="text-[0.95rem] text-teks-2">Pilih kondisi awal data contoh untuk peragaan, lalu tekan Reset Data Demo.</p>
        <div className="space-y-2" role="radiogroup" aria-label="Skenario data demo">
          {SKENARIO.map((s) => (
            <PilihanTombol key={s.id} terpilih={skenario === s.id} onPilih={() => setSkenario(s.id)}>
              <span className="block">{s.label}</span>
              <span className="block text-[0.85rem] font-normal text-teks-2">{s.sub}</span>
            </PilihanTombol>
          ))}
        </div>
        <BigButton varian="garis" ikon={<ArrowCounterClockwise size={24} weight="bold" aria-hidden />} onClick={() => setKonfirmasi({ jenis: 'reset' })}>
          Reset Data Demo
        </BigButton>
      </Bagian>

      <Bagian judul="Cadangan Data">
        <p className="text-[0.95rem] text-teks-2">Simpan atau pulihkan semua data di ponsel ini sebagai berkas JSON.</p>
        <BigButton varian="garis" ikon={<DownloadSimple size={24} weight="bold" aria-hidden />} onClick={() => void ekspor()}>
          Ekspor Data (JSON)
        </BigButton>
        <BigButton varian="garis" ikon={<UploadSimple size={24} weight="bold" aria-hidden />} onClick={() => fileRef.current?.click()}>
          Impor Data (JSON)
        </BigButton>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="sr-only"
          tabIndex={-1}
          aria-hidden
          onChange={(e) => void pilihBerkas(e.target.files?.[0])}
        />
      </Bagian>

      <Bagian judul="Hapus Data">
        <p className="text-[0.95rem] text-teks-2">
          Menghapus semua profil, sesi, skor, program, jadwal, dan pengaturan dari ponsel ini tanpa sisa.
        </p>
        <BigButton varian="garis" ikon={<Trash size={24} weight="bold" aria-hidden />} onClick={() => setKonfirmasi({ jenis: 'hapus' })}>
          Hapus Semua Data Lokal
        </BigButton>
      </Bagian>

      <nav className="flex flex-col gap-1 pt-1" aria-label="Tautan lain">
        <Link to={PATHS.tentang} className="flex min-h-[48px] items-center gap-2 font-bold text-primer underline underline-offset-4">
          <Info size={22} weight="bold" aria-hidden />
          Tentang PULIHIN
        </Link>
        <Link to={PATHS.uji} className="flex min-h-[48px] items-center gap-2 text-[0.95rem] font-semibold text-teks-2 underline underline-offset-4">
          <Wrench size={22} weight="bold" aria-hidden />
          Mode Uji (untuk pengujian)
        </Link>
      </nav>

      <ConfirmDialog
        buka={konfirmasi?.jenis === 'reset'}
        judul="Reset Data Demo?"
        labelYa="Ya, Reset Data Demo"
        sibuk={sibuk}
        onBatal={() => setKonfirmasi(null)}
        onYa={() => void jalankan(() => resetDemoData(skenario), 'Data demo sudah disetel ulang.')}
      >
        <p>Semua data di ponsel ini diganti dengan data contoh: {SKENARIO.find((s) => s.id === skenario)?.label.toLowerCase()}.</p>
      </ConfirmDialog>

      <ConfirmDialog
        buka={konfirmasi?.jenis === 'hapus'}
        judul="Hapus semua data lokal?"
        labelYa="Ya, Hapus Semua"
        sibuk={sibuk}
        onBatal={() => setKonfirmasi(null)}
        onYa={() =>
          void jalankan(async () => {
            await hapusSemuaDataLokal();
            setSkenario('stagnasi');
          }, 'Semua data lokal sudah dihapus.')
        }
      >
        <p>Profil, riwayat latihan, skor, dan pengaturan akan dihapus dari ponsel ini dan tidak bisa dikembalikan.</p>
        <p>Data contoh tidak dimuat lagi otomatis. Anda bisa memuatnya kembali dengan tombol Muat Data Demo.</p>
      </ConfirmDialog>

      <ConfirmDialog
        buka={konfirmasi?.jenis === 'impor'}
        judul="Pulihkan dari berkas cadangan?"
        labelYa="Ya, Pulihkan"
        sibuk={sibuk}
        onBatal={() => setKonfirmasi(null)}
        onYa={() => {
          if (konfirmasi?.jenis !== 'impor') return;
          const { bundle } = konfirmasi;
          void jalankan(() => importAll(bundle), 'Data dari berkas cadangan sudah dipulihkan.');
        }}
      >
        <p>
          Semua data di ponsel ini diganti dengan isi berkas{konfirmasi?.jenis === 'impor' ? ` "${konfirmasi.nama}"` : ''}.
        </p>
      </ConfirmDialog>

      {toast}
    </section>
  );
}

function Bagian({ judul, aksi, children }: { judul: string; aksi?: ReactNode; children: ReactNode }) {
  return (
    <Card className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-[1.15rem] font-extrabold">{judul}</h2>
        {aksi}
      </div>
      {children}
    </Card>
  );
}

function PilihanTombol({ terpilih, onPilih, children }: { terpilih: boolean; onPilih: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={terpilih}
      onClick={onPilih}
      className={`flex min-h-[56px] w-full items-center gap-3 rounded-2xl border-2 px-3 py-2 text-left font-bold ${terpilih ? 'border-primer bg-primer-terang text-primer' : 'border-garis bg-white text-teks'}`}
    >
      <span
        aria-hidden
        className={`grid size-6 shrink-0 place-items-center rounded-full border-2 ${terpilih ? 'border-primer' : 'border-teks-2/50'}`}
      >
        {terpilih && <span className="size-3 rounded-full bg-primer" />}
      </span>
      <span className="min-w-0 flex-1">{children}</span>
    </button>
  );
}

function FormJadwal({ awal, namaPasien, onTersimpan }: { awal: Schedule; namaPasien: string; onTersimpan: () => void }) {
  const [jamGerak, setJamGerak] = useState(awal.jamGerak);
  const [jamAfasia, setJamAfasia] = useState(awal.jamAfasia);
  const [notif, setNotif] = useState(awal.notifikasiAktif);
  const [catatanNotif, setCatatanNotif] = useState<string | null>(null);
  const [galat, setGalat] = useState<string | null>(null);
  const [sibuk, setSibuk] = useState(false);

  const ubahNotif = async (aktif: boolean) => {
    setCatatanNotif(null);
    if (!aktif) {
      setNotif(false);
      return;
    }
    const izin = izinNotifikasi() === 'granted' ? 'granted' : await mintaIzinNotifikasi();
    if (izin === 'granted') {
      setNotif(true);
      setCatatanNotif('Notifikasi aktif. Tekan Simpan Jadwal agar tersimpan.');
    } else {
      setNotif(false);
      setCatatanNotif(
        izin === 'tidak-didukung'
          ? 'Browser ini belum mendukung notifikasi. Pengingat tetap tampil di Beranda saat aplikasi dibuka.'
          : 'Izin notifikasi tidak diberikan. Tidak apa-apa, pengingat tetap tampil di Beranda saat aplikasi dibuka.',
      );
    }
  };

  const simpan = async () => {
    if (jamKeMenit(jamGerak) === null || jamKeMenit(jamAfasia) === null) {
      setGalat('Isi kedua jam latihan terlebih dahulu.');
      return;
    }
    setGalat(null);
    setSibuk(true);
    try {
      await putSchedule({ ...awal, jamGerak, jamAfasia, notifikasiAktif: notif });
      onTersimpan();
    } catch {
      setGalat('Jadwal belum tersimpan. Coba sekali lagi.');
    } finally {
      setSibuk(false);
    }
  };

  const kelasInput = 'min-h-[56px] w-[10.5rem] shrink-0 rounded-2xl border-2 border-garis bg-white px-3 text-[1.15rem] font-bold text-teks focus:border-primer';

  return (
    <Bagian judul="Jadwal Latihan">
      <p className="text-[0.95rem] text-teks-2">Jadwal harian untuk {namaPasien}: satu latihan gerak dan satu latihan bicara.</p>
      <div className="space-y-3">
        <label className="flex items-center justify-between gap-3 font-bold">
          Latihan gerak
          <input type="time" value={jamGerak} onChange={(e) => setJamGerak(e.target.value)} className={kelasInput} required />
        </label>
        <label className="flex items-center justify-between gap-3 font-bold">
          Latihan bicara
          <input type="time" value={jamAfasia} onChange={(e) => setJamAfasia(e.target.value)} className={kelasInput} required />
        </label>
      </div>
      <Toggle label="Notifikasi pengingat" keterangan="Muncul saat jam latihan tiba." aktif={notif} onUbah={(v) => void ubahNotif(v)} />
      <p className="text-[0.85rem] text-teks-2">
        Notifikasi hanya muncul selama PULIHIN terbuka di ponsel. Pengingat saat aplikasi tertutup belum tersedia di prototype ini.
        Tanpa izin notifikasi, pengingat tetap tampil di Beranda.
      </p>
      {catatanNotif && <p className="rounded-xl bg-primer-terang p-3 text-[0.95rem]">{catatanNotif}</p>}
      {galat && <p className="font-semibold text-teks">{galat}</p>}
      <BigButton onClick={() => void simpan()} disabled={sibuk}>
        {sibuk ? 'Menyimpan...' : 'Simpan Jadwal'}
      </BigButton>
    </Bagian>
  );
}
