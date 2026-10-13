import type { ExportBundle, HasilKata, ISODate, Profile, Program, ProgramItem, RepLog, Schedule, Session, SkenarioDemo, SpeechAttempt } from '@/types';
import { bulkPut, clearAll, deleteSession, exportAll, getProgram, getSchedule, importAll, listProfiles, listRepLogs, listSessions, listSpeechAttempts } from '@/data/db';
import { addDays, todayISO } from '@/lib/date';
import { resetPrefs, setPrefs, getPrefs } from '@/lib/prefs';
import { clamp } from '@/lib/score';
import { setModeMandiriDipilih } from '@/features/speech/modeMandiri';
import { getKata } from '@/features/speech/wordBank';

/**
 * Data demo 14 hari (Bab 10.1). Dibangkitkan deterministik (PRNG berbenih) relatif terhadap tanggal hari ini,
 * sehingga setiap reset menghasilkan pola yang sama: perekaman video dapat diulang dari kondisi awal yang sama.
 *
 * Skenario untuk pasien utama Pak Budi:
 * - 'stagnasi' (bawaan): kepatuhan bervariasi, skor gerak & bicara naik perlahan, 3 hari terakhir tanpa sesi
 *   -> hanya red flag (a) yang muncul; kepatuhan mingguan tetap >= 40% dan skor tidak turun.
 * - 'rajin': hampir setiap hari berlatih, tanpa red flag.
 * Bu Sari (rajin) dan Pak Joko (kepatuhan sedang) sama pada kedua skenario (Dashboard Klinisi).
 */

export const AUTOSEED_KEY = 'pulihin.autoseed';

type DataDemo = Omit<ExportBundle, 'app' | 'versi' | 'dieksporAt'>;

/* ---------- PRNG berbenih (mulberry32) ---------- */

function buatAcak(benih: string): () => number {
  let h = 1779033703 ^ benih.length;
  for (let i = 0; i < benih.length; i++) {
    h = Math.imul(h ^ benih.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let a = h >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---------- pola harian ---------- */

/**
 * Satu huruf per hari, dari 14 hari lalu sampai kemarin:
 * L = semua latihan gerak + bicara, G = semua latihan gerak saja, S = satu latihan gerak + bicara,
 * s = satu latihan gerak saja, B = bicara saja, '-' = tidak ada sesi.
 */
type KodeHari = 'L' | 'G' | 'S' | 's' | 'B' | '-';

interface RencanaPasien {
  profile: Omit<Profile, 'tanggalMulaiProgram'>;
  items: ProgramItem[];
  frekuensiPerMinggu: number;
  pola: KodeHari[];
  skorGerak: [awal: number, akhir: number];
  skorAfasia: [awal: number, akhir: number];
}

const pola = (s: string) => s.split('') as KodeHari[];

function rencana(skenario: SkenarioDemo): RencanaPasien[] {
  return [
    {
      profile: { id: 'budi', namaSamaran: 'Pak Budi', usia: 58, keterangan: 'Stroke 3 bulan lalu', sisiLemah: 'kanan', isDemo: true },
      items: [
        { latihanId: 'fleksi-siku', targetRepetisi: 10, set: 1 },
        { latihanId: 'fleksi-bahu', targetRepetisi: 10, set: 1 },
        { latihanId: 'abduksi-bahu', targetRepetisi: 8, set: 1 },
      ],
      frekuensiPerMinggu: 7,
      // stagnasi: 3 hari terakhir kosong; 3 hari sebelumnya lengkap agar kepatuhan 7 hari = 6/14 (43%).
      pola: skenario === 'stagnasi' ? pola('LG-LSBLGLLL---') : pola('LLLGLLLLSLLLLL'),
      skorGerak: [55, 72],
      skorAfasia: [50, 68],
    },
    {
      profile: { id: 'sari', namaSamaran: 'Bu Sari', usia: 63, keterangan: 'Stroke 5 bulan lalu', sisiLemah: 'kiri', isDemo: true },
      items: [
        { latihanId: 'fleksi-bahu', targetRepetisi: 12, set: 1 },
        { latihanId: 'ekstensi-lutut', targetRepetisi: 10, set: 1 },
        { latihanId: 'duduk-berdiri', targetRepetisi: 8, set: 1 },
      ],
      frekuensiPerMinggu: 7,
      pola: pola('LLLLLGLLLLLSLL'),
      skorGerak: [66, 80],
      skorAfasia: [62, 78],
    },
    {
      profile: { id: 'joko', namaSamaran: 'Pak Joko', usia: 61, keterangan: 'Stroke 2 bulan lalu', sisiLemah: 'kiri', isDemo: true },
      items: [
        { latihanId: 'fleksi-siku', targetRepetisi: 8, set: 1 },
        // Target rentang 80% dari terapis: Dashboard Klinisi memperlihatkan fitur rentang personal.
        { latihanId: 'abduksi-bahu', targetRepetisi: 8, set: 1, rentangPersen: 80 },
        { latihanId: 'ekstensi-lutut', targetRepetisi: 10, set: 1 },
      ],
      frekuensiPerMinggu: 5,
      pola: pola('L-sB-L-G-LS-BL'),
      skorGerak: [48, 58],
      skorAfasia: [40, 50],
    },
  ];
}

/** Ambang fase atas tiap latihan demo (Bab 6), untuk sudut puncak RepLog yang masuk akal. */
const AMBANG_ATAS_DEMO: Record<string, number> = {
  'fleksi-bahu': 100,
  'fleksi-siku': 120,
  'abduksi-bahu': 90,
  'ekstensi-lutut': 150,
  'duduk-berdiri': 160,
};

/** Kata bank afasia (id stabil wordBank.ts) yang dipakai riwayat demo. */
const KATA_DEMO = ['kursi', 'meja', 'gelas', 'piring', 'sendok', 'nasi', 'teh', 'air', 'ibu', 'tangan', 'makan', 'minum'];

/** Jadwal bawaan data demo (Bab 9.1, saran pukul 08.00 dan 16.00). */
const JADWAL_DEMO: Omit<Schedule, 'patientId'> = { jamGerak: '08:00', jamAfasia: '16:00', notifikasiAktif: false };

/* ---------- pembangkit ---------- */

function waktu(tanggal: ISODate, jam: number, menit: number): number {
  const [y, m, d] = tanggal.split('-').map(Number);
  return new Date(y, m - 1, d, jam, menit, 0, 0).getTime();
}

interface Hasil {
  sessions: Session[];
  repLogs: RepLog[];
  speechAttempts: SpeechAttempt[];
}

function sesiGerak(
  r: RencanaPasien,
  item: ProgramItem,
  tanggal: ISODate,
  mulaiAt: number,
  skorTujuan: number,
  acak: () => number,
  out: Hasil,
): number {
  const target = item.targetRepetisi;
  const tercapai = Math.round(target * clamp((skorTujuan + 18 + (acak() - 0.5) * 8) / 100, 0.5, 1));
  const komponenRepetisi = Math.round((tercapai / target) * 100);
  // Sisa skor dibagi ke rentang (30%) dan tempo (20%) dengan sedikit variasi.
  const sisa = clamp((skorTujuan - 0.5 * komponenRepetisi) / 0.5, 0, 100);
  const geser = (acak() - 0.5) * 16;
  const rentang = Math.round(clamp(sisa + geser, 0, 100));
  const tempo = Math.round(clamp(sisa - geser * 1.5, 0, 100));
  const skor = Math.round(0.5 * komponenRepetisi + 0.3 * rentang + 0.2 * tempo);

  const id = `demo-${r.profile.id}-${tanggal}-${item.latihanId}`;
  // Butir resep dengan target rentang (persen ambang atas) menghasilkan sudut puncak di sekitar ambang efektifnya.
  const skalaRentang = (item.rentangPersen ?? 100) / 100;
  const atas = (AMBANG_ATAS_DEMO[item.latihanId] ?? 90) * skalaRentang;
  const logs: RepLog[] = [];
  let nomor = 0;
  let durasi = 12;
  for (let rep = 0; rep < tercapai; rep++) {
    if (acak() < 0.12) {
      // Percobaan terlalu cepat: dicatat, tidak dihitung (Bab 7.2).
      const d = 0.6 + acak() * 0.3;
      logs.push({ sessionId: id, nomor: ++nomor, dihitung: false, sudutPuncak: Math.round(atas * 0.7), durasiSiklusDetik: round1(d), koreksi: ['tempo-cepat'] });
      durasi += d;
    }
    const siklus = tempo >= 60 ? 2 + acak() * 1.5 : 1.2 + acak() * 3.2;
    const koreksi: string[] = [];
    if (rentang < 55 && acak() < 0.45) koreksi.push('rentang-kurang');
    if (item.latihanId !== 'ekstensi-lutut' && item.latihanId !== 'duduk-berdiri' && acak() < 0.15) koreksi.push('bahu-terangkat');
    if (tempo < 50 && siklus < 1.6) koreksi.push('tempo-cepat');
    logs.push({
      sessionId: id,
      nomor: ++nomor,
      dihitung: true,
      sudutPuncak: Math.round(Math.min(178, atas + 2 + (rentang / 100) * 30 * skalaRentang + acak() * 5)),
      durasiSiklusDetik: round1(siklus),
      koreksi,
    });
    durasi += siklus + 0.8;
  }
  const durasiDetik = Math.round(durasi);
  const saran =
    rentang < 60
      ? 'Besok coba angkat sedikit lebih tinggi bila mampu.'
      : tempo < 60
        ? 'Besok coba gerakkan lebih pelan dan teratur.'
        : 'Pertahankan, gerakan Anda sudah teratur.';
  out.sessions.push({
    id,
    patientId: r.profile.id,
    tanggal,
    mulaiAt,
    selesaiAt: mulaiAt + durasiDetik * 1000,
    jenis: 'gerak',
    latihanId: item.latihanId,
    kategoriKata: null,
    repetisiTarget: target,
    repetisiTercapai: tercapai,
    skor,
    skorKomponen: { repetisi: komponenRepetisi, rentang, tempo },
    ringkasanAfasia: null,
    durasiDetik,
    selesai: true,
    saran,
    sisi: r.profile.sisiLemah,
    ...(item.rentangPersen !== undefined ? { rentangPersen: item.rentangPersen } : {}),
    isDemo: true,
  });
  out.repLogs.push(...logs);
  return mulaiAt + durasiDetik * 1000;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

/** Skor per kata Bab 8.3: 100 benar percobaan pertama, 70 benar berikutnya, 40 hampir, 0 belum. */
const SKOR_KATA = [100, 70, 40, 0] as const;

function sesiAfasia(r: RencanaPasien, tanggal: ISODate, mulaiAt: number, skorTujuan: number, acak: () => number, out: Hasil): void {
  const id = `demo-${r.profile.id}-${tanggal}-afasia`;
  const kata = [...KATA_DEMO];
  for (let i = kata.length - 1; i > 0; i--) {
    const j = Math.floor(acak() * (i + 1));
    [kata[i], kata[j]] = [kata[j], kata[i]];
  }
  kata.length = 10;
  const skorKata: number[] = [];
  const attempts: SpeechAttempt[] = [];
  let at = mulaiAt + 5000;
  for (const [i, kataId] of kata.entries()) {
    // Pilih hasil yang menjaga rata-rata berjalan dekat skor tujuan, dengan sedikit acak agar bervariasi.
    const ingin = skorTujuan * (i + 1) - skorKata.reduce((a, b) => a + b, 0) + (acak() - 0.5) * 50;
    const skor = SKOR_KATA.reduce((best, s) => (Math.abs(s - ingin) < Math.abs(best - ingin) ? s : best));
    skorKata.push(skor);
    const teks = getKata(kataId);
    const target = teks?.kata ?? kataId;
    const awal = teks?.sukuKata[0] ?? target.slice(0, 2);
    const urutan: [HasilKata, number, string][] =
      skor === 100
        ? [['benar', 100, target]]
        : skor === 70
          ? [['hampir', 40, awal], ['benar', 70, target]]
          : skor === 40
            ? [['belum', 0, ''], ['hampir', 40, awal], ['hampir', 40, awal]]
            : [['belum', 0, ''], ['belum', 0, ''], ['belum', 0, awal]];
    urutan.forEach(([kategoriHasil, s, teksHasil], n) => {
      at += 4000 + Math.round(acak() * 6000);
      attempts.push({ sessionId: id, kataId, teksHasil, kategoriHasil, skor: s, nomorPercobaan: n + 1, mode: 'suara', at });
    });
  }
  const benar = skorKata.filter((s) => s >= 70).length;
  const hampir = skorKata.filter((s) => s === 40).length;
  const durasiDetik = Math.round((at - mulaiAt) / 1000) + 10;
  out.sessions.push({
    id,
    patientId: r.profile.id,
    tanggal,
    mulaiAt,
    selesaiAt: mulaiAt + durasiDetik * 1000,
    jenis: 'afasia',
    latihanId: null,
    kategoriKata: null,
    repetisiTarget: 10,
    repetisiTercapai: benar,
    skor: Math.round(skorKata.reduce((a, b) => a + b, 0) / skorKata.length),
    skorKomponen: null,
    ringkasanAfasia: { benar, hampir, belum: 10 - benar - hampir, kataUlang: kata.filter((_, i) => skorKata[i] < 70) },
    durasiDetik,
    selesai: true,
    saran: 'Ulangi kata yang belum lancar besok, pelan-pelan.',
    sisi: null,
    isDemo: true,
  });
  out.speechAttempts.push(...attempts);
}

/** Bangkitkan seluruh data demo untuk satu skenario, relatif terhadap `today` (riwayat berakhir kemarin). */
export function buatDataDemo(skenario: SkenarioDemo, today: ISODate = todayISO()): DataDemo {
  const mulaiProgram = addDays(today, -14);
  const data: DataDemo = { profiles: [], sessions: [], repLogs: [], speechAttempts: [], programs: [], schedules: [] };
  for (const r of rencana(skenario)) {
    const acak = buatAcak(`pulihin-${skenario}-${r.profile.id}`);
    data.profiles.push({ ...r.profile, tanggalMulaiProgram: mulaiProgram });
    data.programs.push({
      patientId: r.profile.id,
      items: r.items,
      frekuensiPerMinggu: r.frekuensiPerMinggu,
      dibuatOleh: 'Terapis (demo)',
      tanggalUbah: waktu(mulaiProgram, 9, 0),
    } satisfies Program);
    data.schedules.push({ patientId: r.profile.id, ...JADWAL_DEMO } satisfies Schedule);

    r.pola.forEach((kode, i) => {
      const hariLalu = 14 - i;
      const tanggal = addDays(today, -hariLalu);
      const kemajuan = i / (r.pola.length - 1);
      const tujuan = ([awal, akhir]: [number, number]) => Math.round(awal + (akhir - awal) * kemajuan + (acak() - 0.5) * 6);
      const gerakItems = kode === 'L' || kode === 'G' ? r.items : kode === 'S' || kode === 's' ? r.items.slice(0, 1) : [];
      let t = waktu(tanggal, 8, 5 + Math.floor(acak() * 60));
      for (const item of gerakItems) {
        t = sesiGerak(r, item, tanggal, t, tujuan(r.skorGerak), acak, data) + (60 + Math.floor(acak() * 120)) * 1000;
      }
      if (kode === 'L' || kode === 'S' || kode === 'B') {
        sesiAfasia(r, tanggal, waktu(tanggal, 16, Math.floor(acak() * 55)), tujuan(r.skorAfasia), acak, data);
      }
    });
  }
  return data;
}

/* ---------- penyimpanan ---------- */

function bacaLocal(key: string): string | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage.getItem(key);
  } catch {
    return null;
  }
}

function tulisLocal(key: string, value: string | null): void {
  try {
    if (typeof localStorage === 'undefined') return;
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    /* mode privat / penyimpanan penuh: abaikan */
  }
}

let sedangMenanam: Promise<void> | null = null;

/** Ganti seluruh isi penyimpanan dengan data demo dalam SATU transaksi (layar tidak sempat melihat keadaan kosong). */
function tanamDemo(skenario: SkenarioDemo, today: ISODate): Promise<void> {
  return importAll({ app: 'pulihin', versi: 1, dieksporAt: Date.now(), ...buatDataDemo(skenario, today) } satisfies ExportBundle);
}

/**
 * Tanggal penanaman data demo yang belum diubah pengguna, atau null bila ada data/ubahan pengguna.
 * Riwayat demo dibangkitkan relatif terhadap hari penanaman, jadi tanggal itu terbaca dari profil
 * (tanggalMulaiProgram = hari tanam - 14). Pemeriksaan tidak bergantung pada isi pembangkit, agar data demo
 * dari versi aplikasi sebelumnya tetap dikenali:
 * - semua profil dan semua sesi berlabel demo (sesi yang direkam pengguna selalu `isDemo: false`, termasuk
 *   sesi yang dihentikan). Pemanggil membuang dulu sesi `selesai: false` tanpa RepLog/SpeechAttempt (layar yang
 *   hanya dibuka), karena itu belum aktivitas pengguna;
 * - resep belum pernah disimpan ulang (tanggalUbah masih waktu tanam, Dashboard Klinisi menulis waktu simpan);
 * - jadwal masih jadwal bawaan demo.
 */
export function tanggalTanamDemoUtuh(data: Pick<DataDemo, 'profiles' | 'programs' | 'schedules' | 'sessions'>): ISODate | null {
  const budi = data.profiles.find((p) => p.id === 'budi');
  if (!budi || !data.profiles.every((p) => p.isDemo) || !data.sessions.every((s) => s.isDemo)) return null;
  const mulai = new Map(data.profiles.map((p) => [p.id, p.tanggalMulaiProgram]));
  const resepAsli = data.programs.every((p) => {
    const tgl = mulai.get(p.patientId);
    return tgl !== undefined && p.tanggalUbah === waktu(tgl, 9, 0);
  });
  const jadwalAsli = data.schedules.every(
    (s) => s.jamGerak === JADWAL_DEMO.jamGerak && s.jamAfasia === JADWAL_DEMO.jamAfasia && s.notifikasiAktif === JADWAL_DEMO.notifikasiAktif,
  );
  return resepAsli && jadwalAsli ? addDays(budi.tanggalMulaiProgram, 14) : null;
}

/**
 * Bersih-bersih saat aplikasi dibuka: sesi `selesai: false` dari hari sebelumnya (kamera ditinggal, layar latihan
 * yang hanya dibuka) dihapus beserta RepLog dan SpeechAttempt-nya. Sesi hari ini dibiarkan: mungkin masih berjalan
 * di tab lain. Mengembalikan jumlah sesi yang dihapus.
 */
export async function bersihkanSesiBelumSelesai(today: ISODate = todayISO(), profiles?: Profile[]): Promise<number> {
  let jumlah = 0;
  for (const p of profiles ?? (await listProfiles())) {
    const lama = await listSessions(p.id, { sampai: addDays(today, -1), hanyaSelesai: false });
    for (const s of lama) {
      if (s.selesai) continue;
      await deleteSession(s.id);
      jumlah++;
    }
  }
  return jumlah;
}

/** Sesi belum selesai tanpa satu pun percobaan tercatat (layar hanya dibuka). */
async function sesiKosong(s: Session): Promise<boolean> {
  if (s.selesai) return false;
  const [reps, ucapan] = await Promise.all([listRepLogs(s.id), listSpeechAttempts(s.id)]);
  return reps.length === 0 && ucapan.length === 0;
}

/**
 * Dipanggil setiap aplikasi dibuka (main.tsx).
 * - Bersih-bersih rekaman belum selesai dari hari sebelumnya (`bersihkanSesiBelumSelesai`).
 * - Pembukaan pertama (belum ada profil): tanam data demo, kecuali pengguna sengaja menghapus semua data.
 * - Data demo yang ditanam pada hari sebelumnya dan belum diubah pengguna ditanam ulang untuk hari ini, sehingga
 *   skenario selalu tampak sama kapan pun dibuka (mis. stagnasi tetap "3 hari belum latihan", bukan 4 atau 5).
 * - Data yang sudah memuat aktivitas atau ubahan pengguna tidak pernah disentuh.
 */
export function ensureDemoData(today: ISODate = todayISO()): Promise<void> {
  sedangMenanam ??= (async () => {
    const profiles = await listProfiles();
    await bersihkanSesiBelumSelesai(today, profiles);
    if (bacaLocal(AUTOSEED_KEY) === 'off') return;
    const skenario = getPrefs().skenarioDemo;
    if (profiles.length === 0) {
      await bulkPut(buatDataDemo(skenario, today));
      return;
    }
    const budi = profiles.find((p) => p.id === 'budi');
    // Pemeriksaan murah dulu: hanya data demo dari hari sebelumnya yang perlu diperiksa lengkap.
    if (!budi?.isDemo || addDays(budi.tanggalMulaiProgram, 14) >= today) return;
    const per = await Promise.all(
      profiles.map(async (p) => {
        const semua = await listSessions(p.id, { hanyaSelesai: false });
        const kosong = await Promise.all(semua.map(sesiKosong));
        return {
          sessions: semua.filter((_, i) => !kosong[i]),
          program: await getProgram(p.id),
          schedule: await getSchedule(p.id),
        };
      }),
    );
    const tanggal = tanggalTanamDemoUtuh({
      profiles,
      sessions: per.flatMap((x) => x.sessions),
      programs: per.flatMap((x) => (x.program ? [x.program] : [])),
      schedules: per.flatMap((x) => (x.schedule ? [x.schedule] : [])),
    });
    if (tanggal !== null && tanggal < today) await tanamDemo(skenario, today);
  })().finally(() => {
    sedangMenanam = null;
  });
  return sedangMenanam;
}

/**
 * Isi berkas cadangan (Pengaturan, "Simpan cadangan"): semua data kecuali sesi yang belum selesai beserta
 * RepLog/SpeechAttempt-nya; rekaman setengah jalan bukan riwayat latihan.
 */
export async function buatCadangan(): Promise<ExportBundle> {
  const b = await exportAll();
  const belum = new Set(b.sessions.filter((s) => !s.selesai).map((s) => s.id));
  return {
    ...b,
    sessions: b.sessions.filter((s) => !belum.has(s.id)),
    repLogs: b.repLogs.filter((r) => !belum.has(r.sessionId)),
    speechAttempts: b.speechAttempts.filter((a) => !belum.has(a.sessionId)),
  };
}

/** Ganti semua data dengan skenario yang dipilih (tombol Setel Ulang Data Demo / Muat Data Demo). */
export async function resetDemoData(skenario: SkenarioDemo, today: ISODate = todayISO()): Promise<void> {
  await tanamDemo(skenario, today);
  setPrefs({ skenarioDemo: skenario, activePatientId: 'budi' });
  tulisLocal(AUTOSEED_KEY, null);
}

/** Hapus Semua Data Lokal (Bab 17.3): tanpa sisa, dan data demo tidak ditanam ulang otomatis. */
export async function hapusSemuaDataLokal(): Promise<void> {
  await clearAll();
  resetPrefs();
  setModeMandiriDipilih(false);
  tulisLocal(AUTOSEED_KEY, 'off');
}
