"""Angkat Lengan ke Samping (abduksi bahu), duduk, lengan KANAN anatomis.

panduanLangkah: duduk tegak, lengan lurus di samping badan -> angkat lengan lurus ke samping sampai setinggi bahu
(±90°, telapak menghadap bawah) -> jaga badan tetap tegak -> turunkan perlahan. Bahu tidak terangkat.
"""
from mathutils import Vector

import gerak

ID = "abduksi-bahu"
POSISI = "duduk"

# Sudut abduksi tambahan dari posisi menggantung (yang sudah ±11° menjauh dari badan) per fraksi siklus. Puncak
# 79° -> lengan tepat horizontal (±90° dari badan, setinggi bahu; tidak melewatinya, sesuai peringatan latihan).
KUNCI = [
    (0.00, 0.0),
    (0.05, -1.5),
    (0.40, 80.2),
    (0.47, 78.8),
    (0.56, 79.2),
    (0.90, -1.2),
    (0.95, 0.3),
    (1.00, 0.0),
]
T_PUNCAK = 0.515
T_KEDIP = 0.91

# Depan (sedikit ke kanan karakter agar ada kedalaman): bidang gerak frontal terbaca penuh.
KAMERA = {"azimut": 10.0, "elevasi": 5.0, "lensa": 60.0, "isi": 0.83}

# Deltoid tengah: sisi luar-atas puncak bahu sampai sepertiga atas lengan atas.
OTOT = [
    {"tulang": "upperarm_r", "grup": ("upperarm_r", "clavicle_r"), "s": (-0.35, -0.12, 0.42, 0.68),
     "arah": (-1.0, -0.45, 0.8), "lebar": 58.0, "jari": 0.09},
]

# Badan tegak: hanya condong lateral sangat kecil menjauhi lengan (penyeimbang alami), bukan miring.
BADAN = {"ekstensi": 0.3, "rotasi": 0.0, "miring": 0.9, "klavikula": 2.5}
KEPALA = {"yaw": -3.0, "pitch": -2.0, "lirik_yaw": -2.5, "lirik_pitch": -0.5, "lirik_roll": 0.8}
TANGAN_ISTIRAHAT = ("l",)

ATAS_0 = Vector((-0.19, -0.02, -1.0)).normalized()
SUMBU = Vector((0.0, 1.0, 0.0))                     # anteroposterior murni: lengan tetap di bidang frontal
DEPAN_0 = Vector((0.0, -1.0, 0.0))                  # lipat siku menghadap depan sepanjang gerak
PALMAR_0 = Vector((1.0, 0.15, 0.0))                 # telapak menghadap paha -> menghadap bawah di 90°


def pose(anim, t, ops):
    a = anim.nilai(t)
    pr = anim.progres(t, 0.04)
    atas = gerak.rotasi(ATAS_0, SUMBU, a)
    depan = gerak.rotasi(DEPAN_0, SUMBU, a)
    palmar = gerak.rotasi(PALMAR_0, SUMBU, a)
    # Gerak abduksi menjauhi telapak: tangan yang tertinggal saat lengan dipercepat menekuk sedikit ke arah
    # telapak (fleksi pergelangan), lalu menyusul saat melambat.
    lag = max(-4.0, min(4.0, 0.010 * anim.percepatan(t - 0.04)))
    anim.lengan(ops, t, "r", atas, depan, 9.0 - 4.0 * pr, palmar, lag_palmar=lag, jari=0.85 - 0.3 * pr, ibu=0.9)
