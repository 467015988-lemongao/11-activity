import { ErrorCodes } from '../utils/errors.js'

const PHONE_RE = /^1[3-9]\d{9}$/

function validateSignupBody(body) {
  const details = {}
  const name = body?.contact_name
  const phone = body?.contact_phone
  const tierId = Number(body?.tier_id)
  if (typeof name !== 'string' || !name.trim() || name.trim().length > 20) {
    details.contact_name = '请输入不超过 20 字的联系人姓名'
  }
  if (!PHONE_RE.test(phone || '')) {
    details.contact_phone = '请输入正确的 11 位手机号'
  }
  if (!Number.isInteger(tierId) || tierId <= 0) {
    details.tier_id = '请选择优惠档位'
  }
  if (Object.keys(details).length) {
    throw ErrorCodes.VALIDATION_FAILED('请求参数校验失败', details)
  }
  return { name: name.trim(), phone, tierId }
}

// 报名：活动时间 → 档位 → 唯一性，全部通过后在事务内插入；
// 唯一索引兜底并发重复提交，约束错误统一转 DUPLICATE_SIGNUP。
export function createSignup(db, userId, body) {
  const { name, phone, tierId } = validateSignupBody(body)
  const activity = db.prepare('SELECT * FROM activities WHERE id = 1').get()
  const now = Date.now()
  if (now < Date.parse(activity.start_time)) throw ErrorCodes.ACTIVITY_NOT_STARTED
  if (now >= Date.parse(activity.end_time)) throw ErrorCodes.ACTIVITY_ENDED

  const tier = db
    .prepare('SELECT * FROM tiers WHERE id = ? AND activity_id = 1 AND enabled = 1')
    .get(tierId)
  if (!tier) throw ErrorCodes.TIER_INVALID

  const createdAt = new Date().toISOString()
  try {
    const result = db
      .prepare(
        `INSERT INTO signups
           (activity_id, user_id, tier_id, contact_name, contact_phone, status, created_at)
         VALUES (1, ?, ?, ?, ?, 'pending', ?)`
      )
      .run(userId, tierId, name, phone, createdAt)
    return getSignupById(db, result.lastInsertRowid)
  } catch (err) {
    if (err?.code === 'SQLITE_CONSTRAINT_UNIQUE') throw ErrorCodes.DUPLICATE_SIGNUP
    throw err
  }
}

export function getSignupById(db, signupId) {
  return db
    .prepare(
      `SELECT s.*, t.threshold, t.bonus
         FROM signups s JOIN tiers t ON t.id = s.tier_id
        WHERE s.id = ?`
    )
    .get(signupId)
}

// 我的报名：含档位摘要与核销时间；无报名返回 null。
export function getMySignup(db, userId) {
  const row = db
    .prepare(
      `SELECT s.id, s.activity_id, s.tier_id, s.contact_name, s.contact_phone,
              s.status, s.created_at, s.redeemed_at,
              t.threshold, t.bonus
         FROM signups s JOIN tiers t ON t.id = s.tier_id
        WHERE s.user_id = ? AND s.activity_id = 1`
    )
    .get(userId)
  return row || null
}

// 核销：仅 pending 可核销，同事务写核销时间/操作人与操作日志。
export function redeem(db, adminId, body) {
  const byPhone = typeof body?.phone === 'string' && body.phone.trim()
  const byId = Number(body?.signup_id)
  let signup
  if (byPhone) {
    if (!PHONE_RE.test(byPhone.trim())) {
      throw ErrorCodes.VALIDATION_FAILED('请求参数校验失败', { phone: '请输入正确的 11 位手机号' })
    }
    signup = db
      .prepare('SELECT * FROM signups WHERE contact_phone = ? ORDER BY id DESC LIMIT 1')
      .get(byPhone.trim())
  } else if (Number.isInteger(byId) && byId > 0) {
    signup = db.prepare('SELECT * FROM signups WHERE id = ?').get(byId)
  } else {
    throw ErrorCodes.VALIDATION_FAILED('请提供手机号或报名 ID')
  }
  if (!signup) throw ErrorCodes.SIGNUP_NOT_FOUND
  if (signup.status === 'redeemed') throw ErrorCodes.ALREADY_REDEEMED

  const now = new Date().toISOString()
  const txn = db.transaction(() => {
    db.prepare(
      `UPDATE signups SET status = 'redeemed', redeemed_at = ?, redeemed_by = ? WHERE id = ?`
    ).run(now, adminId, signup.id)
    db.prepare(
      'INSERT INTO admin_op_logs (admin_id, action, target, detail, created_at) VALUES (?, ?, ?, ?, ?)'
    ).run(adminId, 'redeem', `signup:${signup.id}`, JSON.stringify({ phone: signup.contact_phone }), now)
  })
  txn()
  return getSignupById(db, signup.id)
}
