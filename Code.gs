// GOOGLE APPS SCRIPT BACKEND API
const SPREADSHEET_ID = "1HdgiIIYL--Ex7I7Hu_nhPadOHfYr4YG15lo7_knfSw4";
const DRIVE_FOLDER_ID = "1aDoQrGklEhmFUdCfj1sz09vCdFZVM0Ni";

function doGet(e) {
  const action = e ? e.parameter.action : null;
  if (action === 'getTeachers') {
    return handleGetTeachers();
  }
  return ContentService.createTextOutput(JSON.stringify({success: false, message: 'Invalid Action'}))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    return handleSaveOPR(data);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({status: 'error', message: err.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// 1. Ambil Senarai Guru (Status = Aktif) dari sheet SENARAI_GURU
function handleGetTeachers() {
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = ss.getSheetByName("SENARAI_GURU");
    
    if (!sheet) {
      return ContentService.createTextOutput(JSON.stringify({
        success: false, 
        message: "Sheet 'SENARAI_GURU' tidak dijumpai."
      })).setMimeType(ContentService.MimeType.JSON);
    }

    const data = sheet.getDataRange().getValues();
    const teachers = [];
    
    // Langkau Baris Tajuk / Header (i = 1)
    for (let i = 1; i < data.length; i++) {
      const nama = data[i][1];
      const status = data[i][2];
      
      // Semakan lebih fleksibel: buang jarak kosong & abaikan saiz huruf (aktif/Aktif/AKTIF)
      if (status && String(status).trim().toLowerCase() === "aktif" && nama) {
        teachers.push(String(nama).trim());
      }
    }

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      teachers: teachers
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// 2. Simpan Rekod PLC & Gambar ke Google Drive + Spreadsheet
function handleSaveOPR(data) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let dbSheet = ss.getSheetByName("PLC_OPR_DATABASE");
    if (!dbSheet) {
      dbSheet = ss.insertSheet("PLC_OPR_DATABASE");
      dbSheet.appendRow([
        "OPR ID", "Timestamp", "Strategi", "Tajuk", "Tarikh", "Masa Mula", "Masa Tamat", 
        "Tempat", "Kumpulan", "Ketua", "Ahli", "Disediakan Oleh", "Isu", "Objektif", 
        "Pelaksanaan", "Impak", "Tindakan", "Image 1 URL", "Image 2 URL", "Image 3 URL", "Image 4 URL"
      ]);
    }

    const todayStr = Utilities.formatDate(new Date(), "GMT+8", "yyyyMMdd");
    const lastRow = dbSheet.getLastRow();
    const oprId = "OPR-PLC-" + todayStr + "-" + String(lastRow).padStart(4, '0');

    const mainFolder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
    const imgFolder = getOrCreateSubfolder(mainFolder, "IMAGES");

    const imageUrls = ["", "", "", ""];
    if (data.images && data.images.length > 0) {
      data.images.forEach((imgBase64, idx) => {
        if (imgBase64) {
          const blob = Utilities.newBlob(
            Utilities.base64Decode(imgBase64.split(',')[1]),
            'image/jpeg',
            `${oprId}_IMG${idx + 1}.jpg`
          );
          const file = imgFolder.createFile(blob);
          file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
          imageUrls[idx] = file.getUrl();
        }
      });
    }

    dbSheet.appendRow([
      oprId,
      new Date(),
      data.strategi,
      data.tajuk,
      data.tarikh,
      data.masaMula,
      data.masaTamat,
      data.tempat,
      data.kumpulan,
      data.ketua,
      Array.isArray(data.ahli) ? data.ahli.join(", ") : data.ahli,
      data.disediakan,
      data.isu,
      data.objektif,
      data.pelaksanaan,
      data.impak,
      data.tindakan,
      imageUrls[0],
      imageUrls[1],
      imageUrls[2],
      imageUrls[3]
    ]);

    lock.releaseLock();

    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      message: 'OPR berjaya disimpan',
      oprId: oprId,
      imageUrls: imageUrls
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    lock.releaseLock();
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function getOrCreateSubfolder(parent, folderName) {
  const folders = parent.getFoldersByName(folderName);
  if (folders.hasNext()) {
    return folders.next();
  } else {
    return parent.createFolder(folderName);
  }
}
