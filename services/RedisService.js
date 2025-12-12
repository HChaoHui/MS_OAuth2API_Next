const redisClient = require('../utils/redis');

const setRedisKey = async (key, value, expireTime = 60) => {

    if (!redisClient) {
        return null;
    }

    try {
        await redisClient.setEx(key, expireTime, value);
        console.log(key + ' is set to redis')
        return key;
    } catch (error) {
        throw error;
    }
}

const getRedisKey = async (key) => {
    if (!redisClient) {
        return null;
    }
    try {
        const value = await redisClient.get(key);
        if (value) {
            console.log(key + ' is cached')
            return value;
        } else {
            console.log(key + ' is not cached')
            return null;
        }
    } catch (error) {
        return null;
    }
}

module.exports = {
    setRedisKey,
    getRedisKey
}