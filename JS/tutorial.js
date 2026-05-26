const TUT_KEY     = 'rh_tutorial_seen';
const TUT_VERSION = 'v3';

const TUT_VIEWS = [
  {
    tab:   'Explorar',
    badge: '01 — Explorar',
    title: 'Descubre <em>recetas</em> increíbles',
    img:   'https://tofuu.getjusto.com/orioneat-local/resized2/G8bjaSqGdhWepTkrr-1101-x.webp',
    features: [
      { icon: '🔍', title: 'Busca por ingrediente', desc: 'Filtra por tipo, dieta, tiempo o escribe lo que tengas en casa.' },
      { icon: '★',  title: 'Califica recetas',      desc: 'Pasa el cursor por las estrellas y haz clic para valorar.' },
      { icon: '＋',  title: 'Guarda favoritas',      desc: 'El botón + añade cualquier receta a tu colección personal.' },
    ],
  },
  {
    tab:   'Crear',
    badge: '02 — Crear',
    title: 'Publica tu <em>propia receta</em>',
    img:   'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=700&auto=format&fit=crop',
    features: [
      { icon: '📝', title: '4 pasos simples',      desc: 'Info básica → Ingredientes → Pasos → Publicar. Rápido y claro.' },
      { icon: '🔥', title: 'Calorías automáticas', desc: 'RecetaHub estima kcal y macros mientras escribes los ingredientes.' },
      { icon: '📷', title: 'Sube tu foto',          desc: 'Arrastra una imagen o haz clic. Se previsualiza al instante.' },
    ],
  },
  {
    tab:   'Guardadas',
    badge: '03 — Guardadas',
    title: 'Tu colección <em>personal</em>',
    img:   'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=700&auto=format&fit=crop',
    features: [
      { icon: '🔖', title: 'Todas en un lugar',   desc: 'Accede rápido a las recetas que marcaste con el botón +.' },
      { icon: '📊', title: 'Contador en tiempo real', desc: 'La barra superior muestra cuántas recetas tienes guardadas.' },
      { icon: '🗑️', title: 'Elimina fácilmente',  desc: 'Vuelve a pulsar el botón 🔖 para quitar una receta.' },
    ],
  },
  {
    tab:   'Mi perfil',
    badge: '04 — Perfil',
    title: 'Tus <em>contribuciones</em>',
    img:   'https://images.unsplash.com/photo-1466637574441-749b8f19452f?w=700&auto=format&fit=crop',
    features: [
      { icon: '👤', title: 'Tus recetas publicadas', desc: 'Ve todas las recetas que has creado en un solo lugar.' },
      { icon: '🌙', title: 'Modo oscuro',            desc: 'El botón luna/sol en la barra cambia el tema al instante.' },
      { icon: '🚪', title: 'Cerrar sesión',           desc: 'El ícono de salida en la barra lateral cierra tu sesión.' },
    ],
  },
];

let tutCurrent = 0;

function tutShow(force) {
  if (!force && localStorage.getItem(TUT_KEY) === TUT_VERSION) return;
  tutCurrent = 0;
  const overlay = document.createElement('div');
  overlay.className = 'tut-overlay';
  overlay.id = 'tut-overlay';
  overlay.innerHTML = buildModal();
  document.body.appendChild(overlay);
  tutRender(0);
  overlay.addEventListener('click', e => { if (e.target === overlay) tutClose(); });
}

function tutClose() {
  const overlay = document.getElementById('tut-overlay');
  if (!overlay) return;
  overlay.classList.add('closing');
  setTimeout(() => overlay.remove(), 200);
  localStorage.setItem(TUT_KEY, TUT_VERSION);
}

function buildModal() {
  const tabs = TUT_VIEWS.map((v, i) =>
    `<button class="tut-tab${i === 0 ? ' active' : ''}" onclick="tutGoto(${i})">${v.tab}</button>`
  ).join('');
  return `
  <div class="tut-modal" id="tut-modal">
    <div class="tut-hero" id="tut-hero">
      <img class="tut-hero-img" id="tut-hero-img" src="" alt=""/>
      <div class="tut-hero-overlay"></div>
      <div class="tut-hero-content">
        <div class="tut-hero-badge" id="tut-hero-badge"></div>
        <div class="tut-hero-title" id="tut-hero-title"></div>
      </div>
      <button class="tut-close" onclick="tutClose()">✕</button>
    </div>
    <div class="tut-tabs">${tabs}</div>
    <div class="tut-body" id="tut-body-inner"></div>
  </div>`;
}

function tutRender(n) {
  const v = TUT_VIEWS[n];

  // Hero
  document.getElementById('tut-hero-img').src        = v.img;
  document.getElementById('tut-hero-badge').textContent = v.badge;
  document.getElementById('tut-hero-title').innerHTML   = v.title;

  // Tabs
  document.querySelectorAll('.tut-tab').forEach((t, i) =>
    t.classList.toggle('active', i === n)
  );

  // Features
  const feats = v.features.map(f => `
    <div class="tut-feat">
      <div class="tut-feat-icon">${f.icon}</div>
      <div class="tut-feat-text">
        <strong>${f.title}</strong>
        <span>${f.desc}</span>
      </div>
    </div>`).join('');

  const dots = TUT_VIEWS.map((_, i) =>
    `<div class="tut-dot${i === n ? ' active' : ''}" onclick="tutGoto(${i})"></div>`
  ).join('');

  const isLast = n === TUT_VIEWS.length - 1;

  document.getElementById('tut-body-inner').innerHTML = `
    <div class="tut-features">${feats}</div>
    <div class="tut-nav">
      <button class="tut-nav-btn" onclick="tutGoto(${n-1})" ${n===0?'disabled':''}>← Atrás</button>
      <div class="tut-dots">${dots}</div>
      <button class="tut-nav-btn tut-primary" onclick="${isLast ? 'tutClose()' : `tutGoto(${n+1})`}">
        ${isLast ? '¡Empezar! 🍴' : 'Siguiente →'}
      </button>
    </div>`;
}

function tutGoto(n) {
  if (n < 0 || n >= TUT_VIEWS.length) return;
  tutCurrent = n;
  tutRender(n);
}