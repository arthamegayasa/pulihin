import type { TitikTren } from '@/features/adherence/adherence';
import { formatTanggalPendek } from '@/lib/date';

/**
 * Tren skor 14 hari (Bab 9.2): skor latihan gerak (garis penuh, titik bulat) dan skor latihan bicara
 * (garis putus-putus, titik kotak). Bentuk garis dan titik membedakan keduanya, bukan warna saja.
 * Hari tanpa sesi tidak diberi titik; garis menyambung antar hari yang ada datanya.
 */
export function TrendChart({ data, className = '' }: { data: TitikTren[]; className?: string }) {
  const W = 320;
  const H = 180;
  const kiri = 30;
  const kanan = 10;
  const atas = 10;
  const bawah = 26;
  const lebarPlot = W - kiri - kanan;
  const tinggiPlot = H - atas - bawah;
  const x = (i: number) => kiri + (data.length <= 1 ? lebarPlot / 2 : (i / (data.length - 1)) * lebarPlot);
  const y = (v: number) => atas + tinggiPlot - (v / 100) * tinggiPlot;
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
      <ul className="mb-2 flex flex-wrap gap-x-5 gap-y-1 text-[0.9rem] text-teks">
        <li className="flex items-center gap-2">
          <svg width="34" height="12" aria-hidden>
            <line x1="1" x2="33" y1="6" y2="6" stroke="var(--color-primer)" strokeWidth="3" />
            <circle cx="17" cy="6" r="4" fill="var(--color-primer)" />
          </svg>
          Skor latihan gerak (garis penuh)
        </li>
        <li className="flex items-center gap-2">
          <svg width="34" height="12" aria-hidden>
            <line x1="1" x2="33" y1="6" y2="6" stroke="var(--color-aksen)" strokeWidth="3" strokeDasharray="6 4" />
            <rect x="13" y="2" width="8" height="8" fill="var(--color-aksen)" />
          </svg>
          Skor latihan bicara (garis putus-putus)
        </li>
      </ul>
      <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" aria-hidden focusable="false">
        {[0, 50, 100].map((v) => (
          <g key={v}>
            <line x1={kiri} x2={W - kanan} y1={y(v)} y2={y(v)} stroke="var(--color-garis)" strokeWidth={1} />
            <text x={kiri - 6} y={y(v) + 4} textAnchor="end" fontSize={13} fill="var(--color-teks-2)">
              {v}
            </text>
          </g>
        ))}
        {labelX.map((i) => (
          <text key={i} x={x(i)} y={H - 6} textAnchor={i === 0 ? 'start' : i === data.length - 1 ? 'end' : 'middle'} fontSize={13} fill="var(--color-teks-2)">
            {i === data.length - 1 ? 'Hari ini' : formatTanggalPendek(data[i].tanggal)}
          </text>
        ))}
        {gerak.length > 1 && (
          <polyline points={garis(gerak)} fill="none" stroke="var(--color-primer)" strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" />
        )}
        {afasia.length > 1 && (
          <polyline
            points={garis(afasia)}
            fill="none"
            stroke="var(--color-aksen)"
            strokeWidth={3}
            strokeDasharray="7 5"
            strokeLinejoin="round"
          />
        )}
        {gerak.map((p) => (
          <circle key={`g${p.i}`} cx={x(p.i)} cy={y(p.v)} r={4.5} fill="var(--color-primer)" stroke="white" strokeWidth={1.5} />
        ))}
        {afasia.map((p) => (
          <rect key={`a${p.i}`} x={x(p.i) - 4.5} y={y(p.v) - 4.5} width={9} height={9} fill="var(--color-aksen)" stroke="white" strokeWidth={1.5} />
        ))}
        {kosong && (
          <text x={kiri + lebarPlot / 2} y={atas + tinggiPlot / 2} textAnchor="middle" fontSize={14} fill="var(--color-teks-2)">
            Belum ada skor dalam 14 hari terakhir
          </text>
        )}
      </svg>
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
