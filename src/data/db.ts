import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type {
  ExportBundle,
  ISODate,
  Profile,
  Program,
  RepLog,
  Schedule,
  Session,
  SpeechAttempt,
} from '@/types';

/**
 * Penyimpanan lokal PULIHIN (Bab 10.3). Semua data tinggal di perangkat; tidak ada yang dikirim ke server.
 * Setiap penulisan memicu `notifyDataChange` sehingga layar yang memakai `useLiveQuery` ikut diperbarui
 * (status hari ini berubah < 2 detik setelah sesi selesai, AC F4).
 */
interface PulihinDB extends DBSchema {
  profiles: { key: string; value: Profile };
  sessions: {
    key: string;
    value: Session;
    indexes: { 'by-patient': string; 'by-patient-tanggal': [string, string] };
  };
  repLogs: { key: number; value: RepLog; indexes: { 'by-session': string } };
  speechAttempts: { key: number; value: SpeechAttempt; indexes: { 'by-session': string } };
  programs: { key: string; value: Program };
  schedules: { key: string; value: Schedule };
}

const DB_NAME = 'pulihin';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<PulihinDB>> | null = null;

export function getDb(): Promise<IDBPDatabase<PulihinDB>> {
  dbPromise ??= openDB<PulihinDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      db.createObjectStore('profiles', { keyPath: 'id' });
      const sessions = db.createObjectStore('sessions', { keyPath: 'id' });
      sessions.createIndex('by-patient', 'patientId');
      sessions.createIndex('by-patient-tanggal', ['patientId', 'tanggal']);
      const reps = db.createObjectStore('repLogs', { keyPath: 'id', autoIncrement: true });
      reps.createIndex('by-session', 'sessionId');
      const speech = db.createObjectStore('speechAttempts', { keyPath: 'id', autoIncrement: true });
      speech.createIndex('by-session', 'sessionId');
      db.createObjectStore('programs', { keyPath: 'patientId' });
      db.createObjectStore('schedules', { keyPath: 'patientId' });
    },
    blocking() {
      // Tab lain membuka versi lebih baru: tutup koneksi ini agar upgrade tidak tertahan.
      void dbPromise?.then((db) => db.close());
      dbPromise = null;
    },
  });
  return dbPromise;
}

/* ---------- notifikasi perubahan (dalam tab dan antar tab) ---------- */

const bus = new EventTarget();
const channel: BroadcastChannel | null =
  typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('pulihin-data') : null;
channel?.addEventListener('message', () => bus.dispatchEvent(new Event('change')));

export function notifyDataChange(): void {
  bus.dispatchEvent(new Event('change'));
  channel?.postMessage('change');
}

export function onDataChange(cb: () => void): () => void {
  bus.addEventListener('change', cb);
  return () => bus.removeEventListener('change', cb);
}

/* ---------- profiles ---------- */

export async function listProfiles(): Promise<Profile[]> {
  return (await getDb()).getAll('profiles');
}

export async function getProfile(id: string): Promise<Profile | undefined> {
  return (await getDb()).get('profiles', id);
}

export async function putProfile(p: Profile): Promise<void> {
  await (await getDb()).put('profiles', p);
  notifyDataChange();
}

/* ---------- sessions ---------- */

/** Simpan atau perbarui satu sesi. Dipanggil saat sesi dimulai (selesai=false) dan saat selesai. */
export async function putSession(s: Session): Promise<void> {
  await (await getDb()).put('sessions', s);
  notifyDataChange();
}

export async function getSession(id: string): Promise<Session | undefined> {
  return (await getDb()).get('sessions', id);
}

export async function deleteSession(id: string): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(['sessions', 'repLogs', 'speechAttempts'], 'readwrite');
  await tx.objectStore('sessions').delete(id);
  for (const store of ['repLogs', 'speechAttempts'] as const) {
    const idx = tx.objectStore(store).index('by-session');
    for (let c = await idx.openCursor(id); c; c = await c.continue()) await c.delete();
  }
  await tx.done;
  notifyDataChange();
}

export interface SessionQuery {
  /** inklusif */
  dari?: ISODate;
  /** inklusif */
  sampai?: ISODate;
  jenis?: Session['jenis'];
  /** default true: hanya sesi yang selesai */
  hanyaSelesai?: boolean;
}

/** Sesi satu pasien, urut dari yang paling lama. */
export async function listSessions(patientId: string, q: SessionQuery = {}): Promise<Session[]> {
  const db = await getDb();
  const { dari = '0000-00-00', sampai = '9999-99-99', jenis, hanyaSelesai = true } = q;
  const range = IDBKeyRange.bound([patientId, dari], [patientId, sampai]);
  const rows = await db.getAllFromIndex('sessions', 'by-patient-tanggal', range);
  return rows
    .filter((s) => (!hanyaSelesai || s.selesai) && (!jenis || s.jenis === jenis))
    .sort((a, b) => a.mulaiAt - b.mulaiAt);
}

/* ---------- repLogs & speechAttempts ---------- */

export async function addRepLogs(logs: RepLog[]): Promise<void> {
  if (logs.length === 0) return;
  const db = await getDb();
  const tx = db.transaction('repLogs', 'readwrite');
  for (const l of logs) {
    const { id: _ignored, ...rest } = l;
    void _ignored;
    await tx.store.add(rest as RepLog);
  }
  await tx.done;
  notifyDataChange();
}

/**
 * Simpan keadaan sesi terbaru beserta RepLog baru dalam SATU transaksi: sesi dan percobaannya tersimpan bersama
 * atau tidak sama sekali. Permintaan diantrikan tanpa `await` di antaranya agar transaksi tidak tertutup di tengah
 * jalan (mis. saat halaman ditinggalkan).
 */
export async function simpanProgresSesi(session: Session, repLogsBaru: RepLog[]): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(['sessions', 'repLogs'], 'readwrite');
  const reps = tx.objectStore('repLogs');
  const permintaan: Promise<unknown>[] = [tx.objectStore('sessions').put(session)];
  for (const { id: _ignored, ...rest } of repLogsBaru) {
    void _ignored;
    permintaan.push(reps.add(rest as RepLog));
  }
  await Promise.all([...permintaan, tx.done]);
  notifyDataChange();
}

export async function listRepLogs(sessionId: string): Promise<RepLog[]> {
  const rows = await (await getDb()).getAllFromIndex('repLogs', 'by-session', sessionId);
  return rows.sort((a, b) => a.nomor - b.nomor);
}

export async function addSpeechAttempt(a: SpeechAttempt): Promise<void> {
  const { id: _ignored, ...rest } = a;
  void _ignored;
  await (await getDb()).add('speechAttempts', rest as SpeechAttempt);
  notifyDataChange();
}

export async function listSpeechAttempts(sessionId: string): Promise<SpeechAttempt[]> {
  const rows = await (await getDb()).getAllFromIndex('speechAttempts', 'by-session', sessionId);
  return rows.sort((a, b) => a.at - b.at);
}

/* ---------- program & jadwal ---------- */

export async function getProgram(patientId: string): Promise<Program | undefined> {
  return (await getDb()).get('programs', patientId);
}

export async function putProgram(p: Program): Promise<void> {
  await (await getDb()).put('programs', p);
  notifyDataChange();
}

export async function getSchedule(patientId: string): Promise<Schedule | undefined> {
  return (await getDb()).get('schedules', patientId);
}

export async function putSchedule(s: Schedule): Promise<void> {
  await (await getDb()).put('schedules', s);
  notifyDataChange();
}

/* ---------- utilitas data ---------- */

const ALL_STORES = ['profiles', 'sessions', 'repLogs', 'speechAttempts', 'programs', 'schedules'] as const;

/** Hapus semua data lokal tanpa sisa (Bab 17.3). */
export async function clearAll(): Promise<void> {
  const db = await getDb();
  const tx = db.transaction([...ALL_STORES], 'readwrite');
  await Promise.all(ALL_STORES.map((s) => tx.objectStore(s).clear()));
  await tx.done;
  notifyDataChange();
}

export async function exportAll(): Promise<ExportBundle> {
  const db = await getDb();
  const [profiles, sessions, repLogs, speechAttempts, programs, schedules] = await Promise.all([
    db.getAll('profiles'),
    db.getAll('sessions'),
    db.getAll('repLogs'),
    db.getAll('speechAttempts'),
    db.getAll('programs'),
    db.getAll('schedules'),
  ]);
  return { app: 'pulihin', versi: 1, dieksporAt: Date.now(), profiles, sessions, repLogs, speechAttempts, programs, schedules };
}

export class CadanganTidakValidError extends Error {}

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const semua = (v: unknown, cek: (x: Record<string, unknown>) => boolean): boolean => Array.isArray(v) && v.every((x) => isObj(x) && cek(x));
const str = (v: unknown) => typeof v === 'string' && v.length > 0;

/**
 * Periksa berkas cadangan SEBELUM menyentuh penyimpanan: bentuk tiap koleksi dan kunci utamanya.
 * Berkas rusak tidak pernah menghapus data yang ada.
 */
export function validasiCadangan(raw: unknown): ExportBundle {
  if (!isObj(raw) || raw.app !== 'pulihin' || raw.versi !== 1) {
    throw new CadanganTidakValidError('Berkas ini bukan cadangan PULIHIN yang dikenali.');
  }
  const ok =
    semua(raw.profiles, (p) => str(p.id) && str(p.namaSamaran)) &&
    semua(raw.sessions, (s) => str(s.id) && str(s.patientId) && str(s.tanggal) && (s.jenis === 'gerak' || s.jenis === 'afasia')) &&
    semua(raw.repLogs, (r) => str(r.sessionId) && typeof r.nomor === 'number') &&
    semua(raw.speechAttempts, (a) => str(a.sessionId) && str(a.kataId)) &&
    semua(raw.programs, (p) => str(p.patientId) && Array.isArray(p.items)) &&
    semua(raw.schedules, (s) => str(s.patientId) && str(s.jamGerak) && str(s.jamAfasia));
  if (!ok) throw new CadanganTidakValidError('Isi berkas cadangan tidak lengkap atau rusak. Data Anda tidak diubah.');
  // Bentuk sudah diperiksa per koleksi di atas.
  const bundle: ExportBundle = raw as unknown as ExportBundle;
  return bundle;
}

/** Ganti seluruh isi penyimpanan dengan cadangan yang sudah divalidasi (dipakai saat perekaman video). */
export async function importAll(raw: unknown): Promise<void> {
  const b = validasiCadangan(raw);
  const db = await getDb();
  const tx = db.transaction([...ALL_STORES], 'readwrite');
  try {
    await Promise.all(ALL_STORES.map((s) => tx.objectStore(s).clear()));
    for (const p of b.profiles) await tx.objectStore('profiles').put(p);
    for (const s of b.sessions) await tx.objectStore('sessions').put(s);
    for (const r of b.repLogs) await tx.objectStore('repLogs').put(r);
    for (const a of b.speechAttempts) await tx.objectStore('speechAttempts').put(a);
    for (const p of b.programs) await tx.objectStore('programs').put(p);
    for (const s of b.schedules) await tx.objectStore('schedules').put(s);
    await tx.done;
  } catch {
    try {
      tx.abort();
    } catch {
      /* transaksi sudah berakhir */
    }
    throw new CadanganTidakValidError('Cadangan tidak dapat dipulihkan. Data Anda tidak diubah.');
  }
  notifyDataChange();
}

/** Tulis banyak entitas sekaligus dalam satu transaksi (dipakai seed data demo). */
export async function bulkPut(data: Partial<Omit<ExportBundle, 'app' | 'versi' | 'dieksporAt'>>): Promise<void> {
  const db = await getDb();
  const tx = db.transaction([...ALL_STORES], 'readwrite');
  for (const p of data.profiles ?? []) await tx.objectStore('profiles').put(p);
  for (const s of data.sessions ?? []) await tx.objectStore('sessions').put(s);
  for (const r of data.repLogs ?? []) {
    const { id: _ignored, ...rest } = r;
    void _ignored;
    await tx.objectStore('repLogs').add(rest as RepLog);
  }
  for (const a of data.speechAttempts ?? []) {
    const { id: _ignored, ...rest } = a;
    void _ignored;
    await tx.objectStore('speechAttempts').add(rest as SpeechAttempt);
  }
  for (const p of data.programs ?? []) await tx.objectStore('programs').put(p);
  for (const s of data.schedules ?? []) await tx.objectStore('schedules').put(s);
  await tx.done;
  notifyDataChange();
}
