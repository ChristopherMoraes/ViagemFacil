// Integração com Mercado Pago

const PUBLIC_KEY = 'APP_USR-d2757499-3983-4a25-96ee-e7bb15ce977f'//'APP_USR-ca2df27c-0563-4da0-bbb3-6d1dab60e286';
const API_URL = './api/pagamento.php';

let mpInstancia = null;
let brickCartao = null;

// Inicializa o SDK do Mercado Pago
export function iniciarMercadoPago() {
  if (typeof window.MercadoPago === 'undefined') {
    console.warn('SDK do Mercado Pago não carregado. Verifique o script no HTML.');
    return null;
  }
  if (!mpInstancia) {
    mpInstancia = new window.MercadoPago(PUBLIC_KEY, { locale: 'pt-BR' });
  }
  return mpInstancia;
}

export async function renderizarBrickCartao(containerId, valor, callbacks) {
  const mp = iniciarMercadoPago();
  if (!mp) return null;

  if (brickCartao) {
    try { brickCartao.unmount(); } catch (e) { }
    brickCartao = null;
  }

  try {
    const bricksBuilder = mp.bricks();
    brickCartao = await bricksBuilder.create('cardPayment', containerId, {
      initialization: {
        amount: valor,
        payer: { email: '' }
      },
      customization: {
        visual: {
          style: { theme: 'dark' }
        },
        paymentMethods: {
          maxInstallments: 6,
          minInstallments: 1
        }
      },
      callbacks: {
        onReady: () => {
          if (callbacks && callbacks.onReady) callbacks.onReady();
        },
        onSubmit: async (dadosCartao) => {
          if (callbacks && callbacks.onSubmit) {
            return callbacks.onSubmit(dadosCartao);
          }
        },
        onError: (erro) => {
          console.error('Erro no Brick:', erro);
          if (callbacks && callbacks.onError) callbacks.onError(erro);
        }
      }
    });
    return brickCartao;
  } catch (erro) {
    console.error('Falha ao renderizar Brick de cartão:', erro);
    return null;
  }
}

export async function criarPagamentoCartao(dadosBrick, infoPassageiro) {
  const corpo = {
    acao: 'pagar_cartao',
    token: dadosBrick.token,
    metodo_pagamento: dadosBrick.payment_method_id,
    parcelas: dadosBrick.installments || 1,
    valor: dadosBrick.transaction_amount,
    descricao: 'Passagem Rodoviária - Viagem Fácil',
    email: infoPassageiro.email || dadosBrick.payer?.email || '',
    cpf: infoPassageiro.cpf || '',
    nome: infoPassageiro.nome || ''
  };

  try {
    const resposta = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(corpo)
    });
    return await resposta.json();
  } catch (erro) {
    return { sucesso: false, erro: 'Falha na conexão com o servidor.' };
  }
}

//pix
export async function criarPagamentoPix(valor, infoPassageiro) {
  const corpo = {
    acao: 'pagar_pix',
    valor: valor,
    descricao: 'Passagem Rodoviária - Viagem Fácil',
    email: infoPassageiro.email || '',
    cpf: infoPassageiro.cpf || '',
    nome: infoPassageiro.nome || ''
  };

  try {
    const resposta = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(corpo)
    });
    return await resposta.json();
  } catch (erro) {
    return { sucesso: false, erro: 'Falha na conexão com o servidor.' };
  }
}

// Consulta
export async function consultarPagamento(idPagamento) {
  try {
    const resposta = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ acao: 'consultar', id_pagamento: idPagamento })
    });
    return await resposta.json();
  } catch (erro) {
    return { sucesso: false, erro: 'Falha ao consultar pagamento.' };
  }
}

// Cria uma preferência de checkout no MP
export async function criarPreferenciaMercadoPago(valor, infoPassageiro, descricao) {
  const corpo = {
    acao: 'criar_preferencia',
    valor: valor,
    descricao: descricao || 'Passagem Rodoviária - Viagem Fácil',
    email: (infoPassageiro && infoPassageiro.email) ? infoPassageiro.email : 'cliente.totem@exemplo.com.br',
    nome: (infoPassageiro && infoPassageiro.nome) ? infoPassageiro.nome : 'Passageiro'
  };

  try {
    const resposta = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(corpo)
    });
    return await resposta.json();
  } catch (erro) {
    return { sucesso: false, erro: 'Falha na conexão com a API de pagamento.' };
  }
}

// Processa pagamento mock (fallback para quando o servidor PHP não está disponível)
export async function processarPagamentoMock(metodo, dados) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        sucesso: true,
        id_transacao: 'TX-' + Math.random().toString(36).substring(2, 10).toUpperCase(),
        codigo_autorizacao: Math.floor(100000 + Math.random() * 900000).toString(),
        situacao: 'approved',
        metodo: metodo
      });
    }, 1200);
  });
}
