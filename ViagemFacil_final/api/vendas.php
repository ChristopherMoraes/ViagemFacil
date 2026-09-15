<?php

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

require_once __DIR__ . '/conexao.php';

$pdo = obterConexao();

if (!$pdo) {
    http_response_code(500);
    echo json_encode([
        'sucesso' => false,
        'mensagem' => 'Erro ao conectar com o banco de dados.'
    ]);
    exit;
}

// Se a requisição for POST, grava uma nova venda vinda do Totem
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $conteudo = file_get_contents('php://input');
    $dados = json_decode($conteudo, true);

    if (!$dados) {
        http_response_code(400);
        echo json_encode([
            'sucesso' => false,
            'mensagem' => 'Dados de venda inválidos ou JSON vazio.'
        ]);
        exit;
    }

    try {
        $pdo->beginTransaction();

        //Passageiro: busca por CPF ou insere novo
        $passInfo = $dados['passageiro'] ?? ($dados['passenger'] ?? []);
        $nomePassageiro = $passInfo['nomeCompleto'] ?? ($passInfo['fullName'] ?? ($dados['nomePassageiro'] ?? 'Passageiro'));
        $cpfPassageiro = $passInfo['cpf'] ?? ($dados['cpfPassageiro'] ?? '000.000.000-00');
        $telefonePassageiro = $passInfo['telefone'] ?? ($passInfo['phone'] ?? ($dados['telefonePassageiro'] ?? ''));
        $emailPassageiro = $passInfo['email'] ?? ($dados['emailPassageiro'] ?? '');

        $stmtPass = $pdo->prepare("SELECT id FROM passageiros WHERE cpf = ? LIMIT 1");
        $stmtPass->execute([$cpfPassageiro]);
        $passId = $stmtPass->fetchColumn();

        if (!$passId) {
            $stmtInsPass = $pdo->prepare("
                INSERT INTO passageiros (nome_completo, cpf, telefone, email, criado_em)
                VALUES (?, ?, ?, ?, NOW())
            ");
            $stmtInsPass->execute([$nomePassageiro, $cpfPassageiro, $telefonePassageiro, $emailPassageiro]);
            $passId = $pdo->lastInsertId();
        } else {
            $stmtUpPass = $pdo->prepare("
                UPDATE passageiros 
                SET nome_completo = ?, telefone = ?, email = ?
                WHERE id = ?
            ");
            $stmtUpPass->execute([$nomePassageiro, $telefonePassageiro, $emailPassageiro, $passId]);
        }

        //Horário da viagem
        $horarioId = 1;
        if (!empty($dados['horarioId'])) {
            $horarioId = (int)$dados['horarioId'];
        } elseif (!empty($dados['horario_id'])) {
            $horarioId = (int)$dados['horario_id'];
        } elseif (!empty($dados['origem']['name']) || !empty($dados['origin']['name'])) {
            $nomeOrigem = $dados['origem']['name'] ?? ($dados['origin']['name'] ?? '');
            $nomeDestino = $dados['destino']['name'] ?? ($dados['destination']['name'] ?? '');
            $stmtHorario = $pdo->prepare("
                SELECT h.id 
                FROM horarios h
                JOIN rotas r ON r.id = h.rota_id
                JOIN cidades c_orig ON c_orig.id = r.cidade_origem_id
                JOIN cidades c_dest ON c_dest.id = r.cidade_destino_id
                WHERE c_orig.nome LIKE ? AND c_dest.nome LIKE ?
                LIMIT 1
            ");
            $stmtHorario->execute(['%' . $nomeOrigem . '%', '%' . $nomeDestino . '%']);
            $hEncontrado = $stmtHorario->fetchColumn();
            if ($hEncontrado) {
                $horarioId = (int)$hEncontrado;
            }
        }

        //Cupom e Desconto
        $cupomId = null;
        $desconto = 0.00;
        $cupomInfo = $dados['cupom'] ?? ($dados['coupon'] ?? null);

        if (!empty($cupomInfo)) {
            $desconto = (float)($cupomInfo['discount'] ?? ($cupomInfo['desconto'] ?? ($cupomInfo['discountValue'] ?? 0.00)));
            $codigoCupom = trim($cupomInfo['code'] ?? ($cupomInfo['codigo'] ?? ''));
            if ($codigoCupom) {
                $stmtCupom = $pdo->prepare("SELECT id FROM cupons WHERE codigo = ? LIMIT 1");
                $stmtCupom->execute([$codigoCupom]);
                $cId = $stmtCupom->fetchColumn();
                if ($cId) {
                    $cupomId = (int)$cId;
                    $pdo->prepare("UPDATE cupons SET usos_realizados = usos_realizados + 1 WHERE id = ?")->execute([$cupomId]);
                }
            }
        }

        //Venda
        $localizador = $dados['localizador'] ?? ($dados['locator'] ?? ('TTM-' . rand(100000, 999999)));
        $dataViagem = !empty($dados['dataViagem']) ? $dados['dataViagem'] : (!empty($dados['date']) ? $dados['date'] : date('Y-m-d'));
        $total = (float)($dados['valorTotal'] ?? ($dados['totalPaid'] ?? 0.00));
        $totemId = 4; // Totem #04 Terminal Tietê

        $stmtVenda = $pdo->prepare("
            INSERT INTO vendas (localizador, passageiro_id, horario_id, data_viagem, cupom_id, desconto, total, totem_id, situacao, criado_em)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'CONCLUIDA', NOW())
        ");
        $stmtVenda->execute([$localizador, $passId, $horarioId, $dataViagem, $cupomId, $desconto, $total, $totemId]);
        $vendaId = $pdo->lastInsertId();

        //Poltronas (itens_venda)
        $poltronas = [];
        $listaPoltronasObj = $dados['poltronas'] ?? ($dados['seatObjects'] ?? []);
        $listaPoltronasTexto = $dados['poltronasTexto'] ?? ($dados['seats'] ?? []);

        if (!empty($listaPoltronasObj) && is_array($listaPoltronasObj)) {
            foreach ($listaPoltronasObj as $s) {
                $poltronas[] = [
                    'numero' => (int)($s['number'] ?? ($s['numero'] ?? 1)),
                    'tipo' => $s['type'] ?? ($s['tipo'] ?? 'Semi-Leito'),
                    'andar' => (int)($s['deck'] ?? ($s['andar'] ?? 1)),
                    'preco' => (float)($s['price'] ?? ($s['preco'] ?? ($total / count($listaPoltronasObj))))
                ];
            }
        } elseif (!empty($listaPoltronasTexto)) {
            $lista = is_array($listaPoltronasTexto) ? $listaPoltronasTexto : explode(',', $listaPoltronasTexto);
            $precoUnit = count($lista) > 0 ? ($total / count($lista)) : $total;
            foreach ($lista as $num) {
                $poltronas[] = [
                    'numero' => (int)trim($num),
                    'tipo' => 'Semi-Leito',
                    'andar' => 1,
                    'preco' => $precoUnit
                ];
            }
        }

        $stmtItem = $pdo->prepare("
            INSERT INTO itens_venda (venda_id, poltrona_numero, andar, tipo_poltrona, preco_unitario, nome_passageiro, cpf_passageiro)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ");
        $passAdicionais = $dados['passageirosAdicionais'] ?? ($dados['additionalPassengers'] ?? []);
        foreach ($poltronas as $idxPoltrona => $p) {
            $nomePoltrona = $nomePassageiro;
            $cpfPoltrona = $cpfPassageiro;

            if ($idxPoltrona > 0 && !empty($passAdicionais[$idxPoltrona - 1])) {
                $pAdicional = $passAdicionais[$idxPoltrona - 1];
                if (!empty($pAdicional['nomeCompleto'])) {
                    $nomePoltrona = trim($pAdicional['nomeCompleto']);
                }
                if (!empty($pAdicional['cpf'])) {
                    $cpfPoltrona = trim($pAdicional['cpf']);
                }
            }

            $stmtItem->execute([$vendaId, $p['numero'], $p['andar'], $p['tipo'], $p['preco'], $nomePoltrona, $cpfPoltrona]);
        }

        // Cadastro complementar de passageiros adicionais na tabela passageiros
        if (!empty($passAdicionais) && is_array($passAdicionais)) {
            foreach ($passAdicionais as $pAdic) {
                $nomeAdic = trim($pAdic['nomeCompleto'] ?? '');
                $cpfAdic = trim($pAdic['cpf'] ?? '');
                if (!empty($cpfAdic)) {
                    $stmtCheck = $pdo->prepare("SELECT id FROM passageiros WHERE cpf = ? LIMIT 1");
                    $stmtCheck->execute([$cpfAdic]);
                    $existe = $stmtCheck->fetchColumn();
                    if (!$existe) {
                        $stmtInsAdic = $pdo->prepare("
                            INSERT INTO passageiros (nome_completo, cpf, criado_em)
                            VALUES (?, ?, NOW())
                        ");
                        $stmtInsAdic->execute([$nomeAdic ?: 'Passageiro Adicional', $cpfAdic]);
                    }
                }
            }
        }

        //Serviços Adicionais (servicos_venda)
        $servicosContratados = $dados['servicos'] ?? [];
        if (!empty($servicosContratados) && is_array($servicosContratados)) {
            $stmtBuscaServico = $pdo->prepare("SELECT id, preco FROM servicos WHERE id = ? OR codigo = ? LIMIT 1");
            $stmtItemServico = $pdo->prepare("
                INSERT INTO servicos_venda (venda_id, servico_id, preco)
                VALUES (?, ?, ?)
            ");

            foreach ($servicosContratados as $servItem) {
                $idOuCodigo = is_array($servItem) ? ($servItem['codigo'] ?? ($servItem['id'] ?? '')) : $servItem;
                $precoServico = is_array($servItem) ? (float)($servItem['preco'] ?? 0.00) : null;

                if (!empty($idOuCodigo)) {
                    $idNum = is_numeric($idOuCodigo) ? (int)$idOuCodigo : 0;
                    $stmtBuscaServico->execute([$idNum, (string)$idOuCodigo]);
                    $servDb = $stmtBuscaServico->fetch(PDO::FETCH_ASSOC);

                    if ($servDb) {
                        $sId = (int)$servDb['id'];
                        $sPreco = ($precoServico !== null && $precoServico > 0) ? $precoServico : (float)$servDb['preco'];
                        $stmtItemServico->execute([$vendaId, $sId, $sPreco]);
                    }
                }
            }
        }

        //Pagamento
        $metodoOriginal = strtoupper($dados['metodoPagamento'] ?? ($dados['paymentMethod'] ?? 'PIX'));
        if (strpos($metodoOriginal, 'CRED') !== false) {
            $metodoDb = 'CREDITO';
        } elseif (strpos($metodoOriginal, 'DEB') !== false) {
            $metodoDb = 'DEBITO';
        } else {
            $metodoDb = 'PIX';
        }

        $parcelas = (int)($dados['parcelas'] ?? ($dados['installments'] ?? 1));
        $transacaoId = $dados['idTransacao'] ?? ($dados['transactionId'] ?? ('TX-' . time()));
        $authCode = $dados['codigoAutorizacao'] ?? ($dados['authCode'] ?? ('AUTH-' . rand(100000, 999999)));
        $idMercadoPago = null;
        if (strpos($transacaoId, 'MP-') === 0) {
            $idMercadoPago = substr($transacaoId, 3);
        } elseif (!empty($dados['idMercadoPago'])) {
            $idMercadoPago = $dados['idMercadoPago'];
        } elseif (!empty($dados['id_mercadopago'])) {
            $idMercadoPago = $dados['id_mercadopago'];
        }

        $stmtPag = $pdo->prepare("
            INSERT INTO pagamentos (venda_id, localizador, totem_id, metodo, parcelas, valor, id_transacao, codigo_autorizacao, id_mercadopago, situacao, pago_em, criado_em)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'APROVADO', NOW(), NOW())
        ");
        $stmtPag->execute([$vendaId, $localizador, $totemId, $metodoDb, $parcelas, $total, $transacaoId, $authCode, $idMercadoPago]);

        //Atualiza dados do Totem
        $stmtTotem = $pdo->prepare("
            UPDATE totens 
            SET vendas_hoje = vendas_hoje + 1, faturamento_hoje = faturamento_hoje + ?
            WHERE id = ?
        ");
        $stmtTotem->execute([$total, $totemId]);

        $pdo->commit();

        echo json_encode([
            'sucesso' => true,
            'mensagem' => 'Venda registrada com sucesso no banco de dados e refletida no ERP.',
            'venda_id' => $vendaId,
            'localizador' => $localizador
        ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        exit;

    } catch (Exception $e) {
        $pdo->rollBack();
        http_response_code(500);
        echo json_encode([
            'sucesso' => false,
            'mensagem' => 'Erro ao registrar venda: ' . $e->getMessage()
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
}

// Se for GET, consulta dados para o Painel Administrativo e ERP
try {
    //Busca passageiros
    $stmtPassageiros = $pdo->query("
        SELECT 
            id,
            nome_completo AS nome,
            cpf,
            telefone,
            email,
            tipo_documento,
            numero_documento,
            DATE_FORMAT(data_nascimento, '%d/%m/%Y') AS data_nascimento,
            DATE_FORMAT(criado_em, '%d/%m/%Y %H:%i') AS data_criacao
        FROM passageiros 
        ORDER BY id DESC
    ");
    $passageiros = $stmtPassageiros->fetchAll();

    /*captura parametros de filtro via requisicao get*/
    $filtroData = isset($_GET['data']) ? trim($_GET['data']) : '';
    $filtroDataInicio = isset($_GET['data_inicio']) ? trim($_GET['data_inicio']) : '';
    $filtroDataFim = isset($_GET['data_fim']) ? trim($_GET['data_fim']) : '';
    $filtroTotem = isset($_GET['totem']) ? trim($_GET['totem']) : '';
    $filtroPagamento = isset($_GET['forma_pagamento']) ? trim($_GET['forma_pagamento']) : '';
    $tipoBusca = isset($_GET['tipo_busca']) ? trim($_GET['tipo_busca']) : 'nome';
    $termoBusca = isset($_GET['termo_busca']) ? trim($_GET['termo_busca']) : '';
    $ordenarPor = isset($_GET['ordenar_por']) ? trim($_GET['ordenar_por']) : 'data_hora';
    $direcaoOrdem = (isset($_GET['direcao_ordem']) && strtoupper(trim($_GET['direcao_ordem'])) === 'ASC') ? 'ASC' : 'DESC';

    /*montagem parametrizada da clausula where*/
    $condicoes = [];
    $parametros = [];

    if ($filtroDataInicio !== '' && $filtroDataFim !== '') {
        $condicoes[] = "DATE(v.criado_em) >= :data_inicio AND DATE(v.criado_em) <= :data_fim";
        $parametros[':data_inicio'] = $filtroDataInicio;
        $parametros[':data_fim'] = $filtroDataFim;
    } elseif ($filtroDataInicio !== '') {
        $condicoes[] = "DATE(v.criado_em) >= :data_inicio";
        $parametros[':data_inicio'] = $filtroDataInicio;
    } elseif ($filtroDataFim !== '') {
        $condicoes[] = "DATE(v.criado_em) <= :data_fim";
        $parametros[':data_fim'] = $filtroDataFim;
    } elseif ($filtroData !== '') {
        $dataFormatada = (strpos($filtroData, '/') !== false) ? implode('-', array_reverse(explode('/', $filtroData))) : $filtroData;
        $condicoes[] = "DATE(v.criado_em) = :data_criacao";
        $parametros[':data_criacao'] = $dataFormatada;
    }

    if ($filtroTotem !== '' && $filtroTotem !== 'todos') {
        $numeroTotem = (int)preg_replace('/\D/', '', $filtroTotem);
        $condicoes[] = "(t.nome LIKE :totem_nome OR v.totem_id = :totem_id)";
        $parametros[':totem_nome'] = '%' . $filtroTotem . '%';
        $parametros[':totem_id'] = $numeroTotem > 0 ? $numeroTotem : 1;
    }

    if ($filtroPagamento !== '' && $filtroPagamento !== 'todas') {
        $condicoes[] = "UPPER(pag.metodo) = :metodo_pagamento";
        $parametros[':metodo_pagamento'] = strtoupper($filtroPagamento);
    }

    if ($termoBusca !== '') {
        if ($tipoBusca === 'cpf') {
            $cpfLimpo = preg_replace('/\D/', '', $termoBusca);
            $condicoes[] = "(p.cpf LIKE :busca_cpf OR REPLACE(REPLACE(p.cpf, '.', ''), '-', '') LIKE :busca_cpf_limpo)";
            $parametros[':busca_cpf'] = '%' . $termoBusca . '%';
            $parametros[':busca_cpf_limpo'] = '%' . $cpfLimpo . '%';
        } elseif ($tipoBusca === 'localizador') {
            $condicoes[] = "v.localizador LIKE :busca_localizador";
            $parametros[':busca_localizador'] = '%' . $termoBusca . '%';
        } else {
            $condicoes[] = "p.nome_completo LIKE :busca_nome";
            $parametros[':busca_nome'] = '%' . $termoBusca . '%';
        }
    }

    $clausulaOnde = !empty($condicoes) ? ('WHERE ' . implode(' AND ', $condicoes)) : '';

    /*mapeamento seguro das colunas para ordenacao sql*/
    $colunasPermitidas = [
        'data_hora' => 'v.id',
        'passageiro_nome' => 'p.nome_completo',
        'valor_pago' => 'v.total',
        'valor_total' => 'v.total'
    ];
    $colunaOrdenacaoSql = $colunasPermitidas[$ordenarPor] ?? 'v.id';
    $clausulaOrdem = "ORDER BY {$colunaOrdenacaoSql} {$direcaoOrdem}";

    /*execucao da consulta sql com pdo*/
    $queryVendas = "
        SELECT 
            v.id,
            v.localizador AS codigo_venda,
            v.totem_id,
            t.nome AS nome_totem,
            p.id AS passageiro_id,
            p.nome_completo AS passageiro_nome,
            p.cpf AS passageiro_cpf,
            c_orig.nome AS cidade_origem,
            c_dest.nome AS cidade_destino,
            e.nome AS viacao,
            e.comissao_percent,
            v.total AS valor_total,
            v.desconto,
            v.cupom_id,
            cup.codigo AS cupom_codigo,
            v.situacao AS status,
            DATE_FORMAT(v.data_viagem, '%d/%m/%Y') AS data_viagem,
            DATE_FORMAT(v.criado_em, '%d/%m/%Y %H:%i') AS data_hora,
            v.criado_em AS criado_em_iso,
            pag.metodo AS metodo_pagamento,
            pag.situacao AS status_pagamento,
            (
                SELECT GROUP_CONCAT(iv.poltrona_numero SEPARATOR ', ')
                FROM itens_venda iv
                WHERE iv.venda_id = v.id
            ) AS poltronas
        FROM vendas v
        LEFT JOIN totens t ON t.id = v.totem_id
        LEFT JOIN passageiros p ON p.id = v.passageiro_id
        LEFT JOIN cupons cup ON cup.id = v.cupom_id
        LEFT JOIN horarios h ON h.id = v.horario_id
        LEFT JOIN rotas r ON r.id = h.rota_id
        LEFT JOIN cidades c_orig ON c_orig.id = r.cidade_origem_id
        LEFT JOIN cidades c_dest ON c_dest.id = r.cidade_destino_id
        LEFT JOIN empresas e ON e.id = r.empresa_id
        LEFT JOIN pagamentos pag ON pag.venda_id = v.id
        {$clausulaOnde}
        {$clausulaOrdem}
    ";
    $stmtVendas = $pdo->prepare($queryVendas);
    $stmtVendas->execute($parametros);
    $vendas = $stmtVendas->fetchAll();

    //Consolidação dos dados financeiros
    $totalVendas = 0;
    $faturamentoBruto = 0.0;
    $totalComissoes = 0.0;
    $totalDescontos = 0.0;
    $pagamentosPorMetodo = [];
    $vendasPorViacao = [];
    $vendasPorTotem = [];

    // Consolidação de HOJE
    $hojeIso = date('Y-m-d');
    $totalVendasHoje = 0;
    $faturamentoHoje = 0.0;
    $vendasPorTotemHoje = [];

    foreach ($vendas as $v) {
        $valor = (float)$v['valor_total'];
        $desconto = (float)$v['desconto'];
        $taxaComissao = (float)($v['comissao_percent'] ?? 8.50);
        $metodo = $v['metodo_pagamento'] ?? 'OUTRO';
        $viacao = $v['viacao'] ?? 'Viação Padrão';
        $totem = $v['nome_totem'] ?? 'Totem Desconhecido';
        $dataVenda = substr($v['criado_em_iso'] ?? '', 0, 10);

        if ($v['status'] === 'CONCLUIDA') {
            $totalVendas++;
            $faturamentoBruto += $valor;
            $totalComissoes += ($valor * ($taxaComissao / 100));
            $totalDescontos += $desconto;

            // Formas de Pagamento
            if (!isset($pagamentosPorMetodo[$metodo])) {
                $pagamentosPorMetodo[$metodo] = ['quantidade' => 0, 'total' => 0.0];
            }
            $pagamentosPorMetodo[$metodo]['quantidade']++;
            $pagamentosPorMetodo[$metodo]['total'] += $valor;

            // Faturamento por Viação
            if (!isset($vendasPorViacao[$viacao])) {
                $vendasPorViacao[$viacao] = ['quantidade' => 0, 'total' => 0.0];
            }
            $vendasPorViacao[$viacao]['quantidade']++;
            $vendasPorViacao[$viacao]['total'] += $valor;

            // Faturamento por Totem
            if (!isset($vendasPorTotem[$totem])) {
                $vendasPorTotem[$totem] = ['quantidade' => 0, 'total' => 0.0];
            }
            $vendasPorTotem[$totem]['quantidade']++;
            $vendasPorTotem[$totem]['total'] += $valor;

            // Faturamento e vendas de hj
            if ($dataVenda === $hojeIso) {
                $totalVendasHoje++;
                $faturamentoHoje += $valor;
                if (!isset($vendasPorTotemHoje[$totem])) {
                    $vendasPorTotemHoje[$totem] = ['quantidade' => 0, 'total' => 0.0];
                }
                $vendasPorTotemHoje[$totem]['quantidade']++;
                $vendasPorTotemHoje[$totem]['total'] += $valor;
            }
        }
    }

    $ticketMedio = $totalVendas > 0 ? ($faturamentoBruto / $totalVendas) : 0.0;
    $ticketMedioHoje = $totalVendasHoje > 0 ? ($faturamentoHoje / $totalVendasHoje) : 0.0;

    echo json_encode([
        'sucesso' => true,
        'resumo_financeiro' => [
            'total_vendas' => $totalVendas,
            'faturamento_bruto' => round($faturamentoBruto, 2),
            'comissoes' => round($totalComissoes, 2),
            'descontos' => round($totalDescontos, 2),
            'ticket_medio' => round($ticketMedio, 2),
            'por_metodo' => $pagamentosPorMetodo,
            'por_viacao' => $vendasPorViacao,
            'por_totem' => $vendasPorTotem,
            'hoje' => [
                'total_vendas' => $totalVendasHoje,
                'faturamento_bruto' => round($faturamentoHoje, 2),
                'ticket_medio' => round($ticketMedioHoje, 2),
                'por_totem' => $vendasPorTotemHoje
            ]
        ],
        'vendas' => $vendas,
        'passageiros' => $passageiros
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'sucesso' => false,
        'mensagem' => 'Erro ao consultar vendas: ' . $e->getMessage()
    ]);
}
