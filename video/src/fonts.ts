import { continueRender, delayRender } from 'remotion';
import latin from '@fontsource-variable/plus-jakarta-sans/files/plus-jakarta-sans-latin-wght-normal.woff2';
import latinExt from '@fontsource-variable/plus-jakarta-sans/files/plus-jakarta-sans-latin-ext-wght-normal.woff2';

/**
 * Memuat Plus Jakarta Sans (variable, lokal dari node_modules) sebelum frame
 * pertama dirender, supaya still dan render tidak memakai font cadangan.
 */
const tunggu = delayRender('Memuat Plus Jakarta Sans');
const wajah = [
  new FontFace('Plus Jakarta Sans', `url(${latin}) format('woff2')`, {
    weight: '200 800',
    unicodeRange:
      'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD',
  }),
  new FontFace('Plus Jakarta Sans', `url(${latinExt}) format('woff2')`, {
    weight: '200 800',
    unicodeRange: 'U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF',
  }),
];

Promise.all(wajah.map((w) => w.load()))
  .then((dimuat) => {
    for (const w of dimuat) document.fonts.add(w);
    continueRender(tunggu);
  })
  .catch((err: unknown) => {
    // Jangan menggantung render: lanjut dengan font sistem dan laporkan.
    console.error('Font Plus Jakarta Sans gagal dimuat', err);
    continueRender(tunggu);
  });
