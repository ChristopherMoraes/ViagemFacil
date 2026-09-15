<?php
// API de Pagamento — Mercado Pago
// Recebe dados do frontend e processa via SDK do Mercado Pago

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once __DIR__ . '/config.php';

// Lê o corpo da requisição
$entrada = json_decode(file_get_contents('php://input'), true);

if (!$entrada) {
    echo json_encode(['sucesso' => false, 'erro' => 'Dados inválidos.']);
    http_response_code(400);
    exit;
}

$acao = $entrada['acao'] ?? '';

switch ($acao) {

    // Pagamento com cartão de crédito/débito
    case 'pagar_cartao':
        processarPagamentoCartao($entrada);
        break;

    // Pagamento via PIX
    case 'pagar_pix':
        processarPagamentoPix($entrada);
        break;

    // Consultar status de pagamento
    case 'consultar':
        consultarPagamento($entrada);
        break;

    // Criar preferência de Checkout Mercado Pago
    case 'criar_preferencia':
        criarPreferenciaCheckout($entrada);
        break;

    default:
        echo json_encode(['sucesso' => false, 'erro' => 'Ação não reconhecida.']);
        http_response_code(400);
        break;
}

// Pagamento com cartão (crédito ou débito)
function processarPagamentoCartao($dados) {
    $token        = $dados['token'] ?? '';
    $valor        = floatval($dados['valor'] ?? 0);
    $parcelas     = intval($dados['parcelas'] ?? 1);
    $descricao    = $dados['descricao'] ?? 'Passagem Rodoviária - Viagem Fácil';
    $email        = $dados['email'] ?? '';
    $cpf          = preg_replace('/\D/', '', $dados['cpf'] ?? '');
    $nome         = $dados['nome'] ?? 'Passageiro';
    $metodo       = $dados['metodo_pagamento'] ?? '';

    if (!$token || $valor <= 0) {
        echo json_encode(['sucesso' => false, 'erro' => 'Token ou valor ausente.']);
        http_response_code(400);
        return;
    }

    $corpo = [
        'transaction_amount' => $valor,
        'token'              => $token,
        'description'        => $descricao,
        'installments'       => $parcelas,
        'payment_method_id'  => $metodo,
        'payer' => [
            'email'          => $email,
            'first_name'     => explode(' ', $nome)[0],
            'last_name'      => implode(' ', array_slice(explode(' ', $nome), 1)) ?: $nome,
            'identification' => [
                'type'   => 'CPF',
                'number' => $cpf
            ]
        ]
    ];

    $resposta = chamarApiMercadoPago('/v1/payments', $corpo);

    if (isset($resposta['id'])) {
        echo json_encode([
            'sucesso'            => true,
            'id_pagamento'       => $resposta['id'],
            'situacao'           => $resposta['status'],
            'detalhe_situacao'   => $resposta['status_detail'] ?? '',
            'id_transacao'       => 'MP-' . $resposta['id'],
            'codigo_autorizacao' => $resposta['authorization_code'] ?? '',
            'metodo'             => $resposta['payment_method_id'] ?? 'cartao',
            'parcelas'           => $resposta['installments'] ?? 1
        ]);
    } else {
        $msg = $resposta['message'] ?? 'Erro ao processar pagamento com cartão.';
        echo json_encode(['sucesso' => false, 'erro' => $msg, 'detalhes' => $resposta]);
        http_response_code(400);
    }
}

// Pagamento via PIX
function processarPagamentoPix($dados) {
    $valor     = floatval($dados['valor'] ?? 0);
    $descricao = $dados['descricao'] ?? 'Passagem Rodoviária - Viagem Fácil';
    $email     = $dados['email'] ?? '';
    $cpf       = preg_replace('/\D/', '', $dados['cpf'] ?? '');
    $nome      = $dados['nome'] ?? 'Passageiro';

    if ($valor <= 0) {
        echo json_encode(['sucesso' => false, 'erro' => 'Valor inválido.']);
        http_response_code(400);
        return;
    }

    $corpo = [
        'transaction_amount' => $valor,
        'description'        => $descricao,
        'payment_method_id'  => 'pix',
        'payer' => [
            'email'          => $email,
            'first_name'     => explode(' ', $nome)[0],
            'last_name'      => implode(' ', array_slice(explode(' ', $nome), 1)) ?: $nome,
            'identification' => [
                'type'   => 'CPF',
                'number' => $cpf
            ]
        ]
    ];

    $resposta = chamarApiMercadoPago('/v1/payments', $corpo);

    if (isset($resposta['id'])) {
        $pix = $resposta['point_of_interaction']['transaction_data'] ?? [];
        echo json_encode([
            'sucesso'          => true,
            'id_pagamento'     => $resposta['id'],
            'situacao'         => $resposta['status'],
            'id_transacao'     => 'PIX-' . $resposta['id'],
            'qr_code'         => $pix['qr_code'] ?? '',
            'qr_code_base64'  => $pix['qr_code_base64'] ?? '',
            'qrcode_base64'   => $pix['qr_code_base64'] ?? '',
            'link_pagamento'  => $pix['ticket_url'] ?? ''
        ]);
    } else {
        $msg = $resposta['message'] ?? 'Erro ao gerar PIX.';
        echo json_encode(['sucesso' => false, 'erro' => $msg, 'detalhes' => $resposta]);
        http_response_code(400);
    }
}

// Consultar status de pagamento
function consultarPagamento($dados) {
    $id = $dados['id_pagamento'] ?? '';
    if (!$id) {
        echo json_encode(['sucesso' => false, 'erro' => 'ID do pagamento ausente.']);
        http_response_code(400);
        return;
    }

    $ch = curl_init('https://api.mercadopago.com/v1/payments/' . $id);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER     => [
            'Authorization: Bearer ' . MP_ACCESS_TOKEN,
            'Content-Type: application/json'
        ]
    ]);
    $resposta = json_decode(curl_exec($ch), true);
    curl_close($ch);

    if (isset($resposta['id'])) {
        echo json_encode([
            'sucesso'  => true,
            'situacao' => $resposta['status'],
            'detalhe'  => $resposta['status_detail'] ?? ''
        ]);
    } else {
        echo json_encode(['sucesso' => false, 'erro' => 'Pagamento não encontrado.']);
    }
}

// Criar preferência de pagamento no Mercado Pago
function criarPreferenciaCheckout($dados) {
    $valor      = floatval($dados['valor'] ?? 35.00);
    $descricao  = $dados['descricao'] ?? 'Passagem Rodoviária - Viagem Fácil';
    $email      = $dados['email'] ?? 'cliente.totem@exemplo.com.br';
    $nome       = $dados['nome'] ?? 'Passageiro';

    $corpo = [
        'items' => [
            [
                'title'       => $descricao,
                'quantity'    => 1,
                'unit_price'  => $valor,
                'currency_id' => 'BRL'
            ]
        ],
        'payer' => [
            'email' => $email,
            'name'  => $nome
        ],
        'back_urls' => [
            'success' => 'https://www.mercadopago.com.br',
            'failure' => 'https://www.mercadopago.com.br',
            'pending' => 'https://www.mercadopago.com.br'
        ],
        'auto_return' => 'approved'
    ];

    $resposta = chamarApiMercadoPago('/checkout/preferences', $corpo);

    if (isset($resposta['id'])) {
        echo json_encode([
            'sucesso'            => true,
            'id_preferencia'     => $resposta['id'],
            'init_point'         => $resposta['init_point'],
            'sandbox_init_point' => $resposta['sandbox_init_point']
        ]);
    } else {
        echo json_encode(['sucesso' => false, 'erro' => $resposta['message'] ?? 'Erro ao criar preferência.', 'detalhes' => $resposta]);
        http_response_code(400);
    }
}

// Função para chamar a API do Mercado Pago
function chamarApiMercadoPago($endpoint, $corpo) {
    $url = 'https://api.mercadopago.com' . $endpoint;

    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST           => true,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_POSTFIELDS     => json_encode($corpo),
        CURLOPT_HTTPHEADER     => [
            'Authorization: Bearer ' . MP_ACCESS_TOKEN,
            'Content-Type: application/json',
            'X-Idempotency-Key: ' . uniqid('vf-', true)
        ]
    ]);

    $resultado = curl_exec($ch);
    $erro = curl_error($ch);
    curl_close($ch);

    if ($erro) {
        return ['message' => 'Erro de conexão: ' . $erro];
    }

    return json_decode($resultado, true) ?: ['message' => 'Resposta inválida do Mercado Pago.'];
}
