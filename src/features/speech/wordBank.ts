import type { Kata, KategoriKata } from './types';

/**
 * Bank 100 kata awal terapi afasia (Bab 8.1, AC-F3-1).
 *
 * Distribusi: benda di rumah 30, makanan dan minuman 25, keluarga dan orang 15, anggota tubuh 15,
 * kebutuhan harian 15. Semua contoh kata di tabel spesifikasi termasuk di dalamnya.
 *
 * Tingkat kesulitan (perkiraan beban artikulasi, bukan ukuran klinis):
 *   1 = dua suku kata terbuka/sederhana (na-si, ka-ki),
 *   2 = ada gugus konsonan, ng/nc/mp, atau tiga suku kata (pin-tu, ta-ngan, jen-de-la),
 *   3 = empat suku kata atau lebih, atau dua kata (te-le-vi-si, si-kat gi-gi).
 *
 * Gambar utama tiap kata adalah ilustrasi `public/ilustrasi/kata/<id>.webp` (`GambarKata`). Emoji di sini
 * hanya cadangan bila ilustrasi gagal dimuat (luring sebelum tersimpan di cache), dipilih dari Unicode ≤ 13.0
 * agar tampil di Android lama.
 *
 * Kolom `suku` ditulis dengan tanda '-' antar suku kata dan spasi antar kata.
 */

type Baris = [kata: string, emoji: string, tingkat: 1 | 2 | 3, suku: string, kalimatContoh: string, varian?: string[]];

function buat(kategori: KategoriKata, baris: Baris[]): Kata[] {
  return baris.map(([kata, emoji, tingkat, suku, kalimatContoh, varian]) => ({
    id: kata.replace(/\s+/g, '-'),
    kata,
    kategori,
    emoji,
    tingkat,
    kalimatContoh,
    sukuKata: suku.split(/[-\s]+/),
    ...(varian ? { varian } : {}),
  }));
}

const BENDA_RUMAH = buat('benda-rumah', [
  ['kursi', '🪑', 1, 'kur-si', 'Saya duduk di kursi.'],
  ['meja', '🪵', 1, 'me-ja', 'Gelas ada di atas meja.'],
  ['pintu', '🚪', 2, 'pin-tu', 'Tolong buka pintu.'],
  ['kunci', '🔑', 2, 'kun-ci', 'Kunci ada di dalam tas.'],
  ['gelas', '🥃', 1, 'ge-las', 'Saya minum dari gelas.'],
  ['piring', '🍽️', 1, 'pi-ring', 'Nasi ada di piring.'],
  ['sendok', '🥄', 2, 'sen-dok', 'Saya makan pakai sendok.'],
  ['handuk', '🧖', 2, 'han-duk', 'Handuk ada di kamar mandi.', ['anduk']],
  ['bantal', '🛌', 2, 'ban-tal', 'Bantal ini empuk sekali.'],
  ['lampu', '💡', 2, 'lam-pu', 'Tolong nyalakan lampu.'],
  ['kipas', '🌬️', 1, 'ki-pas', 'Kipas membuat kamar sejuk.'],
  ['sapu', '🧹', 1, 'sa-pu', 'Sapu ada di dapur.'],
  ['ember', '🪣', 2, 'em-ber', 'Ember ini penuh air.'],
  ['sabun', '🧼', 1, 'sa-bun', 'Cuci tangan pakai sabun.'],
  ['sikat gigi', '🪥', 3, 'si-kat gi-gi', 'Saya gosok gigi pakai sikat gigi.', ['sikatgigi']],
  ['kasur', '🛏️', 1, 'ka-sur', 'Kasur ini nyaman.'],
  ['jendela', '🪟', 2, 'jen-de-la', 'Buka jendela agar udara segar.'],
  ['televisi', '📺', 3, 'te-le-vi-si', 'Kita menonton televisi bersama.', ['tv', 'tivi', 'teve']],
  ['telepon', '☎️', 2, 'te-le-pon', 'Telepon di rumah berbunyi.', ['telpon', 'telefon']],
  ['jam', '🕒', 1, 'jam', 'Sekarang jam berapa?'],
  ['tas', '👜', 1, 'tas', 'Tas saya ada di kursi.'],
  ['sepatu', '👟', 2, 'se-pa-tu', 'Pakai sepatu sebelum jalan.'],
  ['sandal', '🩴', 2, 'san-dal', 'Sandal ada di depan pintu.', ['sendal']],
  ['baju', '👕', 1, 'ba-ju', 'Baju ini bersih dan wangi.'],
  ['payung', '☂️', 2, 'pa-yung', 'Bawa payung, nanti hujan.'],
  ['buku', '📖', 1, 'bu-ku', 'Saya membaca buku.'],
  ['kacamata', '👓', 3, 'ka-ca-ma-ta', 'Kacamata saya di atas meja.', ['kaca mata']],
  ['gunting', '✂️', 2, 'gun-ting', 'Gunting ada di laci.'],
  ['mangkuk', '🥣', 2, 'mang-kuk', 'Sup hangat ada di mangkuk.', ['mangkok']],
  ['radio', '📻', 2, 'ra-di-o', 'Bapak mendengarkan radio.'],
]);

const MAKANAN_MINUMAN = buat('makanan-minuman', [
  ['nasi', '🍚', 1, 'na-si', 'Saya makan nasi hangat.'],
  ['roti', '🍞', 1, 'ro-ti', 'Pagi ini saya makan roti.'],
  ['telur', '🥚', 1, 'te-lur', 'Telur rebus untuk sarapan.'],
  ['ayam', '🍗', 1, 'a-yam', 'Ibu memasak ayam goreng.'],
  ['ikan', '🐟', 1, 'i-kan', 'Ikan ini enak sekali.'],
  ['sayur', '🥬', 1, 'sa-yur', 'Sayur bayam masih hangat.', ['sayuran']],
  ['buah', '🍇🍓', 1, 'bu-ah', 'Saya suka makan buah.'],
  ['pisang', '🍌', 2, 'pi-sang', 'Pisang ini manis.'],
  ['air', '💧', 1, 'a-ir', 'Saya minum air putih.'],
  ['teh', '🍵', 1, 'teh', 'Saya minum teh manis.'],
  ['kopi', '☕', 1, 'ko-pi', 'Kopi pagi ini hangat.'],
  ['susu', '🥛', 1, 'su-su', 'Saya minum susu hangat.'],
  ['gula', '🍬', 1, 'gu-la', 'Tehnya pakai sedikit gula.'],
  ['garam', '🧂', 1, 'ga-ram', 'Sayur ini kurang garam.'],
  ['jeruk', '🍊', 1, 'je-ruk', 'Jeruk ini segar sekali.'],
  ['apel', '🍎', 1, 'a-pel', 'Apel merah itu manis.'],
  ['mangga', '🥭', 2, 'mang-ga', 'Mangga ini manis dan harum.'],
  ['semangka', '🍉', 3, 'se-mang-ka', 'Semangka segar di siang hari.'],
  ['jagung', '🌽', 2, 'ja-gung', 'Jagung rebus enak dan manis.'],
  ['tomat', '🍅', 1, 'to-mat', 'Tomat merah untuk sambal.'],
  ['wortel', '🥕', 2, 'wor-tel', 'Wortel ada di dalam sup.'],
  ['kentang', '🥔', 2, 'ken-tang', 'Ibu menggoreng kentang.'],
  ['mi', '🍜', 1, 'mi', 'Mi kuah hangat untuk makan malam.', ['mie']],
  ['sate', '🍢', 1, 'sa-te', 'Kita makan sate bersama.', ['satai', 'satay']],
  ['kue', '🍰', 1, 'ku-e', 'Ada kue untuk cucu.', ['kueh']],
]);

const KELUARGA_ORANG = buat('keluarga-orang', [
  ['ibu', '👩', 1, 'i-bu', 'Ibu sedang memasak di dapur.'],
  ['bapak', '👨', 1, 'ba-pak', 'Bapak duduk di teras.', ['bapa', 'pak']],
  ['anak', '🧒', 1, 'a-nak', 'Anak saya datang hari ini.'],
  ['istri', '👰', 2, 'is-tri', 'Istri saya membuat teh.'],
  ['suami', '🤵', 2, 'su-a-mi', 'Suami saya menemani latihan.'],
  ['kakak', '🧑', 1, 'ka-kak', 'Kakak datang berkunjung.'],
  ['adik', '👦', 1, 'a-dik', 'Adik saya tinggal dekat sini.'],
  ['nenek', '👵', 1, 'ne-nek', 'Nenek tersenyum melihat cucu.'],
  ['kakek', '👴', 1, 'ka-kek', 'Kakek membaca koran.'],
  ['dokter', '👨‍⚕️', 2, 'dok-ter', 'Dokter menyapa saya dengan ramah.'],
  ['perawat', '👩‍⚕️', 2, 'pe-ra-wat', 'Perawat datang membantu.'],
  ['bayi', '👶', 1, 'ba-yi', 'Bayi itu tidur nyenyak.'],
  ['cucu', '👧', 1, 'cu-cu', 'Cucu saya pintar menggambar.'],
  ['teman', '🤝', 1, 'te-man', 'Teman lama datang menjenguk.'],
  ['keluarga', '👨‍👩‍👧', 3, 'ke-lu-ar-ga', 'Keluarga selalu menemani saya.'],
]);

const ANGGOTA_TUBUH = buat('anggota-tubuh', [
  ['tangan', '✋', 2, 'ta-ngan', 'Saya mengangkat tangan.'],
  ['kaki', '🦶', 1, 'ka-ki', 'Kaki saya makin kuat.'],
  ['kepala', '👤', 2, 'ke-pa-la', 'Saya menggerakkan kepala pelan-pelan.'],
  ['mata', '👀', 1, 'ma-ta', 'Saya menutup mata sebentar.'],
  ['mulut', '👄', 1, 'mu-lut', 'Buka mulut lebar-lebar.'],
  ['bahu', '🤷', 1, 'ba-hu', 'Angkat bahu pelan-pelan.'],
  ['siku', '💪', 1, 'si-ku', 'Tekuk siku perlahan.'],
  ['lutut', '🦵', 1, 'lu-tut', 'Luruskan lutut pelan-pelan.'],
  ['jari', '☝️', 1, 'ja-ri', 'Gerakkan jari satu per satu.'],
  ['telinga', '👂', 2, 'te-li-nga', 'Telinga saya mendengar suara burung.'],
  ['hidung', '👃', 1, 'hi-dung', 'Tarik napas lewat hidung.'],
  ['gigi', '🦷', 1, 'gi-gi', 'Saya gosok gigi setiap pagi.'],
  ['lidah', '👅', 1, 'li-dah', 'Julurkan lidah sebentar.'],
  ['rambut', '💇', 2, 'ram-but', 'Rambut saya sudah disisir.'],
  ['wajah', '🙂', 1, 'wa-jah', 'Saya mencuci wajah.'],
]);

const KEBUTUHAN_HARIAN = buat('kebutuhan-harian', [
  ['makan', '😋', 1, 'ma-kan', 'Saya mau makan sekarang.'],
  ['minum', '🥤', 1, 'mi-num', 'Saya mau minum air.'],
  ['tidur', '😴', 1, 'ti-dur', 'Saya mau tidur sebentar.'],
  ['bangun', '⏰', 2, 'ba-ngun', 'Saya bangun pagi hari ini.'],
  ['duduk', '💺', 1, 'du-duk', 'Saya mau duduk dulu.'],
  ['berdiri', '🧍', 2, 'ber-di-ri', 'Saya berdiri pelan-pelan.'],
  ['tolong', '🆘', 1, 'to-long', 'Tolong ambilkan air.'],
  ['sakit', '🤒', 1, 'sa-kit', 'Kalau terasa sakit, bilang ya.'],
  ['lelah', '😩', 1, 'le-lah', 'Saya lelah, mau istirahat.'],
  ['pulang', '🏠', 1, 'pu-lang', 'Anak saya pulang sore ini.'],
  ['mandi', '🚿', 2, 'man-di', 'Saya mau mandi sekarang.'],
  ['jalan', '🚶', 1, 'ja-lan', 'Kita jalan pelan-pelan.'],
  ['obat', '💊', 1, 'o-bat', 'Sudah waktunya minum obat.'],
  ['dingin', '🥶', 2, 'di-ngin', 'Udara pagi ini dingin.'],
  ['panas', '🥵', 1, 'pa-nas', 'Hari ini panas sekali.'],
]);

/** Seluruh 100 kata, urut per kategori. */
export const KATA: readonly Kata[] = [
  ...BENDA_RUMAH,
  ...MAKANAN_MINUMAN,
  ...KELUARGA_ORANG,
  ...ANGGOTA_TUBUH,
  ...KEBUTUHAN_HARIAN,
];

export interface InfoKategori {
  id: KategoriKata;
  nama: string;
  deskripsi: string;
  /** Emoji wakil kategori (gambar kata, bukan dekorasi). */
  emoji: string;
  /** Jumlah kata wajib menurut Bab 8.1. */
  jumlah: number;
}

/** Metadata kategori sesuai urutan tabel Bab 8.1. */
export const KATEGORI: readonly InfoKategori[] = [
  { id: 'benda-rumah', nama: 'Benda di Rumah', deskripsi: 'Barang yang dipakai setiap hari di rumah.', emoji: '🪑', jumlah: 30 },
  { id: 'makanan-minuman', nama: 'Makanan dan Minuman', deskripsi: 'Makanan dan minuman sehari-hari.', emoji: '🍚', jumlah: 25 },
  { id: 'keluarga-orang', nama: 'Keluarga dan Orang', deskripsi: 'Orang terdekat dan yang sering ditemui.', emoji: '👵', jumlah: 15 },
  { id: 'anggota-tubuh', nama: 'Anggota Tubuh', deskripsi: 'Bagian tubuh yang sering digerakkan.', emoji: '✋', jumlah: 15 },
  { id: 'kebutuhan-harian', nama: 'Kebutuhan Harian', deskripsi: 'Kata untuk menyampaikan keinginan.', emoji: '😋', jumlah: 15 },
];

const PETA_KATA = new Map(KATA.map((k) => [k.id, k]));
const PETA_KATEGORI = new Map(KATEGORI.map((k) => [k.id, k]));

export function getKata(id: string): Kata | undefined {
  return PETA_KATA.get(id);
}

export function kataPerKategori(kategori: KategoriKata): Kata[] {
  return KATA.filter((k) => k.kategori === kategori);
}

export function getKategori(id: string): InfoKategori | undefined {
  return PETA_KATEGORI.get(id as KategoriKata);
}

export function isKategoriKata(x: string | null | undefined): x is KategoriKata {
  return !!x && PETA_KATEGORI.has(x as KategoriKata);
}

/** Petunjuk suku kata untuk ditampilkan, mis. 'kur-si' atau 'si-kat gi-gi'. */
export function petunjukSukuKata(k: Kata): string {
  const kataKata = k.kata.split(/\s+/);
  const hasil: string[] = [];
  let i = 0;
  for (const w of kataKata) {
    const bagian: string[] = [];
    let panjang = 0;
    while (i < k.sukuKata.length && panjang < w.length) {
      bagian.push(k.sukuKata[i]);
      panjang += k.sukuKata[i].length;
      i++;
    }
    hasil.push(bagian.join('-'));
  }
  return hasil.join(' ');
}
