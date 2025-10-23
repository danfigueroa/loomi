# Performance Testing Guide

## Overview

Este documento descreve os testes de performance implementados para o sistema de microsserviços usando Artillery.

## Configuração dos Testes

### Load Test (Teste de Carga)
- **Arquivo**: `tests/performance/load-test.yml`
- **Duração**: 4 minutos total
- **Fases**:
  - Warm up: 60s com 10 req/s
  - Load test: 120s com 50 req/s
  - Stress test: 60s com 100 req/s

### Stress Test (Teste de Estresse)
- **Arquivo**: `tests/performance/stress-test.yml`
- **Duração**: 2 minutos total
- **Fases**:
  - High load: 30s com 200 req/s
  - Extreme stress: 60s com 500 req/s
  - Breaking point: 30s com 1000 req/s

## Cenários de Teste

### 1. Health Check Flow (20% do tráfego)
- Verifica disponibilidade dos serviços
- Endpoint: `GET /health`

### 2. Customer Service Flow (40% do tráfego)
- Registro de usuário
- Consulta de perfil autenticado
- Endpoints: `POST /api/customers/register`, `GET /api/customers/profile`

### 3. Transaction Service Flow (40% do tráfego)
- Registro de usuário
- Criação de transação
- Consulta de transações
- Endpoints: `POST /api/customers/register`, `POST /api/transactions`, `GET /api/transactions`

## Como Executar

### Pré-requisitos
1. Certifique-se de que os serviços estão rodando:
   ```bash
   npm run dev
   ```

2. Aguarde todos os serviços estarem disponíveis (health checks passando)

### Executar Testes

#### Teste de Carga Básico
```bash
npm run test:performance
```

#### Teste de Estresse
```bash
npm run test:stress
```

#### Teste com Relatório Detalhado
```bash
npm run test:performance:report
```

## Métricas Monitoradas

### Métricas de Response Time
- **p50**: Mediana do tempo de resposta
- **p95**: 95% das requisições respondem em até X ms
- **p99**: 99% das requisições respondem em até X ms

### Métricas de Throughput
- **RPS**: Requisições por segundo
- **Total Requests**: Total de requisições enviadas
- **Success Rate**: Taxa de sucesso das requisições

### Métricas de Erro
- **Error Rate**: Taxa de erro
- **Status Codes**: Distribuição dos códigos de resposta
- **Timeouts**: Requisições que expiraram

## Benchmarks Esperados

### Condições Ideais (ambiente local)
- **Health Check**: < 50ms (p95)
- **User Registration**: < 200ms (p95)
- **Transaction Creation**: < 300ms (p95)
- **Transaction Query**: < 150ms (p95)

### Limites Aceitáveis
- **Error Rate**: < 1%
- **Timeout Rate**: < 0.1%
- **Success Rate**: > 99%

## Troubleshooting

### Problemas Comuns

#### 1. Conexão Recusada
```
ECONNREFUSED 127.0.0.1:8080
```
**Solução**: Verificar se os serviços estão rodando com `docker-compose ps`

#### 2. Timeouts Excessivos
```
Request timeout
```
**Solução**: 
- Verificar recursos do sistema (CPU, memória)
- Reduzir a taxa de requisições
- Aumentar timeout nos testes

#### 3. Erro de Autenticação
```
401 Unauthorized
```
**Solução**: Verificar se o fluxo de registro está funcionando corretamente

### Monitoramento Durante os Testes

1. **Logs dos Serviços**:
   ```bash
   docker-compose logs -f
   ```

2. **Recursos do Sistema**:
   ```bash
   docker stats
   ```

3. **Métricas de Banco de Dados**:
   - Verificar conexões ativas
   - Monitorar queries lentas

## Otimizações Recomendadas

### 1. Database
- Implementar connection pooling
- Adicionar índices apropriados
- Configurar query timeout

### 2. Application
- Implementar cache Redis
- Otimizar queries N+1
- Configurar rate limiting adequado

### 3. Infrastructure
- Configurar load balancer
- Implementar auto-scaling
- Monitorar métricas de sistema

## Relatórios

Os relatórios são gerados em:
- **Console**: Métricas em tempo real
- **HTML**: `artillery-report.html` (quando usar `test:performance:report`)
- **JSON**: `performance-report.json` (dados brutos)

## Integração com CI/CD

Os testes de performance podem ser integrados ao pipeline:

```yaml
performance-tests:
  runs-on: ubuntu-latest
  steps:
    - name: Run Performance Tests
      run: |
        npm run dev:detached
        sleep 30  # Aguardar serviços iniciarem
        npm run test:performance
        npm run stop
```

## Próximos Passos

1. **Implementar métricas customizadas**
2. **Configurar alertas baseados em performance**
3. **Criar testes de performance para cenários específicos**
4. **Implementar testes de performance contínuos**