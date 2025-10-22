// --- Responsive sidebar ---
const sidebar = document.querySelector('.sidebar');
const openSidebarBtn = document.getElementById('openSidebar');
const closeSidebarBtn = document.getElementById('closeSidebar');
openSidebarBtn?.addEventListener('click', ()=> sidebar.classList.add('open'));
closeSidebarBtn?.addEventListener('click', ()=> sidebar.classList.remove('open'));

// --- Action buttons ---
document.getElementById('refreshBtn')?.addEventListener('click', simulateRefresh);
document.getElementById('exportBtn')?.addEventListener('click', simulateExport);

// --- CORRECTED optimal ranges for agriculture ---
const optimalRanges = {
  temperature: { min: 18, max: 30 },        // °C - for general crops
  humidity: { min: 40, max: 80 },           // % RH - safe range
  light: { min: 400, max: 1200 }            // PPFD (μmol/m²/s) - for fruit crops
};

// --- Mock data (replace with real Arduino data) ---
let sensorData = {
  temperature: 24.5,
  humidity: 65,
  light: 850,  // Now in PPFD (μmol/m²/s)
  lastUpdate: new Date()
};

// --- Lux to PPFD conversion if your sensor measures in lux ---
function luxToPPFD(lux) {
  // Approximate conversion for natural sunlight
  // Coefficient: 0.0185 μmol/m²/s per lux
  return Math.round(lux * 0.0185);
}

// --- Configuration by crop type ---
const cropSettings = {
  'tomato': { 
    temperature: { min: 20, max: 28 },
    humidity: { min: 50, max: 70 },
    light: { min: 600, max: 1000 }
  },
  'lettuce': {
    temperature: { min: 15, max: 25 },
    humidity: { min: 40, max: 80 },
    light: { min: 200, max: 600 }
  },
  'pepper': {
    temperature: { min: 18, max: 30 },
    humidity: { min: 45, max: 75 },
    light: { min: 400, max: 1200 }
  }
};

let currentCrop = 'pepper'; // Default crop

// --- Update interface with data ---
function updateUI() {
  document.getElementById('kpiTemp').textContent = sensorData.temperature.toFixed(1);
  document.getElementById('kpiHumidity').textContent = Math.round(sensorData.humidity);
  document.getElementById('kpiLight').textContent = Math.round(sensorData.light);
  
  // Update general status
  const status = checkOverallStatus();
  document.getElementById('kpiStatus').textContent = status.text;
  document.querySelector('.delta.ok').textContent = status.message;
  
  // Update sensor readings
  updateSensorReadings();
  
  // Update alerts
  updateAlerts();
  
  // Update last update
  updateLastUpdate();
}

// --- Check overall status ---
function checkOverallStatus() {
  const tempStatus = checkSensorStatus('temperature', sensorData.temperature);
  const humidityStatus = checkSensorStatus('humidity', sensorData.humidity);
  const lightStatus = checkSensorStatus('light', sensorData.light);
  
  if (tempStatus === 'danger' || humidityStatus === 'danger' || lightStatus === 'danger') {
    return { text: 'Critical', message: 'Check sensors' };
  } else if (tempStatus === 'warn' || humidityStatus === 'warn' || lightStatus === 'warn') {
    return { text: 'Warning', message: 'Monitor' };
  } else {
    return { text: 'Optimal', message: 'No alerts' };
  }
}

// --- Check specific sensor status ---
function checkSensorStatus(sensorType, value) {
  const range = optimalRanges[sensorType];
  const margin = (range.max - range.min) * 0.1; // 10% margin
  
  if (value < range.min - margin || value > range.max + margin) {
    return 'danger';
  } else if (value < range.min || value > range.max) {
    return 'warn';
  } else {
    return 'ok';
  }
}

// --- Update sensor readings ---
function updateSensorReadings() {
  const sensorItems = document.querySelectorAll('.sensor-item');
  
  // Temperature
  const tempStatus = checkSensorStatus('temperature', sensorData.temperature);
  sensorItems[0].querySelector('.sensor-value').textContent = `${sensorData.temperature.toFixed(1)}°C`;
  updateSensorStatus(sensorItems[0], tempStatus);
  
  // Humidity
  const humidityStatus = checkSensorStatus('humidity', sensorData.humidity);
  sensorItems[1].querySelector('.sensor-value').textContent = `${Math.round(sensorData.humidity)}%`;
  updateSensorStatus(sensorItems[1], humidityStatus);
  
  // Light (PPFD)
  const lightStatus = checkSensorStatus('light', sensorData.light);
  sensorItems[2].querySelector('.sensor-value').textContent = `${Math.round(sensorData.light)} μmol/m²/s`;
  updateSensorStatus(sensorItems[2], lightStatus);
}

// --- Update visual sensor status ---
function updateSensorStatus(sensorItem, status) {
  const statusElement = sensorItem.querySelector('.sensor-status');
  statusElement.className = 'sensor-status ' + status;
  
  switch(status) {
    case 'danger':
      statusElement.textContent = 'Critical';
      break;
    case 'warn':
      statusElement.textContent = 'Alert';
      break;
    case 'ok':
      statusElement.textContent = 'Normal';
      break;
  }
}

// --- Update alerts ---
function updateAlerts() {
  const alertsList = document.getElementById('alertsList');
  alertsList.innerHTML = '';
  
  const tempStatus = checkSensorStatus('temperature', sensorData.temperature);
  const humidityStatus = checkSensorStatus('humidity', sensorData.humidity);
  const lightStatus = checkSensorStatus('light', sensorData.light);
  
  // Generate alerts based on status
  if (tempStatus === 'danger') {
    addAlert(`CRITICAL Temperature: ${sensorData.temperature.toFixed(1)}°C`, 'danger');
  } else if (tempStatus === 'warn') {
    addAlert(`Temperature ALERT: ${sensorData.temperature.toFixed(1)}°C`, 'warn');
  }
  
  if (humidityStatus === 'danger') {
    addAlert(`CRITICAL Humidity: ${Math.round(sensorData.humidity)}%`, 'danger');
  } else if (humidityStatus === 'warn') {
    addAlert(`Humidity ALERT: ${Math.round(sensorData.humidity)}%`, 'warn');
  }
  
  if (lightStatus === 'danger') {
    addAlert(`CRITICAL Light: ${Math.round(sensorData.light)} μmol/m²/s`, 'danger');
  } else if (lightStatus === 'warn') {
    addAlert(`Light ALERT: ${Math.round(sensorData.light)} μmol/m²/s`, 'warn');
  }
  
  // If no alerts, show normal status message
  if (alertsList.children.length === 0) {
    addAlert('Optimal environmental conditions', 'ok');
  }
}

// --- Add alert to list ---
function addAlert(message, type) {
  const alertsList = document.getElementById('alertsList');
  const li = document.createElement('li');
  
  let timeText = '2 min ago';
  if (sensorData.lastUpdate) {
    const now = new Date();
    const diffMs = now - sensorData.lastUpdate;
    const diffMins = Math.round(diffMs / 60000);
    timeText = `${diffMins} min ago`;
  }
  
  li.innerHTML = `<span class="badge ${type}">${getAlertTypeText(type)}</span> ${message} • ${timeText}`;
  alertsList.appendChild(li);
}

// --- Get text for alert type ---
function getAlertTypeText(type) {
  switch(type) {
    case 'danger': return 'Critical';
    case 'warn': return 'Alert';
    case 'ok': return 'OK';
    default: return 'Info';
  }
}

// --- Update last update ---
function updateLastUpdate() {
  const lastUpdateElement = document.getElementById('lastUpdate');
  if (sensorData.lastUpdate) {
    const now = new Date();
    const diffMs = now - sensorData.lastUpdate;
    const diffMins = Math.round(diffMs / 60000);
    lastUpdateElement.textContent = `${diffMins} min ago`;
  }
}

// --- Simulate data refresh ---
function simulateRefresh() {
  // Simulate new sensor data (replace with real Arduino data)
  sensorData = {
    temperature: 24 + (Math.random() * 4 - 2), // ±2°C variation
    humidity: 60 + (Math.random() * 20 - 10), // ±10% variation
    light: 800 + (Math.random() * 400 - 200), // ±200 PPFD variation
    lastUpdate: new Date()
  };
  
  updateUI();
}

// --- Simulate data export ---
function simulateExport() {
  const a = document.createElement('a');
  const csv = buildCSV();
  const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
  a.href = URL.createObjectURL(blob);
  a.download = `sensor_data_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

// --- Build CSV with data ---
function buildCSV() {
  const rows = ['Sensor,Value,Unit,Status,Optimal Range'];
  rows.push(`Temperature,${sensorData.temperature.toFixed(1)},°C,${checkSensorStatus('temperature', sensorData.temperature)},${optimalRanges.temperature.min}-${optimalRanges.temperature.max}°C`);
  rows.push(`Humidity,${Math.round(sensorData.humidity)},%,${checkSensorStatus('humidity', sensorData.humidity)},${optimalRanges.humidity.min}-${optimalRanges.humidity.max}%`);
  rows.push(`Light PPFD,${Math.round(sensorData.light)},μmol/m²/s,${checkSensorStatus('light', sensorData.light)},${optimalRanges.light.min}-${optimalRanges.light.max} μmol/m²/s`);
  rows.push(`Export date,${new Date().toLocaleString('en-US')}`);
  return rows.join('\n');
}

// --- Change configuration based on crop ---
function setCrop(cropType) {
  if (cropSettings[cropType]) {
    currentCrop = cropType;
    optimalRanges.temperature = cropSettings[cropType].temperature;
    optimalRanges.humidity = cropSettings[cropType].humidity;
    optimalRanges.light = cropSettings[cropType].light;
    
    // Update range texts in interface
    document.querySelectorAll('.delta')[0].textContent = `Range: ${optimalRanges.temperature.min}-${optimalRanges.temperature.max}°C`;
    document.querySelectorAll('.delta')[1].textContent = `Range: ${optimalRanges.humidity.min}-${optimalRanges.humidity.max}%`;
    document.querySelectorAll('.delta')[2].textContent = `Range: ${optimalRanges.light.min}-${optimalRanges.light.max} μmol/m²/s`;
    
    updateUI();
  }
}

// --- Initialize interface ---
updateUI();

// --- Simulate automatic update every 30 seconds ---
setInterval(simulateRefresh, 30000);