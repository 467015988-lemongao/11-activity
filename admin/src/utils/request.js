import { ElMessage } from 'element-plus'

// 管理端统一请求封装：注入管理员 JWT、解析标准错误体、401 清登录态。
export default async function request(path, options = {}) {
  const token = localStorage.getItem('double11_admin_token')
  let res
  try {
    res = await fetch(`/api${path}`, {
      method: options.method || 'GET',
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {})
      },
      body: options.body ? JSON.stringify(options.body) : undefined
    })
  } catch {
    throw new Error('网络异常，请检查网络后重试')
  }

  const text = await res.text()
  let data = null
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = text
    }
  }

  if (!res.ok) {
    if (res.status === 401 && !path.endsWith('/admin/login')) {
      localStorage.removeItem('double11_admin_token')
      localStorage.removeItem('double11_admin')
      ElMessage.warning('登录已失效，请重新登录')
      if (!location.pathname.startsWith('/login')) {
        location.href = '/login'
      }
    }
    const message = data?.error?.message || '请求失败，请稍后重试'
    const err = new Error(message)
    err.code = data?.error?.code
    err.details = data?.error?.details
    throw err
  }
  return data
}
