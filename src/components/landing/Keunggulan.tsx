import { Camera, ChatCircleText, CheckCircle, UsersThree } from '@phosphor-icons/react';
import type { Icon } from '@phosphor-icons/react';
import { IkonBingkai, Ilustrasi, type NamaLanding } from '@/components/premium';
import { AreaIntip, BingkaiLayarLebar, BingkaiPonsel } from './Bingkai';
import { LAYAR, type TangkapanLayar } from './tangkapanLayar';

interface Unggulan {
  nama: Exclude<NamaLanding, 'hero'>;
  Ikon: Icon;
  label: string;
  judul: string;
  isi: string;
  poin: readonly string[];
  layar: TangkapanLayar;
}

const UNGGULAN: readonly Unggulan[] = [
  {
    nama: 'gerak',
    Ikon: Camera,
    label: 'Latihan gerak',
    judul: 'Penilaian gerak lewat kamera HP biasa',
    isi: 'Letakkan HP di meja atau tumpukan buku. Aplikasi menghitung repetisi, melihat rentang gerak, dan memberi koreksi lewat suara, tanpa alat tambahan.',
    poin: ['10 latihan dengan video peraga 3D', 'Hitungan besar dan arahan suara', 'Skor dan ringkasan setiap sesi'],
    layar: LAYAR.ringkasan,
  },
  {
    nama: 'bicara',
    Ikon: ChatCircleText,
    label: 'Latihan bicara',
    judul: 'Terapi afasia Bahasa Indonesia',
    isi: '100 kata sehari-hari di rumah, lengkap dengan gambar, contoh suara, dan pengenalan suara Bahasa Indonesia.',
    poin: ['Gambar jelas untuk setiap kata', 'Contoh suara bisa diulang', 'Mode Latihan Mandiri tanpa pengenalan suara'],
    layar: LAYAR.afasia,
  },
  {
    nama: 'keluarga',
    Ikon: UsersThree,
    label: 'Untuk Keluarga',
    judul: 'Keluarga ikut memantau dari HP yang sama',
    isi: 'Keluarga melihat kepatuhan mingguan, tren skor, dan tanda perlu perhatian, lalu menyalin ringkasan untuk dikirim ke terapis.',
    poin: ['Status latihan hari ini', 'Tanda bila latihan terhenti beberapa hari', 'Ringkasan mingguan siap dikirim'],
    layar: LAYAR.keluarga,
  },
];

/**
 * Tiga keunggulan (Bab 13.1): setiap baris memadukan ilustrasi S2 dengan tangkapan layar asli yang "mengintip"
 * dari sisi kanan panel, berselang kiri-kanan di laptop dan bertumpuk di ponsel. Disusul ubin lebar Dashboard Terapis.
 * Semua gambar di bawah lipatan: lazy, width/height intrinsik (tanpa CLS).
 */
export function Keunggulan() {
  return (
    <section id="keunggulan" aria-labelledby="judul-keunggulan" className="mx-auto max-w-6xl scroll-mt-6 px-5 py-16 md:px-8 lg:py-20">
      <p className="tipe-label text-primer">Keunggulan</p>
      <h2 id="judul-keunggulan" className="mt-2 max-w-[22ch] text-balance text-[1.75rem] font-extrabold leading-tight tracking-tight lg:text-[2.2rem]">
        Satu aplikasi untuk pasien, keluarga, dan terapis
      </h2>

      <div className="mt-12 space-y-16 lg:space-y-24">
        {UNGGULAN.map((u, i) => (
          <article key={u.nama} aria-labelledby={`unggulan-${u.nama}`} className="grid items-center gap-8 lg:grid-cols-12 lg:gap-14">
            <div className={`lg:col-span-7 ${i % 2 === 1 ? 'lg:order-2' : ''}`}>
              {/* Ilustrasi di 76% kiri panel; ponsel asli mengintip di kanan, terpotong tepi bawah panel. */}
              <div className="relative overflow-hidden rounded-panel bg-ilustrasi ring-1 ring-primer-garis/60">
                <Ilustrasi jenis="landing" nama={u.nama} className="block h-auto w-[76%]" />
                <BingkaiPonsel layar={u.layar} className="absolute right-[5%] top-[10%] w-[31%]" />
              </div>
            </div>
            <div className="lg:col-span-5">
              <p className="flex items-center gap-3 tipe-label text-primer">
                <IkonBingkai nada="primer">
                  <u.Ikon weight="bold" />
                </IkonBingkai>
                {u.label}
              </p>
              <h3 id={`unggulan-${u.nama}`} className="mt-4 text-balance text-[1.4rem] font-extrabold leading-snug tracking-tight lg:text-[1.6rem]">
                {u.judul}
              </h3>
              <p className="mt-3 max-w-[46ch] text-teks-2">{u.isi}</p>
              <ul className="mt-5 space-y-2">
                {u.poin.map((p) => (
                  <li key={p} className="flex items-start gap-2.5 font-semibold text-teks">
                    <CheckCircle size={22} weight="fill" className="mt-0.5 shrink-0 text-primer" aria-hidden />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          </article>
        ))}

        <article
          aria-labelledby="unggulan-terapis"
          className="overflow-hidden rounded-panel bg-permukaan ring-1 ring-garis-halus lg:grid lg:grid-cols-12 lg:items-center"
        >
          <div className="p-6 lg:col-span-4 lg:p-10">
            <p className="flex items-center gap-3 tipe-label text-primer">
              <IkonBingkai nada="primer">
                <UsersThree weight="bold" />
              </IkonBingkai>
              Untuk terapis
            </p>
            <h3 id="unggulan-terapis" className="mt-4 text-balance text-[1.4rem] font-extrabold leading-snug tracking-tight lg:text-[1.6rem]">
              Dashboard terapis dan resep program
            </h3>
            <p className="mt-3 max-w-[46ch] text-teks-2">
              Terapis memantau beberapa pasien sekaligus, melihat siapa yang perlu perhatian, dan menyusun program latihan
              masing-masing. Perubahan resep langsung menjadi Latihan Hari Ini di HP pasien.
            </p>
          </div>
          {/* Laptop terapis terpotong tepi kanan-bawah ubin. */}
          <AreaIntip tinggi="h-[15rem] sm:h-[22rem] lg:col-span-8 lg:h-[26rem]">
            <BingkaiLayarLebar layar={LAYAR.klinisi} className="absolute left-6 top-4 w-[34rem] sm:w-[44rem] lg:left-2 lg:top-10 lg:w-[46rem]" />
          </AreaIntip>
        </article>
      </div>
    </section>
  );
}
