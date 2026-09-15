import { criarStoreApp } from './stores/app-store.js';
import { criarStoreDados } from './stores/data-store.js';
import { criarMapaAssentos } from './components/mapa-assentos.js';
import { criarPagamento } from './components/pagamento.js';
import { criarIngresso } from './components/ingresso.js';
import { criarTeclado } from './components/teclado.js';
import { criarCarrossel } from './components/carrossel.js';
import { formatCurrency, formatCPF, formatPhone, formatDateBR, formatTime, getTodayDateString } from '../../compartilhados/js/formatters.js';
import { playSound } from '../../compartilhados/js/dom.js';
import { iniciarMercadoPago } from '../../compartilhados/js/mercadopago.js';

window.formatCurrency = formatCurrency;
window.formatCPF = formatCPF;
window.formatPhone = formatPhone;
window.formatDateBR = formatDateBR;
window.formatTime = formatTime;
window.getTodayDateString = getTodayDateString;
window.playSound = playSound;

const initAlpine = () => {
  if (!window.Alpine) return;

  window.Alpine.store('app', criarStoreApp());
  window.Alpine.store('data', criarStoreDados());

  window.Alpine.data('mapaAssentos', criarMapaAssentos);
  window.Alpine.data('pagamento', criarPagamento);
  window.Alpine.data('ingresso', criarIngresso);
  window.Alpine.data('teclado', criarTeclado);
  window.Alpine.data('carrossel', criarCarrossel);

  // Inicializa SDK do Mercado Pago
  iniciarMercadoPago();
};

if (window.Alpine) {
  initAlpine();
} else {
  document.addEventListener('alpine:init', initAlpine);
}
