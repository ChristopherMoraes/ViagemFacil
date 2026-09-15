<?php
// Serviços adicionais

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

$metodo = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($metodo === 'OPTIONS') {
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

// Listar serviços adicionais
if ($metodo === 'GET') {
    try {
        $iconesPadrao = [
            'seguro_total'   => 'ph ph-shield-check',
            'bagagem_extra'  => 'ph ph-suitcase-simple',
            'kit_lanche'     => 'ph ph-cookie',
            'sala_vip'       => 'ph ph-sparkle',
            'pet_cabine'     => 'ph ph-paw-print',
            'wifi_stream'    => 'ph ph-wifi-high',
            'reembolso_flex' => 'ph ph-arrows-clockwise'
        ];

        $apenasAtivos = !isset($_GET['todos']);
        $sql = "SELECT id, codigo, categoria, titulo, descricao, preco, selo, ativo FROM servicos";
        if ($apenasAtivos) {
            $sql .= " WHERE ativo = 1";
        }
        $sql .= " ORDER BY id ASC";

        $stmt = $pdo->query($sql);
        $linhas = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $servicos = [];
        foreach ($linhas as $s) {
            $icone = $iconesPadrao[$s['codigo']] ?? 'ph ph-sparkle';
            $selo = !empty($s['selo']) ? $s['selo'] : null;
            $servicos[] = [
                'id' => (int)$s['id'],
                'codigo' => $s['codigo'],
                'categoria' => $s['categoria'],
                'titulo' => $s['titulo'],
                'descricao' => $s['descricao'],
                'preco' => (float)$s['preco'],
                'icone' => $icone,
                'selo' => $selo,
                'popular' => ($s['codigo'] === 'seguro_total'),
                'ativo' => (bool)$s['ativo']
            ];
        }

        echo json_encode([
            'sucesso' => true,
            'total' => count($servicos),
            'servicos' => $servicos
        ], JSON_UNESCAPED_UNICODE);
        exit;
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'sucesso' => false,
            'mensagem' => 'Erro ao consultar serviços adicionais: ' . $e->getMessage()
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
}

// Cadastrar serviço adicional
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $conteudo = file_get_contents('php://input');
    $dados = json_decode($conteudo, true);

    if (!$dados || empty($dados['titulo']) || !isset($dados['preco'])) {
        http_response_code(400);
        echo json_encode([
            'sucesso' => false,
            'mensagem' => 'Dados inválidos. Título e preço são obrigatórios.'
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    try {
        $codigo = !empty($dados['codigo']) ? trim($dados['codigo']) : ('serv_' . uniqid());
        $categoria = !empty($dados['categoria']) ? trim($dados['categoria']) : 'geral';
        $titulo = trim($dados['titulo']);
        $descricao = trim($dados['descricao'] ?? '');
        $preco = (float)$dados['preco'];
        $selo = !empty($dados['selo']) ? trim($dados['selo']) : null;
        $ativo = isset($dados['ativo']) ? (int)$dados['ativo'] : 1;

        $stmt = $pdo->prepare("
            INSERT INTO servicos (codigo, categoria, titulo, descricao, preco, selo, ativo)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([$codigo, $categoria, $titulo, $descricao, $preco, $selo, $ativo]);

        echo json_encode([
            'sucesso' => true,
            'mensagem' => 'Serviço adicional cadastrado com sucesso!',
            'id' => (int)$pdo->lastInsertId()
        ], JSON_UNESCAPED_UNICODE);
        exit;
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'sucesso' => false,
            'mensagem' => 'Erro ao cadastrar serviço adicional: ' . $e->getMessage()
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
}
