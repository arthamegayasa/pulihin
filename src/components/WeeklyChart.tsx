import type { BatangHari } from '@/features/adherence/adherence';
import { namaHari } from '@/lib/date';

/**
 * Grafik kepatuhan 7 hari (Bab 9.2): batang = sesi terjadwal yang dikerjakan, kotak garis putus = target harian.
 * Batang dan label dibuat dengan HTML/CSS (bukan teks SVG) agar angka & nama hari minimal 0.95rem dan ikut
 * pengaturan Huruf Lebih Besar. Angka tertulis di atas setiap batang sehingga tidak bergantung pada warna.
 * Tinggi area batang memakai px agar grafik tidak memanjang saat huruf diperbesar.
 */
export function WeeklyChart({ data, className = '' }: { data: BatangHari[]; className?: string }) {
  const maks = Math.max(1, ...data.map((b) => b.target), ...data.map((b) => b.selesai));
  const persen = (n: number) => `${(Math.min(n, maks) / maks) * 100}%`;

  return (
    <figure className={className}>
      {/* -mx-3 tanpa celah antar kolom: grafik memakai sebagian padding kartu agar label hari 0.95rem tetap muat
          di 7 kolom pada 360 px dengan Huruf Lebih Besar. */}
      <ol className="-mx-3 grid grid-cols-7" aria-hidden>
        {data.map((b) => {
          const penuh = b.target > 0 && b.selesai >= b.target;
          return (
            <li key={b.tanggal} className={`flex min-w-0 flex-col items-center gap-1 rounded-xl py-1.5 ${b.hariIni ? 'bg-primer-terang' : ''}`}>
              <span className="text-[0.95rem] font-bold leading-none tracking-tight text-teks tabular">{b.target > 0 ? `${b.selesai}/${b.target}` : '–'}</span>
              <span className="relative h-[96px] w-[60%] max-w-[28px]">
                {b.target > 0 && (
                  <span
                    className="absolute inset-x-0 bottom-0 rounded-md border-[1.5px] border-dashed border-primer bg-white"
                    style={{ height: persen(b.target) }}
                  />
                )}
                {b.selesai > 0 && (
                  <span
                    className={`absolute inset-x-0 bottom-0 rounded-md ${penuh ? 'bg-sukses' : 'bg-primer'}`}
                    style={{ height: persen(b.selesai) }}
                  />
                )}
              </span>
              <span
                className={`border-b-[3px] text-[0.95rem] leading-tight tracking-tight ${b.hariIni ? 'border-primer font-extrabold text-primer' : 'border-transparent font-semibold text-teks-2'}`}
              >
                {b.label}
              </span>
            </li>
          );
        })}
      </ol>
      <figcaption className="mt-2 text-[0.95rem] leading-snug text-teks-2">
        Angka = sesi terjadwal yang dikerjakan / target hari itu. Kotak garis putus-putus = target, batang hijau = target
        tercapai. Hari ini diberi latar dan garis bawah.
      </figcaption>
      <div className="sr-only">
        <table>
          <caption>Sesi terjadwal yang dikerjakan dibanding target, 7 hari terakhir</caption>
          <thead>
            <tr>
              <th scope="col">Hari</th>
              <th scope="col">Dikerjakan</th>
              <th scope="col">Target</th>
            </tr>
          </thead>
          <tbody>
            {data.map((b) => (
              <tr key={b.tanggal}>
                <th scope="row">{b.hariIni ? `Hari ini (${namaHari(b.tanggal)})` : namaHari(b.tanggal)}</th>
                <td>{b.selesai}</td>
                <td>{b.target}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  );
}
