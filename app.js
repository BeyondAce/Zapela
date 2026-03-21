/**
 * app.js — Zapela.gg Core Application
 * App state, page navigation, themes, nav search,
 * mobile menus, modals, particles, counters, clock.
 * This file runs last and initialises everything.
 */

// ═══════════════════════════════════════
// APP STATE
// ═══════════════════════════════════════
const APP = {
  page: 'landing',
  user: null,
  detailFrom: 'landing',
  theme: localStorage.getItem('zap_theme') || 'neon',
  keyRevealed: false,
};

// ═══════════════════════════════════════
// PAGE NAVIGATION
// ═══════════════════════════════════════
function G(page) {
  ['landing', 'auth', 'dash', 'detail'].forEach(p => {
    const el = document.getElementById('pg-' + p);
    if (el) el.classList.remove('active');
  });

  const el = document.getElementById('pg-' + page);
  if (el) el.classList.add('active');

  APP.page = page;
  window.scrollTo(0, 0);
  closeMM();

  // Update nav active states
  document.querySelectorAll('.nlnk').forEach(b => b.classList.remove('active'));
  if (page === 'landing') {
    document.getElementById('nl-home')?.classList.add('active');
  }
}

function scrollBrowse() {
  G('landing');
  setTimeout(() => {
    document.getElementById('browse-section')?.scrollIntoView({ behavior: 'smooth' });
  }, 80);
}

// ═══════════════════════════════════════
// PLUGIN DETAIL PAGE
// ═══════════════════════════════════════
function openDetail(p) {
  APP.detailFrom = APP.page;
  G('detail');

  document.getElementById('d-ico').textContent = p.icon;
  document.getElementById('d-nm').textContent = p.name;
  document.getElementById('d-au').textContent = 'by ' + p.author;
  document.getElementById('d-cat').textContent = p.cat;
  document.getElementById('d-ver').textContent = 'MC ' + p.ver;
  document.getElementById('d-ver2').textContent = p.ver;
  document.getElementById('d-desc').textContent = p.desc;
  document.getElementById('d-dl').textContent = '↓ ' + fN(p.dl) + ' downloads';
  document.getElementById('d-dlnum').textContent = fN(p.dl);

  document.getElementById('det-back').onclick = () => {
    G(APP.detailFrom === 'dashboard' ? 'dashboard' : 'landing');
  };
}

// ═══════════════════════════════════════
// LANDING PAGE GRID
// ═══════════════════════════════════════
function renderLanding(cat = '') {
  let plugins = [...SEED];
  if (cat) plugins = plugins.filter(p => p.cat === cat);

  document.getElementById('lgrid').innerHTML = plugins.slice(0, 6).map(p => `
    <div class="pc" onclick='openDetail(${JSON.stringify(p)})'>
      <div class="p-ico">${p.icon}</div>
      <div class="p-inf">
        <div class="p-nm">${p.name}</div>
        <div class="p-au">by ${p.author}</div>
        <div class="p-mt"><span class="tag">${p.cat}</span><span class="tag info">${p.ver}</span></div>
      </div>
      <div class="p-dl">↓${fN(p.dl)}</div>
    </div>`).join('');
}

function filterL(cat) {
  document.querySelectorAll('#cat-btns .btn').forEach(b => {
    const match = b.textContent.trim() === cat || (cat === '' && b.textContent.trim() === 'All');
    b.classList.toggle('acf', match);
  });
  renderLanding(cat);
}

// ═══════════════════════════════════════
// NAV SEARCH
// ═══════════════════════════════════════
function nsF() {
  const q = document.getElementById('ns-inp').value.trim().toLowerCase();
  const cat = document.getElementById('ns-cat').value;
  const dd = document.getElementById('ns-dd');

  if (!q && !cat) { dd.classList.remove('open'); return; }

  let results = SEED.filter(p =>
    (!cat || p.cat === cat) &&
    (!q || p.name.toLowerCase().includes(q) || p.author.toLowerCase().includes(q) || p.cat.toLowerCase().includes(q))
  );

  dd.innerHTML = results.length === 0
    ? '<div class="sd-emp">// No plugins found</div>'
    : results.slice(0, 6).map(p => `
        <div class="sd-item" onclick='openDetail(${JSON.stringify(p)});nsC()'>
          <div class="sd-ico">${p.icon}</div>
          <div style="flex:1">
            <div class="sd-nm">${p.name}</div>
            <div class="sd-mt">${p.cat} · MC ${p.ver} · by ${p.author}</div>
          </div>
          <div class="sd-dl">↓${fN(p.dl)}</div>
        </div>`).join('');

  dd.classList.add('open');
}

function nsO() {
  const hasVal = document.getElementById('ns-inp').value || document.getElementById('ns-cat').value;
  if (hasVal) nsF();
}

function nsC() {
  document.getElementById('ns-dd').classList.remove('open');
  document.getElementById('ns-inp').value = '';
}

function nsS() {
  const q = document.getElementById('ns-inp').value.trim();
  const cat = document.getElementById('ns-cat').value;
  nsC();

  if (APP.user) {
    G('dash');
    sv('br');
    setTimeout(() => {
      document.getElementById('br-inp').value = q;
      document.getElementById('br-cat').value = cat;
      filterBrowse(q);
    }, 50);
  } else {
    scrollBrowse();
  }
}

// Close dropdown on outside click
document.addEventListener('click', e => {
  if (!document.getElementById('ns-wrap').contains(e.target)) nsC();
});

// Mobile search bar
function mSearch() {
  const q = document.getElementById('ms-inp').value.trim();
  closeMM();
  if (APP.user) {
    G('dash');
    sv('br');
    setTimeout(() => {
      document.getElementById('br-inp').value = q;
      filterBrowse(q);
    }, 50);
  } else {
    scrollBrowse();
  }
}

// ═══════════════════════════════════════
// MOBILE NAV MENU
// ═══════════════════════════════════════
function toggleMM() {
  const menu = document.getElementById('mmenu');
  const burger = document.getElementById('hburg');
  const isOpen = menu.classList.contains('open');
  menu.classList.toggle('open', !isOpen);
  burger.classList.toggle('open', !isOpen);
}

function closeMM() {
  document.getElementById('mmenu').classList.remove('open');
  document.getElementById('hburg').classList.remove('open');
}

// ═══════════════════════════════════════
// SIDEBAR (mobile)
// ═══════════════════════════════════════
function openSB() {
  document.getElementById('sidebar').classList.add('open');
  document.getElementById('sbov').classList.add('open');
}

function closeSB() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sbov').classList.remove('open');
}

// ═══════════════════════════════════════
// MODALS
// ═══════════════════════════════════════
function modal(html) {
  document.getElementById('modal-root').innerHTML = `
    <div class="mov" id="mov" onclick="if(event.target.id==='mov')closeModal()">
      <div class="mbox">${html}</div>
    </div>`;
}

function closeModal() {
  document.getElementById('modal-root').innerHTML = '';
}

// ═══════════════════════════════════════
// THEMES
// ═══════════════════════════════════════
const THEME_INFO = {
  neon: 'Inter · Dark Green · Clean modern.',
  gold: 'Inter · Gold accent · Warm editorial.',
  void: 'Inter · Purple accent · Deep space.',
  ice: 'Inter · Blue accent · Arctic.',
  ember: 'Inter · Orange accent · Warm fire.',
  ghost: 'Inter · Light mode · Minimal.',
};

function setTheme(theme) {
  APP.theme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('zap_theme', theme);

  document.querySelectorAll('.tp-sw').forEach(s => s.classList.remove('active'));
  document.getElementById('sw-' + theme)?.classList.add('active');

  document.getElementById('tp-inf').innerHTML =
    `<strong style="color:var(--a)">${theme.toUpperCase()}</strong><br>${THEME_INFO[theme] || ''}`;

  // Sync settings view
  const seTh = document.getElementById('se-th');
  if (seTh) seTh.textContent = theme.toUpperCase();
}

function toggleTP() {
  const panel = document.getElementById('tpanel');
  const overlay = document.getElementById('tpov');
  const isOpen = panel.classList.contains('open');
  panel.classList.toggle('open', !isOpen);
  overlay.classList.toggle('open', !isOpen);
}

function closeTP() {
  document.getElementById('tpanel').classList.remove('open');
  document.getElementById('tpov').classList.remove('open');
}

// ═══════════════════════════════════════
// TOAST NOTIFICATIONS
// ═══════════════════════════════════════
function toast(msg, color = 'green', duration = 3000) {
  const container = document.getElementById('toasts');
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = `<div class="tdot ${color}"></div><div style="flex:1;color:var(--tx)">${msg}</div>`;
  container.appendChild(el);
  setTimeout(() => {
    el.classList.add('out');
    setTimeout(() => el.remove(), 300);
  }, duration);
}

// ═══════════════════════════════════════
// PARTICLES
// ═══════════════════════════════════════
function createParticles() {
  // Particles disabled in Modrinth-style theme
}

// ═══════════════════════════════════════
// COUNTER ANIMATIONS (hero stats)
// ═══════════════════════════════════════
function animateCounters() {
  const totalDl = SEED.reduce((s, p) => s + p.dl, 0);
  const targets = [
    ['sc1', SEED.length, ''],
    ['sc2', Math.floor(totalDl / 1000), 'K'],
    ['sc3', 892, ''],
    ['sc4', 24, ''],
  ];

  targets.forEach(([id, val, suffix]) => {
    const el = document.getElementById(id);
    if (!el) return;
    let current = 0;
    const step = val / 60;
    const interval = setInterval(() => {
      current = Math.min(current + step, val);
      el.textContent = Math.floor(current) + suffix;
      if (current >= val) clearInterval(interval);
    }, 20);
  });
}

// ═══════════════════════════════════════
// LIVE CLOCK (dashboard overview)
// ═══════════════════════════════════════
function updateClock() {
  const el = document.getElementById('dclock');
  if (!el) return;
  const now = new Date();
  const pad = x => String(x).padStart(2, '0');
  const day = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][now.getDay()];
  el.textContent = `// ${day} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())} · ONLINE`;
}

// ═══════════════════════════════════════
// RESPONSIVE — show mobile dash bar
// ═══════════════════════════════════════
function checkResponsive() {
  const bar = document.getElementById('dmbr');
  if (bar) bar.style.display = window.innerWidth <= 768 ? 'flex' : 'none';
}
window.addEventListener('resize', checkResponsive);

// ═══════════════════════════════════════
// UTILITY HELPERS
// ═══════════════════════════════════════

/** Format a number with K/M suffix */
function fN(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return String(n);
}

/** Human-readable time ago */
function tAgo(timestamp) {
  const seconds = (Date.now() - timestamp) / 1000;
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return Math.floor(seconds / 60) + 'm ago';
  if (seconds < 86400) return Math.floor(seconds / 3600) + 'h ago';
  return Math.floor(seconds / 86400) + 'd ago';
}

/** Escape HTML special characters */
function esc(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ═══════════════════════════════════════
// INITIALISE
// ═══════════════════════════════════════
window.addEventListener('load', () => {
  // Apply saved theme
  setTheme(APP.theme);

  // Landing page setup
  renderLanding();
  document.getElementById('ftstats').textContent = `v2.4.1 · ${SEED.length} plugins · ONLINE`;

  // Hero animations
  createParticles();
  setTimeout(animateCounters, 500);

  // Live clock
  setInterval(updateClock, 1000);
  updateClock();

  // Responsive check
  checkResponsive();

  // Restore session (auto-login if session exists)
  const session = DB.session();
  if (session && session.u && DB.user(session.u)) {
    loginOK(session.u);
  }
});
