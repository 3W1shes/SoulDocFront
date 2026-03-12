import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import {
  Card,
  Button,
  Result,
  Spin,
  Typography,
  Tag,
  Space,
  Divider,
  Avatar,
  Alert,
  message
} from 'antd'
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  TeamOutlined,
  UserOutlined,
  CrownOutlined,
  SettingOutlined
} from '@ant-design/icons'
import { spaceMemberService } from '@/services/spaceMemberService'

const { Title, Text, Paragraph } = Typography

interface InvitationDetails {
  space_name: string
  inviter_name: string
  role: string
  message?: string
  expires_at: string
  is_expired: boolean
}

const AcceptInvitationPage: React.FC = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [invitationDetails, setInvitationDetails] = useState<InvitationDetails | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  const token = searchParams.get('token')

  // 角色显示配置
  const roleConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    owner: { label: '所有者', color: 'gold', icon: <CrownOutlined /> },
    admin: { label: '管理员', color: 'red', icon: <SettingOutlined /> },
    editor: { label: '编辑者', color: 'blue', icon: <TeamOutlined /> },
    viewer: { label: '查看者', color: 'green', icon: <TeamOutlined /> },
    member: { label: '成员', color: 'default', icon: <TeamOutlined /> }
  }

  useEffect(() => {
    if (!token) {
      setError('缺少邀请令牌')
      setLoading(false)
      return
    }

    loadInvitationDetails()
  }, [token])

  const loadInvitationDetails = async () => {
    try {
      setLoading(true)
      // TODO: 调用API获取邀请详情
      // const response = await spaceMemberService.getInvitationDetails(token!)
      // setInvitationDetails(response.data)
      
      // 模拟数据，实际应该从API获取
      setInvitationDetails({
        space_name: '示例空间',
        inviter_name: '张三',
        role: 'member',
        message: '欢迎加入我们的团队！',
        expires_at: '2025-07-31T10:00:00Z',
        is_expired: false
      })
    } catch (error) {
      console.error('Failed to load invitation details:', error)
      setError('无法加载邀请详情，邀请可能已过期或无效')
    } finally {
      setLoading(false)
    }
  }

  const handleAcceptInvitation = async () => {
    if (!token) return

    try {
      setAccepting(true)
      await spaceMemberService.acceptInvitation({ invite_token: token })
      
      message.success('已成功加入空间！')
      
      // 跳转到空间页面
      setTimeout(() => {
        navigate('/dashboard')
      }, 1500)
    } catch (error) {
      console.error('Failed to accept invitation:', error)
      message.error('接受邀请失败，请重试')
    } finally {
      setAccepting(false)
    }
  }

  const handleRejectInvitation = () => {
    // TODO: 实现拒绝邀请的逻辑
    message.info('已拒绝邀请')
    navigate('/dashboard')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Spin size="large" />
          <div className="mt-3 text-gray-500">加载邀请信息...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <Result
            status="error"
            title="邀请无效"
            subTitle={error}
            extra={
              <Button type="primary" onClick={() => navigate('/dashboard')}>
                返回首页
              </Button>
            }
          />
        </Card>
      </div>
    )
  }

  if (!invitationDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <Result
            status="404"
            title="邀请不存在"
            subTitle="找不到对应的邀请信息"
            extra={
              <Button type="primary" onClick={() => navigate('/dashboard')}>
                返回首页
              </Button>
            }
          />
        </Card>
      </div>
    )
  }

  const roleInfo = roleConfig[invitationDetails.role] || roleConfig.member
  const isExpired = invitationDetails.is_expired || new Date(invitationDetails.expires_at) < new Date()

  if (isExpired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <Result
            status="warning"
            title="邀请已过期"
            subTitle="此邀请链接已过期，请联系邀请人重新发送邀请"
            extra={
              <Button type="primary" onClick={() => navigate('/dashboard')}>
                返回首页
              </Button>
            }
          />
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-lg">
          <div className="text-center mb-6">
            <Avatar
              size={80}
              icon={<TeamOutlined />}
              className="bg-blue-500 mb-4"
            />
            <Title level={2} className="mb-2">
              空间邀请
            </Title>
            <Text type="secondary" className="text-lg">
              您收到了一个空间协作邀请
            </Text>
          </div>

          <Divider />

          <div className="space-y-6">
            {/* 邀请信息 */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Text strong className="block mb-1">空间名称</Text>
                  <Text className="text-lg">{invitationDetails.space_name}</Text>
                </div>
                <div>
                  <Text strong className="block mb-1">邀请人</Text>
                  <Space>
                    <UserOutlined />
                    <Text className="text-lg">{invitationDetails.inviter_name}</Text>
                  </Space>
                </div>
                <div>
                  <Text strong className="block mb-1">分配角色</Text>
                  <Tag color={roleInfo.color} icon={roleInfo.icon} className="text-lg px-3 py-1">
                    {roleInfo.label}
                  </Tag>
                </div>
                <div>
                  <Text strong className="block mb-1">过期时间</Text>
                  <Text className="text-lg">
                    {new Date(invitationDetails.expires_at).toLocaleString()}
                  </Text>
                </div>
              </div>
            </div>

            {/* 邀请消息 */}
            {invitationDetails.message && (
              <div>
                <Text strong className="block mb-2">邀请消息</Text>
                <Alert
                  message={invitationDetails.message}
                  type="info"
                  showIcon
                  className="bg-blue-50 border-blue-200"
                />
              </div>
            )}

            {/* 角色权限说明 */}
            <div>
              <Text strong className="block mb-2">角色权限说明</Text>
              <div className="bg-gray-50 p-4 rounded-lg">
                {invitationDetails.role === 'owner' && (
                  <Text>拥有空间的完全控制权，可以管理所有内容和成员</Text>
                )}
                {invitationDetails.role === 'admin' && (
                  <Text>可以管理文档和成员，拥有空间的管理权限</Text>
                )}
                {invitationDetails.role === 'editor' && (
                  <Text>可以创建、编辑和删除文档，参与协作编辑</Text>
                )}
                {invitationDetails.role === 'member' && (
                  <Text>可以查看和编辑文档，参与团队协作</Text>
                )}
                {invitationDetails.role === 'viewer' && (
                  <Text>只能查看文档内容，不能进行编辑操作</Text>
                )}
              </div>
            </div>
          </div>

          <Divider />

          {/* 操作按钮 */}
          <div className="flex justify-center space-x-4">
            <Button
              size="large"
              onClick={handleRejectInvitation}
              className="min-w-32"
            >
              拒绝邀请
            </Button>
            <Button
              type="primary"
              size="large"
              loading={accepting}
              onClick={handleAcceptInvitation}
              icon={<CheckCircleOutlined />}
              className="min-w-32"
            >
              {accepting ? '加入中...' : '接受邀请'}
            </Button>
          </div>

          <div className="text-center mt-6">
            <Text type="secondary" className="text-sm">
              点击"接受邀请"即表示您同意加入该空间并遵守相关协作规范
            </Text>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default AcceptInvitationPage