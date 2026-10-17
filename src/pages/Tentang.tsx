import { Camera, CloudArrowUp, Database, Info, ShieldCheck, Trash, Warning } from '@phosphor-icons/react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { Card } from '@/components/Card';
import { PageHeader } from '@/components/PageHeader';
import { IkonBingkai, Ilustrasi } from '@/components/premium';
import { IDENTITAS } from '@/config/identitas';
import { PATHS } from '@/router-paths';

function Poin({ ikon, children }: { ikon: ReactNode; children: ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <IkonBingkai nada="primer">{ikon}</IkonBingkai>
      <span className="min-w-0 pt-2">{children}</span>
    </li>
  );
}

function BarisIdentitas({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="inline font-bold text-teks">{label}: </dt>
      <dd className="inline">{children}</dd>
    </div>
  );
}

/** Tentang PULIHIN: status prototype (Bab 17.1), privasi secara desain (Bab 17.3), kredit. */
export default function Tentang() {
  return (
    <section className="space-y-5">
      <PageHeader judul="Tentang PULIHIN" />
      <p className="tipe-isi text-teks">
        PULIHIN adalah pendamping latihan pemulihan stroke di rumah. Kamera ponsel biasa menghitung gerakan dan memberi
        koreksi dalam Bahasa Indonesia, ada latihan bicara untuk menyebut nama benda sehari-hari, dan keluarga dapat melihat
        ringkasan latihan untuk dikirim ke terapis.
      </p>

      <Card nada="peringatan" className="flex gap-3">
        <span aria-hidden className="grid size-[44px] shrink-0 place-items-center rounded-[12px] bg-permukaan text-peringatan shadow-tipis">
          <Warning size={26} weight="fill" />
        </span>
        <div className="min-w-0 space-y-1">
          <h2 className="tipe-subjudul text-teks">Prototype lomba, bukan alat kesehatan</h2>
          <p className="text-teks">
            PULIHIN adalah prototype untuk kompetisi .id Developer Day Indonesia 2026. Aplikasi ini bukan alat kesehatan
            teregulasi, tidak memiliki izin sebagai perangkat medis, dan tidak dipakai untuk diagnosis atau menentukan terapi.
            Program latihan untuk pasien sungguhan harus ditetapkan atau disetujui tenaga kesehatan yang merawat.
          </p>
        </div>
      </Card>

      <section aria-labelledby="judul-privasi" className="overflow-hidden rounded-kartu border border-garis-halus bg-permukaan shadow-tipis">
        <div className="bg-ilustrasi px-4">
          {/* Potong ruang kosong atas-bawah (rasio tetap: tanpa geser tata letak). */}
          <Ilustrasi jenis="momen" nama="privasi" bilaGagal="sembunyi" className="mx-auto block aspect-[2/1] w-full max-w-[300px] object-cover" />
        </div>
        <div className="space-y-4 p-4">
          <div>
            <h2 id="judul-privasi" className="tipe-subjudul text-teks">
              Privasi Anda
            </h2>
            <p className="tipe-keterangan text-teks-2">Data latihan tetap di tangan keluarga.</p>
          </div>
          <ul className="space-y-3.5">
            <Poin ikon={<Camera weight="bold" />}>Gambar kamera diproses langsung di ponsel ini. Video tidak pernah direkam atau diunggah.</Poin>
            <Poin ikon={<Database weight="bold" />}>
              Semua data latihan tersimpan hanya di ponsel ini. Tidak ada data yang dikirim ke server mana pun.
            </Poin>
            <Poin ikon={<ShieldCheck weight="bold" />}>Tidak ada analitik atau pelacak pihak ketiga.</Poin>
            <Poin ikon={<CloudArrowUp weight="bold" />}>
              Catatan jujur: pada sebagian browser, termasuk Chrome, pengenalan suara di latihan bicara memakai layanan cloud
              milik penyedia browser. Karena itu tersedia Mode Latihan Mandiri, yang tidak memakai pengenalan suara sama sekali.
            </Poin>
            <Poin ikon={<Trash weight="bold" />}>
              Untuk menghapus semua data, buka{' '}
              <Link to={PATHS.pengaturan} className="font-bold text-primer underline underline-offset-4">
                Pengaturan
              </Link>{' '}
              lalu tekan Hapus Semua Data Lokal. Data contoh (Demo) tidak akan dimuat lagi otomatis.
            </Poin>
          </ul>
        </div>
      </section>

      <Card className="space-y-3">
        <div className="flex items-center gap-3">
          <IkonBingkai nada="primer">
            <Info weight="bold" />
          </IkonBingkai>
          <h2 className="tipe-subjudul text-teks">Kredit</h2>
        </div>
        <ul className="list-disc space-y-1 pl-5 text-teks marker:text-primer">
          <li>MediaPipe Pose Landmarker (Google) - lisensi Apache 2.0</li>
          <li>Huruf Plus Jakarta Sans - lisensi SIL Open Font License (OFL)</li>
          <li>Ikon Phosphor Icons - lisensi MIT</li>
        </ul>
        {/* Baris identitas hanya tampil bila sudah diisi di src/config/identitas.ts. */}
        {(IDENTITAS.namaTim || IDENTITAS.anggotaTim.length > 0 || IDENTITAS.narasumberKlinis || IDENTITAS.kontakPublik) && (
          <dl className="space-y-1 text-teks-2">
            {IDENTITAS.namaTim && <BarisIdentitas label="Tim">{IDENTITAS.namaTim}</BarisIdentitas>}
            {IDENTITAS.anggotaTim.length > 0 && <BarisIdentitas label="Anggota">{IDENTITAS.anggotaTim.join(', ')}</BarisIdentitas>}
            {IDENTITAS.narasumberKlinis && <BarisIdentitas label="Narasumber klinis">{IDENTITAS.narasumberKlinis}</BarisIdentitas>}
            {IDENTITAS.kontakPublik && <BarisIdentitas label="Kontak">{IDENTITAS.kontakPublik}</BarisIdentitas>}
          </dl>
        )}
        <p className="text-teks-2">Dibuat untuk {IDENTITAS.kategoriLomba}.</p>
      </Card>

      <p className="tipe-keterangan text-teks-2">Semua nama pasien di aplikasi ini adalah nama samaran untuk data contoh.</p>
    </section>
  );
}
