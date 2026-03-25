/**
 * dashboard.js — Zapela.gg Dashboard Module
 * All dashboard views. Uses backend API via db.js.
 */

const VIEWS = ['ov','pl','an','nt','br','pr','se','ap','th'];
const VIEW_TITLES = {
  ov:'OVERVIEW', pl:'MY PLUGINS', an:'ANALYTICS',
  nt:'NOTES', br:'BROWSE ALL', pr:'PROFILE',
  se:'SETTINGS', ap:'API KEYS', th:'THEMES',
};

function sv(view) {
  VIEWS.forEach(name => {
    document.getElementById('view-'+name)?.classList.toggle('active', name===view);
    document.getElementById('si-'+name)?.classList.toggle('active', name===view);
  });
  const mTitle = document.getElementById('dmbr-tit');
  if (mTitle) mTitle.textContent = VIEW_TITLES[view] || 'DASHBOARD';
  document.querySelector('.dmain')?.scrollTo(0, 0);
  closeSB();

  const renders = { ov:renderOV, pl:renderPL, an:renderAN, nt:renderNT, pr:renderPR, se:renderSE, ap:renderAK };
  if (renders[view]) renders[view]();
  if (view==='br') { renderBR(); document.getElementById('br-inp').value=''; document.getElementById('br-cat').value=''; }
}

// ═══════════════════════════════════════
// ── OVERVIEW
// ═══════════════════════════════════════
async function renderOV() {
  if (!APP.user) return;
  let plugins = [], acts = [];
  try { plugins = await API.myPlugins(); } catch {}
  try { acts = await API.activity(); } catch {}

  const totalDl = plugins.reduce((s,p)=>s+p.dl,0);
  const live = plugins.filter(p=>p.status==='live').length;
  const weekDl = plugins.reduce((s,p)=>s+(p.wdl||[]).reduce((a,b)=>a+b,0),0);

  document.getElementById('ov-met').innerHTML = `
    <div class="met"><div class="mv">${plugins.length}</div><div class="ml">My Plugins</div><div class="md">${live} live · ${plugins.length-live} draft</div></div>
    <div class="met"><div class="mv">${fN(totalDl)}</div><div class="ml">Total Downloads</div><div class="md">+${fN(weekDl)} this week</div></div>
    <div class="met"><div class="mv">${acts.length}</div><div class="ml">Activity Events</div><div class="md">last 30 events</div></div>
    <div class="met"><div class="mv">99%</div><div class="ml">CDN Uptime</div><div class="md">all mirrors OK</div></div>`;

  // Bar chart
  const days = [0,0,0,0,0,0,0];
  plugins.forEach(p=>(p.wdl||[]).forEach((v,i)=>{days[i]+=v;}));
  const maxV = Math.max(...days, 1);
  const bc = document.getElementById('bchart');
  bc.innerHTML = '';
  days.forEach((v,i)=>{
    const bar=document.createElement('div'); bar.className='bar'; bar.style.height='0%';
    bar.title=`${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][i]}: ${fN(v)} downloads`;
    bc.appendChild(bar);
    setTimeout(()=>{bar.style.height=(v/maxV*100)+'%';}, i*70+200);
  });

  // Plugin list
  const ovPl = document.getElementById('ov-pl');
  if (plugins.length===0) {
    ovPl.innerHTML = `<div style="text-align:center;padding:1.5rem;color:var(--tx3);font-family:var(--fm);font-size:.76rem;">// No plugins yet. <span style="color:var(--a);cursor:pointer;" onclick="sv('pl')">Upload one →</span></div>`;
  } else {
    ovPl.innerHTML = plugins.slice(0,4).map(p=>`
      <div class="urow">
        <div class="uth">${esc(p.icon)}</div>
        <div style="flex:1"><div class="unm">${esc(p.name)}</div><div class="umt">${p.cat} · MC ${p.ver}</div></div>
        <span class="tag ${p.status==='live'?'green':'amber'}">${p.status.toUpperCase()}</span>
        <div class="udl">↓${fN(p.dl)}</div>
      </div>`).join('');
  }

  // Activity feed
  const ovAct = document.getElementById('ov-act');
  if (acts.length===0) {
    ovAct.innerHTML = '<div style="color:var(--tx3);font-family:var(--fm);font-size:.74rem;padding:.5rem 0;">// No activity yet.</div>';
  } else {
    ovAct.innerHTML = acts.slice(0,6).map(a=>`
      <div class="arow"><div class="adot ${a.c}"></div><div><div class="atxt">${esc(a.msg)}</div><div class="atm">${tAgo(a.t)}</div></div></div>`).join('');
  }

  // Category breakdown
  const cats = {};
  [...APP.communityPlugins, ...plugins].forEach(p=>{cats[p.cat]=(cats[p.cat]||0)+1;});
  const sorted = Object.entries(cats).sort((a,b)=>b[1]-a[1]).slice(0,5);
  const catTotal = sorted.reduce((s,c)=>s+c[1],0);
  document.getElementById('ov-cats').innerHTML = sorted.map(([cat,count])=>`
    <div style="margin-bottom:.6rem;">
      <div style="display:flex;justify-content:space-between;font-size:.74rem;margin-bottom:3px;">
        <span style="color:var(--tx2);">${cat}</span><span style="color:var(--a);font-family:var(--fm);">${count}</span>
      </div>
      <div class="pw"><div class="pb" style="width:${(count/catTotal*100).toFixed(0)}%"></div></div>
    </div>`).join('');

  // Update sidebar badges
  document.getElementById('bg-pl').textContent = plugins.length;
  const notes = await API.notes().catch(()=>[]);
  document.getElementById('bg-nt').textContent = notes.length;
}

// ═══════════════════════════════════════
// ── MY PLUGINS
// ═══════════════════════════════════════
async function renderPL() {
  if (!APP.user) return;
  const plugins = await API.myPlugins().catch(()=>[]);
  document.getElementById('pl-cnt').textContent = plugins.length;
  document.getElementById('bg-pl').textContent = plugins.length;

  const list = document.getElementById('pl-list');
  const empty = document.getElementById('pl-empty');
  if (plugins.length===0) { list.innerHTML=''; empty.style.display='block'; return; }
  empty.style.display='none';

  list.innerHTML = plugins.map((p,i)=>`
    <div class="urow">
      <div class="uth">${esc(p.icon)}</div>
      <div style="flex:1;min-width:0;">
        <div class="unm">${esc(p.name)}</div>
        <div class="umt">${p.cat} · MC ${p.ver} · ${p.size||'—'} · ${tAgo(p.uploaded)}</div>
      </div>
      <span class="tag ${p.status==='live'?'green':'amber'}" style="flex-shrink:0;">${p.status.toUpperCase()}</span>
      <div class="udl">↓${fN(p.dl)}</div>
      <div class="uact">
        <button class="btn-sm" onclick="editPl('${p.id}')">EDIT</button>
        <button class="btn-sm" onclick="togglePl('${p.id}','${p.status}')">${p.status==='live'?'UNPUB':'PUB'}</button>
        <button class="btn-sm del" onclick="deletePl('${p.id}')">DEL</button>
      </div>
    </div>`).join('');
}

async function togglePl(id, currentStatus) {
  const newStatus = currentStatus==='live'?'draft':'live';
  try {
    await API.updatePlugin(id, {status: newStatus});
    renderPL();
    toast(`Plugin ${newStatus==='live'?'published':'unpublished'}.`, newStatus==='live'?'green':'amber');
  } catch(err) { toast('Error: '+err.message,'red'); }
}

async function deletePl(id) {
  if (!confirm('Delete this plugin? This cannot be undone.')) return;
  try {
    await API.deletePlugin(id);
    renderPL();
    toast('Plugin deleted.','red');
  } catch(err) { toast('Error: '+err.message,'red'); }
}

async function sortPl() {
  const plugins = await API.myPlugins().catch(()=>[]);
  plugins.sort((a,b)=>b.dl-a.dl);
  // Re-save order by deleting and re-adding... or just render sorted
  const list = document.getElementById('pl-list');
  list.innerHTML = plugins.map((p,i)=>`
    <div class="urow">
      <div class="uth">${esc(p.icon)}</div>
      <div style="flex:1;min-width:0;">
        <div class="unm">${esc(p.name)}</div>
        <div class="umt">${p.cat} · MC ${p.ver} · ${p.size||'—'} · ${tAgo(p.uploaded)}</div>
      </div>
      <span class="tag ${p.status==='live'?'green':'amber'}">${p.status.toUpperCase()}</span>
      <div class="udl">↓${fN(p.dl)}</div>
      <div class="uact">
        <button class="btn-sm" onclick="editPl('${p.id}')">EDIT</button>
        <button class="btn-sm" onclick="togglePl('${p.id}','${p.status}')">${p.status==='live'?'UNPUB':'PUB'}</button>
        <button class="btn-sm del" onclick="deletePl('${p.id}')">DEL</button>
      </div>
    </div>`).join('');
  toast('Sorted by downloads.','info');
}

function openUpModal() {
  modal(`
    <div class="m-tit">UPLOAD NEW PLUGIN <button class="m-cl" onclick="closeModal()">✕</button></div>
    <div class="upz" style="margin-bottom:.9rem;" onclick="toast('File picker coming soon!','info')">
      <span class="upz-ic">↑</span>
      <p>Click to select <strong style="color:var(--a)">.jar</strong> or <strong style="color:var(--a)">.zip</strong></p>
    </div>
    <div class="fg"><label class="fl">Plugin Name *</label><input type="text" class="fi" id="up-nm" placeholder="e.g. MyPlugin v2.0"></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:.8rem;">
      <div class="fg"><label class="fl">Category *</label>
        <select class="fi" id="up-cat">
          <option value="">Select…</option>
          <option>ECONOMY</option><option>PVP</option><option>RPG</option>
          <option>ANTI-GRIEF</option><option>GAMEMODE</option><option>FACTIONS</option>
          <option>UTILITY</option><option>SETUP</option>
        </select>
      </div>
      <div class="fg"><label class="fl">MC Version *</label><input type="text" class="fi" id="up-ver" placeholder="e.g. 1.21"></div>
    </div>
    <div class="fg"><label class="fl">Short Description *</label><textarea class="fi" id="up-desc" style="resize:vertical;min-height:70px;" placeholder="One-line summary of your plugin"></textarea></div>
    <div class="fg"><label class="fl">Status</label>
      <select class="fi" id="up-st"><option value="draft">Draft</option><option value="live">Publish Live</option></select>
    </div>
    <div class="ferr" id="err-up" style="margin-bottom:.4rem;"></div>
    <div style="display:flex;gap:.6rem;flex-wrap:wrap;margin-top:.4rem;">
      <button class="btn btn-p" onclick="submitPl()">Upload Plugin →</button>
      <button class="btn btn-g" onclick="closeModal()">Cancel</button>
    </div>`);
}

async function editPl(id) {
  const plugins = await API.myPlugins().catch(()=>[]);
  const p = plugins.find(x=>x.id===id);
  if (!p) return;
  modal(`
    <div class="m-tit">EDIT PLUGIN <button class="m-cl" onclick="closeModal()">✕</button></div>
    <div class="fg"><label class="fl">Plugin Name</label><input type="text" class="fi" id="ep-nm" value="${esc(p.name)}"></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:.8rem;">
      <div class="fg"><label class="fl">Category</label>
        <select class="fi" id="ep-cat">
          ${['ECONOMY','PVP','RPG','ANTI-GRIEF','GAMEMODE','FACTIONS','UTILITY','SETUP']
            .map(c=>`<option ${c===p.cat?'selected':''}>${c}</option>`).join('')}
        </select>
      </div>
      <div class="fg"><label class="fl">MC Version</label><input type="text" class="fi" id="ep-ver" value="${esc(p.ver)}"></div>
    </div>
    <div class="fg"><label class="fl">Description</label><textarea class="fi" id="ep-desc" style="resize:vertical;min-height:70px;">${esc(p.desc)}</textarea></div>
    <div style="display:flex;gap:.6rem;flex-wrap:wrap;margin-top:.4rem;">
      <button class="btn btn-p" onclick="updatePl('${id}')">Save Changes →</button>
      <button class="btn btn-g" onclick="closeModal()">Cancel</button>
    </div>`);
}

async function updatePl(id) {
  const name = document.getElementById('ep-nm').value.trim();
  const cat  = document.getElementById('ep-cat').value;
  const ver  = document.getElementById('ep-ver').value.trim();
  const desc = document.getElementById('ep-desc').value.trim();
  try {
    await API.updatePlugin(id, {name,cat,ver,desc});
    closeModal(); renderPL(); toast('Plugin updated!','green');
  } catch(err) { toast('Error: '+err.message,'red'); }
}

async function submitPl() {
  const name = document.getElementById('up-nm').value.trim();
  const cat  = document.getElementById('up-cat').value;
  const ver  = document.getElementById('up-ver').value.trim();
  const desc = document.getElementById('up-desc').value.trim();
  const st   = document.getElementById('up-st').value;
  const errEl = document.getElementById('err-up');

  if (!name||!cat||!ver||!desc) {
    errEl.classList.add('show'); errEl.textContent='All fields are required.'; return;
  }
  errEl.classList.remove('show');
  try {
    await API.addPlugin({name,cat,ver,desc,status:st});
    closeModal(); renderPL(); toast('Plugin uploaded!','green');
  } catch(err) { toast('Error: '+err.message,'red'); }
}

// ═══════════════════════════════════════
// ── ANALYTICS
// ═══════════════════════════════════════
async function renderAN() {
  if (!APP.user) return;
  const plugins = await API.myPlugins().catch(()=>[]);
  const totalDl = plugins.reduce((s,p)=>s+p.dl,0);
  const weekDl  = plugins.reduce((s,p)=>s+(p.wdl||[]).reduce((a,b)=>a+b,0),0);
  const live    = plugins.filter(p=>p.status==='live').length;

  document.getElementById('an-met').innerHTML = `
    <div class="met"><div class="mv">${fN(totalDl)}</div><div class="ml">Total Downloads</div><div class="md">all time</div></div>
    <div class="met"><div class="mv">${fN(weekDl)}</div><div class="ml">This Week</div><div class="md">7-day total</div></div>
    <div class="met"><div class="mv">${live}</div><div class="ml">Live Plugins</div><div class="md">of ${plugins.length} total</div></div>
    <div class="met"><div class="mv">${plugins.length?'★4.8':'—'}</div><div class="ml">Avg Rating</div><div class="md">community avg</div></div>`;

  const ppEl = document.getElementById('an-pp');
  if (plugins.length===0) { ppEl.innerHTML='<div style="color:var(--tx3);font-family:var(--fm);font-size:.74rem;">// No plugins yet.</div>'; }
  else {
    const maxW = Math.max(...plugins.map(p=>(p.wdl||[]).reduce((a,b)=>a+b,0)),1);
    ppEl.innerHTML = plugins.map(p=>{
      const w=(p.wdl||[]).reduce((a,b)=>a+b,0);
      return `<div style="margin-bottom:.6rem;">
        <div style="display:flex;justify-content:space-between;font-size:.74rem;margin-bottom:3px;">
          <span style="color:var(--tx2);">${esc(p.name)}</span>
          <span style="color:var(--a);font-family:var(--fm);">${fN(w)}/wk</span>
        </div>
        <div class="pw"><div class="pb" style="width:${(w/maxW*100).toFixed(0)}%"></div></div>
      </div>`;
    }).join('');
  }

  const cats={};
  plugins.forEach(p=>{cats[p.cat]=(cats[p.cat]||0)+p.dl;});
  const catArr=Object.entries(cats).sort((a,b)=>b[1]-a[1]);
  const maxCat=Math.max(...catArr.map(c=>c[1]),1);
  document.getElementById('an-cat').innerHTML = catArr.length===0
    ? '<div style="color:var(--tx3);font-family:var(--fm);font-size:.74rem;">// No data yet.</div>'
    : catArr.map(([cat,count])=>`
        <div style="margin-bottom:.6rem;">
          <div style="display:flex;justify-content:space-between;font-size:.74rem;margin-bottom:3px;">
            <span style="color:var(--tx2);">${cat}</span>
            <span style="color:var(--a);font-family:var(--fm);">${fN(count)} DLs</span>
          </div>
          <div class="pw"><div class="pb info" style="width:${(count/maxCat*100).toFixed(0)}%"></div></div>
        </div>`).join('');

  document.getElementById('an-perf').innerHTML = plugins.length===0
    ? '<div style="color:var(--tx3);font-family:var(--fm);font-size:.74rem;">// No plugins.</div>'
    : plugins.map(p=>`
        <div class="urow">
          <div class="uth">${esc(p.icon)}</div>
          <div style="flex:1;">
            <div class="unm">${esc(p.name)}</div>
            <div class="pw" style="margin-top:4px;"><div class="pb" style="width:${Math.min(p.dl/500,100).toFixed(0)}%"></div></div>
          </div>
          <span style="color:var(--a);font-family:var(--fm);font-size:.7rem;flex-shrink:0;">↓${fN(p.dl)}</span>
        </div>`).join('');

  const milestones=[];
  plugins.forEach(p=>{
    [1000,5000,10000,25000,50000,100000].forEach(m=>{
      if(p.dl>=m) milestones.push(`🎉 ${p.name} reached ${fN(m)} downloads!`);
    });
  });
  document.getElementById('an-ms').innerHTML = milestones.length===0
    ? '<div style="color:var(--tx3);font-family:var(--fm);font-size:.74rem;">// No milestones yet. Keep uploading!</div>'
    : milestones.reverse().slice(0,5).map(m=>`
        <div class="arow"><div class="adot amber"></div><div><div class="atxt">${m}</div></div></div>`).join('');
}

// ═══════════════════════════════════════
// ── NOTES
// ═══════════════════════════════════════
async function renderNT(filter='') {
  if (!APP.user) return;
  let notes = await API.notes().catch(()=>[]);
  document.getElementById('bg-nt').textContent = notes.length;

  if (filter) {
    const lf=filter.toLowerCase();
    notes=notes.filter(n=>n.title.toLowerCase().includes(lf)||n.content.toLowerCase().includes(lf));
  }

  const list=document.getElementById('notes-list');
  const empty=document.getElementById('notes-empty');
  if (notes.length===0) { list.innerHTML=''; empty.style.display='block'; return; }
  empty.style.display='none';

  list.innerHTML=notes.map(n=>`
    <div class="nc" onclick="openNoteModal('${n.id}')">
      <div class="nc-tit">${esc(n.title)}</div>
      <div class="nc-prv">${esc(n.content.split('\n')[0])}</div>
      <div class="nc-met">
        <div style="display:flex;gap:.3rem;">${(n.tags||[]).map(t=>`<span class="tag">${esc(t)}</span>`).join('')}</div>
        <div class="nc-dt">${tAgo(n.updated||n.created)}</div>
      </div>
    </div>`).join('');
}

function filterNotes(value) { renderNT(value.toLowerCase()); }

async function openNoteModal(id) {
  const isEdit = id !== undefined && id !== null;
  let n = { id:null, title:'', content:'', tags:[], created:Date.now(), updated:Date.now() };

  if (isEdit) {
    const notes = await API.notes().catch(()=>[]);
    n = notes.find(x=>x.id===id) || n;
  }

  modal(`
    <div class="m-tit">${isEdit?'EDIT NOTE':'NEW NOTE'} <button class="m-cl" onclick="closeModal()">✕</button></div>
    <div class="fg"><label class="fl">Title</label><input type="text" class="fi" id="nt-tit" value="${esc(n.title)}" placeholder="Note title…"></div>
    <div class="fg">
      <label class="fl">Content</label>
      <textarea class="fi" id="nt-cnt" style="resize:vertical;line-height:1.6;min-height:130px;" placeholder="Write your note…">${esc(n.content)}</textarea>
    </div>
    <div class="fg"><label class="fl">Tags (comma separated)</label><input type="text" class="fi" id="nt-tg" value="${(n.tags||[]).join(', ')}" placeholder="e.g. ECOPLUGIN, BUGS"></div>
    <div style="display:flex;gap:.6rem;flex-wrap:wrap;margin-top:.4rem;">
      <button class="btn btn-p" onclick="saveNote('${n.id||''}')">Save Note →</button>
      ${isEdit?`<button class="btn btn-d" onclick="deleteNote('${n.id}')">Delete</button>`:''}
      <button class="btn btn-g" onclick="closeModal()">Cancel</button>
    </div>`);
}

async function saveNote(id) {
  const title   = document.getElementById('nt-tit').value.trim();
  if (!title) { toast('Title is required.','red'); return; }
  const content = document.getElementById('nt-cnt').value;
  const tags    = document.getElementById('nt-tg').value.split(',').map(t=>t.trim().toUpperCase()).filter(Boolean);

  try {
    if (!id) {
      await API.addNote({title,content,tags});
    } else {
      await API.updateNote(id,{title,content,tags});
    }
    closeModal(); renderNT(); toast('Note saved!','green');
  } catch(err) { toast('Error: '+err.message,'red'); }
}

async function deleteNote(id) {
  if (!confirm('Delete this note?')) return;
  try {
    await API.deleteNote(id);
    closeModal(); renderNT(); toast('Note deleted.','red');
  } catch(err) { toast('Error: '+err.message,'red'); }
}

// ═══════════════════════════════════════
// ── BROWSE ALL
// ═══════════════════════════════════════
async function renderBR(q='', cat='', sort='dl') {
  let plugins = [...APP.communityPlugins];
  if (q) { const lq=q.toLowerCase(); plugins=plugins.filter(p=>p.name.toLowerCase().includes(lq)||p.author.toLowerCase().includes(lq)||p.cat.toLowerCase().includes(lq)); }
  if (cat) plugins=plugins.filter(p=>p.cat===cat);
  if (sort==='name') plugins.sort((a,b)=>a.name.localeCompare(b.name));
  else if (sort==='new') plugins.sort(()=>0.5-Math.random());
  else plugins.sort((a,b)=>b.dl-a.dl);

  const grid=document.getElementById('br-grid');
  const empty=document.getElementById('br-empty');
  if (plugins.length===0) { grid.innerHTML=''; empty.style.display='block'; return; }
  empty.style.display='none';
  grid.innerHTML=plugins.map(p=>pluginCard(p)).join('');
}

function filterBrowse(q) {
  const cat=document.getElementById('br-cat')?.value||'';
  const sort=document.getElementById('br-sort')?.value||'dl';
  renderBR(q.toLowerCase(),cat,sort);
}

function sortBrowse(sort) {
  const q=document.getElementById('br-inp')?.value||'';
  const cat=document.getElementById('br-cat')?.value||'';
  renderBR(q.toLowerCase(),cat,sort);
}

// ═══════════════════════════════════════
// ── PROFILE
// ═══════════════════════════════════════
async function renderPR() {
  if (!APP.user) return;
  let u={username:APP.user,displayName:APP.displayName||APP.user,email:'',bio:'',website:'',discord:'',github:'',joined:Date.now()};
  try { u = await API.me(); } catch {}
  const plugins = await API.myPlugins().catch(()=>[]);
  const totalDl = plugins.reduce((s,p)=>s+p.dl,0);
  const init = APP.user.slice(0,2).toUpperCase();

  document.getElementById('pr-av').textContent = init;
  document.getElementById('pr-nm').textContent = u.displayName||APP.user;
  document.getElementById('pr-em').textContent = u.email||'';
  document.getElementById('pr-bio').textContent = u.bio||'No bio yet.';
  document.getElementById('pr-joined').textContent = 'Joined '+new Date(u.joined).toLocaleDateString('en-US',{month:'short',year:'numeric'});
  document.getElementById('pr-stats').innerHTML = `
    <div style="text-align:center;padding:.8rem;border-right:1px solid var(--border)">
      <div style="font-size:1.2rem;font-weight:800;color:var(--a);">${plugins.length}</div>
      <div style="font-size:.7rem;color:var(--tx3);font-family:var(--fm);">PLUGINS</div>
    </div>
    <div style="text-align:center;padding:.8rem;border-right:1px solid var(--border)">
      <div style="font-size:1.2rem;font-weight:800;color:var(--a);">${fN(totalDl)}</div>
      <div style="font-size:.7rem;color:var(--tx3);font-family:var(--fm);">DOWNLOADS</div>
    </div>
    <div style="text-align:center;padding:.8rem;">
      <div style="font-size:1.2rem;font-weight:800;color:var(--a);">${plugins.filter(p=>p.status==='live').length}</div>
      <div style="font-size:.7rem;color:var(--tx3);font-family:var(--fm);">LIVE</div>
    </div>`;

  // Edit profile form pre-fill
  const nm=document.getElementById('pr-dn'); if(nm) nm.value=u.displayName||'';
  const bio=document.getElementById('pr-bi'); if(bio) bio.value=u.bio||'';
  const web=document.getElementById('pr-wb'); if(web) web.value=u.website||'';
  const disc=document.getElementById('pr-dc'); if(disc) disc.value=u.discord||'';
  const gh=document.getElementById('pr-gh'); if(gh) gh.value=u.github||'';
}

async function saveProfile() {
  const displayName = document.getElementById('pr-dn')?.value.trim()||'';
  const bio         = document.getElementById('pr-bi')?.value||'';
  const website     = document.getElementById('pr-wb')?.value.trim()||'';
  const discord     = document.getElementById('pr-dc')?.value.trim()||'';
  const github      = document.getElementById('pr-gh')?.value.trim()||'';
  try {
    const r = await API.updateProfile({displayName,bio,website,discord,github});
    APP.displayName = r.displayName;
    document.getElementById('sb-un').textContent = r.displayName||APP.user;
    renderPR();
    toast('Profile saved!','green');
  } catch(err) { toast('Error: '+err.message,'red'); }
}

// ═══════════════════════════════════════
// ── SETTINGS (tabbed)
// ═══════════════════════════════════════
async function renderSE() {
  if (!APP.user) return;
  let u={notifications:{downloads:true,reviews:true,updates:true,newsletter:false}};
  try { u = await API.me(); } catch {}
  const n = u.notifications||{};

  // Set notification toggles
  const notifIds = ['notif-dl','notif-rv','notif-up','notif-nl'];
  const notifKeys = ['downloads','reviews','updates','newsletter'];
  notifIds.forEach((id,i)=>{
    const el=document.getElementById(id);
    if(el) el.checked=!!n[notifKeys[i]];
  });

  // Set theme label
  const tl=document.getElementById('se-theme-lbl');
  if(tl) tl.textContent=APP.theme.toUpperCase();

  // Open first tab
  setSeTab('profile');
}

function setSeTab(tab) {
  document.querySelectorAll('.se-tab').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));
  document.querySelectorAll('.se-section').forEach(s=>s.classList.toggle('active',s.id==='se-'+tab));
}

async function saveNotifications() {
  const data = {
    downloads: document.getElementById('notif-dl')?.checked||false,
    reviews:   document.getElementById('notif-rv')?.checked||false,
    updates:   document.getElementById('notif-up')?.checked||false,
    newsletter:document.getElementById('notif-nl')?.checked||false,
  };
  try {
    await API.updateNotifications(data);
    toast('Notification preferences saved!','green');
  } catch(err) { toast('Error: '+err.message,'red'); }
}

// ═══════════════════════════════════════
// ── API KEYS
// ═══════════════════════════════════════
async function renderAK() {
  if (!APP.user) return;
  try {
    const r = await API.apiKey();
    const keyEl = document.getElementById('ak-val');
    if (keyEl) keyEl.textContent = r.key ? '••••••••••••••••••••••••••••••' : '—';
    APP._apiKey = r.key;
    APP.keyRevealed = false;
  } catch {}
}

function toggleKeyReveal() {
  APP.keyRevealed = !APP.keyRevealed;
  const el = document.getElementById('ak-val');
  const btn = document.getElementById('ak-reveal');
  if (el) el.textContent = APP.keyRevealed ? (APP._apiKey||'—') : '••••••••••••••••••••••••••••••';
  if (btn) btn.textContent = APP.keyRevealed ? 'HIDE' : 'REVEAL';
}

async function copyApiKey() {
  const key = APP._apiKey;
  if (!key) return;
  try { await navigator.clipboard.writeText(key); toast('API key copied!','green'); }
  catch { toast('Could not copy. Please copy manually.','amber'); }
}

async function regenKey() {
  if (!confirm('Regenerate API key? Your old key will stop working immediately.')) return;
  try {
    const r = await API.regenApiKey();
    APP._apiKey = r.key;
    APP.keyRevealed = true;
    document.getElementById('ak-val').textContent = r.key;
    document.getElementById('ak-reveal').textContent = 'HIDE';
    toast('New API key generated!','green');
  } catch(err) { toast('Error: '+err.message,'red'); }
}
