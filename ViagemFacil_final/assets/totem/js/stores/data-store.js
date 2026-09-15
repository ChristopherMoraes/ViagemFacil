import {
  buscarCidadesBanco,
  buscarServicosBanco,
  buscarViagensBanco,
  filtrarViagensDisponiveis,
  normalizarDataISO,
  gerarPoltronasOnibus,
  validarCupomDesconto,
  registrarUsoCupom
} from '../services/api.js';
import {
  processarPagamentoMock,
  criarPagamentoPix,
  criarPreferenciaMercadoPago
} from '../../../compartilhados/js/mercadopago.js';
import {
  formatCPF,
  formatPhone,
  formatDateMask,
  validateCPF,
  validatePhone,
  validateFullName,
  validateEmail,
  validateBirthDate,
  getTodayDateString
} from '../../../compartilhados/js/formatters.js';
import { playSound, triggerConfetti } from '../../../compartilhados/js/dom.js';

export const criarStoreDados = () => ({
  cidades: [],
  servicosDisponiveis: [],

  origemId: '',
  destinoId: '',
  dataViagem: getTodayDateString(),
  dataRetorno: '',
  tipoViagem: 'somente_ida',
  viagensDisponiveis: [],
  viagemSelecionada: null,
  carregandoViagens: false,

  filtroTipoOnibus: 'todos',
  filtroPeriodo: 'todos',
  ordenarPor: 'partida',

  poltronasOnibus: [],
  assentosSelecionados: [],
  andarAtivo: 1,

  servicosSelecionados: [],

  dadosPassageiro: {
    nomeCompleto: '',
    cpf: '',
    telefone: '',
    email: '',
    dataNascimento: '',
    tipoDocumento: 'RG',
    numeroDocumento: ''
  },

  errosValidacao: {
    nomeCompleto: '',
    cpf: '',
    telefone: '',
    email: '',
    dataNascimento: '',
    termos: ''
  },

  camposInteragidos: {
    nomeCompleto: false,
    cpf: false,
    telefone: false,
    email: false,
    dataNascimento: false
  },

  passageirosAdicionais: [],
  errosAdicionais: [],
  camposInteragidosAdicionais: [],
  termosAceitos: true,

  cupomInput: '',
  cupomAplicado: null,
  erroCupom: '',

  metodoPagamento: '',
  numeroParcelas: 1,
  dadosCartao: {
    numero: '',
    titular: '',
    validade: '',
    cvv: ''
  },
  pixContagemSegundos: 300,
  pixTemporizadorId: null,
  processandoPagamento: false,
  pagamentoConcluido: false,

  dadosBilhete: null,

  async init() {
    this.dataViagem = getTodayDateString();
    this.viagensDisponiveis = [];
    this.viagemSelecionada = null;
    await this.carregarCidades();
    await this.carregarServicos();
  },

  async carregarCidades() {
    try {
      const cidadesBanco = await buscarCidadesBanco();
      if (Array.isArray(cidadesBanco) && cidadesBanco.length > 0) {
        this.cidades = cidadesBanco;
      }
    } catch (e) {
      console.warn('Erro ao sincronizar cidades no totem:', e);
    }
  },

  async carregarServicos() {
    try {
      const servicosBanco = await buscarServicosBanco();
      if (Array.isArray(servicosBanco) && servicosBanco.length > 0) {
        this.servicosDisponiveis = servicosBanco;
      }
    } catch (e) {
      console.warn('Erro ao sincronizar serviços no totem:', e);
    }
  },

  get destinosEmDestaque() {
    const order = ['rj', 'grm', 'cwb', 'foz', 'fln', 'bh', 'sts', 'ssa'];
    return order.map(id => this.cidades.find(c => c.id === id)).filter(Boolean);
  },

  get cidadesDisponiveis() {
    return this.cidades;
  },

  get dataMinimaHoje() {
    return getTodayDateString();
  },

  selecionarDestinoEIniciar(cidadeId) {
    this.redefinirTodosDados();
    this.origemId = 'sp';
    this.destinoId = cidadeId;
    this.dataViagem = getTodayDateString();
    this.buscarViagens();
    if (window.Alpine && window.Alpine.store('app')) {
      window.Alpine.store('app').irParaEtapa(1);
    }
  },

  validarDataViagem() {
    const dataHoje = getTodayDateString();
    const dataNormalizada = normalizarDataISO(this.dataViagem);
    if (dataNormalizada && dataNormalizada < dataHoje) {
      this.dataViagem = dataHoje;
      this.viagensDisponiveis = [];
      if (window.Alpine && window.Alpine.store('app')) {
        window.Alpine.store('app').exibirNotificacaoToast('Datas retroativas não são permitidas. A data foi redefinida para hoje.', 'warning');
      }
      this.buscarViagens();
    } else if (this.origemId && this.destinoId) {
      this.buscarViagens();
    }
  },


  //Executa a busca de viagens disponíveis com base na origem, destino e data informada.

  async buscarViagens() {
    this.viagemSelecionada = null;
    this.assentosSelecionados = [];
    this.poltronasOnibus = [];

    const dataHoje = getTodayDateString();
    const dataNormalizada = normalizarDataISO(this.dataViagem) || dataHoje;

    if (dataNormalizada < dataHoje) {
      this.viagensDisponiveis = [];
      this.dataViagem = dataHoje;
      if (window.Alpine && window.Alpine.store('app')) {
        window.Alpine.store('app').exibirNotificacaoToast('Não é possível buscar viagens para datas retroativas. Ajustado para hoje.', 'warning');
      }
      return;
    }

    if (!this.origemId || !this.destinoId || this.origemId === this.destinoId) {
      this.viagensDisponiveis = [];
      return;
    }

    this.carregandoViagens = true;
    try {
      const viagensBanco = await buscarViagensBanco(this.origemId, this.destinoId, dataNormalizada);
      this.viagensDisponiveis = Array.isArray(viagensBanco) ? viagensBanco : [];
    } catch (e) {
      console.warn('Erro ao consultar viagens do banco de dados:', e);
      this.viagensDisponiveis = [];
    } finally {
      this.carregandoViagens = false;
    }
  },

  inverterCidades() {
    if (!this.origemId && !this.destinoId) return;
    const temp = this.origemId;
    this.origemId = this.destinoId;
    this.destinoId = temp;
    this.buscarViagens();
    if (window.Alpine && window.Alpine.store('app')?.somAtivado) playSound('tap');
  },

  selecionarViagem(viagem) {
    this.viagemSelecionada = viagem;
    this.poltronasOnibus = gerarPoltronasOnibus(viagem);
    this.assentosSelecionados = [];
    this.andarAtivo = 1;
  },


  //Retorna a lista de viagens aplicando os filtros selecionados e descartando horários passados na data de hoje.
  get viagensFiltradas() {
    let listaViagens = [...this.viagensDisponiveis];

    // Remove viagens cujo horário de partida já passou na data de hoje
    const dataNormalizada = normalizarDataISO(this.dataViagem);
    listaViagens = filtrarViagensDisponiveis(listaViagens, dataNormalizada);

    if (this.filtroTipoOnibus !== 'todos' && this.filtroTipoOnibus !== 'all') {
      const termoFiltro = this.filtroTipoOnibus.toLowerCase();
      listaViagens = listaViagens.filter(viagem => {
        const correspondeTipo = viagem.busType.toLowerCase().includes(termoFiltro);
        const correspondeComodidade = viagem.amenities && viagem.amenities.some(item => item.toLowerCase().includes(termoFiltro));
        return correspondeTipo || correspondeComodidade;
      });
    }

    if (this.filtroPeriodo !== 'todos' && this.filtroPeriodo !== 'all') {
      listaViagens = listaViagens.filter(viagem => {
        const horaPartida = parseInt(viagem.departureTime.split(':')[0], 10);
        if (this.filtroPeriodo === 'manha' || this.filtroPeriodo === 'morning') return horaPartida >= 5 && horaPartida < 12;
        if (this.filtroPeriodo === 'tarde' || this.filtroPeriodo === 'afternoon') return horaPartida >= 12 && horaPartida < 18;
        if (this.filtroPeriodo === 'noite' || this.filtroPeriodo === 'night') return horaPartida >= 18 || horaPartida < 5;
        return true;
      });
    }

    if (this.ordenarPor === 'menor_preco' || this.ordenarPor === 'price_asc') {
      listaViagens.sort((a, b) => a.price - b.price);
    } else if (this.ordenarPor === 'maior_preco' || this.ordenarPor === 'price_desc') {
      listaViagens.sort((a, b) => b.price - a.price);
    } else if (this.ordenarPor === 'duracao' || this.ordenarPor === 'duration') {
      listaViagens.sort((a, b) => a.duration.localeCompare(b.duration));
    } else {
      listaViagens.sort((a, b) => a.departureTime.localeCompare(b.departureTime));
    }

    return listaViagens;
  },

  alternarPoltrona(poltrona) {
    if (poltrona.isOccupied) {
      if (window.Alpine && window.Alpine.store('app')?.somAtivado) playSound('warning');
      window.Alpine.store('app')?.exibirNotificacaoToast(`Poltrona ${poltrona.number} já está ocupada.`, 'warning');
      return;
    }

    const idx = this.assentosSelecionados.findIndex(s => s.number === poltrona.number);
    if (idx >= 0) {
      this.assentosSelecionados.splice(idx, 1);
      if (window.Alpine && window.Alpine.store('app')?.somAtivado) playSound('tap');
    } else {
      if (this.assentosSelecionados.length >= 4) {
        if (window.Alpine && window.Alpine.store('app')?.somAtivado) playSound('warning');
        window.Alpine.store('app')?.exibirNotificacaoToast('Limite de até 4 poltronas por compra.', 'info');
        return;
      }
      this.assentosSelecionados.push(poltrona);
      if (window.Alpine && window.Alpine.store('app')?.somAtivado) playSound('select');
    }

    this.sincronizarPassageirosAdicionais();
  },

  poltronaEstaSelecionada(numeroPoltrona) {
    return this.assentosSelecionados.some(s => s.number === numeroPoltrona);
  },

  sincronizarPassageirosAdicionais() {
    const extras = Math.max(0, this.assentosSelecionados.length - 1);
    while (this.passageirosAdicionais.length < extras) {
      this.passageirosAdicionais.push({ nomeCompleto: '', cpf: '' });
      this.errosAdicionais.push({ nomeCompleto: '', cpf: '' });
      this.camposInteragidosAdicionais.push({ nomeCompleto: false, cpf: false });
    }
    while (this.passageirosAdicionais.length > extras) {
      this.passageirosAdicionais.pop();
      this.errosAdicionais.pop();
      this.camposInteragidosAdicionais.pop();
    }
  },

  alternarServico(codigoServico) {
    const idx = this.servicosSelecionados.indexOf(codigoServico);
    if (idx >= 0) {
      this.servicosSelecionados.splice(idx, 1);
    } else {
      this.servicosSelecionados.push(codigoServico);
    }
    if (window.Alpine && window.Alpine.store('app')?.somAtivado) playSound('tap');
  },

  servicoEstaSelecionado(codigoServico) {
    return this.servicosSelecionados.includes(codigoServico);
  },

  marcarCampoInteragido(campo) {
    this.camposInteragidos[campo] = true;
    this.validarCampo(campo);
  },

  validarCampo(campo) {
    if (campo === 'nomeCompleto') {
      const val = this.dadosPassageiro.nomeCompleto || '';
      if (!val.trim()) {
        this.errosValidacao.nomeCompleto = 'Informe o nome completo do passageiro.';
      } else if (!validateFullName(val)) {
        this.errosValidacao.nomeCompleto = 'Digite nome e sobrenome válidos.';
      } else {
        this.errosValidacao.nomeCompleto = '';
      }
    }

    if (campo === 'cpf') {
      const val = this.dadosPassageiro.cpf || '';
      const clean = val.replace(/\D/g, '');
      if (!clean) {
        this.errosValidacao.cpf = 'Informe o CPF do passageiro.';
      } else if (clean.length !== 11) {
        this.errosValidacao.cpf = 'O CPF deve ter 11 dígitos.';
      } else {
        this.errosValidacao.cpf = '';
      }
    }

    if (campo === 'telefone') {
      const val = this.dadosPassageiro.telefone || '';
      const clean = val.replace(/\D/g, '');
      if (!clean) {
        this.errosValidacao.telefone = 'Informe o celular/WhatsApp com DDD.';
      } else if (!validatePhone(val)) {
        this.errosValidacao.telefone = 'Telefone inválido (verifique o DDD e o 9º dígito).';
      } else {
        this.errosValidacao.telefone = '';
      }
    }

    if (campo === 'email') {
      const val = this.dadosPassageiro.email || '';
      if (!val.trim()) {
        this.errosValidacao.email = 'Informe o e-mail para recebimento.';
      } else if (!validateEmail(val)) {
        this.errosValidacao.email = 'Formato de e-mail inválido.';
      } else {
        this.errosValidacao.email = '';
      }
    }

    if (campo === 'dataNascimento') {
      const val = this.dadosPassageiro.dataNascimento || '';
      if (!val) {
        this.errosValidacao.dataNascimento = 'Informe a data de nascimento.';
      } else if (!validateBirthDate(val)) {
        this.errosValidacao.dataNascimento = 'Data de nascimento inválida.';
      } else {
        this.errosValidacao.dataNascimento = '';
      }
    }
  },

  validarPassageiroAdicional(idx, campo) {
    if (!this.passageirosAdicionais[idx]) return;
    const p = this.passageirosAdicionais[idx];
    if (!this.errosAdicionais[idx]) {
      this.errosAdicionais[idx] = { nomeCompleto: '', cpf: '' };
    }

    if (campo === 'nomeCompleto') {
      if (!p.nomeCompleto || !validateFullName(p.nomeCompleto)) {
        this.errosAdicionais[idx].nomeCompleto = 'Informe nome e sobrenome.';
      } else {
        this.errosAdicionais[idx].nomeCompleto = '';
      }
    }

    if (campo === 'cpf') {
      const clean = (p.cpf || '').replace(/\D/g, '');
      if (!clean) {
        this.errosAdicionais[idx].cpf = 'Informe o CPF.';
      } else if (clean.length !== 11) {
        this.errosAdicionais[idx].cpf = 'O CPF deve ter 11 dígitos.';
      } else {
        this.errosAdicionais[idx].cpf = '';
      }
    }
  },

  marcarCampoInteragidoAdicional(idx, campo) {
    if (!this.camposInteragidosAdicionais[idx]) {
      this.camposInteragidosAdicionais[idx] = { nomeCompleto: false, cpf: false };
    }
    this.camposInteragidosAdicionais[idx][campo] = true;
    this.validarPassageiroAdicional(idx, campo);
  },

  validarTodosCamposPassageiro() {
    ['nomeCompleto', 'cpf', 'telefone', 'email', 'dataNascimento'].forEach(f => {
      this.camposInteragidos[f] = true;
      this.validarCampo(f);
    });

    this.passageirosAdicionais.forEach((_, idx) => {
      this.validarPassageiroAdicional(idx, 'nomeCompleto');
      this.validarPassageiroAdicional(idx, 'cpf');
    });

    return this.formularioPassageiroValido;
  },

  get formularioPassageiroValido() {
    if (!validateFullName(this.dadosPassageiro.nomeCompleto)) return false;
    if (!validateCPF(this.dadosPassageiro.cpf)) return false;
    if (!validatePhone(this.dadosPassageiro.telefone)) return false;
    if (!validateEmail(this.dadosPassageiro.email)) return false;
    if (!validateBirthDate(this.dadosPassageiro.dataNascimento)) return false;

    for (const p of this.passageirosAdicionais) {
      if (!validateFullName(p.nomeCompleto)) return false;
      if (!validateCPF(p.cpf)) return false;
    }

    return true;
  },

  processarEntradaNomeCompleto(val) {
    this.dadosPassageiro.nomeCompleto = val;
    if (this.camposInteragidos.nomeCompleto) this.validarCampo('nomeCompleto');
  },

  processarEntradaCpf(val) {
    this.dadosPassageiro.cpf = formatCPF(val);
    if (this.camposInteragidos.cpf || this.dadosPassageiro.cpf.length === 14) this.validarCampo('cpf');
  },

  processarEntradaTelefone(val) {
    this.dadosPassageiro.telefone = formatPhone(val);
    if (this.camposInteragidos.telefone || this.dadosPassageiro.telefone.length >= 14) this.validarCampo('telefone');
  },

  processarEntradaEmail(val) {
    this.dadosPassageiro.email = val.trim();
    if (this.camposInteragidos.email) this.validarCampo('email');
  },

  processarEntradaDataNascimento(val) {
    this.dadosPassageiro.dataNascimento = formatDateMask(val);
    if (this.camposInteragidos.dataNascimento || this.dadosPassageiro.dataNascimento.length === 10) this.validarCampo('dataNascimento');
  },

  processarEntradaNomePassageiroAdicional(idx, val) {
    if (!this.passageirosAdicionais[idx]) return;
    this.passageirosAdicionais[idx].nomeCompleto = val;
    if (this.camposInteragidosAdicionais[idx]?.nomeCompleto || val.trim().length > 0) {
      this.validarPassageiroAdicional(idx, 'nomeCompleto');
    }
  },

  processarEntradaCpfPassageiroAdicional(idx, val) {
    if (!this.passageirosAdicionais[idx]) return;
    this.passageirosAdicionais[idx].cpf = formatCPF(val);
    if (this.camposInteragidosAdicionais[idx]?.cpf || this.passageirosAdicionais[idx].cpf.length === 14) {
      this.validarPassageiroAdicional(idx, 'cpf');
    }
  },

  preencherDadosDemonstracao() {
    this.dadosPassageiro = {
      nomeCompleto: 'Christopher Moraes testes',
      cpf: '123.456.789-09',
      telefone: '(11) 98765-4321',
      email: 'chris.testes@testes.com',
      dataNascimento: '1990-08-15',
      tipoDocumento: 'RG',
      numeroDocumento: '44.890.123-X'
    };
    this.termosAceitos = true;

    if (this.passageirosAdicionais.length > 0) {
      const nomesExemplo = ['Christopher Moraes Testess', 'Christopher Moraes Testesss', 'Christopher Moraes Testessss'];
      const cpfsExemplo = ['123.456.789-09', '123.456.789-09', '123.456.789-09'];
      this.passageirosAdicionais.forEach((p, idx) => {
        p.nomeCompleto = nomesExemplo[idx % nomesExemplo.length];
        p.cpf = cpfsExemplo[idx % cpfsExemplo.length];
      });
    }

    Object.keys(this.errosValidacao).forEach(k => this.errosValidacao[k] = '');
    this.errosAdicionais.forEach(err => {
      err.nomeCompleto = '';
      err.cpf = '';
    });

    if (window.Alpine && window.Alpine.store('app')?.somAtivado) playSound('tap');
    window.Alpine.store('app')?.exibirNotificacaoToast('Dados de demonstração preenchidos.', 'info');
  },

  atualizarCampoFormulario(nomeCampo, val) {
    if (nomeCampo === 'dadosPassageiro.nomeCompleto') this.processarEntradaNomeCompleto(val);
    if (nomeCampo === 'dadosPassageiro.cpf') this.processarEntradaCpf(val);
    if (nomeCampo === 'dadosPassageiro.telefone') this.processarEntradaTelefone(val);
    if (nomeCampo === 'dadosPassageiro.email') this.processarEntradaEmail(val);
    if (nomeCampo === 'dadosPassageiro.dataNascimento') this.processarEntradaDataNascimento(val);

    const matchNomeAdicional = String(nomeCampo).match(/^passageirosAdicionais\[(\d+)\]\.nomeCompleto$/);
    if (matchNomeAdicional) {
      this.processarEntradaNomePassageiroAdicional(parseInt(matchNomeAdicional[1], 10), val);
    }

    const matchCpfAdicional = String(nomeCampo).match(/^passageirosAdicionais\[(\d+)\]\.cpf$/);
    if (matchCpfAdicional) {
      this.processarEntradaCpfPassageiroAdicional(parseInt(matchCpfAdicional[1], 10), val);
    }

    if (nomeCampo === 'cupomInput' || nomeCampo === 'couponInput') {
      this.cupomInput = val.toUpperCase();
      this.erroCupom = '';
    }
    if (nomeCampo === 'dadosCartao.numero' || nomeCampo === 'cardData.number') this.dadosCartao.numero = val;
    if (nomeCampo === 'dadosCartao.titular' || nomeCampo === 'cardData.holder') this.dadosCartao.titular = val.toUpperCase();
    if (nomeCampo === 'dadosCartao.validade' || nomeCampo === 'cardData.expiry') this.dadosCartao.validade = val;
    if (nomeCampo === 'dadosCartao.cvv' || nomeCampo === 'cardData.cvv') this.dadosCartao.cvv = val;
  },

  async aplicarCupom() {
    this.erroCupom = '';
    const codigo = (this.cupomInput || '').trim().toUpperCase();
    if (!codigo) {
      return;
    }

    const cpfAtual = this.dadosPassageiro.cpf || '';
    try {
      const res = await validarCupomDesconto(codigo, this.subtotalPassagens + this.subtotalServicos, cpfAtual);
      if (res && res.valid) {
        this.cupomAplicado = res;
        this.erroCupom = '';
        if (window.Alpine && window.Alpine.store('app')?.somAtivado) {
          playSound('success');
        }
        if (window.Alpine && window.Alpine.store('app')) {
          window.Alpine.store('app').exibirNotificacaoToast(`Cupom ${res.code} aplicado com sucesso!`, 'success');
        }
      } else {
        this.erroCupom = res ? res.message : 'Cupom inválido ou expirado.';
        if (window.Alpine && window.Alpine.store('app')?.somAtivado) {
          playSound('error');
        }
        if (window.Alpine && window.Alpine.store('app')) {
          window.Alpine.store('app').exibirNotificacaoToast(this.erroCupom, 'error');
        }
      }
    } catch (e) {
      this.erroCupom = 'Erro ao validar cupom. Tente novamente.';
    }
  },

  removerCupom() {
    this.cupomAplicado = null;
    this.cupomInput = '';
    this.erroCupom = '';
  },

  get totalPassagens() {
    return this.assentosSelecionados ? this.assentosSelecionados.length : 0;
  },

  get subtotalPassagens() {
    if (!this.viagemSelecionada || !this.assentosSelecionados || this.assentosSelecionados.length === 0) return 0;
    return this.assentosSelecionados.reduce((sum, seat) => {
      const base = Number(this.viagemSelecionada.price) || 0;
      const add = Number(seat.priceAddition) || 0;
      return sum + base + add;
    }, 0);
  },

  get precoTotalPassagens() {
    return this.subtotalPassagens;
  },

  get subtotalServicos() {
    if (!this.servicosSelecionados || !this.servicosDisponiveis) return 0;
    return this.servicosSelecionados.reduce((sum, codigo) => {
      const s = this.servicosDisponiveis.find(item => item.codigo === codigo || item.id === codigo);
      return sum + (s ? Number(s.preco) || 0 : 0);
    }, 0);
  },

  get valorDesconto() {
    if (!this.cupomAplicado) return 0;
    return Number(this.cupomAplicado.discount) || 0;
  },

  get valorTotal() {
    const total = (this.subtotalPassagens + this.subtotalServicos) - this.valorDesconto;
    return Math.max(0, total);
  },

  get parcelasOpcoes() {
    const total = this.valorTotal || 0;
    const opcoes = [];
    const maxParcelas = 6;
    for (let i = 1; i <= maxParcelas; i++) {
      const valorParcela = total > 0 ? (total / i) : 0;
      opcoes.push({
        numero: i,
        valorParcela: valorParcela,
        textoParcela: `${i}x de ${window.formatCurrency ? window.formatCurrency(valorParcela) : 'R$ ' + valorParcela.toFixed(2)}`,
        textoCurto: `${i}x`,
        rotulo: i === 1 ? 'À vista' : 'Sem juros'
      });
    }
    return opcoes;
  },

  get resumoParcelaSelecionada() {
    if (this.metodoPagamento !== 'credit' && this.metodoPagamento !== 'credito') return null;
    const n = Math.max(1, Math.min(6, this.numeroParcelas || 1));
    const total = this.valorTotal || 0;
    const valorParcela = total / n;
    const fmt = window.formatCurrency ? window.formatCurrency(valorParcela) : 'R$ ' + valorParcela.toFixed(2);
    return {
      numero: n,
      valorParcela: valorParcela,
      textoFormatado: n === 1 ? `1x de ${fmt} (À vista)` : `${n}x de ${fmt} sem juros`
    };
  },

  async finalizarPagamento() {
    if (!this.metodoPagamento) {
      if (window.Alpine && window.Alpine.store('app')) {
        window.Alpine.store('app').adicionarNotificacao('Por favor, selecione uma forma de pagamento (PIX, Crédito ou Débito).', 'warning');
      }
      return;
    }
    this.processandoPagamento = true;
    if (window.Alpine && window.Alpine.store('app')?.somAtivado) playSound('tap');

    const infoPassageiro = {
      nome: this.dadosPassageiro.nomeCompleto,
      cpf: this.dadosPassageiro.cpf,
      email: this.dadosPassageiro.email
    };

    try {
      let resultado;

      // Dispara a criação da ordem oficial na API do Mercado Pago
      const rotaDesc = (this.viagemSelecionada && this.viagemSelecionada.origin && this.viagemSelecionada.destination)
        ? `Passagem ${this.viagemSelecionada.origin.name} -> ${this.viagemSelecionada.destination.name}`
        : 'Passagem Rodoviária - Viagem Fácil';

      const pref = await criarPreferenciaMercadoPago(this.valorTotal, infoPassageiro, rotaDesc);

      if (this.metodoPagamento === 'pix') {
        resultado = await criarPagamentoPix(this.valorTotal, infoPassageiro);
        if (!resultado || !resultado.sucesso) {
          resultado = await processarPagamentoMock('pix', { amount: this.valorTotal });
        }
      } else {
        resultado = await processarPagamentoMock(this.metodoPagamento, {
          amount: this.valorTotal,
          card: this.dadosCartao
        });
      }

      this.processandoPagamento = false;
      this.pagamentoConcluido = true;

      const idMp = (pref && pref.id_preferencia) ? pref.id_preferencia : (resultado?.id_mercadopago || null);
      const resultadoPagamento = {
        transactionId: idMp ? ('MP-' + idMp) : (resultado?.id_transacao || 'TX-' + Date.now()),
        authorizationCode: resultado?.codigo_autorizacao || Math.floor(100000 + Math.random() * 900000).toString(),
        idMercadoPago: idMp
      };

      this.gerarDadosBilhete(resultadoPagamento);

      if (window.Alpine && window.Alpine.store('app')?.somAtivado) playSound('success');
      try { triggerConfetti(); } catch (e) { }

      window.Alpine.store('app').irParaEtapa(6);
    } catch (err) {
      this.processandoPagamento = false;
      if (window.Alpine && window.Alpine.store('app')?.somAtivado) playSound('warning');
      if (window.Alpine && window.Alpine.store('app')) {
        window.Alpine.store('app').adicionarNotificacao('Erro ao processar pagamento. Tente novamente.', 'error');
      }
    }
  },

  gerarDadosBilhete(resultadoPagamento) {
    const localizador = 'TTM-' + Math.floor(100000 + Math.random() * 900000);
    const origem = this.cidades.find(c => c.id === this.origemId) || this.cidades[0] || { name: this.viagemSelecionada?.origin?.name || 'Origem' };
    const destino = this.cidades.find(c => c.id === this.destinoId) || this.cidades[1] || { name: this.viagemSelecionada?.destination?.name || 'Destino' };
    const horarioId = this.viagemSelecionada ? (this.viagemSelecionada.horarioId || this.viagemSelecionada.horario_id || 1) : 1;
    const rotaId = this.viagemSelecionada ? (this.viagemSelecionada.rotaId || this.viagemSelecionada.rota_id || null) : null;
    const numerosPoltronas = this.assentosSelecionados.map(s => s.number);

    this.dadosBilhete = {
      localizador: localizador,
      idTransacao: resultadoPagamento.transactionId,
      idMercadoPago: resultadoPagamento.idMercadoPago,
      codigoAutorizacao: resultadoPagamento.authorizationCode,
      emitidoEm: new Date().toLocaleString('pt-BR'),
      empresa: this.viagemSelecionada.company,
      tipoOnibus: this.viagemSelecionada.busType,
      plataforma: this.viagemSelecionada.platform,
      portao: this.viagemSelecionada.gate,
      origem: origem,
      destino: destino,
      horarioPartida: this.viagemSelecionada.departureTime,
      horarioChegada: this.viagemSelecionada.arrivalTime,
      duracao: this.viagemSelecionada.duration,
      dataViagem: this.viagemSelecionada.date,
      poltronasTexto: numerosPoltronas.join(', '),
      poltronas: this.assentosSelecionados,
      passageiro: { ...this.dadosPassageiro },
      passageirosAdicionais: [...this.passageirosAdicionais],
      servicos: this.servicosSelecionados.map(codigo => {
        const s = this.servicosDisponiveis.find(item => item.codigo === codigo || item.id === codigo);
        return s ? {
          id: s.id,
          codigo: s.codigo,
          categoria: s.categoria,
          titulo: s.titulo,
          preco: s.preco
        } : null;
      }).filter(Boolean),
      valorTotal: this.valorTotal,
      metodoPagamento: this.metodoPagamento.toUpperCase(),
      parcelas: (this.metodoPagamento === 'credit' || this.metodoPagamento === 'credito') ? (parseInt(this.numeroParcelas, 10) || 1) : 1,
      valorParcela: (this.metodoPagamento === 'credit' || this.metodoPagamento === 'credito') ? (this.valorTotal / (parseInt(this.numeroParcelas, 10) || 1)) : this.valorTotal,
      cupom: this.cupomAplicado,
      dadosQrCode: `PASSAGEM|${localizador}|${origem.name}->${destino.name}|${this.viagemSelecionada.date}|POLTRONAS:${numerosPoltronas.join(',')}|CPF:${this.dadosPassageiro.cpf}`,
      horarioId: horarioId,
      rotaId: rotaId
    };

    // Salva as poltronas no cache local para que a próxima venda bloqueie imediatamente o assento
    try {
      const chaveAssentos = `poltronas_ocupadas_${this.origemId}_${this.destinoId}_${this.viagemSelecionada.date}_${this.viagemSelecionada.departureTime || ''}`;
      const ocupadasSalvas = JSON.parse(sessionStorage.getItem(chaveAssentos) || '[]');
      const combinadas = Array.from(new Set([...ocupadasSalvas, ...numerosPoltronas]));
      sessionStorage.setItem(chaveAssentos, JSON.stringify(combinadas));
    } catch (e) {
      console.warn('Erro ao salvar poltronas no cache local:', e);
    }

    if (this.cupomAplicado && this.dadosPassageiro.cpf) {
      registrarUsoCupom(this.cupomAplicado.code, this.dadosPassageiro.cpf);
    }

    // Grava a venda no banco de dados MySQL para atualizar o ERP em tempo real
    this.enviarVendaParaBanco(this.dadosBilhete);
  },

  async enviarVendaParaBanco(dados) {
    try {
      const resp = await fetch('api/vendas.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados)
      });
      const resultado = await resp.json();
      if (resultado && resultado.sucesso) {
        console.log('[Banco MySQL] Venda registrada com sucesso:', resultado);
      }
    } catch (erro) {
      console.error('[Banco MySQL] Erro ao enviar venda para API:', erro);
    }
  },
  // 
  redefinirTodosDados() {
    this.origemId = '';
    this.destinoId = '';
    this.dataViagem = getTodayDateString();
    this.viagensDisponiveis = [];
    this.viagemSelecionada = null;
    this.poltronasOnibus = [];
    this.assentosSelecionados = [];
    this.servicosSelecionados = [];
    this.dadosPassageiro = {
      nomeCompleto: '',
      cpf: '',
      telefone: '',
      email: '',
      dataNascimento: '',
      tipoDocumento: 'RG',
      numeroDocumento: ''
    };
    Object.keys(this.errosValidacao).forEach(k => this.errosValidacao[k] = '');
    Object.keys(this.camposInteragidos).forEach(k => this.camposInteragidos[k] = false);
    this.passageirosAdicionais = [];
    this.errosAdicionais = [];
    this.camposInteragidosAdicionais = [];
    this.termosAceitos = true;
    this.cupomAplicado = null;
    this.cupomInput = '';
    this.erroCupom = '';
    this.metodoPagamento = '';
    this.numeroParcelas = 1;
    this.dadosCartao = { numero: '', titular: '', validade: '', cvv: '' };
    this.dadosBilhete = null;
    this.pagamentoConcluido = false;
    this.processandoPagamento = false;
  }
});
