"""Render shot sinematik 3D (EEVEE) untuk video PULIHIN.

  blender -b video/blender/karakter.blend -P video/blender/render_lebar.py -- --shot <nama> [opsi]

Shot:
  sesi     kamera-sesi-lebar   1280x720, animasi SAMA dengan POV yang dipakai aplikasi (render_sesi.py),
           digeser `kameraMulaiDetik` dari out/rekam-sesi-3d.json agar sinkron frame-ke-frame dengan
           layar-02; layar ponsel = rekaman layar asli (--layar, default out/layar-02-sesi-tekuk-siku-asli.mp4).
  afasia   kamera-afasia-lebar 1280x720, 22 dtk dari detik 12 layar-05-afasia (rekaman asli): mendengar,
           mengucapkan kata, mengetuk ponsel tepat saat ketukan di rekaman.
  kertas   broll-kertas-program 1920x1080, 10 dtk: lembar program latihan cetak di meja, dorong pelan.
  ragu     broll-pemeran-ragu  1920x1080, 11 dtk: memegang lembar, ragu, kepala miring ke ponsel.
  penutup  penutup-3d          1920x1080, 27 dtk: ponsel menampilkan Beranda (frame asli), karakter kabur.

Opsi: --still F (satu frame PNG), --sampel N, --awal F --akhir F, --persen P (skala resolusi uji).
Keluaran: video/blender/out/<slot>/f####.png lalu video/blender/out/<slot>.mp4 (asli, CRF 14).
"""
import json
import math
import os
import subprocess
import sys

import bpy
from mathutils import Vector

DIR = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(DIR, "out")
FOOTAGE_ASLI = os.path.join(DIR, "..", "out", "footage-asli")
sys.path.insert(0, DIR)
import adegan  # noqa: E402
import pose  # noqa: E402
from adegan import PONSEL_POS  # noqa: E402

FPS = 30


def argumen():
    a = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    o = {}
    for i, x in enumerate(a):
        if x.startswith("--"):
            o[x[2:]] = a[i + 1] if i + 1 < len(a) and not a[i + 1].startswith("--") else True
    return o


# ---------------- bantuan adegan ----------------


def siapkan(ponsel=PONSEL_POS, balik=False, layar=None, lewati_frame=0, ruang=True, kekuatan=1.0):
    rig = bpy.data.objects["PakBudi.rig"]
    rig.location.z += pose.TURUN_DUDUK
    if ruang:
        adegan.bangun_ruang(ponsel, balik)
    adegan.cahaya()
    bahan = adegan.bahan_layar_video(layar, kekuatan=kekuatan, lewati_frame=lewati_frame)[0] if layar else None
    adegan.bangun_ponsel(adegan.koleksi("Ponsel"), bahan, ponsel, balik)
    return rig


def animasikan(rig, n, fungsi):
    """Kunci pose tiap frame: fungsi(t) -> parameter operasi_duduk."""
    peny = pose.Penyusun(rig)
    for f in range(n):
        pose.kunci(rig, peny, f + 1, pose.operasi_duduk(fungsi(f / FPS)))
    return peny


def kamera_jalan(nama, titik, n, lensa, fokus, fstop=2.8):
    """Kamera bergerak pelan (ease in-out) melalui (lokasi, target) awal -> akhir; DOF ke objek fokus."""
    (l0, t0), (l1, t1) = titik
    cam = adegan.kamera(nama, l0, t0, lensa=lensa)
    sasaran = bpy.data.objects.new(nama + ".Sasaran", None)
    bpy.context.scene.collection.objects.link(sasaran)
    con = cam.constraints.new("TRACK_TO")
    con.target = sasaran
    con.track_axis = "TRACK_NEGATIVE_Z"
    con.up_axis = "UP_Y"
    for f, (l, t) in ((1, (l0, t0)), (n, (l1, t1))):
        cam.location = l
        sasaran.location = t
        cam.keyframe_insert("location", frame=f)
        sasaran.keyframe_insert("location", frame=f)
    for ob in (cam, sasaran):
        for fc in ob.animation_data.action.fcurves if hasattr(ob.animation_data.action, "fcurves") else []:
            for k in fc.keyframe_points:
                k.interpolation = "BEZIER"
                k.easing = "EASE_IN_OUT"
    cam.data.dof.use_dof = True
    cam.data.dof.aperture_fstop = fstop
    if isinstance(fokus, bpy.types.Object):
        cam.data.dof.focus_object = fokus
    else:
        fo = bpy.data.objects.new(nama + ".Fokus", None)
        bpy.context.scene.collection.objects.link(fo)
        fo.location = fokus
        cam.data.dof.focus_object = fo
    bpy.context.scene.camera = cam
    return cam


def kepala_dunia(rig, peny, nama="head"):
    return rig.matrix_world @ peny.pos[nama].translation


# ---------------- shot ----------------


def shot_sesi(o):
    rekam = json.load(open(o.get("rekam", os.path.join(OUT, "rekam-sesi-3d.json")), encoding="utf8"))
    geser = rekam["kameraMulaiDetik"]
    n = int(round(rekam["durasi"] * FPS))
    jalur = json.load(open(os.path.join(OUT, "sesi-pov.jadwal.json"), encoding="utf8"))
    jadwal = pose.JadwalSesi(diam=jalur["diamDetik"], jumlah=len(jalur["repMulaiDetik"]), rep_angkat_bahu=jalur["repBahu"],
                             angkat_bahu_derajat=jalur.get("bahuDerajat", 24.0))
    rig = siapkan(layar=o.get("layar", os.path.join(OUT, "layar-02-sesi-tekuk-siku-asli.mp4")), kekuatan=1.25)
    # Detik layar-02 t = detik animasi POV (t - geser): sebelum kamera menyala karakter duduk tenang (pose awal).
    animasikan(rig, n, lambda t: jadwal.nilai(max(0.0, t - geser)))
    # Sudut A: 3/4 depan-kanan karakter, kepala sampai lutut di sepertiga kiri (ruang pandang ke kanan),
    # punggung ponsel + dudukan teal di latar depan kanan; bahu kanan (repetisi 7) menghadap kamera.
    kam_a = kamera_jalan("KameraSesiA", (((-1.18, -1.62, 1.10), (0.15, -0.25, 0.86)), ((-1.06, -1.50, 1.07), (0.14, -0.24, 0.87))),
                         n, lensa=35, fokus=(0.0, -0.06, 1.12), fstop=2.0)
    # Sudut B: di atas bahu kanan, melewati lengan yang menekuk, ke layar ponsel (rekaman aplikasi asli) yang
    # mengisi bingkai; bahu/kepala karakter kabur di latar depan.
    kam_b = kamera_jalan("KameraSesiB", (((-0.41, 0.40, 1.16), (0.0, -1.02, 0.88)), ((-0.38, 0.36, 1.15), (0.0, -1.02, 0.88))),
                         n, lensa=100, fokus=PONSEL_POS, fstop=2.8)
    scene = bpy.context.scene
    if o.get("kamera"):
        scene.camera = kam_a if o["kamera"] == "A" else kam_b
    else:
        for detik, sudut in potongan_sesi(json.load(open(os.path.join(OUT, "sesi-meta.json"), encoding="utf8"))):
            frame = int(round(detik * FPS)) + 1
            scene.timeline_markers.new(f"{sudut}@{detik:.2f}", frame=frame).camera = kam_a if sudut == "A" else kam_b
            print(f"[render_lebar] potong ke sudut {sudut} di detik {detik:.3f} (frame {frame})")
    return "kamera-sesi-lebar", n, (1280, 720)


def potongan_sesi(meta):
    """Urutan sudut (detik layar-02, sudut). Potong hanya di batas repetisi (saat hitungan aplikasi berganti)
    dan saat pesan koreksi asli muncul: A sampai hitungan 4; B memperlihatkan "5 / 10" di layar; A untuk bahu
    yang terangkat di repetisi 7; B saat pesan koreksi muncul di layar (bahu tetap terlihat di latar depan);
    A dari hitungan 8 sampai selesai."""
    r = meta["repetisiDetik"]
    koreksi = meta["koreksi"][0]["mulaiDetik"]
    return [(0.0, "A"), (r[3], "B"), (r[5], "A"), (koreksi, "B"), (r[7], "A")]


def shot_afasia(o):
    # Ponsel lebih dekat (latihan bicara tidak butuh jarak 1 m) agar bisa diketuk dari kursi.
    ponsel = Vector((0.06, -0.60, 0.70))
    mulai = 12.0  # detik layar-05 yang menjadi frame pertama shot ini
    rig = siapkan(ponsel=ponsel, layar=os.path.join(FOOTAGE_ASLI, "layar-05-afasia.mp4"), lewati_frame=int(mulai * FPS))
    n = int(float(o.get("durasi", 22.0)) * FPS)
    basemesh = bpy.data.objects["PakBudi"]
    mulut = tambah_mulut(basemesh)
    # Ketukan di rekaman layar-05 (detik berkas): Dengar 13,0; Sudah Benar 19,2; Kata Berikutnya 27,6.
    ketukan = [13.0 - mulai, 19.2 - mulai, 27.6 - mulai]
    bicara = (15.5 - mulai, 18.5 - mulai)

    def jangkau(t):
        """0..1: tangan kanan ke layar ponsel, puncak tepat pada detik ketukan."""
        return max([math.exp(-((t - k) / 0.42) ** 2) for k in ketukan] + [0.0])

    def nilai(t):
        q = pose.mulus(min(1.0, jangkau(t) * 1.25))
        dengar = pose.mulus((t - 0.6) / 0.6) * (1 - pose.mulus((t - (bicara[1] + 0.3)) / 0.8))
        s = {
            "napas": 0.5 + 0.5 * math.sin(2 * math.pi * t / 4.3),
            "condong": 6 + 14 * q + 3 * dengar,
            "kepala": (-4 + 0.8 * math.sin(t / 1.7), 12 + 4 * dengar + 0.6 * math.sin(t / 2.3), 4 * dengar),
            "jari": 1.0,
        }
        istirahat = ((-0.12, -0.32, -0.94), (0.30, -0.90, -0.30), (0.25, -0.80, -0.55))
        raih = ((0.33, -0.80, -0.50), (0.42, -0.84, -0.30), (0.40, -0.80, -0.45))
        s["lengan_kanan"] = tuple(tuple(pose.lerp_v(a, b, q)) for a, b in zip(istirahat, raih))
        return s

    animasikan(rig, n, nilai)
    for f in range(n):
        t = f / FPS
        nilai_mulut = 0.0
        if bicara[0] <= t <= bicara[1]:
            u = (t - bicara[0]) / (bicara[1] - bicara[0])
            nilai_mulut = 0.32 * abs(math.sin(math.pi * 5.0 * u)) * math.sin(math.pi * u) ** 0.5
        mulut.value = nilai_mulut
        mulut.keyframe_insert("value", frame=f + 1)
    kamera_jalan("KameraAfasia", (((0.70, 0.30, 1.30), (0.0, -0.55, 0.82)), ((0.62, 0.20, 1.27), (0.0, -0.56, 0.82))),
                 n, lensa=40, fokus=ponsel, fstop=3.2)
    return "kamera-afasia-lebar", n, (1280, 720)


def tambah_mulut(basemesh):
    """Shape key mulut terbuka dari target ekspresi MPFB (CC0), dianimasikan saat mengucapkan kata."""
    from bl_ext.user_default.mpfb.services.locationservice import LocationService
    from bl_ext.user_default.mpfb.services.targetservice import TargetService

    jalur = os.path.join(LocationService.get_mpfb_data("targets"), "expression", "units", "asian", "mouth-open.target.gz")
    if not basemesh.data.shape_keys:
        basemesh.shape_key_add(name="Basis", from_mix=False)
    TargetService.load_target(basemesh, jalur, weight=0.0, name="mulut")
    return basemesh.data.shape_keys.key_blocks["mulut"]


def buat_kertas(lokasi, rotasi, nama="Kertas", lengkung=0.0):
    """Lembar A4 (0,21 x 0,297 m) bertekstur out/kertas-program.png, sedikit melengkung seperti kertas asli."""
    bpy.ops.mesh.primitive_plane_add(size=1, location=(0, 0, 0))
    k = bpy.context.active_object
    k.name = nama
    k.scale = (0.21, 0.297, 1)
    bpy.ops.object.transform_apply(scale=True)
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.subdivide(number_cuts=12)
    bpy.ops.object.mode_set(mode="OBJECT")
    for v in k.data.vertices:
        v.co.z += lengkung * (v.co.y / 0.1485) ** 2 + 0.0015 * (1 + math.sin(v.co.x * 20))
    sol = k.modifiers.new("Tebal", "SOLIDIFY")
    sol.thickness = 0.0008
    m = bpy.data.materials.new("KertasProgram")
    m.use_nodes = True
    nt = m.node_tree
    p = nt.nodes["Principled BSDF"]
    p.inputs["Roughness"].default_value = 0.85
    t = nt.nodes.new("ShaderNodeTexImage")
    t.image = bpy.data.images.load(os.path.join(OUT, "kertas-program.png"))
    t.interpolation = "Cubic"
    nt.links.new(t.outputs["Color"], p.inputs["Base Color"])
    k.data.materials.append(m)
    k.location = lokasi
    k.rotation_euler = rotasi
    return k


def shot_kertas(o):
    n = int(float(o.get("durasi", 10.0)) * FPS)
    rig = siapkan()
    # Sebelum memakai aplikasi: hanya lembar program di meja (karakter, ponsel, buku, dudukan disembunyikan).
    for ob in [rig, *rig.children, *adegan.koleksi("Ponsel").objects]:
        ob.hide_render = True
    for ob in adegan.koleksi("Ruang").objects:
        if ob.name.startswith(("Buku", "Dudukan")):
            ob.hide_render = True
    meja = Vector((0.0, -1.02, 0.6))
    kertas = buat_kertas(meja + Vector((0.06, 0.0, 0.014)), (0, 0, math.radians(-8)), lengkung=0.004)
    # Pena di samping lembar.
    adegan.silinder("Pena", 0.0045, 0.14, meja + Vector((0.22, -0.04, 0.006)), adegan.bahan_tanah_liat("Pena", adegan.BRAND["primer"], kasar=0.35, sss=0.0),
                    adegan.koleksi("Ruang"), verts=16, rot=(math.radians(90), 0, math.radians(14)))
    # Lembar di sepertiga kanan bingkai (kiri tenang untuk teks), dorong pelan dari atas-depan.
    kamera_jalan("KameraKertas", (((-0.30, -1.62, 1.22), (-0.06, -1.02, 0.60)), ((-0.24, -1.44, 1.08), (-0.04, -1.02, 0.60))),
                 n, lensa=50, fokus=kertas, fstop=2.8)
    return "broll-kertas-program", n, (1920, 1080)


def pegang_kertas(t, lirik):
    """Pose memegang lembar di depan perut, kepala menunduk ke kertas lalu `lirik` (0..1) ke ponsel."""
    return {
        "napas": 0.5 + 0.5 * math.sin(2 * math.pi * t / 4.6),
        "condong": 4.0,
        "kepala": (-14 * lirik + 1.0 * math.sin(t / 1.9), 22 - 14 * lirik + 0.8 * math.sin(t / 2.7), -7 * lirik),
        "jari": 0.45,
        "lengan_kanan": ((-0.10, -0.28, -0.95), (0.42, -0.86, 0.28), (0.38, -0.80, 0.42)),
        "lengan_kiri": ((0.10, -0.28, -0.95), (-0.42, -0.86, 0.28), (-0.38, -0.80, 0.42)),
    }


def shot_ragu(o):
    n = int(float(o.get("durasi", 11.0)) * FPS)
    rig = siapkan()

    def lirik(t):
        # Ragu: menunduk membaca, melirik ponsel (miring kecil), kembali ke kertas, lalu melirik lagi lebih lama.
        return 0.8 * pose.mulus((t - 3.2) / 1.1) * (1 - pose.mulus((t - 5.6) / 1.0)) + pose.mulus((t - 7.6) / 1.4)

    peny = animasikan(rig, n, lambda t: pegang_kertas(t, lirik(t)))
    kertas = buat_kertas((0, 0, 0), (0, 0, 0), lengkung=0.012)
    adegan.pindah(kertas, adegan.koleksi("Ruang"))
    # Lembar mengikuti titik tengah kedua telapak tangan, menghadap wajah.
    for f in range(n):
        peny.susun(pose.operasi_duduk(pegang_kertas(f / FPS, lirik(f / FPS))))
        mw = rig.matrix_world
        tangan = [mw @ (peny.pos[f"hand_{s}"] @ Vector((0, 0.06, 0))) for s in ("l", "r")]
        pusat = (tangan[0] + tangan[1]) / 2 + Vector((0, -0.02, 0.07))
        ke_wajah = (mw @ peny.pos["head"].translation) - pusat
        kertas.location = pusat
        kertas.rotation_euler = ke_wajah.to_track_quat("Z", "Y").to_euler()
        kertas.keyframe_insert("location", frame=f + 1)
        kertas.keyframe_insert("rotation_euler", frame=f + 1)
    kamera_jalan("KameraRagu", (((-1.05, -1.55, 1.12), (0.05, -0.15, 0.95)), ((-0.92, -1.36, 1.10), (0.05, -0.15, 0.97))),
                 n, lensa=55, fokus=(0.0, -0.08, 1.05), fstop=2.4)
    return "broll-pemeran-ragu", n, (1920, 1080)


def shot_penutup(o):
    n = int(float(o.get("durasi", 27.0)) * FPS)
    # Ponsel di meja menghadap penonton (setelah sesi), menampilkan satu frame Beranda ASLI setelah sesi
    # (frame terakhir layar-03-ringkasan-beranda.mp4, lihat docs/video/produksi-3d.md).
    ponsel = Vector((0.24, -0.95, 0.78))
    rig = siapkan(ponsel=ponsel, balik=True, layar=os.path.join(OUT, "beranda-asli-setelah.png"), kekuatan=1.5)
    animasikan(rig, n, lambda t: {
        "napas": 0.5 + 0.5 * math.sin(2 * math.pi * t / 4.8),
        "kepala": (2 * math.sin(t / 3.1), 6 + 1.0 * math.sin(t / 2.2), 0.0),
        "jari": 1.1,
        "lengan_kanan": ((-0.12, -0.32, -0.94), (0.30, -0.90, -0.30), (0.25, -0.80, -0.55)),
    })
    # Ponsel tajam di sepertiga kanan, karakter kabur di belakang; kiri tenang untuk teks penutup.
    kamera_jalan("KameraPenutup", (((0.50, -1.98, 0.92), (0.06, -0.95, 0.84)), ((0.44, -1.74, 0.90), (0.08, -0.95, 0.84))),
                 n, lensa=55, fokus=tuple(ponsel), fstop=2.2)
    return "penutup-3d", n, (1920, 1080)


SHOT = {"sesi": shot_sesi, "afasia": shot_afasia, "kertas": shot_kertas, "ragu": shot_ragu, "penutup": shot_penutup}


def main():
    o = argumen()
    slot, n, (w, h) = SHOT[o["shot"]](o)
    scene = bpy.context.scene
    adegan.atur_render(scene, w, h, sampel=int(o.get("sampel", 48)))
    scene.render.resolution_percentage = int(o.get("persen", 100))
    scene.frame_start = int(o.get("awal", 1))
    scene.frame_end = int(o.get("akhir", n))
    dir_frame = os.path.join(OUT, slot)
    if o.get("simpan"):
        bpy.ops.wm.save_as_mainfile(filepath=os.path.abspath(o["simpan"]), compress=True)
    if o.get("still"):
        f = int(o["still"])
        scene.frame_set(f)
        scene.render.filepath = os.path.join(OUT, f"{slot}_still{f:04d}.png")
        bpy.ops.render.render(write_still=True)
        return
    os.makedirs(dir_frame, exist_ok=True)
    scene.render.filepath = os.path.join(dir_frame, "f")
    bpy.ops.render.render(animation=True)
    if scene.frame_start == 1 and scene.frame_end == n:
        mp4 = os.path.join(OUT, slot + ".mp4")
        subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-framerate", str(FPS), "-i", os.path.join(dir_frame, "f%04d.png"),
                        "-c:v", "libx264", "-preset", "slow", "-crf", "14", "-pix_fmt", "yuv420p", "-color_range", "tv",
                        "-g", "30", "-movflags", "+faststart", mp4], check=True)
        print("[render_lebar]", mp4)


main()
