<?php
include("conexion.php");

$nombre = $_POST['nombre'];
$apellido = $_POST['apellido'];
$fecha = $_POST['fecha_nacimiento'];
$dni = $_POST['dni'];
$gmail = $_POST['gmail'];
$password = password_hash($_POST['password'], PASSWORD_DEFAULT);

$stmt = $conexion->prepare("INSERT INTO usuarios (nombre, apellido, fecha_nacimiento, dni, gmail, password) VALUES (?, ?, ?, ?, ?, ?)");

if (!$stmt) {
    die("❌ Error al preparar la consulta: " . $conexion->error);
}

$stmt->bind_param("ssssss", $nombre, $apellido, $fecha, $dni, $gmail, $password);

if ($stmt->execute()) {
    echo "✅ Registro exitoso";
} else {
    echo "⚠️ Error al registrar: " . $stmt->error;
}

$stmt->close();
$conexion->close();
?>
