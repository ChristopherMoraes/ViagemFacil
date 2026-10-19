<?php
// Conexão com o banco de dados MySQL via PDO

// Define fuso horário padrão do Brasil (Horário de Brasília)
date_default_timezone_set('America/Sao_Paulo');

// Detecção dinâmica de ambiente (Localhost XAMPP vs InfinityFree Nuvem)
$hostAtual = $_SERVER['HTTP_HOST'] ?? ($_SERVER['SERVER_NAME'] ?? '');
$isLocalhost = empty($hostAtual) || str_contains($hostAtual, 'localhost') || str_contains($hostAtual, '127.0.0.1');

if ($isLocalhost) {
    define('DB_HOST', 'localhost');
    define('DB_PORT', '3306');
    define('DB_NAME', 'viagem_facil');
    define('DB_USER', 'root');
    define('DB_PASS', '');
} else {
    define('DB_HOST', 'sql211.infinityfree.com');
    define('DB_PORT', '3306');
    define('DB_NAME', 'if0_42932696_viagem_facil');
    define('DB_USER', 'if0_42932696');
    define('DB_PASS', 'Ch070809');
}

function obterConexao() {
    static $pdo = null;
    if ($pdo === null) {
        $dsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=utf8mb4";
        $opcoes = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ];
        try {
            $pdo = new PDO($dsn, DB_USER, DB_PASS, $opcoes);
            // Sincroniza timezone da sessão MySQL com o horário de Brasília
            $pdo->exec("SET time_zone = '-03:00'");
        } catch (PDOException $e) {
            return null;
        }
    }
    return $pdo;
}

// Helper: retorna conexão ou encerra com erro JSON 500
// Elimina a repetição do bloco if (!$pdo) em cada endpoint
function obterConexaoOuErro() {
    $pdo = obterConexao();
    if (!$pdo) {
        http_response_code(500);
        echo json_encode([
            'sucesso' => false,
            'mensagem' => 'Erro de conexão com o banco de dados.'
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
    return $pdo;
}
