<?php
include 'db.php';
header('Content-Type: application/json');

$temp = $conn->query("SELECT valor_temp FROM temperatura ORDER BY fecha_hora DESC LIMIT 1")->fetch_assoc()['valor_temp'] ?? 0;
$hum = $conn->query("SELECT valor_humedad FROM humedad ORDER BY fecha_hora DESC LIMIT 1")->fetch_assoc()['valor_humedad'] ?? 0;
$luz = $conn->query("SELECT valor_luz FROM luz ORDER BY fecha_hora DESC LIMIT 1")->fetch_assoc()['valor_luz'] ?? 0;

echo json_encode([
  "temperatura" => $temp,
  "humedad" => $hum,
  "luz" => $luz
]);
?>
