/**
 * auth.js — Zapela.gg Authentication Module
 * Uses backend API via db.js (API client).
 */

// ═══════════════════════════════════════
// SWITCH AUTH TAB
// ═══════════════════════════════════════
function swT(tab) {
  const isLogin = tab === 'login';
  document.getElementById('form-login').style.display = isLogin ? 'block' : 'none';
  document.getElementById('form-register').style.display = isLogin ? 'none' : 'block';
  document.getElementById('tab-l').classList.toggle('active', isLogin);
  document.getElementById('tab-r').classList.toggle('active', !isLogin);
  document.getElementById('a-tag').textContent = isLogin ? 'Sign in to your account' : 'Create your account';
}

function sE(id, show, msg = '') {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.toggle('show', show);
  if (msg) el.textContent = msg;
}

// ═══════════════════════════════════════
// LOGIN
// ═══════════════════════════════════════
async function doLogin() {
  const u = document.getElementById('l-u').value.trim();
  const p = document.getElementById('l-p').value;
  sE('err-lu', !u);
  sE('err-lp', !p);
  if (!u || !p) return;

  const btn = document.querySelector('#form-login .a-sub');
  btn.textContent = 'Signing in…'; btn.disabled = true;

  try {
    const r = await API.login(u, p);
    sE('err-lm', false);
    loginOK(r.username, r.displayName);
  } catch (err) {
    sE('err-lm', true, err.message);
  } finally {
    btn.textContent = 'Sign In →'; btn.disabled = false;
  }
}

// ═══════════════════════════════════════
// DEMO LOGIN
// ═══════════════════════════════════════
async function demoLogin() {
  const btn = document.querySelector('#form-login .btn-o');
  btn.textContent = 'Loading…'; btn.disabled = true;
  try {
    const r = await API.demoLogin();
    loginOK(r.username, r.displayName);
  } catch (err) {
    toast('Demo login failed: ' + err.message, 'red');
  } finally {
    btn.textContent = 'Demo — No Account Needed'; btn.disabled = false;
  }
}

// ═══════════════════════════════════════
// REGISTER
// ═══════════════════════════════════════
async function doRegister() {
  const u = document.getElementById('r-u').value.trim();
  const e = document.getElementById('r-e').value.trim();
  const p = document.getElementById('r-p').value;

  sE('err-ru', u.length < 3);
  sE('err-re', !e.includes('@'));
  sE('err-rp', p.length < 8);
  if (u.length < 3 || !e.includes('@') || p.length < 8) return;

  const btn = document.querySelector('#form-register .a-sub');
  btn.textContent = 'Creating…'; btn.disabled = true;

  try {
    const r = await API.register(u, e, p);
    sE('err-rm', false);
    toast('Welcome to Zapela, ' + r.username + '!', 'green');
    loginOK(r.username, r.displayName);
  } catch (err) {
    sE('err-rm', true, err.message);
  } finally {
    btn.textContent = 'Create Account →'; btn.disabled = false;
  }
}

// ═══════════════════════════════════════
// LOGIN SUCCESS
// ═══════════════════════════════════════
function loginOK(username, displayName) {
  APP.user = username;
  APP.displayName = displayName || username;
  const init = username.slice(0, 2).toUpperCase();

  document.getElementById('nav-lb').style.display = 'none';
  document.getElementById('nav-rb').style.display = 'none';
  document.getElementById('nav-db').style.display = '';
  document.getElementById('nav-av').style.display = '';
  document.getElementById('nav-av').textContent = init;

  document.getElementById('sb-av').textContent = init;
  document.getElementById('sb-un').textContent = displayName || username;

  document.getElementById('mm-lb').style.display = 'none';
  document.getElementById('mm-rb').style.display = 'none';
  document.getElementById('mm-db').style.display = '';
  document.getElementById('mm-lo').style.display = '';

  G('dash');
  sv('ov');
  toast('Welcome back, ' + (displayName || username) + '!', 'green');
}

// ═══════════════════════════════════════
// LOGOUT
// ═══════════════════════════════════════
async function logout() {
  await API.logout();
  APP.user = null;
  APP.displayName = null;

  document.getElementById('nav-lb').style.display = '';
  document.getElementById('nav-rb').style.display = '';
  document.getElementById('nav-db').style.display = 'none';
  document.getElementById('nav-av').style.display = 'none';
  document.getElementById('mm-lb').style.display = '';
  document.getElementById('mm-rb').style.display = '';
  document.getElementById('mm-db').style.display = 'none';
  document.getElementById('mm-lo').style.display = 'none';

  G('landing');
  closeSB();
  toast('Logged out successfully.', 'amber');
}

// ═══════════════════════════════════════
// CHANGE PASSWORD (called from settings)
// ═══════════════════════════════════════
async function changePw() {
  const cur = document.getElementById('se-cur').value;
  const nw  = document.getElementById('se-new').value;
  const cn  = document.getElementById('se-con').value;

  try {
    await API.changePassword(cur, nw, cn);
    document.getElementById('se-cur').value = '';
    document.getElementById('se-new').value = '';
    document.getElementById('se-con').value = '';
    sE('err-pw', false);
    toast('Password updated successfully!', 'green');
  } catch (err) {
    sE('err-pw', true, err.message);
  }
}

// ═══════════════════════════════════════
// CLEAR DATA / DELETE ACCOUNT
// ═══════════════════════════════════════
async function clearData() {
  if (!confirm('Clear ALL your plugins, notes, and activity? This cannot be undone!')) return;
  try {
    // Delete all plugins
    const plugins = await API.myPlugins();
    for (const p of plugins) await API.deletePlugin(p.id);
    // Delete all notes
    const notes = await API.notes();
    for (const n of notes) await API.deleteNote(n.id);
    toast('All data cleared.', 'red');
    renderOV();
  } catch (err) {
    toast('Error: ' + err.message, 'red');
  }
}

async function deleteAcct() {
  if (!confirm('Delete your account permanently? ALL data will be lost forever!')) return;
  if (!confirm('Are you absolutely sure? This action is IRREVERSIBLE.')) return;
  try {
    await API.deleteAccount();
    logout();
    toast('Account deleted.', 'red');
  } catch (err) {
    toast('Error: ' + err.message, 'red');
  }
}
