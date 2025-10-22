<?php
$host = "sql105.infinityfree.com";
$dbname = "if0_40019478_clinicaroman";
$username = "if0_40019478";
$password = "rafael77011"; // ejemplo: R4fael123 o la que uses para entrar a InfinityFree

$conexion = new mysqli($host, $username, $password, $dbname);

if ($conexion->connect_error) {
    die("❌ Error de conexión: " . $conexion->connect_error);
} else {
    echo "✅ Conectado correctamente a la base de datos: " . $dbname;
}
?>

