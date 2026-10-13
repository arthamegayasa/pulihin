import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router/dom';
import { ensureDemoData } from '@/data/seed';
import { applyPrefsToDocument } from '@/lib/prefs';
import { router } from '@/router';
import './index.css';

applyPrefsToDocument();
// Data demo ditanam sekali saat pembukaan pertama agar aplikasi langsung terlihat hidup (Bab 10.1).
void ensureDemoData().catch((e: unknown) => console.error('Gagal menyiapkan data demo', e));

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
