# ONE PAGE REPORT (PLC) GENERATOR — SK SULTAN IDRIS II

Sistem penjanaan laporan OPR PLC automatik dengan sokongan **Searchable Dropdown Single-Source-of-Truth** berasaskan seni bina Google Workspace API + GitHub Pages.

---

## ⚙️ Panduan Deploy ke GitHub Pages

1. **Persediaan Google Sheet Database**
   - Buka Google Sheet dan cipta tab bernama `SENARAI_GURU`.
   - Pastikan susunan lajur: `Bil` | `Nama Guru` | `Status`.
   - Hanya guru bertanda **`Aktif`** pada lajur `Status` yang akan dihantar ke sistem.

2. **Deploy Google Apps Script Backend**
   - Di Google Sheet, pergi ke **Extensions > Apps Script**.
   - Salin kod `Code.gs` dan tekan **Deploy > New Deployment**.
   - **Type**: Web App | **Execute as**: `Me` | **Who has access**: `Anyone`.
   - Salin URL Web App yang terhasil.

3. **Kemaskini `config.js`**
   - Tampal Web App URL ke dalam pembolehubah `APPS_SCRIPT_URL` pada fail `config.js`.

4. **Aktifkan GitHub Pages**
   - Push kesemua fail di atas ke repositori GitHub anda.
   - Pergi ke **Settings > Pages > Branch (Main)** $\rightarrow$ **Save**.