# CRM Scooter & Patinetes Elétricos

Sistema de controle de vendas mobile-first para gerenciamento de clientes, catálogos de produtos, vendedores e relatórios diários.

---

## Stack

| Camada    | Tecnologia                          |
|-----------|-------------------------------------|
| Runtime   | Bun                                 |
| Backend   | Express.js (Node/Bun)               |
| Banco     | PostgreSQL — Neon.tech              |
| Frontend  | React 18 + Vite + Tailwind CSS      |
| PDF       | PDFKit (servidor)                   |
| Deploy    | Render (API + Static Site)          |

---

## Estrutura do Projeto

```
leads_crm/
├── server/
│   ├── src/
│   │   ├── db/db.js                    # Pool de conexão Neon.tech
│   │   ├── models/
│   │   │   ├── StatusModel.js
│   │   │   ├── SellerModel.js
│   │   │   ├── ClientModel.js          # soft delete, eventos relatório
│   │   │   ├── CatalogModel.js
│   │   │   ├── ProductModel.js
│   │   │   └── DailyReportModel.js     # queries do relatório diário
│   │   ├── controllers/
│   │   ├── routes/
│   │   └── services/
│   │       ├── importExcel.js          # importação .xlsx
│   │       └── generateReportPdf.js    # geração do PDF
│   └── migrations/
│       └── 001_schema.sql              # schema completo — rodar no Neon
├── client/
│   └── src/
│       ├── pages/
│       │   ├── ClientsPage.jsx         # tabela com botão "Contatado"
│       │   ├── ClientDetailPage.jsx    # botão "Realizou Compra" + follow-up
│       │   ├── CatalogPage.jsx
│       │   ├── ProductDetailPage.jsx
│       │   ├── SellersPage.jsx
│       │   └── DailyReportPage.jsx     # relatório + download PDF
│       └── utils/
│           ├── api.js                  # cliente HTTP para a API
│           └── constants.js
├── render.yaml                         # configuração de deploy no Render
└── .env.example
```

---

## Banco de Dados — Tabelas

| Tabela                | Descrição                                           |
|-----------------------|-----------------------------------------------------|
| `status`              | Status do pipeline (Prospecção, Contatado, etc.)    |
| `sellers`             | Vendedores                                          |
| `seller_ufs`          | Estados atendidos por vendedor (N:N)                |
| `catalogs`            | Catálogos mensais de produtos                       |
| `products`            | Produtos com especificações técnicas completas      |
| `clients`             | Clientes (soft delete via campo `ativo`)            |
| `observations`        | Follow-ups/histórico de contatos por cliente        |
| `daily_report_events` | Eventos do relatório diário                         |

### Eventos do Relatório Diário

| `event_type`         | Quando é gerado                                          |
|----------------------|----------------------------------------------------------|
| `contacted`          | Status muda para **Contatado** (1x por dia por cliente)  |
| `new_client`         | Cliente criado manualmente ou importado via Excel         |
| `catalog_requested`  | Status muda para **Catálogo** (1x por dia por cliente)   |
| `purchased`          | Clique em **Realizou Compra** (N vezes por dia)          |

---

## Status dos Clientes

| # | Nome             | Dispara evento            |
|---|------------------|---------------------------|
| 1 | Prospecção       | —                         |
| 2 | Contatado        | `contacted`               |
| 3 | Negociação       | —                         |
| 4 | Proposta Enviada | —                         |
| 5 | Fechamento       | —                         |
| 6 | Perdido          | —                         |
| 7 | Em Análise       | —                         |
| 8 | Follow-up        | —                         |
| 9 | Cliente Ativo    | —                         |
|10 | Cliente Inativo  | —                         |
|11 | Catálogo         | `catalog_requested`       |

---

## API — Endpoints

### Statuses
```
GET    /statuses
POST   /statuses
PUT    /statuses/:id
DELETE /statuses/:id
```

### Sellers (Vendedores)
```
GET    /sellers
GET    /sellers/:id
POST   /sellers          { nome, whatsapp, ufs: ["SP","RJ"] }
PUT    /sellers/:id
DELETE /sellers/:id
```

### Clients (Clientes)
```
GET    /clients          ?search=&status_id=&uf=&ativo=&page=&limit=
GET    /clients/:id
POST   /clients
PUT    /clients/:id
DELETE /clients/:id       → soft delete (inativa, não exclui)
POST   /clients/:id/purchase   → registra compra no relatório diário
POST   /clients/import         → multipart/form-data, campo "file" (.xlsx)

GET    /clients/:id/observations
POST   /clients/:id/observations   { texto }
DELETE /clients/:id/observations/:obsId
```

### Catalogs (Catálogos)
```
GET    /catalogs
GET    /catalogs/:id     → inclui array de produtos
POST   /catalogs
PUT    /catalogs/:id
DELETE /catalogs/:id

GET    /catalogs/:id/products
POST   /catalogs/:id/products
GET    /catalogs/:id/products/:prodId
PUT    /catalogs/:id/products/:prodId
PATCH  /catalogs/:id/products/:prodId/stock   { estoque }
DELETE /catalogs/:id/products/:prodId
```

### Daily Report (Relatório Diário)
```
GET /daily-report/summary?date=YYYY-MM-DD
GET /daily-report/details?date=YYYY-MM-DD
GET /daily-report/dates
GET /daily-report/pdf?date=YYYY-MM-DD       → download PDF
```

---

## Instalação e Execução Local

### Pré-requisitos
- [Bun](https://bun.sh) instalado
- Conta no [Neon.tech](https://neon.tech) com banco PostgreSQL

### 1. Clonar e instalar dependências
```bash
bun install
cd server && bun install
cd ../client && bun install
```

### 2. Configurar variáveis de ambiente
```bash
cp .env.example server/.env
# Edite server/.env e adicione sua DATABASE_URL do Neon.tech
```

### 3. Criar as tabelas no banco
Acesse o SQL Editor do Neon.tech e execute o conteúdo de:
```
server/migrations/001_schema.sql
```

### 4. Rodar em desenvolvimento
```bash
# Na raiz do projeto:
bun run dev
```
- Frontend: http://localhost:5173
- Backend:  http://localhost:8000

---

## Deploy no Render

### Backend (Web Service)
1. Conecte o repositório no Render
2. Root Directory: `server`
3. Build Command: `bun install`
4. Start Command: `bun start`
5. Variável de ambiente: `DATABASE_URL` = sua connection string do Neon

### Frontend (Static Site)
1. Root Directory: `client`
2. Build Command: `bun install && bun run build`
3. Publish Directory: `dist`
4. Variável: `VITE_API_URL` = URL do backend no Render

> Ou utilize o `render.yaml` na raiz do projeto para deploy automático.

---

## Testes (a implementar)

Estrutura planejada em `server/src/tests/`:

```
tests/
├── models/
│   ├── ClientModel.test.js
│   ├── CatalogModel.test.js
│   ├── ProductModel.test.js
│   └── DailyReportModel.test.js
├── controllers/
│   ├── ClientController.test.js
│   └── DailyReportController.test.js
└── services/
    ├── importExcel.test.js
    └── generateReportPdf.test.js
```

Casos de teste prioritários:
- `ClientModel.create` → deve inserir evento `new_client`
- `ClientModel.update` com status `Contatado` → deve inserir `contacted` (idempotente no dia)
- `ClientModel.update` com status `Catálogo` → deve inserir `catalog_requested`
- `ClientModel.registerPurchase` → deve permitir múltiplos no mesmo dia
- `ClientModel.deactivate` → não deve excluir o registro
- `DailyReportModel.getSummary` → deve agregar corretamente por data
- `importExcel` → deve detectar colunas dinamicamente

---

## Licença

Uso privado.
