'use strict';
const $ = selector => document.querySelector(selector);
const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[char]));
const state = { games:[],labels:{ genres:{} },saved:new Set(),recommendations:new Map(),view:'descubrir',request:0,loaded:false };
const storageKey = 'tu-proxima-partida:favoritos:v1';
let toastTimer;

function notify(text) {
  clearTimeout(toastTimer);
  $('#toast').textContent = text;
  $('#toast').hidden = false;
  toastTimer = setTimeout(()=>$('#toast').hidden = true,2600);
}
function readSaved() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || '[]');
    if(Array.isArray(saved)) state.saved = new Set(saved.filter(id=>Number.isInteger(id) && state.games.some(game=>game.id===id)));
  } catch { state.saved = new Set(); }
}
function card(game, recommended=false) {
  const saved = state.saved.has(game.id);
  const fit = recommended ? `<div class="card-kicker ${game.score < game.maximum ? 'partial' : ''}"><span>${escapeHtml(game.fit)}</span><span>${game.score}/${game.maximum} PTS</span></div>` : `<div class="card-kicker"><span>PC · ${game.year}</span><span>${game.free?'GRATUITO':'DE PAGO'}</span></div>`;
  const reason = recommended ? `<div class="card-reason"><strong>POR QUÉ VA CONTIGO</strong>${escapeHtml(game.reasons[0])}${game.caveats.length ? `<p class="caveat">${escapeHtml(game.caveats.join(' '))}</p>` : ''}</div>` : '';
  return `<article class="game-card"><div class="game-cover"><img src="${escapeHtml(game.image)}" alt="Portada de ${escapeHtml(game.title)}" width="460" height="215" loading="lazy"><span class="price-badge">${game.free?'Gratis · juego base':'Juego de pago'}</span><button class="save-button" data-save="${game.id}" aria-pressed="${saved}" aria-label="${saved?'Quitar':'Guardar'} ${escapeHtml(game.title)}${saved?' de guardados':''}">${saved?'♥':'♡'}</button></div><div class="game-body">${fit}<h3>${escapeHtml(game.title)}</h3><p class="game-description">${escapeHtml(game.description)}</p><div class="game-meta"><span class="meta-chip">◷ Desde ${game.session} min</span><span class="meta-chip">${escapeHtml(state.labels.genres[game.genres[0]])}</span><span class="meta-chip">${game.modes.includes('amigos')?'Con amigos':'Individual'}</span></div>${reason}<button class="details-button" data-details="${game.id}" data-recommended="${recommended}" aria-label="Ver detalles de ${escapeHtml(game.title)}">Descubrir el juego <span aria-hidden="true">↗</span></button></div></article>`;
}
function empty(title,text,action='') {
  return `<div class="empty-state"><span aria-hidden="true">✧</span><h3>${escapeHtml(title)}</h3><p>${escapeHtml(text)}</p>${action}</div>`;
}
function errorPanel(text,action) {
  return `<div class="empty-state error-state"><h3>No pudimos cargar los juegos</h3><p>${escapeHtml(text)}</p><button class="primary-button" data-retry="${action}">Intentar de nuevo ↗</button></div>`;
}
function renderCatalog() {
  if(!state.loaded) return;
  const query = $('#catalog-search').value.trim().toLocaleLowerCase('es');
  const genre = $('#catalog-genre').value;
  const free = $('#catalog-free').checked;
  const games = state.games.filter(game=>(!query || game.title.toLocaleLowerCase('es').includes(query)) && (genre==='any' || game.genres.includes(genre)) && (!free || game.free));
  $('#catalog-summary').textContent = `${games.length} ${games.length===1?'juego encontrado':'juegos encontrados'}`;
  $('#catalog-results').innerHTML = games.map(game=>card(game)).join('') || empty('No hay juegos con esos filtros','Prueba otro nombre, cambia el género o amplía el presupuesto.', '<button class="primary-button" data-reset-catalog>Restablecer filtros ↗</button>');
}
function renderSaved() {
  if(!state.loaded) return;
  const games = state.games.filter(game=>state.saved.has(game.id));
  $('#saved-results').innerHTML = games.map(game=>card(game)).join('') || empty('Tu próxima partida todavía está por descubrir','Pulsa el corazón de cualquier juego para guardarlo aquí. Tus favoritos se conservan en este navegador.', '<a class="primary-button" href="#catalogo">Explorar juegos ↗</a>');
}
function syncSavedButtons() {
  $('#saved-count').textContent = state.saved.size;
  document.querySelectorAll('[data-save]').forEach(button=>{
    const id = Number(button.dataset.save);
    const saved = state.saved.has(id);
    const game = state.games.find(game=>game.id===id);
    button.setAttribute('aria-pressed',String(saved));
    button.setAttribute('aria-label',`${saved?'Quitar':'Guardar'} ${game?.title ?? 'juego'}${saved?' de guardados':''}`);
    button.textContent = button.classList.contains('dialog-save') ? (saved?'♥ Guardado':'♡ Guardar juego') : (saved?'♥':'♡');
  });
}
function toggleSaved(id) {
  const game = state.games.find(game=>game.id===id);
  if(!game) return;
  const removed = state.saved.delete(id);
  if(!removed) state.saved.add(id);
  try {
    localStorage.setItem(storageKey,JSON.stringify([...state.saved]));
    notify(removed ? 'Juego eliminado de tus guardados' : 'Juego guardado para tu próxima partida');
  } catch { notify('Guardado durante esta visita. Este navegador no permite conservarlo.'); }
  syncSavedButtons();
  renderSaved();
}
function showDetails(id,recommended) {
  const game = (recommended && state.recommendations.get(id)) || state.games.find(game=>game.id===id);
  if(!game) return;
  const reasons = recommended && game.reasons ? `<h3>Por qué va contigo</h3><ul>${game.reasons.map(reason=>`<li>${escapeHtml(reason)}</li>`).join('')}</ul>${game.caveats.map(caveat=>`<p class="caveat">${escapeHtml(caveat)}</p>`).join('')}` : '';
  const saved = state.saved.has(id);
  $('#dialog-content').innerHTML = `<img class="dialog-image" src="${escapeHtml(game.image)}" alt="Portada de ${escapeHtml(game.title)}" width="460" height="215"><div class="dialog-body"><span class="eyebrow lime">PC · ${game.free?'GRATIS PARA EMPEZAR':'JUEGO DE PAGO'}</span><h2 id="dialog-title">${escapeHtml(game.title)}</h2><p>${escapeHtml(game.description)}</p><div class="game-meta">${game.genres.map(genre=>`<span class="meta-chip">${escapeHtml(state.labels.genres[genre])}</span>`).join('')}<span class="meta-chip">${game.modes.includes('solo')?'Individual':''}${game.modes.length>1?' + ':''}${game.modes.includes('amigos')?'Con amigos':''}</span><span class="meta-chip">Desde ${game.session} min por sesión</span></div>${reasons}<p class="data-note">Tiempo orientativo por sesión o punto de pausa. Revisa los requisitos de tu PC, las modalidades y el precio vigente en la tienda.</p><div class="dialog-actions"><a class="primary-button" href="${escapeHtml(game.storeUrl)}" target="_blank" rel="noopener noreferrer">Ver en Steam <span aria-hidden="true">↗</span></a><button class="secondary-button dialog-save" data-save="${id}" aria-pressed="${saved}">${saved?'♥ Guardado':'♡ Guardar juego'}</button></div></div>`;
  $('#game-dialog').showModal();
}
async function getJson(url) {
  const response = await fetch(url);
  if(!response.ok) throw new Error('Revisa que la aplicación esté ejecutándose e inténtalo de nuevo.');
  return response.json();
}
async function loadRecommendations(scroll=false) {
  const request = ++state.request;
  const button = $('#recommend-button');
  button.disabled = true;
  button.textContent = 'Encontrando tu próxima partida…';
  $('#recommendation-results').setAttribute('aria-busy','true');
  try {
    const params = new URLSearchParams(new FormData($('#recommend-form')));
    const result = await getJson('/api/recommendations?'+params.toString());
    if(request!==state.request) return;
    state.recommendations = new Map(result.games.map(game=>[game.id,game]));
    $('#recommendation-results').innerHTML = result.games.map(game=>card(game,true)).join('') || empty('Este plan necesita un pequeño ajuste','No encontramos juegos que cumplan tu tiempo, compañía y presupuesto. Prueba ampliar el tiempo o cambiar una de esas opciones.', '<a class="primary-button" href="#preferences">Ajustar mi plan ↖</a>');
    const full = result.games.filter(game=>game.score===game.maximum).length;
    $('#results-summary').textContent = result.games.length ? `${result.games.length} ideas entre ${result.total} opciones compatibles. ${full} ${full===1?'coincide':'coinciden'} con todos tus gustos.` : 'Tu tiempo, compañía y presupuesto se respetan en cada búsqueda.';
    if(scroll) $('.recommendations').scrollIntoView({behavior:'smooth',block:'start'});
  } catch(error) {
    if(request!==state.request) return;
    $('#recommendation-results').innerHTML = errorPanel(error.message,'recommendations');
    $('#results-summary').textContent = 'La búsqueda no pudo completarse.';
  } finally {
    if(request===state.request) {
      button.disabled = false;
      button.innerHTML = 'Encontrar mi próxima partida <span aria-hidden="true">↗</span>';
      $('#recommendation-results').setAttribute('aria-busy','false');
    }
  }
}
async function loadCatalog() {
  try {
    const result = await getJson('/api/games');
    state.games = result.games;
    state.labels = result.labels;
    state.loaded = true;
    readSaved();
    $('#catalog-count').textContent = state.games.length;
    $('#catalog-genre').innerHTML = '<option value="any">Todos los géneros</option>'+Object.entries(state.labels.genres).map(([value,label])=>`<option value="${escapeHtml(value)}">${escapeHtml(label)}</option>`).join('');
    renderCatalog(); renderSaved(); syncSavedButtons();
    await loadRecommendations();
  } catch(error) {
    state.loaded = false;
    const panel = errorPanel(error.message,'catalog');
    $('#recommendation-results').innerHTML = panel;
    $('#catalog-results').innerHTML = panel;
    $('#saved-results').innerHTML = panel;
    $('#recommendation-results').setAttribute('aria-busy','false');
  }
}
function navigate() {
  const hash = location.hash.slice(1);
  const view = ['catalogo','guardados'].includes(hash) ? hash : 'descubrir';
  state.view = view;
  $('#discover-view').hidden = view!=='descubrir';
  $('#catalog-view').hidden = view!=='catalogo';
  $('#saved-view').hidden = view!=='guardados';
  $('#page-label').textContent = {descubrir:'Descubrir',catalogo:'Catálogo',guardados:'Mis guardados'}[view];
  document.querySelectorAll('[data-view]').forEach(link=>{
    const active = link.dataset.view===view;
    link.classList.toggle('active',active);
    if(active) link.setAttribute('aria-current','page'); else link.removeAttribute('aria-current');
  });
  if(['descubrir','catalogo','guardados'].includes(hash)) window.scrollTo({top:0,behavior:'instant'});
}
$('#recommend-form').addEventListener('submit',event=>{ event.preventDefault(); if(state.loaded) loadRecommendations(true); else loadCatalog(); });
$('#recommend-form').addEventListener('change',()=>$('#results-summary').textContent='Cambiaste tu plan. Pulsa «Encontrar mi próxima partida» para actualizar las recomendaciones.');
for(const selector of ['#catalog-search','#catalog-genre','#catalog-free']) $(selector).addEventListener(selector==='#catalog-search'?'input':'change',renderCatalog);
$('#about-button').addEventListener('click',()=>$('#about-dialog').showModal());
$('#sources-button').addEventListener('click',()=>$('#sources-dialog').showModal());
document.addEventListener('click',event=>{
  const save = event.target.closest('[data-save]');
  if(save) return toggleSaved(Number(save.dataset.save));
  const details = event.target.closest('[data-details]');
  if(details) return showDetails(Number(details.dataset.details),details.dataset.recommended==='true');
  const close = event.target.closest('[data-close-dialog]');
  if(close) return close.closest('dialog').close();
  const retry = event.target.closest('[data-retry]');
  if(retry) return retry.dataset.retry==='catalog' ? loadCatalog() : loadRecommendations();
  if(event.target.closest('[data-reset-catalog]')) {
    $('#catalog-search').value=''; $('#catalog-genre').value='any'; $('#catalog-free').checked=false; renderCatalog();
  }
});
document.addEventListener('error',event=>{
  if(event.target.tagName==='IMG' && !event.target.dataset.fallback) {
    event.target.dataset.fallback='true'; event.target.src='/favicon.svg'; event.target.classList.add('image-fallback');
  }
},true);
window.addEventListener('hashchange',navigate);
window.addEventListener('storage',event=>{
  if(event.key===storageKey) {readSaved();syncSavedButtons();renderSaved();}
});
navigate();
loadCatalog();

