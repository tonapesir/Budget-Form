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

function composeUserKey_(username, head, budgetType) {
  const typeCode = budgetType === "yearly" ? "Yearly" : "4Month";
  return username + "_" + head + "_" + typeCode;
}

/* ================= Users / Login (DDO कोड आधारित) ================= */
// USERS_SHEET_ID मधील अपेक्षित कॉलम्स (row1 हेडर):
// A: डी.डी.कोड/ User Name | B: Password | C: कार्यालयाचे नाव | D: Allow Head | E: Actual Head | F: Type Of Budget (वापरले जात नाही)

function getUsersList_() {
  const ss = SpreadsheetApp.openById(USERS_SHEET_ID);
  const sheet = ss.getSheets()[0];
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  const values = sheet.getRange(2, 1, lastRow - 1, 5).getValues();
  return values
    .filter(r => r[0] !== "" && r[0] !== null)
    .map(r => ({
      username: String(r[0]).trim(),
      password: String(r[1]).trim(),
      officeName: String(r[2] || "").trim(),
      allowHead: String(r[3] || "").trim(),
      actualHead: String(r[4] || "").trim(),
    }));
}

function loginUser(req) {
  const { username, password } = req;
  if (!username || !password) return { ok: false, error: "युजरनेम/पासवर्ड रिकामे आहेत." };
  const uname = username.trim();
  const rows = getUsersList_().filter(u => u.username === uname && u.password === password);
  if (!rows.length) return { ok: false, error: "युजरनेम किंवा पासवर्ड चुकीचा आहे." };

  if (uname === MASTER_USERNAME) {
    return { ok: true, username: uname, role: "master" };
  }

  // या DDO कोडाला परवानगी असलेले सर्व Head (डुप्लिकेट काढून)
  const seen = {};
  const heads = [];
  rows.forEach(r => {
    if (!r.allowHead || seen[r.allowHead]) return;
    seen[r.allowHead] = true;
    heads.push({ allowHead: r.allowHead, actualHead: r.actualHead || r.allowHead });
  });

  return {
    ok: true,
    username: uname,
    role: "user",
    officeName: rows[0].officeName,
    heads: heads,
  };
}

function listUsers() {
  const rows = getUsersList_().filter(u => u.username !== MASTER_USERNAME && u.allowHead);
  const folder = DriveApp.getFolderById(FOLDER_ID);
  const fileCache = {}; // fileName -> file (किंवा null)

  function statusFor(username, head, budgetType) {
    const key = composeUserKey_(username, head, budgetType);
    const fileName = "बजेट_2026-27_" + key;
    if (!(fileName in fileCache)) {
      const files = folder.getFilesByName(fileName);
      fileCache[fileName] = files.hasNext() ? files.next() : null;
    }
    const file = fileCache[fileName];
    return file ? { hasData: true, lastUpdated: file.getLastUpdated().toLocaleString("mr-IN") }
                : { hasData: false, lastUpdated: "" };
  }

  const entries = rows.map(u => ({
    username: u.username,
    officeName: u.officeName,
    allowHead: u.allowHead,
    actualHead: u.actualHead,
    status4Month: statusFor(u.username, u.allowHead, "4month"),
    statusYearly: statusFor(u.username, u.allowHead, "yearly"),
  }));

  return { ok: true, entries };
}

/* ================= एकत्रीकरण (Consolidate) ================= */

function consolidateAll() {
  const rows = getUsersList_().filter(u => u.username !== MASTER_USERNAME && u.allowHead);
  if (!rows.length) return { ok: false, error: "Users शीटमध्ये DDO/Head माहिती सापडली नाही." };
  const folder = DriveApp.getFolderById(FOLDER_ID);
  const budgetTypes = ["4month", "yearly"];

  // गट तयार करतो: head -> { "4month": [usernames...], "yearly": [usernames...] }
  const headsMap = {};
  rows.forEach(r => {
    if (!headsMap[r.allowHead]) headsMap[r.allowHead] = new Set();
    headsMap[r.allowHead].add(r.username);
  });

  const masterSS = getOrCreateUserSpreadsheet(MASTER_USERNAME);
  const groupsProcessed = [];

  Object.keys(headsMap).forEach(head => {
    const usernames = Array.from(headsMap[head]);
    budgetTypes.forEach(budgetType => {
      // या (head, budgetType) गटातील ज्या DDO नी प्रत्यक्ष डेटा भरला आहे तेवढेच स्प्रेडशीट उघडतो
      const userSheets = {};
      usernames.forEach(u => {
        const key = composeUserKey_(u, head, budgetType);
        const files = folder.getFilesByName("बजेट_2026-27_" + key);
        if (files.hasNext()) userSheets[u] = SpreadsheetApp.open(files.next());
      });
      if (Object.keys(userSheets).length === 0) return; // या गटात अजून कोणीही भरलेले नाही

      const suffix = "H" + head + "_" + (budgetType === "yearly" ? "Y" : "4M");
      consolidateGroup_(masterSS, userSheets, suffix);
      groupsProcessed.push(head + " / " + (budgetType === "yearly" ? "वार्षिक" : "चारमाही") +
        " (" + Object.keys(userSheets).length + " कार्यालये)");
    });
  });

  const infoSheet = masterSS.getSheetByName("माहिती");
  if (infoSheet) {
    infoSheet.getRange(1, 1).setValue("युजर: " + MASTER_USERNAME + " (एकत्रित)");
    infoSheet.getRange(2, 1).setValue("शेवटचे एकत्रीकरण: " + new Date().toLocaleString("mr-IN"));
    infoSheet.getRange(3, 1).setValue("गट: " + groupsProcessed.join(" | "));
  }

  if (!groupsProcessed.length) return { ok: false, error: "अजून कोणत्याही DDO ने डेटा भरलेला नाही." };
  return { ok: true, groups: groupsProcessed };
}

// एका (Head + Budget Type) गटातील सर्व DDO चा डेटा एकत्र करून masterSS मध्ये "<annexId>_<suffix>" टॅबमध्ये लिहितो
function consolidateGroup_(masterSS, userSheets, suffix) {
  Object.keys(ANNEX_TYPES).forEach(annexId => {
    const type = ANNEX_TYPES[annexId];
    const tabName = (annexId + "_" + suffix).substring(0, 99); // Google Sheets tab नाव मर्यादा
    const sheet = getOrCreateAnnexSheet(masterSS, tabName);
    sheet.clearContents();

    const perUser = {};
    Object.keys(userSheets).forEach(u => {
      const s = userSheets[u].getSheetByName(annexId);
      if (!s) return;
      const lastRow = s.getLastRow(), lastCol = s.getLastColumn();
      if (lastRow < 1 || lastCol < 1) return;
      const keys = s.getRange(1, 1, 1, lastCol).getValues()[0];
      let vals = [];
      if (lastRow >= 3) vals = s.getRange(3, 1, lastRow - 2, lastCol).getValues()
        .filter(row => row.some(c => c !== "" && c !== null));
      perUser[u] = { keys, rows: vals };
    });

    const anyUser = Object.keys(perUser)[0];
    if (!anyUser) return;
    const keys = perUser[anyUser].keys;

    if (type === "fixed") {
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
    } else if (type === "keyvalue") {
      const outKeys = ["srcUser"].concat(keys);
      sheet.getRange(1, 1, 1, outKeys.length).setValues([outKeys]).setFontWeight("bold");
      const kvRows = Object.keys(perUser).map(u => {
        const valRow = perUser[u].rows[0] || keys.map(() => "");
        return [u].concat(valRow);
      });
      if (kvRows.length) sheet.getRange(3, 1, kvRows.length, outKeys.length).setValues(kvRows);
    } else {
      const srcUserIdx = keys.indexOf("srcUser");
      const outRows = [];
      Object.keys(perUser).forEach(u => {
        perUser[u].rows.forEach(row => {
          const copy = row.slice();
          if (srcUserIdx >= 0) copy[srcUserIdx] = u;
          outRows.push(copy);
        });
      });
      sheet.getRange(1, 1, 1, keys.length).setValues([keys]).setFontWeight("bold");
      if (outRows.length) sheet.getRange(3, 1, outRows.length, keys.length).setValues(outRows);
    }
    sheet.setFrozenRows(2);
  });
}
