console.log('=== DEBUG REDIS CONNECTION ===');

const { createClient } = require('redis');

async function debugRedis() {
  console.log('1. Creating Redis client...');
  
  const client = createClient({
    url: 'redis://redis:6379',
    socket: {
      connectTimeout: 5000,
      lazyConnect: true
    }
  });

  // Event listeners
  client.on('error', (err) => {
    console.error('❌ Redis Client Error:', err);
  });

  client.on('connect', () => {
    console.log('✅ Redis connection event fired');
  });

  client.on('ready', () => {
    console.log('✅ Redis ready event fired');
  });

  client.on('end', () => {
    console.log('⚠️ Redis connection ended');
  });

  client.on('reconnecting', () => {
    console.log('🔄 Redis reconnecting...');
  });

  try {
    console.log('2. Attempting to connect...');
    
    // Set a timeout for the entire operation
    const timeout = setTimeout(() => {
      console.error('❌ Operation timed out after 10 seconds');
      process.exit(1);
    }, 10000);

    await client.connect();
    console.log('3. Connected successfully');
    
    console.log('4. Testing ping...');
    const result = await client.ping();
    console.log('5. Ping result:', result);
    
    console.log('6. Disconnecting...');
    await client.disconnect();
    console.log('7. Disconnected successfully');
    
    clearTimeout(timeout);
    console.log('✅ All tests passed');
    
  } catch (error) {
    console.error('❌ Error during Redis operations:', error.message);
    console.error('Stack:', error.stack);
  }
}

debugRedis();