import React, { useState, useEffect } from 'react'
import { 
  Card, 
  Form, 
  Input, 
  Button, 
  Typography, 
  Avatar, 
  Row, 
  Col, 
  Tabs, 
  App,
  Upload, 
  Space,
  Tag,
  Divider,
  Spin
} from 'antd'
import { 
  UserOutlined, 
  MailOutlined, 
  SafetyOutlined, 
  SettingOutlined,
  CameraOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExclamationCircleOutlined,
  LockOutlined,
  CalendarOutlined
} from '@ant-design/icons'
import { useAuthStore } from '@/stores/authStore'
import { authService } from '@/services/authService'
import type { UploadProps } from 'antd'
import dayjs from 'dayjs'

const { Title, Text, Paragraph } = Typography

const ProfilePage: React.FC = () => {
  const { message } = App.useApp()
  const { user, refreshUser, setUser } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [uploadLoading, setUploadLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')
  const [profileForm] = Form.useForm()
  const [passwordForm] = Form.useForm()

  useEffect(() => {
    refreshUser()
  }, [refreshUser])

  const handleProfileUpdate = async (values: any) => {
    try {
      setLoading(true)
      const response = await authService.updateProfile(values)
      setUser(response.data)
      message.success('个人资料更新成功')
    } catch (error: any) {
      message.error(error.response?.data?.message || '更新失败')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordChange = async (values: any) => {
    if (values.new_password !== values.confirm_password) {
      message.error('两次输入的密码不一致')
      return
    }

    try {
      setPasswordLoading(true)
      await authService.changePassword({
        current_password: values.current_password,
        new_password: values.new_password,
        confirm_password: values.confirm_password
      })
      message.success('密码修改成功')
      passwordForm.resetFields()
    } catch (error: any) {
      message.error(error.response?.data?.message || '密码修改失败')
    } finally {
      setPasswordLoading(false)
    }
  }

  const handleAvatarUpload: UploadProps['customRequest'] = async (options) => {
    const { file } = options
    try {
      setUploadLoading(true)
      const response = await authService.uploadAvatar(file as File)
      message.success('头像上传成功')
      // 刷新用户信息以更新头像
      refreshUser()
    } catch (error: any) {
      message.error(error.response?.data?.message || '头像上传失败')
    } finally {
      setUploadLoading(false)
    }
  }

  const uploadProps: UploadProps = {
    name: 'avatar',
    showUploadList: false,
    customRequest: handleAvatarUpload,
    beforeUpload: (file) => {
      const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png'
      if (!isJpgOrPng) {
        message.error('只能上传 JPG/PNG 格式的图片!')
      }
      const isLt2M = file.size / 1024 / 1024 < 2
      if (!isLt2M) {
        message.error('图片大小不能超过 2MB!')
      }
      return isJpgOrPng && isLt2M
    }
  }

  const getAccountStatusTag = (status: string) => {
    const statusConfig = {
      Active: { color: 'success', icon: <CheckCircleOutlined />, text: '活跃' },
      Inactive: { color: 'default', icon: <CloseCircleOutlined />, text: '未激活' },
      Suspended: { color: 'error', icon: <ExclamationCircleOutlined />, text: '已暂停' },
      PendingDeletion: { color: 'warning', icon: <ExclamationCircleOutlined />, text: '待删除' },
      Deleted: { color: 'error', icon: <CloseCircleOutlined />, text: '已删除' }
    }
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.Active
    return (
      <Tag color={config.color} icon={config.icon}>
        {config.text}
      </Tag>
    )
  }

  const sendVerificationEmail = async () => {
    try {
      await authService.sendEmailVerification()
      message.success('验证邮件已发送，请查收')
    } catch (error: any) {
      message.error(error.response?.data?.message || '发送失败')
    }
  }

  const tabItems = [
    {
      key: 'profile',
      label: (
        <span>
          <UserOutlined />
          基本信息
        </span>
      ),
      children: (
        <Form
          form={profileForm}
          layout="vertical"
          initialValues={{
            email: user?.email,
          }}
          onFinish={handleProfileUpdate}
          className="max-w-2xl"
        >
          <Row gutter={24}>
            <Col span={24}>
              <Form.Item
                label="邮箱"
                name="email"
              >
                <Input 
                  prefix={<MailOutlined />} 
                  disabled 
                  size="large"
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={loading}
              size="large"
              disabled
            >
              保存修改
            </Button>
            <Text type="secondary" className="ml-4">
              更多个人资料选项即将推出
            </Text>
          </Form.Item>
        </Form>
      ),
    },
    {
      key: 'security',
      label: (
        <span>
          <SafetyOutlined />
          安全设置
        </span>
      ),
      children: (
        <div className="max-w-2xl">
          <Title level={4} className="mb-4">
            <LockOutlined className="mr-2" />
            修改密码
          </Title>
          
          {user?.has_password ? (
            <Form
              form={passwordForm}
              layout="vertical"
              onFinish={handlePasswordChange}
            >
              <Form.Item
                label="当前密码"
                name="current_password"
                rules={[{ required: true, message: '请输入当前密码' }]}
              >
                <Input.Password size="large" />
              </Form.Item>

              <Form.Item
                label="新密码"
                name="new_password"
                rules={[
                  { required: true, message: '请输入新密码' },
                  { min: 8, message: '密码至少8个字符' }
                ]}
              >
                <Input.Password size="large" />
              </Form.Item>

              <Form.Item
                label="确认新密码"
                name="confirm_password"
                rules={[
                  { required: true, message: '请确认新密码' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('new_password') === value) {
                        return Promise.resolve()
                      }
                      return Promise.reject(new Error('两次输入的密码不一致'))
                    },
                  }),
                ]}
              >
                <Input.Password size="large" />
              </Form.Item>

              <Form.Item>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={passwordLoading}
                  size="large"
                >
                  修改密码
                </Button>
              </Form.Item>
            </Form>
          ) : (
            <Card className="bg-gray-50">
              <Paragraph>
                您当前使用第三方账号登录，暂未设置密码。
                设置密码后，您可以使用邮箱和密码登录。
              </Paragraph>
              <Button type="primary" size="large">
                设置密码
              </Button>
            </Card>
          )}

          <Divider />

          <Title level={4} className="mb-4">
            <SafetyOutlined className="mr-2" />
            两步验证
          </Title>
          <Card className="bg-gray-50">
            <Paragraph>
              启用两步验证可以大幅提高账号安全性。即使密码泄露，
              攻击者也无法登录您的账号。
            </Paragraph>
            <Button type="default" size="large" disabled>
              即将推出
            </Button>
          </Card>
        </div>
      ),
    },
    {
      key: 'preferences',
      label: (
        <span>
          <SettingOutlined />
          偏好设置
        </span>
      ),
      children: (
        <div className="max-w-2xl">
          <Title level={4} className="mb-4">偏好设置</Title>
          <Card className="bg-gray-50">
            <Paragraph>
              更多个性化设置选项即将推出，包括：
            </Paragraph>
            <ul className="list-disc list-inside text-gray-600">
              <li>界面主题（亮色/暗色）</li>
              <li>语言偏好</li>
              <li>编辑器设置</li>
              <li>通知偏好</li>
              <li>隐私设置</li>
            </ul>
          </Card>
        </div>
      ),
    },
  ]

  if (!user) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <Card>
        <div className="mb-6">
          <Row gutter={[24, 24]} align="middle">
            <Col xs={24} sm={6} className="text-center">
              <Upload {...uploadProps}>
                <div className="relative inline-block cursor-pointer">
                  <Avatar 
                    size={120} 
                    src={user.avatar_url}
                    icon={<UserOutlined />}
                    className="border-4 border-gray-200"
                  />
                  {uploadLoading ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full">
                      <Spin />
                    </div>
                  ) : (
                    <div className="absolute bottom-0 right-0 bg-blue-500 text-white rounded-full p-2 hover:bg-blue-600">
                      <CameraOutlined />
                    </div>
                  )}
                </div>
              </Upload>
            </Col>
            <Col xs={24} sm={18}>
              <Title level={3} className="mb-2">{user.email}</Title>
              <Space wrap className="mb-2">
                {getAccountStatusTag(user.account_status)}
                {user.is_email_verified ? (
                  <Tag color="success" icon={<CheckCircleOutlined />}>
                    邮箱已验证
                  </Tag>
                ) : (
                  <Tag color="warning" icon={<ExclamationCircleOutlined />}>
                    邮箱未验证
                    <Button 
                      type="link" 
                      size="small" 
                      onClick={sendVerificationEmail}
                      className="ml-2 p-0"
                    >
                      立即验证
                    </Button>
                  </Tag>
                )}
              </Space>
              <div className="text-gray-500">
                <Space split={<Divider type="vertical" />}>
                  <span>
                    <CalendarOutlined className="mr-1" />
                    注册时间：{dayjs(user.created_at).format('YYYY-MM-DD')}
                  </span>
                  {user.last_login_at && (
                    <span>
                      最后登录：{dayjs(user.last_login_at).format('YYYY-MM-DD HH:mm')}
                    </span>
                  )}
                </Space>
              </div>
            </Col>
          </Row>
        </div>

        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
      </Card>
    </div>
  )
}

export default ProfilePage
