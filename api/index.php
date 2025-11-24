<?php
/**
 * Router Principal - API MediTurnos
 * Versión con manejo robusto de errores
 */

// Habilitar errores
error_reporting(E_ALL);
ini_set('display_errors', 0); // No mostrar en producción, pero capturar

// DEBUG ABSOLUTO - PRIMERA LÍNEA
if (isset($_GET['debug']) || isset($_GET['d'])) {
    header('Content-Type: application/json; charset=utf-8');
    
    $data = [
        'debug' => true,
        'timestamp' => date('Y-m-d H:i:s'),
        'request_uri' => $_SERVER['REQUEST_URI'] ?? 'N/A',
        'script_name' => $_SERVER['SCRIPT_NAME'] ?? 'N/A',
        'script_dir' => dirname($_SERVER['SCRIPT_NAME'] ?? ''),
        'document_root' => $_SERVER['DOCUMENT_ROOT'] ?? 'N/A',
        'php_self' => $_SERVER['PHP_SELF'] ?? 'N/A',
        'query_string' => $_SERVER['QUERY_STRING'] ?? '',
        '__dir__' => __DIR__,
        'file_exists_index' => file_exists(__FILE__),
        'controllers_dir' => __DIR__ . '/controllers/',
        'controllers_dir_exists' => is_dir(__DIR__ . '/controllers/'),
    ];
    
    if (is_dir(__DIR__ . '/controllers/')) {
        $files = scandir(__DIR__ . '/controllers/');
        $data['controllers_list'] = array_values(array_diff($files, ['.', '..']));
    } else {
        $data['controllers_list'] = [];
    }
    
    // Calcular path
    $requestUri = parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH);
    $scriptName = $_SERVER['SCRIPT_NAME'] ?? '';
    $scriptDir = dirname($scriptName);
    
    $path = '';
    if (strpos($requestUri, $scriptDir) === 0) {
        $path = substr($requestUri, strlen($scriptDir));
        $path = trim($path, '/');
        if ($path === 'index.php' || empty($path)) {
            $path = 'auth';
        }
    } elseif (($apiPos = strpos($requestUri, '/api')) !== false) {
        $path = substr($requestUri, $apiPos + 4);
        $path = trim($path, '/');
        if (strpos($path, 'index.php') === 0) {
            $path = substr($path, 10);
        }
        if (empty($path)) {
            $path = 'auth';
        }
    } else {
        $path = 'auth';
    }
    
    $segments = explode('/', $path);
    $controller = $segments[0] ?? 'auth';
    $controllerFile = __DIR__ . '/controllers/' . ucfirst($controller) . 'Controller.php';
    
    $data['path_calculated'] = $path;
    $data['segments'] = $segments;
    $data['controller'] = $controller;
    $data['controller_file'] = $controllerFile;
    $data['controller_file_exists'] = file_exists($controllerFile);
    $data['controller_file_realpath'] = file_exists($controllerFile) ? realpath($controllerFile) : 'NO EXISTE';
    
    // Verificar database.php
    $data['database_file_exists'] = file_exists(__DIR__ . '/config/database.php');
    if (file_exists(__DIR__ . '/config/database.php')) {
        ob_start();
        $dbError = false;
        try {
            require_once __DIR__ . '/config/database.php';
            $data['database_loaded'] = function_exists('jsonResponse');
            $data['functions_available'] = [
                'jsonResponse' => function_exists('jsonResponse'),
                'errorResponse' => function_exists('errorResponse'),
                'successResponse' => function_exists('successResponse'),
            ];
        } catch (Exception $e) {
            $dbError = true;
            $data['database_error'] = $e->getMessage();
        } catch (Error $e) {
            $dbError = true;
            $data['database_error'] = $e->getMessage();
        }
        $output = ob_get_clean();
        if ($output) {
            $data['database_output'] = $output;
        }
    }
    
    echo json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

// Cargar database.php con manejo de errores
$dbConfigFile = __DIR__ . '/config/database.php';
if (file_exists($dbConfigFile)) {
    try {
        require_once $dbConfigFile;
    } catch (Throwable $e) {
        // Si falla, crear funciones básicas
        header('Content-Type: application/json');
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Error al cargar configuración: ' . $e->getMessage(),
            'file' => $e->getFile(),
            'line' => $e->getLine(),
            'trace' => $e->getTraceAsString()
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
} else {
    // Si no existe, crear funciones básicas
    function jsonResponse($data, $statusCode = 200) {
        http_response_code($statusCode);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }
    
    function errorResponse($message, $statusCode = 400) {
        jsonResponse(['success' => false, 'message' => $message], $statusCode);
    }
    
    function successResponse($data = null, $message = null) {
        $response = ['success' => true];
        if ($message) $response['message'] = $message;
        if ($data) {
            if (is_array($data) && isset($data[0])) {
                $response['data'] = $data;
            } else {
                $response = array_merge($response, $data);
            }
        }
        jsonResponse($response);
    }
    
    function getJsonInput() {
        $input = file_get_contents('php://input');
        $data = json_decode($input, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            errorResponse('JSON inválido', 400);
        }
        return $data;
    }
    
    function requireAuth() {
        if (!isset($_SESSION['user_id'])) {
            errorResponse('No autenticado', 401);
        }
    }
    
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
        ];
    }
    
    // Inicializar sesión
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
}

// Verificar que las funciones existan
if (!function_exists('jsonResponse')) {
    errorResponse('Error crítico: Funciones helper no disponibles', 500);
}

// Parsear ruta
$method = $_SERVER['REQUEST_METHOD'];
$requestUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$scriptName = $_SERVER['SCRIPT_NAME'];
$scriptDir = dirname($scriptName);

$path = '';

// Método 1: URI comienza con scriptDir
if (strpos($requestUri, $scriptDir) === 0) {
    $path = substr($requestUri, strlen($scriptDir));
    $path = trim($path, '/');
    if ($path === 'index.php' || empty($path)) {
        $path = 'auth';
    }
}
// Método 2: Buscar /api
elseif (($apiPos = strpos($requestUri, '/api')) !== false) {
    $path = substr($requestUri, $apiPos + 4);
    $path = trim($path, '/');
    if (strpos($path, 'index.php') === 0) {
        $path = substr($path, 10);
    }
    if (empty($path)) {
        $path = 'auth';
    }
}
// Método 3: Query string
elseif (isset($_GET['path'])) {
    $path = trim($_GET['path'], '/');
    if (empty($path)) {
        $path = 'auth';
    }
}
// Método 4: Default
else {
    $path = 'auth';
}

$segments = explode('/', $path);
$controller = $segments[0] ?? 'auth';
$action = $segments[1] ?? null;
$id = $segments[2] ?? null;
$subAction = $segments[3] ?? null;

// Acciones especiales que pueden venir después de un ID
$specialActions = [
    'login', 'register', 'logout', 'me',
    'disponibilidad', 'horarios-disponibles', 'especialidades',
    'historial', 'del-dia', 'proximos', 'estadisticas',
    'change-password', 'read', 'read-all'
];

$methodName = null;
$finalId = null;

// Manejar rutas como /medico/1/disponibilidad
if ($id && $subAction && in_array($subAction, $specialActions)) {
    $methodName = $subAction;
    $finalId = $id;
    $id = null;
}
// Manejar rutas como /medico/disponibilidad (sin ID)
elseif ($action && in_array($action, $specialActions)) {
    $methodName = $action;
    $finalId = $id;
    $id = null;
}
// Manejar rutas como /medico/1 (con ID numérico)
elseif ($action && is_numeric($action)) {
    $id = $action;
    $action = null;
}
// Manejar rutas como /medico/especialidades (acción sin ID)
elseif ($action && !is_numeric($action)) {
    $methodName = $action;
    $id = null;
}

// Cargar controlador
$controllerFile = __DIR__ . '/controllers/' . ucfirst($controller) . 'Controller.php';

if (!file_exists($controllerFile)) {
    $errorMsg = "Endpoint no encontrado: '{$controller}'";
    $errorMsg .= " | Ruta: '{$path}' | URI: '{$requestUri}'";
    $errorMsg .= " | Archivo: '{$controllerFile}'";
    errorResponse($errorMsg, 404);
}

try {
    require_once $controllerFile;
} catch (Throwable $e) {
    errorResponse('Error al cargar controlador: ' . $e->getMessage() . ' en ' . $e->getFile() . ':' . $e->getLine(), 500);
}

$controllerClass = ucfirst($controller) . 'Controller';

if (!class_exists($controllerClass)) {
    errorResponse("Controlador '{$controllerClass}' no existe en el archivo", 404);
}

try {
    $controllerInstance = new $controllerClass();
} catch (Throwable $e) {
    errorResponse('Error al instanciar controlador: ' . $e->getMessage(), 500);
}

// Ejecutar acción
try {
    switch ($method) {
        case 'GET':
            // Para GET, primero verificar si hay un método específico
            if (isset($methodName) && method_exists($controllerInstance, $methodName)) {
                $controllerInstance->$methodName($finalId ?? $id);
            } elseif ($action && method_exists($controllerInstance, $action)) {
                // Si la acción existe como método, llamarlo
                $controllerInstance->$action($id);
            } elseif ($id) {
                // Si hay ID, usar show()
                if (method_exists($controllerInstance, 'show')) {
                    $controllerInstance->show($id);
                } else {
                    errorResponse("Método 'show' no disponible en {$controllerClass}", 404);
                }
            } else {
                // Sin acción ni ID, usar index()
                if (method_exists($controllerInstance, 'index')) {
                    $controllerInstance->index();
                } else {
                    errorResponse("Método 'index' no disponible en {$controllerClass}", 404);
                }
            }
            break;
        
        case 'POST':
            // Para POST, verificar acciones especiales primero
            if ($action === 'login' || $action === 'register' || $action === 'logout') {
                if (method_exists($controllerInstance, $action)) {
                    $controllerInstance->$action();
                } else {
                    errorResponse("Método '{$action}' no disponible en {$controllerClass}", 404);
                }
            } elseif (isset($methodName) && method_exists($controllerInstance, $methodName)) {
                $controllerInstance->$methodName($finalId ?? $id);
            } elseif ($action && method_exists($controllerInstance, $action)) {
                $controllerInstance->$action($id);
            } else {
                // Sin acción específica, usar store()
                if (method_exists($controllerInstance, 'store')) {
                    $controllerInstance->store();
                } else {
                    errorResponse("Método 'store' no disponible en {$controllerClass}. Path: '{$path}', Action: '{$action}'", 404);
                }
            }
            break;
        
        case 'PUT':
        case 'PATCH':
            if (isset($methodName) && method_exists($controllerInstance, $methodName)) {
                $controllerInstance->$methodName($finalId ?? $id);
            } elseif ($action && method_exists($controllerInstance, $action)) {
                $controllerInstance->$action($id);
            } elseif ($id) {
                $controllerInstance->update($id);
            } else {
                errorResponse('ID requerido', 400);
            }
            break;
        
        case 'DELETE':
            if ($id) {
                $controllerInstance->destroy($id);
            } else {
                errorResponse('ID requerido', 400);
            }
            break;
        
        default:
            errorResponse('Método no permitido', 405);
    }
} catch (Throwable $e) {
    errorResponse($e->getMessage() . ' en ' . $e->getFile() . ':' . $e->getLine(), 500);
}

