// ================================
// Tabs
// ================================
const tabs = document.querySelectorAll('.tab-pill');
const contents = document.querySelectorAll('.tab-content');

tabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    tabs.forEach((t) => t.classList.remove('active'));
    contents.forEach((c) => c.classList.remove('active'));
    tab.classList.add('active');
    const el = document.getElementById(tab.dataset.tab);
    if (el) el.classList.add('active');
  });
});

/* -----------------------------
   Backend API helpers
------------------------------ */
async function apiGet(url) {
  const res = await fetch(url, { credentials: 'same-origin' });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.success === false) throw new Error(json.error || 'Request failed');
  return json;
}

async function apiPostJson(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(body || {}),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.success === false) throw new Error(json.error || 'Request failed');
  return json;
}

let reports = []; // loaded from api/admin/reports_list.php
let stats = null; // loaded from api/admin/stats.php

// Settings demo data
let settingsCategories = [
  "Bullying/Harassment",
  "Safety Concerns",
  "Property Damage",
  "Discrimination",
  "Academic Misconduct",
  "Facilities Issue",
  "Technology/IT Issue",
  "Theft/Missing Items"
];

let settingsTags = [
  "Requires Follow-up",
  "Student Welfare",
  "Urgent Response",
  "Legal Review",
  "Counseling Needed",
  "Facilities Action",
  "IT Support",
  "Policy Violation",
  "Parent Contact",
  "Documentation Required"
];

let adminAssignments = [
  { name: "Dr. J. Smith (Dean of Students)", active: 5 },
  { name: "Prof. M. Johnson (Safety Officer)", active: 3 },
  { name: "Dr. K. Davis (Counseling Services)", active: 2 }
];


// ================================
// Elements
// ================================
const totalReportsEl = document.getElementById("totalReports");
const pendingReviewEl = document.getElementById("pendingReview");
const highPriorityCountEl = document.getElementById("highPriorityCount");
const resolutionRateEl = document.getElementById("resolutionRate");

const highPriorityListEl = document.getElementById("highPriorityList");
const workloadListEl = document.getElementById("workloadList");

const wkNewReportsEl = document.getElementById("wkNewReports");
const wkResolvedEl = document.getElementById("wkResolved");
const wkAvgRespEl = document.getElementById("wkAvgResp");

// Settings elements
const catSettingsList = document.getElementById("catSettingsList");
const tagSettingsList = document.getElementById("tagSettingsList");
const adminAssignList = document.getElementById("adminAssignList");
const addCategoryBtn = document.getElementById("addCategoryBtn");
const addTagBtn = document.getElementById("addTagBtn");
const saveAllSettingsBtn = document.getElementById("saveAllSettingsBtn");

const npEmail = document.getElementById("npEmail");
const npUrgent = document.getElementById("npUrgent");
const npDaily = document.getElementById("npDaily");
const npWeekly = document.getElementById("npWeekly");


// Top actions
const exportBtn = document.getElementById("exportBtn");
const logoutBtn = document.getElementById("logoutBtn");
const notifBtn = document.getElementById("notifBtn");
const notifDot = document.getElementById("notifDot");

// Modal
const modalBackdrop = document.getElementById("modalBackdrop");
const closeModalBtn = document.getElementById("closeModalBtn");
let selectedId = null;
let selectedReport = null;

// ================================
// Helpers
// ================================
function statusToChipClass(status){
  const s = String(status || "").toLowerCase();
  if (s.includes("pending")) return "pending";
  if (s.includes("review")) return "review";
  if (s.includes("progress")) return "progress";
  if (s.includes("resolved")) return "resolved";
  return "";
}

function elFromHTML(html){
  const div = document.createElement("div");
  div.innerHTML = html.trim();
  return div.firstChild;
}

function submittedByLabel(r) {
  const privacy = String(r.privacy || '').toLowerCase();
  if (privacy === 'anonymous') return 'Anonymous';
  return r.user_name || '—';
}

function formatMeta(r) {
  return `${submittedByLabel(r)} • ${r.date || ''}`;
}

function toReportId(n){
  return "#"+String(n).padStart(6,"0");
}
function priorityClass(p){
  if (p === "High") return "pri-high";
  if (p === "Medium") return "pri-medium";
  return "pri-low";
}
function statusClass(s){
  if (s === "Under Review") return "st-review";
  if (s === "Pending") return "st-pending";
  if (s === "In Progress") return "st-progress";
  if (s === "Resolved") return "st-resolved";
  return "";
}

// ================================
// Render
// ================================
function renderOverview() {
  const total = stats?.stats?.total ?? reports.length;
  const pendingReview = stats?.stats?.pending ?? reports.filter((r) => r.status === 'Pending' || r.status === 'Under Review' || r.status === 'Draft').length;
  const highPriority = stats?.stats?.high ?? reports.filter((r) => r.priority === 'High').length;
  const rate = stats?.stats?.resolution_rate ?? 0;

  if (totalReportsEl) totalReportsEl.textContent = String(total);
  if (pendingReviewEl) pendingReviewEl.textContent = String(pendingReview);
  if (highPriorityCountEl) highPriorityCountEl.textContent = String(highPriority);
  if (resolutionRateEl) resolutionRateEl.textContent = `${rate}%`;

  // High priority list
  const hp = reports.filter((r) => r.priority === 'High' && r.status !== 'Resolved' && r.status !== 'Withdrawn');

  highPriorityListEl.innerHTML = "";
  hp.forEach((r) => {
    const chipClass = statusToChipClass(r.status);
    const item = elFromHTML(`
      <div class="report-item">
        <div class="report-left">
          <div class="bullet" aria-hidden="true">•</div>
          <div class="report-text">
            <div class="report-title" title="${escapeHtml(r.title)}">${escapeHtml(r.title)}</div>
            <div class="report-meta">${escapeHtml(formatMeta(r))}</div>
          </div>
        </div>
        <div class="report-right">
          <span class="chip ${chipClass}">${escapeHtml(r.status)}</span>
          <button class="view-btn" data-id="${r.id}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            View
          </button>
        </div>
      </div>
    `);

    highPriorityListEl.appendChild(item);
  });

  // Week summary (best-effort from timestamps)
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - 6);
  weekStart.setHours(0, 0, 0, 0);

  const createdWithinWeek = reports.filter((r) => {
    const d = new Date(String(r.date || ''));
    return Number.isFinite(d.getTime()) && d >= weekStart;
  });

  const resolvedWithinWeek = reports.filter((r) => {
    if (r.status !== 'Resolved') return false;
    const d = new Date(String(r.updated_at || r.date || ''));
    return Number.isFinite(d.getTime()) && d >= weekStart;
  });

  if (wkNewReportsEl) wkNewReportsEl.textContent = String(createdWithinWeek.length);
  if (wkResolvedEl) wkResolvedEl.textContent = String(resolvedWithinWeek.length);

  // Avg response time (resolved only, using created_at -> updated_at)
  const resolved = reports
    .filter((r) => r.status === 'Resolved' && r.created_at && r.updated_at)
    .map((r) => {
      const a = new Date(String(r.created_at));
      const b = new Date(String(r.updated_at));
      const ms = b.getTime() - a.getTime();
      return Number.isFinite(ms) ? ms : null;
    })
    .filter((v) => typeof v === 'number' && v >= 0);

  if (wkAvgRespEl) {
    if (!resolved.length) {
      wkAvgRespEl.textContent = '—';
    } else {
      const avgMs = resolved.reduce((s, v) => s + v, 0) / resolved.length;
      const hrs = avgMs / (1000 * 60 * 60);
      wkAvgRespEl.textContent = `${hrs.toFixed(1)} hours`;
    }
  }

  // Workload (group by assigned_to)
  if (workloadListEl) {
    const active = reports.filter((r) => r.status !== 'Resolved' && r.status !== 'Withdrawn');
    const map = new Map();
    active.forEach((r) => {
      const key = String(r.assigned_to || '').trim() || 'Unassigned';
      map.set(key, (map.get(key) || 0) + 1);
    });
    const list = Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    workloadListEl.innerHTML = '';
    list.forEach((w) => {
      workloadListEl.appendChild(elFromHTML(`
        <div class="work-item">
          <div class="work-name">${escapeHtml(w.name)}</div>
          <div class="work-pill">${w.count} Reports</div>
        </div>
      `));
    });
  }

  // Attach view button events
  highPriorityListEl?.querySelectorAll('.view-btn').forEach((btn) => {
    btn.addEventListener('click', () => openModal(Number(btn.dataset.id)));
  });
}

//lagaymo d2//
// ================================
// Analytics (like screenshot)
// ================================
const catListEl = document.getElementById("catList");
const mAvgEl = document.getElementById("mAvg");
const mFastEl = document.getElementById("mFast");
const mLongEl = document.getElementById("mLong");
const mMonthEl = document.getElementById("mMonth");
const mRateEl = document.getElementById("mRate");

function renderAnalytics() {
  if (!catListEl) return;

  // Category distribution (top categories)
  const countsMap = new Map();
  reports.forEach((r) => {
    const key = String(r.category || 'Other') || 'Other';
    countsMap.set(key, (countsMap.get(key) || 0) + 1);
  });
  const counts = Array.from(countsMap.entries())
    .map(([label, count], i) => ({ label, count, idx: i }))
    .sort((a, b) => b.count - a.count);

  const max = Math.max(1, ...counts.map((x) => x.count));
  const palette = ['rgb(46,125,82)', 'rgb(249,115,22)', 'rgb(59,130,246)', 'rgb(168,85,247)', 'rgb(239,68,68)'];

  catListEl.innerHTML = '';
  counts.forEach((c, i) => {
    const pct = Math.round((c.count / max) * 100);
    const row = document.createElement('div');
    row.className = 'cat-row';
    row.innerHTML = `
      <div class="cat-name">${escapeHtml(c.label)}</div>
      <div class="cat-bar">
        <div class="cat-fill" style="width:${pct}%; background:${palette[i % palette.length]};"></div>
      </div>
      <div class="cat-count">${c.count}</div>
    `;
    catListEl.appendChild(row);
  });

  // Resolution time metrics from created_at -> updated_at for resolved reports
  const timesDays = reports
    .filter((r) => r.status === 'Resolved' && r.created_at && r.updated_at)
    .map((r) => {
      const a = new Date(String(r.created_at));
      const b = new Date(String(r.updated_at));
      const ms = b.getTime() - a.getTime();
      const days = ms / (1000 * 60 * 60 * 24);
      return Number.isFinite(days) && days >= 0 ? days : null;
    })
    .filter((v) => typeof v === 'number');

  const avg = timesDays.length ? (timesDays.reduce((a, b) => a + b, 0) / timesDays.length) : 0;
  const fastest = timesDays.length ? Math.min(...timesDays) : 0;
  const longest = timesDays.length ? Math.max(...timesDays) : 0;

  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const thisMonth = reports.filter((r) => String(r.date || '').startsWith(monthKey)).length;
  const rate = stats?.stats?.resolution_rate ?? (reports.length ? Math.round((reports.filter((r) => r.status === 'Resolved').length / reports.length) * 100) : 0);

  if (mAvgEl) mAvgEl.textContent = `${avg ? avg.toFixed(1) : '0'} days`;
  if (mFastEl) mFastEl.textContent = `${fastest ? fastest.toFixed(1) : '0'} days`;
  if (mLongEl) mLongEl.textContent = `${longest ? longest.toFixed(1) : '0'} days`;
  if (mMonthEl) mMonthEl.textContent = `${thisMonth} Reports`;
  if (mRateEl) mRateEl.textContent = `${rate}%`;
}

function renderSettings(){
  // categories
  if (catSettingsList){
    catSettingsList.innerHTML = "";
    settingsCategories.forEach((name, idx) => {
      const row = document.createElement("div");
      row.className = "set-row";
      row.innerHTML = `
        <div class="set-row-left">
          <div class="set-row-text">${escapeHtml(name)}</div>
        </div>
        <button class="set-edit" type="button" data-i="${idx}">
          ✎ Edit
        </button>
      `;
      row.querySelector(".set-edit").addEventListener("click", () => {
        const next = prompt("Edit category name:", name);
        if (next && next.trim()){
          settingsCategories[idx] = next.trim();
          renderSettings();
        }
      });
      catSettingsList.appendChild(row);
    });
  }

  // tags
  if (tagSettingsList){
    tagSettingsList.innerHTML = "";
    settingsTags.forEach((name, idx) => {
      const row = document.createElement("div");
      row.className = "set-row";
      row.innerHTML = `
        <div class="set-row-left">
          <div class="set-row-text">🏷 ${escapeHtml(name)}</div>
        </div>
        <button class="set-edit" type="button" data-i="${idx}">
          ✎ Edit
        </button>
      `;
      row.querySelector(".set-edit").addEventListener("click", () => {
        const next = prompt("Edit tag name:", name);
        if (next && next.trim()){
          settingsTags[idx] = next.trim();
          renderSettings();
        }
      });
      tagSettingsList.appendChild(row);
    });
  }

  // admin assignments
  if (adminAssignList){
    adminAssignList.innerHTML = "";
    adminAssignments.forEach(a => {
      const row = document.createElement("div");
      row.className = "set-row";
      row.innerHTML = `
        <div class="set-row-left">
          <div class="set-row-text">${escapeHtml(a.name)}</div>
        </div>
        <div class="admin-pill-right">${a.active} Active Reports</div>
      `;
      adminAssignList.appendChild(row);
    });
  }
}

if (addCategoryBtn){
  addCategoryBtn.addEventListener("click", () => {
    const v = prompt("New category name:");
    if (v && v.trim()){
      settingsCategories.push(v.trim());
      renderSettings();
    }
  });
}

if (addTagBtn){
  addTagBtn.addEventListener("click", () => {
    const v = prompt("New tag name:");
    if (v && v.trim()){
      settingsTags.push(v.trim());
      renderSettings();
    }
  });
}

if (saveAllSettingsBtn){
  saveAllSettingsBtn.addEventListener("click", () => {
    const prefs = {
      email: !!npEmail?.checked,
      urgent: !!npUrgent?.checked,
      daily: !!npDaily?.checked,
      weekly: !!npWeekly?.checked
    };
    console.log("Saved settings (frontend only):", {
      settingsCategories, settingsTags, adminAssignments, prefs
    });
    alert("Saved all settings (frontend only).");
  });
}


// ================================
// Modal
// ================================
async function openModal(id) {
  selectedId = id;

  try {
    const json = await apiGet(`api/report_get.php?id=${encodeURIComponent(String(id))}`);
    const r = json.report;
    selectedReport = r;

    document.getElementById('rmTitle').textContent = r.title || '—';
    document.getElementById('rmId').textContent = r.id_display || toReportId(id);

    const privacy = String(r.privacy || '').toLowerCase();
    const submitLabel = privacy === 'anonymous' ? 'Anonymous' : (r.user_name || r.user_email || '—');
    document.getElementById('rmSubmitted').textContent = submitLabel;
    document.getElementById('rmDate').textContent = r.submitted || '—';
    document.getElementById('rmDesc').textContent = r.description || '';

    document.getElementById('rmPriority').value = r.priority || 'Medium';
    document.getElementById('rmStatus').value = r.status || 'Pending';
    document.getElementById('rmNotes').value = r.admin_notes || '';

    const assignEl = document.getElementById('rmAssign');
    if (assignEl) {
      const val = String(r.assigned_to || '').trim();
      if (val) {
        // If not present in options, keep current options but still show the value if possible
        const opt = Array.from(assignEl.options || []).find((o) => o.value === val);
        if (opt) assignEl.value = val;
      }
    }

    document.getElementById('rmStatusBadge').textContent = r.status || '—';
    document.getElementById('rmTypeBadge').textContent = r.category || '—';
  } catch (e) {
    console.error(e);
    alert(e?.message || 'Unable to load report');
    return;
  }

  modalBackdrop?.classList.add('show');
  modalBackdrop?.setAttribute('aria-hidden', 'false');
}


function closeModal() {
  modalBackdrop?.classList.remove('show');
  modalBackdrop?.setAttribute('aria-hidden', 'true');
  selectedId = null;
  selectedReport = null;
}

closeModalBtn?.addEventListener('click', closeModal);
modalBackdrop?.addEventListener('click', (e) => {
  if (e.target === modalBackdrop) closeModal();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});

// ================================
// Export (CSV)
// ================================
exportBtn?.addEventListener('click', () => {
  const headers = ['id', 'title', 'submitted_by', 'date', 'category', 'priority', 'status', 'assigned_to'];
  const rows = reports.map((r) => [
    r.id,
    r.title,
    submittedByLabel(r),
    r.date,
    r.category,
    r.priority,
    r.status,
    r.assigned_to || '',
  ]);

  const csv = [
    headers.join(","),
    ...rows.map(row => row.map(v => `"${String(v).replaceAll('"','""')}"`).join(","))
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = 'spusm_ereport_reports.csv';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
});

// ================================
// Notifications / Logout (Demo)
// ================================
logoutBtn?.addEventListener('click', () => {
  (async () => {
    try {
      await fetch('api/logout.php', { method: 'POST', credentials: 'same-origin' });
    } catch {
      // ignore
    }
    window.location.href = 'login.html';
  })();
});

// ================================
// Filters
// ================================


// ================================
// Utils
// ================================
function escapeHtml(str){
  return String(str)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function refresh() {
  renderOverview();
  renderAllReportsTable();
  renderAnalytics();
  renderSettings();
}



// ================================
// All Reports (TABLE version like screenshot)
// Requires these HTML IDs in tabAllReports:
// arSearch, arStatus, arType, applyFiltersBtn, allReportsTbody
// ================================
const arSearch = document.getElementById("arSearch");
const arStatus = document.getElementById("arStatus");
const arType = document.getElementById("arType");
const applyFiltersBtn = document.getElementById("applyFiltersBtn");
const allReportsTbody = document.getElementById("allReportsTbody");

function renderAllReportsTable(){
  if (!allReportsTbody) return;

  const q = (arSearch?.value || "").toLowerCase().trim();
  const sf = arStatus?.value || "";
  const tf = arType?.value || "";

  let list = [...reports];

  // search
  if (q){
    list = list.filter(r =>
      (r.title || "").toLowerCase().includes(q) ||
      (r.category || "").toLowerCase().includes(q) ||
      (r.actorLabel || "").toLowerCase().includes(q) ||
      (r.status || "").toLowerCase().includes(q) ||
      (r.priority || "").toLowerCase().includes(q) ||
      (r.date || "").toLowerCase().includes(q)
    );
  }

  // filters
  if (sf) list = list.filter(r => r.status === sf);
  if (tf) list = list.filter(r => r.category === tf);

  allReportsTbody.innerHTML = "";

  if (list.length === 0){
    allReportsTbody.innerHTML = `
      <tr>
        <td colspan="8" style="padding:18px; color:#6b8a7a; font-weight:800;">
          No reports found. Try changing filters.
        </td>
      </tr>
    `;
    return;
  }

  list.forEach((r) => {
    const rid = r.id_display ? String(r.id_display) : toReportId(r.id);

    const priCls = priorityClass(r.priority);
    const stCls = statusClass(r.status);

    const isAnon = String(r.privacy || '').toLowerCase() === 'anonymous';

    const submittedBy = isAnon
      ? `<span class="badge anonymous">Anonymous</span> <span style="margin-left:8px; font-weight:800; color:#6b8a7a;">Anonymous</span>`
      : `<span style="font-weight:800;">${escapeHtml(r.user_name || '')}</span>`;

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><span class="id-link">${escapeHtml(rid)}</span></td>
      <td><span class="title-link">${escapeHtml(r.title || "")}</span></td>
      <td>${escapeHtml(r.category || "")}</td>
      <td><span class="badge ${priCls}">${escapeHtml(r.priority || "")}</span></td>
      <td><span class="badge ${stCls}">${escapeHtml(r.status || "")}</span></td>
      <td>${submittedBy}</td>
      <td>${escapeHtml(r.date || "")}</td>
      <td>
        <button class="table-view-btn" type="button" data-id="${r.id}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          View
        </button>
      </td>
    `;

    tr.querySelector('.table-view-btn').addEventListener('click', () => openModal(r.id));
    allReportsTbody.appendChild(tr);
  });
}

// hooks
if (applyFiltersBtn) applyFiltersBtn.addEventListener("click", renderAllReportsTable);
[arSearch, arStatus, arType].forEach(el => {
  if (!el) return;
  el.addEventListener("input", renderAllReportsTable);
  el.addEventListener("change", renderAllReportsTable);
});

// Initial render happens after auth + loads

// ================================
// Notifications Dropdown
// ================================
const notifDropdown = document.getElementById("notifDropdown");
const notifList = document.getElementById("notifList");
const notifNewPill = document.getElementById("notifNewPill");
const markAllReadBtn = document.getElementById("markAllReadBtn");
const viewAllNotifBtn = document.getElementById("viewAllNotifBtn");

// demo notifications list
let notifications = [
  { id: 1, type: "success", title: "New Report Submitted", desc: "Cyberbullying incident reported in Main Building.", time: "Just now", unread: true },
  { id: 2, type: "danger", title: "Urgent: High Priority Report", desc: "Safety concern - Broken stairs in Library (HIGH PRIORITY).", time: "5 mins ago", unread: true },
  { id: 3, type: "info", title: "New Comment Added", desc: "Student added update to Report #000003.", time: "15 mins ago", unread: true },
  { id: 4, type: "success", title: "New Report Submitted", desc: "Property damage reported in Cafeteria.", time: "1 hour ago", unread: false },
  { id: 5, type: "purple", title: "Report Marked as Resolved", desc: "Report #000001 has been successfully closed.", time: "2 hours ago", unread: false },
];

function notifIcon(type){
  if (type === "danger") return "⚠️";
  if (type === "info") return "💬";
  if (type === "purple") return "✅";
  return "👤";
}

function renderNotifications(){
  if (!notifList) return;
  notifList.innerHTML = "";

  notifications.forEach(n => {
    const div = document.createElement("div");
    div.className = "notif-item " + (n.unread ? "unread" : "");
    div.innerHTML = `
      <div class="notif-ico ${n.type}">${notifIcon(n.type)}</div>
      <div class="notif-body">
        <div class="notif-item-title">${escapeHtml(n.title)}</div>
        <div class="notif-item-desc">${escapeHtml(n.desc)}</div>
        <div class="notif-item-time">${escapeHtml(n.time)}</div>
      </div>
    `;
    // click item => mark read
    div.addEventListener("click", () => {
      notifications = notifications.map(x => x.id === n.id ? { ...x, unread: false } : x);
      syncNotifBadge();
      renderNotifications();
    });
    notifList.appendChild(div);
  });

  syncNotifBadge();
}

function syncNotifBadge(){
  const unread = notifications.filter(n => n.unread).length;

  if (notifNewPill) notifNewPill.textContent = unread ? `${unread} new` : "All read";

  if (notifDot) {
    if (unread) {
      notifDot.style.display = "grid";
      notifDot.textContent = String(unread);
    } else {
      notifDot.style.display = "none";
    }
  }
}

function toggleNotif(){
  if (!notifDropdown) return;
  notifDropdown.classList.toggle("show");
  notifDropdown.setAttribute("aria-hidden", notifDropdown.classList.contains("show") ? "false" : "true");
}

function closeNotif(){
  if (!notifDropdown) return;
  notifDropdown.classList.remove("show");
  notifDropdown.setAttribute("aria-hidden", "true");
}

if (notifBtn) {
  notifBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleNotif();
  });
}

// click outside closes
document.addEventListener("click", (e) => {
  if (!notifDropdown) return;
  const inside = notifDropdown.contains(e.target) || notifBtn.contains(e.target);
  if (!inside) closeNotif();
});

// footer buttons
if (markAllReadBtn) {
  markAllReadBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    notifications = notifications.map(n => ({ ...n, unread: false }));
    syncNotifBadge();
    renderNotifications();
  });
}

if (viewAllNotifBtn) {
  viewAllNotifBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    alert("View all notifications (demo). You can link this to a Notifications page later.");
  });
}

// initial
renderNotifications();


document.getElementById("saveReportBtn").addEventListener("click", () => {
  if (!selectedId) return;

  (async () => {
    try {
      const p = document.getElementById('rmPriority')?.value || '';
      const s = document.getElementById('rmStatus')?.value || '';
      const notes = document.getElementById('rmNotes')?.value || '';
      const assigned_to = document.getElementById('rmAssign')?.value || '';

      await apiPostJson('api/admin/report_update.php', {
        id: selectedId,
        status: s,
        priority: p,
        assigned_to,
        admin_notes: notes,
      });

      await loadAll();
      closeModal();
    } catch (e) {
      console.error(e);
      alert(e?.message || 'Unable to save changes');
    }
  })();
});

document.getElementById("cancelReportBtn").addEventListener("click", () => {
  closeModal();
});

/* -----------------------------
   Loaders
------------------------------ */
async function ensureAdmin() {
  const me = await apiGet('api/me.php');
  if (!me.authenticated) {
    window.location.href = 'login.html';
    return null;
  }
  const role = String(me.user?.role || '').toLowerCase();
  if (role !== 'admin') {
    window.location.href = 'user-dashboard.html';
    return null;
  }

  const adminNameEl = document.getElementById('adminName');
  if (adminNameEl) adminNameEl.textContent = me.user?.full_name || 'Admin';
  return me.user;
}

async function loadStats() {
  stats = await apiGet('api/admin/stats.php');
}

async function loadReports() {
  const q = encodeURIComponent(String(arSearch?.value || '').trim());
  const status = encodeURIComponent(String(arStatus?.value || '').trim());
  const category = encodeURIComponent(String(arType?.value || '').trim());

  const qs = [];
  if (q) qs.push(`q=${q}`);
  if (status) qs.push(`status=${status}`);
  if (category) qs.push(`category=${category}`);
  const url = `api/admin/reports_list.php?${qs.join('&')}`;

  const json = await apiGet(url);
  reports = Array.isArray(json.reports) ? json.reports : [];
}

async function loadAll() {
  await Promise.all([loadStats(), loadReports()]);
  refresh();
}

document.addEventListener('DOMContentLoaded', () => {
  (async () => {
    try {
      await ensureAdmin();
      await loadAll();
    } catch (e) {
      console.error(e);
      alert(e?.message || 'Unable to load admin dashboard');
    }
  })();
});
