# Product Requirements Document (PRD) - CaffiSense

## 1. Pendahuluan
**Nama Aplikasi:** CaffiSense  
**Deskripsi Singkat:** CaffiSense adalah aplikasi pelacak dan penganalisis pola konsumsi kafein (kopi) berbasis *Machine Learning* dan *Generative AI*. Aplikasi ini bertujuan untuk membantu pengguna memahami dampak kebiasaan minum kopi mereka terhadap kualitas dan durasi tidur, memberikan visualisasi metabolisme kafein secara waktu nyata (real-time), serta merekomendasikan solusi gaya hidup sehat yang dipersonalisasi.

**Visi Produk:** Menjadi asisten kesehatan personal terbaik bagi penikmat kopi untuk menyeimbangkan produktivitas (konsumsi kafein) dan pemulihan tubuh (kualitas tidur).

---

## 2. Arsitektur Sistem & Teknologi
CaffiSense dibangun dengan arsitektur *microservices-oriented* yang memisahkan antara antarmuka pengguna, logika bisnis/database, dan layanan prediksi kecerdasan buatan.

*   **Frontend (FE):** React.js dengan TypeScript, Vite, Tailwind CSS (untuk *styling*), Recharts (untuk grafik visualisasi), dan jsPDF (untuk ekspor laporan).
*   **Backend (BE):** Laravel (PHP) dengan arsitektur RESTful API, Laravel Sanctum untuk otentikasi JWT/Token, dan MySQL sebagai basis data relasional.
*   **Machine Learning (ML) Service:** Python dengan FastAPI, Scikit-learn (Random Forest / model prediktif), Pandas. Melayani *endpoint* API mandiri untuk inferensi prediksi gangguan tidur.
*   **AI Integration:** Google Gemini API (model `gemini-1.5-flash` / `gemini-3.6-flash`) terintegrasi di sisi Backend untuk analisis rekomendasi bahasa natural (NLP).

---

## 3. Fitur Utama & Fungsionalitas

### 3.1. Manajemen Pengguna (Otentikasi & Profil)
*   **Fungsi:** Memungkinkan pengguna untuk mendaftar, login, dan mengelola data pribadi.
*   **FE:** Halaman Login & Registrasi, Profile Page. Menggunakan Context API (`AuthContext`) untuk manajemen *state* otentikasi (Token).
*   **BE:** *Endpoint* `/api/login`, `/api/register`, `/api/user`, `/api/logout`. Sistem pengamanan *password* (hashing) dan validasi token.
*   **Fitur Ekspor PDF:** Pada halaman Profil, pengguna dapat mengunduh (*download*) seluruh riwayat data diagnosis mereka dalam format PDF menggunakan library `jsPDF` dan `autoTable`.

### 3.2. Diagnosis & Penilaian Kesehatan (Assessment)
*   **Fungsi:** Fitur inti di mana pengguna memasukkan data konsumsi kopi harian dan metrik tidur mereka.
*   **Input Pengguna:** 
    *   Jumlah cangkir kopi per hari.
    *   Ukuran cangkir (Kecil, Sedang, Besar).
    *   Waktu terakhir minum kopi (Jam & Menit).
    *   Durasi tidur (jam).
    *   Kualitas tidur (Buruk, Cukup, Baik).
    *   Teks deskripsi keluhan (*free-text experience*).
*   **FE:** Halaman `Diagnosis.tsx` dengan formulir input reaktif.
*   **BE:** *Endpoint* `/api/assessment` (POST). Menyimpan data ke tabel `assessments`, menghitung estimasi asupan kafein (mg).

### 3.3. Prediksi Machine Learning (Sleep Disruption Probability)
*   **Fungsi:** Memprediksi probabilitas pengguna akan mengalami gangguan tidur berdasarkan data konsumsi.
*   **Alur (Pipeline):** Backend Laravel mengirim *payload* data konsumsi ke ML-Service (via HTTP POST ke `http://127.0.0.1:8001/predict`).
*   **ML-Service:** Menerima *request*, memproses fitur (ekstraksi waktu, konversi kategori ukuran), dan menjalankan model prediksi (klasifikasi biner). Mengembalikan nilai `prediction` (0/1) dan `probability` (%).
*   **BE:** Menyimpan hasil prediksi ML ke dalam database `assessments` untuk riwayat pengguna.

### 3.4. Evaluasi & Rekomendasi AI (Gemini AI)
*   **Fungsi:** Memberikan ulasan komprehensif, edukasi risiko, dan tips pemulihan menggunakan Generative AI.
*   **BE:** Backend mem-format *prompt* spesifik berdasarkan input pengguna (jumlah cangkir, ukuran, potensi gangguan dari ML), lalu mengirimkannya ke Google Gemini API via cURL/HTTP Client (dengan *bypass* SSL `verify => false` untuk lokal).
*   **FE:** Menampilkan hasil dari Gemini secara dinamis di dalam UI (Markdown render) di komponen "Rekomendasi & Evaluasi Kesehatan". AI memberikan 4 poin utama: Analisis Pola, Potensi Risiko Jangka Panjang, Statistik Risiko, dan Saran Praktis.

### 3.5. Visualisasi Data (Dual-Chart Analytics)
*   **Fungsi:** Menampilkan grafik interaktif kepada pengguna tanpa perlu berpindah halaman atau membuka modal.
*   **FE (Recharts):** 
    1.  **Grafik Metabolisme Kafein (Real-time):** Grafik Area/Garis yang mensimulasikan kurva peluruhan kafein dalam tubuh selama 24 jam ke depan sejak tegukan kopi terakhir (menggunakan asumsi waktu paruh/half-life kafein ~5 jam). Grafik ini bergerak dinamis sesuai perubahan input form (Jam & Cangkir).
    2.  **Grafik Tren Keseluruhan (Histori):** Grafik interaktif yang membandingkan "Durasi Tidur" vs "Probabilitas Gangguan (dari ML)" dari waktu ke waktu berdasarkan riwayat *assessment* pengguna sebelumnya.

---

## 4. Alur Interaksi Komponen (Component Flow)

1.  **User Input:** Pengguna mengisi form di Halaman Diagnosis (React FE). Seiring pengisian waktu dan jumlah, *Grafik Metabolisme Kafein* merespons secara otomatis di latar belakang.
2.  **Submit Form:** Pengguna menekan "Simpan / Update Data". FE memanggil API `POST /api/assessment` di Backend (Laravel) dengan menyertakan Bearer Token.
3.  **Backend Processing:**
    *   Laravel memvalidasi input.
    *   Laravel melakukan pemanggilan internal ke ML Service (FastAPI) untuk mendapat angka `probability`.
    *   Laravel melakukan pemanggilan eksternal ke Gemini API (Google) untuk mendapatkan teks rekomendasi.
    *   Laravel menyimpan semuanya (termasuk hasil ML) ke database MySQL.
4.  **Response Handling:** Backend mengirimkan respons JSON kembali ke Frontend (berisi status sukses, data riwayat terbaru, dan teks AI).
5.  **UI Update:** FE menerima respons, meng-update *state* komponen. Teks evaluasi AI muncul, dan *Grafik Tren Histori* diperbarui dengan titik data terbaru.

---

## 5. Rencana Pengembangan ke Depan (Future Scope)
*   **Notifikasi Email Berkala (Weekly Report):** Mengirim rekap konsumsi mingguan ke email (Gmail) terdaftar pengguna.
*   **Push Notifications (PWA):** Pengingat waktu tidur atau pengingat "Batas Aman Konsumsi Harian".
*   **Skalabilitas Model ML:** Retraining model ML secara berkala berdasarkan data *feedback* kualitatif (*free text experience*) pengguna baru.
