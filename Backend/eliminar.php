<?php
include("conexion.php");

if (isset($_GET['id'])) {
    $id = intval($_GET['id']);
    $sql = "DELETE FROM usuarios WHERE id = $id";

    if (mysqli_query($conexion, $sql)) {
        echo "✅ Usuario eliminado correctamente.";
    } else {
        echo "⚠️ Error al eliminar: " . mysqli_error($conexion);
    }
}
mysqli_close($conexion);

// Redirigir de vuelta a la lista
header("Location: ver_usuarios.php");
exit;
?>
