<?php
session_start();
require 'conexion.php';

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    echo "Método no permitido";
    exit;
}

$email = $_POST["email"] ?? "";
$password = $_POST["password"] ?? "";

if (empty($email) || empty($password)) {
    echo "Faltan datos";
    exit;
}

$sql = "SELECT * FROM usuarios WHERE email = ?";
$stmt = $conexion->prepare($sql);
$stmt->bind_param("s", $email);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    echo "Usuario no encontrado";
    exit;
}

$user = $result->fetch_assoc();

if ($user["password"] !== $password) {
    echo "Contraseña incorrecta";
    exit;
}

$_SESSION["usuario_id"] = $user["id"];
$_SESSION["usuario_email"] = $user["email"];
$_SESSION["usuario_nombre"] = $user["nombre"];

header("Location: panel.php");
exit;
?>
