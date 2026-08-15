// APPS SCRIPT URL SAMA SEPERTI DISEDIAKAN UNTUK NAMA GURU & SAVING
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwWq18_4jWa8GdVTVuWUl-DfyiaE5TCJtnbaCAmAEZF8qp6SCWWugRk2VkYZSP0qLlp1w/exec";

document.addEventListener('DOMContentLoaded', () => {
  loadTeacherNames();
  setupDynamicAhli();
  setupImageHandlers();
  setupFormSubmit();
  setupPrintHandler();
});

// 1. Dapatkan Senarai Nama Guru Dari Apps Script Google Sheet
function loadTeacherNames() {
  fetch(`${SCRIPT_URL}?action=getTeachers`)
    .then(res => res.json())
    .then(res => {
      if (res.status === 'success' && Array.isArray(res.data)) {
        populateTeacherDropdowns(res.data);
      }
    })
    .catch(err => console.error("Ralat muat nama guru:", err));
}

function populateTeacherDropdowns(teachers) {
  window.teacherList = teachers;
  const dropdowns = document.querySelectorAll('.teacher-dropdown');
  dropdowns.forEach(select => {
    const currentVal = select.value;
    select.innerHTML = '<option value="">-- Pilih Nama Guru --</option>';
    teachers.forEach(name => {
      const opt = document.createElement('option');
      opt.value = name;
      opt.textContent = name;
      select.appendChild(opt);
    });
    if (currentVal) select.value = currentVal;
  });
}

// 2. Tambah / Padam Ahli Kumpulan
function setupDynamicAhli() {
  const btnAdd = document.getElementById('btnAddAhli');
  const container = document.getElementById('ahliContainer');

  if (btnAdd && container) {
    btnAdd.addEventListener('click', () => {
      const currentCount = container.querySelectorAll('.input-with-btn').length + 1;
      const div = document.createElement('div');
      div.className = 'input-with-btn';
      div.style.marginTop = '5px';
      
      let optionsHtml = '<option value="">-- Pilih Ahli --</option>';
      if (window.teacherList) {
        window.teacherList.forEach(t => optionsHtml += `<option value="${t}">${t}</option>`);
      }

      div.innerHTML = `
        <select class="ahli-input teacher-dropdown" name="ahliKumpulan[]">${optionsHtml}</select>
        <button type="button" class="btn-remove" style="background:#d32f2f; color:#fff; border:none; padding:4px 8px; border-radius:4px; margin-left:4px; cursor:pointer;">X</button>
      `;
      container.appendChild(div);

      div.querySelector('.btn-remove').addEventListener('click', () => div.remove());
    });
  }
}

// 3. Muat Naik Gambar ke Frame Preview
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

// 4. Submit & Kemaskini Preview & Hantar ke Google Drive
function setupFormSubmit() {
  const form = document.getElementById('oprForm');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

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

      let tarikhFormatted = tarikh;
      if (tarikh) {
        const p = tarikh.split('-');
        if (p.length === 3) tarikhFormatted = `${p[2]}/${p[1]}/${p[0]}`;
      }

      const formatTime = (t) => {
        if (!t) return '';
        const [h, m] = t.split(':');
        let hours = parseInt(h, 10);
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12 || 12;
        return `${hours}:${m} ${ampm}`;
      };

      const masaStr = (masaMula && masaTamat) ? `${formatTime(masaMula)} - ${formatTime(masaTamat)}` : '-';

      // Update Live Canvas Preview
      if (document.getElementById('pvStrategiText')) document.getElementById('pvStrategiText').textContent = strategi;
      if (document.getElementById('pvTajuk')) document.getElementById('pvTajuk').textContent = tajuk;
      if (document.getElementById('pvTarikhMasa')) document.getElementById('pvTarikhMasa').textContent = tarikhFormatted;
      if (document.getElementById('pvTempat')) document.getElementById('pvTempat').textContent = tempat;
      if (document.getElementById('pvMasa')) document.getElementById('pvMasa').textContent = masaStr;
      if (document.getElementById('pvKumpulan')) document.getElementById('pvKumpulan').textContent = kumpulan;
      if (document.getElementById('pvKetua')) document.getElementById('pvKetua').textContent = ketua;
      if (document.getElementById('pvDisediakan')) document.getElementById('pvDisediakan').textContent = disediakan;

      // Ahli
      const ahliSelects = document.querySelectorAll('#ahliContainer select');
      const pvAhliList = document.getElementById('pvAhliList');
      let membersArr = [];
      if (pvAhliList) {
        pvAhliList.innerHTML = '';
        let count = 0;
        ahliSelects.forEach((sel) => {
          if (sel.value.trim() !== '') {
            count++;
            membersArr.push(sel.value.trim());
            const li = document.createElement('li');
            li.textContent = `${count}. ${sel.value.trim()}`;
            pvAhliList.appendChild(li);
          }
        });
      }

      if (document.getElementById('pvIsu')) document.getElementById('pvIsu').textContent = isu;
      if (document.getElementById('pvObjektif')) document.getElementById('pvObjektif').textContent = objektif;
      if (document.getElementById('pvPelaksanaan')) document.getElementById('pvPelaksanaan').textContent = pelaksanaan;
      if (document.getElementById('pvTindakan')) document.getElementById('pvTindakan').textContent = tindakan;
      if (document.getElementById('pvImpak')) document.getElementById('pvImpak').textContent = impak;

      // POST Data ke Apps Script (Hantar ke Drive & Google Sheet)
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

      fetch(SCRIPT_URL, {
        method: "POST",
        body: JSON.stringify(payload)
      })
      .then(r => r.json())
      .then(res => {
        if(res.status === 'success') {
          alert('✅ OPR Berjaya Dijana & Dihantar ke Google Drive!');
        } else {
          alert('⚠️ OPR Dikemaskini pada preview! (Nota Drive: ' + res.message + ')');
        }
      })
      .catch(err => {
        alert('✅ OPR Dijana pada Preview!');
      });
    });
  }
}

// 5. PDF Export Handler
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
