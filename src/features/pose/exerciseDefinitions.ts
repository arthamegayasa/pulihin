import type { ExerciseDefinition, KoreksiDefinisi } from './types';

/**
 * SATU-SATUNYA tempat angka ambang modul gerak (Bab 6 catatan, AC-F2).
 * Logika (RepCounter, FormChecker, tracker, scoring) hanya membaca nilai dari file ini, sehingga
 * mengganti ambang di sini mengubah perilaku hitungan tanpa mengubah kode logika.
 */

/** Aturan algoritma umum (Bab 5.1, 7.1, 7.2, 7.3, 5.3) yang berlaku untuk semua latihan. */
export const ATURAN_UMUM = {
  /** Histeresis bawaan bila definisi tidak mengisi `histeresis` (Bab 7.2). */
  histeresisBawaan: 5,
  /** Siklus lebih cepat dari ini dicatat sebagai percobaan, tidak dihitung (Bab 7.2). */
  durasiRepetisiMinDetik: 1,
  /** Landmark dengan visibility di bawah ini membuat frame diabaikan (Bab 7.1). */
  ambangVisibilitas: 0.5,
  /** Tubuh harus terlihat stabil selama ini sebelum hitungan dimulai (Bab 5.1 langkah 4). */
  stabilSiapDetik: 1,
  /** Celah deteksi sesingkat ini (mis. 1-3 frame hilang) tidak memutus masa stabil. */
  toleransiCelahDetik: 0.25,
  /** Moving average sudut, 3..5 frame (Bab 7.1). */
  jendelaRataBawaan: 4,
  jendelaRataMin: 3,
  jendelaRataMaks: 5,
  /**
   * Sumber sudut 'hibrida' (AngleCalculator.bobot2D): pemendekan relatif ruas sendi
   * p = min(r, 1/r), r = rasio panjang dua ruas pada gambar / rasio yang sama pada 3D.
   * p >= pemendekan2D -> murni 2D; p <= pemendekan3D -> murni 3D; di antaranya dicampur linear.
   * Dikalibrasi pada rekaman nyata (seated.y4m): lengan menggantung/menekuk penuh p 0,5-1,0,
   * lengan bawah mengarah ke kamera di tengah gerak p 0,08-0,35.
   */
  hibrida: { pemendekan2D: 0.7, pemendekan3D: 0.35 },
  /** Pesan "sisi lain terlihat" baru diberikan bila keadaan itu bertahan selama ini. */
  sisiLainTahanDetik: 1,
  /**
   * Pemilihan orang utama bila MediaPipe mendeteksi lebih dari satu orang (PoseEngine.pilihPoseUtama).
   * skor = ukuran batang tubuh x (1 - bobotPusat x jarak pusat ke tengah gambar), dikali
   * faktorLengket bila pusat orang berada dalam radiusLengket x ukuran dari pusat orang utama
   * frame sebelumnya (agar tidak berpindah-pindah antar orang).
   */
  pilihOrang: { bobotPusat: 0.5, faktorLengket: 2, radiusLengket: 0.5 },
  koreksi: {
    /**
     * Badan-miring tidak dinilai bila lebar bahu pada gambar < rasio ini x panjang batang tubuh pada
     * gambar (badan berputar ~> 50°). Menghadap kamera ~0,81 (rekaman nyata seated); curl2 serong 0,32.
     */
    rasioLebarBahuMin: 0.5,
    /** Kondisi kontinu harus bertahan sekian sebelum pesan dimunculkan (AC-F1-3). */
    tahanBawaanDetik: 0.5,
    /** Tiap pesan tampil minimal sekian (Bab 7.3). */
    tampilMinDetik: 1.5,
    /** Pesan yang sama tidak diulang dalam jeda ini sejak terakhir selesai tampil (Bab 7.3). */
    jedaUlangDetik: 4,
    /** Pesan berbasis peristiwa (rentang, tempo) tampil sekian lalu hilang. */
    tampilPeristiwaDetik: 2.5,
    /** Pesan peristiwa yang tertahan pesan lain lebih lama dari ini dibuang (sudah basi). */
    kedaluwarsaPeristiwaDetik: 3,
    /** Rentang kurang / tempo cepat harus terjadi sekian kali berturut-turut (Bab 7.3). */
    berturutTurut: 2,
  },
  skor: {
    bobotRepetisi: 0.5,
    bobotRentang: 0.3,
    bobotTempo: 0.2,
    /** Porsi skor tempo dari siklus yang berada dalam tempoTargetDetik; sisanya dari kestabilan. */
    porsiTempoDalamTarget: 0.7,
    /** Koefisien variasi durasi siklus yang membuat nilai kestabilan menjadi 0. */
    koefisienVariasiMaks: 0.5,
    /** Bila semua komponen >= ini, saran berupa pujian untuk mempertahankan. */
    ambangPujian: 85,
  },
} as const;

/**
 * Prioritas penayangan koreksi (indeks kecil = lebih penting). Bab 7.3:
 * keluar-frame > badan-miring > bahu-terangkat > rentang-kurang > tempo-cepat.
 */
export const PRIORITAS_KOREKSI = [
  'keluar-frame',
  'badan-miring',
  'bahu-terangkat',
  'rentang-kurang',
  'tempo-cepat',
] as const;

export type IdKoreksiBawaan = (typeof PRIORITAS_KOREKSI)[number];

/** Pesan & ambang koreksi bawaan (Bab 7.3). Pesan tidak pernah menyalahkan (Bab 12.4). */
export const KOREKSI_BAWAAN: Record<IdKoreksiBawaan, KoreksiDefinisi> = {
  'keluar-frame': {
    id: 'keluar-frame',
    kondisi: 'Landmark kunci latihan tidak terlihat (visibility < 0,5 atau tubuh tidak terdeteksi) lebih dari 1 detik.',
    pesan: 'Mundur sedikit agar tubuh terlihat penuh',
    tahanDetik: 1,
  },
  'badan-miring': {
    id: 'badan-miring',
    kondisi:
      'Garis kedua bahu miring lebih dari {ambang} derajat dari horizontal selama 0,5 detik. Diukur sebagai elevasi 3D garis bahu sehingga badan yang berputar menghadap serong tidak terbaca miring.',
    pesan: 'Tegakkan badan, jangan miring',
    ambang: 12,
    tahanDetik: 0.5,
  },
  'bahu-terangkat': {
    id: 'bahu-terangkat',
    kondisi:
      'Jarak tegak bahu ke telinga sisi yang dilatih menyusut lebih dari {ambang}% dibanding saat siap, selama fase naik/atas, bertahan 0,5 detik.',
    pesan: 'Rilekskan bahu, turunkan bahu Anda',
    ambang: 20,
    tahanDetik: 0.5,
  },
  'rentang-kurang': {
    id: 'rentang-kurang',
    kondisi: 'Puncak gerakan dua percobaan berturut-turut di bawah ambang atas dikurangi {ambang}.',
    pesan: 'Sedikit lagi, angkat lebih tinggi bila mampu',
    ambang: 15,
  },
  'tempo-cepat': {
    id: 'tempo-cepat',
    kondisi: 'Durasi siklus di bawah tempo minimum latihan dua kali berturut-turut.',
    pesan: 'Perlambat gerakan Anda',
  },
};

/** Ambil koreksi bawaan, opsional dengan ambang/pesan khusus latihan; `{ambang}` di teks kondisi diisi. */
function koreksi(id: IdKoreksiBawaan, ubah: Partial<Omit<KoreksiDefinisi, 'id'>> = {}): KoreksiDefinisi {
  const gabung: KoreksiDefinisi = { ...KOREKSI_BAWAAN[id], ...ubah };
  gabung.kondisi = gabung.kondisi.replace('{ambang}', String(gabung.ambang ?? ''));
  return gabung;
}

/**
 * Pustaka 10 latihan (Bab 6). Urutan: 1 fleksi-bahu, 2 fleksi-siku, 3 abduksi-bahu,
 * 4 ekstensi-lutut, 5 abduksi-pinggul, 6 duduk-berdiri, 7 jinjit, 8 menggapai, 9 putar-badan,
 * 10 langkah-duduk. Ambang atas/bawah 1-6 dan 9 persis tabel Bab 6; ambang 7, 8, 10 (persen
 * lebar bahu) adalah titik awal prototype karena tabel hanya menyebut cara ukurnya.
 */
export const EXERCISES: ExerciseDefinition[] = [
  {
    id: 'fleksi-bahu',
    nama: 'Angkat Lengan ke Depan',
    namaKlinis: 'Fleksi bahu',
    posisi: 'duduk',
    sendiTarget: ['bahu'],
    // Sudut antara batang tubuh (bahu->pinggul) dan lengan atas (bahu->siku): 0 = lengan di sisi badan.
    metrik: { jenis: 'sudut', a: 'pinggul', b: 'bahu', c: 'siku' },
    titikKunci: ['bahu', 'siku', 'pinggul'],
    ambangAtas: 100,
    ambangBawah: 30,
    satuan: '°',
    targetRepetisiDefault: 10,
    tempoTargetDetik: { min: 2, max: 6 },
    sisi: 'pilih',
    inti: true,
    panduanLangkah: [
      'Duduk tegak di kursi, kedua kaki menapak lantai.',
      'Biarkan lengan lurus di samping badan.',
      'Angkat lengan lurus ke depan, setinggi yang nyaman.',
      'Turunkan perlahan sampai lengan kembali di samping badan.',
    ],
    posisiPonsel:
      'Letakkan ponsel tegak di meja atau tumpukan buku setinggi dada, 1 meter di depan Anda. Kepala sampai pinggul harus terlihat.',
    // Peringatan umum (berhenti bila nyeri, berpegangan) sudah ditampilkan SafetyNotice; di sini hanya pesan khusus latihan.
    peringatan: 'Duduk di kursi kokoh bersandaran. Angkat lengan hanya sebatas tidak nyeri.',
    wajibBerpegangan: false,
    koreksiUmum: [
      koreksi('keluar-frame'),
      koreksi('badan-miring'),
      koreksi('bahu-terangkat', { ambang: 30 }),
      koreksi('rentang-kurang'),
      koreksi('tempo-cepat'),
    ],
    animasiAtauVideo: 'bawaan',
    sumberSudut: 'hibrida',
    arahKamera: 'depan',
  },
  {
    id: 'fleksi-siku',
    nama: 'Tekuk Siku',
    namaKlinis: 'Fleksi siku',
    posisi: 'duduk',
    sendiTarget: ['siku'],
    // Bab 7.2: fleksi > 120 = atas, < 30 = bawah; nilai = 180 - sudut dalam siku (0 saat lurus).
    metrik: { jenis: 'sudut', a: 'bahu', b: 'siku', c: 'pergelangan', ubah: 'fleksi' },
    titikKunci: ['bahu', 'siku', 'pergelangan'],
    ambangAtas: 120,
    ambangBawah: 30,
    satuan: '°',
    targetRepetisiDefault: 10,
    tempoTargetDetik: { min: 1.5, max: 4 },
    sisi: 'pilih',
    inti: true,
    panduanLangkah: [
      'Duduk tegak, lengan lurus di samping badan.',
      'Tekuk siku, bawa tangan ke arah bahu.',
      'Tahan sebentar di atas.',
      'Luruskan kembali perlahan.',
    ],
    posisiPonsel:
      'Letakkan ponsel tegak di meja setinggi dada, 1 meter di depan Anda. Kepala sampai pinggul harus terlihat.',
    peringatan: 'Duduk di kursi kokoh bersandaran. Gerakkan siku perlahan, tanpa menghentak.',
    wajibBerpegangan: false,
    koreksiUmum: [
      koreksi('keluar-frame'),
      koreksi('badan-miring'),
      koreksi('bahu-terangkat'),
      koreksi('rentang-kurang'),
      koreksi('tempo-cepat'),
    ],
    animasiAtauVideo: 'bawaan',
    // Rekaman nyata (median per loop): 3D istirahat 22-29° / puncak 101-115° (tidak pernah melewati
    // 120/30), hibrida istirahat 2-20° / puncak 158-178° dari depan maupun serong. docs/algoritma.md Bagian 13.
    sumberSudut: 'hibrida',
    arahKamera: 'depan',
  },
  {
    id: 'abduksi-bahu',
    nama: 'Angkat Lengan ke Samping',
    namaKlinis: 'Abduksi bahu',
    posisi: 'duduk',
    sendiTarget: ['bahu'],
    metrik: { jenis: 'sudut', a: 'pinggul', b: 'bahu', c: 'siku' },
    titikKunci: ['bahu', 'siku', 'pinggul'],
    ambangAtas: 90,
    ambangBawah: 25,
    satuan: '°',
    targetRepetisiDefault: 10,
    tempoTargetDetik: { min: 2, max: 6 },
    sisi: 'pilih',
    inti: true,
    panduanLangkah: [
      'Duduk tegak, lengan lurus di samping badan.',
      'Angkat lengan lurus ke samping sampai setinggi bahu.',
      'Jaga badan tetap tegak.',
      'Turunkan perlahan.',
    ],
    posisiPonsel:
      'Letakkan ponsel tegak di meja setinggi dada, 1,2 meter di depan Anda, agar lengan yang terangkat ke samping tetap terlihat.',
    peringatan: 'Duduk di kursi kokoh bersandaran. Angkat lengan hanya sebatas tidak nyeri, tidak perlu melewati setinggi bahu.',
    wajibBerpegangan: false,
    koreksiUmum: [
      koreksi('keluar-frame'),
      koreksi('badan-miring'),
      koreksi('bahu-terangkat', { ambang: 30 }),
      koreksi('rentang-kurang'),
      koreksi('tempo-cepat'),
    ],
    animasiAtauVideo: 'bawaan',
    sumberSudut: 'hibrida',
    arahKamera: 'depan',
  },
  {
    id: 'ekstensi-lutut',
    nama: 'Luruskan Tungkai',
    namaKlinis: 'Ekstensi lutut duduk',
    posisi: 'duduk',
    sendiTarget: ['lutut'],
    // Sudut dalam lutut: ~90 saat duduk biasa, ~180 saat tungkai lurus.
    metrik: { jenis: 'sudut', a: 'pinggul', b: 'lutut', c: 'pergelangan-kaki' },
    titikKunci: ['pinggul', 'lutut', 'pergelangan-kaki'],
    ambangAtas: 150,
    ambangBawah: 100,
    satuan: '°',
    targetRepetisiDefault: 10,
    tempoTargetDetik: { min: 2, max: 6 },
    sisi: 'pilih',
    inti: false,
    panduanLangkah: [
      'Duduk tegak, punggung bersandar, kedua kaki menapak lantai.',
      'Luruskan satu tungkai ke depan sampai lutut lurus.',
      'Tahan sebentar.',
      'Turunkan kaki perlahan ke lantai.',
    ],
    posisiPonsel:
      'Letakkan ponsel tegak setinggi lutut, 1,2 meter di depan Anda dan sedikit menyamping ke arah tungkai yang dilatih. Seluruh tubuh sampai telapak kaki harus terlihat.',
    peringatan: 'Duduk di kursi kokoh bersandaran. Luruskan lutut perlahan, tanpa menghentak.',
    wajibBerpegangan: false,
    koreksiUmum: [koreksi('keluar-frame'), koreksi('badan-miring'), koreksi('rentang-kurang'), koreksi('tempo-cepat')],
    animasiAtauVideo: 'bawaan',
    sumberSudut: 'hibrida',
    arahKamera: 'serong',
  },
  {
    id: 'abduksi-pinggul',
    nama: 'Angkat Kaki ke Samping',
    namaKlinis: 'Abduksi pinggul berdiri',
    posisi: 'berdiri-berpegangan',
    sendiTarget: ['pinggul'],
    // Sudut paha terhadap garis panggul (pinggul lawan -> pinggul -> lutut) dikurangi 90: 0 saat berdiri tegak.
    // Garis panggul dipakai, bukan garis bahu-pinggul, karena bahu lebih lebar dari pinggul (simpangan ~9° saat diam)
    // dan agar badan yang condong ke samping tidak terhitung sebagai abduksi.
    metrik: { jenis: 'sudut', a: 'pinggul', b: 'pinggul', c: 'lutut', aSisiLawan: true, ubah: 'selisih-90' },
    titikKunci: ['bahu', 'pinggul', 'lutut'],
    ambangAtas: 25,
    ambangBawah: 8,
    satuan: '°',
    targetRepetisiDefault: 10,
    tempoTargetDetik: { min: 2, max: 6 },
    sisi: 'pilih',
    inti: false,
    panduanLangkah: [
      'Berdiri tegak sambil berpegangan pada sandaran kursi atau meja.',
      'Angkat satu kaki ke samping, lutut tetap lurus.',
      'Jaga badan tetap tegak, jangan condong.',
      'Turunkan kaki perlahan.',
    ],
    posisiPonsel:
      'Letakkan ponsel tegak setinggi pinggang, 2 meter di depan Anda. Seluruh tubuh dari kepala sampai kaki harus terlihat.',
    peringatan: 'Pastikan pendamping berada di dekat Anda. Gerakkan kaki perlahan dan jaga keseimbangan.',
    wajibBerpegangan: true,
    koreksiUmum: [
      koreksi('keluar-frame'),
      koreksi('badan-miring'),
      koreksi('rentang-kurang', { ambang: 8 }),
      koreksi('tempo-cepat'),
    ],
    animasiAtauVideo: 'bawaan',
    sumberSudut: 'hibrida',
    arahKamera: 'depan',
  },
  {
    id: 'duduk-berdiri',
    nama: 'Duduk ke Berdiri',
    namaKlinis: 'Sit to stand',
    posisi: 'duduk-ke-berdiri',
    sendiTarget: ['lutut', 'pinggul'],
    // Sudut dalam lutut: > 160 = berdiri (atas), < 100 = duduk (bawah).
    metrik: { jenis: 'sudut', a: 'pinggul', b: 'lutut', c: 'pergelangan-kaki' },
    titikKunci: ['pinggul', 'lutut', 'pergelangan-kaki'],
    ambangAtas: 160,
    ambangBawah: 100,
    satuan: '°',
    targetRepetisiDefault: 5,
    tempoTargetDetik: { min: 3, max: 10 },
    sisi: 'keduanya',
    inti: false,
    panduanLangkah: [
      'Duduk di tepi kursi kokoh, kaki menapak selebar bahu.',
      'Pegang sandaran kursi lain atau meja di depan Anda.',
      'Condongkan badan ke depan, lalu berdiri perlahan.',
      'Duduk kembali perlahan dan terkendali.',
    ],
    posisiPonsel:
      'Letakkan ponsel tegak setinggi pinggang, 2 meter di depan Anda dan sedikit menyamping. Seluruh tubuh saat berdiri harus terlihat.',
    peringatan: 'Pastikan pendamping berada di dekat Anda. Pakai kursi kokoh yang tidak beroda dan tidak bergeser.',
    wajibBerpegangan: true,
    koreksiUmum: [koreksi('keluar-frame'), koreksi('badan-miring'), koreksi('rentang-kurang'), koreksi('tempo-cepat')],
    animasiAtauVideo: 'bawaan',
    sumberSudut: 'hibrida',
    arahKamera: 'serong',
  },
  {
    id: 'jinjit',
    nama: 'Jinjit Berpegangan',
    namaKlinis: 'Heel raise',
    posisi: 'berdiri-berpegangan',
    sendiTarget: ['pergelangan-kaki'],
    // Kenaikan tumit pada gambar terhadap posisi saat siap, dalam persen lebar bahu.
    metrik: { jenis: 'kenaikan', titik: 'tumit' },
    titikKunci: ['bahu', 'tumit'],
    ambangAtas: 10,
    ambangBawah: 4,
    satuan: '%',
    histeresis: 2.5,
    targetRepetisiDefault: 10,
    tempoTargetDetik: { min: 2, max: 6 },
    sisi: 'keduanya',
    inti: false,
    panduanLangkah: [
      'Berdiri tegak sambil berpegangan pada sandaran kursi atau meja.',
      'Naikkan tumit perlahan, bertumpu pada ujung kaki.',
      'Tahan sebentar.',
      'Turunkan tumit perlahan ke lantai.',
    ],
    posisiPonsel:
      'Letakkan ponsel tegak di lantai atau kursi rendah, 2 meter di depan Anda. Seluruh tubuh sampai tumit harus terlihat.',
    peringatan: 'Pastikan pendamping berada di dekat Anda. Turunkan tumit perlahan, jangan menjatuhkan badan.',
    wajibBerpegangan: true,
    koreksiUmum: [
      koreksi('keluar-frame'),
      koreksi('badan-miring'),
      koreksi('rentang-kurang', { ambang: 2 }),
      koreksi('tempo-cepat'),
    ],
    animasiAtauVideo: 'bawaan',
    // Metrik kenaikan selalu dari gambar 2D (landmark dunia berpusat di pinggul).
    sumberSudut: '2d',
    arahKamera: 'depan',
  },
  {
    id: 'menggapai',
    nama: 'Menggapai ke Depan',
    namaKlinis: 'Reaching ke depan',
    posisi: 'duduk',
    sendiTarget: ['bahu', 'siku'],
    // Jarak pergelangan tangan ke bahu dalam persen lebar bahu: ~80 saat tangan di depan dada, ~150 saat lengan lurus.
    // Ambang atas bersifat progresif: terapis dapat menaikkannya bertahap lewat file ini.
    metrik: { jenis: 'jarak', dari: 'bahu', ke: 'pergelangan' },
    titikKunci: ['bahu', 'siku', 'pergelangan'],
    ambangAtas: 135,
    ambangBawah: 90,
    satuan: '%',
    targetRepetisiDefault: 10,
    tempoTargetDetik: { min: 2, max: 6 },
    sisi: 'pilih',
    inti: false,
    panduanLangkah: [
      'Duduk tegak, tangan di depan dada.',
      'Gapai ke depan sejauh yang nyaman sampai siku lurus.',
      'Jaga kedua kaki tetap menapak lantai.',
      'Tarik tangan kembali ke depan dada.',
    ],
    posisiPonsel:
      'Letakkan ponsel tegak di meja setinggi dada, 1 meter di depan Anda dan sedikit menyamping ke arah lengan yang dilatih.',
    peringatan: 'Duduk di kursi kokoh bersandaran. Gapai hanya sejauh badan tetap seimbang di kursi.',
    wajibBerpegangan: false,
    koreksiUmum: [
      koreksi('keluar-frame'),
      koreksi('badan-miring'),
      koreksi('rentang-kurang'),
      koreksi('tempo-cepat'),
    ],
    animasiAtauVideo: 'bawaan',
    // Tangan bergerak ke arah kamera: jarak hanya terukur dengan 3D.
    sumberSudut: '3d',
    arahKamera: 'serong',
  },
  {
    id: 'putar-badan',
    nama: 'Putar Badan',
    namaKlinis: 'Rotasi batang tubuh duduk',
    posisi: 'duduk',
    sendiTarget: ['batang-tubuh'],
    // Besar rotasi garis bahu terhadap posisi saat siap, ke kiri maupun ke kanan.
    metrik: { jenis: 'rotasi-bahu' },
    titikKunci: ['bahu', 'pinggul'],
    ambangAtas: 20,
    ambangBawah: 8,
    satuan: '°',
    targetRepetisiDefault: 10,
    tempoTargetDetik: { min: 2, max: 6 },
    sisi: 'keduanya',
    inti: false,
    panduanLangkah: [
      'Duduk tegak, tangan bersilang di depan dada.',
      'Putar badan perlahan ke satu sisi, pinggul tetap menghadap depan.',
      'Kembali ke tengah.',
      'Ulangi ke sisi lain secara bergantian.',
    ],
    posisiPonsel:
      'Letakkan ponsel tegak di meja setinggi dada, 1 meter tepat di depan Anda. Kepala sampai pinggul harus terlihat.',
    peringatan: 'Duduk di kursi kokoh bersandaran. Putar badan perlahan dan berhenti sebelum terasa nyeri.',
    wajibBerpegangan: false,
    koreksiUmum: [
      koreksi('keluar-frame'),
      koreksi('badan-miring'),
      koreksi('rentang-kurang', { ambang: 4 }),
      koreksi('tempo-cepat'),
    ],
    animasiAtauVideo: 'bawaan',
    // Rotasi garis bahu terhadap bidang kamera hanya terukur dengan 3D.
    sumberSudut: '3d',
    arahKamera: 'depan',
  },
  {
    id: 'langkah-duduk',
    nama: 'Langkah di Tempat',
    namaKlinis: 'Marching duduk',
    posisi: 'duduk',
    sendiTarget: ['pinggul', 'lutut'],
    // Kenaikan lutut kiri dan kanan dihitung terpisah; tiap angkatan lutut yang lengkap = 1 repetisi.
    metrik: { jenis: 'bergantian', per: { jenis: 'kenaikan', titik: 'lutut' } },
    titikKunci: ['bahu', 'pinggul', 'lutut'],
    ambangAtas: 25,
    ambangBawah: 8,
    satuan: '%',
    histeresis: 4,
    targetRepetisiDefault: 10,
    tempoTargetDetik: { min: 1.5, max: 5 },
    sisi: 'keduanya',
    inti: false,
    panduanLangkah: [
      'Duduk tegak, kedua kaki menapak lantai.',
      'Angkat lutut kiri sedikit, lalu turunkan.',
      'Angkat lutut kanan sedikit, lalu turunkan.',
      'Lanjutkan bergantian dengan irama tenang.',
    ],
    posisiPonsel:
      'Letakkan ponsel tegak setinggi lutut, 1,2 meter di depan Anda. Seluruh tubuh dari kepala sampai kaki harus terlihat.',
    peringatan: 'Duduk di kursi kokoh bersandaran. Angkat lutut sedikit saja bila terasa berat.',
    wajibBerpegangan: false,
    koreksiUmum: [
      koreksi('keluar-frame'),
      koreksi('badan-miring'),
      koreksi('rentang-kurang', { ambang: 8 }),
      koreksi('tempo-cepat'),
    ],
    animasiAtauVideo: 'bawaan',
    sumberSudut: '2d',
    arahKamera: 'depan',
  },
];

export const EXERCISE_IDS = [
  'fleksi-bahu',
  'fleksi-siku',
  'abduksi-bahu',
  'ekstensi-lutut',
  'abduksi-pinggul',
  'duduk-berdiri',
  'jinjit',
  'menggapai',
  'putar-badan',
  'langkah-duduk',
] as const;

export type ExerciseId = (typeof EXERCISE_IDS)[number];

export function getExercise(id: string): ExerciseDefinition | undefined {
  return EXERCISES.find((e) => e.id === id);
}
