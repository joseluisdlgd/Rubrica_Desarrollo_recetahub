// ══════════════════════════════════════════
// RecetaHub 2.0 — app.js (unified)
// ══════════════════════════════════════════

// ── ESTADO ──
let usuarios = JSON.parse(localStorage.getItem('rh_usuarios') || '[]');
let recetas   = JSON.parse(localStorage.getItem('rh_recetas')  || '[]');
let sesion    = JSON.parse(localStorage.getItem('rh_sesion')   || 'null');

let filtros  = { tipo: 'Todos', dieta: 'Todos', tiempo: 'Todos', dificultad: 'Todos' };
let sortMode = 'popular';
let searchQ  = '';
let detailId = null;
let stepCount = 1;
let createStep = 2;

const DIAS = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
const MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];

function save() {
  localStorage.setItem('rh_usuarios', JSON.stringify(usuarios));
  localStorage.setItem('rh_recetas',  JSON.stringify(recetas));
  localStorage.setItem('rh_sesion',   JSON.stringify(sesion));
}
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2); }
function esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

// ══ DARK MODE ══
function initDarkMode() {
  if (localStorage.getItem('rh_dark') === 'true') applyDark(true);
}
function toggleDark() { applyDark(!document.body.classList.contains('dark')); }
function applyDark(on) {
  document.body.classList.toggle('dark', on);
  const btn = document.getElementById('btn-dark');
  if (btn) btn.innerHTML = on ? svgIcon('sun') : svgIcon('moon');
  localStorage.setItem('rh_dark', on);
}
function svgIcon(name) {
  const icons = {
    moon: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z"/></svg>`,
    sun:  `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`,
  };
  return icons[name] || '';
}

// ══ AUTH ══
function switchAuth(t) {
  document.getElementById('auth-login').style.display    = t === 'login'    ? 'block' : 'none';
  document.getElementById('auth-register').style.display = t === 'register' ? 'block' : 'none';
  document.querySelectorAll('.auth-tab').forEach((b,i) =>
    b.classList.toggle('active', (i===0&&t==='login') || (i===1&&t==='register'))
  );
}
function doLogin() {
  const email = document.getElementById('l-email').value.trim();
  const pass  = document.getElementById('l-pass').value;
  if (!email || !pass) { toast('Completa los campos'); return; }
  let u = usuarios.find(u => u.email === email);
  if (!u) {
    u = { id: uid(), nombre: email.split('@')[0], email, pass, guardadas: [], misRecetas: [] };
    usuarios.push(u); save();
  }
  sesion = u; save(); initApp();
}
function doRegister() {
  const nombre = document.getElementById('r-nombre').value.trim();
  const email  = document.getElementById('r-email').value.trim();
  const pass   = document.getElementById('r-pass').value;
  if (!nombre || !email || !pass) { toast('Completa todos los campos'); return; }
  if (usuarios.find(u => u.email === email)) { toast('Correo ya registrado'); return; }
  const u = { id: uid(), nombre, email, pass, guardadas: [], misRecetas: [] };
  usuarios.push(u); sesion = u; save(); initApp();
}
function logout() {
  sesion = null;
  localStorage.removeItem('rh_sesion');
  localStorage.removeItem('rh_tutorial_seen');
  document.getElementById('page-app').classList.remove('active');
  document.getElementById('page-auth').classList.add('active');
  toast('Hasta pronto');
}

// ══ INIT APP ══
function initApp() {
  document.getElementById('page-auth').classList.remove('active');
  document.getElementById('page-app').classList.add('active');
  const ini = sesion.nombre.charAt(0).toUpperCase();
  document.getElementById('user-avatar').textContent    = ini;
  document.getElementById('sb-avatar').textContent      = ini;
  document.getElementById('sb-username').textContent    = sesion.nombre;
  updateWelcomeBar();
  showView('explorar');
  if (typeof tutShow === 'function') setTimeout(() => tutShow(false), 350);
}

function updateWelcomeBar() {
  const now = new Date();
  document.getElementById('wb-greeting').textContent =
    `Hola, ${sesion.nombre.split(' ')[0]} — ${DIAS[now.getDay()]} ${now.getDate()} de ${MESES[now.getMonth()]}`;
  document.getElementById('wb-phrase').textContent = phraseOfDay();
  document.getElementById('hs-recetas').textContent   = recetas.length;
  document.getElementById('hs-usuarios').textContent  = usuarios.length;
  const u = getUser();
  document.getElementById('hs-guardadas').textContent = u ? (u.guardadas||[]).length : 0;
  document.getElementById('hs-likes').textContent     = recetas.reduce((s,r)=>s+(r.likes||0),0);
}

function phraseOfDay() {
  const phrases = [
    'Hoy cocinamos algo distinto','La cocina espera','Un plato nuevo siempre sorprende',
    'Ingredientes simples, sabores únicos','Cada receta es una historia',
  ];
  return phrases[new Date().getDay() % phrases.length];
}

// ══ VISTAS ══
function showView(v) {
  document.getElementById('view-explorar').style.display = 'none';
  document.getElementById('view-crear').style.display    = 'none';

  document.querySelectorAll('.tnav').forEach(el => el.classList.remove('active'));
  const tabMap = { explorar: 0, crear: 1, guardadas: 2, perfil: 3 };
  const tabs = document.querySelectorAll('.tnav');
  if (tabMap[v] !== undefined && tabs[tabMap[v]]) tabs[tabMap[v]].classList.add('active');

  if (v === 'explorar') {
    document.getElementById('view-explorar').style.display = '';
    renderExplorar();
  } else if (v === 'crear') {
    document.getElementById('view-crear').style.display = '';
    initCrearView();
  } else if (v === 'guardadas') {
    document.getElementById('view-explorar').style.display = '';
    renderGuardadas();
  } else if (v === 'perfil') {
    document.getElementById('view-explorar').style.display = '';
    renderPerfil();
  }
}

// ══ EXPLORAR ══
function renderExplorar() {
  updateMainHeader('Explorar recetas');
  let lista = getFilteredList();
  renderRecipeList(lista);
  if (lista.length > 0 && !detailId) selectRecipe(lista[0].id, false);
  renderSidebarRecents();
}

function renderGuardadas() {
  const u = getUser();
  const lista = u ? recetas.filter(r => (u.guardadas||[]).includes(r.id)) : [];
  updateMainHeader('Mis guardadas');
  renderRecipeList(lista);
  if (lista.length > 0) selectRecipe(lista[0].id, false);
}

function renderPerfil() {
  const u = getUser();
  const mis = u ? recetas.filter(r => r.autorId === u.id) : [];
  updateMainHeader('Mis recetas');
  renderRecipeList(mis);
  if (mis.length > 0) selectRecipe(mis[0].id, false);
}

function updateMainHeader(title) {
  document.getElementById('main-title').textContent = title;
}

function getFilteredList() {
  let lista = [...recetas];
  if (searchQ) lista = lista.filter(r =>
    r.nombre.toLowerCase().includes(searchQ) ||
    (r.descripcion||'').toLowerCase().includes(searchQ) ||
    (r.ingredientes||[]).some(i => i.nombre.toLowerCase().includes(searchQ))
  );
  if (filtros.tipo !== 'Todos')       lista = lista.filter(r => r.tipo === filtros.tipo);
  if (filtros.dieta !== 'Todos')      lista = lista.filter(r => r.dieta === filtros.dieta);
  if (filtros.tiempo !== 'Todos')     lista = lista.filter(r => r.tiempo === filtros.tiempo);
  if (filtros.dificultad !== 'Todos') lista = lista.filter(r => r.dificultad === filtros.dificultad);
  if (sortMode === 'popular')  lista.sort((a,b) => (b.likes||0)-(a.likes||0));
  if (sortMode === 'reciente') lista.sort((a,b) => (b.creadoEn||0)-(a.creadoEn||0));
  if (sortMode === 'rapido')   lista.sort((a,b) => tiempoSort(a.tiempo)-tiempoSort(b.tiempo));
  if (sortMode === 'valorada') lista.sort((a,b) => avgRating(b)-avgRating(a));
  if (sortMode === 'calorias') lista.sort((a,b) => (a.calorias||9999)-(b.calorias||9999));
  return lista;
}

function tiempoSort(t) {
  if (t==='<15 min') return 1; if (t==='15-30 min') return 2;
  if (t==='30-60 min') return 3; return 4;
}
function avgRating(r) {
  return r.rating && r.rating.count ? r.rating.suma/r.rating.count : 0;
}

function renderRecipeList(lista) {
  const u = getUser();
  const g = document.getElementById('recipe-list');
  document.getElementById('main-sub').textContent = `${lista.length} receta${lista.length!==1?'s':''}`;

  if (!lista.length) {
    g.innerHTML = `<div style="padding:40px 0;text-align:center;color:var(--muted);font-size:13px">Sin resultados</div>`;
    document.getElementById('detail-panel').innerHTML = '';
    return;
  }

  g.innerHTML = lista.map((r, i) => {
    const saved  = u && (u.guardadas||[]).includes(r.id);
    const avg    = avgRating(r);
    const isNew  = (Date.now() - (r.creadoEn||0)) < 1000*60*60*24*3;
    const dietaPill = dietaToTag(r.dieta);
    const isSelected = r.id === detailId;
    return `
    <div class="rrow${isSelected?' rrow-sel':''}" id="rrow-${r.id}" onclick="selectRecipe('${r.id}',true)">
      <div class="rnum">${String(i+1).padStart(2,'0')}</div>
      <img class="rthumb" src="${r.photoUrl||''}" onerror="this.style.display='none'" alt="${esc(r.nombre)}" ${r.photoUrl?'':'style="display:none"'}/>
      ${!r.photoUrl ? `<div class="rthumb" style="display:flex;align-items:center;justify-content:center;font-size:18px;background:var(--bg)">${r.emoji||'🍽️'}</div>` : ''}
      <div class="rinfo">
        <div class="rname">${esc(r.nombre)}</div>
        <div class="rmeta">
          <span>${esc(r.autorNombre||'Chef')}</span>
          <span class="rdot"></span>
          <span>${r.tiempo||'—'}</span>
          ${r.calorias ? `<span class="rdot"></span><span>${r.calorias} kcal</span>` : ''}
        </div>
      </div>
      <div class="ractions">
        ${isNew ? `<span class="pill pill-new">Nueva</span>` : ''}
        ${dietaPill}
        ${avg > 0 ? `<span class="rstar">★ ${avg.toFixed(1)}</span>` : ''}
        <span class="rlikes">${r.likes||0} ♥</span>
        <button class="ibtn${saved?' saved':''}" title="Guardar" onclick="event.stopPropagation();toggleSave('${r.id}',this)">
          ${saved ? '🔖' : '＋'}
        </button>
        ${u && r.autorId === u.id ? `<button class="ibtn ibtn-del" title="Eliminar receta" onclick="event.stopPropagation();eliminarReceta('${r.id}')">🗑</button>` : ''}
      </div>
    </div>`;
  }).join('');
}

function dietaToTag(d) {
  if (d==='Vegetariana') return `<span class="pill pill-v">Vegetariana</span>`;
  if (d==='Vegana')      return `<span class="pill pill-vg">Vegana</span>`;
  if (d==='Sin gluten')  return `<span class="pill pill-ng">Sin gluten</span>`;
  return '';
}

// ── SELECCIONAR RECETA (DETALLE) ──
function selectRecipe(id, scroll) {
  detailId = id;
  document.querySelectorAll('.rrow').forEach(el => el.classList.remove('rrow-sel'));
  const row = document.getElementById('rrow-'+id);
  if (row) { row.classList.add('rrow-sel'); if(scroll) row.scrollIntoView({behavior:'smooth',block:'nearest'}); }

  const r = recetas.find(r => r.id === id); if (!r) return;
  r.vistas = (r.vistas||0)+1; save();

  const u = getUser();
  const saved  = u && (u.guardadas||[]).includes(r.id);
  const avg    = avgRating(r);
  const myRate = r.rating && r.rating.byUser && u ? (r.rating.byUser[u.id]||0) : 0;

  const starsHTML = [1,2,3,4,5].map(n =>
    `<span class="star" style="cursor:pointer;font-size:15px;${myRate>=n?'color:#c8922a':'color:var(--faint)'}"
      onmouseover="previewStars(${n},'${id}')" onmouseout="resetStars('${id}')"
      onclick="rateReceta('${id}',${n})">★</span>`
  ).join('');

  document.getElementById('detail-panel').innerHTML = `
    <div class="dp-img">
      ${r.photoUrl
        ? `<img src="${r.photoUrl}" alt="${esc(r.nombre)}"/><div class="dp-img-overlay"></div>`
        : `<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:52px;opacity:.3">${r.emoji||'🍽️'}</div>`}
      <div class="dp-img-tag">${r.tipo||'Receta'}</div>
    </div>
    <div class="dp-body">
      <div class="dp-name">${esc(r.nombre)}</div>
      <div class="dp-auth">por ${esc(r.autorNombre||'Chef')}</div>
      <div class="dp-stars">
        ${starsHTML}
        <span>${avg>0 ? avg.toFixed(1)+` (${r.rating.count} voto${r.rating.count!==1?'s':''})` : 'Sin calificaciones'}</span>
      </div>
      <div class="dp-grid">
        <div class="dp-stat"><div class="dp-slbl">Tiempo</div><div class="dp-sval">${r.tiempo||'—'}</div></div>
        <div class="dp-stat"><div class="dp-slbl">Calorías</div><div class="dp-sval">${r.calorias ? r.calorias+' kcal' : '—'}</div></div>
        <div class="dp-stat"><div class="dp-slbl">Porciones</div><div class="dp-sval">${r.porciones||4}</div></div>
        <div class="dp-stat"><div class="dp-slbl">Dificultad</div><div class="dp-sval">${r.dificultad||'Fácil'}</div></div>
      </div>
      <div class="dp-sec">Ingredientes</div>
      ${(r.ingredientes||[]).map(i => `<div class="ing-line"><span>${esc(i.nombre)}</span><span class="ing-qty">${esc(i.cantidad)}</span></div>`).join('')}
      <div class="dp-steps">
        <div class="dp-sec" style="margin-top:12px">Preparación</div>
        ${(r.pasos||[]).map((p,n) => `<div class="step-row"><div class="step-n">${n+1}</div><div class="step-txt">${esc(p)}</div></div>`).join('')}
      </div>
    </div>
    <div class="dp-footer">
      <button class="dp-btn" onclick="compartir('${r.id}')">Compartir</button>
      <button class="dp-btn${saved?' primary':''}" onclick="toggleSaveDetail('${r.id}',this)">${saved?'🔖 Guardada':'+ Guardar'}</button>
      ${u && r.autorId === u.id ? `<button class="dp-btn dp-btn-del" onclick="eliminarReceta('${r.id}')">🗑 Eliminar</button>` : ''}
    </div>`;
}

function previewStars(val, id) {
  document.querySelectorAll('#detail-panel .star').forEach((s,i) => {
    s.style.color = i < val ? '#c8922a' : 'var(--faint)';
  });
}
function resetStars(id) {
  const r = recetas.find(r=>r.id===id); if(!r) return;
  const u = getUser();
  const my = r.rating && r.rating.byUser && u ? (r.rating.byUser[u.id]||0) : 0;
  document.querySelectorAll('#detail-panel .star').forEach((s,i) => {
    s.style.color = i < my ? '#c8922a' : 'var(--faint)';
  });
}
function rateReceta(id, val) {
  const u = getUser(); if(!u) return;
  const r = recetas.find(r=>r.id===id); if(!r) return;
  if (!r.rating) r.rating = { suma:0, count:0, byUser:{} };
  const prev = r.rating.byUser[u.id] || 0;
  r.rating.suma  = (r.rating.suma - prev) + val;
  r.rating.count = prev ? r.rating.count : r.rating.count+1;
  r.rating.byUser[u.id] = val;
  save(); selectRecipe(id, false);
  toast(`★ Calificaste con ${val} estrella${val!==1?'s':''}`);
}

function compartir(id) {
  const r = recetas.find(r=>r.id===id); if(!r) return;
  const txt = `${r.nombre} — ${r.tipo} · ${r.tiempo}\n${r.ingredientes.length} ingredientes · ${r.pasos.length} pasos\n\nVía RecetaHub`;
  if (navigator.clipboard) navigator.clipboard.writeText(txt).then(() => toast('Receta copiada al portapapeles'));
  else toast('Receta copiada');
}

function eliminarReceta(id) {
  const r = recetas.find(r=>r.id===id); if(!r) return;
  const u = getUser(); if(!u || r.autorId !== u.id) return;
  if (!confirm(`¿Eliminar "${r.nombre}"? Esta acción no se puede deshacer.`)) return;

  // Quitar de la lista global
  recetas = recetas.filter(r => r.id !== id);

  // Quitar de misRecetas del usuario
  u.misRecetas = (u.misRecetas||[]).filter(rid => rid !== id);

  // Quitar de guardadas de todos los usuarios
  usuarios.forEach(usr => { usr.guardadas = (usr.guardadas||[]).filter(rid => rid !== id); });

  detailId = null;
  updateUser(u); save(); updateWelcomeBar();
  toast('Receta eliminada');

  // Volver a la vista correcta
  const currentTitle = document.getElementById('main-title')?.textContent;
  if (currentTitle === 'Mis recetas') renderPerfil();
  else if (currentTitle === 'Mis guardadas') renderGuardadas();
  else renderExplorar();
}

// ── GUARDAR / LIKE ──
function toggleSave(id, btn) {
  const u = getUser(); if(!u) return;
  const idx = (u.guardadas||[]).indexOf(id);
  if (idx===-1) { u.guardadas.push(id); btn.textContent='🔖'; btn.classList.add('saved'); toast('Guardada'); }
  else          { u.guardadas.splice(idx,1); btn.textContent='＋'; btn.classList.remove('saved'); toast('Eliminada de guardadas'); }
  updateUser(u); save(); updateWelcomeBar();
}
function toggleSaveDetail(id, btn) {
  const u = getUser(); if(!u) return;
  const idx = (u.guardadas||[]).indexOf(id);
  if (idx===-1) { u.guardadas.push(id); btn.textContent='🔖 Guardada'; btn.classList.add('primary'); toast('Guardada'); }
  else          { u.guardadas.splice(idx,1); btn.textContent='+ Guardar'; btn.classList.remove('primary'); toast('Eliminada'); }
  updateUser(u); save(); updateWelcomeBar();
}

// ── SIDEBAR ──
function setFiltro(tipo, valor, btn) {
  filtros[tipo] = valor;
  if (btn) {
    const parent = btn.parentElement;
    parent.querySelectorAll('.s-tag').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
  }
  renderExplorar();
}
function setSort(mode, btn) {
  sortMode = mode;
  document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderExplorar();
}
function onSearch(q) {
  searchQ = q.toLowerCase();
  renderExplorar();
}
function renderSidebarRecents() {
  const g = document.getElementById('sb-recents');
  const recent = [...recetas].sort((a,b)=>(b.vistas||0)-(a.vistas||0)).slice(0,3);
  g.innerHTML = recent.map(r => `
    <div class="sb-r-item" onclick="selectRecipe('${r.id}',true)">
      <div class="sb-r-dot"></div>
      <div class="sb-r-name">${esc(r.nombre)}</div>
    </div>`).join('');
}

// ══ CREAR RECETA ══
function initCrearView() {
  renderProgressBar(createStep);
  actualizarPreview();
  actualizarCalorias();
}

function renderProgressBar(active) {
  const steps = [
    { label: 'Información' },
    { label: 'Ingredientes' },
    { label: 'Pasos' },
    { label: 'Publicar' },
  ];
  document.getElementById('progress-bar').innerHTML = steps.map((s,i) => {
    const n = i+1;
    const cls = n < active ? 'prog-step done' : n === active ? 'prog-step active' : 'prog-step';
    return `<div class="${cls}" onclick="setCreateStep(${n})">${n < active ? '✓ ' : ''}${s.label}</div>`;
  }).join('');
}

function setCreateStep(n) {
  createStep = n;
  renderProgressBar(n);
}

function addIngRow() {
  const b = document.getElementById('ing-builder');
  const d = document.createElement('div'); d.className = 'ing-row';
  d.innerHTML = `
    <input class="fi" type="text" placeholder="Ingrediente" oninput="actualizarCalorias();actualizarPreview()"/>
    <input class="fi" type="text" placeholder="Cant."/>
    <select class="unit-sel"><option>taza</option><option>g</option><option>kg</option><option>ml</option><option>l</option><option>cdta</option><option>cda</option><option>und</option><option>oz</option></select>
    <button class="rmv-btn" onclick="removeRow(this)" aria-label="Eliminar">✕</button>`;
  b.appendChild(d);
}

function addStepRow() {
  stepCount++;
  const b = document.getElementById('steps-builder');
  const d = document.createElement('div');
  d.innerHTML = `
    <div class="step-brow">
      <div class="step-bnum">${stepCount}</div>
      <textarea class="step-barea" placeholder="Describe el paso ${stepCount}..."></textarea>
      <button class="rmv-btn" style="margin-top:8px;margin-left:6px" onclick="removeRow(this)" aria-label="Eliminar">✕</button>
    </div>
    <div class="step-timer">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
      Temporizador: <input type="number" placeholder="—" min="1"/> min
    </div>`;
  b.appendChild(d);
}

function removeRow(btn) {
  btn.closest('.ing-row,.step-brow')?.parentElement?.remove() || btn.closest('.ing-row')?.remove();
  renumberSteps(); actualizarCalorias(); actualizarPreview();
}

function renumberSteps() {
  stepCount = 0;
  document.querySelectorAll('#steps-builder .step-bnum').forEach(el => {
    el.textContent = ++stepCount;
  });
}

function actualizarPreview() {
  const nombre = document.getElementById('c-nombre')?.value || 'Nombre de la receta';
  const tipo   = document.getElementById('c-tipo')?.value   || 'Tipo';
  const dieta  = document.getElementById('c-dieta')?.value  || '';
  const tiempo = document.getElementById('c-tiempo')?.value || '';

  document.getElementById('pc-name').textContent = nombre || 'Nombre de la receta';
  document.getElementById('pc-auth').textContent = 'por ' + (sesion?.nombre || 'Chef');

  const pills = document.getElementById('pc-pills');
  pills.innerHTML = [tipo, dieta !== 'Normal' ? dieta : '', tiempo]
    .filter(Boolean).map(p => `<span class="pc-pill">${p}</span>`).join('');

  const tags = [...document.querySelectorAll('.tag-chip.active')].map(t => t.dataset.tag).filter(Boolean);
  tags.forEach(t => pills.innerHTML += `<span class="pc-pill">#${t}</span>`);
}

// ── ESTIMADOR DE CALORÍAS ──
const KCAL_MAP = {
  'harina':364,'azúcar':387,'aceite':884,'mantequilla':717,'leche':42,
  'huevo':155,'huevos':155,'queso':402,'arroz':130,'pasta':131,'pan':265,
  'avena':389,'pollo':165,'carne':250,'cerdo':242,'res':250,'atún':116,
  'camarones':99,'salmón':208,'tomate':18,'cebolla':40,'ajo':149,
  'zanahoria':41,'espinaca':23,'espinacas':23,'papa':77,'papas':77,
  'plátano':89,'fresa':32,'fresas':32,'manzana':52,'naranja':47,
  'chocolate':546,'cacao':228,'miel':304,'granola':471,
  'leche de coco':230,'leche de almendra':17,
  'aceite de oliva':884,'aceite de coco':892,'ricotta':174,
};

function estimarCalorias(ings) {
  let total = 0, encontrados = 0;
  ings.forEach(ing => {
    const nom = ing.nombre.toLowerCase();
    for (const [key, kcal] of Object.entries(KCAL_MAP)) {
      if (nom.includes(key)) {
        const cant = (ing.cantidad||'').toLowerCase();
        const num  = parseFloat((cant.match(/[\d.]+/)||['1'])[0]);
        let g = 100;
        if (cant.includes('kg')) g = num*1000;
        else if (cant.includes(' g')||cant.includes('gr')) g = num;
        else if (cant.includes('ml')||cant.includes(' l')) g = num;
        else if (cant.includes('taza')) g = num*240;
        else if (cant.includes('cdta')) g = num*5;
        else if (cant.includes('cda'))  g = num*15;
        else g = num*80;
        total += (kcal/100)*g; encontrados++; break;
      }
    }
  });
  return { total: Math.round(total), encontrados };
}

function actualizarCalorias() {
  const ings = [];
  document.querySelectorAll('#ing-builder .ing-row').forEach(row => {
    const ins = row.querySelectorAll('input');
    if (ins[0]?.value.trim()) {
      const sel = row.querySelector('select');
      ings.push({ nombre: ins[0].value.trim(), cantidad: `${ins[1]?.value||1} ${sel?.value||''}` });
    }
  });
  const porciones = parseInt(document.getElementById('c-porciones')?.value || 4);
  const { total, encontrados } = estimarCalorias(ings);
  const porPorto = Math.round(total / Math.max(porciones,1));

  const numEl = document.getElementById('cal-num');
  const subEl = document.getElementById('cal-sub');
  if (numEl) numEl.textContent = encontrados > 0 ? `${porPorto} kcal` : '—';
  if (subEl) subEl.textContent = encontrados > 0
    ? `por porción · ${encontrados} ingrediente${encontrados!==1?'s':''} estimado${encontrados!==1?'s':''}`
    : 'Agrega ingredientes para estimar';

  const prot = Math.round(porPorto * 0.15);
  const carb = Math.round(porPorto * 0.52 / 4);
  const fat  = Math.round(porPorto * 0.28 / 9);
  document.getElementById('macro-prot-val').textContent = encontrados > 0 ? `${prot}g` : '—';
  document.getElementById('macro-carb-val').textContent = encontrados > 0 ? `${carb}g` : '—';
  document.getElementById('macro-fat-val').textContent  = encontrados > 0 ? `${fat}g`  : '—';
}

function toggleTag(el) {
  el.classList.toggle('active');
  actualizarPreview();
}

function setVisibilidad(val, btn) {
  document.querySelectorAll('.vis-opt').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

// ── GUARDAR RECETA ──
function guardarReceta() {
  const nombre = document.getElementById('c-nombre').value.trim();
  if (!nombre) { toast('El nombre es obligatorio'); return; }

  const ings = [], pasos = [];
  document.querySelectorAll('#ing-builder .ing-row').forEach(row => {
    const ins = row.querySelectorAll('input');
    const sel = row.querySelector('select');
    if (ins[0]?.value.trim())
      ings.push({ nombre: ins[0].value.trim(), cantidad: `${ins[1]?.value||''} ${sel?.value||''}`.trim() });
  });
  document.querySelectorAll('#steps-builder .step-barea').forEach(ta => {
    if (ta.value.trim()) pasos.push(ta.value.trim());
  });

  if (!ings.length)  { toast('Agrega al menos un ingrediente'); return; }
  if (!pasos.length) { toast('Agrega al menos un paso'); return; }

  const porciones = parseInt(document.getElementById('c-porciones')?.value||4);
  const { total } = estimarCalorias(ings);
  const calorias  = total > 0 ? Math.round(total/Math.max(porciones,1)) : null;

  const u = getUser();
  const r = {
    id: uid(), creadoEn: Date.now(),
    nombre, emoji: '🍽️',
    tipo:       document.getElementById('c-tipo').value,
    dieta:      document.getElementById('c-dieta').value,
    tiempo:     document.getElementById('c-tiempo').value,
    porciones:  document.getElementById('c-porciones').value,
    dificultad: document.getElementById('c-dificultad').value,
    descripcion:document.getElementById('c-desc').value.trim(),
    ingredientes: ings, pasos, calorias,
    autorId: u.id, autorNombre: u.nombre,
    likes: 0, likedBy: [], vistas: 0,
  };
  recetas.unshift(r);
  u.misRecetas = u.misRecetas || [];
  u.misRecetas.push(r.id);
  updateUser(u); save();
  toast('¡Receta publicada!');
  showView('explorar');
}

// ══ UTILS ══
function getUser() { return sesion ? usuarios.find(u => u.id === sesion.id) || sesion : null; }
function updateUser(u) { const i = usuarios.findIndex(x => x.id===u.id); if(i>-1) usuarios[i]=u; sesion=u; }

let _tt;
function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg; el.classList.add('show');
  clearTimeout(_tt); _tt = setTimeout(() => el.classList.remove('show'), 2500);
}

// ══ DEMO DATA ══
function loadDemo() {
  const VER = 'v5-colombia-unified';
  if (recetas.length>0 && localStorage.getItem('rh_demo_ver')===VER) return;
  recetas = []; localStorage.removeItem('rh_recetas');
  const AID = 'demo-admin';
  if (!usuarios.find(u=>u.id===AID))
    usuarios.push({ id:AID, nombre:'Chef Demostración', email:'demo@recetahub.com', pass:'demo', guardadas:[], misRecetas:[] });

  const DEMO = [
    // ── COLOMBIANAS ──
    { nombre:'Ajiaco', emoji:'🍲',
      photoUrl:'https://tofuu.getjusto.com/orioneat-local/resized2/G8bjaSqGdhWepTkrr-1101-x.webp',
      tipo:'Almuerzo', dieta:'Sin gluten', tiempo:'30-60 min', porciones:'6', dificultad:'Media',
      likes:134, calorias:480,
      descripcion:'El plato emblema de Bogotá. Sopa espesa con tres tipos de papa, pollo y guascas.',
      ingredientes:[{nombre:'Pollo en presas',cantidad:'1 kg'},{nombre:'Papa criolla',cantidad:'500 g'},{nombre:'Papa pastusa',cantidad:'400 g'},{nombre:'Papa sabanera',cantidad:'400 g'},{nombre:'Mazorca',cantidad:'2 unidades'},{nombre:'Guascas secas',cantidad:'3 cdas'},{nombre:'Cebolla larga',cantidad:'2 ramas'},{nombre:'Ajo',cantidad:'4 dientes'},{nombre:'Crema de leche',cantidad:'200 ml'},{nombre:'Alcaparras',cantidad:'3 cdas'}],
      pasos:['Cocinar el pollo en 2.5 litros de agua con cebolla, ajo y sal 30 min. Retirar, deshuesar y desmenuzar.','En el mismo caldo agregar papa pastusa y sabanera. Cocinar 20 min.','Añadir papa criolla entera y mazorca. Cocinar 15 min hasta que la papa espese el caldo.','Incorporar guascas y pollo desmenuzado. Cocinar 5 min más.','Servir con crema de leche, alcaparras y aguacate.']},
    { nombre:'Bandeja Paisa Completa', emoji:'🍳',
      photoUrl:'https://cloudfront-us-east-1.images.arcpublishing.com/infobae/7ZLBIEXDAFEUFB2MXROVEX2DHI.jpg',
      tipo:'Almuerzo', dieta:'Normal', tiempo:'>60 min', porciones:'4', dificultad:'Difícil',
      likes:198, calorias:1150,
      descripcion:'El plato más contundente de Colombia. Frijoles, arroz, chicharrón, carne molida, chorizo, morcilla, huevo frito, plátano y aguacate.',
      ingredientes:[{nombre:'Frijoles rojos',cantidad:'500 g'},{nombre:'Carne molida de res',cantidad:'400 g'},{nombre:'Chorizo antioqueño',cantidad:'4 unidades'},{nombre:'Chicharrón',cantidad:'400 g'},{nombre:'Morcilla',cantidad:'4 rodajas'},{nombre:'Arroz blanco',cantidad:'4 tazas'},{nombre:'Huevos',cantidad:'4 unidades'},{nombre:'Plátano maduro',cantidad:'2 unidades'},{nombre:'Aguacate',cantidad:'2 unidades'},{nombre:'Hogao',cantidad:'1 taza'}],
      pasos:['Remojar frijoles la noche anterior. Cocinar en olla a presión 30 min con cebolla y ajo. Añadir hogao y comino.','Sofreír la carne molida con hogao y sal hasta dorar.','Freír el chicharrón hasta quedar crocante.','Asar el chorizo y la morcilla hasta estar bien cocidos.','Freír los huevos y rodajas de plátano maduro.','Montar la bandeja con todo por separado. Servir con aguacate y arepa.']},
    { nombre:'Sancocho de Gallina', emoji:'🐔',
      photoUrl:'https://i.ytimg.com/vi/Y-g63sNgyiw/hq720.jpg',
      tipo:'Almuerzo', dieta:'Sin gluten', tiempo:'>60 min', porciones:'8', dificultad:'Media',
      likes:112, calorias:390,
      descripcion:'El alma de los domingos colombianos. Caldito dorado con yuca, papa, plátano verde y mazorca.',
      ingredientes:[{nombre:'Gallina criolla en presas',cantidad:'1.5 kg'},{nombre:'Yuca',cantidad:'500 g'},{nombre:'Papa pastusa',cantidad:'400 g'},{nombre:'Plátano verde',cantidad:'1 unidad'},{nombre:'Mazorca',cantidad:'2 unidades'},{nombre:'Cilantro y cebolla larga',cantidad:'1 manojo'},{nombre:'Ajo',cantidad:'5 dientes'},{nombre:'Comino en polvo',cantidad:'1 cdta'},{nombre:'Color (achiote)',cantidad:'1 cdta'}],
      pasos:['Sazonar la gallina con sal, pimienta y ajo. Marinar 30 min.','Cocinar en 3 litros de agua con cebolla, cilantro y color 45 min.','Agregar yuca, mazorca y plátano verde. Cocinar 20 min.','Añadir papa y ajustar sal. Cocinar 15 min.','Servir con arroz blanco, aguacate y ají.']},
    { nombre:'Changua', emoji:'🥛',
      photoUrl:'https://vecinavegetariana.com/wp-content/uploads/2022/09/Changua-Colombiana-Colombian-Milk-and-Eggs-Breakfast-Soup-2-1.jpg',
      tipo:'Desayuno', dieta:'Vegetariana', tiempo:'<15 min', porciones:'2', dificultad:'Fácil',
      likes:76, calorias:220,
      descripcion:'El desayuno más tradicional de Bogotá. Sopa de leche con huevo pochado, cilantro y pan calado.',
      ingredientes:[{nombre:'Leche entera',cantidad:'2 tazas'},{nombre:'Agua',cantidad:'1 taza'},{nombre:'Huevos',cantidad:'2 unidades'},{nombre:'Cilantro fresco',cantidad:'2 ramas'},{nombre:'Cebolla larga',cantidad:'1 rama'},{nombre:'Pan tajado',cantidad:'4 rebanadas'}],
      pasos:['Hervir el agua con cebolla larga y sal 3 min.','Añadir la leche y llevar a ebullición suave.','Romper los huevos en la leche caliente. Tapar y cocinar 3-4 min.','Añadir cilantro picado. Ajustar sal.','Servir con pan para calado.']},
    { nombre:'Patacones con Hogao', emoji:'🍌',
      photoUrl:'https://mandolina.co/wp-content/uploads/2024/09/Palitos-de-Platano-Verde-con-Hogao-y-Queso-1-611x611.png',
      tipo:'Snack', dieta:'Vegana', tiempo:'<15 min', porciones:'4', dificultad:'Fácil',
      likes:89, calorias:280,
      descripcion:'Plátano verde aplastado y frito dos veces, crocante por fuera. El acompañante perfecto con hogao casero.',
      ingredientes:[{nombre:'Plátano verde',cantidad:'2 unidades'},{nombre:'Aceite para freír',cantidad:'500 ml'},{nombre:'Tomate chonto',cantidad:'3 unidades'},{nombre:'Cebolla cabezona',cantidad:'1 unidad'},{nombre:'Ajo',cantidad:'2 dientes'},{nombre:'Cilantro',cantidad:'al gusto'}],
      pasos:['Pelar y cortar los plátanos en rodajas de 4 cm.','Freír a 160°C durante 4 min. Escurrir.','Aplastar cada rodaja hasta obtener discos. Salar.','Freír a 180°C unos 2-3 min por lado hasta dorar.','Para el hogao: sofreír cebolla y ajo, añadir tomate picado, cocinar 10 min. Agregar cilantro.','Servir los patacones con hogao encima.']},
    { nombre:'Arepa de Chócolo con Quesito', emoji:'🌽',
      photoUrl:'https://recetas.encolombia.com/wp-content/uploads/2018/10/Receta-Arepa-Chocolo.jpg',
      tipo:'Desayuno', dieta:'Vegetariana', tiempo:'15-30 min', porciones:'6', dificultad:'Fácil',
      likes:105, calorias:340,
      descripcion:'Arepas dulces de maíz tierno molido con mantequilla y quesito blanco. Especialidad de Antioquia.',
      ingredientes:[{nombre:'Mazorcas de chócolo tierno',cantidad:'4 unidades'},{nombre:'Mantequilla',cantidad:'50 g'},{nombre:'Azúcar',cantidad:'2 cdas'},{nombre:'Sal',cantidad:'1 cdta'},{nombre:'Queso blanco campesino',cantidad:'300 g'},{nombre:'Huevo',cantidad:'1 unidad'}],
      pasos:['Desgranar las mazorcas y moler en licuadora hasta masa gruesa.','Mezclar con mantequilla derretida, azúcar, sal y el huevo.','Formar arepas de 1.5 cm de grosor y 12 cm de diámetro.','Cocinar en sartén a fuego medio 6-8 min por lado.','Servir con quesito desmenuzado y mantequilla.']},
    { nombre:'Sobrebarriga al Horno con Hogao', emoji:'🥩',
      photoUrl:'https://comemascarnedecerdo.co/wp-content/uploads/2024/04/img-sobrebarriga-de-cerdo-a-la-criolla-1536x1024-1-1.jpg',
      tipo:'Cena', dieta:'Sin gluten', tiempo:'>60 min', porciones:'6', dificultad:'Media',
      likes:91, calorias:520,
      descripcion:'Corte de carne marinado en cerveza y especias, horneado lentamente hasta quedar tierno con hogao casero.',
      ingredientes:[{nombre:'Sobrebarriga de res',cantidad:'1.5 kg'},{nombre:'Cerveza rubia',cantidad:'350 ml'},{nombre:'Ajo',cantidad:'6 dientes'},{nombre:'Comino en polvo',cantidad:'2 cdtas'},{nombre:'Tomate chonto',cantidad:'4 unidades'},{nombre:'Cebolla cabezona',cantidad:'2 unidades'},{nombre:'Cilantro',cantidad:'al gusto'},{nombre:'Sal, pimienta y color',cantidad:'al gusto'}],
      pasos:['Marinar la sobrebarriga 2 horas con cerveza, ajo, comino, sal y color.','Dorar en aceite caliente por todos los lados para sellar.','Colocar en bandeja, bañar con la marinada y cubrir con aluminio.','Hornear a 170°C durante 2 horas. Destapar los últimos 20 min.','Preparar hogao: sofreír cebolla, ajo y tomate 15 min.','Rebanar en contra de la fibra y servir con hogao.']},
    { nombre:'Obleas con Arequipe y Mora', emoji:'🫓',
      photoUrl:'https://i.pinimg.com/736x/62/1d/8e/621d8ee9b976a0abca9d713a5bd08c67.jpg',
      tipo:'Postre', dieta:'Vegetariana', tiempo:'<15 min', porciones:'4', dificultad:'Fácil',
      likes:118, calorias:360,
      descripcion:'El postre callejero más querido de Colombia. Obleas crujientes con arequipe, mermelada de mora y queso.',
      ingredientes:[{nombre:'Obleas medianas',cantidad:'8 unidades'},{nombre:'Arequipe (dulce de leche)',cantidad:'300 g'},{nombre:'Mermelada de mora',cantidad:'150 g'},{nombre:'Queso blanco rallado',cantidad:'100 g'},{nombre:'Crema de leche',cantidad:'100 ml'}],
      pasos:['Extender arequipe sobre una oblea.','Añadir mermelada de mora.','Agregar queso rallado y crema de leche.','Cubrir con la segunda oblea presionando suavemente.','Servir de inmediato.']},
    { nombre:'Caldo de Costilla', emoji:'🍖',
      photoUrl:'https://cloudfront-us-east-1.images.arcpublishing.com/elespectador/SEZQLLQHIBDVNM77ZGOINGUXEQ.jpg',
      tipo:'Desayuno', dieta:'Sin gluten', tiempo:'30-60 min', porciones:'4', dificultad:'Fácil',
      likes:83, calorias:310,
      descripcion:'El desayuno bogotano de los sábados. Caldo limpio de costilla de res con papa y cilantro.',
      ingredientes:[{nombre:'Costilla de res',cantidad:'800 g'},{nombre:'Papa pastusa',cantidad:'4 medianas'},{nombre:'Cebolla larga',cantidad:'3 ramas'},{nombre:'Cilantro fresco',cantidad:'1 manojo'},{nombre:'Ajo',cantidad:'4 dientes'},{nombre:'Comino',cantidad:'½ cdta'}],
      pasos:['Lavar costillas y llevar a olla con 2 litros de agua, cebolla, ajo y sal.','Desespumar durante los primeros 10 min para caldo limpio.','Cocinar a fuego medio 35-40 min hasta que la carne esté tierna.','Añadir papa en cuartos. Cocinar 15 min más.','Rectificar sal, añadir cilantro. Servir con arepa.']},
    { nombre:'Lechona Tolimense', emoji:'🐷',
      photoUrl:'https://cuponassetsv2.cuponatic-latam.com/backendCo/uploads/imagenes_descuentos/194577/ff029d6b975c717edfcaefc41ddca3da2d512b54.XL2.jpg',
      tipo:'Almuerzo', dieta:'Sin gluten', tiempo:'>60 min', porciones:'20', dificultad:'Difícil',
      likes:156, calorias:680,
      descripcion:'El plato festivo del Tolima. Cerdo relleno de arroz, chicharrón y arveja, horneado con piel crocante.',
      ingredientes:[{nombre:'Cerdo (pierna con piel)',cantidad:'5 kg'},{nombre:'Arroz cocido',cantidad:'2 tazas'},{nombre:'Arveja cocida',cantidad:'1 taza'},{nombre:'Chicharrón trozado',cantidad:'300 g'},{nombre:'Cebolla cabezona',cantidad:'3 unidades'},{nombre:'Ajo',cantidad:'1 cabeza'},{nombre:'Comino en polvo',cantidad:'3 cdas'},{nombre:'Aceite con color',cantidad:'4 cdas'}],
      pasos:['Abrir la pierna para crear cavidad sin romper la piel. Salpimentar.','Mezclar arroz, arvejas, chicharrón, cebolla y comino. Rellenar el cerdo.','Coser la apertura con hilo de cocina.','Hornear a 180°C en bandeja profunda 4-5 horas, bañando cada hora.','Los últimos 30 min subir a 220°C para piel crocante.','Reposar 20 min antes de cortar. Servir con arepa y ají.']},
    { nombre:'Cazuela de Mariscos', emoji:'🦐',
      photoUrl:'https://especiasmontero.com/wp-content/uploads/2025/03/Cazuela-de-mariscos.jpg',
      tipo:'Almuerzo', dieta:'Sin gluten', tiempo:'30-60 min', porciones:'4', dificultad:'Media',
      likes:127, calorias:380,
      descripcion:'El sabor del Caribe colombiano. Camarones, calamares y langostinos en sofrito de coco.',
      ingredientes:[{nombre:'Camarones limpios',cantidad:'300 g'},{nombre:'Calamares en anillos',cantidad:'200 g'},{nombre:'Almejas',cantidad:'200 g'},{nombre:'Langostinos',cantidad:'200 g'},{nombre:'Leche de coco',cantidad:'400 ml'},{nombre:'Tomate chonto',cantidad:'3 unidades'},{nombre:'Cebolla roja',cantidad:'1 unidad'},{nombre:'Ajo',cantidad:'4 dientes'},{nombre:'Aceite de coco',cantidad:'2 cdas'}],
      pasos:['Sofreír cebolla, ajo y pimentón en aceite de coco 5 min.','Añadir tomate picado y cocinar 8 min.','Incorporar leche de coco y llevar a hervor suave 5 min.','Agregar calamares y almejas. Cocinar 3 min.','Añadir camarones y langostinos. Cocinar 4 min más.','Servir en cazuela con arroz de coco y patacones.']},
    { nombre:'Arroz con Leche Colombiano', emoji:'🍚',
      photoUrl:'https://images.aws.nestle.recipes/original/92cd34cb06980d6b4096cb73e5cab8fa_arroz-con-leche.jpeg',
      tipo:'Postre', dieta:'Vegetariana', tiempo:'30-60 min', porciones:'8', dificultad:'Fácil',
      likes:99, calorias:320,
      descripcion:'El postre más casero de Colombia. Arroz en leche con canela y panela hasta quedar cremoso.',
      ingredientes:[{nombre:'Arroz blanco',cantidad:'1 taza'},{nombre:'Leche entera',cantidad:'1 litro'},{nombre:'Leche condensada',cantidad:'½ taza'},{nombre:'Panela rallada',cantidad:'3 cdas'},{nombre:'Canela en rama',cantidad:'2 ramas'},{nombre:'Clavo de olor',cantidad:'3 unidades'}],
      pasos:['Cocinar el arroz en 2 tazas de agua con canela y clavo.','Agregar la leche entera. Revolver y cocinar a fuego bajo 20 min.','Añadir panela y leche condensada. Cocinar 10 min más.','Servir tibio o frío espolvoreado con canela.']},
    // ── INTERNACIONALES ──
    { nombre:'Smoothie Bowl de Frutos Rojos', emoji:'🍓',
      photoUrl:'https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?w=600&auto=format&fit=crop',
      tipo:'Desayuno', dieta:'Vegana', tiempo:'<15 min', porciones:'1', dificultad:'Fácil',
      likes:93, calorias:310,
      descripcion:'Colorido, fresco y cargado de antioxidantes.',
      ingredientes:[{nombre:'Fresas congeladas',cantidad:'1 taza'},{nombre:'Arándanos',cantidad:'½ taza'},{nombre:'Leche de coco',cantidad:'¼ taza'},{nombre:'Plátano',cantidad:'½ und'},{nombre:'Granola',cantidad:'¼ taza'},{nombre:'Semillas de chía',cantidad:'1 cdta'}],
      pasos:['Licuar las frutas congeladas con leche de coco hasta obtener consistencia espesa.','Verter en un tazón y decorar con granola, semillas y frutas frescas.','Servir inmediatamente.']},
    { nombre:'Pancakes de Avena con Plátano', emoji:'🥞',
      photoUrl:'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600&auto=format&fit=crop',
      tipo:'Desayuno', dieta:'Vegetariana', tiempo:'15-30 min', porciones:'4', dificultad:'Fácil',
      likes:87, calorias:210,
      descripcion:'Esponjosos y nutritivos, perfectos para empezar el día.',
      ingredientes:[{nombre:'Avena en hojuelas',cantidad:'1 taza'},{nombre:'Plátano maduro',cantidad:'1 und'},{nombre:'Huevos',cantidad:'2 und'},{nombre:'Leche',cantidad:'½ taza'},{nombre:'Polvo de hornear',cantidad:'1 cdta'},{nombre:'Miel',cantidad:'al gusto'}],
      pasos:['Triturar el plátano hasta puré.','Mezclar todos los ingredientes.','Cocinar en sartén antiadherente 2 min por lado.','Servir con miel y frutas.']},
    { nombre:'Arroz con Pollo al Azafrán', emoji:'🍗',
      photoUrl:'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&auto=format&fit=crop',
      tipo:'Almuerzo', dieta:'Normal', tiempo:'30-60 min', porciones:'5', dificultad:'Media',
      likes:78, calorias:420,
      descripcion:'El plato familiar por excelencia, perfumado con azafrán.',
      ingredientes:[{nombre:'Pollo en presas',cantidad:'1 kg'},{nombre:'Arroz',cantidad:'2 tazas'},{nombre:'Azafrán',cantidad:'1 sobre'},{nombre:'Pimiento rojo',cantidad:'1 und'},{nombre:'Caldo de pollo',cantidad:'4 tazas'},{nombre:'Ajo y cebolla',cantidad:'al gusto'}],
      pasos:['Dorar el pollo con sal, pimienta y ajo.','Sofreír cebolla y pimiento, agregar arroz 2 min.','Añadir caldo caliente con azafrán.','Cocinar a fuego bajo 20 min sin destapar.']},
    { nombre:'Ceviche Clásico de Camarón', emoji:'🍤',
      photoUrl:'https://images.unsplash.com/photo-1535399831218-d5bd36d1a6b3?w=600&auto=format&fit=crop',
      tipo:'Almuerzo', dieta:'Sin gluten', tiempo:'15-30 min', porciones:'4', dificultad:'Fácil',
      likes:65, calorias:145,
      descripcion:'Fresco, ácido y lleno de sabor para días calurosos.',
      ingredientes:[{nombre:'Camarones',cantidad:'500 g'},{nombre:'Limón',cantidad:'8 und'},{nombre:'Cebolla morada',cantidad:'1 und'},{nombre:'Cilantro',cantidad:'½ taza'},{nombre:'Tomate',cantidad:'2 und'}],
      pasos:['Limpiar y cortar los camarones.','Marinar con jugo de limón 15 min.','Picar cebolla, tomate y cilantro.','Mezclar todo, sazonar y servir con patacones.']},
    { nombre:'Brownie Vegano de Chocolate', emoji:'🍫',
      photoUrl:'https://images.unsplash.com/photo-1606312619070-d48b4c652a52?w=600&auto=format&fit=crop',
      tipo:'Postre', dieta:'Vegana', tiempo:'30-60 min', porciones:'12', dificultad:'Fácil',
      likes:54, calorias:290,
      descripcion:'Húmedo e intenso. Sin ingredientes de origen animal.',
      ingredientes:[{nombre:'Harina de trigo',cantidad:'1 taza'},{nombre:'Cacao en polvo',cantidad:'½ taza'},{nombre:'Aceite de coco',cantidad:'⅓ taza'},{nombre:'Leche de almendra',cantidad:'½ taza'},{nombre:'Azúcar',cantidad:'¾ taza'}],
      pasos:['Precalentar el horno a 175°C.','Mezclar ingredientes húmedos.','Agregar harina y cacao tamizados.','Hornear 25-30 min en molde engrasado.']},
    { nombre:'Lasaña de Espinacas y Ricotta', emoji:'🍝',
      photoUrl:'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?w=600&auto=format&fit=crop',
      tipo:'Cena', dieta:'Vegetariana', tiempo:'30-60 min', porciones:'6', dificultad:'Media',
      likes:42, calorias:380,
      descripcion:'Un clásico italiano con vegetales frescos y ricotta cremosa.',
      ingredientes:[{nombre:'Láminas de lasaña',cantidad:'12 und'},{nombre:'Espinacas',cantidad:'300 g'},{nombre:'Queso ricotta',cantidad:'400 g'},{nombre:'Salsa de tomate',cantidad:'500 ml'},{nombre:'Queso mozzarella',cantidad:'200 g'}],
      pasos:['Cocinar las láminas según instrucciones.','Saltear espinacas con ajo. Mezclar con ricotta.','Alternar capas en molde.','Cubrir con mozzarella y hornear 35 min a 180°C.']},
  ];

  DEMO.forEach((d,i) => {
    recetas.push({ id:uid(), creadoEn:Date.now()-i*86400000, ...d,
      autorId:AID, autorNombre:'Chef Demostración', likedBy:[], vistas:Math.floor(Math.random()*200+50) });
  });
  save(); localStorage.setItem('rh_demo_ver', VER);
}

// ══ ARRANQUE ══
sesion = null;
localStorage.removeItem('rh_sesion');

loadDemo(); initDarkMode();
document.getElementById('page-auth').classList.add('active');