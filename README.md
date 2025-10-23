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
- **Docker** + **Docker Compose** para containerização
- **Nginx** como proxy reverso e load balancer
- **Jest** para testes de integração

## 🚀 Funcionalidades Implementadas

### Etapa 4: Comunicação entre Microsserviços

✅ **Comunicação HTTP**
- Cliente HTTP no transactions-service para comunicar com customers-service
- Health checks em ambos os serviços (`/health`)
- Timeout e retry policies configurados
- Validação de usuário no transactions-service via customers-service

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

## 🛠️ Configuração e Execução

### Pré-requisitos

- Node.js 18+
- Docker e Docker Compose
- PostgreSQL (ou usar via Docker)
- Redis (ou usar via Docker)

### Instalação

1. Clone o repositório e instale as dependências:
```bash
npm run setup
```

2. Configure as variáveis de ambiente:
```bash
cp .env.example .env
# Edite o arquivo .env com suas configurações
```

3. Execute as migrações do banco de dados:
```bash
npm run prisma:generate
npm run prisma:migrate
```

### Execução em Desenvolvimento

```bash
# Executar ambos os serviços
npm run dev

# Ou executar individualmente
npm run dev:customers
npm run dev:transactions
```

### Execução com Docker

```bash
# Build e execução completa
npm run docker:build
npm run docker:up

# Visualizar logs
npm run docker:logs

# Parar os serviços
npm run docker:down
```

## 🧪 Testes

### Testes de Integração

```bash
# Executar testes de integração entre serviços
npm run test:integration
```

Os testes cobrem:
- Health checks de ambos os serviços
- Comunicação entre microsserviços
- Validação de usuários via customers-service
- Propagação de correlation IDs
- Comportamento do circuit breaker

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

### Nginx Proxy (Porta 80)

- `GET /health` - Health check do proxy
- `/api/customers/*` - Proxy para customers-service
- `/api/transactions/*` - Proxy para transactions-service

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
- Comunicação entre serviços (transactions-service)

## 🐳 Docker

### Serviços Configurados

- **postgres**: Banco de dados PostgreSQL
- **redis**: Cache e sessões
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
- Validação de entrada com Joi
- Sanitização de dados

## 📈 Próximas Etapas

- [ ] Implementar métricas com Prometheus
- [ ] Adicionar tracing distribuído com Jaeger
- [ ] Configurar alertas e monitoramento
- [ ] Implementar cache distribuído
- [ ] Adicionar testes de carga
- [ ] Configurar CI/CD pipeline