<?php
/**
 * Archivo de prueba para verificar que los endpoints funcionan
 * Acceder a: http://localhost/mediturnos/api/test-endpoint.php
 */

header('Content-Type: application/json');

$results = [
    'test' => 'Endpoint Test',
    'timestamp' => date('Y-m-d H:i:s'),
    'checks' => []
];

// Verificar database.php
$results['checks']['database_file'] = file_exists(__DIR__ . '/config/database.php');
if ($results['checks']['database_file']) {
    try {
        require_once __DIR__ . '/config/database.php';
        $results['checks']['database_loaded'] = function_exists('jsonResponse');
        $results['checks']['functions_available'] = [
            'jsonResponse' => function_exists('jsonResponse'),
            'errorResponse' => function_exists('errorResponse'),
            'successResponse' => function_exists('successResponse'),
        ];
    } catch (Exception $e) {
        $results['checks']['database_error'] = $e->getMessage();
    }
}

// Verificar AuthController
$results['checks']['auth_controller_file'] = file_exists(__DIR__ . '/controllers/AuthController.php');
if ($results['checks']['auth_controller_file']) {
    try {
        require_once __DIR__ . '/controllers/AuthController.php';
        $results['checks']['auth_controller_class'] = class_exists('AuthController');
        if (class_exists('AuthController')) {
            $reflection = new ReflectionClass('AuthController');
            $methods = $reflection->getMethods(ReflectionMethod::IS_PUBLIC);
            $results['checks']['auth_controller_methods'] = array_map(function($m) {
                return $m->getName();
            }, $methods);
        }
    } catch (Exception $e) {
        $results['checks']['auth_controller_error'] = $e->getMessage();
    }
}

// Verificar modelos
$results['checks']['usuario_model'] = file_exists(__DIR__ . '/models/Usuario.php');
$results['checks']['paciente_model'] = file_exists(__DIR__ . '/models/Paciente.php');

// Verificar configuración de BD
if (defined('DB_HOST') && defined('DB_NAME') && defined('DB_USER')) {
    $results['checks']['database_config'] = [
        'host' => DB_HOST,
        'database' => DB_NAME,
        'user' => DB_USER,
        'pass_defined' => defined('DB_PASS'),
        'charset' => defined('DB_CHARSET') ? DB_CHARSET : 'N/A'
    ];
} else {
    $results['checks']['database_config'] = 'Constantes no definidas';
}

// Verificar conexión a BD
if (class_exists('Database')) {
    try {
        $db = Database::getInstance();
        $conn = $db->getConnection();
        // Hacer una consulta simple para verificar
        $stmt = $conn->query("SELECT 1 as test");
        $testResult = $stmt->fetch();
        $results['checks']['database_connection'] = true;
        $results['checks']['database_test_query'] = 'OK';
        $results['checks']['database_test_result'] = $testResult;
        
        // Probar consulta a tabla usuarios
        try {
            $stmt = $conn->query("SELECT COUNT(*) as total FROM usuarios");
            $userCount = $stmt->fetch();
            $results['checks']['database_tables'] = [
                'usuarios_exists' => true,
                'usuarios_count' => $userCount['total']
            ];
        } catch (Exception $e) {
            $results['checks']['database_tables'] = [
                'usuarios_exists' => false,
                'error' => $e->getMessage()
            ];
        }
    } catch (Exception $e) {
        $results['checks']['database_connection'] = false;
        $results['checks']['database_connection_error'] = $e->getMessage();
        $results['checks']['database_connection_file'] = $e->getFile();
        $results['checks']['database_connection_line'] = $e->getLine();
    } catch (PDOException $e) {
        $results['checks']['database_connection'] = false;
        $results['checks']['database_connection_error'] = $e->getMessage();
        $results['checks']['database_connection_code'] = $e->getCode();
        $results['checks']['database_connection_info'] = $e->errorInfo ?? 'N/A';
    } catch (Throwable $e) {
        $results['checks']['database_connection'] = false;
        $results['checks']['database_connection_error'] = $e->getMessage();
        $results['checks']['database_connection_type'] = get_class($e);
    }
} else {
    $results['checks']['database_connection'] = false;
    $results['checks']['database_connection_error'] = 'Clase Database no existe';
}

// Resumen
$results['summary'] = [
    'all_files_exist' => $results['checks']['database_file'] && 
                         $results['checks']['auth_controller_file'] &&
                         $results['checks']['usuario_model'] &&
                         $results['checks']['paciente_model'],
    'database_ready' => isset($results['checks']['database_loaded']) && $results['checks']['database_loaded'],
    'controller_ready' => isset($results['checks']['auth_controller_class']) && $results['checks']['auth_controller_class'],
    'database_connected' => isset($results['checks']['database_connection']) && $results['checks']['database_connection']
];

echo json_encode($results, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);

