<?php
/**
 * Controlador de Autenticación
 */
require_once __DIR__ . '/../models/Usuario.php';
require_once __DIR__ . '/../models/Paciente.php';

class AuthController {
    private $usuarioModel;

    public function __construct() {
        $this->usuarioModel = new Usuario();
    }

    /**
     * GET /api/auth - Información del endpoint
     */
    public function index() {
        successResponse([
            'endpoint' => 'auth',
            'available_methods' => [
                'POST /api/auth/login' => 'Iniciar sesión',
                'POST /api/auth/register' => 'Registrar usuario',
                'POST /api/auth/logout' => 'Cerrar sesión',
                'GET /api/auth/me' => 'Obtener usuario actual'
            ]
        ]);
    }

    /**
     * POST /api/auth/login
     */
    public function login() {
        $data = getJsonInput();

        if (empty($data['email']) || empty($data['password'])) {
            errorResponse('Email y contraseña son requeridos', 400);
        }

        try {
            $usuario = $this->usuarioModel->verifyCredentials($data['email'], $data['password']);

            if (!$usuario) {
                errorResponse('Email o contraseña incorrectos', 401);
            }

            // Crear sesión
            $_SESSION['user_id'] = $usuario['id'];
            $_SESSION['user_nombre'] = $usuario['nombre'];
            $_SESSION['user_apellido'] = $usuario['apellido'];
            $_SESSION['user_email'] = $usuario['email'];
            $_SESSION['user_rol'] = $usuario['rol'];
            $_SESSION['user_medico_id'] = $usuario['medico_id'] ?? null;
            $_SESSION['user_paciente_id'] = $usuario['paciente_id'] ?? null;
            $_SESSION['user_activo'] = $usuario['activo'];

            // Formatear respuesta
            $userResponse = [
                'id' => $usuario['id'],
                'nombre' => $usuario['nombre'],
                'apellido' => $usuario['apellido'],
                'email' => $usuario['email'],
                'rol' => $usuario['rol'],
                'medicoId' => $usuario['medico_id'] ?? null,
                'pacienteId' => $usuario['paciente_id'] ?? null,
                'activo' => $usuario['activo']
            ];

            successResponse(['user' => $userResponse], 'Login exitoso');
        } catch (Exception $e) {
            errorResponse($e->getMessage(), 400);
        }
    }

    /**
     * POST /api/auth/logout
     */
    public function logout() {
        session_destroy();
        successResponse(null, 'Logout exitoso');
    }

    /**
     * GET /api/auth/me
     */
    public function me() {
        requireAuth();
        $user = getCurrentUser();
        successResponse(['user' => $user]);
    }

    /**
     * POST /api/auth/register
     */
    public function register() {
        $data = getJsonInput();

        // Validaciones básicas
        if (empty($data['email']) || empty($data['password'])) {
            errorResponse('Email y contraseña son requeridos', 400);
        }

        if (isset($data['password']) && strlen($data['password']) < 8) {
            errorResponse('La contraseña debe tener al menos 8 caracteres', 400);
        }

        if (isset($data['confirmPassword']) && $data['password'] !== $data['confirmPassword']) {
            errorResponse('Las contraseñas no coinciden', 400);
        }

        try {
            $rol = $data['rol'] ?? 'paciente';
            $pacienteId = null;
            
            // Si es paciente, crear registro de paciente PRIMERO
            if ($rol === 'paciente') {
                $pacienteModel = new Paciente();
                $pacienteData = [
                    'nombre' => $data['nombre'] ?? '',
                    'apellido' => $data['apellido'] ?? '',
                    'dni' => $data['dni'] ?? '',
                    'telefono' => $data['telefono'] ?? '',
                    'email' => $data['email'],
                    'fechaNacimiento' => $data['fechaNacimiento'] ?? null,
                    'direccion' => $data['direccion'] ?? ''
                ];
                
                $paciente = $pacienteModel->create($pacienteData);
                $pacienteId = $paciente['id'];
            }

            // Crear usuario con paciente_id ya asignado (si es paciente)
            $userData = [
                'nombre' => $data['nombre'] ?? '',
                'apellido' => $data['apellido'] ?? '',
                'email' => $data['email'],
                'password' => $data['password'],
                'rol' => $rol,
                'pacienteId' => $pacienteId
            ];

            $usuario = $this->usuarioModel->create($userData);
            
            // Asegurar que pacienteId esté en la respuesta
            if ($rol === 'paciente' && $pacienteId) {
                $usuario['pacienteId'] = $pacienteId;
            }

            // Formatear respuesta (sin password)
            unset($usuario['password']);
            successResponse(['user' => $usuario], 'Registro exitoso');
        } catch (Exception $e) {
            errorResponse($e->getMessage(), 400);
        }
    }
}

