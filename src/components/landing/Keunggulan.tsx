import { Camera, ChatCircleText, UsersThree } from '@phosphor-icons/react';
import type { Icon } from '@phosphor-icons/react';
import { AreaIntip, BingkaiLayarLebar, BingkaiPonsel } from './Bingkai';
import { LAYAR } from './tangkapanLayar';

function Teks({ Ikon, judul, isi }: { Ikon: Icon; judul: string; isi: string }) {
  return (
    <div className="p-6 lg:p-8">
      <Ikon size={32} weight="bold" className="text-primer" aria-hidden />
      <h3 className="mt-4 text-[1.25rem] font-extrabold leading-snug">{judul}</h3>
      <p className="mt-2 max-w-[46ch] text-teks-2">{isi}</p>
    </div>
  );
}

const UBIN = 'flex flex-col overflow-hidden rounded-kartu ring-1';
const TENGAH = 'absolute left-1/2 top-0 -translate-x-1/2';

/**
 * Tiga keunggulan (Bab 13.1) sebagai bento: dua ubin di baris atas (7 + 5 kolom) dan satu ubin lebar di bawah.
 * Setiap ubin memakai tangkapan layar asli yang "mengintip" dari tepi bawah. Ponsel: satu kolom.
 */
export function Keunggulan() {
  return (
    <section id="keunggulan" aria-labelledby="judul-keunggulan" className="mx-auto max-w-6xl scroll-mt-6 px-5 py-16 md:px-8 lg:py-20">
      <h2 id="judul-keunggulan" className="max-w-[22ch] text-balance text-[1.75rem] font-extrabold leading-tight tracking-tight lg:text-[2.2rem]">
        Satu aplikasi untuk pasien, keluarga, dan terapis
      </h2>

      <div className="mt-10 grid gap-5 lg:grid-cols-12">
        <article className={`${UBIN} bg-primer-terang ring-primer-garis/60 lg:col-span-7`}>
          <Teks
            Ikon={Camera}
            judul="Penilaian gerak lewat kamera HP biasa"
            isi="Letakkan HP di meja atau tumpukan buku. Aplikasi menghitung repetisi, melihat rentang gerak, dan memberi koreksi lewat suara, tanpa alat tambahan."
          />
          {/* Potongan: skor, label kata, repetisi, dan durasi tetap terlihat. */}
          <AreaIntip tinggi="mt-auto h-[23rem] sm:h-[25rem] lg:h-[26rem]">
            <BingkaiPonsel layar={LAYAR.ringkasan} className={`${TENGAH} w-[15rem] sm:w-[16.5rem] lg:w-[17rem]`} />
          </AreaIntip>
        </article>

        <article className={`${UBIN} bg-aksen-terang ring-aksen/25 lg:col-span-5`}>
          <Teks
            Ikon={ChatCircleText}
            judul="Terapi afasia Bahasa Indonesia"
            isi="100 kata sehari-hari di rumah, lengkap dengan gambar, contoh suara, dan pengenalan ucapan Bahasa Indonesia."
          />
          {/* Potongan: gambar, kata, tombol Dengar, dan tombol Sebutkan Kata. */}
          <AreaIntip tinggi="mt-auto h-[19rem] sm:h-[23rem] lg:h-[26rem]">
            <BingkaiPonsel layar={LAYAR.afasia} className={`${TENGAH} w-[12.5rem] sm:w-[12rem] lg:w-[13.5rem]`} />
          </AreaIntip>
        </article>

        <article className={`${UBIN} bg-white ring-garis lg:col-span-12 lg:grid lg:grid-cols-12`}>
          <div className="lg:col-span-4 lg:self-center">
            <Teks
              Ikon={UsersThree}
              judul="Dashboard keluarga dan terapis"
              isi="Keluarga melihat kepatuhan mingguan, tren skor, dan tanda perlu perhatian. Terapis memantau beberapa pasien dan menyusun program latihan masing-masing."
            />
          </div>
          {/* Laptop terapis di belakang, ponsel keluarga di depan; keduanya terpotong tepi ubin. */}
          <AreaIntip tinggi="h-[18rem] sm:h-[22rem] lg:col-span-8 lg:h-[25rem]">
            <BingkaiLayarLebar
              layar={LAYAR.klinisi}
              className="absolute left-6 top-2 w-[34rem] sm:w-[40rem] lg:left-2 lg:top-10 lg:w-[44rem]"
            />
            <BingkaiPonsel
              layar={LAYAR.keluarga}
              className="absolute right-4 top-8 w-[10rem] sm:right-10 sm:top-12 sm:w-[12rem] lg:right-10 lg:top-14 lg:w-[13.5rem]"
            />
          </AreaIntip>
        </article>
      </div>
    </section>
  );
}
