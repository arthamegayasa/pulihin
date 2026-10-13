import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { HasilKata, Session, SkenarioDemo } from '@/types';
import { buatLaporan } from '@/features/adherence/laporan';
import { getExercise } from '@/features/pose/exerciseDefinitions';
import { hitungSkor } from '@/features/pose/scoring';
import { ambangAtasRentang } from '@/features/pose/tracker';
import { saranSesiAfasia } from '@/features/speech/pesanAfasia';
import { ringkasSesi } from '@/features/speech/SpeechScorer';
import { addDays, todayISO } from '@/lib/date';
import { getPrefs, resetPrefs } from '@/lib/prefs';
import { addRepLogs, addSpeechAttempt, clearAll, getProgram, getSchedule, getSession, listProfiles, listRepLogs, listSessions, listSpeechAttempts, putProgram, putSchedule, putSession } from './db';
import { AUTOSEED_KEY, bersihkanSesiBelumSelesai, buatCadangan, buatDataDemo, ensureDemoData, hapusSemuaDataLokal, resetDemoData, tanggalTanamDemoUtuh } from './seed';

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
    // Target rentang personal: Pak Budi rentang penuh (alur video), Pak Joko abduksi 80%.
    expect(program.items.every((i) => i.rentangPersen === undefined)).toBe(true);
    const joko = d.programs.find((p) => p.patientId === 'joko')!;
    expect(joko.items.find((i) => i.latihanId === 'abduksi-bahu')?.rentangPersen).toBe(80);
    expect(joko.items.filter((i) => i.rentangPersen !== undefined)).toHaveLength(1);
    const sesiAbduksiJoko = d.sessions.filter((s) => s.patientId === 'joko' && s.latihanId === 'abduksi-bahu');
    expect(sesiAbduksiJoko.length).toBeGreaterThan(0);
    expect(sesiAbduksiJoko.every((s) => s.rentangPersen === 80)).toBe(true);
    expect(d.sessions.filter((s) => s.patientId !== 'joko' || s.latihanId !== 'abduksi-bahu').every((s) => s.rentangPersen === undefined)).toBe(true);
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
    // Sesi pengguna (juga yang dihentikan sebelum target) selalu berlabel bukan demo.
    const sesiPengguna = { ...buatDataDemo('stagnasi', LALU).sessions[0], id: 'pengguna-1', tanggal: LALU, selesai: true, isDemo: false };
    expect(await cek(() => putSession(sesiPengguna))).toBe(mulaiLama);
    expect((await getSession('pengguna-1'))?.isDemo).toBe(false);
    // Sesi hari ini yang belum selesai tetapi sudah punya percobaan juga aktivitas pengguna.
    const sesiBerjalan = { ...sesiPengguna, id: 'pengguna-2', tanggal: TODAY, selesai: false };
    expect(
      await cek(async () => {
        await putSession(sesiBerjalan);
        await addRepLogs([{ sessionId: 'pengguna-2', nomor: 1, dihitung: true, sudutPuncak: 120, durasiSiklusDetik: 3, koreksi: [] }]);
      }),
    ).toBe(mulaiLama);
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

  it('layar latihan yang hanya dibuka (sesi belum selesai tanpa percobaan) tidak menghentikan penyegaran demo', async () => {
    await ensureDemoData('2026-10-10');
    const kosong = { ...buatDataDemo('stagnasi', TODAY).sessions[0], id: 'afasia-dibuka', tanggal: TODAY, jenis: 'afasia' as const, selesai: false, isDemo: false };
    await putSession(kosong);
    await ensureDemoData(TODAY);
    expect((await listProfiles()).find((p) => p.id === 'budi')!.tanggalMulaiProgram).toBe(addDays(TODAY, -14));
    const lap = buatLaporan(await listSessions('budi'), TODAY, { schedule: await getSchedule('budi') });
    expect(lap.redFlags.map((f) => f.judul)).toEqual(['Sudah 3 hari belum latihan']);
  });

  describe('bersih-bersih sesi belum selesai (muat ulang / tutup tab di tengah sesi)', () => {
    const MULAI = new Date(2026, 9, 13, 9, 0).getTime();
    const sesiYatim = (ubah: Partial<Session> & Pick<Session, 'id'>): Session => ({
      ...buatDataDemo('stagnasi', TODAY).sessions[0],
      patientId: 'budi',
      tanggal: TODAY,
      mulaiAt: MULAI,
      selesaiAt: null,
      jenis: 'gerak',
      latihanId: 'fleksi-siku',
      kategoriKata: null,
      repetisiTarget: 10,
      repetisiTercapai: 0,
      skor: 0,
      skorKomponen: null,
      ringkasanAfasia: null,
      durasiDetik: 0,
      selesai: false,
      saran: null,
      rentangPersen: undefined,
      isDemo: false,
      ...ubah,
    });
    const rep = (sessionId: string, nomor: number, dihitung: boolean, sudutPuncak: number, durasiSiklusDetik = 3) => ({
      sessionId,
      nomor,
      dihitung,
      sudutPuncak,
      durasiSiklusDetik,
      koreksi: [],
    });

    it('sesi gerak dengan RepLog dituntaskan: skor dihitung ulang dari RepLog (rentang sesi), durasi tercatat dipertahankan', async () => {
      await ensureDemoData(TODAY);
      // Penghitung terakhir yang tertulis bersama percobaan ke-4 (durasi sampai percobaan terakhir).
      await putSession(sesiYatim({ id: 'muat-ulang', latihanId: 'abduksi-bahu', repetisiTarget: 8, rentangPersen: 80, durasiDetik: 41 }));
      const logs = [rep('muat-ulang', 1, true, 84), rep('muat-ulang', 2, true, 85), rep('muat-ulang', 3, false, 60), rep('muat-ulang', 4, true, 86)];
      await addRepLogs(logs);

      expect(await bersihkanSesiBelumSelesai(undefined, Date.now())).toEqual({ dituntaskan: 1, dihapus: 0 });
      const def = getExercise('abduksi-bahu')!;
      const harap = hitungSkor({
        repLogs: logs,
        targetRepetisi: 8,
        ambangAtas: ambangAtasRentang(def, 80),
        ambangBawah: def.ambangBawah,
        tempoTargetDetik: def.tempoTargetDetik,
      });
      expect(await getSession('muat-ulang')).toMatchObject({
        selesai: true,
        repetisiTercapai: 3,
        skor: harap.skor,
        skorKomponen: harap.skorKomponen,
        saran: harap.saran,
        durasiDetik: 41,
        selesaiAt: MULAI + 41_000,
        rentangPersen: 80,
      });
      expect(harap.skor).toBeGreaterThan(0);
      expect(await listRepLogs('muat-ulang')).toHaveLength(4);
      // Kini masuk riwayat: Beranda/Keluarga melihatnya sebagai latihan hari ini.
      expect((await listSessions('budi', { dari: TODAY })).map((s) => s.id)).toContain('muat-ulang');
    });

    it('hanya percobaan yang belum terhitung (0 repetisi) tetap dituntaskan, tidak dibuang', async () => {
      await ensureDemoData(TODAY);
      await putSession(sesiYatim({ id: 'nol', latihanId: 'abduksi-bahu', repetisiTarget: 8, durasiDetik: 23 }));
      await addRepLogs([rep('nol', 1, false, 74), rep('nol', 2, false, 76)]);

      expect(await bersihkanSesiBelumSelesai(undefined, Date.now())).toEqual({ dituntaskan: 1, dihapus: 0 });
      const s = await getSession('nol');
      expect(s).toMatchObject({ selesai: true, repetisiTercapai: 0, durasiDetik: 23 });
      expect(s!.skorKomponen!.rentang).toBeGreaterThan(0);
    });

    it('catatan lama tanpa durasi: durasi = jumlah lama siklus', async () => {
      await ensureDemoData(TODAY);
      await putSession(sesiYatim({ id: 'lama' }));
      await addRepLogs([rep('lama', 1, true, 120, 3.4), rep('lama', 2, true, 121, 3.3)]);
      await bersihkanSesiBelumSelesai(undefined, Date.now());
      expect(await getSession('lama')).toMatchObject({ selesai: true, repetisiTercapai: 2, durasiDetik: 7, selesaiAt: MULAI + 7000 });
    });

    it('sesi afasia dengan percobaan dituntaskan lewat ringkasan modul bicara; kata yang belum dicoba = Belum', async () => {
      await ensureDemoData(TODAY);
      await putSession(sesiYatim({ id: 'afasia-putus', jenis: 'afasia', latihanId: null, kategoriKata: 'benda', repetisiTarget: 10 }));
      const coba = (kataId: string, kategoriHasil: HasilKata, nomorPercobaan: number, detik: number) =>
        addSpeechAttempt({ sessionId: 'afasia-putus', kataId, teksHasil: '', kategoriHasil, skor: 0, nomorPercobaan, mode: 'mandiri', at: MULAI + detik * 1000 });
      await coba('kursi', 'benar', 1, 10);
      await coba('meja', 'hampir', 1, 20);
      await coba('meja', 'belum', 2, 30);

      expect(await bersihkanSesiBelumSelesai(undefined, Date.now())).toEqual({ dituntaskan: 1, dihapus: 0 });
      const r = ringkasSesi(['kursi', 'meja'], [
        { kataId: 'kursi', kategoriHasil: 'benar', nomorPercobaan: 1 },
        { kataId: 'meja', kategoriHasil: 'hampir', nomorPercobaan: 1 },
        { kataId: 'meja', kategoriHasil: 'belum', nomorPercobaan: 2 },
      ]);
      expect(await getSession('afasia-putus')).toMatchObject({
        selesai: true,
        selesaiAt: MULAI + 30_000,
        durasiDetik: 30,
        repetisiTercapai: 1,
        // (100 + 40 + 8 kata belum dicoba x 0) / 10
        skor: 14,
        ringkasanAfasia: { benar: 1, hampir: 1, belum: 8, kataUlang: ['meja'] },
        saran: saranSesiAfasia(r),
      });
    });

    it('tanpa percobaan dihapus; sesi yang dimulai setelah aplikasi dibuka tidak disentuh', async () => {
      await ensureDemoData(TODAY);
      await putSession(sesiYatim({ id: 'kosong-gerak', tanggal: addDays(TODAY, -1) }));
      await putSession(sesiYatim({ id: 'kosong-afasia', jenis: 'afasia', latihanId: null }));
      const dibuka = Date.now();
      await putSession(sesiYatim({ id: 'berjalan', mulaiAt: dibuka + 1000 }));
      await addRepLogs([rep('berjalan', 1, true, 120)]);
      const selesaiSebelum = await listSessions('budi');

      expect(await bersihkanSesiBelumSelesai(undefined, dibuka)).toEqual({ dituntaskan: 0, dihapus: 2 });
      expect(await getSession('kosong-gerak')).toBeUndefined();
      expect(await getSession('kosong-afasia')).toBeUndefined();
      expect(await getSession('berjalan')).toMatchObject({ selesai: false, repetisiTercapai: 0 });
      expect(await listRepLogs('berjalan')).toHaveLength(1);
      // Sesi selesai tidak berubah.
      expect(await listSessions('budi')).toEqual(selesaiSebelum);
    });

    it('berjalan otomatis saat aplikasi dibuka (ensureDemoData)', async () => {
      await ensureDemoData(TODAY);
      await putSession(sesiYatim({ id: 'reload', durasiDetik: 12 }));
      await addRepLogs([rep('reload', 1, true, 120), rep('reload', 2, true, 119), rep('reload', 3, true, 121)]);
      await putSession(sesiYatim({ id: 'dibuka-saja' }));
      await ensureDemoData(TODAY);
      expect(await getSession('reload')).toMatchObject({ selesai: true, repetisiTercapai: 3, durasiDetik: 12 });
      expect(await getSession('dibuka-saja')).toBeUndefined();
    });
  });

  it('berkas cadangan tidak memuat sesi yang belum selesai', async () => {
    await ensureDemoData(TODAY);
    const dasar = { ...buatDataDemo('stagnasi', TODAY).sessions[0], id: 'berjalan', tanggal: TODAY, selesai: false, isDemo: false };
    await putSession(dasar);
    await addRepLogs([{ sessionId: 'berjalan', nomor: 1, dihitung: true, sudutPuncak: 120, durasiSiklusDetik: 3, koreksi: [] }]);
    const b = await buatCadangan();
    expect(b.sessions.some((s) => s.id === 'berjalan' || !s.selesai)).toBe(false);
    expect(b.repLogs.some((r) => r.sessionId === 'berjalan')).toBe(false);
    expect(b.sessions.length).toBeGreaterThan(0);
    expect(b.repLogs.length).toBeGreaterThan(0);
  });
});
