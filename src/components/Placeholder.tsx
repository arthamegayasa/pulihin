import { PageHeader } from '@/components/PageHeader';

/** Layar sementara selama pembangunan. Dihapus saat layar sebenarnya selesai. */
export function Placeholder({ judul }: { judul: string }) {
  return (
    <section>
      <PageHeader judul={judul} />
      <p className="text-teks-2">Layar ini sedang dibangun.</p>
    </section>
  );
}
