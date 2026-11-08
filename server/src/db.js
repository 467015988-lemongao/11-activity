import Database from 'better-sqlite3'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { hashPassword } from './utils/password.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

let dbInstance = null

// 打开（或复用）数据库连接，启用外键约束。
export function openDb(dbPath) {
  if (dbInstance) return dbInstance
  const db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  dbInstance = db
  return db
}

// 测试切换临时库时关闭并清空单例。
export function closeDb() {
  if (dbInstance) {
    dbInstance.close()
    dbInstance = null
  }
}

// 执行 migrations 目录下全部 SQL（文件名排序），IF NOT EXISTS 保证幂等。
export function migrate(db) {
  const sql = readFileSync(join(__dirname, 'migrations', '001_init.sql'), 'utf8')
  db.exec(sql)
}

// 幂等 seed：预置管理员、单活动占位配置与两档占位档位。
// TBD-1/TBD-2 确认前仅给可运行占位，上线前由管理端改正式值。
export function seed(db) {
  const now = new Date().toISOString()

  const adminUsername = process.env.ADMIN_USERNAME || 'admin'
  const adminPassword = process.env.ADMIN_INITIAL_PASSWORD
  if (adminPassword) {
    const existed = db.prepare('SELECT id FROM admins WHERE username = ?').get(adminUsername)
    if (!existed) {
      const { hash, salt } = hashPassword(adminPassword)
      db.prepare(
        'INSERT INTO admins (username, password_hash, password_salt, created_at) VALUES (?, ?, ?, ?)'
      ).run(adminUsername, hash, salt, now)
    }
  }

  const activity = db.prepare('SELECT id FROM activities WHERE id = 1').get()
  if (!activity) {
    // 占位时间：相对当前时间前后各 3 天，保证本地启动即处于进行中。
    const start = new Date(Date.now() - 3 * 86400000).toISOString()
    const end = new Date(Date.now() + 3 * 86400000).toISOString()
    db.prepare(
      `INSERT INTO activities (id, name, start_time, end_time, rules_text, updated_at)
       VALUES (1, ?, ?, ?, ?, ?)`
    ).run(
      '双十一狂欢·满减消费券',
      start,
      end,
      [
        '活动期间单笔消费满额立返消费券，多买多送；',
        '报名成功后，凭报名手机号到店消费即可参与活动；',
        '同一用户仅可报名一次，消费券不可折现、不可找零；',
        '本活动与其他优惠活动不可同享，最终解释权归主办方所有。'
      ].join('\n'),
      now
    )
    const insertTier = db.prepare(
      'INSERT INTO tiers (activity_id, threshold, bonus, enabled, sort_order) VALUES (1, ?, ?, 1, ?)'
    )
    insertTier.run(200, 50, 0)
    insertTier.run(300, 100, 1)
  }
}
