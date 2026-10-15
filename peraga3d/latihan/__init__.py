"""Pemuat modul latihan peraga: `muat("fleksi-siku")` -> modul `latihan/fleksi_siku.py` yang sudah divalidasi,
dengan `SIKLUS` (detik) diturunkan dari `tempoTargetDetik` di src/features/pose/exerciseDefinitions.ts.

Siklus = tempo tengah dibatasi 2..6 dtk, dibulatkan ke 0,5 dtk: rumus yang SAMA dengan teks irama di
`src/features/pose/VideoPeraga.tsx` ("sekitar N detik tiap gerakan"), sehingga video dan teks selalu cocok.
"""
import importlib
import math
import os
import re

import gerak

AKAR_REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DEFINISI = os.path.join(AKAR_REPO, "src", "features", "pose", "exerciseDefinitions.ts")

WAJIB = ("ID", "POSISI", "KUNCI", "T_PUNCAK", "T_KEDIP", "KAMERA", "OTOT", "CINCIN", "BADAN", "KEPALA",
         "TANGAN_ISTIRAHAT", "pose")


def tempo_target(id_latihan):
    with open(DEFINISI, encoding="utf-8") as fh:
        teks = fh.read()
    m = re.search(r"id:\s*'%s'.*?tempoTargetDetik:\s*\{\s*min:\s*([\d.]+),\s*max:\s*([\d.]+)\s*\}" % re.escape(id_latihan), teks, re.S)
    if not m:
        raise KeyError(f"tempoTargetDetik untuk '{id_latihan}' tidak ditemukan di {DEFINISI}")
    return float(m.group(1)), float(m.group(2))


def siklus_dari_tempo(mn, mx):
    t = min(6.0, max(2.0, (mn + mx) / 2))
    return math.floor(t * 2 + 0.5) / 2  # sama dengan Math.round(t * 2) / 2 di JS


def muat(id_latihan):
    mod = importlib.import_module("latihan." + id_latihan.replace("-", "_"))
    kurang = [k for k in WAJIB if not hasattr(mod, k)]
    if kurang:
        raise AttributeError(f"latihan {id_latihan}: atribut wajib hilang {kurang}")
    if mod.ID != id_latihan:
        raise ValueError(f"ID modul {mod.ID} != {id_latihan}")
    k = mod.KUNCI
    if k[0][0] != 0.0 or k[-1][0] != 1.0 or abs(k[0][1] - k[-1][1]) > 1e-9:
        raise ValueError(f"{id_latihan}: KUNCI harus mulai di fraksi 0 dan berakhir di 1 dengan nilai sama (loop)")
    if any(b[0] <= a[0] for a, b in zip(k, k[1:])):
        raise ValueError(f"{id_latihan}: fraksi KUNCI harus naik")
    if isinstance(mod.CINCIN, dict):
        mod.CINCIN = [mod.CINCIN]  # satu cincin boleh ditulis sebagai dict
    mn, mx = tempo_target(id_latihan)
    mod.TEMPO = (mn, mx)
    mod.SIKLUS = siklus_dari_tempo(mn, mx)
    gerak.atur_siklus(mod.SIKLUS)
    return mod
