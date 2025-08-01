const redis = require("redis");
const NotFoundError = require("../../exceptions/NotFoundError");

class CacheService {
  constructor() {
    this._client = redis.createClient({
      socket: {
        host: process.env.REDIS_SERVER,
      },
    });

    this._client.on("error", (error) => {
      console.error(error);
    });

    this._client.connect();
  }

  async set(key, value, expirationInSecond = 1800) {
    await this._client.set(key, value, {
      EX: expirationInSecond,
    });
  }

  async get(key) {
    const result = await this._client.get(key);

    if (result === null) {
      throw new NotFoundError("Data tidak ditemukan di dalam cache");
    }

    return result;
  }

  async delete(key) {
    return this._client.del(key);
  }
}

module.exports = CacheService;
