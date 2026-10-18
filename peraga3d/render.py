"""Render satu latihan dari peraga3d/out/<id>/adegan.blend dengan tampilan S2 (flat editorial).

  blender -b peraga3d/out/<id>/adegan.blend -P peraga3d/render.py -- --id <id> [--uji] [--sampel N] [--frame 1,40]

Penuh  : semua frame unik 1..N -> out/<id>/frames/NNNN.png (frame N+1 = frame 1, tidak dirender -> loop mulus)
--uji  : hanya frame strip + tengah + puncak, sampel rendah -> out/<id>/uji/
Selalu : pemeriksaan sorot otot pada frame puncak, close-up (kamera KameraOtot -> <keluar>/otot.png) dan bingkai
         video (<keluar>/sorot-bingkai.png), masing-masing dengan & tanpa sorot (`nyala_otot` = 0 ->
         *-tanpa-sorot.png). Piksel yang berubah nyata DAN tampil oranye dihitung; gagal keras bila porsinya di bawah
         ambang (sorot tidak terlihat). Hasil -> <keluar>/sorot.json, waktu per frame -> <keluar>/waktu.json.
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

# Porsi bingkai minimum yang tampil oranye karena sorot: close-up otot (1 %), dan bingkai video 720 px (0,1 % =
# ±520 piksel, mis. 23 x 23 px). Di bawahnya sorot praktis tak terlihat (otot tertutup / menghadap menjauhi kamera).
AMBANG = {"dekat": 0.01, "bingkai": 0.001}


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
    """Piksel sRGB 0..1 (PNG 8-bit dimuat apa adanya)."""
    img = bpy.data.images.load(jalur)
    a = np.empty(img.size[0] * img.size[1] * 4, dtype=np.float32)
    img.pixels.foreach_get(a)
    bpy.data.images.remove(img)
    return a.reshape(-1, 4)[:, :3]


def ukur_sorot(dengan, tanpa):
    a, b = piksel(dengan), piksel(tanpa)
    beda = np.abs(a - b).sum(axis=1)
    r, g, bl = a[:, 0], a[:, 1], a[:, 2]
    oranye = (r > g) & (g > bl) & (r - bl > 0.35)
    sorot = (beda > 0.15) & oranye
    return {
        "porsiBingkai": round(float(sorot.mean()), 4),
        "piksel": int(sorot.sum()),
        "bedaRerata": round(float(beda[sorot].mean()) if sorot.any() else 0.0, 3),
    }


def periksa_sorot(keluar, f_puncak):
    """Sorot otot (oranye di kulit & kain) harus tampak nyata di close-up dan di bingkai video pada frame puncak."""
    sc = bpy.context.scene
    utama = sc.camera
    sc.frame_set(f_puncak)
    hasil = {}
    for nama, kamera, berkas in (("dekat", bpy.data.objects["KameraOtot"], "otot"), ("bingkai", utama, "sorot-bingkai")):
        sc.camera = kamera
        dengan, tanpa = os.path.join(keluar, f"{berkas}.png"), os.path.join(keluar, f"{berkas}-tanpa-sorot.png")
        render_ke(dengan)
        sc["nyala_otot"] = 0.0
        render_ke(tanpa)
        sc["nyala_otot"] = 1.0
        hasil[nama] = {**ukur_sorot(dengan, tanpa), "ambang": AMBANG[nama]}
    sc.camera = utama
    with open(os.path.join(keluar, "sorot.json"), "w", encoding="utf-8") as fh:
        json.dump(hasil, fh, indent=1)
    print("[render] pemeriksaan sorot:", hasil, flush=True)
    gagal = [n for n, h in hasil.items() if h["porsiBingkai"] < h["ambang"]]
    if gagal:
        raise RuntimeError(f"sorot otot tidak terlihat ({', '.join(gagal)}): {hasil}; periksa OTOT latihan/bahan")
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
    perangkat = tampilan.terapkan(a.sampel or (16 if a.uji else tampilan.SAMPEL))
    if a.frame:
        frames = rentang(a.frame)
    elif a.uji:
        frames = sorted(set(info["strip"] + [info["frameTengah"], info["framePuncak"]]))
    else:
        frames = list(range(info["frameMulai"], info["frameMulai"] + info["jumlahFrame"]))
    print(f"[render] {a.id}: {len(frames)} frame, {perangkat}, sampel {sc.eevee.taa_render_samples}", flush=True)

    waktu = {}
    t_mulai = time.perf_counter()
    for f in frames:
        sc.frame_set(f)
        waktu[str(f)] = render_ke(os.path.join(keluar, f"{f:04d}.png"))
        print(f"[render] frame {f}: {waktu[str(f)]} dtk", flush=True)
    total = round(time.perf_counter() - t_mulai, 1)
    sorot = periksa_sorot(keluar, info["framePuncak"])
    with open(os.path.join(keluar, "waktu.json"), "w", encoding="utf-8") as fh:
        json.dump({"sampel": sc.eevee.taa_render_samples, "perangkat": perangkat, "totalDetik": total, "frame": waktu,
                   "sorot": sorot}, fh, indent=1)


main()
