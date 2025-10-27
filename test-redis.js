console.log('=== TESTE REDIS CONNECTION ===');
const { RedisConnection } = require('./dist/config/redis');
const redis = RedisConnection.getInstance();

const timeoutPromise = (ms) => new Promise((_, reject) => 
  setTimeout(() => reject(new Error('Timeout')), ms)
);

Promise.race([
  (async () => {
    if (!redis.isReady) {
      console.log('Connecting to Redis...');
      await redis.connect();
    }
    console.log('✅ Redis connected');
    const result = await redis.ping();
    console.log('✅ Redis ping OK:', result);
  })(),
  timeoutPromise(10000)
]).catch(error => {
  console.error('❌ Redis error:', error.message);
}).finally(() => {
  process.exit(0);
});