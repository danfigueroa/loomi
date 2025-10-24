# 🏦 Sistema de Microsserviços Loomi

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/loomi/loomi)
[![Test Coverage](https://img.shields.io/badge/coverage-80%25-green)](https://github.com/loomi/loomi)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/typescript-5.0+-blue)](https://www.typescriptlang.org/)
[![Docker](https://img.shields.io/badge/docker-ready-blue)](https://www.docker.com/)

Sistema de microsserviços para transações financeiras desenvolvido com **Node.js**, **TypeScript** e **Clean Architecture**. O sistema oferece uma arquitetura robusta, escalável e resiliente para processamento de transações financeiras entre usuários.

## 🏗️ Arquitetura do Sistema

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Nginx Proxy   │    │  Load Balancer  │    │   API Gateway   │
│   (Port 8080)   │    │                 │    │                 │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Customers       │    │ Transactions    │    │   Health Check  │
│ Service         │    │ Service         │    │   Endpoints     │
│ (Port 3001)     │    │ (Port 3002)     │    │                 │
└─────────┬───────┘    └─────────┬───────┘    └─────────────────┘
          │                      │
          └──────────┬───────────┘
                     │
         ┌───────────┼───────────┐
         │           │           │
         ▼           ▼           ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ PostgreSQL  │ │    Redis    │ │  Monitoring │
│ Database    │ │   Cache     │ │   & Logs    │
└─────────────┘ └─────────────┘ └─────────────┘
```

### Microsserviços

#### 🧑‍💼 **Customers Service** (Port 3001)
- **Responsabilidade**: Gerenciamento de usuários, autenticação e perfis
- **Tecnologias**: Node.js, TypeScript, Express, Prisma, JWT
- **Banco de dados**: PostgreSQL (tabela `users`)
- **Cache**: Redis para sessões e tokens

#### 💰 **Transactions Service** (Port 3002)
- **Responsabilidade**: Processamento de transações financeiras
- **Tecnologias**: Node.js, TypeScript, Express, Prisma, Circuit Breaker
- **Banco de dados**: PostgreSQL (tabela `transactions`)
- **Comunicação**: HTTP client para validação de usuários

#### 🔄 **Nginx Proxy** (Port 8080)
- **Responsabilidade**: Load balancing, proxy reverso, SSL termination
- **Roteamento**: `/api/customers/*` → Customers Service, `/api/transactions/*` → Transactions Service

## 📁 Estrutura do Projeto

```
loomi/
├── 📁 customers-service/           # Microsserviço de usuários
│   ├── 📁 src/
│   │   ├── 📁 config/             # Configurações (DB, Redis, Swagger)
│   │   ├── 📁 controllers/        # Health check controller
│   │   ├── 📁 entities/           # Entidades de domínio
│   │   ├── 📁 interfaces/         # Contratos e interfaces
│   │   ├── 📁 middlewares/        # Auth, CORS, Rate limiting
│   │   ├── 📁 repositories/       # Acesso a dados
│   │   ├── 📁 routes/             # Definição de rotas
│   │   ├── 📁 services/           # Lógica de negócio
│   │   └── 📁 utils/              # Utilitários
│   ├── 📁 prisma/                 # Schema e migrations
│   ├── 📁 tests/                  # Testes unitários e integração
│   └── 📄 Dockerfile              # Container configuration
│
├── 📁 transactions-service/        # Microsserviço de transações
│   ├── 📁 src/
│   │   ├── 📁 application/        # Casos de uso
│   │   ├── 📁 config/             # Configurações
│   │   ├── 📁 controllers/        # Health check controller
│   │   ├── 📁 domain/             # Entidades e interfaces
│   │   ├── 📁 infrastructure/     # Repositórios e HTTP clients
│   │   ├── 📁 presentation/       # Controllers e rotas
│   │   ├── 📁 shared/             # Middlewares e validações
│   │   └── 📁 utils/              # Utilitários
│   ├── 📁 prisma/                 # Schema e migrations
│   ├── 📁 tests/                  # Testes unitários e integração
│   └── 📄 Dockerfile              # Container configuration
│
├── 📁 tests/                      # Testes E2E e integração
│   ├── 📁 e2e/                   # Testes end-to-end
│   ├── 📁 integration/           # Testes de comunicação entre serviços
│   └── 📁 performance/           # Testes de carga e stress
│
├── 📁 nginx/                      # Configuração do proxy
├── 📁 docker/                     # Configurações Docker
├── 📄 docker-compose.yml          # Orquestração de containers
├── 📄 ARCHITECTURE.md             # Documentação da arquitetura
├── 📄 PERFORMANCE.md              # Benchmarks e performance
└── 📄 TROUBLESHOOTING.md          # Guia de resolução de problemas
```

## 🛠️ Tecnologias e Dependências

### **Stack Principal**
- **Runtime**: Node.js 18+ 
- **Linguagem**: TypeScript 5.0+
- **Framework Web**: Express.js 4.18+
- **ORM**: Prisma 5.22+
- **Banco de Dados**: PostgreSQL 15+
- **Cache**: Redis 7+
- **Containerização**: Docker + Docker Compose

### **Arquitetura e Padrões**
- **Clean Architecture**: Separação clara de responsabilidades
- **Domain Driven Design (DDD)**: Modelagem orientada ao domínio
- **Circuit Breaker Pattern**: Resiliência na comunicação entre serviços
- **Repository Pattern**: Abstração de acesso a dados
- **Dependency Injection**: Inversão de controle

### **Qualidade e Testes**
- **Testes**: Jest 29+ com NYC/Istanbul para cobertura
- **Linting**: ESLint + Prettier
- **Validação**: Joi para validação de schemas
- **Documentação**: Swagger/OpenAPI 3.0

### **Observabilidade**
- **Logs**: Winston com logs estruturados
- **Correlation IDs**: Rastreamento distribuído
- **Health Checks**: Monitoramento de saúde dos serviços
- **Rate Limiting**: Proteção contra abuso de API

## ⚙️ Configuração e Instalação

### **Pré-requisitos**
- Node.js 18.0.0 ou superior
- Docker e Docker Compose
- Git

### **Instalação Rápida**

```bash
# 1. Clonar o repositório
git clone https://github.com/loomi/loomi.git
cd loomi

# 2. Setup completo do ambiente
npm run setup

# 3. Configurar variáveis de ambiente
cp .env.example .env
# Edite o arquivo .env com suas configurações

# 4. Executar com Docker
npm run dev
```

### **Configuração Manual**

```bash
# Instalar dependências de cada serviço
cd customers-service && npm install
cd ../transactions-service && npm install
cd ..

# Configurar banco de dados
npm run db:setup

# Executar migrations
npm run db:migrate

# Seed inicial (opcional)
npm run db:seed
```

### **Variáveis de Ambiente**

Crie um arquivo `.env` na raiz do projeto:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/loomi_db"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="24h"

# Services URLs
CUSTOMERS_SERVICE_URL="http://customers-service:3001"
TRANSACTIONS_SERVICE_URL="http://transactions-service:3002"

# Environment
NODE_ENV="development"
LOG_LEVEL="info"

# Ports
CUSTOMERS_SERVICE_PORT=3001
TRANSACTIONS_SERVICE_PORT=3002
NGINX_PORT=8080
```

## 🚀 Como Executar

### **Desenvolvimento com Docker (Recomendado)**

```bash
# Executar todos os serviços
npm run dev

# Executar em background
npm run dev:detached

# Ver logs em tempo real
npm run logs

# Parar todos os serviços
npm run stop

# Limpeza completa
npm run clean
```

### **Desenvolvimento Local**

```bash
# Terminal 1 - Customers Service
cd customers-service
npm run dev

# Terminal 2 - Transactions Service  
cd transactions-service
npm run dev

# Terminal 3 - Nginx (opcional)
docker run -p 8080:80 -v ./nginx/nginx.conf:/etc/nginx/nginx.conf nginx
```

### **Scripts NPM Disponíveis**

```bash
# Setup e instalação
npm run setup              # Setup completo
npm run setup:customers    # Setup apenas customers-service
npm run setup:transactions # Setup apenas transactions-service

# Desenvolvimento
npm run dev               # Executar com Docker
npm run dev:detached      # Executar em background
npm run logs              # Ver logs
npm run stop              # Parar serviços
npm run clean             # Limpeza completa

# Testes
npm run test:all          # Todos os testes
npm run test:unit         # Testes unitários
npm run test:integration  # Testes de integração
npm run test:e2e          # Testes end-to-end
npm run test:coverage     # Cobertura de testes

# Build e produção
npm run build             # Build de todos os serviços
npm run start:prod        # Executar em produção

# Database
npm run db:migrate        # Executar migrations
npm run db:seed           # Seed inicial
npm run db:reset          # Reset completo
```

## 📡 Endpoints da API

### **🧑‍💼 Customers Service** (`http://localhost:3001`)

#### **Health Check**
```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "service": "customers-service",
  "version": "1.0.0",
  "uptime": 3600,
  "checks": {
    "database": "healthy",
    "redis": "healthy"
  }
}
```

#### **Registro de Usuário**
```http
POST /api/users/register
Content-Type: application/json
```

**Request:**
```json
{
  "name": "João Silva",
  "email": "joao@example.com",
  "password": "senha123",
  "cpf": "12345678901"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "João Silva",
    "email": "joao@example.com",
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00.000Z"
  },
  "message": "User registered successfully"
}
```

#### **Login de Usuário**
```http
POST /api/users/login
Content-Type: application/json
```

**Request:**
```json
{
  "email": "joao@example.com",
  "password": "senha123"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "João Silva",
      "email": "joao@example.com"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "24h"
  },
  "message": "Login successful"
}
```

#### **Perfil do Usuário**
```http
GET /api/users/profile
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "João Silva",
    "email": "joao@example.com",
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### **💰 Transactions Service** (`http://localhost:3002`)

#### **Health Check**
```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "service": "transactions-service",
  "version": "1.0.0",
  "uptime": 3600,
  "checks": {
    "database": "healthy",
    "redis": "healthy",
    "customersService": "healthy"
  }
}
```

#### **Criar Transação**
```http
POST /api/transactions
Authorization: Bearer {token}
Content-Type: application/json
```

**Request:**
```json
{
  "fromUserId": "123e4567-e89b-12d3-a456-426614174000",
  "toUserId": "987fcdeb-51d2-43a1-b456-426614174111",
  "amount": 150.50,
  "description": "Pagamento de serviços",
  "type": "TRANSFER"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "id": "456e7890-e89b-12d3-a456-426614174222",
    "fromUserId": "123e4567-e89b-12d3-a456-426614174000",
    "toUserId": "987fcdeb-51d2-43a1-b456-426614174111",
    "amount": 150.50,
    "description": "Pagamento de serviços",
    "status": "PENDING",
    "type": "TRANSFER",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  },
  "message": "Transaction created successfully"
}
```

#### **Buscar Transação por ID**
```http
GET /api/transactions/{transactionId}
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "456e7890-e89b-12d3-a456-426614174222",
    "fromUserId": "123e4567-e89b-12d3-a456-426614174000",
    "toUserId": "987fcdeb-51d2-43a1-b456-426614174111",
    "amount": 150.50,
    "description": "Pagamento de serviços",
    "status": "COMPLETED",
    "type": "TRANSFER",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:35:00.000Z",
    "processedAt": "2024-01-15T10:35:00.000Z"
  }
}
```

#### **Listar Transações do Usuário**
```http
GET /api/transactions/user/{userId}?page=1&limit=10
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "456e7890-e89b-12d3-a456-426614174222",
      "fromUserId": "123e4567-e89b-12d3-a456-426614174000",
      "toUserId": "987fcdeb-51d2-43a1-b456-426614174111",
      "amount": 150.50,
      "description": "Pagamento de serviços",
      "status": "COMPLETED",
      "type": "TRANSFER",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25
  }
}
```

### **🔄 Nginx Proxy** (`http://localhost:8080`)

```http
# Customers Service via proxy
GET http://localhost:8080/api/customers/health
POST http://localhost:8080/api/customers/users/register

# Transactions Service via proxy  
GET http://localhost:8080/api/transactions/health
POST http://localhost:8080/api/transactions/
```

### **Códigos de Status HTTP**

| Código | Descrição | Uso |
|--------|-----------|-----|
| `200` | OK | Operação bem-sucedida |
| `201` | Created | Recurso criado com sucesso |
| `400` | Bad Request | Dados inválidos ou malformados |
| `401` | Unauthorized | Token JWT inválido ou ausente |
| `403` | Forbidden | Acesso negado |
| `404` | Not Found | Recurso não encontrado |
| `429` | Too Many Requests | Rate limit excedido |
| `500` | Internal Server Error | Erro interno do servidor |
| `503` | Service Unavailable | Serviço indisponível |

## 🧪 Testes

### **Estrutura de Testes**

```
tests/
├── 📁 unit/                    # Testes unitários
│   ├── controllers/           # Testes de controllers
│   ├── services/              # Testes de services
│   └── repositories/          # Testes de repositories
├── 📁 integration/            # Testes de integração
│   ├── api/                   # Testes de API
│   └── database/              # Testes de banco
└── 📁 e2e/                    # Testes end-to-end
    ├── user-flows/            # Fluxos de usuário
    └── system/                # Testes de sistema
```

### **Executar Testes**

```bash
# Todos os testes
npm run test:all

# Testes unitários
npm run test:unit

# Testes de integração  
npm run test:integration

# Testes end-to-end
npm run test:e2e

# Cobertura de testes
npm run test:coverage

# Testes em modo watch
npm run test:watch

# Testes de performance
npm run test:performance
```

### **Cobertura de Testes**

**Quality Gates configurados:**
- **Linhas**: mínimo 80%
- **Branches**: mínimo 80% 
- **Functions**: mínimo 80%
- **Statements**: mínimo 80%

**Relatórios gerados:**
- HTML: `coverage/lcov-report/index.html`
- LCOV: `coverage/lcov.info`
- Text: saída no terminal

### **Tipos de Teste**

#### **Unitários** (Jest)
- Controllers, Services, Repositories
- Middlewares e Utilities
- Validações e Transformações
- Mocks e Stubs para dependências

#### **Integração** (Jest + Supertest)
- Fluxos completos de API
- Comunicação entre serviços
- Integração com banco de dados
- Autenticação e autorização

#### **End-to-End** (Jest + Docker)
- Cenários de usuário completos
- Testes com ambiente real
- Validação de fluxos críticos
- Testes de regressão

#### **Performance** (Artillery.js)
- Load testing
- Stress testing
- Benchmarks de performance
- Análise de throughput e latência

## 📚 Documentação da API

### **Swagger UI**

Acesse a documentação interativa das APIs:

- **Customers Service**: http://localhost:3001/api-docs
- **Transactions Service**: http://localhost:3002/api-docs
- **Via Nginx**: 
  - http://localhost:8080/api/customers/api-docs
  - http://localhost:8080/api/transactions/api-docs

### **Recursos da Documentação**

- ✅ **Schemas completos** de request/response
- ✅ **Exemplos interativos** para todos os endpoints
- ✅ **Autenticação JWT** integrada
- ✅ **Códigos de erro** documentados
- ✅ **Validações** de entrada explicadas
- ✅ **Try it out** para testar diretamente

### **Exportar Documentação**

```bash
# Gerar arquivo OpenAPI JSON
curl http://localhost:3001/api-docs.json > customers-api.json
curl http://localhost:3002/api-docs.json > transactions-api.json

# Gerar documentação estática
npm run docs:generate
```

## 📊 Monitoramento e Observabilidade

### **Health Checks**

Cada serviço expõe um endpoint `/health` que monitora:

- ✅ **Status da aplicação**
- ✅ **Conexão com banco de dados**
- ✅ **Conexão com Redis**
- ✅ **Comunicação entre serviços** (transactions-service)

### **Logs Estruturados**

Logs em formato JSON com Winston:

```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "level": "info",
  "message": "Transaction created successfully",
  "service": "transactions-service",
  "correlationId": "req-123e4567-e89b-12d3",
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "transactionId": "456e7890-e89b-12d3-a456-426614174222",
  "metadata": {
    "amount": 150.50,
    "type": "TRANSFER"
  }
}
```

### **Correlation IDs**

Rastreamento distribuído de requests:
- Gerado automaticamente para cada request
- Propagado entre todos os serviços
- Incluído em todos os logs
- Header: `x-correlation-id`

### **Métricas**

Métricas coletadas automaticamente:
- **Request/Response times**
- **Status codes distribution**
- **Error rates**
- **Throughput (requests/second)**
- **Database query performance**
- **Redis operations**

## 🔒 Segurança

### **Autenticação JWT**

```javascript
// Estrutura do Token JWT
{
  "sub": "123e4567-e89b-12d3-a456-426614174000",
  "email": "joao@example.com", 
  "iat": 1642248000,
  "exp": 1642334400,
  "iss": "loomi-customers-service"
}
```

**Configuração:**
- **Algoritmo**: HS256
- **Expiração**: 24 horas (configurável)
- **Secret**: Variável de ambiente `JWT_SECRET`
- **Header**: `Authorization: Bearer {token}`

### **Rate Limiting**

Proteção contra abuso de API:

```javascript
// Configuração por endpoint
{
  "global": "1000 requests/hour",
  "auth": "10 requests/minute", 
  "transactions": "100 requests/hour",
  "registration": "5 requests/minute"
}
```

### **CORS**

Cross-Origin Resource Sharing configurado:
- **Origins**: Configurável via ambiente
- **Methods**: GET, POST, PUT, DELETE, OPTIONS
- **Headers**: Authorization, Content-Type, x-correlation-id
- **Credentials**: Habilitado

### **Validação de Dados**

Validação rigorosa com Joi:
- **Sanitização** de entrada
- **Validação de tipos** e formatos
- **Limites de tamanho**
- **Regex patterns** para CPF, email, etc.
- **Mensagens de erro** personalizadas

### **Headers de Segurança**

Helmet.js configurado com:
- **Content Security Policy (CSP)**
- **X-Frame-Options**: DENY
- **X-Content-Type-Options**: nosniff
- **Referrer-Policy**: strict-origin-when-cross-origin
- **Permissions-Policy**: Restritiva

## 🚀 Deploy e Produção

### **Docker Compose**

```bash
# Produção
docker-compose -f docker-compose.prod.yml up -d

# Staging
docker-compose -f docker-compose.staging.yml up -d

# Desenvolvimento
docker-compose up -d
```

### **Variáveis de Ambiente - Produção**

```env
# Produção
NODE_ENV=production
LOG_LEVEL=warn

# Database (usar conexão segura)
DATABASE_URL="postgresql://user:pass@prod-db:5432/loomi_prod?sslmode=require"

# Redis (usar conexão segura)
REDIS_URL="rediss://user:pass@prod-redis:6380"

# JWT (usar secret forte)
JWT_SECRET="super-strong-production-secret-key-256-bits"
JWT_EXPIRES_IN="1h"

# Rate Limiting (mais restritivo)
RATE_LIMIT_WINDOW_MS=900000  # 15 minutos
RATE_LIMIT_MAX_REQUESTS=100

# Monitoring
ENABLE_METRICS=true
METRICS_PORT=9090
```

### **Considerações de Produção**

#### **Segurança**
- ✅ **HTTPS obrigatório** com certificados válidos
- ✅ **Secrets management** (AWS Secrets Manager, HashiCorp Vault)
- ✅ **Network policies** restritivas
- ✅ **Container scanning** para vulnerabilidades
- ✅ **Regular security updates**

#### **Performance**
- ✅ **Connection pooling** para banco de dados
- ✅ **Redis clustering** para alta disponibilidade
- ✅ **CDN** para assets estáticos
- ✅ **Gzip compression** habilitada
- ✅ **Keep-alive connections**

#### **Monitoramento**
- ✅ **Prometheus + Grafana** para métricas
- ✅ **ELK Stack** para logs centralizados
- ✅ **Jaeger** para distributed tracing
- ✅ **Alertmanager** para alertas
- ✅ **Uptime monitoring**

#### **Backup e Recovery**
- ✅ **Backup automático** do PostgreSQL
- ✅ **Point-in-time recovery**
- ✅ **Redis persistence** configurada
- ✅ **Disaster recovery plan**
- ✅ **Regular restore testing**

## 🔧 Troubleshooting

### **Problemas Comuns**

#### **Erro de Conexão com Banco**
```bash
Error: P1001: Can't reach database server
```

**Soluções:**
```bash
# Verificar se PostgreSQL está rodando
docker-compose ps postgres

# Aguardar inicialização completa
sleep 30 && npm run db:migrate

# Verificar logs do banco
docker-compose logs postgres
```

#### **Erro de Conexão com Redis**
```bash
Error: Redis connection failed
```

**Soluções:**
```bash
# Verificar se Redis está rodando
docker-compose ps redis

# Testar conexão manual
redis-cli -h localhost -p 6379 ping

# Verificar logs do Redis
docker-compose logs redis
```

#### **Erro de Autenticação JWT**
```bash
Error: Invalid token
```

**Soluções:**
```bash
# Verificar se JWT_SECRET está configurado
echo $JWT_SECRET

# Verificar expiração do token
# Token expira em 24h por padrão

# Gerar novo token via login
curl -X POST http://localhost:3001/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'
```

#### **Rate Limit Excedido**
```bash
Error: Too Many Requests
```

**Soluções:**
```bash
# Aguardar reset do rate limit (1 minuto)
# Ou configurar limites maiores em desenvolvimento

# Verificar configuração atual
grep -r "RATE_LIMIT" .env
```

### **Comandos de Debug**

```bash
# Ver logs de todos os serviços
docker-compose logs -f

# Ver logs de um serviço específico
docker-compose logs -f customers-service

# Executar comando dentro do container
docker-compose exec customers-service sh

# Verificar saúde dos serviços
curl http://localhost:3001/health
curl http://localhost:3002/health

# Testar conectividade entre serviços
docker-compose exec transactions-service \
  curl http://customers-service:3001/health
```

### **Performance Issues**

```bash
# Monitorar recursos dos containers
docker stats

# Verificar queries lentas no PostgreSQL
docker-compose exec postgres \
  psql -U postgres -d loomi_db \
  -c "SELECT query, mean_time FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"

# Monitorar Redis
docker-compose exec redis redis-cli monitor
```

## 🤝 Contribuição

### **Guidelines de Desenvolvimento**

#### **Padrões de Código**
- ✅ **TypeScript strict mode** habilitado
- ✅ **ESLint + Prettier** para formatação
- ✅ **Conventional Commits** para mensagens
- ✅ **Clean Architecture** principles
- ✅ **SOLID principles**

#### **Workflow de Contribuição**

```bash
# 1. Fork e clone o repositório
git clone https://github.com/your-username/loomi.git

# 2. Criar branch para feature
git checkout -b feature/nova-funcionalidade

# 3. Fazer alterações e commits
git add .
git commit -m "feat: adicionar nova funcionalidade"

# 4. Executar testes
npm run test:all
npm run lint

# 5. Push e criar Pull Request
git push origin feature/nova-funcionalidade
```

#### **Checklist de PR**

- [ ] ✅ **Testes** passando (unitários, integração, e2e)
- [ ] ✅ **Cobertura** mantida acima de 80%
- [ ] ✅ **Linting** sem erros
- [ ] ✅ **Documentação** atualizada
- [ ] ✅ **Changelog** atualizado
- [ ] ✅ **Breaking changes** documentadas

#### **Estrutura de Commits**

```bash
# Tipos permitidos
feat:     # Nova funcionalidade
fix:      # Correção de bug
docs:     # Documentação
style:    # Formatação
refactor: # Refatoração
test:     # Testes
chore:    # Manutenção

# Exemplos
feat(auth): adicionar autenticação JWT
fix(transactions): corrigir validação de valor
docs(readme): atualizar documentação da API
test(users): adicionar testes de integração
```

### **Configuração do Ambiente de Desenvolvimento**

```bash
# Instalar dependências globais
npm install -g typescript ts-node nodemon

# Configurar hooks do Git
npm run prepare

# Executar em modo desenvolvimento
npm run dev:watch

# Executar testes em modo watch
npm run test:watch
```

---

## 📄 Licença

Este projeto está licenciado sob a **MIT License** - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 📞 Suporte

- **Documentação**: [docs.loomi.com](https://docs.loomi.com)
- **Issues**: [GitHub Issues](https://github.com/loomi/loomi/issues)
- **Discussions**: [GitHub Discussions](https://github.com/loomi/loomi/discussions)
- **Email**: dev@loomi.com

---

**Desenvolvido com ❤️ pela equipe Loomi**

*Sistema robusto, escalável e resiliente para o futuro das transações financeiras.*