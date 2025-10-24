<?php
require 'db.php';
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: http://127.0.0.1:5500");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit;
}

// Handle training request
if (isset($_GET['action']) && $_GET['action'] === 'train') {
    trainModel();
    exit;
}

// Handle health check
if (isset($_GET['action']) && $_GET['action'] === 'health') {
    checkModelHealth();
    exit;
}

// Handle prediction request
$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid input data']);
    exit;
}

// Extract parameters
$crop_type = $input['crop_type'] ?? 'tomato';
$growth_stage = $input['growth_stage'] ?? 'vegetative';
$days_since_planting = intval($input['days_since_planting'] ?? 45);
$location_zone = $input['location_zone'] ?? 'lot-a';

// Get current sensor values or use defaults
$current_temp = getCurrentSensorValue('temperatura') ?? 24.5;
$current_humidity = getCurrentSensorValue('humedad') ?? 65.0;
$current_light = getCurrentSensorValue('luz') ?? 750.0;

try {
    // Prepare data for Python model
    $prediction_data = [
        'crop_type' => $crop_type,
        'growth_stage' => $growth_stage,
        'days_planting' => $days_since_planting,
        'location' => $location_zone,
        'temperature' => floatval($current_temp),
        'humidity' => floatval($current_humidity),
        'light' => floatval($current_light)
    ];

    // Call Python ML model
    $prediction = callPythonMLModel($prediction_data);
    
    if (isset($prediction['error'])) {
        throw new Exception($prediction['error']);
    }

    // Log the prediction
    logMLPrediction($prediction_data, $prediction);
    
    echo json_encode($prediction);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Prediction failed: ' . $e->getMessage()]);
}

function getCurrentSensorValue($sensorType) {
    global $conn;
    
    $tables = [
        'temperatura' => 'temperatura',
        'humedad' => 'humedad', 
        'luz' => 'luz'
    ];
    
    $columns = [
        'temperatura' => 'valor_temp',
        'humedad' => 'valor_humedad',
        'luz' => 'valor_luz'
    ];
    
    if (!isset($tables[$sensorType])) return null;
    
    $table = $tables[$sensorType];
    $column = $columns[$sensorType];
    
    $query = "SELECT $column FROM $table ORDER BY fecha_hora DESC LIMIT 1";
    $result = $conn->query($query);
    
    if ($result && $result->num_rows > 0) {
        $row = $result->fetch_assoc();
        return floatval($row[$column]);
    }
    
    return null;
}

function callPythonMLModel($data) {
    $python_script = __DIR__ . '/ml_predictor.py';
    $json_data = escapeshellarg(json_encode($data));
    
    // Verify script exists
    if (!file_exists($python_script)) {
        return ['error' => 'ML script not found at: ' . $python_script];
    }
    
    // Execute Python script
    $command = "python3 " . escapeshellarg($python_script) . " predict " . $json_data . " 2>&1";
    $output = shell_exec($command);
    
    if ($output === null) {
        return ['error' => 'Failed to execute Python script'];
    }
    
    $result = json_decode(trim($output), true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        return ['error' => 'Invalid JSON response from ML model: ' . $output];
    }
    
    return $result;
}

function logMLPrediction($input, $prediction) {
    global $conn;
    
    // Create ML prediction logs table if not exists
    $create_table = "
        CREATE TABLE IF NOT EXISTS ml_prediction_logs (
            id_prediction INT AUTO_INCREMENT PRIMARY KEY,
            crop_type VARCHAR(50) NOT NULL,
            growth_stage VARCHAR(50) NOT NULL,
            days_planting INT NOT NULL,
            location VARCHAR(50) NOT NULL,
            temperature DECIMAL(5,2) NOT NULL,
            humidity DECIMAL(5,2) NOT NULL,
            light DECIMAL(8,2) NOT NULL,
            predicted_yield INT NOT NULL,
            confidence DECIMAL(5,2) NOT NULL,
            model_version VARCHAR(20) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ";
    
    $conn->query($create_table);
    
    $stmt = $conn->prepare("
        INSERT INTO ml_prediction_logs 
        (crop_type, growth_stage, days_planting, location, temperature, humidity, light, 
         predicted_yield, confidence, model_version) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    
    $stmt->bind_param(
        'ssisdddiss',
        $input['crop_type'],
        $input['growth_stage'],
        $input['days_planting'],
        $input['location'],
        $input['temperature'],
        $input['humidity'],
        $input['light'],
        $prediction['predicted_yield'],
        $prediction['confidence'],
        $prediction['model_version']
    );
    
    $stmt->execute();
}

function trainModel() {
    header('Content-Type: application/json');
    
    $python_script = __DIR__ . '/ml_predictor.py';
    
    if (!file_exists($python_script)) {
        echo json_encode(['error' => 'ML script not found at: ' . $python_script]);
        return;
    }
    
    $command = "python3 " . escapeshellarg($python_script) . " train 2>&1";
    $output = shell_exec($command);
    
    if ($output === null) {
        echo json_encode(['error' => 'Failed to execute training command']);
    } else {
        $result = json_decode(trim($output), true);
        if ($result === null) {
            echo json_encode(['error' => 'Invalid JSON response', 'output' => $output]);
        } else {
            echo json_encode($result);
        }
    }
}

function checkModelHealth() {
    header('Content-Type: application/json');
    
    $python_script = __DIR__ . '/ml_predictor.php';
    
    if (!file_exists($python_script)) {
        echo json_encode(['status' => 'error', 'message' => 'ML script not found']);
        return;
    }
    
    $command = "python3 " . escapeshellarg($python_script) . " health 2>&1";
    $output = shell_exec($command);
    
    if ($output === null) {
        echo json_encode(['status' => 'error', 'message' => 'Script execution failed']);
    } else {
        $result = json_decode(trim($output), true);
        if ($result === null) {
            echo json_encode(['status' => 'unknown', 'output' => $output]);
        } else {
            echo json_encode($result);
        }
    }
}
?>