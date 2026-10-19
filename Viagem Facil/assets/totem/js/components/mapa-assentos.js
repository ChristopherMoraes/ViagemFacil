import { playSound } from '../../../compartilhados/js/dom.js';

// Componente Alpine do mapa de assentos
export const criarMapaAssentos = () => ({
  // Agrupa poltronas por fileiras do andar atual
  get fileirasAndarAtual() {
    const dataStore = window.Alpine ? window.Alpine.store('data') : null;
    if (!dataStore || !dataStore.poltronasOnibus) return [];
    
    const deckSeats = dataStore.poltronasOnibus.filter(s => s.deck === dataStore.andarAtivo);

    const rowsMap = new Map();
    deckSeats.forEach(seat => {
      if (!rowsMap.has(seat.row)) {
        rowsMap.set(seat.row, { 
          rowNumber: seat.row, 
          left: [], 
          right: [] 
        });
      }
      const r = rowsMap.get(seat.row);
      if (seat.side === 'left') {
        r.left.push(seat);
      } else {
        r.right.push(seat);
      }
    });

    return Array.from(rowsMap.values()).sort((a, b) => a.rowNumber - b.rowNumber);
  },

  // Alterna entre primeiro e segundo andar
  definirAndar(numeroAndar) {
    const dataStore = window.Alpine ? window.Alpine.store('data') : null;
    if (dataStore) {
      dataStore.andarAtivo = numeroAndar;
    }
    if (window.Alpine && window.Alpine.store('app')?.somAtivado) {
      playSound('tap');
    }
  },

  // Estatísticas de assentos do andar 1
  get estatisticasAndar1() {
    const dataStore = window.Alpine.store('data');
    if (!dataStore || !dataStore.poltronasOnibus) return { total: 12, disponiveis: 12, ocupadas: 0 };
    const seats = dataStore.poltronasOnibus.filter(s => s.deck === 1);
    const ocupadas = seats.filter(s => s.isOccupied).length;
    return {
      total: seats.length,
      disponiveis: seats.length - ocupadas,
      ocupadas
    };
  },

  // Estatísticas de assentos do andar 2
  get estatisticasAndar2() {
    const dataStore = window.Alpine.store('data');
    if (!dataStore || !dataStore.poltronasOnibus) return { total: 36, disponiveis: 36, ocupadas: 0 };
    const seats = dataStore.poltronasOnibus.filter(s => s.deck === 2);
    const ocupadas = seats.filter(s => s.isOccupied).length;
    return {
      total: seats.length,
      disponiveis: seats.length - ocupadas,
      ocupadas
    };
  },

  // Retorna classe CSS de acordo com estado da poltrona
  obterClassePoltrona(poltrona) {
    const dataStore = window.Alpine.store('data');
    if (poltrona.isOccupied) {
      return 'poltrona-ocupada';
    }
    if (dataStore && dataStore.poltronaEstaSelecionada(poltrona.number)) {
      return 'poltrona-selecionada';
    }
    if (poltrona.isPreferential) {
      return 'poltrona-preferencial';
    }
    return 'poltrona-livre';
  }
});

