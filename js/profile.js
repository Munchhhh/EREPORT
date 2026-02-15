const backBtn = document.getElementById("backBtn");
backBtn?.addEventListener("click", () => {
  window.location.href = "user-dashboard.html"; // change if your dashboard filename is different
});

document.getElementById('logoutBtn')?.addEventListener('click', () => {
  (async () => {
    try {
      await fetch('api/logout.php', { method: 'POST' });
    } catch {
      // ignore
    }
    window.location.href = 'login.html';
  })();
});

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

const editBtn = document.getElementById("profileEditBtn");
const actions = document.getElementById("profileActions");

const editable = ["pFullName", "pGrade", "pEmail", "pContact"]
  .map(id => document.getElementById(id))
  .filter(Boolean);

let snapshot = {};

function setEditing(on){
  editable.forEach(inp => inp.disabled = !on);
  actions.style.display = on ? "flex" : "none";
  editBtn.style.display = on ? "none" : "inline-flex";
}

function takeSnap(){
  snapshot = {};
  editable.forEach(inp => snapshot[inp.id] = inp.value);
}

function restoreSnap(){
  editable.forEach(inp => inp.value = snapshot[inp.id] ?? inp.value);
}

editBtn?.addEventListener("click", () => {
  takeSnap();
  setEditing(true);
});

document.getElementById("cancelEdit")?.addEventListener("click", () => {
  restoreSnap();
  setEditing(false);
});

document.getElementById("saveEdit")?.addEventListener("click", () => {
  // Update header name + initials
  const fullName = document.getElementById("pFullName")?.value || "";
  document.getElementById("profileNameTitle").textContent = fullName;

  const initials = fullName.split(" ").filter(Boolean).slice(0,2).map(w => w[0].toUpperCase()).join("");
  document.getElementById("profileInitials").textContent = initials || "U";

  (async () => {
    try {
      const full_name = document.getElementById("pFullName")?.value || "";
      const grade = document.getElementById("pGrade")?.value || "";
      const contact = document.getElementById("pContact")?.value || "";
      await apiPostJson('api/profile_update.php', { full_name, grade, contact });
      setEditing(false);
      alert('Profile saved.');
    } catch (e) {
      console.error(e);
      alert(e?.message || 'Unable to save profile');
    }
  })();
});

// Load profile from backend on page load
document.addEventListener('DOMContentLoaded', () => {
  (async () => {
    try {
      const me = await apiGet('api/me.php');
      if (!me.authenticated) {
        window.location.href = 'login.html';
        return;
      }
      const json = await apiGet('api/profile_get.php');
      const p = json.profile || {};

      const setVal = (id, v) => {
        const el = document.getElementById(id);
        if (el && typeof v !== 'undefined' && v !== null) el.value = String(v);
      };

      setVal('pFullName', p.full_name);
      setVal('pSchoolId', p.school_id);
      setVal('pGrade', p.grade);
      setVal('pEmail', p.email);
      setVal('pContact', p.contact);

      document.getElementById('profileNameTitle').textContent = p.full_name || 'User';
      document.getElementById('profileIdTitle').textContent = p.school_id || '';
      const initials = String(p.full_name || '')
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map(w => w[0].toUpperCase())
        .join('');
      document.getElementById('profileInitials').textContent = initials || 'U';
    } catch (e) {
      console.error(e);
    }
  })();
});
