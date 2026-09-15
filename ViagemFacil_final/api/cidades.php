<?php
// API de cidades e terminais

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
        'mensagem' => 'Erro de conexão com o banco de dados.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// Consulta cidades cadastradas
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $consulta = $pdo->query("
            SELECT 
                c.id,
                c.sigla,
                c.nome,
                c.estado,
                c.etiqueta,
                c.imagem,
                c.ativo,
                COALESCE(
                    (SELECT t.nome FROM terminais t WHERE t.cidade_id = c.id AND t.ativo = 1 ORDER BY t.id ASC LIMIT 1),
                    CONCAT('Terminal Rodoviário de ', c.nome)
                ) AS terminal,
                (SELECT COUNT(*) FROM rotas r WHERE r.cidade_origem_id = c.id OR r.cidade_destino_id = c.id) AS total_rotas
            FROM cidades c
            ORDER BY c.nome ASC
        ");

        $cidades = $consulta->fetchAll(PDO::FETCH_ASSOC);

        // Normaliza tipos de dados
        foreach ($cidades as &$cidade) {
            $cidade['id'] = (int)$cidade['id'];
            $cidade['ativo'] = (bool)$cidade['ativo'];
            $cidade['total_rotas'] = (int)$cidade['total_rotas'];
        }

        echo json_encode([
            'sucesso' => true,
            'cidades' => $cidades
        ], JSON_UNESCAPED_UNICODE);
        exit;
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode([
            'sucesso' => false,
            'mensagem' => 'Erro ao listar cidades: ' . $e->getMessage()
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
}

// Operações de cadastro, atualização e remoção
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $entrada = file_get_contents('php://input');
    $dados = json_decode($entrada, true);

    if (!$dados) {
        $dados = $_POST;
    }

    $acao = isset($dados['acao']) ? trim($dados['acao']) : 'salvar';

    // Alterna status ativo/inativo
    if ($acao === 'alternar_status') {
        $cidadeId = isset($dados['id']) ? (int)$dados['id'] : 0;
        if ($cidadeId <= 0) {
            echo json_encode(['sucesso' => false, 'mensagem' => 'Identificador da cidade inválido.'], JSON_UNESCAPED_UNICODE);
            exit;
        }

        try {
            $stmt = $pdo->prepare("UPDATE cidades SET ativo = CASE WHEN ativo = 1 THEN 0 ELSE 1 END WHERE id = ?");
            $stmt->execute([$cidadeId]);

            echo json_encode([
                'sucesso' => true,
                'mensagem' => 'Status da cidade alterado com sucesso.'
            ], JSON_UNESCAPED_UNICODE);
            exit;
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['sucesso' => false, 'mensagem' => 'Erro ao alternar status: ' . $e->getMessage()], JSON_UNESCAPED_UNICODE);
            exit;
        }
    }

    // Exclusão de cidade
    if ($acao === 'excluir') {
        $cidadeId = isset($dados['id']) ? (int)$dados['id'] : 0;
        if ($cidadeId <= 0) {
            echo json_encode(['sucesso' => false, 'mensagem' => 'Identificador da cidade inválido.'], JSON_UNESCAPED_UNICODE);
            exit;
        }

        try {
            // Valida se há rotas vinculadas
            $stmtVerifica = $pdo->prepare("SELECT COUNT(*) FROM rotas WHERE cidade_origem_id = ? OR cidade_destino_id = ?");
            $stmtVerifica->execute([$cidadeId, $cidadeId]);
            $rotasVinculadas = (int)$stmtVerifica->fetchColumn();

            if ($rotasVinculadas > 0) {
                echo json_encode([
                    'sucesso' => false,
                    'mensagem' => "Não é possível excluir esta cidade pois ela possui {$rotasVinculadas} rota(s) vinculada(s). Desative-a ou altere as rotas antes."
                ], JSON_UNESCAPED_UNICODE);
                exit;
            }

            $stmtDel = $pdo->prepare("DELETE FROM cidades WHERE id = ?");
            $stmtDel->execute([$cidadeId]);

            echo json_encode([
                'sucesso' => true,
                'mensagem' => 'Cidade excluída com sucesso.'
            ], JSON_UNESCAPED_UNICODE);
            exit;
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['sucesso' => false, 'mensagem' => 'Erro ao excluir cidade: ' . $e->getMessage()], JSON_UNESCAPED_UNICODE);
            exit;
        }
    }

    // Cadastro ou edição de cidade
    $id = isset($dados['id']) ? (int)$dados['id'] : 0;
    $nome = isset($dados['nome']) ? trim($dados['nome']) : '';
    $estado = isset($dados['estado']) ? strtoupper(trim($dados['estado'])) : '';
    $terminal = isset($dados['terminal']) ? trim($dados['terminal']) : '';
    $sigla = isset($dados['sigla']) ? strtolower(trim($dados['sigla'])) : '';
    $ativo = isset($dados['ativo']) ? ((bool)$dados['ativo'] ? 1 : 0) : 1;

    if ($nome === '' || $estado === '') {
        echo json_encode([
            'sucesso' => false,
            'mensagem' => 'O nome da cidade e o estado (UF) são obrigatórios.'
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // Gera sigla padrão caso não fornecida
    if ($sigla === '') {
        $siglaBase = preg_replace('/[^a-zA-Z]/', '', iconv('UTF-8', 'ASCII//TRANSLIT', $nome));
        $sigla = strtolower(substr($siglaBase, 0, 3));
        if (strlen($sigla) < 2) {
            $sigla = strtolower(substr($estado, 0, 2)) . rand(10, 99);
        }
    }

    if ($terminal === '') {
        $terminal = "Terminal Rodoviário de {$nome}";
    }

    try {
        if ($id > 0) {
            // Atualiza cidade existente
            $stmt = $pdo->prepare("
                UPDATE cidades 
                SET nome = ?, estado = ?, sigla = ?, ativo = ?
                WHERE id = ?
            ");
            $stmt->execute([$nome, $estado, $sigla, $ativo, $id]);

            // Atualiza ou cadastra terminal
            $stmtTerm = $pdo->prepare("SELECT id FROM terminais WHERE cidade_id = ? LIMIT 1");
            $stmtTerm->execute([$id]);
            $terminalExistente = $stmtTerm->fetch();

            if ($terminalExistente) {
                $stmtUpdTerm = $pdo->prepare("UPDATE terminais SET nome = ? WHERE id = ?");
                $stmtUpdTerm->execute([$terminal, $terminalExistente['id']]);
            } else {
                $stmtInsTerm = $pdo->prepare("INSERT INTO terminais (cidade_id, nome, ativo) VALUES (?, ?, 1)");
                $stmtInsTerm->execute([$id, $terminal]);
            }

            echo json_encode([
                'sucesso' => true,
                'mensagem' => 'Cidade atualizada com sucesso no banco de dados.',
                'cidade' => [
                    'id' => $id,
                    'nome' => $nome,
                    'estado' => $estado,
                    'sigla' => $sigla,
                    'terminal' => $terminal,
                    'ativo' => (bool)$ativo
                ]
            ], JSON_UNESCAPED_UNICODE);
            exit;
        } else {
            // Insere nova cidade
            // Garante sigla única
            $stmtVerificaSigla = $pdo->prepare("SELECT COUNT(*) FROM cidades WHERE sigla = ?");
            $stmtVerificaSigla->execute([$sigla]);
            if ((int)$stmtVerificaSigla->fetchColumn() > 0) {
                $sigla = $sigla . rand(1, 99);
            }

            $stmtIns = $pdo->prepare("
                INSERT INTO cidades (sigla, nome, estado, ativo)
                VALUES (?, ?, ?, ?)
            ");
            $stmtIns->execute([$sigla, $nome, $estado, $ativo]);
            $novoId = (int)$pdo->lastInsertId();

            // Insere terminal associado
            $stmtInsTerm = $pdo->prepare("INSERT INTO terminais (cidade_id, nome, ativo) VALUES (?, ?, 1)");
            $stmtInsTerm->execute([$novoId, $terminal]);

            echo json_encode([
                'sucesso' => true,
                'mensagem' => 'Cidade cadastrada com sucesso no banco de dados.',
                'cidade' => [
                    'id' => $novoId,
                    'nome' => $nome,
                    'estado' => $estado,
                    'sigla' => $sigla,
                    'terminal' => $terminal,
                    'ativo' => (bool)$ativo
                ]
            ], JSON_UNESCAPED_UNICODE);
            exit;
        }
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode([
            'sucesso' => false,
            'mensagem' => 'Erro ao salvar cidade: ' . $e->getMessage()
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
}
