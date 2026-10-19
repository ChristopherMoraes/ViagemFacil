<?php
// API de Gestão de Usuários e Autenticação

require_once __DIR__ . '/headers.php';
require_once __DIR__ . '/conexao.php';

$pdo = obterConexaoOuErro();
$metodo = $_SERVER['REQUEST_METHOD'];

// Listagem de usuários
if ($metodo === 'GET') {
    try {
        $stmt = $pdo->query("
            SELECT id, nome, usuario, email, perfil, permissoes, ativo, bloqueado, tentativas, ultimo_acesso, criado_em 
            FROM usuarios 
            ORDER BY id ASC
        ");
        $usuarios = $stmt->fetchAll();

        // Converte JSON de permissões para array
        foreach ($usuarios as &$u) {
            $u['permissoes'] = $u['permissoes'] ? json_decode($u['permissoes'], true) : [];
            $u['ativo'] = (bool)$u['ativo'];
            $u['bloqueado'] = (bool)$u['bloqueado'];
        }

        echo json_encode(['sucesso' => true, 'usuarios' => $usuarios], JSON_UNESCAPED_UNICODE);
    } catch (PDOException $e) {
        echo json_encode(['sucesso' => false, 'mensagem' => 'Erro ao listar usuários.'], JSON_UNESCAPED_UNICODE);
    }
    exit;
}

// Operações de POST (Login, Salvar, Alternar Status e Excluir)
if ($metodo === 'POST') {
    $dados = json_decode(file_get_contents('php://input'), true) ?? $_POST;
    $acao = $dados['acao'] ?? 'salvar';

    // 1. Validação de Login
    if ($acao === 'login') {
        $usuario = trim($dados['usuario'] ?? '');
        $senha = trim($dados['senha'] ?? '');

        if (!$usuario || !$senha) {
            echo json_encode(['sucesso' => false, 'mensagem' => 'Preencha usuário e senha.'], JSON_UNESCAPED_UNICODE);
            exit;
        }

        $stmt = $pdo->prepare("SELECT * FROM usuarios WHERE usuario = ? LIMIT 1");
        $stmt->execute([$usuario]);
        $u = $stmt->fetch();

        if (!$u) {
            echo json_encode(['sucesso' => false, 'mensagem' => 'Usuário ou senha inválidos.'], JSON_UNESCAPED_UNICODE);
            exit;
        }

        if ($u['bloqueado']) {
            echo json_encode(['sucesso' => false, 'mensagem' => 'Conta bloqueada por excesso de tentativas.'], JSON_UNESCAPED_UNICODE);
            exit;
        }

        if (!$u['ativo']) {
            echo json_encode(['sucesso' => false, 'mensagem' => 'Conta inativa. Contate o administrador.'], JSON_UNESCAPED_UNICODE);
            exit;
        }

        if ($u['senha'] !== $senha) {
            $novasTentativas = $u['tentativas'] + 1;
            $bloquear = $novasTentativas >= 5 ? 1 : 0;
            $pdo->prepare("UPDATE usuarios SET tentativas = ?, bloqueado = ? WHERE id = ?")
                ->execute([$novasTentativas, $bloquear, $u['id']]);

            echo json_encode([
                'sucesso' => false, 
                'mensagem' => $bloquear ? 'Conta bloqueada por excesso de tentativas.' : 'Usuário ou senha inválidos.'
            ], JSON_UNESCAPED_UNICODE);
            exit;
        }

        // Sucesso no login: zera tentativas e atualiza último acesso
        $agora = date('Y-m-d H:i:s');
        $pdo->prepare("UPDATE usuarios SET tentativas = 0, ultimo_acesso = ? WHERE id = ?")
            ->execute([$agora, $u['id']]);

        $u['permissoes'] = $u['permissoes'] ? json_decode($u['permissoes'], true) : [];
        unset($u['senha']); // Remove senha da resposta

        echo json_encode([
            'sucesso' => true,
            'mensagem' => 'Login realizado com sucesso.',
            'usuario' => $u
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    // 2. Salvar ou Criar Usuário
    if ($acao === 'salvar') {
        $id = !empty($dados['id']) ? (int)$dados['id'] : null;
        $nome = trim($dados['nome'] ?? '');
        $usuario = trim($dados['usuario'] ?? '');
        $email = trim($dados['email'] ?? '');
        $senha = trim($dados['senha'] ?? '');
        $perfil = trim($dados['perfil'] ?? 'OPERADOR');
        $permissoes = isset($dados['permissoes']) ? json_encode($dados['permissoes']) : '[]';

        if (!$nome || !$usuario || !$email) {
            echo json_encode(['sucesso' => false, 'mensagem' => 'Preencha todos os campos obrigatórios.'], JSON_UNESCAPED_UNICODE);
            exit;
        }

        try {
            if ($id) {
                // Atualização
                if (!empty($senha)) {
                    $sql = "UPDATE usuarios SET nome = ?, email = ?, perfil = ?, permissoes = ?, senha = ? WHERE id = ?";
                    $pdo->prepare($sql)->execute([$nome, $email, $perfil, $permissoes, $senha, $id]);
                } else {
                    $sql = "UPDATE usuarios SET nome = ?, email = ?, perfil = ?, permissoes = ? WHERE id = ?";
                    $pdo->prepare($sql)->execute([$nome, $email, $perfil, $permissoes, $id]);
                }
            } else {
                // Criação de novo usuário
                if (empty($senha)) {
                    echo json_encode(['sucesso' => false, 'mensagem' => 'Informe a senha inicial.'], JSON_UNESCAPED_UNICODE);
                    exit;
                }
                $sql = "INSERT INTO usuarios (nome, usuario, email, senha, perfil, permissoes) VALUES (?, ?, ?, ?, ?, ?)";
                $pdo->prepare($sql)->execute([$nome, $usuario, $email, $senha, $perfil, $permissoes]);
            }

            echo json_encode(['sucesso' => true, 'mensagem' => 'Usuário salvo com sucesso.'], JSON_UNESCAPED_UNICODE);
        } catch (PDOException $e) {
            echo json_encode(['sucesso' => false, 'mensagem' => 'Erro ao salvar. Usuário ou e-mail já existente.'], JSON_UNESCAPED_UNICODE);
        }
        exit;
    }

    // 3. Alternar Ativo / Inativo
    if ($acao === 'alternar_status') {
        $id = (int)($dados['id'] ?? 0);
        if ($id) {
            $pdo->prepare("UPDATE usuarios SET ativo = NOT ativo WHERE id = ?")->execute([$id]);
            echo json_encode(['sucesso' => true, 'mensagem' => 'Status alterado com sucesso.'], JSON_UNESCAPED_UNICODE);
            exit;
        }
    }

    // 4. Desbloquear Conta
    if ($acao === 'desbloquear') {
        $id = (int)($dados['id'] ?? 0);
        if ($id) {
            $pdo->prepare("UPDATE usuarios SET bloqueado = 0, tentativas = 0 WHERE id = ?")->execute([$id]);
            echo json_encode(['sucesso' => true, 'mensagem' => 'Conta desbloqueada com sucesso.'], JSON_UNESCAPED_UNICODE);
            exit;
        }
    }

    // 5. Excluir Usuário
    if ($acao === 'excluir') {
        $id = (int)($dados['id'] ?? 0);
        if ($id > 1) { // Protege o usuário administrativo principal (id 1)
            $pdo->prepare("DELETE FROM usuarios WHERE id = ?")->execute([$id]);
            echo json_encode(['sucesso' => true, 'mensagem' => 'Usuário excluído com sucesso.'], JSON_UNESCAPED_UNICODE);
            exit;
        } else {
            echo json_encode(['sucesso' => false, 'mensagem' => 'Não é permitido excluir o usuário principal.'], JSON_UNESCAPED_UNICODE);
            exit;
        }
    }
}

echo json_encode(['sucesso' => false, 'mensagem' => 'Requisição inválida.'], JSON_UNESCAPED_UNICODE);
