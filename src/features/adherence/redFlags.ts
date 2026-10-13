import type { ISODate, JenisSesi, Session } from '@/types';
import { addDays, lastNDays } from '@/lib/date';
import { bandingkanSkorMingguan, hanyaSelesai, kepatuhanMingguan, targetHarian, type TargetHarian } from './adherence';

/**
 * Red flag non-medis (Bab 9.2). Penanda hanya menyarankan menghubungi terapis atau dokter yang merawat,
 * tidak pernah menafsirkan kondisi medis.
 */
export type IdRedFlag = 'tanpa-sesi-3-hari' | 'sempat-3-hari-kosong' | 'skor-turun' | 'kepatuhan-rendah';

export interface RedFlag {
  id: IdRedFlag;
  /** 'perhatian' = kuning, 'tinggi' = merah */
  tingkat: 'perhatian' | 'tinggi';
  judul: string;
  pesan: string;
}

export const HARI_KOSONG_MINIMAL = 3;
export const AMBANG_PENURUNAN_SKOR = 0.2;
export const AMBANG_KEPATUHAN_PERSEN = 40;

const SARAN_HUBUNGI = 'hubungi terapis atau dokter yang merawat';

export interface OpsiRedFlag {
  target?: TargetHarian;
  /** Hari kosong sebelum program dimulai tidak dihitung sebagai jeda. */
  mulaiProgram?: ISODate;
}

const NAMA_JENIS: Record<JenisSesi, string> = { gerak: 'latihan gerak', afasia: 'latihan bicara' };

export function hitungRedFlag(sessions: readonly Session[], today: ISODate, opsi: OpsiRedFlag = {}): RedFlag[] {
  const target = opsi.target ?? targetHarian();
  const hari = new Set(hanyaSelesai(sessions).map((s) => s.tanggal));
  const dalamProgram = (d: ISODate) => !opsi.mulaiProgram || d >= opsi.mulaiProgram;
  const flags: RedFlag[] = [];

  // (a) 3 hari berturut-turut tanpa sesi. Hari ini belum berakhir, jadi jeda berjalan dihitung mulai kemarin.
  let jeda = 0;
  if (!hari.has(today)) {
    for (let d = addDays(today, -1); !hari.has(d) && dalamProgram(d) && jeda < 14; d = addDays(d, -1)) jeda++;
  }
  if (jeda >= HARI_KOSONG_MINIMAL) {
    flags.push({
      id: 'tanpa-sesi-3-hari',
      tingkat: 'tinggi',
      judul: `Sudah ${jeda} hari belum latihan`,
      pesan: `Belum ada latihan tercatat dalam ${jeda} hari terakhir. Ajak mulai lagi dari satu latihan ringan hari ini. Bila ada keluhan atau latihan terasa berat, ${SARAN_HUBUNGI}.`,
    });
  } else {
    // Jeda sudah berakhir (pasien berlatih lagi), tetapi terjadi dalam 7 hari terakhir.
    let jalan = 0;
    let terpanjang = 0;
    for (const d of lastNDays(7, today)) {
      jalan = !hari.has(d) && d !== today && dalamProgram(d) ? jalan + 1 : 0;
      terpanjang = Math.max(terpanjang, jalan);
    }
    if (terpanjang >= HARI_KOSONG_MINIMAL) {
      flags.push({
        id: 'sempat-3-hari-kosong',
        tingkat: 'perhatian',
        judul: `Minggu ini sempat ${HARI_KOSONG_MINIMAL} hari berturut-turut tanpa latihan`,
        pesan: `Latihan sudah berjalan lagi, bagus. Ceritakan jeda ini saat ${SARAN_HUBUNGI} pada kesempatan berikutnya.`,
      });
    }
  }

  // (b) rata-rata skor 7 hari turun lebih dari 20% dibanding 7 hari sebelumnya, per jenis latihan.
  const turun = (['gerak', 'afasia'] as const)
    .map((jenis) => bandingkanSkorMingguan(sessions, jenis, today))
    .filter((p) => p.sekarang !== null && p.sebelum !== null && p.sebelum > 0 && (p.sebelum - p.sekarang) / p.sebelum > AMBANG_PENURUNAN_SKOR);
  if (turun.length > 0) {
    const rincian = turun.map((p) => `skor ${NAMA_JENIS[p.jenis]} dari ${p.sebelum} menjadi ${p.sekarang}`).join(', dan ');
    flags.push({
      id: 'skor-turun',
      tingkat: 'tinggi',
      judul: 'Skor latihan menurun minggu ini',
      pesan: `Rata-rata ${rincian} dibanding minggu sebelumnya. Sebaiknya ${SARAN_HUBUNGI} untuk membicarakannya.`,
    });
  }

  // (c) kepatuhan mingguan di bawah 40%.
  const k = kepatuhanMingguan(sessions, today, target, opsi.mulaiProgram);
  if (k.target > 0 && k.persen < AMBANG_KEPATUHAN_PERSEN) {
    flags.push({
      id: 'kepatuhan-rendah',
      tingkat: 'perhatian',
      judul: 'Latihan minggu ini masih sedikit',
      pesan: `Baru ${k.selesai} dari ${k.target} latihan terjadwal dalam 7 hari terakhir (${k.persen}%). Coba atur jam latihan bersama pasien. Bila latihan terasa sulit dijalankan, ${SARAN_HUBUNGI}.`,
    });
  }

  return flags.sort((a, b) => Number(b.tingkat === 'tinggi') - Number(a.tingkat === 'tinggi'));
}
