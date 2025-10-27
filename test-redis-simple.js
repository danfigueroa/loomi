console.log('=== TESTE REDIS SIMPLES ===');

const { createClient } = require('redis');

async function testRedis() {
  const client = createClient({
    url: 'redis://redis:6379'
  });

  client.on('error', (err) => {
    console.error('❌ Redis Client Error:', err.message);
  });

  client.on('connect', () => {
    console.log('✅ Redis connection established');
  });

  client.on('ready', () => {
    console.log('✅ Redis client ready');
  });

  try {
    console.log('Connecting to Redis...');
    await client.connect();
    
    console.log('Testing ping...');
    const result = await client.ping();
    console.log('✅ Redis ping result:', result);
    
    await client.disconnect();
    console.log('✅ Redis disconnected');
    
  } catch (error) {
    console.error('❌ Redis error:', error.message);
  }
}

testRedis();