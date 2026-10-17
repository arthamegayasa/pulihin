import { Camera, CloudArrowUp, Database, ShieldCheck } from '@phosphor-icons/react';
import type { Icon } from '@phosphor-icons/react';
import { IkonBingkai, Ilustrasi } from '@/components/premium';

const POIN: { Ikon: Icon; judul: string; isi: string }[] = [
  {
    Ikon: Camera,
    judul: 'Video tidak meninggalkan HP',
    isi: 'Gambar kamera diolah langsung di perangkat. Tidak direkam dan tidak diunggah ke mana pun.',
  },
  {
    Ikon: Database,
    judul: 'Data tersimpan lokal',
    isi: 'Riwayat latihan disimpan di browser HP ini dan dapat dihapus kapan saja dari Pengaturan.',
  },
  {
    Ikon: ShieldCheck,
    judul: 'Tanpa analitik dan pelacak',
    isi: 'Tidak ada analitik pihak ketiga, tidak ada iklan, dan tidak perlu membuat akun.',
  },
  {
    Ikon: CloudArrowUp,
    judul: 'Catatan jujur soal suara',
    isi: 'Di sebagian browser, termasuk Chrome, pengenalan ucapan memakai layanan penyedia browser. Mode Latihan Mandiri tersedia tanpa pengenalan ucapan.',
  },
];

/** Privasi sejak rancangan (Bab 17.3), dengan ilustrasi S2 "privasi di perangkat". */
export function Privasi() {
  return (
    <section id="privasi" aria-labelledby="judul-privasi" className="mx-auto max-w-6xl scroll-mt-6 px-5 py-16 md:px-8 lg:py-20">
      <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
        <div className="lg:col-span-4">
          <p className="tipe-label text-primer">Privasi</p>
          <h2 id="judul-privasi" className="mt-2 text-balance text-[1.75rem] font-extrabold leading-tight tracking-tight lg:text-[2.2rem]">
            Privasi sejak rancangan
          </h2>
          <p className="mt-4 max-w-[34ch] text-teks-2">
            Latihan terjadi di ruang paling pribadi: rumah. Karena itu PULIHIN dibuat agar data tetap di tangan keluarga.
          </p>
          <div className="mt-8 hidden overflow-hidden rounded-panel bg-ilustrasi ring-1 ring-primer-garis/60 sm:block">
            <Ilustrasi jenis="momen" nama="privasi" bilaGagal="sembunyi" className="mx-auto block aspect-[4/3] w-full max-w-[22rem] object-cover" />
          </div>
        </div>
        <ul className="grid content-start gap-4 sm:grid-cols-2 lg:col-span-8">
          {POIN.map(({ Ikon, judul, isi }) => (
            <li key={judul} className="rounded-kartu border border-garis-halus bg-permukaan p-6 shadow-tipis">
              <IkonBingkai nada="primer">
                <Ikon weight="bold" />
              </IkonBingkai>
              <h3 className="mt-4 text-[1.1rem] font-extrabold leading-snug">{judul}</h3>
              <p className="mt-1.5 text-[0.95rem] leading-relaxed text-teks-2">{isi}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
