import { describe, it, after } from 'node:test'
import assert from 'node:assert/strict'
import { setupTestApp, request, setActivityTime } from './helpers.js'

const ctx = await setupTestApp()
after(() => ctx.cleanup())

async function registerUser(username) {
  const res = await request(ctx, 'POST', '/api/auth/register', {
    body: { username, password: 'password123' }
  })
  assert.equal(res.status, 201)
  return res.body.token
}

describe('报名 AC-2/5/6/7/8', () => {
  it('公开接口仅返回启用档位并带服务端时间', async () => {
    const res = await request(ctx, 'GET', '/api/activity/public')
    assert.equal(res.status, 200)
    assert.equal(res.body.tiers.length, 2)
    assert.ok(res.body.server_time)
    ctx.db.prepare('UPDATE tiers SET enabled = 0 WHERE id = ?').run(res.body.tiers[0].id)
    const again = await request(ctx, 'GET', '/api/activity/public')
    assert.equal(again.body.tiers.length, 1)
  })

  it('进行中可报名，成功返回凭证字段', async () => {
    const token = await registerUser('signer01')
    const pub = await request(ctx, 'GET', '/api/activity/public')
    const res = await request(ctx, 'POST', '/api/signups', {
      token,
      body: {
        tier_id: pub.body.tiers[0].id,
        contact_name: '张三',
        contact_phone: '13800138000'
      }
    })
    assert.equal(res.status, 201)
    const signup = res.body.signup
    assert.equal(signup.contact_phone, '13800138000')
    assert.equal(signup.status, 'pending')
    assert.ok(signup.id && signup.created_at)
  })

  it('活动未开始/已结束报名被服务端拒绝', async () => {
    const pub = await request(ctx, 'GET', '/api/activity/public')
    const tierId = pub.body.tiers[0].id

    setActivityTime(ctx.db, Date.now() + 86400000, Date.now() + 2 * 86400000)
    const earlyToken = await registerUser('early001')
    const early = await request(ctx, 'POST', '/api/signups', {
      token: earlyToken,
      body: { tier_id: tierId, contact_name: '李四', contact_phone: '13800138001' }
    })
    assert.equal(early.status, 400)
    assert.equal(early.body.error.code, 'ACTIVITY_NOT_STARTED')

    setActivityTime(ctx.db, Date.now() - 2 * 86400000, Date.now() - 86400000)
    const lateToken = await registerUser('late0001')
    const late = await request(ctx, 'POST', '/api/signups', {
      token: lateToken,
      body: { tier_id: tierId, contact_name: '王五', contact_phone: '13800138002' }
    })
    assert.equal(late.status, 400)
    assert.equal(late.body.error.code, 'ACTIVITY_ENDED')

    setActivityTime(ctx.db, Date.now() - 86400000, Date.now() + 86400000)
  })

  it('非法手机号与停用档位返回校验错误', async () => {
    const token = await registerUser('invalid1')
    const badPhone = await request(ctx, 'POST', '/api/signups', {
      token,
      body: { tier_id: 1, contact_name: '赵六', contact_phone: '12345' }
    })
    assert.equal(badPhone.status, 400)
    assert.equal(badPhone.body.error.code, 'VALIDATION_FAILED')
    assert.ok(badPhone.body.error.details.contact_phone)

    const badTier = await request(ctx, 'POST', '/api/signups', {
      token,
      body: { tier_id: 9999, contact_name: '赵六', contact_phone: '13800138003' }
    })
    assert.equal(badTier.body.error.code, 'TIER_INVALID')
  })

  it('重复报名返回 409 且库内只有一条记录（绕过前端直调同样拦截）', async () => {
    const token = await registerUser('dupe0001')
    const pub = await request(ctx, 'GET', '/api/activity/public')
    const body = {
      tier_id: pub.body.tiers[0].id,
      contact_name: '钱七',
      contact_phone: '13800138004'
    }
    const first = await request(ctx, 'POST', '/api/signups', { token, body })
    assert.equal(first.status, 201)
    const second = await request(ctx, 'POST', '/api/signups', { token, body })
    assert.equal(second.status, 409)
    assert.equal(second.body.error.code, 'DUPLICATE_SIGNUP')

    const count = ctx.db
      .prepare('SELECT COUNT(*) AS c FROM signups WHERE user_id = (SELECT id FROM users WHERE username = ?)')
      .get('dupe0001')
    assert.equal(count.c, 1)
  })

  it('未登录报名 401；/me 无报名返回 null，报名后返回完整对象', async () => {
    const noAuth = await request(ctx, 'POST', '/api/signups', {
      body: { tier_id: 1, contact_name: '孙八', contact_phone: '13800138005' }
    })
    assert.equal(noAuth.status, 401)

    const token = await registerUser('meuser01')
    const empty = await request(ctx, 'GET', '/api/signups/me', { token })
    assert.equal(empty.status, 200)
    assert.equal(empty.body.signup, null)

    const pub = await request(ctx, 'GET', '/api/activity/public')
    await request(ctx, 'POST', '/api/signups', {
      token,
      body: { tier_id: pub.body.tiers[0].id, contact_name: '孙八', contact_phone: '13800138005' }
    })
    const mine = await request(ctx, 'GET', '/api/signups/me', { token })
    assert.equal(mine.body.signup.status, 'pending')
    assert.ok(mine.body.signup.threshold && mine.body.signup.bonus)
  })
})
