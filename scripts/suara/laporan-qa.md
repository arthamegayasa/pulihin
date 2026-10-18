# Laporan QA klip suara

Dibuat oleh `scripts/suara/buat-suara.mjs`. Model elevenlabs/eleven-v4, suara matilda, juri google/gemini-3.5-flash (transkripsi buta).

- Klip: 387, 6.35 MB di `public/suara/`, 13.5 menit audio
- Transkripsi buta cocok persis: 383 (62 di antaranya setelah dibuat ulang)
- Transkripsi buta berbeda, tetapi juri yang diberi teks menyatakan sesuai (beda ejaan/jeda): 4
- Masih tidak cocok setelah 2x dibuat ulang: 0
- Belum dinilai: 0
- Biaya tercatat semua run: TTS ±$0.941 (24293 karakter), juri $0.920

## Beda transkripsi yang dinyatakan sesuai

| Teks | Transkripsi buta | Catatan juri |
|---|---|---|
| bu. ah. buah. | buah | Audio melafalkan kata 'bu', 'ah', dan 'buah' dengan jelas dan sesuai urutan. |
| ku. e. kue. | ku eh kue | Audio mengucapkan kata-kata 'ku', 'e', 'kue' dengan jelas dan sesuai urutan. |
| Gerakkan jari satu per satu. | gerakan jari satu per satu | Audio sesuai dengan teks, diucapkan dengan jelas dan tepat. |
| le. lah. lelah. | lah lah lelah | Audio mengucapkan kata 'le', 'lah', 'lelah' dengan tepat dan jelas sesuai dengan teks. |

## Uji dengar 10 klip (kehangatan, kealamian)

| Teks | Gaya | Hangat | Alami | Jelas (lansia) | Aksen ID | Catatan |
|---|---|---|---|---|---|---|
| Posisikan tubuh Anda di dalam bingkai. | arahan | 8 | 8 | 9 | 10 | Artikulasi sangat jelas dan tempo bicara cukup tenang, sangat baik untuk lansia. Instruksi singkat dan mudah dipahami. |
| Satu kata benar. | arahan | 8 | 8 | 9 | 10 | Intonasi terdengar positif dan menyemangati. Artikulasi sangat jelas sehingga mudah dipahami oleh lansia. |
| Satu. | hitung | 7 | 8 | 9 | 10 | Pengucapan kata 'Satu' terdengar sangat jelas, artikulasi baik, dan temponya pas untuk lansia. |
| Dua puluh enam. | hitung | 7 | 8 | 9 | 10 | Pengucapan angka sangat jelas dan artikulasinya baik untuk lansia, namun intonasinya terdengar agak datar. |
| Hebat! Target tercapai. | pujian | 8 | 8 | 9 | 10 | Intonasi terdengar positif dan sangat menyemangati. Penggunaan kata yang sederhana dan jelas, sangat cocok untuk memotivasi pengguna lansia. |
| Mundur sedikit agar tubuh terlihat penuh. | koreksi | 8 | 8 | 9 | 10 | Instruksi cukup jelas dan disampaikan dengan sopan. Frasa 'terlihat penuh' mungkin bisa disederhanakan menjadi 'terlihat seluruhnya' agar lebih intuitif bagi lansia. |
| Gerakan tadi belum terhitung. Coba sekali lagi, pelan pelan. | lembut | 8 | 9 | 9 | 10 | Intonasi lembut, tenang, dan sangat cocok untuk lansia. Tempo bicaranya lambat sehingga mudah diikuti. |
| Coba sekali lagi, pelan-pelan. | lembut | 9 | 9 | 10 | 9 | Instruksi sangat baik, singkat, dan menggunakan kata-kata yang menenangkan serta mudah dipahami oleh lansia. |
| kursi | kata | 7 | 8 | 9 | 9 | Pengucapan kata sangat jelas dan artikulasinya baik untuk lansia, namun terlalu singkat untuk menilai kehangatan secara penuh. |
| wortel | kata | 6 | 7 | 9 | 10 | Pengucapan kata 'wortel' sangat jelas dan artikulatif, sangat baik untuk lansia, meskipun terdengar agak datar karena berupa satu kata tunggal. |

