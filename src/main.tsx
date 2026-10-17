import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router/dom';
import { hapusCacheIlustrasiLama } from '@/config/cacheIlustrasi';
import { ensureDemoData } from '@/data/seed';
import { applyPrefsToDocument } from '@/lib/prefs';
import { pasangPenjagaJaringan } from '@/lib/privasiJaringan';
import { router } from '@/router';
import './index.css';

// Sebelum modul lain sempat memanggil fetch: tidak ada data yang keluar dari perangkat (Bab 17.3).
pasangPenjagaJaringan();
applyPrefsToDocument();
// Data demo ditanam sekali saat pembukaan pertama agar aplikasi langsung terlihat hidup (Bab 10.1).
void ensureDemoData().catch((e: unknown) => console.error('Gagal menyiapkan data demo', e));
hapusCacheIlustrasiLama();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
