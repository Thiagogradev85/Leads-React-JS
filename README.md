# ⚡ Leads CRM

**v2.1.0** — CRM multi-tenant para gestão de leads, prospecção, catálogos e envio em massa via WhatsApp e E-mail.

## Funcionalidades

- **Gestão de Clientes** — cadastro, filtros, notas, UFs, catálogo enviado, vendedor responsável
- **Importação / Exportação** — Excel (bulk upsert) e PDF; detecção automática de UF em endereços
- **Fila Laranja — UF Pendente** — clientes importados sem UF ficam em fila de tratamento obrigatório
- **Catálogos & Produtos** — catálogos com produtos vinculados, exportação PDF, importação via PDF com IA
- **Vendedores** — atribuição por UF com exclusividade (1 vendedor por UF); auto-assign diário silencioso
- **WhatsApp em Massa** — envio filtrado com delay configurável
- **E-mail em Massa** — templates com variáveis, anexo de catálogo em PDF
- **Prospecção** — busca no Google Maps via Serper/SerpApi/Brave/Bing/Google CSE
- **Enriquecimento** — busca dados faltantes via IA (Claude)
- **Relatório Diário** — eventos: novos clientes, contatados, catálogos solicitados, compras
- **Configurações** — chaves de API via UI, proteção por senha, reveal com confirmação
- **Multi-tenant** — login por usuário, dados isolados por user_id; admin gerencia contas

## Stack

| Camada     | Tecnologia                                      |
|------------|-------------------------------------------------|
| Frontend   | React 18, Vite, Tailwind CSS, React Router      |
| Backend    | Node.js, Express, PostgreSQL (Neon)             |
| Auth       | JWT (httpOnly cookie), bcryptjs                 |
| IA         | Claude (Anthropic) — enriquecimento + importação|
| Busca      | Serper → SerpApi → Brave → Bing → Google CSE   |
| Deploy     | Render (backend + frontend servido pelo Express)|

## Regras de Negócio Principais

### UF e Vendedores
- **UF obrigatória** para todo cliente — determina qual vendedor o atende
- **Importação sem UF** é permitida: clientes vão para a **fila laranja** de tratamento obrigatório na tela de Clientes
- **Detecção automática de UF** em endereços no Excel: suporta `Cidade/UF`, `Cidade - UF`, `(UF)`, nome completo do estado
- **Exclusividade de UF**: cada UF só pode ter 1 vendedor responsável por usuário; UI bloqueia seleção de UFs já ocupadas
- **Auto-assign diário**: toda meia-noite (ou no startup, se o servidor estava offline) o sistema associa vendedores a clientes que têm UF mas estão sem vendedor

### Resets diários (meia-noite de Brasília ou no startup)
| Tarefa | Comportamento |
|--------|--------------|
| Contatado → Prospecção | Clientes contatados voltam para prospecção no dia seguinte |
| Reset "Não Tem Interesse" | Após 3 meses, status é revertido para Prospecção automaticamente |
| Auto-assign de vendedores | Clientes com UF mas sem vendedor recebem vendedor baseado na UF |

## Arquitetura de Auth

Camadas completamente desacopladas — trocar JWT por outro mecanismo requer alterar apenas `utils/auth.js` e `middleware/authMiddleware.js`:

```
utils/auth.js                ← JWT: hashPassword, signToken, verifyToken
middleware/authMiddleware.js ← requireAuth, requireAdmin
routes/*.js                  ← router.use(requireAuth)
controllers/*.js             ← usa req.user.id (não conhece JWT)
```

## Configuração

### Variáveis de ambiente (servidor)

```env
DATABASE_URL=postgresql://...
JWT_SECRET=seu-segredo-jwt
ADMIN_EMAIL=admin@empresa.com
ADMIN_PASSWORD=senha-forte
ADMIN_NOME=Administrador
NODE_ENV=production
```

### Chaves de API (via Settings no app)

- `ANTHROPIC_API_KEY` — Claude (enriquecimento e importação PDF)
- `SERPER_API_KEY` — prospecção Google Maps
- `SERPAPI_KEY` — fallback de busca
- `BRAVE_SEARCH_API_KEY` — fallback Brave (pago $5/mês)
- `BING_SEARCH_API_KEY` — fallback Bing
- `GOOGLE_CSE_KEY` / `GOOGLE_CSE_CX` — fallback Google CSE (requer billing mesmo no plano gratuito)

## Banco de dados — Migrações

Execute em ordem no Neon SQL Editor:

```
001_schema.sql
002_add_tipo_to_products.sql
003_add_fields_to_clients.sql
004_fix_daily_report_timezone.sql
005_not_null_constraints.sql
006_overdue_index.sql
007_add_cnpj_ja_cliente.sql
008_add_catalogo_enviado.sql
009_cleanup_instagram_false_positives.sql
010_settings_table.sql
011_multi_tenant.sql          ← cria tabela users + user_id nas tabelas principais
012_seed_missing_user_statuses.sql
013_nao_tem_interesse.sql
014_whatsapp_sessions.sql
015_uf_nullable.sql           ← torna uf opcional (clientes importados sem estado)
```

## Desenvolvimento local

```bash
# Backend
cd server && npm install && npm run dev

# Frontend
cd client && npm install && npm run dev
```

Frontend: http://localhost:5173 (proxy `/api/*` → porta 8000)

## Deploy (Render)

Serviço único (backend serve o frontend buildado):

1. **Build command**: `cd ../client && npm install && npm run build && cd ../server && npm install`
2. **Start command**: `node src/index.js`
3. **Root directory**: `server`
4. Configurar as 5 variáveis de ambiente: `DATABASE_URL`, `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NOME`
5. Todas as rotas da API ficam em `/api/*` — o frontend usa esse prefixo automaticamente

### Manter online (free tier)

Configure o [UptimeRobot](https://uptimerobot.com) para pingar `https://seu-app.onrender.com/health` a cada **5 minutos** e o serviço nunca vai dormir.

---

Desenvolvido por **Thiago Gramuglia** — CNPJ 64.828.611/0001-05
