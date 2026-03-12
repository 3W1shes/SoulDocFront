import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'

type RequestConfig = AxiosRequestConfig & {
  silent?: boolean
}

// 创建axios实例
const api: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    // 添加认证token
    const token = localStorage.getItem('auth_token') || localStorage.getItem('jwt_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  (response: AxiosResponse) => {
    // 检查业务状态码
    if (response.data && !response.data.success && response.data.message) {
      return Promise.reject(new Error(response.data.message))
    }
    
    return response
  },
  (error) => {
    // 处理HTTP错误
    if (error.response) {
      const { status, data } = error.response
      const silent = Boolean((error.config as RequestConfig | undefined)?.silent)
      
      if (silent) {
        return Promise.reject(error)
      }

      switch (status) {
        case 401: {
          // 未授权，清除token并跳转到登录页
          localStorage.removeItem('auth_token')
          const base = import.meta.env.BASE_URL || '/'
          window.location.href = `${base}login`
          break
        }
        case 403:
        case 404:
        case 422:
        case 429:
        case 500:
        default:
          // 统一将错误交给调用方页面处理，避免在服务层触发 antd 静态 message 警告
          break
      }
    }
    
    return Promise.reject(error)
  }
)

// 通用请求方法
export const request = {
  get: <T = any>(url: string, config?: RequestConfig): Promise<T> =>
    api.get(url, config).then(res => res.data),
    
  post: <T = any>(url: string, data?: any, config?: RequestConfig): Promise<T> =>
    api.post(url, data, config).then(res => res.data),
    
  put: <T = any>(url: string, data?: any, config?: RequestConfig): Promise<T> =>
    api.put(url, data, config).then(res => res.data),
    
  patch: <T = any>(url: string, data?: any, config?: RequestConfig): Promise<T> =>
    api.patch(url, data, config).then(res => res.data),
    
  delete: <T = any>(url: string, config?: RequestConfig): Promise<T> =>
    api.delete(url, config).then(res => res.data),
    
  upload: <T = any>(url: string, formData: FormData, config?: RequestConfig): Promise<T> =>
    api.post(url, formData, {
      ...config,
      headers: {
        'Content-Type': 'multipart/form-data',
        ...config?.headers,
      },
    }).then(res => res.data),
}

export default api
