const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzjFSIQPJhlLQEksbInsnAvokk4RfpU-pOWL6RpJmarXiTeARydlvpfOs5T_ej7WyqH5Q/exec";
const DRIVE_FOLDER_URL = "https://drive.google.com/drive/folders/1E9K6VqHlyjTA_WcGdk_gT73tSZKoOzfb";

window.teacherList = [];

document.addEventListener('DOMContentLoaded', () => {
  loadTeacherNames();
  setupDynamicAhli();
  setupImageHandlers();
  setupFormSubmit();
  setupPrintHandler();
  setupDriveButton();
  setupLivePreview();
  setupDuplicateValidation();
});

// 1. MUAT SENARAI NAMA GURU & SET DATALIST SEARCHABLE
function loadTeacherNames() {
  const inputs = document.querySelectorAll('.teacher-search-input');
  
  // 19. Loading State
  inputs.forEach(input => {
    input.placeholder = "[ Memuatkan senarai guru... ]";
    input.disabled = true;
  });

  fetch(`${SCRIPT_URL}?action=getTeachers`, {
    method: 'GET',
    mode: 'cors',
    redirect: 'follow'
  })
    .then(res => res.json())
    .then(res => {
      // 22. Terima API JSON format (res.teachers atau res.data)
      const list = res.teachers || res.data || [];

      if ((res.success || res.status === 'success') && Array.isArray(list) && list.length > 0) {
        window.teacherList = list;
        populateDatalist(list);

        inputs.forEach(input => {
          input.placeholder = "🔍 Taip / Pilih nama guru...";
          input.disabled = false;
        });
      } else {
        showLoadingError(inputs);
      }
    })
    .catch(err => {
      console.error("Ralat muat nama guru:", err);
      showLoadingError(inputs);
    });
}

function showLoadingError(inputs) {
  inputs.forEach(input => {
    input.placeholder = "Tidak dapat memuatkan senarai nama guru. Sila cuba Refresh.";
    input.disabled = true;
  });
}

// 18. Isi Data ke <datalist> untuk Carian (Searchable Dropdown Native)
function populateDatalist(teachers) {
  const datalist = document.getElementById('teacherListDatalist');
  datalist.innerHTML = '';
  teachers.forEach(name => {
    const opt = document.createElement('option');
    opt.value = name;
    datalist.appendChild(opt);
  });
  updateCanvasPreview();
}

// 20. DUPLICATE VALIDATION (Ketua + Ahli Sahaja)
function setupDuplicateValidation() {
  const form = document.getElementById('oprForm');
  
  form.addEventListener('change', (e) => {
    if (e.target.classList.contains('teacher-search-input') && e.target.id !== 'disediakanOleh') {
      validateNoDuplicates(e.target);
    }
  });
}

function validateNoDuplicates(changedInput) {
  const ketuaVal = document.getElementById('ketuaKumpulan')?.value.trim();
  const ahliInputs = document.querySelectorAll('#ahliContainer .ahli-input');
  
  let selectedNames = [];
  
  if (ketuaVal) selectedNames.push({ role: 'Ketua Kumpulan', name: ketuaVal, el: document.getElementById('ketuaKumpulan') });

  ahliInputs.forEach((el, index) => {
    const val = el.value.trim();
    if (val) {
      selectedNames.push({ role: `Ahli ${index + 1}`, name: val, el: el });
    }
  });

  // Semak jika ada nama bertindih
  const currentValue = changedInput.value.trim();
  if (!currentValue) return;

  const matches = selectedNames.filter(item => item.name.toLowerCase() === currentValue.toLowerCase());

  if (matches.length > 1) {
    const firstMatch = matches.find(item => item.el !== changedInput);
    alert(`❌ Nama "${currentValue}" telah dipilih sebagai ${firstMatch.role}.\nSila pilih nama lain.`);
    changedInput.value = ''; // Kosongkan pilihan yang bertindih
    updateCanvasPreview();
  }
}

// 2. PRATONTON REAL-TIME (LIVE PREVIEW)
function setupLivePreview() {
  const form = document.getElementById('oprForm');
  if (!form) return;

  form.addEventListener('input', updateCanvasPreview);
  form.addEventListener('change', updateCanvasPreview);
}

function updateCanvasPreview() {
  const strategi = document.getElementById('strategiPlc')?.value || 'Curriculum Mapping';
  const tajuk = document.getElementById('tajukPlc')?.value || 'Tajuk PLC';
  const tarikh = document.getElementById('tarikhPlc')?.value || '-';
  const tempat = document.getElementById('tempatPlc')?.value || '-';
  const masaMula = document.getElementById('masaMula')?.value || '';
  const masaTamat = document.getElementById('masaTamat')?.value || '';
  const kumpulan = document.getElementById('namaKumpulan')?.value || '-';
  const ketua = document.getElementById('ketuaKumpulan')?.value || '-';
  
  // 21. OPR Output untuk "Disediakan Oleh"
  const disediakan = document.getElementById('disediakanOleh')?.value || '-';

  const isu = document.getElementById('isuMasalah')?.value || 'Masukkan Isu/masalah.';
  const objektif = document.getElementById('objektifProgram')?.value || 'Masukkan objektif program.';
  const pelaksanaan = document.getElementById('pelaksanaanAktiviti')?.value || 'Masukkan pelaksanaan aktiviti';
  const tindakan = document.getElementById('tindakanSusulan')?.value || 'Masukkan tindakan susulan';
  const impak = document.getElementById('impakProgram')?.value || 'Masukkan Impak';

  let tarikhFormatted = tarikh;
  if (tarikh && tarikh !== '-') {
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

  if (document.getElementById('pvStrategiText')) document.getElementById('pvStrategiText').textContent = strategi;
  if (document.getElementById('pvTajuk')) document.getElementById('pvTajuk').textContent = tajuk;
  if (document.getElementById('pvTarikhMasa')) document.getElementById('pvTarikhMasa').textContent = tarikhFormatted;
  if (document.getElementById('pvTempat')) document.getElementById('pvTempat').textContent = tempat;
  if (document.getElementById('pvMasa')) document.getElementById('pvMasa').textContent = masaStr;
  if (document.getElementById('pvKumpulan')) document.getElementById('pvKumpulan').textContent = kumpulan;
  if (document.getElementById('pvKetua')) document.getElementById('pvKetua').textContent = ketua;
  if (document.getElementById('pvDisediakan')) document.getElementById('pvDisediakan').textContent = disediakan;

  // Kemaskini Senarai Ahli
  const ahliElements = document.querySelectorAll('#ahliContainer .ahli-input');
  const pvAhliList = document.getElementById('pvAhliList');
  if (pvAhliList) {
    pvAhliList.innerHTML = '';
    let count = 0;
    ahliElements.forEach((el) => {
      const val = el.value.trim();
      if (val !== '') {
        count++;
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
}

// 3. TAMBAH AHLI KUMPULAN DINAMIK
function setupDynamicAhli() {
  const btnAdd = document.getElementById('btnAddAhli');
  const container = document.getElementById('ahliContainer');

  if (btnAdd && container) {
    btnAdd.addEventListener('click', () => {
      const div = document.createElement('div');
      div.className = 'input-with-btn';
      div.style.marginTop = '6px';

      const isLoaded = window.teacherList && window.teacherList.length > 0;
      const placeholderText = isLoaded ? "🔍 Taip / Pilih nama guru..." : "[ Memuatkan senarai guru... ]";
      const disabledAttr = isLoaded ? "" : "disabled";

      div.innerHTML = `
        <input type="text" class="ahli-input teacher-search-input" name="ahliKumpulan[]" list="teacherListDatalist" placeholder="${placeholderText}" ${disabledAttr} required>
        <button type="button" class="btn-remove" style="background:#d32f2f; color:#fff; border:none; padding:6px 10px; border-radius:5px; margin-left:6px; cursor:pointer; font-weight:bold;">✕</button>
      `;

      container.appendChild(div);

      div.querySelector('.btn-remove').addEventListener('click', () => {
        div.remove();
        updateCanvasPreview();
      });

      setupLivePreview();
    });
  }
}

// 4. PREVIEW GAMBAR
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

// 5. HANTAR BORANG
function setupFormSubmit() {
  const form = document.getElementById('oprForm');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      updateCanvasPreview();

      const payload = {
        action: "saveOPR",
        data: {
          plcStrategy: document.getElementById('strategiPlc').value,
          plcFocus: document.getElementById('tajukPlc').value,
          plcDate: document.getElementById('tarikhPlc').value,
          startTime: document.getElementById('masaMula').value,
          endTime: document.getElementById('masaTamat').value,
          plcLocation: document.getElementById('tempatPlc').value,
          groupName: document.getElementById('namaKumpulan').value,
          groupLeader: document.getElementById('ketuaKumpulan').value,
          preparedBy: document.getElementById('disediakanOleh').value,
          members: Array.from(document.querySelectorAll('#ahliContainer .ahli-input')).map(el => el.value.trim()).filter(Boolean),
          plcIssue: document.getElementById('isuMasalah').value,
          plcObjective: document.getElementById('objektifProgram').value,
          plcImplementation: document.getElementById('pelaksanaanAktiviti').value,
          plcImpact: document.getElementById('impakProgram').value,
          plcFollowup: document.getElementById('tindakanSusulan').value
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
        alert('✅ OPR Berjaya Dijana & Dihantar!');
      })
      .catch(err => {
        btnSubmit.textContent = "GENERATE OPR & SIMPAN";
        btnSubmit.disabled = false;
        alert('✅ OPR Berjaya Dijana pada Pratonton Canvas!');
      });
    });
  }
}

// 6. CETAK PDF & GOOGLE DRIVE
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

function setupDriveButton() {
  const btnDrive = document.getElementById('btnDrive');
  if (btnDrive) {
    btnDrive.addEventListener('click', () => {
      window.open(DRIVE_FOLDER_URL, '_blank');
    });
  }
}
