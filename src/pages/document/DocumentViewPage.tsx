import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Layout,
  Typography,
  Button,
  Breadcrumb,
  Spin,
  Empty,
  Card,
  Space,
  Tag,
  Dropdown,
  Affix,
  Anchor,
  FloatButton,
  message,
  Tree
} from 'antd'
import {
  EditOutlined,
  ShareAltOutlined,
  BookOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  MoreOutlined,
  HomeOutlined,
  FolderOpenOutlined,
  FileTextOutlined,
  PrinterOutlined,
  DownloadOutlined
} from '@ant-design/icons'
import { useDocStore } from '@/stores/docStore'
import { useSpaceStore } from '@/stores/spaceStore'
import { documentService } from '@/services/documentService'
import type { RouteParams, DocumentTreeNode } from '@/types'
import type { DataNode, TreeProps } from 'antd/lib/tree'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

const { Content, Sider } = Layout
const { Title, Text } = Typography

interface DocumentParams extends RouteParams {
  spaceSlug: string
  docSlug: string
}

const DocumentViewPage: React.FC = () => {
  const { spaceSlug, docSlug } = useParams<DocumentParams>()
  
  const navigate = useNavigate()
  const { currentDocument, loadDocument, loading, documentTree, loadDocumentTree } = useDocStore()
  const { currentSpace, loadSpace } = useSpaceStore()
  const [breadcrumbs, setBreadcrumbs] = useState<any[]>([])
  const [tocItems, setTocItems] = useState<any[]>([])
  const [expandedKeys, setExpandedKeys] = useState<string[]>([])
  const [selectedKeys, setSelectedKeys] = useState<string[]>([])

  useEffect(() => {
    if (spaceSlug && docSlug) {
      loadSpace(spaceSlug)
      loadDocument(spaceSlug, docSlug)
      loadDocumentTree(spaceSlug)
      loadBreadcrumbs(spaceSlug, docSlug)
    }
  }, [spaceSlug, docSlug])

  // 当文档加载完成后，设置选中状态
  useEffect(() => {
    if (currentDocument?.id) {
      setSelectedKeys([currentDocument.id])
    }
  }, [currentDocument])

  useEffect(() => {
    if (currentDocument?.content) {
      generateTOC(currentDocument.content)
    }
  }, [currentDocument])

  const loadBreadcrumbs = async (spaceSlug: string, docSlug: string) => {
    try {
      const response = await documentService.getDocumentBreadcrumbs(spaceSlug, docSlug)
      setBreadcrumbs(response.data)
    } catch (error) {
      console.error('Failed to load breadcrumbs:', error)
    }
  }

  const generateTOC = (content: string) => {
    const lines = content.split('\n')
    const headings: any[] = []
    
    lines.forEach((line, index) => {
      const match = line.match(/^(#{1,6})\s+(.+)$/)
      if (match) {
        const level = match[1].length
        const title = match[2]
        const id = `heading-${index}`
        headings.push({
          key: id,
          href: `#${id}`,
          title,
          level,
          children: []
        })
      }
    })
    
    setTocItems(headings)
  }

  const handleEdit = () => {
    navigate(`/spaces/${spaceSlug}/docs/${docSlug}/edit`)
  }

  const handleShare = () => {
    const url = window.location.href
    navigator.clipboard.writeText(url).then(() => {
      message.success('链接已复制到剪贴板')
    })
  }

  const handleExport = async (format: 'pdf' | 'html' | 'markdown') => {
    try {
      const blob = await documentService.exportDocument(spaceSlug!, docSlug!, format)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${currentDocument?.title}.${format}`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      message.error('导出失败')
    }
  }

  // 转换文档树数据
  const convertToTreeData = (nodes: DocumentTreeNode[]): DataNode[] => {
    return nodes.map(node => ({
      key: node.id,
      title: (
        <div className="flex items-center">
          <FileTextOutlined className="mr-2 text-blue-500" />
          <span className="truncate">{node.title}</span>
          {!node.is_public && (
            <Tag color="orange" className="ml-2">
              草稿
            </Tag>
          )}
        </div>
      ),
      children: node.children?.length ? convertToTreeData(node.children) : undefined,
      isLeaf: !node.children?.length
    }))
  }

  // 文档树选择事件
  const onTreeSelect: TreeProps['onSelect'] = (selectedKeys) => {
    const key = selectedKeys[0] as string
    if (key && key !== currentDocument?.id) {
      const cleanId = key.replace(/^document:/, '')
      navigate(`/docs/${cleanId}`)
    }
  }

  // 文档树展开事件
  const onTreeExpand: TreeProps['onExpand'] = (expandedKeys) => {
    setExpandedKeys(expandedKeys as string[])
  }

  const markdownComponents = {
    code({ node, inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '')
      return !inline && match ? (
        <SyntaxHighlighter
          style={tomorrow}
          language={match[1]}
          PreTag="div"
          {...props}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      ) : (
        <code className={className} {...props}>
          {children}
        </code>
      )
    },
    h1: ({ children, ...props }: any) => (
      <h1 id={`heading-${props.key}`} {...props}>
        {children}
      </h1>
    ),
    h2: ({ children, ...props }: any) => (
      <h2 id={`heading-${props.key}`} {...props}>
        {children}
      </h2>
    ),
    h3: ({ children, ...props }: any) => (
      <h3 id={`heading-${props.key}`} {...props}>
        {children}
      </h3>
    ),
    h4: ({ children, ...props }: any) => (
      <h4 id={`heading-${props.key}`} {...props}>
        {children}
      </h4>
    ),
    h5: ({ children, ...props }: any) => (
      <h5 id={`heading-${props.key}`} {...props}>
        {children}
      </h5>
    ),
    h6: ({ children, ...props }: any) => (
      <h6 id={`heading-${props.key}`} {...props}>
        {children}
      </h6>
    ),
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Spin size="large" />
          <div className="mt-3 text-gray-500">加载中...</div>
        </div>
      </div>
    )
  }

  if (!currentDocument) {
    return (
      <div className="flex items-center justify-center h-96">
        <Empty description="文档未找到" />
      </div>
    )
  }

  return (
    <Layout className="min-h-screen bg-white">
      {/* 文档树侧边栏 */}
      {documentTree.length > 0 && (
        <Sider width={280} className="bg-gray-50 border-r" theme="light">
          <Affix offsetTop={0}>
            <div className="p-4 h-screen overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <Title level={5} className="mb-0">
                  文档列表
                </Title>
                <Button 
                  type="text" 
                  size="small"
                  onClick={() => navigate(`/spaces/${spaceSlug}`)}
                >
                  返回空间
                </Button>
              </div>
              <Tree
                treeData={convertToTreeData(documentTree)}
                onSelect={onTreeSelect}
                onExpand={onTreeExpand}
                expandedKeys={expandedKeys}
                selectedKeys={selectedKeys}
                showLine
                showIcon
                blockNode
                className="document-tree"
              />
            </div>
          </Affix>
        </Sider>
      )}

      <Layout>
        {/* 目录侧边栏 */}
        {tocItems.length > 0 && (
          <Sider width={250} className="bg-gray-50 border-r" theme="light">
            <Affix offsetTop={0}>
              <div className="p-4 h-screen overflow-y-auto">
                <Title level={5} className="mb-4">
                  目录
                </Title>
                <Anchor
                  affix={false}
                  bounds={20}
                  items={tocItems}
                  className="toc-anchor"
                />
              </div>
            </Affix>
          </Sider>
        )}

        {/* 主内容区 */}
        <Content className="bg-white">
        <div className="max-w-4xl mx-auto p-6">
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
                  <span className="cursor-pointer" onClick={() => navigate(`/spaces/${spaceSlug}`)}>
                    <FolderOpenOutlined />
                    <span className="ml-1">{currentSpace?.name}</span>
                  </span>
                ),
              },
              ...breadcrumbs.map((item) => ({
                key: item.id,
                title: (
                  <span className="cursor-pointer" onClick={() => navigate(`/spaces/${spaceSlug}/docs/${item.slug}`)}>
                    <FileTextOutlined />
                    <span className="ml-1">{item.title}</span>
                  </span>
                ),
              })),
            ]}
          />

          {/* 文档头部 */}
          <Card className="mb-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <Title level={1} className="mb-2">
                  {currentDocument.title}
                </Title>
                
                <div className="flex items-center space-x-4 mb-4">
                  <Tag color={currentDocument.is_published ? 'green' : 'orange'}>
                    {currentDocument.is_published ? '已发布' : '草稿'}
                  </Tag>
                  <Text type="secondary">
                    <ClockCircleOutlined className="mr-1" />
                    更新时间：{dayjs(currentDocument.updated_at).fromNow()}
                  </Text>
                  <Text type="secondary">
                    <EyeOutlined className="mr-1" />
                    阅读时间：{currentDocument.reading_time || 5} 分钟
                  </Text>
                  <Text type="secondary">
                    <BookOutlined className="mr-1" />
                    {currentDocument.word_count} 字
                  </Text>
                </div>
                
                {currentDocument.excerpt && (
                  <Text type="secondary" className="text-lg">
                    {currentDocument.excerpt}
                  </Text>
                )}
              </div>
              
              <div className="flex space-x-2">
                <Button 
                  icon={<EditOutlined />}
                  onClick={handleEdit}
                >
                  编辑
                </Button>
                <Button 
                  icon={<ShareAltOutlined />}
                  onClick={handleShare}
                >
                  分享
                </Button>
                <Dropdown
                  menu={{
                    items: [
                      {
                        key: 'print',
                        label: '打印',
                        icon: <PrinterOutlined />,
                        onClick: () => window.print()
                      },
                      {
                        key: 'export-pdf',
                        label: '导出 PDF',
                        icon: <DownloadOutlined />,
                        onClick: () => handleExport('pdf')
                      },
                      {
                        key: 'export-html',
                        label: '导出 HTML',
                        icon: <DownloadOutlined />,
                        onClick: () => handleExport('html')
                      },
                      {
                        key: 'export-markdown',
                        label: '导出 Markdown',
                        icon: <DownloadOutlined />,
                        onClick: () => handleExport('markdown')
                      }
                    ]
                  }}
                >
                  <Button icon={<MoreOutlined />} />
                </Dropdown>
              </div>
            </div>
          </Card>

          {/* 文档内容 */}
          <Card>
            <div className="markdown-content prose prose-lg max-w-none">
              <ReactMarkdown
                components={markdownComponents}
              >
                {currentDocument.content}
              </ReactMarkdown>
            </div>
          </Card>
        </div>
        </Content>

        {/* 回到顶部 */}
        <FloatButton.BackTop />
      </Layout>
    </Layout>
  )
}

export default DocumentViewPage
