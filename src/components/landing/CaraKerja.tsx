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

/** Cara kerja dalam tiga langkah, berdampingan dengan layar Detail Latihan (gambar contoh gerakan). */
export function CaraKerja() {
  return (
    <section id="cara-kerja" aria-labelledby="judul-cara-kerja" className="mx-auto max-w-6xl scroll-mt-6 px-5 py-16 md:px-8 lg:py-20">
      <div className="grid items-center gap-12 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <h2 id="judul-cara-kerja" className="text-[1.75rem] font-extrabold leading-tight tracking-tight lg:text-[2.2rem]">
            Cara kerja
          </h2>
          <ol className="mt-8 space-y-8">
            {LANGKAH.map((l, i) => (
              <li key={l.judul} className="grid grid-cols-[2.75rem_1fr] gap-4">
                <span
                  className="grid size-11 place-items-center rounded-full bg-primer text-[1.1rem] font-extrabold text-white tabular"
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

        <div className="flex justify-center lg:col-span-5">
          <BingkaiPonsel layar={LAYAR.detail} className="w-[15rem] sm:w-[16rem] lg:w-[17rem]" />
        </div>
      </div>
    </section>
  );
}
