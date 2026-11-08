import jwt from 'jsonwebtoken'

// 用户与管理员使用不同签名密钥与 claim 类型，两套 token 互不通用。
export function signUserToken(user) {
  return jwt.sign(
    { sub: user.id, username: user.username, type: 'user' },
    requiredSecret('JWT_USER_SECRET'),
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  )
}

export function signAdminToken(admin) {
  return jwt.sign(
    { sub: admin.id, username: admin.username, type: 'admin' },
    requiredSecret('JWT_ADMIN_SECRET'),
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  )
}

export function verifyUserToken(token) {
  const payload = jwt.verify(token, requiredSecret('JWT_USER_SECRET'))
  if (payload.type !== 'user') throw new Error('invalid token type')
  return payload
}

export function verifyAdminToken(token) {
  const payload = jwt.verify(token, requiredSecret('JWT_ADMIN_SECRET'))
  if (payload.type !== 'admin') throw new Error('invalid token type')
  return payload
}

function requiredSecret(name) {
  const secret = process.env[name]
  if (!secret) throw new Error(`缺少必需环境变量 ${name}`)
  return secret
}
