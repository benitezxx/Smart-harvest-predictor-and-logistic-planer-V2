// --- Responsive sidebar ---
const sidebar = document.getElementById('sidebar');
document.getElementById('openSidebar')?.addEventListener('click', ()=> sidebar.classList.add('open'));
document.getElementById('closeSidebar')?.addEventListener('click', ()=> sidebar.classList.remove('open'));

// --- UI Elements ---
const q = document.getElementById('q');
const fTipo = document.getElementById('fTipo');
const fSeveridad = document.getElementById('fSeveridad');
const fEstado = document.getElementById('fEstado');
const fZona = document.getElementById('fZona');
const fDesde = document.getElementById('fDesde');
const fHasta = document.getElementById('fHasta');

const tblBody = document.querySelector('#tblAlertas tbody');
const ths = document.querySelectorAll('#tblAlertas thead th[data-sort]');
const chkAll = document.getElementById('chkAll');

const btnExportCSV = document.getElementById('btnExportCSV');
const btnResolveSelected = document.getElementById('btnResolveSelected');
const btnSilenceSelected = document.getElementById('btnSilenceSelected');

const kpiAlta = document.getElementById('kpiAlta');
const kpiMedia = document.getElementById('kpiMedia');
const kpiBaja = document.getElementById('kpiBaja');
const kpiAbiertas = document.getElementById('kpiAbiertas');

const pageInfo = document.getElementById('pageInfo');
const prevPage = document.getElementById('prevPage');
const nextPage = document.getElementById('nextPage');
const pageSizeSel = document.getElementById('pageSize');

const detailPanel = document.getElementById('panelDetalle');
const detailBody = detailPanel.querySelector('.detail-body');

// --- Simulated data for Arduino ---
const tipos = ['temperature','humidity','light','sensor'];
const zonas = ['lot-a','lot-b','lot-c','greenhouse'];
const severidades = ['high','medium','low'];
const estados = ['open','silenced','resolved'];

function rand(seed=1){ let x=Math.sin(seed)*10000; return x-Math.floor(x); }
function pick(arr, seed){ return arr[Math.floor(rand(seed)*arr.length)%arr.length]; }
function sentence(seed){
  const msgs = [
    'Temperature outside critical range',
    'Humidity below minimum threshold',
    'Insufficient light level for photosynthesis',
    'Sensor disconnected or no communication',
    'Value above optimal range',
    'Sensor battery below 20%',
    'Favorable conditions for growth',
    'Sensor operating within normal parameters'
  ];
  return msgs[Math.floor(rand(seed*7)*msgs.length)%msgs.length];
}
function makeAlert(i){
  const now = new Date();
  const dt = new Date(now.getTime() - (i * 15 + (i%8)*2) * 60 * 60 * 1000); // hours ago
  const tipo = pick(tipos, i+2);
  const zona = pick(zonas, i+3);
  const severidad = pick(severidades, i+4);
  const estado = pick(estados, i+5);
  const sensorId = `SENSOR-${String.fromCharCode(65 + (i%6))}${(i%12)+1}`;
  
  return {
    id: 'ALERT-'+(100+i),
    fecha: dt,
    tipo, zona, severidad, estado,
    mensaje: sentence(i+11),
    sensorId,
    valor: (24 + (Math.random() * 10 - 5)).toFixed(1),
    recomendaciones: [
      'Check sensor connection',
      'Adjust automatic irrigation',
      'Review lighting system',
      'Recharge or replace battery',
      'Monitor evolution every 2 hours',
      'Conditions within expected range'
    ].slice(0, 1 + (i%3))
  };
}
const DATA = Array.from({length: 45}, (_,i)=> makeAlert(i+1));

// --- UI state / sorting / pagination ---
let sort = { key: 'date', dir: 'desc' };
let currentPage = 1;
let pageSize = parseInt(pageSizeSel.value, 10);

// --- Utilities ---
function fmtDate(d){
  return d.toLocaleString('en-US', {
    year:'2-digit', month:'2-digit', day:'2-digit',
    hour:'2-digit', minute:'2-digit'
  });
}
function sevBadge(sev){
  return sev === 'high' ? 'sev-high' : sev === 'medium' ? 'sev-medium' : 'sev-low';
}
function stateClass(s){ return 'state '+s; }
function escapeHtml(s){ return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function getLocationText(location){
  const locationMap = {
    'lot-a': 'Lot A',
    'lot-b': 'Lot B', 
    'lot-c': 'Lot C',
    'greenhouse': 'Greenhouse'
  };
  return locationMap[location] || location;
}
function getTypeText(type){
  const typeMap = {
    'temperature': '🌡️ Temperature',
    'humidity': '💧 Humidity', 
    'light': '💡 Light',
    'sensor': '📡 Sensor'
  };
  return typeMap[type] || type;
}

// --- Master filter ---
function getFilters(){
  return {
    q: (q.value || '').trim().toLowerCase(),
    tipo: fTipo.value,
    severidad: fSeveridad.value,
    estado: fEstado.value,
    zona: fZona.value,
    desde: fDesde.value ? new Date(fDesde.value) : null,
    hasta: fHasta.value ? new Date(fHasta.value) : null
  };
}
function applyFilters(data, f){
  return data.filter(a=>{
    if (f.q){
      const text = (a.mensaje+' '+a.sensorId+' '+a.zona).toLowerCase();
      if (!text.includes(f.q)) return false;
    }
    if (f.tipo && a.tipo !== f.tipo) return false;
    if (f.severidad && a.severidad !== f.severidad) return false;
    if (f.estado && a.estado !== f.estado) return false;
    if (f.zona && a.zona !== f.zona) return false;
    if (f.desde && a.fecha < f.desde) return false;
    if (f.hasta){
      const h = new Date(f.hasta); h.setDate(h.getDate()+1);
      if (a.fecha > h) return false;
    }
    return true;
  });
}
function applySort(data, s){
  return data.slice().sort((a,b)=>{
    let av=a[s.key], bv=b[s.key];
    if (s.key === 'date'){ av = a.fecha.getTime(); bv = b.fecha.getTime(); }
    if (av < bv) return s.dir === 'asc' ? -1 : 1;
    if (av > bv) return s.dir === 'asc' ? 1 : -1;
    return 0;
  });
}
function paginate(data, page, size){
  const total = data.length;
  const pages = Math.max(1, Math.ceil(total / size));
  const p = Math.min(Math.max(1,page), pages);
  const start = (p-1)*size;
  return { page: p, pages, total, items: data.slice(start, start+size) };
}

// --- Render KPIs ---
function renderKPIs(list){
  kpiAlta.textContent = list.filter(a=>a.severidad==='high').length;
  kpiMedia.textContent = list.filter(a=>a.severidad==='medium').length;
  kpiBaja.textContent = list.filter(a=>a.severidad==='low').length;
  kpiAbiertas.textContent = list.filter(a=>a.estado==='open').length;
}

// --- Render table ---
function renderTable(){
  const f = getFilters();
  const filtered = applyFilters(DATA, f);
  const sorted = applySort(filtered, sort);
  const page = paginate(sorted, currentPage, pageSize);

  pageInfo.textContent = `${page.page} / ${page.pages} — ${page.total} alerts`;
  prevPage.disabled = page.page === 1;
  nextPage.disabled = page.page === page.pages;

  tblBody.innerHTML = page.items.map(a=>`
    <tr data-id="${a.id}">
      <td><input type="checkbox" class="rowChk" data-id="${a.id}" /></td>
      <td>${fmtDate(a.fecha)}</td>
      <td><span class="badge">${getTypeText(a.tipo)}</span></td>
      <td><span class="badge ${sevBadge(a.severidad)}">${a.severidad === 'high' ? 'Critical' : a.severidad === 'medium' ? 'Warning' : 'Normal'}</span></td>
      <td>${getLocationText(a.zona)}</td>
      <td>${escapeHtml(a.mensaje)} <span class="tag">${a.sensorId}</span></td>
      <td><span class="${stateClass(a.estado)}">${a.estado === 'open' ? 'Active' : a.estado === 'resolved' ? 'Resolved' : 'Silenced'}</span></td>
      <td class="row-actions">
        <button class="btn btn-ghost act-resolver" data-id="${a.id}">Resolve</button>
        <button class="btn btn-ghost act-silenciar" data-id="${a.id}">Silence</button>
      </td>
    </tr>
  `).join('');

  tblBody.querySelectorAll('tr').forEach(tr=>{
    tr.addEventListener('click', (e)=>{
      if (e.target.closest('input,button')) return;
      const id = tr.getAttribute('data-id');
      openDetail(id);
    });
  });

  renderKPIs(filtered);
}

// --- Detail ---
function openDetail(id){
  const al = DATA.find(x=>x.id===id);
  if (!al){
    detailBody.innerHTML = `<div class="muted">Alert not found.</div>`;
    return;
  }
  
  let valorInfo = '';
  if (al.tipo === 'temperature') {
    valorInfo = `<div><strong>Value:</strong> ${al.valor}°C</div>`;
  } else if (al.tipo === 'humidity') {
    valorInfo = `<div><strong>Value:</strong> ${al.valor}%</div>`;
  } else if (al.tipo === 'light') {
    valorInfo = `<div><strong>Value:</strong> ${al.valor} μmol/m²/s</div>`;
  }
  
  detailBody.innerHTML = `
    <div style="display:grid; gap:12px">
      <div>
        <strong>${getTypeText(al.tipo)}</strong> • 
        <span class="badge ${sevBadge(al.severidad)}">${al.severidad === 'high' ? 'Critical' : al.severidad === 'medium' ? 'Warning' : 'Normal'}</span> • 
        <span class="${stateClass(al.estado)}">${al.estado === 'open' ? 'Active' : al.estado === 'resolved' ? 'Resolved' : 'Silenced'}</span>
      </div>
      <div class="muted small">${fmtDate(al.fecha)} • ${getLocationText(al.zona)} • ${al.sensorId}</div>
      ${valorInfo}
      <div><strong>Description:</strong> ${al.mensaje}</div>
      <div><strong>Recommendations:</strong></div>
      <ul class="detail-list">
        ${al.recomendaciones.map(r=>`<li>${r}</li>`).join('')}
      </ul>
      <div class="row-actions">
        <button class="btn btn-primary" data-id="${al.id}" onclick="resolveOne('${al.id}')">Mark as resolved</button>
        <button class="btn btn-ghost" data-id="${al.id}" onclick="silenceOne('${al.id}')">Silence</button>
      </div>
    </div>
  `;
}

// --- Row actions ---
function changeState(ids, newState){
  ids.forEach(id=>{
    const a = DATA.find(x=>x.id===id);
    if (!a) return;
    a.estado = newState;
  });
  renderTable();
}
function resolveOne(id){ changeState([id], 'resolved'); }
function silenceOne(id){ changeState([id], 'silenced'); }
window.resolveOne = resolveOne;
window.silenceOne = silenceOne;

// --- Bulk actions ---
function getSelectedIds(){
  return Array.from(document.querySelectorAll('.rowChk:checked')).map(c=>c.getAttribute('data-id'));
}
btnResolveSelected.addEventListener('click', ()=>{
  const ids = getSelectedIds(); if (!ids.length) return;
  changeState(ids, 'resolved'); chkAll.checked = false;
});
btnSilenceSelected.addEventListener('click', ()=>{
  const ids = getSelectedIds(); if (!ids.length) return;
  changeState(ids, 'silenced'); chkAll.checked = false;
});
chkAll.addEventListener('change', ()=>{
  document.querySelectorAll('.rowChk').forEach(c=> c.checked = chkAll.checked);
});

// --- Export CSV ---
function toCSV(list){
  const header = ['id','date','type','severity','zone','sensorId','message','status','value'].join(',');
  const rows = list.map(a=>[
    a.id, a.fecha.toISOString(), a.tipo, a.severidad, a.zona, a.sensorId,
    a.mensaje.replace(/,/g,';'), a.estado, a.valor
  ].join(','));
  return [header, ...rows].join('\n');
}
btnExportCSV.addEventListener('click', ()=>{
  const filtered = applyFilters(DATA, getFilters());
  const csv = toCSV(filtered);
  const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `alerts_${new Date().toISOString().slice(0,10)}.csv`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
});

// --- Sort columns ---
ths.forEach(th=>{
  th.addEventListener('click', ()=>{
    const key = th.getAttribute('data-sort');
    if (sort.key === key){ sort.dir = sort.dir === 'asc' ? 'desc' : 'asc'; }
    else { sort.key = key; sort.dir = 'asc'; }
    renderTable();
  });
});

// --- Pagination ---
prevPage.addEventListener('click', ()=>{ currentPage = Math.max(1, currentPage-1); renderTable(); });
nextPage.addEventListener('click', ()=>{ currentPage = currentPage+1; renderTable(); });
pageSizeSel.addEventListener('change', ()=>{
  pageSize = parseInt(pageSizeSel.value, 10); currentPage = 1; renderTable();
});

// --- Search and filters ---
[q,fTipo,fSeveridad,fEstado,fZona,fDesde,fHasta].forEach(el=>{
  el.addEventListener('input', ()=>{
    currentPage = 1; renderTable();
  });
});

// --- Init ---
document.addEventListener('DOMContentLoaded', ()=>{
  const h = new Date(); const d = new Date(); d.setDate(d.getDate()-7);
  fDesde.valueAsDate = d; fHasta.valueAsDate = h;
  renderTable();
});