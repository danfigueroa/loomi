# Arquitetura do Sistema

## Visão Geral

O sistema Loomi é uma arquitetura de microsserviços desenvolvida seguindo os princípios de Clean Architecture, Domain-Driven Design (DDD) e padrões de resiliência para sistemas distribuídos.

## Arquitetura de Alto Nível

```
┌─────────────────┐    ┌─────────────────┐
│   Load Balancer │    │     Nginx       │
│    (Nginx)      │◄───┤   Proxy/LB      │
└─────────────────┘    └─────────────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐    ┌─────────────────┐
│ Customers       │    │ Transactions    │
│ Service         │◄──►│ Service         │
│ (Port 3001)     │    │ (Port 3002)     │
└─────────────────┘    └─────────────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐    ┌─────────────────┐
│ PostgreSQL      │    │ PostgreSQL      │
│ (Customers DB)  │    │ (Transactions)  │
└─────────────────┘    └─────────────────┘
         │                       │
         └───────┬───────────────┘
                 ▼
         ┌─────────────────┐
         │     Redis       │
         │   (Cache/Session)│
         └─────────────────┘
```

## Microsserviços

### 1. Customers Service

**Responsabilidades:**
- Gerenciamento de usuários (CRUD)
- Autenticação e autorização (JWT)
- Validação de credenciais
- Perfis de usuário

**Estrutura (Clean Architecture):**
```
src/
├── controllers/     # Interface Adapters
├── services/        # Use Cases
├── repositories/    # Interface Adapters
├── entities/        # Enterprise Business Rules
├── middlewares/     # Framework & Drivers
├── config/          # Framework & Drivers
└── utils/           # Framework & Drivers
```

### 2. Transactions Service

**Responsabilidades:**
- Processamento de transações financeiras
- Histórico de transações
- Validação de usuários (via Customers Service)
- Relatórios e consultas

**Comunicação:**
- HTTP Client para validar usuários no Customers Service
- Circuit Breaker para resiliência
- Retry com backoff exponencial

## Padrões de Comunicação

### 1. Comunicação Síncrona (HTTP)

```typescript
// Exemplo: Validação de usuário
const userValidation = await httpClient.get(
  `${customersServiceUrl}/api/users/${userId}`,
  {
    headers: { 'x-correlation-id': correlationId },
    timeout: 5000,
    retries: 3
  }
);
```

### 2. Circuit Breaker Pattern

```typescript
const circuitBreaker = new CircuitBreaker(httpCall, {
  timeout: 5000,
  errorThresholdPercentage: 50,
  resetTimeout: 60000
});
```

### 3. Correlation IDs

Cada request recebe um ID único para rastreamento distribuído:
```
Request → Nginx → Service A → Service B
   │         │         │         │
   └─────────┴─────────┴─────────┘
        Same Correlation ID
```

## Resiliência e Observabilidade

### Padrões de Resiliência

1. **Circuit Breaker**
   - Previne cascata de falhas
   - Fallback automático
   - Recovery automático

2. **Retry com Backoff**
   - Retry exponencial: 1s, 2s, 4s
   - Jitter para evitar thundering herd
   - Max 3 tentativas

3. **Timeout Policies**
   - Request timeout: 5s
   - Connection timeout: 3s
   - Keep-alive timeout: 30s

### Observabilidade

1. **Logging Estruturado**
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "level": "info",
  "service": "transactions-service",
  "correlationId": "req-123-456",
  "message": "Transaction created",
  "metadata": {
    "userId": "user-789",
    "transactionId": "tx-101112",
    "amount": 100.50
  }
}
```

2. **Health Checks**
   - Application health
   - Database connectivity
   - External service dependencies
   - Resource utilization

3. **Metrics**
   - Request rate (RPS)
   - Response time (p50, p95, p99)
   - Error rate
   - Circuit breaker status

## Segurança

### 1. Autenticação e Autorização

```typescript
// JWT Token Structure
{
  "sub": "user-id",
  "iat": 1642248000,
  "exp": 1642334400,
  "roles": ["user"],
  "permissions": ["read:profile", "write:transactions"]
}
```

### 2. Middleware de Segurança

- **Helmet**: Headers de segurança
- **CORS**: Cross-Origin Resource Sharing
- **Rate Limiting**: Proteção contra DDoS
- **Input Validation**: Sanitização de dados

### 3. Comunicação Segura

- HTTPS em produção
- Certificados TLS
- Secrets management
- Environment variables

## Banco de Dados

### Schema Design

#### Customers Database
```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
```

#### Transactions Database
```sql
-- Transactions table
CREATE TABLE transactions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  type VARCHAR(50) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_created_at ON transactions(created_at);
```

### Data Consistency

1. **Eventual Consistency**: Entre microsserviços
2. **ACID Transactions**: Dentro de cada serviço
3. **Idempotency**: Para operações críticas
4. **Saga Pattern**: Para transações distribuídas (futuro)

## Deployment e Infraestrutura

### Docker Compose

```yaml
version: '3.8'
services:
  nginx:
    image: nginx:alpine
    ports: ["8080:80"]
    
  customers-service:
    build: ./customers-service
    environment:
      - DATABASE_URL=postgresql://...
      - REDIS_URL=redis://...
      
  transactions-service:
    build: ./transactions-service
    environment:
      - DATABASE_URL=postgresql://...
      - CUSTOMERS_SERVICE_URL=http://customers-service:3001
```

### Networking

- **Internal Network**: `loomi-network`
- **Service Discovery**: Docker DNS
- **Load Balancing**: Nginx upstream
- **Health Checks**: Docker healthcheck

## Monitoramento e Alertas

### Métricas Chave

1. **Business Metrics**
   - Transações por minuto
   - Taxa de sucesso de transações
   - Tempo médio de processamento

2. **Technical Metrics**
   - CPU/Memory usage
   - Database connections
   - Response times
   - Error rates

3. **Infrastructure Metrics**
   - Container health
   - Network latency
   - Disk usage
   - Load balancer status

### Alertas

```yaml
# Exemplo de alertas
alerts:
  - name: "High Error Rate"
    condition: "error_rate > 5%"
    duration: "5m"
    
  - name: "High Response Time"
    condition: "p95_response_time > 1s"
    duration: "2m"
    
  - name: "Service Down"
    condition: "health_check_failed"
    duration: "30s"
```

## Escalabilidade

### Horizontal Scaling

1. **Stateless Services**: Fácil replicação
2. **Load Balancing**: Distribuição de carga
3. **Database Sharding**: Particionamento de dados
4. **Caching**: Redis para performance

### Performance Optimization

1. **Connection Pooling**: Database connections
2. **Query Optimization**: Indexes e query tuning
3. **Caching Strategy**: Multi-layer caching
4. **Async Processing**: Para operações pesadas

## Testes

### Estratégia de Testes

```
┌─────────────────┐
│   E2E Tests     │  ← Full user journeys
├─────────────────┤
│Integration Tests│  ← Service interactions
├─────────────────┤
│  Unit Tests     │  ← Individual components
└─────────────────┘
```

### Test Coverage

- **Unit Tests**: 80%+ coverage
- **Integration Tests**: Critical paths
- **E2E Tests**: User scenarios
- **Performance Tests**: Load & stress

## Próximos Passos

### Melhorias Planejadas

1. **Event-Driven Architecture**
   - Message queues (RabbitMQ/Kafka)
   - Event sourcing
   - CQRS pattern

2. **Advanced Monitoring**
   - Distributed tracing (Jaeger)
   - Metrics (Prometheus)
   - Dashboards (Grafana)

3. **Security Enhancements**
   - OAuth2/OpenID Connect
   - API Gateway
   - Service mesh (Istio)

4. **DevOps**
   - Kubernetes deployment
   - GitOps workflow
   - Automated rollbacks