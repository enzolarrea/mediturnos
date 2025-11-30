<?php
header('Content-Type: application/json; charset=utf-8');
require_once("conexion.php");

// Consulta SQL
$sql = "SELECT id, nombre, rol, email FROM usuarios";
$resultado = $conexion->query($sql);

$usuarios = [];

if ($resultado->num_rows > 0) {
    while ($fila = $resultado->fetch_assoc()) {
        $usuarios[] = $fila;
    }
}

// Cerrar conexión
$conexion->close();

// Devolver datos en formato JSON
echo json_encode($usuarios, JSON_UNESCAPED_UNICODE);
?>
