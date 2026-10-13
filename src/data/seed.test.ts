import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SkenarioDemo } from '@/types';
import { buatLaporan } from '@/features/adherence/laporan';
import { addDays, todayISO } from '@/lib/date';
import { getPrefs, resetPrefs } from '@/lib/prefs';
import { clearAll, getProgram, getSchedule, getSession, listProfiles, listRepLogs, listSessions, listSpeechAttempts, putProgram, putSchedule, putSession } from './db';
import { AUTOSEED_KEY, buatDataDemo, ensureDemoData, hapusSemuaDataLokal, resetDemoData, tanggalTanamDemoUtuh } from './seed';

// localStorage sederhana untuk lingkungan node (prefs & penanda autoseed dibaca saat dipanggil, bukan saat impor).
const store = new Map<string, string>();
vi.stubGlobal('localStorage', {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => void store.set(k, String(v)),
  removeItem: (k: string) => void store.delete(k),
  clear: () => store.clear(),
  key: (i: number) => [...store.keys()][i] ?? null,
  get length() {
    return store.size;
  },
});

const TODAY = '2026-10-13';

function laporanDemo(skenario: SkenarioDemo, id = 'budi', today = TODAY) {
  const data = buatDataDemo(skenario, today);
  return buatLaporan(
    data.sessions.filter((s) => s.patientId === id),
    today,
    { schedule: data.schedules.find((s) => s.patientId === id), profile: data.profiles.find((p) => p.id === id) },
  );
}

describe('buatDataDemo', () => {
  it('deterministik: dua kali bangkit menghasilkan data yang sama persis', () => {
    expect(buatDataDemo('stagnasi', TODAY)).toEqual(buatDataDemo('stagnasi', TODAY));
    expect(buatDataDemo('rajin', TODAY)).toEqual(buatDataDemo('rajin', TODAY));
  });

  it('3 profil samaran berlabel demo, program & jadwal bawaan', () => {
    const d = buatDataDemo('stagnasi', TODAY);
    expect(d.profiles.map((p) => p.id).sort()).toEqual(['budi', 'joko', 'sari']);
    expect(d.profiles.every((p) => p.isDemo)).toBe(true);
    expect(d.profiles.find((p) => p.id === 'budi')).toMatchObject({ namaSamaran: 'Pak Budi', usia: 58, sisiLemah: 'kanan', keterangan: 'Stroke 3 bulan lalu' });
    const program = d.programs.find((p) => p.patientId === 'budi')!;
    expect(program.items.map((i) => [i.latihanId, i.targetRepetisi, i.set])).toEqual([
      ['fleksi-siku', 10, 1],
      ['fleksi-bahu', 10, 1],
      ['abduksi-bahu', 8, 1],
    ]);
    expect(program).toMatchObject({ frekuensiPerMinggu: 7, dibuatOleh: 'Terapis (demo)' });
    expect(d.schedules.every((s) => s.jamGerak === '08:00' && s.jamAfasia === '16:00' && !s.notifikasiAktif)).toBe(true);
    expect(d.sessions.every((s) => s.isDemo && s.selesai)).toBe(true);
  });

  it('riwayat 14 hari berakhir kemarin, tanpa sesi hari ini', () => {
    const d = buatDataDemo('rajin', TODAY);
    const tanggal = d.sessions.map((s) => s.tanggal).sort();
    expect(tanggal[0]).toBe(addDays(TODAY, -14));
    expect(tanggal.at(-1)).toBe(addDays(TODAY, -1));
  });

  it('stagnasi: 3 hari terakhir sebelum hari ini kosong, relatif terhadap tanggal hari ini', () => {
    for (const today of [TODAY, '2027-01-02']) {
      const budi = buatDataDemo('stagnasi', today).sessions.filter((s) => s.patientId === 'budi');
      const hari = new Set(budi.map((s) => s.tanggal));
      expect([1, 2, 3].some((n) => hari.has(addDays(today, -n)))).toBe(false);
      expect(hari.has(addDays(today, -4))).toBe(true);
    }
  });

  it('stagnasi: hanya red flag (a); kepatuhan >= 40% dan skor tidak turun', () => {
    const lap = laporanDemo('stagnasi');
    expect(lap.redFlags.map((f) => f.id)).toEqual(['tanpa-sesi-3-hari']);
    expect(lap.redFlags[0].tingkat).toBe('tinggi');
    expect(lap.kepatuhan.persen).toBeGreaterThanOrEqual(40);
  });

  it('stagnasi: setelah Pak Budi berlatih hari ini, penanda berubah menjadi perhatian', () => {
    const data = buatDataDemo('stagnasi', TODAY);
    const budi = data.sessions.filter((s) => s.patientId === 'budi');
    const hariIni = { ...budi.at(-1)!, id: 'baru', tanggal: TODAY };
    const lap = buatLaporan([...budi, hariIni], TODAY);
    expect(lap.redFlags.map((f) => f.id)).toEqual(['sempat-3-hari-kosong']);
    expect(lap.streak.saatIni).toBe(1);
  });

  it('skor gerak dan bicara naik perlahan', () => {
    const lap = laporanDemo('stagnasi');
    const gerak = lap.tren.map((t) => t.gerak).filter((x): x is number => x !== null);
    const afasia = lap.tren.map((t) => t.afasia).filter((x): x is number => x !== null);
    expect(gerak[0]).toBeLessThan(gerak.at(-1)!);
    expect(afasia[0]).toBeLessThan(afasia.at(-1)!);
    expect(gerak[0]).toBeGreaterThanOrEqual(48);
    expect(gerak.at(-1)!).toBeLessThanOrEqual(78);
  });

  it('rajin: tanpa red flag sama sekali, streak berlanjut', () => {
    const lap = laporanDemo('rajin');
    expect(lap.redFlags).toEqual([]);
    expect(lap.streak.saatIni).toBe(14);
    expect(lap.streak.perluLanjutHariIni).toBe(true);
  });

  it('pasien lain: Bu Sari rajin tanpa penanda, Pak Joko kepatuhan sedang', () => {
    expect(laporanDemo('stagnasi', 'sari').redFlags).toEqual([]);
    const joko = laporanDemo('stagnasi', 'joko');
    expect(joko.kepatuhan.persen).toBeGreaterThanOrEqual(40);
    expect(joko.kepatuhan.persen).toBeLessThan(laporanDemo('stagnasi', 'sari').kepatuhan.persen);
  });

  it('RepLog & SpeechAttempt realistis dan konsisten dengan sesi', () => {
    const d = buatDataDemo('stagnasi', TODAY);
    for (const s of d.sessions.filter((x) => x.jenis === 'gerak')) {
      const logs = d.repLogs.filter((l) => l.sessionId === s.id);
      expect(logs.filter((l) => l.dihitung)).toHaveLength(s.repetisiTercapai);
      expect(logs.map((l) => l.nomor)).toEqual(logs.map((_, i) => i + 1));
      const k = s.skorKomponen!;
      expect(s.skor).toBe(Math.round(0.5 * k.repetisi + 0.3 * k.rentang + 0.2 * k.tempo));
    }
    for (const s of d.sessions.filter((x) => x.jenis === 'afasia')) {
      const att = d.speechAttempts.filter((a) => a.sessionId === s.id);
      expect(new Set(att.map((a) => a.kataId)).size).toBe(10);
      expect(att.every((a) => a.nomorPercobaan >= 1 && a.nomorPercobaan <= 3)).toBe(true);
      const r = s.ringkasanAfasia!;
      expect(r.benar + r.hampir + r.belum).toBe(10);
      expect(s.repetisiTercapai).toBe(r.benar);
    }
  });
});

describe('penyimpanan demo', () => {
  beforeEach(async () => {
    await clearAll();
    store.clear();
    resetPrefs();
  });

  it('ensureDemoData menanam saat kosong dan tidak menimpa data yang ada', async () => {
    await ensureDemoData();
    expect((await listProfiles()).length).toBe(3);
    const jumlah = (await listSessions('budi')).length;
    expect(jumlah).toBeGreaterThan(0);
    await ensureDemoData();
    expect((await listSessions('budi')).length).toBe(jumlah);
    expect(await getProgram('budi')).toBeDefined();
    expect(await getSchedule('budi')).toMatchObject({ jamGerak: '08:00', jamAfasia: '16:00' });
    const gerak = (await listSessions('budi', { jenis: 'gerak' }))[0];
    expect((await listRepLogs(gerak.id)).length).toBeGreaterThan(0);
    const afasia = (await listSessions('budi', { jenis: 'afasia' }))[0];
    expect((await listSpeechAttempts(afasia.id)).length).toBeGreaterThanOrEqual(10);
  });

  it('resetDemoData mengganti skenario dan menyimpan pilihan', async () => {
    await ensureDemoData();
    await resetDemoData('rajin');
    expect(getPrefs().skenarioDemo).toBe('rajin');
    const sesi = await listSessions('budi');
    const lap = buatLaporan(sesi, todayISO(), { profile: (await listProfiles()).find((p) => p.id === 'budi') });
    expect(lap.redFlags).toEqual([]);
    await resetDemoData('stagnasi');
    const lap2 = buatLaporan(await listSessions('budi'), todayISO());
    expect(lap2.redFlags.map((f) => f.id)).toEqual(['tanpa-sesi-3-hari']);
  });

  it('Hapus Semua Data Lokal: tanpa sisa dan tidak ditanam ulang otomatis; Reset menghidupkan lagi', async () => {
    await ensureDemoData();
    await hapusSemuaDataLokal();
    expect(await listProfiles()).toEqual([]);
    expect(await listSessions('budi', { hanyaSelesai: false })).toEqual([]);
    expect(localStorage.getItem(AUTOSEED_KEY)).toBe('off');
    await ensureDemoData();
    expect(await listProfiles()).toEqual([]);
    await resetDemoData('stagnasi');
    expect(localStorage.getItem(AUTOSEED_KEY)).toBeNull();
    expect((await listProfiles()).length).toBe(3);
  });

  it('data demo dari hari sebelumnya yang belum diubah ditanam ulang untuk hari ini (skenario selalu sama)', async () => {
    await ensureDemoData('2026-10-10');
    expect(tanggalTanamDemoUtuh(buatDataDemo('stagnasi', '2026-10-10'))).toBe('2026-10-10');
    // Dibuka lagi 3 hari kemudian: tanpa penanaman ulang Pak Budi akan "6 hari belum latihan".
    await ensureDemoData(TODAY);
    const budi = (await listProfiles()).find((p) => p.id === 'budi')!;
    expect(budi.tanggalMulaiProgram).toBe(addDays(TODAY, -14));
    const sesi = await listSessions('budi', { hanyaSelesai: false });
    expect(sesi.every((s) => s.tanggal >= addDays(TODAY, -14) && s.tanggal < TODAY)).toBe(true);
    const lap = buatLaporan(sesi, TODAY, { profile: budi, schedule: await getSchedule('budi') });
    expect(lap.redFlags.map((f) => f.judul)).toEqual(['Sudah 3 hari belum latihan']);
    // Tidak ada sisa rekaman repetisi dari penanaman lama.
    expect(await listRepLogs(`demo-budi-${addDays('2026-10-10', -14)}-fleksi-siku`)).toEqual([]);
  });

  it('skenario rajin yang dibuka hari berikutnya tetap tanpa penanda', async () => {
    await resetDemoData('rajin', '2026-10-11');
    await ensureDemoData(TODAY);
    const budi = (await listProfiles()).find((p) => p.id === 'budi')!;
    expect(budi.tanggalMulaiProgram).toBe(addDays(TODAY, -14));
    expect(buatLaporan(await listSessions('budi'), TODAY, { profile: budi }).redFlags).toEqual([]);
  });

  it('data yang sudah memuat sesi pengguna, resep, atau jadwal yang diubah tidak ditanam ulang', async () => {
    const LALU = '2026-10-10';
    const cek = async (ubah: () => Promise<void>) => {
      await clearAll();
      await ensureDemoData(LALU);
      await ubah();
      await ensureDemoData(TODAY);
      return (await listProfiles()).find((p) => p.id === 'budi')!.tanggalMulaiProgram;
    };
    const mulaiLama = addDays(LALU, -14);
    // Sesi pengguna (juga yang dihentikan sebelum selesai) selalu berlabel bukan demo.
    const sesiPengguna = { ...buatDataDemo('stagnasi', LALU).sessions[0], id: 'pengguna-1', tanggal: LALU, selesai: false, isDemo: false };
    expect(await cek(() => putSession(sesiPengguna))).toBe(mulaiLama);
    expect((await getSession('pengguna-1'))?.isDemo).toBe(false);
    expect(await cek(async () => putProgram({ ...(await getProgram('budi'))!, tanggalUbah: Date.now() }))).toBe(mulaiLama);
    expect(await cek(async () => putSchedule({ ...(await getSchedule('budi'))!, jamGerak: '07:30' }))).toBe(mulaiLama);
    expect(await cek(async () => undefined)).toBe(addDays(TODAY, -14));
  });

  it('dibuka lagi pada hari yang sama tidak mengubah apa pun', async () => {
    await ensureDemoData(TODAY);
    const sebelum = await listSessions('budi', { hanyaSelesai: false });
    await ensureDemoData(TODAY);
    expect(await listSessions('budi', { hanyaSelesai: false })).toEqual(sebelum);
  });
});
