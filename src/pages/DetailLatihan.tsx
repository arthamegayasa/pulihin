import { Check, CheckSquare, ListNumbers, ShieldCheck, Square, Target as IkonTarget, VideoCamera, WarningCircle } from '@phosphor-icons/react';
import { useEffect, useId, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { BigButton, BigLink } from '@/components/BigButton';
import { PageHeader } from '@/components/PageHeader';
import { SafetyNotice } from '@/components/SafetyNotice';
import { IkonBingkai } from '@/components/premium';
import { ChipInfo, ChipPosisi } from '@/features/pasien/ChipLatihan';
import { getExercise } from '@/features/pose/exerciseDefinitions';
import { labelSendi } from '@/features/pose/labels';
import { PhonePlacement } from '@/features/pose/PhonePlacement';
import { prefetchAsetPose } from '@/features/pose/asetPose';
import { preloadPoseEngine } from '@/features/pose/PoseEngine';
import { VideoPeraga } from '@/features/pose/VideoPeraga';
import { useDataPasien } from '@/features/adherence/hooks';
import { bacaRentang, bacaSisi, bacaTarget, RENTANG_PENUH, urlSesi, type StatusMulaiSesi } from '@/features/pose/sesiParams';
import { getPrefs, setPrefs, usePrefs } from '@/lib/prefs';
import { PATHS } from '@/router-paths';
import type { Sisi } from '@/types';

/** Layar persiapan (Bab 5.1 langkah 2): contoh gerakan, posisi, langkah, letak ponsel, keselamatan, lalu Mulai. */
export default function DetailLatihan() {
  const { id = '' } = useParams();
  const [cari] = useSearchParams();
  const navigate = useNavigate();
  const def = getExercise(id);
  const { sisiLatihan } = usePrefs();
  // Konfirmasi berpegangan wajib setiap kali halaman dibuka (tidak disimpan).
  const [sudahBerpegangan, setSudahBerpegangan] = useState(false);
  const idKonfirmasi = useId();
  // Tanpa `?rentang=` (mis. dari "Lihat semua latihan"), target rentang diambil dari program pasien aktif.
  const { data } = useDataPasien();

  // Muat MediaPipe sejak layar ini dibuka agar skeleton langsung tampil saat kamera menyala (AC-F1-1).
  useEffect(() => {
    preloadPoseEngine().catch((e: unknown) => console.warn('Model pose belum termuat, dicoba lagi saat sesi dimulai', e));
  }, []);
  // Aset MediaPipe ke cache service worker saat senggang (pemakaian berikutnya bisa luring).
  useEffect(prefetchAsetPose, []);

  // `?sisi=` (dari Ulangi Latihan / kembali dari sesi) menjadi sisi terpilih.
  const sisiDariUrl = cari.get('sisi');
  useEffect(() => {
    if (sisiDariUrl === null) return;
    const sisi = bacaSisi(sisiDariUrl, getPrefs().sisiLatihan);
    if (sisi !== getPrefs().sisiLatihan) setPrefs({ sisiLatihan: sisi });
  }, [sisiDariUrl]);

  if (!def) {
    return (
      <section>
        <PageHeader judul="Latihan tidak ditemukan" kembali={PATHS.latihan} />
        <p className="mb-5 text-teks-2">Latihan ini tidak ada di pustaka. Silakan pilih dari daftar latihan.</p>
        <BigLink to={PATHS.latihan}>Lihat Daftar Latihan</BigLink>
      </section>
    );
  }

  const target = bacaTarget(cari.get('target'), def.targetRepetisiDefault);
  const rentangProgram = data?.program?.items.find((i) => i.latihanId === def.id)?.rentangPersen;
  const rentangUrl = cari.get('rentang');
  const rentang = bacaRentang(rentangUrl ?? (rentangProgram === undefined ? null : String(rentangProgram)));
  const pilihSisi = def.sisi === 'pilih';
  const wajibPegangan = def.wajibBerpegangan;
  const bolehMulai = !wajibPegangan || sudahBerpegangan;
  // Status navigasi menandai bahwa layar keselamatan ini sudah dilewati (sesi berdiri tanpa status ini dialihkan ke sini).
  const statusMulai: StatusMulaiSesi = { konfirmasiKeselamatan: true };

  return (
    <section className="space-y-5">
      <PageHeader
        judul={def.nama}
        sub={
          <span className="flex flex-wrap gap-1.5">
            <ChipPosisi posisi={def.posisi} />
            <ChipInfo>{labelSendi(def.sendiTarget)}</ChipInfo>
          </span>
        }
      />

      {/* Pilihan sisi di atas contoh gerakan: terlihat di layar pertama (tidak tertutup bilah Mulai) dan contoh langsung mengikuti. */}
      {pilihSisi && <PilihSisi nilai={sisiLatihan} onPilih={(s) => setPrefs({ sisiLatihan: s })} />}

      <VideoPeraga
        key={def.id}
        nama={def.nama}
        basePath={def.animasiAtauVideo}
        sisi={pilihSisi ? sisiLatihan : undefined}
        tempoDetik={def.tempoTargetDetik}
      />

      {/* Target (dan target rentang dari terapis bila ada) dalam satu kartu ringkas. */}
      <div className="rounded-kartu border border-garis-halus bg-permukaan shadow-tipis">
        <div className="flex items-center gap-3 p-4">
          <IkonBingkai nada="primer">
            <IkonTarget weight="bold" />
          </IkonBingkai>
          <div className="min-w-0">
            <p className="tipe-label text-teks-2">Target latihan ini</p>
            <p className="tipe-subjudul text-teks">
              <span className="tabular">{target}</span> kali{pilihSisi && <span className="font-bold text-teks-2">, sisi {sisiLatihan}</span>}
            </p>
          </div>
        </div>
        {rentang < RENTANG_PENUH && (
          <p className="border-t border-garis-halus px-4 py-3">
            <span className="block font-bold">Target rentang dari terapis: {rentang}%</span>
            <span className="tipe-keterangan block text-teks-2">Gerakan dihitung saat mencapai batas yang disarankan terapis Anda.</span>
          </p>
        )}
      </div>

      <section aria-labelledby="judul-langkah" className="rounded-kartu border border-garis-halus bg-permukaan p-4 shadow-tipis">
        <h2 id="judul-langkah" className="tipe-subjudul mb-3 flex items-center gap-2 text-teks">
          <ListNumbers size={24} weight="bold" className="shrink-0 text-primer" aria-hidden />
          Cara melakukan
        </h2>
        <ol>
          {def.panduanLangkah.map((langkah, i) => (
            <li key={i} className="relative flex gap-3 pb-3 last:pb-0">
              {/* Garis penghubung antarlangkah (dekoratif). */}
              {i < def.panduanLangkah.length - 1 && <span aria-hidden className="absolute bottom-1 left-[calc(1rem-1px)] top-[calc(2rem+4px)] w-0.5 rounded-full bg-primer-garis" />}
              <span className="tabular grid size-8 shrink-0 place-items-center rounded-[10px] bg-primer text-[0.95rem] font-bold text-white inset-shadow-sorot">
                {i + 1}
              </span>
              <span className="pt-0.5">{langkah}</span>
            </li>
          ))}
        </ol>
      </section>

      <PhonePlacement def={def} />

      <SafetyNotice wajibBerpegangan={def.wajibBerpegangan} tambahan={def.peringatan} />

      <p className="tipe-keterangan flex gap-2 text-teks-2">
        <ShieldCheck size={22} weight="bold" className="shrink-0 text-primer" aria-hidden />
        <span>Gambar kamera hanya diproses di perangkat ini dan tidak dikirim ke mana pun.</span>
      </p>

      {/* Titik keputusan: pengingat keselamatan (dan konfirmasi berpegangan untuk latihan berdiri) tepat di atas tombol Mulai. */}
      <div className="sticky bottom-0 -mx-4 space-y-2 border-t border-garis-halus bg-permukaan px-4 pt-2.5 shadow-[0_-10px_24px_-18px_rgb(8_59_55/0.35)] safe-bottom">
        <p className="flex items-start gap-2 text-[0.95rem] font-semibold leading-snug text-teks">
          <WarningCircle size={22} weight="fill" className="shrink-0 text-peringatan" aria-hidden />
          Berhenti bila nyeri, pusing, atau sesak.
        </p>
        {wajibPegangan && (
          <button
            type="button"
            role="checkbox"
            aria-checked={sudahBerpegangan}
            id={idKonfirmasi}
            onClick={() => setSudahBerpegangan((v) => !v)}
            className={`flex min-h-[56px] w-full items-center gap-2.5 rounded-kontrol border-2 px-3 py-1.5 text-left text-[1rem] font-bold leading-tight transition-colors ${
              sudahBerpegangan ? 'border-sukses bg-sukses-terang text-teks' : 'border-primer bg-permukaan text-teks hover:bg-primer-terang'
            }`}
          >
            {sudahBerpegangan ? (
              <CheckSquare size={32} weight="fill" className="shrink-0 text-sukses" aria-hidden />
            ) : (
              <Square size={32} weight="bold" className="shrink-0 text-primer" aria-hidden />
            )}
            Saya sudah berpegangan pada kursi atau meja yang stabil
          </button>
        )}
        <BigButton
          disabled={!bolehMulai}
          aria-describedby={bolehMulai ? undefined : idKonfirmasi}
          onClick={() => navigate(urlSesi(def.id, target, sisiLatihan, rentang), { state: statusMulai })}
          ukuran="besar"
          ikon={<VideoCamera size={30} weight="fill" aria-hidden />}
        >
          Mulai dengan Kamera
        </BigButton>
      </div>
    </section>
  );
}

function PilihSisi({ nilai, onPilih }: { nilai: Sisi; onPilih: (s: Sisi) => void }) {
  return (
    <fieldset>
      <legend className="tipe-subjudul mb-2 text-teks">Sisi yang dilatih</legend>
      <div className="grid grid-cols-2 gap-2 rounded-kontrol border border-garis-halus bg-cekung p-1" role="radiogroup">
        {(['kanan', 'kiri'] as const).map((s) => {
          const aktif = nilai === s;
          return (
            <button
              key={s}
              type="button"
              role="radio"
              aria-checked={aktif}
              onClick={() => onPilih(s)}
              className={`flex min-h-[56px] items-center justify-center gap-2 rounded-[11px] text-[1.1rem] font-bold transition-[background-color,color,box-shadow] ${
                aktif ? 'bg-primer text-white shadow-angkat inset-shadow-sorot' : 'text-primer hover:bg-permukaan'
              }`}
            >
              {aktif && <Check size={20} weight="bold" aria-hidden />}
              {s === 'kanan' ? 'Kanan' : 'Kiri'}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
