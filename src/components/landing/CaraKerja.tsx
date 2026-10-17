import { BingkaiPonsel } from './Bingkai';
import { LAYAR } from './tangkapanLayar';

const LANGKAH = [
  {
    judul: 'Pilih latihan hari ini',
    isi: 'Beranda langsung menampilkan latihan dari program terapis. Setiap latihan punya gambar contoh gerakan dan pesan keselamatan.',
  },
  {
    judul: 'Letakkan HP, lalu bergerak',
    isi: 'Kamera melihat posisi sendi. Hitungan besar dan arahan suara membantu menjaga gerakan tetap pelan dan terarah.',
  },
  {
    judul: 'Keluarga ikut memantau',
    isi: 'Skor dan kepatuhan tersimpan di HP. Keluarga dapat menyalin ringkasan mingguan untuk dikirim ke terapis.',
  },
] as const;

/** Cara kerja dalam tiga langkah, berdampingan dengan layar Beranda dan Detail Latihan asli (bertumpuk). */
export function CaraKerja() {
  return (
    <section id="cara-kerja" aria-labelledby="judul-cara-kerja" className="scroll-mt-6 border-y border-garis-halus bg-permukaan">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 md:px-8 lg:grid-cols-12 lg:py-20">
        <div className="lg:col-span-6">
          <p className="tipe-label text-primer">Cara kerja</p>
          <h2 id="judul-cara-kerja" className="mt-2 text-balance text-[1.75rem] font-extrabold leading-tight tracking-tight lg:text-[2.2rem]">
            Tiga langkah, setiap hari
          </h2>
          <ol className="mt-8 space-y-4">
            {LANGKAH.map((l, i) => (
              <li key={l.judul} className="grid grid-cols-[2.75rem_1fr] gap-4 rounded-kartu border border-garis-halus bg-latar p-5">
                <span
                  className="grid size-11 place-items-center rounded-full bg-primer text-[1.1rem] font-extrabold text-white shadow-angkat inset-shadow-sorot tabular"
                  aria-hidden
                >
                  {i + 1}
                </span>
                <div>
                  <h3 className="text-[1.2rem] font-extrabold leading-snug">{l.judul}</h3>
                  <p className="mt-1.5 max-w-[46ch] text-teks-2">{l.isi}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
        {/* Dua ponsel asli bertumpuk di panel: Beranda di belakang, Detail Latihan di depan; terpotong tepi bawah panel. */}
        <div className="relative h-[27rem] overflow-hidden rounded-panel bg-ilustrasi ring-1 ring-primer-garis/60 sm:h-[32rem] lg:col-span-6 lg:h-[36rem]">
          <BingkaiPonsel layar={LAYAR.beranda} className="absolute left-[7%] top-8 w-[46%] max-w-[16rem] lg:top-10" />
          <BingkaiPonsel layar={LAYAR.detail} className="absolute right-[7%] top-24 w-[46%] max-w-[16rem] lg:top-28" />
        </div>
      </div>
    </section>
  );
}
