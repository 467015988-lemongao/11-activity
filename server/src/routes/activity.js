import { Router } from 'express'
import { getPublicActivity } from '../services/activityService.js'

export default function activityRoutes(db) {
  const router = Router()

  // 游客可浏览的公开活动信息（AC-1/2/4）。
  router.get('/public', (req, res, next) => {
    try {
      res.json(getPublicActivity(db))
    } catch (err) {
      next(err)
    }
  })

  return router
}
