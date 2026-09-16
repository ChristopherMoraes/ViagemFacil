<?php
// Conexão com o banco de dados MySQL via PDO

define('DB_HOST', 'localhost');
define('DB_PORT', '3306');
define('DB_NAME', 'viagem_facil');
define('DB_USER', 'root');
define('DB_PASS', '');

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
        } catch (PDOException $e) {
            return null;
        }
    }
    return $pdo;
}
