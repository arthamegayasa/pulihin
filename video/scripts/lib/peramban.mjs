// Alat bersama untuk merekam dan memotret layar ASLI aplikasi PULIHIN dengan Chrome
// (puppeteer-core). Dipakai oleh scripts/rekam-layar.mjs dan scripts/tangkap-paper.mjs.
//
// Prinsip: semua isi layar berasal dari aplikasi yang berjalan (produksi atau URL lain lewat
// --url). Skrip hanya mengetuk, menggulir, dan menunggu seperti manusia. Satu-satunya elemen
// tambahan di halaman adalah penanda ketukan (lingkaran abu-abu, setara "Tampilkan ketukan" di
// Opsi Developer Android) dan, pada rekaman desktop, panah kursor tiruan; keduanya tidak
// menangkap ketukan dan tidak mengubah isi aplikasi.
import { execFileSync, spawn } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';
import { getExercise, hitungSkor } from './skor-aplikasi.mjs';

export const AKAR_VIDEO = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

/** Ponsel Android kelas bawah acuan (Bab 17.4): 360x800 CSS px x DPR 3 = tepat 1080x2400. */
export const PONSEL = { width: 360, height: 800, deviceScaleFactor: 3, isMobile: true, hasTouch: true };
/** Desktop terapis: 1280x720 CSS px x 1,5 = tepat 1920x1080. */
export const DESKTOP = { width: 1280, height: 720, deviceScaleFactor: 1.5, isMobile: false, hasTouch: false };

export const jeda = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------- argumen ----------
export const bacaArgumen = (argv) => {
  const opsi = {};
  for (const a of argv) {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/);
    if (m) opsi[m[1]] = m[2] ?? true;
  }
  return opsi;
};

// ---------- Chrome & ffmpeg ----------
const cariChrome = (diminta) => {
  if (diminta) return diminta;
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const calon = [];
  const cache = join(homedir(), '.cache', 'puppeteer', 'chrome');
  if (existsSync(cache)) {
    for (const d of readdirSync(cache).sort().reverse()) {
      calon.push(join(cache, d, 'chrome-win64', 'chrome.exe'), join(cache, d, 'chrome-linux64', 'chrome'));
      calon.push(join(cache, d, 'chrome-mac-x64', 'Google Chrome for Testing.app', 'Contents', 'MacOS', 'Google Chrome for Testing'));
      calon.push(join(cache, d, 'chrome-mac-arm64', 'Google Chrome for Testing.app', 'Contents', 'MacOS', 'Google Chrome for Testing'));
    }
  }
  calon.push(
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    '/usr/bin/google-chrome',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  );
  const ada = calon.find((p) => existsSync(p));
  if (!ada) throw new Error('Chrome tidak ditemukan. Set CHROME_PATH atau --chrome=<jalur chrome>.');
  return ada;
};

/** ffmpeg di PATH, atau ffmpeg bawaan Remotion bila PATH kosong. */
export const cariFfmpeg = () => {
  try {
    execFileSync('ffmpeg', ['-hide_banner', '-version'], { stdio: 'ignore' });
    return 'ffmpeg';
  } catch {
    const dir = join(AKAR_VIDEO, 'node_modules', '@remotion');
    for (const d of existsSync(dir) ? readdirSync(dir) : []) {
      for (const n of ['ffmpeg.exe', 'ffmpeg']) if (existsSync(join(dir, d, n))) return join(dir, d, n);
    }
    throw new Error('ffmpeg tidak ditemukan di PATH maupun di node_modules/@remotion.');
  }
};

/**
 * Zona waktu Etc/GMT yang membuat jam lokal di peramban mendekati `jam` (mis. 9 = pagi),
 * agar sapaan "Selamat pagi" dan pengingat cocok dengan cerita. Data demo dibuat relatif
 * terhadap "hari ini" di zona yang sama, jadi semuanya tetap konsisten.
 */
export const zonaUntukJam = (jam) => {
  const sekarang = new Date();
  const utc = sekarang.getUTCHours() + sekarang.getUTCMinutes() / 60;
  let selisih = Math.round(jam - utc);
  if (selisih < -12) selisih += 24;
  if (selisih > 14) selisih -= 24;
  return selisih === 0 ? 'Etc/GMT' : `Etc/GMT${selisih > 0 ? '-' : '+'}${Math.abs(selisih)}`;
};

// Penanda ketukan dan kursor tiruan, dipasang di setiap dokumen.
const SKRIP_PENANDA = () => {
  // Seperti "Tampilkan ketukan" Android: tampil selama jari menyentuh, lalu memudar cepat,
  // sehingga tidak tertinggal di layar berikutnya setelah navigasi.
  window.__pulihinKetuk = (x, y) => {
    const d = document.createElement('div');
    d.setAttribute('aria-hidden', 'true');
    d.style.cssText = `position:fixed;left:${x - 24}px;top:${y - 24}px;width:48px;height:48px;border-radius:50%;background:rgba(26,43,46,.26);box-shadow:0 0 0 2px rgba(255,255,255,.9);pointer-events:none;z-index:2147483647;transition:opacity .18s ease .1s;`;
    document.documentElement.appendChild(d);
    requestAnimationFrame(() => requestAnimationFrame(() => (d.style.opacity = '0')));
    setTimeout(() => d.remove(), 400);
  };
  window.__pulihinKursor = (x, y, ms) => {
    let k = document.getElementById('__pulihin-kursor');
    if (!k) {
      k = document.createElement('div');
      k.id = '__pulihin-kursor';
      k.setAttribute('aria-hidden', 'true');
      k.innerHTML =
        '<svg width="22" height="30" viewBox="0 0 22 30"><path d="M1.5 1.5v23.2l6.1-5.8 4.1 9.4 4-1.8-4.1-9.3h8.7z" fill="#1A2B2E" stroke="#fff" stroke-width="1.8" stroke-linejoin="round"/></svg>';
      k.style.cssText = 'position:fixed;left:0;top:0;pointer-events:none;z-index:2147483647;will-change:transform;';
      document.documentElement.appendChild(k);
      k.style.transform = `translate(${window.innerWidth * 0.6}px, ${window.innerHeight * 0.55}px)`;
    }
    k.style.transition = `transform ${ms}ms cubic-bezier(.45,.05,.25,1)`;
    requestAnimationFrame(() => (k.style.transform = `translate(${x - 2}px, ${y - 2}px)`));
  };
};

/**
 * Luncurkan Chrome tanpa jendela untuk satu perangkat (PONSEL atau DESKTOP) dengan profil
 * sementara yang bersih (tanpa riwayat, tanpa notifikasi). Mengembalikan
 * { halaman(), tutup(), zona }.
 *
 * --force-device-scale-factor wajib: tanpa itu screencast Chrome tanpa jendela hanya
 * mengirim frame seukuran piksel CSS (360x800), bukan piksel perangkat (1080x2400).
 */
export const luncurkan = async ({ chrome, jam = 9, base, perangkat }) => {
  const profil = join(tmpdir(), `pulihin-rekam-${process.pid}-${perangkat.width}`);
  rmSync(profil, { recursive: true, force: true });
  const browser = await puppeteer.launch({
    executablePath: cariChrome(chrome),
    headless: true,
    userDataDir: profil,
    args: [
      '--hide-scrollbars',
      '--lang=id-ID',
      '--disable-notifications',
      '--force-color-profile=srgb',
      `--force-device-scale-factor=${perangkat.deviceScaleFactor}`,
    ],
    defaultViewport: null,
  });
  const zona = jam === 'asli' ? null : zonaUntukJam(Number(jam));
  const asal = new URL(base).origin;
  await browser
    .defaultBrowserContext()
    .overridePermissions(asal, ['clipboard-read', 'clipboard-write', 'clipboard-sanitized-write']);
  const halaman = async () => {
    const page = await browser.newPage();
    await page.setViewport(perangkat);
    if (zona) await page.emulateTimezone(zona);
    await page.evaluateOnNewDocument(SKRIP_PENANDA);
    page.on('pageerror', (e) => console.warn(`  [pageerror] ${e.message}`));
    return page;
  };
  const tutup = async () => {
    await browser.close();
    rmSync(profil, { recursive: true, force: true });
  };
  return { halaman, tutup, zona };
};

// ---------- interaksi ----------

/**
 * Cari elemen yang dapat diketuk berdasarkan teks yang terlihat (atau aria-label).
 * `cocok`: 'sama' (seluruh teks), 'awal' (diawali), 'muat' (mengandung).
 * Mengembalikan kotak (koordinat viewport) atau null.
 */
export const cariKotak = (page, teks, { cocok = 'sama', dalam = null, ke = 0 } = {}) =>
  page.evaluate(
    (teks, cocok, dalam, ke) => {
      const n = (s) => (s ?? '').replace(/\s+/g, ' ').trim();
      const akar = dalam ? [...document.querySelectorAll('section, div, article, li')].find((el) => n(el.innerText).startsWith(dalam)) ?? document : document;
      const kandidat = [...akar.querySelectorAll('button, a, [role="switch"], [role="radio"], [role="button"], label, summary')];
      const pas = kandidat.filter((el) => {
        const t = n(el.innerText) || n(el.getAttribute('aria-label'));
        if (cocok === 'sama') return t === teks;
        if (cocok === 'awal') return t.startsWith(teks);
        return t.includes(teks);
      });
      const el = pas[ke];
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2, atas: r.top, bawah: r.bottom, kiri: r.left, lebar: r.width, tinggi: r.height };
    },
    teks,
    cocok,
    dalam,
    ke,
  );

/** Posisi (viewport) elemen pertama yang teksnya diawali `teks` (judul, kartu). */
export const kotakTeks = (page, teks, selektor = 'h1, h2, h3, p, dt, span, div') =>
  page.evaluate(
    (teks, selektor) => {
      const n = (s) => (s ?? '').replace(/\s+/g, ' ').trim();
      const el = [...document.querySelectorAll(selektor)].find((e) => n(e.innerText).startsWith(teks) && e.children.length < 6);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2, atas: r.top, bawah: r.bottom, tinggi: r.height };
    },
    teks,
    selektor,
  );

/** Tunggu sampai teks tampil di halaman. */
export const tungguTeks = (page, teks, timeout = 20000) =>
  page.waitForFunction((t) => document.body?.innerText.replace(/\s+/g, ' ').includes(t), { timeout, polling: 100 }, teks);

/** Ketuk seperti manusia: penanda ketukan, sentuh, tahan sebentar, lepas. */
export const ketuk = async (page, teks, opsi = {}) => {
  const kotak = await cariKotak(page, teks, opsi);
  if (!kotak) throw new Error(`Elemen "${teks}" tidak ditemukan di ${page.url()}`);
  const { x, y } = kotak;
  if (opsi.desktop) {
    await page.evaluate((x, y, ms) => window.__pulihinKursor(x, y, ms), x, y, opsi.gerakMs ?? 650);
    await jeda((opsi.gerakMs ?? 650) + 120);
    await page.mouse.move(x, y);
    await page.mouse.down();
    await jeda(90);
    await page.mouse.up();
    return kotak;
  }
  await page.evaluate((x, y) => window.__pulihinKetuk(x, y), x, y);
  await page.touchscreen.touchStart(x, y);
  await jeda(110);
  await page.touchscreen.touchEnd();
  return kotak;
};

/** Ketuk tanpa penanda (persiapan di luar rekaman): gulir ke elemen dulu. */
export const ketukDiam = async (page, teks, opsi = {}) => {
  await page.evaluate(
    (teks, cocok) => {
      const n = (s) => (s ?? '').replace(/\s+/g, ' ').trim();
      const el = [...document.querySelectorAll('button, a, [role="switch"], [role="radio"], label')].find((e) => {
        const t = n(e.innerText) || n(e.getAttribute('aria-label'));
        return cocok === 'awal' ? t.startsWith(teks) : t === teks;
      });
      el?.scrollIntoView({ block: 'center' });
    },
    teks,
    opsi.cocok ?? 'sama',
  );
  await jeda(250);
  const kotak = await cariKotak(page, teks, opsi);
  if (!kotak) throw new Error(`Elemen "${teks}" tidak ditemukan di ${page.url()}`);
  await page.mouse.click(kotak.x, kotak.y);
  return kotak;
};

/** Gulir halaman dengan easing (seperti usapan pelan) ke posisi `y` dalam `ms` milidetik. */
export const gulirKe = (page, y, ms = 1400) =>
  page.evaluate(
    (y, ms) =>
      new Promise((selesai) => {
        const el = document.scrollingElement ?? document.documentElement;
        const awal = el.scrollTop;
        const tujuan = Math.max(0, Math.min(y, el.scrollHeight - window.innerHeight));
        const t0 = performance.now();
        const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
        const langkah = (t) => {
          const p = Math.min(1, (t - t0) / ms);
          el.scrollTop = awal + (tujuan - awal) * ease(p);
          if (p < 1) requestAnimationFrame(langkah);
          else selesai(el.scrollTop);
        };
        requestAnimationFrame(langkah);
      }),
    y,
    ms,
  );

/** Gulir sehingga elemen bertanda `teks` berada `sisa` px dari atas viewport. */
export const gulirKeTeks = async (page, teks, { sisa = 80, ms = 1400, selektor } = {}) => {
  const k = await kotakTeks(page, teks, selektor);
  if (!k) throw new Error(`Teks "${teks}" tidak ditemukan di ${page.url()}`);
  const kini = await page.evaluate(() => (document.scrollingElement ?? document.documentElement).scrollTop);
  return gulirKe(page, kini + k.atas - sisa, ms);
};

/** Gulir sehingga bawah elemen `teks` berada `sisa` px dari bawah viewport. */
export const gulirSampaiBawah = async (page, teks, { sisa = 24, ms = 1400, selektor, tombol = false } = {}) => {
  const k = tombol ? await cariKotak(page, teks) : await kotakTeks(page, teks, selektor);
  if (!k) throw new Error(`Teks "${teks}" tidak ditemukan di ${page.url()}`);
  const { kini, tinggi } = await page.evaluate(() => ({
    kini: (document.scrollingElement ?? document.documentElement).scrollTop,
    tinggi: window.innerHeight,
  }));
  return gulirKe(page, kini + k.bawah - (tinggi - sisa), ms);
};

export const buka = async (page, base, jalur, teksTunggu) => {
  await page.goto(`${base}${jalur}`, { waitUntil: 'networkidle2' });
  if (teksTunggu) await tungguTeks(page, teksTunggu);
  await jeda(500);
};

// ---------- persiapan data (lewat tombol aplikasi sendiri) ----------

/**
 * Peran Pasien lewat layar Pilih Peran, petunjuk suara dimatikan lewat Pengaturan, lalu
 * Pengaturan > Data Demo > "Ada tanda perlu perhatian" > Reset Data Demo.
 */
export const siapkanDemo = async (page, base) => {
  await buka(page, base, '/app');
  if (await cariKotak(page, 'Saya Pasien', { cocok: 'awal' })) {
    await ketukDiam(page, 'Saya Pasien', { cocok: 'awal' });
    await jeda(800);
  }
  await buka(page, base, '/app/pengaturan', 'Pengaturan dan Demo');
  await aturSaklar(page, 'Petunjuk suara', false);
  await ketukDiam(page, 'Pasien', { cocok: 'sama' });
  await ketukDiam(page, 'Ada tanda perlu perhatian', { cocok: 'awal' });
  await ketukDiam(page, 'Reset Data Demo');
  await tungguTeks(page, 'Reset Data Demo?');
  await ketukDiam(page, 'Ya, Reset Data Demo');
  await jeda(1500);
};

/** Sakelar (role=switch, komponen Toggle) yang teksnya diawali `label`: atur ke `nyala`. */
export const aturSaklar = async (page, label, nyala) => {
  const status = await page.evaluate((label) => {
    const el = [...document.querySelectorAll('[role="switch"]')].find((e) =>
      e.innerText.replace(/\s+/g, ' ').trim().startsWith(label),
    );
    if (!el) return null;
    el.scrollIntoView({ block: 'center' });
    return el.getAttribute('aria-checked');
  }, label);
  if (status === null) throw new Error(`Saklar "${label}" tidak ditemukan`);
  if ((status === 'true') !== nyala) {
    await ketukDiam(page, label, { cocok: 'awal' });
    await jeda(400);
  }
};

/** Pilih peran lewat Pengaturan > Peran di ponsel ini. */
export const pilihPeran = async (page, base, label) => {
  await buka(page, base, '/app/pengaturan', 'Pengaturan dan Demo');
  await ketukDiam(page, label, { cocok: 'sama' });
  await jeda(600);
};

/**
 * Sesi Tekuk Siku hari ini yang SELESAI untuk Pak Budi, disiapkan untuk adegan Ringkasan
 * Sesi / Beranda / Untuk Keluarga tanpa menyalakan kamera.
 *
 * Jalur data sepenuhnya milik aplikasi: Pengaturan > Ekspor Data (JSON) mengunduh cadangan
 * data demo; skrip menambahkan SATU sesi gerak berlabel demo (isDemo: true) beserta catatan
 * per repetisinya; skor, komponen skor, dan saran dihitung dengan `hitungSkor` milik aplikasi
 * (src/features/pose/scoring.ts) dari catatan repetisi itu; lalu Pengaturan > Impor Data (JSON)
 * memulihkan berkas itu lewat validasi aplikasi. Berkas cadangan yang diimpor disimpan di
 * `jalurSalinan` agar dapat diperiksa.
 */
export const imporSesiDemo = async (page, base, jalurSalinan) => {
  const unduhan = join(tmpdir(), `pulihin-unduh-${process.pid}`);
  rmSync(unduhan, { recursive: true, force: true });
  mkdirSync(unduhan, { recursive: true });
  const cdp = await page.createCDPSession();
  await cdp.send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: unduhan });
  await buka(page, base, '/app/pengaturan', 'Cadangan Data');
  await ketukDiam(page, 'Ekspor Data (JSON)');
  let berkas;
  for (let i = 0; i < 50 && !berkas; i++) {
    await jeda(200);
    berkas = readdirSync(unduhan).find((n) => n.endsWith('.json'));
  }
  if (!berkas) throw new Error('Ekspor Data (JSON) tidak menghasilkan berkas');
  const bundel = JSON.parse(readFileSync(join(unduhan, berkas), 'utf8'));

  // "Hari ini" dan jam menurut peramban (zona waktu yang sama dengan aplikasi).
  const { hariIni, mulaiAt } = await page.evaluate(() => {
    const d = new Date();
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    // Sesi dimulai 25 menit lalu (tetap di hari yang sama).
    const mulai = Math.max(new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 5).getTime(), Date.now() - 25 * 60_000);
    return { hariIni: iso, mulaiAt: mulai };
  });

  const budi = bundel.profiles.find((p) => p.id === 'budi');
  const def = getExercise('fleksi-siku');
  const program = bundel.programs.find((p) => p.patientId === 'budi');
  const item = program?.items.find((i) => i.latihanId === 'fleksi-siku');
  const target = item?.targetRepetisi ?? def.targetRepetisiDefault;
  const id = `demo-video-budi-${hariIni}-fleksi-siku`;

  // Sepuluh repetisi terhitung + dua percobaan setengah gerak; koreksi bahu pada repetisi ke-7
  // (sama dengan cerita video). Sudut dalam derajat fleksi siku, durasi siklus dalam detik.
  const RENCANA = [
    { sudut: 126, durasi: 3.1 },
    { sudut: 131, durasi: 3.4 },
    { sudut: 94, durasi: 2.2, dihitung: false, koreksi: ['rentang-kurang'] },
    { sudut: 128, durasi: 2.9 },
    { sudut: 133, durasi: 3.6 },
    { sudut: 124, durasi: 2.6 },
    { sudut: 129, durasi: 4.4 },
    { sudut: 122, durasi: 3.8, koreksi: ['bahu-terangkat'] },
    { sudut: 130, durasi: 3.2 },
    { sudut: 101, durasi: 2.4, dihitung: false, koreksi: ['rentang-kurang'] },
    { sudut: 127, durasi: 4.6 },
    { sudut: 125, durasi: 3.3 },
  ];
  const repLogs = RENCANA.map((r, i) => ({
    sessionId: id,
    nomor: i + 1,
    dihitung: r.dihitung ?? true,
    sudutPuncak: r.sudut,
    durasiSiklusDetik: r.durasi,
    koreksi: r.koreksi ?? [],
  }));
  const tercapai = Math.min(target, repLogs.filter((l) => l.dihitung).length);
  const skor = hitungSkor({
    repLogs,
    targetRepetisi: target,
    ambangAtas: def.ambangAtas,
    ambangBawah: def.ambangBawah,
    tempoTargetDetik: def.tempoTargetDetik,
  });
  const durasiDetik = Math.round(14 + RENCANA.reduce((s, r) => s + r.durasi + 1.6, 0));
  const sesi = {
    id,
    patientId: 'budi',
    tanggal: hariIni,
    mulaiAt,
    selesaiAt: mulaiAt + durasiDetik * 1000,
    jenis: 'gerak',
    latihanId: 'fleksi-siku',
    kategoriKata: null,
    repetisiTarget: target,
    repetisiTercapai: tercapai,
    skor: skor.skor,
    skorKomponen: skor.skorKomponen,
    ringkasanAfasia: null,
    durasiDetik,
    selesai: true,
    saran: skor.saran,
    sisi: budi?.sisiLemah ?? 'kanan',
    isDemo: true,
  };
  bundel.sessions = bundel.sessions.filter((s) => s.id !== id).concat(sesi);
  bundel.repLogs = bundel.repLogs.filter((l) => l.sessionId !== id).concat(repLogs);

  mkdirSync(dirname(jalurSalinan), { recursive: true });
  writeFileSync(jalurSalinan, `${JSON.stringify(bundel, null, 2)}\n`);

  // Impor lewat tombol aplikasi (input berkas tersembunyi di bawah tombol Impor Data).
  const input = await page.$('input[type="file"]');
  if (!input) throw new Error('Input berkas Impor Data tidak ditemukan');
  await input.uploadFile(jalurSalinan);
  await tungguTeks(page, 'Pulihkan dari berkas cadangan?');
  await ketukDiam(page, 'Ya, Pulihkan');
  await jeda(1500);
  rmSync(unduhan, { recursive: true, force: true });
  await cdp.detach();
  return { sesi, label: skor.label };
};

// ---------- perekam layar (CDP screencast -> H.264) ----------

/**
 * Perekam layar lewat CDP Page.startScreencast. Setiap frame disimpan dengan stempel waktunya,
 * lalu ffmpeg menyusunnya menjadi video 30 fps dengan durasi frame yang sebenarnya (H.264,
 * CRF 16, yuv420p), sehingga tempo ketukan dan guliran sama dengan aslinya.
 */
export class Perekam {
  constructor(page, { lebar, tinggi, kerja }) {
    this.page = page;
    this.lebar = lebar;
    this.tinggi = tinggi;
    this.kerja = kerja;
    this.frame = [];
    this.tulis = [];
  }

  async mulai() {
    rmSync(this.kerja, { recursive: true, force: true });
    mkdirSync(this.kerja, { recursive: true });
    this.cdp = await this.page.createCDPSession();
    let pertama;
    const adaPertama = new Promise((r) => (pertama = r));
    this.cdp.on('Page.screencastFrame', ({ data, metadata, sessionId }) => {
      void this.cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {});
      const nomor = this.frame.length;
      const nama = `f${String(nomor).padStart(6, '0')}.jpg`;
      this.frame.push({ nama, ts: metadata.timestamp ?? Date.now() / 1000 });
      this.tulis.push(writeFile(join(this.kerja, nama), Buffer.from(data, 'base64')));
      if (nomor === 0) pertama();
    });
    await this.cdp.send('Page.startScreencast', {
      format: 'jpeg',
      quality: 95,
      maxWidth: this.lebar,
      maxHeight: this.tinggi,
      everyNthFrame: 1,
    });
    // Paksa satu lukisan agar frame pertama segera ada.
    await this.page.evaluate(() => {
      const d = document.createElement('div');
      d.style.cssText = 'position:fixed;left:0;top:0;width:1px;height:1px;opacity:0.01;pointer-events:none';
      document.body.appendChild(d);
      requestAnimationFrame(() => requestAnimationFrame(() => d.remove()));
    });
    await adaPertama;
    this.t0 = Date.now();
  }

  /** Tunggu sampai detik ke-`detik` rekaman (jadwal ketukan dibuat dalam detik berkas). */
  async sampai(detik) {
    const sisa = this.t0 + detik * 1000 - Date.now();
    if (sisa > 0) await jeda(sisa);
    else if (sisa < -250) console.warn(`  [jadwal] terlambat ${(-sisa / 1000).toFixed(2)} dtk untuk detik ${detik}`);
  }

  detik() {
    return (Date.now() - this.t0) / 1000;
  }

  /** Hentikan screencast dan tunggu semua frame tertulis ke disk. */
  async berhenti() {
    this.durasi = (Date.now() - this.t0) / 1000;
    await this.cdp.send('Page.stopScreencast');
    await this.cdp.detach();
    await Promise.all(this.tulis);
  }

  /**
   * Susun MP4 di `keluar` (panggil setelah peramban ditutup agar memori cukup). Untuk setiap
   * frame keluaran (1/30 dtk) dipakai frame screencast terakhir yang sudah tampil pada saat
   * itu, lalu dialirkan ke ffmpeg sebagai image2pipe 30 fps (CFR). Dicoba ulang dua kali bila
   * ffmpeg gagal (mis. memori sistem sedang penuh). Mengembalikan { durasi, frameSumber }.
   */
  async susun(keluar, ffmpeg) {
    const lebarAsli = lebarJpeg(await readFile(join(this.kerja, this.frame[0].nama)));
    const skala = lebarAsli === this.lebar ? [] : [`scale=${this.lebar}:${this.tinggi}:flags=lanczos`];
    if (skala.length) console.warn(`  [peringatan] frame ${lebarAsli} px, diskalakan ke ${this.lebar} px (kurang tajam)`);
    mkdirSync(dirname(keluar), { recursive: true });
    for (let percobaan = 1; ; percobaan++) {
      try {
        await this.#enkode(keluar, ffmpeg, skala);
        break;
      } catch (e) {
        if (percobaan >= 3) throw e;
        console.warn(`  [ffmpeg] ${e.message}; mencoba lagi (${percobaan + 1}/3)`);
        await jeda(3000);
      }
    }
    rmSync(this.kerja, { recursive: true, force: true });
    return { durasi: this.durasi, frameSumber: this.frame.length };
  }

  async #enkode(keluar, ffmpeg, skala) {
    const p = spawn(
      ffmpeg,
      [
        '-hide_banner', '-loglevel', 'error', '-y',
        '-framerate', String(FPS_REKAM), '-f', 'image2pipe', '-c:v', 'mjpeg', '-i', 'pipe:0',
        '-vf', [...skala, 'format=yuv420p'].join(','),
        '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-tune', 'stillimage',
        '-threads', '2', '-rc-lookahead', '20',
        '-r', String(FPS_REKAM), '-movflags', '+faststart', '-an',
        keluar,
      ],
      { stdio: ['pipe', 'inherit', 'inherit'] },
    );
    let galat = null;
    p.stdin.on('error', (e) => (galat ??= e));
    const tutup = new Promise((ok, gagal) =>
      p.on('close', (kode) => (kode === 0 && !galat ? ok() : gagal(new Error(`ffmpeg keluar dengan kode ${kode}`)))),
    );
    const ts0 = this.frame[0].ts;
    const jumlahKeluar = Math.round(this.durasi * FPS_REKAM);
    let indeks = 0;
    let isi = null;
    let isiIndeks = -1;
    for (let k = 0; k < jumlahKeluar && !galat; k++) {
      const t = ts0 + k / FPS_REKAM;
      while (indeks + 1 < this.frame.length && this.frame[indeks + 1].ts <= t) indeks++;
      if (isiIndeks !== indeks) {
        isi = await readFile(join(this.kerja, this.frame[indeks].nama));
        isiIndeks = indeks;
      }
      if (!p.stdin.write(isi)) {
        await new Promise((lanjut) => {
          const selesai = () => {
            p.stdin.off('drain', selesai).off('close', selesai);
            lanjut();
          };
          p.stdin.on('drain', selesai).on('close', selesai);
        });
      }
    }
    p.stdin.end();
    await tutup;
  }
}

const FPS_REKAM = 30;

/** Lebar gambar JPEG dari segmen SOF (baseline/progresif), menelusuri segmen secara berurutan. */
const lebarJpeg = (buf) => {
  let i = 2;
  while (i + 9 < buf.length && buf[i] === 0xff) {
    const penanda = buf[i + 1];
    if (penanda >= 0xc0 && penanda <= 0xc3) return buf.readUInt16BE(i + 7);
    i += 2 + buf.readUInt16BE(i + 2);
  }
  return null;
};
