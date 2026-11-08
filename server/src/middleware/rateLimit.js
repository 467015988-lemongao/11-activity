import { ErrorCodes } from '../utils/errors.js'

// 轻量内存限流：同 IP 在窗口内计数，超出返回 429。单实例足够，不引入 Redis。
export function createRateLimit({ windowMs = 60000, max = 20 } = {}) {
  const hits = new Map()
  return function rateLimit(req, res, next) {
    const key = req.ip || req.socket.remoteAddress || 'unknown'
    const now = Date.now()
    const record = hits.get(key)
    if (!record || now - record.start >= windowMs) {
      hits.set(key, { start: now, count: 1 })
      return next()
    }
    record.count += 1
    if (record.count > max) return next(ErrorCodes.RATE_LIMITED)
    next()
  }
}
