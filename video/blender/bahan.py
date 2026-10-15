"""Bahan "patung tanah liat" premium dan bagian kepala (mata, alis, rambut) untuk karakter Pak Budi.

Semua warna dalam ruang linear Blender; nilai hex brand dikonversi dari sRGB.
"""
import heapq
import os

import bmesh
import bpy
from mathutils import Vector


def hex_linear(h, a=1.0):
    h = h.lstrip("#")
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    lin = [x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c]
    return (*lin, a)


WARNA = {
    "kulit": "#BC8058",     # tanah liat pasir-terakota hangat (kontras dengan dinding)
    "kemeja": "#2F6A64",    # teal redup (turunan #0B4F4A)
    "celana": "#6E655E",    # abu hangat
    "rambut": "#35302C",    # tanah liat gelap
    "alis": "#2F2824",
    "sklera": "#E6DCCD",
    "iris": "#2A201B",
    "sepatu": "#4A3B31",
}


def bahan_tanah_liat(nama, hex_warna, kasar=0.62, sss=0.12, kilau=0.25, radius=(0.9, 0.55, 0.4)):
    m = bpy.data.materials.get(nama) or bpy.data.materials.new(nama)
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    p = nt.nodes.new("ShaderNodeBsdfPrincipled")
    p.inputs["Base Color"].default_value = hex_linear(hex_warna)
    p.inputs["Roughness"].default_value = kasar
    p.inputs["Specular IOR Level"].default_value = kilau
    p.inputs["Subsurface Weight"].default_value = sss
    p.inputs["Subsurface Radius"].default_value = radius
    p.inputs["Subsurface Scale"].default_value = 0.012
    # Tekstur halus "jejak jari" tanah liat: bump noise sangat lembut.
    noise = nt.nodes.new("ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = 180.0
    noise.inputs["Detail"].default_value = 4.0
    bump = nt.nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.035
    bump.inputs["Distance"].default_value = 0.002
    nt.links.new(noise.outputs["Fac"], bump.inputs["Height"])
    nt.links.new(bump.outputs["Normal"], p.inputs["Normal"])
    nt.links.new(p.outputs["BSDF"], out.inputs["Surface"])
    return m


def bahan_alfa(nama, hex_warna, obj_sumber, kuat=2.2):
    """Bahan gelap tanah liat yang tetap memakai alfa tekstur asli (alis, bulu mata); alfa diperkuat agar
    alis terbaca jelas (wajah tenang, tetap kontras untuk pendeteksi)."""
    gambar = None
    for slot in obj_sumber.material_slots:
        if slot.material and slot.material.use_nodes:
            for n in slot.material.node_tree.nodes:
                if n.type == "TEX_IMAGE" and n.image and "normal" not in n.image.name.lower():
                    gambar = n.image
                    break
    m = bahan_tanah_liat(nama, hex_warna, kasar=0.75, sss=0.0)
    if gambar is not None:
        nt = m.node_tree
        p = nt.nodes["Principled BSDF"]
        t = nt.nodes.new("ShaderNodeTexImage")
        t.image = gambar
        kali = nt.nodes.new("ShaderNodeMath")
        kali.operation = "MULTIPLY"
        kali.use_clamp = True
        kali.inputs[1].default_value = kuat
        nt.links.new(t.outputs["Alpha"], kali.inputs[0])
        nt.links.new(kali.outputs[0], p.inputs["Alpha"])
        m.surface_render_method = "DITHERED"
    return m


def ganti_bahan(obj, m):
    obj.data.materials.clear()
    obj.data.materials.append(m)


def pasang_tanah_liat(basemesh, pakaian, rig=None):
    # Tanpa subsurface: SSS EEVEE berbintik pada sampel rendah; kesan tanah liat dari kekasaran + bump.
    ganti_bahan(basemesh, bahan_tanah_liat("TanahLiat.Kulit", WARNA["kulit"], kasar=0.55, sss=0.0))
    for jenis, obj in pakaian:
        if jenis == "Clothes" and "shoes" in obj.name.lower():
            pasang_bahan_sepatu(obj)
        elif jenis == "Clothes":
            if rig is not None:
                potong_lengan(obj, rig)
                atur_kulit_tersembunyi(basemesh, rig)
            pasang_bahan_pakaian(obj)
        elif jenis in ("Eyebrows", "Eyelashes"):
            ganti_bahan(obj, bahan_alfa(f"TanahLiat.{jenis}", WARNA["alis"], obj))
        elif jenis == "Eyes":
            ganti_bahan(obj, bahan_mata(obj))


def atur_kulit_tersembunyi(basemesh, rig, batas=0.45):
    """MPFB menyembunyikan kulit di bawah pakaian (modifier MASK "Delete.*"). Kemeja kini berlengan pendek,
    jadi kulit lengan setelah `batas` panjang lengan atas dan seluruh lengan bawah/tangan dikeluarkan dari
    grup sembunyi; sebaliknya kulit paha dan betis (tertutup celana) ikut disembunyikan agar tidak
    menembus kain saat duduk."""
    tulang = {s: rig.data.bones[f"upperarm_{s}"] for s in ("l", "r")}
    nama = {vg.index: vg.name for vg in basemesh.vertex_groups}
    for mod in basemesh.modifiers:
        if mod.type != "MASK" or not mod.name.startswith("Delete.") or "shoes" in mod.name or not mod.vertex_group:
            continue
        vg = basemesh.vertex_groups[mod.vertex_group]
        keluar, masuk = [], []
        for v in basemesh.data.vertices:
            bobot = {nama[g.group]: g.weight for g in v.groups}
            kaki = sum(w for n, w in bobot.items() if n.startswith(("thigh", "calf")))
            if kaki >= 0.5 and 0.1 < v.co.z < 0.86 and "body" in bobot:
                masuk.append(v.index)
                continue
            if vg.name not in bobot:
                continue
            bawah = sum(w for n, w in bobot.items() if n.startswith(("lowerarm", "hand")))
            atas = sum(w for n, w in bobot.items() if n.startswith("upperarm"))
            if bawah + atas < 0.5:
                continue
            b = tulang["r" if v.co.x < 0 else "l"]
            sumbu = b.tail_local - b.head_local
            t = (v.co - b.head_local).dot(sumbu) / sumbu.length_squared
            if bawah >= 0.5 or t > batas:
                keluar.append(v.index)
        vg.remove(keluar)
        vg.add(masuk, 1.0, "REPLACE")


def pulau(me, ikut_uv=False):
    """Kelompokkan poligon per pulau: bagian lepas, atau (ikut_uv) pulau UV yang juga terpisah oleh seam.
    Mengembalikan daftar set indeks poligon."""
    bm = bmesh.new()
    bm.from_mesh(me)
    bm.faces.ensure_lookup_table()
    uv = bm.loops.layers.uv.active if ikut_uv else None

    def tersambung(e, f, g):
        if uv is None:
            return True
        a = {l.vert.index: l[uv].uv.copy() for l in f.loops if l.vert in e.verts}
        b = {l.vert.index: l[uv].uv.copy() for l in g.loops if l.vert in e.verts}
        return all((a[k] - b[k]).length < 1e-5 for k in a)

    sisa = set(range(len(bm.faces)))
    hasil = []
    while sisa:
        awal = sisa.pop()
        kumpul = {awal}
        tumpuk = [bm.faces[awal]]
        while tumpuk:
            f = tumpuk.pop()
            for e in f.edges:
                for g in e.link_faces:
                    if g.index in sisa and tersambung(e, f, g):
                        sisa.discard(g.index)
                        kumpul.add(g.index)
                        tumpuk.append(g)
        hasil.append(kumpul)
    bm.free()
    return hasil


def potong_lengan(obj, rig, batas=0.58):
    """Lengan kemeja dipendekkan: verteks lengan di luar `batas` panjang lengan atas dibuang (lengan pendek)."""
    me = obj.data
    tulang = {s: rig.data.bones[f"upperarm_{s}"] for s in ("l", "r")}
    grup = {vg.index: vg.name for vg in obj.vertex_groups}
    bm = bmesh.new()
    bm.from_mesh(me)
    deform = bm.verts.layers.deform.active
    hapus = []
    for v in bm.verts:
        if v.co.z < 0.9 or deform is None:
            continue
        bobot = {grup[i]: w for i, w in v[deform].items() if i in grup}
        lengan = sum(w for n, w in bobot.items() if n.startswith(("upperarm", "lowerarm", "hand")))
        if lengan < 0.5:
            continue
        sisi = "r" if v.co.x < 0 else "l"
        b = tulang[sisi]
        sumbu = (b.tail_local - b.head_local)
        t = (v.co - b.head_local).dot(sumbu) / sumbu.length_squared
        if t > batas:
            hapus.append(v)
    bmesh.ops.delete(bm, geom=hapus, context="VERTS")
    bm.to_mesh(me)
    bm.free()
    sol = obj.modifiers.new("TebalKain", "SOLIDIFY")
    sol.thickness = 0.003
    sol.offset = 1.0


def pasang_bahan_pakaian(obj):
    """Kemeja (bagian yang mencapai dada) teal redup, celana abu hangat, ikat pinggang gelap."""
    kemeja = bahan_tanah_liat("TanahLiat.Kemeja", WARNA["kemeja"], kasar=0.82, sss=0.0)
    celana = bahan_tanah_liat("TanahLiat.Celana", WARNA["celana"], kasar=0.85, sss=0.0)
    ikat = bahan_tanah_liat("TanahLiat.Ikat", "#4A3A30", kasar=0.5, sss=0.0)
    obj.data.materials.clear()
    for m in (kemeja, celana, ikat):
        obj.data.materials.append(m)
    me = obj.data
    for kumpul in pulau(me, ikut_uv=True):
        zs = [me.vertices[i].co.z for p in kumpul for i in me.polygons[p].vertices]
        # Pulau UV kemeja mencapai dada; pulau celana mencapai betis; sisanya (ikat pinggang, kancing) gelap.
        indeks = 0 if max(zs) > 1.0 else (1 if min(zs) < 0.6 else 2)
        for p in kumpul:
            me.polygons[p].material_index = indeks
        for p in kumpul:
            me.polygons[p].use_smooth = True


def pasang_bahan_sepatu(obj):
    """Sepatu rumah gelap; kaus kaki abu hangat."""
    kaus = bahan_tanah_liat("TanahLiat.Kaus", "#6E6660", kasar=0.9, sss=0.0)
    sepatu = bahan_tanah_liat("TanahLiat.Sepatu", WARNA["sepatu"], kasar=0.5, sss=0.0)
    obj.data.materials.clear()
    obj.data.materials.append(kaus)
    obj.data.materials.append(sepatu)
    me = obj.data
    for kumpul in pulau(me):
        zs = [me.vertices[i].co.z for p in kumpul for i in me.polygons[p].vertices]
        indeks = 0 if max(zs) - min(zs) > 0.1 and min(zs) > 0.02 else 1
        for p in kumpul:
            me.polygons[p].material_index = indeks


def bahan_mata(obj):
    """Mata tanah liat: luminans tekstur mata asli MakeHuman dipetakan ke sklera hangat dan iris gelap."""
    gambar = None
    for slot in obj.material_slots:
        if slot.material and slot.material.use_nodes:
            for n in slot.material.node_tree.nodes:
                if n.type == "TEX_IMAGE" and n.image and "normal" not in n.image.name.lower():
                    gambar = n.image
    if gambar is None:
        jalur = os.path.join(_data_mpfb(), "eyes", "materials", "brown_eye.png")
        gambar = bpy.data.images.load(jalur, check_existing=True)
    m = bpy.data.materials.get("TanahLiat.Mata") or bpy.data.materials.new("TanahLiat.Mata")
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    p = nt.nodes.new("ShaderNodeBsdfPrincipled")
    p.inputs["Roughness"].default_value = 0.3
    p.inputs["Coat Weight"].default_value = 0.5
    t = nt.nodes.new("ShaderNodeTexImage")
    t.image = gambar
    bw = nt.nodes.new("ShaderNodeRGBToBW")
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].position = 0.12
    ramp.color_ramp.elements[0].color = hex_linear(WARNA["iris"])
    ramp.color_ramp.elements[1].position = 0.45
    ramp.color_ramp.elements[1].color = hex_linear(WARNA["sklera"])
    nt.links.new(t.outputs["Color"], bw.inputs[0])
    nt.links.new(bw.outputs[0], ramp.inputs["Fac"])
    nt.links.new(ramp.outputs["Color"], p.inputs["Base Color"])
    nt.links.new(p.outputs["BSDF"], out.inputs["Surface"])
    return m


def _data_mpfb():
    from bl_ext.user_default.mpfb.services.locationservice import LocationService

    return LocationService.get_user_data()


# Garis rambut (koordinat pose istirahat MPFB, m): bidang dahi-pelipis miring z = Z_DAHI - KEMIRINGAN*(y - Y_DAHI)
# yang melewati atas telinga, lalu di belakang telinga (y > Y_TELINGA) rambut turun sampai tengkuk Z_TENGKUK.
# Potongan mesh sedikit lebih luas daripada garis rambut yang tampak: tepinya memudar (alfa + noise) sejauh
# LEBAR_PUDAR sehingga garis rambut alami, tidak bertepi tajam seperti helm.
Z_DAHI, Y_DAHI, KEMIRINGAN = 1.546, -0.13, 0.33
Y_TELINGA, Z_TENGKUK = -0.015, 1.425
LEBAR_PUDAR = 0.03
# Pelipis sedikit mundur (umur ~58): garis dahi naik di kiri-kanan, bentuk M yang lembut.
RESESI, X_RESESI, LEBAR_RESESI = 0.016, 0.05, 0.022


def _berambut(p):
    return p.z > Z_DAHI - KEMIRINGAN * (p.y - Y_DAHI) or (p.y > Y_TELINGA and p.z > Z_TENGKUK)


def _resesi(p):
    """0..1: seberapa jauh titik berada di atas garis dahi yang dinaikkan di pelipis (1 = jelas berambut)."""
    import math

    depan = min(1.0, max(0.0, (-p.y - 0.05) / 0.04))
    if depan <= 0.0:
        return 1.0
    naik = RESESI * math.exp(-(((abs(p.x) - X_RESESI) / LEBAR_RESESI) ** 2))
    batas = Z_DAHI - KEMIRINGAN * (p.y - Y_DAHI) + naik
    return 1.0 - depan * (1.0 - min(1.0, max(0.0, (p.z - batas) / 0.025 + 1.0)))


def buat_rambut(basemesh, rig):
    """Rambut pendek beruban (salt-and-pepper) "dipahat": kulit kepala dipotong tiga bidang, didorong keluar
    tipis (maks ±8 mm di puncak, sisi lebih tipis), dihaluskan, ikut bobot tulang kepala. Atribut `garis`
    (0 di tepi -> 1 di dalam) memudarkan tepi lewat alfa bernoise; `rest` = posisi istirahat untuk tekstur
    yang tidak bergeser saat kepala bergerak."""
    body = basemesh.vertex_groups["body"].index
    me = basemesh.data
    bm = bmesh.new()
    bm.from_mesh(me)
    deform = bm.verts.layers.deform.active
    hapus = [v for v in bm.verts if v.co.z < 1.40 or v[deform].get(body, 0.0) < 0.5]
    bmesh.ops.delete(bm, geom=hapus, context="VERTS")
    bidang = [
        ((0, Y_DAHI, Z_DAHI), Vector((0, KEMIRINGAN, 1)).normalized()),
        ((0, Y_TELINGA, 0), Vector((0, 1, 0))),
        ((0, 0, Z_TENGKUK), Vector((0, 0, 1))),
    ]
    for titik, normal in bidang:
        bmesh.ops.bisect_plane(bm, geom=bm.verts[:] + bm.edges[:] + bm.faces[:], plane_co=titik, plane_no=normal)
    buang = [f for f in bm.faces if not _berambut(f.calc_center_median())]
    bmesh.ops.delete(bm, geom=buang, context="FACES")
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if not v.link_faces], context="VERTS")
    bm.normal_update()
    # Jarak (sepanjang permukaan) ke garis rambut: rambut menipis rata dengan kulit di tepi, tidak seperti helm.
    bm.verts.index_update()

    jarak = {v: 0.0 for v in bm.verts if v.is_boundary}
    antre = [(0.0, v.index, v) for v in jarak]
    heapq.heapify(antre)
    while antre:
        d, _, v = heapq.heappop(antre)
        if d > jarak.get(v, 1e9):
            continue
        for e in v.link_edges:
            w = e.other_vert(v)
            nd = d + e.calc_length()
            if nd < jarak.get(w, 1e9):
                jarak[w] = nd
                heapq.heappush(antre, (nd, w.index, w))
    puncak = max(v.co.z for v in bm.verts)
    nilai_garis = [0.0] * len(bm.verts)
    nilai_rest = [0.0] * (3 * len(bm.verts))
    geser = []
    for v in bm.verts:
        tinggi = max(0.0, (v.co.z - 1.46) / (puncak - 1.46))
        tepi = min(1.0, jarak.get(v, 0.0) / LEBAR_PUDAR)
        nilai_garis[v.index] = tepi * _resesi(v.co)
        nilai_rest[3 * v.index:3 * v.index + 3] = v.co[:]
        landai = mulus_skalar(min(1.0, jarak.get(v, 0.0) / 0.04))
        tebal = 0.0004 + landai * (0.0022 + 0.0055 * tinggi ** 1.3)
        if v.co.y < -0.07:  # jambul depan sedikit naik, disisir ke belakang
            tebal += 0.0015 * tinggi * landai
        geser.append((v, v.normal * tebal))
    print("[rambut] verts", len(bm.verts), "jarak maks", round(max(jarak.values()), 4), "garis rata2", round(sum(nilai_garis) / len(nilai_garis), 3))
    for v, d in geser:
        v.co += d
    rumah = bpy.data.meshes.new("Rambut")
    bm.to_mesh(rumah)
    bm.free()
    rumah.attributes.new("garis", "FLOAT", "POINT").data.foreach_set("value", nilai_garis)
    rumah.attributes.new("rest", "FLOAT_VECTOR", "POINT").data.foreach_set("vector", nilai_rest)
    obj = bpy.data.objects.new("Rambut", rumah)
    basemesh.users_collection[0].objects.link(obj)
    obj.parent = rig
    obj.matrix_world = basemesh.matrix_world.copy()
    for vg in basemesh.vertex_groups:
        obj.vertex_groups.new(name=vg.name)
    arm = obj.modifiers.new("Armature", "ARMATURE")
    arm.object = rig
    sol = obj.modifiers.new("Tebal", "SOLIDIFY")
    sol.thickness = 0.003
    sol.offset = -1.0
    sol.use_rim = False
    sub = obj.modifiers.new("Halus", "SUBSURF")
    sub.levels = 1
    sub.render_levels = 2
    for p in rumah.polygons:
        p.use_smooth = True
    ganti_bahan(obj, bahan_rambut())
    obj.visible_shadow = True
    return obj


def mulus_skalar(t):
    t = max(0.0, min(1.0, t))
    return t * t * (3 - 2 * t)


def bahan_rambut():
    """Rambut beruban: dasar abu hangat, helai gelap & terang bercampur (noise memanjang searah sisiran),
    pelipis dan sisi bawah lebih abu, guratan sisir kuat; tepi memudar lewat alfa bernoise (atribut garis)."""
    m = bahan_tanah_liat("TanahLiat.Rambut", "#6E6862", kasar=0.6, sss=0.0, kilau=0.32)
    nt = m.node_tree
    L = nt.links.new
    p = nt.nodes["Principled BSDF"]
    bump = nt.nodes["Bump"]
    bump.inputs["Strength"].default_value = 0.3
    bump.inputs["Distance"].default_value = 0.0012
    rest = nt.nodes.new("ShaderNodeAttribute")
    rest.attribute_name = "rest"
    garis = nt.nodes.new("ShaderNodeAttribute")
    garis.attribute_name = "garis"
    # Helai: noise sangat memanjang searah Y (depan-belakang).
    mp = nt.nodes.new("ShaderNodeMapping")
    mp.inputs["Scale"].default_value = (650.0, 30.0, 650.0)
    L(rest.outputs["Vector"], mp.inputs["Vector"])
    helai = nt.nodes.new("ShaderNodeTexNoise")
    helai.inputs["Scale"].default_value = 1.0
    helai.inputs["Detail"].default_value = 6.0
    helai.inputs["Roughness"].default_value = 0.65
    L(mp.outputs["Vector"], helai.inputs["Vector"])
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].position = 0.4
    ramp.color_ramp.elements[0].color = hex_linear("#3E3631")
    ramp.color_ramp.elements[1].position = 0.68
    ramp.color_ramp.elements[1].color = hex_linear("#A9A39C")
    tengah = ramp.color_ramp.elements.new(0.53)
    tengah.color = hex_linear("#6E6862")
    L(helai.outputs["Fac"], ramp.inputs["Fac"])
    # Pelipis/sisi bawah lebih abu: mask = clamp((|x|-0.04)/0.03) * clamp((1.63-z)/0.08).
    sep = nt.nodes.new("ShaderNodeSeparateXYZ")
    L(rest.outputs["Vector"], sep.inputs[0])

    def math_node(op, a, b=None, clamp=False):
        n = nt.nodes.new("ShaderNodeMath")
        n.operation = op
        n.use_clamp = clamp
        for i, v in enumerate((a, b)):
            if v is None:
                continue
            if isinstance(v, (int, float)):
                n.inputs[i].default_value = v
            else:
                L(v, n.inputs[i])
        return n.outputs[0]

    ax = math_node("ABSOLUTE", sep.outputs["X"])
    sisi = math_node("MULTIPLY", math_node("SUBTRACT", ax, 0.04), 1 / 0.03, clamp=True)
    bawah = math_node("MULTIPLY", math_node("SUBTRACT", 1.63, sep.outputs["Z"]), 1 / 0.08, clamp=True)
    uban = math_node("MULTIPLY", math_node("MULTIPLY", sisi, bawah), 0.4)
    campur = nt.nodes.new("ShaderNodeMix")
    campur.data_type = "RGBA"
    campur.inputs["B"].default_value = hex_linear("#A39D96")
    L(uban, campur.inputs["Factor"])
    L(ramp.outputs["Color"], campur.inputs["A"])
    L(campur.outputs["Result"], p.inputs["Base Color"])
    # Guratan sisir: pita gelombang searah depan-belakang + helai halus.
    w = nt.nodes.new("ShaderNodeTexWave")
    w.wave_type = "BANDS"
    w.bands_direction = "X"
    w.inputs["Scale"].default_value = 220.0
    w.inputs["Distortion"].default_value = 2.0
    w.inputs["Detail Scale"].default_value = 2.0
    L(rest.outputs["Vector"], w.inputs["Vector"])
    tinggi = math_node("ADD", math_node("MULTIPLY", w.outputs["Fac"], 0.75), math_node("MULTIPLY", helai.outputs["Fac"], 0.25))
    L(tinggi, bump.inputs["Height"])
    # Tepi memudar: alfa = smoothstep(garis + noise) -> garis rambut alami, tidak bertepi tajam.
    nt_tepi = nt.nodes.new("ShaderNodeTexNoise")
    nt_tepi.inputs["Scale"].default_value = 140.0
    nt_tepi.inputs["Detail"].default_value = 3.0
    L(rest.outputs["Vector"], nt_tepi.inputs["Vector"])
    acak = math_node("MULTIPLY", math_node("SUBTRACT", nt_tepi.outputs["Fac"], 0.5), 0.5)
    alfa = nt.nodes.new("ShaderNodeMapRange")
    alfa.interpolation_type = "SMOOTHSTEP"
    alfa.inputs["From Min"].default_value = 0.12
    alfa.inputs["From Max"].default_value = 0.55
    L(math_node("ADD", garis.outputs["Fac"], acak), alfa.inputs["Value"])
    L(alfa.outputs["Result"], p.inputs["Alpha"])
    m.surface_render_method = "DITHERED"
    return m
