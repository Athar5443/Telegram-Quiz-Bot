# 🤖 Telegram Quiz Bot Interaktif

<p align="center">
    <img src="https://imgur.com/a/FozpxRy" alt="Contoh Tampilan Kuis" width="400"/>
</p>
<p align="center">
    <em>Bot kuis Telegram modern dengan verifikasi nama, sistem peringkat adaptif, leaderboard, dan laporan statistik otomatis.</em>
</p>
<p align="center">
    <img src="https://img.shields.io/badge/Node.js-20+-green.svg" alt="Node.js">
    <img src="https://img.shields.io/badge/Telegraf-4.x-blue.svg" alt="Telegraf">
    <img src="https://img.shields.io/badge/Lisensi-ISC-yellow.svg" alt="License">
</p>

---

## ✨ Fitur Utama

- **📝 Verifikasi Nama**: Pengguna wajib memverifikasi nama terdaftar sebelum bermain.
- **🧠 Kuis Adaptif**: Tingkat kesulitan soal otomatis menyesuaikan performa pemain—jawaban benar meningkatkan level soal, jawaban salah menurunkan.
- **📊 Statistik Lengkap**:
    - **Per Ronde**: Lacak skor & akurasi selama sesi kuis aktif.
    - **Keseluruhan**: Rekam total skor, jumlah jawaban, dan riwayat permainan secara permanen.
- **🏆 Leaderboard**: Perintah `/leaderboard` menampilkan 10 pemain teratas untuk memacu kompetisi.
- **🔄 Manajemen Progres**: Hentikan kuis kapan saja, atau reset progres dengan `/reset` (dengan konfirmasi).
- **💾 Database Lokal**: Semua data pengguna, soal, dan jawaban tersimpan di file JSON lokal—portabel, tanpa server eksternal.
- **🛡️ Validasi Soal**: Soal di `soal.json` divalidasi otomatis saat bot dijalankan untuk memastikan data valid.
- **📈 Laporan Discord**: Statistik periodik dikirim otomatis ke channel Discord via Webhook, lengkap dengan daftar peserta.
- **⚙️ Perintah Admin**: `/reload` (khusus admin) untuk memuat ulang database soal & pengguna tanpa restart bot.

---

## 🚀 Instalasi & Pengaturan

Ikuti langkah berikut untuk menjalankan bot di komputer lokal Anda:

### 1. Prasyarat

- **[Node.js](https://nodejs.org/en/)** (disarankan versi 20+)
- **Token Bot Telegram** dari **[@BotFather](https://t.me/BotFather)**

### 2. Kloning Repositori

```bash
git clone https://github.com/Athar5443/Telegram-Quiz-Bot.git
cd Telegram-Quiz-Bot
```

### 3. Konfigurasi Environment

Salin file `example.env` menjadi `.env`, lalu isi variabel di dalamnya dengan data yang sesuai (misal: token bot Telegram, webhook Discord, dsb).

```bash
cp example.env .env
# Edit file .env dan lengkapi datanya
```