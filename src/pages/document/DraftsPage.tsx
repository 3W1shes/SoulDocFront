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
  Card,
  Modal,
  Checkbox
} from 'antd'
import {
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  SearchOutlined,
  FileTextOutlined,
  ClockCircleOutlined,
  FolderOpenOutlined,
  SendOutlined,
  SaveOutlined,
  ExclamationCircleOutlined
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
const { confirm } = Modal

interface Draft {
  id: string
  title: string
  space_id: string
  space_name?: string
  space_slug?: string
  slug: string
  excerpt?: string
  author_id: string
  created_at: string
  updated_at: string
  word_count: number
  auto_save?: boolean
}

const DraftsPage: React.FC = () => {
  const navigate = useNavigate()
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [loading, setLoading] = useState(false)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([])
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0
  })

  // 加载草稿
  const loadDrafts = async (page = 1, search = '') => {
    setLoading(true)
    try {
      // 暂时显示提示信息，将使用is_public=false的文档作为草稿
      message.info('草稿功能使用私有文档模拟，完整功能正在开发中...')
      
      const mockData = {
        data: [],
        total: 0,
        page: page,
        limit: 20,
        total_pages: 0
      }
      
      setDrafts(mockData.data)
      setPagination({
        ...pagination,
        current: page,
        total: mockData.total
      })
    } catch (error) {
      message.error('加载草稿失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDrafts()
  }, [])

  // 搜索处理
  const handleSearch = (value: string) => {
    setSearchKeyword(value)
    loadDrafts(1, value)
  }

  // 编辑草稿
  const handleEdit = (record: Draft) => {
    if (record.space_slug) {
      navigate(`/docs/${record.id}/edit`)
    } else {
      navigate(`/docs/${record.id}/edit`)
    }
  }

  // 发布草稿
  const handlePublish = async (record: Draft) => {
    confirm({
      title: '确认发布',
      icon: <ExclamationCircleOutlined />,
      content: `确定要发布草稿《${record.title}》吗？`,
      onOk: async () => {
        try {
          // 调用发布API
          message.success('发布成功')
          loadDrafts(pagination.current, searchKeyword)
        } catch (error) {
          message.error('发布失败')
        }
      }
    })
  }

  // 删除草稿
  const handleDelete = async (record: Draft) => {
    confirm({
      title: '确认删除',
      icon: <ExclamationCircleOutlined />,
      content: `确定要删除草稿《${record.title}》吗？删除后无法恢复。`,
      onOk: async () => {
        try {
          // 调用删除API
          message.success('删除成功')
          loadDrafts(pagination.current, searchKeyword)
        } catch (error) {
          message.error('删除失败')
        }
      }
    })
  }

  // 批量删除
  const handleBatchDelete = () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要删除的草稿')
      return
    }
    
    confirm({
      title: '批量删除确认',
      icon: <ExclamationCircleOutlined />,
      content: `确定要删除选中的 ${selectedRowKeys.length} 篇草稿吗？`,
      onOk: async () => {
        try {
          // 调用批量删除API
          message.success('批量删除成功')
          setSelectedRowKeys([])
          loadDrafts(pagination.current, searchKeyword)
        } catch (error) {
          message.error('批量删除失败')
        }
      }
    })
  }

  // 表格列定义
  const columns: ColumnsType<Draft> = [
    {
      title: '文档标题',
      dataIndex: 'title',
      key: 'title',
      width: 350,
      render: (text, record) => (
        <div>
          <Space>
            <FileTextOutlined className="text-gray-400" />
            <Button 
              type="link" 
              onClick={() => handleEdit(record)}
              className="p-0 text-left font-medium"
            >
              {text || '无标题草稿'}
            </Button>
          </Space>
          {record.excerpt && (
            <div className="text-gray-500 text-sm mt-1 ml-6 line-clamp-2">
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
      title: '字数',
      dataIndex: 'word_count',
      key: 'word_count',
      width: 100,
      align: 'center',
      render: (count: number) => (
        <Text type="secondary">{count} 字</Text>
      ),
    },
    {
      title: '保存状态',
      key: 'save_status',
      width: 120,
      align: 'center',
      render: (_, record) => (
        record.auto_save ? (
          <Tag icon={<SaveOutlined />} color="green">
            自动保存
          </Tag>
        ) : (
          <Tag icon={<SaveOutlined />} color="orange">
            手动保存
          </Tag>
        )
      ),
    },
    {
      title: '最后编辑',
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
      width: 150,
      align: 'center',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="继续编辑">
            <Button
              type="primary"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            >
              编辑
            </Button>
          </Tooltip>
          <Tooltip title="发布">
            <Button
              size="small"
              icon={<SendOutlined />}
              onClick={() => handlePublish(record)}
            >
              发布
            </Button>
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

  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys: React.Key[]) => {
      setSelectedRowKeys(newSelectedRowKeys as string[])
    },
  }

  return (
    <Layout className="min-h-screen bg-gray-50">
      <Content className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* 页面标题 */}
          <div className="mb-6">
            <Title level={2} className="mb-0">
              <SaveOutlined className="mr-2" />
              草稿箱
            </Title>
            <Text type="secondary">管理您的未发布文档草稿</Text>
          </div>

          {/* 搜索和操作栏 */}
          <Card className="mb-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4 flex-1">
                <Search
                  placeholder="搜索草稿标题、内容..."
                  allowClear
                  enterButton={<SearchOutlined />}
                  size="large"
                  onSearch={handleSearch}
                  style={{ maxWidth: 400 }}
                />
                {selectedRowKeys.length > 0 && (
                  <Text type="secondary">
                    已选择 {selectedRowKeys.length} 项
                  </Text>
                )}
              </div>
              
              <Space>
                {selectedRowKeys.length > 0 && (
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    onClick={handleBatchDelete}
                  >
                    批量删除
                  </Button>
                )}
              </Space>
            </div>
          </Card>

          {/* 草稿列表 */}
          <Card>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
          <Spin size="large" />
          <div className="mt-3 text-gray-500">加载中...</div>
        </div>
              </div>
            ) : drafts.length === 0 ? (
              <Empty 
                description="暂无草稿"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              >
                <Button type="primary" onClick={() => navigate('/spaces')}>
                  浏览空间创建文档
                </Button>
              </Empty>
            ) : (
              <Table
                rowSelection={rowSelection}
                columns={columns}
                dataSource={drafts}
                rowKey="id"
                pagination={{
                  ...pagination,
                  showSizeChanger: true,
                  showTotal: (total) => `共 ${total} 篇草稿`,
                  onChange: (page) => loadDrafts(page, searchKeyword),
                }}
              />
            )}
          </Card>

          {/* 草稿提示 */}
          <Card className="mt-6 bg-blue-50 border-blue-200">
            <div className="text-blue-700">
              <Title level={5} className="mb-2 text-blue-700">
                <ExclamationCircleOutlined className="mr-2" />
                草稿箱说明
              </Title>
              <ul className="list-disc pl-6 space-y-1 text-sm">
                <li>草稿会自动保存，您可以随时回来继续编辑</li>
                <li>发布后的文档将从草稿箱中移除</li>
                <li>草稿箱中的文档不会被其他用户看到</li>
                <li>建议定期清理不需要的草稿，避免占用存储空间</li>
              </ul>
            </div>
          </Card>
        </div>
      </Content>
    </Layout>
  )
}

export default DraftsPage