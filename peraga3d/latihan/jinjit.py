"""Jinjit Berpegangan (heel raise), kedua kaki.

panduanLangkah: berdiri tegak berpegangan pada sandaran kursi -> naikkan tumit perlahan, bertumpu pada ujung kaki ->
tahan sebentar -> turunkan tumit perlahan ke lantai.

Telapak berputar di sendi pangkal jari (jari kaki tetap rata di lantai, tidak tergelincir); seluruh badan naik
setinggi pergelangan kaki dan sedikit maju di atas ujung kaki (pusat massa di atas tumpuan), lutut tetap lurus,
tangan tetap menggenggam sandaran (siku sedikit meluruskan).
"""
from mathutils import Vector

ID = "jinjit"
POSISI = "berdiri"

# Sudut angkat tumit (derajat; ±39° = tumit naik ±7 cm). Naik, sedikit lewat lalu mengendap, tahan, turun lebih pelan.
KUNCI = [
    (0.00, 0.0),
    (0.08, 0.0),
    (0.36, 40.0),
    (0.42, 38.0),
    (0.60, 38.6),
    (0.92, 0.0),
    (1.00, 0.0),
]
T_PUNCAK = 0.51
T_KEDIP = 0.02

# Samping kanan: naiknya tumit & sendi pergelangan kaki terbaca penuh; kursi di depan (kanan bingkai).
KAMERA = {"azimut": 80.0, "elevasi": 3.0, "lensa": 60.0, "isi": 0.83}

# Betis (gastroknemius) kedua tungkai: sisi belakang betis, dua pertiga atas.
OTOT = [
    {"tulang": "calf_r", "grup": ("calf_r",), "s": (0.04, 0.16, 0.55, 0.75), "arah": (-0.45, 1.0, 0.0),
     "lebar": 70.0, "jari": 0.09},
    {"tulang": "calf_l", "grup": ("calf_l",), "s": (0.04, 0.16, 0.55, 0.75), "arah": (-0.3, 1.0, 0.0),
     "lebar": 70.0, "jari": 0.09},
]
# Cincin di sisi luar pergelangan kaki kanan, sumbu mediolateral (= sumbu plantarfleksi), menghadap kamera.
CINCIN = {"tulang": "foot_r", "jari": 0.05, "geser": 0.075}

BADAN = {"ekstensi": 0.0, "rotasi": 0.0, "miring": 0.0, "klavikula": 0.0}
KEPALA = {"yaw": -3.0, "pitch": 1.0, "lirik_yaw": 0.0, "lirik_pitch": -1.5, "lirik_roll": 0.0}
TANGAN_ISTIRAHAT = ("l", "r")  # kedua tangan menggenggam rel sandaran


def tubuh(anim, t):
    tumit = anim.nilai(t)
    # Panggul naik tepat setinggi pergelangan kaki (lutut tetap lurus) dan maju 80 % pergeseran pergelangan,
    # sedikit mendahului tumit (berat badan dipindah ke ujung kaki dulu).
    naik = anim.kaki_tapak("l", tumit)[0] - anim.kaki["l"]["A"]
    maju = anim.kaki_tapak("l", anim.nilai(t + 0.08))[0] - anim.kaki["l"]["A"]
    return {"tumit": tumit, "geser": (0.0, 0.8 * maju.y, naik.z)}


def pose(anim, t, ops):
    # Tungkai & badan diatur Animator lewat tubuh(); tidak ada anggota tubuh lain yang bekerja.
    anim.sumbu_cincin = Vector((-1.0, 0.0, 0.0))  # mediolateral, ke kamera (sisi kanan)
