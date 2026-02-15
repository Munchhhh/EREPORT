// dashboard.js

// Tabs
const tabs = document.querySelectorAll(".tab-pill");
const contents = document.querySelectorAll(".tab-content");

tabs.forEach(tab => {
  tab.addEventListener("click", () => {
    tabs.forEach(t => t.classList.remove("active"));
    contents.forEach(c => c.classList.remove("active"));

    tab.classList.add("active");
    const el = document.getElementById(tab.dataset.tab);
    if (el) el.classList.add("active");
  });
});

// Elements
const totalEl = document.getElementById("totalReports");
const pendingEl = document.getElementById("pendingReports");
const progressEl = document.getElementById("inProgressReports");
const resolvedEl = document.getElementById("resolvedReports");
const recentList = document.getElementById("recentReports");

// Optional buttons
const logoutBtn = document.getElementById("logoutBtn");
const newReportBtn = document.getElementById("newReportBtn");

if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    (async () => {
      try {
        await fetch('api/logout.php', { method: 'POST' });
      } catch {
        // ignore
      }
      window.location.href = 'login.html';
    })();
  });
}

if (newReportBtn) {
  newReportBtn.addEventListener("click", () => {
    // Switch to Submit Report tab
    const submitTabBtn = document.querySelector('.tab-pill[data-tab="submitTab"]');
    if (submitTabBtn) submitTabBtn.click();
  });
}

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
    body: JSON.stringify(body || {})
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.success === false) throw new Error(json.error || 'Request failed');
  return json;
}

async function apiPostForm(url, formData) {
  const res = await fetch(url, {
    method: 'POST',
    credentials: 'same-origin',
    body: formData
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.success === false) throw new Error(json.error || 'Request failed');
  return json;
}

// Helpers
function normalizeStatus(status) {
  const s = (status || "").toLowerCase();
  if (s.includes("pending")) return "Pending";
  if (s.includes("review")) return "Under Review";
  if (s.includes("progress")) return "In Progress";
  if (s.includes("resolved")) return "Resolved";
  return status || "Pending";
}

function chipForStatus(status) {
  const s = normalizeStatus(status);
  if (s === "Under Review") return "chip-review";
  if (s === "In Progress") return "chip-progress";
  if (s === "Resolved") return "chip-resolved";
  return "chip-progress";
}

function chipForPriority(priority) {
  const p = (priority || "").toLowerCase();
  if (p.includes("high")) return "chip-high";
  if (p.includes("medium")) return "chip-medium";
  return "chip-medium";
}

function avatarFor(report) {
  const status = normalizeStatus(report.status);
  if (status === "Resolved") return { cls: "avatar-green", text: "✓" };
  if (status === "In Progress") return { cls: "avatar-orange", text: "!" };
  return { cls: "avatar-blue", text: "i" };
}

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// Render
function renderReports(list) {
  if (!recentList) return;

  recentList.innerHTML = list.map(r => {
    const av = avatarFor(r);
    const safeTitle = escapeHtml(r.title);
    const safeCat = escapeHtml(r.category);
    const safeDate = escapeHtml(r.date);
    const safeStatus = escapeHtml(normalizeStatus(r.status));
    const safePriority = escapeHtml(r.priority);

    return `
      <article class="report-item">
        <div class="report-left">
          <div class="report-avatar ${av.cls}" aria-hidden="true">${av.text}</div>
          <div class="report-info">
            <div class="report-title">${safeTitle}</div>
            <div class="report-meta">${safeCat} • ${safeDate}</div>
          </div>
        </div>
        <div class="report-right">
          <span class="chip chip-status ${chipForStatus(r.status)}">${safeStatus}</span>
          <span class="chip chip-priority ${chipForPriority(r.priority)}">${safePriority}</span>
        </div>
      </article>
    `;
  }).join("");
}

function updateStats(list) {
  const total = list.length;

  // Count statuses
  let pending = 0;
  let progress = 0;
  let resolved = 0;

  list.forEach(r => {
    const s = normalizeStatus(r.status);
    if (s === "Resolved") resolved++;
    else if (s === "In Progress") progress++;
    else pending++; // includes Under Review / Pending / others
  });

  if (totalEl) totalEl.textContent = String(total);
  if (pendingEl) pendingEl.textContent = String(pending);
  if (progressEl) progressEl.textContent = String(progress);
  if (resolvedEl) resolvedEl.textContent = String(resolved);
}

// Init (replace with fetch later)
async function ensureLoggedIn() {
  const me = await apiGet('api/me.php');
  if (!me.authenticated) {
    window.location.href = 'login.html';
    return null;
  }
  return me.user;
}

async function loadDashboard() {
  const stats = await apiGet('api/reports_stats.php?mine=1');
  if (totalEl) totalEl.textContent = String(stats.counts?.total ?? 0);
  if (pendingEl) pendingEl.textContent = String(stats.counts?.pending ?? 0);
  if (progressEl) progressEl.textContent = String(stats.counts?.in_progress ?? 0);
  if (resolvedEl) resolvedEl.textContent = String(stats.counts?.resolved ?? 0);

  const recent = await apiGet('api/reports_list.php?mine=1&limit=5');
  const mapped = (recent.reports || []).map(r => ({
    title: r.title,
    category: r.category,
    date: r.submitted,
    status: r.status,
    priority: r.priority
  }));
  renderReports(mapped);
}

async function loadHistory() {
  const recent = await apiGet('api/reports_list.php?mine=1&limit=100');
  const list = (recent.reports || []).map(r => ({
    id: String(r.id_display || ('#' + String(r.id))),
    title: r.title,
    category: r.category,
    submitted: r.submitted,
    status: r.status,
    priority: r.priority + ' Priority',
    location: r.location
  }));
  renderHistory(list);
}

document.addEventListener('DOMContentLoaded', async () => {
  try {
    await ensureLoggedIn();
    await Promise.all([loadDashboard(), loadHistory()]);
  } catch (e) {
    console.error(e);
  }
});


/* -----------------------------
   Submit Report interactions
------------------------------ */
const uploadBox = document.getElementById("uploadBox");
const attachmentsInput = document.getElementById("attachments");
const chooseFilesBtn = document.getElementById("chooseFilesBtn");
const uploadPreview = document.getElementById("uploadPreview");

if (chooseFilesBtn && attachmentsInput) {
  chooseFilesBtn.addEventListener("click", () => attachmentsInput.click());
}

function renderFilePreview(files) {
  if (!uploadPreview) return;
  if (!files || files.length === 0) {
    uploadPreview.innerHTML = "";
    return;
  }

  const pills = Array.from(files).slice(0, 8).map(f => {
    const sizeMB = (f.size / (1024 * 1024)).toFixed(1);
    return `<span class="preview-pill">${escapeHtml(f.name)} • ${sizeMB}MB</span>`;
  });

  const extra = files.length > 8
    ? `<span class="preview-pill">+${files.length - 8} more</span>`
    : "";

  uploadPreview.innerHTML = pills.join("") + extra;
}

if (attachmentsInput) {
  attachmentsInput.addEventListener("change", (e) => {
    renderFilePreview(e.target.files);
  });
}

if (uploadBox && attachmentsInput) {
  ["dragenter", "dragover"].forEach(evt => {
    uploadBox.addEventListener(evt, (e) => {
      e.preventDefault();
      e.stopPropagation();
      uploadBox.classList.add("dragover");
    });
  });

  ["dragleave", "drop"].forEach(evt => {
    uploadBox.addEventListener(evt, (e) => {
      e.preventDefault();
      e.stopPropagation();
      uploadBox.classList.remove("dragover");
    });
  });

  uploadBox.addEventListener("drop", (e) => {
    const dt = e.dataTransfer;
    if (!dt || !dt.files) return;

    // Put dropped files into the input (supported in modern browsers)
    attachmentsInput.files = dt.files;
    renderFilePreview(dt.files);
  });
}

/* Privacy option highlight */
const privacyOptions = document.querySelectorAll(".privacy-option");
privacyOptions.forEach(opt => {
  opt.addEventListener("click", () => {
    privacyOptions.forEach(o => o.classList.remove("active"));
    opt.classList.add("active");

    const radio = opt.querySelector('input[type="radio"]');
    if (radio) radio.checked = true;
  });
});

/* Submit + Draft (demo behavior) */
const reportForm = document.getElementById("reportForm");
const saveDraftBtn = document.getElementById("saveDraftBtn");

if (reportForm) {
  reportForm.addEventListener("submit", (e) => {
    e.preventDefault();
    (async () => {
      try {
        const fd = new FormData(reportForm);
        // Ensure privacy value included (radio)
        if (!fd.get('privacy')) {
          const checked = document.querySelector('input[name="privacy"]:checked');
          if (checked) fd.set('privacy', checked.value);
        }
        const json = await apiPostForm('api/report_create.php', fd);
        alert(`Report submitted (${json.id_display || ''})`);
        reportForm.reset();
        renderFilePreview([]);
        await Promise.all([loadDashboard(), loadHistory()]);
        // Switch to My Reports tab
        document.querySelector('.tab-pill[data-tab="myReportsTab"]')?.click();
      } catch (err) {
        console.error(err);
        alert(err?.message || 'Submit failed');
      }
    })();
  });
}

if (saveDraftBtn) {
  saveDraftBtn.addEventListener("click", () => {
    (async () => {
      try {
        const data = {
          category: document.getElementById('category')?.value || '',
          description: document.getElementById('description')?.value || '',
          location: document.getElementById('location')?.value || '',
          incidentDate: document.getElementById('incidentDate')?.value || '',
          privacy: document.querySelector('input[name="privacy"]:checked')?.value || 'confidential',
        };
        const json = await apiPostJson('api/report_save_draft.php', data);
        alert(`Draft saved (${json.id_display || ''})`);
        await Promise.all([loadDashboard(), loadHistory()]);
        document.querySelector('.tab-pill[data-tab="myReportsTab"]')?.click();
      } catch (err) {
        console.error(err);
        alert(err?.message || 'Draft save failed');
      }
    })();
  });
}
/* ========== End of File ========== */


/* -----------------------------
   My Reports (History) UI
------------------------------ */
const historyList = document.getElementById('historyList') || document.querySelector('.myreports-list');

function chipForStatusMyReports(status) {
  const s = normalizeStatus(status);
  if (s === "Under Review") return "chip-review";
  if (s === "In Progress") return "chip-progress";
  if (s === "Resolved") return "chip-resolved";
  if (s === "Pending") return "chip-pending";
  return "chip-pending";
}

function avatarForHistory(r) {
  const s = normalizeStatus(r.status);
  if (s === "Resolved") return { cls: "avatar-green", text: "✓" };
  if (s === "In Progress") return { cls: "avatar-orange", text: "!" };
  if (s === "Pending") return { cls: "avatar-orange", text: "o" };
  return { cls: "avatar-blue", text: "i" };
}

function renderHistory(list) {
  if (!historyList) return;

  historyList.innerHTML = list.map(r => {
    const av = avatarForHistory(r);
    const safeTitle = escapeHtml(r.title);
    const safeId = escapeHtml(r.id);
    const safeCat = escapeHtml(r.category);
    const safeStatus = escapeHtml(normalizeStatus(r.status));
    const safePriority = escapeHtml(r.priority);
    const safeDate = escapeHtml(r.submitted);

    const editBtn = r.canEdit
      ? `<button class="btn-sm btn-muted" type="button" data-action="edit" data-id="${safeId}">
          ✎ Edit Report
        </button>`
      : "";

    // Withdraw is shown in your screenshot on some cards
    const withdrawBtn =
      `<button class="btn-sm btn-danger" type="button" data-action="withdraw" data-id="${safeId}">
        Withdraw
      </button>`;

    return `
      <article class="history-card" data-report="${safeId}">
        <div class="h-left">
          <div class="h-avatar ${av.cls}" aria-hidden="true">${av.text}</div>

          <div class="h-main">
            <h3 class="h-title">${safeTitle}</h3>
            <div class="h-sub">Report ID: #${safeId}</div>

            <div class="h-cat">Category: ${safeCat}</div>

            <div class="h-actions">
              <button class="btn-sm" type="button" data-action="view" data-id="${safeId}">
                View Details
              </button>
              ${editBtn}
              <button class="btn-sm" type="button" data-action="update" data-id="${safeId}">
                Add Update
              </button>
              ${withdrawBtn}
            </div>
          </div>
        </div>

        <div class="h-right">
          <div class="h-badges">
            <span class="chip chip-status ${chipForStatusMyReports(r.status)}">${safeStatus}</span>
            <span class="chip chip-priority ${chipForPriority(r.priority)} chip-priority-text">${safePriority}</span>
          </div>
          <div class="h-date">Submitted: ${safeDate}</div>
        </div>
      </article>
    `;
  }).join("");
}





// Open tab from URL hash (e.g. user-dashboard.html#myReportsTab)
(function () {
  const hash = window.location.hash.replace("#", "");
  if (!hash) return;

  const tabBtn = document.querySelector(`.tab-pill[data-tab="${hash}"]`);
  if (tabBtn) tabBtn.click();
})();






/* Click handling for buttons */
document.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-action]");
  if (!btn) return;

  const action = btn.dataset.action;
  const id = btn.dataset.id;

  if (action === "view") {
    (async () => {
      try {
        const numericId = String(id || '').replace('#', '').replace(/^0+/, '');
        const json = await apiGet(`api/report_get.php?id=${encodeURIComponent(numericId)}`);
        const r = json.report;
        const payload = {
          id: r.id_display,
          title: r.title,
          category: r.category,
          submitted: r.submitted,
          status: r.status,
          priority: `${r.priority} Priority`,
          location: r.location,
          description: r.description,
          attachments: r.attachments || []
        };
        localStorage.setItem('spusm_selected_report', JSON.stringify(payload));
        window.location.href = 'report-details.html';
      } catch (err) {
        console.error(err);
        alert(err?.message || 'Unable to load report');
      }
    })();
}


  if (action === "edit") {
    alert(`Edit Report clicked for #${id} (connect to edit form).`);
  }

  if (action === "update") {
    alert(`Add Update clicked for #${id} (connect to update flow).`);
  }

  if (action === "withdraw") {
    const ok = confirm(`Withdraw report #${id}?`);
    if (!ok) return;
    (async () => {
      try {
        const numericId = String(id || '').replace('#', '').replace(/^0+/, '');
        await apiPostJson('api/report_withdraw.php', { id: Number(numericId) });
        alert('Report withdrawn.');
        await Promise.all([loadDashboard(), loadHistory()]);
      } catch (err) {
        console.error(err);
        alert(err?.message || 'Withdraw failed');
      }
    })();
  }
});

/* Initialize My Reports rendering happens via loadHistory() */

/* ========== End of File ========== */



/* -----------------------------
   Notifications Dropdown
------------------------------ */
const notifBtn = document.getElementById("notifBtn");
const notifMenu = document.getElementById("notifMenu");
const notifList = document.getElementById("notifList");
const notifCount = document.getElementById("notifCount");
const notifNewBadge = document.getElementById("notifNewBadge");
const markAllBtn = document.getElementById("markAllBtn");
const viewAllBtn = document.getElementById("viewAllBtn");

const demoNotifications = [
  {
    type: "ok",
    title: "Report Submitted",
    message: "Your report has been submitted successfully.",
    time: "Just now",
    unread: true
  },
  {
    type: "warn",
    title: "In Review",
    message: "Your report is now being reviewed by the admin.",
    time: "10 mins ago",
    unread: true
  },
  {
    type: "info",
    title: "In Progress",
    message: "Your report has been assigned for action.",
    time: "1 hour ago",
    unread: true
  },
  {
    type: "purple",
    title: "Resolved",
    message: "Your report has been resolved. Please check details.",
    time: "Yesterday",
    unread: false
  }
];

function notifIcon(type){
  if (type === "ok") return "✓";
  if (type === "warn") return "!";
  if (type === "info") return "↗";
  return "✦";
}

function renderNotifications(list){
  if (!notifList) return;

  const unreadCount = list.filter(n => n.unread).length;

  if (notifCount) notifCount.textContent = String(unreadCount);
  if (notifNewBadge) notifNewBadge.textContent = `${unreadCount} new`;

  notifList.innerHTML = list.map((n, idx) => `
    <div class="notif-item" data-idx="${idx}">
      <div class="notif-ico ${n.type}" aria-hidden="true">${notifIcon(n.type)}</div>
      <div class="notif-text">
        <p class="notif-title">${escapeHtml(n.title)}</p>
        <p class="notif-msg">${escapeHtml(n.message)}</p>
        <div class="notif-time">${escapeHtml(n.time)}</div>
      </div>
      ${n.unread ? `<span class="notif-dot-small" title="Unread"></span>` : ""}
    </div>
  `).join("");
}

function toggleNotifMenu(force){
  if (!notifMenu || !notifBtn) return;

  const open = typeof force === "boolean" ? force : !notifMenu.classList.contains("open");
  notifMenu.classList.toggle("open", open);

  notifBtn.setAttribute("aria-expanded", open ? "true" : "false");
  notifMenu.setAttribute("aria-hidden", open ? "false" : "true");
}

if (notifBtn) {
  notifBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleNotifMenu();
  });
}

document.addEventListener("click", (e) => {
  // close when clicking outside
  if (!notifMenu || !notifBtn) return;
  if (!notifMenu.classList.contains("open")) return;

  const inside = notifMenu.contains(e.target) || notifBtn.contains(e.target);
  if (!inside) toggleNotifMenu(false);
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") toggleNotifMenu(false);
});

if (markAllBtn) {
  markAllBtn.addEventListener("click", () => {
    demoNotifications.forEach(n => n.unread = false);
    renderNotifications(demoNotifications);
  });
}

if (viewAllBtn) {
  viewAllBtn.addEventListener("click", () => {
    alert("View all clicked (connect this to a notifications page/modal).");
  });
}

// Optional: clicking a notification marks it read
if (notifList) {
  notifList.addEventListener("click", (e) => {
    const item = e.target.closest(".notif-item");
    if (!item) return;
    const idx = Number(item.dataset.idx);
    if (!Number.isNaN(idx) && demoNotifications[idx]) {
      demoNotifications[idx].unread = false;
      renderNotifications(demoNotifications);
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  renderNotifications(demoNotifications);
});


/* ========== End of File ========== */



/* -----------------------------
   Settings Modal
------------------------------ */
const settingsBtn = document.getElementById("settingsBtn");
const settingsOverlay = document.getElementById("settingsOverlay");
const settingsClose = document.getElementById("settingsClose");
const settingsX = document.getElementById("settingsX");

const prefNotif = document.getElementById("prefNotif");
const prefDark = document.getElementById("prefDark");

function openSettings(open) {
  if (!settingsOverlay) return;
  settingsOverlay.classList.toggle("open", open);
  settingsOverlay.setAttribute("aria-hidden", open ? "false" : "true");
}

if (settingsBtn) {
  settingsBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    openSettings(true);
  });
}

if (settingsClose) settingsClose.addEventListener("click", () => openSettings(false));
if (settingsX) settingsX.addEventListener("click", () => openSettings(false));

if (settingsOverlay) {
  settingsOverlay.addEventListener("click", (e) => {
    // close when clicking outside the modal box
    if (e.target === settingsOverlay) openSettings(false);
  });
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") openSettings(false);
});

/* Preferences (demo) */
if (prefNotif) {
  prefNotif.addEventListener("change", () => {
    // Example: hide notification badge when turned off
    if (notifCount) {
      notifCount.style.display = prefNotif.checked ? "grid" : "none";
    }
  });
}

if (prefDark) {
  prefDark.addEventListener("change", () => {
    // Demo dark mode (simple)
    document.body.classList.toggle("darkmode", prefDark.checked);
  });
}

/* ========== End of File ========== */

// Go to profile page
const topProfileBtn = document.getElementById("topProfileBtn");
topProfileBtn?.addEventListener("click", () => {
  window.location.href = "profile.html";
});

// Settings -> Edit Profile goes to profile page
const editProfileBtn = document.getElementById("editProfileBtn");
editProfileBtn?.addEventListener("click", () => {
  // optional: close settings if you have a close function
  window.location.href = "profile.html";
});

/*========= End of File ========== */

// ===== Report Guidelines Modal =====
const guidelinesBtn = document.getElementById("guidelinesBtn");
const guidelinesOverlay = document.getElementById("guidelinesOverlay");
const guidelinesModal = guidelinesOverlay?.querySelector(".guidelines-modal");
const guidelinesX = document.getElementById("guidelinesX");
const viewStepsBtn = document.getElementById("viewStepsBtn");

function openGuidelines() {
  if (!guidelinesOverlay) return;
  guidelinesOverlay.classList.add("open");
  guidelinesOverlay.setAttribute("aria-hidden", "false");

  // focus modal for accessibility
  if (guidelinesModal) guidelinesModal.focus();
}

function closeGuidelines() {
  if (!guidelinesOverlay) return;
  guidelinesOverlay.classList.remove("open");
  guidelinesOverlay.setAttribute("aria-hidden", "true");
}

// open
guidelinesBtn?.addEventListener("click", openGuidelines);

// close button
guidelinesX?.addEventListener("click", closeGuidelines);

// click outside to close
guidelinesOverlay?.addEventListener("click", (e) => {
  if (e.target === guidelinesOverlay) closeGuidelines();
});

// ESC to close
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && guidelinesOverlay?.classList.contains("open")) {
    closeGuidelines();
  }
});

// optional: View Reporting Steps button (you can change what it does)
viewStepsBtn?.addEventListener("click", () => {
  closeGuidelines();

  // Example: switch to Submit Report tab automatically
  const submitTabBtn = document.querySelector('.tab-pill[data-tab="submitTab"]');
  submitTabBtn?.click();

  // optional: scroll to form
  document.getElementById("reportForm")?.scrollIntoView({ behavior: "smooth", block: "start" });
});

/* ===== End of File ===== */

// ===== Counseling Services Modal =====
const counselingBtn = document.getElementById("counselingBtn");
const counselingOverlay = document.getElementById("counselingOverlay");
const counselingModal = counselingOverlay?.querySelector(".counseling-modal");
const counselingX = document.getElementById("counselingX");
const requestCounselingBtn = document.getElementById("requestCounselingBtn");

function openCounseling() {
  if (!counselingOverlay) return;
  counselingOverlay.classList.add("open");
  counselingOverlay.setAttribute("aria-hidden", "false");
  counselingModal?.focus();
}

function closeCounseling() {
  if (!counselingOverlay) return;
  counselingOverlay.classList.remove("open");
  counselingOverlay.setAttribute("aria-hidden", "true");
}

counselingBtn?.addEventListener("click", openCounseling);
counselingX?.addEventListener("click", closeCounseling);

// click outside closes
counselingOverlay?.addEventListener("click", (e) => {
  if (e.target === counselingOverlay) closeCounseling();
});

// ESC closes
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && counselingOverlay?.classList.contains("open")) {
    closeCounseling();
  }
});

// Optional button action (customize)
requestCounselingBtn?.addEventListener("click", () => {
  // Example: close modal
  closeCounseling();

  // You can redirect, open a form, switch tab, etc.
  // document.querySelector('.tab-pill[data-tab="submitTab"]')?.click();
  // alert("Counseling request feature coming soon!");
});

// ===== Emergency Contacts Modal =====
const emergencyBtn = document.getElementById("emergencyBtn");
const emergencyOverlayModal = document.getElementById("emergencyOverlayModal");
const emergencyModal = emergencyOverlayModal?.querySelector(".emergency-modal");
const emergencyX = document.getElementById("emergencyX");

function openEmergency() {
  if (!emergencyOverlayModal) return;
  emergencyOverlayModal.classList.add("open");
  emergencyOverlayModal.setAttribute("aria-hidden", "false");
  emergencyModal?.focus();
}

function closeEmergency() {
  if (!emergencyOverlayModal) return;
  emergencyOverlayModal.classList.remove("open");
  emergencyOverlayModal.setAttribute("aria-hidden", "true");
}

emergencyBtn?.addEventListener("click", openEmergency);
emergencyX?.addEventListener("click", closeEmergency);

emergencyOverlayModal?.addEventListener("click", (e) => {
  if (e.target === emergencyOverlayModal) closeEmergency();
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && emergencyOverlayModal?.classList.contains("open")) {
    closeEmergency();
  }
});

// Copy buttons inside the modal
emergencyOverlayModal?.addEventListener("click", async (e) => {
  const btn = e.target.closest(".e-icon-btn");
  if (!btn) return;

  const text = btn.getAttribute("data-copy") || "";
  try {
    await navigator.clipboard.writeText(text);

    // quick UI feedback
    const old = btn.textContent;
    btn.textContent = "✓";
    setTimeout(() => (btn.textContent = old), 900);
  } catch (err) {
    // fallback
    prompt("Copy this number:", text);
  }
});
/* ===== End of File ===== */


// ==============================
// View Details -> report-details.html (no backend needed)
// ==============================
(function () {
  // Use event delegation so it works even if cards are added later.
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".btn-sm.btn-muted");
    if (!btn) return;

    // If the card uses the newer [data-action] buttons, let the handler above manage it.
    if (btn.dataset?.action) return;

    // only handle the "View Details" button
    if (btn.textContent.trim().toLowerCase() !== "view details") return;

    const card = btn.closest(".history-card");
    if (!card) return;

    const get = (name, fallback = "") => card.getAttribute(name) || fallback;

    const attachmentsRaw = get("data-attachments", "");
    const attachments = attachmentsRaw
      .split(",")
      .map(s => s.trim())
      .filter(Boolean);

    const payload = {
      id: get("data-id", "#—"),
      title: get("data-title", "—"),
      category: get("data-category", "—"),
      submitted: get("data-submitted", "—"),
      location: get("data-location", "—"),
      description: get("data-description", "—"),
      status: get("data-status", card.querySelector(".chip-status")?.textContent?.trim() || "Under Review"),
      priority: get("data-priority", card.querySelector(".chip-priority")?.textContent?.trim() || "High Priority"),
      attachments
    };

    localStorage.setItem("spusm_selected_report", JSON.stringify(payload));
    window.location.href = "report-details.html";
  });
})();


