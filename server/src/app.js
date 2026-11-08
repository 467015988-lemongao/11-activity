import express from 'express'
import authRoutes from './routes/auth.js'
import activityRoutes from './routes/activity.js'
import signupRoutes from './routes/signups.js'
import adminRoutes from './routes/admin.js'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'

export function createApp(db) {
  const app = express()
  app.use(express.json())

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() })
  })

  app.use('/api/auth', authRoutes(db))
  app.use('/api/activity', activityRoutes(db))
  app.use('/api/signups', signupRoutes(db))
  app.use('/api/admin', adminRoutes(db))

  app.use(notFoundHandler)
  app.use(errorHandler)
  return app
}
