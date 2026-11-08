import { describe, it, after } from 'node:test'
import assert from 'node:assert/strict'
import { setupTestApp, request } from './helpers.js'

const ctx = await setupTestApp()
after(() => ctx.cleanup())

async function adminLogin() {
  const res = await request(ctx, 'POST', '/api/admin/login', {
    body: { username: 'admin', password: 'admin123456' }
  })
  assert.equal(res.status, 200, res.text)
  return res.body.token
}

async function createSignupAs(username, phone, tierId = 1) {
  const reg = await request(ctx, 'POST', '/api/auth/register', {
    body: { username, password: 'password123' }
  })
  const res = await request(ctx, 'POST', '/api/signups', {
    token: reg.body.token,
    body: { tier_id: tierId, contact_name: username, contact_phone: phone }
  })
  assert.equal(res.status, 201, res.text)
  return res.body.signup
}

describe('管理端 AC-9/10/11/12', () => {
  it('管理员登录失败返回 401，无 token 访问业务接口 401', async () => {
    const bad = await request(ctx, 'POST', '/api/admin/login', {
      body: { username: 'admin', password: 'wrong-password' }
    })
    assert.equal(bad.status, 401)
    assert.equal(bad.body.error.code, 'INVALID_CREDENTIALS')

    const noToken = await request(ctx, 'GET', '/api/admin/signups')
    assert.equal(noToken.status, 401)

    const token = await adminLogin()
    const ok = await request(ctx, 'GET', '/api/admin/stats', { token })
    assert.equal(ok.status, 200)
  })

  it('名单分页与筛选正确，详情 404 有明确错误码', async () => {
    const token = await adminLogin()
    await createSignupAs('listuser1', '13900139001')
    await createSignupAs('listuser2', '13900139002', 2)

    const page = await request(ctx, 'GET', '/api/admin/signups?page=1&page_size=1', { token })
    assert.equal(page.status, 200)
    assert.equal(page.body.total >= 2, true)
    assert.equal(page.body.page_size, 1)
    assert.equal(page.body.list.length, 1)

    const byPhone = await request(ctx, 'GET', '/api/admin/signups?phone=13900139002', { token })
    assert.equal(byPhone.body.total, 1)
    assert.equal(byPhone.body.list[0].contact_phone, '13900139002')
    assert.equal(byPhone.body.list[0].tier.id, 2)

    const byTier = await request(ctx, 'GET', '/api/admin/signups?tier_id=2', { token })
    assert.ok(byTier.body.list.every((r) => r.tier.id === 2))

    const detail = await request(
      ctx,
      'GET',
      `/api/admin/signups/${byPhone.body.list[0].id}`,
      { token }
    )
    assert.equal(detail.status, 200)
    assert.equal(detail.body.username, 'listuser2')

    const missing = await request(ctx, 'GET', '/api/admin/signups/999999', { token })
    assert.equal(missing.status, 404)
    assert.equal(missing.body.error.code, 'SIGNUP_NOT_FOUND')
  })

  it('导出 CSV 带 BOM，行数与筛选结果一致且中文无乱码', async () => {
    const token = await adminLogin()
    await createSignupAs('export001', '13700137001')

    const list = await request(ctx, 'GET', '/api/admin/signups?phone=13700137001', { token })
    const exportRes = await request(ctx, 'GET', '/api/admin/signups/export?phone=13700137001', {
      token,
      raw: true
    })
    assert.equal(exportRes.status, 200)
    assert.match(exportRes.headers.get('content-type'), /text\/csv/)
    // 校验原始字节带 UTF-8 BOM（EF BB BF）；fetch.text() 会剥离 BOM，必须看 buffer。
    assert.deepEqual([...exportRes.buffer.slice(0, 3)], [0xef, 0xbb, 0xbf])
    const lines = exportRes.text.replace(/^\uFEFF/, '').split('\r\n').filter(Boolean)
    assert.equal(lines.length, list.body.total + 1)
    assert.ok(lines[0].includes('报名ID'))
    assert.ok(lines[1].includes('export001'))
  })

  it('合法配置保存生效，非法配置整笔回滚且旧值不变', async () => {
    const token = await adminLogin()
    const before = await request(ctx, 'GET', '/api/admin/config', { token })

    const valid = await request(ctx, 'PUT', '/api/admin/config', {
      token,
      body: {
        activity: {
          name: '双十一大促·正式配置',
          start_time: new Date(Date.now() - 3600000).toISOString(),
          end_time: new Date(Date.now() + 3600000).toISOString(),
          rules_text: '规则已更新'
        },
        tiers: [
          { id: before.body.tiers[0].id, threshold: 500, bonus: 80, enabled: 1, sort_order: 0 },
          { id: before.body.tiers[1].id, threshold: 800, bonus: 200, enabled: 0, sort_order: 1 }
        ]
      }
    })
    assert.equal(valid.status, 200, valid.text)
    assert.equal(valid.body.activity.name, '双十一大促·正式配置')
    assert.equal(valid.body.tiers.find((t) => t.id === before.body.tiers[1].id).enabled, false)

    const badTime = await request(ctx, 'PUT', '/api/admin/config', {
      token,
      body: {
        activity: {
          name: '错误时间',
          start_time: new Date(Date.now() + 3600000).toISOString(),
          end_time: new Date(Date.now() - 3600000).toISOString(),
          rules_text: ''
        },
        tiers: valid.body.tiers
      }
    })
    assert.equal(badTime.status, 400)
    assert.equal(badTime.body.error.code, 'INVALID_TIME_RANGE')

    const badTier = await request(ctx, 'PUT', '/api/admin/config', {
      token,
      body: {
        activity: valid.body.activity,
        tiers: [{ threshold: -1, bonus: 10, enabled: 1 }]
      }
    })
    assert.equal(badTier.body.error.code, 'INVALID_TIER')

    const noEnabled = await request(ctx, 'PUT', '/api/admin/config', {
      token,
      body: {
        activity: valid.body.activity,
        tiers: valid.body.tiers.map((t) => ({ ...t, enabled: false }))
      }
    })
    assert.equal(noEnabled.body.error.code, 'NO_ENABLED_TIER')

    const after = await request(ctx, 'GET', '/api/admin/config', { token })
    assert.equal(after.body.activity.name, '双十一大促·正式配置')
    const logs = ctx.db
      .prepare("SELECT COUNT(*) AS c FROM admin_op_logs WHERE action = 'config_update'")
      .get()
    assert.equal(logs.c, 1, '非法配置不得产生操作日志')
  })

  it('核销成功记录时间与操作人，重复核销 409，无记录 404', async () => {
    const token = await adminLogin()
    const signup = await createSignupAs('redeem001', '13600136001')

    const byPhone = await request(ctx, 'POST', '/api/admin/redeem', {
      token,
      body: { phone: '13600136001' }
    })
    assert.equal(byPhone.status, 200)
    assert.equal(byPhone.body.signup.status, 'redeemed')
    assert.ok(byPhone.body.signup.redeemed_at)

    const again = await request(ctx, 'POST', '/api/admin/redeem', {
      token,
      body: { signup_id: signup.id }
    })
    assert.equal(again.status, 409)
    assert.equal(again.body.error.code, 'ALREADY_REDEEMED')

    const missing = await request(ctx, 'POST', '/api/admin/redeem', {
      token,
      body: { phone: '13500135000' }
    })
    assert.equal(missing.status, 404)
    assert.equal(missing.body.error.code, 'SIGNUP_NOT_FOUND')

    const row = ctx.db.prepare('SELECT * FROM signups WHERE id = ?').get(signup.id)
    assert.equal(row.status, 'redeemed')
    assert.ok(row.redeemed_by)
    const log = ctx.db.prepare("SELECT * FROM admin_op_logs WHERE action = 'redeem'").get()
    assert.ok(log)
  })
})
