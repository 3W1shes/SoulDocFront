import React, { useEffect, useState } from 'react'
import { Card, Spin, Alert, Button, Typography } from 'antd'
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons'
import { useNavigate, useParams } from 'react-router-dom'
import { authService } from '@/services/authService'
import { useAuthStore } from '@/stores/authStore'
import { FORUM_LOGIN_URL, FORUM_REGISTER_URL } from '@/App'

const { Title, Text } = Typography

const EmailVerificationPage: React.FC = () => {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const { setUser } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setError('验证链接无效')
        setLoading(false)
        return
      }

      try {
        const response = await authService.verifyEmail(token)
        
        // 验证成功后，从响应中获取用户信息和token
        const { user, token: authToken } = response.data || response
        
        // 存储token到localStorage
        localStorage.setItem('auth_token', authToken)
        
        // 更新用户状态
        setUser(user)
        
        setSuccess(true)
        
        // 3秒后跳转到仪表板
        setTimeout(() => {
          navigate('/dashboard')
        }, 3000)
        
      } catch (error: any) {
        console.error('邮箱验证失败:', error)
        setError(error.response?.data?.message || error.response?.data?.error || '验证失败')
      } finally {
        setLoading(false)
      }
    }

    verifyEmail()
  }, [token, navigate, setUser])

  const handleGoToLogin = () => {
    window.location.href = FORUM_LOGIN_URL
  }

  const handleGoToRegister = () => {
    window.location.href = FORUM_REGISTER_URL
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md p-8">
          <div className="text-center">
            <Spin size="large" className="mb-4" />
            <Title level={3} className="text-gray-600 mb-2">验证中...</Title>
            <Text className="text-gray-500">
              正在验证您的邮箱，请稍候...
            </Text>
          </div>
        </Card>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md p-8">
          <div className="text-center">
            <CheckCircleOutlined className="text-green-600 text-6xl mb-4" />
            <Title level={2} className="text-green-600 mb-4">邮箱验证成功！</Title>
            <Text className="text-gray-600 mb-4 block">
              恭喜您！您的邮箱已经验证成功，现在您可以正常使用系统的所有功能了。
            </Text>
            <Text className="text-gray-500 text-sm">
              3秒后自动跳转到仪表板...
            </Text>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md p-8">
        <div className="text-center">
          <CloseCircleOutlined className="text-red-600 text-6xl mb-4" />
          <Title level={2} className="text-red-600 mb-4">验证失败</Title>
          
          {error && (
            <Alert
              message={error}
              type="error"
              showIcon
              className="mb-6"
            />
          )}
          
          <Text className="text-gray-600 mb-6 block">
            验证链接可能已过期或无效。请重新注册或联系管理员。
          </Text>
          
          <div className="space-y-3">
            <Button 
              type="primary" 
              onClick={handleGoToRegister}
              className="w-full"
            >
              重新注册
            </Button>
            
            <Button 
              onClick={handleGoToLogin}
              className="w-full"
            >
              返回登录
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default EmailVerificationPage
