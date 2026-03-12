import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Spin, Result, Button } from 'antd'
import { useAuthStore } from '@/stores/authStore'

const SsoBridgePage: React.FC = () => {
  const navigate = useNavigate()
  const { setAuth, setUser } = useAuthStore()
  const [error, setError] = useState<string | null>(null)

  const { token, next } = useMemo(() => {
    const params = new URLSearchParams(window.location.search)
    return {
      token: params.get('token') || '',
      next: params.get('next') || '',
    }
  }, [])

  useEffect(() => {
    const target = next && next.trim().length > 0 ? next : '/dashboard'

    const go = (to: string) => {
      if (to.startsWith('http://') || to.startsWith('https://')) {
        window.location.href = to
      } else {
        navigate(to, { replace: true })
      }
    }

    if (!token.trim()) {
      setError('缺少登录令牌')
      return
    }

    localStorage.setItem('auth_token', token)

    fetch('/api/docs/auth/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error('登录验证失败')
        }
        return res.json()
      })
      .then((data) => {
        const user = data?.data || data
        if (!user) {
          throw new Error('未获取到用户信息')
        }
        setAuth(user, token)
        go(target)
      })
      .catch((err) => {
        localStorage.removeItem('auth_token')
        setUser(null)
        setError(err?.message || '登录失败')
      })
  }, [navigate, next, setAuth, setUser, token])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Result
          status="error"
          title="单点登录失败"
          subTitle={error}
          extra={[
            <Button key="login" type="primary" onClick={() => navigate('/login', { replace: true })}>
              返回登录
            </Button>,
          ]}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
          <Spin size="large" />
          <div className="mt-3 text-gray-500">正在完成单点登录...</div>
        </div>
    </div>
  )
}

export default SsoBridgePage
