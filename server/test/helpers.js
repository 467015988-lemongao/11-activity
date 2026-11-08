import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createServer } from 'node:http'
import { createApp } from '../src/app.js'
import { openDb, closeDb, migrate, seed } from '../src/db.js'

// 每个测试套件使用独立临时库 + 随机端口启动 Express，互不污染。
export async function setupTestApp() {
  const dir = mkdtempSync(join(tmpdir(), 'double11-test-'))
  const dbPath = join(dir, 'test.db')
  process.env.JWT_USER_SECRET = 'test-user-secret'
  process.env.JWT_ADMIN_SECRET = 'test-admin-secret'
  process.env.ADMIN_USERNAME = 'admin'
  process.env.ADMIN_INITIAL_PASSWORD = 'admin123456'
  process.env.RATE_LIMIT_MAX = '1000'

  const db = openDb(dbPath)
  migrate(db)
  seed(db)

  const server = createServer(createApp(db))
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
  const baseUrl = `http://127.0.0.1:${server.address().port}`

  const cleanup = () => {
    server.close()
    closeDb()
    rmSync(dir, { recursive: true, force: true })
  }

  return { baseUrl, db, dbPath, cleanup }
}

// 直接调整活动时间，构造未开始/进行中/已结束三态。
export function setActivityTime(db, start, end) {
  db.prepare('UPDATE activities SET start_time = ?, end_time = ? WHERE id = 1').run(
    new Date(start).toISOString(),
    new Date(end).toISOString()
  )
}

// 基于全局 fetch 的请求小工具，返回 { status, body, headers, text }。
// raw=true 时额外返回 buffer（fetch.text() 会按规范剥离 UTF-8 BOM，校验 BOM 必须看字节）。
export async function request(ctx, method, path, { token, body, headers = {}, raw = false } = {}) {
  const res = await fetch(`${ctx.baseUrl}${path}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...headers
    },
    body: body ? JSON.stringify(body) : undefined
  })
  const buffer = Buffer.from(await res.arrayBuffer())
  const text = buffer.toString('utf8')
  let parsed
  try {
    parsed = text ? JSON.parse(text) : null
  } catch {
    parsed = text
  }
  return { status: res.status, body: parsed, headers: res.headers, text, ...(raw ? { buffer } : {}) }
}
