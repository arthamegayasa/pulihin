import { describe, expect, it } from 'vitest';
import { buatPenjagaUcapan, type FungsiUcap, putarContohKata } from './contohKata';

const KATA = { kata: 'gelas', kalimatContoh: 'Saya minum air dari gelas.' };

function ucapPalsu() {
  const diucapkan: string[] = [];
  const selesai: Array<() => void> = [];
  const ucap: FungsiUcap = (teks, opts) => {
    diucapkan.push(teks);
    if (opts?.onEnd) selesai.push(opts.onEnd);
  };
  return { ucap, diucapkan, selesai };
}

describe('putarContohKata', () => {
  it('mengucapkan kata lalu kalimat contoh setelah kata selesai', () => {
    const { ucap, diucapkan, selesai } = ucapPalsu();
    putarContohKata(KATA, buatPenjagaUcapan(), ucap);
    expect(diucapkan).toEqual(['gelas']);
    selesai[0]();
    expect(diucapkan).toEqual(['gelas', 'Saya minum air dari gelas.']);
  });

  it('tidak memutar kalimat contoh setelah dibatalkan (mis. mikrofon dibuka)', () => {
    const { ucap, diucapkan, selesai } = ucapPalsu();
    const penjaga = buatPenjagaUcapan();
    putarContohKata(KATA, penjaga, ucap);
    penjaga.batalkan();
    selesai[0]();
    expect(diucapkan).toEqual(['gelas']);
  });

  it('putaran baru (kata berikutnya) membatalkan kalimat contoh putaran lama', () => {
    const { ucap, diucapkan, selesai } = ucapPalsu();
    const penjaga = buatPenjagaUcapan();
    putarContohKata(KATA, penjaga, ucap);
    putarContohKata({ kata: 'meja', kalimatContoh: 'Buku ada di atas meja.' }, penjaga, ucap);
    selesai[0]();
    expect(diucapkan).toEqual(['gelas', 'meja']);
    selesai[1]();
    expect(diucapkan).toEqual(['gelas', 'meja', 'Buku ada di atas meja.']);
  });
});
