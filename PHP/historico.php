<?php
require 'db.php';
header('Content-Type: application/json');

$limit = isset($_GET['limit']) ? max(1, min(1000, intval($_GET['limit']))) : 200;

$hist = $conn->query("
  SELECT fecha_hora, valor_luz, valor_humedad, valor_temp
  FROM registros_historicos
  ORDER BY fecha_hora DESC
  LIMIT $limit
");

$out = [];
if ($hist) {
  while ($r = $hist->fetch_assoc()) {
    $out[] = [
      "fecha_hora"    => $r['fecha_hora'],
      "valor_luz"     => is_null($r['valor_luz']) ? null : (float)$r['valor_luz'],
      "valor_humedad" => is_null($r['valor_humedad']) ? null : (float)$r['valor_humedad'],
      "valor_temp"    => is_null($r['valor_temp']) ? null : (float)$r['valor_temp'],
    ];
  }
}
$out = array_reverse($out); // cronológico ascendente
echo json_encode(["rows" => $out]);
