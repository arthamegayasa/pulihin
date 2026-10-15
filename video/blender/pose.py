"""Pose dan animasi Pak Budi pada rig MPFB "game_engine".

Konvensi ruang armature MPFB: karakter menghadap -Y, kanan anatomis = -X, atas = +Z.
Pose disusun sebagai rotasi DELTA di ruang armature yang diterapkan berurutan dari induk ke anak
(atau sebagai arah tulang yang diinginkan), lalu dikonversi ke matrix_basis setiap tulang dengan
matematika matriks murni (tanpa depsgraph update per tulang), sehingga ribuan frame cepat dikunci.
"""
import math

from mathutils import Matrix, Quaternion, Vector

# ---------------- matematika rig ----------------


def urutan_hierarki(rig):
    hasil = []

    def jalan(b):
        hasil.append(b.name)
        for c in b.children:
            jalan(c)

    for b in rig.data.bones:
        if b.parent is None:
            jalan(b)
    return hasil


def _rot_sekitar(titik, q):
    return Matrix.Translation(titik) @ q.to_matrix().to_4x4() @ Matrix.Translation(-titik)


class Penyusun:
    """Menyusun matriks pose armature-space untuk satu frame."""

    def __init__(self, rig):
        self.rig = rig
        self.urut = urutan_hierarki(rig)
        self.rest = {b.name: b.matrix_local.copy() for b in rig.data.bones}
        self.induk = {b.name: (b.parent.name if b.parent else None) for b in rig.data.bones}

    def susun(self, operasi):
        """`operasi[nama]` = daftar fungsi (M_ikut, kepala) -> Matrix rotasi delta 4x4 di ruang armature
        yang diterapkan sekitar kepala tulang. Mengembalikan {nama: matrix_basis}."""
        pos = {}
        basis = {}
        for n in self.urut:
            p = self.induk[n]
            rel = self.rest[p].inverted() @ self.rest[n] if p else self.rest[n]
            ikut = pos[p] @ rel if p else rel.copy()
            M = ikut
            for op in operasi.get(n, ()):
                M = op(M)
            pos[n] = M
            basis[n] = rel.inverted() @ pos[p].inverted() @ M if p else rel.inverted() @ M
        self.pos = pos
        return basis


def putar(sumbu, derajat):
    """Rotasi delta sekitar sumbu armature (melalui kepala tulang)."""
    q = Quaternion(Vector(sumbu).normalized(), math.radians(derajat))
    return lambda M: _rot_sekitar(M.translation.copy(), q) @ M


def arahkan(arah, puntir=0.0):
    """Putar tulang (rotasi minimal) sehingga sumbu Y-nya menunjuk `arah`, lalu puntir sekitar sumbunya."""
    tujuan = Vector(arah).normalized()

    def f(M):
        kini = (M.to_3x3() @ Vector((0, 1, 0))).normalized()
        q = kini.rotation_difference(tujuan)
        if puntir:
            q = Quaternion(tujuan, math.radians(puntir)) @ q
        return _rot_sekitar(M.translation.copy(), q) @ M

    return f


def tekuk_lokal(derajat, sumbu=0):
    """Rotasi sekitar sumbu lokal tulang itu sendiri (kolom `sumbu` matriksnya), mis. menekuk jari."""

    def f(M):
        ax = M.to_3x3().col[sumbu].normalized()
        return _rot_sekitar(M.translation.copy(), Quaternion(ax, math.radians(derajat))) @ M

    return f


JARI = ("index", "middle", "ring", "pinky")


def operasi_jari(ops, sisi, tekuk=1.0, sumbu=0):
    """Jari rileks sedikit menekuk (bukan terbuka kaku seperti manekin)."""
    for i, j in enumerate(JARI):
        for ruas, d in ((1, 18), (2, 26), (3, 16)):
            ops[f"{j}_0{ruas}_{sisi}"] = [tekuk_lokal(tekuk * (d + 4 * i), sumbu)]
    ops[f"thumb_02_{sisi}"] = [tekuk_lokal(tekuk * 10, sumbu)]
    ops[f"thumb_03_{sisi}"] = [tekuk_lokal(tekuk * 14, sumbu)]


def geser(v):
    return lambda M: Matrix.Translation(Vector(v)) @ M


def lerp(a, b, t):
    return a + (b - a) * t


def lerp_v(a, b, t):
    return Vector(a).lerp(Vector(b), t)


def mulus(t):
    t = max(0.0, min(1.0, t))
    return t * t * (3 - 2 * t)


def mulus5(t):
    t = max(0.0, min(1.0, t))
    return t * t * t * (t * (6 * t - 15) + 10)


# ---------------- pose duduk ----------------

TURUN_DUDUK = -0.333  # armature diturunkan: sendi pinggul dari 0,833 m ke ~0,50 m


def arah_lengan_bawah(arah_atas, fleksi_derajat):
    """Lengan bawah pada bidang sagital lengan atas: 0 = lurus, makin besar = tangan maju lalu ke bahu."""
    u = Vector(arah_atas).normalized()
    maju = Vector((0, -1, 0))
    n = (maju - u * maju.dot(u)).normalized()
    a = math.radians(fleksi_derajat)
    return u * math.cos(a) + n * math.sin(a)


def operasi_duduk(s):
    """Pose duduk tegak dengan parameter animasi `s` (dict): fleksi (derajat siku kanan), angkat_bahu (derajat
    klavikula kanan), napas (0..1), kepala (yaw, pitch, roll), condong (derajat badan ke depan), jari (0..1),
    serta lengan_kanan / lengan_kiri opsional = (arah lengan atas, lengan bawah, tangan) untuk adegan lain."""
    napas = s.get("napas", 0.0)
    yaw, pitch, roll = s.get("kepala", (0.0, 0.0, 0.0))
    ops = {}
    ops["pelvis"] = [putar((1, 0, 0), s.get("panggul", 0.0))]
    ops["spine_01"] = [putar((1, 0, 0), -2.0 + s.get("condong", 0.0) * 0.4)]
    ops["spine_02"] = [putar((1, 0, 0), -1.5 + s.get("condong", 0.0) * 0.3 - 0.6 * napas)]
    ops["spine_03"] = [putar((1, 0, 0), -1.0 + s.get("condong", 0.0) * 0.3 - 0.8 * napas)]
    ops["neck_01"] = [putar((1, 0, 0), 4.0 + pitch * 0.4), putar((0, 0, 1), yaw * 0.4)]
    ops["head"] = [putar((1, 0, 0), 2.0 + pitch * 0.6), putar((0, 0, 1), yaw * 0.6), putar((0, 1, 0), roll)]
    # Kaki: paha ke depan (sedikit menurun, lutut sedikit terbuka), tulang kering tegak, telapak rata.
    for sisi, x in (("l", 1), ("r", -1)):
        ops[f"thigh_{sisi}"] = [arahkan((0.10 * x, -1.0, -0.09))]
        ops[f"calf_{sisi}"] = [arahkan((0.02 * x, -0.12, -1.0))]
        ops[f"foot_{sisi}"] = [arahkan((0.06 * x, -1.0, -0.42))]
    # Klavikula (rotasi sekitar +Y; ujung kanan di -X naik bila sudut positif, ujung kiri bila negatif):
    # napas mengangkat keduanya sedikit, angkat_bahu mengangkat bahu kanan (repetisi 7).
    ops["clavicle_l"] = [putar((0, 1, 0), -0.8 * napas)]
    ops["clavicle_r"] = [putar((0, 1, 0), 0.8 * napas + s.get("angkat_bahu", 0.0))]
    # Lengan kiri: tangan bertumpu di paha kiri (atau arah khusus untuk adegan lain).
    kiri = s.get("lengan_kiri", ((0.12, -0.32, -0.94), (-0.30, -0.90, -0.30), (-0.25, -0.80, -0.55)))
    ops["upperarm_l"] = [arahkan(kiri[0], puntir=s.get("puntir_kiri", 0.0))]
    ops["lowerarm_l"] = [arahkan(kiri[1], puntir=s.get("puntir_kiri_bawah", 0.0))]
    ops["hand_l"] = [arahkan(kiri[2])]
    if "lengan_kanan" in s:
        atas, bawah, tangan = s["lengan_kanan"]
        ops["upperarm_r"] = [arahkan(atas)]
        ops["lowerarm_r"] = [arahkan(bawah, puntir=s.get("puntir_bawah", 0.0))]
        ops["hand_r"] = [arahkan(tangan)]
    else:
        # Lengan kanan lurus di samping badan; fleksi siku membawa tangan ke depan bahu. Siku sedikit maju
        # di puncak gerak (seperti orang sungguhan), telapak berputar menghadap bahu.
        f = s.get("fleksi", 6.0)
        q = mulus(f / 130.0)
        atas = Vector((-0.11, -0.05 - 0.12 * q, -1.0)).normalized()
        bawah = arah_lengan_bawah(atas, f)
        bawah = (bawah + Vector((0.30 * q, 0, 0))).normalized()  # tangan ke depan dada, tidak menutupi bahu
        ops["upperarm_r"] = [arahkan(atas, puntir=s.get("puntir_atas", 0.0))]
        ops["lowerarm_r"] = [arahkan(bawah, puntir=s.get("puntir_bawah", 0.0))]
        ops["hand_r"] = [arahkan(bawah)]
    operasi_jari(ops, "l", s.get("jari", 1.0), s.get("sumbu_jari", 0))
    operasi_jari(ops, "r", s.get("jari", 1.0), s.get("sumbu_jari", 0))
    return ops


def kunci(rig, penyusun, frame, ops):
    basis = penyusun.susun(ops)
    for n, B in basis.items():
        pb = rig.pose.bones[n]
        loc, rot, _ = B.decompose()
        pb.rotation_mode = "QUATERNION"
        pb.rotation_quaternion = rot
        pb.location = loc
        pb.keyframe_insert("rotation_quaternion", frame=frame, group=n)
        if n in ("Root", "pelvis"):
            pb.keyframe_insert("location", frame=frame, group=n)


# ---------------- jadwal sesi Tekuk Siku ----------------


class JadwalSesi:
    """Garis waktu animasi sesi (detik). Repetisi dimulai setelah `diam`; setiap siklus `siklus` detik."""

    def __init__(self, diam=5.0, jumlah=10, naik=1.4, tahan=0.35, turun=1.25, istirahat=0.3, ekor=8.0,
                 rep_angkat_bahu=7, fleksi_puncak=130.0, fleksi_istirahat=6.0, angkat_bahu_derajat=26.0):
        self.diam, self.jumlah = diam, jumlah
        self.naik, self.tahan, self.turun, self.istirahat = naik, tahan, turun, istirahat
        self.siklus = naik + tahan + turun + istirahat
        self.ekor = ekor
        self.rep_angkat_bahu = rep_angkat_bahu
        self.puncak, self.dasar = fleksi_puncak, fleksi_istirahat
        self.bahu = angkat_bahu_derajat
        self.durasi = diam + jumlah * self.siklus + ekor

    def mulai_rep(self, k):
        """Detik mulai repetisi ke-k (1-based)."""
        return self.diam + (k - 1) * self.siklus

    def nilai(self, t):
        """Parameter pose pada detik t."""
        s = {}
        f = self.dasar
        bahu = 0.0
        k = int((t - self.diam) // self.siklus) + 1 if t >= self.diam else 0
        if 1 <= k <= self.jumlah:
            u = t - self.mulai_rep(k)
            if u < self.naik:
                q = mulus5(u / self.naik)
            elif u < self.naik + self.tahan:
                q = 1.0
            elif u < self.naik + self.tahan + self.turun:
                q = 1.0 - mulus5((u - self.naik - self.tahan) / self.turun)
            else:
                q = 0.0
            f = lerp(self.dasar, self.puncak, q)
            if k == self.rep_angkat_bahu:
                # Bahu naik sejak awal fase naik, tertahan sampai turun (>= 1 dtk terlihat), lalu rileks.
                a = mulus((u - 0.15) / 0.45)
                b = 1.0 - mulus((u - (self.naik + self.tahan + 0.55)) / 0.5)
                bahu = self.bahu * min(a, b)
        s["fleksi"] = f
        s["angkat_bahu"] = bahu
        # Napas ~14x/menit dan gerak kepala sangat halus (deterministik).
        s["napas"] = 0.5 + 0.5 * math.sin(2 * math.pi * t / 4.3)
        s["kepala"] = (
            1.2 * math.sin(2 * math.pi * t / 9.1) + 0.6 * math.sin(2 * math.pi * t / 3.7 + 1.0),
            0.8 * math.sin(2 * math.pi * t / 7.3 + 0.4),
            # Saat bahu terangkat kepala ikut sedikit miring ke bahu kanan (roll negatif = puncak kepala ke -X).
            0.7 * math.sin(2 * math.pi * t / 11.0 + 2.0) - (5.0 * bahu / max(self.bahu, 1e-6)),
        )
        # Lengan bawah sedikit memutar selama fleksi (kepalan menghadap bahu); tangan menggenggam longgar.
        s["puntir_bawah"] = lerp(0.0, -20.0, mulus((f - self.dasar) / (self.puncak - self.dasar)))
        s["jari"] = 1.1
        return s
