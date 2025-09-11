import { redis } from '../index'
import { logger } from '../utils/logger'

export class CacheService {
  private defaultTTL = 300 // 5 minutes

  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await redis.get(key)
      if (!data) return null
      return JSON.parse(data) as T
    } catch (error) {
      logger.error(`Cache get error for key ${key}:`, error)
      return null
    }
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value)
      if (ttl || this.defaultTTL) {
        await redis.setex(key, ttl || this.defaultTTL, serialized)
      } else {
        await redis.set(key, serialized)
      }
    } catch (error) {
      logger.error(`Cache set error for key ${key}:`, error)
    }
  }

  async del(key: string | string[]): Promise<void> {
    try {
      if (Array.isArray(key)) {
        await redis.del(...key)
      } else {
        await redis.del(key)
      }
    } catch (error) {
      logger.error(`Cache delete error for key ${key}:`, error)
    }
  }

  async invalidatePattern(pattern: string): Promise<void> {
    try {
      const keys = await redis.keys(pattern)
      if (keys.length > 0) {
        await redis.del(...keys)
      }
    } catch (error) {
      logger.error(`Cache invalidate pattern error for ${pattern}:`, error)
    }
  }

  // Specific cache methods for different data types
  async cacheUser(userId: string, userData: any, ttl = 600): Promise<void> {
    await this.set(`user:${userId}`, userData, ttl)
  }

  async getCachedUser(userId: string): Promise<any> {
    return this.get(`user:${userId}`)
  }

  async cacheFabricList(filters: string, data: any[], ttl = 300): Promise<void> {
    const key = `fabrics:${filters}`
    await this.set(key, data, ttl)
  }

  async getCachedFabricList(filters: string): Promise<any[]> {
    const key = `fabrics:${filters}`
    const cached = await this.get<any[]>(key)
    return cached || []
  }

  async cacheInventoryStats(stats: any, ttl = 60): Promise<void> {
    await this.set('stats:inventory', stats, ttl)
  }

  async getCachedInventoryStats(): Promise<any> {
    return this.get('stats:inventory')
  }

  // Session management
  async setSession(sessionId: string, userId: string, ttl = 86400): Promise<void> {
    await this.set(`session:${sessionId}`, { userId, lastAccess: Date.now() }, ttl)
  }

  async getSession(sessionId: string): Promise<{ userId: string; lastAccess: number } | null> {
    return this.get(`session:${sessionId}`)
  }

  async extendSession(sessionId: string, ttl = 86400): Promise<void> {
    const session = await this.getSession(sessionId)
    if (session) {
      session.lastAccess = Date.now()
      await this.set(`session:${sessionId}`, session, ttl)
    }
  }

  // Rate limiting
  async checkRateLimit(identifier: string, limit = 100, window = 60): Promise<boolean> {
    try {
      const key = `rate:${identifier}`
      const current = await redis.incr(key)
      
      if (current === 1) {
        await redis.expire(key, window)
      }
      
      return current <= limit
    } catch (error) {
      logger.error(`Rate limit check error for ${identifier}:`, error)
      return true // Allow on error to prevent blocking legitimate requests
    }
  }

  // Real-time metrics
  async incrementMetric(metric: string, value = 1): Promise<void> {
    try {
      const key = `metric:${metric}:${new Date().toISOString().split('T')[0]}`
      await redis.incrby(key, value)
      await redis.expire(key, 86400 * 7) // Keep metrics for 7 days
    } catch (error) {
      logger.error(`Metric increment error for ${metric}:`, error)
    }
  }

  async getMetrics(metric: string, days = 7): Promise<number[]> {
    try {
      const metrics: number[] = []
      const today = new Date()
      
      for (let i = 0; i < days; i++) {
        const date = new Date(today)
        date.setDate(date.getDate() - i)
        const key = `metric:${metric}:${date.toISOString().split('T')[0]}`
        const value = await redis.get(key)
        metrics.push(value ? parseInt(value) : 0)
      }
      
      return metrics.reverse()
    } catch (error) {
      logger.error(`Get metrics error for ${metric}:`, error)
      return []
    }
  }
}

export const cacheService = new CacheService()