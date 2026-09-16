// Utilitários de áudio e integração Mercado Pago
import { playSound } from '../../../compartilhados/js/dom.js';
import { criarPagamentoPix } from '../../../compartilhados/js/mercadopago.js';

// QR Code Pix padrão de fallback
const QRCODE_PIX_PADRAO = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAZAAAAGQAQMAAAC6caSPAAAABlBMVEX///8AAABVwtN+AAAACXBIWXMAAA7EAAAOxAGVKw4bAAADWElEQVR4nO2bMbbjMAhF8flFyizBS/HS4qV5KVlCyhQ50cDjIcsz83viQKNE8lWDQBIgkZJvlqW5bPh3a/fLa9K/9+tTm1Wu+hu9/OxVSF7k7t9u16bfrgt6FZHL23qpb50IP66FZEZcwTr4o+r2QdOzal9HH+gViTVRyAcg1+eP2fPc2lusedqaULKQb0BGKzfbF2t0Ijk490IyI/iU2jc92wwihzXRfvH8haRCmosNvvWb2Ro15IfuyOrVH/otnDs/KyQvsovZ6krvu4lbMLQvv0ohH474grG914/W3cqtewVpv2IZFZIesW9c7dS+SSCrO3c7cr0KSYw8xM5NdoyCIYvp2WIXgyH7vIUkR+7QrOtZZbYGpjthTRhi+7RM3TcXchpE3DXzlsSGDltBhDvMI+g1WHi0LiQpov7b/i2N2kfswqT3Nt6SrLOQvMiCyDH0LH0rht9+e+wCF97mhszDVSFnQWyFNA82C7IJwx25i92RR3dRSEbEd+QhcmwSR2uovYeVxwVTSD7kKDc32dbTtYLIFZoesCwkJ6K3pB5gnKLByERnzCDkGLso5DyIDa6Wy31jTTDVF3dkNHOfr5C0iO/I0DPc+Iwz9eK2j+tR82qM8cJbSEaE6VoEkC0xBIdN7SMxhMH5eLQuJCOi6raAE6qh8P/iF94HL0IRSLZ5zegLORXChIGadywYRh8ZmP5pUXdRSH6E2vc77TEx5NL36UIyIzuJuos9MTRFsXHk43fbLyQvYgNEInLcet1qBBjNf78KORPCePK6MJ48M6ngQcjF7kWe2v0nBF1INiTOTwf/rc1+uNq171JIVgQmixIaqD0uvNa9evQxYhf/qYYq5LMR1te01vYFY4LnPw22z3O3e4JC8iLiEQ1WqHp9shdQYQbWXXD6QjIjDBlzkDuyn6l9Mbj2x7RgIRmRLv4AZGGOrzE4hRyfLgaevI6vBgr5dMTXgsWo6KlZwBh35P78Z8wlFZISuUP3jD6ujFGF9qPuAtqPdVJIVqQ/v0Op+Tzeh27I/PXD9NLPY4WkRo45vkfYs3jswsNQY1qwkLMhsj++bFG32p//FJIdcSv3dO2NReUbo8ybxAzYkf3bQpIi7Nr8Lc8Sg5HE9aeyf8WTCzkJUvK98gc0hvfG2Bw7ggAAAABJRU5ErkJggg==';

// Componente Alpine de pagamento
export const criarPagamento = () => ({
  // Estados reativos da tela
  abaAtiva: '',
  temporizadorPixFormatado: '05:00',
  segundosPix: 300,
  intervaloPixId: null,
  tipoCartao: 'Cartão de Crédito',
  nfcAproximacaoAtiva: false,
  imagemQrCodePix: QRCODE_PIX_PADRAO,
  carregandoPix: false,

  // Inicialização e monitoramento da etapa
  init() {
    // Observa transição de etapas
    this.$watch('$store.app.etapaAtual', (etapa) => {
      if (etapa === 5) {
        // Reseta seleção ao entrar no pagamento
        this.abaAtiva = '';
        if (window.Alpine && window.Alpine.store('data')) {
          window.Alpine.store('data').metodoPagamento = '';
          window.Alpine.store('data').erroCupom = '';
        }
      } else {
        // Para temporizador se sair da etapa
        if (this.intervaloPixId) {
          clearInterval(this.intervaloPixId);
          this.intervaloPixId = null;
        }
      }
    });

    // Reset se já iniciar na etapa 5
    if (window.Alpine && window.Alpine.store('app') && window.Alpine.store('app').etapaAtual === 5) {
      this.abaAtiva = '';
      if (window.Alpine && window.Alpine.store('data')) {
        window.Alpine.store('data').metodoPagamento = '';
        window.Alpine.store('data').erroCupom = '';
      }
    }
  },

  // Gera e carrega QR Code Pix dinâmico
  async carregarQrcodePix() {
    const dataStore = window.Alpine.store('data');
    if (!dataStore) return;

    this.carregandoPix = true;
    // Dados do passageiro pagador
    const infoPassageiro = {
      nome: dataStore.dadosPassageiro?.nomeCompleto || 'Passageiro Totem',
      cpf: dataStore.dadosPassageiro?.cpf || '00000000000',
      email: dataStore.dadosPassageiro?.email || 'cliente.totem@exemplo.com.br'
    };

    try {
      // Chama API do Mercado Pago
      const resultado = await criarPagamentoPix(dataStore.valorTotal || 50, infoPassageiro);
      const b64 = resultado?.qr_code_base64 || resultado?.qrcode_base64;
      if (resultado && resultado.sucesso && b64) {
        this.imagemQrCodePix = `data:image/png;base64,${b64}`;
      } else {
        this.imagemQrCodePix = QRCODE_PIX_PADRAO;
      }
    } catch (e) {
      // Fallback em caso de erro
      this.imagemQrCodePix = QRCODE_PIX_PADRAO;
    } finally {
      this.carregandoPix = false;
    }
  },

  // Inicia temporizador Pix de 5 minutos
  iniciarTemporizadorPix() {
    if (this.intervaloPixId) clearInterval(this.intervaloPixId);
    this.segundosPix = 300;
    this.atualizarExibicaoPix();

    // Contagem regressiva a cada segundo
    this.intervaloPixId = setInterval(() => {
      if (this.segundosPix > 0) {
        this.segundosPix--;
        this.atualizarExibicaoPix();
      } else {
        clearInterval(this.intervaloPixId);
        this.intervaloPixId = null;
      }
    }, 1000);
  },

  // Formata tempo restante em MM:SS
  atualizarExibicaoPix() {
    const mins = Math.floor(this.segundosPix / 60);
    const secs = this.segundosPix % 60;
    this.temporizadorPixFormatado = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  },

  // Seleciona método de pagamento
  selecionarMetodo(metodo) {
    this.abaAtiva = metodo;
    const dataStore = window.Alpine.store('data');
    if (dataStore) {
      dataStore.metodoPagamento = metodo;
      // Ajusta parcelas se não for crédito
      if (metodo !== 'credit' && metodo !== 'credito') {
        dataStore.numeroParcelas = 1;
      } else if (!dataStore.numeroParcelas) {
        dataStore.numeroParcelas = 1;
      }
    }
    if (window.Alpine.store('app')?.somAtivado) playSound('tap');

    // Fluxo específico por método
    if (metodo === 'pix') {
      this.iniciarTemporizadorPix();
      this.carregarQrcodePix();
    } else {
      if (this.intervaloPixId) {
        clearInterval(this.intervaloPixId);
        this.intervaloPixId = null;
      }
    }
  },

  // Define quantidade de parcelas (1 a 6x)
  definirParcelas(num) {
    const dataStore = window.Alpine.store('data');
    if (dataStore) {
      dataStore.numeroParcelas = Math.max(1, Math.min(6, parseInt(num, 10) || 1));
      if (window.Alpine.store('app')?.somAtivado) playSound('tap');
    }
  },

  // Simula leitura de cartão por aproximação (NFC)
  simularAproximacaoCartao() {
    this.nfcAproximacaoAtiva = true;
    if (window.Alpine.store('app')?.somAtivado) playSound('select');

    // Simula tempo de leitura e confirmação
    setTimeout(() => {
      const dataStore = window.Alpine.store('data');
      dataStore.dadosCartao.numero = '•••• •••• •••• 8842';
      dataStore.dadosCartao.titular = dataStore.dadosPassageiro.nomeCompleto || 'CLIENTE TOTEM';
      dataStore.dadosCartao.validade = '12/29';
      dataStore.dadosCartao.cvv = '•••';
      this.nfcAproximacaoAtiva = false;

      // Notifica e finaliza pagamento
      window.Alpine.store('app')?.exibirNotificacaoToast('Cartão detectado com sucesso!', 'success');
      dataStore.finalizarPagamento();
    }, 1500);
  }
});
