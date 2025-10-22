<?php
include("conexion.php");

// Si se envió el formulario, actualiza
if (isset($_POST['id'])) {
    $id = $_POST['id'];
    $nombre = $_POST['nombre'];
    $apellido = $_POST['apellido'];
    $fecha = $_POST['fecha_nacimiento'];
    $dni = $_POST['dni'];
    $gmail = $_POST['gmail'];

    $sql = "UPDATE usuarios 
            SET nombre='$nombre', apellido='$apellido', fecha_nacimiento='$fecha', dni='$dni', gmail='$gmail'
            WHERE id=$id";

    if (mysqli_query($conexion, $sql)) {
        echo "✅ Usuario actualizado correctamente.";
    } else {
        echo "⚠️ Error al actualizar: " . mysqli_error($conexion);
    }

    header("Location: ver_usuarios.php");
    exit;
}

// Si se accede con un ID, muestra el formulario
if (isset($_GET['id'])) {
    $id = intval($_GET['id']);
    $resultado = mysqli_query($conexion, "SELECT * FROM usuarios WHERE id=$id");
    $usuario = mysqli_fetch_assoc($resultado);
?>
    <h2>Editar usuario</h2>
    <form method="POST" action="editar.php">
        <input type="hidden" name="id" value="<?php echo $usuario['id']; ?>">
        <input type="text" name="nombre" value="<?php echo $usuario['nombre']; ?>" required><br>
        <input type="text" name="apellido" value="<?php echo $usuario['apellido']; ?>" required><br>
        <input type="date" name="fecha_nacimiento" value="<?php echo $usuario['fecha_nacimiento']; ?>" required><br>
        <input type="text" name="dni" value="<?php echo $usuario['dni']; ?>" required><br>
        <input type="email" name="gmail" value="<?php echo $usuario['gmail']; ?>" required><br>
        <button type="submit">Guardar cambios</button>
    </form>
<?php
}
mysqli_close($conexion);
?>
