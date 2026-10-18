"""Wilayah otot yang disorot oranye, di kulit dan di pakaian di atasnya (tampilan S2).

Wilayah otot = masker titik `otot` (0..1) di mesh badan, dihitung dari bentuk rest dan bobot tulang:
tiap wilayah adalah pita sepanjang satu tulang x sektor sudut di sekitar sumbunya. Spesifikasi (di modul latihan):

  {"tulang": "upperarm_r",               # tulang acuan (sumbu = kepala -> ekor tulang, posisi rest)
   "grup": ("upperarm_r", "clavicle_r"),  # grup bobot yang boleh menyala (jumlah bobot >= 0,2)
   "s": (s0, s1, s2, s3),                 # pita sepanjang tulang (0 = kepala, 1 = ekor): naik s0..s1, turun s2..s3
   "arah": (x, y, z),                     # arah pusat sektor (ruang armature rest; diproyeksikan tegak lurus tulang)
   "lebar": 55.0,                         # lebar sektor (derajat, 1 sigma Gauss)
   "jari": 0.08}                          # jarak maksimum dari sumbu tulang (m)

Beberapa wilayah digabung dengan maksimum. Atribut objek `kuat_otot` (dikunci per frame) mengatur nyala. Wilayah
dengan `"kanal": "b"` masuk atribut `otot_b` yang dinyalakan `kuat_otot_b` (otot kedua dengan fase sendiri, mis.
tungkai kanan lalu kiri dalam satu siklus).
Pakaian di atas otot mendapat atribut `jendela` / `jendela_b` (0..1, per kanal): nilai otot kulit tepat di bawah
tiap titik kain (rata-rata beberapa titik kulit terdekat), sehingga kain ikut disorot berbentuk otot dengan tepi
lembut yang sama, juga pada celana yang longgar; pakaian tetap rata & buram.
"""
import math

import bpy
from mathutils import Vector
from mathutils.kdtree import KDTree


def _halus(a, b, x):
    if b == a:
        return 1.0 if x >= b else 0.0
    t = max(0.0, min(1.0, (x - a) / (b - a)))
    return t * t * (3 - 2 * t)


def masker(body, rig, wilayah):
    me = body.data
    nama_grup = {g.index: g.name for g in body.vertex_groups}
    # Hanya kulit tampak (grup MPFB "body"); geometri bantu (JointCubes, helper-tights) disembunyikan Mask.
    kulit = body.vertex_groups["body"].index
    hasil = [0.0] * len(me.vertices)
    for w in wilayah:
        b = rig.data.bones[w["tulang"]]
        S, E = b.head_local, b.tail_local
        L = (E - S).length
        ax = (E - S).normalized()
        ref = Vector(w["arah"])
        ref = (ref - ax * ref.dot(ax)).normalized()
        s0, s1, s2, s3 = w["s"]
        grup = set(w["grup"])
        jari = w["jari"]
        for v in me.vertices:
            if not any(g.group == kulit and g.weight > 0.5 for g in v.groups):
                continue
            bobot = sum(g.weight for g in v.groups if nama_grup[g.group] in grup)
            if bobot < 0.2:
                continue
            s = (v.co - S).dot(ax) / L
            r = v.co - (S + ax * s * L)
            if r.length > jari or r.length < 1e-6:
                continue
            sud = math.degrees(r.normalized().angle(ref))
            m = math.exp(-((sud / w["lebar"]) ** 2))
            m *= _halus(s0, s1, s) * (1 - _halus(s2, s3, s))
            m *= _halus(0.2, 0.45, bobot) * (1 - _halus(jari * 0.8, jari, r.length))
            hasil[v.index] = max(hasil[v.index], m)
    return hasil


def terapkan(body, baju, rig, wilayah, jangkau_kain=0.10, tetangga=8):
    """Tulis atribut `otot` dan `otot_b` (badan; wilayah dengan `"kanal": "b"` masuk `otot_b`, dinyalakan oleh
    `kuat_otot_b` -> dua otot dengan fase kontraksi berbeda) dan `jendela` / `jendela_b` (baju: rata-rata berbobot
    jarak nilai otot `tetangga` titik kulit terdekat, bila kulit dalam `jangkau_kain`). Mengembalikan jumlah titik
    otot aktif (> 0,05)."""
    per_kanal = {k: masker(body, rig, [w for w in wilayah if w.get("kanal", "a") == k]) for k in ("a", "b")}
    if not any(m > 0.02 for nilai in per_kanal.values() for m in nilai):
        raise ValueError("wilayah otot kosong: periksa spesifikasi OTOT latihan")
    gi = body.vertex_groups["body"].index
    kulit = [v for v in body.data.vertices if any(g.group == gi and g.weight > 0.5 for g in v.groups)]
    kd = KDTree(len(kulit))
    for n, v in enumerate(kulit):
        kd.insert(v.co, n)
    kd.balance()
    bawah = []  # per titik kain: [(indeks titik kulit, bobot)]
    for v in baju.data.vertices:
        dekat = [(kulit[n].index, 1.0 / max(d, 1e-3)) for _, n, d in kd.find_n(v.co, tetangga) if d < jangkau_kain]
        tot = sum(w for _, w in dekat)
        bawah.append([(i, w / tot) for i, w in dekat])
    for k, nama, nama_kain in (("a", "otot", "jendela"), ("b", "otot_b", "jendela_b")):
        nilai = per_kanal[k]
        at = body.data.attributes.get(nama) or body.data.attributes.new(nama, "FLOAT", "POINT")
        at.data.foreach_set("value", nilai)
        jendela = [sum(nilai[i] * w for i, w in b) for b in bawah]
        aj = baju.data.attributes.get(nama_kain) or baju.data.attributes.new(nama_kain, "FLOAT", "POINT")
        aj.data.foreach_set("value", jendela)
    return sum(1 for a, b in zip(per_kanal["a"], per_kanal["b"]) if max(a, b) > 0.05)


def pusat_otot(body, baju):
    """Pusat berbobot wilayah yang disorot pada pose saat ini (ruang dunia), untuk kamera tinjau jarak dekat: kulit
    (`otot`) yang tampak dan kain di atas otot (`jendela`); kulit di bawah pakaian dihapus Mask, jadi otot tungkai &
    batang tubuh hanya terwakili kainnya."""
    dg = bpy.context.evaluated_depsgraph_get()
    tot, jum = Vector(), 0.0
    for o, nama in ((body, ("otot", "otot_b")), (baju, ("jendela", "jendela_b"))):
        ev = o.evaluated_get(dg)
        me = ev.to_mesh()
        a, b = me.attributes[nama[0]], me.attributes[nama[1]]
        for v, ka, kb in zip(me.vertices, a.data, b.data):
            m = max(ka.value, kb.value)
            if m > 0.3:
                tot += (ev.matrix_world @ v.co) * m
                jum += m
        ev.to_mesh_clear()
    if jum == 0.0:
        raise ValueError("wilayah otot tidak tampak pada pose puncak: periksa OTOT latihan")
    return tot / jum
