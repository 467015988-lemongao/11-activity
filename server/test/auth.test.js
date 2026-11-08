import { describe, it, after } from 'node:test'
import assert from 'node:assert/strict'
import { setupTestApp, request } from './helpers.js'

const ctx = await setupTestApp()
after(() => ctx.cleanup())

describe('C 端认证 AC-3/8/9', () => {
  it('注册成功返回 token 与用户信息', async () => {
    const res = await request(ctx, 'POST', '/api/auth/register', {
      body: { username: 'alice01', password: 'password123' }
    })
    assert.equal(res.status, 201)
    assert.ok(res.body.token)
    assert.equal(res.body.user.username, 'alice01')
  })

  it('重复用户名返回 409 USERNAME_TAKEN', async () => {
    await request(ctx, 'POST', '/api/auth/register', {
      body: { username: 'bob01', password: 'password123' }
    })
    const res = await request(ctx, 'POST', '/api/auth/register', {
      body: { username: 'bob01', password: 'password123' }
    })
    assert.equal(res.status, 409)
    assert.equal(res.body.error.code, 'USERNAME_TAKEN')
  })

  it('用户名/密码不合规返回 400 与字段信息', async () => {
    const res = await request(ctx, 'POST', '/api/auth/register', {
      body: { username: 'ab', password: '123' }
    })
    assert.equal(res.status, 400)
    assert.equal(res.body.error.code, 'VALIDATION_FAILED')
    assert.ok(res.body.error.details.username)
    assert.ok(res.body.error.details.password)
  })

  it('登录成功返回 token，错误密码返回 401', async () => {
    await request(ctx, 'POST', '/api/auth/register', {
      body: { username: 'carol01', password: 'password123' }
    })
    const ok = await request(ctx, 'POST', '/api/auth/login', {
      body: { username: 'carol01', password: 'password123' }
    })
    assert.equal(ok.status, 200)
    assert.ok(ok.body.token)

    const bad = await request(ctx, 'POST', '/api/auth/login', {
      body: { username: 'carol01', password: 'wrongpass1' }
    })
    assert.equal(bad.status, 401)
    assert.equal(bad.body.error.code, 'INVALID_CREDENTIALS')
  })

  it('GET /me 带 token 返回用户，无 token 返回 401', async () => {
    const reg = await request(ctx, 'POST', '/api/auth/register', {
      body: { username: 'dave01', password: 'password123' }
    })
    const ok = await request(ctx, 'GET', '/api/auth/me', { token: reg.body.token })
    assert.equal(ok.status, 200)
    assert.equal(ok.body.user.username, 'dave01')

    const noToken = await request(ctx, 'GET', '/api/auth/me')
    assert.equal(noToken.status, 401)
    assert.equal(noToken.body.error.code, 'UNAUTHORIZED')
  })

  it('管理员 token 不能访问 C 端受保护接口', async () => {
    const login = await request(ctx, 'POST', '/api/admin/login', {
      body: { username: 'admin', password: 'admin123456' }
    })
    const res = await request(ctx, 'GET', '/api/auth/me', { token: login.body.token })
    assert.equal(res.status, 401)
  })
})
