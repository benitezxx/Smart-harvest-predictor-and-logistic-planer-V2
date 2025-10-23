<?php
require 'db.php';
header('Content-Type: application/json');

$lastTemp = $conn->query("SELECT valor_temp AS v FROM temperatura ORDER BY fecha_hora DESC LIMIT 1");
$lastHum  = $conn->query("SELECT valor_humedad AS v FROM humedad ORDER BY fecha_hora DESC LIMIT 1");
$lastLuz  = $conn->query("SELECT valor_luz AS v FROM luz ORDER BY fecha_hora DESC LIMIT 1");

echo json_encode([
  "temperatura" => ($lastTemp && $lastTemp->num_rows)? (float)$lastTemp->fetch_assoc()['v'] : null,
  "humedad"     => ($lastHum  && $lastHum->num_rows )? (float)$lastHum->fetch_assoc()['v']  : null,
  "luz"         => ($lastLuz  && $lastLuz->num_rows )? (float)$lastLuz->fetch_assoc()['v']  : null
]);
