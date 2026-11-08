import { ErrorCodes } from '../utils/errors.js'

// C 端公开信息：仅启用档位，附带服务端时间供客户端校准倒计时。
export function getPublicActivity(db) {
  const activity = db
    .prepare('SELECT id, name, start_time, end_time, rules_text FROM activities WHERE id = 1')
    .get()
  const tiers = db
    .prepare(
      `SELECT id, threshold, bonus, sort_order
       FROM tiers WHERE activity_id = 1 AND enabled = 1 ORDER BY sort_order, id`
    )
    .all()
  return { activity, tiers, server_time: new Date().toISOString() }
}

// B 端配置：含停用档位。
export function getConfig(db) {
  const activity = db.prepare('SELECT * FROM activities WHERE id = 1').get()
  const tiers = db
    .prepare('SELECT id, threshold, bonus, enabled, sort_order FROM tiers ORDER BY sort_order, id')
    .all()
    .map((t) => ({ ...t, enabled: t.enabled === 1 }))
  return { activity, tiers }
}

// 配置事务化整体保存：全部校验通过后单事务写库，任一失败整笔回滚。
export function updateConfig(db, adminId, body) {
  const activity = body?.activity
  const tiers = body?.tiers
  const details = {}
  if (!activity || typeof activity.name !== 'string' || !activity.name.trim()) {
    details.name = '活动名称不能为空'
  }
  if (!activity?.start_time || Number.isNaN(Date.parse(activity.start_time))) {
    details.start_time = '活动开始时间格式不正确'
  }
  if (!activity?.end_time || Number.isNaN(Date.parse(activity.end_time))) {
    details.end_time = '活动结束时间格式不正确'
  }
  if (Object.keys(details).length) throw ErrorCodes.VALIDATION_FAILED('请求参数校验失败', details)

  if (new Date(activity.end_time) <= new Date(activity.start_time)) {
    throw ErrorCodes.INVALID_TIME_RANGE
  }
  if (!Array.isArray(tiers) || tiers.length === 0) throw ErrorCodes.NO_ENABLED_TIER

  const normalized = tiers.map((t, index) => {
    const threshold = Number(t.threshold)
    const bonus = Number(t.bonus)
    if (!Number.isInteger(threshold) || !Number.isInteger(bonus) || threshold <= 0 || bonus <= 0) {
      throw ErrorCodes.INVALID_TIER
    }
    const enabled = t.enabled === true || t.enabled === 1 ? 1 : 0
    return {
      id: t.id == null ? null : Number(t.id),
      threshold,
      bonus,
      enabled,
      sort_order: Number.isInteger(Number(t.sort_order)) ? Number(t.sort_order) : index
    }
  })
  if (!normalized.some((t) => t.enabled === 1)) throw ErrorCodes.NO_ENABLED_TIER

  const now = new Date().toISOString()
  const updateActivity = db.prepare(
    `UPDATE activities
       SET name = ?, start_time = ?, end_time = ?, rules_text = ?, updated_by = ?, updated_at = ?
     WHERE id = 1`
  )
  const upsertTier = db.prepare(
    `INSERT INTO tiers (id, activity_id, threshold, bonus, enabled, sort_order)
       VALUES (?, 1, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       threshold = excluded.threshold,
       bonus = excluded.bonus,
       enabled = excluded.enabled,
       sort_order = excluded.sort_order`
  )
  const deleteTier = db.prepare('DELETE FROM tiers WHERE id = ?')
  const logOp = db.prepare(
    'INSERT INTO admin_op_logs (admin_id, action, target, detail, created_at) VALUES (?, ?, ?, ?, ?)'
  )

  const txn = db.transaction(() => {
    updateActivity.run(
      activity.name.trim(),
      new Date(activity.start_time).toISOString(),
      new Date(activity.end_time).toISOString(),
      typeof activity.rules_text === 'string' ? activity.rules_text : '',
      adminId,
      now
    )
    const keepIds = new Set()
    for (const t of normalized) {
      if (t.id) keepIds.add(t.id)
      upsertTier.run(t.id, t.threshold, t.bonus, t.enabled, t.sort_order)
    }
    const existing = db.prepare('SELECT id FROM tiers').all().map((r) => r.id)
    for (const id of existing) {
      if (!keepIds.has(id)) deleteTier.run(id)
    }
    logOp.run(adminId, 'config_update', 'activity:1', JSON.stringify({ at: now }), now)
  })
  txn()

  return getConfig(db)
}
