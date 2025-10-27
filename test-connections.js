const timeoutPromise = (ms) => new Promise((_, reject) => 
  setTimeout(() => reject(new Error('Timeout')), ms)
);

async function testConnections() {
  console.log('=== TESTE DE CONEXÕES COM TIMEOUT ===');
  
  try {
    // Teste Database
    console.log('Testando Database...');
    await Promise.race([
      (async () => {
        const { DatabaseConnection } = require('./dist/config/database');
        const db = DatabaseConnection.getInstance();
        await db.$connect();
        const result = await db.$queryRaw`SELECT 1`;
        console.log('✅ Database: OK', result);
      })(),
      timeoutPromise(5000)
    ]);
    
    // Teste Redis
    console.log('Testando Redis...');
    await Promise.race([
      (async () => {
        const { RedisConnection } = require('./dist/config/redis');
        const redis = RedisConnection.getInstance();
        if (!redis.isReady) {
          await redis.connect();
        }
        const result = await redis.ping();
        console.log('✅ Redis: OK', result);
      })(),
      timeoutPromise(5000)
    ]);
    
    // Teste RabbitMQ
    console.log('Testando RabbitMQ...');
    await Promise.race([
      (async () => {
        const { MessageBrokerConnection } = require('./dist/config/messageBroker');
        const broker = MessageBrokerConnection.getInstance();
        await broker.connect();
        console.log('✅ RabbitMQ: OK');
      })(),
      timeoutPromise(5000)
    ]);
    
    console.log('=== TESTES CONCLUÍDOS ===');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

testConnections().catch(console.error);