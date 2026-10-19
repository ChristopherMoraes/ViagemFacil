import Alpine from 'https://cdn.jsdelivr.net/npm/alpinejs@3.14.8/dist/module.esm.js';
import { createCentralAdminStore } from './stores/central-admin-store.js';
import { formatCurrency, formatCPF, formatPhone, formatDateBR, formatTime } from '../../compartilhados/js/formatters.js';
import { playSound } from '../../compartilhados/js/dom.js';

window.formatCurrency = formatCurrency;
window.formatCPF = formatCPF;
window.formatPhone = formatPhone;
window.formatDateBR = formatDateBR;
window.formatTime = formatTime;
window.playSound = playSound;

window.Alpine = Alpine;

const centralStore = createCentralAdminStore();
centralStore.currentTab = 'dashboard';
Alpine.store('central', centralStore);

Alpine.start();
