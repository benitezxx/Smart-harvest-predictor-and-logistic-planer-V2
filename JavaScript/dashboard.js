// === Config ===
const API = '/ProyectoAgiles/PHP';

// Rangos de referencia (ajústalos si cambian)
const RANGES = {
  temp: { min: 18, max: 30 },       // °C
  hum:  { min: 40, max: 80 },       // %
  light:{ min: 400, max: 1200 }     // μmol/m²/s (PPFD)
};

// === Helpers ===
const $ = (id) => document.getElementById(id);
const fmt = (n, digits=1) => (n === null || n === undefined) ? '—' : Number(n).toFixed(digits);

function computeStatus(t, h, l){
  const inRange = (v, {min, max}) => v != null && v >= min && v <= max;
  const okT = inRange(t, RANGES.temp);
  const okH = inRange(h, RANGES.hum);
  const okL = inRange(l, RANGES.light);

  const issues = [];
  if (!okT) issues.push('Temperature out of range');
  if (!okH) issues.push('Humidity out of range');
  if (!okL) issues.push('Light out of range');

  return {
    label: issues.length ? 'Attention' : 'Optimal',
    ok: issues.length === 0,
    issues
  };
}

function renderAlerts(issues){
  const list = $('alertsList');
  if (!list) return;
  list.innerHTML = ''; // limpia

  if (!issues.length) {
    const li = document.createElement('li');
    li.innerHTML = `<span class="badge ok">OK</span> No anomalies detected • just now`;
    list.appendChild(li);
    return;
  }

  issues.forEach(msg => {
    const li = document.createElement('li');
    li.innerHTML = `<span class="badge warn">WARN</span> ${msg} • just now`;
    list.appendChild(li);
  });
}

function stampUpdate(text='just now'){
  const el = $('lastUpdate');
  if (el) el.textContent = text;
}

// === Core ===
async function cargarDashboard(){
  // 1) Declara variables visibles en toda la función
  let t = null, h = null, l = null;

  try {
    const res = await fetch(`${API}/dashboard.php`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    // 2) Asigna valores (o null)
    t = (data && data.temperatura != null) ? Number(data.temperatura) : null;
    h = (data && data.humedad     != null) ? Number(data.humedad)     : null;
    l = (data && data.luz         != null) ? Number(data.luz)         : null;

  } catch (err) {
    console.error('Error cargando dashboard:', err);
    if ($('kpiStatus')) $('kpiStatus').textContent = 'Error';
    stampUpdate('—');
    return; // no seguimos si falló la petición
  }

  // 3) Si NO hay datos, deja placeholders y mensaje
  const sinDatos = (t == null) && (h == null) && (l == null);
  if (sinDatos) {
    if ($('kpiTemp'))     $('kpiTemp').textContent     = '—';
    if ($('kpiHumidity')) $('kpiHumidity').textContent = '—';
    if ($('kpiLight'))    $('kpiLight').textContent    = '—';
    if ($('kpiStatus'))   $('kpiStatus').textContent   = 'No data yet';

    const list = $('alertsList');
    if (list) {
      list.innerHTML = '';
      const li = document.createElement('li');
      li.innerHTML = `<span class="badge info">INFO</span> Waiting for first sensor reading`;
      list.appendChild(li);
    }

    // filas de la lista
    const row = (id, val) => { const el = $(id); if (el) el.textContent = val; };
    row('rowTemp', '—'); row('rowTempStatus', '—');
    row('rowHum',  '—'); row('rowHumStatus',  '—');
    row('rowLight','—'); row('rowLightStatus','—');
    stampUpdate('—');
    return; // salimos temprano porque no hay datos
  }

  // 4) Sí hay datos → pinta KPIs
  if ($('kpiTemp'))     $('kpiTemp').textContent     = fmt(t);
  if ($('kpiHumidity')) $('kpiHumidity').textContent = fmt(h, 0);
  if ($('kpiLight'))    $('kpiLight').textContent    = fmt(l, 0);

  // 5) Estado + alertas
  const st = computeStatus(t, h, l);
  if ($('kpiStatus')) $('kpiStatus').textContent = st.label;
  renderAlerts(st.issues);

  // 6) “Sensor Readings” (si tienes esos IDs en el HTML)
  if ($('rowTemp'))       $('rowTemp').textContent       = `${fmt(t)} °C`;
  if ($('rowHum'))        $('rowHum').textContent        = `${fmt(h,0)} %`;
  if ($('rowLight'))      $('rowLight').textContent      = `${fmt(l,0)} μmol/m²/s`;
  stampUpdate('just now');
}

// Botón "Refresh"
function setupEvents(){
  const btn = $('refreshBtn');
  if (btn) btn.addEventListener('click', cargarDashboard);
}

// === Init ===
document.addEventListener('DOMContentLoaded', () => {
  setupEvents();
  cargarDashboard();
});
