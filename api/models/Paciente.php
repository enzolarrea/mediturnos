<?php
/**
 * Modelo Paciente
 */
require_once __DIR__ . '/../config/database.php';

class Paciente {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }

    /**
     * Crear nuevo paciente
     */
    public function create($data) {
        // Validar DNI único si se proporciona
        if (!empty($data['dni'])) {
            $sql = "SELECT id FROM pacientes WHERE dni = :dni";
            $stmt = $this->db->prepare($sql);
            $stmt->execute([':dni' => $data['dni']]);
            if ($stmt->fetch()) {
                throw new Exception('Ya existe un paciente con este DNI');
            }
        }

        // Validar email único si se proporciona
        if (!empty($data['email'])) {
            $sql = "SELECT id FROM pacientes WHERE email = :email";
            $stmt = $this->db->prepare($sql);
            $stmt->execute([':email' => $data['email']]);
            if ($stmt->fetch()) {
                throw new Exception('Ya existe un paciente con este correo electrónico');
            }
        }

        $sql = "INSERT INTO pacientes 
                (nombre, apellido, dni, telefono, email, fecha_nacimiento, 
                 direccion, activo, creado_por)
                VALUES (:nombre, :apellido, :dni, :telefono, :email, 
                        :fecha_nacimiento, :direccion, 1, :creado_por)";

        $params = [
            ':nombre' => $data['nombre'],
            ':apellido' => $data['apellido'],
            ':dni' => $data['dni'] ?? null,
            ':telefono' => $data['telefono'] ?? null,
            ':email' => $data['email'] ?? null,
            ':fecha_nacimiento' => $data['fechaNacimiento'] ?? null,
            ':direccion' => $data['direccion'] ?? null,
            ':creado_por' => $_SESSION['user_id'] ?? null
        ];

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);

        return $this->getById($this->db->lastInsertId());
    }

    /**
     * Obtener paciente por ID
     */
    public function getById($id) {
        $sql = "SELECT 
                    p.id, p.nombre, p.apellido, p.dni, p.telefono, p.email,
                    p.fecha_nacimiento, p.direccion, p.ultima_visita,
                    p.activo, p.fecha_creacion, p.fecha_actualizacion
                FROM pacientes p
                WHERE p.id = :id";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':id' => $id]);
        $paciente = $stmt->fetch();

        if ($paciente) {
            $paciente['fechaNacimiento'] = $paciente['fecha_nacimiento'];
            $paciente['ultimaVisita'] = $paciente['ultima_visita'];
            $paciente['fechaCreacion'] = $paciente['fecha_creacion'];
            $paciente['fechaActualizacion'] = $paciente['fecha_actualizacion'];
            unset($paciente['fecha_nacimiento'], $paciente['ultima_visita'],
                  $paciente['fecha_creacion'], $paciente['fecha_actualizacion']);
        }

        return $paciente ?: null;
    }

    /**
     * Obtener todos los pacientes con filtros
     */
    public function getAll($filters = []) {
        $sql = "SELECT 
                    p.id, p.nombre, p.apellido, p.dni, p.telefono, p.email,
                    p.fecha_nacimiento, p.direccion, p.ultima_visita,
                    p.activo, p.fecha_creacion, p.fecha_actualizacion
                FROM pacientes p
                WHERE 1=1";
        
        $params = [];

        if (isset($filters['activo'])) {
            // Convertir string a boolean si viene de GET
            $activo = $filters['activo'];
            if (is_string($activo)) {
                $activo = ($activo === 'true' || $activo === '1');
            }
            $sql .= " AND p.activo = :activo";
            $params[':activo'] = $activo ? 1 : 0;
        }

        if (isset($filters['search']) && !empty($filters['search'])) {
            $searchValue = '%' . trim($filters['search']) . '%';
            $sql .= " AND (p.nombre LIKE :search_nombre OR p.apellido LIKE :search_apellido 
                    OR p.dni LIKE :search_dni OR p.email LIKE :search_email)";
            $params[':search_nombre'] = $searchValue;
            $params[':search_apellido'] = $searchValue;
            $params[':search_dni'] = $searchValue;
            $params[':search_email'] = $searchValue;
        }

        $sql .= " ORDER BY p.nombre, p.apellido";

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        $pacientes = $stmt->fetchAll();

        // Formatear respuesta
        foreach ($pacientes as &$paciente) {
            $paciente['fechaNacimiento'] = $paciente['fecha_nacimiento'];
            $paciente['ultimaVisita'] = $paciente['ultima_visita'];
            $paciente['fechaCreacion'] = $paciente['fecha_creacion'];
            $paciente['fechaActualizacion'] = $paciente['fecha_actualizacion'];
            unset($paciente['fecha_nacimiento'], $paciente['ultima_visita'],
                  $paciente['fecha_creacion'], $paciente['fecha_actualizacion']);
        }

        return $pacientes;
    }

    /**
     * Actualizar paciente
     */
    public function update($id, $data) {
        $paciente = $this->getById($id);
        if (!$paciente) {
            throw new Exception('Paciente no encontrado');
        }

        // Validar DNI único si se cambia
        if (isset($data['dni']) && !empty($data['dni']) && $data['dni'] !== $paciente['dni']) {
            $sql = "SELECT id FROM pacientes WHERE dni = :dni AND id != :id";
            $stmt = $this->db->prepare($sql);
            $stmt->execute([':dni' => $data['dni'], ':id' => $id]);
            if ($stmt->fetch()) {
                throw new Exception('Ya existe un paciente con este DNI');
            }
        }

        // Validar email único si se cambia o se proporciona
        if (isset($data['email']) && !empty($data['email'])) {
            $emailActual = $paciente['email'] ?? null;
            // Si el email cambió o no había email antes
            if ($data['email'] !== $emailActual) {
                $sql = "SELECT id FROM pacientes WHERE email = :email AND id != :id";
                $stmt = $this->db->prepare($sql);
                $stmt->execute([':email' => $data['email'], ':id' => $id]);
                if ($stmt->fetch()) {
                    throw new Exception('Ya existe un paciente con este correo electrónico');
                }
            }
        }

        $sql = "UPDATE pacientes SET 
                nombre = COALESCE(:nombre, nombre),
                apellido = COALESCE(:apellido, apellido),
                dni = COALESCE(:dni, dni),
                telefono = COALESCE(:telefono, telefono),
                email = COALESCE(:email, email),
                fecha_nacimiento = COALESCE(:fecha_nacimiento, fecha_nacimiento),
                direccion = COALESCE(:direccion, direccion),
                ultima_visita = COALESCE(:ultima_visita, ultima_visita),
                activo = COALESCE(:activo, activo),
                actualizado_por = :actualizado_por
                WHERE id = :id";

        $params = [
            ':id' => $id,
            ':nombre' => $data['nombre'] ?? null,
            ':apellido' => $data['apellido'] ?? null,
            ':dni' => $data['dni'] ?? null,
            ':telefono' => $data['telefono'] ?? null,
            ':email' => $data['email'] ?? null,
            ':fecha_nacimiento' => $data['fechaNacimiento'] ?? null,
            ':direccion' => $data['direccion'] ?? null,
            ':ultima_visita' => $data['ultimaVisita'] ?? null,
            ':activo' => $data['activo'] ?? null,
            ':actualizado_por' => $_SESSION['user_id'] ?? null
        ];

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);

        // Obtener paciente actualizado
        $pacienteActualizado = $this->getById($id);
        
        // Sincronizar con la tabla usuarios si se actualizó nombre, apellido o email
        if ($pacienteActualizado && (isset($data['nombre']) || isset($data['apellido']) || isset($data['email']))) {
            // Buscar usuario asociado a este paciente
            $sqlUsuario = "SELECT id, email FROM usuarios WHERE paciente_id = :paciente_id";
            $stmtUsuario = $this->db->prepare($sqlUsuario);
            $stmtUsuario->execute([':paciente_id' => $id]);
            $usuario = $stmtUsuario->fetch();
            
            if ($usuario) {
                // Si se actualizó el email, validar que no esté duplicado en usuarios
                if (isset($data['email']) && !empty($data['email']) && $data['email'] !== $usuario['email']) {
                    $sqlCheckEmail = "SELECT id FROM usuarios WHERE email = :email AND id != :id";
                    $stmtCheckEmail = $this->db->prepare($sqlCheckEmail);
                    $stmtCheckEmail->execute([
                        ':email' => strtolower(trim($data['email'])),
                        ':id' => $usuario['id']
                    ]);
                    if ($stmtCheckEmail->fetch()) {
                        throw new Exception('Este correo electrónico ya está registrado en otro usuario');
                    }
                }
                
                // Actualizar nombre, apellido y email en la tabla usuarios
                $sqlUpdateUsuario = "UPDATE usuarios SET 
                                    nombre = COALESCE(:nombre, nombre),
                                    apellido = COALESCE(:apellido, apellido),
                                    email = COALESCE(:email, email)
                                    WHERE id = :id";
                $paramsUsuario = [
                    ':id' => $usuario['id'],
                    ':nombre' => $pacienteActualizado['nombre'] ?? null,
                    ':apellido' => $pacienteActualizado['apellido'] ?? null,
                    ':email' => isset($pacienteActualizado['email']) && !empty($pacienteActualizado['email']) 
                        ? strtolower(trim($pacienteActualizado['email'])) 
                        : null
                ];
                $stmtUpdateUsuario = $this->db->prepare($sqlUpdateUsuario);
                $stmtUpdateUsuario->execute($paramsUsuario);
            }
        }

        return $pacienteActualizado;
    }

    /**
     * Eliminar paciente (soft delete)
     */
    public function delete($id) {
        return $this->update($id, ['activo' => false]);
    }

    /**
     * Obtener historial de turnos del paciente
     */
    public function getHistorial($id) {
        require_once __DIR__ . '/Turno.php';
        $turnoModel = new Turno();
        return $turnoModel->getAll(['pacienteId' => $id]);
    }

    /**
     * Actualizar última visita
     */
    public function updateUltimaVisita($id) {
        $fecha = date('Y-m-d');
        return $this->update($id, ['ultimaVisita' => $fecha]);
    }
}

