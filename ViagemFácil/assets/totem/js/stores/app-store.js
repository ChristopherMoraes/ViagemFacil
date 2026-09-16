import { playSound } from '../../../compartilhados/js/dom.js';
import { formatCPF, formatPhone } from '../../../compartilhados/js/formatters.js';

export const criarStoreApp = () => ({
  etapaAtual: 0, // Indica a etapa atual do fluxo do totem (0: Início até 6: Bilhete de Embarque)
  titulosEtapas: [
    'Início',
    'Escolha da Viagem',
    'Seleção de Poltronas',
    'Serviços Adicionais',
    'Dados do Passageiro',
    'Pagamento',
    'Bilhete de Embarque'
  ],

  somAtivado: true,
  horaAtual: '',
  dataAtualStr: '',

  avisoInatividade: false,
  segundosInatividadeRestantes: 15, //TEMPO DE INATIVIDADE
  temporizadorInatividadeId: null,
  contagemInatividadeId: null,

  tecladoVirtual: {
    aberto: false,
    campoAtivo: '',
    rotuloCampoAtivo: '',
    valor: '',
    tipo: 'text',
    shift: false,
    capsLock: false
  },

  notificacoes: [],

  totemId: 4,
  situacaoTotem: 'ONLINE',
  totemNome: 'Totem #04',
  totemLocalizacao: 'Terminal Rodoviário Tietê • Totem #04',
  temporizadorStatusTotem: null,

  init() {
    this.atualizarRelogio();
    setInterval(() => this.atualizarRelogio(), 1000);
    this.iniciarMonitoramentoInatividade();
    this.verificarStatusTotem();
    this.temporizadorStatusTotem = setInterval(() => this.verificarStatusTotem(), 3000);
  },

  async verificarStatusTotem() {
    try {
      const resp = await fetch(`api/totens.php?id=${this.totemId}`);
      if (!resp.ok) return;
      const json = await resp.json();
      if (json && json.sucesso && json.totem) {
        const novaSituacao = json.totem.situacao || 'ONLINE';
        if (this.situacaoTotem !== novaSituacao) {
          console.log(`[Totem] Status do terminal alterado para: ${novaSituacao}`);
          this.situacaoTotem = novaSituacao;
          if (novaSituacao === 'OFFLINE' && this.etapaAtual > 0 && this.etapaAtual < 6) {
            this.reiniciarParaBoasVindas();
          }
        }
      }
    } catch (e) {

    }
  },

  get eTotemOperacional() {
    return this.situacaoTotem === 'ONLINE';
  },

  atualizarRelogio() {
    const agora = new Date();
    this.horaAtual = agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    this.dataAtualStr = agora.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' });
  },

  irParaEtapa(etapa) {
    if (etapa < 0 || etapa > 6) return;
    this.etapaAtual = etapa;
    if (this.somAtivado) playSound('select');
    this.redefinirTemporizadorInatividade();
    window.scrollTo({ top: 0, behavior: 'instant' });
  },

  avancarEtapa() {
    if (this.etapaAtual < 6) {
      this.irParaEtapa(this.etapaAtual + 1);
    }
  },

  voltarEtapa() {
    if (this.etapaAtual > 1) {
      this.irParaEtapa(this.etapaAtual - 1);
    } else if (this.etapaAtual === 1) {
      this.reiniciarParaBoasVindas();
    }
  },

  get proximaEtapaValida() {
    const data = window.Alpine ? window.Alpine.store('data') : null;
    if (!data) return false;

    if (this.etapaAtual === 1) return !!data.viagemSelecionada;
    if (this.etapaAtual === 2) return Array.isArray(data.assentosSelecionados) && data.assentosSelecionados.length > 0;
    if (this.etapaAtual === 3) return true;
    if (this.etapaAtual === 4) return !!data.formularioPassageiroValido;
    if (this.etapaAtual === 5) return true;
    return true;
  },

  reiniciarParaBoasVindas() {
    if (this.temporizadorInatividadeId) clearTimeout(this.temporizadorInatividadeId);
    if (this.contagemInatividadeId) clearInterval(this.contagemInatividadeId);

    this.etapaAtual = 0;
    this.avisoInatividade = false;
    this.fecharTecladoVirtual();
    if (this.somAtivado) playSound('tap');

    if (window.Alpine && window.Alpine.store('data')) {
      window.Alpine.store('data').redefinirTodosDados();
    }
  },

  cancelarESair() {
    if (this.contagemInatividadeId) clearInterval(this.contagemInatividadeId);
    if (this.temporizadorInatividadeId) clearTimeout(this.temporizadorInatividadeId);
    this.reiniciarParaBoasVindas();
    this.exibirNotificacaoToast('Atendimento cancelado.', 'info');
  },

  alternarSom() {
    this.somAtivado = !this.somAtivado;
    if (this.somAtivado) playSound('tap');
    this.exibirNotificacaoToast(this.somAtivado ? 'Áudio Ativado' : 'Áudio Desativado', 'info');
  },

  iniciarMonitoramentoInatividade() {
    const eventosReset = ['touchstart', 'mousedown', 'mousemove', 'keydown', 'scroll', 'click'];
    eventosReset.forEach(evt => {
      window.addEventListener(evt, () => {
        if (!this.avisoInatividade && this.etapaAtual > 0) {
          this.redefinirTemporizadorInatividade();
        }
      }, { passive: true });
    });
    this.redefinirTemporizadorInatividade();
  },

  redefinirTemporizadorInatividade() {
    if (this.temporizadorInatividadeId) clearTimeout(this.temporizadorInatividadeId);
    if (this.contagemInatividadeId) clearInterval(this.contagemInatividadeId);

    this.avisoInatividade = false;
    this.segundosInatividadeRestantes = 15;

    if (this.etapaAtual === 0) return;

    this.temporizadorInatividadeId = setTimeout(() => {
      this.avisoInatividade = true;
      if (this.somAtivado) playSound('warning');

      this.contagemInatividadeId = setInterval(() => {
        this.segundosInatividadeRestantes--;
        if (this.segundosInatividadeRestantes <= 0) {
          clearInterval(this.contagemInatividadeId);
          this.reiniciarParaBoasVindas();
          this.exibirNotificacaoToast('Sessão encerrada por inatividade.', 'warning');
        }
      }, 1000);
    }, 60000);
  },

  permanecerAtivo() {
    this.redefinirTemporizadorInatividade();
    if (this.somAtivado) playSound('tap');
    this.exibirNotificacaoToast('Atendimento retomado.', 'success');
  },

  get eCpf() {
    const tk = this.tecladoVirtual;
    if (!tk) return false;
    const campo = String(tk.campoAtivo || '').toLowerCase();
    const rotulo = String(tk.rotuloCampoAtivo || '').toLowerCase();
    return tk.tipo === 'cpf' || campo.includes('cpf') || rotulo.includes('cpf');
  },

  get eNumerico() {
    const tk = this.tecladoVirtual;
    if (!tk) return false;
    return tk.tipo === 'numeric' || tk.tipo === 'cpf' || tk.tipo === 'tel' || this.eCpf;
  },

  // Teclado virtual
  abrirTecladoVirtual(campo, valorAtual = '', rotulo = '', tipo = 'text') {
    const campoLower = String(campo || '').toLowerCase();
    const rotuloLower = String(rotulo || '').toLowerCase();
    let tipoAjustado = tipo;

    const isCupom = campoLower.includes('cupom') || campoLower.includes('coupon');
    if (campoLower.includes('cpf') || rotuloLower.includes('cpf') || tipo === 'cpf') {
      tipoAjustado = 'cpf';
      valorAtual = formatCPF(valorAtual);
    } else if (campoLower.includes('telefone') || rotuloLower.includes('celular') || rotuloLower.includes('whatsapp') || tipo === 'tel') {
      tipoAjustado = 'tel';
      valorAtual = formatPhone(valorAtual);
    } else if (isCupom) {
      valorAtual = String(valorAtual || '').toUpperCase();
    }

    const valorInicial = valorAtual || '';
    const isEmail = tipoAjustado === 'email' || campoLower.includes('email') || rotuloLower.includes('email');
    const deveIniciarMaiuscula = !isEmail && (valorInicial.length === 0 || valorInicial.endsWith(' '));

    this.tecladoVirtual = {
      aberto: true,
      campoAtivo: campo,
      rotuloCampoAtivo: rotulo,
      valor: valorInicial,
      tipo: tipoAjustado,
      shift: deveIniciarMaiuscula,
      capsLock: isCupom
    };
    if (this.somAtivado) playSound('tap');
  },

  fecharTecladoVirtual() {
    this.tecladoVirtual.aberto = false;
    this.tecladoVirtual.campoAtivo = '';
  },

  processarToqueTecla(char) {
    if (this.somAtivado) playSound('tap');

    const campoLower = String(this.tecladoVirtual.campoAtivo || '').toLowerCase();
    const rotuloLower = String(this.tecladoVirtual.rotuloCampoAtivo || '').toLowerCase();
    const isCpfField = this.tecladoVirtual.tipo === 'cpf' || campoLower.includes('cpf') || rotuloLower.includes('cpf');
    const isPhoneField = this.tecladoVirtual.tipo === 'tel' || campoLower.includes('telefone') || rotuloLower.includes('celular') || rotuloLower.includes('whatsapp');
    const isEmailField = this.tecladoVirtual.tipo === 'email' || campoLower.includes('email') || rotuloLower.includes('email');

    if (char === 'DONE' || char === 'CONCLUIR') {
      this.fecharTecladoVirtual();
      return;
    }

    if (char === 'CLEAR' || char === 'LIMPAR') {
      this.tecladoVirtual.valor = '';
      this.tecladoVirtual.shift = !isEmailField;
    } else if (char === 'BACKSPACE') {
      if (isCpfField) {
        let digits = String(this.tecladoVirtual.valor).replace(/\D/g, '');
        digits = digits.slice(0, -1);
        this.tecladoVirtual.valor = formatCPF(digits);
      } else if (isPhoneField) {
        let digits = String(this.tecladoVirtual.valor).replace(/\D/g, '');
        digits = digits.slice(0, -1);
        this.tecladoVirtual.valor = formatPhone(digits);
      } else {
        this.tecladoVirtual.valor = this.tecladoVirtual.valor.slice(0, -1);
        if (!isEmailField && (this.tecladoVirtual.valor.length === 0 || this.tecladoVirtual.valor.endsWith(' '))) {
          this.tecladoVirtual.shift = true;
        }
      }
    } else if (char === 'SPACE') {
      if (!isCpfField && !isPhoneField && this.tecladoVirtual.tipo !== 'numeric') {
        this.tecladoVirtual.valor += ' ';
        if (!isEmailField) {
          this.tecladoVirtual.shift = true;
        }
      }
    } else {
      if (isCpfField) {
        if (!/^\d$/.test(char)) return;
        let digits = String(this.tecladoVirtual.valor).replace(/\D/g, '');
        if (digits.length >= 11) return;
        digits += char;
        this.tecladoVirtual.valor = formatCPF(digits);
      } else if (isPhoneField) {
        if (!/^\d$/.test(char)) return;
        let digits = String(this.tecladoVirtual.valor).replace(/\D/g, '');
        if (digits.length >= 11) return;
        digits += char;
        this.tecladoVirtual.valor = formatPhone(digits);
      } else if (this.tecladoVirtual.tipo === 'numeric') {
        if (!/^\d$/.test(char)) return;
        this.tecladoVirtual.valor += char;
      } else {
        const isCupomField = campoLower.includes('cupom') || campoLower.includes('coupon');
        const valorAtual = this.tecladoVirtual.valor;
        const ePrimeiraLetra = !isEmailField && (valorAtual.length === 0 || valorAtual.endsWith(' '));
        const deveSerMaiuscula = isCupomField || ePrimeiraLetra || this.tecladoVirtual.shift || this.tecladoVirtual.capsLock;

        let appendChar = deveSerMaiuscula ? char.toUpperCase() : char.toLowerCase();
        this.tecladoVirtual.valor += appendChar;

        if (this.tecladoVirtual.shift && !this.tecladoVirtual.capsLock && !isCupomField) {
          this.tecladoVirtual.shift = false;
        }
      }
    }

    if (window.Alpine && window.Alpine.store('data')) {
      window.Alpine.store('data').atualizarCampoFormulario(this.tecladoVirtual.campoAtivo, this.tecladoVirtual.valor);
    }
  },

  alternarShift() {
    this.tecladoVirtual.shift = !this.tecladoVirtual.shift;
    if (this.somAtivado) playSound('tap');
  },

  alternarCapsLock() {
    this.tecladoVirtual.capsLock = !this.tecladoVirtual.capsLock;
    if (this.somAtivado) playSound('tap');
  },

  exibirNotificacaoToast(mensagem, tipo = 'info') {
    const id = Date.now() + Math.random();
    this.notificacoes.push({ id, mensagem, tipo });
    setTimeout(() => {
      this.notificacoes = this.notificacoes.filter(n => n.id !== id);
    }, 2500);
  },

  adicionarNotificacao(mensagem, tipo = 'info') {
    this.exibirNotificacaoToast(mensagem, tipo);
  }
});
