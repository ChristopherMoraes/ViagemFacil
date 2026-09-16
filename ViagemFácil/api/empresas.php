<?php
// API de viações de ônibus

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

// Consulta viações cadastradas
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $consulta = $pdo->query("
            SELECT 
                e.id,
                e.codigo,
                e.nome,
                e.razao_social,
                e.cnpj,
                e.telefone,
                e.email,
                e.comissao_percent,
                e.situacao,
                (SELECT COUNT(*) FROM rotas r WHERE r.empresa_id = e.id) AS total_rotas
            FROM empresas e
            ORDER BY e.nome ASC
        ");

        $empresas = $consulta->fetchAll(PDO::FETCH_ASSOC);

        // Normaliza tipos de dados
        foreach ($empresas as &$emp) {
            $emp['id_banco'] = (int)$emp['id'];
            $emp['comissao_percent'] = (float)$emp['comissao_percent'];
            $emp['total_rotas'] = (int)$emp['total_rotas'];
            $emp['ativo'] = ($emp['situacao'] === 'ATIVO');
        }

        echo json_encode([
            'sucesso' => true,
            'empresas' => $empresas
        ], JSON_UNESCAPED_UNICODE);
        exit;
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode([
            'sucesso' => false,
            'mensagem' => 'Erro ao listar empresas: ' . $e->getMessage()
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

    // Remoção ou inativação de viação
    if ($acao === 'excluir') {
        $idOuCodigo = isset($dados['id']) ? trim($dados['id']) : '';
        if ($idOuCodigo === '') {
            echo json_encode(['sucesso' => false, 'mensagem' => 'Identificador da empresa inválido.'], JSON_UNESCAPED_UNICODE);
            exit;
        }

        try {
            // Busca ID numérico da viação
            $stmtBusca = $pdo->prepare("SELECT id, nome FROM empresas WHERE id = ? OR codigo = ? LIMIT 1");
            $stmtBusca->execute([$idOuCodigo, $idOuCodigo]);
            $empresaExistente = $stmtBusca->fetch(PDO::FETCH_ASSOC);

            if (!$empresaExistente) {
                echo json_encode(['sucesso' => false, 'mensagem' => 'Empresa não encontrada no banco.'], JSON_UNESCAPED_UNICODE);
                exit;
            }

            $idEmpresa = (int)$empresaExistente['id'];

            // Valida vínculo com rotas
            $stmtRotas = $pdo->prepare("SELECT COUNT(*) FROM rotas WHERE empresa_id = ?");
            $stmtRotas->execute([$idEmpresa]);
            $totalRotas = (int)$stmtRotas->fetchColumn();

            if ($totalRotas > 0) {
                // Inativa viação preservando histórico
                $stmtInativa = $pdo->prepare("UPDATE empresas SET situacao = 'INATIVO' WHERE id = ?");
                $stmtInativa->execute([$idEmpresa]);

                echo json_encode([
                    'sucesso' => true,
                    'mensagem' => "A empresa possui {$totalRotas} rota(s) vinculada(s). Por segurança, ela foi desativada.",
                    'acao_executada' => 'inativada'
                ], JSON_UNESCAPED_UNICODE);
                exit;
            }

            // Exclui diretamente sem vínculos
            $stmtDelete = $pdo->prepare("DELETE FROM empresas WHERE id = ?");
            $stmtDelete->execute([$idEmpresa]);

            echo json_encode([
                'sucesso' => true,
                'mensagem' => 'Empresa excluída com sucesso do banco de dados.',
                'acao_executada' => 'excluida'
            ], JSON_UNESCAPED_UNICODE);
            exit;
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['sucesso' => false, 'mensagem' => 'Erro ao excluir empresa: ' . $e->getMessage()], JSON_UNESCAPED_UNICODE);
            exit;
        }
    }

    // Cadastro ou edição de viação
    $id = isset($dados['id']) ? trim($dados['id']) : '';
    $nome = isset($dados['nome']) ? trim($dados['nome']) : (isset($dados['name']) ? trim($dados['name']) : '');
    $razaoSocial = isset($dados['razao_social']) ? trim($dados['razao_social']) : (isset($dados['legalName']) ? trim($dados['legalName']) : '');
    $cnpjBruto = isset($dados['cnpj']) ? trim($dados['cnpj']) : '';
    // Mantém apenas números do CNPJ
    $cnpj = preg_replace('/\D/', '', $cnpjBruto);
    $telefone = isset($dados['telefone']) ? trim($dados['telefone']) : (isset($dados['phone']) ? trim($dados['phone']) : '');
    $email = isset($dados['email']) ? trim($dados['email']) : '';
    $comissao = isset($dados['comissao_percent']) ? (float)$dados['comissao_percent'] : (isset($dados['commissionPercent']) ? (float)$dados['commissionPercent'] : 8.50);
    $status = isset($dados['status']) ? strtoupper(trim($dados['status'])) : 'ACTIVE';
    $situacao = ($status === 'ACTIVE' || $status === 'ATIVO') ? 'ATIVO' : 'INATIVO';

    if ($nome === '') {
        echo json_encode([
            'sucesso' => false,
            'mensagem' => 'O nome da empresa é obrigatório.'
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // Valida CNPJ com 14 dígitos
    if (strlen($cnpj) !== 14) {
        echo json_encode([
            'sucesso' => false,
            'mensagem' => 'O CNPJ deve conter exatamente 14 números.'
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // Gera código único para a viação
    $codigo = isset($dados['codigo']) ? trim($dados['codigo']) : '';
    if ($codigo === '') {
        $codigo = strtolower(preg_replace('/[^a-zA-Z0-9]/', '', iconv('UTF-8', 'ASCII//TRANSLIT', $nome)));
        if (strlen($codigo) < 3) {
            $codigo = 'emp_' . rand(100, 999);
        }
    }

    if ($razaoSocial === '') {
        $razaoSocial = $nome . ' S.A.';
    }

    try {
        // Valida se viação já existe
        $stmtExiste = $pdo->prepare("SELECT id FROM empresas WHERE id = ? OR codigo = ? OR cnpj = ? LIMIT 1");
        $stmtExiste->execute([$id, $codigo, $cnpj]);
        $empExistente = $stmtExiste->fetch(PDO::FETCH_ASSOC);

        if ($empExistente) {
            // Atualiza viação existente
            $idAtualizar = (int)$empExistente['id'];
            $stmtUpdate = $pdo->prepare("
                UPDATE empresas 
                SET nome = ?, razao_social = ?, cnpj = ?, telefone = ?, email = ?, comissao_percent = ?, situacao = ?
                WHERE id = ?
            ");
            $stmtUpdate->execute([
                $nome,
                $razaoSocial,
                $cnpj,
                $telefone,
                $email,
                $comissao,
                $situacao,
                $idAtualizar
            ]);

            echo json_encode([
                'sucesso' => true,
                'mensagem' => "Companhia {$nome} atualizada com sucesso no banco de dados.",
                'empresa' => [
                    'id' => $codigo,
                    'id_banco' => $idAtualizar,
                    'codigo' => $codigo,
                    'name' => $nome,
                    'legalName' => $razaoSocial,
                    'cnpj' => $cnpj,
                    'phone' => $telefone,
                    'email' => $email,
                    'commissionPercent' => $comissao,
                    'status' => ($situacao === 'ATIVO' ? 'ACTIVE' : 'INACTIVE')
                ]
            ], JSON_UNESCAPED_UNICODE);
            exit;
        } else {
            // Insere nova viação
            $stmtInsert = $pdo->prepare("
                INSERT INTO empresas (codigo, nome, razao_social, cnpj, telefone, email, comissao_percent, situacao)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $stmtInsert->execute([
                $codigo,
                $nome,
                $razaoSocial,
                $cnpj,
                $telefone,
                $email,
                $comissao,
                $situacao
            ]);

            $novoIdBanco = (int)$pdo->lastInsertId();

            echo json_encode([
                'sucesso' => true,
                'mensagem' => "Companhia {$nome} cadastrada com sucesso no banco de dados.",
                'empresa' => [
                    'id' => $codigo,
                    'id_banco' => $novoIdBanco,
                    'codigo' => $codigo,
                    'name' => $nome,
                    'legalName' => $razaoSocial,
                    'cnpj' => $cnpj,
                    'phone' => $telefone,
                    'email' => $email,
                    'commissionPercent' => $comissao,
                    'status' => ($situacao === 'ATIVO' ? 'ACTIVE' : 'INACTIVE')
                ]
            ], JSON_UNESCAPED_UNICODE);
            exit;
        }
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode([
            'sucesso' => false,
            'mensagem' => 'Erro ao salvar empresa no banco: ' . $e->getMessage()
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
}
