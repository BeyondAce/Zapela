/**
 * app.js — Zapela.gg Core Application
 * Page navigation, themes, command palette search,
 * hero counters (live from API), clock, mobile menus.
 */

// ═══════════════════════════════════════
// APP STATE
// ═══════════════════════════════════════
const APP = {
  page: 'landing',
  user: null,
  displayName: null,
  detailFrom: 'landing',
  theme: localStorage.getItem('zap_theme') || 'neon',
  keyRevealed: false,
  communityPlugins: [],
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
  document.querySelectorAll('.nlnk').forEach(b => b.classList.remove('active'));
  if (page === 'landing') document.getElementById('nl-home')?.classList.add('active');
}

function scrollBrowse() {
  G('landing');
  setTimeout(() => document.getElementById('browse-section')?.scrollIntoView({ behavior: 'smooth' }), 80);
}

// ═══════════════════════════════════════
// PLUGIN DETAIL PAGE
// ═══════════════════════════════════════
function openDetail(p) {
  if (typeof p === 'string') p = JSON.parse(p);
  APP.detailFrom = APP.page;
  G('detail');

  document.getElementById('d-ico').textContent = p.icon;
  document.getElementById('d-nm').textContent = p.name;
  document.getElementById('d-au').textContent = 'by ' + p.author;
  document.getElementById('d-cat').textContent = p.cat;
  document.getElementById('d-ver').textContent = 'MC ' + p.ver;
  document.getElementById('d-desc').textContent = p.desc;
  document.getElementById('d-dlnum').textContent = fN(p.dl);
  document.getElementById('d-rating').textContent = p.rating ? '★'.repeat(Math.round(p.rating)) + ' ' + p.rating : 'Unrated';

  document.getElementById('det-back').onclick = () => G(APP.detailFrom === 'dash' ? 'dash' : 'landing');
}

// ═══════════════════════════════════════
// LANDING PAGE GRID
// ═══════════════════════════════════════
function renderLanding(cat = '') {
  let plugins = [...APP.communityPlugins];
  if (cat) plugins = plugins.filter(p => p.cat === cat);
  const grid = document.getElementById('lgrid');
  grid.innerHTML = plugins.slice(0, 6).map((p, i) => pluginCard(p, i)).join('');
  // Trigger stagger entrance
  setTimeout(() => {
    grid.querySelectorAll('.pc').forEach((el, i) => {
      setTimeout(() => el.classList.add('card-in'), i * 60);
    });
  }, 30);
}

function pluginCard(p) {
  const stars = p.rating ? '★'.repeat(Math.round(p.rating)) : '';
  return `
    <div class="pc" onclick='openDetail(${JSON.stringify(p)})'>
      <div class="p-ico">${esc(p.icon)}</div>
      <div class="p-inf">
        <div class="p-nm">${esc(p.name)}</div>
        <div class="p-au">by ${esc(p.author)}</div>
        <div class="p-mt"><span class="tag">${esc(p.cat)}</span><span class="tag info">MC ${esc(p.ver)}</span></div>
        ${stars ? `<div class="p-stars">${stars}</div>` : ''}
      </div>
      <div class="p-dl">↓${fN(p.dl)}</div>
    </div>`;
}

function filterL(cat) {
  document.querySelectorAll('.cat-chips .cat-chip').forEach(b => {
    const match = b.dataset.cat === cat;
    b.classList.toggle('active', match);
  });
  renderLanding(cat);
}

// ═══════════════════════════════════════
// COMMAND PALETTE SEARCH
// ═══════════════════════════════════════
let spActive = -1;
let spFilter = '';
let spCurrentPlugins = [];

function openSearch() {
  const overlay = document.getElementById('search-overlay');
  overlay.classList.add('open');
  document.getElementById('sp-input').value = '';
  document.getElementById('sp-input').focus();
  spActive = -1;
  spFilter = '';
  document.querySelectorAll('.sp-cat').forEach(b => b.classList.remove('active'));
  renderSearchResults('');
}

function closeSearch() {
  document.getElementById('search-overlay').classList.remove('open');
  document.getElementById('sp-input').value = '';
}

function renderSearchResults(q) {
  const resultsEl = document.getElementById('sp-results');
  let plugins = [...APP.communityPlugins];
  if (spFilter) plugins = plugins.filter(p => p.cat === spFilter);
  if (q) {
    const lq = q.toLowerCase();
    plugins = plugins.filter(p =>
      p.name.toLowerCase().includes(lq) ||
      (p.author || '').toLowerCase().includes(lq) ||
      (p.desc || '').toLowerCase().includes(lq) ||
      (p.cat || '').toLowerCase().includes(lq)
    );
  }
  spCurrentPlugins = plugins.slice(0, 8);
  spActive = -1;

  if (spCurrentPlugins.length === 0) {
    resultsEl.innerHTML = `<div class="sp-empty">No plugins found matching "${esc(q)}"</div>`;
    return;
  }

  const label = q || spFilter
    ? `<div class="sp-section-lbl">Results (${spCurrentPlugins.length})</div>`
    : `<div class="sp-section-lbl">Trending Plugins</div>`;

  resultsEl.innerHTML = label + spCurrentPlugins.map((p, i) => `
    <div class="sp-item" data-idx="${i}" onclick='openDetail(${JSON.stringify(p)});closeSearch()'>
      <div class="sp-item-ico">${esc(p.icon)}</div>
      <div class="sp-item-info">
        <div class="sp-item-nm">${esc(p.name)}</div>
        <div class="sp-item-meta">${esc(p.cat)} · MC ${esc(p.ver)} · by ${esc(p.author)}</div>
      </div>
      <div class="sp-item-dl">↓${fN(p.dl)}</div>
    </div>`).join('');
}

function setSpFilter(cat, btn) {
  spFilter = spFilter === cat ? '' : cat;
  document.querySelectorAll('.sp-cat').forEach(b => b.classList.remove('active'));
  if (spFilter) btn.classList.add('active');
  renderSearchResults(document.getElementById('sp-input').value.trim());
}

// Keyboard navigation in search
document.addEventListener('keydown', e => {
  const overlay = document.getElementById('search-overlay');
  if (!overlay.classList.contains('open')) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); openSearch(); }
    return;
  }
  const items = document.querySelectorAll('.sp-item');
  if (e.key === 'Escape') { closeSearch(); return; }
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    spActive = Math.min(spActive + 1, items.length - 1);
    items.forEach((el, i) => el.classList.toggle('sp-focused', i === spActive));
    items[spActive]?.scrollIntoView({ block: 'nearest' });
  }
  if (e.key === 'ArrowUp') {
    e.preventDefault();
    spActive = Math.max(spActive - 1, -1);
    items.forEach((el, i) => el.classList.toggle('sp-focused', i === spActive));
    if (spActive >= 0) items[spActive]?.scrollIntoView({ block: 'nearest' });
  }
  if (e.key === 'Enter' && spActive >= 0 && spCurrentPlugins[spActive]) {
    openDetail(spCurrentPlugins[spActive]);
    closeSearch();
  }
});

// Close overlay on outside click
document.getElementById('search-overlay')?.addEventListener('click', e => {
  if (e.target.id === 'search-overlay') closeSearch();
});

// ═══════════════════════════════════════
// MOBILE NAV
// ═══════════════════════════════════════
function toggleMM() {
  const menu = document.getElementById('mmenu');
  const burger = document.getElementById('hburg');
  const isOpen = menu.classList.contains('open');
  menu.classList.toggle('open', !isOpen);
  burger.classList.toggle('open', !isOpen);
}
function closeMM() {
  document.getElementById('mmenu')?.classList.remove('open');
  document.getElementById('hburg')?.classList.remove('open');
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
function closeModal() { document.getElementById('modal-root').innerHTML = ''; }

// ═══════════════════════════════════════
// THEMES
// ═══════════════════════════════════════
const THEME_INFO = {
  neon:  'Deep dark · Violet accent · Premium.',
  gold:  'Deep dark · Gold accent · Editorial.',
  void:  'Deep dark · Purple · Cosmic.',
  ice:   'Deep dark · Cyan accent · Arctic.',
  ember: 'Deep dark · Orange · Warm fire.',
  ghost: 'Light mode · Minimal · Clean.',
};

function setTheme(theme) {
  APP.theme = theme;
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('zap_theme', theme);
  document.querySelectorAll('.tp-sw').forEach(s => s.classList.remove('active'));
  document.getElementById('sw-' + theme)?.classList.add('active');
  const info = document.getElementById('tp-inf');
  if (info) info.innerHTML = `<strong style="color:var(--a)">${theme.toUpperCase()}</strong> · ${THEME_INFO[theme] || ''}`;
  const seTh = document.getElementById('se-theme-lbl');
  if (seTh) seTh.textContent = theme.toUpperCase();
}
function toggleTP() {
  document.getElementById('tpanel').classList.toggle('open');
  document.getElementById('tpov').classList.toggle('open');
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
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 300); }, duration);
}

// ═══════════════════════════════════════
// HERO COUNTERS — real backend data only
// ═══════════════════════════════════════
async function loadAndAnimateStats() {
  let stats = { plugins: 0, downloads: 0, creators: 0, versions: 0 };
  try {
    stats = await API.stats();
  } catch {}

  // Format display value and label based on magnitude
  function displayVal(n) {
    if (n >= 1_000_000) return { val: +(n / 1_000_000).toFixed(1), suffix: 'M' };
    if (n >= 1_000)     return { val: +(n / 1_000).toFixed(1), suffix: 'K' };
    return { val: n, suffix: '' };
  }

  const targets = [
    { id:'sc1', raw: stats.plugins,   label:'Plugins Uploaded' },
    { id:'sc2', raw: stats.downloads, label:'Total Downloads' },
    { id:'sc3', raw: stats.creators,  label:'Creators' },
    { id:'sc4', raw: stats.versions,  label:'MC Versions' },
  ];

  targets.forEach(({ id, raw, label }, i) => {
    const el  = document.getElementById(id);
    const lbl = el?.closest('div')?.querySelector('.slbl');
    if (!el) return;
    if (lbl) lbl.textContent = label;

    const { val, suffix } = displayVal(raw);

    if (val === 0) { el.textContent = '0'; return; }

    let current = 0;
    const steps = 60;
    const step  = val / steps;
    const delay = i * 80;

    setTimeout(() => {
      const iv = setInterval(() => {
        current = Math.min(current + step, val);
        const disp = Number.isInteger(val) ? Math.floor(current) : current.toFixed(1);
        el.textContent = disp + suffix;
        if (current >= val) clearInterval(iv);
      }, 18);
    }, delay);
  });
}

// ═══════════════════════════════════════
// SCROLL REVEAL — IntersectionObserver
// ═══════════════════════════════════════
function initScrollReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

  // Observe all reveal-able elements
  document.querySelectorAll('.reveal, .reveal-stagger > *').forEach((el, i) => {
    if (el.closest('.reveal-stagger')) {
      el.style.transitionDelay = (i % 6) * 80 + 'ms';
    }
    observer.observe(el);
  });
}

// ═══════════════════════════════════════
// LIVE CLOCK (dashboard)
// ═══════════════════════════════════════
function updateClock() {
  const el = document.getElementById('dclock');
  if (!el) return;
  const now = new Date();
  const pad = x => String(x).padStart(2, '0');
  const day = ['SUN','MON','TUE','WED','THU','FRI','SAT'][now.getDay()];
  el.textContent = `// ${day} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())} · ONLINE`;
}

// ═══════════════════════════════════════
// RESPONSIVE
// ═══════════════════════════════════════
function checkResponsive() {
  const bar = document.getElementById('dmbr');
  if (bar) bar.style.display = window.innerWidth <= 768 ? 'flex' : 'none';
}
window.addEventListener('resize', checkResponsive);

// ═══════════════════════════════════════
// UTILITY HELPERS
// ═══════════════════════════════════════
function fN(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return String(n);
}

function tAgo(ts) {
  const s = (Date.now() - ts) / 1000;
  if (s < 60) return 'just now';
  if (s < 3600) return Math.floor(s / 60) + 'm ago';
  if (s < 86400) return Math.floor(s / 3600) + 'h ago';
  return Math.floor(s / 86400) + 'd ago';
}

function esc(str) {
  return String(str || '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ═══════════════════════════════════════
// INITIALISE
// ═══════════════════════════════════════
window.addEventListener('load', async () => {
  setTheme(APP.theme);
  checkResponsive();
  setInterval(updateClock, 1000);
  updateClock();

  // Trigger hero entrance animation
  setTimeout(() => document.querySelector('.hcnt')?.classList.add('hero-in'), 80);

  // Load community plugins from backend
  try {
    const r = await API.plugins({ sort: 'dl' });
    APP.communityPlugins = r.plugins || SEED;
  } catch {
    APP.communityPlugins = SEED;
  }

  renderLanding();
  setTimeout(loadAndAnimateStats, 500);
  setTimeout(initScrollReveal, 200);
  document.getElementById('ftstats').textContent = `v3.0 · ${APP.communityPlugins.length} plugins available · ONLINE`;

  // Search input live filter
  const spInput = document.getElementById('sp-input');
  if (spInput) {
    spInput.addEventListener('input', () => renderSearchResults(spInput.value.trim()));
  }

  // Restore session
  if (API.token()) {
    try {
      const me = await API.me();
      loginOK(me.username, me.displayName || me.username);
    } catch {
      API.clearToken();
    }
  }
});
