import Redis from 'ioredis';
import { Redis as UpstashRedis } from '@upstash/redis';

const redisUrl = process.env.REDIS_URL || '';
const upstashUrl = process.env.UPSTASH_REDIS_REST_URL || '';
const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN || '';

let redisClient: Redis | null = null;
let upstashClient: UpstashRedis | null = null;

if (upstashUrl && upstashToken) {
  try {
    upstashClient = new UpstashRedis({
      url: upstashUrl,
      token: upstashToken
    });
    console.log('[REDIS] Connected to Upstash Redis REST service.');
  } catch (err) {
    console.warn('[REDIS] Failed to initialize Upstash Redis client:', err);
  }
} else if (redisUrl) {
  try {
    redisClient = new Redis(redisUrl);
    redisClient.on('error', (err) => {
      console.warn('[REDIS] Connection error:', err.message);
    });
  } catch (err) {
    console.warn('[REDIS] Failed to initialize ioredis client:', err);
  }
}

// In-memory fallback dictionary for local development if Redis is unavailable
const memoryCache = new Map<string, { value: string; expiresAt: number }>();
const memoryCounters = new Map<string, number>();

export const RedisService = {
  async get(key: string): Promise<string | null> {
    if (upstashClient) {
      try {
        const val = await upstashClient.get<any>(key);
        if (val === null) return null;
        return typeof val === 'string' ? val : JSON.stringify(val);
      } catch (err) {
        console.warn('[REDIS] Upstash get error:', err);
      }
    }
    if (redisClient) {
      try {
        return await redisClient.get(key);
      } catch {
        // fallback
      }
    }
    const data = memoryCache.get(key);
    if (!data) return null;
    if (data.expiresAt < Date.now()) {
      memoryCache.delete(key);
      return null;
    }
    return data.value;
  },

  async setEx(key: string, seconds: number, value: string): Promise<void> {
    if (upstashClient) {
      try {
        await upstashClient.set(key, value, { ex: seconds });
        return;
      } catch (err) {
        console.warn('[REDIS] Upstash setEx error:', err);
      }
    }
    if (redisClient) {
      try {
        await redisClient.setex(key, seconds, value);
        return;
      } catch {
        // fallback
      }
    }
    memoryCache.set(key, {
      value,
      expiresAt: Date.now() + seconds * 1000
    });
  },

  async del(key: string): Promise<void> {
    if (upstashClient) {
      try {
        await upstashClient.del(key);
        return;
      } catch (err) {
        console.warn('[REDIS] Upstash del error:', err);
      }
    }
    if (redisClient) {
      try {
        await redisClient.del(key);
        return;
      } catch {
        // fallback
      }
    }
    memoryCache.delete(key);
  },

  async incr(key: string): Promise<number> {
    if (upstashClient) {
      try {
        return await upstashClient.incr(key);
      } catch (err) {
        console.warn('[REDIS] Upstash incr error:', err);
      }
    }
    if (redisClient) {
      try {
        return await redisClient.incr(key);
      } catch {
        // fallback
      }
    }
    const current = memoryCounters.get(key) || 0;
    const next = current + 1;
    memoryCounters.set(key, next);
    return next;
  },

  async expire(key: string, seconds: number): Promise<void> {
    if (upstashClient) {
      try {
        await upstashClient.expire(key, seconds);
        return;
      } catch (err) {
        console.warn('[REDIS] Upstash expire error:', err);
      }
    }
    if (redisClient) {
      try {
        await redisClient.expire(key, seconds);
        return;
      } catch {
        // fallback
      }
    }
    setTimeout(() => {
      memoryCounters.delete(key);
    }, seconds * 1000);
  }
};
