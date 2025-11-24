<?php
/**
 * Controlador de Usuarios
 */
require_once __DIR__ . '/../models/Usuario.php';

class UsuarioController {
    private $usuarioModel;

    public function __construct() {
        requireAuth();
        $this->usuarioModel = new Usuario();
    }

    /**
     * GET /api/usuario
     */
    public function index() {
        $filters = $_GET;
        $usuarios = $this->usuarioModel->getAll($filters);
        successResponse($usuarios);
    }

    /**
     * GET /api/usuario/:id
     */
    public function show($id) {
        $usuario = $this->usuarioModel->getById($id);
        
        if (!$usuario) {
            errorResponse('Usuario no encontrado', 404);
        }

        successResponse(['user' => $usuario]);
    }

    /**
     * POST /api/usuario
     */
    public function store() {
        $data = getJsonInput();

        try {
            $usuario = $this->usuarioModel->create($data);
            successResponse(['user' => $usuario], 'Usuario creado exitosamente');
        } catch (Exception $e) {
            errorResponse($e->getMessage(), 400);
        }
    }

    /**
     * PUT /api/usuario/:id
     */
    public function update($id) {
        $data = getJsonInput();

        try {
            $usuario = $this->usuarioModel->update($id, $data);
            successResponse(['user' => $usuario], 'Usuario actualizado exitosamente');
        } catch (Exception $e) {
            errorResponse($e->getMessage(), 400);
        }
    }

    /**
     * DELETE /api/usuario/:id
     */
    public function destroy($id) {
        try {
            $this->usuarioModel->delete($id);
            successResponse(null, 'Usuario eliminado exitosamente');
        } catch (Exception $e) {
            errorResponse($e->getMessage(), 400);
        }
    }

    /**
     * POST /api/usuario/:id/change-password
     */
    public function changePassword($id) {
        $data = getJsonInput();

        if (empty($data['oldPassword']) || empty($data['newPassword'])) {
            errorResponse('Contraseña actual y nueva contraseña son requeridas', 400);
        }

        try {
            $this->usuarioModel->changePassword($id, $data['oldPassword'], $data['newPassword']);
            successResponse(null, 'Contraseña actualizada exitosamente');
        } catch (Exception $e) {
            errorResponse($e->getMessage(), 400);
        }
    }
}

