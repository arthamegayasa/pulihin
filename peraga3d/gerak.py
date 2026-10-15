"""Pustaka gerak peraga: kurva, matematika rig, tangan, IK, dan Animator generik untuk rig MPFB "game_engine".

Konvensi ruang armature MPFB: karakter menghadap -Y, kanan anatomis = -X, atas = +Z.
Pose disusun sebagai rotasi DELTA ruang armature yang diterapkan dari induk ke anak (FK), lalu dikonversi ke
matrix_basis tiap tulang dengan matematika matriks murni. Semua kurva periodik dengan periode tepat SIKLUS detik
sehingga frame JUMLAH_FRAME+1 = frame 1 (loop mulus).

Satu latihan = modul data di `latihan/` (lihat README): kurva kunci derajat gerak utama + fungsi `pose()` untuk
anggota tubuh yang bekerja. Animator menambahkan posisi dasar (duduk, atau berdiri dengan telapak terkunci & tungkai
IK), napas, gerak ikutan badan/kepala/bahu, kedip, dan tangan yang terkunci di paha/meja atau menggenggam sandaran.
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
    Mengendalikan puntiran tulang panjang (mis. lipat siku lengan atas menghadap arah tekukan). `arah` dan `depan`
    boleh berupa fungsi M -> vektor (dievaluasi berurutan: arah lalu depan)."""
    R0 = penyusun.rest[nama].to_3x3()
    koreksi = bingkai(R0 @ Vector((0, 1, 0)), Vector(depan_rest)).inverted() @ R0

    def Q(M):
        a = arah(M) if callable(arah) else arah
        d = depan(M) if callable(depan) else depan
        return bingkai(a, d) @ koreksi

    return orientasikan(Q)


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


def bungkus_ruas(penyusun, geo, sisi, nama, rel, cadangan=0.0, bebas=20.0):
    """Tekuk satu ruas jari sehingga ujungnya tepat di permukaan rel bulat (`rel` = {"pusat", "sumbu",
    "jari_jari"}: jari-jari sudah termasuk tebal jari), melingkar MAJU mengelilingi rel (bukan kembali). Bila ruas
    tidak mencapai rel, tekuk rileks `bebas` derajat. `cadangan` = tekuk tambahan (genggaman sedikit lebih erat)."""
    C, ax, R = Vector(rel["pusat"]), Vector(rel["sumbu"]).normalized(), rel["jari_jari"]

    def lintang(v):
        v = v - C
        return v - ax * v.dot(ax)

    def f(M):
        d = (M.to_3x3() @ Vector((0, 1, 0))).normalized()
        sumbu = d.cross(geo.palmar(penyusun.pos[f"hand_{sisi}"]))
        if sumbu.length < 1e-6:
            return M
        sumbu.normalize()
        J = M.translation.copy()
        lj = lintang(J)
        l = penyusun.panjang[nama]
        tanda = 1.0 if ax.dot(sumbu) >= 0 else -1.0  # arah melingkar maju di sekitar sumbu rel
        akar, sebelum = None, None
        for k in range(-30, 151):
            E = J + (Quaternion(sumbu, math.radians(k)) @ d) * l
            le = lintang(E)
            g = le.length - R
            if sebelum is not None and (sebelum[1] > 0) != (g > 0):
                maju = tanda * lj.cross(le).dot(ax) > 0
                if maju:
                    k0, g0 = sebelum
                    akar = k0 + (k - k0) * g0 / (g0 - g)
                    break
            sebelum = (k, g)
        sudut = bebas if akar is None else akar + cadangan
        return rot_sekitar(J, Quaternion(sumbu, math.radians(sudut))) @ M

    return f


def operasi_genggam(ops, penyusun, geo, sisi, rel, variasi=(0, 0, 0, 0)):
    """Genggaman pada rel bulat (sandaran kursi): tiap ruas jari dililitkan ke permukaan rel (dihitung per frame,
    jadi tetap rapat walau tangan bergerak mikro), kelingking sedikit paling erat; ibu jari rebah di atas rel di
    samping telunjuk (genggaman menahan, bukan mencengkeram)."""
    rapat = {"index": 4, "middle": 0, "ring": 4, "pinky": 9}
    for i, j in enumerate(JARI):
        for ruas in (1, 2, 3):
            nama = f"{j}_0{ruas}_{sisi}"
            daftar = []
            if ruas == 1 and rapat[j]:
                daftar.append(rapatkan_jari(penyusun, sisi, j, rapat[j]))
            daftar.append(bungkus_ruas(penyusun, geo, sisi, nama, rel, cadangan=0.4 * variasi[i] + (2.0 if j == "pinky" else 0.0)))
            ops[nama] = daftar
    ops[f"thumb_01_{sisi}"] = [rapatkan_jari(penyusun, sisi, "thumb", 16, ke="index_01"), tekuk_jari(penyusun, geo, sisi, 6)]
    ops[f"thumb_02_{sisi}"] = [tekuk_jari(penyusun, geo, sisi, 10)]
    ops[f"thumb_03_{sisi}"] = [tekuk_jari(penyusun, geo, sisi, 14)]


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

    Diisi oleh adegan.py (fungsi posisi) sebelum `kunci_semua`:
      - duduk: `turun` (pelvis ke dudukan);
      - berdiri / duduk-berdiri: `panggul` (geser Root dasar) dan `kaki` (telapak menapak, lihat `tapakkan`);
      - `tangan_istirahat` {sisi: (target pergelangan, normal telapak, arah jari[, opsi])} untuk tangan yang bertumpu
        di paha/meja atau menggenggam rel sandaran (`opsi` = {"genggam": {"pusat", "sumbu", "jari_jari"} rel,
        "kutub": arah siku}; untuk permukaan datar: {"miring", "tekuk", "ibu"}).
    Fungsi `pose()` latihan WAJIB mengisi `self.sumbu_cincin` (sumbu gerak sendi target, menghadap kamera; satu
    vektor untuk semua cincin atau daftar per cincin) dan boleh mengisi `self.sendi_cincin` (posisi pengganti).
    """

    def __init__(self, rig, latihan):
        self.rig = rig
        self.L = latihan
        self.p = Penyusun(rig)
        self.geo = {s: GeometriTangan(self.p, s) for s in ("l", "r")}
        self.turun = -0.30
        self.panggul = Vector((0.0, 0.0, 0.0))
        self.kaki = {}
        self.tangan_istirahat = {}
        nilai = [v for _, v in latihan.KUNCI]
        self.v_awal = latihan.KUNCI[0][1]
        self.v_puncak = max(nilai, key=lambda v: abs(v - self.v_awal))
        self.t_puncak = latihan.T_PUNCAK * SIKLUS
        self.sumbu_cincin = None
        self.sendi_cincin = None
        self.target_kaki = {}  # per frame: sisi -> target pergelangan kaki yang dipakai IK tungkai
        self.galat_kaki = 0.0  # meleset terbesar pergelangan kaki dari targetnya (m) selama kunci_semua
        self.rekam = []  # per frame: (frame, [posisi sendi per cincin], [sumbu per cincin], (kuat a, kuat b))

    # -- kurva latihan --
    def nilai(self, t):
        return kurva_kunci(self.L.KUNCI, t)

    def progres(self, t, tunda=0.0):
        """0 = posisi mulai, 1 = puncak; `tunda` (detik) untuk gerak ikutan yang sedikit terlambat."""
        return max(0.0, min(1.0, (self.nilai(t - tunda) - self.v_awal) / (self.v_puncak - self.v_awal)))

    def percepatan(self, t, h=1.0 / 120):
        return (self.nilai(t + h) - 2 * self.nilai(t) + self.nilai(t - h)) / (h * h)

    def kuat(self, t):
        """Kekuatan pendar (kanal a, kanal b) 0..1. Bawaan: kanal a mengikuti kontraksi (naik + tahan), sedikit
        mendahului sudut sendi. Latihan boleh mendefinisikan `kuat(anim, t)` -> float atau (a, b)."""
        if hasattr(self.L, "kuat"):
            k = self.L.kuat(self, t)
            return (float(k), 0.0) if isinstance(k, (int, float)) else (float(k[0]), float(k[1]))
        return mulus5(self.progres(t, -0.08) ** 0.8), 0.0

    # -- badan atas (bersama duduk & berdiri) --
    def ops_badan_atas(self, t, ops, fleksi=0.0, lateral=0.0, kepala_pitch=0.0):
        """Tulang belakang, bahu, kepala. `fleksi` = condong ke depan tambahan (derajat, dibagi ke tiga ruas),
        `lateral` = kemiringan samping tambahan di ruas bawah (kompensasi panggul miring), `kepala_pitch` =
        tambahan pitch kepala (mis. mata tetap ke depan saat badan condong)."""
        B = self.L.BADAN
        b = napas(t, self.t_puncak)
        pr = self.progres(t, 0.10)
        mikro = gelombang(t, [(1, 0.25, 0.3), (2, 0.12, 1.9)])
        # Punggung tegak; napas = ekstensi kecil dada; gerak ikutan badan dibagi ke tiga ruas tulang belakang.
        e, r, m = B.get("ekstensi", 0.0) * pr, B.get("rotasi", 0.0) * pr, B.get("miring", 0.0) * pr
        for nama, w, napas_w in (("spine_01", 0.2, 0.0), ("spine_02", 0.45, 0.6), ("spine_03", 0.35, 0.9)):
            ops[nama] = [putar((1, 0, 0), -e * w - napas_w * b + (0.5 if nama == "spine_01" else 0.0) + fleksi * w),
                         putar((0, 0, 1), -r * w),
                         putar((0, 1, 0), m * w + (mikro * 0.6 + lateral if nama == "spine_01" else 0.0))]
        # Bahu TETAP turun (tidak mengangkat bahu = bentuk benar); napas hanya mengangkat sangat sedikit.
        # `klavikula` = elevasi kecil bahu kerja di puncak (rotasi skapula alami, bukan mengangkat bahu).
        k = B.get("klavikula", 0.0) * self.progres(t, 0.04)
        ops["clavicle_l"] = [putar((0, 1, 0), -0.35 * b)]
        ops["clavicle_r"] = [putar((0, 1, 0), 0.35 * b + k)]
        # Kepala: arah dasar + lirikan mengikuti gerak (sedikit terlambat), kompensasi napas, gerak mikro.
        K = self.L.KEPALA
        lirik = self.progres(t, 0.22)
        yaw = K["yaw"] + K.get("lirik_yaw", 0.0) * lirik + gelombang(t, [(1, 0.6, 0.8), (3, 0.25, 2.2)])
        pitch = K["pitch"] + K.get("lirik_pitch", 0.0) * lirik + 0.8 * b + gelombang(t, [(2, 0.35, 0.4)]) + kepala_pitch
        roll = K.get("lirik_roll", 0.0) * lirik + gelombang(t, [(1, 0.4, 2.6)])
        ops["neck_01"] = [putar((1, 0, 0), pitch * 0.4), putar((0, 0, 1), yaw * 0.4)]
        ops["head"] = [putar((1, 0, 0), pitch * 0.6), putar((0, 0, 1), yaw * 0.6), putar((0, 1, 0), roll)]

    # -- badan duduk --
    def ops_duduk(self, t, ops):
        ops["Root"] = [geser((0, 0, self.turun))]
        ops["pelvis"] = [putar((1, 0, 0), -1.0)]
        self.ops_badan_atas(t, ops)
        for sisi, x in (("l", 1), ("r", -1)):
            ops[f"thigh_{sisi}"] = [arahkan((0.13 * x, -1.0, -0.07))]
            ops[f"calf_{sisi}"] = [arahkan((0.03 * x, -0.10, -1.0))]
            ops[f"foot_{sisi}"] = [arahkan(self.p.rest[f"foot_{sisi}"].to_3x3() @ Vector((0, 1, 0)) + Vector((0.07 * x, 0, 0)))]
            ops[f"ball_{sisi}"] = [arahkan(self.p.rest[f"ball_{sisi}"].to_3x3() @ Vector((0, 1, 0)) + Vector((0.07 * x, 0, 0)))]

    # -- kaki menapak & tungkai IK (berdiri, duduk-berdiri) --
    def tapakkan(self, sisi, geser_=(0.0, 0.0, 0.0), yaw=6.0):
        """Kunci telapak `sisi` di lantai: posisi rest digeser `geser_`, ujung kaki diputar `yaw` derajat ke luar
        di sekitar pergelangan kaki. Pivot jinjit = sendi pangkal jari (kepala tulang ball)."""
        r = self.p.rest
        x = 1 if sisi == "l" else -1
        Rq = Quaternion((0, 0, 1), math.radians(yaw * x)).to_matrix()
        A0, P0 = r[f"foot_{sisi}"].translation, r[f"ball_{sisi}"].translation
        A = A0 + Vector(geser_)
        self.kaki[sisi] = {"A": A, "P": A + Rq @ (P0 - A0), "R": Rq @ r[f"foot_{sisi}"].to_3x3(),
                           "Rb": Rq @ r[f"ball_{sisi}"].to_3x3(), "lateral": Rq @ Vector((1, 0, 0)),
                           "depan": Rq @ Vector((0, -1, 0))}

    def kaki_tapak(self, sisi, tumit=0.0):
        """(target pergelangan, rotasi kaki, rotasi jari kaki) untuk telapak menapak dengan tumit terangkat `tumit`
        derajat (berputar di sendi pangkal jari; jari kaki tetap rata di lantai)."""
        k = self.kaki[sisi]
        Q = Quaternion(k["lateral"], math.radians(tumit)).to_matrix()
        return k["P"] + Q @ (k["A"] - k["P"]), Q @ k["R"], k["Rb"]

    def kutub_lutut(self, sisi):
        """Lutut searah ujung kaki (sedikit ke luar)."""
        return self.kaki[sisi]["depan"] + Vector((0.08 * (1 if sisi == "l" else -1), 0, 0))

    def tungkai(self, ops, sisi, T, kutub, R_kaki, R_jari):
        """IK paha-betis ke pergelangan kaki `T` (vektor, atau fungsi M_paha -> vektor), lutut ke arah `kutub`;
        puntiran paha & betis mengikuti bidang tekuk (tempurung lutut menghadap kutub). Kaki & jari kaki diberi
        rotasi mutlak `R_kaki`, `R_jari` (3x3)."""
        a, b = self.p.panjang[f"thigh_{sisi}"], self.p.panjang[f"calf_{sisi}"]
        kutub = Vector(kutub)
        st = {}

        def paha(M):
            S = M.translation.copy()
            Tt = Vector(T(M) if callable(T) else T)
            u = (Tt - S).normalized()
            k = (kutub - u * kutub.dot(u)).normalized()
            st.update(T=Tt, K=ik_dua_tulang(S, Tt, a, b, kutub), k=k)
            return st["K"] - S

        def depan(arah):
            d = arah.normalized()
            return st["k"] - d * st["k"].dot(d)

        ops[f"thigh_{sisi}"] = [orientasi_tulang(self.p, f"thigh_{sisi}", paha, lambda M: depan(st["K"] - M.translation))]
        ops[f"calf_{sisi}"] = [orientasi_tulang(self.p, f"calf_{sisi}", lambda M: st["T"] - M.translation,
                                                lambda M: depan(st["T"] - M.translation))]
        ops[f"foot_{sisi}"] = [orientasikan(lambda M: R_kaki)]
        ops[f"ball_{sisi}"] = [orientasikan(lambda M: R_jari)]
        self.target_kaki[sisi] = st

    # -- badan berdiri (juga duduk-berdiri) --
    def ops_berdiri(self, t, ops):
        """Berdiri dengan kedua telapak terkunci di lantai (IK tungkai, tanpa tergelincir). Latihan boleh
        mendefinisikan `tubuh(anim, t)` -> dict: `geser` (geser panggul, m: pergeseran berat badan, naik-turun),
        `condong` (fleksi panggul ke depan, derajat; punggung tetap lurus: 72 % di panggul, 28 % tulang belakang),
        `miring_panggul` (derajat, + = panggul kanan naik; batang badan dikompensasi tetap tegak), `tumit` (derajat
        tumit terangkat, kedua kaki), `kepala_pitch` (derajat). Tungkai kerja ditimpa `pose()` lewat `tungkai()`."""
        s = self.L.tubuh(self, t) if hasattr(self.L, "tubuh") else {}
        condong = s.get("condong", 0.0)
        miring = s.get("miring_panggul", 0.0)
        # Goyang postural mikro (beberapa mm) di panggul; telapak tetap terkunci.
        goyang = Vector((gelombang(t, [(1, 0.0022, 0.4), (2, 0.0009, 2.1)]), gelombang(t, [(1, 0.0016, 1.7)]), 0.0))
        ops["Root"] = [geser(self.panggul + Vector(s.get("geser", (0.0, 0.0, 0.0))) + goyang)]
        ops["pelvis"] = [putar((1, 0, 0), condong * 0.72), putar((0, 1, 0), miring)]
        self.ops_badan_atas(t, ops, fleksi=condong * 0.28, lateral=-miring, kepala_pitch=s.get("kepala_pitch", 0.0))
        for sisi in ("l", "r"):
            T, R_kaki, R_jari = self.kaki_tapak(sisi, s.get("tumit", 0.0))
            self.tungkai(ops, sisi, T, self.kutub_lutut(sisi), R_kaki, R_jari)

    OPS_POSISI = {"duduk": "ops_duduk", "berdiri": "ops_berdiri", "duduk-berdiri": "ops_berdiri"}

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

    # -- tangan istirahat: IK, telapak bertumpu di paha/meja atau menggenggam sandaran --
    def ops_tangan_istirahat(self, t, ops, sisi):
        target, palmar, arah_jari, *lain = self.tangan_istirahat[sisi]
        opsi = lain[0] if lain else {}
        geo = self.geo[sisi]
        x = 1 if sisi == "l" else -1
        mikro = Vector((gelombang(t, [(1, 0.0012, 0.5 + 2 * x)]), gelombang(t, [(2, 0.0008, 1.3 + x)]), 0))
        T = target + mikro
        a, b = self.p.panjang[f"upperarm_{sisi}"], self.p.panjang[f"lowerarm_{sisi}"]
        kutub = Vector(opsi.get("kutub", (0.55 * x, 0.75, -0.15)))  # bawaan: siku ke luar-belakang

        def atas(M):
            return ik_dua_tulang(M.translation.copy(), T, a, b, kutub) - M.translation

        ops[f"upperarm_{sisi}"] = [arahkan(atas)]
        ops[f"lowerarm_{sisi}"] = [arahkan(lambda M: T - M.translation), puntir_ke(geo.palmar_lengan_lokal, palmar, 0.6)]
        if opsi.get("genggam"):
            # Genggaman tetap pada rel sandaran: tangan terkunci, jari dililitkan ke rel tiap frame.
            ops[f"hand_{sisi}"] = [orientasikan(lambda M: geo.rotasi(arah_jari, palmar))]
            operasi_genggam(ops, self.p, geo, sisi, opsi["genggam"], variasi=[gelombang(t, [(1, 1.0, k * 1.3 + x)]) for k in range(4)])
            return
        # Tangan rebah di paha/meja: jari searah paha, pergelangan menampung kemiringan lengan bawah; gerak mikro.
        # opsi `miring` (komponen z arah jari) dan `tekuk` (tekuk jari) untuk permukaan datar seperti meja.
        jari = (arah_jari + Vector((0, 0, opsi.get("miring", -0.05) + gelombang(t, [(1, 0.012, 2.0)])))).normalized()
        ops[f"hand_{sisi}"] = [orientasikan(lambda M: geo.rotasi(jari, palmar))]
        v = [gelombang(t, [(1, 2.0, k * 1.1)]) for k in range(4)]
        operasi_jari(ops, self.p, geo, sisi, tekuk=opsi.get("tekuk", 0.3), variasi=v, ibu=opsi.get("ibu", 0.5))

    def operasi(self, t):
        ops = {}
        getattr(self, self.OPS_POSISI[self.L.POSISI])(t, ops)
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
        cincin = self.L.CINCIN
        for pb in rig.pose.bones:
            pb.rotation_mode = "QUATERNION"
        self.rekam = []
        self.galat_kaki = 0.0
        for i in range(JUMLAH_FRAME + 1):
            frame = FRAME_MULAI + i
            t = i / FPS  # frame terakhir+1 (t = SIKLUS) = frame 1: kurva fcurve tertutup rapat
            self.sumbu_cincin = None
            self.sendi_cincin = None
            self.target_kaki = {}
            basis = self.p.susun(self.operasi(t))
            if self.sumbu_cincin is None:
                raise RuntimeError(f"pose() latihan {self.L.ID} tidak mengisi anim.sumbu_cincin")
            for sisi, st in self.target_kaki.items():
                self.galat_kaki = max(self.galat_kaki, (self.p.pos[f"foot_{sisi}"].translation - st["T"]).length)
            for n, B in basis.items():
                pb = rig.pose.bones[n]
                loc, rot, _ = B.decompose()
                pb.rotation_quaternion = rot
                pb.location = loc
                pb.keyframe_insert("rotation_quaternion", frame=frame, group=n)
                if n in ("Root", "pelvis"):
                    pb.keyframe_insert("location", frame=frame, group=n)
            sendi = self.sendi_cincin
            if sendi is None:
                sendi = [self.p.pos[c["tulang"]].translation.copy() for c in cincin]
            elif isinstance(sendi, Vector):
                sendi = [sendi.copy()]
            sumbu = self.sumbu_cincin
            sumbu = [Vector(s).normalized() for s in sumbu] if isinstance(sumbu, (list, tuple)) else [sumbu.normalized()] * len(cincin)
            if len(sendi) != len(cincin) or len(sumbu) != len(cincin):
                raise RuntimeError(f"{self.L.ID}: sendi/sumbu cincin tidak sesuai jumlah CINCIN ({len(cincin)})")
            self.rekam.append((frame, sendi, sumbu, self.kuat(t)))
            for sk in kunci_kedip:
                sk.value = kedip(t, self.L.T_KEDIP * SIKLUS)
                sk.keyframe_insert("value", frame=frame)
        if self.galat_kaki > 0.003:
            raise RuntimeError(f"{self.L.ID}: pergelangan kaki meleset {self.galat_kaki * 1000:.1f} mm dari target "
                               "(panggul terlalu jauh dari telapak; tungkai tidak menjangkau)")
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
