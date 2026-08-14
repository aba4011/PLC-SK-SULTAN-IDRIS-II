# PLC One Page Report (OPR) Generator
**SK Sultan Idris II, Kuala Kangsar, Perak**

Aplikasi web rasmi untuk menjana One Page Report (OPR) Professional Learning Community (PLC) secara automatik dalam format A4 rasmi.

---

## Architecture Overview
* **Frontend:** Static Web Application (HTML5, CSS3, Vanilla JS) hosted on **GitHub Pages**.
* **Backend Engine:** **Google Apps Script (GAS) Web App API**.
* **Database:** **Google Sheets**.
* **File Storage:** **Google Drive**.

---

## Panduan Panduan Deployment & Persediaan

### Step 1: Sediakan Google Sheet Database
1. Buka [Google Sheets](https://sheets.google.com) dan cipta spreadsheet baharu bernama: `PLC_OPR_DATABASE_SKSI2`.
2. Hasilkan Sheet 1: Namakan semula sebagai **`SENARAI_GURU`**.
   * Header Row (Baris 1): `Bil` | `Nama Guru` | `Status`
   * Masukkan nama guru sekolah (Pastikan Status = `Aktif`).
3. Hasilkan Sheet 2: Namakan semula sebagai **`PLC_OPR_DATABASE`**.
   * Header Row (Baris 1): `OPR ID` | `Timestamp` | `Strategi PLC` | `Tajuk / Fokus` | `Tarikh` | `Masa Mula` | `Masa Tamat` | `Tempat` | `Nama Kumpulan` | `Ketua Kumpulan` | `Ahli Kumpulan` | `Disediakan Oleh` | `Isu / Masalah` | `Objektif` | `Pelaksanaan` | `Impak` | `Susulan` | `Image 1 URL` | `Image 2 URL` | `Image 3 URL` | `PDF URL`
4. Salin **Spreadsheet ID** daripada URL (Rentetan alphanumerik di antara `/d/` dan `/edit`).

### Step 2: Sediakan Google Drive Storage
1. Buka [Google Drive](https://drive.google.com) dan cipta satu folder baharu bernama: **`PLC OPR SKSI2`**.
2. Salin **Folder ID** daripada URL.

### Step 3: Deploy Google Apps Script Engine
1. Dalam Google Sheet anda, klik **Extensions > Apps Script**.
2. Padamkan semua kod sedia ada, dan tampalkan keseluruhan kod daripada fail **`Code.gs`**.
3. Kemaskan pembolehubah `CONFIG` di bahagian atas kod:
   ```javascript
   const CONFIG = {
     GOOGLE_DRIVE_FOLDER_ID: "TAMPAL_FOLDER_ID_DRIVE_ANDA_DI_SINI",
     GOOGLE_SHEET_ID: "TAMPAL_SHEET_ID_ANDA_DI_SINI",
     SHEET_DATABASE: "PLC_OPR_DATABASE",
     SHEET_TEACHERS: "SENARAI_GURU"
   };