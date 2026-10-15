"""Angkat Lengan ke Depan (fleksi bahu), duduk, lengan KANAN anatomis.

panduanLangkah: duduk tegak, kedua kaki menapak -> lengan lurus di samping badan -> angkat lengan lurus ke depan
setinggi yang nyaman (±115°) -> turunkan perlahan sampai kembali di samping badan. Ibu jari di atas (telapak
menghadap ke dalam), siku hampir lurus, bahu tidak terangkat, punggung tegak.
"""
from mathutils import Vector

import gerak

ID = "fleksi-bahu"
POSISI = "duduk"

# Sudut fleksi bahu dari posisi menggantung (derajat) per fraksi siklus: antisipasi kecil, naik melewati sedikit
# lalu mengendap di 115° (tahan), turun pelan sedikit melewati posisi istirahat lalu mengendap.
KUNCI = [
    (0.00, 0.0),
    (0.05, -1.5),
    (0.40, 118.0),
    (0.47, 115.0),
    (0.56, 115.5),
    (0.90, -1.2),
    (0.95, 0.3),
    (1.00, 0.0),
]
T_PUNCAK = 0.515
T_KEDIP = 0.91

# Samping (78°): lengkung lengan lurus di bidang sagital, dari bawah ke depan-atas, terbaca utuh sebagai siluet.
KAMERA = {"azimut": 78.0, "elevasi": 5.0, "lensa": 60.0, "isi": 0.83}

# Deltoid depan: sisi depan-luar puncak bahu sampai sepertiga atas lengan atas.
OTOT = [
    {"tulang": "upperarm_r", "grup": ("upperarm_r", "clavicle_r"), "s": (-0.35, -0.12, 0.42, 0.68),
     "arah": (-0.35, -1.0, 0.25), "lebar": 58.0, "jari": 0.09},
]
CINCIN = {"tulang": "upperarm_r", "jari": 0.068, "geser": 0.10}

BADAN = {"ekstensi": 0.8, "rotasi": 0.4, "miring": 0.5, "klavikula": 2.5}
KEPALA = {"yaw": -6.0, "pitch": -2.0, "lirik_yaw": -2.0, "lirik_pitch": -2.5, "lirik_roll": -0.6}
TANGAN_ISTIRAHAT = ("l",)

ATAS_0 = Vector((-0.19, -0.02, -1.0)).normalized()  # menggantung, sedikit menjauh dari dudukan kursi
# Sumbu fleksi = mediolateral murni (−X, menghadap lateral/kamera): lengan bergerak di bidang sagital dengan jarak
# lateral tetap dari badan (tangan tepat di depan bahu kanan, tidak menyilang ke tengah saat di atas horizontal).
SUMBU = Vector((-1.0, 0.0, 0.0))
DEPAN_0 = (Vector((0.0, -1.0, 0.0)) - ATAS_0 * Vector((0.0, -1.0, 0.0)).dot(ATAS_0)).normalized()
PALMAR_0 = Vector((1.0, 0.15, 0.0))                 # telapak menghadap paha


def pose(anim, t, ops):
    a = anim.nilai(t)
    pr = anim.progres(t, 0.04)
    atas = gerak.rotasi(ATAS_0, SUMBU, a)
    depan = gerak.rotasi(DEPAN_0, SUMBU, a)
    palmar = gerak.rotasi(PALMAR_0, SUMBU, a)
    # Tangan tertinggal sedikit saat lengan dipercepat, menyusul saat melambat; siku hampir lurus.
    lag = max(-5.0, min(5.0, -0.012 * anim.percepatan(t - 0.04)))
    anim.lengan(ops, t, "r", atas, depan, 9.0 - 4.0 * pr, palmar, lag=lag, jari=0.85 - 0.3 * pr, ibu=0.9)
    anim.sumbu_cincin = SUMBU
