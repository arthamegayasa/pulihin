import type { SkenarioDemo } from '@/types';

/**
 * KONTRAK (diisi agen Care): data demo 14 hari (Bab 10.1).
 * - ensureDemoData(): dipanggil sekali saat aplikasi dibuka; menanam data bila penyimpanan kosong.
 * - resetDemoData(skenario): hapus semua data lalu tanam ulang skenario yang dipilih.
 */
export async function ensureDemoData(): Promise<void> {
  // diisi agen Care
}

export async function resetDemoData(skenario: SkenarioDemo): Promise<void> {
  void skenario;
  // diisi agen Care
}
