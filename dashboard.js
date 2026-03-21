/**
 * dashboard.js — Zapela.gg Dashboard Module
 * Renders all dashboard views: overview, plugins, analytics,
 * notes, browse, profile, settings, API keys.
 * Depends on: db.js, auth.js, app.js
 */

// ═══════════════════════════════════════
// VIEW SWITCHING
// ═══════════════════════════════════════
const VIEWS = ['ov', 'pl', 'an', 'nt', 'br', 'pr', 'se', 'ap', 'th'];
const VIEW_TITLES = {
  ov: 'OVERVIEW', pl: 'MY PLUGINS', an: 'ANALYTICS',
  nt: 'NOTES',    br: 'BROWSE ALL', pr: 'PROFILE',
  se: 'SETTINGS', ap: 'API KEYS',   th: 'THEMES',
};

function sv(view) {
  VIEWS.forEach(name => {
    const el = document.getElementById('view-' + name);
    const si = document.getElementById('si-' + name);
    if (el) el.classList.toggle('active', name === view);
    if (si) si.classList.toggle('active', name === view);
  });

  // Update mobile top bar title
  const mTitle = document.getElementById('dmbr-tit');
  if (mTitle) mTitle.textContent = VIEW_TITLES[view] || 'DASHBOARD';

  // Scroll main area to top
  const main = document.querySelector('.dmain');
  if (main) main.scrollTop = 0;

  // Close mobile sidebar
  closeSB();

  // Render the selected view
  const renders = { ov: renderOV, pl: renderPL, an: renderAN, nt: renderNT, pr: renderPR, se: renderSE, ap: renderAK };
  if (renders[view]) renders[view]();
  if (view === 'br') {
    renderBR();
    const bInp = document.getElementById('br-inp');
    const bCat = document.getElementById('br-cat');
    if (bInp) bInp.value = '';
    if (bCat) bCat.value = '';
  }
}

// ═══════════════════════════════════════
// ── OVERVIEW ──────────────────────────
// ═══════════════════════════════════════
function renderOV() {
  if (!APP.user) return;

  const plugins = DB.plugins(APP.user);
  const totalDl = plugins.reduce((s, p) => s + p.dl, 0);
  const live    = plugins.filter(p => p.status === 'live').length;
  const weekDl  = plugins.reduce((s, p) => s + (p.wdl || []).reduce((a, b) => a + b, 0), 0);

  // Metrics
  document.getElementById('ov-met').innerHTML = `
    <div class="met"><div class="mv">${plugins.length}</div><div class="ml">My Plugins</div><div class="md">${live} live · ${plugins.length - live} draft</div></div>
    <div class="met"><div class="mv">${fN(totalDl)}</div><div class="ml">Total Downloads</div><div class="md">+${fN(weekDl)} this week</div></div>
    <div class="met"><div class="mv">${DB.notes(APP.user).length}</div><div class="ml">Dev Notes</div><div class="md">personal notes</div></div>
    <div class="met"><div class="mv">99%</div><div class="ml">CDN Uptime</div><div class="md">all mirrors OK</div></div>
  `;

  // Bar chart — aggregate weekly downloads across all plugins
  const days = [0, 0, 0, 0, 0, 0, 0];
  plugins.forEach(p => (p.wdl || []).forEach((v, i) => { days[i] += v; }));
  const maxV = Math.max(...days, 1);
  const bc = document.getElementById('bchart');
  bc.innerHTML = '';
  days.forEach((v, i) => {
    const bar = document.createElement('div');
    bar.className = 'bar';
    bar.style.height = '0%';
    bar.title = `${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][i]}: ${fN(v)} downloads`;
    bc.appendChild(bar);
    setTimeout(() => { bar.style.height = (v / maxV * 100) + '%'; }, i * 70 + 200);
  });

  // Plugin list (top 4)
  const ovPl = document.getElementById('ov-pl');
  if (plugins.length === 0) {
    ovPl.innerHTML = `<div style="text-align:center;padding:1.5rem;color:var(--tx3);font-family:var(--fm);font-size:.76rem;">
      // No plugins yet. <span style="color:var(--a);cursor:pointer;" onclick="sv('pl')">Upload one →</span>
    </div>`;
  } else {
    ovPl.innerHTML = plugins.slice(0, 4).map(p => `
      <div class="urow">
        <div class="uth">${p.icon}</div>
        <div style="flex:1"><div class="unm">${esc(p.name)}</div><div class="umt">${p.cat} · MC ${p.ver}</div></div>
        <span class="tag ${p.status === 'live' ? '' : 'amber'}">${p.status.toUpperCase()}</span>
        <div class="udl">↓${fN(p.dl)}</div>
      </div>`).join('');
  }

  // Activity feed
  const acts = DB.activity(APP.user);
  const ovAct = document.getElementById('ov-act');
  if (acts.length === 0) {
    ovAct.innerHTML = '<div style="color:var(--tx3);font-family:var(--fm);font-size:.74rem;padding:.5rem 0;">// No activity yet.</div>';
  } else {
    ovAct.innerHTML = acts.slice(0, 6).map(a => `
      <div class="arow">
        <div class="adot ${a.c}"></div>
        <div><div class="atxt">${a.msg}</div><div class="atm">${tAgo(a.t)}</div></div>
      </div>`).join('');
  }

  // Category breakdown (community + user plugins)
  const cats = {};
  [...SEED, ...plugins].forEach(p => { cats[p.cat] = (cats[p.cat] || 0) + 1; });
  const sorted = Object.entries(cats).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const catTotal = sorted.reduce((s, c) => s + c[1], 0);
  document.getElementById('ov-cats').innerHTML = sorted.map(([cat, count]) => `
    <div style="margin-bottom:.6rem;">
      <div style="display:flex;justify-content:space-between;font-size:.74rem;margin-bottom:3px;">
        <span style="color:var(--tx2);">${cat}</span>
        <span style="color:var(--a);font-family:var(--fm);">${count}</span>
      </div>
      <div class="pw"><div class="pb" style="width:${(count / catTotal * 100).toFixed(0)}%"></div></div>
    </div>`).join('');
}

// ═══════════════════════════════════════
// ── MY PLUGINS ────────────────────────
// ═══════════════════════════════════════
function renderPL() {
  if (!APP.user) return;
  const plugins = DB.plugins(APP.user);

  document.getElementById('pl-cnt').textContent = plugins.length;
  document.getElementById('bg-pl').textContent  = plugins.length;

  const list  = document.getElementById('pl-list');
  const empty = document.getElementById('pl-empty');

  if (plugins.length === 0) {
    list.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  list.innerHTML = plugins.map((p, i) => `
    <div class="urow">
      <div class="uth">${p.icon}</div>
      <div style="flex:1;min-width:0;">
        <div class="unm">${esc(p.name)}</div>
        <div class="umt">${p.cat} · MC ${p.ver} · ${p.size || '—'} · ${tAgo(p.uploaded)}</div>
      </div>
      <span class="tag ${p.status === 'live' ? '' : 'amber'}" style="flex-shrink:0;">${p.status.toUpperCase()}</span>
      <div class="udl">↓${fN(p.dl)}</div>
      <div class="uact">
        <button class="btn-sm" onclick="editPl(${i})">EDIT</button>
        <button class="btn-sm" onclick="togglePl(${i})">${p.status === 'live' ? 'UNPUB' : 'PUB'}</button>
        <button class="btn-sm del" onclick="deletePl(${i})">DEL</button>
      </div>
    </div>`).join('');
}

function togglePl(i) {
  const plugins = DB.plugins(APP.user);
  plugins[i].status = plugins[i].status === 'live' ? 'draft' : 'live';
  DB.savePl(APP.user, plugins);
  DB.addAc(APP.user,
    `${plugins[i].name} ${plugins[i].status === 'live' ? 'published' : 'unpublished'}.`,
    plugins[i].status === 'live' ? 'green' : 'amber'
  );
  renderPL();
  toast(`${plugins[i].name} is now ${plugins[i].status}.`, plugins[i].status === 'live' ? 'green' : 'amber');
}

function deletePl(i) {
  if (!confirm('Delete this plugin? This cannot be undone.')) return;
  const plugins = DB.plugins(APP.user);
  const name = plugins[i].name;
  plugins.splice(i, 1);
  DB.savePl(APP.user, plugins);
  DB.addAc(APP.user, 'Deleted plugin: ' + name, 'red');
  renderPL();
  toast('Plugin deleted.', 'red');
}

function sortPl() {
  const plugins = DB.plugins(APP.user);
  plugins.sort((a, b) => b.dl - a.dl);
  DB.savePl(APP.user, plugins);
  renderPL();
  toast('Sorted by downloads.', 'info');
}

// Upload modal
function openUpModal() {
  modal(`
    <div class="m-tit">UPLOAD NEW PLUGIN <button class="m-cl" onclick="closeModal()">✕</button></div>
    <div class="upz" style="margin-bottom:.9rem;" onclick="toast('File picker — full app feature','info')">
      <span class="upz-ic">↑</span>
      <p>Click to select <strong style="color:var(--a)">.jar</strong> or <strong style="color:var(--a)">.zip</strong></p>
    </div>
    <div class="fg"><label class="fl">Plugin Name *</label><input type="text" class="fi" id="up-nm" placeholder="e.g. MyPlugin v2.0"></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:.8rem;">
      <div class="fg"><label class="fl">Category *</label>
        <select class="fi" id="up-cat">
          <option value="">Select...</option>
          <option>ECONOMY</option><option>PVP</option><option>RPG</option>
          <option>ANTI-GRIEF</option><option>GAMEMODE</option><option>FACTIONS</option>
          <option>UTILITY</option><option>SETUP</option>
        </select>
      </div>
      <div class="fg"><label class="fl">MC Version *</label><input type="text" class="fi" id="up-ver" placeholder="e.g. 1.21"></div>
    </div>
    <div class="fg"><label class="fl">Short Description *</label><input type="text" class="fi" id="up-desc" placeholder="One-line summary of your plugin"></div>
    <div class="fg"><label class="fl">Status</label>
      <select class="fi" id="up-st"><option value="draft">Draft</option><option value="live">Publish Live</option></select>
    </div>
    <div class="ferr" id="err-up" style="margin-bottom:.4rem;"></div>
    <div style="display:flex;gap:.6rem;flex-wrap:wrap;margin-top:.4rem;">
      <button class="btn btn-p" onclick="submitPl()">Upload Plugin →</button>
      <button class="btn btn-g" onclick="closeModal()">Cancel</button>
    </div>
  `);
}

// Edit modal
function editPl(i) {
  const p = DB.plugins(APP.user)[i];
  modal(`
    <div class="m-tit">EDIT PLUGIN <button class="m-cl" onclick="closeModal()">✕</button></div>
    <div class="fg"><label class="fl">Plugin Name</label><input type="text" class="fi" id="ep-nm" value="${esc(p.name)}"></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:.8rem;">
      <div class="fg"><label class="fl">Category</label>
        <select class="fi" id="ep-cat">
          ${['ECONOMY','PVP','RPG','ANTI-GRIEF','GAMEMODE','FACTIONS','UTILITY','SETUP']
            .map(c => `<option ${c === p.cat ? 'selected' : ''}>${c}</option>`).join('')}
        </select>
      </div>
      <div class="fg"><label class="fl">MC Version</label><input type="text" class="fi" id="ep-ver" value="${esc(p.ver)}"></div>
    </div>
    <div class="fg"><label class="fl">Description</label><input type="text" class="fi" id="ep-desc" value="${esc(p.desc)}"></div>
    <div style="display:flex;gap:.6rem;flex-wrap:wrap;margin-top:.4rem;">
      <button class="btn btn-p" onclick="updatePl(${i})">Save Changes →</button>
      <button class="btn btn-g" onclick="closeModal()">Cancel</button>
    </div>
  `);
}

function updatePl(i) {
  const plugins = DB.plugins(APP.user);
  plugins[i].name = document.getElementById('ep-nm').value.trim()   || plugins[i].name;
  plugins[i].cat  = document.getElementById('ep-cat').value         || plugins[i].cat;
  plugins[i].ver  = document.getElementById('ep-ver').value.trim()  || plugins[i].ver;
  plugins[i].desc = document.getElementById('ep-desc').value.trim() || plugins[i].desc;
  DB.savePl(APP.user, plugins);
  closeModal();
  renderPL();
  toast('Plugin updated!', 'green');
}

function submitPl() {
  const name = document.getElementById('up-nm').value.trim();
  const cat  = document.getElementById('up-cat').value;
  const ver  = document.getElementById('up-ver').value.trim();
  const desc = document.getElementById('up-desc').value.trim();
  const st   = document.getElementById('up-st').value;

  const errEl = document.getElementById('err-up');
  if (!name || !cat || !ver || !desc) {
    errEl.classList.add('show');
    errEl.textContent = 'All fields are required.';
    return;
  }
  errEl.classList.remove('show');

  DB.addPl(APP.user, {
    id:       'p' + Date.now(),
    name, icon: name.slice(0, 2).toUpperCase(),
    cat, ver, desc, status: st,
    dl: 0, size: '—',
    uploaded: Date.now(),
    wdl: [0, 0, 0, 0, 0, 0, 0],
  });

  DB.addAc(APP.user, `Uploaded: ${name} (${st})`, st === 'live' ? 'green' : 'amber');
  closeModal();
  renderPL();
  document.getElementById('bg-pl').textContent = DB.plugins(APP.user).length;
  toast('Plugin uploaded!', 'green');
}

// ═══════════════════════════════════════
// ── ANALYTICS ─────────────────────────
// ═══════════════════════════════════════
function renderAN() {
  if (!APP.user) return;
  const plugins = DB.plugins(APP.user);
  const totalDl = plugins.reduce((s, p) => s + p.dl, 0);
  const weekDl  = plugins.reduce((s, p) => s + (p.wdl || []).reduce((a, b) => a + b, 0), 0);
  const live    = plugins.filter(p => p.status === 'live').length;

  document.getElementById('an-met').innerHTML = `
    <div class="met"><div class="mv">${fN(totalDl)}</div><div class="ml">Total Downloads</div><div class="md">all time</div></div>
    <div class="met"><div class="mv">${fN(weekDl)}</div><div class="ml">This Week</div><div class="md">7-day total</div></div>
    <div class="met"><div class="mv">${live}</div><div class="ml">Live Plugins</div><div class="md">of ${plugins.length} total</div></div>
    <div class="met"><div class="mv">${plugins.length ? '★4.8' : '—'}</div><div class="ml">Avg Rating</div><div class="md">community avg</div></div>
  `;

  // Per-plugin weekly downloads
  const ppEl = document.getElementById('an-pp');
  if (plugins.length === 0) {
    ppEl.innerHTML = '<div style="color:var(--tx3);font-family:var(--fm);font-size:.74rem;">// No plugins yet.</div>';
  } else {
    const maxW = Math.max(...plugins.map(p => (p.wdl || []).reduce((a, b) => a + b, 0)), 1);
    ppEl.innerHTML = plugins.map(p => {
      const w = (p.wdl || []).reduce((a, b) => a + b, 0);
      return `
        <div style="margin-bottom:.6rem;">
          <div style="display:flex;justify-content:space-between;font-size:.74rem;margin-bottom:3px;">
            <span style="color:var(--tx2);">${esc(p.name)}</span>
            <span style="color:var(--a);font-family:var(--fm);">${fN(w)}/wk</span>
          </div>
          <div class="pw"><div class="pb" style="width:${(w / maxW * 100).toFixed(0)}%"></div></div>
        </div>`;
    }).join('');
  }

  // Downloads by category
  const cats = {};
  plugins.forEach(p => { cats[p.cat] = (cats[p.cat] || 0) + p.dl; });
  const catArr = Object.entries(cats).sort((a, b) => b[1] - a[1]);
  const maxCat = Math.max(...catArr.map(c => c[1]), 1);
  document.getElementById('an-cat').innerHTML = catArr.length === 0
    ? '<div style="color:var(--tx3);font-family:var(--fm);font-size:.74rem;">// No data yet.</div>'
    : catArr.map(([cat, count]) => `
        <div style="margin-bottom:.6rem;">
          <div style="display:flex;justify-content:space-between;font-size:.74rem;margin-bottom:3px;">
            <span style="color:var(--tx2);">${cat}</span>
            <span style="color:var(--a);font-family:var(--fm);">${fN(count)} DLs</span>
          </div>
          <div class="pw"><div class="pb info" style="width:${(count / maxCat * 100).toFixed(0)}%"></div></div>
        </div>`).join('');

  // Plugin performance
  document.getElementById('an-perf').innerHTML = plugins.length === 0
    ? '<div style="color:var(--tx3);font-family:var(--fm);font-size:.74rem;">// No plugins.</div>'
    : plugins.map(p => `
        <div class="urow">
          <div class="uth">${p.icon}</div>
          <div style="flex:1;">
            <div class="unm">${esc(p.name)}</div>
            <div class="pw" style="margin-top:4px;"><div class="pb" style="width:${Math.min(p.dl / 500, 100).toFixed(0)}%"></div></div>
          </div>
          <span style="color:var(--a);font-family:var(--fm);font-size:.7rem;flex-shrink:0;">↓${fN(p.dl)}</span>
        </div>`).join('');

  // Milestones
  const milestones = [];
  plugins.forEach(p => {
    [1000, 5000, 10000, 25000, 50000, 100000].forEach(m => {
      if (p.dl >= m) milestones.push(`🎉 ${p.name} reached ${fN(m)} downloads!`);
    });
  });
  document.getElementById('an-ms').innerHTML = milestones.length === 0
    ? '<div style="color:var(--tx3);font-family:var(--fm);font-size:.74rem;">// No milestones yet. Keep uploading!</div>'
    : milestones.reverse().slice(0, 5).map(m => `
        <div class="arow"><div class="adot amber"></div><div><div class="atxt">${m}</div></div></div>`).join('');
}

// ═══════════════════════════════════════
// ── NOTES ─────────────────────────────
// ═══════════════════════════════════════
function renderNT(filter = '') {
  if (!APP.user) return;
  let notes = DB.notes(APP.user);
  if (filter) {
    notes = notes.filter(n =>
      n.title.toLowerCase().includes(filter) ||
      n.content.toLowerCase().includes(filter)
    );
  }

  document.getElementById('bg-nt').textContent = DB.notes(APP.user).length;

  const list  = document.getElementById('notes-list');
  const empty = document.getElementById('notes-empty');

  if (notes.length === 0) {
    list.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  list.innerHTML = notes.map((n, i) => `
    <div class="nc" onclick="openNoteModal(${i})">
      <div class="nc-tit">${esc(n.title)}</div>
      <div class="nc-prv">${esc(n.content.split('\n')[0])}</div>
      <div class="nc-met">
        <div style="display:flex;gap:.3rem;">${(n.tags || []).map(t => `<span class="tag">${t}</span>`).join('')}</div>
        <div class="nc-dt">${tAgo(n.updated || n.created)}</div>
      </div>
    </div>`).join('');
}

function filterNotes(value) {
  renderNT(value.toLowerCase());
}

function openNoteModal(idx) {
  const isEdit = idx !== undefined;
  const notes  = DB.notes(APP.user);
  const n      = isEdit ? notes[idx] : { title: '', content: '', tags: [], created: Date.now(), updated: Date.now() };

  modal(`
    <div class="m-tit">${isEdit ? 'EDIT NOTE' : 'NEW NOTE'} <button class="m-cl" onclick="closeModal()">✕</button></div>
    <div class="fg"><label class="fl">Title</label><input type="text" class="fi" id="nt-tit" value="${esc(n.title)}" placeholder="Note title..."></div>
    <div class="fg">
      <label class="fl">Content</label>
      <textarea class="fi" id="nt-cnt" style="resize:vertical;line-height:1.6;min-height:130px;" placeholder="Write your note...">${esc(n.content)}</textarea>
    </div>
    <div class="fg"><label class="fl">Tags (comma separated)</label><input type="text" class="fi" id="nt-tg" value="${(n.tags || []).join(', ')}" placeholder="e.g. ECOPLUGIN, BUGS"></div>
    <div style="display:flex;gap:.6rem;flex-wrap:wrap;margin-top:.4rem;">
      <button class="btn btn-p" onclick="saveNote(${isEdit ? idx : 'null'})">Save Note →</button>
      ${isEdit ? `<button class="btn btn-d" onclick="deleteNote(${idx})">Delete</button>` : ''}
      <button class="btn btn-g" onclick="closeModal()">Cancel</button>
    </div>
  `);
}

function saveNote(idx) {
  const title   = document.getElementById('nt-tit').value.trim();
  if (!title) { toast('Title is required.', 'red'); return; }
  const content = document.getElementById('nt-cnt').value;
  const tags    = document.getElementById('nt-tg').value
    .split(',').map(t => t.trim().toUpperCase()).filter(Boolean);

  const notes = DB.notes(APP.user);
  if (idx === null || idx === 'null') {
    notes.unshift({ id: 'n' + Date.now(), title, content, tags, created: Date.now(), updated: Date.now() });
  } else {
    notes[idx] = { ...notes[idx], title, content, tags, updated: Date.now() };
  }

  DB.saveNt(APP.user, notes);
  closeModal();
  renderNT();
  toast('Note saved!', 'green');
}

function deleteNote(idx) {
  if (!confirm('Delete this note?')) return;
  const notes = DB.notes(APP.user);
  notes.splice(idx, 1);
  DB.saveNt(APP.user, notes);
  closeModal();
  renderNT();
  toast('Note deleted.', 'red');
}

// ═══════════════════════════════════════
// ── BROWSE ALL ────────────────────────
// ═══════════════════════════════════════
function renderBR(q = '', cat = '', sort = 'dl') {
  let plugins = [...SEED];

  if (q)   plugins = plugins.filter(p =>
    p.name.toLowerCase().includes(q) ||
    p.author.toLowerCase().includes(q) ||
    p.cat.toLowerCase().includes(q)
  );
  if (cat) plugins = plugins.filter(p => p.cat === cat);

  if (sort === 'name')     plugins.sort((a, b) => a.name.localeCompare(b.name));
  else if (sort === 'new') plugins.sort(() => 0.5 - Math.random());
  else                     plugins.sort((a, b) => b.dl - a.dl);

  const grid  = document.getElementById('br-grid');
  const empty = document.getElementById('br-empty');

  if (plugins.length === 0) {
    grid.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  grid.innerHTML = plugins.map(p => `
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

function filterBrowse(q) {
  const cat  = document.getElementById('br-cat')?.value  || '';
  const sort = document.getElementById('br-sort')?.value || 'dl';
  renderBR(q.toLowerCase(), cat, sort);
}

function sortBrowse(sort) {
  const q   = document.getElementById('br-inp')?.value  || '';
  const cat = document.getElementById('br-cat')?.value  || '';
  renderBR(q.toLowerCase(), cat, sort);
}

// ═══════════════════════════════════════
// ── PROFILE ───────────────────────────
// ═══════════════════════════════════════
function renderPR() {
  if (!APP.user) return;
  const u       = DB.user(APP.user);
  const plugins = DB.plugins(APP.user);
  const totalDl = plugins.reduce((s, p) => s + p.dl, 0);
  const init    = APP.user.slice(0, 2).toUpperCase();

  document.getElementById('pr-av').textContent  = init;
  document.getElementById('pr-nm').textContent  = u.displayName || APP.user;
  document.getElementById('pr-em').textContent  = u.email;
  document.getElementById('pr-joined').textContent = 'Joined ' + new Date(u.joined).getFullYear();
  document.getElementById('pr-tdl').textContent = fN(totalDl);

  // Pre-fill edit form
  document.getElementById('pf-nm').value   = u.displayName || '';
  document.getElementById('pf-bio').value  = u.bio         || '';
  document.getElementById('pf-web').value  = u.website     || '';
  document.getElementById('pf-disc').value = u.discord     || '';

  // Account info
  document.getElementById('inf-un').textContent = APP.user;
  document.getElementById('inf-em').textContent = u.email;
  document.getElementById('inf-pl').textContent = plugins.length;
  document.getElementById('inf-dl').textContent = fN(totalDl);

  // Plugin list
  document.getElementById('pr-pl').innerHTML = plugins.length === 0
    ? '<div style="color:var(--tx3);font-family:var(--fm);font-size:.74rem;">No plugins yet.</div>'
    : plugins.map(p => `
        <div class="urow">
          <div class="uth">${p.icon}</div>
          <div style="flex:1"><div class="unm">${esc(p.name)}</div><div class="umt">${p.cat}</div></div>
          <span style="color:var(--a);font-family:var(--fm);font-size:.68rem;">↓${fN(p.dl)}</span>
        </div>`).join('');
}

function saveProfile() {
  const u = DB.user(APP.user);
  u.displayName = document.getElementById('pf-nm').value;
  u.bio         = document.getElementById('pf-bio').value;
  u.website     = document.getElementById('pf-web').value;
  u.discord     = document.getElementById('pf-disc').value;
  DB.saveUser(APP.user, u);
  toast('Profile saved!', 'green');
}

// ═══════════════════════════════════════
// ── SETTINGS ──────────────────────────
// ═══════════════════════════════════════
function renderSE() {
  if (!APP.user) return;
  const u = DB.user(APP.user);

  const ll  = document.getElementById('se-ll');
  const reg = document.getElementById('se-reg');
  const th  = document.getElementById('se-th');

  if (ll)  ll.textContent  = u.lastLogin ? tAgo(u.lastLogin) : '—';
  if (reg) reg.textContent = u.joined ? new Date(u.joined).toLocaleDateString() : '—';
  if (th)  th.textContent  = APP.theme.toUpperCase();
}

// ═══════════════════════════════════════
// ── API KEYS ──────────────────────────
// ═══════════════════════════════════════
function renderAK() {
  if (!APP.user) return;
  APP.keyRevealed = false;
  document.getElementById('ak-val').textContent = 'zap_sk_live_' + Array(16).fill('•').join('');
  document.getElementById('ak-usage').textContent = 'Used: ' + Math.floor(Math.random() * 200) + '/1000';
}

function revealKey() {
  const key = DB.apiKey(APP.user);
  APP.keyRevealed = !APP.keyRevealed;
  document.getElementById('ak-val').textContent = APP.keyRevealed
    ? key
    : 'zap_sk_live_' + Array(16).fill('•').join('');
}

function copyKey() {
  const key = DB.apiKey(APP.user);
  navigator.clipboard && navigator.clipboard
    .writeText(key)
    .then(() => toast('API key copied to clipboard!', 'green'))
    .catch(() => toast('Copy failed — try manually.', 'red'));
}

function regenKey() {
  if (!confirm('Regenerate your API key? Your current key will stop working immediately.')) return;
  DB.regenKey(APP.user);
  renderAK();
  toast('API key regenerated!', 'amber');
}
