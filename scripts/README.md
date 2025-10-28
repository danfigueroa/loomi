# 🛠️ Scripts de Debug e Utilitários

Esta pasta contém scripts auxiliares para debug, testes e utilitários do projeto Loomi.

## 📁 Estrutura

```
scripts/
├── README.md          # Este arquivo
└── debug/             # Scripts de debug e teste
    ├── debug-redis.js      # Debug de conexão Redis
    ├── test-connections.js # Teste de todas as conexões
    ├── test-redis-simple.js # Teste simples do Redis
    └── test-redis.js       # Teste completo do Redis
```

## 🔧 Scripts de Debug

### **debug-redis.js**
Script para debug detalhado da conexão Redis.

```bash
node scripts/debug/debug-redis.js
```

### **test-connections.js**
Testa todas as conexões do sistema (PostgreSQL, Redis, RabbitMQ).

```bash
node scripts/debug/test-connections.js
```

### **test-redis-simple.js**
Teste básico de conectividade com Redis.

```bash
node scripts/debug/test-redis-simple.js
```

### **test-redis.js**
Teste completo das funcionalidades Redis.

```bash
node scripts/debug/test-redis.js
```

## 📋 Como Usar

1. **Certifique-se que os serviços estão rodando:**
   ```bash
   docker-compose up -d
   ```

2. **Execute o script desejado:**
   ```bash
   node scripts/debug/[nome-do-script].js
   ```

3. **Para debug completo, execute todos os testes:**
   ```bash
   node scripts/debug/test-connections.js
   ```

## 🎯 Propósito

Estes scripts foram criados durante o desenvolvimento para:

- ✅ **Debug de conexões** - Identificar problemas de conectividade
- ✅ **Testes isolados** - Testar componentes específicos
- ✅ **Validação rápida** - Verificar se serviços estão funcionando
- ✅ **Troubleshooting** - Diagnosticar problemas em desenvolvimento

## 📝 Notas

- Os scripts assumem que as variáveis de ambiente estão configuradas
- Certifique-se que os serviços Docker estão rodando antes de executar
- Para mais informações sobre troubleshooting, consulte [docs/TROUBLESHOOTING.md](../docs/TROUBLESHOOTING.md)