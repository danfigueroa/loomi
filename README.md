# Sistema de Microsserviços Loomi

Sistema de microsserviços para transações financeiras desenvolvido com Node.js, TypeScript e Clean Architecture.

## 🏗️ Arquitetura

O sistema é composto por dois microsserviços principais:

- **customers-service** (Porta 3001): Gerenciamento de usuários e autenticação
- **transactions-service** (Porta 3002): Processamento de transações financeiras

### Tecnologias Utilizadas

- **Node.js** + **TypeScript**
- **Express.js** para APIs REST
- **Prisma** como ORM
- **PostgreSQL** como banco de dados
- **Redis** para cache e sessões
- **RabbitMQ** para mensageria assíncrona
- **Docker** + **Docker Compose** para containerização
- **Nginx** como proxy reverso e load balancer
- **Jest** para testes unitários e de integração
- **Artillery** para testes de performance
- **Swagger/OpenAPI** para documentação de APIs
- **NYC/Istanbul** para cobertura de testes
- **GitHub Actions** para CI/CD

## 🚀 Funcionalidades Implementadas

### Etapa 4: Comunicação entre Microsserviços

✅ **Comunicação HTTP**
- Cliente HTTP no transactions-service para comunicar com customers-service
- Health checks em ambos os serviços (`/health`)
- Timeout e retry policies configurados
- Validação de usuário no transactions-service via customers-service

✅ **Mensageria Assíncrona (RabbitMQ)**
- Publisher/Subscriber pattern implementado
- Eventos de transações (criação, processamento, cancelamento)
- Eventos de usuários (dados bancários, autenticação)
- Filas dedicadas para cada tipo de evento
- Health checks para RabbitMQ integrados

✅ **Resiliência**
- Circuit breaker pattern implementado
- Retry com backoff exponencial
- Fallback strategies para falhas de comunicação

✅ **Observabilidade**
- Correlation IDs para rastreamento distribuído de requests
- Logs estruturados com Winston
- Health checks detalhados com status de componentes

✅ **Infraestrutura**
- Docker Compose configurado para todos os serviços
- Networking entre containers
- Nginx como proxy reverso
- Variáveis de ambiente organizadas

### Etapa 5: Testes e Documentação

✅ **Documentação de APIs**
- Swagger UI integrado em ambos os serviços (`/api-docs`)
- Documentação OpenAPI 3.0 completa
- Schemas detalhados para todas as entidades
- Exemplos de request/response
- Documentação de autenticação JWT

✅ **Cobertura de Testes**
- NYC/Istanbul configurado com quality gates (80%)
- Relatórios de cobertura em HTML e LCOV
- Testes unitários para controllers, services e repositories
- Testes de integração para fluxos completos
- Testes E2E com Docker Compose

✅ **CI/CD Pipeline**
- GitHub Actions workflow completo
- Execução de testes unitários, integração e E2E
- Verificação de cobertura de testes
- Análise de segurança com npm audit
- Build e validação de código
- Quality gates para garantir qualidade

✅ **Testes de Performance**
- Artillery configurado para load testing
- Cenários de teste realistas (registro, transações, consultas)
- Testes de stress com diferentes cargas
- Métricas de performance documentadas
- Benchmarks e troubleshooting guide

✅ **Automação e Scripts**
- Scripts npm para todas as operações
- Setup automático de ambiente
- Scripts de build, test e deploy
- Comandos de limpeza e reset
- Documentação completa de comandos

## 🛠️ Configuração e Execução

### Pré-requisitos

- Node.js 18+
- Docker e Docker Compose
- PostgreSQL (ou usar via Docker)
- Redis (ou usar via Docker)

### Instalação Rápida

```bash
# Setup completo do ambiente
npm run setup
```

### Configuração Manual

1. **Instalar dependências de cada serviço:**
```bash
npm run setup:customers
npm run setup:transactions
```

2. **Configurar variáveis de ambiente:**
```bash
cp .env.example .env
# Edite o arquivo .env com suas configurações
```

### Execução

#### Desenvolvimento (Docker Compose)
```bash
# Executar todos os serviços com Docker
npm run dev

# Executar em background
npm run dev:detached

# Parar todos os serviços
npm run stop

# Limpeza completa (containers, volumes, imagens)
npm run clean
```

#### Desenvolvimento Local (sem Docker)
```bash
# Em terminais separados
cd customers-service && npm run dev
cd transactions-service && npm run dev
```

## 🧪 Testes

### Execução de Testes

```bash
# Executar todos os tipos de teste
npm run test:all

# Testes unitários
npm run test:unit

# Testes de integração
npm run test:integration

# Testes End-to-End
npm run test:e2e

# Cobertura de testes
npm run test:coverage
```

### Testes de Performance

```bash
# Teste de carga básico
npm run test:performance

# Teste de stress
npm run test:stress

# Teste com relatório detalhado
npm run test:performance:report
```

### Cobertura de Testes

Os testes cobrem:
- **Unitários**: Controllers, services, repositories, middlewares
- **Integração**: Fluxos completos, comunicação entre serviços
- **E2E**: Cenários de usuário completos com Docker
- **Performance**: Load testing e stress testing

**Quality Gates**: Cobertura mínima de 80% (linhas, branches, functions, statements)

## 📡 Endpoints

### Customers Service (Porta 3001)

- `GET /health` - Health check do serviço
- `POST /api/users/register` - Registro de usuário
- `POST /api/users/login` - Login de usuário
- `GET /api/users/profile` - Perfil do usuário
- `PUT /api/users/profile` - Atualizar perfil
- `DELETE /api/users/:id` - Deletar usuário

### Transactions Service (Porta 3002)

- `GET /health` - Health check do serviço
- `POST /api/transactions` - Criar transação
- `GET /api/transactions/:id` - Buscar transação por ID
- `GET /api/transactions/user/:userId` - Buscar transações do usuário

### Nginx Proxy (Porta 8080)

- `GET /health` - Health check do proxy
- `/api/customers/*` - Proxy para customers-service
- `/api/transactions/*` - Proxy para transactions-service

### Documentação das APIs

- **Customers Service**: `http://localhost:3001/api-docs`
- **Transactions Service**: `http://localhost:3002/api-docs`
- **Via Nginx**: `http://localhost:8080/api/customers/api-docs` e `http://localhost:8080/api/transactions/api-docs`

## 🔧 Configurações Avançadas

### Circuit Breaker

O circuit breaker está configurado com:
- **Failure Threshold**: 5 falhas consecutivas
- **Recovery Timeout**: 60 segundos
- **Request Timeout**: 5 segundos

### Retry Policy

- **Max Retries**: 3 tentativas
- **Backoff**: Exponencial (1s, 2s, 4s)
- **Jitter**: Aleatório para evitar thundering herd

### Health Checks

Cada serviço monitora:
- Status da aplicação
- Conexão com banco de dados
- Conexão com Redis
- Conexão com RabbitMQ
- Comunicação entre serviços (transactions-service)

## 🐳 Docker

### Docker

### Serviços Configurados

- **postgres**: Banco de dados PostgreSQL
- **redis**: Cache e sessões
- **rabbitmq**: Message broker para comunicação assíncrona
- **customers-service**: Microsserviço de usuários
- **transactions-service**: Microsserviço de transações
- **nginx**: Proxy reverso e load balancer

### Networking

Todos os serviços estão na rede `loomi-network` permitindo comunicação interna segura.

## 📊 Monitoramento

### Correlation IDs

Cada request recebe um correlation ID único que é propagado entre os serviços, facilitando o rastreamento distribuído.

### Logs Estruturados

Logs em formato JSON com informações contextuais:
- Correlation ID
- Service name
- Timestamp
- Log level
- Message
- Metadata adicional

## 🔒 Segurança

- Autenticação JWT
- Rate limiting configurado
- CORS habilitado
- Helmet para headers de segurança

## 📚 Documentação Adicional

- **[Arquitetura do Sistema](./ARCHITECTURE.md)** - Documentação detalhada da arquitetura
- **[Guia de Performance](./PERFORMANCE.md)** - Testes de performance e benchmarks
- **[Troubleshooting](./TROUBLESHOOTING.md)** - Guia de resolução de problemas
- **[Planejamento](./PLANEJAMENTO.md)** - Roadmap e etapas do projeto

## 🤝 Contribuição

### Scripts de Desenvolvimento

```bash
# Linting e formatação
npm run lint
npm run format

# Build dos serviços
npm run build

# Limpeza completa
npm run clean
```

### Quality Gates

- Cobertura de testes: mínimo 80%
- Linting: zero erros
- Testes: todos devem passar
- Build: deve ser bem-sucedido

## 📈 CI/CD

O projeto inclui pipeline completo no GitHub Actions:

- ✅ Testes unitários e de integração
- ✅ Verificação de cobertura de testes
- ✅ Análise de segurança
- ✅ Build e validação
- ✅ Testes E2E com Docker
- ✅ Quality gates

## 🚀 Deploy

### Produção

```bash
# Build para produção
npm run build

# Deploy com Docker
docker-compose -f docker-compose.prod.yml up -d
```

### Monitoramento

- Health checks em `/health`
- Métricas de performance
- Logs estruturados
- Correlation IDs para tracing

---

**Desenvolvido com ❤️ seguindo Clean Architecture e melhores práticas de microsserviços.**
- Validação de entrada com Joi
- Sanitização de dados

## 🔄 Mensageria com RabbitMQ

### Arquitetura de Eventos

O sistema utiliza RabbitMQ para comunicação assíncrona entre microsserviços através de eventos:

#### Eventos de Transações
- **TransactionCreated**: Disparado quando uma transação é criada
- **TransactionProcessed**: Disparado quando uma transação é processada com sucesso
- **TransactionCancelled**: Disparado quando uma transação é cancelada

#### Eventos de Usuários
- **BankingDataUpdated**: Disparado quando dados bancários são atualizados
- **AuthenticationEvent**: Disparado em eventos de autenticação

### Configuração

```typescript
// Configuração RabbitMQ
const rabbitmqConfig = {
  url: process.env.RABBITMQ_URL || 'amqp://localhost:5672',
  queues: {
    transactionCreated: 'transaction.created',
    transactionProcessed: 'transaction.processed',
    transactionCancelled: 'transaction.cancelled',
    bankingDataUpdated: 'user.banking.updated',
    authenticationEvents: 'user.authentication'
  },
  exchanges: {
    transactions: 'transactions.exchange',
    users: 'users.exchange'
  }
};
```

### Publishers e Subscribers

Cada serviço implementa publishers para publicar eventos e subscribers para consumir eventos relevantes:

- **customers-service**: Publica eventos de usuários e dados bancários
- **transactions-service**: Publica eventos de transações e consome eventos de usuários

### Testes

Os testes de mensageria incluem:
- Testes unitários para publishers e subscribers
- Mocks para RabbitMQ
- Validação de estrutura de eventos
- Testes de integração com RabbitMQ real

## 📈 Próximas Etapas

- [ ] Implementar métricas com Prometheus
- [ ] Adicionar tracing distribuído com Jaeger
- [ ] Configurar alertas e monitoramento
- [ ] Implementar cache distribuído
- [ ] Adicionar testes de carga
- [ ] Configurar CI/CD pipeline