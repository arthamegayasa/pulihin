"""Duduk ke Berdiri (sit to stand), kedua tungkai.

panduanLangkah: duduk di tepi kursi kokoh, kaki menapak selebar bahu -> pegang meja di depan -> condongkan badan ke
depan, lalu berdiri perlahan -> duduk kembali perlahan dan terkendali.

Telapak terkunci di lantai (sedikit di belakang lutut), kedua tangan bertumpu di meja sepanjang siklus. Urutan:
condong dari pinggul dengan punggung lurus ("hidung di atas ujung kaki"), bokong terangkat saat badan paling condong,
panggul maju lalu naik sampai berdiri tegak, jeda, panggul mundur & turun pelan dengan badan condong, mendarat
lembut di kursi, badan kembali tegak.
"""
import math

from mathutils import Vector

import gerak

ID = "duduk-berdiri"
POSISI = "duduk-berdiri"

# Kemajuan berdiri (0 = duduk, 100 = berdiri tegak). Naik 1,6 dtk, jeda, duduk 1,8 dtk (lebih pelan, terkendali).
KUNCI = [
    (0.00, 0.0),
    (0.24, 0.0),
    (0.50, 100.0),
    (0.63, 100.0),
    (0.93, 0.0),
    (1.00, 0.0),
]
# Condong badan dari pinggul (derajat): siap (badan sedikit condong ke meja), paling condong tepat saat bokong
# terangkat dan saat mulai turun, tegak penuh saat berdiri.
CONDONG = [
    (0.00, 16.0),
    (0.27, 34.0),
    (0.50, 0.0),
    (0.63, 0.0),
    (0.77, 30.0),
    (0.93, 22.0),
    (1.00, 16.0),
]
# Pendar kuadriseps + gluteus: menyala saat condong-berdiri dan selama duduk terkendali (kontraksi eksentrik),
# lebih redup saat berdiri diam, padam setelah duduk.
KUAT = [
    (0.00, 0.0),
    (0.10, 0.0),
    (0.27, 1.0),
    (0.50, 1.0),
    (0.565, 0.75),
    (0.63, 0.8),
    (0.68, 1.0),
    (0.90, 1.0),
    (1.00, 0.0),
]
T_PUNCAK = 0.565  # tengah jeda berdiri
T_KEDIP = 0.03

# Samping kanan: lintasan panggul, tekuk lutut & condong badan terbaca penuh; kursi kiri, meja kanan bingkai.
KAMERA = {"azimut": 82.0, "elevasi": 6.0, "lensa": 55.0, "isi": 0.83}

OTOT = [
    # kuadriseps kanan & kiri: depan paha
    {"tulang": "thigh_r", "grup": ("thigh_r",), "s": (0.08, 0.28, 0.85, 1.0), "arah": (-0.35, -1.0, 0.0),
     "lebar": 62.0, "jari": 0.12},
    {"tulang": "thigh_l", "grup": ("thigh_l",), "s": (0.08, 0.28, 0.85, 1.0), "arah": (-0.2, -1.0, 0.0),
     "lebar": 62.0, "jari": 0.12},
    # gluteus maksimus kanan & kiri: bokong, di atas-belakang sendi pinggul
    {"tulang": "thigh_r", "grup": ("thigh_r", "pelvis"), "s": (-0.42, -0.28, 0.12, 0.26), "arah": (-0.35, 1.0, 0.0),
     "lebar": 50.0, "jari": 0.17},
    {"tulang": "thigh_l", "grup": ("thigh_l", "pelvis"), "s": (-0.42, -0.28, 0.12, 0.26), "arah": (-0.1, 1.0, 0.0),
     "lebar": 50.0, "jari": 0.17},
]
# Cincin lutut & pinggul kanan, sumbu mediolateral (sumbu fleksi-ekstensi), menghadap kamera.
CINCIN = [
    {"tulang": "calf_r", "jari": 0.062, "geser": 0.11},
    {"tulang": "thigh_r", "jari": 0.075, "geser": 0.17},
]

BADAN = {"ekstensi": 0.0, "rotasi": 0.0, "miring": 0.0, "klavikula": 0.0}
KEPALA = {"yaw": -3.0, "pitch": 2.0, "lirik_yaw": 0.0, "lirik_pitch": 0.0, "lirik_roll": 0.0}
TANGAN_ISTIRAHAT = ("l", "r")  # kedua telapak bertumpu di meja

# Geometri duduk: betis condong 10° (lutut sedikit di depan pergelangan kaki = kaki ditarik sedikit ke belakang),
# paha turun 10° dari pinggul ke lutut (dudukan kursi standar ±0,46 m).
BETIS_DUDUK, PAHA_DUDUK = 10.0, 10.0
PINGGUL_REST = Vector((0.0, 0.012, 0.87))  # tengah kepala kedua tulang paha saat rest
ISKIUM = Vector((0.0, 0.04, -0.085))       # tumpuan duduk relatif terhadap kepala pelvis


def _ujung(anim):
    """Geser Root saat duduk dan saat berdiri, dihitung dari telapak yang terkunci."""
    A = anim.kaki["l"]["A"]
    a, b = anim.p.panjang["thigh_l"], anim.p.panjang["calf_l"]
    bt, ph = math.radians(BETIS_DUDUK), math.radians(PAHA_DUDUK)
    lutut_y, lutut_z = A.y - b * math.sin(bt), A.z + b * math.cos(bt)
    duduk = Vector((0.0, lutut_y + a * math.cos(ph) - PINGGUL_REST.y, lutut_z + a * math.sin(ph) - PINGGUL_REST.z))
    A_rest = anim.p.rest["foot_l"].translation
    berdiri = Vector((0.0, 0.0, A.z - A_rest.z - 0.001))
    return duduk, berdiri


def tubuh(anim, t):
    s = anim.nilai(t) / 100.0
    condong = gerak.kurva_kunci(CONDONG, t)
    duduk, berdiri = _ujung(anim)
    # Panggul mula-mula maju (y), lalu naik (z): lintasan alami bangkit dari kursi; kebalikannya saat duduk.
    g = Vector((0.0, duduk.y + (berdiri.y - duduk.y) * (1 - (1 - s) ** 2), duduk.z + (berdiri.z - duduk.z) * s ** 1.5))
    # Selama bokong di kursi, panggul berguling di tumpuan duduk (iskium tetap di dudukan, tidak terangkat/tembus);
    # bantalan bokong & celana tertekan saat condong: panggul sedikit naik agar kain tidak menembus dudukan.
    kontak = 1.0 - gerak.mulus5(s / 0.12)
    g -= (gerak.rotasi(ISKIUM, (1, 0, 0), 0.72 * condong) - ISKIUM) * kontak
    g.z += 0.0003 * condong * kontak
    return {"geser": g, "condong": condong, "kepala_pitch": -0.45 * condong}


def kuat(anim, t):
    return gerak.kurva_kunci(KUAT, t)


def pose(anim, t, ops):
    # Tungkai, panggul & badan diatur Animator lewat tubuh(); tangan bertumpu di meja (tangan istirahat).
    anim.sumbu_cincin = Vector((-1.0, 0.0, 0.0))  # mediolateral, ke kamera (sisi kanan)
