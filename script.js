/**
 * PLC OPR Generator Client Logic
 * SK Sultan Idris II, Kuala Kangsar
 */

// STATE MANAGEMENT
let teacherList = [];
let memberCount = 0;
let uploadedImages = { 1: null, 2: null, 3: null };
let generatedData = null;

const PLC_STRATEGIES = [
  "Discussion Protocols", "Book Clubs", "Study Groups",
  "Video Critiques of Teaching Moments", "Learning Walks",
  "Peer Coaching / Instructional Coaches", "Lesson Study",
  "Teacher Sharing Sessions", "Data Analysis", "Curriculum Mapping",
  "Common Assessments", "Critical / Friends Groups",
  "Horizontal & Vertical Teams", "New Teacher Induction / Mentoring",
  "Interdisciplinary Units & Projects", "Problem Solving Groups",
  "Vision Activity", "Guiding Principles", "Value Activities", "Common Rituals and Strategies"
];

// INITIALISATION
document.addEventListener("DOMContentLoaded", () => {
  initStrategyDropdown();
  loadTeacherList();
  setupEventListeners();
  setupCharacterCounters();
  checkSavedDraft();
});

/* ==========================================================================
   1. API COMMUNICATIONS & TEACHER LIST
   ========================================================================== */
async function loadTeacherList() {
  showLoading("Memuatkan senarai nama guru...");
  try {
    const response = await fetch(`${CONFIG.GOOGLE_APPS_SCRIPT_URL}?action=getTeacherList`);
    const result = await response.json();
    
    if (result.status === "success" && Array.isArray(result.data)) {
      teacherList = result.data;
      populateTeacherDropdowns();
    } else {
      showToast("Gagal memuatkan senarai guru dari Google Sheet.", "error");
    }
  } catch (err) {
    console.error(err);
    showToast("Ralat rangkaian semasa mengambil senarai guru.", "error");
  } finally {
    hideLoading();
  }
}

function populateTeacherDropdowns() {
  setupSearchableSelect("groupLeaderSearch", "groupLeaderOptions", "groupLeader", teacherList);
  setupSearchableSelect("preparedBySearch", "preparedByOptions", "preparedBy", teacherList);
  
  // Add initial member row if none exists
  if (memberCount === 0) {
    addMemberRow();
  }
}

/* ==========================================================================
   2. SEARCHABLE DROPDOWNS & DUPLICATE PREVENTOR
   ========================================================================== */
function initStrategyDropdown() {
  const searchInput = document.getElementById("plcStrategySearch");
  const optionsList = document.getElementById("plcStrategyOptions");
  const hiddenInput = document.getElementById("plcStrategy");

  PLC_STRATEGIES.forEach(strat => {
    const li = document.createElement("li");
    li.textContent = strat;
    li.addEventListener("click", () => {
      searchInput.value = strat;
      hiddenInput.value = strat;
      optionsList.classList.add("hidden");
    });
    optionsList.appendChild(li);
  });

  searchInput.addEventListener("focus", () => optionsList.classList.remove("hidden"));
  searchInput.addEventListener("input", () => {
    const filter = searchInput.value.toLowerCase();
    const items = optionsList.querySelectorAll("li");
    items.forEach(item => {
      item.style.display = item.textContent.toLowerCase().includes(filter) ? "" : "none";
    });
    optionsList.classList.remove("hidden");
  });

  document.addEventListener("click", (e) => {
    if (!e.target.closest("#plcStrategySearch") && !e.target.closest("#plcStrategyOptions")) {
      optionsList.classList.add("hidden");
    }
  });
}

function setupSearchableSelect(inputId, optionsId, hiddenId, dataList) {
  const searchInput = document.getElementById(inputId);
  const optionsList = document.getElementById(optionsId);
  const hiddenInput = document.getElementById(hiddenId);

  function renderOptions() {
    optionsList.innerHTML = "";
    const selectedTeachers = getSelectedTeachers();

    dataList.forEach(item => {
      const teacherName = typeof item === "string" ? item : item.nama;
      
      // Prevent Duplicate Selection
      if (selectedTeachers.includes(teacherName) && hiddenInput.value !== teacherName) {
        return;
      }

      const li = document.createElement("li");
      li.textContent = teacherName;
      li.addEventListener("click", () => {
        searchInput.value = teacherName;
        hiddenInput.value = teacherName;
        optionsList.classList.add("hidden");
        updateAllTeacherDropdowns();
      });
      optionsList.appendChild(li);
    });
  }

  searchInput.addEventListener("focus", () => {
    renderOptions();
    optionsList.classList.remove("hidden");
  });

  searchInput.addEventListener("input", () => {
    const filter = searchInput.value.toLowerCase();
    const items = optionsList.querySelectorAll("li");
    items.forEach(item => {
      item.style.display = item.textContent.toLowerCase().includes(filter) ? "" : "none";
    });
    optionsList.classList.remove("hidden");
  });

  document.addEventListener("click", (e) => {
    if (!e.target.closest(`#${inputId}`) && !e.target.closest(`#${optionsId}`)) {
      optionsList.classList.add("hidden");
    }
  });
}

function getSelectedTeachers() {
  const selected = [];
  const leader = document.getElementById("groupLeader").value;
  const prep = document.getElementById("preparedBy").value;
  if (leader) selected.push(leader);
  if (prep) selected.push(prep);

  document.querySelectorAll(".member-hidden-input").forEach(input => {
    if (input.value) selected.push(input.value);
  });
  return selected;
}

function updateAllTeacherDropdowns() {
  // Triggers re-evaluation of options based on current selections
}

/* ==========================================================================
   3. DYNAMIC MEMBER ROWS
   ========================================================================== */
function addMemberRow(value = "") {
  if (memberCount >= CONFIG.MAX_MEMBERS) {
    showToast(`Maksimum ${CONFIG.MAX_MEMBERS} ahli sahaja dibenarkan.`, "info");
    return;
  }

  memberCount++;
  const container = document.getElementById("membersContainer");
  const rowId = `member_row_${memberCount}`;
  const inputId = `member_search_${memberCount}`;
  const optionsId = `member_options_${memberCount}`;
  const hiddenId = `member_hidden_${memberCount}`;

  const div = document.createElement("div");
  div.className = "member-row";
  div.id = rowId;
  div.innerHTML = `
    <span class="member-number">Ahli ${memberCount}:</span>
    <div class="custom-select-wrapper member-select">
      <input type="text" id="${inputId}" class="teacher-search-input" placeholder="🔍 Cari Ahli Kumpulan..." autocomplete="off" value="${value}">
      <ul id="${optionsId}" class="custom-select-options hidden"></ul>
      <input type="hidden" id="${hiddenId}" class="member-hidden-input" value="${value}">
    </div>
    <button type="button" class="btn btn-xs btn-danger" onclick="removeMemberRow('${rowId}')">REMOVE</button>
  `;

  container.appendChild(div);
  setupSearchableSelect(inputId, optionsId, hiddenId, teacherList);
}

function removeMemberRow(rowId) {
  const row = document.getElementById(rowId);
  if (row) {
    row.remove();
    reindexMembers();
  }
}

function reindexMembers() {
  const rows = document.querySelectorAll(".member-row");
  memberCount = 0;
  rows.forEach((row, index) => {
    memberCount++;
    row.querySelector(".member-number").textContent = `Ahli ${memberCount}:`;
  });
}

/* ==========================================================================
   4. IMAGE UPLOAD, PREVIEW & COMPRESSION
   ========================================================================== */
function setupImageUpload(index) {
  const fileInput = document.getElementById(`fileInput${index}`);
  const display = document.getElementById(`imgDisplay${index}`);
  const previewBox = document.getElementById(`previewBox${index}`);
  const fileInfo = document.getElementById(`fileInfo${index}`);
  const removeBtn = document.getElementById(`btnRemoveImg${index}`);

  fileInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > CONFIG.MAX_IMAGE_SIZE_MB * 1024 * 1024) {
      showToast(`Saiz gambar melebihi ${CONFIG.MAX_IMAGE_SIZE_MB}MB. Sila pilih gambar lebih kecil.`, "error");
      fileInput.value = "";
      return;
    }

    showLoading("Mekompres gambar...");
    try {
      const compressedBase64 = await compressImage(file);
      uploadedImages[index] = {
        base64: compressedBase64,
        filename: file.name,
        type: file.type
      };

      display.src = compressedBase64;
      display.classList.remove("hidden");
      previewBox.querySelector(".preview-placeholder")?.classList.add("hidden");
      fileInfo.textContent = `${file.name} (${(file.size/1024/1024).toFixed(2)} MB)`;
      removeBtn.classList.remove("hidden");
    } catch (err) {
      showToast("Gagal memproses gambar.", "error");
      console.error(err);
    } finally {
      hideLoading();
    }
  });

  removeBtn.addEventListener("click", () => {
    fileInput.value = "";
    display.src = "";
    display.classList.add("hidden");
    previewBox.querySelector(".preview-placeholder")?.classList.remove("hidden");
    fileInfo.textContent = "";
    removeBtn.classList.add("hidden");
    uploadedImages[index] = null;
  });
}

function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > CONFIG.IMAGE_MAX_WIDTH) {
            height = Math.round((height * CONFIG.IMAGE_MAX_WIDTH) / width);
            width = CONFIG.IMAGE_MAX_WIDTH;
          }
        } else {
          if (height > CONFIG.IMAGE_MAX_HEIGHT) {
            width = Math.round((width * CONFIG.IMAGE_MAX_HEIGHT) / height);
            height = CONFIG.IMAGE_MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL("image/jpeg", CONFIG.IMAGE_QUALITY);
        resolve(dataUrl);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}

/* ==========================================================================
   5. FORM VALIDATION & GENERATE OPR
   ========================================================================== */
function validateForm() {
  const requiredIds = [
    "plcStrategy", "plcFocus", "plcDate", "startTime", "endTime",
    "plcLocation", "groupName", "groupLeader", "preparedBy",
    "plcIssue", "plcObjective", "plcImplementation", "plcImpact", "plcFollowup"
  ];

  for (let id of requiredIds) {
    const el = document.getElementById(id);
    if (!el || !el.value.trim()) {
      showToast("Sila lengkapkan semua ruangan wajib (*).", "error");
      el?.focus();
      return false;
    }
  }

  // Check Members
  const members = getSelectedMembers();
  if (members.length === 0) {
    showToast("Sila pilih sekurang-kurangnya 1 ahli kumpulan.", "error");
    return false;
  }

  return true;
}

function getSelectedMembers() {
  const members = [];
  document.querySelectorAll(".member-hidden-input").forEach(input => {
    if (input.value.trim()) members.push(input.value.trim());
  });
  return members;
}

async function handleGenerateOpr(e) {
  e.preventDefault();
  if (!validateForm()) return;

  showLoading("Menjana OPR dan berkomunikasi dengan Server...");

  // Generate Temporary Local OPR ID for Preview
  const todayStr = new Date().toISOString().slice(0,10).replace(/-/g,"");
  const tempOprId = `OPR-PLC-${todayStr}-XXXX`;

  const formData = {
    oprId: tempOprId,
    strategy: document.getElementById("plcStrategy").value,
    focus: document.getElementById("plcFocus").value,
    date: document.getElementById("plcDate").value,
    startTime: document.getElementById("startTime").value,
    endTime: document.getElementById("endTime").value,
    location: document.getElementById("plcLocation").value,
    groupName: document.getElementById("groupName").value,
    groupLeader: document.getElementById("groupLeader").value,
    preparedBy: document.getElementById("preparedBy").value,
    members: getSelectedMembers(),
    issue: document.getElementById("plcIssue").value,
    objective: document.getElementById("plcObjective").value,
    implementation: document.getElementById("plcImplementation").value,
    impact: document.getElementById("plcImpact").value,
    followup: document.getElementById("plcFollowup").value,
    captions: [
      document.getElementById("caption1").value,
      document.getElementById("caption2").value,
      document.getElementById("caption3").value
    ],
    images: [uploadedImages[1], uploadedImages[2], uploadedImages[3]]
  };

  try {
    // Submit Payload to Google Apps Script API
    const response = await fetch(CONFIG.GOOGLE_APPS_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "generateOPR", payload: formData })
    });

    const result = await response.json();

    if (result.status === "success") {
      formData.oprId = result.data.oprId;
      generatedData = { ...formData, pdfUrl: result.data.pdfUrl, driveUrl: result.data.driveUrl };
      
      renderOprPreview(generatedData);
      
      document.getElementById("formSection").classList.add("hidden");
      document.getElementById("previewSection").classList.remove("hidden");
      
      if (result.data.driveUrl) {
        const driveBtn = document.getElementById("btnDriveUrl");
        driveBtn.href = result.data.driveUrl;
        driveBtn.classList.remove("hidden");
      }

      showToast("✓ OPR berjaya dijana dan disimpan ke Google Drive & Sheets!", "success");
      clearSavedDraft();
    } else {
      showToast(`Ralat: ${result.message}`, "error");
    }
  } catch (err) {
    console.error(err);
    // Fallback: Display Preview locally if backend fails
    renderOprPreview(formData);
    document.getElementById("formSection").classList.add("hidden");
    document.getElementById("previewSection").classList.remove("hidden");
    showToast("OPR dijana secara tempatan (Gagal menyimpan ke Google Drive).", "info");
  } finally {
    hideLoading();
  }
}

/* ==========================================================================
   6. RENDER OPR PREVIEW
   ========================================================================== */
function renderOprPreview(data) {
  document.getElementById("outOprId").textContent = data.oprId;
  document.getElementById("outFooterId").textContent = data.oprId;
  document.getElementById("outStrategy").textContent = data.strategy;
  document.getElementById("outFocus").textContent = data.focus;
  document.getElementById("outDate").textContent = formatDate(data.date);
  document.getElementById("outTime").textContent = `${formatTime(data.startTime)} – ${formatTime(data.endTime)}`;
  document.getElementById("outLocation").textContent = data.location;
  document.getElementById("outGroupName").textContent = data.groupName;
  document.getElementById("outGroupLeader").textContent = data.groupLeader;
  document.getElementById("outPreparedBy").textContent = data.preparedBy;

  // Render Members Multi-Column
  const membersGrid = document.getElementById("outMembersList");
  membersGrid.innerHTML = "";
  data.members.forEach((m, idx) => {
    const div = document.createElement("div");
    div.textContent = `${idx + 1}. ${m}`;
    membersGrid.appendChild(div);
  });

  // Render Text Sections
  document.getElementById("outIssue").textContent = data.issue;
  document.getElementById("outObjective").textContent = data.objective;
  document.getElementById("outImplementation").textContent = data.implementation;
  document.getElementById("outImpact").textContent = data.impact;
  document.getElementById("outFollowup").textContent = data.followup;

  // Render Images
  const imgGrid = document.getElementById("outImageGrid");
  imgGrid.innerHTML = "";
  let activeImgCount = 0;

  data.images.forEach((imgObj, idx) => {
    if (imgObj && imgObj.base64) {
      activeImgCount++;
      const cap = data.captions[idx] || "";
      const div = document.createElement("div");
      div.className = "opr-img-container";
      div.innerHTML = `
        <img src="${imgObj.base64}" alt="Dokumentasi ${idx+1}">
        ${cap ? `<div class="opr-img-caption">${cap}</div>` : ''}
      `;
      imgGrid.appendChild(div);
    }
  });

  if (activeImgCount === 0) {
    imgGrid.style.display = "none";
  } else {
    imgGrid.style.display = "flex";
  }
}

/* ==========================================================================
   7. DRAFT SAVE & RESTORE
   ========================================================================== */
function saveDraft() {
  const draft = {
    strategy: document.getElementById("plcStrategy").value,
    focus: document.getElementById("plcFocus").value,
    date: document.getElementById("plcDate").value,
    startTime: document.getElementById("startTime").value,
    endTime: document.getElementById("endTime").value,
    location: document.getElementById("plcLocation").value,
    groupName: document.getElementById("groupName").value,
    groupLeader: document.getElementById("groupLeader").value,
    preparedBy: document.getElementById("preparedBy").value,
    members: getSelectedMembers(),
    issue: document.getElementById("plcIssue").value,
    objective: document.getElementById("plcObjective").value,
    implementation: document.getElementById("plcImplementation").value,
    impact: document.getElementById("plcImpact").value,
    followup: document.getElementById("plcFollowup").value,
  };
  localStorage.setItem("PLC_OPR_DRAFT", JSON.stringify(draft));
  showToast("Draf berjaya disimpan secara tempatan.", "success");
}

function checkSavedDraft() {
  const draftStr = localStorage.getItem("PLC_OPR_DRAFT");
  if (draftStr) {
    document.getElementById("draftBanner").classList.remove("hidden");
  }
}

function restoreDraft() {
  const draftStr = localStorage.getItem("PLC_OPR_DRAFT");
  if (!draftStr) return;
  const draft = JSON.parse(draftStr);

  document.getElementById("plcStrategy").value = draft.strategy || "";
  document.getElementById("plcStrategySearch").value = draft.strategy || "";
  document.getElementById("plcFocus").value = draft.focus || "";
  document.getElementById("plcDate").value = draft.date || "";
  document.getElementById("startTime").value = draft.startTime || "";
  document.getElementById("endTime").value = draft.endTime || "";
  document.getElementById("plcLocation").value = draft.location || "";
  document.getElementById("groupName").value = draft.groupName || "";
  
  document.getElementById("groupLeader").value = draft.groupLeader || "";
  document.getElementById("groupLeaderSearch").value = draft.groupLeader || "";
  document.getElementById("preparedBy").value = draft.preparedBy || "";
  document.getElementById("preparedBySearch").value = draft.preparedBy || "";

  document.getElementById("plcIssue").value = draft.issue || "";
  document.getElementById("plcObjective").value = draft.objective || "";
  document.getElementById("plcImplementation").value = draft.implementation || "";
  document.getElementById("plcImpact").value = draft.impact || "";
  document.getElementById("plcFollowup").value = draft.followup || "";

  // Restore Members
  document.getElementById("membersContainer").innerHTML = "";
  memberCount = 0;
  if (Array.isArray(draft.members) && draft.members.length > 0) {
    draft.members.forEach(m => addMemberRow(m));
  } else {
    addMemberRow();
  }

  triggerCharacterCounters();
  document.getElementById("draftBanner").classList.add("hidden");
  showToast("Draf dipulihkan.", "info");
}

function clearSavedDraft() {
  localStorage.removeItem("PLC_OPR_DRAFT");
  document.getElementById("draftBanner").classList.add("hidden");
}

/* ==========================================================================
   8. EVENT LISTENERS & UTILITIES
   ========================================================================== */
function setupEventListeners() {
  document.getElementById("btnAddMember").addEventListener("click", () => addMemberRow());
  document.getElementById("oprForm").addEventListener("submit", handleGenerateOpr);
  document.getElementById("btnSaveDraft").addEventListener("click", saveDraft);
  
  document.getElementById("btnReset").addEventListener("click", () => {
    if (confirm("Adakah anda pasti ingin memadam semua maklumat dalam borang?")) {
      document.getElementById("oprForm").reset();
      document.getElementById("membersContainer").innerHTML = "";
      memberCount = 0;
      addMemberRow();
      clearSavedDraft();
      showToast("Borang telah dikosongkan.", "info");
    }
  });

  document.getElementById("btnRestoreDraft").addEventListener("click", restoreDraft);
  document.getElementById("btnDiscardDraft").addEventListener("click", clearSavedDraft);

  // Preview Buttons
  document.getElementById("btnEditOpr").addEventListener("click", () => {
    document.getElementById("previewSection").classList.add("hidden");
    document.getElementById("formSection").classList.remove("hidden");
  });

  document.getElementById("btnPrintOpr").addEventListener("click", () => window.print());

  document.getElementById("btnDownloadPdf").addEventListener("click", () => {
    if (generatedData && generatedData.pdfUrl) {
      window.open(generatedData.pdfUrl, "_blank");
    } else {
      window.print(); // Fallback to print-to-pdf
    }
  });

  document.getElementById("btnShareOpr").addEventListener("click", async () => {
    const shareUrl = generatedData?.pdfUrl || window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "PLC One Page Report - SK Sultan Idris II",
          text: `Laporan PLC: ${generatedData?.focus || 'OPR PLC'}`,
          url: shareUrl
        });
      } catch (e) { console.log(e); }
    } else {
      navigator.clipboard.writeText(shareUrl);
      showToast("Pautan laporan telah disalin ke clipboard.", "info");
    }
  });

  setupImageUpload(1);
  setupImageUpload(2);
  setupImageUpload(3);
}

function setupCharacterCounters() {
  const fields = [
    { id: "plcIssue", counter: "plcIssueCounter" },
    { id: "plcObjective", counter: "plcObjectiveCounter" },
    { id: "plcImplementation", counter: "plcImplementationCounter" },
    { id: "plcImpact", counter: "plcImpactCounter" },
    { id: "plcFollowup", counter: "plcFollowupCounter" }
  ];

  fields.forEach(f => {
    const input = document.getElementById(f.id);
    const counter = document.getElementById(f.counter);
    if (input && counter) {
      input.addEventListener("input", () => {
        counter.textContent = input.value.length;
        if (input.value.length >= input.maxLength) {
          counter.classList.add("warning");
        } else {
          counter.classList.remove("warning");
        }
      });
    }
  });
}

function triggerCharacterCounters() {
  ["plcIssue", "plcObjective", "plcImplementation", "plcImpact", "plcFollowup"].forEach(id => {
    document.getElementById(id)?.dispatchEvent(new Event("input"));
  });
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function formatTime(timeStr) {
  if (!timeStr) return "";
  let [hours, minutes] = timeStr.split(":");
  hours = parseInt(hours);
  const ampm = hours >= 12 ? "petang" : "pagi";
  hours = hours % 12 || 12;
  return `${hours}.${minutes} ${ampm}`;
}

function showLoading(text) {
  document.getElementById("loadingText").textContent = text;
  document.getElementById("loadingOverlay").classList.remove("hidden");
}

function hideLoading() {
  document.getElementById("loadingOverlay").classList.add("hidden");
}

function showToast(msg, type = "info") {
  const container = document.getElementById("toastContainer");
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}