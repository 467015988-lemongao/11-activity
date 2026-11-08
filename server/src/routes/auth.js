import { Router } from 'express'
import { requireUser } from '../middleware/auth.js'
import { createRateLimit } from '../middleware/rateLimit.js'
import * as authService from '../services/authService.js'

export default function authRoutes(db) {
  const router = Router()
  const authLimiter = createRateLimit({
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
    max: Number(process.env.RATE_LIMIT_MAX) || 20
  })

  router.post('/register', authLimiter, (req, res, next) => {
    try {
      const result = authService.register(db, req.body || {})
      res.status(201).json(result)
    } catch (err) {
      next(err)
    }
  })

  router.post('/login', authLimiter, (req, res, next) => {
    try {
      res.json(authService.loginUser(db, req.body || {}))
    } catch (err) {
      next(err)
    }
  })

  router.get('/me', requireUser, (req, res, next) => {
    try {
      res.json({ user: authService.getUserById(db, req.user.id) })
    } catch (err) {
      next(err)
    }
  })

  return router
}
