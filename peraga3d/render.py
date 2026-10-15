"""Render satu latihan dari peraga3d/out/<id>/adegan.blend dengan tampilan V3.

  blender -b peraga3d/out/<id>/adegan.blend -P peraga3d/render.py -- --id <id> [--uji] [--sampel N] [--frame 1,40]

Penuh  : semua frame unik 1..N -> out/<id>/frames/NNNN.png (frame N+1 = frame 1, tidak dirender -> loop mulus)
--uji  : hanya frame strip + tengah + puncak, sampel rendah -> out/<id>/uji/
Selalu : close-up otot (kamera KameraOtot, frame puncak) -> <keluar>/otot.png, plus pemeriksaan pendar:
         close-up yang sama tanpa kompositor -> otot-tanpa-pendar.png; selisihnya dicatat di <keluar>/pendar.json
         (gagal keras bila pendar tidak terlihat). Waktu per frame -> <keluar>/waktu.json.
"""
import argparse
import json
import os
import sys
import time

import bpy
import numpy as np

DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, DIR)
import tampilan  # noqa: E402


def rentang(teks):
    hasil = []
    for bag in teks.split(","):
        if "-" in bag:
            a, b = bag.split("-")
            hasil.extend(range(int(a), int(b) + 1))
        else:
            hasil.append(int(bag))
    return hasil


def render_ke(jalur):
    bpy.context.scene.render.filepath = jalur
    t0 = time.perf_counter()
    bpy.ops.render.render(write_still=True)
    return round(time.perf_counter() - t0, 2)


def piksel(jalur):
    img = bpy.data.images.load(jalur)
    a = np.empty(img.size[0] * img.size[1] * 4, dtype=np.float32)
    img.pixels.foreach_get(a)
    bpy.data.images.remove(img)
    return a.reshape(-1, 4)[:, :3]


def periksa_pendar(keluar, f_puncak):
    """Close-up otot dengan dan tanpa kompositor pendar; pendar harus menambah cahaya oranye yang nyata."""
    sc = bpy.context.scene
    utama = sc.camera
    sc.camera = bpy.data.objects["KameraOtot"]
    sc.frame_set(f_puncak)
    dengan, tanpa = os.path.join(keluar, "otot.png"), os.path.join(keluar, "otot-tanpa-pendar.png")
    render_ke(dengan)
    tampilan.pendar_kompositor(False)
    render_ke(tanpa)
    tampilan.pendar_kompositor(True)
    sc.camera = utama
    a, b = piksel(dengan), piksel(tanpa)
    d = a - b
    terang = d.sum(axis=1)
    hangat = (d[:, 0] > d[:, 2] + 0.02)  # tambahan lebih merah daripada biru = oranye
    hasil = {
        "pikselBerubahLebihDari3persen": int(((terang > 0.09) & hangat).sum()),
        "porsiBingkai": round(float(((terang > 0.09) & hangat).mean()), 4),
        "selisihMaks": round(float(terang.max()), 3),
        "selisihRerataDiWilayahPendar": round(float(terang[terang > 0.09].mean()) if (terang > 0.09).any() else 0.0, 3),
    }
    with open(os.path.join(keluar, "pendar.json"), "w", encoding="utf-8") as fh:
        json.dump(hasil, fh, indent=1)
    print("[render] pemeriksaan pendar:", hasil, flush=True)
    if hasil["porsiBingkai"] < 0.01:
        raise RuntimeError(f"pendar tidak terlihat (porsi {hasil['porsiBingkai']}): periksa kompositor/bahan")
    return hasil


def main():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    ap = argparse.ArgumentParser()
    ap.add_argument("--id", required=True)
    ap.add_argument("--uji", action="store_true")
    ap.add_argument("--sampel", type=int, default=None)
    ap.add_argument("--frame", default=None)
    a = ap.parse_args(argv)
    akar = os.path.join(DIR, "out", a.id)
    with open(os.path.join(akar, "info.json"), encoding="utf-8") as fh:
        info = json.load(fh)
    keluar = os.path.join(akar, "uji" if a.uji else "frames")
    os.makedirs(keluar, exist_ok=True)

    sc = bpy.context.scene
    perangkat = tampilan.terapkan(a.sampel or (32 if a.uji else tampilan.SAMPEL))
    if a.frame:
        frames = rentang(a.frame)
    elif a.uji:
        frames = sorted(set(info["strip"] + [info["frameTengah"], info["framePuncak"]]))
    else:
        frames = list(range(info["frameMulai"], info["frameMulai"] + info["jumlahFrame"]))
    print(f"[render] {a.id}: {len(frames)} frame, perangkat {perangkat}, sampel {sc.cycles.samples}", flush=True)

    waktu = {}
    t_mulai = time.perf_counter()
    for f in frames:
        sc.frame_set(f)
        waktu[str(f)] = render_ke(os.path.join(keluar, f"{f:04d}.png"))
        print(f"[render] frame {f}: {waktu[str(f)]} dtk", flush=True)
    total = round(time.perf_counter() - t_mulai, 1)
    pendar = periksa_pendar(keluar, info["framePuncak"])
    with open(os.path.join(keluar, "waktu.json"), "w", encoding="utf-8") as fh:
        json.dump({"sampel": sc.cycles.samples, "perangkat": perangkat, "totalDetik": total, "frame": waktu, "pendar": pendar}, fh, indent=1)


main()
