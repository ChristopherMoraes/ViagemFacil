<?php
// API de cupons e descontos

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/conexao.php';

$pdo = obterConexao();

if (!$pdo) {
    http_response_code(500);
    echo json_encode([
        'sucesso' => false,
        'mensagem' => 'Erro de conexão com o banco de dados MySQL.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}


// Consulta cupom por código ou lista ativos

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $codigo = isset($_GET['codigo']) ? strtoupper(trim($_GET['codigo'])) : '';

    try {
        if ($codigo !== '') {
            $stmt = $pdo->prepare("
                SELECT id, codigo, tipo, valor, descricao, valido_ate, ativo, status, usos_realizados, uso_maximo
                FROM cupons
                WHERE UPPER(TRIM(codigo)) = ?
                LIMIT 1
            ");
            $stmt->execute([$codigo]);
            $cupom = $stmt->fetch();

            if (!$cupom) {
                echo json_encode([
                    'sucesso' => false,
                    'encontrado' => false,
                    'mensagem' => 'Cupom não cadastrado no banco de dados.'
                ], JSON_UNESCAPED_UNICODE);
                exit;
            }

            // Verifica se está ativo
            if ((int)$cupom['ativo'] === 0 || strtoupper($cupom['status'] ?? '') === 'INATIVO') {
                echo json_encode([
                    'sucesso' => false,
                    'encontrado' => true,
                    'mensagem' => 'Este cupom foi desativado no painel administrativo.'
                ], JSON_UNESCAPED_UNICODE);
                exit;
            }

            // Verifica se está expirado
            if (!empty($cupom['valido_ate'])) {
                $hoje = date('Y-m-d');
                if ($cupom['valido_ate'] < $hoje) {
                    echo json_encode([
                        'sucesso' => false,
                        'encontrado' => true,
                        'mensagem' => 'Este cupom expirou em ' . date('d/m/Y', strtotime($cupom['valido_ate'])) . '.'
                    ], JSON_UNESCAPED_UNICODE);
                    exit;
                }
            }

            // Verifica limite de uso
            if (!empty($cupom['uso_maximo']) && (int)$cupom['usos_realizados'] >= (int)$cupom['uso_maximo']) {
                echo json_encode([
                    'sucesso' => false,
                    'encontrado' => true,
                    'mensagem' => 'Este cupom atingiu o limite máximo de utilizações.'
                ], JSON_UNESCAPED_UNICODE);
                exit;
            }

            echo json_encode([
                'sucesso' => true,
                'encontrado' => true,
                'cupom' => [
                    'id' => (int)$cupom['id'],
                    'codigo' => strtoupper($cupom['codigo']),
                    'tipo' => $cupom['tipo'], // 'percentual' ou 'fixo'
                    'valor' => (float)$cupom['valor'],
                    'descricao' => $cupom['descricao'],
                    'valido_ate' => $cupom['valido_ate']
                ]
            ], JSON_UNESCAPED_UNICODE);
            exit;
        }

        // Lista todos os cupons
        $stmt = $pdo->query("
            SELECT id, codigo, tipo, valor, descricao, valido_ate, ativo, status, usos_realizados, uso_maximo
            FROM cupons
            ORDER BY id DESC
        ");
        $cupons = $stmt->fetchAll();

        echo json_encode([
            'sucesso' => true,
            'cupons' => $cupons
        ], JSON_UNESCAPED_UNICODE);
        exit;
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode([
            'sucesso' => false,
            'mensagem' => 'Erro ao consultar cupons no banco: ' . $e->getMessage()
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
}


// Salva ou atualiza cupom

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $conteudo = file_get_contents('php://input');
    $dados = json_decode($conteudo, true);

    if (!$dados || empty($dados['codigo'])) {
        http_response_code(400);
        echo json_encode([
            'sucesso' => false,
            'mensagem' => 'Código do cupom não informado.'
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $codigo = strtoupper(trim($dados['codigo']));
    $tipo = isset($dados['tipo']) && in_array(strtolower($dados['tipo']), ['fixo', 'percentual'])
        ? strtolower($dados['tipo'])
        : 'percentual';
    $valor = (float)($dados['porcentagem'] ?? ($dados['valor'] ?? 10.00));
    $descricao = trim($dados['descricao'] ?? ($valor . '% de Desconto'));
    $validoAte = !empty($dados['validade']) ? $dados['validade'] : (!empty($dados['valido_ate']) ? $dados['valido_ate'] : null);
    if ($validoAte && strpos($validoAte, '/') !== false) {
        $partes = explode('/', $validoAte);
        if (count($partes) === 3) {
            $validoAte = "{$partes[2]}-{$partes[1]}-{$partes[0]}";
        }
    }
    $ativo = isset($dados['ativo']) ? ((bool)$dados['ativo'] ? 1 : 0) : 1;
    $status = $ativo ? 'DISPONIVEL' : 'INATIVO';

    try {
        $stmt = $pdo->prepare("
            INSERT INTO cupons (codigo, tipo, valor, descricao, valido_ate, ativo, status)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                tipo = VALUES(tipo),
                valor = VALUES(valor),
                descricao = VALUES(descricao),
                valido_ate = VALUES(valido_ate),
                ativo = VALUES(ativo),
                status = VALUES(status)
        ");
        $stmt->execute([$codigo, $tipo, $valor, $descricao, $validoAte, $ativo, $status]);

        echo json_encode([
            'sucesso' => true,
            'mensagem' => "Cupom {$codigo} salvo no banco com sucesso.",
            'cupom' => [
                'codigo' => $codigo,
                'tipo' => $tipo,
                'valor' => $valor,
                'descricao' => $descricao,
                'valido_ate' => $validoAte,
                'ativo' => $ativo
            ]
        ], JSON_UNESCAPED_UNICODE);
        exit;
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode([
            'sucesso' => false,
            'mensagem' => 'Erro ao salvar cupom no banco: ' . $e->getMessage()
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
}
