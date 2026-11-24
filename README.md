# Pokemon TCG - API de Coleção

API REST para cadastro de usuários e gerenciamento de coleções de cartas Pokémon. Cada usuário possui sua própria coleção, com autenticação baseada em JWT e persistência PostgreSQL via Prisma.

## Tecnologias

- Node.js 20+
- TypeScript
- Express 5
- Prisma ORM 6
- PostgreSQL
- JSON Web Token (JWT)
- bcryptjs
- Zod

## Funcionalidades

- Registro e login de usuários
- Senhas armazenadas com hash
- Autenticação por token Bearer
- Cadastro, consulta, atualização e exclusão de cartas
- Filtros por nome, tipo e raridade
- Resumo da coleção por usuário
- Isolamento dos dados entre contas

## Pré-requisitos

- Node.js 20 ou superior
- npm
- Banco PostgreSQL

## Configuração

1. Instale as dependências:

```bash
npm install
```

2. Copie o arquivo de exemplo de ambiente:

```bash
copy .env.example .env
```

3. Configure o arquivo `.env`:

```env
DATABASE_URL="postgresql://usuario:senha@host:5432/pokemon?sslmode=require"
PORT=3000
JWT_SECRET="substitua-por-uma-chave-longa-e-aleatoria"
SEED_SENHA=123456
```

4. Gere o Prisma Client e aplique as migrations:

```bash
npm run prisma:generate
npm run prisma:migrate:deploy
```

Para ambiente de desenvolvimento, também é possível criar novas migrations automaticamente:

```bash
npm run prisma:migrate
```

5. Opcionalmente, carregue os dados de demonstração:

```bash
npm run prisma:seed
```

O usuário criado pelo seed possui o e-mail `demo@pokemon.local` e a senha definida em `SEED_SENHA` (por padrão, `123456`).

## Execução

### Desenvolvimento

```bash
npm run dev
```

### Produção

```bash
npm run build
npm start
```

Por padrão, a API estará disponível em `http://localhost:3000`.

## Deploy no Render

O projeto inclui o arquivo `render.yaml` para facilitar a criação do serviço Web.

1. Disponibilize um banco PostgreSQL e obtenha a variável `DATABASE_URL`.
   - Pode ser usado um PostgreSQL criado no Render.
   - Também pode ser usado outro provedor, como o Neon.

2. Envie o backend para um repositório no GitHub.

3. No painel do Render, selecione **New > Blueprint** e informe o repositório.

4. Quando solicitado, configure a variável `DATABASE_URL` com a URL de conexão do PostgreSQL.

5. Confirme o deploy. A configuração utiliza:
   - Build: `npm ci && npm run prisma:generate && npm run build`
   - Inicialização: `npm run prisma:migrate:deploy && npm start`
   - Health check: `/health`

Não coloque o segredo real de `JWT_SECRET` diretamente no repositório. Defina-o no painel de Environment do Render.

Após o deploy, a URL pública terá formato semelhante a:

```text
https://pokemon-tcg-api.onrender.com
```

Configure essa URL no Front-end para substituir o endereço local da API.

Exemplo de variável no Front-end:

```env
VITE_API_URL=https://pokemon-tcg-api.onrender.com
```

## Endpoints

### Saúde da API

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/health` | Verifica se a API está online |

### Autenticação

| Método | Rota | Descrição |
|---|---|---|
| `POST` | `/auth/register` | Cadastra um usuário |
| `POST` | `/auth/login` | Realiza login e retorna o token JWT |

Exemplo de cadastro:

```json
{
  "nome": "Ash Ketchum",
  "email": "ash@example.com",
  "senha": "123456"
}
```

Exemplo de login:

```json
{
  "email": "ash@example.com",
  "senha": "123456"
}
```

O login retorna um token no formato:

```json
{
  "token": "<jwt>",
  "usuario": {
    "id": "<uuid>",
    "nome": "Ash Ketchum",
    "email": "ash@example.com"
  }
}
```

### Cartas

Todas as rotas abaixo exigem o cabeçalho:

```http
Authorization: Bearer <jwt>
```

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/cartas` | Lista as cartas do usuário |
| `GET` | `/cartas?nome=Pikachu&tipo=Lightning&raridade=Common` | Lista cartas aplicando filtros |
| `GET` | `/cartas/resumo` | Retorna o resumo da coleção |
| `GET` | `/cartas/:id` | Busca uma carta pelo ID |
| `POST` | `/cartas` | Cadastra uma carta |
| `PUT` | `/cartas/:id` | Atualiza uma carta |
| `DELETE` | `/cartas/:id` | Remove uma carta |

Exemplo de criação de carta:

```json
{
  "nome": "Pikachu",
  "colecao": "Base Set",
  "numeroCarta": "58/102",
  "tipo": "Lightning",
  "raridade": "Common",
  "condicao": "Near Mint",
  "quantidade": 2,
  "valorEstimado": 0.75,
  "urlImagem": "https://images.pokemontcg.io/base1/58.png"
}
```

Campos obrigatórios no cadastro: `nome`, `colecao`, `numeroCarta`, `tipo`, `raridade` e `condicao`.

Exemplo de resposta do resumo:

```json
{
  "totalCartasFisicas": 10,
  "totalCartasUnicas": 5,
  "valorTotalEstimado": 108.75
}
```

## Estrutura do projeto

```text
src/
  app.ts                  # Configuração do Express e das rotas
  server.ts               # Inicialização do servidor HTTP
  controllers/            # Regras das rotas de autenticação e cartas
  middlewares/            # Middleware de autenticação JWT
  routes/                 # Definição das rotas da API
  lib/                    # Clientes e utilitários compartilhados
  types/                  # Extensões de tipos do Express
prisma/
  schema.prisma           # Modelos Usuario e Carta
  migrations/             # Migrations do banco
  seed.ts                 # Dados de demonstração
```

## Scripts

| Comando | Descrição |
|---|---|
| `npm run dev` | Executa em modo desenvolvimento |
| `npm run build` | Gera o Prisma Client e compila o TypeScript |
| `npm start` | Executa a versão compilada |
| `npm run prisma:generate` | Gera o Prisma Client |
| `npm run prisma:migrate` | Cria e aplica migrations em desenvolvimento |
| `npm run prisma:migrate:deploy` | Aplica migrations existentes |
| `npm run prisma:seed` | Executa o seed do banco |
