<?php
/**
 * Modelo Especialidad
 */
require_once __DIR__ . '/../config/database.php';

class Especialidad {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }

    /**
     * Obtener todas las especialidades
     */
    public function getAll($activo = true) {
        $sql = "SELECT id, nombre, descripcion, activo, fecha_creacion
                FROM especialidades
                WHERE 1=1";
        
        $params = [];
        
        if ($activo !== null) {
            $sql .= " AND activo = :activo";
            $params[':activo'] = $activo ? 1 : 0;
        }

        $sql .= " ORDER BY nombre";

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        $especialidades = $stmt->fetchAll();

        // Formatear respuesta
        foreach ($especialidades as &$esp) {
            $esp['fechaCreacion'] = $esp['fecha_creacion'];
            unset($esp['fecha_creacion']);
        }

        return $especialidades;
    }

    /**
     * Obtener especialidad por ID
     */
    public function getById($id) {
        $sql = "SELECT id, nombre, descripcion, activo, fecha_creacion
                FROM especialidades
                WHERE id = :id";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':id' => $id]);
        $especialidad = $stmt->fetch();

        if ($especialidad) {
            $especialidad['fechaCreacion'] = $especialidad['fecha_creacion'];
            unset($especialidad['fecha_creacion']);
        }

        return $especialidad ?: null;
    }

    /**
     * Crear especialidad
     */
    public function create($data) {
        $sql = "INSERT INTO especialidades (nombre, descripcion, activo)
                VALUES (:nombre, :descripcion, 1)";

        $params = [
            ':nombre' => $data['nombre'],
            ':descripcion' => $data['descripcion'] ?? null
        ];

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);

        return $this->getById($this->db->lastInsertId());
    }
}

