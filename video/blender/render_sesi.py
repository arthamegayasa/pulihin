"""Animasi sesi Tekuk Siku (lengan kanan) dan render kamera ponsel (POV) atau kamera sinematik.

  blender -b video/blender/karakter.blend -P video/blender/render_sesi.py -- --kamera pov --keluar video/blender/out/pov
  blender -b video/blender/karakter.blend -P video/blender/render_sesi.py -- --kamera lebar --layar <rekaman.mp4> ...

Opsi: --jumlah N (repetisi), --diam S (detik diam awal), --ekor S, --rep-bahu K (repetisi dengan bahu
terangkat), --bahu DERAJAT, --sampel N, --awal F --akhir F (rentang frame), --simpan <file.blend>.
POV menghasilkan PNG 480x480 (Chrome memotong kamera palsu ke persegi untuk batasan aplikasi) lalu
<keluar>.y4m untuk Chrome.
"""
import json
import math
import os
import subprocess
import sys

import bpy
from mathutils import Vector

DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, DIR)
import adegan  # noqa: E402
import pose  # noqa: E402


def argumen():
    a = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    o = {}
    i = 0
    while i < len(a):
        if a[i].startswith("--"):
            k = a[i][2:]
            if i + 1 < len(a) and not a[i + 1].startswith("--"):
                o[k] = a[i + 1]
                i += 2
            else:
                o[k] = True
                i += 1
        else:
            i += 1
    return o


def siapkan(o):
    scene = bpy.context.scene
    rig = bpy.data.objects["PakBudi.rig"]
    rig.location.z += pose.TURUN_DUDUK
    jadwal = pose.JadwalSesi(
        diam=float(o.get("diam", 5.0)),
        jumlah=int(o.get("jumlah", 10)),
        ekor=float(o.get("ekor", 8.0)),
        rep_angkat_bahu=int(o.get("rep-bahu", 7)),
        angkat_bahu_derajat=float(o.get("bahu", 24.0)),
    )
    fps = 30
    n = int(round(jadwal.durasi * fps))
    penyusun = pose.Penyusun(rig)
    for f in range(n):
        t = f / fps
        pose.kunci(rig, penyusun, f + 1, pose.operasi_duduk(jadwal.nilai(t)))
    scene.frame_start, scene.frame_end = 1, n
    adegan.bangun_ruang()
    adegan.cahaya()
    return scene, rig, jadwal, n


def main():
    o = argumen()
    scene, rig, jadwal, n = siapkan(o)
    kol = adegan.koleksi("Ponsel")
    mode = o.get("kamera", "pov")
    keluar = os.path.abspath(o.get("keluar", os.path.join(DIR, "out", mode)))
    os.makedirs(os.path.dirname(keluar), exist_ok=True)
    meta = {"fps": 30, "frame": n, "durasiDetik": jadwal.durasi, "diamDetik": jadwal.diam, "siklusDetik": jadwal.siklus,
            "repMulaiDetik": [jadwal.mulai_rep(k) for k in range(1, jadwal.jumlah + 1)], "repBahu": jadwal.rep_angkat_bahu,
            "bahuDerajat": jadwal.bahu}
    with open(keluar + ".jadwal.json", "w", encoding="utf8") as f:
        json.dump(meta, f, indent=1)

    if mode == "pov":
        adegan.bangun_ponsel(kol)
        for ob in kol.objects:
            ob.hide_render = True  # kamera berada di dalam ponsel
        cam = adegan.kamera_pov()
        adegan.atur_render(scene, 480, 480, sampel=int(o.get("sampel", 24)))
    else:
        raise SystemExit("mode kamera lain dibuat oleh render_lebar.py")
    scene.camera = cam
    scene.frame_start = int(o.get("awal", 1))
    scene.frame_end = int(o.get("akhir", n))
    if o.get("simpan"):
        bpy.ops.wm.save_as_mainfile(filepath=os.path.abspath(o["simpan"]), compress=True)
    if o.get("still"):
        scene.frame_set(int(o["still"]))
        scene.render.filepath = keluar + f"_still{int(o['still']):04d}.png"
        bpy.ops.render.render(write_still=True)
        return
    os.makedirs(keluar, exist_ok=True)
    scene.render.filepath = os.path.join(keluar, "f")
    bpy.ops.render.render(animation=True)
    y4m = keluar + ".y4m"
    subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-framerate", "30", "-start_number", str(scene.frame_start),
                    "-i", os.path.join(keluar, "f%04d.png"), "-pix_fmt", "yuv420p", "-f", "yuv4mpegpipe", y4m], check=True)
    print("[render_sesi] y4m:", y4m)


main()
