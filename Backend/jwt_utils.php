<?php
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

require_once __DIR__ . '/vendor/autoload.php'; // si usás Composer

$JWT_SECRET = "claveSuperSecreta123";

function crearToken($usuario) {
    global $JWT_SECRET;
    $payload = [
        "id" => $usuario["id"],
        "email" => $usuario["email"],
        "exp" => time() + 3600 // expira en 1 hora
    ];
    return JWT::encode($payload, $JWT_SECRET, 'HS256');
}

function verificarToken($token) {
    global $JWT_SECRET;
    try {
        $decoded = JWT::decode($token, new Key($JWT_SECRET, 'HS256'));
        return (array)$decoded;
    } catch (Exception $e) {
        return false;
    }
}
?>
