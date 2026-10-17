import { CaretRight } from '@phosphor-icons/react';
import { useNavigate } from 'react-router';
import { IlustrasiPotong, type Potongan } from '@/features/pasien/IlustrasiPotong';
import { setPrefs, usePrefs } from '@/lib/prefs';
import { berandaUntukPeran } from '@/router-paths';
import type { Role } from '@/types';

/** Potongan kepala-badan dari ilustrasi peran 480x480 (subjek di tengah, ruang kosong di sekelilingnya). */
const PERAN: { role: Role; judul: string; sub: string; potong: Potongan }[] = [
  { role: 'pasien', judul: 'Saya Pasien', sub: 'Latihan gerak dan bicara hari ini', potong: { x: 85, y: 70, sisi: 320 } },
  { role: 'keluarga', judul: 'Saya Keluarga', sub: 'Lihat latihan, kirim ringkasan ke terapis', potong: { x: 85, y: 40, sisi: 320 } },
  { role: 'terapis', judul: 'Saya Terapis', sub: 'Atur program dan pantau pasien', potong: { x: 80, y: 50, sisi: 320 } },
];

/** Selamat Datang / Pilih Peran (Bab 13). Peran disimpan lokal; tanpa akun (prototype lomba). */
export default function PilihPeran() {
  const navigate = useNavigate();
  // Huruf Lebih Besar: judul dan gambar sedikit lebih kecil agar ketiga pilihan tetap terlihat tanpa banyak menggulir.
  const { hurufBesar: padat } = usePrefs();
  return (
    <section className="flex min-h-[calc(100dvh-7rem)] flex-col">
      <div className="animate-naik">
        <p className={`tipe-label text-primer ${padat ? 'sr-only' : ''}`}>Selamat datang di PULIHIN</p>
        <h1 className={`mt-1 text-balance text-teks ${padat ? 'tipe-judul' : 'tipe-display'}`}>Teman latihan di rumah</h1>
        <p className={`mt-2 text-teks-2 ${padat ? 'tipe-keterangan' : 'tipe-isi'}`}>Pendamping latihan untuk pasien stroke, keluarga, dan terapis.</p>
      </div>

      <div className={`mt-auto ${padat ? 'pt-4' : 'pt-5'}`}>
        <h2 className={`tipe-subjudul text-teks ${padat ? 'mb-2' : 'mb-3'}`}>Siapa yang memakai ponsel ini?</h2>
        <ul className={padat ? 'space-y-2' : 'space-y-3'}>
          {PERAN.map(({ role, judul, sub, potong }) => (
            <li key={role}>
              <button
                type="button"
                onClick={() => {
                  setPrefs({ role });
                  navigate(berandaUntukPeran(role));
                }}
                className={`group flex w-full items-center rounded-kartu border border-garis-halus bg-permukaan p-2 pr-3 text-left shadow-tipis transition-[border-color,box-shadow,transform] hover:border-primer-garis hover:shadow-sedang active:translate-y-px active:shadow-none ${padat ? 'min-h-[72px] gap-3' : 'min-h-[88px] gap-3.5'}`}
              >
                <IlustrasiPotong
                  ilustrasi={{ jenis: 'peran', nama: role }}
                  potong={potong}
                  prioritas
                  className={`rounded-[12px] ${padat ? 'size-[60px]' : 'size-[76px]'}`}
                />
                <span className="min-w-0 flex-1">
                  <span className="tipe-subjudul block text-teks">{judul}</span>
                  <span className="tipe-keterangan mt-0.5 block text-teks-2">{sub}</span>
                </span>
                <CaretRight size={24} weight="bold" aria-hidden className="shrink-0 text-primer transition-transform group-hover:translate-x-0.5" />
              </button>
            </li>
          ))}
        </ul>
        <p className="tipe-keterangan mt-4 text-center text-teks-2">Prototype lomba - data contoh (Demo). Bisa diganti kapan saja di Pengaturan.</p>
      </div>
    </section>
  );
}
