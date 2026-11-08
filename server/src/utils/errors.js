// 统一业务错误：HTTP 状态码 + 机器码 + 中文提示，可选字段信息。
export class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message)
    this.status = status
    this.code = code
    this.details = details
  }
}

export const ErrorCodes = {
  VALIDATION_FAILED: (message = '请求参数校验失败', details) =>
    new ApiError(400, 'VALIDATION_FAILED', message, details),
  UNAUTHORIZED: new ApiError(401, 'UNAUTHORIZED', '未登录或登录已失效'),
  INVALID_CREDENTIALS: new ApiError(401, 'INVALID_CREDENTIALS', '用户名或密码错误'),
  FORBIDDEN: new ApiError(403, 'FORBIDDEN', '无权访问'),
  USERNAME_TAKEN: new ApiError(409, 'USERNAME_TAKEN', '用户名已被注册'),
  SIGNUP_NOT_FOUND: new ApiError(404, 'SIGNUP_NOT_FOUND', '未找到对应的报名记录'),
  DUPLICATE_SIGNUP: new ApiError(409, 'DUPLICATE_SIGNUP', '您已报名本次活动，请勿重复报名'),
  ACTIVITY_NOT_STARTED: new ApiError(400, 'ACTIVITY_NOT_STARTED', '活动尚未开始'),
  ACTIVITY_ENDED: new ApiError(400, 'ACTIVITY_ENDED', '活动已结束，无法报名'),
  TIER_INVALID: new ApiError(400, 'TIER_INVALID', '所选优惠档位不存在或已停用'),
  INVALID_TIME_RANGE: new ApiError(400, 'INVALID_TIME_RANGE', '结束时间必须晚于开始时间'),
  INVALID_TIER: new ApiError(400, 'INVALID_TIER', '档位门槛与赠送金额必须为正整数'),
  NO_ENABLED_TIER: new ApiError(400, 'NO_ENABLED_TIER', '至少保留一个启用档位'),
  ALREADY_REDEEMED: new ApiError(409, 'ALREADY_REDEEMED', '该报名记录已核销，请勿重复核销'),
  RATE_LIMITED: new ApiError(429, 'RATE_LIMITED', '操作过于频繁，请稍后再试')
}
