"""Tampilan V3 "Klinis/anatomis" (pilihan pemilik produk) untuk adegan latihan mana pun.

- Latar: cyclorama dengan gradien radial lembut teal muda (koordinat layar, jadi selalu berpusat di belakang figur
  apa pun sudut kameranya); figur lebih terang daripada latar.
- Figur: kulit "resin anatomi" semi-tembus halus (subsurface + coat) dengan tepi fresnel terang; dua cahaya
  pinggir (rim) dari belakang menegaskan siluet; bayangan lantai lembut dari cahaya kunci besar.
- Wajah netral: mata satu warna (tanpa iris/putih mata yang kontras), tanpa bulu mata, alis tipis senada.
- Pakaian netral: polo putih, celana abu kebiruan; lengan baju dan "jendela" di atas otot yang bekerja tembus
  seperti kaca buram (tepi tetap terlihat).
- Otot kerja: warna dasar + pancaran oranye #C46A1B x kontraksi (`kuat_otot`), cincin tipis di sendi target.
  Pendar = kompositor: pass Emission di-blur dua skala lalu ditambahkan ke gambar (hanya otot & cincin yang
  memancar, jadi pendar tidak bocor ke sorotan putih). render.py memeriksa pendar benar-benar terlihat.
"""
import math
import os

import bpy
from mathutils import Vector

ORANYE = "#C46A1B"
SAMPEL = 96


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
        return self.node("ShaderNodeAttribute", _attribute_name=nama, _attribute_type=tipe)

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

    def campur(self, a, b, fac, mode="MIX"):
        n = self.node("ShaderNodeMix", _data_type="RGBA", _blend_type=mode, _clamp_result=True)
        for sock, v in ((n.inputs["Factor"], fac), (n.inputs[6], a), (n.inputs[7], b)):
            self._isi(sock, v)
        return n.outputs[2]

    def fresnel(self, blend=0.3, pangkat=2.0):
        lw = self.node("ShaderNodeLayerWeight", Blend=blend)
        return self.math("POWER", lw.outputs["Facing"], pangkat)

    def bsdf(self, **nilai):
        b = self.node("ShaderNodeBsdfPrincipled", **nilai)
        self.link(b.outputs[0], self.out.inputs["Surface"])
        return b

    def tembus(self, permukaan, faktor):
        """Campur permukaan dengan Transparent BSDF sebesar `faktor` (socket)."""
        tr = self.node("ShaderNodeBsdfTransparent")
        mix = self.node("ShaderNodeMixShader")
        self.link(faktor, mix.inputs[0])
        self.link(permukaan, mix.inputs[1])
        self.link(tr.outputs[0], mix.inputs[2])
        self.link(mix.outputs[0], self.out.inputs["Surface"])


def _bahan(nama):
    return bpy.data.materials.get(nama) or bpy.data.materials.new(nama)


# ---------------- bahan ----------------


def bahan_kulit(bagian="kulit"):
    m = _bahan(f"V3.kulit.{bagian}")
    P = Pohon(m)
    kepala = P.attr("kulit_kepala")
    otot = P.attr("otot")
    kuat = P.attr("kuat_otot", "OBJECT")
    dasar = {"kulit": "#A3B2BE", "bibir": "#94A2AE", "kuku": "#B5C1CA"}[bagian]
    # Tepi fresnel lebih terang: kesan resin bening, siluet terbaca di atas latar.
    warna = P.campur(srgb(dasar), srgb("#E4EEF3"), P.math("MULTIPLY", P.fresnel(0.3, 2.4), 0.45))
    # Kulit kepala di bawah rambut = warna rambut, celah antarhelai tidak tampak putih.
    warna = P.campur(warna, srgb("#66737D"), P.math("POWER", kepala.outputs["Fac"], 0.7))
    # Masker diperkuat (x1,5, dibatasi 1) agar wilayah yang tipis/landai (mis. deltoid) tetap menyala penuh.
    m_ = P.math("POWER", P.math("MULTIPLY", otot.outputs["Fac"], 1.5, clamp=True), 0.8)
    k = P.math("MULTIPLY_ADD", kuat.outputs["Fac"], 0.97, 0.03)
    nyala = P.math("MULTIPLY", m_, k)
    # Wilayah otot sedikit bersemu saat istirahat (terbaca), penuh oranye saat kontraksi.
    warna = P.campur(warna, srgb(ORANYE), P.math("MULTIPLY_ADD", nyala, 0.85, P.math("MULTIPLY", m_, 0.06)), "MIX")
    b = P.bsdf(**{"Roughness": 0.42, "Subsurface Weight": 0.35, "Subsurface Scale": 0.03,
                  "Subsurface Radius": (1.0, 0.86, 0.74), "Specular IOR Level": 0.45, "Coat Weight": 0.3,
                  "Coat Roughness": 0.3, "Emission Color": srgb(ORANYE)})
    P.link(warna, b.inputs["Base Color"])
    P.link(P.math("MULTIPLY", nyala, 6.5), b.inputs["Emission Strength"])
    return m


def bahan_kain(nama, warna, kasar=0.82, kilau=0.3, normal=True):
    """Kain matte netral. Atribut `lengan` (lengan baju) dan `jendela` (di atas otot kerja) -> tembus seperti kaca
    buram: tengah tembus, tepi (fresnel) tetap tampak sehingga bentuk pakaian terbaca."""
    m = _bahan(f"V3.{nama}")
    P = Pohon(m)
    b = P.bsdf(**{"Base Color": srgb(warna), "Roughness": kasar, "Sheen Weight": kilau, "Sheen Roughness": 0.45,
                  "Specular IOR Level": 0.3})
    P.link(P.campur(srgb(warna), srgb("#FFFFFF"), P.math("MULTIPLY", P.fresnel(0.3, 2.5), 0.35)), b.inputs["Base Color"])
    if normal:
        img = bpy.data.images.load(_data_mpfb("clothes", "male_casualsuit06", "male_casualsuit06_normal.png"), check_existing=True)
        img.colorspace_settings.name = "Non-Color"
        tex = P.node("ShaderNodeTexImage", _image=img)
        nm = P.node("ShaderNodeNormalMap", Strength=0.3)
        P.link(tex.outputs[0], nm.inputs["Color"])
        P.link(nm.outputs[0], b.inputs["Normal"])
    lengan = P.attr("lengan")
    jendela = P.attr("jendela")
    area = P.math("MAXIMUM", lengan.outputs["Fac"], jendela.outputs["Fac"])
    lw = P.node("ShaderNodeLayerWeight", Blend=0.35)
    P.tembus(b.outputs[0], P.math("MULTIPLY", area, P.math("MULTIPLY_ADD", lw.outputs["Facing"], -0.75, 0.9), clamp=True))
    return m


def bahan_polos(nama, warna, kasar=0.6, **lain):
    m = _bahan(nama)
    P = Pohon(m)
    b = P.bsdf(**{"Base Color": srgb(warna), "Roughness": kasar, **lain})
    P.link(P.campur(srgb(warna), srgb("#FFFFFF"), P.math("MULTIPLY", P.fresnel(0.3, 2.5), 0.3)), b.inputs["Base Color"])
    return m


def bahan_alis():
    m = _bahan("V3.alis")
    P = Pohon(m)
    img = bpy.data.images.load(_data_mpfb("eyebrows", "eyebrow001", "eyebrow001.png"), check_existing=True)
    tex = P.node("ShaderNodeTexImage", _image=img)
    b = P.node("ShaderNodeBsdfPrincipled", **{"Base Color": srgb("#7E8B95"), "Roughness": 0.6})
    tr = P.node("ShaderNodeBsdfTransparent")
    mix = P.node("ShaderNodeMixShader")
    P.link(P.math("MULTIPLY", tex.outputs["Alpha"], 0.75), mix.inputs[0])
    P.link(tr.outputs[0], mix.inputs[1])
    P.link(b.outputs[0], mix.inputs[2])
    P.link(mix.outputs[0], P.out.inputs["Surface"])
    return m


def bahan_rambut():
    m = _bahan("V3.rambut")
    P = Pohon(m)
    uban = P.attr("uban")
    acak = P.attr("acak")
    warna = P.campur(srgb("#6C7983"), srgb("#A3AEB6"), P.math("MULTIPLY", uban.outputs["Fac"], 0.7))
    warna = P.campur(warna, srgb("#56626B"), P.math("MULTIPLY", acak.outputs["Fac"], 0.3))
    b = P.bsdf(**{"Roughness": 0.55, "Specular IOR Level": 0.35, "Coat Weight": 0.15})
    P.link(warna, b.inputs["Base Color"])
    return m


def bahan_kayu():
    """Kayu birch muda berserat halus (kursi kayu modern)."""
    m = _bahan("V3.kayu")
    P = Pohon(m)
    coord = P.node("ShaderNodeTexCoord")
    mp = P.node("ShaderNodeMapping", Scale=(9.0, 9.0, 0.7))
    P.link(coord.outputs["Object"], mp.inputs["Vector"])
    w = P.node("ShaderNodeTexWave", Scale=2.2, Distortion=5.0, Detail=3.0, _wave_type="RINGS")
    P.link(mp.outputs[0], w.inputs["Vector"])
    warna = P.campur(srgb("#D3C1A8"), srgb("#C4AE92"), w.outputs["Fac"])
    b = P.bsdf(**{"Roughness": 0.5, "Coat Weight": 0.1, "Specular IOR Level": 0.35})
    P.link(warna, b.inputs["Base Color"])
    return m


def bahan_cyc(tengah="#C7D9D5", tepi="#93ADA9", lantai=0.55, pancar=0.35):
    """Gradien radial lembut dalam koordinat layar (Window): terang di belakang figur, lebih gelap ke tepi. Lantai
    sedikit lebih gelap daripada dinding (ia menerima cahaya kunci langsung) agar tidak menjadi bidang silau.
    Sebagian nada latar dipancarkan sendiri (`pancar`), jadi kecerahan latar stabil terhadap cahaya figur, sedangkan
    bagian difusnya tetap menerima bayangan lantai yang lembut."""
    m = _bahan("Cyc")
    P = Pohon(m)
    tc = P.node("ShaderNodeTexCoord")
    sub = P.node("ShaderNodeVectorMath", _operation="SUBTRACT")
    P.link(tc.outputs["Window"], sub.inputs[0])
    sub.inputs[1].default_value = (0.5, 0.56, 0.0)
    pj = P.node("ShaderNodeVectorMath", _operation="LENGTH")
    P.link(sub.outputs[0], pj.inputs[0])
    mr = P.node("ShaderNodeMapRange", _interpolation_type="SMOOTHSTEP", **{"From Min": 0.12, "From Max": 0.78})
    P.link(pj.outputs["Value"], mr.inputs["Value"])
    pisah = P.node("ShaderNodeSeparateXYZ")
    P.link(tc.outputs["Object"], pisah.inputs[0])
    tinggi = P.node("ShaderNodeMapRange", _interpolation_type="SMOOTHSTEP", **{"From Min": 0.0, "From Max": 0.9, "To Min": lantai, "To Max": 1.0})
    P.link(pisah.outputs["Z"], tinggi.inputs["Value"])
    b = P.bsdf(**{"Roughness": 0.92, "Specular IOR Level": 0.15})
    warna = P.campur(P.campur(srgb(tengah), srgb(tepi), mr.outputs["Result"]), tinggi.outputs["Result"], 1.0, "MULTIPLY")
    P.link(warna, b.inputs["Base Color"])
    P.link(warna, b.inputs["Emission Color"])
    kuat = P.node("ShaderNodeValue")
    kuat.name = "pancar"
    kuat.outputs[0].default_value = pancar
    P.link(kuat.outputs[0], b.inputs["Emission Strength"])
    return m


def bahan_cincin():
    m = _bahan("Cincin")
    P = Pohon(m)
    kuat = P.attr("kuat", "OBJECT")
    em = P.node("ShaderNodeEmission", Color=srgb("#E07A22"))
    P.link(P.math("MULTIPLY_ADD", kuat.outputs["Fac"], 7.0, 1.6), em.inputs["Strength"])
    P.link(em.outputs[0], P.out.inputs["Surface"])
    return m


# ---------------- cahaya ----------------


def lampu(nama, lokasi, target, energi, warna=(1, 1, 1), ukuran=1.0, sebar=None):
    old = bpy.data.objects.get(nama)
    if old:
        bpy.data.objects.remove(old, do_unlink=True)
    ld = bpy.data.lights.new(nama, "AREA")
    ld.energy = energi
    ld.color = warna
    ld.shape = "DISK"
    ld.size = ukuran
    if sebar is not None:
        ld.spread = math.radians(sebar)
    ob = bpy.data.objects.new(nama, ld)
    bpy.context.scene.collection.objects.link(ob)
    ob.location = lokasi
    ob.rotation_mode = "QUATERNION"
    ob.rotation_quaternion = (Vector(target) - Vector(lokasi)).to_track_quat("-Z", "Y")
    return ob


def tata_cahaya(azimut_kamera):
    pusat = Vector((-0.05, -0.1, 0.8))

    def kutub(az_deg, elev_deg, jarak, p=pusat):
        a, e = math.radians(az_deg), math.radians(elev_deg)
        # azimut 0 = depan karakter (-Y), positif = ke sisi kanan karakter (-X)
        return Vector((p.x - math.sin(a) * math.cos(e) * jarak, p.y - math.cos(a) * math.cos(e) * jarak, p.z + math.sin(e) * jarak))

    cam = azimut_kamera
    lampu("Kunci", kutub(cam - 42, 44, 3.2), pusat, 170, (1.0, 0.98, 0.95), 2.4)
    lampu("Isi", kutub(cam + 50, 8, 3.6), pusat, 20, (0.93, 0.97, 1.0), 3.6)
    # Dua cahaya pinggir dari belakang, hampir mendatar dengan sebaran sempit: menyorot tepi siluet tanpa menerangi
    # latar atau lantai di depan figur.
    bahu = Vector((-0.05, 0.0, 1.0))
    lampu("PinggirA", kutub(cam + 150, 12, 2.4, bahu), bahu + Vector((0, 0, 0.15)), 120, (0.95, 1.0, 1.0), 0.6, 30)
    lampu("PinggirB", kutub(cam - 150, 16, 2.4, bahu), bahu + Vector((0, 0, 0.15)), 105, (1.0, 1.0, 1.0), 0.6, 30)
    # Cahaya atas lembut: bayangan kontak di bawah kursi dan sepatu (figur "menapak" lantai).
    lampu("Atas", Vector((0.0, -0.05, 3.0)), Vector((0.0, -0.05, 0.0)), 60, (1.0, 1.0, 1.0), 1.4)
    belakang = Vector((math.sin(math.radians(cam)), math.cos(math.radians(cam)), 0))
    lampu("Latar", belakang * 1.0 + Vector((0, 0, 2.6)), belakang * 2.6 + Vector((0, 0, 0.9)), 10, (0.96, 1.0, 1.0), 3.0)


def dunia():
    w = bpy.data.worlds.get("Dunia") or bpy.data.worlds.new("Dunia")
    bpy.context.scene.world = w
    w.use_nodes = True
    nt = w.node_tree
    bg = nt.nodes.get("Background") or nt.nodes.new("ShaderNodeBackground")
    bg.inputs["Color"].default_value = srgb("#D5E3E0")
    bg.inputs["Strength"].default_value = 0.12
    out = nt.nodes.get("World Output") or nt.nodes.new("ShaderNodeOutputWorld")
    nt.links.new(bg.outputs[0], out.inputs[0])


# ---------------- render & kompositor ----------------


def gpu_optix():
    pref = bpy.context.preferences.addons["cycles"].preferences
    for jenis in ("OPTIX", "CUDA"):
        try:
            pref.compute_device_type = jenis
        except TypeError:
            continue
        pref.get_devices()
        ada = False
        for d in pref.devices:
            d.use = d.type == jenis
            ada = ada or d.use
        if ada:
            return jenis
    return "CPU"


def atur_render(sampel):
    sc = bpy.context.scene
    sc.render.engine = "CYCLES"
    perangkat = gpu_optix()
    sc.cycles.device = "GPU" if perangkat != "CPU" else "CPU"
    sc.cycles.samples = sampel
    sc.cycles.use_adaptive_sampling = True
    sc.cycles.adaptive_threshold = 0.015
    sc.cycles.use_denoising = True
    sc.cycles.denoiser = "OPTIX" if perangkat == "OPTIX" else "OPENIMAGEDENOISE"
    sc.cycles.denoising_input_passes = "RGB_ALBEDO_NORMAL"
    sc.cycles.max_bounces = 8
    sc.cycles.diffuse_bounces = 3
    sc.cycles.glossy_bounces = 3
    sc.cycles.transmission_bounces = 6
    sc.cycles.transparent_max_bounces = 24
    sc.cycles.caustics_reflective = False
    sc.cycles.caustics_refractive = False
    sc.cycles.blur_glossy = 1.0
    sc.render.use_persistent_data = True
    sc.render.use_motion_blur = True
    sc.render.motion_blur_shutter = 0.35
    sc.render.film_transparent = False
    sc.render.resolution_x = sc.render.resolution_y = 720
    sc.render.resolution_percentage = 100
    sc.render.image_settings.file_format = "PNG"
    sc.render.image_settings.color_mode = "RGB"
    sc.render.dither_intensity = 1.0
    sc.view_settings.view_transform = "AgX"
    sc.view_settings.look = "AgX - Medium High Contrast"
    sc.view_settings.exposure = -0.5
    return perangkat


def _set_masukan(node, nama, nilai):
    s = node.inputs[nama]
    try:
        s.default_value = nilai
    except (TypeError, ValueError):
        s.default_value = (nilai, nilai)


def pendar_kompositor(aktif=True, kecil=7, besar=26, kuat_kecil=0.9, kuat_besar=0.75):
    """Gambar + blur(Emission, kecil) + blur(Emission, besar). Hanya bahan yang memancar (otot, cincin) berpendar."""
    sc = bpy.context.scene
    if not aktif:
        sc.render.use_compositing = False
        return
    sc.view_layers[0].use_pass_emit = True
    ng = bpy.data.node_groups.get("PendarV3")
    if ng is None:
        ng = bpy.data.node_groups.new("PendarV3", "CompositorNodeTree")
        ng.interface.new_socket("Image", in_out="OUTPUT", socket_type="NodeSocketColor")
        rl = ng.nodes.new("CompositorNodeRLayers")
        out = ng.nodes.new("NodeGroupOutput")
        akhir = rl.outputs["Image"]
        for ukuran, kuat in ((kecil, kuat_kecil), (besar, kuat_besar)):
            bl = ng.nodes.new("CompositorNodeBlur")
            _set_masukan(bl, "Size", ukuran)
            if "Type" in bl.inputs:
                bl.inputs["Type"].default_value = "Gaussian"
            ng.links.new(rl.outputs["Emission"], bl.inputs["Image"])
            mx = ng.nodes.new("ShaderNodeMix")
            mx.data_type = "RGBA"
            mx.blend_type = "ADD"
            mx.inputs["Factor"].default_value = kuat
            ng.links.new(akhir, mx.inputs[6])
            ng.links.new(bl.outputs[0], mx.inputs[7])
            akhir = mx.outputs[2]
        ng.links.new(akhir, out.inputs[0])
    sc.compositing_node_group = ng
    sc.render.use_compositing = True


def terapkan(sampel=SAMPEL):
    o = bpy.data.objects
    badan = o["Badan"]
    kulit = bahan_kulit()
    for s in badan.material_slots:
        nama = s.material.name if s.material else ""
        s.material = bahan_kulit("bibir") if nama.endswith("lips") else bahan_kulit("kuku") if nama.endswith("nails") else kulit
    polo = bahan_kain("polo", "#DEE5E9")
    celana = bahan_kain("celana", "#8C9BA4", kilau=0.2)
    kancing = bahan_polos("V3.kancing", "#F4F6F7", 0.35)
    for ob in (o["Baju"], o["Kerah"], o["Plaket"]):
        for s in ob.material_slots:
            nm = s.material.name.split(".")[0] if s.material else ""
            s.material = {"Polo": polo, "Celana": celana, "Kancing": kancing}.get(nm, s.material)
    sepatu = bahan_polos("V3.sepatu", "#58646D", 0.5, **{"Coat Weight": 0.15})
    kaus = bahan_polos("V3.kauskaki", "#6E7A83", 0.85)
    for s in o["Sepatu"].material_slots:
        s.material = kaus if s.material and s.material.name.startswith("KausKaki") else sepatu
    o["Mata"].material_slots[0].material = bahan_polos("V3.mata", "#7C8A95", 0.35, **{"Coat Weight": 0.3})
    o["Alis"].material_slots[0].material = bahan_alis()
    o["BuluMata"].hide_render = True
    o["Rambut"].data.materials.clear()
    o["Rambut"].data.materials.append(bahan_rambut())
    kayu = bahan_kayu()
    for ob in bpy.data.collections["Kursi"].objects:
        ob.material_slots[0].material = kayu
    o["Cyc"].material_slots[0].material = bahan_cyc()
    o["Cincin"].material_slots[0].material = bahan_cincin()

    tata_cahaya(bpy.context.scene["azimut_kamera"])
    dunia()
    perangkat = atur_render(sampel)
    pendar_kompositor(True)
    return perangkat
