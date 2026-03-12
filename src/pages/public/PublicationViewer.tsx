import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Layout,
  Typography,
  Tree,
  Spin,
  Empty,
  Button,
  Space,
  Tag,
  Divider,
  Breadcrumb,
  message,
  Affix,
  Input,
  Drawer,
  Menu
} from 'antd'
import {
  FileTextOutlined,
  HomeOutlined,
  SearchOutlined,
  MenuOutlined,
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  BookOutlined,
  ClockCircleOutlined,
  EyeOutlined
} from '@ant-design/icons'
import { publicationService, PublicationDocumentNode, PublicationDocument } from '@/services/publicationService'
import SEO from '@/components/SEO'
import type { DataNode, TreeProps } from 'antd/lib/tree'
import ReactMarkdown from 'react-markdown'
import dayjs from 'dayjs'

const { Content, Sider, Header } = Layout
const { Title, Text, Paragraph } = Typography
const { Search } = Input

interface PublicationViewerParams {
  slug: string
  docSlug?: string
}

const PublicationViewer: React.FC = () => {
  const params = useParams()
  const slug = params.slug
  const docSlug = params.docSlug
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [publication, setPublication] = useState<any>(null)
  const [documentTree, setDocumentTree] = useState<PublicationDocumentNode[]>([])
  const [currentDocument, setCurrentDocument] = useState<PublicationDocument | null>(null)
  const [collapsed, setCollapsed] = useState(false)
  const [mobileDrawerVisible, setMobileDrawerVisible] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [expandedKeys, setExpandedKeys] = useState<string[]>([])

  // 加载发布信息
  useEffect(() => {
    if (slug) {
      loadPublication()
      loadDocumentTree()
    }
  }, [slug])

  // 加载文档内容
  useEffect(() => {
    if (docSlug && slug) {
      loadDocument(docSlug)
    } else if (documentTree.length > 0 && !docSlug) {
      // 如果没有指定文档，加载第一个文档
      const firstDoc = findFirstDocument(documentTree)
      if (firstDoc) {
        navigate(`/p/${slug}/${firstDoc.slug}`, { replace: true })
      }
    }
  }, [docSlug, documentTree, slug])

  const loadPublication = async () => {
    try {
      const response = await publicationService.getPublication(slug!)
      setPublication(response.data)
    } catch (error) {
      message.error('加载发布信息失败')
    }
  }

  const loadDocumentTree = async () => {
    try {
      setLoading(true)
      const response = await publicationService.getPublicationTree(slug!)
      setDocumentTree(response.data)
      // 展开所有节点
      const keys = extractAllKeys(response.data)
      setExpandedKeys(keys)
    } catch (error) {
      message.error('加载文档目录失败')
    } finally {
      setLoading(false)
    }
  }

  const loadDocument = async (docSlug: string) => {
    try {
      const response = await publicationService.getPublicationDocument(slug!, docSlug)
      setCurrentDocument(response.data)
    } catch (error) {
      message.error('加载文档内容失败')
    }
  }

  // 查找第一个文档
  const findFirstDocument = (nodes: PublicationDocumentNode[]): PublicationDocumentNode | null => {
    for (const node of nodes) {
      if (node.children.length === 0) {
        return node
      }
      const firstChild = findFirstDocument(node.children)
      if (firstChild) return firstChild
    }
    return nodes[0] || null
  }

  // 提取所有节点的key
  const extractAllKeys = (nodes: PublicationDocumentNode[]): string[] => {
    let keys: string[] = []
    for (const node of nodes) {
      keys.push(node.id)
      if (node.children.length > 0) {
        keys = keys.concat(extractAllKeys(node.children))
      }
    }
    return keys
  }

  // 转换文档树为Ant Design树形数据
  const convertToTreeData = (nodes: PublicationDocumentNode[]): DataNode[] => {
    return nodes.map(node => ({
      title: (
        <span className="tree-node-title">
          {node.title}
          {node.children.length > 0 && (
            <Tag className="ml-2">
              {node.children.length}
            </Tag>
          )}
        </span>
      ),
      key: node.slug,
      icon: node.children.length > 0 ? <BookOutlined /> : <FileTextOutlined />,
      children: node.children.length > 0 ? convertToTreeData(node.children) : undefined,
    }))
  }

  const treeData = convertToTreeData(documentTree)

  const onTreeSelect: TreeProps['onSelect'] = (selectedKeys) => {
    const key = selectedKeys[0] as string
    if (key) {
      navigate(`/p/${slug}/${key}`)
    }
  }

  const handleSearch = (value: string) => {
    setSearchValue(value)
    if (!value) {
      const keys = extractAllKeys(documentTree)
      setExpandedKeys(keys)
    } else {
      // 实现搜索逻辑
      message.info('搜索功能即将推出')
    }
  }

  // 渲染侧边栏内容
  const renderSidebar = () => (
    <>
      <div className="p-4 border-b">
        <Title level={4} className="mb-2 text-gray-800">
          {publication?.title || '文档集'}
        </Title>
        {publication?.description && (
          <Text type="secondary" className="text-sm">
            {publication.description}
          </Text>
        )}
      </div>

      {publication?.enable_search !== false && (
        <div className="p-4 border-b">
          <Search
            placeholder="搜索文档..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onSearch={handleSearch}
            size="small"
          />
        </div>
      )}

      <div className="p-4 overflow-auto flex-1">
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <Spin />
          </div>
        ) : documentTree.length > 0 ? (
          <Tree
            treeData={treeData}
            selectedKeys={docSlug ? [docSlug] : []}
            expandedKeys={expandedKeys}
            onSelect={onTreeSelect}
            onExpand={(keys: any) => setExpandedKeys(keys as string[])}
            showIcon
            className="public-doc-tree"
          />
        ) : (
          <Empty description="暂无文档" />
        )}
      </div>

      <div className="p-4 border-t text-center text-sm text-gray-500">
        <Space direction="vertical" size="small">
          <Text type="secondary">
            版本 {publication?.version || '1'}
          </Text>
          <Text type="secondary">
            发布于 {publication?.published_at ? dayjs(publication.published_at).format('YYYY-MM-DD') : '-'}
          </Text>
        </Space>
      </div>
    </>
  )

  if (loading && !currentDocument) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <Spin size="large" />
          <div className="mt-3 text-gray-500">加载中...</div>
        </div>
      </div>
    )
  }

  return (
    <Layout className="min-h-screen">
      {/* SEO 优化 */}
      {currentDocument && publication && (
        <SEO
          title={`${currentDocument.title} - ${publication.title}`}
          description={currentDocument.excerpt || currentDocument.content.substring(0, 160) + '...'}
          keywords={`${currentDocument.title},${publication.title},文档,${slug}`}
          image={publication.cover_image}
          url={`${window.location.origin}/p/${slug}/${docSlug}`}
          type="article"
          publishedTime={currentDocument.created_at}
          modifiedTime={(currentDocument as any).updated_at}
          section={publication.title}
        />
      )}
      
      {/* 自定义样式 */}
      {publication?.custom_css && (
        <style dangerouslySetInnerHTML={{ __html: publication.custom_css }} />
      )}

      {/* 顶部导航 */}
      <Header className="bg-white border-b px-4 md:px-6 flex items-center justify-between">
        <div className="flex items-center">
          {/* 移动端菜单按钮 */}
          <Button
            type="text"
            icon={<MenuOutlined />}
            onClick={() => setMobileDrawerVisible(true)}
            className="md:hidden mr-2"
          />
          
          {/* Logo和标题 */}
          <Space>
            <BookOutlined className="text-xl text-blue-500" />
            <Title level={4} className="mb-0">
              {publication?.title || '文档中心'}
            </Title>
          </Space>
        </div>

        {/* 桌面端折叠按钮 */}
        <Button
          type="text"
          icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:block"
        />
      </Header>

      <Layout>
        {/* 桌面端侧边栏 */}
        <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          trigger={null}
          width={280}
          className="bg-gray-50 border-r hidden md:block"
          style={{ height: 'calc(100vh - 64px)', overflow: 'auto' }}
        >
          {renderSidebar()}
        </Sider>

        {/* 移动端抽屉 */}
        <Drawer
          title={publication?.title || '文档目录'}
          placement="left"
          onClose={() => setMobileDrawerVisible(false)}
          open={mobileDrawerVisible}
          width={280}
          className="md:hidden"
        >
          {renderSidebar()}
        </Drawer>

        {/* 主内容区域 */}
        <Content className="bg-white">
          {currentDocument ? (
            <div className="max-w-4xl mx-auto p-6 md:p-8">
              {/* 面包屑导航 */}
              <Breadcrumb
                className="mb-6"
                items={[
                  {
                    title: (
                      <span className="cursor-pointer" onClick={() => navigate(`/p/${slug}`)}>
                        <HomeOutlined />
                        <span className="ml-1">{publication?.title || '文档'}</span>
                      </span>
                    ),
                  },
                  {
                    title: currentDocument.title,
                  },
                ]}
              />

              {/* 文档标题 */}
              <Title level={1} className="mb-4">
                {currentDocument.title}
              </Title>

              {/* 文档元信息 */}
              <div className="flex items-center gap-4 text-gray-500 text-sm mb-6">
                <Space>
                  <ClockCircleOutlined />
                  <span>阅读时间约 {currentDocument.reading_time} 分钟</span>
                </Space>
                <Space>
                  <FileTextOutlined />
                  <span>{currentDocument.word_count} 字</span>
                </Space>
              </div>

              <Divider />

              {/* 文档内容 */}
              <div className="prose prose-lg max-w-none">
                <ReactMarkdown
                  components={{
                    // 自定义渲染组件
                    h1: ({ children }) => <h1 className="text-3xl font-bold mt-8 mb-4">{children}</h1>,
                    h2: ({ children }) => <h2 className="text-2xl font-bold mt-6 mb-3">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-xl font-bold mt-4 mb-2">{children}</h3>,
                    p: ({ children }) => <p className="mb-4 leading-relaxed">{children}</p>,
                    ul: ({ children }) => <ul className="list-disc list-inside mb-4">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal list-inside mb-4">{children}</ol>,
                    li: ({ children }) => <li className="mb-2">{children}</li>,
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-4 border-gray-300 pl-4 my-4 italic">
                        {children}
                      </blockquote>
                    ),
                    code: ({ children, ...props }: any) => {
                      const isInline = true
                      return isInline ? (
                        <code className="bg-gray-100 px-1 py-0.5 rounded text-sm" {...props}>
                          {children}
                        </code>
                      ) : (
                        <pre className="bg-gray-100 p-4 rounded overflow-x-auto">
                          <code {...props}>{children}</code>
                        </pre>
                      )
                    }
                  }}
                >
                  {currentDocument.content}
                </ReactMarkdown>
              </div>
            </div>
          ) : (
            <div className="flex justify-center items-center h-96">
              <Empty description="请从左侧选择文档" />
            </div>
          )}
        </Content>
      </Layout>

      {/* 自定义脚本 */}
      {publication?.custom_js && (
        <script dangerouslySetInnerHTML={{ __html: publication.custom_js }} />
      )}
    </Layout>
  )
}

export default PublicationViewer
