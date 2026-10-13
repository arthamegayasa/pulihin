import { Camera, CloudArrowUp, Database, ShieldCheck, Trash, Warning } from '@phosphor-icons/react';
import type { Icon } from '@phosphor-icons/react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { Card } from '@/components/Card';
import { PageHeader } from '@/components/PageHeader';
import { PATHS } from '@/router-paths';

function Poin({ Ikon, children }: { Ikon: Icon; children: ReactNode }) {
  return (
    <li className="flex gap-3">
      <Ikon size={26} weight="bold" className="mt-0.5 shrink-0 text-primer" aria-hidden />
      <span>{children}</span>
    </li>
  );
}

/** Tentang PULIHIN: status prototype (Bab 17.1), privasi secara desain (Bab 17.3), kredit. */
export default function Tentang() {
  return (
    <section className="space-y-4">
      <PageHeader judul="Tentang PULIHIN" />
      <p>
        PULIHIN adalah pendamping latihan pemulihan stroke di rumah. Kamera ponsel biasa menghitung gerakan dan memberi
        koreksi dalam Bahasa Indonesia, ada latihan bicara untuk menyebut nama benda sehari-hari, dan keluarga dapat melihat
        ringkasan latihan untuk dikirim ke terapis.
      </p>

      <Card nada="peringatan" className="flex gap-3">
        <Warning size={28} weight="fill" className="mt-0.5 shrink-0 text-peringatan" aria-hidden />
        <div className="space-y-1">
          <p className="font-bold">Prototype lomba, bukan alat kesehatan</p>
          <p>
            PULIHIN adalah prototype untuk kompetisi .id Developer Day Indonesia 2026. Aplikasi ini bukan alat kesehatan
            teregulasi, tidak memiliki izin sebagai perangkat medis, dan tidak dipakai untuk diagnosis atau menentukan terapi.
            Program latihan untuk pasien sungguhan harus ditetapkan atau disetujui tenaga kesehatan yang merawat.
          </p>
        </div>
      </Card>

      <Card>
        <h2 className="mb-3 text-[1.15rem] font-extrabold">Privasi Anda</h2>
        <ul className="space-y-3">
          <Poin Ikon={Camera}>Gambar kamera diproses langsung di ponsel ini. Video tidak pernah direkam atau diunggah.</Poin>
          <Poin Ikon={Database}>
            Semua data latihan tersimpan hanya di ponsel ini. Tidak ada data yang dikirim ke server mana pun.
          </Poin>
          <Poin Ikon={ShieldCheck}>Tidak ada analitik atau pelacak pihak ketiga.</Poin>
          <Poin Ikon={CloudArrowUp}>
            Catatan jujur: pada sebagian browser, termasuk Chrome, pengenalan suara di latihan bicara memakai layanan cloud
            milik penyedia browser. Karena itu tersedia Mode Latihan Mandiri, yang tidak memakai pengenalan suara sama sekali.
          </Poin>
          <Poin Ikon={Trash}>
            Untuk menghapus semua data, buka{' '}
            <Link to={PATHS.pengaturan} className="font-bold text-primer underline underline-offset-4">
              Pengaturan
            </Link>{' '}
            lalu tekan Hapus Semua Data Lokal. Data contoh (Demo) tidak akan dimuat lagi otomatis.
          </Poin>
        </ul>
      </Card>

      <Card>
        <h2 className="mb-2 text-[1.15rem] font-extrabold">Kredit</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>MediaPipe Pose Landmarker (Google) - lisensi Apache 2.0</li>
          <li>Huruf Plus Jakarta Sans - lisensi SIL Open Font License (OFL)</li>
          <li>Ikon Phosphor Icons - lisensi MIT</li>
        </ul>
        <p className="mt-3 text-teks-2">Tim: [DIISI: nama tim]</p>
      </Card>

      <p className="text-[0.9rem] text-teks-2">Semua nama pasien di aplikasi ini adalah nama samaran untuk data contoh.</p>
    </section>
  );
}
