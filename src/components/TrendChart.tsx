import type { TitikTren } from '@/features/adherence/adherence';
import { formatTanggalPendek } from '@/lib/date';

/**
 * Tren skor 14 hari (Bab 9.2): skor latihan gerak (garis penuh, titik bulat) dan skor latihan bicara
 * (garis putus-putus, titik kotak). Bentuk garis dan titik membedakan keduanya, bukan warna saja.
 * Hari tanpa sesi tidak diberi titik; garis menyambung antar hari yang ada datanya.
 * SVG hanya menggambar garis & titik; semua label berupa teks HTML (>= 0.9rem, ikut Huruf Lebih Besar),
 * diletakkan dengan persentase koordinat SVG sehingga tetap sejajar pada lebar layar berapa pun.
 */
export function TrendChart({ data, className = '' }: { data: TitikTren[]; className?: string }) {
  const W = 320;
  const H = 150;
  const tepi = 10;
  const lebarPlot = W - 2 * tepi;
  const tinggiPlot = H - 2 * tepi;
  const x = (i: number) => tepi + (data.length <= 1 ? lebarPlot / 2 : (i / (data.length - 1)) * lebarPlot);
  const y = (v: number) => tepi + tinggiPlot - (v / 100) * tinggiPlot;
  const titik = (key: 'gerak' | 'afasia') =>
    data.flatMap((d, i) => {
      const v = d[key];
      return v === null ? [] : [{ i, v }];
    });
  const gerak = titik('gerak');
  const afasia = titik('afasia');
  const garis = (pts: { i: number; v: number }[]) => pts.map((p) => `${x(p.i).toFixed(1)},${y(p.v).toFixed(1)}`).join(' ');
  const labelX = [0, Math.floor((data.length - 1) / 2), data.length - 1];
  const kosong = gerak.length === 0 && afasia.length === 0;

  return (
    <figure className={className}>
      <ul className="mb-2 flex flex-wrap gap-x-5 gap-y-1 text-[0.95rem] text-teks">
        <li className="flex items-center gap-2">
          <svg width="34" height="12" aria-hidden>
            <line x1="1" x2="33" y1="6" y2="6" stroke="var(--color-primer)" strokeWidth="3" />
            <circle cx="17" cy="6" r="4" fill="var(--color-primer)" />
          </svg>
          Gerak (garis penuh)
        </li>
        <li className="flex items-center gap-2">
          <svg width="34" height="12" aria-hidden>
            <line x1="1" x2="33" y1="6" y2="6" stroke="var(--color-aksen)" strokeWidth="3" strokeDasharray="6 4" />
            <rect x="13" y="2" width="8" height="8" fill="var(--color-aksen)" />
          </svg>
          Bicara (garis putus-putus)
        </li>
      </ul>
      <div aria-hidden>
        <div className="flex gap-1">
          {/* Kolom angka setinggi SVG saja, agar persentase posisi sama dengan koordinat garis bantu. */}
          <div className="relative w-[2.1rem] shrink-0 text-[0.9rem] leading-none text-teks-2 tabular">
            {[0, 50, 100].map((v) => (
              <span key={v} className="absolute right-0 -translate-y-1/2" style={{ top: `${(y(v) / H) * 100}%` }}>
                {v}
              </span>
            ))}
          </div>
          <div className="relative min-w-0 flex-1">
            <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" focusable="false">
              {[0, 50, 100].map((v) => (
                <line key={v} x1={tepi} x2={W - tepi} y1={y(v)} y2={y(v)} stroke="var(--color-garis)" strokeWidth={1} />
              ))}
              {gerak.length > 1 && (
                <polyline points={garis(gerak)} fill="none" stroke="var(--color-primer)" strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" />
              )}
              {afasia.length > 1 && (
                <polyline points={garis(afasia)} fill="none" stroke="var(--color-aksen)" strokeWidth={3} strokeDasharray="7 5" strokeLinejoin="round" />
              )}
              {gerak.map((p) => (
                <circle key={`g${p.i}`} cx={x(p.i)} cy={y(p.v)} r={4.5} fill="var(--color-primer)" stroke="white" strokeWidth={1.5} />
              ))}
              {afasia.map((p) => (
                <rect key={`a${p.i}`} x={x(p.i) - 4.5} y={y(p.v) - 4.5} width={9} height={9} fill="var(--color-aksen)" stroke="white" strokeWidth={1.5} />
              ))}
            </svg>
            {kosong && (
              <p className="absolute inset-0 grid place-items-center px-2 text-center text-[0.95rem] text-teks-2">Belum ada skor dalam 14 hari terakhir</p>
            )}
          </div>
        </div>
        <div className="relative ml-[calc(2.1rem+0.25rem)] mt-1.5 h-[1.3em] text-[0.9rem] leading-none text-teks-2">
          {labelX.map((i, n) => (
            <span
              key={i}
              className={`absolute top-0 whitespace-nowrap ${n === 1 ? '-translate-x-1/2' : ''} ${n === 2 ? 'font-bold text-teks' : ''}`}
              style={n === 0 ? { left: 0 } : n === 2 ? { right: 0 } : { left: `${(x(i) / W) * 100}%` }}
            >
              {n === 2 ? 'Hari ini' : formatTanggalPendek(data[i].tanggal)}
            </span>
          ))}
        </div>
      </div>
      <div className="sr-only">
        <table>
          <caption>Skor latihan per hari, 14 hari terakhir</caption>
          <thead>
            <tr>
              <th scope="col">Tanggal</th>
              <th scope="col">Skor gerak</th>
              <th scope="col">Skor bicara</th>
            </tr>
          </thead>
          <tbody>
            {data.map((d) => (
              <tr key={d.tanggal}>
                <th scope="row">{formatTanggalPendek(d.tanggal)}</th>
                <td>{d.gerak ?? 'tidak ada sesi'}</td>
                <td>{d.afasia ?? 'tidak ada sesi'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  );
}
