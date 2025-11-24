<?php
/**
 * Controlador de Turnos
 */
require_once __DIR__ . '/../models/Turno.php';

class TurnoController {
    private $turnoModel;

    public function __construct() {
        requireAuth();
        $this->turnoModel = new Turno();
    }

    /**
     * GET /api/turno
     */
    public function index() {
        $filters = $_GET;
        $turnos = $this->turnoModel->getAll($filters);
        successResponse($turnos);
    }

    /**
     * GET /api/turno/:id
     */
    public function show($id) {
        $turno = $this->turnoModel->getById($id);
        
        if (!$turno) {
            errorResponse('Turno no encontrado', 404);
        }

        successResponse(['turno' => $turno]);
    }

    /**
     * POST /api/turno
     */
    public function store() {
        $data = getJsonInput();

        try {
            $turno = $this->turnoModel->create($data);
            successResponse(['turno' => $turno], 'Turno creado exitosamente');
        } catch (Exception $e) {
            errorResponse($e->getMessage(), 400);
        }
    }

    /**
     * PUT /api/turno/:id
     */
    public function update($id) {
        $data = getJsonInput();

        try {
            $turno = $this->turnoModel->update($id, $data);
            successResponse(['turno' => $turno], 'Turno actualizado exitosamente');
        } catch (Exception $e) {
            errorResponse($e->getMessage(), 400);
        }
    }

    /**
     * DELETE /api/turno/:id
     */
    public function destroy($id) {
        try {
            $this->turnoModel->cancel($id);
            successResponse(null, 'Turno cancelado exitosamente');
        } catch (Exception $e) {
            errorResponse($e->getMessage(), 400);
        }
    }

    /**
     * GET /api/turno/del-dia?fecha=YYYY-MM-DD
     */
    public function delDia() {
        $fecha = $_GET['fecha'] ?? date('Y-m-d');
        $turnos = $this->turnoModel->getTurnosDelDia($fecha);
        successResponse($turnos);
    }

    /**
     * GET /api/turno/proximos?limit=5
     */
    public function proximos() {
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 5;
        $turnos = $this->turnoModel->getProximosTurnos($limit);
        successResponse($turnos);
    }

    /**
     * GET /api/turno/estadisticas?fechaInicio=YYYY-MM-DD&fechaFin=YYYY-MM-DD
     */
    public function estadisticas() {
        $fechaInicio = $_GET['fechaInicio'] ?? date('Y-m-01');
        $fechaFin = $_GET['fechaFin'] ?? date('Y-m-t');
        
        $estadisticas = $this->turnoModel->getEstadisticas($fechaInicio, $fechaFin);
        successResponse($estadisticas);
    }
}

