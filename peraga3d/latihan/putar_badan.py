"""Putar Badan (rotasi batang tubuh duduk), ke KANAN anatomis (aplikasi mencerminkan untuk sisi kiri).

panduanLangkah: duduk tegak, tangan bersilang di depan dada -> putar badan perlahan ke satu sisi, pinggul tetap
menghadap depan -> kembali ke tengah. Rotasi dari tulang belakang dada (paling besar di atas), panggul & tungkai
diam menghadap depan, kepala ikut berputar bersama badan dan sedikit mendahului dengan pandangan.
"""
import math

from mathutils import Quaternion, Vector

import bantu_duduk
import gerak

ID = "putar-badan"
POSISI = "duduk"

# Rotasi garis bahu ke kanan (derajat) per fraksi siklus: antisipasi kecil ke kiri, putar melewati sedikit lalu
# mengendap di 30° (tahan), kembali pelan sedikit melewati tengah lalu mengendap.
KUNCI = [
    (0.000, 0.0),
    (0.050, -1.2),
    (0.380, 31.8),
    (0.440, 29.6),
    (0.560, 30.2),
    (0.890, -1.0),
    (0.945, 0.25),
    (1.000, 0.0),
]
T_PUNCAK = 0.50
T_KEDIP = 0.92

# Depan-atas, sedikit dari kanan: wajah dan garis bahu terbaca berputar terhadap lutut dan panggul yang tetap
# menghadap depan, dan posisi duduk (paha, kursi) tetap terbaca.
KAMERA = {"azimut": 14.0, "elevasi": 22.0, "lensa": 55.0, "isi": 0.83}

# Duduk tegak tanpa bersandar: celah ke sandaran agar belikat yang berputar ke belakang tidak menembusnya.
CELAH_SANDARAN = 0.05

# Oblik perut: sisi depan-samping pinggang kiri & kanan dari tulang rusuk bawah sampai krista iliaka (eksternal
# kiri + internal kanan memutar ke kanan); garis tengah perut (rektus) tidak ikut menyala.
OTOT = [
    {"tulang": "spine_02", "grup": ("spine_01", "spine_02", "spine_03", "pelvis"), "s": (-1.6, -0.8, 2.6, 3.4),
     "arah": (-1.0, -0.45, 0.0), "lebar": 30.0, "jari": 0.22},
    {"tulang": "spine_02", "grup": ("spine_01", "spine_02", "spine_03", "pelvis"), "s": (-1.6, -0.8, 2.6, 3.4),
     "arah": (1.0, -0.45, 0.0), "lebar": 30.0, "jari": 0.22},
]

# Rotasi utama diatur pose() (bukan gerak ikutan); badan duduk lebih tinggi sedikit saat berputar.
BADAN = {"ekstensi": 0.5, "rotasi": 0.0, "miring": 0.4, "klavikula": 0.0}
KEPALA = {"yaw": 0.0, "pitch": -1.0, "lirik_yaw": -6.0, "lirik_pitch": 0.0, "lirik_roll": -0.8}
TANGAN_ISTIRAHAT = ()

# Pembagian rotasi ke ruas tulang belakang (jumlah 1 = garis bahu berputar sebesar nilai kunci): paling banyak di
# tulang belakang dada, sedikit di pinggang. Sumbu putar melalui badan ruas tulang belakang (di belakang tulang rig,
# yang berada di tengah tebal badan), sehingga punggung tidak terdorong ke sandaran saat berputar.
RUAS = (("spine_01", 0.14), ("spine_02", 0.32), ("spine_03", 0.54))
SUMBU_BELAKANG = Vector((0.0, 0.075, 0.0))

# Tangan bersilang: lengan bawah kiri di bawah (dekat dada), lengan bawah kanan menumpang di depannya; telapak
# kiri di depan bahu kanan, telapak kanan di depan bahu kiri. Koordinat ruang armature duduk tegak (bantu_duduk).
# Telapak menghadap ke dalam (ke bahu yang dipegang); arah persisnya dibuat tegak lurus arah jari oleh rig tangan.
LENGAN = {
    "l": {"pergelangan": (-0.100, -0.172, 0.895), "kutub": (0.40, -0.55, -0.73),
          "jari": (-0.59, 0.73, 0.37), "palmar": (0.40, 0.90, -0.10)},
    "r": {"pergelangan": (0.100, -0.222, 0.940), "kutub": (-0.40, -0.62, -0.68),
          "jari": (0.49, 0.85, 0.21), "palmar": (-0.40, 0.90, -0.10)},
}


def putar_belakang(derajat):
    """Rotasi delta sekitar sumbu vertikal yang melalui titik di belakang kepala tulang (badan ruas)."""
    q = Quaternion(Vector((0.0, 0.0, 1.0)), math.radians(derajat))
    return lambda M: gerak.rot_sekitar(M.translation + SUMBU_BELAKANG, q) @ M


def pose(anim, t, ops):
    a = anim.nilai(t)
    for nama, w in RUAS:
        ops[nama].append(putar_belakang(-a * w))
    for sisi, L in LENGAN.items():
        bantu_duduk.lengan_ke_dada(anim, ops, t, sisi, Vector(L["pergelangan"]), L["kutub"], L["jari"], L["palmar"])
