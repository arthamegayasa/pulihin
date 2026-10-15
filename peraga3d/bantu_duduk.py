"""Pembantu pose latihan duduk (PeragaDuduk): lengan IK yang ikut bingkai dada (tangan bersilang di dada).

Target pergelangan, kutub siku, arah jari, dan normal telapak ditulis dalam koordinat ruang armature saat duduk
tegak (frame 1, sebelum batang tubuh berputar); setiap frame diputar ikut orientasi `spine_03` relatif terhadap
orientasinya pada panggilan pertama (t = 0). Translasi diukur dari kepala `spine_03`, sehingga tetap benar walau
`Animator.turun` (tinggi duduk) berubah antar panggilan.
"""
from mathutils import Vector

import gerak

# Kepala spine_03 saat duduk tegak (ruang armature, frame 1) — acuan offset target.
DADA_0 = Vector((0.0, 0.047, 0.731))
_R0 = {}


def bingkai_dada(anim):
    """(kepala spine_03 kini, rotasi dada relatif terhadap t = 0)."""
    M = anim.p.pos["spine_03"]
    R = M.to_3x3()
    if "R0" not in _R0:
        _R0["R0"] = R.copy()
    return M.translation.copy(), R @ _R0["R0"].inverted()


def lengan_ke_dada(anim, ops, t, sisi, pergelangan, kutub, jari, palmar, tekuk=0.55, ibu=0.7):
    """Lengan `sisi` dengan pergelangan terkunci di titik `pergelangan` yang ikut dada (IK dua tulang, siku ke
    arah `kutub`), tangan mengarah `jari` dengan telapak menghadap `palmar` (semua dalam ruang duduk tegak)."""
    geo = anim.geo[sisi]
    a, b = anim.p.panjang[f"upperarm_{sisi}"], anim.p.panjang[f"lowerarm_{sisi}"]
    x = 1 if sisi == "l" else -1
    mikro = Vector((gerak.gelombang(t, [(1, 0.0010, 0.7 + x)]), 0.0, gerak.gelombang(t, [(2, 0.0008, 1.9 + x)])))
    nilai = {}

    def hitung():
        if "T" not in nilai:
            h, R = bingkai_dada(anim)
            nilai["T"] = h + R @ (Vector(pergelangan) + mikro - DADA_0)
            nilai["K"] = R @ Vector(kutub)
            nilai["J"] = (R @ Vector(jari)).normalized()
            nilai["P"] = (R @ Vector(palmar)).normalized()
        return nilai

    def atas(M):
        n = hitung()
        return gerak.ik_dua_tulang(M.translation.copy(), n["T"], a, b, n["K"]) - M.translation

    ops[f"upperarm_{sisi}"] = [gerak.arahkan(atas)]
    ops[f"lowerarm_{sisi}"] = [gerak.arahkan(lambda M: hitung()["T"] - M.translation),
                               lambda M: gerak.puntir_ke(geo.palmar_lengan_lokal, hitung()["P"], 0.6)(M)]
    ops[f"hand_{sisi}"] = [gerak.orientasikan(lambda M: geo.rotasi(hitung()["J"], hitung()["P"]))]
    v = [gerak.gelombang(t, [(1, 1.5, k * 1.3 + (0.0 if sisi == "r" else 0.8))]) for k in range(4)]
    gerak.operasi_jari(ops, anim.p, geo, sisi, tekuk=tekuk, variasi=v, ibu=ibu)
