<?php
header('Content-Type: application/json; charset=utf-8');

// Mensaje de prueba para saber que la API está activa
echo json_encode([
    "ok" => true,
    "message" => "API funcionando correctamente"
]);
?>
