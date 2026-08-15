let teacherList = [];
let uploadedImages = [null, null, null, null];
let imageFitModes = ['cover', 'cover', 'cover', 'cover'];

document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

function initApp() {
  fetchTeachers();
  setupEventListeners();
  loadDraft();
}

// 1. Ambil Senarai Guru dari Google Apps Script (Single Source of Truth)
async function fetchTeachers() {
  const ketuaInput = document.getElementById('ketuaKumpulan');
  const disediakanInput = document.getElementById('disediakanOleh');
  const btnAddAhli = document.getElementById('btnAddAhli');

  try {
    if(!CONFIG.APPS_SCRIPT_URL) {
      setTeacherInputsState("Sila setkan CONFIG.APPS_SCRIPT_URL", true);
      return;
    }

    setTeacherInputsState("Memuatkan senarai guru...", true);

    const res = await fetch(`${CONFIG.APPS_SCRIPT_URL}?action=getTeachers`);
    const data = await res.json();

    if(data.success && data.teachers && data.teachers.length > 0) {
      teacherList = data.teachers;
      populateDatalist();
      
      setTeacherInputsState("🔍 Cari / Pilih nama guru...", false);
      btnAddAhli.disabled = false;
    } else {
      setTeacherInputsState("Tidak dapat memuatkan senarai nama guru. Sila cuba Refresh.", true);
    }
  } catch (e) {
    console.error("Gagal mengambil nama guru:", e);
    setTeacherInputsState("Tidak dapat memuatkan senarai nama guru. Sila cuba Refresh.", true);
  }
}

function setTeacherInputsState(placeholderText, isDisabled) {
  const inputs = document.querySelectorAll('.teacher-input');
  inputs.forEach(input => {
    input.placeholder = placeholderText;
    input.disabled = isDisabled;
  });
}

function populateDatalist() {
  const datalist = document.getElementById('teachersDatalist');
  datalist.innerHTML = '';
  teacherList.forEach(name => {
    const opt = document.createElement('option');
    opt.value = name;
    datalist.appendChild(opt);
  });
}

// 2. Dynamic Dropdown & Handling Duplikasi Nama (Ketua vs Ahli)
function setupEventListeners() {
  const inputs = document.querySelectorAll('#oprForm input, #oprForm select, #oprForm textarea');
  inputs.forEach(input => {
    input.addEventListener('input', () => {
      validateDuplicates();
      updatePreview();
      saveDraft();
    });
  });

  document.getElementById('btnAddAhli').addEventListener('click', addAhliRow);
  document.getElementById('oprForm').addEventListener('submit', handleFormSubmit);
  document.getElementById('btnReset').addEventListener('click', clearDraft);

  for(let i = 1; i <= 4; i++) {
    document.getElementById(`imgInput${i}`).addEventListener('change', (e) => handleImageUpload(e, i));
  }
}

function addAhliRow() {
  const container = document.getElementById('ahliContainer');
  const currentCount = container.children.length;
  if(currentCount >= 30) return alert("Maksimum 30 orang ahli sahaja.");

  const row = document.createElement('div');
  row.className = 'ahli-row';
  row.innerHTML = `
    <div class="ahli-input-group">
      <input type="text" list="teachersDatalist" class="teacher-input ahli-input" placeholder="🔍 Cari nama ahli..." autocomplete="off" oninput="validateDuplicates(); updatePreview(); saveDraft();">
      <button type="button" class="btn-danger btn-xs" onclick="removeAhliRow(this)">X</button>
    </div>
    <small class="error-msg ahli-error"></small>
  `;
  container.appendChild(row);
  validateDuplicates();
}

function removeAhliRow(btn) {
  btn.closest('.ahli-row').remove();
  validateDuplicates();
  updatePreview();
  saveDraft();
}

// Semak duplikasi antara Ketua dan Ahli sahaja. "Disediakan Oleh" DIKECUALIKAN!
function validateDuplicates() {
  const ketuaVal = document.getElementById('ketuaKumpulan').value.trim();
  const ketuaError = document.getElementById('ketuaError');
  const ahliRows = document.querySelectorAll('.ahli-row');
  
  ketuaError.innerText = '';
  let selectedNames = [];

  if (ketuaVal) {
    selectedNames.push({ name: ketuaVal, type: 'ketua' });
  }

  ahliRows.forEach(row => {
    const input = row.querySelector('.ahli-input');
    const errorEl = row.querySelector('.ahli-error');
    const val = input.value.trim();
    errorEl.innerText = '';

    if (val !== '') {
      if (val === ketuaVal) {
        errorEl.innerText = '❌ Nama ini telah dipilih sebagai Ketua Kumpulan.';
      } else if (selectedNames.some(item => item.name === val)) {
        errorEl.innerText = '❌ Nama ini telah dipilih untuk Ahli Kumpulan lain.';
      } else {
        selectedNames.push({ name: val, type: 'ahli' });
      }
    }
  });
}

// 3. Image Processing & Compression
function handleImageUpload(event, slotIndex) {
  const file = event.target.files[0];
  if(!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    const img = new Image();
    img.src = e.target.result;
    img.onload = function() {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      
      const maxDim = 1200;
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height *= maxDim / width;
          width = maxDim;
        } else {
          width *= maxDim / height;
          height = maxDim;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      const compressedBase64 = canvas.toDataURL('image/jpeg', 0.75);
      uploadedImages[slotIndex - 1] = compressedBase64;
      
      document.getElementById(`controls${slotIndex}`).classList.remove('hidden');
      updatePreviewPhotos();
      saveDraft();
    }
  }
  reader.readAsDataURL(file);
}

function toggleFit(slotIndex) {
  const currentMode = imageFitModes[slotIndex - 1];
  imageFitModes[slotIndex - 1] = (currentMode === 'cover') ? 'contain' : 'cover';
  updatePreviewPhotos();
}

function removeImage(slotIndex) {
  uploadedImages[slotIndex - 1] = null;
  document.getElementById(`imgInput${slotIndex}`).value = '';
  document.getElementById(`controls${slotIndex}`).classList.add('hidden');
  updatePreviewPhotos();
  saveDraft();
}

function updatePreviewPhotos() {
  for(let i = 1; i <= 4; i++) {
    const slotEl = document.getElementById(`slot${i}`);
    const imgData = uploadedImages[i - 1];
    const fitMode = imageFitModes[i - 1];

    if(imgData) {
      slotEl.innerHTML = `<img src="${imgData}" style="object-fit: ${fitMode};">`;
    } else {
      slotEl.innerHTML = `<span class="ph-label">Gambar ${i}</span>`;
    }
  }
}

// 4. Live Update OPR Canvas & Auto-fit Text
function updatePreview() {
  document.getElementById('pvStrategi').innerText = document.getElementById('strategiPlc').value || '-';
  document.getElementById('pvTajuk').innerText = document.getElementById('tajukPlc').value || 'TAJUK PLC AKAN DIPAPARKAN DI SINI';
  
  const tarikh = document.getElementById('tarikhPlc').value;
  const masaMula = document.getElementById('masaMula').value;
  const masaTamat = document.getElementById('masaTamat').value;
  
  let formattedDate = tarikh ? formatDateMY(tarikh) : '';
  let timeStr = (masaMula && masaTamat) ? `${masaMula} - ${masaTamat}` : '';
  document.getElementById('pvTarikhMasa').innerText = `${formattedDate} ${timeStr ? ' / ' + timeStr : ''}`;

  document.getElementById('pvTempat').innerText = document.getElementById('tempatPlc').value || '-';
  document.getElementById('pvKumpulan').innerText = document.getElementById('namaKumpulan').value || '-';
  document.getElementById('pvKetua').innerText = document.getElementById('ketuaKumpulan').value || '-';

  // Render Ahli List
  const ahliInputs = document.querySelectorAll('.ahli-input');
  const ahliListEl = document.getElementById('pvAhliList');
  ahliListEl.innerHTML = '';
  ahliInputs.forEach(inp => {
    if(inp.value.trim()) {
      const li = document.createElement('li');
      li.innerText = inp.value.trim();
      ahliListEl.appendChild(li);
    }
  });

  if(ahliListEl.children.length > 8) {
    ahliListEl.style.fontSize = '7pt';
  } else {
    ahliListEl.style.fontSize = '8pt';
  }

  // Textboxes
  document.getElementById('pvIsu').innerText = document.getElementById('isuMasalah').value;
  document.getElementById('pvObjektif').innerText = document.getElementById('objektifProgram').value;
  document.getElementById('pvPelaksanaan').innerText = document.getElementById('pelaksanaanAktiviti').value;
  document.getElementById('pvImpak').innerText = document.getElementById('impakProgram').value;
  document.getElementById('pvTindakan').innerText = document.getElementById('tindakanSusulan').value;
  
  // Disediakan Oleh Output Rendering
  const disediakanVal = document.getElementById('disediakanOleh').value.trim();
  document.getElementById('pvDisediakan').innerText = disediakanVal ? disediakanVal : '............................................................';

  autoFitText();
}

function autoFitText() {
  const boxes = document.querySelectorAll('.box-content');
  boxes.forEach(box => {
    let fontSize = 8;
    box.style.fontSize = fontSize + 'pt';
    while (box.scrollHeight > box.clientHeight && fontSize > 6) {
      fontSize -= 0.5;
      box.style.fontSize = fontSize + 'pt';
    }
  });
}

function formatDateMY(dateStr) {
  const d = new Date(dateStr);
  const months = ["Januari", "Februari", "Mac", "April", "Mei", "Jun", "Julai", "Ogos", "September", "Oktober", "November", "Disember"];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

// 5. Submit Form & Penjanaan PDF ke Google Apps Script (BERJAYA DIBAIKI)
async function handleFormSubmit(e) {
  e.preventDefault();

  const errors = document.querySelectorAll('.error-msg');
  let hasError = false;
  errors.forEach(err => { if(err.innerText !== '') hasError = true; });

  if(hasError) {
    alert("Sila betulkan nama guru yang bertindih sebelum menyimpan!");
    return;
  }
  
  if(!CONFIG.APPS_SCRIPT_URL) {
    alert("Sila tetapkan APPS_SCRIPT_URL dalam config.js!");
    return;
  }

  showLoading("MENJANA FAIL PDF OPR & MENYIMPAN...");

  const element = document.getElementById('oprPreviewCanvas');
  const opt = {
    margin:       0,
    filename:     'OPR_PLC.pdf',
    image:        { type: 'jpeg', quality: 0.98 },
    html2canvas:  { scale: 2, useCORS: true, allowTaint: true },
    jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
  };

  try {
    // 1. Tukar Paparan HTML Canvas kepada PDF String (Base64)
    const pdfBase64 = await html2pdf().set(opt).from(element).outputPdf('datauristring');

    const ahliArray = Array.from(document.querySelectorAll('.ahli-input')).map(input => input.value.trim()).filter(v => v !== '');

    // 2. Sediakan data payload beserta pdfBase64
    const payload = {
      strategi: document.getElementById('strategiPlc').value,
      tajuk: document.getElementById('tajukPlc').value,
      tarikh: document.getElementById('tarikhPlc').value,
      masaMula: document.getElementById('masaMula').value,
      masaTamat: document.getElementById('masaTamat').value,
      tempat: document.getElementById('tempatPlc').value,
      kumpulan: document.getElementById('namaKumpulan').value,
      ketua: document.getElementById('ketuaKumpulan').value.trim(),
      ahli: ahliArray,
      disediakan: document.getElementById('disediakanOleh').value.trim(),
      isu: document.getElementById('isuMasalah').value,
      objektif: document.getElementById('objektifProgram').value,
      pelaksanaan: document.getElementById('pelaksanaanAktiviti').value,
      impak: document.getElementById('impakProgram').value,
      tindakan: document.getElementById('tindakanSusulan').value,
      images: uploadedImages,
      pdfBase64: pdfBase64 // PERUBAHAN UTAMA: Hantar fail PDF ke Google Apps Script
    };

    // 3. Hantar data ke Google Apps Script
    const response = await fetch(CONFIG.APPS_SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    
    const result = await response.json();
    hideLoading();

    if(result.status === 'success') {
      alert(`Berjaya! OPR PDF telah disimpan ke Google Drive.\nID Rekod: ${result.oprId}`);
      clearDraft();
    } else {
      alert("Gagal menyimpan: " + result.message);
    }
  } catch (error) {
    hideLoading();
    alert("Ralat Rangkaian / Penjanaan PDF: " + error.message);
  }
}

// 6. Local Draft Storage
function saveDraft() {
  const ahliArray = Array.from(document.querySelectorAll('.ahli-input')).map(i => i.value);
  const draftObj = {
    strategi: document.getElementById('strategiPlc').value,
    tajuk: document.getElementById('tajukPlc').value,
    tarikh: document.getElementById('tarikhPlc').value,
    masaMula: document.getElementById('masaMula').value,
    masaTamat: document.getElementById('masaTamat').value,
    tempat: document.getElementById('tempatPlc').value,
    kumpulan: document.getElementById('namaKumpulan').value,
    ketua: document.getElementById('ketuaKumpulan').value,
    ahli: ahliArray,
    disediakan: document.getElementById('disediakanOleh').value,
    isu: document.getElementById('isuMasalah').value,
    objektif: document.getElementById('objektifProgram').value,
    pelaksanaan: document.getElementById('pelaksanaanAktiviti').value,
    impak: document.getElementById('impakProgram').value,
    tindakan: document.getElementById('tindakanSusulan').value
  };
  localStorage.setItem('OPR_DRAFT', JSON.stringify(draftObj));
}

function loadDraft() {
  const draft = localStorage.getItem('OPR_DRAFT');
  if(!draft) return;
  
  if(confirm("Draf OPR ditemui. Adakah anda mahu sambung mengisi?")) {
    const data = JSON.parse(draft);
    document.getElementById('strategiPlc').value = data.strategi || '';
    document.getElementById('tajukPlc').value = data.tajuk || '';
    document.getElementById('tarikhPlc').value = data.tarikh || '';
    document.getElementById('masaMula').value = data.masaMula || '';
    document.getElementById('masaTamat').value = data.masaTamat || '';
    document.getElementById('tempatPlc').value = data.tempat || '';
    document.getElementById('namaKumpulan').value = data.kumpulan || '';
    document.getElementById('ketuaKumpulan').value = data.ketua || '';
    document.getElementById('disediakanOleh').value = data.disediakan || '';
    document.getElementById('isuMasalah').value = data.isu || '';
    document.getElementById('objektifProgram').value = data.objektif || '';
    document.getElementById('pelaksanaanAktiviti').value = data.pelaksanaan || '';
    document.getElementById('impakProgram').value = data.impak || '';
    document.getElementById('tindakanSusulan').value = data.tindakan || '';

    if(data.ahli && data.ahli.length > 0) {
      data.ahli.forEach(val => {
        addAhliRow();
        const inputs = document.querySelectorAll('.ahli-input');
        inputs[inputs.length - 1].value = val;
      });
    }

    validateDuplicates();
    updatePreview();
  }
}

function clearDraft() {
  localStorage.removeItem('OPR_DRAFT');
  document.getElementById('oprForm').reset();
  document.getElementById('ahliContainer').innerHTML = '';
  uploadedImages = [null, null, null, null];
  updatePreviewPhotos();
  validateDuplicates();
  updatePreview();
}

function showLoading(msg) {
  document.getElementById('loadingText').innerText = msg;
  document.getElementById('loadingOverlay').classList.remove('hidden');
}

function hideLoading() {
  document.getElementById('loadingOverlay').classList.add('hidden');
}
