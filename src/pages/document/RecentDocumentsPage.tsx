import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Layout,
  Typography,
  Table,
  Button,
  Space,
  Tag,
  message,
  Tooltip,
  Empty,
  Spin,
  Input,
  Row,
  Col,
  Card,
  Statistic
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  SearchOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  FolderOpenOutlined,
  GlobalOutlined,
  LockOutlined
} from '@ant-design/icons'
import { documentService } from '@/services/documentService'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

const { Content } = Layout
const { Title, Text } = Typography
const { Search } = Input

interface Document {
  id: string
  title: string
  space_id: string
  space_name?: string
  space_slug?: string
  slug: string
  excerpt?: string
  is_public: boolean
  author_id: string
  author_name?: string
  created_at: string
  updated_at: string
  view_count: number
  word_count: number
  tags?: string[]
}

const RecentDocumentsPage: React.FC = () => {
  const navigate = useNavigate()
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(false)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0
  })
  const [stats, setStats] = useState({
    totalDocs: 0,
    publicDocs: 0,
    privateDocs: 0,
    totalViews: 0
  })

  // 加载最近文档
  const loadRecentDocuments = async (page = 1, search = '') => {
    setLoading(true)
    try {
      // 暂时显示提示信息，等待后端API完善
      message.info('最近文档功能需要后端API支持，正在开发中...')
      
      const mockData = {
        data: [],
        total: 0,
        page: page,
        limit: 20,
        total_pages: 0
      }
      
      setDocuments(mockData.data)
      setPagination({
        ...pagination,
        current: page,
        total: mockData.total
      })
    } catch (error) {
      message.error('加载文档失败')
    } finally {
      setLoading(false)
    }
  }

  // 加载统计数据
  const loadStats = async () => {
    try {
      // 这里需要统计API
      // 暂时使用模拟数据
      setStats({
        totalDocs: 0,
        publicDocs: 0,
        privateDocs: 0,
        totalViews: 0
      })
    } catch (error) {
      console.error('Failed to load stats:', error)
    }
  }

  useEffect(() => {
    loadRecentDocuments()
    loadStats()
  }, [])

  // 搜索处理
  const handleSearch = (value: string) => {
    setSearchKeyword(value)
    loadRecentDocuments(1, value)
  }

  // 查看文档
  const handleView = (record: Document) => {
    if (record.space_slug) {
      navigate(`/docs/${record.id}`)
    } else {
      navigate(`/docs/${record.id}`)
    }
  }

  // 编辑文档
  const handleEdit = (record: Document) => {
    if (record.space_slug) {
      navigate(`/docs/${record.id}/edit`)
    } else {
      navigate(`/docs/${record.id}/edit`)
    }
  }

  // 删除文档
  const handleDelete = async (record: Document) => {
    // 需要实现删除功能
    message.warning('删除功能开发中')
  }

  // 表格列定义
  const columns: ColumnsType<Document> = [
    {
      title: '文档标题',
      dataIndex: 'title',
      key: 'title',
      width: 300,
      render: (text, record) => (
        <div>
          <Button 
            type="link" 
            onClick={() => handleView(record)}
            className="p-0 text-left font-medium"
          >
            {text}
          </Button>
          {record.excerpt && (
            <div className="text-gray-500 text-sm mt-1 line-clamp-2">
              {record.excerpt}
            </div>
          )}
        </div>
      ),
    },
    {
      title: '所属空间',
      dataIndex: 'space_name',
      key: 'space_name',
      width: 150,
      render: (text, record) => (
        <Button
          type="link"
          size="small"
          icon={<FolderOpenOutlined />}
          onClick={() => navigate(`/spaces/${record.space_slug}`)}
          className="text-gray-600"
        >
          {text || '未知空间'}
        </Button>
      ),
    },
    {
      title: '状态',
      dataIndex: 'is_public',
      key: 'is_public',
      width: 100,
      align: 'center',
      render: (is_public: boolean) => (
        <Tag 
          icon={is_public ? <GlobalOutlined /> : <LockOutlined />}
          color={is_public ? 'green' : 'orange'}
        >
          {is_public ? '公开' : '私有'}
        </Tag>
      ),
    },
    {
      title: '浏览量',
      dataIndex: 'view_count',
      key: 'view_count',
      width: 100,
      align: 'center',
      render: (count: number) => (
        <Space>
          <EyeOutlined className="text-gray-400" />
          <span>{count}</span>
        </Space>
      ),
    },
    {
      title: '更新时间',
      dataIndex: 'updated_at',
      key: 'updated_at',
      width: 150,
      render: (date: string) => (
        <Tooltip title={dayjs(date).format('YYYY-MM-DD HH:mm:ss')}>
          <Space>
            <ClockCircleOutlined className="text-gray-400" />
            <span className="text-gray-600">
              {dayjs(date).fromNow()}
            </span>
          </Space>
        </Tooltip>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 120,
      align: 'center',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="查看">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleView(record)}
            />
          </Tooltip>
          <Tooltip title="编辑">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Tooltip title="删除">
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ]

  return (
    <Layout className="min-h-screen bg-gray-50">
      <Content className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* 页面标题 */}
          <div className="mb-6">
            <Title level={2} className="mb-0">
              <FileTextOutlined className="mr-2" />
              最近文档
            </Title>
            <Text type="secondary">查看和管理您最近访问或编辑的文档</Text>
          </div>

          {/* 统计卡片 */}
          <Row gutter={16} className="mb-6">
            <Col xs={24} sm={12} md={6}>
              <Card className="hover:shadow-lg transition-shadow">
                <Statistic
                  title="文档总数"
                  value={stats.totalDocs}
                  prefix={<FileTextOutlined className="text-blue-500" />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card className="hover:shadow-lg transition-shadow">
                <Statistic
                  title="公开文档"
                  value={stats.publicDocs}
                  prefix={<GlobalOutlined className="text-green-500" />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card className="hover:shadow-lg transition-shadow">
                <Statistic
                  title="私有文档"
                  value={stats.privateDocs}
                  prefix={<LockOutlined className="text-orange-500" />}
                />
              </Card>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Card className="hover:shadow-lg transition-shadow">
                <Statistic
                  title="总浏览量"
                  value={stats.totalViews}
                  prefix={<EyeOutlined className="text-purple-500" />}
                />
              </Card>
            </Col>
          </Row>

          {/* 搜索和操作栏 */}
          <Card className="mb-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <Search
                placeholder="搜索文档标题、内容..."
                allowClear
                enterButton={<SearchOutlined />}
                size="large"
                onSearch={handleSearch}
                style={{ maxWidth: 400 }}
              />
              <Button
                type="primary"
                size="large"
                icon={<PlusOutlined />}
                onClick={() => navigate('/spaces')}
              >
                新建文档
              </Button>
            </div>
          </Card>

          {/* 文档列表 */}
          <Card>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
          <Spin size="large" />
          <div className="mt-3 text-gray-500">加载中...</div>
        </div>
              </div>
            ) : documents.length === 0 ? (
              <Empty 
                description="暂无文档"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              >
                <Button type="primary" onClick={() => navigate('/spaces')}>
                  浏览空间创建文档
                </Button>
              </Empty>
            ) : (
              <Table
                columns={columns}
                dataSource={documents}
                rowKey="id"
                pagination={{
                  ...pagination,
                  showSizeChanger: true,
                  showTotal: (total) => `共 ${total} 篇文档`,
                  onChange: (page) => loadRecentDocuments(page, searchKeyword),
                }}
              />
            )}
          </Card>
        </div>
      </Content>
    </Layout>
  )
}

export default RecentDocumentsPage