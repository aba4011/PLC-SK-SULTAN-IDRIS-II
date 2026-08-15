// ==========================================
// KONFIGURASI URL APPS SCRIPT & GOOGLE DRIVE
// ==========================================
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwgwoR2S_y_Pf6SXFsYgnteYZNuYhUYUoqcp-UrNZHfVjOTxYcsrlq9zGuMXtcanUOjyw/exec";
const DRIVE_FOLDER_URL = "https://drive.google.com/drive/folders/1E9K6VqHlyjTA_WcGdk_gT73tSZKoOzfb";

// Simpan senarai nama guru secara global
window.teacherList = [];

document.addEventListener('DOMContentLoaded', () => {
  loadTeacherNames();
  setupDynamicAhli();
  setupImageHandlers();
  setupFormSubmit();
  setupPrintHandler();
  setupDriveButton();
});

// ==========================================
// 1. MUAT SENARAI NAMA GURU DARI APPS SCRIPT
// ==========================================
function loadTeacherNames() {
  fetch(`${SCRIPT_URL}?action=getTeachers`, {
    method: 'GET',
    redirect: 'follow'
  })
    .then(res => {
      if (!res.ok) throw new Error("Respons rangkaian tidak OK");
      return res.json();
    })
    .then(res => {
      console.log("Data guru berjaya diterima:", res);
      if (res.status === 'success' && Array.isArray(res.data) && res.data.length > 0) {
        window.teacherList = res.data;
        populateTeacherDropdowns(res.data);
      } else {
        console.warn("Senarai guru kosong dari Apps Script. Membuka fallback manual.");
        enableManualInputFallback();
      }
    })
    .catch(err => {
      console.error("Ralat muat nama guru:", err);
      enableManualInputFallback();
    });
}

// Masukkan senarai nama ke dalam <select class="teacher-dropdown">
function populateTeacherDropdowns(teachers) {
  const dropdowns = document.querySelectorAll('.teacher-dropdown');
  dropdowns.forEach(select => {
    const currentVal = select.value;
    
    // Tentukan label default mengikut konteks
    let defaultLabel = "-- Pilih Nama Guru --";
    if (select.id === "ketuaKumpulan") defaultLabel = "-- Pilih Ketua Kumpulan --";
    if (select.id === "disediakanOleh") defaultLabel = "-- Pilih Penyedia Laporan --";
    if (select.classList.contains("ahli-input")) defaultLabel = "-- Pilih Ahli --";

    select.innerHTML = `<option value="">${defaultLabel}</option>`;
    
    teachers.forEach(name => {
      const opt = document.createElement('option');
      opt.value = name;
      opt.textContent = name;
      select.appendChild(opt);
    });

    if (currentVal) select.value = currentVal;
  });
}

// PERTAHANAN KECEMASAN: Jika Google Sheet gagal/tersekat, tukar dropdown jadi input teks biasa
function enableManualInputFallback() {
  const dropdowns = document.querySelectorAll('.teacher-dropdown');
  dropdowns.forEach(select => {
    const input = document.createElement('input');
    input.type = 'text';
    input.id = select.id;
    input.name = select.name;
    input.className = select.className;
    input.required = select.required;
    input.placeholder = "Taip nama di sini (Mod Manual)...";
    
    select.parentNode.replaceChild(input, select);
  });
}

// ==========================================
// 2. DINAMIK TAMBAH / PADAM AHLI KUMPULAN
// ==========================================
function setupDynamicAhli() {
  const btnAdd = document.getElementById('btnAddAhli');
  const container = document.getElementById('ahliContainer');

  if (btnAdd && container) {
    btnAdd.addEventListener('click', () => {
      const div = document.createElement('div');
      div.className = 'input-with-btn';
      div.style.marginTop = '6px';
      
      // Jika senarai guru wujud, guna dropdown. Jika gagal, guna input biasa.
      if (window.teacherList && window.teacherList.length > 0) {
        let optionsHtml = '<option value="">-- Pilih Ahli --</option>';
        window.teacherList.forEach(t => optionsHtml += `<option value="${t}">${t}</option>`);

        div.innerHTML = `
          <select class="ahli-input teacher-dropdown" name="ahliKumpulan[]" required>${optionsHtml}</select>
          <button type="button" class="btn-remove" style="background:#d32f2f; color:#fff; border:none; padding:6px 10px; border-radius:5px; margin-left:6px; cursor:pointer; font-weight:bold;">✕</button>
        `;
      } else {
        div.innerHTML = `
          <input type="text" class="ahli-input" name="ahliKumpulan[]" placeholder="Taip nama ahli..." required>
          <button type="button" class="btn-remove" style="background:#d32f2f; color:#fff; border:none; padding:6px 10px; border-radius:5px; margin-left:6px; cursor:pointer; font-weight:bold;">✕</button>
        `;
      }

      container.appendChild(div);

      // Butang buang baris ahli
      div.querySelector('.btn-remove').addEventListener('click', () => div.remove());
    });
  }
}

// ==========================================
// 3. PRATONTON GAMBAR LIVE KE PHOTO GRID
// ==========================================
function setupImageHandlers() {
  for (let i = 1; i <= 4; i++) {
    const input = document.getElementById(`imgInput${i}`);
    if (input) {
      input.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (evt) => {
            const slot = document.getElementById(`slot${i}`);
            if (slot) {
              slot.innerHTML = `<img src="${evt.target.result}" style="width:100%; height:100%; object-fit:cover;">`;
            }
          };
          reader.readAsDataURL(file);
        }
      });
    }
  }
}

// ==========================================
// 4. GENERATE OPR & HANTAR DATA KE APPS SCRIPT
// ==========================================
function setupFormSubmit() {
  const form = document.getElementById('oprForm');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      // Ambil nilai borang
      const strategi = document.getElementById('strategiPlc').value;
      const tajuk = document.getElementById('tajukPlc').value;
      const tarikh = document.getElementById('tarikhPlc').value;
      const tempat = document.getElementById('tempatPlc').value;
      const masaMula = document.getElementById('masaMula').value;
      const masaTamat = document.getElementById('masaTamat').value;
      const kumpulan = document.getElementById('namaKumpulan').value;
      const ketua = document.getElementById('ketuaKumpulan').value;
      const disediakan = document.getElementById('disediakanOleh').value;

      const isu = document.getElementById('isuMasalah').value;
      const objektif = document.getElementById('objektifProgram').value;
      const pelaksanaan = document.getElementById('pelaksanaanAktiviti').value;
      const tindakan = document.getElementById('tindakanSusulan').value;
      const impak = document.getElementById('impakProgram').value;

      // Format Tarikh ke DD/MM/YYYY
      let tarikhFormatted = tarikh;
      if (tarikh) {
        const p = tarikh.split('-');
        if (p.length === 3) tarikhFormatted = `${p[2]}/${p[1]}/${p[0]}`;
      }

      // Format Masa AM/PM
      const formatTime = (t) => {
        if (!t) return '';
        const [h, m] = t.split(':');
        let hours = parseInt(h, 10);
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12 || 12;
        return `${hours}:${m} ${ampm}`;
      };

      const masaStr = (masaMula && masaTamat) ? `${formatTime(masaMula)} - ${formatTime(masaTamat)}` : '-';

      // Kemaskini Teks Pratonton Kanvas (Right Panel)
      if (document.getElementById('pvStrategiText')) document.getElementById('pvStrategiText').textContent = strategi;
      if (document.getElementById('pvTajuk')) document.getElementById('pvTajuk').textContent = tajuk;
      if (document.getElementById('pvTarikhMasa')) document.getElementById('pvTarikhMasa').textContent = tarikhFormatted;
      if (document.getElementById('pvTempat')) document.getElementById('pvTempat').textContent = tempat;
      if (document.getElementById('pvMasa')) document.getElementById('pvMasa').textContent = masaStr;
      if (document.getElementById('pvKumpulan')) document.getElementById('pvKumpulan').textContent = kumpulan;
      if (document.getElementById('pvKetua')) document.getElementById('pvKetua').textContent = ketua;
      if (document.getElementById('pvDisediakan')) document.getElementById('pvDisediakan').textContent = disediakan;

      // Kemaskini Senarai Ahli Kumpulan pada Canvas
      const ahliElements = document.querySelectorAll('#ahliContainer .ahli-input');
      const pvAhliList = document.getElementById('pvAhliList');
      let membersArr = [];

      if (pvAhliList) {
        pvAhliList.innerHTML = '';
        let count = 0;
        ahliElements.forEach((el) => {
          const val = el.value.trim();
          if (val !== '') {
            count++;
            membersArr.push(val);
            const li = document.createElement('li');
            li.textContent = `${count}. ${val}`;
            pvAhliList.appendChild(li);
          }
        });
      }

      if (document.getElementById('pvIsu')) document.getElementById('pvIsu').textContent = isu;
      if (document.getElementById('pvObjektif')) document.getElementById('pvObjektif').textContent = objektif;
      if (document.getElementById('pvPelaksanaan')) document.getElementById('pvPelaksanaan').textContent = pelaksanaan;
      if (document.getElementById('pvTindakan')) document.getElementById('pvTindakan').textContent = tindakan;
      if (document.getElementById('pvImpak')) document.getElementById('pvImpak').textContent = impak;

      // Sediakan payload untuk Google Sheet
      const payload = {
        action: "saveOPR",
        data: {
          plcStrategy: strategi,
          plcFocus: tajuk,
          plcDate: tarikhFormatted,
          startTime: formatTime(masaMula),
          endTime: formatTime(masaTamat),
          plcLocation: tempat,
          groupName: kumpulan,
          groupLeader: ketua,
          preparedBy: disediakan,
          members: membersArr,
          plcIssue: isu,
          plcObjective: objektif,
          plcImplementation: pelaksanaan,
          plcImpact: impak,
          plcFollowup: tindakan
        }
      };

      const btnSubmit = document.getElementById('btnSubmit');
      btnSubmit.textContent = "MENYIMPAN DATA...";
      btnSubmit.disabled = true;

      fetch(SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify(payload)
      })
      .then(r => r.json())
      .then(res => {
        btnSubmit.textContent = "GENERATE OPR & SIMPAN";
        btnSubmit.disabled = false;
        if (res.status === 'success') {
          alert('✅ OPR Berjaya Dijana & Dihantar ke Rekod Google Sheet!');
        } else {
          alert('✅ OPR Berjaya Dijana pada Pratonton!');
        }
      })
      .catch(err => {
        btnSubmit.textContent = "GENERATE OPR & SIMPAN";
        btnSubmit.disabled = false;
        alert('✅ OPR Berjaya Dijana pada Pratonton Canvas!');
      });
    });
  }
}

// ==========================================
// 5. CETAK KERTAS OPR KE PDF
// ==========================================
function setupPrintHandler() {
  const btnPrint = document.getElementById('btnPrint');
  if (btnPrint) {
    btnPrint.addEventListener('click', () => {
      const element = document.getElementById('oprPaper');
      const opt = {
        margin: 0,
        filename: 'Laporan_OPR_PLC.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
      };
      html2pdf().set(opt).from(element).save();
    });
  }
}

// ==========================================
// 6. PAUTAN KE GOOGLE DRIVE FOLDER
// ==========================================
function setupDriveButton() {
  const btnDrive = document.getElementById('btnDrive');
  if (btnDrive) {
    btnDrive.addEventListener('click', () => {
      window.open(DRIVE_FOLDER_URL, '_blank');
    });
  }
}
