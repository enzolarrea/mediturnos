<?php
/**
 * Test de routing - Verifica cómo se parsean las rutas
 * Acceder a: http://localhost/mediturnos/api/test-route.php?path=auth/login
 */

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];
$requestUri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$scriptName = $_SERVER['SCRIPT_NAME'];
$scriptDir = dirname($scriptName);

// Simular el mismo parsing que index.php
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

$specialActions = [
    'login', 'register', 'logout', 'me',
    'disponibilidad', 'horarios-disponibles', 'especialidades',
    'historial', 'del-dia', 'proximos', 'estadisticas',
    'change-password', 'read', 'read-all'
];

$methodName = null;
if ($action && in_array($action, $specialActions)) {
    $methodName = $action;
} elseif ($action && !is_numeric($action)) {
    $methodName = $action;
    $id = null;
}

$controllerFile = __DIR__ . '/controllers/' . ucfirst($controller) . 'Controller.php';

echo json_encode([
    'method' => $method,
    'request_uri' => $requestUri,
    'script_name' => $scriptName,
    'script_dir' => $scriptDir,
    'path_calculated' => $path,
    'segments' => $segments,
    'controller' => $controller,
    'action' => $action,
    'id' => $id,
    'method_name' => $methodName,
    'controller_file' => $controllerFile,
    'controller_file_exists' => file_exists($controllerFile),
    'query_string' => $_SERVER['QUERY_STRING'] ?? '',
    'get_params' => $_GET
], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);

