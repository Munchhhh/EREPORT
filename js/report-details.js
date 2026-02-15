// report-details.js
(function () {
  const $ = (id) => document.getElementById(id);

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

  function safeText(el, value) {
    if (!el) return;
    el.textContent = value ?? "";
  }

  function chipHTML(type, label) {
    // reuses your existing chip classes from dashboard.css
    // type can be: review, pending, progress, resolved, high, medium, low
    const map = {
      review:  { cls: "chip chip-status chip-review",  text: label || "Under Review" },
      pending: { cls: "chip chip-status chip-pending", text: label || "Pending" },
      progress:{ cls: "chip chip-status chip-progress",text: label || "In Progress" },
      resolved:{ cls: "chip chip-status chip-resolved",text: label || "Resolved" },

      high:    { cls: "chip chip-priority chip-high",   text: label || "High Priority" },
      medium:  { cls: "chip chip-priority chip-medium", text: label || "Medium Priority" },
      low:     { cls: "chip chip-priority chip-low",    text: label || "Low Priority" },
    };

    const c = map[type] || { cls: "chip", text: label || "—" };
    return `<span class="${c.cls}">${c.text}</span>`;
  }

  function normalizeStatus(s) {
    const v = String(s || "").toLowerCase();
    if (v.includes("review")) return "review";
    if (v.includes("pending")) return "pending";
    if (v.includes("progress")) return "progress";
    if (v.includes("resolved")) return "resolved";
    return "review";
  }

  function normalizePriority(p) {
    const v = String(p || "").toLowerCase();
    if (v.includes("high")) return "high";
    if (v.includes("medium")) return "medium";
    if (v.includes("low")) return "low";
    return "high";
  }

  function buildTimeline(current) {
    // order like your screenshot
    const steps = [
      { key: "submitted", label: "Submitted" },
      { key: "pending", label: "Pending" },
      { key: "review", label: "In Review" },
      { key: "progress", label: "In Progress" },
      { key: "resolved", label: "Resolved" },
    ];

    // determine index based on status
    const idxMap = { pending: 1, review: 2, progress: 3, resolved: 4 };
    const activeIdx = idxMap[current] ?? 2;

    return steps.map((step, i) => {
      const done = i < activeIdx;
      const active = i === activeIdx;

      const rowClass = active ? "t-row active" : (done ? "t-row done" : "t-row");
      const dotClass = active ? "t-dot active" : (done ? "t-dot done" : "t-dot");
      const dotIcon = done ? "✓" : (active ? "•" : "");

      const sub = done ? "Completed" : (active ? "Current Status" : "");
      return `
        <div class="${rowClass}">
          <div class="${dotClass}" aria-hidden="true">${dotIcon}</div>
          <div class="t-title">${step.label}</div>
          <div class="t-sub">${sub}</div>
        </div>
      `;
    }).join("");
  }

  function renderAttachments(list) {
    const grid = $("attachGrid");
    const empty = $("attachEmpty");
    const count = $("dAttachCount");

    const items = Array.isArray(list) ? list : [];

    safeText(count, `(${items.length})`);

    if (!items.length) {
      if (grid) grid.innerHTML = "";
      if (empty) empty.style.display = "block";
      return;
    }

    if (empty) empty.style.display = "none";

    grid.innerHTML = items.map((src, i) => {
      return `
        <div class="attach-item" data-src="${src}">
          <span class="attach-badge">${i + 1}</span>
          <img src="${src}" alt="Attachment ${i + 1}" loading="lazy" />
        </div>
      `;
    }).join("");

    // preview
    grid.querySelectorAll(".attach-item").forEach(card => {
      card.addEventListener("click", () => {
        const src = card.getAttribute("data-src");
        openPreview(src);
      });
    });
  }

  function openPreview(src) {
    const overlay = $("imgOverlay");
    const img = $("imgPreview");
    if (!overlay || !img) return;
    img.src = src;
    overlay.classList.add("show");
    overlay.setAttribute("aria-hidden", "false");
  }

  function closePreview() {
    const overlay = $("imgOverlay");
    const img = $("imgPreview");
    if (!overlay || !img) return;
    overlay.classList.remove("show");
    overlay.setAttribute("aria-hidden", "true");
    img.src = "";
  }

  // Demo fallback if user opens report-details directly
  const fallback = {
    id: "#000001",
    title: "Cyberbullying Incident",
    submitted: "2024-01-15",
    category: "Bullying",
    location: "Main Building - Room 203",
    description:
      "The electric fan in Room 203 is not functioning properly. The fan blades are not rotating even when switched on. This has been causing discomfort during afternoon classes due to inadequate ventilation. The issue has been present for the past week and affects approximately 35 students during class hours.",
    status: "Under Review",
    priority: "High Priority",
    attachments: [
      "assets/sample-attach-1.jpg",
      "assets/sample-attach-2.jpg"
    ]
  };

  const stored = localStorage.getItem("spusm_selected_report");
  const report = stored ? (() => { try { return JSON.parse(stored); } catch { return null; } })() : null;
  let data = report || fallback;

  function numericIdFromDisplay(idDisplay) {
    const raw = String(idDisplay || '').replace('#', '');
    const n = parseInt(raw, 10);
    return Number.isFinite(n) ? n : 0;
  }

  async function refreshFromServer() {
    const numericId = numericIdFromDisplay(data.id);
    if (!numericId) return;

    const json = await apiGet(`api/report_get.php?id=${encodeURIComponent(String(numericId))}`);
    const r = json.report;
    data = {
      id: r.id_display,
      title: r.title,
      submitted: r.submitted,
      category: r.category,
      location: r.location,
      description: r.description,
      status: r.status,
      priority: `${r.priority} Priority`,
      attachments: r.attachments || []
    };
    localStorage.setItem('spusm_selected_report', JSON.stringify(data));
  }

  function renderAll() {
    // Fill fields
    safeText($("dReportId"), data.id || "#—");
    safeText($("dTitle"), data.title || "—");
    safeText($("dSubmitted"), data.submitted || "—");
    safeText($("dCategory"), data.category || "—");
    safeText($("dLocation"), data.location || "—");
    safeText($("dDescription"), data.description || "—");

    // Chips
    const chips = $("detailsChips");
    if (chips) {
      const sKey = normalizeStatus(data.status);
      const pKey = normalizePriority(data.priority);
      chips.innerHTML = chipHTML(sKey, data.status) + chipHTML(pKey, data.priority);
    }

    // Attachments
    renderAttachments(data.attachments);

    // Timeline
    const t = $("timeline");
    if (t) t.innerHTML = buildTimeline(normalizeStatus(data.status));
  }

  renderAll();

  // Try to fetch the latest from the backend (if logged in)
  (async () => {
    try {
      await refreshFromServer();
      renderAll();
    } catch (e) {
      // Keep fallback/localStorage rendering if API is unavailable
      console.warn(e);
    }
  })();

  // Withdraw button (demo)
  const withdrawBtn = $("withdrawBtn");
  if (withdrawBtn) {
    withdrawBtn.addEventListener("click", () => {
      (async () => {
        const ok = confirm("Are you sure you want to withdraw this report?");
        if (!ok) return;
        try {
          const numericId = numericIdFromDisplay(data.id);
          await apiPostJson('api/report_withdraw.php', { id: numericId });
          alert('Report withdrawn.');
          window.location.href = 'user-dashboard.html#myReportsTab';
        } catch (e) {
          console.error(e);
          alert(e?.message || 'Withdraw failed');
        }
      })();
    });
  }

  // Preview close
  const imgX = $("imgX");
  const overlay = $("imgOverlay");
  if (imgX) imgX.addEventListener("click", closePreview);
  if (overlay) {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closePreview();
    });
  }
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closePreview();
  });
})();
