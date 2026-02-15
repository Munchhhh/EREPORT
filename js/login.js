const loginCard = document.getElementById("loginCard");
const resetCard = document.getElementById("resetCard");

const forgotBtn = document.getElementById("forgotBtn");
const backBtn = document.getElementById("backBtn");

const loginBtn = document.getElementById("loginBtn");

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");

// Toggle Forgot Password
forgotBtn?.addEventListener("click", () => {
  loginCard?.classList.add("hidden");
  resetCard?.classList.remove("hidden");
});

backBtn?.addEventListener("click", () => {
  resetCard?.classList.add("hidden");
  loginCard?.classList.remove("hidden");
});

// Demo Accounts removed

// Login Logic (Demo)
loginBtn?.addEventListener("click", async () => {
  const email = emailInput?.value.trim() || "";
  const password = passwordInput?.value || "";

  if (!email || !password) {
    alert("Please enter email and password.");
    return;
  }

  try {
    const res = await fetch('api/login.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ email, password })
    });
    const json = await res.json();
    if (json.success) {
      // Redirect to dashboard (role-aware if backend provides it)
      if (String(json.role || '').toLowerCase() === 'admin') {
        window.location.href = 'admin-dashboard.html';
      } else {
        window.location.href = 'user-dashboard.html';
      }
    } else {
      alert(json.error || 'Login failed');
    }
  } catch (err) {
    console.error(err);
    alert('Unable to reach server.');
  }
});
