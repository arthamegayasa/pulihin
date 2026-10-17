import { ArrowSquareOut, ArrowsDownUp, Cpu, Waveform, WifiSlash } from '@phosphor-icons/react';
import type { Icon } from '@phosphor-icons/react';
import { IkonBingkai } from '@/components/premium';

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
    isi: 'Dapat dipasang di layar utama. Model pose disimpan saat Beranda pasien dibuka, jadi sesi kamera tetap berjalan tanpa internet sesudahnya.',
  },
];

/** Hasil uji yang tercatat di README.md (bagian Hasil uji) dan docs/algoritma.md Bagian 13. */
const BUKTI: { angka: string; isi: string }[] = [
  {
    angka: '14 dari 14',
    isi: 'repetisi Tekuk Siku yang dimulai setelah status Siap terhitung pada rekaman orang sungguhan, 0 hitungan ganda. Belum diuji di HP target.',
  },
  {
    angka: '0 video',
    isi: 'dikirim keluar perangkat; pose dihitung di browser. Telemetri bawaan pustaka MediaPipe diblokir.',
  },
  {
    angka: '261',
    isi: 'uji otomatis lulus, termasuk simulasi 50 repetisi dengan derau dan frame hilang.',
  },
];

/** Strip teknologi: fakta jujur untuk kriteria Quality of Technology (Lampiran A). */
export function Teknologi() {
  return (
    <section id="teknologi" aria-labelledby="judul-teknologi" className="scroll-mt-6 border-y border-garis-halus bg-permukaan">
      <div className="mx-auto max-w-6xl px-5 py-16 md:px-8 lg:py-20">
        <p className="tipe-label text-primer">Teknologi</p>
        <h2 id="judul-teknologi" className="mt-2 text-balance text-[1.75rem] font-extrabold leading-tight tracking-tight lg:text-[2.2rem]">
          Ringan, di perangkat, dan jujur
        </h2>
        <p className="mt-4 max-w-[52ch] text-teks-2">
          Dipilih agar tetap ringan di HP Android kelas bawah dan tidak mengirim gambar tubuh pasien ke server.
        </p>
        <dl className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FAKTA.map(({ Ikon, nama, isi }) => (
            <div key={nama} className="rounded-kartu border border-garis-halus bg-latar p-6">
              <dt>
                <IkonBingkai nada="putih">
                  <Ikon weight="bold" />
                </IkonBingkai>
                <span className="mt-4 block text-[1.05rem] font-extrabold leading-snug">{nama}</span>
              </dt>
              <dd className="mt-2 text-[0.95rem] leading-relaxed text-teks-2">{isi}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-10 rounded-kartu border border-primer-garis bg-primer-terang p-6 md:p-8">
          <h3 className="text-[1.2rem] font-extrabold leading-snug">Hasil uji sejauh ini</h3>
          <dl className="mt-6 grid gap-6 md:grid-cols-3">
            {BUKTI.map(({ angka, isi }) => (
              <div key={angka}>
                <dt className="tabular text-[2rem] font-extrabold leading-none text-primer">{angka}</dt>
                <dd className="mt-2 text-[0.95rem] leading-relaxed text-teks-2">{isi}</dd>
              </div>
            ))}
          </dl>
          <a
            href="https://github.com/arthamegayasa/pulihin#hasil-uji"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex min-h-[56px] items-center gap-2 font-bold text-primer underline underline-offset-4"
          >
            Lihat rincian hasil uji di GitHub
            <ArrowSquareOut size={20} weight="bold" aria-hidden />
          </a>
        </div>
      </div>
    </section>
  );
}
