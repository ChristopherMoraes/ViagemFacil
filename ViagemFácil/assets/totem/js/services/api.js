
// Mapeamento visual das cidades
const ICONES_CIDADES = {
  sp: 'ph ph-buildings',
  rj: 'ph ph-sun',
  cwb: 'ph ph-tree',
  bh: 'ph ph-coffee',
  fln: 'ph ph-waves',
  sts: 'ph ph-compass',
  ssa: 'ph ph-anchor',
  grm: 'ph ph-mountains',
  foz: 'ph ph-drop',
  joa: 'ph ph-sun',
  tag: 'ph ph-buildings'
};

const IMAGENS_CIDADES = {
  sp: './assets/compartilhados/img/sao_paulo.jpg',
  rj: './assets/compartilhados/img/rio_de_janeiro.jpg',
  cwb: './assets/compartilhados/img/curitiba.jpg',
  bh: './assets/compartilhados/img/belo_horizonte.jpg',
  fln: './assets/compartilhados/img/florianopolis.jpg',
  sts: './assets/compartilhados/img/santos.jpg',
  ssa: './assets/compartilhados/img/salvador.jpg',
  grm: './assets/compartilhados/img/gramado.jpg',
  foz: './assets/compartilhados/img/foz_do_iguacu.jpg'
};

// Normaliza data para formato ISO
export const normalizarDataISO = (dataTexto) => {
  if (!dataTexto) return '';
  const textoLimpo = String(dataTexto).trim();
  if (textoLimpo.includes('/')) {
    const partes = textoLimpo.split('/');
    if (partes.length === 3) {
      const dia = partes[0].padStart(2, '0');
      const mes = partes[1].padStart(2, '0');
      const ano = partes[2];
      return `${ano}-${mes}-${dia}`;
    }
  }
  return textoLimpo;
};

// Valida horário de partida futuro
export const validarHorarioPartidaFuturo = (horarioPartida, dataViagem = null) => {
  if (!horarioPartida) return false;

  const agora = new Date();
  const dataHojeStr = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}-${String(agora.getDate()).padStart(2, '0')}`;
  const dataNormalizada = normalizarDataISO(dataViagem);

  if (dataNormalizada && dataNormalizada > dataHojeStr) {
    return true;
  }

  if (dataNormalizada && dataNormalizada < dataHojeStr) {
    return false;
  }

  const minutosAtuais = agora.getHours() * 60 + agora.getMinutes();
  const [hora, minuto] = horarioPartida.split(':').map(Number);
  const minutosPartida = (hora || 0) * 60 + (minuto || 0);

  return minutosPartida > minutosAtuais;
};

// Filtra viagens válidas
export const filtrarViagensDisponiveis = (listaViagens, dataViagem = null) => {
  if (!Array.isArray(listaViagens)) return [];
  return listaViagens.filter(viagem => validarHorarioPartidaFuturo(viagem.departureTime, dataViagem));
};

export const CIDADES_PADRAO = [
  { id: 'sp', idBanco: 1, name: 'São Paulo', state: 'SP', terminal: 'Terminal Rodoviário Tietê', icon: 'ph ph-buildings', tag: 'Metrópole', image: './assets/compartilhados/img/sao_paulo.jpg' },
  { id: 'rj', idBanco: 2, name: 'Rio de Janeiro', state: 'RJ', terminal: 'Terminal Rodoviário Novo Rio', icon: 'ph ph-sun', tag: 'Mais Procurado', image: './assets/compartilhados/img/rio_de_janeiro.jpg' },
  { id: 'cwb', idBanco: 3, name: 'Curitiba', state: 'PR', terminal: 'Rodoferroviária de Curitiba', icon: 'ph ph-tree', tag: 'Capital Ecológica', image: './assets/compartilhados/img/curitiba.jpg' },
  { id: 'bh', idBanco: 4, name: 'Belo Horizonte', state: 'MG', terminal: 'Terminal Rodoviário Israel Pinheiro', icon: 'ph ph-coffee', tag: 'Gastronomia e Cultura', image: './assets/compartilhados/img/belo_horizonte.jpg' },
  { id: 'fln', idBanco: 5, name: 'Florianópolis', state: 'SC', terminal: 'Terminal Rodoviário Rita Maria', icon: 'ph ph-waves', tag: 'Ilha da Magia', image: './assets/compartilhados/img/florianopolis.jpg' },
  { id: 'sts', idBanco: 6, name: 'Santos', state: 'SP', terminal: 'Terminal Rodoviário de Santos', icon: 'ph ph-compass', tag: 'Litoral Paulista', image: './assets/compartilhados/img/santos.jpg' },
  { id: 'ssa', idBanco: 7, name: 'Salvador', state: 'BA', terminal: 'Terminal Rodoviário de Salvador', icon: 'ph ph-anchor', tag: 'História e Praias', image: './assets/compartilhados/img/salvador.jpg' },
  { id: 'grm', idBanco: 8, name: 'Gramado', state: 'RS', terminal: 'Terminal Rodoviário de Gramado', icon: 'ph ph-mountains', tag: 'Serra Gaúcha', image: './assets/compartilhados/img/gramado.jpg' },
  { id: 'foz', idBanco: 9, name: 'Foz do Iguaçu', state: 'PR', terminal: 'Terminal Rodoviário Internacional', icon: 'ph ph-drop', tag: 'Cataratas e Natureza', image: './assets/compartilhados/img/foz_do_iguacu.jpg' }
];

export const SERVICOS_PADRAO = [
  { id: 1, codigo: 'seguro_total', categoria: 'seguranca', titulo: 'Seguro Viagem Plus', descricao: 'Assistência médica hospitalar, farmacêutica e indenização em extravio.', preco: 14.90, icone: 'ph ph-shield-check', selo: 'Mais Recomendado', popular: true, ativo: true },
  { id: 2, codigo: 'bagagem_extra', categoria: 'conforto', titulo: 'Bagagem Adicional (+20kg)', descricao: 'Permite despachar uma mala adicional de até 20kg no bagageiro.', preco: 25.00, icone: 'ph ph-suitcase-simple', selo: null, popular: false, ativo: true },
  { id: 3, codigo: 'sala_vip', categoria: 'conforto', titulo: 'Acesso Sala VIP & Embarque Prioritário', descricao: 'Evite filas no saguão e aguarde com café e ar-condicionado.', preco: 19.90, icone: 'ph ph-sparkle', selo: 'Exclusivo', popular: false, ativo: true },
  { id: 4, codigo: 'pet_cabine', categoria: 'geral', titulo: 'Transporte Pet na Cabine', descricao: 'Leve seu animal de estimação de pequeno porte (até 10kg) com segurança.', preco: 45.00, icone: 'ph ph-paw-print', selo: null, popular: false, ativo: true }
];

// Busca cidades ativas no banco
export const buscarCidadesBanco = async () => {
  try {
    const resp = await fetch('./api/cidades.php');
    if (resp.ok) {
      const json = await resp.json();
      if (json && json.sucesso && Array.isArray(json.cidades) && json.cidades.length > 0) {
        return json.cidades.filter(c => c.ativo !== false).map(c => {
          const sigla = (c.sigla || '').toLowerCase();
          return {
            id: c.sigla || String(c.id),
            idBanco: c.id,
            name: c.nome,
            state: c.estado,
            terminal: c.terminal || `Terminal Rodoviário de ${c.nome}`,
            icon: ICONES_CIDADES[sigla] || 'ph ph-buildings',
            tag: c.etiqueta || 'Destino Popular',
            image: c.imagem || IMAGENS_CIDADES[sigla] || './assets/compartilhados/img/sao_paulo.jpg'
          };
        });
      }
    }
  } catch (e) {
    console.warn('Erro ao carregar cidades do MySQL, utilizando dados padrão:', e);
  }
  return CIDADES_PADRAO;
};

// Busca serviços adicionais no banco
export const buscarServicosBanco = async () => {
  try {
    const resp = await fetch('./api/servicos.php');
    if (resp.ok) {
      const json = await resp.json();
      if (json && json.sucesso && Array.isArray(json.servicos) && json.servicos.length > 0) {
        return json.servicos;
      }
    }
  } catch (e) {
    console.warn('Erro ao carregar serviços do MySQL, utilizando serviços padrão:', e);
  }
  return SERVICOS_PADRAO;
};

// Gerador de viagens de fallback para quando o backend PHP/MySQL não responder (ex: Vercel, GitHub Pages)
export const gerarViagensMock = (idOrigem, idDestino, dataViagem) => {
  const cOrigem = CIDADES_PADRAO.find(c => c.id === idOrigem) || { id: idOrigem, name: 'Origem', state: 'SP', terminal: 'Terminal Rodoviário' };
  const cDestino = CIDADES_PADRAO.find(c => c.id === idDestino) || { id: idDestino, name: 'Destino', state: 'RJ', terminal: 'Terminal Rodoviário' };

  const empresas = [
    { id: 'cometa', name: 'Viação Cometa', logoText: 'COMETA' },
    { id: '1001', name: 'Expresso 1001', logoText: '1001' },
    { id: 'catarinense', name: 'Catarinense', logoText: 'CATARINENSE' },
    { id: 'gontijo', name: 'Viação Gontijo', logoText: 'GONTIJO' }
  ];

  const horarios = [
    { saida: '07:30', chegada: '13:00', duracao: '5h 30m', tipo: 'Double Decker (Leito & Semi-Leito)', preco: 119.90, desc: 139.90, dd: true },
    { saida: '10:15', chegada: '16:00', duracao: '5h 45m', tipo: 'Semi-Leito Panorâmico', preco: 89.90, desc: 99.90, dd: false },
    { saida: '14:00', chegada: '19:30', duracao: '5h 30m', tipo: 'Double Decker (Leito & Semi-Leito)', preco: 129.90, desc: 149.90, dd: true },
    { saida: '18:45', chegada: '00:15', duracao: '5h 30m', tipo: 'Leito Cama VIP', preco: 169.90, desc: 189.90, dd: true },
    { saida: '23:30', chegada: '05:15', duracao: '5h 45m', tipo: 'Double Decker (Leito & Semi-Leito)', preco: 139.90, desc: 159.90, dd: true }
  ];

  const viagens = horarios.map((h, i) => {
    const emp = empresas[i % empresas.length];
    return {
      id: `trip_mock_${idOrigem}_${idDestino}_${i + 1}`,
      rotaId: i + 1,
      horarioId: i + 1,
      company: emp,
      origin: {
        id: cOrigem.id,
        name: cOrigem.name,
        state: cOrigem.state,
        terminal: cOrigem.terminal
      },
      destination: {
        id: cDestino.id,
        name: cDestino.name,
        state: cDestino.state,
        terminal: cDestino.terminal
      },
      date: dataViagem,
      departureTime: h.saida,
      arrivalTime: h.chegada,
      duration: h.duracao,
      busType: h.tipo,
      price: h.preco,
      originalPrice: h.desc,
      isDoubleDecker: h.dd,
      platform: `Plataforma ${String(i * 3 + 2).padStart(2, '0')}`,
      gate: `Portão ${['A', 'B', 'C', 'D'][i % 4]}`,
      amenities: ['Ar Condicionado', 'Wi-Fi 5G', 'Entrada USB', 'Sanitário a Bordo', 'Água Mineral'],
      totalSeats: 48,
      occupiedSeats: [2, 5, 8, 14, 15, 23, 27, 31]
    };
  });

  return filtrarViagensDisponiveis(viagens, dataViagem);
};

// Busca viagens no banco
export const buscarViagensBanco = async (idOrigem, idDestino, dataViagem) => {
  const agora = new Date();
  const dataHojeStr = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}-${String(agora.getDate()).padStart(2, '0')}`;
  const dataNormalizada = normalizarDataISO(dataViagem) || dataHojeStr;

  if (dataNormalizada < dataHojeStr) {
    return [];
  }

  try {
    const url = `./api/rotas.php?origem=${encodeURIComponent(idOrigem)}&destino=${encodeURIComponent(idDestino)}&data=${encodeURIComponent(dataNormalizada)}`;
    const resp = await fetch(url);
    if (resp.ok) {
      const json = await resp.json();
      if (json && json.sucesso && Array.isArray(json.viagens) && json.viagens.length > 0) {
        return filtrarViagensDisponiveis(json.viagens, dataNormalizada);
      }
    }
  } catch (erroBanco) {
    console.warn('Erro ao consultar viagens do banco de dados MySQL via PDO:', erroBanco);
  }

  // Fallback para quando o servidor MySQL/PHP não estiver disponível (ex: Vercel)
  return gerarViagensMock(idOrigem, idDestino, dataNormalizada);
};

export const gerarPoltronasOnibus = (trip) => {
  const seats = [];
  let listaOcupadas = Array.isArray(trip.occupiedSeats) ? [...trip.occupiedSeats] : [];

  // Mescla poltronas do cache local para garantir bloqueio imediato mesmo se offline
  try {
    const chaveAssentos = `poltronas_ocupadas_${trip.origin?.id || ''}_${trip.destination?.id || ''}_${trip.date || ''}_${trip.departureTime || ''}`;
    const ocupadasSalvas = JSON.parse(sessionStorage.getItem(chaveAssentos) || '[]');
    if (Array.isArray(ocupadasSalvas) && ocupadasSalvas.length > 0) {
      listaOcupadas = Array.from(new Set([...listaOcupadas, ...ocupadasSalvas.map(Number)]));
    }
  } catch (e) {

  }
  //Ocupação de poltronas
  const occupiedSet = new Set(listaOcupadas);
  const total = trip.totalSeats || 48;
  let currentSeatNum = 1;

  for (let r = 1; r <= 3; r++) {
    seats.push({
      number: currentSeatNum,
      deck: 1,
      row: r,
      side: 'left',
      position: 'window',
      type: 'Leito Cama',
      priceAddition: 35.00,
      isWindow: true,
      isCorridor: false,
      isPreferential: r === 1,
      isOccupied: occupiedSet.has(currentSeatNum)
    });
    currentSeatNum++;

    seats.push({
      number: currentSeatNum,
      deck: 1,
      row: r,
      side: 'left',
      position: 'corridor',
      type: 'Leito Cama',
      priceAddition: 35.00,
      isWindow: false,
      isCorridor: true,
      isPreferential: r === 1,
      isOccupied: occupiedSet.has(currentSeatNum)
    });
    currentSeatNum++;

    seats.push({
      number: currentSeatNum,
      deck: 1,
      row: r,
      side: 'right',
      position: 'corridor',
      type: 'Leito Cama',
      priceAddition: 35.00,
      isWindow: false,
      isCorridor: true,
      isPreferential: false,
      isOccupied: occupiedSet.has(currentSeatNum)
    });
    currentSeatNum++;

    seats.push({
      number: currentSeatNum,
      deck: 1,
      row: r,
      side: 'right',
      position: 'window',
      type: 'Leito Cama',
      priceAddition: 35.00,
      isWindow: true,
      isCorridor: false,
      isPreferential: false,
      isOccupied: occupiedSet.has(currentSeatNum)
    });
    currentSeatNum++;
  }

  const deck2Total = total - 12;
  const deck2Rows = Math.ceil(deck2Total / 4);

  for (let r = 1; r <= deck2Rows; r++) {
    if (currentSeatNum > total) break;

    seats.push({
      number: currentSeatNum,
      deck: 2,
      row: r,
      side: 'left',
      position: 'window',
      type: 'Semi-Leito',
      priceAddition: 0.00,
      isWindow: true,
      isCorridor: false,
      isPreferential: false,
      isOccupied: occupiedSet.has(currentSeatNum)
    });
    currentSeatNum++;

    if (currentSeatNum <= total) {
      seats.push({
        number: currentSeatNum,
        deck: 2,
        row: r,
        side: 'left',
        position: 'corridor',
        type: 'Semi-Leito',
        priceAddition: 0.00,
        isWindow: false,
        isCorridor: true,
        isPreferential: false,
        isOccupied: occupiedSet.has(currentSeatNum)
      });
      currentSeatNum++;
    }

    if (currentSeatNum <= total) {
      seats.push({
        number: currentSeatNum,
        deck: 2,
        row: r,
        side: 'right',
        position: 'corridor',
        type: 'Semi-Leito',
        priceAddition: 0.00,
        isWindow: false,
        isCorridor: true,
        isPreferential: false,
        isOccupied: occupiedSet.has(currentSeatNum)
      });
      currentSeatNum++;
    }

    if (currentSeatNum <= total) {
      seats.push({
        number: currentSeatNum,
        deck: 2,
        row: r,
        side: 'right',
        position: 'window',
        type: 'Semi-Leito',
        priceAddition: 0.00,
        isWindow: true,
        isCorridor: false,
        isPreferential: false,
        isOccupied: occupiedSet.has(currentSeatNum)
      });
      currentSeatNum++;
    }
  }

  return seats;
};

//cupons
export const obterCuponsUsadosPorCPF = (cpf) => {
  if (!cpf) return [];
  const limparcpf = String(cpf).replace(/\D/g, '');
  if (!limparcpf) return [];
  try {
    const dadosBrutos = localStorage.getItem('totem_passagens_coupons_by_cpf');
    const mapaCupons = dadosBrutos ? JSON.parse(dadosBrutos) : {};
    return mapaCupons[limparcpf] || [];
  } catch (e) {
    return [];
  }
};

export const registrarUsoCupom = (codigo, cpf) => {
  if (!codigo || !cpf) return;
  const limparcpf = String(cpf).replace(/\D/g, '');
  const codigoNormalizado = String(codigo).trim().toUpperCase();
  if (!limparcpf || !codigoNormalizado) return;

  try {
    const dadosBrutos = localStorage.getItem('totem_passagens_coupons_by_cpf');
    const mapaCupons = dadosBrutos ? JSON.parse(dadosBrutos) : {};
    if (!mapaCupons[limparcpf]) {
      mapaCupons[limparcpf] = [];
    }
    if (!mapaCupons[limparcpf].includes(codigoNormalizado)) {
      mapaCupons[limparcpf].push(codigoNormalizado);
    }
    localStorage.setItem('totem_passagens_coupons_by_cpf', JSON.stringify(mapaCupons));
  } catch (e) {
    console.error('Erro ao registrar cupom:', e);
  }
};

// Valida cupom no banco e painel
export const validarCupomDesconto = async (codigo, subtotal, cpf = '') => {
  const codigoNormalizado = (codigo || '').trim().toUpperCase();
  if (!codigoNormalizado) {
    return {
      valid: false,
      message: 'Informe o código do cupom.'
    };
  }

  // Verifica se o CPF informado já utilizou este cupom
  if (cpf) {
    const cuponsUsados = obterCuponsUsadosPorCPF(cpf);
    if (cuponsUsados.includes(codigoNormalizado)) {
      return {
        valid: false,
        message: 'Este cupom já foi utilizado para este CPF.'
      };
    }
  }

  // passo 1 Tenta consultar na API conectada ao Banco de Dados MySQL
  try {
    const respostaApi = await fetch(`api/cupons.php?codigo=${encodeURIComponent(codigoNormalizado)}`);
    if (respostaApi.ok) {
      const dadosApi = await respostaApi.json();
      if (dadosApi && dadosApi.encontrado) {
        if (!dadosApi.sucesso) {
          return {
            valid: false,
            message: dadosApi.mensagem || 'Cupom indisponível no momento.'
          };
        }

        if (dadosApi.cupom) {
          const cupomBanco = dadosApi.cupom;
          const valor = Number(cupomBanco.valor) || 0;
          let valorDesconto = (cupomBanco.tipo === 'percentual' || cupomBanco.tipo === 'percent')
            ? subtotal * (valor / 100)
            : valor;

          valorDesconto = Math.min(valorDesconto, subtotal * 0.5); // Limite de até 50%
          valorDesconto = Math.round(valorDesconto * 100) / 100;

          return {
            valid: true,
            code: codigoNormalizado,
            description: cupomBanco.descricao || `${valor}% de Desconto`,
            discount: valorDesconto
          };
        }
      }
    }
  } catch (erroBanco) {

  }

  //passo2 Consulta as promoções cadastradas no Painel Administrativo (localStorage)
  try {
    const promocoesPainelBrutas = localStorage.getItem('passagens_express_promotions');
    if (promocoesPainelBrutas) {
      const listaPromocoes = JSON.parse(promocoesPainelBrutas);
      const promocaoEncontrada = listaPromocoes.find(p => (p.codigo || '').trim().toUpperCase() === codigoNormalizado);

      if (promocaoEncontrada) {
        if (promocaoEncontrada.ativo === false) {
          return {
            valid: false,
            message: 'Este cupom foi desativado no painel administrativo.'
          };
        }

        if (promocaoEncontrada.validade) {
          const agora = new Date();
          const hojeISO = `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}-${String(agora.getDate()).padStart(2, '0')}`;
          const validadeISO = normalizarDataISO(promocaoEncontrada.validade);
          if (validadeISO && validadeISO < hojeISO) {
            return {
              valid: false,
              message: 'Este cupom já expirou.'
            };
          }
        }

        const porcentagem = Number(promocaoEncontrada.porcentagem) || 10;
        let valorDesconto = subtotal * (porcentagem / 100);
        valorDesconto = Math.min(valorDesconto, subtotal * 0.5);
        valorDesconto = Math.round(valorDesconto * 100) / 100;

        return {
          valid: true,
          code: codigoNormalizado,
          description: promocaoEncontrada.descricao || `${porcentagem}% de Desconto`,
          discount: valorDesconto
        };
      }
    }
  } catch (erroPainel) {
    console.warn('Erro ao consultar promoções do painel administrativo:', erroPainel);
  }

  return {
    valid: false,
    message: 'Cupom inválido ou não cadastrado no banco de dados.'
  };
};

// Exportações de segurança/compatibilidade para evitar falhas de cache no navegador
export const CIDADES = [];
export const CITIES = CIDADES;
export const SERVICOS_ADICIONAIS = [];
export const ADDITIONAL_SERVICES = SERVICOS_ADICIONAIS;
export const EMPRESAS = [];
export const COMPANIES = EMPRESAS;
export const gerarViagens = () => [];
export const generateTrips = gerarViagens;
