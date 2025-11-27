<?php
/**
 * Modelo Medico
 */
require_once __DIR__ . '/../config/database.php';

class Medico {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }

    /**
     * Obtener todos los médicos con filtros
     */
    public function getAll($filters = []) {
        $sql = "SELECT 
                    m.id, m.nombre, m.matricula, m.email, m.telefono, 
                    m.horario, m.activo, m.fecha_creacion, m.fecha_actualizacion,
                    GROUP_CONCAT(e.nombre ORDER BY e.nombre SEPARATOR ', ') as especialidades
                FROM medicos m
                LEFT JOIN medico_especialidades me ON m.id = me.medico_id
                LEFT JOIN especialidades e ON me.especialidad_id = e.id
                WHERE 1=1";
        
        $params = [];

        if (isset($filters['activo'])) {
            $sql .= " AND m.activo = :activo";
            $params[':activo'] = $filters['activo'] ? 1 : 0;
        }

        if (isset($filters['especialidad']) && !empty($filters['especialidad'])) {
            $sql .= " AND e.nombre = :especialidad";
            $params[':especialidad'] = $filters['especialidad'];
        }

        if (isset($filters['search']) && !empty($filters['search'])) {
            $sql .= " AND (m.nombre LIKE :search OR m.matricula LIKE :search OR e.nombre LIKE :search)";
            $params[':search'] = '%' . $filters['search'] . '%';
        }

        $sql .= " GROUP BY m.id ORDER BY m.nombre";

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        $medicos = $stmt->fetchAll();

        // Formatear respuesta y obtener disponibilidad
        foreach ($medicos as &$medico) {
            $medico['fechaCreacion'] = $medico['fecha_creacion'];
            $medico['fechaActualizacion'] = $medico['fecha_actualizacion'];
            $medico['disponibilidad'] = $this->getDisponibilidadArray($medico['id']);
            unset($medico['fecha_creacion'], $medico['fecha_actualizacion']);
        }

        return $medicos;
    }

    /**
     * Obtener médico por ID
     */
    public function getById($id) {
        $sql = "SELECT 
                    m.id, m.nombre, m.matricula, m.email, m.telefono,
                    m.horario, m.activo, m.fecha_creacion, m.fecha_actualizacion,
                    GROUP_CONCAT(e.nombre ORDER BY e.nombre SEPARATOR ', ') as especialidades
                FROM medicos m
                LEFT JOIN medico_especialidades me ON m.id = me.medico_id
                LEFT JOIN especialidades e ON me.especialidad_id = e.id
                WHERE m.id = :id
                GROUP BY m.id";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':id' => $id]);
        $medico = $stmt->fetch();

        if ($medico) {
            $medico['fechaCreacion'] = $medico['fecha_creacion'];
            $medico['fechaActualizacion'] = $medico['fecha_actualizacion'];
            $medico['disponibilidad'] = $this->getDisponibilidadArray($id);
            unset($medico['fecha_creacion'], $medico['fecha_actualizacion']);
        }

        return $medico ?: null;
    }

    /**
     * Crear nuevo médico
     */
    public function create($data) {
        // Validar matrícula única
        $sql = "SELECT id FROM medicos WHERE matricula = :matricula";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':matricula' => $data['matricula']]);
        if ($stmt->fetch()) {
            throw new Exception('Ya existe un médico con esta matrícula');
        }

        $this->db->beginTransaction();
        try {
            // Insertar médico
            $sql = "INSERT INTO medicos (nombre, matricula, email, telefono, horario, activo, creado_por)
                    VALUES (:nombre, :matricula, :email, :telefono, :horario, 1, :creado_por)";
            
            $params = [
                ':nombre' => $data['nombre'],
                ':matricula' => $data['matricula'],
                ':email' => $data['email'] ?? null,
                ':telefono' => $data['telefono'] ?? null,
                ':horario' => $data['horario'] ?? null,
                ':creado_por' => $_SESSION['user_id'] ?? null
            ];

            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);
            $medicoId = $this->db->lastInsertId();

            // Insertar especialidades
            if (isset($data['especialidades']) && is_array($data['especialidades'])) {
                $this->setEspecialidades($medicoId, $data['especialidades']);
            } elseif (isset($data['especialidad'])) {
                // Compatibilidad: si viene como string, buscar o crear
                $especialidadId = $this->getOrCreateEspecialidad($data['especialidad']);
                $this->setEspecialidades($medicoId, [$especialidadId]);
            }

            // Insertar disponibilidad
            if (isset($data['disponibilidad']) && is_array($data['disponibilidad'])) {
                $this->setDisponibilidad($medicoId, $data['disponibilidad']);
            }

            $this->db->commit();
            return $this->getById($medicoId);
        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    /**
     * Actualizar médico
     */
    public function update($id, $data) {
        $medico = $this->getById($id);
        if (!$medico) {
            throw new Exception('Médico no encontrado');
        }

        // Validar matrícula única si se cambia
        if (isset($data['matricula']) && $data['matricula'] !== $medico['matricula']) {
            $sql = "SELECT id FROM medicos WHERE matricula = :matricula AND id != :id";
            $stmt = $this->db->prepare($sql);
            $stmt->execute([':matricula' => $data['matricula'], ':id' => $id]);
            if ($stmt->fetch()) {
                throw new Exception('Ya existe un médico con esta matrícula');
            }
        }

        $this->db->beginTransaction();
        try {
            // Actualizar médico
            $sql = "UPDATE medicos SET 
                    nombre = COALESCE(:nombre, nombre),
                    matricula = COALESCE(:matricula, matricula),
                    email = COALESCE(:email, email),
                    telefono = COALESCE(:telefono, telefono),
                    horario = COALESCE(:horario, horario),
                    activo = COALESCE(:activo, activo),
                    actualizado_por = :actualizado_por
                    WHERE id = :id";

            $params = [
                ':id' => $id,
                ':nombre' => $data['nombre'] ?? null,
                ':matricula' => $data['matricula'] ?? null,
                ':email' => $data['email'] ?? null,
                ':telefono' => $data['telefono'] ?? null,
                ':horario' => $data['horario'] ?? null,
                ':activo' => $data['activo'] ?? null,
                ':actualizado_por' => $_SESSION['user_id'] ?? null
            ];

            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);

            // Actualizar especialidades si se proporcionan
            if (isset($data['especialidades'])) {
                $this->setEspecialidades($id, $data['especialidades']);
            }

            // Actualizar disponibilidad si se proporciona
            if (isset($data['disponibilidad'])) {
                $this->setDisponibilidad($id, $data['disponibilidad']);
            }

            $this->db->commit();
            return $this->getById($id);
        } catch (Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    /**
     * Eliminar médico (soft delete)
     */
    public function delete($id) {
        return $this->update($id, ['activo' => false]);
    }

    /**
     * Obtener disponibilidad como array (formato del frontend)
     */
    private function getDisponibilidadArray($medicoId) {
        $sql = "SELECT dia_semana, hora_inicio, hora_fin 
                FROM medico_disponibilidad 
                WHERE medico_id = :medico_id AND activo = 1";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':medico_id' => $medicoId]);
        $disponibilidad = $stmt->fetchAll();

        $result = [];
        foreach ($disponibilidad as $disp) {
            $result[$disp['dia_semana']] = [
                'inicio' => $disp['hora_inicio'],
                'fin' => $disp['hora_fin']
            ];
        }

        return $result;
    }

    /**
     * Establecer especialidades del médico
     */
    private function setEspecialidades($medicoId, $especialidades) {
        // Eliminar especialidades actuales
        $sql = "DELETE FROM medico_especialidades WHERE medico_id = :medico_id";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':medico_id' => $medicoId]);

        // Insertar nuevas especialidades
        if (!empty($especialidades)) {
            $sql = "INSERT INTO medico_especialidades (medico_id, especialidad_id) VALUES ";
            $values = [];
            $params = [];
            
            foreach ($especialidades as $index => $especialidadId) {
                $key = ":especialidad_id_$index";
                $values[] = "(:medico_id, $key)";
                $params[$key] = is_numeric($especialidadId) ? $especialidadId : $this->getOrCreateEspecialidad($especialidadId);
            }
            
            $sql .= implode(', ', $values);
            $params[':medico_id'] = $medicoId;
            
            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);
        }
    }

    /**
     * Establecer disponibilidad del médico
     */
    private function setDisponibilidad($medicoId, $disponibilidad) {
        // Eliminar disponibilidad actual
        $sql = "DELETE FROM medico_disponibilidad WHERE medico_id = :medico_id";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':medico_id' => $medicoId]);

        // Insertar nueva disponibilidad
        $sql = "INSERT INTO medico_disponibilidad (medico_id, dia_semana, hora_inicio, hora_fin, activo) 
                VALUES (:medico_id, :dia_semana, :hora_inicio, :hora_fin, 1)";
        $stmt = $this->db->prepare($sql);

        foreach ($disponibilidad as $dia => $horarios) {
            if (isset($horarios['inicio']) && isset($horarios['fin'])) {
                $stmt->execute([
                    ':medico_id' => $medicoId,
                    ':dia_semana' => $dia,
                    ':hora_inicio' => $horarios['inicio'],
                    ':hora_fin' => $horarios['fin']
                ]);
            }
        }
    }

    /**
     * Obtener o crear especialidad por nombre
     */
    private function getOrCreateEspecialidad($nombre) {
        $sql = "SELECT id FROM especialidades WHERE nombre = :nombre";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':nombre' => $nombre]);
        $especialidad = $stmt->fetch();

        if ($especialidad) {
            return $especialidad['id'];
        }

        // Crear nueva especialidad
        $sql = "INSERT INTO especialidades (nombre, activo) VALUES (:nombre, 1)";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':nombre' => $nombre]);
        return $this->db->lastInsertId();
    }

    /**
     * Obtener disponibilidad de un médico en una fecha
     */
    public function getDisponibilidad($id, $fecha) {
        $medico = $this->getById($id);
        if (!$medico) {
            return ['disponible' => false];
        }

        // Obtener turnos activos del día
        require_once __DIR__ . '/Turno.php';
        $turnoModel = new Turno();
        $turnos = $turnoModel->getAll([
            'medicoId' => $id,
            'fecha' => $fecha
        ]);

        $turnosActivos = array_filter($turnos, function($t) {
            return !in_array($t['estadoCodigo'], ['cancelado', 'completado']);
        });

        return [
            'disponible' => count($turnosActivos) < 20,
            'turnosOcupados' => count($turnosActivos),
            'turnos' => array_values($turnosActivos)
        ];
    }

    /**
     * Obtener horarios disponibles de un médico en una fecha
     */
    public function getHorariosDisponibles($id, $fecha) {
        $disponibilidad = $this->getDisponibilidad($id, $fecha);
        $medico = $this->getById($id);
        
        if (!$medico) {
            return [];
        }

        // Obtener horarios ocupados
        $horariosOcupados = array_map(function($t) {
            return $t['hora'];
        }, $disponibilidad['turnos']);

        // Horarios del sistema
        $horarios = [
            '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
            '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
            '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
            '17:00', '17:30', '18:00'
        ];

        return array_values(array_filter($horarios, function($hora) use ($horariosOcupados) {
            return !in_array($hora, $horariosOcupados);
        }));
    }

    /**
     * Obtener lista de especialidades
     */
    public function getEspecialidades() {
        $sql = "SELECT DISTINCT e.nombre 
                FROM especialidades e
                INNER JOIN medico_especialidades me ON e.id = me.especialidad_id
                INNER JOIN medicos m ON me.medico_id = m.id
                WHERE m.activo = 1 AND e.activo = 1
                ORDER BY e.nombre";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute();
        $result = $stmt->fetchAll(PDO::FETCH_COLUMN);
        
        return $result;
    }
}

