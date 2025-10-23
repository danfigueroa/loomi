# 🏦 Loomi Banking - Sistema de Microsserviços

Sistema bancário moderno desenvolvido com arquitetura de microsserviços, utilizando Clean Architecture, TypeScript e Node.js 22.

## 📋 Visão Geral

Este projeto implementa um sistema bancário completo com dois microsserviços principais:
- **customers-service**: Gerenciamento de clientes e dados bancários
- **transactions-service**: Processamento de transações financeiras

## 🛠 Tecnologias

- **Node.js 22** - Runtime JavaScript
- **TypeScript** - Linguagem de programação
- **Prisma** - ORM moderno para TypeScript
- **PostgreSQL** - Banco de dados principal
- **Redis** - Cache e sessões
- **Express.js** - Framework web
- **JWT** - Autenticação
- **Jest** - Testes unitários e integração

## 🏗 Arquitetura

O projeto segue os princípios da **Clean Architecture**:

```
src/
├── domain/          # Entidades e regras de negócio
├── application/     # Casos de uso e serviços
├── infrastructure/  # Implementações externas
├── presentation/    # Controllers e rotas
└── shared/         # Utilitários compartilhados
```

## 🚀 Configuração do Ambiente

### Pré-requisitos

- Node.js 22+
- PostgreSQL 14+
- Redis 6+
- npm ou yarn

### 🔐 Configuração de Segurança

**⚠️ IMPORTANTE: Configuração das Variáveis de Ambiente**

Antes de executar o projeto, você deve configurar as variáveis de ambiente para cada microsserviço:

#### 1. Customers Service

Copie o arquivo de exemplo e configure suas variáveis:
```bash
cd customers-service
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:
```env
# Database
DATABASE_URL="postgresql://usuario:senha@localhost:5432/customers_db?schema=public"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT - ALTERE ESTA CHAVE EM PRODUÇÃO
JWT_SECRET=sua-chave-secreta-super-forte-aqui

# Server
PORT=3001
NODE_ENV=development
```

#### 2. Transactions Service

```bash
cd transactions-service
cp .env.example .env
```

Configure o arquivo `.env`:
```env
# Database
DATABASE_URL="postgresql://usuario:senha@localhost:5432/transactions_db?schema=public"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT - USE A MESMA CHAVE DO CUSTOMERS SERVICE
JWT_SECRET=sua-chave-secreta-super-forte-aqui

# External Services
CUSTOMERS_SERVICE_URL=http://localhost:3001

# Server
PORT=3002
NODE_ENV=development
```

### 🔒 Segurança das Variáveis de Ambiente

- ✅ **Arquivos `.env` estão no `.gitignore`** - Não serão commitados
- ✅ **Use `.env.example`** como referência para configuração
- ⚠️ **NUNCA commite arquivos `.env`** com dados reais
- 🔑 **Altere `JWT_SECRET`** em produção para uma chave forte
- 🔐 **Use senhas seguras** para banco de dados em produção

### 📦 Instalação

1. **Clone o repositório**
```bash
git clone <repository-url>
cd loomi
```

2. **Instale as dependências**
```bash
# Instalar dependências do projeto raiz
npm install

# Instalar dependências dos microsserviços
cd customers-service && npm install
cd ../transactions-service && npm install
```

3. **Configure os bancos de dados**
```bash
# Customers Service
cd customers-service
npx prisma generate
npx prisma db push
npx prisma db seed

# Transactions Service
cd ../transactions-service
npx prisma generate
npx prisma db push
npx prisma db seed
```

4. **Execute os serviços**
```bash
# Terminal 1 - Customers Service
cd customers-service
npm run dev

# Terminal 2 - Transactions Service
cd transactions-service
npm run dev
```

## 🧪 Testes

```bash
# Executar testes
npm test

# Testes com coverage
npm run test:coverage

# Testes em modo watch
npm run test:watch
```

## 📚 Documentação da API

### Customers Service (Port 3001)

- `GET /api/health` - Health check
- `POST /api/users` - Criar usuário
- `GET /api/users/:id` - Buscar usuário
- `PUT /api/users/:id` - Atualizar usuário
- `DELETE /api/users/:id` - Deletar usuário

### Transactions Service (Port 3002)

- `GET /api/health` - Health check
- `POST /api/transactions` - Criar transação
- `GET /api/transactions/:id` - Buscar transação
- `GET /api/transactions/user/:userId` - Transações do usuário

## 🔧 Scripts Disponíveis

```bash
npm run dev          # Desenvolvimento
npm run build        # Build para produção
npm run start        # Executar build
npm run test         # Executar testes
npm run lint         # Verificar código
npm run format       # Formatar código
```

## 📁 Estrutura do Projeto

```
loomi/
├── customers-service/       # Microsserviço de clientes
├── transactions-service/    # Microsserviço de transações
├── shared/                 # Código compartilhado
├── docker/                 # Configurações Docker
├── PLANEJAMENTO.md         # Plano de desenvolvimento
├── rules.MD               # Regras do projeto
└── README.md              # Este arquivo
```

## 🚨 Avisos de Segurança

- 🔐 **Nunca commite arquivos `.env`**
- 🔑 **Use chaves JWT fortes em produção**
- 🛡️ **Configure CORS adequadamente**
- 🔒 **Use HTTPS em produção**
- 📝 **Monitore logs de segurança**

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique a documentação
2. Consulte os logs dos serviços
3. Verifique as configurações de ambiente
4. Entre em contato com a equipe de desenvolvimento

---

**Desenvolvido com ❤️ pela equipe Loomi Banking**