// Alat kecil OpenRouter bersama (narasi, musik, juri audio). Kunci dari OPENROUTER_API_KEY; tidak pernah dicetak.

export const H_OPENROUTER = () => {
  const kunci = process.env.OPENROUTER_API_KEY;
  if (!kunci) throw new Error('OPENROUTER_API_KEY belum diset');
  return { Authorization: `Bearer ${kunci}`, 'Content-Type': 'application/json' };
};

/** Total pemakaian kredit akun (USD), untuk mengukur biaya lewat selisih sebelum/sesudah. */
export const kredit = async () => {
  const r = await fetch('https://openrouter.ai/api/v1/credits', { headers: H_OPENROUTER() });
  if (!r.ok) throw new Error(`credits ${r.status}`);
  return (await r.json()).data.total_usage;
};

/** Eleven v4 lewat OpenRouter: satu MP3 untuk `teks` (boleh berisi tag v4 seperti [warmly]). */
export const ttsOpenRouter = async (teks, suara, keluar, { model = 'elevenlabs/eleven-v4' } = {}) => {
  const { writeFileSync } = await import('node:fs');
  for (let percobaan = 1; ; percobaan++) {
    const r = await fetch('https://openrouter.ai/api/v1/audio/speech', {
      method: 'POST',
      headers: H_OPENROUTER(),
      body: JSON.stringify({ model, input: teks, voice: suara, response_format: 'mp3' }),
    });
    if (r.ok) {
      writeFileSync(keluar, Buffer.from(await r.arrayBuffer()));
      return;
    }
    const pesan = (await r.text()).slice(0, 300);
    if (percobaan >= 3 || (r.status < 500 && r.status !== 429)) throw new Error(`OpenRouter TTS ${r.status}: ${pesan}`);
    await new Promise((s) => setTimeout(s, 2000 * percobaan));
  }
};
