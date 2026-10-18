"""Gambar kecil daftar latihan ("kartu"): satu frame PUNCAK dengan sorot otot penuh, tampilan S2 yang sama dengan
video (latar rata #EEF4F2 = warna ubin ilustrasi `bg-ilustrasi`, jadi tepi gambar menyatu dengan ubin aplikasi),
bingkai rapat pada bagian tubuh yang bergerak.

  blender -b peraga3d/out/<id>/adegan.blend -P peraga3d/kartu.py -- --id <id> [--sampel N]

Hasil: peraga3d/out/<id>/kartu/kartu.png (RESxRES; buat.mjs --kartu mengecilkan ke 256 px -> public/peraga/<id>-kartu.webp)
dan kartu.json (kamera, warna sudut).
"""
import argparse
import json
import math
import os
import sys

import bpy
from bpy_extras.object_utils import world_to_camera_view
from mathutils import Vector

DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, DIR)
import latihan  # noqa: E402
import tampilan  # noqa: E402

RES = 512
FIGUR = ("Badan", "Baju", "Sepatu", "Rambut")

# Bingkai per latihan. `pita` = (bawah, atas) rentang tinggi figur pada frame puncak (fraksi 0 = lantai/kaki,
# 1 = puncak kepala/tangan) yang harus masuk bingkai; `isi` = sisi terbesar pita terhadap bingkai; `geser` = (kanan,
# bawah) pergeseran isi dalam fraksi bingkai (latihan inti: kepala menjauhi lencana bintang di pojok kiri atas
# ubin Daftar Latihan). Sudut kamera bawaan = kamera video (`KAMERA` modul latihan); `azimut`/`elevasi`/`lensa`
# menimpa bila sudut lain lebih terbaca pada 56 px.
KARTU = {
    "fleksi-bahu": {"pita": (0.50, 1.0), "isi": 0.84, "geser": (0.07, 0.11)},
    "fleksi-siku": {"pita": (0.48, 1.0), "isi": 0.88, "geser": (0.14, 0.08)},
    "abduksi-bahu": {"pita": (0.40, 1.0), "isi": 0.92, "geser": (0.0, 0.04)},
    "menggapai": {"pita": (0.40, 1.0), "isi": 0.90},
    "putar-badan": {"pita": (0.40, 1.0), "isi": 0.90},
    "ekstensi-lutut": {"pita": (0.0, 1.0), "isi": 0.92},
    # Samping: paha yang terangkat & telapak yang lepas dari lantai terbaca sebagai siluet.
    "langkah-duduk": {"pita": (0.0, 1.0), "isi": 0.92, "azimut": 78.0, "elevasi": 8.0},
    "duduk-berdiri": {"pita": (0.0, 1.0), "isi": 0.94},
    "abduksi-pinggul": {"pita": (0.0, 1.0), "isi": 0.92},
    "jinjit": {"pita": (0.0, 0.42), "isi": 0.90},
}


def titik(nama, langkah=4):
    o = bpy.data.objects[nama]
    dg = bpy.context.evaluated_depsgraph_get()
    ev = o.evaluated_get(dg)
    if o.type != "MESH":
        return [ev.matrix_world @ p.position for p in list(ev.data.points)[::langkah * 4]]
    me = ev.to_mesh()
    vs = [ev.matrix_world @ v.co for v in list(me.vertices)[::langkah]]
    ev.to_mesh_clear()
    return vs


def pasang_kamera(sc, K, pita, isi, geser=None):
    figur = [v for n in FIGUR for v in titik(n)]
    z0, z1 = min(v.z for v in figur), max(v.z for v in figur)
    lo, hi = z0 + pita[0] * (z1 - z0), z0 + pita[1] * (z1 - z0)
    pilih = [v for v in figur if lo - 1e-4 <= v.z <= hi + 1e-4]
    a = Vector((min(v.x for v in pilih), min(v.y for v in pilih), min(v.z for v in pilih)))
    b = Vector((max(v.x for v in pilih), max(v.y for v in pilih), max(v.z for v in pilih)))
    target = (a + b) / 2
    az, el = math.radians(K["azimut"]), math.radians(K["elevasi"])
    arah = Vector((-math.sin(az) * math.cos(el), -math.cos(az) * math.cos(el), math.sin(el)))
    cd = bpy.data.cameras.new("KameraKartu")
    cd.lens = K["lensa"]
    cd.sensor_fit = "VERTICAL"
    cd.sensor_width = cd.sensor_height = 36
    cd.clip_start = 0.05
    cam = bpy.data.objects.new("KameraKartu", cd)
    sc.collection.objects.link(cam)
    sc.camera = cam
    cam.rotation_mode = "QUATERNION"
    cam.rotation_quaternion = (-arah).to_track_quat("-Z", "Y")

    def ukur(D):
        cam.location = target + arah * D
        cd.shift_x = cd.shift_y = 0.0
        bpy.context.view_layer.update()
        ndc = [world_to_camera_view(sc, cam, v) for v in pilih]
        return [v.x for v in ndc], [v.y for v in ndc]

    D = 2.5
    for _ in range(10):
        xs, ys = ukur(D)
        D *= max(max(ys) - min(ys), max(xs) - min(xs)) / isi
    xs, ys = ukur(D)
    g = geser or (0.0, 0.0)
    cd.shift_x = (min(xs) + max(xs)) / 2 - 0.5 - g[0]
    cd.shift_y = (min(ys) + max(ys)) / 2 - 0.5 + g[1]
    return {"jarak": round(D, 3), "geser": [round(cd.shift_x, 3), round(cd.shift_y, 3)],
            "lebar": round(max(xs) - min(xs), 3), "tinggi": round(max(ys) - min(ys), 3)}


def main():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    ap = argparse.ArgumentParser()
    ap.add_argument("--id", required=True)
    ap.add_argument("--sampel", type=int, default=tampilan.SAMPEL)
    a = ap.parse_args(argv)
    akar = os.path.join(DIR, "out", a.id)
    with open(os.path.join(akar, "info.json"), encoding="utf-8") as fh:
        info = json.load(fh)
    keluar = os.path.join(akar, "kartu")
    os.makedirs(keluar, exist_ok=True)
    L = latihan.muat(a.id)
    cfg = KARTU[a.id]
    K = {**L.KAMERA, **{k: cfg[k] for k in ("azimut", "elevasi", "lensa") if k in cfg}}

    sc = bpy.context.scene
    # Arah cahaya mengikuti kamera kartu (sama relatifnya dengan video).
    sc["azimut_kamera"] = K["azimut"]
    perangkat = tampilan.terapkan(a.sampel)
    # Diam & tajam: tanpa blur gerak.
    sc.render.use_motion_blur = False
    sc.render.resolution_x = sc.render.resolution_y = RES

    sc.frame_set(info["framePuncak"])
    kamera = pasang_kamera(sc, K, cfg["pita"], cfg["isi"], cfg.get("geser"))
    jalur = os.path.join(keluar, "kartu.png")
    sc.render.filepath = jalur
    bpy.ops.render.render(write_still=True)
    img = bpy.data.images.load(jalur)
    sudut = [round(c * 255, 1) for c in img.pixels[(RES - 1) * RES * 4:(RES - 1) * RES * 4 + 3]]  # kiri atas
    bpy.data.images.remove(img)
    hasil = {"id": a.id, "frame": info["framePuncak"], "perangkat": perangkat, "sampel": sc.eevee.taa_render_samples,
             "kamera": {**K, **kamera, "pita": cfg["pita"], "isi": cfg["isi"]}, "sudutKiriAtas": sudut}
    with open(os.path.join(keluar, "kartu.json"), "w", encoding="utf-8") as fh:
        json.dump(hasil, fh, indent=1)
    print("[kartu]", json.dumps(hasil), flush=True)


main()
