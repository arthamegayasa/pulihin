"""Pustaka gerak peraga: kurva, matematika rig, tangan, IK, dan Animator generik untuk rig MPFB "game_engine".

Konvensi ruang armature MPFB: karakter menghadap -Y, kanan anatomis = -X, atas = +Z.
Pose disusun sebagai rotasi DELTA ruang armature yang diterapkan dari induk ke anak (FK), lalu dikonversi ke
matrix_basis tiap tulang dengan matematika matriks murni. Semua kurva periodik dengan periode tepat SIKLUS detik
sehingga frame JUMLAH_FRAME+1 = frame 1 (loop mulus).

Satu latihan = modul data di `latihan/` (lihat README): kurva kunci derajat gerak utama + fungsi `pose()` untuk
anggota tubuh yang bekerja. Animator menambahkan pose duduk, napas, gerak ikutan badan/kepala/bahu, kedip, dan
tangan istirahat yang terkunci di paha (IK).
"""
import math

from mathutils import Matrix, Quaternion, Vector

FPS = 30
FRAME_MULAI = 1
SIKLUS = 4.0
JUMLAH_FRAME = 120  # frame unik; frame JUMLAH_FRAME+1 = frame 1


def atur_siklus(detik):
    """Dipanggil sekali per proses oleh pemuat latihan. Baca selalu sebagai `gerak.SIKLUS` (bukan diimpor)."""
    global SIKLUS, JUMLAH_FRAME
    n = FPS * float(detik)
    if abs(n - round(n)) > 1e-6:
        raise ValueError(f"siklus {detik} dtk bukan kelipatan 1/{FPS} dtk")
    SIKLUS = float(detik)
    JUMLAH_FRAME = int(round(n))


def frame_dari_fraksi(f):
    return FRAME_MULAI + int(round(f * SIKLUS * FPS)) % JUMLAH_FRAME


# ---------------- kurva ----------------


def mulus5(t):
    t = max(0.0, min(1.0, t))
    return t * t * t * (t * (6 * t - 15) + 10)


def kurva_kunci(kunci, t):
    """Interpolasi minimum-jerk antar titik kunci (fraksi siklus, nilai). Tiap kunci adalah titik balik/berhenti
    sehingga kecepatannya nol di sana (profil kecepatan berbentuk lonceng seperti gerak manusia). Periodik."""
    f = (t / SIKLUS) % 1.0
    for (f0, v0), (f1, v1) in zip(kunci, kunci[1:]):
        if f0 <= f <= f1:
            return v0 + (v1 - v0) * mulus5((f - f0) / (f1 - f0))
    return kunci[-1][1]


def gelombang(t, komponen):
    """Jumlah sinus periodik SIKLUS: komponen = [(harmonik bulat, amplitudo, fase)] -> gerak mikro yang loop."""
    return sum(a * math.sin(2 * math.pi * k * t / SIKLUS + f) for k, a, f in komponen)


def napas(t, t_kosong):
    """1 = tarik napas penuh, 0 = buang napas habis pada t_kosong (puncak usaha); satu napas per siklus."""
    return 0.5 - 0.5 * math.cos(2 * math.pi * (t - t_kosong) / SIKLUS)


def kedip(t, mulai):
    """Satu kedipan per siklus mulai `mulai` dtk: tutup 0,1 dtk, tahan 0,03, buka 0,17."""
    tutup, tahan, buka = 0.10, 0.03, 0.17
    d = (t - mulai) % SIKLUS
    if d > tutup + tahan + buka:
        return 0.0
    if d < tutup:
        return mulus5(d / tutup)
    if d < tutup + tahan:
        return 1.0
    return 1.0 - mulus5((d - tutup - tahan) / buka)


def rotasi(v, sumbu, derajat):
    return Quaternion(Vector(sumbu).normalized(), math.radians(derajat)) @ Vector(v)


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


def rot_sekitar(titik, q):
    return Matrix.Translation(titik) @ q.to_matrix().to_4x4() @ Matrix.Translation(-titik)


class Penyusun:
    """Menyusun matriks pose ruang armature untuk satu frame. `self.pos` terisi selama penyusunan sehingga
    operasi tulang anak dapat membaca pose induk/saudara yang sudah dihitung (mis. normal telapak tangan)."""

    def __init__(self, rig):
        self.rig = rig
        self.urut = urutan_hierarki(rig)
        self.rest = {b.name: b.matrix_local.copy() for b in rig.data.bones}
        self.induk = {b.name: (b.parent.name if b.parent else None) for b in rig.data.bones}
        self.panjang = {b.name: b.length for b in rig.data.bones}
        self.pos = {}

    def susun(self, operasi):
        self.pos = pos = {}
        basis = {}
        for n in self.urut:
            p = self.induk[n]
            rel = self.rest[p].inverted() @ self.rest[n] if p else self.rest[n]
            M = pos[p] @ rel if p else rel.copy()
            for op in operasi.get(n, ()):
                M = op(M)
            pos[n] = M
            basis[n] = rel.inverted() @ pos[p].inverted() @ M if p else rel.inverted() @ M
        return basis

    def ekor(self, n):
        M = self.pos[n]
        return M.translation + M.to_3x3() @ Vector((0, self.panjang[n], 0))


def putar(sumbu, derajat):
    """Rotasi delta sekitar sumbu armature (melalui kepala tulang)."""
    q = Quaternion(Vector(sumbu).normalized(), math.radians(derajat))
    return lambda M: rot_sekitar(M.translation.copy(), q) @ M


def geser(v):
    return lambda M: Matrix.Translation(Vector(v)) @ M


def arahkan(arah):
    """Rotasi minimal sehingga sumbu Y tulang menunjuk `arah` (vektor atau fungsi M -> vektor)."""

    def f(M):
        tujuan = Vector(arah(M) if callable(arah) else arah).normalized()
        kini = (M.to_3x3() @ Vector((0, 1, 0))).normalized()
        return rot_sekitar(M.translation.copy(), kini.rotation_difference(tujuan)) @ M

    return f


def orientasikan(Q_fn):
    """Ganti rotasi tulang dengan matriks rotasi 3x3 dari Q_fn(M) (ruang armature), posisi kepala tetap."""

    def f(M):
        R = Q_fn(M)
        return Matrix.Translation(M.translation) @ R.to_4x4()

    return f


def bingkai(y, z_kira):
    """Matriks rotasi dengan sumbu Y = y dan sumbu Z sedekat mungkin ke z_kira (ortonormal)."""
    y = Vector(y).normalized()
    z = (Vector(z_kira) - y * Vector(z_kira).dot(y)).normalized()
    x = y.cross(z)
    return Matrix((x, y, z)).transposed()


def orientasi_tulang(penyusun, nama, arah, depan, depan_rest=(0, -1, 0)):
    """Orientasi mutlak tulang: sumbu Y -> `arah`, dan sisi yang saat rest menghadap `depan_rest` -> `depan`.
    Mengendalikan puntiran tulang panjang (mis. lipat siku lengan atas menghadap arah tekukan)."""
    R0 = penyusun.rest[nama].to_3x3()
    koreksi = bingkai(R0 @ Vector((0, 1, 0)), Vector(depan_rest)).inverted() @ R0
    return orientasikan(lambda M: bingkai(arah, depan) @ koreksi)


# ---------------- tangan ----------------

JARI = ("index", "middle", "ring", "pinky")


class GeometriTangan:
    """Normal telapak (sisi palmar) dan arah jari dalam ruang lokal tulang tangan, dihitung dari rest pose."""

    def __init__(self, penyusun, sisi):
        r = penyusun.rest
        s = sisi
        tangan = r[f"hand_{s}"]
        jari = (r[f"middle_01_{s}"].translation - tangan.translation).normalized()
        lintang = (r[f"index_01_{s}"].translation - r[f"pinky_01_{s}"].translation).normalized()
        palmar = lintang.cross(jari).normalized() * (1 if s == "r" else -1)
        inv = tangan.to_3x3().inverted()
        self.palmar_lokal = (inv @ palmar).normalized()
        self.jari_lokal = (inv @ jari).normalized()
        self.lintang_lokal = (inv @ lintang).normalized()
        # Rotasi rest tangan relatif ke bingkai (jari, palmar) -> untuk mengorientasikan tangan secara mutlak.
        B = bingkai(jari, palmar)
        self.koreksi = B.inverted() @ tangan.to_3x3()
        self.palmar_lengan_lokal = (r[f"lowerarm_{s}"].to_3x3().inverted() @ palmar).normalized()

    def rotasi(self, arah_jari, arah_palmar):
        return bingkai(arah_jari, arah_palmar) @ self.koreksi

    def palmar(self, M_tangan):
        return (M_tangan.to_3x3() @ self.palmar_lokal).normalized()


def puntir_ke(palmar_lokal, palmar_target, porsi=1.0):
    """Putar tulang di sekitar sumbunya sendiri sehingga acuan palmar-nya menuju palmar_target (sebagian)."""

    def f(M):
        d = (M.to_3x3() @ Vector((0, 1, 0))).normalized()
        kini = M.to_3x3() @ Vector(palmar_lokal)
        kini = kini - d * kini.dot(d)
        tuju = Vector(palmar_target) - d * Vector(palmar_target).dot(d)
        if kini.length < 1e-6 or tuju.length < 1e-6:
            return M
        sud = kini.normalized().angle(tuju.normalized())
        if kini.cross(tuju).dot(d) < 0:
            sud = -sud
        return rot_sekitar(M.translation.copy(), Quaternion(d, sud * porsi)) @ M

    return f


def tekuk_jari(penyusun, geo, sisi, derajat):
    """Tekuk ruas jari ke arah telapak (sumbu = arah ruas x normal palmar tangan saat ini)."""

    def f(M):
        d = (M.to_3x3() @ Vector((0, 1, 0))).normalized()
        p = geo.palmar(penyusun.pos[f"hand_{sisi}"])
        ax = d.cross(p)
        if ax.length < 1e-6:
            return M
        return rot_sekitar(M.translation.copy(), Quaternion(ax.normalized(), math.radians(derajat))) @ M

    return f


def rapatkan_jari(penyusun, sisi, nama, derajat, ke="middle_01"):
    """Rapatkan pangkal jari ke arah jari `ke` (jari rileks tidak mengembang, ibu jari mendekat ke telunjuk)."""

    def f(M):
        d = (M.to_3x3() @ Vector((0, 1, 0))).normalized()
        tengah = penyusun.rest[f"{ke}_{sisi}"]
        dt = (penyusun.pos[f"hand_{sisi}"].to_3x3() @ (penyusun.rest[f"hand_{sisi}"].to_3x3().inverted() @ (tengah.to_3x3() @ Vector((0, 1, 0))))).normalized()
        ax = d.cross(dt)
        if ax.length < 1e-6:
            return M
        sudut = min(math.radians(derajat), d.angle(dt))
        return rot_sekitar(M.translation.copy(), Quaternion(ax.normalized(), sudut)) @ M

    return f


def operasi_jari(ops, penyusun, geo, sisi, tekuk=1.0, variasi=(0, 0, 0, 0), ibu=1.0):
    """Jari rileks bertingkat (kelingking paling menekuk), sedikit dirapatkan, ibu jari santai."""
    dasar = {"index": (16, 21, 12), "middle": (20, 24, 14), "ring": (24, 26, 16), "pinky": (28, 29, 18)}
    rapat = {"index": 6, "middle": 0, "ring": 5, "pinky": 11}
    for i, j in enumerate(JARI):
        for ruas, d in enumerate(dasar[j], start=1):
            daftar = []
            if ruas == 1 and rapat[j]:
                daftar.append(rapatkan_jari(penyusun, sisi, j, rapat[j]))
            daftar.append(tekuk_jari(penyusun, geo, sisi, tekuk * d + variasi[i] * (1.0 if ruas == 1 else 0.6)))
            ops[f"{j}_0{ruas}_{sisi}"] = daftar
    ops[f"thumb_01_{sisi}"] = [rapatkan_jari(penyusun, sisi, "thumb", 10 + 14 * max(0.0, ibu - 1.0), ke="index_01"),
                              tekuk_jari(penyusun, geo, sisi, ibu * 6)]
    ops[f"thumb_02_{sisi}"] = [tekuk_jari(penyusun, geo, sisi, ibu * 10)]
    ops[f"thumb_03_{sisi}"] = [tekuk_jari(penyusun, geo, sisi, ibu * 16)]


# ---------------- IK dua tulang ----------------


def ik_dua_tulang(S, T, a, b, kutub):
    """Posisi sendi tengah (siku/lutut) untuk pangkal S, ujung T, panjang a dan b; sendi ke arah kutub."""
    d = T - S
    L = min(d.length, (a + b) * 0.999)
    u = d.normalized()
    x = (a * a - b * b + L * L) / (2 * L)
    h = math.sqrt(max(a * a - x * x, 0.0))
    k = Vector(kutub) - u * Vector(kutub).dot(u)
    return S + u * x + k.normalized() * h


def arah_lengan_bawah(atas, normal_bidang, derajat):
    """Lengan bawah pada bidang (atas, normal_bidang): 0 = lurus; positif = tangan ke arah normal_bidang lalu
    kembali ke bahu. Mengembalikan (arah lengan bawah, arah 'telapak' = sisi fleksor lengan bawah)."""
    a = math.radians(derajat)
    return (atas * math.cos(a) + normal_bidang * math.sin(a)).normalized(), (normal_bidang * math.cos(a) - atas * math.sin(a)).normalized()


# ---------------- animator ----------------


class Animator:
    """Menghitung operasi pose per waktu t (detik) untuk satu latihan dan mengunci keyframe semua tulang.

    Diisi oleh adegan.py sebelum `kunci_semua`: `turun` (pelvis ke dudukan) dan `tangan_istirahat`
    {sisi: (target pergelangan, normal telapak, arah jari)} untuk tangan yang bertumpu di paha.
    Fungsi `pose()` latihan WAJIB mengisi `self.sumbu_cincin` (sumbu gerak sendi target, menghadap kamera).
    """

    def __init__(self, rig, latihan):
        self.rig = rig
        self.L = latihan
        self.p = Penyusun(rig)
        self.geo = {s: GeometriTangan(self.p, s) for s in ("l", "r")}
        self.turun = -0.30
        self.tangan_istirahat = {}
        nilai = [v for _, v in latihan.KUNCI]
        self.v_awal = latihan.KUNCI[0][1]
        self.v_puncak = max(nilai, key=lambda v: abs(v - self.v_awal))
        self.t_puncak = latihan.T_PUNCAK * SIKLUS
        self.sumbu_cincin = None
        self.rekam = []  # per frame: (frame, posisi sendi, sumbu, kekuatan pendar)

    # -- kurva latihan --
    def nilai(self, t):
        return kurva_kunci(self.L.KUNCI, t)

    def progres(self, t, tunda=0.0):
        """0 = posisi mulai, 1 = puncak; `tunda` (detik) untuk gerak ikutan yang sedikit terlambat."""
        return max(0.0, min(1.0, (self.nilai(t - tunda) - self.v_awal) / (self.v_puncak - self.v_awal)))

    def percepatan(self, t, h=1.0 / 120):
        return (self.nilai(t + h) - 2 * self.nilai(t) + self.nilai(t - h)) / (h * h)

    def kuat(self, t):
        """Kekuatan pendar otot 0..1: mengikuti kontraksi (naik + tahan), sedikit mendahului sudut sendi."""
        return mulus5(self.progres(t, -0.08) ** 0.8)

    # -- badan duduk --
    def ops_duduk(self, t, ops):
        B = self.L.BADAN
        b = napas(t, self.t_puncak)
        pr = self.progres(t, 0.10)
        mikro = gelombang(t, [(1, 0.25, 0.3), (2, 0.12, 1.9)])
        ops["Root"] = [geser((0, 0, self.turun))]
        ops["pelvis"] = [putar((1, 0, 0), -1.0)]
        # Punggung tegak; napas = ekstensi kecil dada; gerak ikutan badan dibagi ke tiga ruas tulang belakang.
        e, r, m = B.get("ekstensi", 0.0) * pr, B.get("rotasi", 0.0) * pr, B.get("miring", 0.0) * pr
        for nama, w, napas_w in (("spine_01", 0.2, 0.0), ("spine_02", 0.45, 0.6), ("spine_03", 0.35, 0.9)):
            ops[nama] = [putar((1, 0, 0), -e * w - napas_w * b + (0.5 if nama == "spine_01" else 0.0)),
                         putar((0, 0, 1), -r * w), putar((0, 1, 0), m * w + (mikro * 0.6 if nama == "spine_01" else 0.0))]
        for sisi, x in (("l", 1), ("r", -1)):
            ops[f"thigh_{sisi}"] = [arahkan((0.13 * x, -1.0, -0.07))]
            ops[f"calf_{sisi}"] = [arahkan((0.03 * x, -0.10, -1.0))]
            ops[f"foot_{sisi}"] = [arahkan(self.p.rest[f"foot_{sisi}"].to_3x3() @ Vector((0, 1, 0)) + Vector((0.07 * x, 0, 0)))]
            ops[f"ball_{sisi}"] = [arahkan(self.p.rest[f"ball_{sisi}"].to_3x3() @ Vector((0, 1, 0)) + Vector((0.07 * x, 0, 0)))]
        # Bahu TETAP turun (tidak mengangkat bahu = bentuk benar); napas hanya mengangkat sangat sedikit.
        # `klavikula` = elevasi kecil bahu kerja di puncak (rotasi skapula alami, bukan mengangkat bahu).
        k = B.get("klavikula", 0.0) * self.progres(t, 0.04)
        ops["clavicle_l"] = [putar((0, 1, 0), -0.35 * b)]
        ops["clavicle_r"] = [putar((0, 1, 0), 0.35 * b + k)]
        # Kepala: arah dasar + lirikan mengikuti gerak (sedikit terlambat), kompensasi napas, gerak mikro.
        K = self.L.KEPALA
        lirik = self.progres(t, 0.22)
        yaw = K["yaw"] + K.get("lirik_yaw", 0.0) * lirik + gelombang(t, [(1, 0.6, 0.8), (3, 0.25, 2.2)])
        pitch = K["pitch"] + K.get("lirik_pitch", 0.0) * lirik + 0.8 * b + gelombang(t, [(2, 0.35, 0.4)])
        roll = K.get("lirik_roll", 0.0) * lirik + gelombang(t, [(1, 0.4, 2.6)])
        ops["neck_01"] = [putar((1, 0, 0), pitch * 0.4), putar((0, 0, 1), yaw * 0.4)]
        ops["head"] = [putar((1, 0, 0), pitch * 0.6), putar((0, 0, 1), yaw * 0.6), putar((0, 1, 0), roll)]

    # -- lengan kerja: FK lengkap dari arah lengan atas --
    def lengan(self, ops, t, sisi, atas, depan, siku, palmar, lag=0.0, lag_palmar=0.0, jari=1.0, ibu=1.0, porsi_puntir=0.6):
        """Pose satu lengan dari arah lengan atas `atas`, arah tekukan siku `depan` (tegak lurus `atas`; sisi
        lipat siku menghadap ke sana), sudut tekuk siku (derajat), dan arah telapak `palmar`. Gerak ikutan
        pergelangan (derajat): `lag` menekuk tangan pada bidang siku, `lag_palmar` ke arah telapak. Pronasi/
        supinasi dibagi: `porsi_puntir` diputar lengan bawah, sisanya di pergelangan (tanpa 'bungkus permen')."""
        atas = Vector(atas).normalized()
        depan = (Vector(depan) - atas * Vector(depan).dot(atas)).normalized()
        bawah, telapak = arah_lengan_bawah(atas, depan, siku)
        palmar = Vector(palmar).normalized()
        arah_tangan = Quaternion(bawah.cross(telapak), math.radians(lag)) @ bawah
        if lag_palmar:
            arah_tangan = Quaternion(bawah.cross(palmar).normalized(), math.radians(lag_palmar)) @ arah_tangan
        geo = self.geo[sisi]
        ops[f"upperarm_{sisi}"] = [orientasi_tulang(self.p, f"upperarm_{sisi}", atas, depan)]
        ops[f"lowerarm_{sisi}"] = [arahkan(bawah), puntir_ke(geo.palmar_lengan_lokal, palmar, porsi_puntir)]
        ops[f"hand_{sisi}"] = [orientasikan(lambda M: geo.rotasi(arah_tangan, palmar))]
        operasi_jari(ops, self.p, geo, sisi, tekuk=jari, ibu=ibu,
                     variasi=[gelombang(t, [(1, 1.2, k * 1.7 + (0.0 if sisi == "r" else 0.9))]) for k in range(4)])
        return bawah, telapak

    # -- tangan istirahat: IK, telapak bertumpu di paha --
    def ops_tangan_istirahat(self, t, ops, sisi):
        target, palmar, arah_jari = self.tangan_istirahat[sisi]
        geo = self.geo[sisi]
        x = 1 if sisi == "l" else -1
        mikro = Vector((gelombang(t, [(1, 0.0012, 0.5 + 2 * x)]), gelombang(t, [(2, 0.0008, 1.3 + x)]), 0))
        T = target + mikro
        a, b = self.p.panjang[f"upperarm_{sisi}"], self.p.panjang[f"lowerarm_{sisi}"]
        kutub = Vector((0.55 * x, 0.75, -0.15))  # siku ke luar-belakang

        def atas(M):
            return ik_dua_tulang(M.translation.copy(), T, a, b, kutub) - M.translation

        ops[f"upperarm_{sisi}"] = [arahkan(atas)]
        ops[f"lowerarm_{sisi}"] = [arahkan(lambda M: T - M.translation), puntir_ke(geo.palmar_lengan_lokal, palmar, 0.6)]
        # Tangan rebah di paha: jari searah paha, pergelangan menampung kemiringan lengan bawah; gerak mikro.
        jari = (arah_jari + Vector((0, 0, -0.05 + gelombang(t, [(1, 0.012, 2.0)])))).normalized()
        ops[f"hand_{sisi}"] = [orientasikan(lambda M: geo.rotasi(jari, palmar))]
        v = [gelombang(t, [(1, 2.0, k * 1.1)]) for k in range(4)]
        operasi_jari(ops, self.p, geo, sisi, tekuk=0.3, variasi=v, ibu=0.5)

    def operasi(self, t):
        ops = {}
        self.ops_duduk(t, ops)
        self.L.pose(self, t, ops)
        for sisi in self.tangan_istirahat:
            self.ops_tangan_istirahat(t, ops, sisi)
        return ops

    def terapkan(self, t):
        """Pasang pose waktu t ke rig (tanpa keyframe), untuk pengukuran saat menyusun adegan."""
        for n, B in self.p.susun(self.operasi(t)).items():
            pb = self.rig.pose.bones[n]
            loc, rot, _ = B.decompose()
            pb.rotation_mode = "QUATERNION"
            pb.rotation_quaternion = rot
            pb.location = loc

    def kunci_semua(self, kunci_kedip=()):
        rig = self.rig
        C = self.L.CINCIN
        for pb in rig.pose.bones:
            pb.rotation_mode = "QUATERNION"
        self.rekam = []
        for i in range(JUMLAH_FRAME + 1):
            frame = FRAME_MULAI + i
            t = i / FPS  # frame terakhir+1 (t = SIKLUS) = frame 1: kurva fcurve tertutup rapat
            self.sumbu_cincin = None
            basis = self.p.susun(self.operasi(t))
            if self.sumbu_cincin is None:
                raise RuntimeError(f"pose() latihan {self.L.ID} tidak mengisi anim.sumbu_cincin")
            for n, B in basis.items():
                pb = rig.pose.bones[n]
                loc, rot, _ = B.decompose()
                pb.rotation_quaternion = rot
                pb.location = loc
                pb.keyframe_insert("rotation_quaternion", frame=frame, group=n)
                if n in ("Root", "pelvis"):
                    pb.keyframe_insert("location", frame=frame, group=n)
            self.rekam.append((frame, self.p.pos[C["tulang"]].translation.copy(), self.sumbu_cincin.normalized(), self.kuat(t)))
            for sk in kunci_kedip:
                sk.value = kedip(t, self.L.T_KEDIP * SIKLUS)
                sk.keyframe_insert("value", frame=frame)
        siklus_linear(rig)
        if kunci_kedip:
            siklus_linear(kunci_kedip[0].id_data)


def siklus_linear(id_data):
    """Keyframe per frame -> interpolasi linear (kurva sudah halus, tanpa overshoot Bezier) + modifier Cycles
    sehingga frame sebelum 1 / sesudah akhir mengulang siklus (blur gerak di sambungan loop tetap benar)."""
    for fc in _fcurves(id_data):
        for k in fc.keyframe_points:
            k.interpolation = "LINEAR"
        if not any(m.type == "CYCLES" for m in fc.modifiers):
            fc.modifiers.new("CYCLES")


def _fcurves(obj):
    ad = obj.animation_data
    if not ad or not ad.action:
        return []
    act = ad.action
    if hasattr(act, "fcurves") and len(getattr(act, "fcurves", [])):
        return list(act.fcurves)
    hasil = []
    for layer in getattr(act, "layers", []):
        for strip in layer.strips:
            for cb in strip.channelbags:
                hasil.extend(cb.fcurves)
    return hasil
