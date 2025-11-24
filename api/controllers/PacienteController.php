<?php
/**
 * Controlador de Pacientes
 */
require_once __DIR__ . '/../models/Paciente.php';

class PacienteController {
    private $pacienteModel;

    public function __construct() {
        requireAuth();
        $this->pacienteModel = new Paciente();
    }

    /**
     * GET /api/paciente
     */
    public function index() {
        $filters = $_GET;
        $pacientes = $this->pacienteModel->getAll($filters);
        successResponse($pacientes);
    }

    /**
     * GET /api/paciente/:id
     */
    public function show($id) {
        $paciente = $this->pacienteModel->getById($id);
        
        if (!$paciente) {
            errorResponse('Paciente no encontrado', 404);
        }

        successResponse(['paciente' => $paciente]);
    }

    /**
     * POST /api/paciente
     */
    public function store() {
        $data = getJsonInput();

        try {
            $paciente = $this->pacienteModel->create($data);
            successResponse(['paciente' => $paciente], 'Paciente creado exitosamente');
        } catch (Exception $e) {
            errorResponse($e->getMessage(), 400);
        }
    }

    /**
     * PUT /api/paciente/:id
     */
    public function update($id) {
        $data = getJsonInput();

        try {
            $paciente = $this->pacienteModel->update($id, $data);
            successResponse(['paciente' => $paciente], 'Paciente actualizado exitosamente');
        } catch (Exception $e) {
            errorResponse($e->getMessage(), 400);
        }
    }

    /**
     * DELETE /api/paciente/:id
     */
    public function destroy($id) {
        try {
            $this->pacienteModel->delete($id);
            successResponse(null, 'Paciente eliminado exitosamente');
        } catch (Exception $e) {
            errorResponse($e->getMessage(), 400);
        }
    }

    /**
     * GET /api/paciente/:id/historial
     */
    public function historial($id) {
        $historial = $this->pacienteModel->getHistorial($id);
        successResponse($historial);
    }
}

