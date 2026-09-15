<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once __DIR__ . '/conexao.php';
$pdo = obterConexao();

if (!$pdo) {
    http_response_code(500);
    echo json_encode(['sucesso' => false, 'mensagem' => 'Erro na conexão com o banco de dados.']);
    exit;
}

// Consulta totens e faturamento de hoje
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $id = isset($_GET['id']) ? (int)$_GET['id'] : null;
    $nome = isset($_GET['nome']) ? trim($_GET['nome']) : null;

    $baseQuery = "
        SELECT 
            t.id,
            t.nome,
            t.terminal_id,
            t.localizacao,
            t.ip,
            t.serial_impressora,
            t.situacao,
            t.nivel_papel,
            t.leitor_cartao,
            t.sincronizacao_antt,
            t.instalado_em,
            COALESCE(vh.qtd_hoje, 0) AS vendas_hoje,
            COALESCE(vh.total_hoje, 0.00) AS faturamento_hoje
        FROM totens t
        LEFT JOIN (
            SELECT 
                totem_id,
                COUNT(*) AS qtd_hoje,
                SUM(total) AS total_hoje
            FROM vendas
            WHERE DATE(criado_em) = CURDATE()
              AND situacao = 'CONCLUIDA'
            GROUP BY totem_id
        ) vh ON t.id = vh.totem_id
    ";

    // Busca por ID
    if ($id) {
        $stmt = $pdo->prepare($baseQuery . " WHERE t.id = ? LIMIT 1");
        $stmt->execute([$id]);
        $totem = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($totem) {
            echo json_encode(['sucesso' => true, 'totem' => $totem]);
        } else {
            http_response_code(404);
            echo json_encode(['sucesso' => false, 'mensagem' => 'Totem não encontrado.']);
        }
        exit;
    }

    // Busca por nome
    if ($nome) {
        $stmt = $pdo->prepare($baseQuery . " WHERE t.nome LIKE ? LIMIT 1");
        $stmt->execute(['%' . $nome . '%']);
        $totem = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($totem) {
            echo json_encode(['sucesso' => true, 'totem' => $totem]);
        } else {
            http_response_code(404);
            echo json_encode(['sucesso' => false, 'mensagem' => 'Totem não encontrado.']);
        }
        exit;
    }

    // Lista todos os totens
    $stmt = $pdo->query($baseQuery . " ORDER BY t.id ASC");
    $totens = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode(['sucesso' => true, 'totens' => $totens]);
    exit;
}

// Ações de gerenciamento (status e reinício)
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $conteudo = file_get_contents('php://input');
    $dados = json_decode($conteudo, true) ?: $_POST;

    $acao = $dados['acao'] ?? 'alternar_status';
    $totemId = (int)($dados['id'] ?? ($dados['totem_id'] ?? 4));

    // Atualiza situação (ONLINE ou OFFLINE)
    if ($acao === 'alternar_status' || $acao === 'atualizar_status') {
        $situacao = strtoupper(trim($dados['situacao'] ?? ''));
        if (!in_array($situacao, ['ONLINE', 'OFFLINE'])) {
            $situacao = 'OFFLINE';
        }

        $stmt = $pdo->prepare("UPDATE totens SET situacao = ? WHERE id = ?");
        $stmt->execute([$situacao, $totemId]);

        echo json_encode([
            'sucesso' => true,
            'mensagem' => "Situação do Totem #{$totemId} atualizada para {$situacao}.",
            'totem_id' => $totemId,
            'situacao' => $situacao
        ]);
        exit;
    }

    // Simula comando de reinicialização
    if ($acao === 'reiniciar') {
        echo json_encode([
            'sucesso' => true,
            'mensagem' => "Comando de reinicialização enviado para o Totem #{$totemId}.",
            'totem_id' => $totemId
        ]);
        exit;
    }

    echo json_encode(['sucesso' => false, 'mensagem' => 'Ação não reconhecida.']);
    exit;
}
