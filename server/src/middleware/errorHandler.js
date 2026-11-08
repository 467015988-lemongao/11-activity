import { ApiError } from '../utils/errors.js'

// 统一错误响应：HTTP 4xx/5xx + {"error":{"code","message"}}，可选 details。
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (err instanceof ApiError) {
    const body = { error: { code: err.code, message: err.message } }
    if (err.details) body.error.details = err.details
    return res.status(err.status).json(body)
  }
  req.log?.error?.(err)
  return res.status(500).json({
    error: { code: 'INTERNAL_ERROR', message: '服务器开小差了，请稍后重试' }
  })
}

// 兜底 404，保持统一错误体。
export function notFoundHandler(req, res) {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: '请求的资源不存在' } })
}
