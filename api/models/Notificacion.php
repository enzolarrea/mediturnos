<?php
/**
 * Modelo Notificacion
 */
require_once __DIR__ . '/../config/database.php';

class Notificacion {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }

    /**
     * Obtener notificaciones de un usuario
     */
    public function getUserNotifications($userId, $onlyUnread = false) {
        $sql = "SELECT id, usuario_id, mensaje, tipo, leida, fecha, fecha_lectura
                FROM notificaciones
                WHERE usuario_id = :usuario_id";
        
        if ($onlyUnread) {
            $sql .= " AND leida = 0";
        }

        $sql .= " ORDER BY fecha DESC";

        $stmt = $this->db->prepare($sql);
        $stmt->execute([':usuario_id' => $userId]);
        $notificaciones = $stmt->fetchAll();

        // Formatear respuesta
        foreach ($notificaciones as &$notif) {
            $notif['userId'] = $notif['usuario_id'];
            $notif['read'] = (bool)$notif['leida'];
            $notif['fechaLectura'] = $notif['fecha_lectura'];
            unset($notif['usuario_id'], $notif['leida'], $notif['fecha_lectura']);
        }

        return $notificaciones;
    }

    /**
     * Crear notificación
     */
    public function create($data) {
        $sql = "INSERT INTO notificaciones (usuario_id, mensaje, tipo, leida)
                VALUES (:usuario_id, :mensaje, :tipo, 0)";

        $params = [
            ':usuario_id' => $data['userId'],
            ':mensaje' => $data['message'],
            ':tipo' => $data['type'] ?? 'info'
        ];

        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);

        return $this->db->lastInsertId();
    }

    /**
     * Marcar notificación como leída
     */
    public function markAsRead($id) {
        $sql = "UPDATE notificaciones 
                SET leida = 1, fecha_lectura = NOW()
                WHERE id = :id";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':id' => $id]);
        
        return $stmt->rowCount() > 0;
    }

    /**
     * Marcar todas las notificaciones de un usuario como leídas
     */
    public function markAllAsRead($userId) {
        $sql = "UPDATE notificaciones 
                SET leida = 1, fecha_lectura = NOW()
                WHERE usuario_id = :usuario_id AND leida = 0";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute([':usuario_id' => $userId]);
        
        return $stmt->rowCount();
    }
}

