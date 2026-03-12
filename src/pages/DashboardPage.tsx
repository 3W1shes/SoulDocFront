import React, { useEffect, useRef, useState } from 'react'
import { 
  Card, 
  Row, 
  Col, 
  Statistic, 
  List, 
  Avatar, 
  Button, 
  Typography, 
  Space,
  Tag,
  Empty,
  Spin,
  message
} from 'antd'
import { 
  FileTextOutlined, 
  FolderOutlined, 
  EyeOutlined, 
  ClockCircleOutlined,
  PlusOutlined,
  StarOutlined,
  TeamOutlined,
  BookOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { spaceService } from '@/services/spaceService'
import { statsService } from '@/services/statsService'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'
import type { Space as SpaceType, Document } from '@/types'

// 配置dayjs
dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

const { Title, Text } = Typography

// 扩展接口定义
interface SpaceWithStats extends SpaceType {
  stats?: {
    document_count: number
    public_document_count: number
    comment_count: number
    view_count: number
    last_activity?: string
  }
}

const DashboardPage: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [statsLoading, setStatsLoading] = useState(true)
  const [recentDocuments, setRecentDocuments] = useState<Document[]>([])
  const [recentSpaces, setRecentSpaces] = useState<SpaceWithStats[]>([])
  const [stats, setStats] = useState({
    totalSpaces: 0,
    totalDocuments: 0,
    totalViews: 0,
    totalMembers: 0,
  })
  const hasLoadedRef = useRef(false)

  useEffect(() => {
    if (hasLoadedRef.current) return
    hasLoadedRef.current = true
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      // 并行加载数据
      const [spacesResponse, statsResponse] = await Promise.all([
        spaceService.getSpaces({ limit: 10, sort_order: 'desc' }),
        statsService.getDocumentStats()
      ])

      // 处理空间数据
      if (spacesResponse?.success && spacesResponse.data?.spaces) {
        const spaces = (spacesResponse.data.spaces || []) as SpaceWithStats[]

        // 仅使用当前用户拥有的空间，避免对无权/脏数据空间发起 403/404 请求
        const accessibleSpaces = spaces
          .filter((space) => space.owner_id === user?.id)
          .slice(0, 3)
        setRecentSpaces(accessibleSpaces)
        
        // 临时降噪：空间权限/脏数据未完全清理前，首页不做按空间逐个拉文档，
        // 避免产生大量 403/404 控制台噪音。
        setRecentDocuments([])
      }

      // 处理统计数据
      if (statsResponse?.success && statsResponse.data) {
        const statsData = statsResponse.data
        setStats({
          totalSpaces: statsData.total_spaces,
          totalDocuments: statsData.total_documents,
          totalViews: 0, // 后端暂未实现
          totalMembers: 0, // 后端暂未实现
        })
      }

    } catch (error) {
      console.error('加载仪表板数据失败:', error)
      message.error('加载数据失败，请刷新重试')
    } finally {
      setLoading(false)
      setStatsLoading(false)
    }
  }

  const handleDocumentClick = (doc: Document & { space_slug?: string }) => {
    if (doc.space_slug && doc.slug) {
      navigate(`/spaces/${doc.space_slug}/docs/${doc.slug}`)
    } else if (doc.id) {
      navigate(`/docs/${doc.id}`)
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-96">
        <div className="text-center">
          <Spin size="large" />
          <div className="mt-3 text-gray-500">正在加载仪表板...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* 欢迎区域 */}
      <div className="mb-8">
        <Title level={2} className="mb-2">
          欢迎回来，{user?.display_name || user?.username}！
        </Title>
        <Text className="text-gray-600 text-lg">
          今天是 {dayjs().format('YYYY年MM月DD日')}，开始您的工作吧
        </Text>
      </div>

      {/* 统计数据 */}
      <Row gutter={[24, 24]} className="mb-8">
        <Col xs={24} sm={12} lg={6}>
          <Card loading={statsLoading}>
            <Statistic
              title="空间总数"
              value={stats.totalSpaces}
              prefix={<FolderOutlined className="text-blue-500" />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={statsLoading}>
            <Statistic
              title="文档总数"
              value={stats.totalDocuments}
              prefix={<FileTextOutlined className="text-green-500" />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={statsLoading}>
            <Statistic
              title="总浏览量"
              value={stats.totalViews}
              prefix={<EyeOutlined className="text-orange-500" />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card loading={statsLoading}>
            <Statistic
              title="团队成员"
              value={stats.totalMembers}
              prefix={<TeamOutlined className="text-purple-500" />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]}>
        {/* 最近文档 */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <ClockCircleOutlined />
                最近文档
              </Space>
            }
            extra={
              <Button 
                type="link" 
                onClick={() => navigate('/spaces')}
              >
                查看全部
              </Button>
            }
            className="h-full"
          >
            <List
              dataSource={recentDocuments}
              renderItem={(doc) => (
                <List.Item
                  actions={[
                    <Button 
                      type="link" 
                      size="small"
                      onClick={() => handleDocumentClick(doc)}
                    >
                      查看
                    </Button>
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <Avatar 
                        icon={<FileTextOutlined />} 
                        className="bg-blue-100 text-blue-600"
                      />
                    }
                    title={
                      <div className="flex items-center space-x-2">
                        <span>{doc.title}</span>
                        <Tag 
                          color={doc.is_public ? 'green' : 'orange'}
                        >
                          {doc.is_public ? '已发布' : '草稿'}
                        </Tag>
                      </div>
                    }
                    description={
                      <div className="text-gray-500 space-y-1">
                        <div>空间：{(doc as any).space_name || '未知空间'}</div>
                        <div>
                          {dayjs(doc.updated_at).fromNow()} · {(doc as any).author_name || '未知作者'}
                        </div>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
            
            {recentDocuments.length === 0 && (
              <Empty 
                description="暂无最近文档"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )}
          </Card>
        </Col>

        {/* 最近空间 */}
        <Col xs={24} lg={12}>
          <Card
            title={
              <Space>
                <FolderOutlined />
                最近空间
              </Space>
            }
            extra={
              <Button 
                type="primary" 
                icon={<PlusOutlined />}
                onClick={() => navigate('/spaces')}
              >
                管理空间
              </Button>
            }
            className="h-full"
          >
            <List
              dataSource={recentSpaces}
              renderItem={(space) => (
                <List.Item
                  actions={[
                    <Button 
                      type="link" 
                      size="small"
                      onClick={() => navigate(`/spaces/${space.slug}`)}
                    >
                      进入
                    </Button>
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <Avatar 
                        icon={<FolderOutlined />} 
                        className="bg-green-100 text-green-600"
                      />
                    }
                    title={
                      <div className="flex items-center space-x-2">
                        <span>{space.name}</span>
                        {space.is_public && <BookOutlined className="text-blue-500" title="公开空间" />}
                      </div>
                    }
                    description={
                      <div className="text-gray-500 space-y-1">
                        <div>{space.description || '暂无描述'}</div>
                        <div className="flex space-x-4 text-sm">
                          <span>{space.stats?.document_count || 0} 篇文档</span>
                          <span>{space.stats?.view_count || 0} 次浏览</span>
                        </div>
                        <div>
                          最后活动：{space.stats?.last_activity ? dayjs(space.stats.last_activity).fromNow() : '暂无活动'}
                        </div>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
            
            {recentSpaces.length === 0 && (
              <Empty 
                description="暂无空间"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              >
                <Button 
                  type="primary" 
                  onClick={() => navigate('/spaces/create')}
                >
                  创建第一个空间
                </Button>
              </Empty>
            )}
          </Card>
        </Col>
      </Row>

      {/* 快速操作 */}
      <Card title="快速操作" className="mt-6">
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Button 
              type="dashed" 
              className="w-full h-24 flex flex-col items-center justify-center"
              onClick={() => navigate('/spaces')}
            >
              <PlusOutlined className="text-2xl mb-2" />
              <span>管理空间</span>
            </Button>
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Button 
              type="dashed" 
              className="w-full h-24 flex flex-col items-center justify-center"
              onClick={() => navigate('/spaces/create')}
            >
              <FolderOutlined className="text-2xl mb-2" />
              <span>创建空间</span>
            </Button>
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Button 
              type="dashed" 
              className="w-full h-24 flex flex-col items-center justify-center"
              onClick={() => navigate('/search')}
            >
              <EyeOutlined className="text-2xl mb-2" />
              <span>搜索文档</span>
            </Button>
          </Col>
          <Col xs={24} sm={12} md={8} lg={6}>
            <Button 
              type="dashed" 
              className="w-full h-24 flex flex-col items-center justify-center"
              onClick={() => navigate('/profile')}
            >
              <StarOutlined className="text-2xl mb-2" />
              <span>个人中心</span>
            </Button>
          </Col>
        </Row>
      </Card>
    </div>
  )
}

export default DashboardPage
