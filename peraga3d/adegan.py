"""Susun adegan satu latihan dari karakter dasar: pose & animasi satu siklus (loop mulus), perabot, wilayah otot
(kulit + kain di atasnya) dengan kekuatan sorot per frame, kamera per latihan dengan bingkai otomatis, kamera tinjau
otot, cyclorama.

  D:/Tools/blender/blender.exe -b peraga3d/out/dasar.blend -P peraga3d/adegan.py -- --id fleksi-siku
Hasil: peraga3d/out/<id>/adegan.blend + peraga3d/out/<id>/info.json (frame mulai/tengah/puncak, siklus, strip).
"""
import argparse
import json
import math
import os
import sys

import bpy
import bmesh
from bpy_extras.object_utils import world_to_camera_view
from mathutils import Vector
from mathutils.bvhtree import BVHTree

DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, DIR)
import gerak  # noqa: E402
import latihan  # noqa: E402
import otot  # noqa: E402

FIGUR = ("Badan", "Baju", "Sepatu", "Rambut")


def evaluasi(obj, langkah=1):
    dg = bpy.context.evaluated_depsgraph_get()
    ev = obj.evaluated_get(dg)
    me = ev.to_mesh()
    vs = [ev.matrix_world @ v.co for v in list(me.vertices)[::langkah]]
    polys = [tuple(p.vertices) for p in me.polygons] if langkah == 1 else []
    ev.to_mesh_clear()
    return vs, polys


def titik_figur(langkah=6):
    hasil = []
    for nama in FIGUR:
        o = bpy.data.objects[nama]
        if o.type == "MESH":
            hasil += evaluasi(o, langkah)[0]
        else:  # kurva rambut: titik kendali cukup untuk batas bingkai
            dg = bpy.context.evaluated_depsgraph_get()
            ev = o.evaluated_get(dg)
            hasil += [ev.matrix_world @ p.position for p in list(ev.data.points)[::langkah * 4]]
    return hasil


# ---------------- perabot ----------------


def kotak(nama, ukuran, pusat, bevel=0.004, seg=3):
    bpy.ops.mesh.primitive_cube_add(size=1, location=pusat)
    o = bpy.context.active_object
    o.name = nama
    o.scale = ukuran
    bpy.ops.object.transform_apply(scale=True)
    m = o.modifiers.new("Bevel", "BEVEL")
    m.width = bevel
    m.segments = seg
    m.limit_method = "ANGLE"
    bpy.ops.object.shade_smooth_by_angle(angle=0.6)
    return o


def silinder_miring(nama, a, b, r_a, r_b):
    """Kaki kursi meruncing dari a (atas) ke b (bawah)."""
    d = Vector(b) - Vector(a)
    bpy.ops.mesh.primitive_cone_add(vertices=20, radius1=r_a, radius2=r_b, depth=d.length, location=(Vector(a) + Vector(b)) / 2)
    o = bpy.context.active_object
    o.name = nama
    o.rotation_mode = "QUATERNION"
    o.rotation_quaternion = Vector((0, 0, -1)).rotation_difference(d.normalized())
    bpy.ops.object.shade_smooth()
    return o


def ke_perabot(bagian):
    """Pindahkan objek ke koleksi "Perabot" (bahan kayu diberikan tampilan.py)."""
    perabot = bpy.data.collections.get("Perabot")
    if perabot is None:
        perabot = bpy.data.collections.new("Perabot")
        bpy.context.scene.collection.children.link(perabot)
    kayu = bpy.data.materials.get("Kayu") or bpy.data.materials.new("Kayu")
    for o in bagian:
        for c in o.users_collection:
            c.objects.unlink(o)
        perabot.objects.link(o)
        o.data.materials.clear()
        o.data.materials.append(kayu)
    return bagian


def buat_kursi(dudukan_z, y_belakang, y_depan, setengah_lebar, sandaran_y, papan=(0.34, 0.13), rel_z=None):
    """Kursi kayu modern: dudukan membulat, empat kaki meruncing sedikit terbuka, sandaran melengkung
    (`papan` = (tinggi pusat di atas dudukan, tinggi papan)). `rel_z`: tiang naik sampai ketinggian ini dan
    ditutup rel bulat melintang (pegangan untuk latihan berdiri)."""
    bagian = []
    tebal = 0.032
    cy = (y_belakang + y_depan) / 2
    d = y_belakang - y_depan
    bagian.append(kotak("Kursi.dudukan", (2 * setengah_lebar, d, tebal), (0, cy, dudukan_z - tebal / 2), bevel=0.012, seg=4))
    puncak = rel_z if rel_z is not None else dudukan_z + 0.43
    for sx in (-1, 1):
        for sy, yy in ((-1, y_depan + 0.035), (1, y_belakang - 0.035)):
            x = sx * (setengah_lebar - 0.035)
            atas = (x, yy, dudukan_z - tebal)
            bawah = (x + sx * 0.025, yy + sy * 0.03, 0.0)
            bagian.append(silinder_miring(f"Kursi.kaki.{sx}{sy}", atas, bawah, 0.017, 0.012))
        x = sx * (setengah_lebar - 0.04)  # tiang sandaran melanjutkan kaki belakang
        bagian.append(silinder_miring(f"Kursi.tiang.{sx}", (x, sandaran_y + 0.061, puncak), (x, y_belakang - 0.035, dudukan_z - tebal), 0.015, 0.017))
    if rel_z is not None:
        ujung = setengah_lebar - 0.04 + 0.018
        bagian.append(silinder_miring("Kursi.rel", (-ujung, sandaran_y + 0.061, rel_z), (ujung, sandaran_y + 0.061, rel_z), 0.016, 0.016))
    # sandaran: papan melengkung (silinder terpotong) setinggi punggung bawah-tengah
    bpy.ops.mesh.primitive_cylinder_add(vertices=96, radius=0.62, depth=papan[1], location=(0, sandaran_y + 0.62 + 0.004, dudukan_z + papan[0]))
    s = bpy.context.active_object
    s.name = "Kursi.sandaran"
    bm = bmesh.new()
    bm.from_mesh(s.data)
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if v.co.y > -0.62 * math.cos(math.asin(0.185 / 0.62))], context="VERTS")
    bm.to_mesh(s.data)
    bm.free()
    m = s.modifiers.new("Tebal", "SOLIDIFY")
    m.thickness = 0.018
    m.offset = -1
    bv = s.modifiers.new("Bevel", "BEVEL")
    bv.width = 0.005
    bv.segments = 3
    bpy.ops.object.shade_smooth()
    bagian.append(s)
    return ke_perabot(bagian)


def buat_meja(tepi_y, tinggi, lebar=0.9, dalam=0.56):
    """Meja kayu kokoh di depan karakter (tepi dekat di `tepi_y`, meja memanjang ke -Y). Kaki depan mundur
    ±0,2 m dari tepi agar tidak menutupi lutut dari kamera samping."""
    tebal = 0.036
    bagian = [kotak("Meja.atas", (lebar, dalam, tebal), (0, tepi_y - dalam / 2, tinggi - tebal / 2), bevel=0.008, seg=4)]
    for sx in (-1, 1):
        x = sx * (lebar / 2 - 0.07)
        for yy in (tepi_y - 0.21, tepi_y - dalam + 0.07):
            bagian.append(kotak(f"Meja.kaki.{sx}{yy:.2f}", (0.05, 0.05, tinggi - tebal), (x, yy, (tinggi - tebal) / 2), bevel=0.004))
        bagian.append(kotak(f"Meja.apron.{sx}", (0.025, dalam - 0.28, 0.08), (x, tepi_y - 0.14 - (dalam - 0.28) / 2, tinggi - tebal - 0.04), bevel=0.003))
    return ke_perabot(bagian)


def buat_cyc(azimut, jarak_dinding=2.6, r=1.3):
    """Cyclorama (lantai melengkung ke dinding) di belakang karakter, menghadap kamera."""
    bm = bmesh.new()
    profil = [(-7.0, 0.0), (jarak_dinding - r, 0.0)]
    for i in range(1, 16):
        a = math.radians(90 * i / 16)
        profil.append((jarak_dinding - r + r * math.sin(a), r - r * math.cos(a)))
    profil += [(jarak_dinding, r), (jarak_dinding, 6.0)]
    kiri = [bm.verts.new((-7.0, y, z)) for y, z in profil]
    kanan = [bm.verts.new((7.0, y, z)) for y, z in profil]
    for i in range(len(profil) - 1):
        bm.faces.new((kiri[i], kanan[i], kanan[i + 1], kiri[i + 1]))
    me = bpy.data.meshes.new("Cyc")
    bm.to_mesh(me)
    bm.free()
    for p in me.polygons:
        p.use_smooth = True
    o = bpy.data.objects.new("Cyc", me)
    bpy.context.scene.collection.objects.link(o)
    o.rotation_euler = (0, 0, -azimut)
    o.data.materials.append(bpy.data.materials.get("Cyc") or bpy.data.materials.new("Cyc"))
    return o


# ---------------- posisi ----------------


def siapkan_duduk(anim, L, rig, baju, sepatu):
    """Duduk tegak di kursi: tinggi panggul dari kontak sepatu-lantai (kaki menapak, tidak tergelincir karena
    tungkai FK statis), kursi dari bentuk celana, target tangan istirahat di permukaan paha."""
    anim.turun = -0.30
    anim.terapkan(0.0)
    vs, _ = evaluasi(sepatu)
    anim.turun = -0.30 - min(v.z for v in vs) + 0.002
    anim.terapkan(0.0)
    vs, polys = evaluasi(baju)
    p = anim.p.pos
    paha, lutut = p["thigh_l"].translation.copy(), p["calf_l"].translation.copy()
    bawah_pantat = [v for v in vs if abs(v.x) < 0.17 and v.z < paha.z and v.y > lutut.y + 0.12]
    dudukan_z = min(v.z for v in bawah_pantat) + 0.006
    y_belakang = max(v.y for v in bawah_pantat) + 0.035
    punggung = [v for v in vs if abs(v.x) < 0.12 and dudukan_z + 0.2 < v.z < dudukan_z + 0.42]
    # `CELAH_SANDARAN` (opsional, m): jarak punggung ke sandaran (latihan yang duduk tegak tanpa bersandar).
    sandaran_y = max(v.y for v in punggung) + getattr(L, "CELAH_SANDARAN", 0.012)
    print(f"[adegan] turun {anim.turun:.3f}  dudukan z {dudukan_z:.3f}  belakang y {y_belakang:.3f}  sandaran y {sandaran_y:.3f}")

    # Tangan istirahat: pergelangan di atas paha ±40 % dari panggul ke lutut (dari permukaan celana).
    bvh = BVHTree.FromPolygons(vs, polys)
    for sisi in L.TANGAN_ISTIRAHAT:
        x = 1 if sisi == "l" else -1
        pa, lu = p[f"thigh_{sisi}"].translation.copy(), p[f"calf_{sisi}"].translation.copy()
        titik = pa.lerp(lu, 0.40) + Vector((0.01 * x, 0, 0))
        hit, _, _, _ = bvh.ray_cast(titik + Vector((0, 0, 0.3)), Vector((0, 0, -1)))
        arah_paha = (lu - pa).normalized()
        anim.tangan_istirahat[sisi] = (hit + Vector((0, 0, 0.024)) - arah_paha * 0.05,
                                      Vector((0.12 * x, 0.0, -1.0)),
                                      (arah_paha + Vector((-0.10 * x, 0, -0.05))).normalized())
    buat_kursi(dudukan_z, y_belakang, lutut.y + 0.07, 0.205, sandaran_y)


def sol_tanpa_betis(sepatu, anim):
    """Bobot sepatu MakeHuman memberi tulang betis ±20-30 % di sol bawah pangkal jari, sehingga sol ikut terangkat
    saat tumit naik (jinjit) dan ujung kaki tampak melayang. Untuk posisi berdiri: bobot betis di depan pergelangan
    kaki dipindah ke tulang kaki (memudar 3-7 cm di depan pergelangan); tumit & pergelangan tidak berubah."""
    g = {vg.name: vg for vg in sepatu.vertex_groups}
    for sisi in ("l", "r"):
        A = anim.p.rest[f"foot_{sisi}"].translation
        betis, kaki = g[f"calf_{sisi}"], g[f"foot_{sisi}"]
        for v in sepatu.data.vertices:
            if (v.co.x > 0) != (sisi == "l"):
                continue
            s = min(1.0, max(0.0, (A.y - 0.03 - v.co.y) / 0.04))
            wb = next((e.weight for e in v.groups if e.group == betis.index), 0.0)
            if s <= 0.0 or wb <= 0.0:
                continue
            wk = next((e.weight for e in v.groups if e.group == kaki.index), 0.0)
            pindah = wb * s * s * (3 - 2 * s)
            betis.add([v.index], wb - pindah, "REPLACE")
            kaki.add([v.index], wk + pindah, "REPLACE")


def tapak_lantai(anim, sepatu, ikut_panggul=True):
    """Kunci kedua telapak (IK tungkai) sehingga sol sepatu tepat menyentuh lantai pada t = 0. `ikut_panggul`:
    panggul ikut naik/turun (1 mm lebih rendah: lutut sedikit lunak, cadangan jangkauan IK untuk goyang postural)."""
    sol_tanpa_betis(sepatu, anim)
    for s in ("l", "r"):
        anim.tapakkan(s)
    anim.terapkan(0.0)
    dz = -min(v.z for v in evaluasi(sepatu)[0]) + 0.002
    for s in ("l", "r"):
        anim.tapakkan(s, (0.0, 0.0, dz))
    if ikut_panggul:
        anim.panggul = anim.panggul + Vector((0.0, 0.0, dz - 0.001))
    anim.terapkan(0.0)
    print(f"[adegan] telapak menapak: geser {dz:+.4f} m")


def siapkan_berdiri(anim, L, rig, baju, sepatu):
    """Berdiri di belakang kursi, kedua tangan menggenggam rel sandaran (IK terkunci sepanjang siklus), telapak
    terkunci di lantai. Rel setinggi 0,94 m; jarak kursi dipilih sehingga siku menekuk ±50° saat berdiri tegak
    (cadangan jangkauan untuk jinjit / pergeseran panggul tanpa lengan terkunci lurus)."""
    tapak_lantai(anim, sepatu)
    p = anim.p.pos
    a, b = anim.p.panjang["upperarm_l"], anim.p.panjang["lowerarm_l"]
    rel_z, x_tangan, r_rel = 0.94, 0.12, 0.016
    # Buku jari (pangkal jari tengah) tepat melewati puncak rel; telapak menutup puncak rel, jari dililitkan ke sisi
    # jauh oleh operasi genggam. Pergelangan = buku jari mundur sepanjang tangan searah jari.
    panjang_tangan = (anim.p.rest["middle_01_l"].translation - anim.p.rest["hand_l"].translation).length
    d = math.sqrt(a * a + b * b + 2 * a * b * math.cos(math.radians(50)))
    bahu = p["upperarm_l"].translation
    jari = {s: Vector((-0.08 * x, -0.97, -0.24)).normalized() for s, x in (("l", 1), ("r", -1))}
    ke_pergelangan = Vector((0.0, -0.006, r_rel + 0.024)) - jari["l"] * panjang_tangan
    ke_pergelangan.x = 0.0
    w_z = rel_z + ke_pergelangan.z
    dy = math.sqrt(d * d - (bahu.x - x_tangan) ** 2 - (bahu.z - w_z) ** 2)
    rel_y = bahu.y - dy - ke_pergelangan.y
    for sisi in L.TANGAN_ISTIRAHAT:
        x = 1 if sisi == "l" else -1
        rel = {"pusat": Vector((0.0, rel_y, rel_z)), "sumbu": Vector((1.0, 0.0, 0.0)), "jari_jari": r_rel + 0.0135}
        anim.tangan_istirahat[sisi] = (Vector((x * x_tangan, rel_y, rel_z)) + ke_pergelangan,
                                      Vector((0.0, 0.24, -0.97)), jari[sisi],
                                      {"genggam": rel, "kutub": (0.5 * x, 0.8, -0.35)})
    buat_kursi(0.47, rel_y + 0.02, rel_y + 0.02 - 0.42, 0.22, rel_y - 0.061, papan=(0.25, 0.10), rel_z=rel_z)
    print(f"[adegan] berdiri: rel sandaran y {rel_y:.3f} z {rel_z:.3f}, bahu z {bahu.z:.3f}")


def siapkan_duduk_berdiri(anim, L, rig, baju, sepatu):
    """Duduk di tepi kursi (t = 0), telapak terkunci di lantai; `tubuh()` latihan menggerakkan panggul relatif
    terhadap telapak (anim.kaki). Kursi dari bentuk celana saat duduk (bokong di sepertiga depan dudukan); meja
    kokoh di depan dengan tinggi & jarak dicari sehingga kedua tangan tetap bertumpu sepanjang siklus (lengan tidak
    pernah terkunci lurus, siku tidak terlipat berlebihan)."""
    tapak_lantai(anim, sepatu, ikut_panggul=False)
    vs, _ = evaluasi(baju)
    paha = anim.p.pos["thigh_l"].translation.copy()
    y_depan = paha.y - 0.12
    bawah = [v for v in vs if abs(v.x) < 0.2 and v.y > y_depan and v.z < paha.z]
    dudukan_z = min(v.z for v in bawah) + 0.004
    y_belakang = y_depan + 0.43
    buat_kursi(dudukan_z, y_belakang, y_depan, 0.205, y_belakang - 0.08)

    # Lintasan bahu sepanjang siklus (lengan belum dipasang: tidak memengaruhi bahu).
    a, b = anim.p.panjang["upperarm_l"], anim.p.panjang["lowerarm_l"]
    lintasan = []
    for i in range(0, gerak.JUMLAH_FRAME, 2):
        anim.terapkan(i / gerak.FPS)
        lintasan.append({s: anim.p.pos[f"upperarm_{s}"].translation.copy() for s in ("l", "r")})
    # Meja terendah (0,84-1,00 m) yang terjangkau sepanjang siklus tanpa lengan terkunci lurus (<= 96,5 % panjang
    # lengan) dan tanpa siku terlipat berlebihan saat condong (jarak bahu-pergelangan >= 0,25 m, siku <= ±110°);
    # bila tidak ada, jarak minimum terbesar.
    x_tangan, batas, lipat = 0.19, 0.965 * (a + b), 0.25
    terbaik = None
    for tinggi in [0.84 + 0.01 * k for k in range(17)]:
        for k in range(70):
            w = Vector((0.0, 0.10 - 0.01 * k, tinggi + 0.036))
            jarak = [(Vector((x * x_tangan, w.y, w.z)) - L_[s]).length for L_ in lintasan for s, x in (("l", 1), ("r", -1))]
            if max(jarak) <= batas and (terbaik is None or min(jarak) > terbaik[0]):
                terbaik = (min(jarak), max(jarak), tinggi, w)
        if terbaik is not None and terbaik[0] >= lipat:
            break
    if terbaik is None:
        raise RuntimeError("duduk-berdiri: tidak ada posisi meja yang terjangkau sepanjang siklus")
    dmin, dmax, tinggi, w = terbaik
    for sisi, x in (("l", 1), ("r", -1)):
        anim.tangan_istirahat[sisi] = (Vector((x * x_tangan, w.y, w.z + 0.006)), Vector((-0.12 * x, 0.0, -1.0)),
                                      Vector((-0.12 * x, -1.0, 0.0)).normalized(),
                                      {"miring": 0.0, "tekuk": -0.05, "ibu": -0.6, "kutub": (0.85 * x, 0.35, -0.4)})
    buat_meja(w.y + 0.032, tinggi)
    print(f"[adegan] duduk-berdiri: dudukan z {dudukan_z:.3f} depan y {y_depan:.3f}; meja tinggi {tinggi:.2f} "
          f"tepi y {w.y + 0.032:.3f}; jarak bahu-pergelangan {dmin:.3f}..{dmax:.3f} (maks {a + b:.3f})")


POSISI = {"duduk": siapkan_duduk, "berdiri": siapkan_berdiri, "duduk-berdiri": siapkan_duduk_berdiri}


# ---------------- kamera ----------------


def pasang_kamera(sc, K, frames):
    """Kamera per latihan: azimut (0 = depan karakter, + = ke sisi kanan karakter), elevasi, lensa. Jarak & geser
    dihitung sehingga figur (semua frame sampel) mengisi `isi` tinggi bingkai dan berada di tengah."""
    az, el = math.radians(K["azimut"]), math.radians(K["elevasi"])
    arah = Vector((-math.sin(az) * math.cos(el), -math.cos(az) * math.cos(el), math.sin(el)))
    cd = bpy.data.cameras.new("Kamera")
    cd.lens = K["lensa"]
    cd.sensor_fit = "VERTICAL"
    cd.sensor_width = cd.sensor_height = 36
    cam = bpy.data.objects.new("Kamera", cd)
    sc.collection.objects.link(cam)
    sc.camera = cam
    titik = []
    for f in frames:
        sc.frame_set(f)
        titik += titik_figur()
    lo = Vector((min(v.x for v in titik), min(v.y for v in titik), min(v.z for v in titik)))
    hi = Vector((max(v.x for v in titik), max(v.y for v in titik), max(v.z for v in titik)))
    target = (lo + hi) / 2
    cam.rotation_mode = "QUATERNION"
    cam.rotation_quaternion = (-arah).to_track_quat("-Z", "Y")

    def ukur(D):
        cam.location = target + arah * D
        cd.shift_x = cd.shift_y = 0.0
        bpy.context.view_layer.update()
        ndc = [world_to_camera_view(sc, cam, v) for v in titik]
        return [v.x for v in ndc], [v.y for v in ndc]

    # Tinggi figur = `isi` bingkai, kecuali lebarnya akan melebihi 92 % bingkai.
    D = 3.0
    for _ in range(8):
        xs, ys = ukur(D)
        D *= max(max(ys) - min(ys), (max(xs) - min(xs)) * K["isi"] / 0.92) / K["isi"]
    xs, ys = ukur(D)
    cd.shift_x = (min(xs) + max(xs)) / 2 - 0.5
    cd.shift_y = (min(ys) + max(ys)) / 2 - 0.5
    sc["azimut_kamera"] = K["azimut"]
    print(f"[adegan] kamera jarak {D:.2f} m, geser ({cd.shift_x:.3f}, {cd.shift_y:.3f}), "
          f"figur {max(ys) - min(ys):.3f} x {max(xs) - min(xs):.3f} bingkai")
    return cam, arah


def kamera_tinjau(sc, nama, target, arah, jarak, lensa):
    cd = bpy.data.cameras.new(nama)
    cd.lens = lensa
    cd.sensor_fit = "VERTICAL"
    cd.sensor_width = cd.sensor_height = 36
    cam = bpy.data.objects.new(nama, cd)
    sc.collection.objects.link(cam)
    cam.location = target + arah * jarak
    cam.rotation_mode = "QUATERNION"
    cam.rotation_quaternion = (-arah).to_track_quat("-Z", "Y")
    return cam


def kunci_sorot(anim):
    """Kunci `kuat_otot`/`kuat_otot_b` (kekuatan kontraksi kanal a/b) per frame di badan & baju: sorot otot di kulit
    dan di kain di atasnya mengikuti fase gerak."""
    objek = (bpy.data.objects["Badan"], bpy.data.objects["Baju"])
    for frame, kuat in anim.rekam:
        for o in objek:
            o["kuat_otot"], o["kuat_otot_b"] = kuat
            o.keyframe_insert('["kuat_otot"]', frame=frame)
            o.keyframe_insert('["kuat_otot_b"]', frame=frame)
    for o in objek:
        gerak.siklus_linear(o)


def main():
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    ap = argparse.ArgumentParser()
    ap.add_argument("--id", required=True)
    a = ap.parse_args(argv)
    L = latihan.muat(a.id)
    keluar = os.path.join(DIR, "out", a.id)
    os.makedirs(keluar, exist_ok=True)
    sc = bpy.context.scene
    o = bpy.data.objects
    body, rig, baju, sepatu = o["Badan"], o["Rig"], o["Baju"], o["Sepatu"]

    n_otot = otot.terapkan(body, baju, rig, L.OTOT)
    print(f"[adegan] {L.ID}: siklus {gerak.SIKLUS} dtk ({gerak.JUMLAH_FRAME} frame), tempo target {L.TEMPO}, {n_otot} titik otot")

    anim = gerak.Animator(rig, L)
    if L.POSISI not in POSISI:
        raise ValueError(f"posisi '{L.POSISI}' belum punya fungsi persiapan di adegan.POSISI (lihat README)")
    POSISI[L.POSISI](anim, L, rig, baju, sepatu)

    sc.render.fps = gerak.FPS
    sc.frame_start = gerak.FRAME_MULAI
    sc.frame_end = gerak.FRAME_MULAI + gerak.JUMLAH_FRAME - 1
    kedip = [body.data.shape_keys.key_blocks[n] for n in ("kedip_l", "kedip_r")]
    anim.kunci_semua(kedip)
    kunci_sorot(anim)

    # Frame acuan: mulai, tengah naik (progres pertama >= 0,5), puncak (tengah tahan), strip 8 frame merata.
    n = gerak.JUMLAH_FRAME
    f_puncak = gerak.frame_dari_fraksi(L.T_PUNCAK)
    f_tengah = next(gerak.FRAME_MULAI + i for i in range(n) if anim.progres(i / gerak.FPS) >= 0.5)
    strip = [gerak.FRAME_MULAI + round(i * n / 8) for i in range(8)]
    sampel = sorted(set(strip + [f_puncak, f_tengah]))

    cam, arah = pasang_kamera(sc, L.KAMERA, sampel)
    sc.frame_set(f_puncak)
    pusat = otot.pusat_otot(body, baju)
    kamera_tinjau(sc, "KameraOtot", pusat, arah, 0.95, 70)
    buat_cyc(math.radians(L.KAMERA["azimut"]))

    sc.render.resolution_x = sc.render.resolution_y = 720
    sc.frame_set(gerak.FRAME_MULAI)
    info = {"id": L.ID, "siklus": gerak.SIKLUS, "tempo": L.TEMPO, "fps": gerak.FPS, "frameMulai": gerak.FRAME_MULAI,
            "jumlahFrame": n, "framePuncak": f_puncak, "frameTengah": f_tengah, "strip": strip}
    with open(os.path.join(keluar, "info.json"), "w", encoding="utf-8") as fh:
        json.dump(info, fh, indent=1)
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(keluar, "adegan.blend"), compress=True)
    print("[adegan] tersimpan:", keluar, json.dumps(info))


main()
