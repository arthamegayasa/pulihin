"""Wilayah otot yang menyala + "jendela" tembus pada pakaian di atasnya (gaya klinis V3).

Wilayah otot = masker titik `otot` (0..1) di mesh badan, dihitung dari bentuk rest dan bobot tulang:
tiap wilayah adalah pita sepanjang satu tulang x sektor sudut di sekitar sumbunya. Spesifikasi (di modul latihan):

  {"tulang": "upperarm_r",               # tulang acuan (sumbu = kepala -> ekor tulang, posisi rest)
   "grup": ("upperarm_r", "clavicle_r"),  # grup bobot yang boleh menyala (jumlah bobot >= 0,2)
   "s": (s0, s1, s2, s3),                 # pita sepanjang tulang (0 = kepala, 1 = ekor): naik s0..s1, turun s2..s3
   "arah": (x, y, z),                     # arah pusat sektor (ruang armature rest; diproyeksikan tegak lurus tulang)
   "lebar": 55.0,                         # lebar sektor (derajat, 1 sigma Gauss)
   "jari": 0.08}                          # jarak maksimum dari sumbu tulang (m)

Beberapa wilayah digabung dengan maksimum. Atribut objek `kuat_otot` (dikunci per frame) mengatur nyala.
Pakaian di atas otot mendapat atribut `jendela` (0..1) sehingga bahan dibuat tembus di sana, dan kulit di bawahnya
tidak dihapus oleh modifier Mask pakaian.
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


def terapkan(body, baju, rig, wilayah, jangkau_kain=0.04, jangkau_kulit=0.065):
    """Tulis atribut `otot` (badan) dan `jendela` (baju), lalu ganti grup Mask pakaian agar kulit di bawah lengan
    baju dan di bawah jendela tetap ada. Mengembalikan jumlah titik otot aktif (> 0,05)."""
    nilai = masker(body, rig, wilayah)
    at = body.data.attributes.get("otot") or body.data.attributes.new("otot", "FLOAT", "POINT")
    at.data.foreach_set("value", nilai)

    aktif = [(i, m) for i, m in enumerate(nilai) if m > 0.02]
    if not aktif:
        raise ValueError("wilayah otot kosong: periksa spesifikasi OTOT latihan")
    kd = KDTree(len(aktif))
    for k, (i, _) in enumerate(aktif):
        kd.insert(body.data.vertices[i].co, k)
    kd.balance()

    # Jendela kain: maksimum nilai otot di sekitar tiap titik kain, memudar dengan jarak.
    jendela = []
    for v in baju.data.vertices:
        j = 0.0
        for _, k, d in kd.find_range(v.co, jangkau_kain):
            j = max(j, aktif[k][1] * (1 - d / jangkau_kain))
        jendela.append(min(1.0, j * 1.6))
    aj = baju.data.attributes.get("jendela") or baju.data.attributes.new("jendela", "FLOAT", "POINT")
    aj.data.foreach_set("value", jendela)

    # Grup hapus kulit: salinan grup Mask asli, minus lengan atas/bawah (lengan baju tembus) dan minus kulit
    # dalam jangkauan otot (di bawah jendela). Adegan selalu dibangun dari dasar.blend, jadi grup asal masih asli.
    mask = next(m for m in body.modifiers if m.type == "MASK" and "casualsuit06" in m.name)
    asal = body.vertex_groups[mask.vertex_group]
    g = body.vertex_groups.new(name=asal.name + ".jendela")
    nama_grup = {gr.index: gr.name for gr in body.vertex_groups}
    hapus = []
    for v in body.data.vertices:
        ada, lengan = False, 0.0
        for gg in v.groups:
            if gg.group == asal.index and gg.weight > 0.5:
                ada = True
            if nama_grup[gg.group] in ("upperarm_l", "upperarm_r", "lowerarm_l", "lowerarm_r"):
                lengan += gg.weight
        if not ada or lengan > 0.25:
            continue
        if kd.find(v.co)[2] < jangkau_kulit:
            continue
        hapus.append(v.index)
    g.add(hapus, 1.0, "REPLACE")
    mask.vertex_group = g.name
    return sum(1 for m in nilai if m > 0.05)


def pusat_otot(body):
    """Pusat berbobot wilayah otot pada pose saat ini (ruang dunia), untuk kamera tinjau jarak dekat."""
    dg = bpy.context.evaluated_depsgraph_get()
    ev = body.evaluated_get(dg)
    me = ev.to_mesh()
    at = me.attributes["otot"]
    tot, jum = Vector(), 0.0
    for v, a in zip(me.vertices, at.data):
        if a.value > 0.3:
            tot += (ev.matrix_world @ v.co) * a.value
            jum += a.value
    ev.to_mesh_clear()
    return tot / jum
