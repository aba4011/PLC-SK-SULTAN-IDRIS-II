// ==========================================
// PLC OPR GENERATOR - AUTOMATIC LIVE PREVIEW
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
  setupLivePreview();
  setupImageHandlers();
});

// 1. FUNGSI UNTUK MENDENGAR INPUT BORANG (LIVE SYNC)
function setupLivePreview() {
  const form = document.getElementById('oprForm');
  if (!form) return;

  // Mendengar setiap kali pengguna menaip, memilih dropdown, atau menukar tarikh/masa
  form.addEventListener('input', updatePreviewCanvas);
  form.addEventListener('change', updatePreviewCanvas);

  // Juga dengar container ahli kumpulan dinamik
  const ahliContainer = document.getElementById('ahliContainer');
  if (ahliContainer) {
    ahliContainer.addEventListener('input', updatePreviewCanvas);
    ahliContainer.addEventListener('change', updatePreviewCanvas);
  }

  // Butang Submit / Generate
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    updatePreviewCanvas();
    alert('✅ OPR Berjaya Dikemaskini!');
  });

  // Kemaskini awal semasa muat turun halaman
  updatePreviewCanvas();
}

// 2. FUNGSI FORMAT TARIKH & MASA
function formatDate(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return dateStr;
}

function formatTime(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':');
  if (!h || !m) return timeStr;
  let hours = parseInt(h, 10);
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  return `${hours}:${m} ${ampm}`;
}

// 3. FUNGSI UTAMA KEMASKINI CANVAS PREVIEW
function updatePreviewCanvas() {
  // A. Strategi PLC
  const strategiVal = document.getElementById('strategiPlc')?.value || '';
  const pvStrategiText = document.getElementById('pvStrategiText');
  if (pvStrategiText) pvStrategiText.textContent = strategiVal;

  // B. Tajuk PLC
  const tajukVal = document.getElementById('tajukPlc')?.value || 'Tajuk PLC';
  const pvTajuk = document.getElementById('pvTajuk');
  if (pvTajuk) pvTajuk.textContent = tajukVal;

  // C. Tarikh & Masa
  const tarikhRaw = document.getElementById('tarikhPlc')?.value || '';
  const tarikhFormatted = formatDate(tarikhRaw);
  const masaMula = formatTime(document.getElementById('masaMula')?.value || '');
  const masaTamat = formatTime(document.getElementById('masaTamat')?.value || '');

  let tarikhMasaCombined = '-';
  if (tarikhFormatted) {
    tarikhMasaCombined = tarikhFormatted;
    if (masaMula && masaTamat) {
      tarikhMasaCombined += ` (${masaMula} - ${masaTamat})`;
    }
  }
  const pvTarikhMasa = document.getElementById('pvTarikhMasa');
  if (pvTarikhMasa) pvTarikhMasa.textContent = tarikhMasaCombined;

  // D. Tempat
  const tempatVal = document.getElementById('tempatPlc')?.value || '-';
  const pvTempat = document.getElementById('pvTempat');
  if (pvTempat) pvTempat.textContent = tempatVal;

  // E. Masa Berasingan
  let masaCombined = '-';
  if (masaMula && masaTamat) masaCombined = `${masaMula} - ${masaTamat}`;
  const pvMasa = document.getElementById('pvMasa');
  if (pvMasa) pvMasa.textContent = masaCombined;

  // F. Nama Kumpulan
  const kumpulanVal = document.getElementById('namaKumpulan')?.value || '-';
  const pvKumpulan = document.getElementById('pvKumpulan');
  if (pvKumpulan) pvKumpulan.textContent = kumpulanVal;

  // G. Nama Ketua Kumpulan
  const ketuaVal = document.getElementById('ketuaKumpulan')?.value || '-';
  const pvKetua = document.getElementById('pvKetua');
  if (pvKetua) pvKetua.textContent = ketuaVal;

  // H. Senarai Ahli Kumpulan
  const ahliInputs = document.querySelectorAll('.ahli-input, #ahliContainer input');
  const pvAhliList = document.getElementById('pvAhliList');
  if (pvAhliList) {
    pvAhliList.innerHTML = '';
    let count = 0;
    ahliInputs.forEach((inp) => {
      const val = inp.value.trim();
      if (val) {
        count++;
        const li = document.createElement('li');
        li.textContent = `${count}. ${val}`;
        pvAhliList.appendChild(li);
      }
    });

    // Jika tiada ahli dimasukkan lagi, tunjukkan nombor tempat kosong
    if (count === 0) {
      for (let i = 1; i <= 8; i++) {
        const li = document.createElement('li');
        li.textContent = `${i}. `;
        pvAhliList.appendChild(li);
      }
    }
  }

  // I. Disediakan Oleh
  const disediakanVal = document.getElementById('disediakanOleh')?.value || '';
  const pvDisediakan = document.getElementById('pvDisediakan');
  if (pvDisediakan) pvDisediakan.textContent = disediakanVal;

  // J. Kandungan Kotak Laporan
  const isu = document.getElementById('isuMasalah')?.value || 'Masukkan Isu/masalah.';
  const pvIsu = document.getElementById('pvIsu');
  if (pvIsu) pvIsu.textContent = isu;

  const pelaksanaan = document.getElementById('pelaksanaanAktiviti')?.value || 'Masukkan pelaksanaan aktiviti.';
  const pvPelaksanaan = document.getElementById('pvPelaksanaan');
  if (pvPelaksanaan) pvPelaksanaan.textContent = pelaksanaan;

  const objektif = document.getElementById('objektifProgram')?.value || 'Masukkan objektif program.';
  const pvObjektif = document.getElementById('pvObjektif');
  if (pvObjektif) pvObjektif.textContent = objektif;

  const tindakan = document.getElementById('tindakanSusulan')?.value || 'Masukkan tindakan susulan.';
  const pvTindakan = document.getElementById('pvTindakan');
  if (pvTindakan) pvTindakan.textContent = tindakan;

  const impak = document.getElementById('impakProgram')?.value || 'Masukkan Impak';
  const pvImpak = document.getElementById('pvImpak');
  if (pvImpak) pvImpak.textContent = impak;
}

// 4. PREVIEW GAMBAR
function setupImageHandlers() {
  for (let i = 1; i <= 4; i++) {
    const imgInput = document.getElementById(`imgInput${i}`);
    if (imgInput) {
      imgInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const slot = document.getElementById(`slot${i}`);
            if (slot) {
              slot.innerHTML = `<img src="${event.target.result}" style="width:100%; height:100%; object-fit:cover; border-radius:10px;">`;
            }
          };
          reader.readAsDataURL(file);
        }
      });
    }
  }
}
