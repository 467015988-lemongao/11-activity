// 统一请求封装：拼 /api 前缀、注入 JWT、解析标准错误体、401 清登录态。
const NETWORK_ERROR = '网络异常，请检查网络后重试'

export default async function request(path, options = {}) {
  const token = localStorage.getItem('double11_token')
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
    throw new Error(NETWORK_ERROR)
  }

  let data = null
  const text = await res.text()
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = null
    }
  }

  if (!res.ok) {
    if (res.status === 401 && !path.startsWith('/admin/')) {
      // 登录态失效：清理并跳登录（登录/注册接口自身的 401 由调用方处理）。
      localStorage.removeItem('double11_token')
      localStorage.removeItem('double11_user')
      if (!location.pathname.startsWith('/login')) {
        const redirect = encodeURIComponent(location.pathname + location.search)
        location.href = `/login?redirect=${redirect}`
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
