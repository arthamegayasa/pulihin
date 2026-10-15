import { useThree } from '@react-three/fiber';
import { Video } from '@remotion/media';
import { ThreeCanvas } from '@remotion/three';
import type React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Easing, Freeze, Sequence, interpolate, staticFile, useCurrentFrame, useRemotionEnvironment } from 'remotion';
import {
  CanvasTexture,
  ExtrudeGeometry,
  Matrix4,
  PMREMGenerator,
  PerspectiveCamera,
  SRGBColorSpace,
  Shape,
  ShapeGeometry,
  Vector3,
  type Texture,
} from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { infoFootage } from '../footage.ts';
import { ADEGAN, FADE_FRAME, FPS, TINGGI, keFrame, type Adegan, type SlotRekaman } from '../timeline.ts';
import { PANEL_KIRI, PONSEL } from '../theme.ts';

/**
 * Ponsel 3D (react-three-fiber lewat @remotion/three) untuk adegan rekaman layar ponsel. SATU kanvas
 * untuk seluruh blok adegan ponsel/split yang berurutan: badan ponsel tetap diam di tempat, hanya isi
 * layarnya yang crossfade, dan kamera bergerak sangat pelan. Layar = rekaman ASLI aplikasi sebagai
 * tekstur video (frame persis dari OffthreadVideo), tidak pernah ditarik.
 *
 * Geometri: 1 satuan dunia = 100 px komposisi pada bidang z = 0, sehingga ponsel diam menempati
 * kotak PONSEL (theme.ts) dan label penunjuk dapat dihitung lewat `titikLayar()`.
 */

const KANVAS_LEBAR = 1920 - PANEL_KIRI;
const KANVAS_TINGGI = TINGGI;
const FOV = 30;
const PX = 0.01;
const JARAK_KAMERA = (KANVAS_TINGGI * PX) / 2 / Math.tan(((FOV / 2) * Math.PI) / 180);

const BADAN = { w: PONSEL.lebar * PX, h: PONSEL.tinggi * PX, r: 0.62, tebal: 0.34, bevel: 0.05 };
const LAYAR = { w: PONSEL.layarLebar * PX, h: PONSEL.layarTinggi * PX, r: 0.5 };
const DEPAN = BADAN.tebal / 2 + BADAN.bevel;
/** Pusat ponsel di kanvas (dunia), sama dengan pusat kotak PONSEL di komposisi. */
const PUSAT_X = (PONSEL.kiri + PONSEL.lebar / 2 - (PANEL_KIRI + KANVAS_LEBAR / 2)) * PX;
const PUSAT_Y = -(PONSEL.atas + PONSEL.tinggi / 2 - KANVAS_TINGGI / 2) * PX;

export const ADALAH_PONSEL = (a: Adegan): boolean => a.tata === 'ponsel' || a.tata === 'split';

/** Momen screenshot di adegan ponsel: kamera mendekat sangat halus (dorongan 3%). */
const MOMEN_PONSEL = ADEGAN.filter((a) => ADALAH_PONSEL(a) && a.momen).map((a) => a.momen!.detik);

const fokusPada = (detik: number): number =>
  Math.min(
    1,
    MOMEN_PONSEL.reduce(
      (s, m) =>
        s +
        interpolate(detik, [m - 2.4, m - 0.4, m + 1.8, m + 3.6], [0, 1, 1, 0], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
          easing: Easing.inOut(Easing.sin),
        }),
      0,
    ),
  );

/** Pose ponsel pada detik global: rotasi lambat (periode puluhan detik), sedikit mengapung, dorongan saat momen. */
export const posePonsel = (detik: number) => ({
  rotY: -0.07 + 0.045 * Math.sin((2 * Math.PI * detik) / 41),
  rotX: 0.025 * Math.sin((2 * Math.PI * detik) / 57 + 1.1),
  naik: 0.025 * Math.sin((2 * Math.PI * detik) / 13),
  skala: 1 + 0.03 * fokusPada(detik),
});

const kameraProyeksi = (() => {
  const k = new PerspectiveCamera(FOV, KANVAS_LEBAR / KANVAS_TINGGI, 0.1, 100);
  k.position.set(0, 0, JARAK_KAMERA);
  k.updateMatrixWorld();
  return k;
})();

/**
 * Titik pada tepi kiri layar ponsel di ketinggian `ke` (0 = atas, 1 = bawah), dalam koordinat
 * komposisi 1920x1080, untuk label penunjuk di samping ponsel.
 */
export const titikLayar = (ke: number, detik: number): { x: number; y: number } => {
  const p = posePonsel(detik);
  const m = new Matrix4()
    .makeTranslation(PUSAT_X, PUSAT_Y + p.naik, 0)
    .multiply(new Matrix4().makeRotationX(p.rotX))
    .multiply(new Matrix4().makeRotationY(p.rotY))
    .multiply(new Matrix4().makeScale(p.skala, p.skala, p.skala));
  const v = new Vector3(-LAYAR.w / 2, LAYAR.h / 2 - ke * LAYAR.h, DEPAN).applyMatrix4(m).project(kameraProyeksi);
  return { x: PANEL_KIRI + ((v.x + 1) / 2) * KANVAS_LEBAR, y: ((1 - v.y) / 2) * KANVAS_TINGGI };
};

const persegiBulat = (w: number, h: number, r: number): Shape => {
  const s = new Shape();
  const x = -w / 2;
  const y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
};

const geometriBadan = (): ExtrudeGeometry => {
  const g = new ExtrudeGeometry(persegiBulat(BADAN.w - 2 * BADAN.bevel, BADAN.h - 2 * BADAN.bevel, BADAN.r - BADAN.bevel), {
    depth: BADAN.tebal,
    bevelEnabled: true,
    bevelThickness: BADAN.bevel,
    bevelSize: BADAN.bevel,
    bevelSegments: 5,
    curveSegments: 20,
  });
  g.translate(0, 0, -BADAN.tebal / 2);
  return g;
};

/** Bidang layar bersudut bulat dengan UV 0..1 (ShapeGeometry memberi UV dalam satuan bentuk). */
const geometriLayar = (): ShapeGeometry => {
  const g = new ShapeGeometry(persegiBulat(LAYAR.w, LAYAR.h, LAYAR.r), 20);
  const pos = g.attributes.position;
  const uv = g.attributes.uv;
  for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) / LAYAR.w + 0.5, pos.getY(i) / LAYAR.h + 0.5);
  uv.needsUpdate = true;
  return g;
};

/** Tekstur kanvas 2D sekali buat: bayangan studio lembut dan kilau kaca tipis. */
const teksturBayangan = (): CanvasTexture => {
  const c = document.createElement('canvas');
  c.width = 384;
  c.height = 704;
  const g = c.getContext('2d')!;
  g.filter = 'blur(38px)';
  g.fillStyle = 'rgba(12, 46, 43, 0.9)';
  g.beginPath();
  g.roundRect(96, 96, 192, 512, 40);
  g.fill();
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  return t;
};

const teksturKilau = (): CanvasTexture => {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 512;
  const g = c.getContext('2d')!;
  const gr = g.createLinearGradient(0, 0, 256, 512);
  gr.addColorStop(0, 'rgba(255,255,255,0.0)');
  gr.addColorStop(0.32, 'rgba(255,255,255,0.0)');
  gr.addColorStop(0.4, 'rgba(255,255,255,1)');
  gr.addColorStop(0.55, 'rgba(255,255,255,0.0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, 256, 512);
  return new CanvasTexture(c);
};

/** Lingkungan studio untuk pantulan logam/kaca yang lembut (RoomEnvironment, sekali per kanvas). */
const Lingkungan: React.FC = () => {
  const { gl, scene } = useThree();
  useEffect(() => {
    const pmrem = new PMREMGenerator(gl);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = env;
    return () => {
      scene.environment = null;
      env.dispose();
      pmrem.dispose();
    };
  }, [gl, scene]);
  return null;
};

const BidangLayar: React.FC<{ tekstur: Texture | null; opasitas: number; urutan: number; geometri: ShapeGeometry }> = ({
  tekstur,
  opasitas,
  urutan,
  geometri,
}) => {
  if (tekstur) tekstur.colorSpace = SRGBColorSpace;
  return (
    <mesh geometry={geometri} position={[0, 0, DEPAN + 0.002 + urutan * 0.0004]} renderOrder={10 + urutan}>
      <meshBasicMaterial
        map={tekstur}
        color={tekstur ? '#ffffff' : '#EAF2F0'}
        toneMapped={false}
        transparent
        opacity={opasitas}
        depthWrite={false}
      />
    </mesh>
  );
};

/**
 * Tekstur dari `<Video headless>` (@remotion/media): setiap frame video digambar ke kanvas lalu
 * adegan three dirender ulang dengan `advance()` (cara yang direkomendasikan Remotion untuk tekstur video).
 */
const TeksturVideo: React.FC<{
  berkas: string;
  lebar: number;
  tinggi: number;
  mulaiFrame: number;
  opasitas: number;
  urutan: number;
  geometri: ShapeGeometry;
}> = ({ berkas, lebar, tinggi, mulaiFrame, ...lain }) => {
  const [kanvas] = useState(() => {
    const c = new OffscreenCanvas(lebar, tinggi);
    const konteks = c.getContext('2d')!;
    const tekstur = new CanvasTexture(c);
    tekstur.colorSpace = SRGBColorSpace;
    return { konteks, tekstur };
  });
  const { advance, invalidate } = useThree();
  const { isRendering } = useRemotionEnvironment();
  const onVideoFrame = useCallback(
    (f: CanvasImageSource) => {
      kanvas.konteks.drawImage(f, 0, 0, lebar, tinggi);
      kanvas.tekstur.needsUpdate = true;
      if (isRendering) advance(performance.now());
      else invalidate();
    },
    [kanvas, lebar, tinggi, isRendering, advance, invalidate],
  );
  useEffect(() => () => kanvas.tekstur.dispose(), [kanvas]);
  return (
    <>
      <Video src={staticFile(`footage/${berkas}`)} trimBefore={mulaiFrame} onVideoFrame={onVideoFrame} muted headless />
      <BidangLayar tekstur={kanvas.tekstur} {...lain} />
    </>
  );
};

/** Isi layar satu adegan: rekaman mulai `slot.mulaiDi`, frame terakhir dibekukan bila rekaman habis. */
const LayarAdegan: React.FC<{ slot: SlotRekaman; urutan: number; pertama: boolean; geometri: ShapeGeometry }> = ({
  slot,
  urutan,
  pertama,
  geometri,
}) => {
  const frame = useCurrentFrame();
  const opasitas = pertama
    ? 1
    : interpolate(frame, [0, FADE_FRAME], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.ease) });
  const info = infoFootage(slot.berkas);
  if (!info) return <BidangLayar tekstur={null} opasitas={opasitas} urutan={urutan} geometri={geometri} />;
  const durasiSumber = info.durasi ?? Infinity;
  const mulaiDi = Math.min(slot.mulaiDi, Math.max(0, durasiSumber - 0.2));
  const awal = Math.round(mulaiDi * FPS);
  const terakhir = Math.floor(durasiSumber * FPS) - 2 - awal;
  return (
    <Freeze frame={terakhir} active={frame > terakhir}>
      <TeksturVideo
        berkas={slot.berkas}
        lebar={info.lebar ?? 720}
        tinggi={info.tinggi ?? 1600}
        mulaiFrame={awal}
        opasitas={opasitas}
        urutan={urutan}
        geometri={geometri}
      />
    </Freeze>
  );
};

const Isi: React.FC<{ blok: Adegan[] }> = ({ blok }) => {
  const frame = useCurrentFrame();
  const detik = blok[0].mulai + frame / FPS;
  const p = posePonsel(detik);
  const badan = useMemo(geometriBadan, []);
  const layar = useMemo(geometriLayar, []);
  const bayangan = useMemo(teksturBayangan, []);
  const kilau = useMemo(teksturKilau, []);
  const dariBlok = keFrame(blok[0].mulai);
  return (
    <>
      <Lingkungan />
      <ambientLight intensity={0.35} />
      <directionalLight position={[-5, 7, 10]} intensity={1.6} />
      <directionalLight position={[7, -2, 4]} intensity={0.5} color="#dfeeea" />
      {/* Bayangan studio lembut di latar, bergeser sedikit mengikuti putaran ponsel. */}
      <mesh position={[PUSAT_X + 0.42 - p.rotY * 3, PUSAT_Y - 0.5 + p.naik * 0.5, -1.6]} scale={p.skala}>
        <planeGeometry args={[BADAN.w * 2, BADAN.h * 1.83]} />
        <meshBasicMaterial map={bayangan} transparent opacity={0.46} depthWrite={false} toneMapped={false} />
      </mesh>
      <group position={[PUSAT_X, PUSAT_Y + p.naik, 0]} rotation={[p.rotX, p.rotY, 0, 'XYZ']} scale={p.skala}>
        <mesh geometry={badan}>
          <meshPhysicalMaterial color="#1E2729" metalness={0.6} roughness={0.3} clearcoat={0.7} clearcoatRoughness={0.25} envMapIntensity={0.8} />
        </mesh>
        {/* Tombol samping */}
        <mesh position={[BADAN.w / 2 + 0.01, 2.35, 0]}>
          <boxGeometry args={[0.06, 0.92, 0.16]} />
          <meshPhysicalMaterial color="#2A3437" metalness={0.7} roughness={0.35} />
        </mesh>
        <mesh position={[BADAN.w / 2 + 0.01, 1.3, 0]}>
          <boxGeometry args={[0.06, 0.56, 0.16]} />
          <meshPhysicalMaterial color="#2A3437" metalness={0.7} roughness={0.35} />
        </mesh>
        {blok.map((a, i) =>
          a.layar ? (
            <Sequence
              key={a.id}
              from={keFrame(a.mulai) - dariBlok}
              durationInFrames={keFrame(a.selesai) - keFrame(a.mulai) + (i === blok.length - 1 ? 0 : FADE_FRAME)}
              layout="none"
            >
              <LayarAdegan slot={a.layar} urutan={i} pertama={i === 0} geometri={layar} />
            </Sequence>
          ) : null,
        )}
        {/* Kilau kaca sangat tipis yang bergeser pelan */}
        <mesh geometry={layar} position={[0, 0, DEPAN + 0.03]} renderOrder={100}>
          <meshBasicMaterial
            map={kilau}
            transparent
            opacity={0.05 + 0.03 * Math.sin((2 * Math.PI * detik) / 23)}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      </group>
    </>
  );
};

/** Kanvas ponsel 3D di panel kanan, satu untuk seluruh blok adegan ponsel/split yang berurutan. */
export const PanggungPonsel: React.FC<{ blok: Adegan[] }> = ({ blok }) => (
  <ThreeCanvas
    width={KANVAS_LEBAR}
    height={KANVAS_TINGGI}
    style={{ position: 'absolute', left: PANEL_KIRI, top: 0 }}
    camera={{ fov: FOV, position: [0, 0, JARAK_KAMERA], near: 0.1, far: 100 }}
    gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}
    dpr={1}
  >
    <Isi blok={blok} />
  </ThreeCanvas>
);

/** Blok adegan ponsel/split berurutan (satu kanvas per blok). */
export const blokPonsel = (): Adegan[][] => {
  const blok: Adegan[][] = [];
  let kini: Adegan[] = [];
  for (const a of ADEGAN) {
    if (ADALAH_PONSEL(a)) kini.push(a);
    else if (kini.length) {
      blok.push(kini);
      kini = [];
    }
  }
  if (kini.length) blok.push(kini);
  return blok;
};
