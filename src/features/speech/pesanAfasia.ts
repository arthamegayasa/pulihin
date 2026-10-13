/** Kalimat penyemangat modul afasia. Nada hangat, tidak menyalahkan (Bab 12.4). */

/**
 * Satu saran sederhana untuk sesi berikutnya (disimpan di Session.saran). Tampil di bawah pesan hangat,
 * jadi saran tidak memuat pujian sendiri agar kata pujian tidak terulang di kartu yang sama.
 */
export function saranSesiAfasia({ benar, kataUlang }: { benar: number; kataUlang: readonly string[] }): string {
  if (kataUlang.length === 0) return 'Semua kata lancar. Besok coba kategori lain agar kosakata makin luas.';
  if (benar >= 7) return `Besok ulangi ${kataUlang.length} kata yang belum lancar, pelan-pelan per suku kata.`;
  return `Besok ulangi ${kataUlang.length} kata yang belum lancar. Dengarkan contohnya dulu, lalu ucapkan per suku kata.`;
}

/** Pesan hangat di layar ringkasan, sesuai skor latihan. */
export function pesanHangatAfasia(skor: number): string {
  if (skor >= 80) return 'Luar biasa! Latihan bicara hari ini berjalan sangat baik.';
  if (skor >= 60) return 'Bagus sekali! Sedikit lagi semua kata lancar.';
  if (skor >= 40) return 'Terima kasih sudah berlatih hari ini. Besok kita coba naik sedikit.';
  return 'Setiap kata yang dicoba adalah langkah maju. Besok kita coba lagi bersama, pelan-pelan.';
}
