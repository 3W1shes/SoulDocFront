import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Layout,
  Typography,
  Button,
  Breadcrumb,
  Table,
  Space,
  Tag,
  Dropdown,
  Input,
  Card,
  message,
  Pagination
} from 'antd'
import {
  PlusOutlined,
  HomeOutlined,
  FolderOpenOutlined,
  FileTextOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
  SearchOutlined
} from '@ant-design/icons'
import { useSpaceStore } from '@/stores/spaceStore'
import { documentService } from '@/services/documentService'
import type { DocumentListItem, DocumentQuery } from '@/types'

const { Content } = Layout
const { Title, Text } = Typography
const { Search } = Input

interface RouteParams {
  spaceSlug: string
}

const DocumentListPage: React.FC = () => {
  const params = useParams()
  const spaceSlug = params.spaceSlug
  const navigate = useNavigate()
  const { currentSpace, loadSpace, loading: spaceLoading } = useSpaceStore()
  
  const [documents, setDocuments] = useState<DocumentListItem[]>([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [query, setQuery] = useState<DocumentQuery>({
    page: 1,
    limit: 20
  })

  useEffect(() => {
    if (spaceSlug) {
      loadSpace(spaceSlug)
      loadDocuments()
    }
  }, [spaceSlug, query])

  const loadDocuments = async () => {
    if (!spaceSlug) return
    
    setLoading(true)
    try {
      const response = await documentService.getDocuments(spaceSlug, query)
      const actualData = response?.data || {}
      setDocuments(actualData.documents || [])
      setTotal(actualData.total || 0)
    } catch (error) {
      message.error('加载文档列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (value: string) => {
    setQuery(prev => ({ ...prev, search: value, page: 1 }))
  }

  const handlePageChange = (page: number, pageSize?: number) => {
    setQuery(prev => ({ ...prev, page, limit: pageSize || prev.limit }))
  }

  const handleDeleteDocument = async (docSlug: string) => {
    if (!spaceSlug) return
    
    try {
      await documentService.deleteDocument(spaceSlug, docSlug)
      message.success('文档删除成功')
      loadDocuments()
    } catch (error) {
      message.error('删除文档失败')
    }
  }

  const columns = [
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      render: (title: string, record: DocumentListItem) => (
        <div className="flex items-center">
          <FileTextOutlined className="mr-2 text-blue-500" />
          <span 
            className="cursor-pointer hover:text-blue-500"
            onClick={() => navigate(`/docs/${record.id}`)}
          >
            {title}
          </span>
          {!record.is_public && (
            <Tag color="orange" className="ml-2">
              私有
            </Tag>
          )}
        </div>
      )
    },
    {
      title: '摘要',
      dataIndex: 'excerpt',
      key: 'excerpt',
      render: (excerpt: string) => (
        <Text type="secondary" className="line-clamp-2">
          {excerpt || '暂无摘要'}
        </Text>
      )
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleDateString()
    },
    {
      title: '更新时间',
      dataIndex: 'updated_at',
      key: 'updated_at',
      render: (date: string) => new Date(date).toLocaleDateString()
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: DocumentListItem) => (
        <Dropdown
          menu={{
            items: [
              {
                key: 'view',
                label: '查看',
                icon: <EyeOutlined />,
                onClick: () => navigate(`/docs/${record.id}`)
              },
              {
                key: 'edit',
                label: '编辑',
                icon: <EditOutlined />,
                onClick: () => navigate(`/docs/${record.id}/edit`)
              },
              {
                key: 'delete',
                label: '删除',
                icon: <DeleteOutlined />,
                danger: true,
                onClick: () => handleDeleteDocument(record.slug)
              }
            ]
          }}
          trigger={['click']}
        >
          <Button type="text" icon={<MoreOutlined />} />
        </Dropdown>
      )
    }
  ]

  return (
    <Layout className="min-h-screen bg-white">
      <Content className="p-6">
        {/* 面包屑导航 */}
        <Breadcrumb
          className="mb-6"
          items={[
            {
              title: (
                <span className="cursor-pointer" onClick={() => navigate('/dashboard')}>
                  <HomeOutlined />
                  <span className="ml-1">首页</span>
                </span>
              ),
            },
            {
              title: (
                <span className="cursor-pointer" onClick={() => navigate('/spaces')}>
                  <FolderOpenOutlined />
                  <span className="ml-1">空间管理</span>
                </span>
              ),
            },
            ...(currentSpace
              ? [{
                  title: (
                    <span className="cursor-pointer" onClick={() => navigate(`/spaces/${spaceSlug}`)}>
                      {currentSpace.name}
                    </span>
                  ),
                }]
              : []),
            {
              title: (
                <span>
                  <FileTextOutlined />
                  <span className="ml-1">文档管理</span>
                </span>
              ),
            },
          ]}
        />

        {/* 页面头部 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <Title level={2} className="mb-2">
              文档管理
              {currentSpace && (
                <Text type="secondary" className="ml-2 text-base font-normal">
                  - {currentSpace.name}
                </Text>
              )}
            </Title>
            <Text type="secondary">
              管理空间中的所有文档
            </Text>
          </div>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate(`/spaces/${spaceSlug}/docs/new`)}
          >
            创建文档
          </Button>
        </div>

        {/* 搜索和筛选 */}
        <Card className="mb-6">
          <div className="flex items-center space-x-4">
            <Search
              placeholder="搜索文档标题或内容"
              allowClear
              style={{ width: 300 }}
              onSearch={handleSearch}
              prefix={<SearchOutlined />}
            />
          </div>
        </Card>

        {/* 文档列表 */}
        <Card>
          <div className="mb-4">
            <Text type="secondary">
              文档数量: {documents?.length || 0} / 总数: {total || 0}
            </Text>
          </div>
          <Table
            columns={columns}
            dataSource={documents || []}
            rowKey="id"
            loading={loading}
            pagination={false}
          />
          
          <div className="flex justify-center mt-6">
            <Pagination
              current={query.page}
              total={total}
              pageSize={query.limit}
              showSizeChanger
              showQuickJumper
              showTotal={(total, range) => 
                `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
              }
              onChange={handlePageChange}
            />
          </div>
        </Card>
      </Content>
    </Layout>
  )
}

export default DocumentListPage
