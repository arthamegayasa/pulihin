import { Camera, CloudArrowUp, Database, ShieldCheck } from '@phosphor-icons/react';
import type { Icon } from '@phosphor-icons/react';

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

/** Privasi sejak rancangan (Bab 17.3). */
export function Privasi() {
  return (
    <section id="privasi" aria-labelledby="judul-privasi" className="scroll-mt-6 border-y border-garis bg-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 md:px-8 lg:grid-cols-12 lg:py-20">
        <div className="lg:col-span-4">
          <h2 id="judul-privasi" className="text-[1.75rem] font-extrabold leading-tight tracking-tight lg:text-[2.2rem]">
            Privasi sejak rancangan
          </h2>
          <p className="mt-4 max-w-[34ch] text-teks-2">
            Latihan terjadi di ruang paling pribadi: rumah. Karena itu PULIHIN dibuat agar data tetap di tangan keluarga.
          </p>
        </div>
        <ul className="grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:col-span-8">
          {POIN.map(({ Ikon, judul, isi }) => (
            <li key={judul} className="flex gap-4">
              <span className="grid size-12 shrink-0 place-items-center rounded-kartu bg-primer-terang" aria-hidden>
                <Ikon size={26} weight="bold" className="text-primer" />
              </span>
              <div>
                <h3 className="text-[1.1rem] font-extrabold leading-snug">{judul}</h3>
                <p className="mt-1 text-[0.95rem] leading-relaxed text-teks-2">{isi}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
