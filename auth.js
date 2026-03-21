/**
 * auth.js — Zapela.gg Authentication Module
 * Handles login, registration, session restore, and logout.
 * Depends on: db.js, app.js (G, toast), dashboard.js (sv)
 */

// ═══════════════════════════════════════
// SWITCH AUTH TAB (Login / Register)
// ═══════════════════════════════════════
function swT(tab) {
  const isLogin = tab === 'login';
  document.getElementById('form-login').style.display = isLogin ? 'block' : 'none';
  document.getElementById('form-register').style.display = isLogin ? 'none' : 'block';
  document.getElementById('tab-l').classList.toggle('active', isLogin);
  document.getElementById('tab-r').classList.toggle('active', !isLogin);
  document.getElementById('a-tag').textContent = isLogin
    ? 'Sign in to your account'
    : 'Create your account';
}

// ═══════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════
function sE(id, show, msg = '') {
  const el = document.getElementById(id);
  el.classList.toggle('show', show);
  if (msg) el.textContent = msg;
}

// ═══════════════════════════════════════
// LOGIN
// ═══════════════════════════════════════
function doLogin() {
  const u = document.getElementById('l-u').value.trim();
  const p = document.getElementById('l-p').value;

  sE('err-lu', !u);
  sE('err-lp', !p);
  if (!u || !p) return;

  // Look up by username or email
  const users = DB.users();
  const key = Object.keys(users).find(k => k === u || users[k].email === u);

  if (!key) {
    sE('err-lm', true, 'No account found with that username or email.');
    return;
  }
  if (users[key].password !== p) {
    sE('err-lm', true, 'Incorrect password.');
    return;
  }

  sE('err-lm', false);

  // Update lastLogin timestamp
  const updated = { ...users[key], lastLogin: Date.now() };
  DB.saveUser(key, updated);
  DB.setSession(key);

  loginOK(key);
}

// ═══════════════════════════════════════
// DEMO LOGIN
// ═══════════════════════════════════════
function demoLogin() {
  DB.seedDemo(); // creates demo data if it doesn't exist
  DB.setSession('ZapDemo');
  loginOK('ZapDemo');
}

// ═══════════════════════════════════════
// REGISTER
// ═══════════════════════════════════════
function doRegister() {
  const u = document.getElementById('r-u').value.trim();
  const e = document.getElementById('r-e').value.trim();
  const p = document.getElementById('r-p').value;

  sE('err-ru', u.length < 3);
  sE('err-re', !e.includes('@'));
  sE('err-rp', p.length < 8);
  if (u.length < 3 || !e.includes('@') || p.length < 8) return;

  if (DB.user(u)) {
    sE('err-rm', true, 'Username already taken. Please choose another.');
    return;
  }
  sE('err-rm', false);

  DB.saveUser(u, {
    username: u,
    email: e,
    password: p,
    displayName: u,
    bio: '',
    website: '',
    discord: '',
    joined: Date.now(),
    lastLogin: Date.now(),
  });

  DB.setSession(u);
  DB.addAc(u, 'Welcome to Zapela! 🚀', 'green');
  toast('Account created! Welcome, ' + u + '!', 'green');
  loginOK(u);
}

// ═══════════════════════════════════════
// LOGIN SUCCESS — update UI & navigate
// ═══════════════════════════════════════
function loginOK(username) {
  APP.user = username;
  const init = username.slice(0, 2).toUpperCase();

  // Update navbar
  document.getElementById('nav-lb').style.display = 'none';
  document.getElementById('nav-rb').style.display = 'none';
  document.getElementById('nav-db').style.display = '';
  document.getElementById('nav-av').style.display = '';
  document.getElementById('nav-av').textContent = init;

  // Update sidebar
  document.getElementById('sb-av').textContent = init;
  document.getElementById('sb-un').textContent = username;

  // Update mobile menu
  document.getElementById('mm-lb').style.display = 'none';
  document.getElementById('mm-rb').style.display = 'none';
  document.getElementById('mm-db').style.display = '';
  document.getElementById('mm-lo').style.display = '';

  // Update sidebar badges
  document.getElementById('bg-pl').textContent = DB.plugins(username).length;
  document.getElementById('bg-nt').textContent = DB.notes(username).length;

  // Navigate to dashboard
  G('dash');
  sv('ov');
  toast('Welcome back, ' + username + '!', 'green');
}

// ═══════════════════════════════════════
// LOGOUT
// ═══════════════════════════════════════
function logout() {
  DB.clearSession();
  APP.user = null;

  // Reset navbar
  document.getElementById('nav-lb').style.display = '';
  document.getElementById('nav-rb').style.display = '';
  document.getElementById('nav-db').style.display = 'none';
  document.getElementById('nav-av').style.display = 'none';

  // Reset mobile menu
  document.getElementById('mm-lb').style.display = '';
  document.getElementById('mm-rb').style.display = '';
  document.getElementById('mm-db').style.display = 'none';
  document.getElementById('mm-lo').style.display = 'none';

  G('landing');
  closeSB();
  toast('Logged out successfully.', 'amber');
}

// ═══════════════════════════════════════
// SETTINGS — CHANGE PASSWORD
// ═══════════════════════════════════════
function changePw() {
  const cur = document.getElementById('se-cur').value;
  const nw = document.getElementById('se-new').value;
  const cn = document.getElementById('se-con').value;
  const u = DB.user(APP.user);

  if (u.password !== cur) {
    sE('err-pw', true, 'Current password is incorrect.');
    return;
  }
  if (nw.length < 8) {
    sE('err-pw', true, 'New password must be at least 8 characters.');
    return;
  }
  if (nw !== cn) {
    sE('err-pw', true, 'Passwords do not match.');
    return;
  }

  sE('err-pw', false);
  u.password = nw;
  DB.saveUser(APP.user, u);

  // Clear fields
  document.getElementById('se-cur').value = '';
  document.getElementById('se-new').value = '';
  document.getElementById('se-con').value = '';

  toast('Password updated successfully!', 'green');
}

// ═══════════════════════════════════════
// SETTINGS — DANGER ZONE
// ═══════════════════════════════════════
function clearData() {
  if (!confirm('Clear ALL your plugins, notes, and activity? This cannot be undone!')) return;

  DB.savePl(APP.user, []);
  DB.saveNt(APP.user, []);
  DB.set('ac_' + APP.user, []);

  // Refresh badges and overview
  document.getElementById('bg-pl').textContent = '0';
  document.getElementById('bg-nt').textContent = '0';
  renderOV();

  toast('All data cleared.', 'red');
}

function deleteAcct() {
  if (!confirm('Delete your account permanently? ALL data will be lost forever!')) return;
  if (!confirm('Are you absolutely sure? This action is IRREVERSIBLE.')) return;

  const users = DB.users();
  delete users[APP.user];
  DB.set('users', users);
  DB.del('pl_' + APP.user);
  DB.del('nt_' + APP.user);
  DB.del('ac_' + APP.user);
  DB.del('ak_' + APP.user);

  logout();
  toast('Account deleted.', 'red');
}
