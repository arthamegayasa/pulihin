"""Luruskan Tungkai (ekstensi lutut duduk), tungkai KANAN anatomis.

panduanLangkah: duduk tegak, punggung bersandar, kedua kaki menapak lantai -> luruskan satu tungkai ke depan sampai
lutut (hampir) lurus -> tahan sebentar -> turunkan kaki perlahan ke lantai. Paha tetap di dudukan (hanya lutut yang
bergerak), pergelangan kaki rileks dengan jari sedikit tertarik ke atas, tanpa menghentak.
"""
from mathutils import Vector

import gerak

ID = "ekstensi-lutut"
POSISI = "duduk"

# Sudut ekstensi lutut dari posisi duduk (derajat; duduk = sudut dalam lutut ±100°). Puncak 70° -> sudut dalam ±170°
# (hampir lurus). Naik melewati sedikit lalu mengendap (tahan), turun pelan sampai kaki menapak lembut. Tanpa nilai
# negatif: kaki yang menapak tidak boleh menekan menembus lantai (antisipasi/pengendapan ada di badan & kaki).
KUNCI = [
    (0.000, 0.0),
    (0.050, 0.0),
    (0.365, 71.6),
    (0.425, 69.6),
    (0.560, 70.2),
    (0.880, 1.2),
    (0.930, 0.0),
    (1.000, 0.0),
]
T_PUNCAK = 0.49
T_KEDIP = 0.92

# Samping kanan: tungkai bawah berayun di bidang sagital, sejajar bidang gambar.
KAMERA = {"azimut": 78.0, "elevasi": 7.0, "lensa": 60.0, "isi": 0.83}

# Kuadriseps: sisi depan(-luar) paha kanan dari bawah pangkal paha sampai atas lutut; hamstring (bawah) & bokong
# tidak ikut menyala. Pada duduk sisi depan paha menghadap atas, sisi luar (vastus lateralis) menghadap kamera.
OTOT = [
    {"tulang": "thigh_r", "grup": ("thigh_r",), "s": (0.12, 0.30, 0.86, 1.02),
     "arah": (-0.55, -1.0, 0.0), "lebar": 50.0, "jari": 0.11},
]

# Punggung tetap bersandar: hanya ikutan sangat kecil (sedikit condong menjauhi tungkai yang berat).
BADAN = {"ekstensi": 0.4, "rotasi": 0.0, "miring": 0.7, "klavikula": 0.0}
KEPALA = {"yaw": -3.0, "pitch": 1.0, "lirik_yaw": -2.0, "lirik_pitch": 3.5, "lirik_roll": 0.6}
TANGAN_ISTIRAHAT = ("l", "r")

# Arah tungkai duduk (sama dengan Animator.ops_duduk, sisi kanan): paha ke depan, tungkai bawah tegak.
PAHA = Vector((-0.13, -1.0, -0.07)).normalized()
BETIS_0 = Vector((-0.03, -0.10, -1.0)).normalized()
SUMBU = BETIS_0.cross(PAHA).normalized()  # sumbu engsel lutut (≈ −X, menghadap lateral/kamera); + = ekstensi


def pose(anim, t, ops):
    e = anim.nilai(t)
    pr = anim.progres(t, 0.05)
    ops["calf_r"] = [gerak.arahkan(gerak.rotasi(BETIS_0, SUMBU, e))]
    # Pergelangan kaki rileks: kaki ikut berputar bersama tungkai bawah (sudut pergelangan tetap) + dorsofleksi
    # kecil di puncak; sedikit tertinggal saat tungkai dipercepat, menyusul saat melambat (gerak ikutan).
    lag = max(-4.0, min(4.0, -0.006 * anim.percepatan(t - 0.05))) * min(1.0, 5.0 * pr)
    kaki = e + 7.0 * pr + lag
    for tulang in ("foot_r", "ball_r"):
        dasar = anim.p.rest[tulang].to_3x3() @ Vector((0, 1, 0)) + Vector((-0.07, 0, 0))
        ops[tulang] = [gerak.arahkan(gerak.rotasi(dasar, SUMBU, kaki + (4.0 * pr if tulang == "ball_r" else 0.0)))]
