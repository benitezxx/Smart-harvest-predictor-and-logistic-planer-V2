// === Config ===
const API = 'http://127.0.0.1:8000';

// Rango objetivo (ajústalos a tu cultivo si quieres)
const THRESHOLDS = {
  temperature_c: { min: 18, max: 30 },   // °C
  humidity: { min: 40, max: 80 },        // %
  ppfd: { min: 400, max: 1200 },         // μmol/m²/s (umbral del UI)
  // Para luz en lux (fallback si no convertimos a PPFD):
  light_lux: { min: 2000, max: 65000 }
};

// Conversión aproximada LUX -> PPFD (depende de espectro/LED/sol; esto es orientativo)
function luxToPPFD(lux) {
  if (lux == null) return null;
  // factor típico 0.0185 para luz solar/mixta (valor aproximado, no de laboratorio)
  return +(lux * 0.0185).toFixed(1);
}

// Utilidades
function fmt(v, unit = '') {
  if (v == null || Number.isNaN(v)) return '-';
  return unit ? `${v} ${unit}` : String(v);
}

function inRange(value, {min, max}) {
  if (value == null) return true; // si no hay dato, no marcamos como fuera de rango
  return value >= min && value <= max;
}

function statusClass(ok) {
  return ok ? 'ok' : 'warn';
}

function timeAgo(ts) {
  const d = new Date(ts);
  if (isNaN(d)) return '-';
  const diff = (Date.now() - d.getTime())/1000;
  if (diff < 60) return `${Math.floor(diff)} s ago`;
  if (diff < 3600) return `${Math.floor(diff/60)} min ago`;
  return `${Math.floor(diff/3600)} h ago`;
}

// DOM refs
const elKpiTemp = document.getElementById('kpiTemp');
const elKpiHumidity = document.getElementById('kpiHumidity');
const elKpiLight = document.getElementById('kpiLight');
const elKpiStatus = document.getElementById('kpiStatus');
const elLastUpdate = document.getElementById('lastUpdate');
const elAlertsList = document.getElementById('alertsList');
const btnRefresh = document.getElementById('refreshBtn');
const btnExport = document.getElementById('exportBtn');

async function fetchLatest() {
  const res = await fetch(`${API}/api/readings/latest`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function deriveOverallStatus(items) {
  let anyWarn = false;
  for (const r of items) {
    const ppfd = luxToPPFD(r.light_lux);
    const okTemp = inRange(r.temperature_c, THRESHOLDS.temperature_c);
    const okHum  = inRange(r.humidity, THRESHOLDS.humidity);
    // Preferimos evaluar PPFD si lo podemos calcular; si no, usamos lux
    const okLight = ppfd != null
      ? inRange(ppfd, THRESHOLDS.ppfd)
      : inRange(r.light_lux, THRESHOLDS.light_lux);

    if (!(okTemp && okHum && okLight)) {
      anyWarn = true;
      break;
    }
  }
  return anyWarn ? {label: 'Check', className: 'warn'} : {label: 'Optimal', className: 'ok'};
}

function renderKPIs(items) {
  // Tomamos la última lectura (si hay varias, la primera suele ser la más reciente por sensor)
  if (!items || !items.length) {
    elKpiTemp && (elKpiTemp.textContent = '-');
    elKpiHumidity && (elKpiHumidity.textContent = '-');
    elKpiLight && (elKpiLight.textContent = '-');
    elKpiStatus && (elKpiStatus.textContent = 'No data');
    elLastUpdate && (elLastUpdate.textContent = '-');
    return;
  }

  // Estrategia: si hay varios sensores, prioriza mostrar:
  // - temp y hum de un sensor DHT (si existe) o del primero
  // - luz del sensor que tenga light_lux
  const byHas = (k) => items.find(r => r[k] != null);

  const tempRow = byHas('temperature_c') || items[0];
  const humRow  = byHas('humidity') || items[0];
  const luxRow  = byHas('light_lux') || items[0];

  const temp = tempRow?.temperature_c ?? null;
  const hum  = humRow?.humidity ?? null;
  const lux  = luxRow?.light_lux ?? null;
  const ppfd = luxToPPFD(lux);

  if (elKpiTemp) elKpiTemp.textContent = (temp ?? '-');
  if (elKpiHumidity) elKpiHumidity.textContent = (hum ?? '-');

  // El UI dice “Light (PPFD)”; mostramos PPFD si podemos calcularlo, si no mostramos lux
  if (elKpiLight) elKpiLight.textContent = (ppfd ?? lux ?? '-');

  // Última actualización (tomamos el máximo ts)
  const latestTs = items.map(r => new Date(r.ts).getTime()).filter(x => !isNaN(x)).sort((a,b)=>b-a)[0];
  if (elLastUpdate) elLastUpdate.textContent = latestTs ? timeAgo(latestTs) : '-';

  const overall = deriveOverallStatus(items);
  if (elKpiStatus) elKpiStatus.textContent = overall.label;
  // Puedes también cambiar clases en el KPI Status si tu CSS lo usa
}

function renderList(items) {
  // Rellena la lista de lecturas (card “Sensor Readings”)
  const container = document.querySelector('.sensor-readings');
  if (!container) return;

  container.innerHTML = ''; // limpiamos lo estático del HTML

  // Orden por timestamp descendente
  const sorted = [...items].sort((a,b)=> new Date(b.ts) - new Date(a.ts));

  for (const r of sorted) {
    const ppfd = luxToPPFD(r.light_lux);
    const okTemp = inRange(r.temperature_c, THRESHOLDS.temperature_c);
    const okHum  = inRange(r.humidity, THRESHOLDS.humidity);
    const okLight = ppfd != null
      ? inRange(ppfd, THRESHOLDS.ppfd)
      : inRange(r.light_lux, THRESHOLDS.light_lux);

    // Un bloque por cada lectura “agregada” (puedes agrupar por sensor si quieres)
    const row = document.createElement('div');
    row.className = 'sensor-item';

    const problems = [];
    if (!okTemp && r.temperature_c != null) problems.push('Temp');
    if (!okHum && r.humidity != null) problems.push('Humidity');
    if (!okLight && (ppfd != null || r.light_lux != null)) problems.push('Light');

    row.innerHTML = `
      <span class="sensor-name">${r.sensor_name || ('Sensor ' + r.sensor_id)}</span>
      <span class="sensor-value">
        ${r.temperature_c != null ? `🌡️ ${r.temperature_c} °C` : ''}
        ${r.humidity != null ? ` · 💧 ${r.humidity} %` : ''}
        ${
          (ppfd != null)
          ? ` · 💡 ${ppfd} μmol/m²/s`
          : (r.light_lux != null ? ` · 💡 ${r.light_lux} lux` : '')
        }
        · 🕒 ${new Date(r.ts).toLocaleString()}
      </span>
      <span class="sensor-status ${statusClass(problems.length === 0)}">
        ${problems.length ? 'Check' : 'Normal'}
      </span>
    `;
    container.appendChild(row);
  }
}

function renderAlerts(items) {
  if (!elAlertsList) return;

  elAlertsList.innerHTML = '';

  const alerts = [];
  for (const r of items) {
    const ppfd = luxToPPFD(r.light_lux);
    if (r.temperature_c != null && !inRange(r.temperature_c, THRESHOLDS.temperature_c)) {
      alerts.push({ type: 'Temp', value: r.temperature_c, ts: r.ts, sensor: r.sensor_name || r.sensor_id });
    }
    if (r.humidity != null && !inRange(r.humidity, THRESHOLDS.humidity)) {
      alerts.push({ type: 'Humidity', value: r.humidity, ts: r.ts, sensor: r.sensor_name || r.sensor_id });
    }
    const lightOk = ppfd != null
      ? inRange(ppfd, THRESHOLDS.ppfd)
      : inRange(r.light_lux, THRESHOLDS.light_lux);

    if (!lightOk && (ppfd != null || r.light_lux != null)) {
      alerts.push({
        type: 'Light',
        value: (ppfd != null ? `${ppfd} μmol/m²/s` : `${r.light_lux} lux`),
        ts: r.ts,
        sensor: r.sensor_name || r.sensor_id
      });
    }
  }

  if (!alerts.length) {
    elAlertsList.innerHTML = `<li><span class="badge ok">OK</span> No anomalies detected • just now</li>`;
    return;
  }

  for (const a of alerts.slice(0, 10)) {
    const li = document.createElement('li');
    li.innerHTML = `<span class="badge warn">ALERT</span> ${a.type} out of range (${a.value}) • ${timeAgo(a.ts)} • ${a.sensor}`;
    elAlertsList.appendChild(li);
  }
}

function exportCSV(items) {
  if (!items || !items.length) return;
  const header = ['sensor_id','sensor_name','ts','temperature_c','humidity','light_lux','ppfd_est'];
  const rows = items.map(r => ([
    r.sensor_id,
    (r.sensor_name || ''),
    r.ts,
    (r.temperature_c ?? ''),
    (r.humidity ?? ''),
    (r.light_lux ?? ''),
    luxToPPFD(r.light_lux) ?? ''
  ]));
  const csv = [header.join(','), ...rows.map(r=>r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const stamp = new Date().toISOString().replace(/[:.]/g,'-');
  a.download = `sensor_readings_${stamp}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

async function loadAndRender() {
  try {
    const latest = await fetchLatest();
    renderKPIs(latest);
    renderList(latest);
    renderAlerts(latest);
  } catch (err) {
    console.error('Error fetching latest readings:', err);
    // Feedback mínimo en UI
    elKpiStatus && (elKpiStatus.textContent = 'Error');
  }
}

// Eventos UI
btnRefresh && btnRefresh.addEventListener('click', loadAndRender);
btnExport && btnExport.addEventListener('click', async () => {
  try {
    const data = await fetchLatest();
    exportCSV(data);
  } catch (e) {
    console.error('Export failed:', e);
  }
});

// Cargar al iniciar y refrescar cada 30s
window.addEventListener('DOMContentLoaded', () => {
  loadAndRender();
  setInterval(loadAndRender, 30000);
});
