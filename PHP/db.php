<?php
header("Access-Control-Allow-Origin: http://127.0.0.1:5500");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { exit; }

$DB_HOST = '127.0.0.1';
$DB_USER = 'root';      // o el usuario que uses
$DB_PASS = 'Kirin20022002';          // tu password
$DB_NAME = 'sensores';
$DB_PORT = 3306;        // importante: el que ya está en uso

$conn = new mysqli($DB_HOST, $DB_USER, $DB_PASS, $DB_NAME, $DB_PORT);
if ($conn->connect_error) {
  http_response_code(500);
  header('Content-Type: application/json');
  echo json_encode(["error" => "Error de conexión BD: ".$conn->connect_error]);
  exit;
}
$conn->set_charset("utf8mb4");

