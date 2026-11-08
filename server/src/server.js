import 'dotenv/config'
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'
import { createApp } from './app.js'
import { openDb, migrate, seed } from './db.js'

// 启动前校验必需密钥，缺失直接失败（fail fast），不静默生成弱密钥。
for (const name of ['JWT_USER_SECRET', 'JWT_ADMIN_SECRET']) {
  if (!process.env[name]) {
    console.error(`启动失败：缺少必需环境变量 ${name}，请参照 .env.example 配置 .env`)
    process.exit(1)
  }
}

const dbPath = process.env.DB_PATH || './data/activity.db'
mkdirSync(dirname(dbPath), { recursive: true })
const db = openDb(dbPath)
migrate(db)
seed(db)

const app = createApp(db)
const port = Number(process.env.PORT) || 3001
app.listen(port, () => {
  console.log(`双十一活动后端已启动：http://localhost:${port}`)
})
