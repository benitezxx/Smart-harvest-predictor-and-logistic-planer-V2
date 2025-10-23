<?php
require 'db.php';
header('Content-Type: application/json');

$raw = file_get_contents("php://input");
$data = json_decode($raw, true) ?? [];
$userId = $data['userId'] ?? '';
$password = $data['password'] ?? '';

if (!$userId || !$password) {
  echo json_encode(["success" => false, "message" => "Faltan datos"]);
  exit;
}

$sql = "SELECT id_usuario, user_id, nombre_completo, email, celular, password 
        FROM usuarios WHERE user_id = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("s", $userId);
$stmt->execute();
$res = $stmt->get_result();

if ($res && $res->num_rows === 1) {
  $u = $res->fetch_assoc();
  // Si AÚN no guardaste hashes, temporalmente usa: ($password === $u['password'])
  if (password_verify($password, $u['password'])) {
    echo json_encode([
      "success" => true,
      "user" => [
        "id_usuario" => (int)$u['id_usuario'],
        "user_id" => $u['user_id'],
        "nombre_completo" => $u['nombre_completo'],
        "email" => $u['email'],
        "celular" => $u['celular']
      ]
    ]);
  } else {
    echo json_encode(["success" => false, "message" => "Contraseña incorrecta"]);
  }
} else {
  echo json_encode(["success" => false, "message" => "Usuario no encontrado"]);
}
