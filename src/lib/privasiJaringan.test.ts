import { describe, expect, it, vi } from 'vitest';
import { pasangPenjagaJaringan } from './privasiJaringan';

function lingkungan() {
  const fetchAsli = vi.fn(async () => new Response('ok', { status: 200 }));
  const target = { fetch: fetchAsli, location: { origin: 'https://pulihinapp.id' } } as unknown as typeof globalThis;
  pasangPenjagaJaringan(target);
  return { target, fetchAsli };
}

describe('penjaga jaringan', () => {
  it('telemetri MediaPipe tidak pernah menyentuh jaringan', async () => {
    const { target, fetchAsli } = lingkungan();
    const res = await target.fetch('https://odml.pa.googleapis.com/v1/log', { method: 'POST', body: 'x' });
    expect(res.status).toBe(204);
    expect(fetchAsli).not.toHaveBeenCalled();
  });

  it('aset dari domain sendiri tetap dimuat (model & wasm)', async () => {
    const { target, fetchAsli } = lingkungan();
    const res = await target.fetch('/mediapipe/models/pose_landmarker_lite.task');
    expect(res.status).toBe(200);
    expect(fetchAsli).toHaveBeenCalledTimes(1);
  });

  it('dipasang dua kali tidak membungkus ganda', async () => {
    const { target, fetchAsli } = lingkungan();
    pasangPenjagaJaringan(target);
    await target.fetch('https://pulihinapp.id/app');
    expect(fetchAsli).toHaveBeenCalledTimes(1);
  });
});
