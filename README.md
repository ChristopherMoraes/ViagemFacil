# Sistema Integrado de Autoatendimento e Gestão Rodoviária

Projeto acadêmico desenvolvido para simulação de um ecossistema rodoviário composto por Totens de Autoatendimento (terminais de venda rápida ao passageiro) e um Painel Gerencial Central (monitoramento da frota de totens, rotas, viações e repasses financeiros).

---

## 1. Visão Geral do Projeto

O sistema é dividido em duas interfaces complementares:

1. **Totem de Autoatendimento (`index.html`):**
   - Interface touchscreen para compra autônoma de passagens.
   - Fluxo guiado em 6 etapas:
     - Etapa 0: Tela inicial de boas-vindas com rotas em destaque.
     - Etapa 1: Busca de cidades (origem e destino), seleção de data e horários.
     - Etapa 2: Mapa 2D de assentos com suporte a ônibus de 1 e 2 andares (Double Decker).
     - Etapa 3: Seleção de serviços adicionais (seguro, bagagem, sala VIP, etc.).
     - Etapa 4: Cadastro dos dados do passageiro com validação de CPF e teclado virtual.
     - Etapa 5: Pagamento simulado via PIX com QR Code dinâmico ou Cartão.
     - Etapa 6: Emissão do bilhete de embarque com suporte à impressão física.

2. **Painel Gerencial da Central Matriz (`painel.html`):**
   - Acesso administrativo autenticado (usuário: `admin` / senha: `admin`).
   - Módulos disponíveis:
     - **Visão Geral:** Indicadores de faturamento, passagens emitidas e gráficos.
     - **Gestão de Totens:** Telemetria de hardware (nível de bobina de papel, status online/offline, reinicialização remota e testes de impressão).
     - **Módulo Financeiro:** Extrato de vendas por terminal e cálculo automático de repasses às viações com dedução de taxa de conveniência (8,5%).
     - **Companhias:** Cadastro e manutenção das viações parceiras (CNPJ, taxas, contato).
     - **Rotas e Horários:** Configuração de itinerários, plataformas, frotas e preços por categoria de assento.
     - **Vendas:** Histórico consolidado de transações em tempo real.

---

## 2. Tecnologias Utilizadas

- **Estrutura:** HTML5 semântico
- **Estilização:** CSS3 com variáveis nativas, Bootstrap 5.3 e Phosphor Icons
- **Reatividade e Lógica:** JavaScript Modular (ES6+) e Alpine.js 3.14
- **Recursos Nativos do Navegador:**
  - Web Audio API (feedback sonoro de toques)
  - Canvas API (efeito visual de confirmação de pagamento)
  - LocalStorage / SessionStorage (persistência local de dados)

---

## 3. Estrutura de Diretórios

```text
web-app/
├── index.html                  # Interface do Totem de Autoatendimento
├── painel.html                 # Interface do Painel Gerencial Matriz
└── assets/
    ├── css/
    │   ├── main.css            # Variáveis globais, tema claro/escuro e layout básico
    │   ├── components.css      # Componentes do totem (mapa de assentos, teclado, bilhete)
    │   └── admin.css           # Estilos do painel administrativo
    ├── js/
    │   ├── main.js             # Inicialização do totem
    │   ├── admin-main.js       # Inicialização do painel gerencial
    │   ├── stores/             # Gerenciamento de estado (Alpine.store)
    │   │   ├── app-store.js    # Controle de etapas, inatividade e teclado
    │   │   ├── data-store.js   # Reserva, assentos, passageiro e pagamento
    │   │   ├── admin-store.js  # Dashboard local do totem
    │   │   └── central-admin-store.js # Central matriz (totens, viações, financeiro)
    │   ├── components/         # Componentes interativos
    │   │   ├── mapa-assentos.js # Lógica da matriz de assentos
    │   │   ├── pagamento.js     # Lógica do pagamento (PIX e Cartão)
    │   │   ├── ingresso.js      # Emissão e impressão do bilhete
    │   │   ├── teclado.js       # Teclado virtual touch
    │   │   └── carrossel.js     # Banners de destinos em destaque
    │   ├── services/
    │   │   └── api.js          # Catálogo de cidades, viagens e regras de negócio
    │   └── utils/
    │       ├── dom.js          # Efeitos de som e confetes
    │       └── formatters.js   # Validações (CPF, e-mail, telefone) e formatações
    └── img/                    # Imagens dos destinos
