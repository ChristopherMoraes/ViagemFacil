

const STORAGE_KEYS = {
  TOTENS: 'passagens_express_totens_fleet',
  COMPANIES: 'passagens_express_bus_companies',
  ROUTES: 'passagens_express_bus_routes',
  SALES: 'passagens_express_sales_history',
  AUTH: 'passagens_express_erp_auth',
  PROMOTIONS: 'passagens_express_promotions',
  PLATFORMS: 'passagens_express_platforms',
  GATES: 'passagens_express_gates',
  CLIENTS: 'passagens_express_clients',
  CITIES: 'passagens_express_cities'
};


const PLATAFORMAS_PADRAO = [
  'Plataforma 01', 'Plataforma 02', 'Plataforma 03', 'Plataforma 04', 'Plataforma 05',
  'Plataforma 06', 'Plataforma 07', 'Plataforma 08', 'Plataforma 09', 'Plataforma 10',
  'Plataforma 11', 'Plataforma 12', 'Plataforma 14', 'Plataforma 18', 'Plataforma 19',
  'Plataforma 21', 'Plataforma 22', 'Plataforma 26'
];


const PORTOES_PADRAO = [
  'Portão A', 'Portão B', 'Portão C', 'Portão D', 'Portão E', 'Portão F'
];

// Store Alpine do painel central administrativo
export const createCentralAdminStore = () => ({

  isAuthenticated: false,
  loginForm: {
    username: '',
    password: '',
    error: ''
  },


  currentTab: 'dashboard',
  selectedTotemFilter: 'all',


  totens: [],
  companies: [],
  routes: [],
  sales: [],


  newTotemModal: false,
  totemFormData: {
    name: '',
    terminal: 'Terminal Rodoviário Tietê',
    location: '',
    ipAddress: '',
    printerSerial: '',
    pinpadModel: 'Ingenico iPP320'
  },

  companyModal: false,
  companyFormData: {
    id: '',
    name: '',
    legalName: '',
    cnpj: '',
    phone: '',
    email: '',
    commissionPercent: 8.5,
    status: 'ACTIVE'
  },

  routeModal: false,

  horariosPartidaPadrao: [
    '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
    '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
    '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30',
    '22:00', '22:30'
  ],
  routeFormData: {
    id: '',
    companyId: '',
    originCity: 'São Paulo',
    originState: 'SP',
    originTerminal: 'Terminal Rodoviário Tietê',
    destCity: 'Rio de Janeiro',
    destState: 'RJ',
    destTerminal: 'Rodoviária Novo Rio',
    operatingDays: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
    departureDate: '',
    departureTime: '08:00',
    duration: '6h00',
    arrivalDate: '',
    arrivalTime: '14:00',
    daysDifference: 0,
    arrivalDayText: 'No mesmo dia',
    platform: 'Plataforma 10',
    gate: 'Portão A',
    busId: 'Carro 4020',
    licensePlate: 'BRA-2E19',
    fleetDecks: 2,
    deck1SeatType: 'Leito Cama VIP (180°)',
    deck1SeatsCount: 12,
    deck1Price: 169.90,
    deck2SeatType: 'Semi-Leito Panorâmico (135°)',
    deck2SeatsCount: 36,
    deck2Price: 129.90,
    singleDeckSeatType: 'Semi-Leito',
    singleDeckSeatsCount: 44,
    singleDeckPrice: 119.90,
    busType: 'Double Decker (Leito & Semi-Leito)',
    basePrice: 129.90
  },

  cidades: [],
  modalCidades: false,
  buscaCidadeFiltro: '',
  cidadeFormulario: {
    id: null,
    nome: '',
    estado: 'SP',
    terminal: '',
    sigla: '',
    ativo: true
  },
  plataformas: [],
  portoes: [],
  novaPlataformaTexto: '',
  novoPortaoTexto: '',
  modalPlataformasPortoes: false,

  promocoes: [],
  modalPromocao: false,
  promocaoFormulario: {
    id: '',
    codigo: '',
    descricao: '',
    porcentagem: 10,
    validade: '',
    ativo: true
  },

  clientes: [],
  buscaCliente: '',

  // Filtros da tela de vendas
  filtroVendas: {
    periodo: 'hoje',
    dataInicio: '',
    dataFim: '',
    data: '',
    totem: 'todos',
    formaPagamento: 'todas',
    tipoBusca: 'nome',
    termoBusca: '',
    colunaOrdenacao: 'data_hora',
    direcaoOrdenacao: 'DESC',
    paginaAtual: 1,
    itensPorPagina: 20
  },

  // Filtro de período por totem
  filtroPeriodoTotem: 'todos',
  filtroDataInicioTotem: '',
  filtroDataFimTotem: '',

  // Filtro de período por viação
  filtroPeriodoCompanhia: 'todos',
  filtroDataInicioCompanhia: '',
  filtroDataFimCompanhia: '',
  todasVendas: [],

  toasts: [],


  init() {
    this.currentTab = 'dashboard';
    this.checkSession();
    this.loadAllData();
  },

  // Carregar vendas e métricas do banco MySQL via API
  async carregarDadosDoBanco() {
    try {
      const resposta = await fetch('./api/vendas.php');
      if (!resposta.ok) return;
      const json = await resposta.json();
      if (!json || !json.sucesso) return;

      // Passageiros 
      if (Array.isArray(json.passageiros) && json.passageiros.length > 0) {
        this.clientes = json.passageiros.map(p => ({
          id: 'cli-' + p.id,
          nomeCompleto: p.nome,
          cpf: p.cpf,
          telefone: p.telefone,
          email: p.email,
          tipoDocumento: p.tipo_documento,
          numeroDocumento: p.numero_documento,
          dataNascimento: p.data_nascimento,
          criadoEm: p.data_criacao,
          origemTotem: 'Totem Autoatendimento'
        }));
      }

      //Vendas 
      if (Array.isArray(json.vendas) && json.vendas.length > 0) {
        const vendasMapeadas = json.vendas.map(v => ({
          id: 'SALE-' + v.id,
          locator: v.codigo_venda,
          totemId: 'totem_0' + (v.totem_id || 1),
          totemName: v.nome_totem || 'Totem #01',
          timestamp: v.criado_em_iso || v.data_hora,
          dateStr: v.data_hora,
          dateIso: (v.criado_em_iso ? v.criado_em_iso.substring(0, 10) : '') || this.normalizarDataParaIso(v.data_hora),
          passenger: {
            fullName: v.passageiro_nome,
            cpf: v.passageiro_cpf
          },
          trip: {
            origin: { name: v.cidade_origem || 'São Paulo' },
            destination: { name: v.cidade_destino || 'Destino' },
            company: { name: v.viacao || 'Viação' }
          },
          seats: v.poltronas ? v.poltronas.split(', ') : ['-'],
          payment: {
            method: v.metodo_pagamento || 'PIX',
            totalPaid: parseFloat(v.valor_total) || 0,
            status: v.status_pagamento || 'APROVADO'
          },
          status: v.status || 'CONCLUIDA'
        }));
        this.todasVendas = [...vendasMapeadas];
        this.sales = [...vendasMapeadas];
      }

      //Faturamento hoje
      if (json.resumo_financeiro && json.resumo_financeiro.hoje && json.resumo_financeiro.hoje.por_totem) {
        this.totens.forEach(t => {
          const dadosTotemHoje = json.resumo_financeiro.hoje.por_totem[t.name];
          if (dadosTotemHoje) {
            t.todaySalesCount = Number(dadosTotemHoje.quantidade) || 0;
            t.todayRevenue = Number(dadosTotemHoje.total) || 0;
          } else {
            t.todaySalesCount = 0;
            t.todayRevenue = 0;
          }
        });
      }

      //Faturamento por empresa
      if (json.resumo_financeiro && json.resumo_financeiro.por_viacao) {
        this.companies.forEach(c => {
          const dadosViacao = json.resumo_financeiro.por_viacao[c.name];
          if (dadosViacao) {
            c.totalRevenue = dadosViacao.total;
          }
        });
      }

      this.saveData(STORAGE_KEYS.SALES, this.sales);
      this.saveData(STORAGE_KEYS.CLIENTS, this.clientes);
      this.saveData(STORAGE_KEYS.TOTENS, this.totens);
    } catch (erro) {
      console.warn('Executando em modo local sem backend PHP:', erro);
    }
  },

  // Redireciona para aba do dashboard
  resetToDashboard() {
    this.currentTab = 'dashboard';
    this.newTotemModal = false;
    this.companyModal = false;
    this.routeModal = false;
    this.modalPromocao = false;
    this.modalPlataformasPortoes = false;
    this.modalCidades = false;
    this.buscaCliente = '';
  },

  // Verifica se existe sessão autenticada
  checkSession() {
    try {
      const isAuth = sessionStorage.getItem(STORAGE_KEYS.AUTH);
      if (isAuth === 'true') {
        this.isAuthenticated = true;
        this.resetToDashboard();
      }
    } catch (e) {
      console.warn('Session storage indisponível:', e);
    }
  },

  // Valida credenciais e inicia sessão
  login() {
    const user = this.loginForm.username.trim().toLowerCase();
    const pass = this.loginForm.password.trim();

    if (user === 'admin' && pass === 'admin') {
      this.isAuthenticated = true;
      this.resetToDashboard();
      this.loginForm.error = '';
      this.loginForm.username = '';
      this.loginForm.password = '';
      try {
        sessionStorage.setItem(STORAGE_KEYS.AUTH, 'true');
      } catch (e) { }
    } else {
      this.loginForm.error = 'Usuário ou senha incorretos.';
      this.showToast('Credenciais inválidas.', 'danger');
    }
  },

  // Encerra sessão administrativa
  logout() {
    this.isAuthenticated = false;
    this.resetToDashboard();
    this.loginForm = {
      username: '',
      password: '',
      error: ''
    };
    try {
      sessionStorage.removeItem(STORAGE_KEYS.AUTH);
    } catch (e) { }
    this.showToast('Sessão encerrada com sucesso.', 'info');
  },

  // Carrega dados do LocalStorage
  loadAllData() {
    try {
      const storedTotens = localStorage.getItem(STORAGE_KEYS.TOTENS);
      this.totens = storedTotens ? JSON.parse(storedTotens) : [];

      const storedComp = localStorage.getItem(STORAGE_KEYS.COMPANIES);
      this.companies = storedComp ? JSON.parse(storedComp) : [];

      const storedRoutes = localStorage.getItem(STORAGE_KEYS.ROUTES);
      let parsedRoutes = storedRoutes ? JSON.parse(storedRoutes) : [];
      if (Array.isArray(parsedRoutes)) {
        const idSet = new Set();
        parsedRoutes = parsedRoutes.map((r, idx) => {
          let uniqueId = r.id || `route-${idx + 1}`;
          if (idSet.has(uniqueId)) {
            uniqueId = `${uniqueId}-${r.horarioId || (idx + 1)}`;
          }
          idSet.add(uniqueId);
          return {
            ...r,
            id: uniqueId,
            origin: r.origin || { name: 'Origem', state: '', terminal: '' },
            destination: r.destination || { name: 'Destino', state: '', terminal: '' },
            operatingDays: Array.isArray(r.operatingDays)
              ? r.operatingDays
              : (typeof r.operatingDays === 'string' && r.operatingDays.trim() !== ''
                ? r.operatingDays.split(',').map(s => s.trim()).filter(Boolean)
                : ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'])
          };
        });
      }
      this.routes = parsedRoutes;

      const storedSales = localStorage.getItem(STORAGE_KEYS.SALES);
      this.sales = storedSales ? JSON.parse(storedSales) : [];
      this.todasVendas = [...this.sales];

      const storedPromos = localStorage.getItem(STORAGE_KEYS.PROMOTIONS);
      this.promocoes = storedPromos ? JSON.parse(storedPromos) : [];

      const storedPlats = localStorage.getItem(STORAGE_KEYS.PLATFORMS);
      this.plataformas = storedPlats ? JSON.parse(storedPlats) : [...PLATAFORMAS_PADRAO];

      const storedGates = localStorage.getItem(STORAGE_KEYS.GATES);
      this.portoes = storedGates ? JSON.parse(storedGates) : [...PORTOES_PADRAO];

      const storedClients = localStorage.getItem(STORAGE_KEYS.CLIENTS);
      this.clientes = storedClients ? JSON.parse(storedClients) : [];

      const storedCities = localStorage.getItem(STORAGE_KEYS.CITIES);
      this.cidades = storedCities ? JSON.parse(storedCities) : [];
    } catch (e) {
      console.warn('Erro ao carregar dados do Sistema Pai:', e);
      this.totens = [];
      this.companies = [];
      this.routes = [];
      this.sales = [];
      this.todasVendas = [];
      this.promocoes = [];
      this.plataformas = [...PLATAFORMAS_PADRAO];
      this.portoes = [...PORTOES_PADRAO];
      this.clientes = [];
      this.cidades = [];
    }

    // Sincroniza cupons, cidades, empresas, rotas, totens e vendas com o banco de dados MySQL
    this.sincronizarTodasPromocoesComBanco();
    this.sincronizarCidadesComBanco();
    this.sincronizarEmpresasComBanco();
    this.sincronizarRotasComBanco();
    this.sincronizarTotensComBanco();
    this.carregarDadosDoBanco();
  },

  // Salva coleção no LocalStorage
  saveData(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.warn('Erro ao salvar no storage:', e);
    }
  },

  // Sincroniza frota de totens com banco MySQL
  async sincronizarTotensComBanco() {
    try {
      const resp = await fetch('./api/totens.php');
      if (!resp.ok) return;
      const json = await resp.json();
      if (json && json.sucesso && Array.isArray(json.totens) && json.totens.length > 0) {
        this.totens = json.totens.map(tBanco => {
          const idTotem = 'totem_0' + tBanco.id;
          return {
            id: idTotem,
            idBanco: tBanco.id,
            name: tBanco.nome,
            terminal: 'Terminal Rodoviário Tietê',
            location: tBanco.localizacao || '',
            ipAddress: tBanco.ip || '',
            macAddress: tBanco.mac || '',
            printerSerial: tBanco.serial_impressora || '',
            pinpadModel: 'Ingenico iPP320',
            status: (tBanco.situacao === 'OFFLINE') ? 'OFFLINE' : 'ONLINE',
            isActive: tBanco.situacao !== 'OFFLINE',
            cardReaderStatus: tBanco.leitor_cartao || 'OK',
            anttSyncStatus: tBanco.sincronizacao_antt || 'OK',
            todaySalesCount: (tBanco.vendas_hoje !== undefined && tBanco.vendas_hoje !== null)
              ? parseInt(tBanco.vendas_hoje, 10)
              : 0,
            todayRevenue: (tBanco.faturamento_hoje !== undefined && tBanco.faturamento_hoje !== null)
              ? parseFloat(tBanco.faturamento_hoje)
              : 0,
            installedAt: tBanco.instalado_em || '2025-01-10'
          };
        });
        this.saveData(STORAGE_KEYS.TOTENS, this.totens);
      }
    } catch (e) {
      console.warn('[Admin] Erro ao sincronizar totens com banco MySQL:', e);
    }
  },

  // Reinicia totem remotamente
  restartTotem(totemId) {
    const totem = this.totens.find(t => t.id === totemId);
    if (!totem) return;

    this.showToast(`Enviando sinal de reinicialização para ${totem.name}...`, 'info');

    const previousStatus = totem.status;
    totem.isRestarting = true;
    totem.status = 'OFFLINE';

    setTimeout(() => {
      totem.isRestarting = false;
      totem.status = previousStatus === 'OFFLINE' ? 'OFFLINE' : 'ONLINE';
      this.saveData(STORAGE_KEYS.TOTENS, this.totens);
      this.showToast(`${totem.name} reiniciado e conectado com sucesso!`, 'success');
    }, 2000);
  },

  // Executa teste de impressão remota
  testPrint(totemId) {
    const totem = this.totens.find(t => t.id === totemId);
    if (!totem) return;

    if (totem.status === 'OFFLINE') {
      this.showToast(`Não é possível imprimir teste: ${totem.name} está offline!`, 'danger');
      return;
    }

    this.showToast(`Comando de impressão de teste enviado para ${totem.name}.`, 'success');
  },

  // Alterna status ativo/inativo do totem
  async toggleTotemActive(totemId) {
    const totem = this.totens.find(t => t.id === totemId);
    if (!totem) return;

    if (totem.status === 'ONLINE') {
      totem.status = 'OFFLINE';
      totem.isActive = false;
      this.showToast(`${totem.name} foi desativado (Status: Offline).`, 'warning');
    } else {
      totem.status = 'ONLINE';
      totem.isActive = true;
      this.showToast(`${totem.name} foi ativado com sucesso (Status: Online).`, 'success');
    }

    this.saveData(STORAGE_KEYS.TOTENS, this.totens);

    // Sincroniza no MySQL via API
    const idNum = parseInt(totemId.replace('totem_0', '').replace('totem_', ''), 10) || 4;
    try {
      await fetch('./api/totens.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          acao: 'alternar_status',
          id: idNum,
          situacao: totem.status
        })
      });
    } catch (e) {
      console.warn('[Totens] Erro ao sincronizar status do totem no MySQL:', e);
    }
  },

  // Abre modal de novo totem
  openNewTotemModal() {
    const nextNum = this.totens.length + 1;
    this.totemFormData = {
      name: `Totem #0${nextNum}`,
      terminal: 'Terminal Rodoviário Tietê',
      location: '',
      ipAddress: `192.168.10.10${nextNum}`,
      printerSerial: `PRT-TM-882910${nextNum}`,
      pinpadModel: 'Ingenico iPP320'
    };
    this.newTotemModal = true;
  },

  // Cadastra novo totem
  saveNewTotem() {
    if (!this.totemFormData.name || !this.totemFormData.location) {
      this.showToast('Por favor, preencha o nome e a localização do totem.', 'warning');
      return;
    }

    const newTotem = {
      id: 'totem_' + String(this.totens.length + 1).padStart(2, '0'),
      name: this.totemFormData.name,
      terminal: this.totemFormData.terminal,
      location: this.totemFormData.location,
      ipAddress: this.totemFormData.ipAddress || '192.168.10.150',
      macAddress: '00:1A:2B:3C:4D:0' + (this.totens.length + 1),
      printerSerial: this.totemFormData.printerSerial || 'PRT-TM-CUSTOM',
      pinpadModel: this.totemFormData.pinpadModel,
      status: 'ONLINE',
      cardReaderStatus: 'OK',
      anttSyncStatus: 'OK',
      todaySalesCount: 0,
      todayRevenue: 0.00,
      lastTransactionAt: new Date().toISOString(),
      installedAt: new Date().toISOString().split('T')[0]
    };

    this.totens.push(newTotem);
    this.saveData(STORAGE_KEYS.TOTENS, this.totens);
    this.newTotemModal = false;

    this.showToast(`Novo ${newTotem.name} cadastrado com sucesso!`, 'success');
  },

  // Abre modal de cadastro de empresa
  openNewCompanyModal() {
    this.companyFormData = {
      id: '',
      name: '',
      legalName: '',
      cnpj: '',
      phone: '',
      email: '',
      commissionPercent: 8.5,
      status: 'ACTIVE'
    };
    this.companyModal = true;
  },

  // Abre modal de edição de viação
  editCompany(comp) {
    this.companyFormData = {
      ...comp,
      cnpj: (comp.cnpj || '').replace(/\D/g, '').slice(0, 14)
    };
    this.companyModal = true;
  },

  // Salva ou atualiza viação
  async saveCompany() {
    const nome = (this.companyFormData.name || '').trim();
    const cnpjNumeros = (this.companyFormData.cnpj || '').replace(/\D/g, '');

    if (!nome) {
      this.showToast('Por favor, informe o nome da companhia.', 'warning');
      return;
    }

    if (cnpjNumeros.length !== 14) {
      this.showToast('O CNPJ deve conter exatamente 14 números.', 'warning');
      return;
    }

    const payload = {
      id: this.companyFormData.id,
      codigo: this.companyFormData.id || nome.toLowerCase().replace(/[^a-z0-9]/g, '_'),
      name: nome,
      legalName: this.companyFormData.legalName || `${nome} S.A.`,
      cnpj: cnpjNumeros,
      phone: this.companyFormData.phone || '',
      email: this.companyFormData.email || '',
      commissionPercent: Number(this.companyFormData.commissionPercent) || 8.5,
      status: this.companyFormData.status || 'ACTIVE'
    };

    if (this.companyFormData.id) {
      const idx = this.companies.findIndex(c => c.id === this.companyFormData.id);
      if (idx !== -1) {
        this.companies[idx] = { ...this.companies[idx], ...payload };
      }
      this.showToast(`Companhia ${payload.name} atualizada com sucesso!`, 'success');
    } else {
      const newComp = {
        ...payload,
        id: payload.codigo,
        logo: 'ph-bold ph-bus',
        routesCount: 0,
        totalRevenue: 0.00
      };
      this.companies.push(newComp);
      this.showToast(`Companhia ${newComp.name} cadastrada com sucesso!`, 'success');
    }

    this.saveData(STORAGE_KEYS.COMPANIES, this.companies);
    this.companyModal = false;

    try {
      const resp = await fetch('./api/empresas.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          acao: 'salvar',
          ...payload
        })
      });
      if (resp.ok) {
        const json = await resp.json();
        if (json && json.sucesso && json.empresa) {
          const idx = this.companies.findIndex(c => c.name === payload.name);
          if (idx !== -1) {
            this.companies[idx].id = json.empresa.id;
            this.companies[idx].idBanco = json.empresa.id_banco;
            this.saveData(STORAGE_KEYS.COMPANIES, this.companies);
          }
        }
      }
    } catch (e) {

    }
  },

  // Remove ou inativa viação
  async deleteCompany(companyId) {
    if (!confirm('Deseja realmente desativar esta companhia de ônibus?')) return;
    const empresa = this.companies.find(c => c.id === companyId);
    const nomeEmpresa = empresa ? empresa.name : 'Companhia';

    this.companies = this.companies.filter(c => c.id !== companyId);
    this.saveData(STORAGE_KEYS.COMPANIES, this.companies);
    this.showToast(`Companhia ${nomeEmpresa} removida com sucesso.`, 'info');

    // Sincroniza exclusão no MySQL
    try {
      await fetch('./api/empresas.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          acao: 'excluir',
          id: companyId
        })
      });
    } catch (e) { }
  },

  // Sincroniza as empresas com o banco
  async sincronizarEmpresasComBanco() {
    try {
      const resp = await fetch('./api/empresas.php');
      if (!resp.ok) return;
      const json = await resp.json();
      if (json && json.sucesso && Array.isArray(json.empresas) && json.empresas.length > 0) {
        this.companies = json.empresas.map(e => ({
          id: e.codigo || String(e.id),
          idBanco: e.id,
          name: e.nome,
          legalName: e.razao_social || `${e.nome} S.A.`,
          cnpj: e.cnpj,
          phone: e.telefone || '',
          email: e.email || '',
          logo: 'ph-bold ph-bus',
          commissionPercent: parseFloat(e.comissao_percent) || 8.5,
          status: (e.situacao === 'ATIVO' ? 'ACTIVE' : 'INACTIVE'),
          routesCount: e.total_rotas || 0,
          totalRevenue: 0.00
        }));
        this.saveData(STORAGE_KEYS.COMPANIES, this.companies);
      }
    } catch (e) {
      // Fallback local se backend indisponível
    }
  },

  // Sincroniza rotas com o banco MySQL
  async sincronizarRotasComBanco() {
    try {
      const resp = await fetch('./api/rotas.php?todas=1');
      if (!resp.ok) return;
      const json = await resp.json();
      if (json && json.sucesso && Array.isArray(json.rotas) && json.rotas.length > 0) {
        this.routes = json.rotas;
        this.saveData(STORAGE_KEYS.ROUTES, this.routes);
      }
    } catch (e) {
      // Fallback local se backend indisponível
    }
  },


  // Abre modal de cadastro de rota
  openNewRouteModal() {
    const platPadrao = this.plataformas.length > 0 ? this.plataformas[0] : 'Plataforma 01';
    const portaoPadrao = this.portoes.length > 0 ? this.portoes[0] : 'Portão A';
    const hoje = new Date().toISOString().slice(0, 10);

    this.routeFormData = {
      id: '',
      companyId: this.companies.length > 0 ? this.companies[0].id : '',
      originCity: 'São Paulo',
      originState: 'SP',
      originTerminal: 'Terminal Rodoviário Tietê',
      destCity: 'Rio de Janeiro',
      destState: 'RJ',
      destTerminal: 'Rodoviária Novo Rio',
      operatingDays: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
      departureDate: hoje,
      departureTime: '08:00',
      duration: '6h00',
      arrivalDate: hoje,
      arrivalTime: '14:00',
      daysDifference: 0,
      arrivalDayText: 'No mesmo dia',
      platform: platPadrao,
      gate: portaoPadrao,
      busId: 'Carro 4020',
      licensePlate: 'BRA-2E19',
      fleetDecks: 2,
      deck1SeatType: 'Leito Cama VIP (180°)',
      deck1SeatsCount: 12,
      deck1Price: 169.90,
      deck2SeatType: 'Semi-Leito Panorâmico (135°)',
      deck2SeatsCount: 36,
      deck2Price: 129.90,
      singleDeckSeatType: 'Semi-Leito',
      singleDeckSeatsCount: 44,
      singleDeckPrice: 119.90,
      busType: 'Double Decker (Leito & Semi-Leito)',
      basePrice: 129.90
    };
    this.calcularChegadaAutomatica(false);
    this.routeModal = true;
  },

  // Abre modal de edição de rota
  editRoute(route) {
    const decks = route.fleetDecks || (route.busType && route.busType.toLowerCase().includes('double') ? 2 : 1);
    const hoje = new Date().toISOString().slice(0, 10);

    let dias = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
    if (Array.isArray(route.operatingDays) && route.operatingDays.length > 0) {
      dias = [...route.operatingDays];
    } else if (typeof route.dias_operacao === 'string' && route.dias_operacao.trim() !== '') {
      dias = route.dias_operacao.split(',').map(d => d.trim());
    }

    this.routeFormData = {
      id: route.id,
      idBanco: route.idBanco || null,
      horarioId: route.horarioId || null,
      companyId: route.companyId,
      originCity: route.origin.name,
      originState: route.origin.state,
      originTerminal: route.origin.terminal,
      destCity: route.destination.name,
      destState: route.destination.state,
      destTerminal: route.destination.terminal,
      operatingDays: dias,
      departureDate: route.departureDate || hoje,
      departureTime: route.departureTime || '08:00',
      duration: route.duration || '6h00',
      arrivalDate: route.arrivalDate || hoje,
      arrivalTime: route.arrivalTime || '14:00',
      daysDifference: route.daysDifference || 0,
      arrivalDayText: 'No mesmo dia',
      platform: route.platform || (this.plataformas[0] || 'Plataforma 01'),
      gate: route.gate || (this.portoes[0] || 'Portão A'),
      busId: route.busId || 'Carro 4020',
      licensePlate: route.licensePlate || 'BRA-2E19',
      fleetDecks: decks,
      deck1SeatType: route.deck1SeatType || 'Leito Cama VIP (180°)',
      deck1SeatsCount: route.deck1SeatsCount || 12,
      deck1Price: route.deck1Price || (Number(route.basePrice) * 1.25).toFixed(2),
      deck2SeatType: route.deck2SeatType || 'Semi-Leito Panorâmico (135°)',
      deck2SeatsCount: route.deck2SeatsCount || 36,
      deck2Price: route.deck2Price || route.basePrice,
      singleDeckSeatType: route.singleDeckSeatType || 'Semi-Leito',
      singleDeckSeatsCount: route.singleDeckSeatsCount || 44,
      singleDeckPrice: route.singleDeckPrice || route.basePrice,
      busType: route.busType,
      basePrice: route.basePrice
    };
    this.calcularChegadaAutomatica(false);
    this.routeModal = true;
  },

  // Retorna dias de operação da rota
  obterDiasOperacaoArray(route) {
    if (!route) return ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
    if (Array.isArray(route.operatingDays) && route.operatingDays.length > 0) {
      return route.operatingDays;
    }
    if (typeof route.dias_operacao === 'string' && route.dias_operacao.trim() !== '') {
      return route.dias_operacao.split(',').map(d => d.trim()).filter(Boolean);
    }
    if (typeof route.operatingDays === 'string' && route.operatingDays.trim() !== '') {
      return route.operatingDays.split(',').map(d => d.trim()).filter(Boolean);
    }
    return ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
  },

  // Verifica se dia da semana está ativo
  isDiaOperacaoAtivo(dia) {
    return Array.isArray(this.routeFormData.operatingDays) && this.routeFormData.operatingDays.includes(dia);
  },

  // Alterna seleção do dia da semana
  alternarDiaOperacao(dia) {
    if (!Array.isArray(this.routeFormData.operatingDays)) {
      this.routeFormData.operatingDays = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
    }
    const idx = this.routeFormData.operatingDays.indexOf(dia);
    if (idx !== -1) {
      if (this.routeFormData.operatingDays.length > 1) {
        this.routeFormData.operatingDays.splice(idx, 1);
      } else {
        this.showToast('A rota deve operar em pelo menos um dia da semana.', 'warning');
      }
    } else {
      this.routeFormData.operatingDays.push(dia);
      const ordem = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
      this.routeFormData.operatingDays.sort((a, b) => ordem.indexOf(a) - ordem.indexOf(b));
    }
  },

  // Seleciona todos os dias da semana
  selecionarTodosDias() {
    this.routeFormData.operatingDays = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
  },

  // Seleciona dias úteis (Seg a Sex)
  selecionarDiasUteis() {
    this.routeFormData.operatingDays = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'];
  },

  // Seleciona fim de semana (Sáb e Dom)
  selecionarFimDeSemana() {
    this.routeFormData.operatingDays = ['Sáb', 'Dom'];
  },

  // Calcula chegada e diferença de dias
  calcularChegadaAutomatica(formatarTexto = false) {
    const dataPartida = this.routeFormData.departureDate || new Date().toISOString().slice(0, 10);
    const horaPartida = this.routeFormData.departureTime || '08:00';
    const duracaoTexto = (this.routeFormData.duration || '').trim();

    if (!duracaoTexto) return;

    let horas = 0;
    let minutos = 0;

    // Suporta múltiplos formatos de duração
    const matchHm = duracaoTexto.match(/^(\d+)\s*(?:h|:)\s*(\d*)$/i);
    if (matchHm) {
      horas = parseInt(matchHm[1], 10) || 0;
      minutos = parseInt(matchHm[2], 10) || 0;
    } else {
      const matchNum = duracaoTexto.match(/^(\d+(?:[.,]\d+)?)\s*h?$/i);
      if (matchNum) {
        const val = parseFloat(matchNum[1].replace(',', '.'));
        horas = Math.floor(val);
        minutos = Math.round((val - horas) * 60);
      } else {
        const matchGenerico = duracaoTexto.match(/(\d+)/);
        if (matchGenerico) {
          horas = parseInt(matchGenerico[1], 10) || 0;
        }
      }
    }

    if (isNaN(horas) || horas < 0) horas = 0;
    if (isNaN(minutos) || minutos < 0) minutos = 0;

    const partesHora = horaPartida.split(':').map(Number);
    if (partesHora.length >= 2) {
      const totalMinPartida = partesHora[0] * 60 + partesHora[1];
      const totalMinDuracao = horas * 60 + minutos;
      const totalMinChegada = totalMinPartida + totalMinDuracao;

      const diasDiff = Math.floor(totalMinChegada / 1440);
      const minRestantes = totalMinChegada % 1440;
      const horaCheg = Math.floor(minRestantes / 60);
      const minCheg = minRestantes % 60;

      this.routeFormData.arrivalTime = `${String(horaCheg).padStart(2, '0')}:${String(minCheg).padStart(2, '0')}`;
      this.routeFormData.daysDifference = diasDiff;
      this.routeFormData.arrivalDayText = diasDiff === 0
        ? 'No mesmo dia'
        : (diasDiff === 1 ? 'No dia seguinte (+1 dia)' : `+${diasDiff} dias de viagem`);
    }
  },

  // Atualiza terminal de origem conforme cidade
  atualizarOrigemRota() {
    const cid = this.cidades.find(c => c.nome === this.routeFormData.originCity);
    if (cid) {
      this.routeFormData.originState = cid.estado;
      this.routeFormData.originTerminal = cid.terminal;
    }
  },

  // Atualiza terminal de destino conforme cidade
  atualizarDestinoRota() {
    const cid = this.cidades.find(c => c.nome === this.routeFormData.destCity);
    if (cid) {
      this.routeFormData.destState = cid.estado;
      this.routeFormData.destTerminal = cid.terminal;
    }
  },

  // Salva ou atualiza rota no painel e no MySQL
  async saveRoute() {
    const comp = this.companies.find(c =>
      String(c.id) === String(this.routeFormData.companyId) ||
      String(c.idBanco) === String(this.routeFormData.companyId) ||
      (c.name && this.routeFormData.companyName && c.name.toLowerCase() === this.routeFormData.companyName.toLowerCase())
    );
    const companyName = comp ? comp.name : (this.routeFormData.companyName || 'Viação Chrizin');

    const decks = Number(this.routeFormData.fleetDecks) || 1;
    const basePrice = decks === 2
      ? Number(this.routeFormData.deck2Price || 129.90)
      : Number(this.routeFormData.singleDeckPrice || 119.90);

    const busTypeDesc = decks === 2
      ? `Double Decker (${this.routeFormData.deck1SeatType} & ${this.routeFormData.deck2SeatType})`
      : `${this.routeFormData.singleDeckSeatType} (1 Andar)`;

    const cidOrigem = this.cidades.find(c => c.nome === this.routeFormData.originCity);
    const cidDestino = this.cidades.find(c => c.nome === this.routeFormData.destCity);
    const originState = cidOrigem ? cidOrigem.estado : (this.routeFormData.originState || 'SP');
    const originTerminal = cidOrigem ? cidOrigem.terminal : (this.routeFormData.originTerminal || 'Terminal Rodoviário');
    const destState = cidDestino ? cidDestino.estado : (this.routeFormData.destState || 'RJ');
    const destTerminal = cidDestino ? cidDestino.terminal : (this.routeFormData.destTerminal || 'Rodoviária');

    const routeObj = {
      id: this.routeFormData.id || ('route-' + Date.now()),
      idBanco: this.routeFormData.idBanco || (this.routeFormData.id && !isNaN(this.routeFormData.id.replace('route-', '')) ? Number(this.routeFormData.id.replace('route-', '')) : null),
      companyId: this.routeFormData.companyId,
      companyName: companyName,
      origin: {
        id: this.routeFormData.originCity.toLowerCase().slice(0, 3),
        name: this.routeFormData.originCity,
        state: originState,
        terminal: originTerminal
      },
      destination: {
        id: this.routeFormData.destCity.toLowerCase().slice(0, 3),
        name: this.routeFormData.destCity,
        state: destState,
        terminal: destTerminal
      },
      departureDate: this.routeFormData.departureDate,
      departureTime: this.routeFormData.departureTime,
      arrivalDate: this.routeFormData.arrivalDate,
      arrivalTime: this.routeFormData.arrivalTime,
      duration: this.routeFormData.duration,
      daysDifference: this.routeFormData.daysDifference || 0,
      platform: this.routeFormData.platform,
      gate: this.routeFormData.gate,
      busId: this.routeFormData.busId || 'Carro 4020',
      licensePlate: this.routeFormData.licensePlate ? this.routeFormData.licensePlate.toUpperCase() : 'BRA-2E19',
      fleetDecks: decks,
      deck1SeatType: this.routeFormData.deck1SeatType || 'Leito Cama VIP (180°)',
      deck1SeatsCount: Number(this.routeFormData.deck1SeatsCount) || 12,
      deck1Price: Number(this.routeFormData.deck1Price) || 169.90,
      deck2SeatType: this.routeFormData.deck2SeatType || 'Semi-Leito Panorâmico (135°)',
      deck2SeatsCount: Number(this.routeFormData.deck2SeatsCount) || 36,
      deck2Price: Number(this.routeFormData.deck2Price) || 129.90,
      singleDeckSeatType: this.routeFormData.singleDeckSeatType || 'Semi-Leito',
      singleDeckSeatsCount: Number(this.routeFormData.singleDeckSeatsCount) || 44,
      singleDeckPrice: Number(this.routeFormData.singleDeckPrice) || 119.90,
      busType: busTypeDesc,
      basePrice: basePrice,
      operatingDays: (Array.isArray(this.routeFormData.operatingDays) && this.routeFormData.operatingDays.length > 0)
        ? [...this.routeFormData.operatingDays]
        : ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'],
      status: 'ACTIVE'
    };

    // Sincroniza rota no MySQL
    try {
      const resp = await fetch('./api/rotas.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          acao: 'salvar',
          id: this.routeFormData.id,
          idBanco: routeObj.idBanco,
          companyId: this.routeFormData.companyId,
          companyName: companyName,
          originCity: this.routeFormData.originCity,
          originState: originState,
          destCity: this.routeFormData.destCity,
          destState: destState,
          departureTime: this.routeFormData.departureTime,
          arrivalTime: this.routeFormData.arrivalTime,
          duration: this.routeFormData.duration,
          platform: this.routeFormData.platform,
          gate: this.routeFormData.gate,
          busId: this.routeFormData.busId,
          licensePlate: this.routeFormData.licensePlate,
          fleetDecks: decks,
          deck1Price: Number(this.routeFormData.deck1Price) || 169.90,
          deck2Price: Number(this.routeFormData.deck2Price) || 129.90,
          singleDeckPrice: Number(this.routeFormData.singleDeckPrice) || 119.90,
          busType: busTypeDesc,
          basePrice: basePrice,
          operatingDays: routeObj.operatingDays
        })
      });
      const resJson = await resp.json();
      if (resJson && resJson.sucesso && resJson.rota_id) {
        routeObj.id = 'route-' + resJson.rota_id;
        routeObj.idBanco = resJson.rota_id;
      }
    } catch (eBanco) {
      console.warn('Backend PHP/MySQL indisponível ao salvar rota, salvando localmente:', eBanco);
    }

    if (this.routeFormData.id) {
      const idx = this.routes.findIndex(r => r.id === this.routeFormData.id || (routeObj.idBanco && r.idBanco === routeObj.idBanco));
      if (idx !== -1) this.routes[idx] = routeObj;
      this.showToast(`Rota ${routeObj.origin.name} ➔ ${routeObj.destination.name} atualizada com sucesso!`, 'success');
    } else {
      this.routes.unshift(routeObj);
      this.showToast(`Nova rota cadastrada com sucesso no banco de dados!`, 'success');
    }

    this.saveData(STORAGE_KEYS.ROUTES, this.routes);
    this.routeModal = false;
  },

  // Remove rota cadastrada
  async deleteRoute(routeId) {
    if (!confirm('Deseja realmente remover esta rota da malha?')) return;
    const rota = this.routes.find(r => r.id === routeId);
    this.routes = this.routes.filter(r => r.id !== routeId);
    this.saveData(STORAGE_KEYS.ROUTES, this.routes);
    this.showToast('Rota removida com sucesso.', 'info');

    // Sincroniza exclusão de rota no banco
    try {
      await fetch('./api/rotas.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          acao: 'excluir',
          id: routeId,
          idBanco: rota ? rota.idBanco : null
        })
      });
    } catch (e) { }
  },

  // Abre modal de cadastro ou edição de cupom
  abrirModalPromocao(promocao = null) {
    if (promocao) {
      this.promocaoFormulario = { ...promocao };
    } else {
      this.promocaoFormulario = {
        id: '',
        codigo: '',
        descricao: '',
        porcentagem: 10,
        validade: '',
        ativo: true
      };
    }
    this.modalPromocao = true;
  },

  // Salva ou atualiza cupom
  salvarPromocao() {
    const codigoLimpo = (this.promocaoFormulario.codigo || '').trim().toUpperCase().replace(/\s+/g, '');
    if (!codigoLimpo) {
      this.showToast('Informe o código da promoção (ex: VERAO10).', 'warning');
      return;
    }

    const valorPorcentagem = Number(this.promocaoFormulario.porcentagem);
    if (isNaN(valorPorcentagem) || valorPorcentagem <= 0 || valorPorcentagem > 100) {
      this.showToast('Informe uma porcentagem válida entre 1% e 100%.', 'warning');
      return;
    }

    let promocaoFinal = null;
    if (this.promocaoFormulario.id) {
      const idx = this.promocoes.findIndex(p => p.id === this.promocaoFormulario.id);
      if (idx !== -1) {
        this.promocoes[idx] = {
          ...this.promocoes[idx],
          ...this.promocaoFormulario,
          codigo: codigoLimpo,
          porcentagem: valorPorcentagem
        };
        promocaoFinal = this.promocoes[idx];
      }
      this.showToast(`Promoção ${codigoLimpo} atualizada com sucesso!`, 'success');
    } else {
      const nova = {
        id: 'promo-' + Date.now(),
        codigo: codigoLimpo,
        descricao: this.promocaoFormulario.descricao || 'Desconto em viagens',
        porcentagem: valorPorcentagem,
        validade: this.promocaoFormulario.validade || '2026-12-31',
        ativo: this.promocaoFormulario.ativo !== false
      };
      this.promocoes.unshift(nova);
      promocaoFinal = nova;
      this.showToast(`Promoção ${codigoLimpo} cadastrada com sucesso!`, 'success');
    }

    this.saveData(STORAGE_KEYS.PROMOTIONS, this.promocoes);
    this.modalPromocao = false;

    // Sincroniza em segundo plano com o banco
    if (promocaoFinal) {
      this.sincronizarCupomComBanco(promocaoFinal);
    }
  },

  // Alterna status do cupom
  alternarStatusPromocao(id) {
    const promo = this.promocoes.find(p => p.id === id);
    if (!promo) return;
    promo.ativo = !promo.ativo;
    this.saveData(STORAGE_KEYS.PROMOTIONS, this.promocoes);
    this.showToast(`Promoção ${promo.codigo} ${promo.ativo ? 'ativada' : 'desativada'}.`, 'info');
    this.sincronizarCupomComBanco(promo);
  },

  // Remove cupom 
  excluirPromocao(id) {
    const promo = this.promocoes.find(p => p.id === id);
    if (!promo) return;
    if (!confirm(`Deseja excluir a promoção ${promo.codigo}?`)) return;
    this.promocoes = this.promocoes.filter(p => p.id !== id);
    this.saveData(STORAGE_KEYS.PROMOTIONS, this.promocoes);
    this.showToast(`Promoção ${promo.codigo} excluída com sucesso.`, 'info');
    this.sincronizarCupomComBanco({ ...promo, ativo: false });
  },

  // Sincroniza cupom no banco
  async sincronizarCupomComBanco(promocao) {
    if (!promocao || !promocao.codigo) return;
    try {
      await fetch('api/cupons.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          codigo: promocao.codigo,
          tipo: 'percentual',
          valor: promocao.porcentagem,
          descricao: promocao.descricao,
          validade: promocao.validade || null,
          ativo: promocao.ativo !== false
        })
      });
    } catch (e) {
      console.warn('[Admin] Não foi possível sincronizar cupom com banco MySQL:', e);
    }
  },

  // Sincroniza todos os cupons
  async sincronizarTodasPromocoesComBanco() {
    try {
      const resp = await fetch('api/cupons.php');
      if (resp.ok) {
        const dados = await resp.json();
        if (dados && dados.sucesso && Array.isArray(dados.cupons) && dados.cupons.length > 0) {
          this.promocoes = dados.cupons.map(cupomBanco => ({
            id: 'promo-db-' + cupomBanco.id,
            idBanco: cupomBanco.id,
            codigo: (cupomBanco.codigo || '').trim().toUpperCase(),
            descricao: cupomBanco.descricao || `${cupomBanco.valor}% de Desconto`,
            porcentagem: Number(cupomBanco.valor) || 10,
            validade: cupomBanco.valido_ate || '',
            ativo: Number(cupomBanco.ativo) === 1
          }));
          this.saveData(STORAGE_KEYS.PROMOTIONS, this.promocoes);
        }
      }
    } catch (e) {
      console.warn('[Admin] Erro ao sincronizar cupons do banco MySQL:', e);
    }
  },

  // plataformas e portões
  abrirModalPlataformasPortoes() {
    this.novaPlataformaTexto = '';
    this.novoPortaoTexto = '';
    this.modalPlataformasPortoes = true;
  },

  adicionarPlataforma() {
    const nome = (this.novaPlataformaTexto || '').trim();
    if (!nome) {
      this.showToast('Informe a plataforma (ex: Plataforma 15).', 'warning');
      return;
    }
    const nomeFormatado = nome.toLowerCase().startsWith('plataforma') ? nome : `Plataforma ${nome}`;
    if (this.plataformas.some(p => p.toLowerCase() === nomeFormatado.toLowerCase())) {
      this.showToast('Esta plataforma já está cadastrada.', 'warning');
      return;
    }
    this.plataformas.push(nomeFormatado);
    this.saveData(STORAGE_KEYS.PLATFORMS, this.plataformas);
    this.novaPlataformaTexto = '';
    this.showToast(`${nomeFormatado} adicionada com sucesso!`, 'success');
  },

  removerPlataforma(nome) {
    if (this.plataformas.length <= 1) {
      this.showToast('Mantenha pelo menos uma plataforma cadastrada.', 'warning');
      return;
    }
    this.plataformas = this.plataformas.filter(p => p !== nome);
    this.saveData(STORAGE_KEYS.PLATFORMS, this.plataformas);
    this.showToast(`${nome} removida.`, 'info');
  },

  adicionarPortao() {
    const nome = (this.novoPortaoTexto || '').trim();
    if (!nome) {
      this.showToast('Informe o portão (ex: Portão G).', 'warning');
      return;
    }
    const nomeFormatado = (nome.toLowerCase().startsWith('portão') || nome.toLowerCase().startsWith('portao'))
      ? nome.replace(/^portao/i, 'Portão')
      : `Portão ${nome.toUpperCase()}`;
    if (this.portoes.some(p => p.toLowerCase() === nomeFormatado.toLowerCase())) {
      this.showToast('Este portão já está cadastrado.', 'warning');
      return;
    }
    this.portoes.push(nomeFormatado);
    this.saveData(STORAGE_KEYS.GATES, this.portoes);
    this.novoPortaoTexto = '';
    this.showToast(`${nomeFormatado} adicionado com sucesso!`, 'success');
  },

  removerPortao(nome) {
    if (this.portoes.length <= 1) {
      this.showToast('Mantenha pelo menos um portão cadastrado.', 'warning');
      return;
    }
    this.portoes = this.portoes.filter(p => p !== nome);
    this.saveData(STORAGE_KEYS.GATES, this.portoes);
    this.showToast(`${nome} removido.`, 'info');
  },

  // gestão de cidades
  abrirModalCidades() {
    this.limparFormularioCidade();
    this.buscaCidadeFiltro = '';
    this.modalCidades = true;
  },

  limparFormularioCidade() {
    this.cidadeFormulario = {
      id: null,
      nome: '',
      estado: 'SP',
      terminal: '',
      sigla: '',
      ativo: true
    };
  },

  editarCidade(cid) {
    this.cidadeFormulario = {
      id: cid.id,
      nome: cid.nome,
      estado: cid.estado || 'SP',
      terminal: cid.terminal || `Terminal Rodoviário de ${cid.nome}`,
      sigla: cid.sigla || '',
      ativo: cid.ativo !== false
    };
  },

  cancelarEdicaoCidade() {
    this.limparFormularioCidade();
  },

  async salvarCidade() {
    const nome = (this.cidadeFormulario.nome || '').trim();
    const estado = (this.cidadeFormulario.estado || 'SP').trim().toUpperCase();
    let terminal = (this.cidadeFormulario.terminal || '').trim();
    let sigla = (this.cidadeFormulario.sigla || '').trim().toLowerCase();

    if (!nome) {
      this.showToast('Informe o nome da cidade.', 'warning');
      return;
    }

    if (!terminal) {
      terminal = `Terminal Rodoviário de ${nome}`;
    }

    if (!sigla) {
      sigla = nome.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z]/g, '').slice(0, 3);
      if (sigla.length < 2) {
        sigla = estado.toLowerCase() + Math.floor(Math.random() * 90 + 10);
      }
    }

    const payload = {
      id: this.cidadeFormulario.id,
      nome: nome,
      estado: estado,
      terminal: terminal,
      sigla: sigla,
      ativo: this.cidadeFormulario.ativo !== false
    };

    if (this.cidadeFormulario.id) {
      // Atualiza cidade existente
      const indice = this.cidades.findIndex(c => c.id === this.cidadeFormulario.id);
      if (indice !== -1) {
        this.cidades[indice] = {
          ...this.cidades[indice],
          ...payload
        };
      }
      this.showToast(`Cidade ${nome} atualizada com sucesso!`, 'success');
    } else {
      // Valida duplicidade de cidade
      if (this.cidades.some(c => c.nome.toLowerCase() === nome.toLowerCase() && c.estado.toUpperCase() === estado)) {
        this.showToast('Esta cidade já está cadastrada.', 'warning');
        return;
      }
      const novaCidade = {
        ...payload,
        id: 'cid-' + Date.now(),
        total_rotas: 0
      };
      this.cidades.push(novaCidade);
      this.showToast(`Cidade ${nome} cadastrada com sucesso!`, 'success');
    }

    this.saveData(STORAGE_KEYS.CITIES, this.cidades);
    this.limparFormularioCidade();

    // Sincroniza cidade via API PHP
    try {
      const resp = await fetch('./api/cidades.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          acao: 'salvar',
          ...payload
        })
      });
      if (resp.ok) {
        const resJson = await resp.json();
        if (resJson.sucesso && resJson.cidade) {
          const idx = this.cidades.findIndex(c => c.nome.toLowerCase() === nome.toLowerCase() && c.estado.toUpperCase() === estado);
          if (idx !== -1) {
            this.cidades[idx].id = resJson.cidade.id;
            this.cidades[idx].sigla = resJson.cidade.sigla;
            this.saveData(STORAGE_KEYS.CITIES, this.cidades);
          }
        }
      }
    } catch (e) {
    }
  },

  async alternarStatusCidade(cid) {
    cid.ativo = !(cid.ativo !== false);
    this.saveData(STORAGE_KEYS.CITIES, this.cidades);
    this.showToast(`Cidade ${cid.nome} ${cid.ativo ? 'ativada' : 'desativada'}.`, 'info');

    try {
      await fetch('./api/cidades.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          acao: 'alternar_status',
          id: cid.id
        })
      });
    } catch (e) { }
  },

  async removerCidade(cid) {
    // Bloqueia erotas ao cencalar****** testar
    const rotasVinculadas = this.routes.filter(r =>
      (r.originCity && r.originCity.toLowerCase() === cid.nome.toLowerCase()) ||
      (r.destCity && r.destCity.toLowerCase() === cid.nome.toLowerCase())
    ).length;

    if (rotasVinculadas > 0) {
      this.showToast(`Não é possível excluir ${cid.nome}: existem ${rotasVinculadas} rota(s) vinculada(s). Desative a cidade em vez de excluir.`, 'warning');
      return;
    }

    if (this.cidades.length <= 1) {
      this.showToast('Mantenha pelo menos uma cidade cadastrada.', 'warning');
      return;
    }

    this.cidades = this.cidades.filter(c => c.id !== cid.id && c.nome !== cid.nome);
    this.saveData(STORAGE_KEYS.CITIES, this.cidades);
    this.showToast(`Cidade ${cid.nome} removida com sucesso.`, 'info');

    try {
      await fetch('./api/cidades.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          acao: 'excluir',
          id: cid.id
        })
      });
    } catch (e) { }
  },
  async sincronizarCidadesComBanco() {
    try {
      const resp = await fetch('./api/cidades.php');
      if (!resp.ok) return;
      const json = await resp.json();
      if (json && json.sucesso && Array.isArray(json.cidades) && json.cidades.length > 0) {
        this.cidades = json.cidades.map(c => ({
          id: c.id,
          nome: c.nome,
          estado: c.estado,
          sigla: c.sigla,
          terminal: c.terminal,
          ativo: c.ativo !== false,
          total_rotas: c.total_rotas || 0
        }));
        this.saveData(STORAGE_KEYS.CITIES, this.cidades);
      }
    } catch (e) { }
  },
  obterCidadesFiltradas() {
    const termo = (this.buscaCidadeFiltro || '').trim().toLowerCase();
    if (!termo) return this.cidades;
    return this.cidades.filter(c =>
      (c.nome && c.nome.toLowerCase().includes(termo)) ||
      (c.estado && c.estado.toLowerCase().includes(termo)) ||
      (c.terminal && c.terminal.toLowerCase().includes(termo)) ||
      (c.sigla && c.sigla.toLowerCase().includes(termo))
    );
  },
  obterTotalRotasCidade(nomeCidade) {
    if (!nomeCidade) return 0;
    return this.routes.filter(r =>
      (r.originCity && r.originCity.toLowerCase() === nomeCidade.toLowerCase()) ||
      (r.destCity && r.destCity.toLowerCase() === nomeCidade.toLowerCase())
    ).length;
  },

  //passageiro
  obterNomePassageiro(passageiro) {
    if (!passageiro) return '-';
    return passageiro.nomeCompleto || passageiro.fullName || passageiro.nome || '-';
  },

  obterCpfPassageiro(passageiro) {
    if (!passageiro) return '-';
    return passageiro.cpf || '-';
  },

  formatarCnpj(cnpj) {
    if (!cnpj) return '-';
    const digitos = String(cnpj).replace(/\D/g, '').slice(0, 14);
    if (digitos.length !== 14) return cnpj;
    return digitos.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  },

  alternarOrdenacaoVendas(coluna) {
    if (this.filtroVendas.colunaOrdenacao === coluna) {
      this.filtroVendas.direcaoOrdenacao = this.filtroVendas.direcaoOrdenacao === 'ASC' ? 'DESC' : 'ASC';
    } else {
      this.filtroVendas.colunaOrdenacao = coluna;
      this.filtroVendas.direcaoOrdenacao = (coluna === 'data_hora') ? 'DESC' : 'ASC';
    }
    this.carregarVendasDoBancoComFiltrosSQL();
  },

  // Limpa filtros da tabela
  limparFiltrosVendas() {
    this.filtroVendas.periodo = 'hoje';
    this.filtroVendas.dataInicio = '';
    this.filtroVendas.dataFim = '';
    this.filtroVendas.data = '';
    this.filtroVendas.totem = 'todos';
    this.filtroVendas.formaPagamento = 'todas';
    this.filtroVendas.tipoBusca = 'nome';
    this.filtroVendas.termoBusca = '';
    this.filtroVendas.colunaOrdenacao = 'data_hora';
    this.filtroVendas.direcaoOrdenacao = 'DESC';
    this.filtroVendas.paginaAtual = 1;
    this.carregarVendasDoBancoComFiltrosSQL();
  },

  // Executa consulta SQL parametrizada na API
  async carregarVendasDoBancoComFiltrosSQL() {
    try {
      this.filtroVendas.paginaAtual = 1;
      const parametros = new URLSearchParams();

      const periodo = this.filtroVendas.periodo || 'todos';
      const hoje = new Date();
      const ano = hoje.getFullYear();
      const mes = String(hoje.getMonth() + 1).padStart(2, '0');
      const dia = String(hoje.getDate()).padStart(2, '0');
      const hojeStr = `${ano}-${mes}-${dia}`;

      if (periodo === 'hoje') {
        parametros.set('data_inicio', hojeStr);
        parametros.set('data_fim', hojeStr);
      } else if (periodo === '7dias') {
        const limite = new Date();
        limite.setDate(limite.getDate() - 6);
        const lAno = limite.getFullYear();
        const lMes = String(limite.getMonth() + 1).padStart(2, '0');
        const lDia = String(limite.getDate()).padStart(2, '0');
        parametros.set('data_inicio', `${lAno}-${lMes}-${lDia}`);
        parametros.set('data_fim', hojeStr);
      } else if (periodo === '30dias') {
        const limite = new Date();
        limite.setDate(limite.getDate() - 29);
        const lAno = limite.getFullYear();
        const lMes = String(limite.getMonth() + 1).padStart(2, '0');
        const lDia = String(limite.getDate()).padStart(2, '0');
        parametros.set('data_inicio', `${lAno}-${lMes}-${lDia}`);
        parametros.set('data_fim', hojeStr);
      } else if (periodo === 'mes') {
        parametros.set('data_inicio', `${ano}-${mes}-01`);
        parametros.set('data_fim', hojeStr);
      } else if (periodo === 'personalizado') {
        if (this.filtroVendas.dataInicio) parametros.set('data_inicio', this.filtroVendas.dataInicio);
        if (this.filtroVendas.dataFim) parametros.set('data_fim', this.filtroVendas.dataFim);
      }

      if (this.filtroVendas.data) parametros.set('data', this.filtroVendas.data);
      if (this.filtroVendas.totem && this.filtroVendas.totem !== 'todos') parametros.set('totem', this.filtroVendas.totem);
      if (this.filtroVendas.formaPagamento && this.filtroVendas.formaPagamento !== 'todas') parametros.set('forma_pagamento', this.filtroVendas.formaPagamento);
      if (this.filtroVendas.tipoBusca) parametros.set('tipo_busca', this.filtroVendas.tipoBusca);
      if (this.filtroVendas.termoBusca) parametros.set('termo_busca', this.filtroVendas.termoBusca.trim());
      if (this.filtroVendas.colunaOrdenacao) parametros.set('ordenar_por', this.filtroVendas.colunaOrdenacao);
      if (this.filtroVendas.direcaoOrdenacao) parametros.set('direcao_ordem', this.filtroVendas.direcaoOrdenacao);

      const resposta = await fetch('./api/vendas.php?' + parametros.toString());
      if (!resposta.ok) return;
      const json = await resposta.json();
      if (!json || !json.sucesso) return;

      if (Array.isArray(json.vendas)) {
        this.sales = json.vendas.map(v => ({
          id: 'SALE-' + v.id,
          locator: v.codigo_venda,
          totemId: 'totem_0' + (v.totem_id || 1),
          totemName: v.nome_totem || 'Totem #01',
          timestamp: v.criado_em_iso || v.data_hora,
          dateStr: v.data_hora,
          dateIso: (v.criado_em_iso ? v.criado_em_iso.substring(0, 10) : '') || this.normalizarDataParaIso(v.data_hora),
          passenger: {
            fullName: v.passageiro_nome,
            cpf: v.passageiro_cpf
          },
          trip: {
            origin: { name: v.cidade_origem || 'São Paulo' },
            destination: { name: v.cidade_destino || 'Destino' },
            company: { name: v.viacao || 'Viação' }
          },
          seats: v.poltronas ? v.poltronas.split(', ') : ['-'],
          payment: {
            method: v.metodo_pagamento || 'PIX',
            totalPaid: parseFloat(v.valor_total) || 0,
            status: v.status_pagamento || 'APROVADO'
          },
          status: v.status || 'CONCLUIDA'
        }));
      }
    } catch (erro) {
    }
  },



  // Formata valor em moeda
  formatCurrency(val) {
    if (val === null || val === undefined || isNaN(Number(val))) return 'R$ 0,00';
    if (typeof window !== 'undefined' && window.formatCurrency) {
      return window.formatCurrency(val);
    }
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(val) || 0);
  },

  formatCount(count) {
    return Number(count) || 0;
  },

  // Exibe notificação toast na interface
  showToast(message, type = 'info') {
    const id = Date.now();
    this.toasts.push({ id, message, type });
    setTimeout(() => {
      this.toasts = this.toasts.filter(t => t.id !== id);
    }, 3500);
  },


  get filteredTotens() {
    if (this.selectedTotemFilter === 'all') return this.totens;
    return this.totens.filter(t => t.id === this.selectedTotemFilter);
  },

  get totalNetworkRevenue() {
    return this.totens.reduce((acc, t) => acc + (t.todayRevenue || 0), 0);
  },

  get totalNetworkTickets() {
    return this.totens.reduce((acc, t) => acc + (t.todaySalesCount || 0), 0);
  },

  get averageNetworkTicket() {
    const totalTk = this.totalNetworkTickets;
    return totalTk > 0 ? (this.totalNetworkRevenue / totalTk) : 0;
  },

  //formeto de data
  normalizarDataParaIso(dataValor) {
    if (!dataValor) return '';
    const s = String(dataValor).trim();
    if (/^\d{2}\/\d{2}\/\d{4}/.test(s)) {
      const partes = s.substring(0, 10).split('/');
      return `${partes[2]}-${partes[1]}-${partes[0]}`;
    }
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
      return s.substring(0, 10);
    }

    try {
      const d = new Date(s);
      if (!isNaN(d.getTime())) {
        const ano = d.getFullYear();
        const mes = String(d.getMonth() + 1).padStart(2, '0');
        const dia = String(d.getDate()).padStart(2, '0');
        return `${ano}-${mes}-${dia}`;
      }
    } catch (e) { }
    return s.substring(0, 10);
  },

  pertenceAoPeriodo(dataVenda, periodo, dataInicio, dataFim) {
    if (!dataVenda) return false;
    const dVenda = this.normalizarDataParaIso(dataVenda);
    if (!dVenda) return false;

    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const dia = String(hoje.getDate()).padStart(2, '0');
    const hojeStr = `${ano}-${mes}-${dia}`;

    if (periodo === 'hoje') {
      return dVenda === hojeStr;
    }

    if (periodo === '7dias') {
      const limite = new Date();
      limite.setDate(limite.getDate() - 6);
      const lAno = limite.getFullYear();
      const lMes = String(limite.getMonth() + 1).padStart(2, '0');
      const lDia = String(limite.getDate()).padStart(2, '0');
      const limiteStr = `${lAno}-${lMes}-${lDia}`;
      return dVenda >= limiteStr && dVenda <= hojeStr;
    }

    if (periodo === '30dias') {
      const limite = new Date();
      limite.setDate(limite.getDate() - 29);
      const lAno = limite.getFullYear();
      const lMes = String(limite.getMonth() + 1).padStart(2, '0');
      const lDia = String(limite.getDate()).padStart(2, '0');
      const limiteStr = `${lAno}-${lMes}-${lDia}`;
      return dVenda >= limiteStr && dVenda <= hojeStr;
    }

    if (periodo === 'mes') {
      const inicioMesStr = `${ano}-${mes}-01`;
      return dVenda >= inicioMesStr && dVenda <= hojeStr;
    }

    if (periodo === 'personalizado') {
      const dInicio = this.normalizarDataParaIso(dataInicio);
      const dFim = this.normalizarDataParaIso(dataFim);
      if (dInicio && dVenda < dInicio) return false;
      if (dFim && dVenda > dFim) return false;
      return true;
    }
    return true;
  },

  // Valida período do filtro de totem
  pertenceAoPeriodoTotem(dataVenda) {
    return this.pertenceAoPeriodo(dataVenda, this.filtroPeriodoTotem, this.filtroDataInicioTotem, this.filtroDataFimTotem);
  },

  // Valida período do extrato de viação
  pertenceAoPeriodoCompanhia(dataVenda) {
    return this.pertenceAoPeriodo(dataVenda, this.filtroPeriodoCompanhia, this.filtroDataInicioCompanhia, this.filtroDataFimCompanhia);
  },

  // Valida período do relatório de vendas
  pertenceAoPeriodoVendas(dataVenda) {
    return this.pertenceAoPeriodo(dataVenda, this.filtroVendas.periodo, this.filtroVendas.dataInicio, this.filtroVendas.dataFim);
  },

  // Faturamento e repasses por empresa de onibs
  get companyPayouts() {
    const listaBase = (this.todasVendas && this.todasVendas.length > 0) ? this.todasVendas : (this.sales || []);

    // Filtra vendas do periodo selecionado para empresas
    const vendasPeriodo = listaBase.filter(v => {
      const dataIso = v.dateIso || this.normalizarDataParaIso(v.dateStr || v.timestamp || '');
      return this.pertenceAoPeriodoCompanhia(dataIso);
    });

    return this.companies.map(comp => {
      const nomeCompLimpo = (comp.name || '').toLowerCase().trim();

      const vendasDaEmpresa = vendasPeriodo.filter(s => {
        const nomeViacaoVenda = (s.trip && s.trip.company && s.trip.company.name) ? s.trip.company.name.toLowerCase().trim() : '';
        if (!nomeViacaoVenda || !nomeCompLimpo) return false;
        if (nomeViacaoVenda === nomeCompLimpo) return true;
        if (nomeCompLimpo.includes('1001') && nomeViacaoVenda.includes('1001')) return true;
        if (nomeCompLimpo.includes('cometa') && nomeViacaoVenda.includes('cometa')) return true;
        if (nomeCompLimpo.includes('catarinense') && nomeViacaoVenda.includes('catarinense')) return true;
        if (nomeCompLimpo.includes('gontijo') && nomeViacaoVenda.includes('gontijo')) return true;
        if (nomeCompLimpo.includes('chrizin') && nomeViacaoVenda.includes('chrizin')) return true;
        return nomeViacaoVenda.includes(nomeCompLimpo) || nomeCompLimpo.includes(nomeViacaoVenda);
      });

      const count = vendasDaEmpresa.length;
      const gross = vendasDaEmpresa.reduce((acc, v) => acc + (v.payment ? Number(v.payment.totalPaid) || 0 : 0), 0);
      const commissionRate = (comp.commissionPercent || 8.5) / 100;
      const commissionAmount = gross * commissionRate;
      const netAmount = gross - commissionAmount;

      return {
        ...comp,
        count,
        gross,
        commissionAmount,
        netAmount,
        payoutStatus: 'PENDING_APPROVAL'
      };
    });
  },

  // Totais consolidados de repasse às viações
  get totalCompanyPayouts() {
    const payouts = this.companyPayouts || [];
    const totalGross = payouts.reduce((acc, p) => acc + (Number(p.gross) || 0), 0);
    const totalCommission = payouts.reduce((acc, p) => acc + (Number(p.commissionAmount) || 0), 0);
    const totalNet = payouts.reduce((acc, p) => acc + (Number(p.netAmount) || 0), 0);
    const totalPassagens = payouts.reduce((acc, p) => acc + (Number(p.count) || 0), 0);
    return {
      totalGross,
      totalCommission,
      totalNet,
      totalEmpresas: payouts.length,
      totalPassagens
    };
  },

  // Vendas e faturamento agrupados por totem
  get salesByTotem() {
    const listaBase = (this.todasVendas && this.todasVendas.length > 0) ? this.todasVendas : (this.sales || []);

    // Filtra vendas do periodo selecionado
    const vendasPeriodo = listaBase.filter(v => {
      const dataIso = v.dateIso || this.normalizarDataParaIso(v.dateStr || v.timestamp || '');
      return this.pertenceAoPeriodoTotem(dataIso);
    });

    // Total consolidado de faturamento do periodo (para percentual de participacao)
    const totalGrossPeriodo = vendasPeriodo.reduce((acc, v) => acc + (v.payment ? Number(v.payment.totalPaid) || 0 : 0), 0);

    return this.totens.map(t => {
      const vendasTotem = vendasPeriodo.filter(s => {
        if (s.totemName && t.name && s.totemName.trim().toLowerCase() === t.name.trim().toLowerCase()) return true;
        if (s.totemId && t.id) {
          if (s.totemId === t.id) return true;
          const numS = String(s.totemId).replace(/\D/g, '');
          const numT = String(t.id).replace(/\D/g, '');
          if (numS && numT && parseInt(numS, 10) === parseInt(numT, 10)) return true;
        }
        return false;
      });

      let gross = 0;
      let count = vendasTotem.length;
      let pix = 0;
      let card = 0;

      vendasTotem.forEach(v => {
        const val = v.payment ? Number(v.payment.totalPaid) || 0 : 0;
        const met = v.payment ? (v.payment.method || '').toUpperCase() : '';
        gross += val;
        if (met.includes('PIX')) {
          pix += val;
        } else {
          card += val;
        }
      });

      const avg = count > 0 ? (gross / count) : 0;
      const commission = gross * 0.085;
      const sharePercentage = totalGrossPeriodo > 0 ? Math.round((gross / totalGrossPeriodo) * 100) : 0;

      return {
        ...t,
        gross,
        count,
        avg,
        pix,
        card,
        commission,
        sharePercentage
      };
    });
  },

  // Totais consolidados de vendas por totem
  get totaisSalesByTotem() {
    const lista = this.salesByTotem || [];
    const count = lista.reduce((acc, t) => acc + (t.count || 0), 0);
    const pix = lista.reduce((acc, t) => acc + (t.pix || 0), 0);
    const card = lista.reduce((acc, t) => acc + (t.card || 0), 0);
    const commission = lista.reduce((acc, t) => acc + (t.commission || 0), 0);
    const gross = lista.reduce((acc, t) => acc + (t.gross || 0), 0);
    const sharePercentage = gross > 0 ? 100 : 0;

    return {
      count,
      pix,
      card,
      commission,
      gross,
      sharePercentage
    };
  },

  // Lista consolidada de clientes/passageiros
  get clientesCadastrados() {
    const mapa = new Map();

    this.clientes.forEach(c => {
      if (c && c.cpf) {
        mapa.set(c.cpf, { ...c });
      }
    });

    this.sales.forEach(s => {
      const p = s.passenger;
      if (p && p.cpf) {
        const nome = p.nomeCompleto || p.fullName || p.nome || 'Passageiro';
        if (!mapa.has(p.cpf)) {
          mapa.set(p.cpf, {
            id: 'cli-' + p.cpf.replace(/\D/g, ''),
            nomeCompleto: nome,
            cpf: p.cpf,
            telefone: p.telefone || p.phone || '(11) 98000-0000',
            email: p.email || `${nome.toLowerCase().split(' ')[0]}@email.com`,
            dataNascimento: p.dataNascimento || '1992-06-15',
            tipoDocumento: p.tipoDocumento || 'RG',
            numeroDocumento: p.numeroDocumento || '00.000.000-0',
            criadoEm: s.dateStr || (s.timestamp ? s.timestamp.replace('T', ' ').slice(0, 19) : new Date().toLocaleString('pt-BR')),
            origemTotem: s.totemName || 'Totem #01'
          });
        }
      }
    });

    return Array.from(mapa.values());
  },

  // Clientes filtrados pela busca
  get clientesFiltrados() {
    const termo = (this.buscaCliente || '').trim().toLowerCase();
    const lista = this.clientesCadastrados;
    if (!termo) return lista;

    return lista.filter(c =>
      (c.nomeCompleto && c.nomeCompleto.toLowerCase().includes(termo)) ||
      (c.cpf && c.cpf.includes(termo)) ||
      (c.email && c.email.toLowerCase().includes(termo)) ||
      (c.telefone && c.telefone.includes(termo))
    );
  },

  // Retorna vendas filtradas e ordenadas
  // Vendas filtradas e ordenadas
  get vendasFiltradas() {
    let lista = [...(this.sales || [])];

    // Filtra por período
    if (this.filtroVendas.periodo && this.filtroVendas.periodo !== 'todos') {
      lista = lista.filter(s => {
        const d = s.dateIso || this.normalizarDataParaIso(s.dateStr || s.timestamp || '');
        return this.pertenceAoPeriodoVendas(d);
      });
    }

    // Filtra por data específica
    if (this.filtroVendas.data) {
      const dataFiltro = this.filtroVendas.data;
      const partes = dataFiltro.split('-');
      const dataBr = partes.length === 3 ? `${partes[2]}/${partes[1]}/${partes[0]}` : dataFiltro;
      lista = lista.filter(s => {
        const d = (s.dateStr || s.timestamp || '');
        return d.includes(dataBr) || d.includes(dataFiltro);
      });
    }

    // Filtra por totem
    if (this.filtroVendas.totem && this.filtroVendas.totem !== 'todos') {
      const termoTotem = this.filtroVendas.totem.toLowerCase();
      lista = lista.filter(s => {
        const nomeTotem = (s.totemName || '').toLowerCase();
        const idTotem = (s.totemId || '').toLowerCase();
        return nomeTotem.includes(termoTotem) || idTotem.includes(termoTotem);
      });
    }

    // Filtra por método de pagamento
    if (this.filtroVendas.formaPagamento && this.filtroVendas.formaPagamento !== 'todas') {
      const forma = this.filtroVendas.formaPagamento.toUpperCase();
      lista = lista.filter(s => {
        const met = s.payment ? (s.payment.method || '').toUpperCase() : '';
        return met.includes(forma);
      });
    }

    // Filtra por campo selecionado
    const termo = (this.filtroVendas.termoBusca || '').trim().toLowerCase();
    if (termo) {
      if (this.filtroVendas.tipoBusca === 'cpf') {
        const termoLimpo = termo.replace(/\D/g, '');
        lista = lista.filter(s => {
          const cpf = (this.obterCpfPassageiro(s.passenger) || '').toLowerCase();
          const cpfLimpo = cpf.replace(/\D/g, '');
          return cpf.includes(termo) || (termoLimpo && cpfLimpo.includes(termoLimpo));
        });
      } else if (this.filtroVendas.tipoBusca === 'localizador') {
        lista = lista.filter(s => (s.locator || '').toLowerCase().includes(termo));
      } else {
        // Busca por nome do passageiro
        lista = lista.filter(s => (this.obterNomePassageiro(s.passenger) || '').toLowerCase().includes(termo));
      }
    }

    // Ordena resultados
    const coluna = this.filtroVendas.colunaOrdenacao;
    const direcao = this.filtroVendas.direcaoOrdenacao === 'ASC' ? 1 : -1;

    lista.sort((a, b) => {
      if (coluna === 'passageiro_nome') {
        const nomeA = (this.obterNomePassageiro(a.passenger) || '').toLowerCase();
        const nomeB = (this.obterNomePassageiro(b.passenger) || '').toLowerCase();
        return nomeA.localeCompare(nomeB) * direcao;
      }
      if (coluna === 'valor_pago') {
        const valA = a.payment ? Number(a.payment.totalPaid) || 0 : 0;
        const valB = b.payment ? Number(b.payment.totalPaid) || 0 : 0;
        return (valA - valB) * direcao;
      }
      // Ordena por data e hora
      const dataA = a.timestamp || a.dateStr || '';
      const dataB = b.timestamp || b.dateStr || '';
      return dataA.localeCompare(dataB) * direcao;
    });

    return lista;
  },

  // Total de páginas de vendas (20 por página)
  get totalPaginasVendas() {
    const total = (this.vendasFiltradas || []).length;
    const porPagina = this.filtroVendas.itensPorPagina || 20;
    return Math.max(1, Math.ceil(total / porPagina));
  },

  // Vendas paginadas da página ativa
  get vendasPaginadas() {
    const totalPaginas = this.totalPaginasVendas;
    const pagina = Math.min(Math.max(1, this.filtroVendas.paginaAtual || 1), totalPaginas);
    const porPagina = this.filtroVendas.itensPorPagina || 20;
    const inicio = (pagina - 1) * porPagina;
    return (this.vendasFiltradas || []).slice(inicio, inicio + porPagina);
  },

  // Altera página ativa de vendas
  mudarPaginaVendas(novaPagina) {
    if (novaPagina >= 1 && novaPagina <= this.totalPaginasVendas) {
      this.filtroVendas.paginaAtual = novaPagina;
    }
  },

  // Consolida totais gerais e por método de pagamento
  get resumoVendasFiltradas() {
    const lista = this.vendasFiltradas || [];
    let totalPago = 0;
    let totalPix = 0;
    let qtdPix = 0;
    let totalCredito = 0;
    let qtdCredito = 0;
    let totalDebito = 0;
    let qtdDebito = 0;
    let totalOutros = 0;
    let qtdOutros = 0;

    lista.forEach(s => {
      const val = s.payment ? Number(s.payment.totalPaid) || 0 : 0;
      totalPago += val;
      const met = (s.payment ? s.payment.method || '' : '').toUpperCase();
      if (met.includes('PIX')) {
        totalPix += val;
        qtdPix++;
      } else if (met.includes('CRED') || met.includes('CRÉD')) {
        totalCredito += val;
        qtdCredito++;
      } else if (met.includes('DEB') || met.includes('DÉB')) {
        totalDebito += val;
        qtdDebito++;
      } else {
        totalOutros += val;
        qtdOutros++;
      }
    });

    return {
      totalVendas: lista.length,
      totalPago,
      totalRecebido: totalPago,
      totalPix,
      qtdPix,
      totalCredito,
      qtdCredito,
      totalDebito,
      qtdDebito,
      totalOutros,
      qtdOutros
    };
  },
});
