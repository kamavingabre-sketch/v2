# 🚀 Panduan Deploy ke Railway

## Struktur File
```
├── index.js          ← Bot WhatsApp (Baileys)
├── web.js            ← Dashboard Admin
├── handler.js
├── menu.js
├── store.js
├── logger.js
├── start.js          ← Launcher (jalankan bot + web sekaligus)
├── package.json
├── railway.toml
└── .env.example
```

---

## Langkah Deploy

### 1. Push ke GitHub
```bash
git init
git add .
git commit -m "Initial deploy Hallo Johor Bot"
git remote add origin https://github.com/username/hallo-johor-bot.git
git push -u origin main
```

### 2. Buat Project di Railway
- Buka [railway.app](https://railway.app)
- Klik **New Project → Deploy from GitHub repo**
- Pilih repository bot ini

### 3. Tambah Volume (WAJIB untuk persistensi data)
Data bot (auth WhatsApp, laporan, livechat) harus disimpan di Volume agar
tidak hilang saat redeploy.

Di Railway dashboard:
- Klik service bot → tab **Volumes**
- Klik **Add Volume**
- Mount path: `/app`  *(atau sesuai working directory Railway)*

> ⚠️ Tanpa Volume, sesi WhatsApp akan hilang setiap kali Railway restart/redeploy.

### 4. Set Environment Variables
Di Railway dashboard → tab **Variables**, tambahkan:

| Variable       | Nilai                     | Keterangan                              |
|----------------|---------------------------|-----------------------------------------|
| `PHONE_NUMBER` | `628xxxxxxxxxx`           | Nomor WA bot (format internasional)     |
| `ADMIN_USER`   | `admin`                   | Username dashboard                      |
| `ADMIN_PASS`   | `passwordkuat123`         | Password dashboard (ganti yang kuat!)   |

> `PORT` **tidak perlu diset**, Railway mengisinya otomatis.

### 5. Deploy & Ambil Pairing Code
- Setelah deploy, buka **Logs** di Railway
- Cari baris seperti:
  ```
  [BOT] ╔══════════════════════════════╗
  [BOT] ║   🔑  PAIRING CODE ANDA      ║
  [BOT] ║      XXXX-XXXX               ║
  [BOT] ╚══════════════════════════════╝
  ```
- Buka WhatsApp di HP → **Tiga titik → Perangkat Tertaut → Tautkan Perangkat**
- Masukkan kode pairing

### 6. Verifikasi Terhubung
Setelah pairing berhasil, log akan menampilkan:
```
[BOT] ✅ CONNECTED  Bot terhubung! — NamaBot (628xxx@s.whatsapp.net)
[BOT] 🚀 READY      Bot siap menerima pesan!
[WEB] ✅ Dashboard berjalan di port xxxx
```

### 7. Akses Dashboard
- Buka URL Railway service Anda (dari tab **Settings → Public Networking**)
- Login dengan `ADMIN_USER` dan `ADMIN_PASS` yang sudah diset

---

## Setelah Sesi Terdaftar
Variabel `PHONE_NUMBER` tetap bisa dibiarkan — bot tidak akan request pairing
ulang selama folder `auth_info_baileys` (di Volume) masih ada.

---

## Troubleshooting

| Masalah | Solusi |
|---------|--------|
| Pairing code tidak muncul di log | Pastikan `PHONE_NUMBER` sudah diset di Variables |
| Data laporan hilang setelah redeploy | Pasang Volume di Railway |
| Dashboard tidak bisa diakses | Pastikan Public Networking aktif di Settings |
| Bot disconnect terus | Cek log, mungkin sesi rusak — hapus isi Volume folder `auth_info_baileys` dan pairing ulang |
