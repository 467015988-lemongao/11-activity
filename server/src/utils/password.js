import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'

// scrypt 加盐哈希：不依赖 bcrypt 原生编译，密码永不落明文。
const KEYLEN = 64

export function hashPassword(password) {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, KEYLEN).toString('hex')
  return { hash, salt }
}

export function verifyPassword(password, hash, salt) {
  const actual = scryptSync(password, salt, KEYLEN)
  const expected = Buffer.from(hash, 'hex')
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}
