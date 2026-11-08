import { verifyUserToken, verifyAdminToken } from '../utils/jwt.js'
import { ErrorCodes } from '../utils/errors.js'

function extractToken(req) {
  const header = req.headers.authorization || ''
  if (!header.startsWith('Bearer ')) return null
  return header.slice('Bearer '.length).trim()
}

// C 端用户 JWT 中间件。
export function requireUser(req, res, next) {
  const token = extractToken(req)
  if (!token) return next(ErrorCodes.UNAUTHORIZED)
  try {
    const payload = verifyUserToken(token)
    req.user = { id: payload.sub, username: payload.username }
    next()
  } catch {
    next(ErrorCodes.UNAUTHORIZED)
  }
}

// B 端管理员 JWT 中间件。
export function requireAdmin(req, res, next) {
  const token = extractToken(req)
  if (!token) return next(ErrorCodes.UNAUTHORIZED)
  try {
    const payload = verifyAdminToken(token)
    req.admin = { id: payload.sub, username: payload.username }
    next()
  } catch {
    next(ErrorCodes.UNAUTHORIZED)
  }
}
