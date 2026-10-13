import { ArrowsDownUp, Cpu, Waveform, WifiSlash } from '@phosphor-icons/react';
import type { Icon } from '@phosphor-icons/react';

/** Fakta teknis yang benar-benar dipakai di kode ini (PoseEngine, RepCounter, SpeechScorer, vite-plugin-pwa). */
const FAKTA: { Ikon: Icon; nama: string; isi: string }[] = [
  {
    Ikon: Cpu,
    nama: 'MediaPipe Pose Landmarker',
    isi: 'Model pose varian lite berjalan di perangkat lewat WebAssembly, memakai GPU bila tersedia dan CPU bila tidak.',
  },
  {
    Ikon: ArrowsDownUp,
    nama: 'State machine sudut dengan histeresis',
    isi: 'Sudut sendi diratakan beberapa frame. Ambang naik dan turun terpisah sehingga satu gerakan tidak terhitung dua kali.',
  },
  {
    Ikon: Waveform,
    nama: 'Web Speech API id-ID',
    isi: 'Ucapan Bahasa Indonesia dikenali browser, lalu dinilai terhadap kata target dengan jarak edit dan suku kata awal.',
  },
  {
    Ikon: WifiSlash,
    nama: 'PWA offline',
    isi: 'Dapat dipasang di layar utama. Model pose ikut tersimpan, jadi sesi kamera tetap berjalan tanpa internet setelah dibuka sekali.',
  },
];

/** Strip teknologi: fakta jujur untuk kriteria Quality of Technology (Lampiran A). */
export function Teknologi() {
  return (
    <section id="teknologi" aria-labelledby="judul-teknologi" className="mx-auto max-w-6xl scroll-mt-6 px-5 py-16 md:px-8 lg:py-20">
      <h2 id="judul-teknologi" className="text-[1.75rem] font-extrabold leading-tight tracking-tight lg:text-[2.2rem]">
        Teknologi
      </h2>
      <p className="mt-4 max-w-[52ch] text-teks-2">
        Dipilih agar tetap ringan di HP Android kelas bawah dan tidak mengirim gambar tubuh pasien ke server.
      </p>
      <dl className="mt-10 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
        {FAKTA.map(({ Ikon, nama, isi }) => (
          <div key={nama} className="border-l-2 border-primer-garis pl-5">
            <dt>
              <Ikon size={28} weight="bold" className="text-primer" aria-hidden />
              <span className="mt-3 block text-[1.05rem] font-extrabold leading-snug">{nama}</span>
            </dt>
            <dd className="mt-2 text-[0.95rem] leading-relaxed text-teks-2">{isi}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
