<?php
/**
 * Controlador de Médicos
 */
require_once __DIR__ . '/../models/Medico.php';

class MedicoController {
    private $medicoModel;

    public function __construct() {
        requireAuth();
        $this->medicoModel = new Medico();
    }

    /**
     * GET /api/medico
     */
    public function index() {
        $filters = $_GET;
        $medicos = $this->medicoModel->getAll($filters);
        successResponse($medicos);
    }

    /**
     * GET /api/medico/:id
     */
    public function show($id) {
        $medico = $this->medicoModel->getById($id);
        
        if (!$medico) {
            errorResponse('Médico no encontrado', 404);
        }

        successResponse(['medico' => $medico]);
    }

    /**
     * POST /api/medico
     */
    public function store() {
        $data = getJsonInput();

        try {
            $medico = $this->medicoModel->create($data);
            successResponse(['medico' => $medico], 'Médico creado exitosamente');
        } catch (Exception $e) {
            errorResponse($e->getMessage(), 400);
        }
    }

    /**
     * PUT /api/medico/:id
     */
    public function update($id) {
        $data = getJsonInput();

        try {
            $medico = $this->medicoModel->update($id, $data);
            successResponse(['medico' => $medico], 'Médico actualizado exitosamente');
        } catch (Exception $e) {
            errorResponse($e->getMessage(), 400);
        }
    }

    /**
     * DELETE /api/medico/:id
     */
    public function destroy($id) {
        try {
            $this->medicoModel->delete($id);
            successResponse(null, 'Médico eliminado exitosamente');
        } catch (Exception $e) {
            errorResponse($e->getMessage(), 400);
        }
    }

    /**
     * GET /api/medico/:id/disponibilidad?fecha=YYYY-MM-DD
     */
    public function disponibilidad($id) {
        if (!$id) {
            errorResponse('ID de médico requerido', 400);
        }
        
        $fecha = $_GET['fecha'] ?? date('Y-m-d');
        $disponibilidad = $this->medicoModel->getDisponibilidad($id, $fecha);
        successResponse($disponibilidad);
    }

    /**
     * GET /api/medico/:id/horarios-disponibles?fecha=YYYY-MM-DD
     */
    public function horariosDisponibles($id) {
        if (!$id) {
            errorResponse('ID de médico requerido', 400);
        }
        
        $fecha = $_GET['fecha'] ?? date('Y-m-d');
        $horarios = $this->medicoModel->getHorariosDisponibles($id, $fecha);
        successResponse($horarios);
    }

    /**
     * GET /api/medico/especialidades
     */
    public function especialidades() {
        $especialidades = $this->medicoModel->getEspecialidades();
        successResponse($especialidades);
    }
}

