<?php
require 'conexion.php';
require 'jwt_utils.php';
header("Content-Type: application/json");

// 1️⃣ Verificar encabezado Authorization
$headers = getallheaders();
if (!isset($headers["Authorization"])) {
    http_response_code(401);
    echo json_encode(["error" => "Token no proporcionado"]);
    exit;
}

list($type, $token) = explode(" ", $headers["Authorization"], 2);
if (strcasecmp($type, "Bearer") != 0) {
    http_response_code(400);
    echo json_encode(["error" => "Formato de token inválido"]);
    exit;
}

$decoded = verificarToken($token);
if (!$decoded) {
    http_response_code(403);
    echo json_encode(["error" => "Token inválido o expirado"]);
    exit;
}

// 2️⃣ Si el token es válido → obtener los usuarios
$resultado = $conn->query("SELECT id, nombre, apellido, fecha_nacimiento, dni, gmail FROM usuarios");

$usuarios = [];
while ($fila = $resultado->fetch_assoc()) {
    $usuarios[] = $fila;
}

echo json_encode(["usuarios" => $usuarios]);

$conn->close();
?>
