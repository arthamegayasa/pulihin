"""Bangun karakter peraga (sekali, dipakai semua latihan): MPFB/MakeHuman CC0 laki-laki ±53 tahun, rig
"game_engine", polo berkerah + celana panjang + sepatu, rambut pendek beruban (helai gumpal), kunci bentuk kedip.
Tanpa pose, perabot, kamera, atau bahan akhir: itu urusan adegan.py (per latihan) dan tampilan.py.

Jalankan (dari akar repo):  D:/Tools/blender/blender.exe -b -P peraga3d/dasar.py
Hasil:                      peraga3d/out/dasar.blend   (±10 dtk)
"""
import os
import sys

import bpy
from mathutils import Matrix

DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, DIR)
import pakaian  # noqa: E402
import rambut  # noqa: E402

from bl_ext.user_default.mpfb.services.humanservice import HumanService  # noqa: E402
from bl_ext.user_default.mpfb.services.locationservice import LocationService  # noqa: E402
from bl_ext.user_default.mpfb.services.targetservice import TargetService  # noqa: E402

KELUAR = os.path.join(DIR, "out", "dasar.blend")

# Laki-laki ±53 tahun (umur MPFB: 0,5 = 25 th, 1,0 = 90 th), tinggi sedang, badan rata-rata, perut sedikit.
MAKRO = {
    "gender": 1.0,
    "age": 0.5 + (53 - 25) / (90 - 25) * 0.5,
    "muscle": 0.5,
    "weight": 0.6,
    "proportions": 0.62,
    "height": 0.48,
    "cupsize": 0.5,
    "firmness": 0.5,
    "race": {"asian": 0.78, "caucasian": 0.07, "african": 0.15},
}
# Wajah tenang & ramah (kelopak sedikit turun, sudut bibir sedikit naik, alis dalam sedikit naik), perut sedikit.
TARGET = {
    "stomach/stomach-pregnant-incr": 0.14,
    "expression/units/asian/eye-left-closure": 0.05,
    "expression/units/asian/eye-right-closure": 0.05,
    "expression/units/asian/mouth-corner-puller": 0.42,
    "expression/units/asian/eyebrows-left-inner-up": 0.12,
    "expression/units/asian/eyebrows-right-inner-up": 0.12,
}
KEDIP = {"kedip_l": "expression/units/asian/eye-left-closure", "kedip_r": "expression/units/asian/eye-right-closure"}


def aset(*bagian):
    p = os.path.join(LocationService.get_user_data(), *bagian)
    if not os.path.exists(p):
        raise FileNotFoundError(f"Aset MakeHuman belum dipasang: {p} (lihat docs/video/produksi-3d.md)")
    return p


def jalur_target(nama):
    p = os.path.join(LocationService.get_mpfb_data("targets"), *nama.split("/")) + ".target.gz"
    if not os.path.exists(p):
        raise FileNotFoundError(p)
    return p


def main():
    for o in list(bpy.data.objects):
        bpy.data.objects.remove(o, do_unlink=True)

    body = HumanService.create_human(macro_detail_dict=MAKRO)
    body.name = "Badan"
    for nama, nilai in TARGET.items():
        TargetService.load_target(body, jalur_target(nama), weight=nilai, name=nama.split("/")[-1])
    TargetService.bake_targets(body)
    rig = HumanService.add_builtin_rig(body, "game_engine")
    rig.name = "Rig"
    assert rig.matrix_world == Matrix.Identity(4)
    HumanService.set_character_skin(aset("skins", "middleage_asian_male", "middleage_asian_male.mhmat"), body, skin_type="ENHANCED_SSS")

    obj = {}
    for kunci, kat, folder, jenis, mat in (
        ("Baju", "clothes", "male_casualsuit06", "Clothes", "MAKESKIN"),
        ("Sepatu", "clothes", "shoes01", "Clothes", "MAKESKIN"),
        ("Mata", "eyes", "high-poly", "Eyes", "PROCEDURAL_EYES"),
        ("Alis", "eyebrows", "eyebrow001", "Eyebrows", "MAKESKIN"),
        ("BuluMata", "eyelashes", "eyelashes01", "Eyelashes", "MAKESKIN"),
    ):
        o = HumanService.add_mhclo_asset(aset(kat, folder, folder + ".mhclo"), body, asset_type=jenis, subdiv_levels=1, material_type=mat)
        o.name = kunci
        obj[kunci] = o

    baju, sepatu = obj["Baju"], obj["Sepatu"]
    pakaian.pisah_uv(baju, lambda u, v: "Polo" if v > 0.5 else "Celana")
    pakaian.pisah_uv(sepatu, lambda u, v: "KausKaki" if (u > 0.82 and v > 0.6) else "Sepatu")
    pakaian.buat_kerah(baju, rig)
    pakaian.buat_plaket(baju, rig)
    pakaian.atribut_lengan_baju(baju)
    rambut.masker_kulit_kepala(body, obj["Alis"])

    # Subdivisi kulit (level sama di viewport & render agar Surface Deform bulu mata tetap terikat).
    sd = body.modifiers.new("Subdivisi", "SUBSURF")
    sd.levels = 1
    sd.render_levels = 1

    # Kedip: kunci bentuk kelopak (bulu mata & alis ikut lewat Surface Deform ke kulit).
    for nama, t in KEDIP.items():
        TargetService.load_target(body, jalur_target(t), weight=0.0, name=nama)
    for o in (obj["BuluMata"], obj["Alis"]):
        for m in list(o.modifiers):
            if m.type == "ARMATURE":
                o.modifiers.remove(m)
        m = o.modifiers.new("IkutKulit", "SURFACE_DEFORM")
        m.target = body
        o.modifiers.move(len(o.modifiers) - 1, 0)
        with bpy.context.temp_override(object=o, active_object=o, selected_objects=[o]):
            bpy.ops.object.surfacedeform_bind(modifier=m.name)
        assert m.is_bound, f"Surface Deform {o.name} gagal terikat"

    # Rambut pendek beruban: helai gumpal terpahat (dibangun pada bentuk rest, ikut tulang kepala).
    _, gumpal = rambut.bangun_helai(body, obj["Alis"])
    rambut.buat_objek("Rambut", gumpal, 0.00045, 0.00008, rig)
    print(f"[dasar] rambut: {len(gumpal)} helai gumpal")

    os.makedirs(os.path.dirname(KELUAR), exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=KELUAR, compress=True)
    print("[dasar] tersimpan:", KELUAR)


main()
