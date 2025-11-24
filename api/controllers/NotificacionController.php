<?php
/**
 * Controlador de Notificaciones
 */
require_once __DIR__ . '/../models/Notificacion.php';

class NotificacionController {
    private $notificacionModel;

    public function __construct() {
        requireAuth();
        $this->notificacionModel = new Notificacion();
    }

    /**
     * GET /api/notificacion
     */
    public function index() {
        $user = getCurrentUser();
        $onlyUnread = isset($_GET['unread']) && $_GET['unread'] === 'true';
        $notificaciones = $this->notificacionModel->getUserNotifications($user['id'], $onlyUnread);
        successResponse($notificaciones);
    }

    /**
     * POST /api/notificacion
     */
    public function store() {
        $data = getJsonInput();
        $user = getCurrentUser();

        if (empty($data['message'])) {
            errorResponse('Mensaje es requerido', 400);
        }

        $notifData = [
            'userId' => $data['userId'] ?? $user['id'],
            'message' => $data['message'],
            'type' => $data['type'] ?? 'info'
        ];

        $id = $this->notificacionModel->create($notifData);
        successResponse(['id' => $id], 'Notificación creada exitosamente');
    }

    /**
     * PUT /api/notificacion/:id/read
     */
    public function read($id) {
        $this->notificacionModel->markAsRead($id);
        successResponse(null, 'Notificación marcada como leída');
    }

    /**
     * PUT /api/notificacion/read-all
     */
    public function readAll() {
        $user = getCurrentUser();
        $count = $this->notificacionModel->markAllAsRead($user['id']);
        successResponse(['count' => $count], 'Todas las notificaciones marcadas como leídas');
    }
}

