# MagangHub Daily Log Exporter

Userscript Tampermonkey untuk mengekspor laporan harian (daily log) dari portal MagangHub Kemnaker secara otomatis dalam berbagai format file.

> **Disclaimer:** Userscript ini dibuat dengan bantuan AI (Claude by Anthropic). Gunakan secara bertanggung jawab dan hanya untuk kebutuhan pribadi/akademis. Pastikan penggunaannya sesuai dengan kebijakan platform MagangHub.

---

## Fitur

- **Export JSON** — data mentah terstruktur
- **Export CSV** — siap dibuka di Excel / Google Sheets
- **Export Markdown** — laporan harian berformat rapi
- **Export AI Prompt** — teks siap-pakai untuk merangkum portofolio magang via ChatGPT / Claude / dsb.
- Otomatis membaca token autentikasi dari cookie, localStorage, atau Nuxt state
- Mendukung input token manual via DevTools jika diperlukan
- Menggunakan `GM_xmlhttpRequest` untuk melewati batasan CORS browser
- Rentang tanggal bisa dikustomisasi langsung dari panel UI

---

## Instalasi

### 1. Install Ekstensi Tampermonkey

Tampermonkey tersedia untuk semua browser utama:

| Browser | Link |
|---------|------|
| Google Chrome | [Chrome Web Store](https://chromewebstore.google.com/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo) |
| Firefox | [Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/) |
| Microsoft Edge | [Edge Add-ons](https://microsoftedge.microsoft.com/addons/detail/tampermonkey/iikmkjmpaadaobahmlepeloendndfphd) |

### 2. Aktifkan Akses Userscript di Google Chrome

Chrome memerlukan **Developer Mode** diaktifkan agar ekstensi seperti Tampermonkey bisa menjalankan userscript.

1. Buka Chrome, klik ikon **puzzle** (Extensions) di pojok kanan atas toolbar
2. Klik **Manage Extensions** (atau buka `chrome://extensions/`)
3. Di pojok kanan atas halaman Extensions, aktifkan toggle **Developer mode**
4. Setelah Developer mode aktif, Tampermonkey akan bisa berjalan penuh

> **Catatan:** Tanpa Developer mode, Chrome mungkin memblokir ekstensi pihak ketiga termasuk Tampermonkey.

### 3. Install Userscript

**Cara termudah — via GreasyFork:**

1. Buka halaman script di GreasyFork: [MagangHub Daily Log Exporter](https://greasyfork.org/en/scripts/573312-maganghub-daily-log-exporter)
2. Klik tombol hijau **Install this script**
3. Tampermonkey akan membuka tab konfirmasi — klik **Install**
4. Selesai, script langsung aktif

**Cara manual — dari file `.user.js`:**

1. Klik ikon Tampermonkey di browser, lalu pilih **Create a new script** (atau **Dashboard > +**)
2. Hapus semua isi default, lalu **salin seluruh isi file** `MagangHub Daily Log Exporter-1.2.0.user.js`
3. Paste ke editor Tampermonkey
4. Tekan **Ctrl+S** atau klik **File > Save**

---

## Cara Pakai

1. Login ke portal MagangHub: [https://monev.maganghub.kemnaker.go.id](https://monev.maganghub.kemnaker.go.id)
2. Setelah halaman terbuka, akan muncul tombol **📋** di pojok kanan bawah layar
3. Klik tombol tersebut untuk membuka panel exporter
4. Atur tanggal **Mulai** dan **Akhir** sesuai periode magang
5. Token autentikasi akan terisi otomatis — jika tidak, paste token Bearer dari DevTools secara manual
6. Pilih format export: **JSON**, **CSV**, **Markdown**, atau **AI Prompt**
7. File akan otomatis terunduh ke komputer

---

## Format Export

| Format | Kegunaan |
|--------|----------|
| `JSON` | Data mentah, cocok untuk integrasi atau backup |
| `CSV` | Buka di Excel / Google Sheets untuk analisis |
| `Markdown` | Laporan siap cetak / dokumentasi |
| `AI Prompt` | Teks siap-pakai untuk dimasukkan ke ChatGPT/Claude agar dibuatkan ringkasan portofolio |

---

## Troubleshooting

**Token tidak terdeteksi otomatis**
Buka DevTools (F12) > tab **Application** > **Cookies** atau **Local Storage**, cari key seperti `accessToken` atau `token`, lalu paste nilainya ke field Bearer Token di panel.

**Export gagal / data kosong**
Pastikan kamu sudah login dan sesi aktif. Coba refresh halaman lalu buka panel kembali.

**Tampermonkey tidak aktif di Chrome**
Pastikan Developer mode sudah diaktifkan (lihat langkah 2 di atas).

---

## Lisensi

MIT License — bebas digunakan dan dimodifikasi untuk keperluan pribadi.

---

*Dibuat dengan bantuan Claude AI (Anthropic) — untuk kemudahan peserta magang dalam mengekspor dan mendokumentasikan laporan harian.*
