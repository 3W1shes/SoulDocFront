import { request } from './api'
import type { 
  User, 
  LoginCredentials, 
  RegisterData, 
  ApiResponse 
} from '@/types'

export const authService = {
  // 登录
  login: (credentials: LoginCredentials): Promise<ApiResponse<{ user: User; token: string }>> =>
    request.post('/auth/login', credentials),

  // 注册
  register: (data: RegisterData): Promise<ApiResponse<{ user: User; token: string }>> =>
    request.post('/auth/register', data),

  // 获取当前用户信息
  getCurrentUser: (): Promise<ApiResponse<User>> =>
    request.get('/docs/auth/me'),

  // 退出登录
  logout: (): Promise<ApiResponse<null>> =>
    request.post('/auth/logout'),

  // 刷新token
  refreshToken: (): Promise<ApiResponse<{ token: string }>> =>
    request.post('/auth/refresh'),

  // 修改密码
  changePassword: (data: {
    current_password: string
    new_password: string
    confirm_password: string
  }): Promise<ApiResponse<null>> =>
    request.post('/auth/change-password', data),

  // 忘记密码
  forgotPassword: (email: string): Promise<ApiResponse<null>> =>
    request.post('/auth/forgot-password', { email }),

  // 重置密码
  resetPassword: (data: {
    token: string
    password: string
    confirm_password: string
  }): Promise<ApiResponse<null>> =>
    request.post('/auth/reset-password', data),

  // 更新用户信息
  updateProfile: (data: Partial<User>): Promise<ApiResponse<User>> =>
    request.put('/auth/profile', data),

  // 上传头像
  uploadAvatar: (file: File): Promise<ApiResponse<{ avatar_url: string }>> => {
    const formData = new FormData()
    formData.append('avatar', file)
    return request.upload('/auth/avatar', formData)
  },

  // 验证邮箱
  verifyEmail: (token: string): Promise<ApiResponse<{ user: User; token: string }>> =>
    request.get(`/auth/verify-email/${token}`),

  // 发送邮箱验证码
  sendEmailVerification: async (): Promise<ApiResponse<null>> => {
    // NOTE: 当前后端未提供发送验证邮件接口，避免触发 404 噪音。
    // 等后端落地后改为真实请求。
    return Promise.reject({
      response: {
        status: 501,
        data: { message: '当前环境未启用发送验证邮件接口' },
      },
    })
  },
}
