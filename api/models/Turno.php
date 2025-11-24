<?php
/**
 * Modelo Turno
 */
require_once __DIR__ . '/../config/database.php';

class Turno {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }

    /**
     * Obtener todos los turnos con filtros
     */
    public function getAll($filters = []) {
        $sql = "SELECT 
                    t.id, t.paciente_id, t.medico_id, t.fecha, t.hora,
                    t.motivo, t.notas, t.fecha_creacion, t.fecha_actualizacion,
                    te.id as estado_id, te.codigo as estado_codigo, te.nombre as estado_nombre,
                    p.nombre as paciente_nombre, p.apellido as paciente_apellido,
                    m.nombre as medico_nombre
                FROM turnos t
                INNER JOIN turno_estados te ON t.estado_id = te.id
                INNER JOIN pacientes p ON t.paciente_id = p.id
                INNER JOIN medicos m ON t.medico_id = m.id
                WHERE 1=1";
        
        $params = [];
        $currentUser = getCurrentUser();

        // Filtros
        if (isset($filters['fecha'])) {
            $sql .= " AND t.fecha = :fecha";
            $params[':fecha'] = $filters['fecha'];
        }

        if (isset($filters['medicoId'])) {
            $sql .= " AND t.medico_id = :medico_id";
            $params[':medico_id'] = $filters['medicoId'];
        }

        if (isset($filters['pacienteId'])) {
            $sql .= " AND t.paciente_id = :paciente_id";
            $params[':paciente_id'] = $filters['pacienteId'];
        }

        if (isset($filters['estado'])) {
            $sql .= " AND te.codigo = :estado";
            $params[':estado'] = $filters['estado'];
        }

        if (isset($filters['desde'])) {
            $sql .= " AND t.fecha >= :desde";
            $params[':desde'] = $filters['desde'];
        }

        if (isset($filters['hasta'])) {
            $sql .= " AND t.fecha <= :hasta";
            $params[':hasta'] = $filters['hasta'];
        }

        if (isset($filters['id'])) {
            $sql .= " AND t.id = :id";
            $params[':id'] = $filters['id'];
        }

        // Filtro por rol del usuario actual
        if ($currentUser) {
            if ($currentUser['rol'] === 'medico' && $currentUser['medicoId']) {
                $sql .= " AND t.medico_id = :current_medico_id";
                $params[':current_medico_id'] = $currentUser['medicoId'];
            } elseif ($currentUser['rol'] === 'paciente' && $currentUser['pacienteId']) {
                $sql .= " AND t.paciente_id = :current_paciente_id";
                $params[':current_paciente_id'] = $currentUser['pacienteId'];
            }
        }

        $sql .= " ORDER BY t.fecha, t.hora";

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        $turnos = $stmt->fetchAll();

        // Formatear respuesta
        foreach ($turnos as &$turno) {
            $turno['pacienteId'] = $turno['paciente_id'];
            $turno['medicoId'] = $turno['medico_id'];
            $turno['estado'] = $turno['estado_codigo'];
            $turno['estadoCodigo'] = $turno['estado_codigo'];
            $turno['estadoNombre'] = $turno['estado_nombre'];
            $turno['fechaCreacion'] = $turno['fecha_creacion'];
            $turno['fechaActualizacion'] = $turno['fecha_actualizacion'];
            unset($turno['paciente_id'], $turno['medico_id'], $turno['estado_id'],
                  $turno['estado_codigo'], $turno['estado_nombre'],
                  $turno['fecha_creacion'], $turno['fecha_actualizacion'],
                  $turno['paciente_nombre'], $turno['paciente_apellido'],
                  $turno['medico_nombre']);
        }

        return $turnos;
    }

    /**
     * Obtener turno por ID
     */
    public function getById($id) {
        $turnos = $this->getAll(['id' => $id]);
        return !empty($turnos) ? $turnos[0] : null;
    }

    /**
     * Crear nuevo turno
     */
    public function create($data) {
        // Validar disponibilidad
        $conflicto = $this->checkDisponibilidad(
            $data['medicoId'],
            $data['fecha'],
            $data['hora']
        );

        if ($conflicto) {
            throw new Exception('El médico ya tiene un turno en esa fecha y hora');
        }

        // Obtener ID del estado (por defecto pendiente)
        $estadoCodigo = $data['estado'] ?? 'pendiente';
        $estadoId = $this->getEstadoId($estadoCodigo);

        $sql = "INSERT INTO turnos 
                (paciente_id, medico_id, fecha, hora, estado_id, motivo, notas, creado_por)
                VALUES (:paciente_id, :medico_id, :fecha, :hora, :estado_id, :motivo, :notas, :creado_por)";

        $params = [
            ':paciente_id' => $data['pacienteId'],
            ':medico_id' => $data['medicoId'],
            ':fecha' => $data['fecha'],
            ':hora' => $data['hora'],
            ':estado_id' => $estadoId,
            ':motivo' => $data['motivo'] ?? null,
            ':notas' => $data['notas'] ?? null,
            ':creado_por' => $_SESSION['user_id'] ?? null
        ];

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);

        return $this->getById($this->db->lastInsertId());
    }

    /**
     * Actualizar turno
     */
    public function update($id, $data) {
        $turno = $this->getById($id);
        if (!$turno) {
            throw new Exception('Turno no encontrado');
        }

        // Validar disponibilidad si cambia fecha/hora/médico
        if (isset($data['fecha']) || isset($data['hora']) || isset($data['medicoId'])) {
            $fecha = $data['fecha'] ?? $turno['fecha'];
            $hora = $data['hora'] ?? $turno['hora'];
            $medicoId = $data['medicoId'] ?? $turno['medicoId'];

            $conflicto = $this->checkDisponibilidad($medicoId, $fecha, $hora, $id);
            if ($conflicto) {
                throw new Exception('El médico ya tiene un turno en esa fecha y hora');
            }
        }

        $sql = "UPDATE turnos SET 
                paciente_id = COALESCE(:paciente_id, paciente_id),
                medico_id = COALESCE(:medico_id, medico_id),
                fecha = COALESCE(:fecha, fecha),
                hora = COALESCE(:hora, hora),
                estado_id = COALESCE(:estado_id, estado_id),
                motivo = COALESCE(:motivo, motivo),
                notas = COALESCE(:notas, notas),
                actualizado_por = :actualizado_por
                WHERE id = :id";

        $estadoId = null;
        if (isset($data['estado'])) {
            $estadoId = $this->getEstadoId($data['estado']);
        }

        $params = [
            ':id' => $id,
            ':paciente_id' => $data['pacienteId'] ?? null,
            ':medico_id' => $data['medicoId'] ?? null,
            ':fecha' => $data['fecha'] ?? null,
            ':hora' => $data['hora'] ?? null,
            ':estado_id' => $estadoId,
            ':motivo' => $data['motivo'] ?? null,
            ':notas' => $data['notas'] ?? null,
            ':actualizado_por' => $_SESSION['user_id'] ?? null
        ];

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);

        return $this->getById($id);
    }

    /**
     * Cancelar turno
     */
    public function cancel($id) {
        return $this->update($id, ['estado' => 'cancelado']);
    }

    /**
     * Obtener turnos del día
     */
    public function getTurnosDelDia($fecha = null) {
        if (!$fecha) {
            $fecha = date('Y-m-d');
        }
        return $this->getAll(['fecha' => $fecha]);
    }

    /**
     * Obtener próximos turnos
     */
    public function getProximosTurnos($limit = 5) {
        $hoy = date('Y-m-d');
        $turnos = $this->getAll(['desde' => $hoy]);
        
        // Filtrar cancelados y ordenar
        $turnos = array_filter($turnos, function($t) {
            return $t['estado'] !== 'cancelado';
        });
        
        usort($turnos, function($a, $b) {
            $dateA = strtotime($a['fecha'] . ' ' . $a['hora']);
            $dateB = strtotime($b['fecha'] . ' ' . $b['hora']);
            return $dateA - $dateB;
        });

        return array_slice($turnos, 0, $limit);
    }

    /**
     * Obtener estadísticas
     */
    public function getEstadisticas($fechaInicio, $fechaFin) {
        $turnos = $this->getAll([
            'desde' => $fechaInicio,
            'hasta' => $fechaFin
        ]);

        $estadisticas = [
            'total' => count($turnos),
            'pendientes' => 0,
            'confirmados' => 0,
            'completados' => 0,
            'cancelados' => 0,
            'noAsistio' => 0
        ];

        foreach ($turnos as $turno) {
            $estado = $turno['estado'];
            if (isset($estadisticas[$estado])) {
                $estadisticas[$estado]++;
            }
        }

        return $estadisticas;
    }

    /**
     * Verificar disponibilidad
     */
    private function checkDisponibilidad($medicoId, $fecha, $hora, $excludeId = null) {
        $sql = "SELECT t.id 
                FROM turnos t
                INNER JOIN turno_estados te ON t.estado_id = te.id
                WHERE t.medico_id = :medico_id 
                  AND t.fecha = :fecha 
                  AND t.hora = :hora
                  AND te.codigo NOT IN ('cancelado', 'no_asistio')";
        
        $params = [
            ':medico_id' => $medicoId,
            ':fecha' => $fecha,
            ':hora' => $hora
        ];

        if ($excludeId) {
            $sql .= " AND t.id != :exclude_id";
            $params[':exclude_id'] = $excludeId;
        }

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        return $stmt->fetch() !== false;
    }

    /**
     * Obtener ID de estado por código
     */
    private function getEstadoId($codigo) {
        $sql = "SELECT id FROM turno_estados WHERE codigo = :codigo";
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':codigo' => $codigo]);
        $result = $stmt->fetch();
        return $result ? $result['id'] : 1; // Por defecto pendiente
    }
}

