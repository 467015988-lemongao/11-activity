import { ErrorCodes } from '../utils/errors.js'
import { toCsv } from '../utils/csv.js'

const PAGE_SIZE_MAX = 100

function buildFilter(query) {
  const where = []
  const params = {}
  if (query.phone) {
    where.push('s.contact_phone = @phone')
    params.phone = String(query.phone).trim()
  }
  if (query.tier_id) {
    where.push('s.tier_id = @tierId')
    params.tierId = Number(query.tier_id)
  }
  if (query.status === 'pending' || query.status === 'redeemed') {
    where.push('s.status = @status')
    params.status = query.status
  }
  if (query.start) {
    const start = Date.parse(query.start)
    if (!Number.isNaN(start)) {
      where.push("s.created_at >= @start")
      params.start = new Date(start).toISOString()
    }
  }
  if (query.end) {
    const end = Date.parse(query.end)
    if (!Number.isNaN(end)) {
      where.push("s.created_at <= @end")
      params.end = new Date(end).toISOString()
    }
  }
  return { clause: where.length ? `WHERE ${where.join(' AND ')}` : '', params }
}

const LIST_SELECT = `
  SELECT s.id, s.contact_name, s.contact_phone, s.status, s.created_at,
         s.redeemed_at, s.redeemed_by,
         s.tier_id, t.threshold, t.bonus,
         u.username AS user_username,
         a.username AS redeemed_by_name
    FROM signups s
    JOIN tiers t ON t.id = s.tier_id
    JOIN users u ON u.id = s.user_id
    LEFT JOIN admins a ON a.id = s.redeemed_by
`

function shape(row) {
  return {
    id: row.id,
    contact_name: row.contact_name,
    contact_phone: row.contact_phone,
    tier: { id: row.tier_id, threshold: row.threshold, bonus: row.bonus },
    status: row.status,
    created_at: row.created_at,
    redeemed_at: row.redeemed_at,
    redeemed_by: row.redeemed_by,
    redeemed_by_name: row.redeemed_by_name,
    username: row.user_username
  }
}

export function listSignups(db, query) {
  const { clause, params } = buildFilter(query)
  const page = Math.max(1, parseInt(query.page, 10) || 1)
  const pageSize = Math.min(PAGE_SIZE_MAX, Math.max(1, parseInt(query.page_size, 10) || 20))
  const total = db.prepare(`SELECT COUNT(*) AS c FROM signups s ${clause}`).get(params).c
  const rows = db
    .prepare(
      `${LIST_SELECT} ${clause} ORDER BY s.id DESC LIMIT @limit OFFSET @offset`
    )
    .all({ ...params, limit: pageSize, offset: (page - 1) * pageSize })
  return { total, page, page_size: pageSize, list: rows.map(shape) }
}

export function getSignupDetail(db, signupId) {
  const row = db.prepare(`${LIST_SELECT} WHERE s.id = ?`).get(signupId)
  if (!row) throw ErrorCodes.SIGNUP_NOT_FOUND
  return shape(row)
}

// 导出内容严格等于当前筛选条件下的查询结果（不分页）。
export function exportSignupsCsv(db, query) {
  const { clause, params } = buildFilter(query)
  const rows = db
    .prepare(`${LIST_SELECT} ${clause} ORDER BY s.id DESC`)
    .all(params)
    .map(shape)
  const headers = [
    '报名ID', '用户名', '联系人', '手机号', '档位门槛', '档位赠送',
    '状态', '报名时间', '核销时间', '核销操作人'
  ]
  const lines = rows.map((r) => [
    r.id,
    r.username,
    r.contact_name,
    r.contact_phone,
    r.tier.threshold,
    r.tier.bonus,
    r.status === 'redeemed' ? '已核销' : '待核销',
    r.created_at,
    r.redeemed_at || '',
    r.redeemed_by_name || ''
  ])
  return toCsv(headers, lines)
}
