<?php
// API de rotas e viagens

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
        'mensagem' => 'Falha na conexão com o banco de dados MySQL via PDO.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// Listar rotas e viagens
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $filtroOrigem = isset($_GET['origem']) ? trim($_GET['origem']) : '';
        $filtroDestino = isset($_GET['destino']) ? trim($_GET['destino']) : '';
        $dataViagem = isset($_GET['data']) ? trim($_GET['data']) : '';
        $apenasAtivas = isset($_GET['todas']) ? false : true;

        $sql = "
            SELECT 
                r.id AS rota_id,
                r.empresa_id,
                e.codigo AS empresa_codigo,
                e.nome AS empresa_nome,
                co.id AS origem_id,
                co.sigla AS origem_sigla,
                co.nome AS origem_nome,
                co.estado AS origem_estado,
                COALESCE(
                    (SELECT t.nome FROM terminais t WHERE t.cidade_id = co.id AND t.ativo = 1 ORDER BY t.id ASC LIMIT 1),
                    CONCAT('Terminal Rodoviário de ', co.nome)
                ) AS origem_terminal,
                cd.id AS destino_id,
                cd.sigla AS destino_sigla,
                cd.nome AS destino_nome,
                cd.estado AS destino_estado,
                COALESCE(
                    (SELECT t.nome FROM terminais t WHERE t.cidade_id = cd.id AND t.ativo = 1 ORDER BY t.id ASC LIMIT 1),
                    CONCAT('Terminal Rodoviário de ', cd.nome)
                ) AS destino_terminal,
                r.plataforma,
                r.portao,
                r.dias_operacao,
                r.situacao AS rota_situacao,
                89.90 AS preco,
                o.id AS onibus_id,
                o.codigo_carro,
                o.placa,
                o.andares,
                o.tipo AS tipo_onibus,
                o.total_poltronas,
                h.id AS horario_id,
                h.hora_saida,
                h.hora_chegada,
                h.duracao
            FROM rotas r
            INNER JOIN empresas e ON r.empresa_id = e.id
            INNER JOIN cidades co ON r.cidade_origem_id = co.id
            INNER JOIN cidades cd ON r.cidade_destino_id = cd.id
            LEFT JOIN onibus o ON r.onibus_id = o.id
            INNER JOIN horarios h ON h.rota_id = r.id
            WHERE 1=1
        ";

        $params = [];

        if ($apenasAtivas) {
            $sql .= " AND r.situacao = 'ATIVO'";
        }

        if ($filtroOrigem !== '') {
            $sql .= " AND (co.id = :origem_id OR LOWER(co.sigla) = :origem_sigla OR LOWER(co.nome) LIKE :origem_nome)";
            $params[':origem_id'] = is_numeric($filtroOrigem) ? (int)$filtroOrigem : 0;
            $params[':origem_sigla'] = strtolower($filtroOrigem);
            $params[':origem_nome'] = '%' . strtolower($filtroOrigem) . '%';
        }

        if ($filtroDestino !== '') {
            $sql .= " AND (cd.id = :destino_id OR LOWER(cd.sigla) = :destino_sigla OR LOWER(cd.nome) LIKE :destino_nome)";
            $params[':destino_id'] = is_numeric($filtroDestino) ? (int)$filtroDestino : 0;
            $params[':destino_sigla'] = strtolower($filtroDestino);
            $params[':destino_nome'] = '%' . strtolower($filtroDestino) . '%';
        }

        $sql .= " ORDER BY co.nome ASC, cd.nome ASC, h.hora_saida ASC";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $linhas = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $rotasFormatadas = [];
        $viagensTotem = [];

        foreach ($linhas as $linha) {
            $rotaId = (int)$linha['rota_id'];
            $horarioId = (int)$linha['horario_id'];
            $preco = isset($linha['preco']) && (float)$linha['preco'] > 0 ? (float)$linha['preco'] : 89.90;
            $precoOriginal = (isset($linha['preco_original']) && $linha['preco_original'] !== null) ? (float)$linha['preco_original'] : round($preco * 1.25, 2);
            $precoLeito = (isset($linha['preco_leito']) && $linha['preco_leito'] !== null) ? (float)$linha['preco_leito'] : round($preco * 1.35, 2);
            $andares = (int)($linha['andares'] ?: 2);
            $isDoubleDecker = ($andares === 2);
            $horaSaidaFormatada = substr($linha['hora_saida'], 0, 5);
            $horaChegadaFormatada = substr($linha['hora_chegada'], 0, 5);

            // Amenidades em array
            $amenidades = [];
            if (!empty($linha['amenidades'])) {
                $amenidades = array_values(array_filter(array_map('trim', explode(',', $linha['amenidades']))));
            }
            if (empty($amenidades)) {
                $amenidades = $isDoubleDecker
                    ? ['1º Andar Leito Cama 180°', '2º Andar Semi-Leito', 'Tomada USB', 'Wi-Fi 5G', 'Sanitário']
                    : ['Ar Condicionado', 'Tomada USB', 'Wi-Fi 5G', 'Sanitário'];
            }

            // Poltronas ocupadas da viagem
            $poltronasOcupadas = [];
            if ($dataViagem !== '') {
                try {
                    $stmtAssentos = $pdo->prepare("
                        SELECT iv.poltrona_numero 
                        FROM itens_venda iv
                        INNER JOIN vendas v ON iv.venda_id = v.id
                        WHERE v.horario_id = :horario_id 
                          AND v.data_viagem = :data_viagem 
                          AND v.situacao != 'CANCELADA'
                    ");
                    $stmtAssentos->execute([
                        ':horario_id' => $horarioId,
                        ':data_viagem' => $dataViagem
                    ]);
                    $assentosBanco = $stmtAssentos->fetchAll(PDO::FETCH_COLUMN);
                    if (!empty($assentosBanco)) {
                        $poltronasOcupadas = array_values(array_unique(array_map('intval', $assentosBanco)));
                    }
                } catch (Exception $eAssentos) {
                    $poltronasOcupadas = [];
                }
            }

            $diasOpArray = !empty($linha['dias_operacao']) 
                ? array_values(array_filter(array_map('trim', explode(',', $linha['dias_operacao'])))) 
                : ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

            // Formatação para o painel administrativo
            $rotasFormatadas[] = [
                'id' => 'route-' . $rotaId . '-' . $horarioId,
                'idBanco' => $rotaId,
                'horarioId' => $horarioId,
                'companyId' => $linha['empresa_codigo'] ?: (string)$linha['empresa_id'],
                'companyName' => $linha['empresa_nome'],
                'origin' => [
                    'id' => $linha['origem_sigla'] ?: (string)$linha['origem_id'],
                    'idBanco' => (int)$linha['origem_id'],
                    'name' => $linha['origem_nome'],
                    'state' => $linha['origem_estado'],
                    'terminal' => $linha['origem_terminal']
                ],
                'destination' => [
                    'id' => $linha['destino_sigla'] ?: (string)$linha['destino_id'],
                    'idBanco' => (int)$linha['destino_id'],
                    'name' => $linha['destino_nome'],
                    'state' => $linha['destino_estado'],
                    'terminal' => $linha['destino_terminal']
                ],
                'departureTime' => $horaSaidaFormatada,
                'arrivalTime' => $horaChegadaFormatada,
                'duration' => $linha['duracao'],
                'platform' => $linha['plataforma'],
                'gate' => $linha['portao'],
                'busId' => $linha['codigo_carro'] ?: 'Carro 4020',
                'licensePlate' => $linha['placa'] ?: 'BRA-2E19',
                'fleetDecks' => $andares,
                'deck1SeatType' => 'Leito Cama VIP (180°)',
                'deck1SeatsCount' => 12,
                'deck1Price' => $precoLeito,
                'deck2SeatType' => 'Semi-Leito Panorâmico (135°)',
                'deck2SeatsCount' => 36,
                'deck2Price' => $preco,
                'singleDeckSeatType' => 'Semi-Leito',
                'singleDeckSeatsCount' => (int)($linha['total_poltronas'] ?: 44),
                'singleDeckPrice' => $preco,
                'busType' => $linha['tipo_onibus'] ?: ($isDoubleDecker ? 'Double Decker (Leito & Semi-Leito)' : 'Semi-Leito (1 Andar)'),
                'basePrice' => $preco,
                'operatingDays' => $diasOpArray,
                'status' => ($linha['rota_situacao'] === 'ATIVO' ? 'ACTIVE' : 'INACTIVE')
            ];

            // Formatação para o totem
            $palavrasEmp = preg_split('/\s+/', trim($linha['empresa_nome']));
            $primeiraPalavra = mb_strtolower($palavrasEmp[0] ?? '');
            if (in_array($primeiraPalavra, ['viação', 'viacao', 'expresso', 'auto', 'empresa']) && isset($palavrasEmp[1])) {
                $marcaTexto = $palavrasEmp[1];
            } else {
                $marcaTexto = $palavrasEmp[0] ?? $linha['empresa_nome'];
            }
            $viagensTotem[] = [
                'id' => 'trip_' . $rotaId . '_' . $horarioId,
                'rotaId' => $rotaId,
                'horarioId' => $horarioId,
                'company' => [
                    'id' => $linha['empresa_codigo'],
                    'name' => $linha['empresa_nome'],
                    'logoText' => mb_strtoupper($marcaTexto)
                ],
                'origin' => [
                    'id' => $linha['origem_sigla'] ?: (string)$linha['origem_id'],
                    'name' => $linha['origem_nome'],
                    'state' => $linha['origem_estado'],
                    'terminal' => $linha['origem_terminal']
                ],
                'destination' => [
                    'id' => $linha['destino_sigla'] ?: (string)$linha['destino_id'],
                    'name' => $linha['destino_nome'],
                    'state' => $linha['destino_estado'],
                    'terminal' => $linha['destino_terminal']
                ],
                'date' => $dataViagem ?: date('Y-m-d'),
                'departureTime' => $horaSaidaFormatada,
                'arrivalTime' => $horaChegadaFormatada,
                'duration' => $linha['duracao'],
                'busType' => $linha['tipo_onibus'] ?: ($isDoubleDecker ? 'Double Decker (Leito & Semi-Leito)' : 'Semi-Leito'),
                'price' => $preco,
                'originalPrice' => $precoOriginal,
                'isDoubleDecker' => $isDoubleDecker,
                'platform' => $linha['plataforma'],
                'gate' => $linha['portao'],
                'amenities' => $amenidades,
                'totalSeats' => (int)($linha['total_poltronas'] ?: 48),
                'occupiedSeats' => $poltronasOcupadas
            ];
        }

        echo json_encode([
            'sucesso' => true,
            'total' => count($linhas),
            'rotas' => $rotasFormatadas,
            'viagens' => $viagensTotem
        ], JSON_UNESCAPED_UNICODE);
        exit;

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode([
            'sucesso' => false,
            'mensagem' => 'Erro ao consultar rotas no banco de dados via PDO: ' . $e->getMessage()
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
}

// Ações de gerenciamento de rotas (POST)
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $entrada = file_get_contents('php://input');
    $dados = json_decode($entrada, true);

    if (!$dados) {
        $dados = $_POST;
    }

    $acao = isset($dados['acao']) ? trim($dados['acao']) : 'salvar';

    // Alternar status ativo/inativo
    if ($acao === 'alternar_status') {
        $rotaId = isset($dados['id']) ? (int)$dados['id'] : (isset($dados['idBanco']) ? (int)$dados['idBanco'] : 0);
        if ($rotaId <= 0) {
            echo json_encode(['sucesso' => false, 'mensagem' => 'Identificador da rota inválido.'], JSON_UNESCAPED_UNICODE);
            exit;
        }

        try {
            $stmt = $pdo->prepare("UPDATE rotas SET situacao = CASE WHEN situacao = 'ATIVO' THEN 'INATIVO' ELSE 'ATIVO' END WHERE id = ?");
            $stmt->execute([$rotaId]);

            echo json_encode([
                'sucesso' => true,
                'mensagem' => 'Status da rota alternado com sucesso.'
            ], JSON_UNESCAPED_UNICODE);
            exit;
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['sucesso' => false, 'mensagem' => 'Erro ao alternar status da rota: ' . $e->getMessage()], JSON_UNESCAPED_UNICODE);
            exit;
        }
    }

    // Excluir rota
    if ($acao === 'excluir') {
        $rotaId = isset($dados['id']) ? (int)$dados['id'] : (isset($dados['idBanco']) ? (int)$dados['idBanco'] : 0);
        if ($rotaId <= 0 && isset($dados['id']) && strpos($dados['id'], 'route-') === 0) {
            $partesId = explode('-', str_replace('route-', '', $dados['id']));
            $rotaId = (int)$partesId[0];
        }

        if ($rotaId <= 0) {
            echo json_encode(['sucesso' => false, 'mensagem' => 'Identificador da rota inválido para exclusão.'], JSON_UNESCAPED_UNICODE);
            exit;
        }

        try {
            // Remove rota no banco
            $stmt = $pdo->prepare("DELETE FROM rotas WHERE id = ?");
            $stmt->execute([$rotaId]);

            echo json_encode([
                'sucesso' => true,
                'mensagem' => 'Rota removida com sucesso do banco de dados.'
            ], JSON_UNESCAPED_UNICODE);
            exit;
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['sucesso' => false, 'mensagem' => 'Erro ao excluir rota: ' . $e->getMessage()], JSON_UNESCAPED_UNICODE);
            exit;
        }
    }

    // Salvar ou atualizar rota
    try {
        $origemNome = isset($dados['originCity']) ? trim($dados['originCity']) : '';
        $destinoNome = isset($dados['destCity']) ? trim($dados['destCity']) : '';
        $empresaCodOuId = isset($dados['companyId']) ? trim($dados['companyId']) : '';
        $horaSaida = isset($dados['departureTime']) ? trim($dados['departureTime']) : '08:00';
        $horaChegada = isset($dados['arrivalTime']) ? trim($dados['arrivalTime']) : '14:00';
        $duracao = isset($dados['duration']) ? trim($dados['duration']) : '6h00';
        $plataforma = isset($dados['platform']) ? trim($dados['platform']) : 'Plataforma 12';
        $portao = isset($dados['gate']) ? trim($dados['gate']) : 'Portão A';
        $busId = isset($dados['busId']) ? trim($dados['busId']) : 'Carro 4020';
        $placa = isset($dados['licensePlate']) ? strtoupper(trim($dados['licensePlate'])) : 'BRA-2E19';
        $decks = isset($dados['fleetDecks']) ? (int)$dados['fleetDecks'] : 2;
        $basePrice = isset($dados['basePrice']) ? (float)$dados['basePrice'] : 129.90;
        $deck1Price = isset($dados['deck1Price']) ? (float)$dados['deck1Price'] : ($basePrice * 1.3);
        $deck2Price = isset($dados['deck2Price']) ? (float)$dados['deck2Price'] : $basePrice;
        $singleDeckPrice = isset($dados['singleDeckPrice']) ? (float)$dados['singleDeckPrice'] : $basePrice;
        $busType = isset($dados['busType']) ? trim($dados['busType']) : ($decks === 2 ? 'Double Decker (Leito & Semi-Leito)' : 'Semi-Leito');
        $operatingDays = isset($dados['operatingDays']) && is_array($dados['operatingDays']) 
            ? implode(',', $dados['operatingDays']) 
            : 'Seg,Ter,Qua,Qui,Sex,Sab,Dom';

        if ($origemNome === '' || $destinoNome === '') {
            echo json_encode(['sucesso' => false, 'mensagem' => 'Cidade de origem e destino são obrigatórias.'], JSON_UNESCAPED_UNICODE);
            exit;
        }

        if (strtolower($origemNome) === strtolower($destinoNome)) {
            echo json_encode(['sucesso' => false, 'mensagem' => 'A cidade de origem não pode ser igual à de destino.'], JSON_UNESCAPED_UNICODE);
            exit;
        }

        // Início da transação no banco
        $pdo->beginTransaction();

        // Cidade de origem
        $stmtCidOrigem = $pdo->prepare("SELECT id FROM cidades WHERE LOWER(nome) = LOWER(?) OR LOWER(sigla) = LOWER(?) LIMIT 1");
        $stmtCidOrigem->execute([$origemNome, $origemNome]);
        $origemId = $stmtCidOrigem->fetchColumn();

        if (!$origemId) {
            // Cadastra cidade se não existir
            $siglaOrigem = strtolower(substr(preg_replace('/[^a-zA-Z]/', '', $origemNome), 0, 3));
            $estadoOrigem = isset($dados['originState']) ? strtoupper(trim($dados['originState'])) : 'SP';
            $stmtNovaOrigem = $pdo->prepare("INSERT INTO cidades (sigla, nome, estado, ativo) VALUES (?, ?, ?, 1)");
            $stmtNovaOrigem->execute([$siglaOrigem, $origemNome, $estadoOrigem]);
            $origemId = (int)$pdo->lastInsertId();
        }

        // Cidade de destino
        $stmtCidDestino = $pdo->prepare("SELECT id FROM cidades WHERE LOWER(nome) = LOWER(?) OR LOWER(sigla) = LOWER(?) LIMIT 1");
        $stmtCidDestino->execute([$destinoNome, $destinoNome]);
        $destinoId = $stmtCidDestino->fetchColumn();

        if (!$destinoId) {
            $siglaDestino = strtolower(substr(preg_replace('/[^a-zA-Z]/', '', $destinoNome), 0, 3));
            $estadoDestino = isset($dados['destState']) ? strtoupper(trim($dados['destState'])) : 'RJ';
            $stmtNovaDestino = $pdo->prepare("INSERT INTO cidades (sigla, nome, estado, ativo) VALUES (?, ?, ?, 1)");
            $stmtNovaDestino->execute([$siglaDestino, $destinoNome, $estadoDestino]);
            $destinoId = (int)$pdo->lastInsertId();
        }

        // Empresa de ônibus
        $empresaNomeReq = isset($dados['companyName']) ? trim($dados['companyName']) : '';
        $empresaId = null;
        if ($empresaCodOuId !== '' || $empresaNomeReq !== '') {
            $stmtEmpresa = $pdo->prepare("
                SELECT id FROM empresas 
                WHERE codigo = :cod 
                   OR id = :id 
                   OR LOWER(nome) = LOWER(:nome_exato) 
                   OR LOWER(nome) = LOWER(:nome_req) 
                   OR LOWER(nome) LIKE :like_req 
                   OR LOWER(nome) LIKE :like_cod
                LIMIT 1
            ");
            $likeReq = '%' . strtolower($empresaNomeReq ?: $empresaCodOuId) . '%';
            $likeCod = '%' . strtolower($empresaCodOuId) . '%';
            $stmtEmpresa->execute([
                ':cod' => $empresaCodOuId,
                ':id' => is_numeric($empresaCodOuId) ? (int)$empresaCodOuId : 0,
                ':nome_exato' => $empresaCodOuId,
                ':nome_req' => $empresaNomeReq,
                ':like_req' => $likeReq,
                ':like_cod' => $likeCod
            ]);
            $empresaId = $stmtEmpresa->fetchColumn();
        }

        if (!$empresaId) {
            // Empresa padrão caso não informada
            $empresaId = (int)$pdo->query("SELECT id FROM empresas WHERE situacao = 'ATIVO' ORDER BY id ASC LIMIT 1")->fetchColumn();
            if (!$empresaId) $empresaId = 1;
        }

        // Veículo/Ônibus
        $stmtOnibus = $pdo->prepare("SELECT id FROM onibus WHERE placa = ? LIMIT 1");
        $stmtOnibus->execute([$placa]);
        $onibusId = $stmtOnibus->fetchColumn();

        if (!$onibusId) {
            $stmtNovoOnibus = $pdo->prepare("
                INSERT INTO onibus (empresa_id, codigo_carro, placa, andares, tipo, total_poltronas, situacao)
                VALUES (?, ?, ?, ?, ?, 48, 'ATIVO')
            ");
            $stmtNovoOnibus->execute([$empresaId, $busId, $placa, $decks, $busType]);
            $onibusId = (int)$pdo->lastInsertId();
        } else {
            // Atualiza dados do veículo
            $stmtUpdOnibus = $pdo->prepare("UPDATE onibus SET empresa_id = ?, codigo_carro = ?, andares = ?, tipo = ? WHERE id = ?");
            $stmtUpdOnibus->execute([$empresaId, $busId, $decks, $busType, $onibusId]);
        }

        // Inserção ou atualização de rota
        $idRecebido = isset($dados['idBanco']) ? (int)$dados['idBanco'] : 0;
        if ($idRecebido <= 0 && isset($dados['id']) && is_numeric($dados['id'])) {
            $idRecebido = (int)$dados['id'];
        } elseif ($idRecebido <= 0 && isset($dados['id']) && strpos($dados['id'], 'route-') === 0) {
            $partesId = explode('-', str_replace('route-', '', $dados['id']));
            $idRecebido = (int)$partesId[0];
        }

        $rotaId = 0;
        if ($idRecebido > 0) {
            $stmtVerificaRota = $pdo->prepare("SELECT id FROM rotas WHERE id = ? LIMIT 1");
            $stmtVerificaRota->execute([$idRecebido]);
            if ($stmtVerificaRota->fetchColumn()) {
                $rotaId = $idRecebido;
            }
        }

        if ($rotaId > 0) {
            // Atualiza rota existente
            $stmtUpdRota = $pdo->prepare("
                UPDATE rotas 
                SET empresa_id = ?, onibus_id = ?, cidade_origem_id = ?, cidade_destino_id = ?, 
                    plataforma = ?, portao = ?, dias_operacao = ?, situacao = 'ATIVO'
                WHERE id = ?
            ");
            $stmtUpdRota->execute([
                $empresaId, $onibusId, $origemId, $destinoId,
                $plataforma, $portao, $operatingDays, $rotaId
            ]);
        } else {
            // Insere nova rota
            $stmtInsRota = $pdo->prepare("
                INSERT INTO rotas (empresa_id, onibus_id, cidade_origem_id, cidade_destino_id, plataforma, portao, dias_operacao, situacao)
                VALUES (?, ?, ?, ?, ?, ?, ?, 'ATIVO')
            ");
            $stmtInsRota->execute([
                $empresaId, $onibusId, $origemId, $destinoId,
                $plataforma, $portao, $operatingDays
            ]);
            $rotaId = (int)$pdo->lastInsertId();
        }

        // Tabela de horários
        $precoEfetivo = $decks === 2 ? $deck2Price : $singleDeckPrice;
        $precoLeitoEfetivo = $deck1Price > 0 ? $deck1Price : round($precoEfetivo * 1.35, 2);
        $precoOriginalEfetivo = round($precoEfetivo * 1.25, 2);

        $amenidadesTexto = $decks === 2
            ? '1º Andar Leito Cama 180°,2º Andar Semi-Leito,Tomada USB,Wi-Fi 5G,Sanitário'
            : 'Ar Condicionado,Tomada USB,Wi-Fi 5G,Sanitário';

        // Valida horário existente
        $stmtVerificaHorario = $pdo->prepare("SELECT id FROM horarios WHERE rota_id = ? LIMIT 1");
        $stmtVerificaHorario->execute([$rotaId]);
        $horarioIdExistente = $stmtVerificaHorario->fetchColumn();

        if ($horarioIdExistente) {
            $stmtUpdHorario = $pdo->prepare("
                UPDATE horarios 
                SET hora_saida = ?, hora_chegada = ?, duracao = ?
                WHERE id = ?
            ");
            $stmtUpdHorario->execute([
                $horaSaida, $horaChegada, $duracao,
                $horarioIdExistente
            ]);
        } else {
            $stmtInsHorario = $pdo->prepare("
                INSERT INTO horarios (rota_id, hora_saida, hora_chegada, duracao)
                VALUES (?, ?, ?, ?)
            ");
            $stmtInsHorario->execute([
                $rotaId, $horaSaida, $horaChegada, $duracao
            ]);
        }

        // Confirma transação no banco
        $pdo->commit();

        echo json_encode([
            'sucesso' => true,
            'mensagem' => 'Rota e horários salvos com sucesso no banco de dados via PDO.',
            'rota_id' => $rotaId,
            'id_formatado' => 'route-' . $rotaId
        ], JSON_UNESCAPED_UNICODE);
        exit;

    } catch (PDOException $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        http_response_code(500);
        echo json_encode([
            'sucesso' => false,
            'mensagem' => 'Erro ao salvar rota no banco de dados via PDO: ' . $e->getMessage()
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
}
