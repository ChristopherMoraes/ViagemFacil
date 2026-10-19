import { playSound } from '../../../compartilhados/js/dom.js';

// Componente Alpine de confirmação e emissão do bilhete
export const criarIngresso = () => ({
  progressoImpressao: 0,
  imprimindoAgora: false,
  emailEnviado: false,
  whatsappEnviado: false,
  segundosAutoReset: 60,
  temporizadorAutoResetId: null,

  // Inicialização e monitoramento da etapa final
  init() {
    this.$watch('$store.app.etapaAtual', (etapa) => {
      if (etapa === 6) {
        this.iniciarContagemAutoReset();
      } else {
        if (this.temporizadorAutoResetId) {
          clearInterval(this.temporizadorAutoResetId);
          this.temporizadorAutoResetId = null;
        }
      }
    });

    if (window.Alpine && window.Alpine.store('app') && window.Alpine.store('app').etapaAtual === 6) {
      this.iniciarContagemAutoReset();
    }
  },

  // Temporizador de 60 seg para reiniciar totem
  iniciarContagemAutoReset() {
    if (this.temporizadorAutoResetId) clearInterval(this.temporizadorAutoResetId);
    this.segundosAutoReset = 60;

    this.temporizadorAutoResetId = setInterval(() => {
      if (this.segundosAutoReset > 0) {
        this.segundosAutoReset--;
      } else {
        clearInterval(this.temporizadorAutoResetId);
        this.temporizadorAutoResetId = null;
        window.Alpine.store('app').reiniciarParaBoasVindas();
      }
    }, 1000);
  },

  // Simulação de impressão e acionamento da janela de impressão
  imprimirBilheteFisico() {
    this.imprimindoAgora = true;
    this.progressoImpressao = 0;
    if (window.Alpine.store('app')?.somAtivado) playSound('print');

    const interval = setInterval(() => {
      this.progressoImpressao += 20;
      if (this.progressoImpressao >= 100) {
        clearInterval(interval);
        this.imprimindoAgora = false;
        if (window.Alpine.store('app')?.somAtivado) playSound('success');
        window.Alpine.store('app')?.exibirNotificacaoToast('Bilhete impresso com sucesso!', 'success');

        setTimeout(() => {
          window.print();
        }, 400);
      }
    }, 300);
  },

  // Simula envio do bilhete por e-mail
  enviarPorEmail() {
    if (this.emailEnviado) return;
    this.emailEnviado = true;
    if (window.Alpine.store('app')?.somAtivado) playSound('tap');

    const dataStore = window.Alpine.store('data');
    const email = dataStore?.dadosPassageiro?.email || '';
    const mensagem = email
      ? `Bilhete enviado para ${email}!`
      : 'Bilhete enviado para o e-mail informado!';

    window.Alpine.store('app')?.exibirNotificacaoToast(mensagem, 'success');
  },

  // Envia bilhete por WhatsApp via link wa.me
  enviarPorWhatsApp() {
    if (this.whatsappEnviado) return;
    this.whatsappEnviado = true;
    if (window.Alpine.store('app')?.somAtivado) playSound('tap');

    const dataStore = window.Alpine.store('data');
    const bilhete = dataStore?.dadosBilhete;

    if (bilhete) {
      const telefone = (dataStore.dadosPassageiro?.telefone || '').replace(/\D/g, '');
      const texto = [
        `🚍 *Bilhete de Embarque — Viagem Fácil*`,
        `📍 ${bilhete.origem?.name || 'Origem'} → ${bilhete.destino?.name || 'Destino'}`,
        `📅 ${bilhete.dataViagem || ''} às ${bilhete.horarioPartida || ''}`,
        `💺 Poltronas: ${bilhete.poltronasTexto || ''}`,
        `🔖 Localizador: ${bilhete.localizador || ''}`,
        `💰 Total: R$ ${Number(bilhete.valorTotal || 0).toFixed(2).replace('.', ',')}`
      ].join('\n');

      const url = `https://wa.me/${telefone ? '55' + telefone : ''}?text=${encodeURIComponent(texto)}`;
      window.open(url, '_blank');
    }

    window.Alpine.store('app')?.exibirNotificacaoToast('Bilhete enviado via WhatsApp!', 'success');
  },

  // Encerra sessão e retorna à tela inicial
  concluirSessao() {
    if (this.temporizadorAutoResetId) {
      clearInterval(this.temporizadorAutoResetId);
      this.temporizadorAutoResetId = null;
    }
    this.progressoImpressao = 0;
    this.imprimindoAgora = false;
    this.emailEnviado = false;
    this.whatsappEnviado = false;
    window.Alpine.store('app').reiniciarParaBoasVindas();
  }
});

