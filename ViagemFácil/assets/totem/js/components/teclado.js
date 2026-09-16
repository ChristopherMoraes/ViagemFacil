export const criarTeclado = () => ({
  linhasTexto: [
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'],
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'Ç'],
    ['Z', 'X', 'C', 'V', 'B', 'N', 'M', '@', '.', '-']
  ],

  linhasNumerico: [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9']
  ],

  get eCpf() {
    const appStore = window.Alpine && window.Alpine.store('app');
    return appStore ? appStore.eCpf : false;
  },

  get eNumerico() {
    const appStore = window.Alpine && window.Alpine.store('app');
    return appStore ? appStore.eNumerico : false;
  },

  get totalDigitosCpf() {
    const appStore = window.Alpine && window.Alpine.store('app');
    if (!appStore || !appStore.tecladoVirtual) return 0;
    return String(appStore.tecladoVirtual.valor || '').replace(/\D/g, '').length;
  }
});
