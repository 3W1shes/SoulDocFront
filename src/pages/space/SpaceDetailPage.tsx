import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Layout,
  Typography,
  Button,
  Tree,
  Breadcrumb,
  Spin,
  Empty,
  Dropdown,
  Card,
  Space,
  Statistic,
  Tag,
  App
} from 'antd'
import {
  FileTextOutlined,
  PlusOutlined,
  SettingOutlined,
  MoreOutlined,
  FolderOpenOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  HomeOutlined,
  GlobalOutlined,
  CheckOutlined
} from '@ant-design/icons'
import type { DataNode, TreeProps } from 'antd/lib/tree'
import { useSpaceStore } from '@/stores/spaceStore'
import { useDocStore } from '@/stores/docStore'
import { documentService } from '@/services/documentService'
import { spaceService } from '@/services/spaceService'
import type { DocumentTreeNode, CreateDocumentRequest } from '@/types'

const { Content, Sider } = Layout
const { Title, Text } = Typography

type SpaceParams = {
  spaceSlug: string
}

const SpaceDetailPage: React.FC = () => {
  const { message, modal } = App.useApp()
  const { spaceSlug } = useParams() as SpaceParams
  const navigate = useNavigate()
  const { currentSpace, loadSpace, loading: spaceLoading } = useSpaceStore()
  const { 
    documentTree, 
    loadDocumentTree, 
    createDocument,
    deleteDocumentById,
    loading: docLoading 
  } = useDocStore()
  
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null)
  const [expandedKeys, setExpandedKeys] = useState<string[]>([])
  const [spaceStats, setSpaceStats] = useState<any>(null)
  const [publishingAll, setPublishingAll] = useState(false)

  useEffect(() => {
    if (spaceSlug) {
      loadSpace(spaceSlug)
      loadDocumentTree(spaceSlug)
      loadSpaceStats(spaceSlug)
    }
  }, [spaceSlug])

  const loadSpaceStats = async (slug: string) => {
    try {
      const response = await spaceService.getSpaceStats(slug)
      setSpaceStats(response?.data || {})
    } catch (error) {
      console.error('Failed to load space stats:', error)
    }
  }

  const convertToTreeData = (nodes: DocumentTreeNode[]): DataNode[] => {
    return nodes.map(node => ({
      key: node.id, // 使用ID而不是slug作为key
      title: (
        <div className="flex items-center justify-between group">
          <span 
            className="flex items-center flex-1 cursor-pointer"
            onClick={() => navigate(`/docs/${node.id}`)}
          >
            <FileTextOutlined className="mr-2 text-blue-500" />
            {node.title}
            {!node.is_public && (
              <Tag color="orange" className="ml-2">
                草稿
              </Tag>
            )}
          </span>
          <div 
            className="opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={e => e.stopPropagation()}
          >
            <Dropdown
              menu={{
                items: [
                  {
                    key: 'view',
                    label: '查看',
                    icon: <EyeOutlined />,
                    onClick: () => navigate(`/docs/${node.id}`)
                  },
                  {
                    key: 'edit',
                    label: '编辑',
                    icon: <EditOutlined />,
                    onClick: () => navigate(`/docs/${node.id}/edit`)
                  },
                  {
                    type: 'divider'
                  },
                  {
                    key: 'add-child',
                    label: '添加子页面',
                    icon: <PlusOutlined />,
                    onClick: () => navigate(`/spaces/${spaceSlug}/docs/new?parent_id=${node.id}&parent_title=${encodeURIComponent(node.title)}`)
                  },
                  {
                    type: 'divider'
                  },
                  {
                    key: 'delete',
                    label: '删除',
                    icon: <DeleteOutlined />,
                    danger: true,
                    onClick: () => handleDeleteDocument(node.id)
                  }
                ]
              }}
              trigger={['click']}
            >
              <Button 
                type="text" 
                size="small" 
                icon={<MoreOutlined />}
                onClick={e => e.stopPropagation()}
              />
            </Dropdown>
          </div>
        </div>
      ),
      children: node.children?.length ? convertToTreeData(node.children) : undefined,
      isLeaf: !node.children?.length
    }))
  }

  const handleDeleteDocument = (docId: string) => {
    modal.confirm({
      title: '确认删除',
      content: '确定要删除这个文档吗？此操作不可恢复。',
      onOk: async () => {
        try {
          await deleteDocumentById(docId, spaceSlug) // 使用ID删除文档并刷新树
          if (spaceSlug) {
            await loadSpaceStats(spaceSlug)
          }
          message.success('文档删除成功')
        } catch (error) {
          message.error('删除文档失败')
        }
      }
    })
  }

  // 收集所有文档ID的递归函数
  const collectAllDocumentIds = (nodes: DocumentTreeNode[]): string[] => {
    const ids: string[] = []
    nodes.forEach(node => {
      ids.push(node.id)
      if (node.children && node.children.length > 0) {
        ids.push(...collectAllDocumentIds(node.children))
      }
    })
    return ids
  }

  // 批量发布所有文档
  const handlePublishAllDocuments = async () => {
    if (!spaceSlug || documentTree.length === 0) {
      message.warning('没有可发布的文档')
      return
    }

    const allDocIds = collectAllDocumentIds(documentTree)
    const unpublishedDocs = documentTree.filter(doc => !doc.is_public)
    
    if (unpublishedDocs.length === 0) {
      message.info('所有文档都已经是公开状态')
      return
    }

    modal.confirm({
      title: '批量发布文档集',
      content: (
        <div>
          <p>确定要将整个文档集（共 {allDocIds.length} 个文档）发布为公开状态吗？</p>
          <p className="text-gray-600 text-sm mt-2">
            这将包括所有主文档和子文档，发布后所有人都可以访问。
          </p>
        </div>
      ),
      onOk: async () => {
        setPublishingAll(true)
        try {
          await documentService.batchPublishDocuments(spaceSlug, allDocIds, true)
          message.success(`成功发布 ${allDocIds.length} 个文档`)
          // 重新加载文档树以更新状态
          loadDocumentTree(spaceSlug)
        } catch (error) {
          message.error('批量发布失败')
          console.error('Batch publish error:', error)
        } finally {
          setPublishingAll(false)
        }
      }
    })
  }


  const onTreeSelect: TreeProps['onSelect'] = (selectedKeys) => {
    const key = selectedKeys[0] as string
    if (key) {
      setSelectedDoc(key)
      navigate(`/docs/${key}`) // 使用文档ID导航
    }
  }

  const onTreeExpand: TreeProps['onExpand'] = (expandedKeys) => {
    setExpandedKeys(expandedKeys as string[])
  }

  if (spaceLoading || docLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Spin size="large" />
          <div className="mt-3 text-gray-500">加载中...</div>
        </div>
      </div>
    )
  }

  if (!currentSpace) {
    return (
      <div className="flex items-center justify-center h-96">
        <Empty description="空间未找到" />
      </div>
    )
  }

  return (
    <Layout className="min-h-screen">
      {/* 侧边栏 */}
      <Sider width={300} className="bg-white border-r">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <Title level={4} className="mb-0">
              {currentSpace.name}
            </Title>
            <Space>
              <Button
                icon={<FileTextOutlined />}
                onClick={() => navigate(`/spaces/${spaceSlug}/docs`)}
              >
                文档管理
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => navigate(`/spaces/${spaceSlug}/docs/new`)}
              >
                新建文档
              </Button>
            </Space>
          </div>
          
          <Text type="secondary" className="block mb-4">
            {currentSpace.description}
          </Text>

          {/* 空间统计 */}
          {spaceStats && (
            <Card size="small" className="mb-4">
              <div className="grid grid-cols-2 gap-2 text-center">
                <div>
                  <Statistic 
                    title="文档" 
                    value={spaceStats.document_count}
                    prefix={<FileTextOutlined />}
                    valueStyle={{ fontSize: '14px' }}
                  />
                </div>
                <div>
                  <Statistic 
                    title="浏览量" 
                    value={spaceStats.view_count}
                    prefix={<EyeOutlined />}
                    valueStyle={{ fontSize: '14px' }}
                  />
                </div>
              </div>
            </Card>
          )}

          {/* 文档树 */}
          <div className="document-tree">
            {documentTree.length > 0 ? (
              <Tree
                treeData={convertToTreeData(documentTree)}
                onSelect={() => {}} // 禁用默认选择行为
                onExpand={onTreeExpand}
                expandedKeys={expandedKeys}
                selectedKeys={[]} // 不显示选中状态
                showLine
                showIcon
                blockNode
                selectable={false} // 禁用选择功能
              />
            ) : (
              <Empty 
                description="暂无文档" 
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )}
          </div>
        </div>
      </Sider>

      {/* 主内容区 */}
      <Content className="bg-gray-50">
        <div className="p-6">
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
                  <span>
                    <FolderOpenOutlined />
                    <span className="ml-1">{currentSpace.name}</span>
                  </span>
                ),
              },
            ]}
          />

          {/* 空间信息 */}
          <Card className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <Title level={3} className="mb-2">
                  {currentSpace.name}
                </Title>
                <Text type="secondary" className="text-lg">
                  {currentSpace.description}
                </Text>
                <div className="mt-4 flex items-center space-x-4">
                  <Tag color={currentSpace.is_public ? 'green' : 'orange'}>
                    {currentSpace.is_public ? '公开' : '私有'}
                  </Tag>
                  <Text type="secondary">
                    创建时间：{new Date(currentSpace.created_at).toLocaleDateString()}
                  </Text>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button 
                  icon={<SettingOutlined />}
                  onClick={() => navigate(`/spaces/${spaceSlug}/settings`)}
                >
                  设置
                </Button>
                {/* {documentTree.length > 0 && (
                  <Button 
                    icon={<GlobalOutlined />}
                    loading={publishingAll}
                    onClick={handlePublishAllDocuments}
                  >
                    发布文档集
                  </Button>
                )} */}
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />}
                  onClick={() => navigate(`/spaces/${spaceSlug}/docs/new`)}
                >
                  创建文档
                </Button>
              </div>
            </div>
          </Card>

          {/* 欢迎页面或选择文档提示 */}
          <Card>
            <div className="text-center py-16">
              <FolderOpenOutlined className="text-6xl text-gray-400 mb-4" />
              <Title level={3} className="text-gray-600 mb-2">
                欢迎来到 {currentSpace.name}
              </Title>
              <Text type="secondary" className="text-lg mb-6 block">
                从左侧文档列表选择一个文档开始阅读，或者创建新的文档。
              </Text>
              <Space>
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />}
                  onClick={() => navigate(`/spaces/${spaceSlug}/docs/new`)}
                >
                  创建第一个文档
                </Button>
                <Button 
                  icon={<EyeOutlined />}
                  onClick={() => navigate(`/spaces/${spaceSlug}/docs`)}
                >
                  浏览所有文档
                </Button>
              </Space>
            </div>
          </Card>
        </div>
      </Content>

    </Layout>
  )
}

export default SpaceDetailPage
