/**
 * GOOGLE APPS SCRIPT BACKEND ENGINE
 * PLC OPR Generator - SK Sultan Idris II
 */

const CONFIG = {
  GOOGLE_DRIVE_FOLDER_ID: "PASTE_YOUR_GOOGLE_DRIVE_FOLDER_ID_HERE",
  GOOGLE_SHEET_ID: "PASTE_YOUR_GOOGLE_SHEET_ID_HERE",
  SHEET_DATABASE: "PLC_OPR_DATABASE",
  SHEET_TEACHERS: "SENARAI_GURU"
};

/* ==========================================================================
   HTTP GET & POST ROUTERS
   ========================================================================== */
function doGet(e) {
  const action = e.parameter.action;
  let responseData = {};

  if (action === "getTeacherList") {
    responseData = getTeacherList();
  } else {
    responseData = { status: "error", message: "Invalid action request." };
  }

  return ContentService.createTextOutput(JSON.stringify(responseData))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  let responseData = {};
  try {
    const postData = JSON.parse(e.postData.contents);
    const action = postData.action;
    const payload = postData.payload;

    if (action === "generateOPR") {
      responseData = processOprGeneration(payload);
    } else {
      responseData = { status: "error", message: "Unknown post action." };
    }
  } catch (err) {
    responseData = { status: "error", message: err.toString() };
  }

  return ContentService.createTextOutput(JSON.stringify(responseData))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ==========================================================================
   1. SENARAI GURU FETCHING
   ========================================================================== */
function getTeacherList() {
  try {
    const ss = SpreadsheetApp.openById(CONFIG.GOOGLE_SHEET_ID);
    const sheet = ss.getSheetByName(CONFIG.SHEET_TEACHERS);
    if (!sheet) return { status: "error", message: "Sheet SENARAI_GURU tidak dijumpai." };

    const data = sheet.getDataRange().getValues();
    const teachers = [];

    // Skip Header Row (Row 0)
    for (let i = 1; i < data.length; i++) {
      const nama = data[i][1];
      const status = data[i][2];
      if (nama && status === "Aktif") {
        teachers.push(nama.toString().trim());
      }
    }

    return { status: "success", data: teachers };
  } catch (err) {
    return { status: "error", message: err.toString() };
  }
}

/* ==========================================================================
   2. SERVER-SIDE RUNNING OPR ID GENERATOR (LOCKSERVICE)
   ========================================================================== */
function generateUniqueOprId() {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000); // Prevent race condition concurrent generation

  try {
    const todayStr = Utilities.formatDate(new Date(), "GMT+8", "yyyyMMdd");
    const ss = SpreadsheetApp.openById(CONFIG.GOOGLE_SHEET_ID);
    const sheet = ss.getSheetByName(CONFIG.SHEET_DATABASE);
    
    let nextNum = 1;
    if (sheet && sheet.getLastRow() > 1) {
      const lastRow = sheet.getLastRow();
      const lastOprId = sheet.getRange(lastRow, 1).getValue().toString();
      if (lastOprId.includes(todayStr)) {
        const parts = lastOprId.split("-");
        const currentSeq = parseInt(parts[parts.length - 1], 10);
        if (!isNaN(currentSeq)) nextNum = currentSeq + 1;
      }
    }

    const seqFormatted = String(nextNum).padStart(4, "0");
    return `OPR-PLC-${todayStr}-${seqFormatted}`;
  } finally {
    lock.releaseLock();
  }
}

/* ==========================================================================
   3. OPR PROCESSING PIPELINE (DRIVE, SHEETS & PDF)
   ========================================================================== */
function processOprGeneration(payload) {
  try {
    const oprId = generateUniqueOprId();
    payload.oprId = oprId;

    // 1. Storage Folders Setup
    const parentFolder = DriveApp.getFolderById(CONFIG.GOOGLE_DRIVE_FOLDER_ID);
    const imagesFolder = getOrCreateSubFolder(parentFolder, "PLC OPR IMAGES");
    const oprFolder = getOrCreateSubFolder(imagesFolder, oprId);

    // 2. Upload Images to Drive
    const imageUrls = ["", "", ""];
    if (payload.images && Array.isArray(payload.images)) {
      payload.images.forEach((imgObj, idx) => {
        if (imgObj && imgObj.base64) {
          const fileBlob = dataUriToBlob(imgObj.base64, `${oprId}_Image${idx + 1}.jpg`);
          const savedFile = oprFolder.createFile(fileBlob);
          savedFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
          imageUrls[idx] = savedFile.getUrl();
        }
      });
    }

    // 3. Generate HTML-based PDF
    const pdfBlob = createPdfBlob(payload);
    const pdfFile = parentFolder.createFile(pdfBlob);
    pdfFile.setName(`${oprId}_${sanitizeFilename(payload.focus)}.pdf`);
    pdfFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

    // 4. Record to Google Sheet Database
    saveToDatabase(payload, imageUrls, pdfFile.getUrl());

    return {
      status: "success",
      data: {
        oprId: oprId,
        pdfUrl: pdfFile.getUrl(),
        driveUrl: parentFolder.getUrl()
      }
    };
  } catch (err) {
    return { status: "error", message: err.toString() };
  }
}

/* ==========================================================================
   4. PDF GENERATION VIA HTML TEMPLATE
   ========================================================================== */
function createPdfBlob(data) {
  const membersFormatted = data.members.map((m, i) => `${i + 1}. ${m}`).join("<br>");
  
  let imagesHtml = "";
  data.images.forEach((imgObj, i) => {
    if (imgObj && imgObj.base64) {
      const cap = data.captions[i] || "";
      imagesHtml += `
        <div style="flex:1; border:1px solid #ccc; text-align:center; padding:2px;">
          <img src="${imgObj.base64}" style="width:100%; height:90px; object-fit:cover;">
          ${cap ? `<div style="font-size:8px;">${cap}</div>` : ''}
        </div>
      `;
    }
  });

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        @page { size: A4 portrait; margin: 8mm; }
        body { font-family: Arial, sans-serif; font-size: 9px; color: #000; line-height: 1.2; }
        .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 4px; margin-bottom: 5px; }
        .title { font-size: 14px; font-weight: bold; }
        .sub-title { font-size: 10px; font-weight: bold; color: #002B49; }
        .sec-title { font-size: 9.5px; font-weight: bold; background: #E2E8F0; padding: 2px 4px; margin-top: 4px; border-left: 3px solid #002B49; }
        table { width: 100%; border-collapse: collapse; font-size: 9px; margin-bottom: 4px; }
        td { border: 1px solid #666; padding: 3px; }
        .lbl { font-weight: bold; background: #F8FAFC; width: 18%; }
        .grid-members { display: grid; grid-template-columns: repeat(3, 1fr); font-size: 8.5px; }
        .text-block { font-size: 9px; padding: 2px 0; text-align: justify; }
        .img-grid { display: flex; gap: 6px; margin-top: 4px; }
        .sig-block { float: right; width: 200px; margin-top: 10px; font-size: 9px; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="title">SK SULTAN IDRIS II</div>
        <div style="font-size:9px;">JALAN TUN ABDUL RAZAK, 33000 KUALA KANGSAR</div>
        <div style="font-size:12px; font-weight:bold; margin-top:3px;">ONE PAGE REPORT (OPR)</div>
        <div class="sub-title">PROFESSIONAL LEARNING COMMUNITY (PLC)</div>
        <div style="font-size:8.5px; font-weight:bold;">${data.oprId}</div>
      </div>

      <div class="sec-title">A. MAKLUMAT PLC</div>
      <table>
        <tr><td class="lbl">Strategi</td><td>${data.strategy}</td><td class="lbl">Tarikh</td><td>${data.date}</td></tr>
        <tr><td class="lbl">Tajuk/Fokus</td><td colspan="3">${data.focus}</td></tr>
        <tr><td class="lbl">Masa</td><td>${data.startTime} - ${data.endTime}</td><td class="lbl">Tempat</td><td>${data.location}</td></tr>
        <tr><td class="lbl">Kumpulan</td><td>${data.groupName}</td><td class="lbl">Ketua</td><td>${data.groupLeader}</td></tr>
      </table>

      <div class="sec-title">B. AHLI KUMPULAN</div>
      <div class="grid-members">${membersFormatted}</div>

      <div class="sec-title">C. ISU / MASALAH</div>
      <div class="text-block">${data.issue}</div>

      <div class="sec-title">D. OBJEKTIF</div>
      <div class="text-block">${data.objective}</div>

      <div class="sec-title">E. PELAKSANAAN</div>
      <div class="text-block">${data.implementation}</div>

      <div class="sec-title">F. IMPAK / HASIL</div>
      <div class="text-block">${data.impact}</div>

      <div class="sec-title">G. TINDAKAN SUSULAN</div>
      <div class="text-block">${data.followup}</div>

      <div class="sec-title">H. DOKUMENTASI PLC</div>
      <div class="img-grid">${imagesHtml}</div>

      <div class="sig-block">
        <b>Disediakan oleh:</b><br><br><br>
        <u><b>${data.preparedBy}</b></u><br>
        SK Sultan Idris II
      </div>
    </body>
    </html>
  `;

  const htmlOutput = HtmlService.createHtmlOutput(htmlContent);
  return htmlOutput.getAs(MimeType.PDF);
}

/* ==========================================================================
   5. SAVE RECORD TO GOOGLE SHEETS
   ========================================================================== */
function saveToDatabase(data, imageUrls, pdfUrl) {
  const ss = SpreadsheetApp.openById(CONFIG.GOOGLE_SHEET_ID);
  let sheet = ss.getSheetByName(CONFIG.SHEET_DATABASE);

  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.SHEET_DATABASE);
    sheet.appendRow([
      "OPR ID", "Timestamp", "Strategi PLC", "Tajuk / Fokus", "Tarikh",
      "Masa Mula", "Masa Tamat", "Tempat", "Nama Kumpulan", "Ketua Kumpulan",
      "Ahli Kumpulan", "Disediakan Oleh", "Isu / Masalah", "Objektif",
      "Pelaksanaan", "Impak", "Susulan", "Image 1 URL", "Image 2 URL", "Image 3 URL", "PDF URL"
    ]);
  }

  sheet.appendRow([
    data.oprId,
    new Date(),
    data.strategy,
    data.focus,
    data.date,
    data.startTime,
    data.endTime,
    data.location,
    data.groupName,
    data.groupLeader,
    data.members.join(", "),
    data.preparedBy,
    data.issue,
    data.objective,
    data.implementation,
    data.impact,
    data.followup,
    imageUrls[0] || "",
    imageUrls[1] || "",
    imageUrls[2] || "",
    pdfUrl
  ]);
}

/* ==========================================================================
   UTILITY HELPER FUNCTIONS
   ========================================================================== */
function getOrCreateSubFolder(parent, name) {
  const folders = parent.getFoldersByName(name);
  if (folders.hasNext()) return folders.next();
  return parent.createFolder(name);
}

function dataUriToBlob(dataUri, fileName) {
  const parts = dataUri.split(",");
  const contentType = parts[0].split(":")[1].split(";")[0];
  const decodedData = Utilities.base64Decode(parts[1]);
  return Utilities.newBlob(decodedData, contentType, fileName);
}

function sanitizeFilename(name) {
  return name.replace(/[^a-zA-Z0-9_-]/g, "_").substring(0, 30);
}