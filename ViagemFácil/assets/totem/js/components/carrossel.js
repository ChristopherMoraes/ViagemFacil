// Componente Alpine do carrossel de destinos em destaque
export const criarCarrossel = () => ({
  indiceAtual: 0,
  intervaloAuto: null,
  timeoutPausa: null,
  estaPausado: false,
  itensPorVisualizacao: 4,
  toqueInicioX: 0,
  intervaloMs: 3000,

  // Inicializa responsividade, observadores e rolagem automática
  init() {
    this.atualizarItensPorVisualizacao();
    window.addEventListener('resize', () => this.atualizarItensPorVisualizacao());

    if (this.$watch) {
      this.$watch('$store.app.etapaAtual', (etapa) => {
        if (etapa === 0) {
          this.estaPausado = false;
          this.iniciarRolagemAutomatica();
        } else {
          this.pararRolagemAutomatica();
        }
      });
    }

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pararRolagemAutomatica();
      } else if (this.eEtapaBoasVindas()) {
        this.estaPausado = false;
        this.iniciarRolagemAutomatica();
      }
    });

    this.iniciarRolagemAutomatica();
  },

  // Verifica se está na tela de boas-vindas
  eEtapaBoasVindas() {
    const appStore = window.Alpine ? window.Alpine.store('app') : null;
    return !appStore || appStore.etapaAtual === 0;
  },

  // Ajusta quantidade de cards visíveis por largura de tela
  atualizarItensPorVisualizacao() {
    const width = window.innerWidth;
    if (width < 576) {
      this.itensPorVisualizacao = 1;
    } else if (width < 768) {
      this.itensPorVisualizacao = 2;
    } else if (width < 1200) {
      this.itensPorVisualizacao = 3;
    } else {
      this.itensPorVisualizacao = 4;
    }
    const max = this.obterIndiceMaximo();
    if (this.indiceAtual > max) {
      this.indiceAtual = Math.max(0, max);
    }
  },

  // Retorna total de destinos disponíveis
  get totalItens() {
    const dataStore = window.Alpine ? window.Alpine.store('data') : null;
    return (dataStore && dataStore.destinosEmDestaque) ? dataStore.destinosEmDestaque.length : 0;
  },

  // Limite máximo do índice do carrossel
  obterIndiceMaximo() {
    return Math.max(0, this.totalItens - this.itensPorVisualizacao);
  },

  // Avança para o próximo slide
  proximo() {
    const max = this.obterIndiceMaximo();
    if (this.indiceAtual >= max) {
      this.indiceAtual = 0;
    } else {
      this.indiceAtual++;
    }
    this.reiniciarRolagemAutomatica();
  },

  // Volta para o slide anterior
  anterior() {
    const max = this.obterIndiceMaximo();
    if (this.indiceAtual <= 0) {
      this.indiceAtual = max;
    } else {
      this.indiceAtual--;
    }
    this.reiniciarRolagemAutomatica();
  },

  // Navega diretamente para um índice específico
  irPara(idx) {
    const max = this.obterIndiceMaximo();
    this.indiceAtual = Math.min(Math.max(0, idx), max);
    this.reiniciarRolagemAutomatica();
  },

  // Inicia rolagem automática contínua
  iniciarRolagemAutomatica() {
    this.pararRolagemAutomatica();
    this.autoInterval = setInterval(() => {
      if (!this.estaPausado && this.eEtapaBoasVindas()) {
        const max = this.obterIndiceMaximo();
        if (this.indiceAtual >= max) {
          this.indiceAtual = 0;
        } else {
          this.indiceAtual++;
        }
      }
    }, this.intervaloMs);
  },

  // Interrompe rolagem automática e timers de pausa
  pararRolagemAutomatica() {
    if (this.autoInterval) {
      clearInterval(this.autoInterval);
      this.autoInterval = null;
    }
    if (this.timeoutPausa) {
      clearTimeout(this.timeoutPausa);
      this.timeoutPausa = null;
    }
  },

  // Reinicia rolagem automática
  reiniciarRolagemAutomatica() {
    this.iniciarRolagemAutomatica();
  },

  // Pausa rolagem por 4 segundos após interação
  pausar() {
    this.estaPausado = true;
    if (this.timeoutPausa) clearTimeout(this.timeoutPausa);
    this.timeoutPausa = setTimeout(() => {
      this.retomar();
    }, 4000);
  },

  // Retoma rolagem automática
  retomar() {
    this.estaPausado = false;
    if (this.timeoutPausa) {
      clearTimeout(this.timeoutPausa);
      this.timeoutPausa = null;
    }
  },

  // Captura início do toque na tela
  aoIniciarToque(e) {
    if (e.touches && e.touches[0]) {
      this.toqueInicioX = e.touches[0].clientX;
    }
    this.pausar();
  },

  // Detecta direção do deslize (swipe) e move slide
  aoFinalizarToque(e) {
    if (e.changedTouches && e.changedTouches[0]) {
      const diff = this.toqueInicioX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 40) {
        if (diff > 0) {
          this.proximo();
        } else {
          this.anterior();
        }
      }
    }
    this.retomar();
  },

  // Seleciona destino clicado e avança etapa
  selecionarDestino(cidadeId) {
    const dataStore = window.Alpine ? window.Alpine.store('data') : null;
    if (dataStore) {
      dataStore.selecionarDestinoEIniciar(cidadeId);
    }
  }
});

