"""Tekuk Siku (fleksi siku), duduk, lengan KANAN anatomis.

panduanLangkah: duduk tegak, lengan lurus di samping badan -> tekuk siku, bawa tangan ke arah bahu -> tahan
sebentar di atas -> luruskan kembali perlahan. Bahu tetap turun, punggung tegak.
"""
from mathutils import Vector

import gerak

ID = "fleksi-siku"
POSISI = "duduk"

# Sudut tekuk siku (derajat, 0 = lurus) per fraksi siklus. Antisipasi kecil, naik ke ±133° lalu mengendap di
# 130° (tahan), turun pelan sedikit melewati posisi istirahat lalu mengendap.
KUNCI = [
    (0.000, 7.0),
    (0.355, 133.5),
    (0.420, 129.2),
    (0.475, 130.0),
    (0.845, 5.8),
    (0.910, 8.4),
    (0.960, 8.0),
    (1.000, 7.0),
]
T_PUNCAK = 0.445  # tengah fase tahan -> poster "puncak"
T_KEDIP = 0.875   # kedip saat istirahat

# Samping (80°): lengan bawah berayun di bidang sagital tepat sejajar bidang gambar, tangan berakhir jelas di depan
# bahu kanan (tidak tampak menyilang dada seperti pada sudut 3/4; 62° dicoba untuk S2: tangan menumpuk di depan dada).
KAMERA = {"azimut": 80.0, "elevasi": 6.0, "lensa": 60.0, "isi": 0.83}

# Biseps + brakialis: sisi depan(-luar) lengan atas kanan, dari dekat bahu sampai lipat siku. Sektor condong ke sisi
# luar (brakialis, sisi yang menghadap kamera samping) agar bagian yang tidak tertutup lengan bawah di puncak, termasuk
# lengan baju di atasnya, tersorot.
OTOT = [
    {"tulang": "upperarm_r", "grup": ("upperarm_r", "lowerarm_r"), "s": (0.10, 0.30, 0.93, 1.06),
     "arah": (-0.4, -1.0, 0.0), "lebar": 66.0, "jari": 0.075},
]

# Gerak ikutan (derajat pada puncak): badan sedikit condong ke belakang & berputar ke lengan kerja, bahu kerja
# justru sedikit turun (bentuk benar: bahu tidak terangkat).
BADAN = {"ekstensi": 1.3, "rotasi": 1.5, "miring": 0.6, "klavikula": -0.4}
KEPALA = {"yaw": -8.0, "pitch": -3.0, "lirik_yaw": -3.0, "lirik_pitch": 2.0, "lirik_roll": -1.2}
TANGAN_ISTIRAHAT = ("l",)


def pose(anim, t, ops):
    f = anim.nilai(t)
    pr = anim.progres(t, 0.06)
    # Siku tetap di samping badan: lengan atas sedikit menjauh dari badan saat istirahat (tangan bebas dari dudukan
    # kursi) lalu merapat ke sisi badan saat menekuk, sehingga lengan bawah bergerak di bidang sagital dan tangan
    # berakhir di depan bahu KANAN (tanpa rotasi internal bahu / menyilang dada).
    atas = Vector((-0.19 + 0.06 * pr, -0.03 - 0.05 * pr, -1.0)).normalized()
    maju = Vector((-0.06, -1.0, 0.0))  # bidang sagital, sedikit ke luar: tangan tepat di depan bahu kanan
    depan = (maju - atas * maju.dot(atas)).normalized()
    _, telapak = gerak.arah_lengan_bawah(atas, depan, f)
    # Telapak menghadap paha/dalam saat istirahat, berputar supinasi penuh (menghadap bahu) saat menekuk.
    palmar = (telapak + Vector((0.55, 0, 0)) * (1 - pr)).normalized()
    # Pergelangan netral (lurus) + gerak ikutan kecil: tertinggal saat percepatan, menyusul saat melambat.
    lag = max(-5.0, min(5.0, -0.0042 * anim.percepatan(t - 0.03) * (gerak.SIKLUS / 4.0) ** 2))
    jari = anim.progres(t, 0.12)
    anim.lengan(ops, t, "r", atas, depan, f, palmar, lag=lag, jari=1.0 + 1.5 * jari, ibu=1.0 + 1.0 * jari)
