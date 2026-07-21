# Simple SelfBot

Bot WhatsApp pribadi berbasis [Baileys](https://github.com/WhiskeySockets/Baileys). Proyek ini memakai pairing code secara default dan hanya memproses perintah yang dikirim oleh akun sendiri (`fromMe`).

> Baileys memakai protokol WhatsApp Web dan bukan API resmi WhatsApp Business. Penggunaan otomasi dapat menyebabkan pembatasan atau pemblokiran akun. Gunakan secara wajar dan tanggung risikonya sendiri.

## Persyaratan

- Node.js 20.9 atau lebih baru (Node.js 22 LTS direkomendasikan)
- npm

FFmpeg sudah disertakan melalui dependensi npm, jadi tidak perlu dipasang secara terpisah.

## Instalasi

```bash
npm install
npm start
```

Saat pertama dijalankan, masukkan nomor WhatsApp dengan kode negara tanpa tanda `+`, spasi, atau tanda hubung. Contoh:

```text
628123456789
```

Masukkan pairing code yang ditampilkan ke menu **WhatsApp > Perangkat tertaut > Tautkan dengan nomor telepon**.

Untuk server/non-interaktif, nomor dapat diberikan melalui environment variable:

```powershell
$env:WA_PHONE_NUMBER = "628123456789"
npm start
```

Untuk login dengan QR code:

```bash
npm run start:qr
```

Data autentikasi disimpan di folder `sessions/`. Jangan mengunggah, membagikan, atau memasukkan folder tersebut ke source control. Jika WhatsApp menampilkan status logout, hentikan bot, hapus folder `sessions/`, lalu lakukan pairing ulang.

## Konfigurasi

Ubah `config.json` untuk mengatur nama bot, nama pemilik, watermark, nomor pemilik, dan prefix. Prefix juga dapat diubah melalui perintah `!setprefix`.

Perintah utama:

```text
!menu
!menu owner
!instagram https://www.instagram.com/reel/...
```

Downloader Instagram juga dapat dipanggil melalui `!ig` atau `!igdl`. Post gambar dikirim sebagai gambar, Reel/video dikirim sebagai video, dan carousel yang seluruh medianya berupa gambar dikirim sebagai album native WhatsApp. Carousel campuran gambar/video tetap dikirim berurutan sesuai jenis setiap medianya. Link Story dan akun private tidak didukung.

Perintah `!setppbot` dan `!setppgc` mempertahankan rasio gambar asli. Gambar portrait atau landscape tidak dipotong otomatis menjadi rasio 1:1 sebelum dikirim ke WhatsApp.

## Pemeriksaan

```bash
npm run check
npm audit
```

Downloader YouTube, Facebook, Instagram, TikTok, MediaFire, dan Mega bergantung pada situs atau layanan pihak ketiga. Perubahan dari layanan tersebut dapat membuat fitur downloader tertentu berhenti meskipun koneksi bot tetap berjalan.

## Pemecahan masalah

- **Pairing code tidak muncul:** pastikan nomor memakai kode negara dan Node.js memenuhi versi minimum.
- **Session logout:** hapus `sessions/`, jalankan ulang, lalu pairing kembali.
- **Media gagal dikonversi:** jalankan `npm install` lagi agar binary FFmpeg platform saat ini terpasang.
- **Log Baileys dibutuhkan:** jalankan dengan `LOG_LEVEL=info` (PowerShell: `$env:LOG_LEVEL = "info"`).

Lisensi: Apache-2.0.
