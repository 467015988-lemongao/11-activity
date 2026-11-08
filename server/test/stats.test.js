import { describe, it, after } from 'node:test'
import assert from 'node:assert/strict'
import { setupTestApp, request } from './helpers.js'

const ctx = await setupTestApp()
after(() => ctx.cleanup())

async function adminToken() {
  const res = await request(ctx, 'POST', '/api/admin/login', {
    body: { username: 'admin', password: 'admin123456' }
  })
  return res.body.token
}

async function signup(username, phone, tierId) {
  const reg = await request(ctx, 'POST', '/api/auth/register', {
    body: { username, password: 'password123' }
  })
  return request(ctx, 'POST', '/api/signups', {
    token: reg.body.token,
    body: { tier_id: tierId, contact_name: username, contact_phone: phone }
  })
}

describe('统计看板 AC-13/14', () => {
  it('总量、分档占比、核销率与名单同口径实时一致', async () => {
    const token = await adminToken()
    const pub = await request(ctx, 'GET', '/api/activity/public')
    const tier1 = pub.body.tiers[0].id
    const tier2 = pub.body.tiers[1].id

    await signup('stat0001', '13100131001', tier1)
    await signup('stat0002', '13100131002', tier1)
    await signup('stat0003', '13100131003', tier1)
    await signup('stat0004', '13100131004', tier2)

    await request(ctx, 'POST', '/api/admin/redeem', {
      token,
      body: { phone: '13100131001' }
    })
    await request(ctx, 'POST', '/api/admin/redeem', {
      token,
      body: { phone: '13100131004' }
    })

    const stats = await request(ctx, 'GET', '/api/admin/stats', { token })
    assert.equal(stats.status, 200)
    assert.equal(stats.body.total_signups, 4)
    assert.equal(stats.body.total_redeemed, 2)
    assert.equal(stats.body.redemption_rate, 0.5)

    const t1 = stats.body.by_tier.find((t) => t.tier_id === tier1)
    const t2 = stats.body.by_tier.find((t) => t.tier_id === tier2)
    assert.equal(t1.count, 3)
    assert.equal(t1.ratio, 0.75)
    assert.equal(t2.count, 1)
    assert.equal(t2.ratio, 0.25)

    // 与名单接口交叉核对（AC-14 单一数据源同口径）。
    const list = await request(ctx, 'GET', '/api/admin/signups?page_size=100', { token })
    assert.equal(list.body.total, stats.body.total_signups)
    const redeemedInList = list.body.list.filter((r) => r.status === 'redeemed').length
    assert.equal(redeemedInList, stats.body.total_redeemed)
  })
})
