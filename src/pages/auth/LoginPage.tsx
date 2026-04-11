import React from 'react'
import { Form, Input, Button, Checkbox, Divider, Alert } from 'antd'
import { UserOutlined, LockOutlined, GithubOutlined, GoogleOutlined } from '@ant-design/icons'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import type { LoginCredentials } from '@/types'

const FORUM_LOGIN_URL = 'http://43.106.96.48/forum/login'
const FORUM_REGISTER_URL = 'http://43.106.96.48/forum/register'

const LoginPage: React.FC = () => {
  const [form] = Form.useForm()
  const navigate = useNavigate()
  const { login, loading, error, clearError } = useAuthStore()

  const handleSubmit = async (values: LoginCredentials & { remember: boolean }) => {
    try {
      clearError()
      await login({
        email: values.email,
        password: values.password,
      })
      
      // 登录成功，跳转到仪表板
      navigate('/dashboard', { replace: true })
    } catch (error) {
      // 错误已在store中处理
      console.error('登录失败:', error)
    }
  }

  const handleForumLogin = () => {
    window.location.href = FORUM_LOGIN_URL
  }

  return (
    <div>
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">欢迎回来</h2>
        <p className="text-gray-600 mt-2">请登录您的账户</p>
      </div>

      {error && (
        <Alert
          message={error}
          type="error"
          showIcon
          closable
          onClose={clearError}
          className="mb-6"
        />
      )}

      <Form
        form={form}
        name="login"
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
            prefix={<UserOutlined className="text-gray-400" />} 
            placeholder="邮箱"
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
            placeholder="密码"
          />
        </Form.Item>

        <Form.Item>
          <div className="flex items-center justify-between">
            <Form.Item name="remember" valuePropName="checked" noStyle>
              <Checkbox>记住我</Checkbox>
            </Form.Item>
            <Link 
              to="/forgot-password" 
              className="text-primary-600 hover:text-primary-500"
            >
              忘记密码？
            </Link>
          </div>
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="button"
            href={FORUM_LOGIN_URL}
            className="w-full h-12 text-base font-medium"
          >
            前往论坛登录
          </Button>
        </Form.Item>
      </Form>

      <Divider className="text-gray-400">或者</Divider>

      {/* 第三方登录 */}
      <div className="space-y-3">
        <Button 
          icon={<GithubOutlined />} 
          href={FORUM_LOGIN_URL}
          className="w-full h-12 border-gray-300 text-gray-700 hover:border-gray-400"
        >
          使用 GitHub 登录
        </Button>
        
        <Button 
          icon={<GoogleOutlined />} 
          onClick={handleForumLogin}
          className="w-full h-12 border-gray-300 text-gray-700 hover:border-gray-400"
        >
          使用 Google 登录
        </Button>
      </div>

      {/* 注册链接 */}
      <div className="text-center mt-6">
        <span className="text-gray-600">还没有账户？ </span>
        <a
          href={FORUM_REGISTER_URL}
          className="text-primary-600 hover:text-primary-500 font-medium"
        >
          立即注册
        </a>
      </div>
    </div>
  )
}

export default LoginPage
