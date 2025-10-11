<?php
include("conexion.php");

$resultado = mysqli_query($conexion, "SELECT * FROM usuarios");

if (!$resultado) {
    die("❌ Error en la consulta: " . mysqli_error($conexion));
}

echo "<h2>Lista de usuarios registrados</h2>";
echo "<table border='1' cellpadding='10' cellspacing='0'>";
echo "<tr>
        <th>ID</th>
        <th>Nombre</th>
        <th>Apellido</th>
        <th>Fecha de nacimiento</th>
        <th>DNI</th>
        <th>Gmail</th>
        <th>Acciones</th>
      </tr>";

while ($fila = mysqli_fetch_assoc($resultado)) {
    echo "<tr>";
    echo "<td>" . $fila['id'] . "</td>";
    echo "<td>" . $fila['nombre'] . "</td>";
    echo "<td>" . $fila['apellido'] . "</td>";
    echo "<td>" . $fila['fecha_nacimiento'] . "</td>";
    echo "<td>" . $fila['dni'] . "</td>";
    echo "<td>" . $fila['gmail'] . "</td>";
    echo "<td>
            <a href='editar.php?id=" . $fila['id'] . "' style='padding:5px 10px; background:#4CAF50; color:white; text-decoration:none; border-radius:5px;'>Editar</a>
            <a href='eliminar.php?id=" . $fila['id'] . "' style='padding:5px 10px; background:#E74C3C; color:white; text-decoration:none; border-radius:5px;' onclick='return confirm(\"¿Seguro que querés eliminar este usuario?\")'>Eliminar</a>
          </td>";
    echo "</tr>";
}

echo "</table>";

mysqli_close($conexion);
?>
