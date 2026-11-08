import 'dotenv/config'
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { openDb, migrate, seed, closeDb } from './db.js'

// 手动迁移/seed 入口：npm run migrate / npm run seed，幂等可重复执行。
const command = process.argv[2]
const dbPath = process.env.DB_PATH || './data/activity.db'
mkdirSync(dirname(dbPath), { recursive: true })
const db = openDb(dbPath)

if (command === 'migrate') {
  migrate(db)
  console.log('迁移完成')
} else if (command === 'seed') {
  seed(db)
  console.log('seed 完成')
} else {
  console.error('用法：node src/cli.js migrate|seed')
  process.exitCode = 1
}
closeDb()
