# Geladeira Inteligente - Vending Machine

Este projeto implementa um sistema de geladeira inteligente (vending machine) com um aplicativo web para e-commerce, integração com o Mercado Pago para processamento de pagamentos e controle de uma trava magnética via ESP8266.

## Funcionalidades

*   **Frontend (Usuário):**
    *   Visualização de produtos disponíveis.
    *   Seleção de itens para compra.
    *   Redirecionamento para pagamento via Mercado Pago.
    *   Confirmação de pagamento e instrução para liberação da trava.

*   **Backend (API & Lógica):**
    *   Gerenciamento de produtos (CRUD).
    *   Criação de preferências de pagamento no Mercado Pago.
    *   Processamento de webhooks do Mercado Pago para confirmação de pagamento.
    *   Comunicação com ESP8266 para liberar a trava magnética.
    *   Registro de transações e logs.

*   **Painel Administrativo:**
    *   Cadastro e edição de produtos.
    *   Visualização de vendas mensais.
    *   Acompanhamento de transações.

## Arquitetura e Tecnologias

### Backend

*   **Framework:** Flask (Python)
*   **Banco de Dados:** SQLite (via SQLAlchemy com Flask-SQLAlchemy)
*   **Autenticação:** Simples (para o painel administrativo)
*   **Integrações:** Mercado Pago API, ESP8266 (via HTTP)

### Frontend

*   **Framework:** React (JavaScript)
*   **Estilização:** Tailwind CSS
*   **Gerenciamento de Estado:** Context API ou Redux (se necessário)

## Estrutura do Projeto

```
geladeira-inteligente/
├── backend/
│   ├── app.py (Ponto de entrada do aplicativo Flask)
│   ├── config.py (Configurações do aplicativo)
│   ├── database.py (Configuração do SQLAlchemy e DB)
│   ├── models/
│   │   ├── __init__.py
│   │   ├── product.py (Modelo de Produto)
│   │   ├── order.py (Modelo de Pedido)
│   │   └── transaction.py (Modelo de Transação)
│   ├── routes/
│   │   ├── __init__.py
│   │   ├── auth.py (Rotas de autenticação)
│   │   ├── product.py (Rotas de produtos)
│   │   ├── mercadopago.py (Rotas de Mercado Pago e ESP8266)
│   │   └── admin.py (Rotas administrativas)
│   └── utils/
│       └── __init__.py
│       └── mercadopago_utils.py (Funções auxiliares Mercado Pago)
│       └── esp_utils.py (Funções auxiliares ESP8266)
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
├── .env.example
├── requirements.txt
└── Procfile
```

## Configuração de Ambiente

Crie um arquivo `.env` na raiz do projeto (baseado no `.env.example`) com as seguintes variáveis:

```
SECRET_KEY=sua_chave_secreta_aqui
MERCADOPAGO_ACCESS_TOKEN=SEU_ACCESS_TOKEN_MERCADO_PAGO
MERCADOPAGO_PUBLIC_KEY=SEU_PUBLIC_KEY_MERCADO_PAGO
WEBHOOK_SECRET=SEU_SEGREDO_WEBHOOK_MERCADO_PAGO
ESP8266_IP=192.168.1.100 # Substitua pelo IP do seu ESP8266
ESP8266_PORT=80 # Porta do seu ESP8266
FLASK_ENV=development # ou production
PORT=5000 # Porta para o backend Flask
```

## Como Rodar o Projeto

### Backend

1.  **Navegue até o diretório `backend`:**
    ```bash
    cd backend
    ```
2.  **Instale as dependências:**
    ```bash
    pip install -r requirements.txt
    ```
3.  **Execute o aplicativo Flask:**
    ```bash
    python app.py
    ```
    O backend estará disponível em `http://localhost:5000`.

### Frontend

1.  **Navegue até o diretório `frontend`:**
    ```bash
    cd frontend
    ```
2.  **Instale as dependências:**
    ```bash
    npm install
    ```
3.  **Execute o aplicativo React:**
    ```bash
    npm start
    ```
    O frontend estará disponível em `http://localhost:3000`.

### Deploy no Heroku (Exemplo)

O `Procfile` e `requirements.txt` na raiz do projeto são configurados para um deploy simplificado no Heroku, onde o backend Flask servirá também os arquivos estáticos do frontend. Certifique-se de configurar as variáveis de ambiente no Heroku.
