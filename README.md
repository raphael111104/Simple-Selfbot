# Simple SelfBot

Simple SelfBot adalah bot WhatsApp pribadi berbasis [Baileys](https://github.com/WhiskeySockets/Baileys). Bot hanya memproses pesan yang dikirim oleh akun sendiri (`fromMe`), mendukung pairing code dan QR code, serta menyediakan downloader, converter media, sticker, dan beberapa alat grup.

> [!WARNING]
> Baileys menggunakan protokol WhatsApp Web dan bukan API resmi WhatsApp Business. Automasi atau penggunaan berlebihan dapat menyebabkan pembatasan maupun pemblokiran akun. Gunakan dengan bijak dan tanggung risikonya sendiri.

## Fitur utama

- Login menggunakan pairing code atau QR code.
- Hot reload untuk `conn.js` dan `config.json`.
- Downloader YouTube, TikTok, Instagram, MediaFire, dan Mega.
- Dukungan post, Reel/video, carousel campuran, dan album gambar native WhatsApp untuk Instagram.
- Converter sticker, gambar, video, audio, dan upload media.
- Fake quoted location dengan thumbnail `sticker/location-thumbnail.jpg` dan quick-reply button pada command `test`.
- Pengaturan foto profil tanpa memaksa gambar menjadi persegi.
- Alat grup seperti tag all, hidden tag, info grup, dan foto profil grup.
- Penyimpanan session multi-file dan memory store opsional.
- Test otomatis menggunakan Node.js test runner.

## Persyaratan

- [Node.js](https://nodejs.org/) versi 20.9.0 atau lebih baru; Node.js 22 LTS direkomendasikan.
- npm.
- Git jika project diambil dengan `git clone`.

FFmpeg dan yt-dlp disediakan melalui dependensi npm. Script `postinstall` akan memeriksa binary yang dibutuhkan.

## Instalasi

Clone repository dan pasang dependensi:

```bash
git clone https://github.com/raphael111104/Simple-Selfbot.git
cd Simple-Selfbot
npm install
```

Sesuaikan `config.json` sebelum menjalankan bot:

```json
{
  "ownerNumber": "628123456789",
  "botName": "Simple-SelfBot",
  "prefix": "!",
  "ownerName": "Nama Anda",
  "watermark": "Simple SelfBot"
}
```

Gunakan nomor dengan kode negara tanpa tanda `+`, spasi, atau tanda hubung.

## Menjalankan project

### Pairing code — default

```bash
npm start
```

Pada proses pertama, masukkan nomor WhatsApp dengan kode negara. Setelah pairing code muncul:

1. Buka WhatsApp pada ponsel.
2. Masuk ke **Perangkat tertaut**.
3. Pilih **Tautkan perangkat** lalu **Tautkan dengan nomor telepon**.
4. Masukkan pairing code dari terminal.

Untuk server atau terminal non-interaktif, berikan nomor melalui environment variable.

PowerShell:

```powershell
$env:WA_PHONE_NUMBER = "628123456789"
npm start
```

Linux/macOS:

```bash
WA_PHONE_NUMBER=628123456789 npm start
```

### QR code

```bash
npm run start:qr
```

Scan QR melalui menu **WhatsApp > Perangkat tertaut > Tautkan perangkat**.

Session tersimpan di folder `sessions/`. Folder ini berisi kredensial sensitif, sudah diabaikan oleh Git, dan tidak boleh dibagikan atau diunggah ke repository.

## Cara menggunakan command

Kirim command dari akun WhatsApp yang terhubung. Prefix default adalah `!` dan dapat diubah melalui `!setprefix`.

Command `test` merupakan pengecualian dan dapat dikirim tanpa prefix:

```text
test
```

Output-nya menampilkan fake quoted location dengan thumbnail `sticker/location-thumbnail.jpg`, status bot, spesifikasi server, serta button menuju command Menu dan Creator. Thumbnail dinormalisasi terlebih dahulu agar kompatibel dengan renderer WhatsApp. `!test` tetap didukung.

### Menu dan informasi

| Command | Alias | Fungsi |
| --- | --- | --- |
| `!menu` | `!help` | Menampilkan menu utama. |
| `!menu owner` | — | Menampilkan menu pengaturan. |
| `!creator` | — | Mengirim kontak pemilik bot. |
| `test` | `!test` | Status bot, spesifikasi server, dan quick-reply button. |

### Downloader

| Command | Alias | Fungsi |
| --- | --- | --- |
| `!play <judul>` | `!ytplay` | Mencari YouTube lalu mengirim audio. |
| `!ytsearch <judul>` | `!yts` | Mencari video YouTube. |
| `!ytmp3 <url>` | `!mp3` | Mengunduh audio YouTube. |
| `!ytmp4 <url>` | `!mp4` | Mengunduh video YouTube. |
| `!tiktok <url>` | `!tt` | Mengunduh video atau slide TikTok. |
| `!instagram <url>` | `!ig`, `!igdl` | Mengunduh post, Reel, atau carousel Instagram. |
| `!mediafire <url>` | — | Mengunduh file MediaFire. |
| `!mega <url>` | — | Mengunduh file Mega. |

Instagram Story dan akun private tidak didukung. Carousel yang seluruh medianya berupa gambar dikirim sebagai album native WhatsApp; carousel campuran gambar/video dikirim berurutan sesuai jenis medianya.

### Sticker dan converter

| Command | Alias utama | Fungsi |
| --- | --- | --- |
| `!sticker` | `!s`, `!stiker`, `!stc` | Membuat sticker dari gambar atau video pendek. |
| `!stickercrop` | `!scrop`, `!stikercrop` | Membuat sticker dengan mode crop. |
| `!stickermeme atas\|bawah` | `!smeme`, `!stikermeme` | Membuat sticker meme. |
| `!take pack\|author` | `!swm`, `!stickerwm` | Mengubah pack dan author sticker. |
| `!toimg` | `!toimage` | Mengubah sticker menjadi gambar. |
| `!tovideo` | `!tomp4` | Mengubah sticker animasi menjadi video. |
| `!toaudio` | `!tomp3` | Mengambil audio dari video. |
| `!tourl` | `!upload` | Mengunggah gambar/video dan menghasilkan URL. |
| `!readmore teks1\|teks2` | — | Membuat teks read-more WhatsApp. |

### Alat grup dan pesan

| Command | Alias | Fungsi |
| --- | --- | --- |
| `!tagall <teks>` | — | Mention seluruh anggota grup. |
| `!hidetag <teks>` | `!h` | Mengirim hidden tag ke seluruh anggota. |
| `!infogroup` | `!infogc`, `!infogrup` | Menampilkan informasi grup. |
| `!setppgc` | `!setppgrup`, `!spgc` | Mengubah foto profil grup. |
| `!reply @user\|target\|balasan` | `!fitnah` | Membuat balasan dengan quoted message kustom. |
| `!forward <teks>` | `!fwd` | Mengirim teks dengan atribut forwarded. |
| `!fakeorder <teks>` | `!fake` | Membuat pesan order kustom. |

### Pengaturan dan database respons

| Command | Alias | Fungsi |
| --- | --- | --- |
| `!setprefix <prefix>` | — | Mengubah prefix dan menyimpannya ke `config.json`. |
| `!setppbot` | `!setpp`, `!spb` | Mengubah foto profil akun bot. |
| `!setthumb` | — | Mengubah thumbnail. |
| `!setlocationthumb` | `!setlocthumb` | Mengubah thumbnail fake location. |
| `!addresponse key\|jawaban` | — | Menambahkan respons otomatis grup. |
| `!delresponse <key>` | — | Menghapus respons otomatis grup. |
| `!error` | — | Menampilkan daftar error tersimpan. |
| `!clear` | `!clearer`, `!clearerr` | Menghapus daftar error tersimpan. |
| `!session` | `!mysesi`, `!sendsesi` | Menampilkan peringatan keamanan; pengiriman session dinonaktifkan. |

## Pemeriksaan dan pengujian

Periksa syntax seluruh file utama:

```bash
npm run check
```

Jalankan test otomatis:

```bash
npm test
```

Periksa kerentanan dependensi:

```bash
npm audit
```

## Pemecahan masalah

- **Pairing code tidak muncul:** pastikan nomor memakai kode negara dan Node.js memenuhi versi minimum.
- **Session logout:** hentikan bot, hapus folder `sessions/`, lalu pairing ulang.
- **Binary media tidak tersedia:** jalankan `npm install` kembali agar script `postinstall` memeriksa FFmpeg dan yt-dlp.
- **Downloader gagal:** Instagram, YouTube, TikTok, MediaFire, dan Mega dapat mengubah sistem mereka sewaktu-waktu.
- **Butuh log Baileys:** gunakan `LOG_LEVEL=info`. Pada PowerShell jalankan `$env:LOG_LEVEL = "info"` sebelum `npm start`.
- **Pesan ditolak WhatsApp:** periksa log `[MESSAGE DELIVERY ERROR]` di terminal untuk melihat ID tujuan dan kode penolakan.

## Keamanan

- Jangan pernah membagikan folder `sessions/` atau pairing code.
- Jangan commit nomor pribadi, token, cookie, atau file session ke repository publik.
- Gunakan akun pengujian jika melakukan eksperimen berisiko.
- Hindari broadcast, spam, dan pengiriman pesan otomatis berkecepatan tinggi.

## TQTO — Baileys

Terima kasih kepada tim [WhiskeySockets/Baileys](https://github.com/WhiskeySockets/Baileys) dan seluruh contributornya yang menyediakan implementasi WhatsApp Web open-source untuk Node.js. Project ini menggunakan package `baileys` versi `7.0.0-rc13`.

Simple SelfBot bukan bagian dari, tidak disponsori oleh, dan tidak berafiliasi dengan WhatsApp, Meta, maupun WhiskeySockets.

## Contributors

Daftar berikut disusun berdasarkan riwayat commit Git:

- [Rafli A. / Rafly11](https://github.com/dragneel1111) — original author dan contributor utama.
- [raphael111104](https://github.com/raphael111104) — maintainer dan contributor.
- [Xiao Yan](https://github.com/ImYanXiao) — contributor.

Terima kasih kepada seluruh contributor, maintainer dependency, tester, dan pengguna yang membantu perkembangan project ini.

## Lisensi

Project ini dirilis menggunakan lisensi [Apache-2.0](LICENSE).
