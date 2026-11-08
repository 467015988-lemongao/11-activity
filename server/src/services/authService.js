import { hashPassword, verifyPassword } from '../utils/password.js'
import { signUserToken, signAdminToken } from '../utils/jwt.js'
import { ErrorCodes } from '../utils/errors.js'

const USERNAME_RE = /^[A-Za-z0-9_]{4,20}$/

export function validateCredentials(username, password) {
  const details = {}
  if (!USERNAME_RE.test(username || '')) {
    details.username = '用户名为 4-20 位字母、数字或下划线'
  }
  if (!password || password.length < 8 || password.length > 32) {
    details.password = '密码长度为 8-32 位'
  }
  if (Object.keys(details).length) throw ErrorCodes.VALIDATION_FAILED('请求参数校验失败', details)
}

export function register(db, { username, password }) {
  validateCredentials(username, password)
  const existed = db.prepare('SELECT id FROM users WHERE username = ?').get(username)
  if (existed) throw ErrorCodes.USERNAME_TAKEN
  const { hash, salt } = hashPassword(password)
  const now = new Date().toISOString()
  const result = db
    .prepare(
      'INSERT INTO users (username, password_hash, password_salt, created_at) VALUES (?, ?, ?, ?)'
    )
    .run(username, hash, salt, now)
  const user = { id: result.lastInsertRowid, username }
  return { token: signUserToken(user), user }
}

export function loginUser(db, { username, password }) {
  validateCredentials(username, password)
  const row = db.prepare('SELECT * FROM users WHERE username = ?').get(username)
  if (!row || !verifyPassword(password, row.password_hash, row.password_salt)) {
    throw ErrorCodes.INVALID_CREDENTIALS
  }
  const user = { id: row.id, username: row.username }
  return { token: signUserToken(user), user }
}

export function getUserById(db, userId) {
  const row = db.prepare('SELECT id, username FROM users WHERE id = ?').get(userId)
  if (!row) throw ErrorCodes.UNAUTHORIZED
  return row
}

export function loginAdmin(db, { username, password }) {
  if (!username || !password) throw ErrorCodes.VALIDATION_FAILED('请输入用户名和密码')
  const row = db.prepare('SELECT * FROM admins WHERE username = ?').get(username)
  if (!row || !verifyPassword(password, row.password_hash, row.password_salt)) {
    throw ErrorCodes.INVALID_CREDENTIALS
  }
  const admin = { id: row.id, username: row.username }
  return { token: signAdminToken(admin), admin }
}
