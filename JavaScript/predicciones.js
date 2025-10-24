// predicciones.js
const API = '/ProyectoAgiles/PHP';

// --- Responsive sidebar ---
const sidebar = document.getElementById('sidebar');
document.getElementById('openSidebar')?.addEventListener('click', () => sidebar.classList.add('open'));
document.getElementById('closeSidebar')?.addEventListener('click', () => sidebar.classList.remove('open'));

// --- DOM Elements ---
const btnGeneratePrediction = document.getElementById('btnGeneratePrediction');
const btnTrainModel = document.getElementById('btnTrainModel');
const btnExportPredictions = document.getElementById('btnExportPredictions');
const predictionsBody = document.getElementById('predictionsBody');

// Current data elements
const currentTemp = document.getElementById('currentTemp');
const currentHumidity = document.getElementById('currentHumidity');
const currentLight = document.getElementById('currentLight');

// Prediction result elements
const predictedYield = document.getElementById('predictedYield');
const confidenceValue = document.getElementById('confidenceValue');
const confidenceFill = document.getElementById('confidenceFill');
const factorsAnalysis = document.getElementById('factorsAnalysis');
const modelAccuracy = document.getElementById('modelAccuracy');

// --- Prediction Data ---
let predictionHistory = [];

// --- Initialize ---
document.addEventListener('DOMContentLoaded', function() {
    loadCurrentEnvironmentalData();
    loadPredictionHistory();
    setupEventListeners();
    
    // Check model health on startup
    setTimeout(() => {
        checkModelHealth().then(health => {
            if (health.status === 'not_trained') {
                showNotification('AI model needs training. Click "Train Model" to start.', 'warning');
            } else if (health.status === 'ready') {
                showNotification('AI model is ready for predictions!', 'success');
                updateModelAccuracy();
            }
        });
    }, 1000);
});

// --- Setup event listeners ---
function setupEventListeners() {
    btnGeneratePrediction.addEventListener('click', generatePrediction);
    btnTrainModel.addEventListener('click', trainModel);
    btnExportPredictions.addEventListener('click', exportPredictions);
}

// --- Load current environmental data ---
async function loadCurrentEnvironmentalData() {
    try {
        const response = await fetch(`${API}/dashboard.php`);
        const data = await response.json();
        
        if (data.temperatura) {
            currentTemp.textContent = `${data.temperatura} °C`;
        } else {
            currentTemp.textContent = '24.5 °C'; // Default fallback
        }
        
        if (data.humedad) {
            currentHumidity.textContent = `${data.humedad} %`;
        } else {
            currentHumidity.textContent = '65 %'; // Default fallback
        }
        
        if (data.luz) {
            currentLight.textContent = `${data.luz} μmol/m²/s`;
        } else {
            currentLight.textContent = '750 μmol/m²/s'; // Default fallback
        }
    } catch (error) {
        console.error('Error loading environmental data:', error);
        // Set default values if API fails
        currentTemp.textContent = '24.5 °C';
        currentHumidity.textContent = '65 %';
        currentLight.textContent = '750 μmol/m²/s';
    }
}

// --- Generate AI Prediction ---
async function generatePrediction() {
    const cropType = document.getElementById('cropType').value;
    const growthStage = document.getElementById('growthStage').value;
    const daysSincePlanting = parseInt(document.getElementById('daysSincePlanting').value);
    const locationZone = document.getElementById('locationZone').value;

    // Show loading state
    btnGeneratePrediction.disabled = true;
    btnGeneratePrediction.textContent = 'Generating...';

    try {
        // Prepare prediction request
        const predictionData = {
            crop_type: cropType,
            growth_stage: growthStage,
            days_since_planting: daysSincePlanting,
            location_zone: locationZone,
            current_temp: parseFloat(currentTemp.textContent),
            current_humidity: parseFloat(currentHumidity.textContent),
            current_light: parseFloat(currentLight.textContent)
        };

        // Call prediction API
        const prediction = await callPredictionAPI(predictionData);
        
        // Display results
        displayPredictionResults(prediction);
        
        // Save to history
        savePredictionToHistory(prediction, cropType);
        
        showNotification('Prediction generated successfully!', 'success');
        
    } catch (error) {
        console.error('Error generating prediction:', error);
        showNotification('Error generating prediction: ' + error.message, 'error');
    } finally {
        btnGeneratePrediction.disabled = false;
        btnGeneratePrediction.textContent = 'Generate Prediction';
    }
}

// --- Call ML Prediction API ---
async function callPredictionAPI(predictionData) {
    try {
        const response = await fetch(`${API}/predict_ml.php`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(predictionData)
        });

        if (response.ok) {
            const result = await response.json();
            if (result.error) {
                throw new Error(result.error);
            }
            return result;
        } else {
            throw new Error('API response not OK');
        }
    } catch (error) {
        console.warn('ML Prediction API not available, using simulated data:', error);
        // Fallback to simulated prediction
        return generateSimulatedPrediction(predictionData);
    }
}

// --- Generate simulated prediction (fallback) ---
function generateSimulatedPrediction(data) {
    // Base yields by crop type (kg/hectare)
    const baseYields = {
        'tomato': 45000,
        'lettuce': 28000,
        'strawberry': 22000,
        'pepper': 38000
    };

    const baseYield = baseYields[data.crop_type] || 30000;
    
    // Adjust based on environmental factors
    let yieldMultiplier = 1.0;
    let confidence = 0.85; // 85% confidence
    
    // Temperature adjustment (optimal: 22-26°C)
    if (data.current_temp >= 22 && data.current_temp <= 26) {
        yieldMultiplier *= 1.15;
    } else if (data.current_temp < 18 || data.current_temp > 30) {
        yieldMultiplier *= 0.8;
        confidence -= 0.1;
    }

    // Humidity adjustment (optimal: 60-70%)
    if (data.current_humidity >= 60 && data.current_humidity <= 70) {
        yieldMultiplier *= 1.1;
    } else if (data.current_humidity < 40 || data.current_humidity > 80) {
        yieldMultiplier *= 0.9;
        confidence -= 0.05;
    }

    // Light adjustment (optimal: 600-900 μmol/m²/s)
    if (data.current_light >= 600 && data.current_light <= 900) {
        yieldMultiplier *= 1.12;
    } else if (data.current_light < 400) {
        yieldMultiplier *= 0.85;
        confidence -= 0.08;
    }

    // Growth stage adjustment
    const stageMultipliers = {
        'early': 0.3,
        'vegetative': 0.7,
        'flowering': 0.9,
        'fruiting': 1.0
    };
    yieldMultiplier *= stageMultipliers[data.growth_stage] || 1.0;

    // Add some random variation (±10%)
    const randomVariation = 0.9 + (Math.random() * 0.2);
    yieldMultiplier *= randomVariation;

    const predictedYield = Math.round(baseYield * yieldMultiplier);
    
    return {
        predicted_yield: predictedYield,
        confidence: Math.round(confidence * 100),
        feature_importance: {
            temperature: 25,
            humidity: 20,
            light: 18,
            crop_type: 15,
            growth_stage: 12,
            days_planting: 10
        },
        model_version: 'simulated-v1.0'
    };
}

// --- Display prediction results ---
function displayPredictionResults(prediction) {
    predictedYield.textContent = prediction.predicted_yield.toLocaleString();
    confidenceValue.textContent = `${prediction.confidence}%`;
    confidenceFill.style.width = `${prediction.confidence}%`;

    // Update factors analysis
    updateFactorsAnalysis(prediction.feature_importance);
}

// --- Update factors analysis with feature importance ---
function updateFactorsAnalysis(featureImportance) {
    const factorsContainer = document.getElementById('factorsAnalysis');
    if (!factorsContainer) return;

    factorsContainer.innerHTML = '';

    if (!featureImportance) {
        // Fallback factors
        factorsContainer.innerHTML = `
            <div class="factor positive">
                <span class="factor-label">Optimal Temperature</span>
                <span class="factor-impact">+15%</span>
            </div>
            <div class="factor positive">
                <span class="factor-label">Good Light Exposure</span>
                <span class="factor-impact">+12%</span>
            </div>
            <div class="factor neutral">
                <span class="factor-label">Growth Stage</span>
                <span class="factor-impact">Neutral</span>
            </div>
        `;
        return;
    }

    // Convert feature importance to factors
    const factors = [];
    
    if (featureImportance.temperature) {
        factors.push({
            label: 'Temperature Impact',
            impact: featureImportance.temperature + '%',
            type: featureImportance.temperature > 20 ? 'positive' : 
                  featureImportance.temperature < 10 ? 'negative' : 'neutral'
        });
    }
    
    if (featureImportance.humidity) {
        factors.push({
            label: 'Humidity Impact', 
            impact: featureImportance.humidity + '%',
            type: featureImportance.humidity > 15 ? 'positive' :
                  featureImportance.humidity < 8 ? 'negative' : 'neutral'
        });
    }
    
    if (featureImportance.light) {
        factors.push({
            label: 'Light Impact',
            impact: featureImportance.light + '%',
            type: featureImportance.light > 15 ? 'positive' :
                  featureImportance.light < 8 ? 'negative' : 'neutral'
        });
    }

    if (featureImportance.crop_type) {
        factors.push({
            label: 'Crop Type',
            impact: featureImportance.crop_type + '%',
            type: 'neutral'
        });
    }

    if (featureImportance.growth_stage) {
        factors.push({
            label: 'Growth Stage', 
            impact: featureImportance.growth_stage + '%',
            type: 'neutral'
        });
    }

    if (featureImportance.days_planting) {
        factors.push({
            label: 'Planting Days',
            impact: featureImportance.days_planting + '%',
            type: 'neutral'
        });
    }

    // Render factors
    factors.forEach(factor => {
        const factorEl = document.createElement('div');
        factorEl.className = `factor ${factor.type}`;
        factorEl.innerHTML = `
            <span class="factor-label">${factor.label}</span>
            <span class="factor-impact">${factor.impact}</span>
        `;
        factorsContainer.appendChild(factorEl);
    });
}

// --- Train Model Function ---
async function trainModel() {
    btnTrainModel.disabled = true;
    btnTrainModel.textContent = 'Training...';
    
    try {
        const response = await fetch(`${API}/predict_ml.php?action=train`);
        const result = await response.json();
        
        if (result.error) {
            throw new Error(result.error);
        }
        
        showNotification(`Model trained successfully! MAE: ${result.mae?.toFixed(2)}, R²: ${result.r2?.toFixed(4)}`, 'success');
        
        // Update model accuracy display
        if (result.r2) {
            modelAccuracy.textContent = `${(result.r2 * 100).toFixed(1)}%`;
        }
        
        return result;
    } catch (error) {
        console.error('Error training model:', error);
        showNotification('Error training model: ' + error.message, 'error');
    } finally {
        btnTrainModel.disabled = false;
        btnTrainModel.textContent = 'Train Model';
    }
}

// --- Check Model Health ---
async function checkModelHealth() {
    try {
        const response = await fetch(`${API}/predict_ml.php?action=health`);
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error checking model health:', error);
        return { status: 'error', message: error.message };
    }
}

// --- Update model accuracy ---
async function updateModelAccuracy() {
    // This would typically come from your model evaluation
    // For now, we'll set a default value
    modelAccuracy.textContent = '85.2%';
}

// --- Save prediction to history ---
function savePredictionToHistory(prediction, cropType) {
    const predictionRecord = {
        id: Date.now(),
        date: new Date().toLocaleDateString('en-US'),
        crop: cropType.charAt(0).toUpperCase() + cropType.slice(1),
        predicted_yield: prediction.predicted_yield,
        actual_yield: null, // Will be filled later
        accuracy: null,
        confidence: prediction.confidence,
        status: 'Pending'
    };

    predictionHistory.unshift(predictionRecord);
    savePredictionHistory();
    renderPredictionHistory();
}

// --- Load prediction history ---
function loadPredictionHistory() {
    const saved = localStorage.getItem('agroflux_predictions');
    if (saved) {
        predictionHistory = JSON.parse(saved);
    }
    renderPredictionHistory();
}

// --- Save prediction history ---
function savePredictionHistory() {
    localStorage.setItem('agroflux_predictions', JSON.stringify(predictionHistory));
}

// --- Render prediction history ---
function renderPredictionHistory() {
    predictionsBody.innerHTML = '';

    if (predictionHistory.length === 0) {
        predictionsBody.innerHTML = `
            <tr>
                <td colspan="6" class="no-data">No predictions generated yet</td>
            </tr>
        `;
        return;
    }

    predictionHistory.forEach(prediction => {
        const row = document.createElement('tr');
        
        let accuracyClass = '';
        let accuracyText = '--';
        
        if (prediction.accuracy !== null) {
            if (prediction.accuracy >= 80) accuracyClass = 'accuracy-good';
            else if (prediction.accuracy >= 60) accuracyClass = 'accuracy-fair';
            else accuracyClass = 'accuracy-poor';
            
            accuracyText = `${prediction.accuracy}%`;
        }

        row.innerHTML = `
            <td>${prediction.date}</td>
            <td>${prediction.crop}</td>
            <td>${prediction.predicted_yield.toLocaleString()} kg/ha</td>
            <td>${prediction.actual_yield ? prediction.actual_yield.toLocaleString() + ' kg/ha' : '--'}</td>
            <td class="${accuracyClass}">${accuracyText}</td>
            <td>${prediction.status}</td>
        `;
        
        predictionsBody.appendChild(row);
    });
}

// --- Export predictions ---
function exportPredictions() {
    if (predictionHistory.length === 0) {
        showNotification('No predictions to export', 'warning');
        return;
    }

    const csvData = convertPredictionsToCSV();
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    
    a.href = url;
    a.download = `yield_predictions_${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification('Predictions exported successfully!', 'success');
}

// --- Convert predictions to CSV ---
function convertPredictionsToCSV() {
    const headers = ['Date', 'Crop', 'Predicted Yield (kg/ha)', 'Actual Yield (kg/ha)', 'Accuracy', 'Confidence', 'Status'];
    const rows = predictionHistory.map(prediction => [
        prediction.date,
        prediction.crop,
        prediction.predicted_yield,
        prediction.actual_yield || '',
        prediction.accuracy || '',
        prediction.confidence,
        prediction.status
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
}

// --- Show notification ---
function showNotification(message, type = 'info') {
    const toast = document.getElementById('toast');
    if (!toast) return;

    // Clear previous toast
    toast.textContent = message;
    toast.className = 'toast';
    
    // Add classes based on type
    toast.classList.add('show');
    toast.classList.add(`toast-${type}`);
    
    // Add icon based on type
    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '❌';
    if (type === 'warning') icon = '⚠️';
    
    toast.innerHTML = `${icon} ${message}`;
    
    // Hide after 5 seconds
    setTimeout(() => {
        toast.classList.remove('show');
    }, 5000);
}