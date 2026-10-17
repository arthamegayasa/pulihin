import { Database } from '@phosphor-icons/react';
import { useState } from 'react';
import { BigButton } from '@/components/BigButton';
import { Card } from '@/components/Card';
import { IkonBingkai } from '@/components/premium/IkonBingkai';
import { Ilustrasi } from '@/components/premium/Ilustrasi';
import { resetDemoData } from '@/data/seed';
import { getPrefs } from '@/lib/prefs';

/**
 * Keadaan kosong saat belum ada data pasien di ponsel ini (mis. setelah Hapus Semua Data Lokal).
 * Ilustrasi tenang `momen/kosong`; bila berkasnya tidak bisa dimuat, kembali ke ikon.
 */
export function KosongDemo({ judul = 'Belum ada data latihan di ponsel ini' }: { judul?: string }) {
  const [sibuk, setSibuk] = useState(false);
  const [galat, setGalat] = useState<string | null>(null);
  const [tanpaGambar, setTanpaGambar] = useState(false);
  return (
    <Card nada="primer" className="space-y-3">
      {!tanpaGambar && (
        <Ilustrasi
          jenis="momen"
          nama="kosong"
          bilaGagal="sembunyi"
          onGagal={() => setTanpaGambar(true)}
          className="mx-auto block h-auto w-full max-w-[220px] rounded-kartu"
        />
      )}
      <div className="flex items-start gap-3">
        {tanpaGambar && (
          <IkonBingkai nada="putih">
            <Database weight="bold" />
          </IkonBingkai>
        )}
        <div className="min-w-0">
          <p className="tipe-subjudul">{judul}</p>
          <p className="mt-0.5 text-teks-2">Muat data contoh (Demo) untuk melihat cara kerja PULIHIN. Data contoh hanya tersimpan di ponsel ini.</p>
        </div>
      </div>
      <BigButton
        disabled={sibuk}
        onClick={() => {
          setSibuk(true);
          setGalat(null);
          resetDemoData(getPrefs().skenarioDemo)
            .catch(() => setGalat('Data contoh belum bisa dimuat. Coba muat ulang halaman.'))
            .finally(() => setSibuk(false));
        }}
      >
        {sibuk ? 'Sedang memuat...' : 'Muat Data Demo'}
      </BigButton>
      {galat && <p className="font-semibold text-teks">{galat}</p>}
    </Card>
  );
}
