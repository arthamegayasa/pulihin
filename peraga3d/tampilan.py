"""Tampilan S2 "Flat editorial" (sama dengan ilustrasi aplikasi) untuk adegan latihan mana pun.

- Bidang warna rata dengan tiga nada lembut (bayang / dasar / terang, cel/toon), tanpa garis kontur, tanpa bahan
  tembus atau realistis. Semua bahan memancarkan warna palet langsung (Emission) dan view transform Standard,
  jadi piksel = warna palet persis.
- Nada dari cahaya sungguhan lewat Shader to RGB (EEVEE): cahaya kunci MERAH (matahari dari kiri-atas kamera,
  bayangan jatuh ikut terbaca) menentukan nada figur & perabot; cahaya atas HIJAU (hampir tegak, sudut lebar)
  hanya dibaca lantai -> bayangan kontak sangat lembut di bawah kursi & sepatu. Satu render, dua cahaya terpisah
  lewat kanal warna (tanpa light linking).
- Latar rata #EEF4F2 (warna ubin ilustrasi `bg-ilustrasi`) di dinding & lantai cyclorama; lantai hanya digelapkan
  bayangan kontak.
- Pak Budi: kulit sawo matang, rambut hitam pendek dengan pelipis abu (`uban` per helai, `pelipis` di kulit
  kepala), kumis rapi, polo teal, celana krem pasir, sepatu cokelat tua; wajah sederhana (mata gelap).
- Otot kerja: warna oranye #C46A1B (dengan nada bayang/terangnya sendiri) x kontraksi (`kuat_otot`), di kulit
  (atribut `otot`) maupun di pakaian di atasnya (atribut `jendela`, tepi lembut). Properti adegan `nyala_otot`
  (0/1) mematikan sorot untuk pemeriksaan keterlihatan di render.py. Tanpa pendar/bloom, tanpa penanda sendi.
"""
import math
import os

import bpy
from mathutils import Vector

ORANYE = "#C46A1B"
LATAR = "#EEF4F2"
SAMPEL = 64

# Palet per bahan: (bayang, dasar, terang), sRGB.
PALET = {
    # Kulit: nada terang sangat tipis (wajah praktis dua nada, tanpa bercak terang seperti topeng).
    "kulit": ("#B5704A", "#D69060", "#D99565"),
    "bibir": ("#9A573F", "#B46A50", "#B76D53"),
    "kuku": ("#C58B69", "#DFAA84", "#E2AE88"),
    "otot": ("#A9530E", ORANYE, "#DC7D28"),
    "polo": ("#2C6D6C", "#3F8584", "#519897"),
    "kancing": ("#E6EDEA", "#EEF3F1", "#F5F8F7"),
    "celana": ("#C2AB88", "#D9C6A4", "#E6D8BE"),
    "sepatu": ("#2A1F19", "#3B2C22", "#4B392D"),
    "kauskaki": ("#2E3A38", "#3A4846", "#465654"),
    "kayu": ("#7B4F2C", "#9D6A3E", "#B47E4F"),
    "rambut": ("#202627", "#2B3233", "#363E3F"),
    "uban": ("#7A7F7E", "#949897", "#A6AAA9"),
}
# Ambang nada (kanal kunci 0..1): < BAYANG = nada bayang, > TERANG = nada terang; transisi selebar 2 x LEMBUT.
# Bayang hanya di sisi yang benar-benar membelakangi cahaya (seperti ilustrasi: sebagian besar nada dasar).
BAYANG, TERANG, LEMBUT = 0.1, 0.85, 0.02
# Arah datang cahaya relatif kamera (derajat): kunci dari kiri-atas kamera, atas hampir tegak.
KUNCI_AZ, KUNCI_EL, ATAS_EL = -45.0, 48.0, 84.0
BAYANGAN_LANTAI = 0.32  # kegelapan bayangan kontak penuh (fraksi menuju warna bayangan lantai)
# Tepi sorot otot: masker (kulit `otot`, kain `jendela`) dipetakan smoothstep dari..ke -> 0..1.
TEPI_OTOT = (0.15, 0.5)


def _data_mpfb(*b):
    from bl_ext.user_default.mpfb.services.locationservice import LocationService

    return os.path.join(LocationService.get_user_data(), *b)


def srgb(hexa):
    h = hexa.lstrip("#")
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple((x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4) for x in c) + (1.0,)


# ---------------- pembangun simpul ----------------


class Pohon:
    def __init__(self, mat):
        mat.use_nodes = True
        self.nt = mat.node_tree
        self.nt.nodes.clear()
        self.x = 0
        self.out = self.node("ShaderNodeOutputMaterial")
        self._cahaya = None

    def node(self, tipe, **nilai):
        n = self.nt.nodes.new(tipe)
        n.location = (self.x, 0)
        self.x -= 220
        for k, v in nilai.items():
            if k.startswith("_"):
                setattr(n, k[1:], v)
            else:
                n.inputs[k].default_value = v
        return n

    def link(self, a, b):
        self.nt.links.new(a, b)

    def attr(self, nama, tipe="GEOMETRY"):
        return self.node("ShaderNodeAttribute", _attribute_name=nama, _attribute_type=tipe).outputs["Fac"]

    def _isi(self, sock, v):
        if isinstance(v, (int, float, tuple)):
            sock.default_value = v
        else:
            self.link(v, sock)

    def math(self, op, *masukan, clamp=False):
        n = self.node("ShaderNodeMath", _operation=op, _use_clamp=clamp)
        for i, v in enumerate(masukan):
            self._isi(n.inputs[i], v)
        return n.outputs[0]

    def campur(self, a, b, fac):
        n = self.node("ShaderNodeMix", _data_type="RGBA", _blend_type="MIX", _clamp_factor=True)
        for sock, v in ((n.inputs["Factor"], fac), (n.inputs[6], a), (n.inputs[7], b)):
            self._isi(sock, v)
        return n.outputs[2]

    def tangga(self, a, b, x):
        n = self.node("ShaderNodeMapRange", _interpolation_type="SMOOTHSTEP", **{"From Min": a, "From Max": b})
        self.link(x, n.inputs["Value"])
        return n.outputs["Result"]

    def cahaya(self):
        """(kunci, atas): irradiansi kanal merah & hijau dari Shader to RGB atas Diffuse putih (dengan bayangan)."""
        if self._cahaya is None:
            d = self.node("ShaderNodeBsdfDiffuse", Color=(1, 1, 1, 1))
            s2r = self.node("ShaderNodeShaderToRGB")
            self.link(d.outputs[0], s2r.inputs[0])
            pisah = self.node("ShaderNodeSeparateColor")
            self.link(s2r.outputs["Color"], pisah.inputs[0])
            self._cahaya = (pisah.outputs[0], pisah.outputs[1])
        return self._cahaya

    def nada(self, palet):
        """Warna toon: bayang -> dasar -> terang menurut cahaya kunci. `palet` = kunci PALET atau tiga warna hex."""
        b, d, t = PALET[palet] if isinstance(palet, str) else palet
        k = self.cahaya()[0]
        w = self.campur(srgb(b), srgb(d), self.tangga(BAYANG - LEMBUT, BAYANG + LEMBUT, k))
        return self.campur(w, srgb(t), self.tangga(TERANG - LEMBUT, TERANG + LEMBUT, k))

    def pancar(self, warna, alpha=None):
        em = self.node("ShaderNodeEmission", Strength=1.0)
        self._isi(em.inputs["Color"], warna)
        if alpha is None:
            self.link(em.outputs[0], self.out.inputs["Surface"])
            return
        tr = self.node("ShaderNodeBsdfTransparent")
        mix = self.node("ShaderNodeMixShader")
        self._isi(mix.inputs[0], alpha)
        self.link(tr.outputs[0], mix.inputs[1])
        self.link(em.outputs[0], mix.inputs[2])
        self.link(mix.outputs[0], self.out.inputs["Surface"])

    def sorot(self, warna, masker_a, masker_b):
        """Campur warna dengan oranye otot sebesar masker x kekuatan kontraksi (kanal a/b) x `nyala_otot`. Masker
        dipertegas (smoothstep TEPI_OTOT) -> bentuk otot rata dengan tepi lembut yang pendek, bukan noda kabur;
        kekuatan juga (>= 0,65 = oranye penuh: campuran setengah dengan kain krem tampak kotor), rona tipis saat
        istirahat."""
        kuat, kuat_b = (self.math("MULTIPLY_ADD", self.tangga(0.0, 0.65, self.attr(n, "OBJECT")), 0.92, 0.08)
                        for n in ("kuat_otot", "kuat_otot_b"))
        a, b = self.tangga(*TEPI_OTOT, self.attr(masker_a)), self.tangga(*TEPI_OTOT, self.attr(masker_b))
        f = self.math("ADD", self.math("MULTIPLY", a, kuat), self.math("MULTIPLY", b, kuat_b), clamp=True)
        f = self.math("MULTIPLY", f, self.attr("nyala_otot", "VIEW_LAYER"))
        return self.campur(warna, self.nada("otot"), f)


def _bahan(nama):
    return bpy.data.materials.get(nama) or bpy.data.materials.new(nama)


# ---------------- bahan ----------------


def bahan_kulit(bagian="kulit"):
    m = _bahan(f"S2.kulit.{bagian}")
    P = Pohon(m)
    warna = P.nada(bagian)
    if bagian == "kulit":
        # Kulit kepala di bawah rambut = warna rambut (pelipis abu), celah antarhelai tidak tampak.
        rambut = P.campur(P.nada("rambut"), P.nada("uban"), P.attr("pelipis"))
        warna = P.campur(warna, rambut, P.math("POWER", P.attr("kulit_kepala"), 0.6))
        warna = P.sorot(warna, "otot", "otot_b")
    P.pancar(warna)
    return m


def bahan_kain(nama):
    """Kain rata; atribut `jendela`/`jendela_b` (di atas otot kerja) -> sorot oranye berbentuk otot, tepi lembut."""
    m = _bahan(f"S2.{nama}")
    P = Pohon(m)
    P.pancar(P.sorot(P.nada(nama), "jendela", "jendela_b"))
    return m


def bahan_rata(nama, palet=None):
    m = _bahan(f"S2.{nama}")
    P = Pohon(m)
    P.pancar(P.nada(palet or nama))
    return m


def bahan_rambut():
    """Helai & kumis: hitam, pelipis abu (atribut kurva `uban`; kumis tanpa atribut = hitam)."""
    m = _bahan("S2.rambut")
    P = Pohon(m)
    P.pancar(P.campur(P.nada("rambut"), P.nada("uban"), P.attr("uban")))
    return m


def bahan_alis():
    m = _bahan("S2.alis")
    P = Pohon(m)
    img = bpy.data.images.load(_data_mpfb("eyebrows", "eyebrow001", "eyebrow001.png"), check_existing=True)
    tex = P.node("ShaderNodeTexImage", _image=img)
    P.pancar(P.nada("rambut"), P.math("POWER", tex.outputs["Alpha"], 0.4))
    return m


def bahan_mata():
    """Mata sederhana: titik gelap besar (iris+pupil, dari normal ruang objek yang ikut lirikan) di putih hangat redup."""
    m = _bahan("S2.mata")
    P = Pohon(m)
    tc = P.node("ShaderNodeTexCoord")
    pisah = P.node("ShaderNodeSeparateXYZ")
    P.link(tc.outputs["Normal"], pisah.inputs[0])
    iris = P.tangga(0.0, -0.25, pisah.outputs["Y"])  # belahan depan (-Y) gelap: mata = titik gelap sederhana
    P.pancar(P.campur(srgb("#D9CDBC"), srgb("#231B17"), iris))
    return m


def bahan_latar(sc):
    """Dinding & lantai = #EEF4F2 rata; lantai digelapkan bayangan kontak dari cahaya atas (kanal hijau). Rasio
    irradiansi terhadap N.L tanpa penghalang = keterlihatan, jadi lengkung cyclorama tidak membuat bayangan palsu."""
    m = _bahan("Cyc")
    P = Pohon(m)
    hijau = P.cahaya()[1]
    geo = P.node("ShaderNodeNewGeometry")
    dot = P.node("ShaderNodeVectorMath", _operation="DOT_PRODUCT")
    P.link(geo.outputs["Normal"], dot.inputs[0])
    dot.inputs[1].default_value = tuple(sc["arah_atas"])
    nl = P.math("MAXIMUM", dot.outputs["Value"], 0.05)
    lihat = P.math("DIVIDE", hijau, nl)
    gelap = P.math("SUBTRACT", 1.0, P.tangga(0.05, 0.97, lihat))
    pisah = P.node("ShaderNodeSeparateXYZ")
    P.link(geo.outputs["Position"], pisah.inputs[0])
    lantai = P.math("SUBTRACT", 1.0, P.tangga(0.02, 0.25, pisah.outputs["Z"]))
    f = P.math("MULTIPLY", P.math("MULTIPLY", gelap, lantai), BAYANGAN_LANTAI)
    P.pancar(P.campur(srgb(LATAR), srgb("#9FB7B2"), f))
    return m


# ---------------- cahaya ----------------


def _arah(az_deg, el_deg):
    """Arah ke sumber cahaya (dunia). azimut 0 = depan karakter (-Y), + = ke sisi kanan karakter (-X)."""
    a, e = math.radians(az_deg), math.radians(el_deg)
    return Vector((-math.sin(a) * math.cos(e), -math.cos(a) * math.cos(e), math.sin(e)))


def matahari(nama, arah, warna, sudut):
    old = bpy.data.objects.get(nama)
    if old:
        bpy.data.objects.remove(old, do_unlink=True)
    ld = bpy.data.lights.new(nama, "SUN")
    ld.energy = math.pi  # Diffuse putih yang menghadap cahaya -> Shader to RGB = 1
    ld.color = warna
    ld.angle = math.radians(sudut)
    ob = bpy.data.objects.new(nama, ld)
    bpy.context.scene.collection.objects.link(ob)
    ob.rotation_mode = "QUATERNION"
    ob.rotation_quaternion = (-arah).to_track_quat("-Z", "Y")
    return ob


def tata_cahaya(azimut_kamera):
    sc = bpy.context.scene
    for o in list(bpy.data.objects):
        if o.type == "LIGHT":
            bpy.data.objects.remove(o, do_unlink=True)
    matahari("Kunci", _arah(azimut_kamera + KUNCI_AZ, KUNCI_EL), (1.0, 0.0, 0.0), 3.0)
    atas = _arah(azimut_kamera + KUNCI_AZ, ATAS_EL)
    matahari("Atas", atas, (0.0, 1.0, 0.0), 28.0)
    sc["arah_atas"] = tuple(atas)


def dunia():
    w = bpy.data.worlds.get("Dunia") or bpy.data.worlds.new("Dunia")
    bpy.context.scene.world = w
    w.use_nodes = True
    nt = w.node_tree
    nt.nodes.clear()
    bg = nt.nodes.new("ShaderNodeBackground")
    bg.inputs["Color"].default_value = srgb(LATAR)
    bg.inputs["Strength"].default_value = 1.0
    # Tanpa cahaya lingkungan (nada hanya dari cahaya kunci); sinar kamera tetap melihat warna latar.
    lp = nt.nodes.new("ShaderNodeLightPath")
    hitam = nt.nodes.new("ShaderNodeBackground")
    hitam.inputs["Strength"].default_value = 0.0
    mix = nt.nodes.new("ShaderNodeMixShader")
    nt.links.new(lp.outputs["Is Camera Ray"], mix.inputs[0])
    nt.links.new(hitam.outputs[0], mix.inputs[1])
    nt.links.new(bg.outputs[0], mix.inputs[2])
    out = nt.nodes.new("ShaderNodeOutputWorld")
    nt.links.new(mix.outputs[0], out.inputs[0])


# ---------------- render ----------------


def atur_render(sampel):
    sc = bpy.context.scene
    sc.render.engine = "BLENDER_EEVEE"
    ee = sc.eevee
    ee.taa_render_samples = sampel
    ee.use_raytracing = False
    ee.use_shadows = True
    ee.shadow_ray_count = 2
    ee.shadow_step_count = 8
    sc.render.use_motion_blur = True
    sc.render.motion_blur_shutter = 0.3
    sc.render.film_transparent = False
    sc.render.filter_size = 1.2
    sc.render.resolution_x = sc.render.resolution_y = 720
    sc.render.resolution_percentage = 100
    sc.render.image_settings.file_format = "PNG"
    sc.render.image_settings.color_mode = "RGB"
    sc.render.dither_intensity = 0.0
    sc.render.use_compositing = False
    sc.view_settings.view_transform = "Standard"
    sc.view_settings.look = "None"
    sc.view_settings.exposure = 0.0
    sc.view_settings.gamma = 1.0
    sc.display_settings.display_device = "sRGB"
    sc["nyala_otot"] = 1.0
    for cam in bpy.data.cameras:
        cam.dof.use_dof = False
    return "EEVEE"


def terapkan(sampel=SAMPEL):
    o = bpy.data.objects
    sc = bpy.context.scene
    tata_cahaya(sc["azimut_kamera"])
    badan = o["Badan"]
    kulit = bahan_kulit()
    for s in badan.material_slots:
        nama = s.material.name if s.material else ""
        s.material = bahan_kulit("bibir") if nama.endswith("lips") else bahan_kulit("kuku") if nama.endswith("nails") else kulit
    polo, celana, kancing = bahan_kain("polo"), bahan_kain("celana"), bahan_rata("kancing")
    for ob in (o["Baju"], o["Kerah"], o["Plaket"]):
        for s in ob.material_slots:
            nm = s.material.name.split(".")[0] if s.material else ""
            s.material = {"Polo": polo, "Celana": celana, "Kancing": kancing}.get(nm, s.material)
    sepatu, kaus = bahan_rata("sepatu"), bahan_rata("kauskaki")
    for s in o["Sepatu"].material_slots:
        s.material = kaus if s.material and s.material.name.startswith("KausKaki") else sepatu
    o["Mata"].material_slots[0].material = bahan_mata()
    o["Alis"].material_slots[0].material = bahan_alis()
    o["BuluMata"].hide_render = True
    rambut = bahan_rambut()
    for nama in ("Rambut", "Kumis"):
        o[nama].data.materials.clear()
        o[nama].data.materials.append(rambut)
    kayu = bahan_rata("kayu")
    for ob in bpy.data.collections["Perabot"].objects:
        ob.material_slots[0].material = kayu
    o["Cyc"].material_slots[0].material = bahan_latar(sc)
    dunia()
    return atur_render(sampel)
