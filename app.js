/*
  app.js
  ------
  हे config.js मधील ANNEX_CONFIG वाचून आपोआप सर्व 13 Annex चे फॉर्म तयार करते.
  Google Apps Script Web App शी बोलण्यासाठी खालील API_URL बदला (Code.gs Deploy केल्यावर
  मिळणारी Web App URL इथे टाका).
*/

// ⚠️ इथे तुमची Apps Script Web App URL टाका (README.md मध्ये स्टेप्स दिले आहेत)
const API_URL = "https://script.google.com/macros/s/AKfycbzqmbPQfXPC5QzmetZp2nTgVIdPzzTDFGrYSoqMXJkJ-wwAYynj3itnE7PGoSPqvIul7A/exec";

let currentUser = null;       // DDO कोड / युजरनेम
let currentRole = null;       // "user" किंवा "master"
let currentOfficeName = null;
let currentHead = null;
let currentActualHead = null;
let currentBudgetType = null; // "4month" किंवा "yearly"
let availableHeads = [];      // लॉगिनमधून मिळालेली या युजरची Allow Head यादी

// युजर + हेड + बजेट-प्रकार यांच्यावरून सेव्ह/लोडसाठी वापरायचा एकच "संकेतांक" (Code.gs मधील तर्क याच पद्धतीने जुळवलेला आहे)
function composeUserKey(username, head, budgetType) {
  const typeCode = budgetType === "yearly" ? "Yearly" : "4Month";
  return `${username}_${head}_${typeCode}`;
}

// प्रत्येक annexId साठी सध्याचा data (rows किंवा keyvalue) इथे मेमरीत ठेवतो
const state = {};

function init() {
  const tabsEl = document.getElementById("tabs");
  const panelsEl = document.getElementById("panels");

  ANNEX_CONFIG.forEach((annex, idx) => {
    // Tab बटण
    const tabBtn = document.createElement("button");
    tabBtn.className = "tab-btn" + (idx === 0 ? " active" : "");
    tabBtn.textContent = annex.title.split(":")[0].trim();
    tabBtn.onclick = () => showTab(annex.id);
    tabBtn.id = "tabbtn-" + annex.id;
    tabsEl.appendChild(tabBtn);

    // Panel
    const panel = document.createElement("div");
    panel.className = "panel" + (idx === 0 ? " active" : "");
    panel.id = "panel-" + annex.id;
    panel.innerHTML = renderAnnexShell(annex);
    panelsEl.appendChild(panel);

    state[annex.id] = annex.type === "keyvalue" ? {} : (annex.rows ? deepCopyRows(annex.rows) : []);
    renderAnnexBody(annex);
  });

  document.getElementById("loadBtn").onclick = loadAllData;
  document.getElementById("summaryBtn").onclick = showSummary;
}

function deepCopyRows(rows) {
  return rows.map(r => ({ ...r }));
}

function renderAnnexShell(annex) {
  let html = `<h2>${annex.title}</h2>`;
  if (annex.type === "keyvalue") {
    html += `<div class="kv-form" id="body-${annex.id}"></div>`;
  } else {
    html += `<div class="table-wrap"><table id="body-${annex.id}"></table></div>`;
    if (annex.type === "dynamic") {
      html += `<button class="add-row-btn" onclick="addRow('${annex.id}')">+ ${annex.addRowLabel || "नवीन ओळ जोडा"}</button>`;
    }
  }
  html += `<div class="panel-actions">
      <button class="save-btn" onclick="saveAnnex('${annex.id}')">💾 ही शीट जतन करा</button>
      <span class="save-status" id="status-${annex.id}"></span>
    </div>`;
  return html;
}

function renderAnnexBody(annex) {
  if (annex.type === "keyvalue") {
    const container = document.getElementById(`body-${annex.id}`);
    container.innerHTML = "";
    const data = state[annex.id];
    annex.fields.forEach(f => {
      const row = document.createElement("div");
      row.className = "kv-row";
      const inputTag = f.type === "textarea" ? "textarea" : "input";
      row.innerHTML = `<label>${f.label}</label>
        <${inputTag} data-field="${f.key}"></${inputTag}>`;
      container.appendChild(row);
      const inputEl = row.querySelector(`[data-field="${f.key}"]`);
      inputEl.value = data[f.key] || "";
      inputEl.addEventListener("input", () => { state[annex.id][f.key] = inputEl.value; });
    });
    return;
  }

  const table = document.getElementById(`body-${annex.id}`);
  table.innerHTML = "";
  const thead = document.createElement("thead");
  const headRow = document.createElement("tr");
  annex.columns.forEach(c => {
    const th = document.createElement("th");
    th.textContent = c.label;
    if (c.width) th.style.width = c.width;
    headRow.appendChild(th);
  });
  if (annex.type === "dynamic") headRow.appendChild(document.createElement("th")); // हटवा column
  thead.appendChild(headRow);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  tbody.id = `tbody-${annex.id}`;
  table.appendChild(tbody);

  state[annex.id].forEach((row, i) => renderRow(annex, row, i));
  recalcAnnex(annex);
}

function renderRow(annex, row, index) {
  const tbody = document.getElementById(`tbody-${annex.id}`);
  const tr = document.createElement("tr");
  if (row.isSectionHeader) tr.className = "section-header";
  if (row.isSubtotal) tr.className = "subtotal-row";
  if (row.isTotalRow) tr.className = "total-row";
  tr.id = `row-${annex.id}-${index}`;

  annex.columns.forEach(c => {
    const td = document.createElement("td");
    const isSummedCell = row.sumRows && c.editable && c.type === "number";
    if (c.auto === "serial") {
      td.textContent = index + 1;
    } else if (c.formula || isSummedCell) {
      // sूत्र-आधारित किंवा उभी-बेरीज (sumRows) असलेला सेल — फक्त वाचनीय, id देऊन ठेवतो जेणेकरून recalcAnnex अपडेट करू शकेल
      td.id = `cell-${annex.id}-${index}-${c.key}`;
      td.className = "computed-cell";
      td.textContent = "";
    } else if (!c.editable) {
      td.textContent = row[c.key] || "";
    } else {
      const inp = document.createElement("input");
      inp.type = c.type === "number" ? "number" : "text";
      inp.step = "any";
      inp.value = row[c.key] != null ? row[c.key] : "";
      inp.addEventListener("input", () => {
        row[c.key] = inp.value;
        recalcAnnex(annex);
      });
      td.appendChild(inp);
    }
    tr.appendChild(td);
  });

  if (annex.type === "dynamic") {
    const td = document.createElement("td");
    const btn = document.createElement("button");
    btn.textContent = "✕";
    btn.className = "del-row-btn";
    btn.onclick = () => removeRow(annex.id, index);
    td.appendChild(btn);
    tr.appendChild(td);
  }

  tbody.appendChild(tr);
}

// सर्व rows वरून-खाली या क्रमाने पुन्हा मोजतो — म्हणजे उपबेरीज (sumRows) आधीच्या ओळींवर अवलंबून
// राहू शकते व पुढच्या मोठ्या बेरजेत (grand total) वापरली जाऊ शकते. फक्त वाचनीय सेलचा मजकूर अपडेट
// होतो — input फिल्ड्स पुन्हा तयार होत नाहीत, त्यामुळे टायपिंग करताना फोकस सुटत नाही.
function recalcAnnex(annex) {
  if (annex.type === "keyvalue") return;
  const rows = state[annex.id];

  rows.forEach(row => {
    if (row.sumRows) {
      annex.columns.forEach(c => {
        if (c.editable && c.type === "number") {
          let sum = 0;
          row.sumRows.forEach(j => { if (rows[j]) sum += num(rows[j][c.key]); });
          row[c.key] = sum;
        }
      });
    }
  });

  rows.forEach(row => {
    annex.columns.forEach(c => {
      if (c.formula) row[c.key + "_computed"] = c.formula(row);
    });
  });

  rows.forEach((row, i) => {
    annex.columns.forEach(c => {
      const el = document.getElementById(`cell-${annex.id}-${i}-${c.key}`);
      if (!el) return;
      if (c.formula) el.textContent = formatNum(row[c.key + "_computed"]);
      else el.textContent = formatNum(row[c.key]);
    });
  });
}

function formatNum(v) {
  if (v === "" || v === undefined || v === null || isNaN(v)) return "";
  return Number(v).toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

function addRow(annexId) {
  const annex = ANNEX_CONFIG.find(a => a.id === annexId);
  const newRow = {};
  annex.columns.forEach(c => { if (c.key !== "sr") newRow[c.key] = ""; });
  state[annexId].push(newRow);
  renderAnnexBody(annex);
}

function removeRow(annexId, index) {
  state[annexId].splice(index, 1);
  const annex = ANNEX_CONFIG.find(a => a.id === annexId);
  renderAnnexBody(annex);
}

function showTab(annexId) {
  document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
  document.querySelectorAll(".panel").forEach(p => p.classList.remove("active"));
  document.getElementById("tabbtn-" + annexId).classList.add("active");
  document.getElementById("panel-" + annexId).classList.add("active");
}

function getUserCode() {
  if (currentRole === "user") return composeUserKey(currentUser, currentHead, currentBudgetType);
  const code = document.getElementById("userCode").value.trim();
  if (!code) {
    alert("कृपया आधी युजर संकेतांक (User Code) टाका.");
    return null;
  }
  return code;
}

async function apiCall(payload) {
  if (API_URL.includes("PASTE_YOUR")) {
    alert("आधी app.js मध्ये API_URL सेट करा (README.md पहा).");
    return null;
  }
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" }, // Apps Script CORS साठी text/plain वापरतो
    body: JSON.stringify(payload),
  });
  return res.json();
}

function buildSavePayloadData(annex) {
  if (annex.type === "keyvalue") return [state[annex.id]];
  // computed column चे मूल्य त्याच्याच key खाली भरतो, म्हणजे Google Sheet मध्ये वाचता येईल
  return state[annex.id].map(row => {
    const out = { ...row };
    annex.columns.forEach(c => {
      if (c.formula) out[c.key] = row[c.key + "_computed"] != null ? row[c.key + "_computed"] : c.formula(row);
    });
    return out;
  });
}

async function saveAnnex(annexId) {
  const user = getUserCode();
  if (!user) return;
  const statusEl = document.getElementById(`status-${annexId}`);
  statusEl.textContent = "जतन करत आहे...";
  const annex = ANNEX_CONFIG.find(a => a.id === annexId);
  try {
    const result = await apiCall({
      action: "save",
      user,
      annexId,
      annexTitle: annex.title,
      annexType: annex.type,
      columns: annex.type !== "keyvalue" ? annex.columns.map(c => ({ key: c.key, label: c.label })) : null,
      fields: annex.type === "keyvalue" ? annex.fields.map(f => ({ key: f.key, label: f.label })) : null,
      data: buildSavePayloadData(annex),
    });
    if (result && result.ok) {
      statusEl.textContent = "✅ जतन झाले (" + new Date().toLocaleTimeString("mr-IN") + ")";
    } else {
      statusEl.textContent = "❌ त्रुटी: " + (result ? result.error : "अज्ञात");
    }
  } catch (e) {
    statusEl.textContent = "❌ त्रुटी: " + e.message;
  }
}

async function loadAllData() {
  const user = getUserCode();
  if (!user) return;
  // टीप: इथे currentUser ला 'user' (composite key) असाइन करत नाही — currentUser नेहमी
  // लॉगिन युजरनेमच राहायला हवा, नाहीतर पुढच्या प्रत्येक सेव्ह/लोडमध्ये composeUserKey पुन:पुन्हा
  // लागू होऊन "...._22020271_4Month_22020271_4Month" सारखी चुकीची डबल-की तयार होते.
  const btn = document.getElementById("loadBtn");
  btn.disabled = true;
  btn.textContent = "उघडत आहे...";
  try {
    const result = await apiCall({ action: "loadAll", user });
    if (result && result.ok) {
      ANNEX_CONFIG.forEach(annex => {
        const saved = result.data[annex.id];
        if (saved && saved.length) {
          if (annex.type === "keyvalue") {
            state[annex.id] = saved[0] || {};
          } else if (annex.type === "fixed") {
            // fixed rows: जुना क्रम कायम ठेवून saved मधील मूल्ये मूळ rows वर बसवतो
            state[annex.id] = annex.rows.map((r, i) => ({ ...r, ...(saved[i] || {}) }));
          } else {
            state[annex.id] = saved;
          }
        }
        renderAnnexBody(annex);
      });
      alert("✅ " + user + " यांचा आधीचा भरलेला डेटा उघडला गेला.");
    } else {
      alert("या युजर कोडसाठी आधीचा डेटा सापडला नाही (नवीन एंट्री म्हणून सुरू करा) किंवा त्रुटी: " + (result ? result.error : ""));
    }
  } catch (e) {
    alert("त्रुटी: " + e.message);
  } finally {
    btn.disabled = false;
    btn.textContent = "📂 आधीचा डेटा उघडा";
  }
}

function showSummary() {
  const user = getUserCode();
  if (!user) return;
  const box = document.getElementById("summaryBox");
  box.style.display = "block";
  // सध्या स्क्रीनवर भरलेल्या/उघडलेल्या (state मधील) डेटावरून एकूण मोजतो.
  // सर्वात आधी "आधीचा डेटा उघडा" दाबून जुना जतन केलेला डेटा लोड करून घ्या, म्हणजे तो पण मोजला जाईल.
  let html = `<h3>${user} — सद्यस्थिती एकूण रक्कम (सध्या स्क्रीनवरील/उघडलेल्या डेटानुसार)</h3>
    <table class="summary-table"><tr><th>विवरणपत्र</th><th>एकूण (₹ हजारात)</th></tr>`;
  let grand = 0;
  ANNEX_CONFIG.forEach(annex => {
    if (!annex.summaryKey) return;
    let sum = 0;
    const rows = annex.type === "keyvalue" ? [] : state[annex.id];
    rows.forEach(r => {
      if (r.isSectionHeader || r.isSubtotal || r.isTotalRow) return; // डबल-काउंट टाळण्यासाठी
      sum += num(r[annex.summaryKey]);
    });
    grand += sum;
    html += `<tr><td>${annex.title}</td><td>${formatNum(sum)}</td></tr>`;
  });
  html += `<tr class="total-row"><td>एकूण बेरीज</td><td>${formatNum(grand)}</td></tr></table>
    <p style="font-size:12px;color:#64748b;margin-top:8px;">टीप: आधी "📂 आधीचा डेटा उघडा" दाबल्यास जतन केलेला संपूर्ण डेटा इथे मोजला जाईल.</p>`;
  box.innerHTML = html;
}

/* ================= लॉगिन व सेशन ================= */

function applyRoleUI() {
  document.getElementById("sessionUserLabel").textContent =
    `लॉगिन: ${currentUser}${currentRole === "master" ? " (मास्टर)" : ""}`;

  if (currentRole === "master") {
    document.getElementById("officeNameHeader").textContent = "चारमाही सुधारित अंदाजपत्रक 2026-27 — मास्टर";
    document.getElementById("headBudgetInfo").textContent = "सर्व DDO/कार्यालयांचा एकत्रित दृश्य";
    document.getElementById("masterDashboard").style.display = "block";
    document.getElementById("manualCodeControls").style.display = "inline";
    refreshUsersList();
    refreshConsolidatedGroups();
  } else {
    document.getElementById("officeNameHeader").textContent = currentOfficeName || currentUser;
    const headLabel = (currentActualHead && currentActualHead !== currentHead)
      ? `${currentHead} (प्रत्यक्ष हेड: ${currentActualHead})` : currentHead;
    document.getElementById("headBudgetInfo").textContent =
      `हेड: ${headLabel} | प्रकार: ${currentBudgetType === "yearly" ? "वार्षिक बजेट" : "चारमाही बजेट"}`;
    document.getElementById("masterDashboard").style.display = "none";
    document.getElementById("manualCodeControls").style.display = "none";
    loadAllData(); // लॉगिन होताच स्वतःचा आधीचा डेटा आपोआप उघडतो
  }
}

async function doLogin() {
  const user = document.getElementById("loginUser").value.trim();
  const pass = document.getElementById("loginPass").value;
  const errEl = document.getElementById("loginError");
  errEl.textContent = "";
  if (!user || !pass) { errEl.textContent = "युजरनेम व पासवर्ड दोन्ही टाका."; return; }

  const btn = document.getElementById("loginBtn");
  btn.disabled = true; btn.textContent = "तपासत आहे...";
  try {
    const result = await apiCall({ action: "login", username: user, password: pass });
    if (result && result.ok) {
      currentUser = result.username;
      currentRole = result.role;
      currentOfficeName = result.officeName || "";
      availableHeads = result.heads || [];
      document.getElementById("loginScreen").style.display = "none";

      if (currentRole === "master") {
        enterApp();
      } else {
        // सामान्य युजर -> आधी हेड + बजेट प्रकार निवडायला सांगतो
        document.getElementById("hbOfficeName").textContent = currentOfficeName;
        const sel = document.getElementById("headSelect");
        sel.innerHTML = "";
        availableHeads.forEach(h => {
          const opt = document.createElement("option");
          opt.value = h.allowHead;
          opt.dataset.actual = h.actualHead || h.allowHead;
          opt.textContent = (h.actualHead && h.actualHead !== h.allowHead)
            ? `${h.allowHead} (प्रत्यक्ष हेड: ${h.actualHead})` : h.allowHead;
          sel.appendChild(opt);
        });
        document.getElementById("headBudgetScreen").style.display = "flex";
      }
    } else {
      errEl.textContent = "❌ " + (result ? result.error : "युजरनेम किंवा पासवर्ड चुकीचा आहे.");
    }
  } catch (e) {
    errEl.textContent = "त्रुटी: " + e.message;
  } finally {
    btn.disabled = false; btn.textContent = "लॉगिन करा";
  }
}

function enterApp() {
  document.getElementById("headBudgetScreen").style.display = "none";
  document.getElementById("appRoot").style.display = "block";
  localStorage.setItem("budgetform_user", currentUser);
  localStorage.setItem("budgetform_role", currentRole);
  localStorage.setItem("budgetform_office", currentOfficeName || "");
  localStorage.setItem("budgetform_head", currentHead || "");
  localStorage.setItem("budgetform_actualhead", currentActualHead || "");
  localStorage.setItem("budgetform_budgettype", currentBudgetType || "");
  applyRoleUI();
}

function doLogout() {
  localStorage.removeItem("budgetform_user");
  localStorage.removeItem("budgetform_role");
  localStorage.removeItem("budgetform_office");
  localStorage.removeItem("budgetform_head");
  localStorage.removeItem("budgetform_actualhead");
  localStorage.removeItem("budgetform_budgettype");
  currentUser = null; currentRole = null; currentOfficeName = null;
  currentHead = null; currentActualHead = null; currentBudgetType = null;
  document.getElementById("appRoot").style.display = "none";
  document.getElementById("headBudgetScreen").style.display = "none";
  document.getElementById("loginScreen").style.display = "flex";
  document.getElementById("loginUser").value = "";
  document.getElementById("loginPass").value = "";
}

/* ================= मास्टर डॅशबोर्ड ================= */

let _usersListReqId = 0;
async function refreshUsersList() {
  const myReqId = ++_usersListReqId;
  const table = document.getElementById("usersTable");
  try {
    const result = await apiCall({ action: "listUsers" });
    if (myReqId !== _usersListReqId) return; // दरम्यान दुसरी नवीन विनंती सुरू झाली असेल तर ही जुनी विनंती दुर्लक्षित करतो
    table.innerHTML = "<tr><th>DDO कोड</th><th>कार्यालय</th><th>हेड</th><th>चारमाही</th><th>वार्षिक</th></tr>";
    if (!result || !result.ok) return;
    result.entries.forEach(u => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${u.username}</td><td>${u.officeName}</td><td>${u.allowHead}</td>`;
      ["fourMonth", "yearly"].forEach(typeKey => {
        const td = document.createElement("td");
        const st = typeKey === "fourMonth" ? u.status4Month : u.statusYearly;
        const label = st.hasData ? "✅" : "⏳";
        const btn = document.createElement("button");
        btn.className = "view-user-btn";
        btn.textContent = label + " पहा";
        btn.title = st.hasData ? ("शेवटचे: " + st.lastUpdated) : "अजून भरले नाही";
        btn.onclick = () => {
          document.getElementById("userCode").value =
            composeUserKey(u.username, u.allowHead, typeKey === "fourMonth" ? "4month" : "yearly");
          loadAllData();
        };
        td.appendChild(btn);
        tr.appendChild(td);
      });
      table.appendChild(tr);
    });
  } catch (e) { /* silent */ }
}

let _groupsReqId = 0;
async function refreshConsolidatedGroups() {
  const myReqId = ++_groupsReqId;
  const groupsTable = document.getElementById("groupsTable");
  const byTypeTable = document.getElementById("byTypeTable");
  const grandTable = document.getElementById("grandTotalTable");
  try {
    const result = await apiCall({ action: "listConsolidatedGroups" });
    if (myReqId !== _groupsReqId) return; // जुनी विनंती असल्यास दुर्लक्ष करतो
    groupsTable.innerHTML = "<tr><th>लेखाशीर्ष (Head)</th><th>बजेट प्रकार</th><th>शेवटचे अपडेट</th><th></th></tr>";
    byTypeTable.innerHTML = "<tr><th>बजेट प्रकार</th><th>शेवटचे अपडेट</th><th></th></tr>";
    grandTable.innerHTML = "<tr><th>शेवटचे अपडेट</th><th></th></tr>";
    if (!result || !result.ok) return;

    if (!result.groups.length) {
      groupsTable.innerHTML += `<tr><td colspan="4">अजून कोणतेही एकत्रीकरण झालेले नाही.</td></tr>`;
    }
    result.groups.forEach(g => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${g.head}</td>
        <td>${g.budgetType === "yearly" ? "वार्षिक बजेट" : "चारमाही बजेट"}</td>
        <td>${g.lastUpdated}</td><td></td>`;
      addViewButton(tr, g.key);
      groupsTable.appendChild(tr);
    });

    if (!result.byType.length) {
      byTypeTable.innerHTML += `<tr><td colspan="3">अजून कोणतेही एकत्रीकरण झालेले नाही.</td></tr>`;
    }
    result.byType.forEach(g => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${g.budgetType === "yearly" ? "वार्षिक बजेट (सर्व Head मिळून)" : "चारमाही बजेट (सर्व Head मिळून)"}</td>
        <td>${g.lastUpdated}</td><td></td>`;
      addViewButton(tr, g.key);
      byTypeTable.appendChild(tr);
    });

    if (result.grandTotal) {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${result.grandTotal.lastUpdated}</td><td></td>`;
      addViewButton(tr, result.grandTotal.key);
      grandTable.appendChild(tr);
    } else {
      grandTable.innerHTML += `<tr><td colspan="2">अजून कोणतेही एकत्रीकरण झालेले नाही.</td></tr>`;
    }
  } catch (e) { /* silent */ }
}

function addViewButton(tr, key) {
  const btn = document.createElement("button");
  btn.className = "view-user-btn";
  btn.textContent = "👁 पहा";
  btn.onclick = () => {
    document.getElementById("userCode").value = key;
    loadAllData();
  };
  tr.lastElementChild.appendChild(btn);
}

async function consolidateAll() {
  const statusEl = document.getElementById("consolidateStatus");
  statusEl.textContent = "एकत्रीकरण चालू आहे... थोडा वेळ लागू शकतो.";
  try {
    const result = await apiCall({ action: "consolidate" });
    if (result && result.ok) {
      statusEl.textContent = `✅ एकत्रीकरण पूर्ण झाले — ${result.groups.length} Head+प्रकार गट, ` +
        `${result.byType.length} प्रकार-निहाय एकत्रीकरण, व संपूर्ण एकत्रित बजेट तयार/अपडेट झाले.`;
      refreshConsolidatedGroups();
    } else {
      statusEl.textContent = "❌ त्रुटी: " + (result ? result.error : "अज्ञात");
    }
  } catch (e) {
    statusEl.textContent = "❌ त्रुटी: " + e.message;
  }
}

window.addEventListener("DOMContentLoaded", () => {
  init(); // form structure तयार करतो (लपलेल्या appRoot मध्ये)

  document.getElementById("loginBtn").onclick = doLogin;
  document.getElementById("loginPass").addEventListener("keydown", e => { if (e.key === "Enter") doLogin(); });
  document.getElementById("logoutBtn").onclick = doLogout;
  document.getElementById("refreshUsersBtn").onclick = refreshUsersList;
  document.getElementById("consolidateBtn").onclick = consolidateAll;
  document.getElementById("hbContinueBtn").onclick = () => {
    const sel = document.getElementById("headSelect");
    const opt = sel.options[sel.selectedIndex];
    if (!opt) { alert("कृपया हेड निवडा."); return; }
    currentHead = opt.value;
    currentActualHead = opt.dataset.actual;
    currentBudgetType = document.getElementById("budgetTypeSelect").value;
    enterApp();
  };

  // आधीच लॉगिन केलेले असल्यास (localStorage मध्ये) थेट आत घेऊन जातो
  const savedUser = localStorage.getItem("budgetform_user");
  const savedRole = localStorage.getItem("budgetform_role");
  if (savedUser && savedRole) {
    currentUser = savedUser;
    currentRole = savedRole;
    currentOfficeName = localStorage.getItem("budgetform_office") || "";
    currentHead = localStorage.getItem("budgetform_head") || "";
    currentActualHead = localStorage.getItem("budgetform_actualhead") || "";
    currentBudgetType = localStorage.getItem("budgetform_budgettype") || "4month";
    document.getElementById("loginScreen").style.display = "none";
    document.getElementById("appRoot").style.display = "block";
    applyRoleUI();
  }
});
