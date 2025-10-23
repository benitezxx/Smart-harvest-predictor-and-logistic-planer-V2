// Como todo vive en http://localhost/ProyectoAgiles
const API = '/ProyectoAgiles/PHP';


// --- Responsive sidebar ---
const sidebar = document.querySelector('.sidebar');
const openSidebarBtn = document.getElementById('openSidebar');
const closeSidebarBtn = document.getElementById('closeSidebar');
openSidebarBtn?.addEventListener('click', ()=> sidebar.classList.add('open'));
closeSidebarBtn?.addEventListener('click', ()=> sidebar.classList.remove('open'));

// --- DOM Elements ---
const sensorsTableBody = document.getElementById('sensorsTableBody');
const searchInput = document.getElementById('searchSensors');
const statusFilter = document.getElementById('statusFilter');
const typeFilter = document.getElementById('typeFilter');
const locationFilter = document.getElementById('locationFilter');
const refreshBtn = document.getElementById('refreshSensorsBtn');
const addSensorBtn = document.getElementById('addSensorBtn');
const exportSensorsBtn = document.getElementById('exportSensorsBtn');
const sensorModal = document.getElementById('sensorModal');
const closeModal = document.getElementById('closeModal');
const cancelBtn = document.getElementById('cancelBtn');
const saveSensorBtn = document.getElementById('saveSensorBtn');

// --- Example sensor data ---
let sensors = [
  {
    id: 'TEMP-001',
    name: 'Temperature Sensor A1',
    type: 'temperature',
    location: 'lot-a',
    currentValue: 24.5,
    unit: '°C',
    status: 'online',
    lastReading: new Date(Date.now() - 2 * 60000), // 2 minutes ago
    battery: 85,
    optimalRange: { min: 18, max: 30 }
  },
  {
    id: 'HUM-001',
    name: 'Humidity Sensor A1',
    type: 'humidity',
    location: 'lot-a',
    currentValue: 65,
    unit: '%',
    status: 'online',
    lastReading: new Date(Date.now() - 3 * 60000),
    battery: 78,
    optimalRange: { min: 40, max: 80 }
  },
  {
    id: 'LIGHT-001',
    name: 'Light Sensor A1',
    type: 'light',
    location: 'lot-a',
    currentValue: 850,
    unit: 'μmol/m²/s',
    status: 'online',
    lastReading: new Date(Date.now() - 1 * 60000),
    battery: 92,
    optimalRange: { min: 400, max: 1200 }
  },
  {
    id: 'TEMP-002',
    name: 'Temperature Sensor B1',
    type: 'temperature',
    location: 'lot-b',
    currentValue: 32.1,
    unit: '°C',
    status: 'warning',
    lastReading: new Date(Date.now() - 5 * 60000),
    battery: 45,
    optimalRange: { min: 18, max: 30 }
  },
  {
    id: 'HUM-002',
    name: 'Humidity Sensor B1',
    type: 'humidity',
    location: 'lot-b',
    currentValue: 35,
    unit: '%',
    status: 'warning',
    lastReading: new Date(Date.now() - 4 * 60000),
    battery: 60,
    optimalRange: { min: 40, max: 80 }
  },
  {
    id: 'TEMP-003',
    name: 'Temperature Sensor C1',
    type: 'temperature',
    location: 'lot-c',
    currentValue: 0,
    unit: '°C',
    status: 'offline',
    lastReading: new Date(Date.now() - 25 * 60000),
    battery: 15,
    optimalRange: { min: 18, max: 30 }
  },
  {
    id: 'LIGHT-002',
    name: 'Light Sensor Greenhouse',
    type: 'light',
    location: 'greenhouse',
    currentValue: 450,
    unit: 'μmol/m²/s',
    status: 'online',
    lastReading: new Date(Date.now() - 2 * 60000),
    battery: 88,
    optimalRange: { min: 400, max: 1200 }
  },
  {
    id: 'HUM-003',
    name: 'Humidity Sensor Greenhouse',
    type: 'humidity',
    location: 'greenhouse',
    currentValue: 75,
    unit: '%',
    status: 'online',
    lastReading: new Date(Date.now() - 3 * 60000),
    battery: 82,
    optimalRange: { min: 40, max: 80 }
  },
  {
    id: 'TEMP-004',
    name: 'Temperature Sensor A2',
    type: 'temperature',
    location: 'lot-a',
    currentValue: 22.8,
    unit: '°C',
    status: 'online',
    lastReading: new Date(Date.now() - 1 * 60000),
    battery: 90,
    optimalRange: { min: 18, max: 30 }
  },
  {
    id: 'LIGHT-003',
    name: 'Light Sensor C1',
    type: 'light',
    location: 'lot-c',
    currentValue: 0,
    unit: 'μmol/m²/s',
    status: 'offline',
    lastReading: new Date(Date.now() - 30 * 60000),
    battery: 5,
    optimalRange: { min: 400, max: 1200 }
  }
];

// --- Active filters ---
let activeFilters = {
  search: '',
  status: 'all',
  type: 'all',
  location: 'all'
};

// --- Initialization ---
document.addEventListener('DOMContentLoaded', function() {
  updateSensorsSummary();
  renderSensorsTable();
  setupEventListeners();
});

// --- Setup event listeners ---
function setupEventListeners() {
  // Filters
  searchInput.addEventListener('input', (e) => {
    activeFilters.search = e.target.value.toLowerCase();
    renderSensorsTable();
  });

  statusFilter.addEventListener('change', (e) => {
    activeFilters.status = e.target.value;
    renderSensorsTable();
  });

  typeFilter.addEventListener('change', (e) => {
    activeFilters.type = e.target.value;
    renderSensorsTable();
  });

  locationFilter.addEventListener('change', (e) => {
    activeFilters.location = e.target.value;
    renderSensorsTable();
  });

  // Buttons
  refreshBtn.addEventListener('click', refreshSensorsData);
  addSensorBtn.addEventListener('click', () => openSensorModal());
  exportSensorsBtn.addEventListener('click', exportSensorsData);

  // Modal
  closeModal.addEventListener('click', closeSensorModal);
  cancelBtn.addEventListener('click', closeSensorModal);
  saveSensorBtn.addEventListener('click', saveSensor);

  // Close modal when clicking outside
  window.addEventListener('click', (e) => {
    if (e.target === sensorModal) {
      closeSensorModal();
    }
  });
}

// --- Update sensors summary ---
function updateSensorsSummary() {
  const totalOnline = sensors.filter(s => s.status === 'online').length;
  const totalOffline = sensors.filter(s => s.status === 'offline').length;
  const totalWarning = sensors.filter(s => s.status === 'warning').length;
  const totalSensors = sensors.length;

  document.getElementById('totalOnline').textContent = totalOnline;
  document.getElementById('totalOffline').textContent = totalOffline;
  document.getElementById('totalWarning').textContent = totalWarning;
  document.getElementById('totalSensors').textContent = totalSensors;
}

// --- Render sensors table ---
function renderSensorsTable() {
  const filteredSensors = filterSensors();
  
  sensorsTableBody.innerHTML = '';

  if (filteredSensors.length === 0) {
    sensorsTableBody.innerHTML = `
      <tr>
        <td colspan="8" class="no-data">
          No sensors found with applied filters
        </td>
      </tr>
    `;
    return;
  }

  filteredSensors.forEach(sensor => {
    const row = createSensorRow(sensor);
    sensorsTableBody.appendChild(row);
  });
}

// --- Filter sensors ---
function filterSensors() {
  return sensors.filter(sensor => {
    // Search filter
    if (activeFilters.search && 
        !sensor.name.toLowerCase().includes(activeFilters.search) &&
        !sensor.id.toLowerCase().includes(activeFilters.search) &&
        !sensor.location.toLowerCase().includes(activeFilters.search)) {
      return false;
    }

    // Status filter
    if (activeFilters.status !== 'all' && sensor.status !== activeFilters.status) {
      return false;
    }

    // Type filter
    if (activeFilters.type !== 'all' && sensor.type !== activeFilters.type) {
      return false;
    }

    // Location filter
    if (activeFilters.location !== 'all' && sensor.location !== activeFilters.location) {
      return false;
    }

    return true;
  });
}

// --- Create sensor row ---
function createSensorRow(sensor) {
  const row = document.createElement('tr');
  row.className = `sensor-row ${sensor.status}`;

  const timeAgo = getTimeAgo(sensor.lastReading);
  const statusText = getStatusText(sensor.status);
  const statusClass = getStatusClass(sensor.status);
  const valueClass = getValueStatusClass(sensor);

  row.innerHTML = `
    <td class="sensor-id">${sensor.id}</td>
    <td class="sensor-name">${sensor.name}</td>
    <td class="sensor-type">${getTypeText(sensor.type)}</td>
    <td class="sensor-location">${getLocationText(sensor.location)}</td>
    <td class="sensor-value ${valueClass}">
      ${sensor.currentValue || 0} ${sensor.unit}
    </td>
    <td class="sensor-status">
      <span class="status-badge ${statusClass}">${statusText}</span>
    </td>
    <td class="sensor-last-reading">${timeAgo}</td>
    <td class="sensor-actions">
      <button class="btn-icon view-btn" title="View details" data-id="${sensor.id}">👁️</button>
      <button class="btn-icon config-btn" title="Configure" data-id="${sensor.id}">⚙️</button>
      <button class="btn-icon history-btn" title="History" data-id="${sensor.id}">📊</button>
    </td>
  `;

  // Add event listeners to buttons
  const viewBtn = row.querySelector('.view-btn');
  const configBtn = row.querySelector('.config-btn');
  const historyBtn = row.querySelector('.history-btn');

  viewBtn.addEventListener('click', () => viewSensorDetails(sensor.id));
  configBtn.addEventListener('click', () => configureSensor(sensor.id));
  historyBtn.addEventListener('click', () => viewSensorHistory(sensor.id));

  return row;
}

// --- Helper functions ---
function getTimeAgo(date) {
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} h ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} d ago`;
}

function getStatusText(status) {
  const statusMap = {
    'online': 'Online',
    'offline': 'Offline',
    'warning': 'Alert'
  };
  return statusMap[status] || status;
}

function getStatusClass(status) {
  const classMap = {
    'online': 'status-online',
    'offline': 'status-offline',
    'warning': 'status-warning'
  };
  return classMap[status] || '';
}

function getTypeText(type) {
  const typeMap = {
    'temperature': '🌡️ Temperature',
    'humidity': '💧 Humidity',
    'light': '💡 Light PPFD'
  };
  return typeMap[type] || type;
}

function getLocationText(location) {
  const locationMap = {
    'lot-a': 'Lot A',
    'lot-b': 'Lot B',
    'lot-c': 'Lot C',
    'greenhouse': 'Greenhouse'
  };
  return locationMap[location] || location;
}

function getValueStatusClass(sensor) {
  if (sensor.status === 'offline') return 'value-offline';
  if (sensor.status === 'warning') return 'value-warning';
  
  // Check if value is outside optimal range
  if (sensor.currentValue < sensor.optimalRange.min || 
      sensor.currentValue > sensor.optimalRange.max) {
    return 'value-warning';
  }
  
  return 'value-normal';
}

// --- Button functions ---
function refreshSensorsData() {
  // Simulate data update
  sensors.forEach(sensor => {
    if (sensor.status !== 'offline') {
      // Random variation to simulate real readings
      const variation = (Math.random() - 0.5) * 4;
      sensor.currentValue = Math.max(0, sensor.currentValue + variation);
      sensor.lastReading = new Date();
      
      // Update status based on values
      updateSensorStatus(sensor);
    }
  });
  
  renderSensorsTable();
  updateSensorsSummary();
  
  // Show notification
  showNotification('Sensor data updated', 'success');
}

function updateSensorStatus(sensor) {
  if (sensor.currentValue === 0) {
    sensor.status = 'offline';
  } else if (sensor.currentValue < sensor.optimalRange.min || 
             sensor.currentValue > sensor.optimalRange.max) {
    sensor.status = 'warning';
  } else {
    sensor.status = 'online';
  }
}

function viewSensorDetails(sensorId) {
  const sensor = sensors.find(s => s.id === sensorId);
  if (!sensor) return;

  document.getElementById('modalTitle').textContent = `Details: ${sensor.name}`;
  
  document.getElementById('modalBody').innerHTML = `
    <div class="sensor-details">
      <div class="detail-row">
        <span class="detail-label">ID:</span>
        <span class="detail-value">${sensor.id}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Type:</span>
        <span class="detail-value">${getTypeText(sensor.type)}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Location:</span>
        <span class="detail-value">${getLocationText(sensor.location)}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Current Value:</span>
        <span class="detail-value ${getValueStatusClass(sensor)}">
          ${sensor.currentValue} ${sensor.unit}
        </span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Optimal Range:</span>
        <span class="detail-value">
          ${sensor.optimalRange.min} - ${sensor.optimalRange.max} ${sensor.unit}
        </span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Battery:</span>
        <span class="detail-value">${sensor.battery}%</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Last Reading:</span>
        <span class="detail-value">${getTimeAgo(sensor.lastReading)}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Status:</span>
        <span class="detail-value status-badge ${getStatusClass(sensor.status)}">
          ${getStatusText(sensor.status)}
        </span>
      </div>
    </div>
  `;

  saveSensorBtn.style.display = 'none';
  sensorModal.style.display = 'block';
}

function configureSensor(sensorId) {
  const sensor = sensors.find(s => s.id === sensorId);
  if (!sensor) return;

  document.getElementById('modalTitle').textContent = `Configure: ${sensor.name}`;
  
  document.getElementById('modalBody').innerHTML = `
    <div class="sensor-config">
      <div class="config-group">
        <label for="configName">Sensor Name</label>
        <input type="text" id="configName" value="${sensor.name}" class="config-input">
      </div>
      <div class="config-group">
        <label for="configLocation">Location</label>
        <select id="configLocation" class="config-input">
          <option value="lot-a" ${sensor.location === 'lot-a' ? 'selected' : ''}>Lot A</option>
          <option value="lot-b" ${sensor.location === 'lot-b' ? 'selected' : ''}>Lot B</option>
          <option value="lot-c" ${sensor.location === 'lot-c' ? 'selected' : ''}>Lot C</option>
          <option value="greenhouse" ${sensor.location === 'greenhouse' ? 'selected' : ''}>Greenhouse</option>
        </select>
      </div>
      <div class="config-group">
        <label for="configMin">Minimum Range (${sensor.unit})</label>
        <input type="number" id="configMin" value="${sensor.optimalRange.min}" class="config-input">
      </div>
      <div class="config-group">
        <label for="configMax">Maximum Range (${sensor.unit})</label>
        <input type="number" id="configMax" value="${sensor.optimalRange.max}" class="config-input">
      </div>
    </div>
  `;

  saveSensorBtn.style.display = 'block';
  saveSensorBtn.onclick = () => saveSensorConfiguration(sensorId);
  sensorModal.style.display = 'block';
}

function viewSensorHistory(sensorId) {
  const sensor = sensors.find(s => s.id === sensorId);
  if (!sensor) return;

  document.getElementById('modalTitle').textContent = `History: ${sensor.name}`;
  
  // Simulate historical data
  const historyData = generateHistoryData(sensor);
  
  document.getElementById('modalBody').innerHTML = `
    <div class="sensor-history">
      <div class="history-stats">
        <div class="stat">
          <span class="stat-label">Average:</span>
          <span class="stat-value">${historyData.average.toFixed(1)} ${sensor.unit}</span>
        </div>
        <div class="stat">
          <span class="stat-label">Maximum:</span>
          <span class="stat-value">${historyData.max.toFixed(1)} ${sensor.unit}</span>
        </div>
        <div class="stat">
          <span class="stat-label">Minimum:</span>
          <span class="stat-value">${historyData.min.toFixed(1)} ${sensor.unit}</span>
        </div>
      </div>
      <div class="history-chart">
        <canvas id="historyChart" width="400" height="200"></canvas>
      </div>
    </div>
  `;

  saveSensorBtn.style.display = 'none';
  sensorModal.style.display = 'block';

  // Render simple chart
  renderSimpleChart(historyData);
}

function generateHistoryData(sensor) {
  const data = [];
  let sum = 0;
  let min = Infinity;
  let max = -Infinity;

  for (let i = 0; i < 24; i++) {
    const value = sensor.currentValue + (Math.random() - 0.5) * 10;
    data.push(Math.max(0, value));
    sum += value;
    min = Math.min(min, value);
    max = Math.max(max, value);
  }

  return {
    data: data,
    average: sum / 24,
    min: min,
    max: max
  };
}

function renderSimpleChart(historyData) {
  const canvas = document.getElementById('historyChart');
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  // Clear canvas
  ctx.clearRect(0, 0, width, height);

  // Draw simple chart
  ctx.strokeStyle = '#22c55e';
  ctx.lineWidth = 2;
  ctx.beginPath();

  historyData.data.forEach((value, index) => {
    const x = (index / (historyData.data.length - 1)) * width;
    const y = height - (value / historyData.max) * height * 0.8;

    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });

  ctx.stroke();
}

function saveSensorConfiguration(sensorId) {
  const sensor = sensors.find(s => s.id === sensorId);
  if (!sensor) return;

  const name = document.getElementById('configName').value;
  const location = document.getElementById('configLocation').value;
  const min = parseFloat(document.getElementById('configMin').value);
  const max = parseFloat(document.getElementById('configMax').value);

  // Basic validations
  if (min >= max) {
    showNotification('Minimum value must be less than maximum', 'error');
    return;
  }

  if (!name.trim()) {
    showNotification('Sensor name is required', 'error');
    return;
  }

  // Update sensor
  sensor.name = name;
  sensor.location = location;
  sensor.optimalRange = { min, max };

  // Close modal and update table
  closeSensorModal();
  renderSensorsTable();
  showNotification('Configuration saved successfully', 'success');
}

function openSensorModal() {
  document.getElementById('modalTitle').textContent = 'Add New Sensor';
  
  document.getElementById('modalBody').innerHTML = `
    <div class="sensor-config">
      <div class="config-group">
        <label for="newSensorId">Sensor ID</label>
        <input type="text" id="newSensorId" placeholder="Ex: TEMP-005" class="config-input">
      </div>
      <div class="config-group">
        <label for="newSensorName">Name</label>
        <input type="text" id="newSensorName" placeholder="Ex: New Temperature Sensor" class="config-input">
      </div>
      <div class="config-group">
        <label for="newSensorType">Type</label>
        <select id="newSensorType" class="config-input">
          <option value="temperature">Temperature</option>
          <option value="humidity">Humidity</option>
          <option value="light">Light PPFD</option>
        </select>
      </div>
      <div class="config-group">
        <label for="newSensorLocation">Location</label>
        <select id="newSensorLocation" class="config-input">
          <option value="lot-a">Lot A</option>
          <option value="lot-b">Lot B</option>
          <option value="lot-c">Lot C</option>
          <option value="greenhouse">Greenhouse</option>
        </select>
      </div>
    </div>
  `;

  saveSensorBtn.style.display = 'block';
  saveSensorBtn.onclick = addNewSensor;
  sensorModal.style.display = 'block';
}

function addNewSensor() {
  const id = document.getElementById('newSensorId').value;
  const name = document.getElementById('newSensorName').value;
  const type = document.getElementById('newSensorType').value;
  const location = document.getElementById('newSensorLocation').value;

  // Validations
  if (!id.trim() || !name.trim()) {
    showNotification('ID and name are required', 'error');
    return;
  }

  // Check if ID already exists
  if (sensors.find(s => s.id === id)) {
    showNotification('Sensor ID already exists', 'error');
    return;
  }

  // Default ranges by type
  const defaultRanges = {
    temperature: { min: 18, max: 30 },
    humidity: { min: 40, max: 80 },
    light: { min: 400, max: 1200 }
  };

  // Create new sensor
  const newSensor = {
    id: id,
    name: name,
    type: type,
    location: location,
    currentValue: 0,
    unit: getUnitByType(type),
    status: 'offline',
    lastReading: new Date(),
    battery: 0,
    optimalRange: defaultRanges[type]
  };

  sensors.push(newSensor);

  // Close modal and update
  closeSensorModal();
  renderSensorsTable();
  updateSensorsSummary();
  showNotification('Sensor added successfully', 'success');
}

function getUnitByType(type) {
  const unitMap = {
    temperature: '°C',
    humidity: '%',
    light: 'μmol/m²/s'
  };
  return unitMap[type] || '';
}

function exportSensorsData() {
  const filteredSensors = filterSensors();
  const csvData = convertToCSV(filteredSensors);
  
  const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `sensors_${new Date().toISOString().slice(0,10)}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  showNotification('Data exported successfully', 'success');
}

function convertToCSV(sensorsArray) {
  const headers = ['ID', 'Name', 'Type', 'Location', 'Value', 'Unit', 'Status', 'Battery', 'Last Reading'];
  const rows = sensorsArray.map(sensor => [
    sensor.id,
    sensor.name,
    getTypeText(sensor.type),
    getLocationText(sensor.location),
    sensor.currentValue,
    sensor.unit,
    getStatusText(sensor.status),
    `${sensor.battery}%`,
    getTimeAgo(sensor.lastReading)
  ]);

  return [headers, ...rows].map(row => row.join(',')).join('\n');
}

function closeSensorModal() {
  sensorModal.style.display = 'none';
}

function saveSensor() {
  // Generic save function (overwritten based on action)
  closeSensorModal();
}

function showNotification(message, type) {
  // Create simple notification
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 20px;
    border-radius: 8px;
    color: white;
    font-weight: 500;
    z-index: 1000;
    animation: slideIn 0.3s ease;
  `;
  
  if (type === 'success') {
    notification.style.background = '#22c55e';
  } else if (type === 'error') {
    notification.style.background = '#ef4444';
  } else {
    notification.style.background = '#3b82f6';
  }
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// CSS styles for notifications
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
`;
document.head.appendChild(style);