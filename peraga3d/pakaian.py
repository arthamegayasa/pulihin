"""Pakaian dari aset MakeHuman CC0: kaos `male_casualsuit06` dijadikan polo (kerah lipat + plaket berkancing
dibangun dari garis leher kaos) dan celana panjang; `shoes01` dipisah sepatu/kaus kaki. Bahan dipasang oleh
tampilan.py lewat slot bahan bernama.
"""
import math

import bmesh
import bpy
from mathutils import Matrix, Vector
from mathutils.bvhtree import BVHTree
from mathutils.kdtree import KDTree


def slot(obj, nama):
    mat = bpy.data.materials.get(nama) or bpy.data.materials.new(nama)
    for i, s in enumerate(obj.material_slots):
        if s.material == mat:
            return i
    obj.data.materials.append(mat)
    return len(obj.data.materials) - 1


def pisah_uv(obj, aturan):
    """Tetapkan slot bahan per poligon dari pusat UV-nya: aturan(u, v) -> nama bahan."""
    me = obj.data
    uv = me.uv_layers.active.data
    me.materials.clear()
    idx = {}
    for p in me.polygons:
        u = sum(uv[i].uv.x for i in p.loop_indices) / p.loop_total
        v = sum(uv[i].uv.y for i in p.loop_indices) / p.loop_total
        nama = aturan(u, v)
        if nama not in idx:
            idx[nama] = slot(obj, nama)
        p.material_index = idx[nama]


def _bobot(obj, vi):
    return {obj.vertex_groups[g.group].name: g.weight for g in obj.data.vertices[vi].groups}


def _salin_bobot(dst, daftar_bobot):
    for vi, bb in enumerate(daftar_bobot):
        for nama, w in bb.items():
            if w <= 0:
                continue
            g = dst.vertex_groups.get(nama) or dst.vertex_groups.new(name=nama)
            g.add([vi], w, "REPLACE")


def _objek_ikut_rig(nama, me, rig, bobot):
    ob = bpy.data.objects.new(nama, me)
    bpy.context.scene.collection.objects.link(ob)
    ob.parent = rig
    _salin_bobot(ob, bobot)
    m = ob.modifiers.new("Armature", "ARMATURE")
    m.object = rig
    return ob


def garis_leher(baju):
    """Lingkar garis leher kaos (tepi terbuka teratas), urut sudut mengelilingi leher mulai dari depan."""
    me = baju.data
    bm = bmesh.new()
    bm.from_mesh(me)
    zmax = max(v.co.z for v in bm.verts if v.co.z < 1.6)
    tepi = [e for e in bm.edges if e.is_boundary and all(v.co.z > zmax - 0.09 and abs(v.co.x) < 0.11 for v in e.verts)]
    vs = {v.index: v.co.copy() for e in tepi for v in e.verts}
    bm.free()
    c = sum(vs.values(), Vector()) / len(vs)
    urut = sorted(vs.items(), key=lambda kv: math.atan2(kv[1].x - c.x, -(kv[1].y - c.y)))
    return urut, c


def buat_kerah(baju, rig):
    """Kerah polo lipat: berdiri ±2,4 cm lalu jatuh ±3,5 cm (ujung depan lebih panjang), terbuka di depan."""
    urut, c = garis_leher(baju)
    bvh = BVHTree.FromObject(baju, bpy.context.evaluated_depsgraph_get(), deform=False)
    baris = []
    bobot = []
    pilih = []
    for vi, p in urut:
        sud = math.degrees(math.atan2(p.x - c.x, -(p.y - c.y)))  # 0 = depan tengah
        if abs(sud) < 7.0:
            continue
        pilih.append((vi, p, sud))
    pilih.sort(key=lambda x: x[2] if x[2] > 0 else x[2] + 360.0)  # dari kiri-depan memutar lewat belakang
    for vi, p, sud in pilih:
        o = Vector((p.x - c.x, p.y - c.y, 0)).normalized()
        z = Vector((0, 0, 1))
        depan = max(0.0, 1.0 - min(abs(sud), 360 - abs(sud)) / 55.0)
        jatuh = 0.034 + 0.020 * depan ** 1.5
        r = [p + o * 0.0015 - z * 0.002, p + z * 0.022 + o * 0.004, p + z * 0.026 + o * 0.011]
        for k, (naik, keluar) in enumerate(((0.012, 0.022), (-0.004, 0.030), (-0.020 - 0.012 * depan, 0.026 + 0.012 * depan))):
            q = p + z * (naik * jatuh / 0.034) + o * keluar
            loc, nor, _, _ = bvh.find_nearest(q)
            nor = nor.normalized()
            if nor.dot(Vector((loc.x - c.x, loc.y - c.y, max(loc.z - c.z, 0.0) + 0.05))) < 0:
                nor = -nor
            jarak = (q - loc).dot(nor)
            if jarak < 0.0045 - 0.001 * k:
                q = q + nor * (0.0045 - 0.001 * k - jarak)
            r.append(q)
        if depan > 0:
            # ujung kerah depan sedikit mengarah ke tengah bawah
            r[-1] += Vector((-(p.x - c.x), 0, -0.01)).normalized() * 0.006 * depan
        baris.append(r)
        bobot.append(_bobot(baju, vi))
    me = bpy.data.meshes.new("Kerah")
    bm = bmesh.new()
    grid = [[bm.verts.new(q) for q in r] for r in baris]
    vb = []
    for i in range(len(grid)):
        vb.extend([bobot[i]] * len(grid[i]))
    for i in range(len(grid) - 1):
        for k in range(len(grid[i]) - 1):
            bm.faces.new((grid[i][k], grid[i + 1][k], grid[i + 1][k + 1], grid[i][k + 1]))
    bm.normal_update()
    bm.to_mesh(me)
    bm.free()
    for p in me.polygons:
        p.use_smooth = True
    ob = _objek_ikut_rig("Kerah", me, rig, vb)
    s = ob.modifiers.new("Tebal", "SOLIDIFY")
    s.thickness = 0.0022
    s.offset = 0
    ob.modifiers.move(len(ob.modifiers) - 1, 0)
    sd = ob.modifiers.new("Halus", "SUBSURF")
    sd.levels = 2
    sd.render_levels = 2
    slot(ob, "Polo")
    return ob


def buat_plaket(baju, rig):
    """Plaket depan 2,6 x 11 cm di permukaan dada + dua kancing."""
    urut, c = garis_leher(baju)
    depan = min(urut, key=lambda kv: abs(kv[1].x - c.x) + 0.5 * (kv[1].y - c.y))[1]
    bvh = BVHTree.FromObject(baju, bpy.context.evaluated_depsgraph_get(), deform=False)
    kd = KDTree(len(baju.data.vertices))
    for v in baju.data.vertices:
        kd.insert(v.co, v.index)
    kd.balance()

    def di_permukaan(x, turun, tinggi=0.0016):
        q = Vector((x, depan.y - 0.03, depan.z - turun))
        hit, nor, _, _ = bvh.ray_cast(q, Vector((0, 1, 0)))
        if hit is None:
            hit, nor, _, _ = bvh.find_nearest(q)
        nor = nor.normalized()
        if nor.y > 0:
            nor = -nor
        return hit + nor * tinggi, nor

    bm = bmesh.new()
    bobot = []
    kolom = (-0.013, 0.0, 0.013)
    baris = [0.004 + 0.112 * k / 9 for k in range(10)]
    grid = []
    for t in baris:
        r = []
        for x in kolom:
            q, _ = di_permukaan(depan.x + x, t)
            r.append(bm.verts.new(q))
            bobot.append(_bobot(baju, kd.find(q)[1]))
        grid.append(r)
    for i in range(len(grid) - 1):
        for k in range(len(kolom) - 1):
            bm.faces.new((grid[i][k], grid[i][k + 1], grid[i + 1][k + 1], grid[i + 1][k]))
    n_plaket = len(bm.faces)
    for t in (0.040, 0.082):
        q, nor = di_permukaan(depan.x, t, 0.0022)
        res = bmesh.ops.create_cone(bm, cap_ends=True, segments=14, radius1=0.0036, radius2=0.0034, depth=0.0016)
        R = nor.to_track_quat("Z", "Y").to_matrix().to_4x4()
        bmesh.ops.transform(bm, matrix=Matrix.Translation(q) @ R, verts=res["verts"])
        bobot.extend([_bobot(baju, kd.find(q)[1])] * len(res["verts"]))
    bm.verts.index_update()
    me = bpy.data.meshes.new("Plaket")
    bm.normal_update()
    bm.to_mesh(me)
    bm.free()
    ob = _objek_ikut_rig("Plaket", me, rig, bobot)
    i_polo = slot(ob, "Polo")
    i_kancing = slot(ob, "Kancing")
    for p in ob.data.polygons:
        p.material_index = i_polo if p.index < n_plaket else i_kancing
        p.use_smooth = p.index < n_plaket
    s = ob.modifiers.new("Tebal", "SOLIDIFY")
    s.thickness = 0.0012
    s.offset = 1
    ob.modifiers.move(len(ob.modifiers) - 1, 0)
    return ob
