"""Menggapai ke Depan (reaching), duduk, lengan KANAN anatomis.

panduanLangkah: duduk tegak, tangan di depan dada -> gapai ke depan sejauh yang nyaman sampai siku lurus (setinggi
dada) -> kedua kaki tetap menapak -> tarik tangan kembali ke depan dada. Badan tetap di kursi: hanya condong ke
depan sedikit dan bahu kerja ikut maju (protraksi) secara alami, bahu tidak terangkat.
"""
from mathutils import Vector

import gerak

ID = "menggapai"
POSISI = "duduk"

# Progres gapaian (%, 0 = tangan di depan dada, 100 = siku lurus) per fraksi siklus: tarik sedikit ke belakang
# (antisipasi), gapai melewati sedikit lalu mengendap (tahan), kembali pelan sedikit melewati lalu mengendap.
KUNCI = [
    (0.000, 0.0),
    (0.050, -2.5),
    (0.380, 103.0),
    (0.440, 99.0),
    (0.555, 100.0),
    (0.885, -2.0),
    (0.940, 0.5),
    (1.000, 0.0),
]
T_PUNCAK = 0.50
T_KEDIP = 0.92

# Samping-depan kanan: lengan yang menggapai terbaca utuh sebagai siluet mendatar, dengan sedikit kedalaman.
KAMERA = {"azimut": 66.0, "elevasi": 8.0, "lensa": 60.0, "isi": 0.83}

# Deltoid depan (fleksi bahu) + triseps (ekstensi siku): sisi depan-luar puncak bahu, dan sisi belakang-luar
# lengan atas (kepala lateral triseps, yang menghadap kamera saat lengan terangkat ke depan).
OTOT = [
    {"tulang": "upperarm_r", "grup": ("upperarm_r", "clavicle_r"), "s": (-0.35, -0.12, 0.42, 0.68),
     "arah": (-0.35, -1.0, 0.25), "lebar": 58.0, "jari": 0.09},
    {"tulang": "upperarm_r", "grup": ("upperarm_r",), "s": (0.22, 0.40, 0.86, 1.0),
     "arah": (-0.75, 1.0, 0.0), "lebar": 52.0, "jari": 0.075},
]
CINCIN = [
    {"tulang": "upperarm_r", "jari": 0.068, "geser": 0.10},
    {"tulang": "lowerarm_r", "jari": 0.047, "geser": 0.055},
]

# Badan tetap bersandar: condong ke depan kecil, putar sedikit ke kiri (bahu kanan maju), bahu tidak terangkat.
BADAN = {"ekstensi": -2.2, "rotasi": -3.5, "miring": 0.3, "klavikula": 0.8}
KEPALA = {"yaw": -5.0, "pitch": 2.0, "lirik_yaw": -2.0, "lirik_pitch": 1.5, "lirik_roll": -0.5}
TANGAN_ISTIRAHAT = ("l",)

ATAS_0 = Vector((-0.15, -0.02, -1.0)).normalized()  # lengan atas menggantung, siku sedikit menjauh dari badan
SUMBU = Vector((-1.0, 0.0, 0.0))                     # fleksi bahu: sumbu mediolateral murni (bidang sagital)
DEPAN_0 = (Vector((0.0, -1.0, 0.0)) - ATAS_0 * Vector((0.0, -1.0, 0.0)).dot(ATAS_0)).normalized()
PALMAR_0 = Vector((0.94, 0.0, -0.34))               # ibu jari di atas, telapak ke dalam & sedikit ke bawah

# Fleksi bahu & siku pada progres 0 dan 100 (derajat): pergelangan bergerak hampir lurus mendatar setinggi dada.
BAHU = (18.0, 76.0)
SIKU = (112.0, 4.0)
ADDUKSI = 8.0  # lengan sedikit ke tengah saat menggapai: tangan tepat di depan bahu kanan, bukan ke samping


def pose(anim, t, ops):
    p = anim.nilai(t) / 100.0
    pr = anim.progres(t, 0.05)
    a = BAHU[0] + (BAHU[1] - BAHU[0]) * p
    e = SIKU[0] + (SIKU[1] - SIKU[0]) * p
    h = ADDUKSI * p
    atas = gerak.rotasi(gerak.rotasi(ATAS_0, SUMBU, a), (0, 0, 1), h)
    depan = gerak.rotasi(gerak.rotasi(DEPAN_0, SUMBU, a), (0, 0, 1), h)
    palmar = gerak.rotasi(PALMAR_0, (0, 0, 1), h)
    # Bahu kerja ikut maju sedikit (protraksi skapula) di ujung gapaian; elevasi tetap kecil (BADAN.klavikula).
    ops["clavicle_r"].append(gerak.putar((0, 0, 1), 6.0 * pr))
    # Pergelangan sedikit tertinggal saat dipercepat lalu menyusul; jari meluruskan sedikit saat menggapai.
    lag = max(-5.0, min(5.0, -0.012 * anim.percepatan(t - 0.04)))
    anim.lengan(ops, t, "r", atas, depan, e, palmar, lag=lag, jari=1.05 - 0.5 * pr, ibu=1.0 - 0.2 * pr)
    sendi_siku = atas.cross(depan).normalized()
    anim.sumbu_cincin = [SUMBU, sendi_siku]
