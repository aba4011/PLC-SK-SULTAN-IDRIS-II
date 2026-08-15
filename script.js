// ==========================================
// PLC OPR GENERATOR - KOD FUNGSI ASAL
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
  setupDynamicAhli();
  setupImageUploads();
  setupFormSubmit();
  setupPrintHandler();
});

// 1. TAMBAH / PADAM AHLI KUMPULAN
function setupDynamicAhli() {
  const btnAdd = document.getElementById('btnAddAhli');
  const container = document.getElementById('ahliContainer');

  if (btnAdd && container) {
    btnAdd.addEventListener('click', () => {
      const currentCount = container.querySelectorAll('.input-with-btn').length + 1;
      const div = document.createElement('div');
      div.className = 'input-with-btn';
      div.innerHTML = `
        <input type="text" class="ahli-input" name="ahliKumpulan[]" placeholder="Nama Ahli ${currentCount}">
        <button type="button" class="btn-remove">X</button>
      `;
      container.appendChild(div);

      // Event listener butang padan (X)
      div.querySelector('.btn-remove').addEventListener('click', () => {
        div.remove();
      });
    });
  }
}

// 2. HANLE MUAT NAIK GAMBAR
function setupImageUploads() {
  for (let i = 1; i <= 4; i++) {
    const input = document.getElementById(`imgInput${i}`);
    if (input) {
      input.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const slot = document.getElementById(`slot${i}`);
            if (slot) {
              slot.innerHTML = `<img src="${event.target.result}" style="width:100%; height:100%; object-fit:cover; border-radius:6px;">`;
            }
          };
          reader.readAsDataURL(file);
        }
      });
    }
  }
}

// 3. SEBAIK SAHAJA BUTANG "GENERATE OPR & SIMPAN" DITEKAN
function setupFormSubmit() {
  const form = document.getElementById('oprForm');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      // Ambil Nilai Borang
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

      // Format Tarikh (DD/MM/YYYY)
      let tarikhFormatted = tarikh;
      if (tarikh) {
        const parts = tarikh.split('-');
        if (parts.length === 3) tarikhFormatted = `${parts[2]}/${parts[1]}/${parts[0]}`;
      }

      // Format Masa (12 Jam AM/PM)
      const formatTime12 = (timeStr) => {
        if (!timeStr) return '';
        const [h, m] = timeStr.split(':');
        let hours = parseInt(h, 10);
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12 || 12;
        return `${hours}:${m} ${ampm}`;
      };

      const masaFormatted = `${formatTime12(masaMula)} - ${formatTime12(masaTamat)}`;

      // Kemaskini Element Preview
      if (document.getElementById('pvTajuk')) document.getElementById('pvTajuk').textContent = tajuk.toUpperCase();
      if (document.getElementById('pvTarikhMasa')) document.getElementById('pvTarikhMasa').textContent = `${tarikhFormatted} (${masaFormatted})`;
      if (document.getElementById('pvTempat')) document.getElementById('pvTempat').textContent = tempat;
      if (document.getElementById('pvKumpulan')) document.getElementById('pvKumpulan').textContent = kumpulan;
      if (document.getElementById('pvKetua')) document.getElementById('pvKetua').textContent = ketua;
      if (document.getElementById('pvDisediakan')) document.getElementById('pvDisediakan').textContent = disediakan;

      // Senarai Ahli
      const ahliInputs = document.querySelectorAll('#ahliContainer input');
      const pvAhliList = document.getElementById('pvAhliList');
      if (pvAhliList) {
        pvAhliList.innerHTML = '';
        let count = 0;
        ahliInputs.forEach((inp) => {
          if (inp.value.trim() !== '') {
            count++;
            const li = document.createElement('li');
            li.textContent = `${count}. ${inp.value.trim()}`;
            pvAhliList.appendChild(li);
          }
        });
      }

      // Kotak Kandungan Laporan
      if (document.getElementById('pvIsu')) document.getElementById('pvIsu').textContent = isu;
      if (document.getElementById('pvObjektif')) document.getElementById('pvObjektif').textContent = objektif;
      if (document.getElementById('pvPelaksanaan')) document.getElementById('pvPelaksanaan').textContent = pelaksanaan;
      if (document.getElementById('pvTindakan')) document.getElementById('pvTindakan').textContent = tindakan;
      if (document.getElementById('pvImpak')) document.getElementById('pvImpak').textContent = impak;

      alert('✅ OPR Berjaya Dijana pada Preview!');
    });
  }
}

// 4. PRINT / JANA PDF
function setupPrintHandler() {
  const btnPrint = document.getElementById('btnPrint');
  if (btnPrint) {
    btnPrint.addEventListener('click', () => {
      const element = document.getElementById('oprPaper');
      const opt = {
        margin:       0,
        filename:     'Laporan_OPR_PLC.pdf',
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2 },
        jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
      };
      html2pdf().set(opt).from(element).save();
    });
  }
}
