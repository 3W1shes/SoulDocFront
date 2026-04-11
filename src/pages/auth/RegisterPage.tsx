import React, { useState } from 'react'
import { Form, Input, Button, Alert, Typography, Card } from 'antd'
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons'
import { Link, useNavigate } from 'react-router-dom'
import { authService } from '@/services/authService'
import type { RegisterData } from '@/types'

const { Title, Text } = Typography
const FORUM_LOGIN_URL = 'http://43.106.96.48/forum/login'
const FORUM_REGISTER_URL = 'http://43.106.96.48/forum/register'

const RegisterPage: React.FC = () => {
  const [form] = Form.useForm()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (values: RegisterData & { confirmPassword: string }) => {
    try {
      setError(null)
      setLoading(true)
      
      // 调用注册API
      const response = await authService.register({
        email: values.email,
        password: values.password,
      })
      
      setSuccess(true)
      
      // 3秒后跳转到登录页面
      setTimeout(() => {
        window.location.href = FORUM_LOGIN_URL
      }, 3000)
      
    } catch (error: any) {
      console.error('注册失败:', error)
      setError(error.response?.data?.message || error.response?.data?.error || '注册失败')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md p-8">
          <div className="text-center">
            <div className="text-green-600 text-6xl mb-4">✓</div>
            <Title level={2} className="text-green-600 mb-4">注册成功！</Title>
            <Text className="text-gray-600 mb-4 block">
              我们已经向您的邮箱发送了验证邮件，请点击邮件中的链接来激活您的账户。
            </Text>
            <Text className="text-gray-500 text-sm">
              3秒后自动跳转到论坛登录页面...
            </Text>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <Title level={2} className="text-gray-900 mb-2">创建账户</Title>
          <Text className="text-gray-600">请填写以下信息来创建您的账户</Text>
        </div>

        {error && (
          <Alert
            message={error}
            type="error"
            showIcon
            closable
            onClose={() => setError(null)}
            className="mb-6"
          />
        )}

        <Form
          form={form}
          name="register"
          onFinish={handleSubmit}
          autoComplete="off"
          layout="vertical"
          size="large"
        >
          <Form.Item
            label="邮箱"
            name="email"
            rules={[
              { required: true, message: '请输入邮箱!' },
              { type: 'email', message: '请输入正确的邮箱格式!' },
            ]}
          >
            <Input 
              prefix={<MailOutlined className="text-gray-400" />} 
              placeholder="请输入您的邮箱"
            />
          </Form.Item>

          <Form.Item
            label="密码"
            name="password"
            rules={[
              { required: true, message: '请输入密码!' },
              { min: 6, message: '密码至少6位!' },
            ]}
          >
            <Input.Password 
              prefix={<LockOutlined className="text-gray-400" />} 
              placeholder="请输入密码"
            />
          </Form.Item>

          <Form.Item
            label="确认密码"
            name="confirmPassword"
            dependencies={['password']}
            rules={[
              { required: true, message: '请确认密码!' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve()
                  }
                  return Promise.reject(new Error('两次输入的密码不一致!'))
                },
              }),
            ]}
          >
            <Input.Password 
              prefix={<LockOutlined className="text-gray-400" />} 
              placeholder="请再次输入密码"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="button"
              href={FORUM_REGISTER_URL}
              className="w-full h-12 text-base font-medium"
            >
              前往论坛注册
            </Button>
          </Form.Item>
        </Form>

        <div className="text-center mt-6">
          <Text className="text-gray-600">已有账户？ </Text>
          <a
            href={FORUM_LOGIN_URL}
            className="text-primary-600 hover:text-primary-500 font-medium"
          >
            立即登录
          </a>
        </div>
      </Card>
    </div>
  )
}

export default RegisterPage
