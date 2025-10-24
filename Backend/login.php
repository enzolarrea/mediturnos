<?php
require 'conexion.php';
require 'jwt_utils.php';
header("Content-Type: application/json");

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data["email"]) || !isset($data["password"])) {
    echo json_encode(["error" => "Faltan datos"]);
    exit;
}

$email = $data["email"];
$password = $data["password"];

$sql = "SELECT * FROM usuarios WHERE email = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("s", $email);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    http_response_code(404);
    echo json_encode(["error" => "Usuario no encontrado"]);
    exit;
}

$user = $result->fetch_assoc();

if ($user["password"] !== $password) {
    http_response_code(401);
    echo json_encode(["error" => "Contraseña incorrecta"]);
    exit;
}

$token = crearToken($user);
echo json_encode(["token" => $token]);
?>
