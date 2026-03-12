import React, { useEffect, useState } from 'react'
import { Spin, Result, Button } from 'antd'
import { LoadingOutlined } from '@ant-design/icons'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'

const OAuthCallbackPage: React.FC = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [errorMessage, setErrorMessage] = useState<string>('')

  useEffect(() => {
    const processCallback = async () => {
      try {
        // 从 URL 参数中获取 token
        const token = searchParams.get('token')
        
        if (!token) {
          throw new Error('未找到认证令牌')
        }

        // 使用 token 获取用户信息
        const response = await fetch('/api/docs/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          throw new Error('获取用户信息失败')
        }

        const userData = await response.json()
        
        // 设置认证状态
        setAuth(userData, token)
        
        setStatus('success')
        
        // 延迟跳转到仪表板
        setTimeout(() => {
          navigate('/dashboard', { replace: true })
        }, 1500)
        
      } catch (error: any) {
        console.error('OAuth callback error:', error)
        setErrorMessage(error.message || 'OAuth 登录失败')
        setStatus('error')
      }
    }

    processCallback()
  }, [searchParams, navigate, setAuth])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Spin 
            indicator={<LoadingOutlined style={{ fontSize: 48 }} spin />}
            size="large"
          />
          <div className="mt-4 text-lg text-gray-600">
            正在完成登录...
          </div>
        </div>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Result
          status="success"
          title="登录成功！"
          subTitle="正在跳转到仪表板..."
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Result
        status="error"
        title="登录失败"
        subTitle={errorMessage}
        extra={[
          <Button type="primary" key="retry" onClick={() => navigate('/login')}>
            返回登录
          </Button>
        ]}
      />
    </div>
  )
}

export default OAuthCallbackPage
