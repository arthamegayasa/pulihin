"""Rambut pendek hitam dengan pelipis abu (Pak Budi) sebagai kurva helai sungguhan (objek Curves), dibangun
prosedural di atas kulit kepala mesh dasar MPFB, plus kumis rapi (mesh). Satu set akar dipakai untuk dua bentuk:
- "helai": ±45 ribu helai halus (gaya realistis);
- "gumpal": ±7 ribu helai lebih tebal yang menyatu ke ujung gumpalan (gaya stilistik, dipakai dasar.py).
Gaya: belahan samping kiri, atas ±4 cm disisir ke kanan-belakang, samping & belakang pendek (1-1,5 cm),
pelipis sedikit mundur (usia paruh baya). Atribut kurva `uban` (0..1, wilayah pelipis) untuk bahan.
"""
import math
import random

import bmesh
import bpy
from mathutils import Matrix, Vector
from mathutils.bvhtree import BVHTree
from mathutils.kdtree import KDTree


def _smooth(a, b, x):
    if b == a:
        return 1.0 if x >= b else 0.0
    t = max(0.0, min(1.0, (x - a) / (b - a)))
    return t * t * (3 - 2 * t)


def _interp(tabel, x):
    if x <= tabel[0][0]:
        return tabel[0][1]
    for (x0, y0), (x1, y1) in zip(tabel, tabel[1:]):
        if x <= x1:
            return y0 + (y1 - y0) * _smooth(x0, x1, x)
    return tabel[-1][1]


class KulitKepala:
    """Landmark kepala & fungsi masker garis rambut, dari mesh dasar (koordinat rest, ruang objek = dunia)."""

    def __init__(self, body, alis):
        me = body.data
        gi = body.vertex_groups["body"].index
        di_badan = [any(g.group == gi and g.weight > 0.5 for g in v.groups) for v in me.vertices]
        telinga_mat = [i for i, s in enumerate(body.material_slots) if s.material and s.material.name.endswith("ears")]
        tv = set()
        for p in me.polygons:
            if p.material_index in telinga_mat:
                tv.update(p.vertices)
        tel = [me.vertices[i].co for i in tv if me.vertices[i].co.x < 0]  # telinga kanan (simetris)
        self.ear_top = max(c.z for c in tel)
        self.ear_bot = min(c.z for c in tel)
        self.ear_mid = 0.5 * (self.ear_top + self.ear_bot)
        self.yc = sum(c.y for c in tel) / len(tel)
        self.zc = self.ear_mid
        kepala = [me.vertices[i].co for i in range(len(me.vertices)) if di_badan[i] and me.vertices[i].co.z > self.ear_bot - 0.06]
        self.top = max(c.z for c in kepala)
        ab = [alis.matrix_world @ v.co for v in alis.data.vertices]
        self.alis_atas = max(c.z for c in ab)
        self.phi_tel = sorted(self._phi(c) for c in tel)
        self.phi_depan_tel = self.phi_tel[int(len(self.phi_tel) * 0.03)]
        self.phi_belakang_tel = self.phi_tel[int(len(self.phi_tel) * 0.97)]
        kd = KDTree(len(tel))
        for i, c in enumerate(tel):
            kd.insert(Vector((-c.x, c.y, c.z)), i)  # dicerminkan ke sisi +X juga lewat |x|
        kd.balance()
        self.kd_tel = kd
        fe, be = self.phi_depan_tel, self.phi_belakang_tel
        dahi = self.alis_atas + 0.060
        # Garis rambut H(phi): dahi -> pelipis mundur -> cambang di depan telinga -> di atas telinga -> tengkuk.
        self.tabel = [
            (0.0, dahi),
            (18.0, dahi + 0.002),
            (34.0, dahi + 0.012),
            (fe - 22.0, self.ear_top + 0.030),
            (fe - 9.0, self.ear_mid + 0.004),
            (fe - 2.0, self.ear_mid + 0.004),
            (fe + 4.0, self.ear_top + 0.006),
            (be - 4.0, self.ear_top + 0.004),
            (be + 14.0, self.ear_bot - 0.004),
            (180.0, self.ear_bot - 0.028),
        ]
        self.di_badan = di_badan

    def _phi(self, p):
        return math.degrees(math.atan2(abs(p.x), -(p.y - self.yc)))

    def garis(self, p):
        return _interp(self.tabel, self._phi(p))

    def kerapatan(self, p):
        """0..1: peluang tumbuh helai di titik p (tepi garis rambut memudar ±1 cm)."""
        h = self.garis(p)
        d = _smooth(h - 0.002, h + 0.011, p.z)
        if d <= 0:
            return 0.0
        q = Vector((abs(p.x), p.y, p.z))
        _, _, jarak = self.kd_tel.find(q)
        d *= _smooth(0.004, 0.012, jarak)
        return d

    def pelipis(self, p):
        """0..1: wilayah uban di pelipis & atas telinga (samping kepala, di bawah garis puncak), tepi lembut."""
        phi = self._phi(p)
        return _smooth(35.0, 55.0, phi) * _smooth(105.0, 88.0, phi) * _smooth(self.ear_top + 0.042, self.ear_top + 0.015, p.z)


def _segitiga_kepala(body, kk):
    me = body.data
    verts = [v.co.copy() for v in me.vertices]
    tri = []
    me.calc_loop_triangles()
    for lt in me.loop_triangles:
        vs = lt.vertices
        if not all(kk.di_badan[i] for i in vs):
            continue
        if min(verts[i].z for i in vs) < kk.ear_bot - 0.06:
            continue
        tri.append(tuple(vs))
    return verts, tri


def _arah_sisir(p, n, kk, part_x):
    """Medan arah sisiran (sebelum diproyeksikan ke bidang singgung)."""
    tinggi = _smooth(kk.zc + 0.035, kk.zc + 0.085, p.z)
    depan = _smooth(-0.02, -0.07, p.y - kk.yc)
    if p.x < part_x:
        atas = Vector((-1.0, 0.25 + 0.45 * (1 - depan) - 0.35 * depan, 0.0))
    else:
        atas = Vector((1.0, 0.35, 0.0))
    samping = Vector((0.0, 0.45, -1.0))
    return (atas * tinggi + samping * (1 - tinggi)).normalized()


def bangun_helai(body, alis, seed=7):
    """Menghasilkan daftar helai [(titik, uban)] untuk kedua gaya."""
    rnd = random.Random(seed)
    kk = KulitKepala(body, alis)
    verts, tri = _segitiga_kepala(body, kk)
    bvh = BVHTree.FromPolygons(verts, tri)
    part_x = 0.038  # belahan di sisi kiri karakter (+X)

    luas = []
    tot = 0.0
    for a, b, c in tri:
        ar = 0.5 * (verts[b] - verts[a]).cross(verts[c] - verts[a]).length
        tot += ar
        luas.append(tot)

    def ambil():
        r = rnd.random() * tot
        lo, hi = 0, len(luas) - 1
        while lo < hi:
            m = (lo + hi) // 2
            if luas[m] < r:
                lo = m + 1
            else:
                hi = m
        a, b, c = tri[lo]
        u, v = rnd.random(), rnd.random()
        if u + v > 1:
            u, v = 1 - u, 1 - v
        return verts[a] + (verts[b] - verts[a]) * u + (verts[c] - verts[a]) * v

    def dekat(q):
        loc, nor, _, _ = bvh.find_nearest(q)
        return loc, nor

    akar = []
    target = 52000
    coba = 0
    while len(akar) < target and coba < target * 12:
        coba += 1
        p = ambil()
        d = kk.kerapatan(p)
        if d <= 0 or rnd.random() > d:
            continue
        akar.append((p, d))

    def helai(p, d, segmen, panjang_kali=1.0, lapis=None):
        loc, n = dekat(p)
        tinggi = _smooth(kk.zc + 0.03, kk.zc + 0.085, loc.z)
        depan = _smooth(-0.03, -0.075, loc.y - kk.yc)
        belakang_bawah = _smooth(kk.zc + 0.01, kk.zc - 0.04, loc.z) * _smooth(100, 150, kk._phi(loc))
        L = (0.012 + (0.034 - 0.012) * tinggi + 0.008 * depan * tinggi - 0.005 * belakang_bawah) * panjang_kali
        L *= (0.45 + 0.55 * d) * rnd.uniform(0.82, 1.15)
        T = (0.0035 + 0.0085 * tinggi + 0.002 * depan * tinggi) * (lapis if lapis is not None else rnd.uniform(0.25, 1.0))
        F = _arah_sisir(loc, n, kk, part_x)
        sud = math.radians(rnd.gauss(0, 11))
        F = (F * math.cos(sud) + n.cross(F) * math.sin(sud)).normalized()
        titik = [loc - n * 0.0006]
        s = loc.copy()
        langkah = L / (segmen - 1)
        for k in range(1, segmen):
            Ft = (F - n * F.dot(n))
            Ft = (Ft + Vector((0, 0, -0.12 * tinggi - 0.25))).normalized() if k > 1 else Ft.normalized()
            Ft = (Ft - n * Ft.dot(n)).normalized()
            s, n = dekat(s + Ft * langkah)
            F = Ft
            u = k / (segmen - 1)
            angkat = T * min(1.0, u * 1.7) ** 0.7 + 0.0004
            g = Vector((rnd.gauss(0, 0.00035), rnd.gauss(0, 0.00035), rnd.gauss(0, 0.00035))) * u
            titik.append(s + n * angkat + g)
        return titik, kk.pelipis(loc)

    helai_halus = [helai(p, d, 6) for p, d in akar]

    # Gaya gumpal: helai tebal yang ujungnya menyatu ke pemandu gumpal terdekat.
    sampel = akar[::7]
    pemandu_idx = list(range(0, len(sampel), 18))
    pemandu = [helai(sampel[i][0], sampel[i][1], 7, panjang_kali=1.05, lapis=0.75) for i in pemandu_idx]
    kd = KDTree(len(pemandu))
    for i, (tt, _) in enumerate(pemandu):
        kd.insert(tt[0], i)
    kd.balance()
    gumpal = []
    for p, d in sampel:
        tt, ub = helai(p, d, 7, panjang_kali=1.05, lapis=rnd.uniform(0.5, 1.0))
        _, gi, jarak = kd.find(tt[0])
        g = pemandu[gi][0]
        if jarak > 0.02:
            gumpal.append((tt, ub))
            continue
        geser = tt[0] - g[0]
        baru = []
        for k, q in enumerate(tt):
            u = k / (len(tt) - 1)
            w = 0.85 * u ** 0.8
            baru.append(q.lerp(g[k] + geser * (1 - w), w))
        gumpal.append((baru, ub))
    return helai_halus, gumpal


def buat_objek(nama, helai, r_akar, r_ujung, rig, tulang="head"):
    cv = bpy.data.hair_curves.new(nama)
    ukuran = [len(h[0]) for h in helai]
    cv.add_curves(ukuran)
    pos = []
    rad = []
    for tt, _ in helai:
        m = len(tt) - 1
        for k, q in enumerate(tt):
            pos.extend((q.x, q.y, q.z))
            u = k / m
            rad.append(r_akar + (r_ujung - r_akar) * u ** 1.4)
    cv.attributes["position"].data.foreach_set("vector", pos)
    if "radius" not in cv.attributes:
        cv.attributes.new("radius", "FLOAT", "POINT")
    cv.attributes["radius"].data.foreach_set("value", rad)
    at = cv.attributes.new("uban", "FLOAT", "CURVE")
    at.data.foreach_set("value", [h[1] for h in helai])
    ob = bpy.data.objects.new(nama, cv)
    bpy.context.scene.collection.objects.link(ob)
    # Ikut tulang kepala (kaku), posisi dunia dipertahankan.
    ob.parent = rig
    ob.parent_type = "BONE"
    ob.parent_bone = tulang
    pb = rig.data.bones[tulang]
    M = rig.matrix_world @ pb.matrix_local @ Matrix.Translation((0, pb.length, 0))
    ob.matrix_parent_inverse = M.inverted()
    return ob


def masker_kulit_kepala(body, alis):
    """Atribut titik di mesh dasar: `kulit_kepala` (0..1, kulit di bawah rambut diwarnai rambut oleh bahan) dan
    `pelipis` (0..1, wilayah uban)."""
    kk = KulitKepala(body, alis)
    me = body.data
    nilai, pel = [], []
    for i, v in enumerate(me.vertices):
        if not kk.di_badan[i] or v.co.z < kk.ear_bot - 0.05:
            nilai.append(0.0)
            pel.append(0.0)
            continue
        h = kk.garis(v.co)
        nilai.append(_smooth(h - 0.004, h + 0.014, v.co.z) * min(1.0, kk.kerapatan(v.co) * 1.3 + 0.0))
        pel.append(kk.pelipis(v.co))
    for nama, isi in (("kulit_kepala", nilai), ("pelipis", pel)):
        at = me.attributes.get(nama) or me.attributes.new(nama, "FLOAT", "POINT")
        at.data.foreach_set("value", isi)


def buat_kumis(body, rig, tulang="head"):
    """Kumis rapi Pak Budi: pita tebal di atas bibir atas, dari sudut ke sudut mulut, ujung sedikit turun.
    Diproyeksikan ke kulit wajah (bentuk rest), ikut tulang kepala (kaku). Slot bahan "Kumis"."""
    me = body.data
    gi = body.vertex_groups["body"].index
    bibir = [i for i, s in enumerate(body.material_slots) if s.material and s.material.name.endswith("lips")]
    vb = set()
    for p in me.polygons:
        if p.material_index in bibir:
            vb.update(p.vertices)
    lip = [me.vertices[i].co for i in vb]
    tengah_z = sum(c.z for c in lip) / len(lip)
    atas = max((c for c in lip if abs(c.x) < 0.004), key=lambda c: c.z)  # puncak bibir atas, garis tengah
    sudut = max(abs(c.x) for c in lip)
    sudut_z = min((c for c in lip if abs(c.x) > sudut - 0.003), key=lambda c: abs(c.x - sudut)).z
    # Permukaan wajah depan (kulit saja) di sekitar mulut untuk proyeksi.
    verts = [v.co.copy() for v in me.vertices]
    di_badan = [any(g.group == gi and g.weight > 0.5 for g in v.groups) for v in me.vertices]
    me.calc_loop_triangles()
    tri = [tuple(lt.vertices) for lt in me.loop_triangles
           if all(di_badan[i] and abs(verts[i].z - tengah_z) < 0.06 and verts[i].y < atas.y + 0.05 for i in lt.vertices)]
    bvh = BVHTree.FromPolygons(verts, tri)
    lebar = sudut + 0.006
    kolom, baris = 17, 5
    grid = []
    for i in range(kolom):
        u = -1 + 2 * i / (kolom - 1)
        x = u * lebar
        bawah = atas.z - 0.0015 - (atas.z - sudut_z + 0.003) * abs(u) ** 1.8
        tinggi = 0.0105 * (1 - 0.6 * abs(u) ** 2.2)
        r = []
        for k in range(baris):
            z = bawah + tinggi * k / (baris - 1)
            hit, nor, _, _ = bvh.ray_cast(Vector((x, atas.y - 0.1, z)), Vector((0, 1, 0)))
            if hit is None:
                hit, nor, _, _ = bvh.find_nearest(Vector((x, atas.y, z)))
            nor = nor.normalized()
            if nor.y > 0:
                nor = -nor
            r.append(hit + nor * 0.0022)
        grid.append(r)
    kum = bpy.data.meshes.new("Kumis")
    bm = bmesh.new()
    vg = [[bm.verts.new(q) for q in r] for r in grid]
    for i in range(kolom - 1):
        for k in range(baris - 1):
            bm.faces.new((vg[i][k], vg[i + 1][k], vg[i + 1][k + 1], vg[i][k + 1]))
    bm.normal_update()
    bm.to_mesh(kum)
    bm.free()
    for p in kum.polygons:
        p.use_smooth = True
    ob = bpy.data.objects.new("Kumis", kum)
    bpy.context.scene.collection.objects.link(ob)
    tebal = ob.modifiers.new("Tebal", "SOLIDIFY")
    tebal.thickness = 0.003
    tebal.offset = 1
    halus = ob.modifiers.new("Halus", "SUBSURF")
    halus.levels = halus.render_levels = 2
    kum.materials.append(bpy.data.materials.get("Kumis") or bpy.data.materials.new("Kumis"))
    ob.parent = rig
    ob.parent_type = "BONE"
    ob.parent_bone = tulang
    pb = rig.data.bones[tulang]
    M = rig.matrix_world @ pb.matrix_local @ Matrix.Translation((0, pb.length, 0))
    ob.matrix_parent_inverse = M.inverted()
    return ob
