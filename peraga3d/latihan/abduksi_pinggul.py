"""Angkat Kaki ke Samping (abduksi pinggul berdiri), tungkai KANAN anatomis.

panduanLangkah: berdiri tegak berpegangan pada sandaran kursi -> angkat satu kaki ke samping, lutut tetap lurus ->
jaga badan tetap tegak, jangan condong -> turunkan kaki perlahan.

Urutan alami: berat badan bergeser ke tungkai kiri dulu, panggul kanan terangkat sedikit (kaki lepas dari lantai
tanpa menekuk lutut), tungkai lurus naik ±25° dengan ujung kaki tetap menghadap depan, tahan, turun pelan, menapak,
berat badan kembali ke tengah.
"""
import math

from mathutils import Matrix, Vector

import gerak

ID = "abduksi-pinggul"
POSISI = "berdiri"

# Sudut abduksi tungkai kanan (derajat). Naik sedikit melewati 25° lalu mengendap, tahan, turun lebih pelan.
KUNCI = [
    (0.00, 0.0),
    (0.12, 0.0),
    (0.40, 26.3),
    (0.46, 24.8),
    (0.58, 25.2),
    (0.90, 0.0),
    (1.00, 0.0),
]
T_PUNCAK = 0.52
T_KEDIP = 0.02

# Depan-kanan (36°): tungkai yang bergerak & pinggul kanan tampak di samping kursi (tidak tertutup rel sandaran),
# sisi luar pinggul (gluteus medius) terlihat, bidang gerak frontal masih terbaca (cos 36° = 0,81).
KAMERA = {"azimut": 36.0, "elevasi": 8.0, "lensa": 60.0, "isi": 0.83}

# Gluteus medius kanan: sisi luar panggul dari bawah krista iliaka sampai di atas trokanter (serat depan-samping
# menghadap kamera; ilustratif).
OTOT = [
    {"tulang": "thigh_r", "grup": ("thigh_r", "pelvis"), "s": (-0.45, -0.28, 0.02, 0.16),
     "arah": (-1.0, -0.4, 0.3), "lebar": 62.0, "jari": 0.15},
]
# Cincin di depan sendi pinggul kanan, sumbu anteroposterior (= sumbu gerak abduksi).
CINCIN = {"tulang": "thigh_r", "jari": 0.07, "geser": 0.13}

# Badan tegak (tanpa condong ke samping); hanya ikutan sangat kecil.
BADAN = {"ekstensi": 0.0, "rotasi": 0.0, "miring": 0.3, "klavikula": 0.0}
KEPALA = {"yaw": -2.0, "pitch": 1.0, "lirik_yaw": -2.0, "lirik_pitch": 2.0, "lirik_roll": 0.6}
TANGAN_ISTIRAHAT = ("l", "r")  # kedua tangan menggenggam rel sandaran

# Pergeseran berat badan ke tungkai kiri (0..1): selesai sebelum kaki diangkat, kembali setelah kaki menapak.
GESER = [(0.00, 0.0), (0.11, 1.0), (0.91, 1.0), (1.00, 0.0)]
GESER_M = 0.035  # m ke kiri (tangan tetap berpegangan, jadi tidak perlu seluruh berat di atas kaki kiri)
SUMBU = Vector((0.0, 1.0, 0.0))  # anteroposterior: + = tungkai kanan ke kanan (-X)


def _angkat(anim, t):
    """Panggul kanan naik (derajat): mendahului abduksi dan baru turun setelah kaki menapak (kaki tidak menyeret)."""
    p = max(anim.progres(t, -0.12), anim.progres(t, 0.12))
    return 2.4 * gerak.mulus5(min(1.0, p * 5.0))


def _jangkau(anim):
    """Jarak pinggul-pergelangan kaki terpanjang yang masih terjangkau IK (cadangan 1,5 mm)."""
    return 0.999 * (anim.p.panjang["thigh_r"] + anim.p.panjang["calf_r"]) - 0.0015


def _tinggi(H, A, D):
    """Geser z panggul agar |H + (0,0,dz) - A| = D."""
    d = H - A
    return math.sqrt(max(D * D - d.x * d.x - d.y * d.y, 0.0)) - d.z


def tubuh(anim, t):
    """Panggul bergeser ke atas tungkai kiri. Tinggi panggul: tungkai kiri tetap selurus saat berdiri biasa; selama
    kaki kanan masih menapak, panggul juga tidak boleh lebih tinggi dari jangkauan tungkai kanan (kaki tidak
    tergelincir), batas itu dilepas begitu panggul kanan mulai naik (kaki terangkat)."""
    w = gerak.kurva_kunci(GESER, t)
    beta = _angkat(anim, t)
    r = anim.p.rest
    P = r["pelvis"].translation + anim.panggul + Vector((GESER_M * w, 0.0, 0.0))
    H = {s: P + gerak.rotasi(r[f"thigh_{s}"].translation - r["pelvis"].translation, (0, 1, 0), beta) for s in "lr"}
    D0 = (r["thigh_l"].translation + anim.panggul - anim.kaki["l"]["A"]).length
    dz_kiri = _tinggi(H["l"], anim.kaki["l"]["A"], D0)
    dz_kanan = _tinggi(H["r"], anim.kaki["r"]["A"], _jangkau(anim))
    dz = dz_kiri - max(0.0, dz_kiri - dz_kanan) * (1.0 - gerak.mulus5(beta / 1.0))
    return {"geser": (GESER_M * w, 0.0, dz), "miring_panggul": beta}


def pose(anim, t, ops):
    a = anim.nilai(t)
    pr = anim.progres(t)
    beta = _angkat(anim, t)
    A0 = anim.kaki["r"]["A"]
    batas = _jangkau(anim)

    def target(M):
        # Tungkai kaku terhadap panggul: vektor tungkai = vektor ke telapak menapak dari pinggul tanpa angkatan
        # panggul (panjang dibatasi jangkauan), diputar abduksi di sendi pinggul. Sudut 0 & angkatan 0 -> tepat di
        # telapak menapak (tidak tergelincir); angkatan panggul mengangkat kaki tanpa menekuk lutut.
        H = M.translation.copy()
        P = anim.p.pos["pelvis"].translation
        v = A0 - (P + gerak.rotasi(H - P, (0, 1, 0), -beta))
        if v.length > batas:
            v = v.normalized() * batas
        return H + gerak.rotasi(v, SUMBU, a)

    # Kaki: telapak sebagian sejajar lantai (berputar 35 % sudut tungkai), ujung kaki kembali lurus ke depan.
    Q = Matrix.Rotation(math.radians(0.35 * a), 3, SUMBU) @ Matrix.Rotation(math.radians(6.0 * pr), 3, "Z")
    _, R_kaki, R_jari = anim.kaki_tapak("r")
    anim.tungkai(ops, "r", target, Vector((0.0, -1.0, 0.0)), Q @ R_kaki, Q @ R_jari)
    # Sumbu gerak anteroposterior, diputar 20° ke arah kamera agar cincin tampak utuh (tidak terbenam di sisi pinggul).
    anim.sumbu_cincin = gerak.rotasi(-SUMBU, (0, 0, 1), -20.0)
