import { existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { EXERCISES } from '@/features/pose/exerciseDefinitions';
import { TARGET_MAKS } from '@/features/pose/sesiParams';
import { JUMLAH_KATA_SESI } from '@/features/speech/pilihKata';
import { KATA } from '@/features/speech/wordBank';
import { klipSuara } from './katalog';
import katalog from './katalogSuara.json';
import { semuaUcapan } from './semuaUcapan';
import {
  PESAN_RENTANG_KURANG,
  PESAN_SEMAMPUNYA,
  PESAN_TERLALU_CEPAT,
  ucapanBenar,
  ucapanCobaLagi,
  ucapanGantiSisi,
  ucapanHampir,
  ucapanHitungan,
  ucapanKalimatContoh,
  ucapanKataContoh,
  ucapanKoreksi,
  ucapanPesanLembut,
  ucapanPosisikan,
  ucapanRingkasanAfasia,
  ucapanSiap,
  ucapanTargetTercapai,
  ucapanTawarSisi,
  ucapanUlangBesok,
} from './ucapan';

const DIR_SUARA = fileURLToPath(new URL('../../../public/suara/', import.meta.url));
const daftar = semuaUcapan();
const terdaftar = new Set(daftar.map((s) => s.teks));

describe('semuaUcapan mencakup setiap ucapan yang bisa dibangun halaman', () => {
  it('sesi kamera: semua latihan, siap/pengingat, hitungan 1..TARGET_MAKS, koreksi, pesan lembut, sisi', () => {
    const ucapan = [
      ucapanPosisikan(),
      ucapanTargetTercapai(),
      ...[PESAN_TERLALU_CEPAT, PESAN_RENTANG_KURANG, PESAN_SEMAMPUNYA].map(ucapanPesanLembut),
      ...(['kanan', 'kiri'] as const).flatMap((s) => [ucapanTawarSisi(s), ucapanGantiSisi(s)]),
      ...Array.from({ length: TARGET_MAKS }, (_, i) => ucapanHitungan(i + 1)),
      ...EXERCISES.flatMap((def) => [
        ucapanSiap(true, def.wajibBerpegangan),
        ucapanSiap(false, def.wajibBerpegangan),
        ...def.koreksiUmum.map((k) => ucapanKoreksi(k.pesan)),
      ]),
    ];
    for (const segmen of ucapan) for (const s of segmen) expect(terdaftar, s).toContain(s);
  });

  it('latihan bicara: 100 kata, kalimat contoh, suku kata, umpan balik, ringkasan 0..10 untuk setiap skor', () => {
    const ucapan = [
      ucapanBenar(),
      ucapanUlangBesok(),
      ucapanCobaLagi(),
      ...KATA.flatMap((k) => [ucapanKataContoh(k), ucapanKalimatContoh(k), ucapanHampir(k)]),
    ];
    for (let benar = 0; benar <= JUMLAH_KATA_SESI; benar++) {
      for (let skor = 0; skor <= 100; skor++) ucapan.push(ucapanRingkasanAfasia(benar, skor));
    }
    for (const segmen of ucapan) for (const s of segmen) expect(terdaftar, s).toContain(s);
    expect(KATA).toHaveLength(100);
  });
});

describe('katalog klip suara', () => {
  it('setiap segmen punya klip yang berkasnya ada di public/suara', () => {
    const hilang = daftar.filter((s) => {
      const klip = klipSuara(s.teks);
      return !klip || !existsSync(`${DIR_SUARA}${klip.url.slice('/suara/'.length)}`);
    });
    expect(hilang.map((s) => s.teks)).toEqual([]);
  });

  it('katalog tidak memuat entri yatim dan setiap klip punya durasi', () => {
    const entri = Object.entries(katalog as Record<string, { berkas: string; ms: number }>);
    expect(entri.filter(([teks]) => !terdaftar.has(teks)).map(([teks]) => teks)).toEqual([]);
    for (const [teks, e] of entri) {
      expect(e.berkas, teks).toMatch(/^[0-9a-f]{12}-[0-9a-f]{6}\.mp3$/);
      expect(e.ms, teks).toBeGreaterThan(100);
    }
  });

  it('public/suara hanya berisi klip yang dipakai katalog', () => {
    const dipakai = new Set(Object.values(katalog as Record<string, { berkas: string }>).map((e) => e.berkas));
    expect(readdirSync(DIR_SUARA).filter((f) => !dipakai.has(f))).toEqual([]);
  });

  it('teks tak dikenal tidak punya klip (pemutar jatuh ke speechSynthesis)', () => {
    expect(klipSuara('Kalimat yang tidak pernah dibuat.')).toBeNull();
    expect(klipSuara('toString')).toBeNull();
  });
});
