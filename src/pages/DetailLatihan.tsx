import { CheckSquare, ShieldCheck, Square, Target as IkonTarget, VideoCamera, WarningCircle } from '@phosphor-icons/react';
import { useEffect, useId, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { BigButton, BigLink } from '@/components/BigButton';
import { PageHeader } from '@/components/PageHeader';
import { SafetyNotice } from '@/components/SafetyNotice';
import { ExerciseDemo } from '@/features/pose/ExerciseDemo';
import { getExercise } from '@/features/pose/exerciseDefinitions';
import { LABEL_POSISI, labelSendi } from '@/features/pose/labels';
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
      <PageHeader judul={def.nama} sub={`${LABEL_POSISI[def.posisi]} · ${labelSendi(def.sendiTarget)}`} />

      {/* Pilihan sisi di atas contoh gerakan: terlihat di layar pertama (tidak tertutup bilah Mulai) dan contoh langsung mengikuti. */}
      {pilihSisi && <PilihSisi nilai={sisiLatihan} onPilih={(s) => setPrefs({ sisiLatihan: s })} />}

      {def.animasiAtauVideo === 'bawaan' ? (
        <ExerciseDemo exerciseId={def.id} nama={def.nama} sisi={pilihSisi ? sisiLatihan : undefined} tempoDetik={def.tempoTargetDetik} />
      ) : (
        <VideoPeraga
          key={def.id}
          exerciseId={def.id}
          nama={def.nama}
          basePath={def.animasiAtauVideo}
          sisi={pilihSisi ? sisiLatihan : undefined}
          tempoDetik={def.tempoTargetDetik}
        />
      )}

      {/* Dua kolom bila muat (lebar >= 17rem: huruf normal di layar 360px); Huruf Lebih Besar: bertumpuk agar kata tidak terpotong. */}
      <div className="@container">
        <div className="grid gap-3 @min-[17rem]:grid-cols-[1fr_auto]">
          <div className="min-w-0 rounded-kartu border border-garis bg-white p-4 shadow-tipis">
            <p className="text-[0.95rem] text-teks-2">Posisi</p>
            <p className="text-[1.15rem] font-bold leading-snug">{LABEL_POSISI[def.posisi]}</p>
          </div>
          <div className="rounded-kartu border border-garis bg-white p-4 shadow-tipis">
            <p className="text-[0.95rem] text-teks-2">Target</p>
            <p className="whitespace-nowrap text-[1.15rem] font-bold leading-snug">
              <span className="tabular">{target}</span> kali
            </p>
          </div>
        </div>
      </div>

      {rentang < RENTANG_PENUH && (
        <p className="flex items-start gap-3 rounded-kartu border border-primer-garis bg-primer-terang p-4">
          <IkonTarget size={26} weight="bold" className="mt-0.5 shrink-0 text-primer" aria-hidden />
          <span>
            <span className="block font-bold">Target rentang dari terapis: {rentang}%</span>
            <span className="block text-[0.95rem] text-teks-2">Gerakan dihitung saat mencapai batas yang disarankan terapis Anda.</span>
          </span>
        </p>
      )}

      <section>
        <h2 className="mb-2 text-[1.15rem] font-bold">Cara melakukan</h2>
        <ol className="space-y-2">
          {def.panduanLangkah.map((langkah, i) => (
            <li key={i} className="flex gap-3">
              <span className="tabular grid size-8 shrink-0 place-items-center rounded-full bg-primer text-[0.95rem] font-bold text-white">
                {i + 1}
              </span>
              <span className="pt-0.5">{langkah}</span>
            </li>
          ))}
        </ol>
      </section>

      <PhonePlacement def={def} />

      <SafetyNotice wajibBerpegangan={def.wajibBerpegangan} tambahan={def.peringatan} />

      <p className="flex gap-2 text-[0.95rem] text-teks-2">
        <ShieldCheck size={22} weight="bold" className="mt-0.5 shrink-0 text-primer" aria-hidden />
        <span>Gambar kamera hanya diproses di perangkat ini dan tidak dikirim ke mana pun.</span>
      </p>

      {/* Titik keputusan: pengingat keselamatan (dan konfirmasi berpegangan untuk latihan berdiri) tepat di atas tombol Mulai. */}
      <div className="sticky bottom-0 -mx-4 space-y-2 border-t border-garis bg-latar px-4 pt-2.5 safe-bottom">
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
            className={`flex min-h-[56px] w-full items-center gap-2.5 rounded-2xl border-2 px-3 py-1.5 text-left text-[1rem] font-bold leading-tight transition-colors ${
              sudahBerpegangan ? 'border-sukses bg-sukses-terang text-teks' : 'border-primer bg-white text-teks hover:bg-primer-terang'
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
      <legend className="mb-2 text-[1.15rem] font-bold">Sisi yang dilatih</legend>
      <div className="grid grid-cols-2 gap-2 rounded-2xl bg-primer-terang p-1.5" role="radiogroup">
        {(['kanan', 'kiri'] as const).map((s) => {
          const aktif = nilai === s;
          return (
            <button
              key={s}
              type="button"
              role="radio"
              aria-checked={aktif}
              onClick={() => onPilih(s)}
              className={`min-h-[56px] rounded-xl text-[1.1rem] font-bold transition-colors ${
                aktif ? 'bg-primer text-white shadow-tipis' : 'text-primer hover:bg-white/70'
              }`}
            >
              {s === 'kanan' ? 'Kanan' : 'Kiri'}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
