import { CaretRight, HandHeart, Stethoscope, User, type Icon } from '@phosphor-icons/react';
import { useNavigate } from 'react-router';
import { setPrefs } from '@/lib/prefs';
import { berandaUntukPeran } from '@/router-paths';
import type { Role } from '@/types';

const PERAN: { role: Role; judul: string; sub: string; Ikon: Icon }[] = [
  { role: 'pasien', judul: 'Saya Pasien', sub: 'Latihan gerak dan latihan bicara hari ini', Ikon: User },
  { role: 'keluarga', judul: 'Saya Keluarga', sub: 'Lihat latihan dan kirim ringkasan ke terapis', Ikon: HandHeart },
  { role: 'terapis', judul: 'Saya Terapis', sub: 'Atur program latihan dan pantau pasien', Ikon: Stethoscope },
];

/** Selamat Datang / Pilih Peran (Bab 13). Peran disimpan lokal; tanpa akun (prototype lomba). */
export default function PilihPeran() {
  const navigate = useNavigate();
  return (
    <section className="flex min-h-[calc(100dvh-7rem)] flex-col">
      <div>
        <h1 className="text-[1.75rem] font-extrabold leading-tight">Selamat Datang di PULIHIN</h1>
        <p className="mt-1 text-teks-2">Teman latihan pemulihan stroke di rumah, untuk pasien, keluarga, dan terapis.</p>
      </div>

      <div className="mt-auto pt-5">
        <h2 className="mb-3 font-bold">Siapa yang memakai ponsel ini?</h2>
        <ul className="space-y-3">
          {PERAN.map(({ role, judul, sub, Ikon }) => (
            <li key={role}>
              <button
                type="button"
                onClick={() => {
                  setPrefs({ role });
                  navigate(berandaUntukPeran(role));
                }}
                className="flex min-h-[80px] w-full items-center gap-4 rounded-kartu border-2 border-primer-garis bg-white p-4 text-left shadow-tipis transition-transform hover:border-primer active:scale-[0.99]"
              >
                <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-primer-terang text-primer">
                  <Ikon size={32} weight="bold" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[1.2rem] font-extrabold leading-tight text-teks">{judul}</span>
                  <span className="block text-[0.95rem] text-teks-2">{sub}</span>
                </span>
                <CaretRight size={24} weight="bold" className="shrink-0 text-primer" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
        <p className="mt-5 text-center text-[0.85rem] text-teks-2">Prototype lomba - data contoh (Demo). Bisa diganti kapan saja di Pengaturan.</p>
      </div>
    </section>
  );
}
