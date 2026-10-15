"""Sudut rumah Indonesia yang tenang dan minimal untuk Pak Budi: kursi kayu bersandaran, meja kecil
rendah, tumpukan buku + dudukan ponsel, jendela kiri depan, tanaman pot, keranjang rotan, dinding
netral bernuansa teal dengan aksen warna brand. Semua dibangun dari primitif (tanpa aset luar).
"""
import math

import bpy
from mathutils import Vector

from bahan import bahan_tanah_liat, hex_linear

# Posisi ponsel (kamera depan) relatif terhadap karakter yang duduk di titik asal menghadap -Y.
PONSEL_POS = Vector((0.0, -1.02, 0.86))
PONSEL_UKURAN = (0.0752, 0.0085, 0.1612)  # lebar, tebal, tinggi (rasio 9:20 + bingkai)
LAYAR_UKURAN = (0.0700, 0.1555)  # area layar 1080x2400 (9:20)

BRAND = {"primer": "#0B4F4A", "terang": "#EAF2F0", "aksen": "#C46A1B", "teks": "#1A2B2E"}


def koleksi(nama):
    k = bpy.data.collections.get(nama)
    if not k:
        k = bpy.data.collections.new(nama)
        bpy.context.scene.collection.children.link(k)
    return k


def kotak(nama, ukuran, lokasi, bahan, kol, miring=0.0, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(size=1, location=lokasi, rotation=rot)
    o = bpy.context.active_object
    o.name = nama
    o.scale = ukuran
    bpy.ops.object.transform_apply(scale=True)
    if miring:
        m = o.modifiers.new("Bevel", "BEVEL")
        m.width = miring
        m.segments = 3
        m.limit_method = "ANGLE"
    o.data.materials.append(bahan)
    for p in o.data.polygons:
        p.use_smooth = True
    pindah(o, kol)
    return o


def silinder(nama, r, h, lokasi, bahan, kol, verts=48, rot=(0, 0, 0), miring=0.0):
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=r, depth=h, location=lokasi, rotation=rot)
    o = bpy.context.active_object
    o.name = nama
    if miring:
        m = o.modifiers.new("Bevel", "BEVEL")
        m.width = miring
        m.segments = 3
        m.limit_method = "ANGLE"
    o.data.materials.append(bahan)
    for p in o.data.polygons:
        p.use_smooth = True
    pindah(o, kol)
    return o


def pindah(o, kol):
    for c in list(o.users_collection):
        c.objects.unlink(o)
    kol.objects.link(o)


def bahan_kayu(nama, hex_a, hex_b, skala=(1.0, 12.0, 1.0)):
    m = bpy.data.materials.get(nama) or bpy.data.materials.new(nama)
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    p = nt.nodes.new("ShaderNodeBsdfPrincipled")
    p.inputs["Roughness"].default_value = 0.55
    p.inputs["Coat Weight"].default_value = 0.0
    tc = nt.nodes.new("ShaderNodeTexCoord")
    mp = nt.nodes.new("ShaderNodeMapping")
    mp.inputs["Scale"].default_value = skala
    w = nt.nodes.new("ShaderNodeTexWave")
    w.wave_type = "BANDS"
    w.inputs["Scale"].default_value = 2.5
    w.inputs["Distortion"].default_value = 3.0
    w.inputs["Detail"].default_value = 3.0
    r = nt.nodes.new("ShaderNodeValToRGB")
    r.color_ramp.elements[0].color = hex_linear(hex_a)
    r.color_ramp.elements[1].color = hex_linear(hex_b)
    nt.links.new(tc.outputs["Object"], mp.inputs["Vector"])
    nt.links.new(mp.outputs["Vector"], w.inputs["Vector"])
    nt.links.new(w.outputs["Fac"], r.inputs["Fac"])
    nt.links.new(r.outputs["Color"], p.inputs["Base Color"])
    nt.links.new(p.outputs["BSDF"], out.inputs["Surface"])
    return m


def bahan_rotan(nama="Rotan"):
    m = bpy.data.materials.get(nama) or bpy.data.materials.new(nama)
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    p = nt.nodes.new("ShaderNodeBsdfPrincipled")
    p.inputs["Roughness"].default_value = 0.7
    tc = nt.nodes.new("ShaderNodeTexCoord")
    # Anyaman: dua gelombang tegak lurus dikalikan (pola kotak-kotak lembut) -> warna + bump.
    sep = nt.nodes.new("ShaderNodeSeparateXYZ")
    nt.links.new(tc.outputs["Object"], sep.inputs[0])
    sudut = nt.nodes.new("ShaderNodeMath")
    sudut.operation = "ARCTAN2"
    nt.links.new(sep.outputs["X"], sudut.inputs[0])
    nt.links.new(sep.outputs["Y"], sudut.inputs[1])
    a = nt.nodes.new("ShaderNodeMath")
    a.operation = "SINE"
    ka = nt.nodes.new("ShaderNodeMath")
    ka.operation = "MULTIPLY"
    ka.inputs[1].default_value = 40.0
    nt.links.new(sudut.outputs[0], ka.inputs[0])
    kz = nt.nodes.new("ShaderNodeMath")
    kz.operation = "MULTIPLY"
    kz.inputs[1].default_value = 140.0
    nt.links.new(sep.outputs["Z"], kz.inputs[0])
    tambah = nt.nodes.new("ShaderNodeMath")
    tambah.operation = "ADD"
    nt.links.new(ka.outputs[0], tambah.inputs[0])
    nt.links.new(kz.outputs[0], tambah.inputs[1])
    nt.links.new(tambah.outputs[0], a.inputs[0])
    b = nt.nodes.new("ShaderNodeMath")
    b.operation = "SINE"
    kur = nt.nodes.new("ShaderNodeMath")
    kur.operation = "SUBTRACT"
    nt.links.new(ka.outputs[0], kur.inputs[0])
    nt.links.new(kz.outputs[0], kur.inputs[1])
    nt.links.new(kur.outputs[0], b.inputs[0])
    kali = nt.nodes.new("ShaderNodeMath")
    kali.operation = "MULTIPLY"
    nt.links.new(a.outputs[0], kali.inputs[0])
    nt.links.new(b.outputs[0], kali.inputs[1])
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].color = hex_linear("#9A7448")
    ramp.color_ramp.elements[1].color = hex_linear("#D2AE7C")
    ramp.color_ramp.elements[0].position = 0.35
    nt.links.new(kali.outputs[0], ramp.inputs["Fac"])
    nt.links.new(ramp.outputs["Color"], p.inputs["Base Color"])
    bump = nt.nodes.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.5
    bump.inputs["Distance"].default_value = 0.004
    nt.links.new(kali.outputs[0], bump.inputs["Height"])
    nt.links.new(bump.outputs["Normal"], p.inputs["Normal"])
    nt.links.new(p.outputs["BSDF"], out.inputs["Surface"])
    return m


def _simpul(nt, jenis, **masukan):
    n = nt.nodes.new(jenis)
    for k, v in masukan.items():
        n.inputs[k].default_value = v
    return n


def bahan_lantai(nama="LantaiPapan"):
    """Papan kayu bersih kontras rendah: tekstur bata = papan memanjang searah X dengan nat tipis,
    serat halus memanjang, sedikit coat."""
    m = bpy.data.materials.get(nama) or bpy.data.materials.new(nama)
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    L = nt.links.new
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    p = _simpul(nt, "ShaderNodeBsdfPrincipled", Roughness=0.52)
    p.inputs["Coat Weight"].default_value = 0.12
    tc = nt.nodes.new("ShaderNodeTexCoord")
    bata = _simpul(nt, "ShaderNodeTexBrick", Scale=1.0, **{"Mortar Size": 0.0016, "Mortar Smooth": 0.4, "Bias": 0.0,
                                                          "Brick Width": 1.25, "Row Height": 0.16})
    bata.offset = 0.5
    bata.offset_frequency = 2
    bata.inputs["Color1"].default_value = hex_linear("#A07E5E")
    bata.inputs["Color2"].default_value = hex_linear("#977454")
    bata.inputs["Mortar"].default_value = hex_linear("#76583F")
    L(tc.outputs["Object"], bata.inputs["Vector"])
    mp = _simpul(nt, "ShaderNodeMapping")
    mp.inputs["Scale"].default_value = (2.0, 70.0, 70.0)
    L(tc.outputs["Object"], mp.inputs["Vector"])
    serat = _simpul(nt, "ShaderNodeTexNoise", Scale=1.0, Detail=5.0)
    L(mp.outputs["Vector"], serat.inputs["Vector"])
    kali = nt.nodes.new("ShaderNodeMix")
    kali.data_type = "RGBA"
    kali.blend_type = "MULTIPLY"
    kali.inputs["Factor"].default_value = 0.12
    L(bata.outputs["Color"], kali.inputs["A"])
    L(serat.outputs["Color"], kali.inputs["B"])
    L(kali.outputs["Result"], p.inputs["Base Color"])
    bump = _simpul(nt, "ShaderNodeBump", Strength=0.12, Distance=0.002)
    L(bata.outputs["Fac"], bump.inputs["Height"])
    L(bump.outputs["Normal"], p.inputs["Normal"])
    L(p.outputs["BSDF"], out.inputs["Surface"])
    return m


def bahan_dinding(nama, hex_warna):
    """Dinding tanah liat dengan gradasi cahaya lembut: lebih gelap & sedikit sejuk ke arah plafon, plus
    ketidakrataan sangat besar (noise) agar tidak datar seperti latar studio."""
    m = bahan_tanah_liat(nama, hex_warna, kasar=0.9, sss=0.0, kilau=0.1)
    nt = m.node_tree
    L = nt.links.new
    p = nt.nodes["Principled BSDF"]
    geo = nt.nodes.new("ShaderNodeNewGeometry")
    sep = nt.nodes.new("ShaderNodeSeparateXYZ")
    L(geo.outputs["Position"], sep.inputs[0])
    naik = _simpul(nt, "ShaderNodeMapRange", **{"From Min": 0.9, "From Max": 3.1})
    naik.interpolation_type = "SMOOTHSTEP"
    L(sep.outputs["Z"], naik.inputs["Value"])
    gradasi = nt.nodes.new("ShaderNodeMix")
    gradasi.data_type = "RGBA"
    gradasi.inputs["A"].default_value = hex_linear(hex_warna)
    r, g, b, _ = hex_linear(hex_warna)
    gradasi.inputs["B"].default_value = (r * 0.62, g * 0.66, b * 0.7, 1.0)
    L(naik.outputs["Result"], gradasi.inputs["Factor"])
    awan = _simpul(nt, "ShaderNodeTexNoise", Scale=0.7, Detail=2.0)
    L(geo.outputs["Position"], awan.inputs["Vector"])
    rata = nt.nodes.new("ShaderNodeMix")
    rata.data_type = "RGBA"
    rata.blend_type = "OVERLAY"
    rata.inputs["Factor"].default_value = 0.1
    L(gradasi.outputs["Result"], rata.inputs["A"])
    L(awan.outputs["Color"], rata.inputs["B"])
    L(rata.outputs["Result"], p.inputs["Base Color"])
    return m


def bahan_karpet(nama, hex_warna, skala=260.0):
    """Karpet anyam: tanah liat kasar dengan anyaman halus (dua gelombang tegak lurus) sebagai bump."""
    m = bahan_tanah_liat(nama, hex_warna, kasar=0.95, sss=0.0, kilau=0.05)
    nt = m.node_tree
    L = nt.links.new
    tc = nt.nodes.new("ShaderNodeTexCoord")
    tambah = _simpul(nt, "ShaderNodeMath")
    tambah.operation = "MULTIPLY"
    for arah in ("X", "Y"):
        w = _simpul(nt, "ShaderNodeTexWave", Scale=skala, Distortion=0.6)
        w.wave_type = "BANDS"
        w.bands_direction = arah
        L(tc.outputs["Object"], w.inputs["Vector"])
        L(w.outputs["Fac"], tambah.inputs[0 if arah == "X" else 1])
    bump = nt.nodes["Bump"]
    bump.inputs["Strength"].default_value = 0.35
    L(tambah.outputs[0], bump.inputs["Height"])
    return m


def bahan_tirai(nama="Tirai"):
    """Tirai tipis krem: tembus cahaya (translucent) dicampur principled, sedikit transparan."""
    m = bpy.data.materials.get(nama) or bpy.data.materials.new(nama)
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    L = nt.links.new
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    p = _simpul(nt, "ShaderNodeBsdfPrincipled", Roughness=0.8, Alpha=0.88)
    p.inputs["Base Color"].default_value = hex_linear("#F1EADF")
    tr = nt.nodes.new("ShaderNodeBsdfTranslucent")
    tr.inputs["Color"].default_value = hex_linear("#FBF3E6")
    mix = _simpul(nt, "ShaderNodeMixShader", Fac=0.45)
    L(p.outputs[0], mix.inputs[1])
    L(tr.outputs[0], mix.inputs[2])
    L(mix.outputs[0], out.inputs["Surface"])
    m.surface_render_method = "DITHERED"
    return m


def bahan_cahaya_luar(nama="CahayaLuar", kekuatan=2.2):
    """Kaca jendela: siang terang di luar (emisi hangat), tidak memberi bayangan."""
    m = bpy.data.materials.get(nama) or bpy.data.materials.new(nama)
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    em = nt.nodes.new("ShaderNodeEmission")
    em.inputs["Color"].default_value = hex_linear("#FFF3E2")
    em.inputs["Strength"].default_value = kekuatan
    nt.links.new(em.outputs[0], out.inputs["Surface"])
    return m


def jendela(kol, pusat=Vector((2.55, -1.3, 1.45)), lebar=1.3, tinggi=1.45):
    """Jendela di dinding kiri karakter (sumber cahaya kunci): kusen putih, kaca terang, tirai tipis terbuka."""
    cat = bahan_tanah_liat("KusenCat", "#ECE6DC", kasar=0.55, sss=0.0)
    bpy.ops.mesh.primitive_plane_add(size=1, location=pusat + Vector((-0.008, 0, 0)), rotation=(0, math.radians(90), 0))
    kaca = bpy.context.active_object
    kaca.name = "Jendela.Kaca"
    kaca.scale = (tinggi, lebar, 1)
    kaca.data.materials.append(bahan_cahaya_luar())
    kaca.visible_shadow = False
    pindah(kaca, kol)
    t = 0.06
    for nama, ukuran, d in (("Atas", (t, lebar + 2 * t, t), (0, 0, tinggi / 2 + t / 2)), ("Bawah", (0.12, lebar + 2 * t, t), (-0.03, 0, -tinggi / 2 - t / 2)),
                            ("Kiri", (t, t, tinggi), (0, -lebar / 2 - t / 2, 0)), ("Kanan", (t, t, tinggi), (0, lebar / 2 + t / 2, 0)),
                            ("Tengah", (t, 0.035, tinggi), (0, 0, 0)), ("Palang", (t, lebar, 0.035), (0, 0, tinggi * 0.18))):
        o = kotak(f"Jendela.{nama}", ukuran, pusat + Vector(d), cat, kol, miring=0.004)
        o.visible_shadow = False
    tirai = bahan_tirai()
    for i, s in enumerate((-1, 1)):
        bpy.ops.mesh.primitive_plane_add(size=1, location=(0, 0, 0))
        o = bpy.context.active_object
        o.name = f"Tirai{i}"
        bpy.ops.object.mode_set(mode="EDIT")
        bpy.ops.mesh.subdivide(number_cuts=40)
        bpy.ops.object.mode_set(mode="OBJECT")
        for v in o.data.vertices:
            y, z = v.co.x * 0.42, (v.co.y + 0.5) * 2.35
            v.co = Vector((0.025 * math.sin(y * 52 + 0.3 * z) * (0.6 + 0.4 * (y / 0.42 + 0.5)), y, z))
        o.location = pusat + Vector((-0.1, s * (lebar / 2 + 0.12), -tinggi / 2 - 0.55))
        o.data.materials.append(tirai)
        for p in o.data.polygons:
            p.use_smooth = True
        o.visible_shadow = False
        pindah(o, kol)
    batang = silinder("Jendela.Batang", 0.012, lebar + 0.9, pusat + Vector((-0.1, 0, tinggi / 2 + 0.22)), bahan_tanah_liat("Batang", "#5A4636", kasar=0.4, sss=0.0),
                      kol, verts=16, rot=(math.radians(90), 0, 0))
    batang.visible_shadow = False


def perabot_tambahan(kol, kayu):
    """Isi sisi ruangan yang terlihat kamera lebar/afasia: bufet rendah + vas + bingkai di dinding depan,
    tanaman tinggi dekat jendela, rak kecil berbuku di dinding kanan."""
    kotak("Bufet", (1.1, 0.4, 0.62), (-0.75, -2.63, 0.31), kayu, kol, miring=0.01)
    for i, x in enumerate((-1.02, -0.48)):
        kotak(f"Bufet.Pintu{i}", (0.5, 0.01, 0.5), (x, -2.427, 0.33), kayu, kol, miring=0.004)
    vas = silinder("Vas", 0.07, 0.24, (-0.98, -2.6, 0.74), bahan_tanah_liat("Vas", "#C9B79C", kasar=0.6, sss=0.0), kol, verts=32, miring=0.02)
    vas.modifiers.new("Halus", "SUBSURF").levels = 2
    warna = (BRAND["primer"], "#E8DCC4", "#C9D8D4")
    for i, (w, t) in enumerate(((0.26, 0.04), (0.24, 0.035), (0.22, 0.03))):
        kotak(f"BufetBuku{i}", (w, 0.18, t), (-0.45, -2.62, 0.62 + 0.002 + sum((0.04, 0.035, 0.03)[:i]) + t / 2),
              bahan_tanah_liat(f"BufetBuku{i}", warna[i], kasar=0.7, sss=0.0), kol, miring=0.003, rot=(0, 0, math.radians((3, -2, 5)[i])))
    kotak("BingkaiDepan", (0.7, 0.02, 0.5), (-0.75, -2.84, 1.55), bahan_tanah_liat("BingkaiDepan", "#E4DDD0", kasar=0.6, sss=0.0), kol, miring=0.006)
    kotak("BingkaiDepanIsi", (0.6, 0.01, 0.4), (-0.75, -2.83, 1.55), bahan_tanah_liat("BingkaiDepanIsi", "#B9805A", kasar=0.8, sss=0.0), kol)
    tanaman(Vector((1.2, -2.6, 0.0)), kol, skala=1.15, nama="TanamanTinggi")
    kotak("Rak", (0.22, 0.9, 0.025), (-2.04, -0.9, 1.25), kayu, kol, miring=0.004)
    for i in range(6):
        tinggi_b = 0.17 + 0.03 * ((i * 7) % 3)
        kotak(f"RakBuku{i}", (0.16, 0.035, tinggi_b), (-2.05, -1.22 + i * 0.045, 1.2625 + tinggi_b / 2),
              bahan_tanah_liat(f"RakBuku{i}", ("#2F6A64", "#E8DCC4", "#B9805A", "#C9D8D4", "#6E655E", "#0B4F4A")[i], kasar=0.7, sss=0.0), kol, miring=0.003)


def buku(nama, w, d, t, pusat, sudut, warna, kol):
    """Buku tergeletak: sampul atas/bawah sedikit lebih lebar dari blok halaman krem (tepi halaman terlihat
    di tiga sisi), punggung membulat di sisi -X. Semua bagian berawalan `nama` (shot kertas menyembunyikannya)."""
    from mathutils import Matrix

    rot = Matrix.Rotation(sudut, 4, "Z")
    sampul = bahan_tanah_liat(nama + ".Sampul", warna, kasar=0.6, sss=0.0)
    halaman = bahan_tanah_liat("HalamanBuku", "#EFE6D2", kasar=0.85, sss=0.0)
    tebal_s = 0.0025
    bagian = (
        (".Halaman", (w - 0.008, d - 0.008, t - 2 * tebal_s), (0.003, 0, 0), halaman, 0.001),
        (".Atas", (w, d, tebal_s), (0, 0, t / 2 - tebal_s / 2), sampul, 0.001),
        (".Bawah", (w, d, tebal_s), (0, 0, -t / 2 + tebal_s / 2), sampul, 0.001),
        (".Punggung", (0.008, d, t), (-w / 2 + 0.004, 0, 0), sampul, min(0.0039, t / 2 - 0.0005)),
    )
    for akhir, ukuran, geser, bahan, miring in bagian:
        kotak(nama + akhir, ukuran, pusat + rot @ Vector(geser), bahan, kol, miring=miring, rot=(0, 0, sudut))


def karpet(kol, pusat=Vector((0.0, -0.47, 0.0))):
    """Karpet anyam lembut di bawah kursi dan meja: tepi teal redup, tengah krem."""
    kotak("Karpet.Tepi", (1.55, 1.95, 0.012), pusat + Vector((0, 0, 0.006)), bahan_karpet("KarpetTepi", "#5E8A84"), kol, miring=0.005)
    kotak("Karpet.Tengah", (1.33, 1.73, 0.004), pusat + Vector((0, 0, 0.0135)), bahan_karpet("KarpetTengah", "#D9CCB4"), kol, miring=0.0015)


def bangun_ruang(ponsel=PONSEL_POS, balik=False):
    """Ruang + kursi + meja di bawah `ponsel` (posisi tengah ponsel). `balik`: layar menghadap -Y (ke penonton)."""
    kol = koleksi("Ruang")
    dinding = bahan_dinding("Dinding", "#BFCBC6")
    dinding_aksen = bahan_dinding("DindingAksen", "#A5BCB5")
    lantai = bahan_lantai()
    kayu = bahan_kayu("KayuJati", "#6B4428", "#8A5A36")
    kayu_meja = bahan_kayu("KayuMeja", "#7A5034", "#9A6A44")

    # Lantai & dinding (sudut ruangan: dinding belakang + dinding kanan karakter).
    kotak("Lantai", (8, 8, 0.02), (0, 0, -0.01), lantai, kol)
    kotak("DindingBelakang", (8, 0.1, 3.2), (0, 1.35, 1.6), dinding, kol)
    kotak("PanelAksen", (1.2, 0.02, 2.2), (1.4, 1.29, 1.1), dinding_aksen, kol, miring=0.004)
    kotak("Plint", (8, 0.03, 0.08), (0, 1.29, 0.04), bahan_tanah_liat("Plint", "#D9D2C6", kasar=0.6, sss=0.0), kol)
    kotak("DindingKanan", (0.1, 8, 3.2), (-2.2, 0, 1.6), dinding, kol)
    # Dinding depan & kiri menutup ruangan untuk kamera samping; tidak membayangi cahaya jendela/matahari.
    for nama, ukuran, pos in (("DindingDepan", (8, 0.1, 3.2), (0, -2.9, 1.6)), ("DindingKiri", (0.1, 8, 3.2), (2.6, 0, 1.6))):
        o = kotak(nama, ukuran, pos, dinding, kol)
        o.visible_shadow = False

    # Kursi kayu bersandaran (dudukan atas z=0.415, karakter di titik asal).
    k = Vector((0.0, 0.08, 0.0))
    kotak("Kursi.Dudukan", (0.48, 0.46, 0.035), k + Vector((0, 0, 0.40)), kayu, kol, miring=0.008)
    for i, (x, y) in enumerate(((-0.21, -0.2), (0.21, -0.2), (-0.21, 0.2), (0.21, 0.2))):
        tinggi = 0.40 if y < 0 else 0.98
        kotak(f"Kursi.Kaki{i}", (0.035, 0.035, tinggi), k + Vector((x, y, tinggi / 2)), kayu, kol, miring=0.006)
    for i, z in enumerate((0.62, 0.78, 0.94)):
        kotak(f"Kursi.Sandaran{i}", (0.44, 0.022, 0.06 if i < 2 else 0.09), k + Vector((0, 0.2, z)), kayu, kol, miring=0.006)
    kotak("Kursi.Palang", (0.42, 0.02, 0.025), k + Vector((0, -0.2, 0.12)), kayu, kol, miring=0.004)

    # Meja kecil rendah di bawah ponsel; buku ditumpuk secukupnya, lalu dudukan ponsel.
    mj = Vector((ponsel.x, ponsel.y, 0.0))
    kotak("Meja.Atas", (0.62, 0.42, 0.03), mj + Vector((0, 0, 0.585)), kayu_meja, kol, miring=0.008)
    for i, (x, y) in enumerate(((-0.27, -0.17), (0.27, -0.17), (-0.27, 0.17), (0.27, 0.17))):
        kotak(f"Meja.Kaki{i}", (0.03, 0.03, 0.57), mj + Vector((x, y, 0.285)), kayu_meja, kol, miring=0.005)
    warna_buku = [BRAND["primer"], "#E8DCC4", BRAND["aksen"], "#C9D8D4"]
    bawah_ponsel = ponsel.z - PONSEL_UKURAN[2] / 2
    z = 0.60
    for i, (w, t) in enumerate(((0.24, 0.035), (0.22, 0.028), (0.2, 0.03), (0.18, 0.025))):
        if z + t > bawah_ponsel - 0.03:
            break
        buku(f"Buku{i}", w, 0.16, t, mj + Vector((0.008 * (-1) ** i, 0.02 + 0.006 * (i % 3 - 1), z + t / 2)),
             math.radians((-4, 3, -2, 5)[i]), warna_buku[i], kol)
        z += t
    # Dudukan ponsel sederhana (tanah liat teal tua): alas + bibir di depan layar + sandaran di belakang.
    teal = bahan_tanah_liat("Dudukan", BRAND["primer"], kasar=0.5, sss=0.0)
    s = -1.0 if balik else 1.0
    tinggi_alas = bawah_ponsel - z
    kotak("Dudukan.Alas", (0.11, 0.09, tinggi_alas), Vector((ponsel.x, ponsel.y - 0.012 * s, z + tinggi_alas / 2)), teal, kol, miring=0.006)
    kotak("Dudukan.Bibir", (0.11, 0.012, 0.008), Vector((ponsel.x, ponsel.y + (PONSEL_UKURAN[1] / 2 + 0.007) * s, bawah_ponsel + 0.001)), teal, kol, miring=0.003)
    kotak("Dudukan.Sandaran", (0.08, 0.014, 0.11), Vector((ponsel.x, ponsel.y - (PONSEL_UKURAN[1] / 2 + 0.008) * s, bawah_ponsel + 0.05)), teal, kol, miring=0.005)

    # Tanaman pot (kanan belakang dari sudut pandang kamera) & keranjang rotan.
    tanaman(Vector((0.85, 0.85, 0.0)), kol)
    keranjang = silinder("KeranjangRotan", 0.17, 0.26, (-0.72, 0.75, 0.13), bahan_rotan(), kol, verts=64, miring=0.01)
    keranjang.modifiers.new("Halus", "SUBSURF").levels = 1
    # Bingkai kecil di dinding (aksen brand) dan rak tipis.
    # Rak dinding kecil di kiri karakter (sudut A): buku + vas kecil, mengisi dinding belakang.
    kotak("RakBelakang", (0.6, 0.18, 0.025), (-1.15, 1.2, 1.38), kayu, kol, miring=0.004)
    for i, (w, t, c) in enumerate(((0.03, 0.2, "#2F6A64"), (0.035, 0.18, "#E8DCC4"), (0.03, 0.22, "#B9805A"), (0.04, 0.17, "#6E655E"))):
        kotak(f"RakBelakangBuku{i}", (w, 0.14, t), (-1.38 + i * 0.042, 1.2, 1.3925 + t / 2), bahan_tanah_liat(f"RakBelakangBuku{i}", c, kasar=0.7, sss=0.0), kol, miring=0.003)
    vas_kecil = silinder("VasKecil", 0.045, 0.14, (-0.98, 1.2, 1.4625), bahan_tanah_liat("VasKecil", "#C9B79C", kasar=0.6, sss=0.0), kol, verts=32, miring=0.015)
    vas_kecil.modifiers.new("Halus", "SUBSURF").levels = 2
    kotak("Bingkai", (0.36, 0.02, 0.46), (1.3, 1.27, 1.32), bahan_tanah_liat("Bingkai", BRAND["terang"], kasar=0.6, sss=0.0), kol, miring=0.006)
    kotak("BingkaiIsi", (0.28, 0.01, 0.38), (1.3, 1.255, 1.32), bahan_tanah_liat("BingkaiIsi", BRAND["primer"], kasar=0.8, sss=0.0), kol)
    karpet(kol)
    jendela(kol)
    perabot_tambahan(kol, kayu)
    return kol


def tanaman(pos, kol, skala=1.0, nama="Daun"):
    pot = silinder("Pot" if nama == "Daun" else f"{nama}.Pot", 0.13 * skala, 0.28 * skala, pos + Vector((0, 0, 0.14 * skala)),
                   bahan_tanah_liat("Pot", "#B9805A", kasar=0.8, sss=0.0), kol, verts=48, miring=0.01)
    pot.modifiers.new("Halus", "SUBSURF").levels = 1
    daun = bahan_tanah_liat("Daun", "#4F7A5A", kasar=0.6, sss=0.08)
    import random

    rnd = random.Random(7 if nama == "Daun" else 11)
    for i in range(14 if skala <= 1.0 else 22):
        a = rnd.uniform(0, 2 * math.pi)
        naik = rnd.uniform(35, 75) if skala <= 1.0 else rnd.uniform(20, 60)
        panjang = rnd.uniform(0.32, 0.55) * skala
        bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=8, radius=1, location=(0, 0, 0))
        o = bpy.context.active_object
        o.name = f"{nama}{i}"
        o.scale = (0.06 * skala, panjang / 2, 0.012)
        bpy.ops.object.transform_apply(scale=True)
        for v in o.data.vertices:
            v.co.y += panjang / 2
            v.co.z -= 0.15 * (v.co.y / panjang) ** 2 * panjang
        o.rotation_euler = (math.radians(naik), 0, a)
        o.location = pos + Vector((0, 0, 0.28 * skala))
        o.data.materials.append(daun)
        for p in o.data.polygons:
            p.use_smooth = True
        pindah(o, kol)


def bangun_ponsel(kol, bahan_layar=None, pos=PONSEL_POS, balik=False):
    """Ponsel tegak di dudukan. Biasanya layar menghadap karakter (+Y) seperti saat latihan, kamera depan
    di atas layar; `balik` memutar ponsel sehingga layar menghadap -Y (penonton)."""
    badan = kotak("Ponsel.Badan", PONSEL_UKURAN, pos, bahan_tanah_liat("PonselBadan", "#1E2426", kasar=0.35, sss=0.0), kol, miring=0.006)
    # Punggung ponsel: modul kamera membulat dengan dua lensa, agar terbaca sebagai ponsel dari depan.
    sb = -1.0 if balik else 1.0
    punggung = pos.y - (PONSEL_UKURAN[1] / 2 + 0.0012) * sb
    modul = kotak("Ponsel.ModulKamera", (0.024, 0.0026, 0.038), Vector((pos.x - 0.019 * sb, punggung, pos.z + PONSEL_UKURAN[2] / 2 - 0.03)),
                  bahan_tanah_liat("PonselModul", "#2A3134", kasar=0.3, sss=0.0), kol, miring=0.006)
    for j, dz in enumerate((0.009, -0.009)):
        silinder(f"Ponsel.Lensa{j}", 0.0065, 0.003, modul.location + Vector((0, -0.0015 * sb, dz)),
                 bahan_tanah_liat("PonselLensa", "#0C0F10", kasar=0.08, sss=0.0), kol, verts=24, rot=(math.radians(90), 0, 0), miring=0.001)
    s = -1.0 if balik else 1.0
    bpy.ops.mesh.primitive_plane_add(size=1, location=pos + Vector((0, (PONSEL_UKURAN[1] / 2 + 0.0004) * s, 0)),
                                     rotation=(math.radians(90), 0, math.radians(0 if balik else 180)))
    layar = bpy.context.active_object
    layar.name = "Ponsel.Layar"
    layar.scale = (LAYAR_UKURAN[0], LAYAR_UKURAN[1], 1)
    bpy.ops.object.transform_apply(scale=True)
    layar.data.materials.append(bahan_layar or bahan_tanah_liat("LayarMati", "#0D1112", kasar=0.15, sss=0.0))
    pindah(layar, kol)
    return badan, layar


def bahan_layar_video(jalur, nama="LayarVideo", kekuatan=1.0, lewati_frame=0):
    """Bahan emisi bertekstur rekaman layar aplikasi ASLI (video MP4, atau satu frame PNG asli).
    Video: frame adegan 1 menampilkan frame video ke-(lewati_frame + 1); berjalan 1:1 dengan adegan (30 fps)."""
    m = bpy.data.materials.get(nama) or bpy.data.materials.new(nama)
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    img = bpy.data.images.load(jalur, check_existing=True)
    t = nt.nodes.new("ShaderNodeTexImage")
    t.image = img
    if jalur.lower().endswith((".mp4", ".mov", ".mkv")):
        img.source = "MOVIE"
        t.image_user.frame_duration = img.frame_duration - lewati_frame
        t.image_user.frame_start = 1
        t.image_user.frame_offset = lewati_frame
        t.image_user.use_auto_refresh = True
    t.interpolation = "Cubic"
    em = nt.nodes.new("ShaderNodeEmission")
    em.inputs["Strength"].default_value = kekuatan
    p = nt.nodes.new("ShaderNodeBsdfPrincipled")
    p.inputs["Base Color"].default_value = (0, 0, 0, 1)
    p.inputs["Roughness"].default_value = 0.08
    add = nt.nodes.new("ShaderNodeAddShader")
    nt.links.new(t.outputs["Color"], em.inputs["Color"])
    nt.links.new(em.outputs[0], add.inputs[0])
    nt.links.new(p.outputs[0], add.inputs[1])
    nt.links.new(add.outputs[0], out.inputs["Surface"])
    return m, t


def _lampu(kol, nama, jenis, lokasi, sasaran, energi, warna=(1.0, 1.0, 1.0), ukuran=1.0, ukuran_y=None):
    bpy.ops.object.light_add(type=jenis, location=lokasi)
    o = bpy.context.active_object
    o.name = nama
    o.data.energy = energi
    o.data.color = warna
    if jenis == "AREA":
        o.data.shape = "RECTANGLE" if ukuran_y else "SQUARE"
        o.data.size = ukuran
        if ukuran_y:
            o.data.size_y = ukuran_y
    arah = Vector(sasaran) - Vector(lokasi)
    o.rotation_euler = arah.to_track_quat("-Z", "Y").to_euler()
    pindah(o, kol)
    return o


def cahaya(kol_nama="Cahaya"):
    """Cahaya pagi lembut: kunci = jendela kiri depan karakter (area besar hangat) + matahari tipis,
    isi sejuk dari sisi kamera lebar, dua pinggir dari belakang memisahkan kepala/bahu dari dinding,
    dan sapuan lembut di dinding belakang (gradasi cahaya)."""
    kol = koleksi(kol_nama)
    _lampu(kol, "Jendela", "AREA", (2.1, -1.35, 1.7), (0, 0.1, 1.0), 540, (1.0, 0.93, 0.84), 2.0, 2.2)
    s = _lampu(kol, "MatahariPagi", "SUN", (3, -3, 4), (0, 0.3, 0.8), 1.4, (1.0, 0.9, 0.78))
    s.data.angle = math.radians(10)
    _lampu(kol, "Isi", "AREA", (-1.7, -1.6, 1.3), (0, 0, 1.0), 80, (0.88, 0.94, 1.0), 2.4)
    _lampu(kol, "Pinggir", "AREA", (0.75, 0.95, 1.9), (0, 0, 1.15), 75, (1.0, 0.95, 0.88), 0.6)
    _lampu(kol, "Pinggir2", "AREA", (-0.8, 0.9, 1.8), (0, 0, 1.1), 55, (0.92, 0.96, 1.0), 0.6)
    _lampu(kol, "SapuanDinding", "AREA", (0.9, 0.3, 2.9), (1.0, 1.3, 1.5), 70, (1.0, 0.94, 0.86), 2.5, 0.8)

    w = bpy.context.scene.world or bpy.data.worlds.new("Dunia")
    bpy.context.scene.world = w
    w.use_nodes = True
    w.node_tree.nodes["Background"].inputs["Color"].default_value = hex_linear("#DDE6E3")
    w.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.18


def kamera(nama, lokasi, target, lensa=35.0, sensor=36.0, fit="AUTO"):
    data = bpy.data.cameras.new(nama)
    data.lens = lensa
    data.sensor_width = sensor
    data.sensor_fit = fit
    o = bpy.data.objects.new(nama, data)
    bpy.context.scene.collection.objects.link(o)
    o.location = lokasi
    arah = Vector(target) - Vector(lokasi)
    o.rotation_euler = arah.to_track_quat("-Z", "Y").to_euler()
    return o


def kamera_pov():
    """Kamera depan ponsel: tepat di atas layar, menghadap karakter. Chrome memotong aliran kamera palsu
    menjadi persegi (480x480) untuk batasan aplikasi, jadi POV dirender persegi dengan FOV 62°:
    ada ruang di atas kepala, pinggul dan lutut terlihat."""
    pos = PONSEL_POS + Vector((0, PONSEL_UKURAN[1] / 2 + 0.002, PONSEL_UKURAN[2] / 2 - 0.012))
    c = kamera("KameraPonsel", pos, pos + Vector((0, 1.0, 0.0)), fit="VERTICAL")
    c.data.angle = math.radians(62)
    c.data.clip_start = 0.02
    return c


def atur_render(scene, lebar, tinggi, sampel=64, fps=30):
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = lebar
    scene.render.resolution_y = tinggi
    scene.render.resolution_percentage = 100
    scene.render.fps = fps
    scene.eevee.taa_render_samples = sampel
    scene.eevee.use_shadows = True
    scene.eevee.shadow_ray_count = 3
    scene.eevee.shadow_step_count = 12
    scene.eevee.use_raytracing = True
    scene.eevee.ray_tracing_options.resolution_scale = "1"
    scene.eevee.ray_tracing_options.use_denoise = True
    # Fast GI = oklusi ambien + pantulan lembut di sudut, lipatan baju, bawah meja.
    scene.eevee.fast_gi_method = "GLOBAL_ILLUMINATION"
    scene.eevee.fast_gi_resolution = "1"
    scene.eevee.use_fast_gi = True
    scene.eevee.fast_gi_distance = 0.6
    scene.eevee.fast_gi_step_count = 8
    scene.eevee.fast_gi_ray_count = 4
    scene.view_settings.view_transform = "AgX"
    scene.view_settings.exposure = -0.6
    scene.view_settings.look = "AgX - Medium High Contrast"
    scene.render.image_settings.file_format = "PNG"
    scene.render.image_settings.color_mode = "RGB"
    scene.render.film_transparent = False
