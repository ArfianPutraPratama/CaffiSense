# ☕ CaffiSense — AI-Powered Caffeine & Sleep Health Platform

CaffiSense adalah platform kesehatan cerdas (*health-tech*) yang memetakan farmakokinetik kafein, metabolisme ritme sirkadian, serta dampaknya terhadap kualitas tidur dan organ tubuh secara *real-time*.

---

## 🌟 Fitur Utama

- **7-Step Focused Diagnosis Wizard:** Formulir 7 langkah berurutan untuk mencatat konsumsi kopi, status lambung (makan), aktivitas fisik, konsumsi rokok (induksi CYP1A2), pola istirahat, hidrasi, dan keluhan fisik.
- **Interactive 11-Organ Anatomy Visualizer (3D & 2D):** Pemetaan beban fisiologis interaktif pada 11 organ tubuh manusia menggunakan model **BioDigital Human™ 3D** dan diagram medis 2D resolusi tinggi.
- **Real-Time Caffeine Decay Chart:** Simulasi kurva peluruhan kafein 14 jam ke depan dengan ambang batas tidur nyenyak (*Deep Sleep* $\le 50\text{ mg}$) dan batas aman FDA ($400\text{ mg}$).
- **Dual AI Engine:**
  - **Machine Learning (FastAPI):** Prediksi probabilitas risiko gangguan tidur berbasis model Random Forest / Logistic Regression.
  - **Generative AI (Google Gemini):** Rekomendasi klinis terpersonalisasi, solusi kebiasaan, pertolongan cepat, dan protokol reset sirkadian.
- **Export Laporan Medis (PDF & CSV):** Unduh ringkasan evaluasi kesehatan dalam format dokumen PDF resmi atau riwayat CSV.

---

## 🛠️ Arsitektur Teknologi

- **Frontend:** React 19, TypeScript, Vite, TailwindCSS v4, Recharts, Lucide Icons, jsPDF.
- **Backend API:** Laravel 11 (PHP 8.2), MySQL / MariaDB, Sanctum Authentication.
- **Machine Learning Service:** Python 3.10, FastAPI, Uvicorn, Scikit-Learn, Pandas, Joblib.
- **3D Visualization:** BioDigital Human™ Cloud WebGL API.
- **DevOps / Deployment:** Docker, Docker Compose, Portainer, CasaOS, Tailscale.

---

## 🐳 Menjalankan dengan Docker Compose

Untuk menjalankan seluruh sistem (Database, ML Service, Backend, dan Frontend) secara instan:

```bash
docker compose up -d --build
```

Akses layanan di browser:
- **Frontend App:** `http://localhost:5173`
- **Backend API:** `http://localhost:8000`
- **FastAPI Docs:** `http://localhost:8001/docs`

---

## 💻 Menjalankan Secara Lokal (Manual)

### 1. Backend (Laravel)
```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve
```

### 2. ML Engine (FastAPI)
```bash
cd ml-service
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --port 8001 --reload
```

### 3. Frontend (React)
```bash
cd frontend
npm install
npm run dev
```
