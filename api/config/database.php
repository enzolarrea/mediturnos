<?php
/**
 * Configuración de Base de Datos
 * Sistema: MediTurnos
 */

// Configuración de la base de datos
define('DB_HOST', 'localhost');
define('DB_NAME', 'mediturnos');
define('DB_USER', 'root'); // Cambiar en producción
define('DB_PASS', ''); // Cambiar en producción
define('DB_CHARSET', 'utf8mb4');

// Configuración de sesión
define('SESSION_LIFETIME', 3600); // 1 hora en segundos
define('SESSION_NAME', 'mediturnos_session');

// Configuración de CORS (ajustar según tu dominio)
define('ALLOWED_ORIGINS', ['http://localhost', 'http://localhost:8080', 'http://127.0.0.1']);

/**
 * Clase Database - Conexión PDO a MySQL
 */
class Database {
    private static $instance = null;
    private $connection;

    private function __construct() {
        try {
            $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
            $options = [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES " . DB_CHARSET
            ];

            $this->connection = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            $errorMsg = "Error de conexión a la base de datos: " . $e->getMessage();
            $errorMsg .= " (Host: " . DB_HOST . ", DB: " . DB_NAME . ", User: " . DB_USER . ")";
            error_log($errorMsg);
            throw new Exception($errorMsg);
        }
    }

    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function getConnection() {
        return $this->connection;
    }

    // Prevenir clonación
    private function __clone() {}

    // Prevenir deserialización
    public function __wakeup() {
        throw new Exception("Cannot unserialize singleton");
    }
}

/**
 * Inicializar sesión
 */
function initSession() {
    if (session_status() === PHP_SESSION_NONE) {
        ini_set('session.cookie_httponly', 1);
        ini_set('session.use_only_cookies', 1);
        ini_set('session.cookie_secure', 0); // Cambiar a 1 si usas HTTPS
        session_name(SESSION_NAME);
        session_start();
        
        // Regenerar ID de sesión periódicamente
        if (!isset($_SESSION['created'])) {
            $_SESSION['created'] = time();
        } else if (time() - $_SESSION['created'] > 1800) {
            session_regenerate_id(true);
            $_SESSION['created'] = time();
        }
    }
}

/**
 * Configurar headers CORS y JSON
 */
function setHeaders() {
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    
    if (in_array($origin, ALLOWED_ORIGINS) || in_array('*', ALLOWED_ORIGINS)) {
        header("Access-Control-Allow-Origin: " . ($origin ?: '*'));
    }
    
    header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization");
    header("Access-Control-Allow-Credentials: true");
    header("Content-Type: application/json; charset=UTF-8");
    
    // Manejar preflight OPTIONS
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit();
    }
}

/**
 * Respuesta JSON estándar
 */
function jsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

/**
 * Respuesta de error estándar
 */
function errorResponse($message, $statusCode = 400, $errors = null) {
    $response = [
        'success' => false,
        'message' => $message
    ];
    
    if ($errors !== null) {
        $response['errors'] = $errors;
    }
    
    jsonResponse($response, $statusCode);
}

/**
 * Respuesta de éxito estándar
 */
function successResponse($data = null, $message = null) {
    $response = ['success' => true];
    
    if ($message !== null) {
        $response['message'] = $message;
    }
    
    if ($data !== null) {
        if (is_array($data) && isset($data[0])) {
            $response['data'] = $data;
        } else {
            $response = array_merge($response, $data);
        }
    }
    
    jsonResponse($response);
}

/**
 * Obtener datos JSON del request
 */
function getJsonInput() {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        errorResponse('JSON inválido', 400);
    }
    
    return $data;
}

/**
 * Validar autenticación
 */
function requireAuth() {
    if (!isset($_SESSION['user_id'])) {
        errorResponse('No autenticado', 401);
    }
}

/**
 * Obtener usuario actual
 */
function getCurrentUser() {
    if (!isset($_SESSION['user_id'])) {
        return null;
    }
    
    return [
        'id' => $_SESSION['user_id'],
        'nombre' => $_SESSION['user_nombre'] ?? '',
        'apellido' => $_SESSION['user_apellido'] ?? '',
        'email' => $_SESSION['user_email'] ?? '',
        'rol' => $_SESSION['user_rol'] ?? '',
        'medicoId' => $_SESSION['user_medico_id'] ?? null,
        'pacienteId' => $_SESSION['user_paciente_id'] ?? null,
        'activo' => $_SESSION['user_activo'] ?? true
    ];
}

// Inicializar
initSession();
setHeaders();

