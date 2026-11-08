import { Router } from 'express'
import { requireUser } from '../middleware/auth.js'
import { createSignup, getMySignup } from '../services/signupService.js'

export default function signupRoutes(db) {
  const router = Router()

  router.post('/', requireUser, (req, res, next) => {
    try {
      const signup = createSignup(db, req.user.id, req.body || {})
      res.status(201).json({ signup })
    } catch (err) {
      next(err)
    }
  })

  // 注意：/me 必须在可能的 /:id 之前注册；当前 C 端仅有这两个路由。
  router.get('/me', requireUser, (req, res, next) => {
    try {
      res.json({ signup: getMySignup(db, req.user.id) })
    } catch (err) {
      next(err)
    }
  })

  return router
}
