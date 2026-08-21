/*
  Code.gs
  -------
  हा कोड Google Apps Script (script.google.com) मध्ये पेस्ट करायचा आहे.
  सेटअप स्टेप्स README.md मध्ये दिल्या आहेत.

  कार्यपद्धती:
  - प्रत्येक युजर संकेतांकासाठी एक स्वतंत्र Google Sheet फाईल तयार होते
    (नाव: "बजेट_2026-27_<user>"), आणि ती सर्व FOLDER_ID फोल्डरमध्ये साठवली जाते.
  - त्या फाईलमध्ये प्रत्येक Annex साठी एक वेगळी टॅब (sheet) असते.
  - टॅबची रचना: Row1 = column keys (तांत्रिक, लपवलेली), Row2 = column labels (माणसाला वाचण्यासाठी),
    Row3 पासून पुढे = प्रत्यक्ष भरलेला डेटा.
*/

// ⚠️ इथे तुमच्या Google Drive मधील त्या फोल्डरची ID टाका, जिथे सर्व युजर्सच्या शीट्स सेव्ह व्हाव्यात.
// फोल्डर उघडा -> URL मधील शेवटचा भाग (folders/ नंतरचा भाग) कॉपी करा.
const FOLDER_ID = "PASTE_YOUR_GOOGLE_DRIVE_FOLDER_ID_HERE";

// ⚠️ "User Management" Google Sheet ची ID (User Name / Password कॉलम असलेली शीट)
const USERS_SHEET_ID = "1kPrS2B4MENE7zpyxObeeWOrmzZiTXDp0XVgrXtlbOD0";
const MASTER_USERNAME = "Master";

// प्रत्येक Annex चा प्रकार — consolidate करताना वापरण्यासाठी (config.js शी जुळणारे असावे)
const ANNEX_TYPES = {
  annex1: "fixed", annex1a: "dynamic", annex1b: "dynamic",
  annex2: "fixed", annex2a: "fixed", annex2b: "dynamic",
  annex3: "dynamic", annex3a: "dynamic", annex4: "keyvalue",
  annex5: "fixed", annex6: "dynamic", annex7: "fixed",
};

function doPost(e) {
  try {
    const req = JSON.parse(e.postData.contents);
    let result;
    if (req.action === "save") {
      result = saveAnnex(req);
    } else if (req.action === "loadAll") {
      result = loadAllData(req);
    } else if (req.action === "login") {
      result = loginUser(req);
    } else if (req.action === "listUsers") {
      result = listUsers();
    } else if (req.action === "consolidate") {
      result = consolidateAll();
    } else {
      result = { ok: false, error: "अज्ञात action: " + req.action };
    }
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({ ok: true, message: "Budget form API चालू आहे." }))
    .setMimeType(ContentService.MimeType.JSON);
}

function getOrCreateUserSpreadsheet(user) {
  const folder = DriveApp.getFolderById(FOLDER_ID);
  const fileName = "बजेट_2026-27_" + user;
  const files = folder.getFilesByName(fileName);
  if (files.hasNext()) {
    return SpreadsheetApp.open(files.next());
  }
  const ss = SpreadsheetApp.create(fileName);
  const file = DriveApp.getFileById(ss.getId());
  folder.addFile(file);
  // Apps Script डिफॉल्ट रूट फोल्डरमधून काढून टाकतो (फक्त निवडलेल्या फोल्डरमध्ये राहावी म्हणून)
  DriveApp.getRootFolder().removeFile(file);
  // डिफॉल्ट "Sheet1" काढून टाकतो, आपण annex-निहाय टॅब तयार करू
  const defaultSheet = ss.getSheets()[0];
  defaultSheet.setName("माहिती");
  return ss;
}

function getOrCreateAnnexSheet(ss, annexId, annexTitle) {
  let sheet = ss.getSheetByName(annexId);
  if (!sheet) {
    sheet = ss.insertSheet(annexId);
  }
  return sheet;
}

function saveAnnex(req) {
  const { user, annexId, annexTitle, annexType, columns, fields, data } = req;
  if (!user) return { ok: false, error: "युजर संकेतांक दिलेला नाही." };
  const ss = getOrCreateUserSpreadsheet(user);
  const sheet = getOrCreateAnnexSheet(ss, annexId, annexTitle);
  sheet.clearContents();

  const colDefs = annexType === "keyvalue" ? fields : columns;
  const keys = colDefs.map(c => c.key);
  const labels = colDefs.map(c => c.label);

  sheet.getRange(1, 1, 1, keys.length).setValues([keys]);
  sheet.getRange(2, 1, 1, labels.length).setValues([labels]);
  sheet.getRange(1, 1, 2, keys.length).setFontWeight("bold");
  sheet.getRange(1, 1, 1, keys.length).setFontColor("#999999").setFontSize(8); // technical row, हलक्या रंगात
  sheet.setFrozenRows(2);

  const rows = data || [];
  if (rows.length) {
    const values = rows.map(r => keys.map(k => (r[k] !== undefined && r[k] !== null) ? r[k] : ""));
    sheet.getRange(3, 1, values.length, keys.length).setValues(values);
  }
  sheet.autoResizeColumns(1, keys.length);

  // शेवटी save झालेली वेळ ss च्या "माहिती" टॅबवर नोंदवतो
  const infoSheet = ss.getSheetByName("माहिती");
  if (infoSheet) {
    infoSheet.getRange(1, 1).setValue("युजर: " + user);
    infoSheet.getRange(2, 1).setValue("शेवटचे अपडेट: " + new Date().toLocaleString("mr-IN"));
  }

  return { ok: true };
}

function loadAllData(req) {
  const { user } = req;
  if (!user) return { ok: false, error: "युजर संकेतांक दिलेला नाही." };
  const folder = DriveApp.getFolderById(FOLDER_ID);
  const fileName = "बजेट_2026-27_" + user;
  const files = folder.getFilesByName(fileName);
  if (!files.hasNext()) {
    return { ok: false, error: "या युजरसाठी अजून काहीही सेव्ह केलेले नाही." };
  }
  const ss = SpreadsheetApp.open(files.next());
  const data = {};
  ss.getSheets().forEach(sheet => {
    const name = sheet.getName();
    if (name === "माहिती") return;
    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();
    if (lastRow < 3 || lastCol < 1) { data[name] = []; return; }
    const keys = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    const values = sheet.getRange(3, 1, lastRow - 2, lastCol).getValues();
    data[name] = values
      .filter(row => row.some(cell => cell !== "" && cell !== null))
      .map(row => {
        const obj = {};
        keys.forEach((k, i) => { obj[k] = row[i]; });
        return obj;
      });
  });
  return { ok: true, data };
}

/* ================= Users / Login ================= */

function getUsersList_() {
  const ss = SpreadsheetApp.openById(USERS_SHEET_ID);
  const sheet = ss.getSheets()[0];
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  const values = sheet.getRange(2, 1, lastRow - 1, 2).getValues(); // A: User Name, B: Password
  return values
    .filter(r => r[0])
    .map(r => ({ username: String(r[0]).trim(), password: String(r[1]).trim() }));
}

function loginUser(req) {
  const { username, password } = req;
  if (!username || !password) return { ok: false, error: "युजरनेम/पासवर्ड रिकामे आहेत." };
  const users = getUsersList_();
  const match = users.find(u => u.username === username.trim() && u.password === password);
  if (!match) return { ok: false, error: "युजरनेम किंवा पासवर्ड चुकीचा आहे." };
  const role = match.username === MASTER_USERNAME ? "master" : "user";
  return { ok: true, username: match.username, role };
}

function listUsers() {
  const users = getUsersList_().filter(u => u.username !== MASTER_USERNAME);
  const folder = DriveApp.getFolderById(FOLDER_ID);
  const result = users.map(u => {
    const fileName = "बजेट_2026-27_" + u.username;
    const files = folder.getFilesByName(fileName);
    if (files.hasNext()) {
      const file = files.next();
      return { username: u.username, hasData: true, lastUpdated: file.getLastUpdated().toLocaleString("mr-IN") };
    }
    return { username: u.username, hasData: false, lastUpdated: "" };
  });
  return { ok: true, users: result };
}

/* ================= एकत्रीकरण (Consolidate) ================= */

function consolidateAll() {
  const users = getUsersList_().filter(u => u.username !== MASTER_USERNAME).map(u => u.username);
  const folder = DriveApp.getFolderById(FOLDER_ID);

  // प्रत्येक युजरची स्प्रेडशीट उघडून ठेवतो (जी सापडेल तीच)
  const userSheets = {}; // username -> Spreadsheet
  users.forEach(u => {
    const files = folder.getFilesByName("बजेट_2026-27_" + u);
    if (files.hasNext()) userSheets[u] = SpreadsheetApp.open(files.next());
  });

  if (Object.keys(userSheets).length === 0) {
    return { ok: false, error: "अजून कोणत्याही युजरने डेटा भरलेला नाही." };
  }

  // Master स्प्रेडशीट तयार/उघडतो (वेगळ्या नावाने, यूजर-कोड सारखेच नामकरण वापरतो जेणेकरून
  // फ्रंटएंडच्या loadAll ने "Master" कोड टाकल्यास तीच फाईल उघडेल)
  const masterSS = getOrCreateUserSpreadsheet(MASTER_USERNAME);

  Object.keys(ANNEX_TYPES).forEach(annexId => {
    const type = ANNEX_TYPES[annexId];
    const sheet = getOrCreateAnnexSheet(masterSS, annexId);
    sheet.clearContents();

    // प्रत्येक युजरच्या sheet मधून raw values (keys सह) वाचतो
    const perUser = {}; // username -> {keys:[], rows: [[...]]}
    Object.keys(userSheets).forEach(u => {
      const uss = userSheets[u];
      const s = uss.getSheetByName(annexId);
      if (!s) return;
      const lastRow = s.getLastRow(), lastCol = s.getLastColumn();
      if (lastRow < 1 || lastCol < 1) return;
      const keys = s.getRange(1, 1, 1, lastCol).getValues()[0];
      let rows = [];
      if (lastRow >= 3) rows = s.getRange(3, 1, lastRow - 2, lastCol).getValues()
        .filter(row => row.some(c => c !== "" && c !== null));
      perUser[u] = { keys, rows };
    });

    const anyUser = Object.keys(perUser)[0];
    if (!anyUser) return;
    const keys = perUser[anyUser].keys;

    if (type === "fixed") {
      // row-index नुसार जुळवून, संख्या असलेले कॉलम बेरीज करतो; बाकी (लेबल) कॉलम पहिल्या युजरकडून घेतो
      const rowCount = Math.max(...Object.values(perUser).map(p => p.rows.length));
      const outRows = [];
      for (let i = 0; i < rowCount; i++) {
        const outRow = keys.map((k, colIdx) => {
          let sum = 0, sawNumber = false, textVal = "";
          Object.values(perUser).forEach(p => {
            const cell = p.rows[i] ? p.rows[i][colIdx] : "";
            const n = parseFloat(cell);
            if (cell !== "" && !isNaN(n)) { sum += n; sawNumber = true; }
            else if (cell !== "" && !textVal) { textVal = cell; }
          });
          return sawNumber ? sum : textVal;
        });
        outRows.push(outRow);
      }
      sheet.getRange(1, 1, 1, keys.length).setValues([keys]).setFontWeight("bold");
      if (outRows.length) sheet.getRange(3, 1, outRows.length, keys.length).setValues(outRows);
    } else {
      // dynamic किंवा keyvalue: सर्व युजर्सच्या ओळी एकत्र करतो, "srcUser"/पहिल्या कॉलममध्ये युजरनेम भरतो
      const srcUserIdx = keys.indexOf("srcUser");
      const outRows = [];
      Object.keys(perUser).forEach(u => {
        perUser[u].rows.forEach(row => {
          const copy = row.slice();
          if (srcUserIdx >= 0) copy[srcUserIdx] = u;
          outRows.push(copy);
        });
      });
      if (type === "keyvalue") {
        // keyvalue: प्रत्येक युजरची एक ओळ, पहिल्या कॉलमला "युजर" जोडतो
        const outKeys = ["srcUser"].concat(keys);
        sheet.getRange(1, 1, 1, outKeys.length).setValues([outKeys]).setFontWeight("bold");
        const kvRows = Object.keys(perUser).map(u => {
          const valRow = perUser[u].rows[0] || keys.map(() => "");
          return [u].concat(valRow);
        });
        if (kvRows.length) sheet.getRange(3, 1, kvRows.length, outKeys.length).setValues(kvRows);
      } else {
        sheet.getRange(1, 1, 1, keys.length).setValues([keys]).setFontWeight("bold");
        if (outRows.length) sheet.getRange(3, 1, outRows.length, keys.length).setValues(outRows);
      }
    }
    sheet.setFrozenRows(2);
  });

  const infoSheet = masterSS.getSheetByName("माहिती");
  if (infoSheet) {
    infoSheet.getRange(1, 1).setValue("युजर: " + MASTER_USERNAME + " (एकत्रित)");
    infoSheet.getRange(2, 1).setValue("शेवटचे एकत्रीकरण: " + new Date().toLocaleString("mr-IN"));
    infoSheet.getRange(3, 1).setValue("समाविष्ट युजर्स: " + Object.keys(userSheets).join(", "));
  }

  return { ok: true, includedUsers: Object.keys(userSheets) };
}
