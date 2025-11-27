<?php
/**
 * Modelo Usuario
 */
require_once __DIR__ . '/../config/database.php';

class Usuario {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }

    /**
     * Obtener usuario por email (para login)
     */
    public function getByEmail($email) {
        $sql = "SELECT * FROM usuarios WHERE email = :email";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':email' => strtolower(trim($email))]);
        return $stmt->fetch();
    }

    /**
     * Verificar credenciales (login)
     */
    public function verifyCredentials($email, $password) {
        $usuario = $this->getByEmail($email);
        
        if (!$usuario || $usuario['password'] !== $password || !$usuario['activo']) {
            return null;
        }

        // Remover password antes de retornar
        unset($usuario['password']);
        return $usuario;
    }

    /**
     * Crear nuevo usuario
     */
    public function create($data) {
        // Validar email único
        if ($this->getByEmail($data['email'])) {
            throw new Exception('Este email ya está registrado');
        }

        // Validar contraseña
        if (empty($data['password']) || strlen($data['password']) < 8) {
            throw new Exception('La contraseña debe tener al menos 8 caracteres');
        }

        $sql = "INSERT INTO usuarios 
                (nombre, apellido, email, password, rol, medico_id, paciente_id, activo, creado_por)
                VALUES (:nombre, :apellido, :email, :password, :rol, :medico_id, :paciente_id, 1, :creado_por)";

        $params = [
            ':nombre' => $data['nombre'],
            ':apellido' => $data['apellido'],
            ':email' => strtolower(trim($data['email'])),
            ':password' => $data['password'], // En producción, usar password_hash()
            ':rol' => $data['rol'] ?? 'paciente',
            ':medico_id' => $data['medicoId'] ?? null,
            ':paciente_id' => $data['pacienteId'] ?? null,
            ':creado_por' => $_SESSION['user_id'] ?? null
        ];

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);

        return $this->getById($this->db->lastInsertId());
    }

    /**
     * Obtener usuario por ID
     */
    public function getById($id) {
        $sql = "SELECT 
                    u.id, u.nombre, u.apellido, u.email, u.rol,
                    u.medico_id, u.paciente_id, u.activo,
                    u.fecha_creacion, u.fecha_actualizacion
                FROM usuarios u
                WHERE u.id = :id";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':id' => $id]);
        $usuario = $stmt->fetch();

        if ($usuario) {
            $usuario['medicoId'] = $usuario['medico_id'];
            $usuario['pacienteId'] = $usuario['paciente_id'];
            $usuario['fechaCreacion'] = $usuario['fecha_creacion'];
            $usuario['fechaActualizacion'] = $usuario['fecha_actualizacion'];
            unset($usuario['medico_id'], $usuario['paciente_id'],
                  $usuario['fecha_creacion'], $usuario['fecha_actualizacion']);
        }

        return $usuario ?: null;
    }

    /**
     * Obtener todos los usuarios con filtros
     */
    public function getAll($filters = []) {
        $sql = "SELECT 
                    u.id, u.nombre, u.apellido, u.email, u.rol, 
                    u.medico_id, u.paciente_id, u.activo,
                    u.fecha_creacion, u.fecha_actualizacion
                FROM usuarios u
                WHERE 1=1";
        
        $params = [];

        if (isset($filters['rol'])) {
            $sql .= " AND u.rol = :rol";
            $params[':rol'] = $filters['rol'];
        }

        if (isset($filters['activo'])) {
            $sql .= " AND u.activo = :activo";
            $params[':activo'] = $filters['activo'] ? 1 : 0;
        }

        if (isset($filters['search']) && !empty($filters['search'])) {
            $sql .= " AND (u.nombre LIKE :search OR u.apellido LIKE :search OR u.email LIKE :search)";
            $params[':search'] = '%' . $filters['search'] . '%';
        }

        $sql .= " ORDER BY u.nombre, u.apellido";

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        $usuarios = $stmt->fetchAll();

        // Formatear respuesta
        foreach ($usuarios as &$usuario) {
            $usuario['medicoId'] = $usuario['medico_id'];
            $usuario['pacienteId'] = $usuario['paciente_id'];
            $usuario['fechaCreacion'] = $usuario['fecha_creacion'];
            $usuario['fechaActualizacion'] = $usuario['fecha_actualizacion'];
            unset($usuario['medico_id'], $usuario['paciente_id'], 
                  $usuario['fecha_creacion'], $usuario['fecha_actualizacion']);
        }

        return $usuarios;
    }

    /**
     * Actualizar usuario
     */
    public function update($id, $data) {
        $usuario = $this->getById($id);
        if (!$usuario) {
            throw new Exception('Usuario no encontrado');
        }

        // Validar email único si se cambia
        if (isset($data['email']) && $data['email'] !== $usuario['email']) {
            if ($this->getByEmail($data['email'])) {
                throw new Exception('Este email ya está registrado');
            }
        }

        // Validar contraseña si se actualiza
        if (isset($data['password'])) {
            if (strlen($data['password']) < 8) {
                throw new Exception('La contraseña debe tener al menos 8 caracteres');
            }
        }

        $sql = "UPDATE usuarios SET 
                nombre = COALESCE(:nombre, nombre),
                apellido = COALESCE(:apellido, apellido),
                email = COALESCE(:email, email),
                password = COALESCE(:password, password),
                rol = COALESCE(:rol, rol),
                medico_id = COALESCE(:medico_id, medico_id),
                paciente_id = COALESCE(:paciente_id, paciente_id),
                activo = COALESCE(:activo, activo),
                actualizado_por = :actualizado_por
                WHERE id = :id";

        $params = [
            ':id' => $id,
            ':nombre' => $data['nombre'] ?? null,
            ':apellido' => $data['apellido'] ?? null,
            ':email' => isset($data['email']) ? strtolower(trim($data['email'])) : null,
            ':password' => $data['password'] ?? null,
            ':rol' => $data['rol'] ?? null,
            ':medico_id' => $data['medicoId'] ?? null,
            ':paciente_id' => $data['pacienteId'] ?? null,
            ':activo' => $data['activo'] ?? null,
            ':actualizado_por' => $_SESSION['user_id'] ?? null
        ];

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);

        return $this->getById($id);
    }

    /**
     * Eliminar usuario (soft delete)
     */
    public function delete($id) {
        $usuario = $this->getById($id);
        if (!$usuario) {
            throw new Exception('Usuario no encontrado');
        }

        // No permitir eliminar el último admin
        if ($usuario['rol'] === 'administrador') {
            $sql = "SELECT COUNT(*) as count FROM usuarios WHERE rol = 'administrador' AND activo = 1";
            $stmt = $this->db->prepare($sql);
            $stmt->execute();
            $result = $stmt->fetch();
            
            if ($result['count'] <= 1) {
                throw new Exception('No se puede eliminar el último administrador');
            }
        }

        return $this->update($id, ['activo' => false]);
    }

    /**
     * Cambiar contraseña
     */
    public function changePassword($id, $oldPassword, $newPassword) {
        $usuario = $this->getByEmail($this->getById($id)['email']);
        
        if (!$usuario) {
            throw new Exception('Usuario no encontrado');
        }

        if ($usuario['password'] !== $oldPassword) {
            throw new Exception('Contraseña actual incorrecta');
        }

        if (strlen($newPassword) < 8) {
            throw new Exception('La nueva contraseña debe tener al menos 8 caracteres');
        }

        return $this->update($id, ['password' => $newPassword]);
    }
}

