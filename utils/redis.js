const redis = require('redis');

const useRedis = process.env.USE_REDIS == '1';

let redisClient = null;

if (useRedis) {
    redisClient = redis.createClient({
        url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`
    });

    redisClient.on('connect', () => {
        console.log('✅ Connected to Redis');
    });

    redisClient.on('error', (err) => {
        console.error('❌ Redis connection error:', err);
    });

    redisClient.on('end', () => {
        console.log('❌ Redis connection closed');
    });

    redisClient.connect().catch(err => {
        console.error('❌ Failed to connect to Redis:', err);
    });
}

module.exports = redisClient;
