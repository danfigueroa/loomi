# Guia de Troubleshooting

## Problemas Comuns e Soluções

### 🐳 Docker e Containers

#### Problema: Containers não iniciam
```bash
Error: Cannot start service customers-service: driver failed programming external connectivity
```

**Soluções:**
1. Verificar se as portas estão em uso:
```bash
lsof -i :3001
lsof -i :3002
lsof -i :8080
```

2. Parar processos que usam as portas:
```bash
kill -9 <PID>
```

3. Limpar containers e redes:
```bash
npm run clean
docker system prune -f
```

#### Problema: Build falha por falta de memória
```bash
Error: JavaScript heap out of memory
```

**Soluções:**
1. Aumentar memória do Docker:
   - Docker Desktop → Settings → Resources → Memory (mín. 4GB)

2. Limpar cache do Docker:
```bash
docker builder prune -f
```

#### Problema: Volumes não são montados corretamente
```bash
Error: ENOENT: no such file or directory
```

**Soluções:**
1. Verificar paths no docker-compose.yml
2. Recriar volumes:
```bash
docker-compose down -v
docker-compose up --build
```

### 🗄️ Banco de Dados

#### Problema: Conexão com PostgreSQL falha
```bash
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Soluções:**
1. Verificar se o PostgreSQL está rodando:
```bash
docker-compose ps postgres
```

2. Verificar logs do PostgreSQL:
```bash
docker-compose logs postgres
```

3. Resetar banco de dados:
```bash
docker-compose down -v
docker-compose up postgres -d
```

#### Problema: Migrações Prisma falham
```bash
Error: P1001: Can't reach database server
```

**Soluções:**
1. Aguardar PostgreSQL estar pronto:
```bash
# Aguardar 30 segundos após iniciar o banco
sleep 30
npm run db:migrate
```

2. Verificar DATABASE_URL no .env:
```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/loomi_customers"
```

3. Regenerar cliente Prisma:
```bash
cd customers-service
npm run db:generate
npm run db:push
```

### 🔗 Comunicação entre Serviços

#### Problema: Transactions Service não consegue validar usuários
```bash
Error: ECONNREFUSED customers-service:3001
```

**Soluções:**
1. Verificar se ambos os serviços estão na mesma rede:
```bash
docker network ls
docker network inspect loomi_loomi-network
```

2. Verificar URL do serviço no .env:
```bash
CUSTOMERS_SERVICE_URL=http://customers-service:3001
```

3. Testar conectividade entre containers:
```bash
docker exec -it loomi_transactions-service_1 ping customers-service
```

#### Problema: Circuit Breaker sempre aberto
```bash
CircuitBreaker is OPEN
```

**Soluções:**
1. Verificar logs do serviço de destino
2. Reduzir threshold temporariamente:
```typescript
const circuitBreaker = new CircuitBreaker(httpCall, {
  errorThresholdPercentage: 80, // Aumentar de 50 para 80
  resetTimeout: 30000 // Reduzir de 60s para 30s
});
```

3. Verificar health check:
```bash
curl http://localhost:3001/health
```

### 🔐 Autenticação e JWT

#### Problema: Token JWT inválido
```bash
Error: JsonWebTokenError: invalid token
```

**Soluções:**
1. Verificar JWT_SECRET no .env:
```bash
JWT_SECRET=your-super-secret-key-here
```

2. Verificar formato do token:
```bash
# Token deve ter formato: Bearer <token>
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

3. Verificar expiração do token:
```javascript
// Decodificar token para verificar exp
const decoded = jwt.decode(token);
console.log('Token expires at:', new Date(decoded.exp * 1000));
```

#### Problema: CORS bloqueando requests
```bash
Access to fetch at 'http://localhost:3001' from origin 'http://localhost:3000' has been blocked by CORS policy
```

**Soluções:**
1. Verificar configuração CORS:
```typescript
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:8080'],
  credentials: true
}));
```

2. Usar proxy Nginx:
```bash
# Acessar via http://localhost:8080/api/customers
curl http://localhost:8080/api/customers/health
```

### 🧪 Testes

#### Problema: Testes falham por timeout
```bash
Timeout - Async callback was not invoked within the 5000ms timeout
```

**Soluções:**
1. Aumentar timeout nos testes:
```javascript
describe('Integration Tests', () => {
  jest.setTimeout(30000); // 30 segundos
});
```

2. Aguardar serviços estarem prontos:
```javascript
beforeAll(async () => {
  await waitForServices();
}, 60000);
```

#### Problema: Testes E2E falham
```bash
Error: connect ECONNREFUSED 127.0.0.1:8080
```

**Soluções:**
1. Verificar se Docker Compose de teste está rodando:
```bash
cd tests
docker-compose -f docker-compose.test.yml up -d
```

2. Aguardar todos os serviços:
```bash
./wait-for-services.sh
```

#### Problema: Cobertura de testes baixa
```bash
Coverage threshold not met: 65% < 80%
```

**Soluções:**
1. Identificar arquivos sem cobertura:
```bash
npm run test:coverage:report
open coverage/index.html
```

2. Adicionar testes para arquivos descobertos
3. Excluir arquivos de configuração do coverage:
```json
// .nycrc.json
{
  "exclude": [
    "src/config/**",
    "src/types/**"
  ]
}
```

### 🚀 Performance

#### Problema: Alta latência nas APIs
```bash
Response time > 2000ms
```

**Soluções:**
1. Verificar logs de queries lentas:
```bash
docker-compose logs postgres | grep "slow query"
```

2. Adicionar índices no banco:
```sql
CREATE INDEX idx_transactions_user_created ON transactions(user_id, created_at);
```

3. Implementar cache:
```typescript
const cachedResult = await redis.get(`user:${userId}`);
if (cachedResult) return JSON.parse(cachedResult);
```

#### Problema: Memory leak
```bash
JavaScript heap out of memory
```

**Soluções:**
1. Monitorar uso de memória:
```bash
docker stats
```

2. Verificar conexões de banco não fechadas:
```typescript
// Sempre fechar conexões
try {
  const result = await prisma.user.findMany();
  return result;
} finally {
  await prisma.$disconnect();
}
```

3. Implementar graceful shutdown:
```typescript
process.on('SIGTERM', async () => {
  await server.close();
  await prisma.$disconnect();
  process.exit(0);
});
```

### 📊 Monitoramento

#### Problema: Health checks falhando
```bash
Health check failed: Database connection error
```

**Soluções:**
1. Verificar componentes individualmente:
```bash
curl http://localhost:3001/health
curl http://localhost:3002/health
```

2. Verificar logs detalhados:
```bash
docker-compose logs customers-service | grep health
```

3. Testar conexões manualmente:
```bash
# Testar banco
docker exec -it loomi_postgres_1 psql -U postgres -d loomi_customers -c "SELECT 1;"

# Testar Redis
docker exec -it loomi_redis_1 redis-cli ping
```

### 🔧 Desenvolvimento

#### Problema: Hot reload não funciona
```bash
Changes not being detected
```

**Soluções:**
1. Verificar volumes no docker-compose.yml:
```yaml
volumes:
  - ./customers-service:/app
  - /app/node_modules
```

2. Usar tsx watch:
```bash
npm run dev
# ou
tsx watch src/index.ts
```

#### Problema: Dependências não instaladas
```bash
Error: Cannot find module 'express'
```

**Soluções:**
1. Reinstalar dependências:
```bash
npm run setup
```

2. Limpar node_modules:
```bash
rm -rf node_modules package-lock.json
npm install
```

3. Verificar versões do Node:
```bash
node --version  # Deve ser >= 18
npm --version   # Deve ser >= 8
```

## Comandos Úteis para Debug

### Logs e Monitoramento
```bash
# Ver logs de todos os serviços
docker-compose logs -f

# Ver logs de um serviço específico
docker-compose logs -f customers-service

# Ver logs com timestamp
docker-compose logs -f -t

# Ver últimas 100 linhas
docker-compose logs --tail=100
```

### Inspeção de Containers
```bash
# Listar containers
docker-compose ps

# Entrar em um container
docker exec -it loomi_customers-service_1 sh

# Verificar recursos
docker stats

# Inspecionar rede
docker network inspect loomi_loomi-network
```

### Banco de Dados
```bash
# Conectar ao PostgreSQL
docker exec -it loomi_postgres_1 psql -U postgres -d loomi_customers

# Backup do banco
docker exec loomi_postgres_1 pg_dump -U postgres loomi_customers > backup.sql

# Restaurar backup
docker exec -i loomi_postgres_1 psql -U postgres -d loomi_customers < backup.sql
```

### Redis
```bash
# Conectar ao Redis
docker exec -it loomi_redis_1 redis-cli

# Ver todas as chaves
docker exec loomi_redis_1 redis-cli KEYS "*"

# Limpar cache
docker exec loomi_redis_1 redis-cli FLUSHALL
```

## Checklist de Troubleshooting

### Antes de Reportar um Bug

- [ ] Verificar logs de todos os serviços
- [ ] Testar com dados limpos (reset do banco)
- [ ] Verificar se todas as dependências estão instaladas
- [ ] Confirmar que as portas não estão em uso
- [ ] Testar endpoints individualmente
- [ ] Verificar variáveis de ambiente
- [ ] Confirmar versões do Node.js e npm
- [ ] Testar em ambiente limpo (containers novos)

### Informações para Incluir no Report

1. **Ambiente:**
   - OS (macOS, Linux, Windows)
   - Node.js version
   - Docker version
   - npm/yarn version

2. **Logs:**
   - Logs completos do erro
   - Logs dos serviços relacionados
   - Stack trace completo

3. **Reprodução:**
   - Passos para reproduzir
   - Dados de entrada
   - Comportamento esperado vs atual

4. **Configuração:**
   - Arquivo .env (sem secrets)
   - docker-compose.yml relevante
   - package.json relevante