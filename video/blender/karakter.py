"""Bangun karakter 3D "Pak Budi" (nama samaran, bukan orang sungguhan) dengan MPFB2 (MakeHuman, CC0).

Jalankan:  blender -b -P video/blender/karakter.py
Hasil:     video/blender/karakter.blend  (mesh tubuh + rig game_engine + pakaian + rambut tanah liat)

Butuh ekstensi MPFB 2.0.x dan paket "makehuman_system_assets" (CC0) terpasang di folder data pengguna MPFB
(lihat docs/video/produksi-3d.md): pakaian, sepatu, mata, alis, bulu mata.
"""
import os
import sys

import bpy

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bahan  # noqa: E402

DIR = os.path.dirname(os.path.abspath(__file__))
KELUAR = os.path.join(DIR, "karakter.blend")

from bl_ext.user_default.mpfb.services.humanservice import HumanService  # noqa: E402
from bl_ext.user_default.mpfb.services.targetservice import TargetService  # noqa: E402
from bl_ext.user_default.mpfb.services.locationservice import LocationService  # noqa: E402

# Laki-laki ~58 tahun (umur MPFB: 0,5 = 25 th, 1,0 = 90 th), tinggi sedang, badan rata-rata, sedikit perut.
MAKRO = {
    "gender": 1.0,
    "age": 0.5 + (58 - 25) / (90 - 25) * 0.5,
    "muscle": 0.42,
    "weight": 0.64,
    "proportions": 0.55,
    "height": 0.42,
    "cupsize": 0.5,
    "firmness": 0.45,
    "race": {"asian": 0.8, "caucasian": 0.1, "african": 0.1},
}
# Target rinci (jalur relatif folder targets MPFB, nilai 0..1): perut sedikit buncit, wajah tenang & ramah
# (kelopak sedikit turun agar mata tidak menatap lebar, sudut bibir sedikit naik).
TARGET = {
    "stomach/stomach-pregnant-incr": 0.35,
    "stomach/stomach-navel-down": 0.3,
    "expression/units/asian/eye-left-closure": 0.18,
    "expression/units/asian/eye-right-closure": 0.18,
    "expression/units/asian/mouth-corner-puller": 0.22,
    "expression/units/asian/eyebrows-left-inner-up": 0.15,
    "expression/units/asian/eyebrows-right-inner-up": 0.15,
}


def bersihkan_adegan():
    for o in list(bpy.data.objects):
        bpy.data.objects.remove(o, do_unlink=True)


def cari_aset(*bagian):
    """Jalur aset paket sistem MakeHuman di folder data pengguna MPFB (None bila belum dipasang)."""
    p = os.path.join(LocationService.get_user_data(), *bagian)
    return p if os.path.exists(p) else None


def tambah_target(basemesh):
    for nama, nilai in TARGET.items():
        jalur = os.path.join(LocationService.get_mpfb_data("targets"), *nama.split("/")) + ".target.gz"
        if not os.path.exists(jalur):
            raise FileNotFoundError(jalur)
        TargetService.load_target(basemesh, jalur, weight=nilai, name=nama.split("/")[-1])


def main():
    bersihkan_adegan()
    basemesh = HumanService.create_human(macro_detail_dict=MAKRO)
    basemesh.name = "PakBudi"
    tambah_target(basemesh)
    # Target dipanggang dulu: rig, pakaian, rambut, dan mata dipasang pada bentuk akhir.
    TargetService.bake_targets(basemesh)
    rig = HumanService.add_builtin_rig(basemesh, "game_engine")
    rig.name = "PakBudi.rig"

    pakaian = []
    aset = [
        ("clothes", "male_casualsuit01", "male_casualsuit01.mhclo", "Clothes"),  # kemeja berkerah + celana panjang
        ("clothes", "shoes04", "shoes04.mhclo", "Clothes"),  # kaus kaki + sepatu rumah gelap
        ("eyes", "low-poly", "low-poly.mhclo", "Eyes"),
        ("eyebrows", "eyebrow001", "eyebrow001.mhclo", "Eyebrows"),
        ("eyelashes", "eyelashes01", "eyelashes01.mhclo", "Eyelashes"),
    ]
    for kategori, folder, berkas, jenis in aset:
        jalur = cari_aset(kategori, folder, berkas)
        if not jalur:
            raise FileNotFoundError(f"Aset MakeHuman {kategori}/{folder} belum dipasang (lihat docs/video/produksi-3d.md)")
        obj = HumanService.add_mhclo_asset(jalur, basemesh, asset_type=jenis, subdiv_levels=1, material_type="MAKESKIN")
        pakaian.append((jenis, obj))

    bahan.pasang_tanah_liat(basemesh, pakaian, rig)
    bahan.buat_rambut(basemesh, rig)

    bpy.ops.wm.save_as_mainfile(filepath=KELUAR, compress=True)
    print("[karakter] tersimpan:", KELUAR)


main()
