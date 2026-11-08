import { Router } from 'express'
import { requireAdmin } from '../middleware/auth.js'
import { createRateLimit } from '../middleware/rateLimit.js'
import * as authService from '../services/authService.js'
import { getConfig, updateConfig } from '../services/activityService.js'
import { listSignups, getSignupDetail, exportSignupsCsv } from '../services/adminService.js'
import { redeem } from '../services/signupService.js'
import { getStats } from '../services/statsService.js'

export default function adminRoutes(db) {
  const router = Router()
  const loginLimiter = createRateLimit({
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
    max: Number(process.env.RATE_LIMIT_MAX) || 20
  })

  router.post('/login', loginLimiter, (req, res, next) => {
    try {
      res.json(authService.loginAdmin(db, req.body || {}))
    } catch (err) {
      next(err)
    }
  })

  // 以下全部需要管理员 JWT。
  router.use(requireAdmin)

  router.get('/config', (req, res, next) => {
    try {
      res.json(getConfig(db))
    } catch (err) {
      next(err)
    }
  })

  router.put('/config', (req, res, next) => {
    try {
      res.json(updateConfig(db, req.admin.id, req.body || {}))
    } catch (err) {
      next(err)
    }
  })

  // export 必须在 :id 之前注册，避免被参数路由吞掉。
  router.get('/signups/export', (req, res, next) => {
    try {
      const csv = exportSignupsCsv(db, req.query)
      res.setHeader('Content-Type', 'text/csv; charset=utf-8')
      res.setHeader('Content-Disposition', 'attachment; filename="signups.csv"')
      res.send(csv)
    } catch (err) {
      next(err)
    }
  })

  router.get('/signups', (req, res, next) => {
    try {
      res.json(listSignups(db, req.query))
    } catch (err) {
      next(err)
    }
  })

  router.get('/signups/:id', (req, res, next) => {
    try {
      res.json(getSignupDetail(db, Number(req.params.id)))
    } catch (err) {
      next(err)
    }
  })

  router.post('/redeem', (req, res, next) => {
    try {
      const signup = redeem(db, req.admin.id, req.body || {})
      res.json({ signup })
    } catch (err) {
      next(err)
    }
  })

  router.get('/stats', (req, res, next) => {
    try {
      res.json(getStats(db))
    } catch (err) {
      next(err)
    }
  })

  return router
}
