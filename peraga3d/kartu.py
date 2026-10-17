"""Gambar kecil daftar latihan ("kartu"): satu frame PUNCAK dengan pendar otot & cincin sendi menyala, latar rata
#EEF4F2 (warna ubin ilustrasi S2 `bg-ilustrasi`, jadi tepi gambar menyatu dengan ubin aplikasi), bingkai rapat pada
bagian tubuh yang bergerak, cahaya pinggir sedikit lebih kuat agar figur tidak pudar di latar terang.

  blender -b peraga3d/out/<id>/adegan.blend -P peraga3d/kartu.py -- --id <id> [--sampel N]

Hasil: peraga3d/out/<id>/kartu/kartu.png (RESxRES; buat.mjs --kartu mengecilkan ke 256 px -> public/peraga/<id>-kartu.webp)
dan kartu.json (kamera, warna latar terukur).
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
LATAR = "#EEF4F2"
FIGUR = ("Badan", "Baju", "Sepatu", "Rambut")
KUAT_PINGGIR = 1.4
# Latar #EEF4F2 jauh lebih terang daripada cyclorama video: figur digelapkan (eksposur lebih rendah; warna latar
# dikalibrasi sesudahnya, jadi tetap tepat) dan sisi bayangan diperdalam (cahaya isi lebih lemah) agar figur resin
# putih tidak pudar di latar terang.
EKSPOSUR = -1.5
KUAT_ISI = 0.5
# Bayangan lantai (penangkap bayangan) dipertegas x BAYANGAN: telapak menapak & tumit terangkat tetap terbaca.
BAYANGAN = 1.0

# Bingkai per latihan. `pita` = (bawah, atas) rentang tinggi figur pada frame puncak (fraksi 0 = lantai/kaki,
# 1 = puncak kepala/tangan) yang harus masuk bingkai; `isi` = sisi terbesar pita terhadap bingkai; `geser` = (kanan,
# bawah) pergeseran isi dalam fraksi bingkai (latihan inti: kepala menjauhi lencana bintang di pojok kiri atas
# ubin Daftar Latihan). Sudut kamera bawaan = kamera video (`KAMERA` modul latihan); `azimut`/`elevasi`/`lensa`
# menimpa bila sudut lain lebih terbaca pada 56 px.
KARTU = {
    "fleksi-bahu": {"pita": (0.42, 1.0), "isi": 0.80, "geser": (0.07, 0.11)},
    "fleksi-siku": {"pita": (0.40, 1.0), "isi": 0.86, "geser": (0.14, 0.08)},
    "abduksi-bahu": {"pita": (0.40, 1.0), "isi": 0.92, "geser": (0.0, 0.04)},
    "menggapai": {"pita": (0.40, 1.0), "isi": 0.90},
    "putar-badan": {"pita": (0.40, 1.0), "isi": 0.90},
    "ekstensi-lutut": {"pita": (0.0, 1.0), "isi": 0.92},
    # Samping: paha yang terangkat & telapak yang lepas dari lantai terbaca sebagai siluet.
    "langkah-duduk": {"pita": (0.0, 1.0), "isi": 0.92, "azimut": 78.0, "elevasi": 8.0},
    "duduk-berdiri": {"pita": (0.0, 1.0), "isi": 0.94},
    "abduksi-pinggul": {"pita": (0.0, 1.0), "isi": 0.92},
    "jinjit": {"pita": (0.0, 0.60), "isi": 0.90},
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
    # Cincin sendi yang menyala selalu utuh di dalam bingkai.
    for o in bpy.data.objects:
        if o.name.startswith("Cincin") and o.type == "MESH" and not o.hide_render:
            pilih += titik(o.name, 1)
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


def warna_tampil(sc, linear, jalur):
    """Warna sRGB 8-bit hasil view transform adegan (AgX + look + eksposur) untuk satu warna linear."""
    img = bpy.data.images.new("kalibrasi", 4, 4, float_buffer=True)
    img.pixels.foreach_set([c for _ in range(16) for c in (*linear, 1.0)])
    img.save_render(jalur, scene=sc)
    bpy.data.images.remove(img)
    keluar = bpy.data.images.load(jalur)
    px = list(keluar.pixels[:3])
    bpy.data.images.remove(keluar)
    return px


def latar_rata(sc, keluar):
    """Latar rata lewat kompositor: film transparan (cyclorama tak terlihat kamera, tetapi tetap memantulkan cahaya
    seperti di video), gambar ditumpuk di atas warna rata, lalu pendar otot/cincin ditambahkan (pendar juga tampak
    di atas latar). Warna linear dicari sehingga setelah view transform adegan (AgX + look + eksposur) tampil persis
    #EEF4F2. (Bukan dunia + Light Path "Is Camera Ray": sampling cahaya langsung ikut membaca sinar kamera, jadi
    figur ikut diterangi latar yang sangat terang.)"""
    target = [int(LATAR[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    jalur = os.path.join(keluar, "kalibrasi.png")
    lin = [1.0, 1.0, 1.0]
    tampil = warna_tampil(sc, lin, jalur)
    for _ in range(40):
        lin = [max(1e-4, l * (t / max(p, 1e-4)) ** 2.4) for l, t, p in zip(lin, target, tampil)]
        tampil = warna_tampil(sc, lin, jalur)
        if max(abs(t - p) for t, p in zip(target, tampil)) < 0.4 / 255:
            break
    os.remove(jalur)

    sc.render.film_transparent = True
    # Cyclorama = penangkap bayangan: hanya bayangan lembut figur & perabot yang tampak di atas latar rata (kaki menapak,
    # tumit/telapak yang terangkat terbaca), gradien, warna dan cahaya pantulnya tidak.
    bpy.data.objects["Cyc"].is_shadow_catcher = True
    # Pancaran diri cyclorama V3 akan masuk pass Emission (pendar) dan menerangi latar: matikan.
    bpy.data.materials["Cyc"].node_tree.nodes["pancar"].outputs[0].default_value = 0.0
    vl = sc.view_layers[0]
    vl.cycles.use_pass_shadow_catcher = True
    ng = bpy.data.node_groups.new("KartuLatar", "CompositorNodeTree")
    ng.interface.new_socket("Image", in_out="OUTPUT", socket_type="NodeSocketColor")
    rl = ng.nodes.new("CompositorNodeRLayers")
    out = ng.nodes.new("NodeGroupOutput")

    def math(op, a, b, clamp=False):
        n = ng.nodes.new("ShaderNodeMath")
        n.operation = op
        n.use_clamp = clamp
        for i, v in enumerate((a, b)):
            if isinstance(v, (int, float)):
                n.inputs[i].default_value = v
            else:
                ng.links.new(v, n.inputs[i])
        return n.outputs[0]

    # Faktor bayangan s (pass Shadow Catcher: 1 = tanpa bayangan; cahaya pantul > 1 dibuang), dipertegas
    # s' = 1 - (1 - s) x BAYANGAN. Latar = warna rata x s'. Gambar (alpha premultiplied, tanpa penangkap):
    # hasil = gambar + (1 - alpha) x latar.
    bw = ng.nodes.new("CompositorNodeRGBToBW")
    ng.links.new(rl.outputs["Shadow Catcher"], bw.inputs[0])
    # Piksel figur/perabot (alpha 1) tidak membawa bayangan; tanpa ini blur menghasilkan lingkar gelap di tepi figur.
    s = math("MAXIMUM", math("MINIMUM", bw.outputs[0], 1.0), rl.outputs["Alpha"])
    lembut = ng.nodes.new("CompositorNodeBlur")
    tampilan._set_masukan(lembut, "Size", round(10 * RES / 720))
    if "Type" in lembut.inputs:
        lembut.inputs["Type"].default_value = "Gaussian"
    ng.links.new(s, lembut.inputs["Image"])
    s = lembut.outputs[0]
    s = math("ADD", math("MULTIPLY", s, BAYANGAN), 1.0 - BAYANGAN, clamp=True)
    latar = ng.nodes.new("ShaderNodeMix")
    latar.data_type = "RGBA"
    latar.blend_type = "MULTIPLY"
    latar.inputs["Factor"].default_value = 1.0
    latar.inputs[6].default_value = (*lin, 1.0)
    gabung = ng.nodes.new("CompositorNodeCombineColor")
    for i in range(3):
        ng.links.new(s, gabung.inputs[i])
    ng.links.new(gabung.outputs[0], latar.inputs[7])
    atas = ng.nodes.new("ShaderNodeMix")
    atas.data_type = "RGBA"
    atas.blend_type = "ADD"
    atas.clamp_factor = True
    ng.links.new(math("SUBTRACT", 1.0, rl.outputs["Alpha"]), atas.inputs["Factor"])
    ng.links.new(rl.outputs["Image"], atas.inputs[6])
    ng.links.new(latar.outputs[2], atas.inputs[7])
    akhir = atas.outputs[2]
    # Eksposur kartu lebih rendah daripada video (-0,5): otot & cincin yang memancar dan pendarnya dikuatkan
    # sebanding (k x pass Emission) sehingga tampak senyala di video.
    k = 2 ** (-0.5 - sc.view_settings.exposure)
    for ukuran, kuat in ((0, k - 1), (round(7 * RES / 720), 0.9 * k), (round(26 * RES / 720), 0.75 * k)):
        sumber = rl.outputs["Emission"]
        if ukuran:
            bl = ng.nodes.new("CompositorNodeBlur")
            tampilan._set_masukan(bl, "Size", ukuran)
            if "Type" in bl.inputs:
                bl.inputs["Type"].default_value = "Gaussian"
            ng.links.new(sumber, bl.inputs["Image"])
            sumber = bl.outputs[0]
        mx = ng.nodes.new("ShaderNodeMix")
        mx.data_type = "RGBA"
        mx.blend_type = "ADD"
        mx.clamp_factor = False
        mx.inputs["Factor"].default_value = kuat
        ng.links.new(akhir, mx.inputs[6])
        ng.links.new(sumber, mx.inputs[7])
        akhir = mx.outputs[2]
    ng.links.new(akhir, out.inputs[0])
    sc.view_layers[0].use_pass_emit = True
    sc.compositing_node_group = ng
    sc.render.use_compositing = True
    sc.render.image_settings.color_mode = "RGB"
    return {"linear": [round(x, 5) for x in lin], "tampil": [round(x * 255, 1) for x in tampil]}


def main():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    ap = argparse.ArgumentParser()
    ap.add_argument("--id", required=True)
    ap.add_argument("--sampel", type=int, default=128)
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
    perangkat = tampilan.terapkan(a.sampel)
    # Diam & tajam: tanpa blur gerak (kamera kartu tanpa kedalaman ruang). Kompositor (latar + pendar) dari latar_rata.
    sc.render.use_motion_blur = False
    sc.render.resolution_x = sc.render.resolution_y = RES
    for nama in ("PinggirA", "PinggirB"):
        bpy.data.objects[nama].data.energy *= KUAT_PINGGIR
    bpy.data.objects["Isi"].data.energy *= KUAT_ISI
    sc.view_settings.exposure = EKSPOSUR

    sc.frame_set(info["framePuncak"])
    kamera = pasang_kamera(sc, K, cfg["pita"], cfg["isi"], cfg.get("geser"))
    latar = latar_rata(sc, keluar)
    sc.render.filepath = os.path.join(keluar, "kartu.png")
    bpy.ops.render.render(write_still=True)
    hasil = {"id": a.id, "frame": info["framePuncak"], "perangkat": perangkat, "sampel": sc.cycles.samples,
             "kamera": {**K, **kamera, "pita": cfg["pita"], "isi": cfg["isi"]}, "latar": latar}
    with open(os.path.join(keluar, "kartu.json"), "w", encoding="utf-8") as fh:
        json.dump(hasil, fh, indent=1)
    print("[kartu]", json.dumps(hasil), flush=True)


main()
