
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

// Busca cidades ativas no banco
export const buscarCidadesBanco = async () => {
  try {
    const resp = await fetch('./api/cidades.php');
    if (!resp.ok) return [];
    const json = await resp.json();
    if (json && json.sucesso && Array.isArray(json.cidades)) {
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
  } catch (e) {
    console.warn('Erro ao carregar cidades do MySQL:', e);
  }
  return [];
};

// Busca serviços adicionais no banco
export const buscarServicosBanco = async () => {
  try {
    const resp = await fetch('./api/servicos.php');
    if (!resp.ok) return [];
    const json = await resp.json();
    if (json && json.sucesso && Array.isArray(json.servicos)) {
      return json.servicos;
    }
  } catch (e) {
    console.warn('Erro ao carregar serviços do MySQL:', e);
  }
  return [];
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
      if (json && json.sucesso && Array.isArray(json.viagens)) {
        return filtrarViagensDisponiveis(json.viagens, dataNormalizada);
      }
    }
  } catch (erroBanco) {
    console.warn('Erro ao consultar viagens do banco de dados MySQL via PDO:', erroBanco);
  }

  return [];
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
