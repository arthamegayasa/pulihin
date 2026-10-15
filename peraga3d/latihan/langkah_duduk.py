"""Langkah di Tempat (marching duduk), DUA sisi: lutut kanan lalu kiri dalam satu siklus (aplikasi tidak
mencerminkan latihan ini).

panduanLangkah: duduk tegak, kedua kaki menapak -> angkat lutut sedikit, turunkan -> angkat lutut sisi lain,
turunkan -> lanjutkan bergantian dengan irama tenang. Badan tegak (hanya pergeseran berat badan kecil ke sisi yang
menapak), tangan rileks di paha dan ikut naik bersama paha, kaki terangkat lurus ke atas dan menapak lembut.
"""
import math

from mathutils import Matrix, Quaternion, Vector

import gerak

ID = "langkah-duduk"
POSISI = "duduk"

# Fleksi pinggul tambahan (derajat): POSITIF = lutut kanan naik, NEGATIF = lutut kiri naik. Tiap angkatan naik
# sedikit melewati lalu mengendap (tahan singkat), turun sampai kaki menapak lembut (tanpa menembus lantai).
KUNCI = [
    (0.000, 0.0),
    (0.025, 0.0),
    (0.240, 21.0),
    (0.280, 19.8),
    (0.325, 20.0),
    (0.500, 0.0),
    (0.525, 0.0),
    (0.740, -21.0),
    (0.780, -19.8),
    (0.825, -20.0),
    (1.000, 0.0),
]
T_PUNCAK = 0.30   # tengah tahan lutut kanan -> poster "puncak"
T_KEDIP = 0.51    # saat kedua kaki menapak
PUNCAK = 20.0

# Serong depan kanan, sedikit dari atas: kedua lutut dan paha (bagian depan pinggul) terbaca naik bergantian.
KAMERA = {"azimut": 32.0, "elevasi": 18.0, "lensa": 55.0, "isi": 0.83}

# Fleksor pinggul (iliopsoas + rektus femoris proksimal): lipat paha depan sampai pertengahan atas paha (sisi atas
# paha saat duduk; paha tebal di pangkal -> jari wilayah lebar). Kanal a = kanan, kanal b = kiri; masing-masing
# menyala hanya saat lututnya naik.
OTOT = [
    {"tulang": "thigh_r", "grup": ("thigh_r", "pelvis"), "s": (-0.12, 0.04, 0.55, 0.72),
     "arah": (-0.3, -1.0, 0.15), "lebar": 55.0, "jari": 0.16},
    {"tulang": "thigh_l", "grup": ("thigh_l", "pelvis"), "s": (-0.12, 0.04, 0.55, 0.72),
     "arah": (0.3, -1.0, 0.15), "lebar": 55.0, "jari": 0.16, "kanal": "b"},
]
# Cincin di sisi luar sendi pinggul kanan & kiri (sumbu fleksi pinggul), masing-masing menyala bersama sisinya.
CINCIN = [
    {"tulang": "thigh_r", "jari": 0.075, "geser": 0.135},
    {"tulang": "thigh_l", "jari": 0.075, "geser": 0.135, "kanal": "b"},
]
# Tangan bertumpu di paha dekat lutut (bukan di pangkal paha seperti bawaan) agar wilayah otot yang menyala tidak
# tertutup tangan/lengan bawah: geser sepanjang paha (m) dan koreksi tinggi (+ = turun) mengikuti paha yang mengecil.
TANGAN_MAJU, TANGAN_TURUN = 0.17, -0.002

# Gerak ikutan badan/kepala ditangani pose() per sisi (Animator hanya mengenal satu sisi kerja).
BADAN = {"ekstensi": 0.0, "rotasi": 0.0, "miring": 0.0, "klavikula": 0.0}
KEPALA = {"yaw": -2.0, "pitch": 1.5, "lirik_yaw": 0.0, "lirik_pitch": 0.0, "lirik_roll": 0.0}
TANGAN_ISTIRAHAT = ("l", "r")

SISI = {"r": -1, "l": 1}
FLEKSI = Vector((-1.0, 0.0, 0.0))  # sumbu fleksi pinggul (mediolateral murni): lutut naik lurus ke atas
_tangan_awal = {}
_pinggul_awal = {}
HIKE = 3.5  # derajat kemiringan panggul (sisi lutut yang naik terangkat) pada puncak angkatan


def angkat(anim, t, sisi):
    """Fleksi pinggul tambahan sisi ini (derajat, >= 0)."""
    v = anim.nilai(t)
    return max(0.0, v if sisi == "r" else -v)


def progres(anim, t, sisi, tunda=0.0):
    return min(1.0, angkat(anim, t - tunda, sisi) / PUNCAK)


def kuat(anim, t):
    """Pendar per sisi (kanal a = kanan, kanal b = kiri), sedikit mendahului gerak seperti bawaan Animator."""
    return tuple(gerak.mulus5(progres(anim, t, s, -0.08) ** 0.8) for s in ("r", "l"))


def _rot_hike(pivot, derajat):
    """Matriks rotasi sekitar sumbu antero-posterior (+Y) melalui `pivot`; + = sisi kanan (−X) naik."""
    return gerak.rot_sekitar(pivot, Quaternion(Vector((0.0, 1.0, 0.0)), math.radians(derajat)))


def pose(anim, t, ops):
    # Panggul sisi yang terangkat naik sedikit, berporos di sendi pinggul sisi tumpu (tungkai tumpu tidak bergeser),
    # sehingga bagian belakang paha yang naik tidak menekan dudukan: pergeseran berat badan ke duduk sisi tumpu.
    kanan, kiri = gerak.mulus5(progres(anim, t, "r", 0.06)), gerak.mulus5(progres(anim, t, "l", 0.06))
    lokal = {s: anim.p.rest["pelvis"].inverted() @ anim.p.rest[f"thigh_{s}"].translation for s in SISI}
    hike = {"r": HIKE * kanan, "l": -HIKE * kiri}  # sisi yang naik -> derajat (poros di sendi pinggul lawan)
    for sisi, d in hike.items():
        if abs(d) > 1e-4:
            tumpu = "l" if sisi == "r" else "r"
            ops["pelvis"].append(lambda M, d=d, tumpu=tumpu: _rot_hike(M @ lokal[tumpu], d) @ M)
    for sisi, x in SISI.items():
        a = angkat(anim, t, sisi)
        pr = progres(anim, t, sisi, 0.05)
        paha = gerak.rotasi(Vector((0.13 * x, -1.0, -0.07)), FLEKSI, a)
        # Tungkai bawah hampir tegak: kaki terangkat lurus ke atas, sedikit tertinggal ke belakang saat naik.
        betis = gerak.rotasi(Vector((0.03 * x, -0.10, -1.0)), FLEKSI, -0.12 * a)
        ops[f"thigh_{sisi}"] = [gerak.arahkan(paha)]
        ops[f"calf_{sisi}"] = [gerak.arahkan(betis)]
        # Pergelangan kaki rileks: jari sedikit turun setelah kaki lepas dari lantai, rata lagi sebelum menapak.
        plantar = 7.0 * pr ** 1.5
        for tulang in (f"foot_{sisi}", f"ball_{sisi}"):
            dasar = anim.p.rest[tulang].to_3x3() @ Vector((0, 1, 0)) + Vector((0.07 * x, 0, 0))
            ops[tulang] = [gerak.arahkan(gerak.rotasi(dasar, FLEKSI, -0.12 * a - plantar))]
        # Tangan rileks di paha ikut naik bersama paha: rotasi fleksi sekitar sendi pinggul, lalu ikut naiknya panggul.
        if sisi in anim.tangan_istirahat:
            if sisi not in _tangan_awal:
                target, palmar, jari = anim.tangan_istirahat[sisi]
                _tangan_awal[sisi] = (target + jari * TANGAN_MAJU - Vector((0.0, 0.0, TANGAN_TURUN)), palmar, jari)
                _pinggul_awal.update({s: anim.p.pos[f"thigh_{s}"].translation.copy() for s in SISI})
            target, palmar, jari = _tangan_awal[sisi]
            P = _pinggul_awal[sisi]
            H = Matrix.Identity(4)
            if abs(hike[sisi]) > 1e-4:
                H = _rot_hike(_pinggul_awal["l" if sisi == "r" else "r"], hike[sisi])
            anim.tangan_istirahat[sisi] = (H @ (P + gerak.rotasi(target - P, FLEKSI, a)),
                                           H.to_3x3() @ gerak.rotasi(palmar, FLEKSI, a),
                                           H.to_3x3() @ gerak.rotasi(jari, FLEKSI, a))
    # Batang tubuh mengimbangi kemiringan panggul: hanya condong kecil menjauhi lutut yang naik; kepala tetap datar.
    miring = 1.0 * (kanan - kiri)                     # condong akhir (+ = ke kiri karakter)
    for nama, w in (("spine_01", 0.45), ("spine_02", 0.35), ("spine_03", 0.20)):
        ops[nama].append(gerak.putar((0, 1, 0), (miring - HIKE * (kanan - kiri)) * w))
    ops["head"].append(gerak.putar((0, 1, 0), -0.7 * miring))
    anim.sumbu_cincin = [Vector((-1.0, 0.0, 0.0)), Vector((1.0, 0.0, 0.0))]
