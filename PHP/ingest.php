<?php
require 'db.php';
header('Content-Type: application/json');

$API_KEY = 'TU_API_KEY_SECRETA'; // cámbiala
$auth = $_GET['key'] ?? ($_SERVER['HTTP_AUTHORIZATION'] ?? '');
if ($auth !== $API_KEY) {
  http_response_code(401);
  echo json_encode(["error"=>"No autorizado"]);
  exit;
}

$payload = json_decode(file_get_contents("php://input"), true) ?? [];
$t = isset($payload['temperatura']) ? floatval($payload['temperatura']) : null;
$h = isset($payload['humedad'])     ? floatval($payload['humedad'])     : null;
$l = isset($payload['luz'])         ? floatval($payload['luz'])         : null;

$stmt = $conn->prepare("INSERT INTO registros_historicos(valor_luz, valor_humedad, valor_temp) VALUES (?, ?, ?)");
$stmt->bind_param("ddd", $l, $h, $t);
$stmt->execute();
$id_registro = $conn->insert_id;

$now = date('Y-m-d H:i:s');
if (!is_null($t)) {
  $q = $conn->prepare("INSERT INTO temperatura(valor_temp, fecha_hora, id_registro) VALUES (?, ?, ?)");
  $q->bind_param("dsi", $t, $now, $id_registro);
  $q->execute();
}
if (!is_null($h)) {
  $q = $conn->prepare("INSERT INTO humedad(valor_humedad, fecha_hora, id_registro) VALUES (?, ?, ?)");
  $q->bind_param("dsi", $h, $now, $id_registro);
  $q->execute();
}
if (!is_null($l)) {
  $q = $conn->prepare("INSERT INTO luz(valor_luz, fecha_hora, id_registro) VALUES (?, ?, ?)");
  $q->bind_param("dsi", $l, $now, $id_registro);
  $q->execute();
}

echo json_encode(["success"=>true, "id_registro"=>$id_registro]);
