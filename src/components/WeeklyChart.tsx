import type { BatangHari } from '@/features/adherence/adherence';
import { namaHari } from '@/lib/date';

/**
 * Grafik kepatuhan 7 hari (Bab 9.2): batang = latihan selesai, latar batang = target harian.
 * Angka tertulis di atas setiap batang sehingga tidak bergantung pada warna. SVG murni, ringan.
 */
export function WeeklyChart({ data, className = '' }: { data: BatangHari[]; className?: string }) {
  const W = 320;
  const H = 168;
  const atas = 26;
  const bawah = 30;
  const tinggi = H - atas - bawah;
  const kolom = W / data.length;
  const lebar = 26;
  const maks = Math.max(1, ...data.map((b) => b.target), ...data.map((b) => b.selesai));

  return (
    <figure className={className}>
      <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" aria-hidden focusable="false">
        <line x1={0} x2={W} y1={atas + tinggi} y2={atas + tinggi} stroke="var(--color-garis)" strokeWidth={1.5} />
        {data.map((b, i) => {
          const cx = kolom * i + kolom / 2;
          const x = cx - lebar / 2;
          const hTarget = (b.target / maks) * tinggi;
          const hSelesai = (Math.min(b.selesai, maks) / maks) * tinggi;
          const penuh = b.target > 0 && b.selesai >= b.target;
          return (
            <g key={b.tanggal}>
              {b.hariIni && (
                <rect x={cx - kolom / 2 + 2} y={2} width={kolom - 4} height={H - 4} rx={10} fill="var(--color-primer-terang)" />
              )}
              {b.target > 0 && (
                <rect
                  x={x}
                  y={atas + tinggi - hTarget}
                  width={lebar}
                  height={hTarget}
                  rx={6}
                  fill="white"
                  stroke="var(--color-primer-garis)"
                  strokeWidth={1.5}
                  strokeDasharray="4 3"
                />
              )}
              {hSelesai > 0 && (
                <rect
                  x={x}
                  y={atas + tinggi - hSelesai}
                  width={lebar}
                  height={hSelesai}
                  rx={6}
                  fill={penuh ? 'var(--color-sukses)' : 'var(--color-primer)'}
                />
              )}
              <text x={cx} y={atas - 8} textAnchor="middle" fontSize={14} fontWeight={700} fill="var(--color-teks)">
                {b.target > 0 ? `${b.selesai}/${b.target}` : '–'}
              </text>
              <text
                x={cx}
                y={H - 10}
                textAnchor="middle"
                fontSize={14}
                fontWeight={b.hariIni ? 800 : 500}
                fill={b.hariIni ? 'var(--color-primer)' : 'var(--color-teks-2)'}
              >
                {b.label}
              </text>
              {b.hariIni && <rect x={cx - 12} y={H - 6} width={24} height={3} rx={1.5} fill="var(--color-primer)" />}
            </g>
          );
        })}
      </svg>
      <figcaption className="mt-1 text-[0.85rem] text-teks-2">
        Angka = latihan selesai dari target harian (1 latihan gerak + 1 latihan bicara). Garis bawah = hari ini.
      </figcaption>
      <div className="sr-only">
      <table>
        <caption>Latihan selesai dibanding target, 7 hari terakhir</caption>
        <thead>
          <tr>
            <th scope="col">Hari</th>
            <th scope="col">Selesai</th>
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
