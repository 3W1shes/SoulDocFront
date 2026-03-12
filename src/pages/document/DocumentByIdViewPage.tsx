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
  Drawer,
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
  DownloadOutlined,
  MenuOutlined
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
  docId: string
}

const DocumentByIdViewPage: React.FC = () => {
  const { docId } = useParams<DocumentParams>()
  const navigate = useNavigate()
  const { currentDocument, loadDocumentById, loading, documentTree } = useDocStore()
  const { currentSpace, loadSpace } = useSpaceStore()
  
  const [headings, setHeadings] = useState<{ id: string; text: string; level: number }[]>([])
  const [spaceInfo, setSpaceInfo] = useState<any>(null)
  const [drawerVisible, setDrawerVisible] = useState(false)
  const [treeDrawerVisible, setTreeDrawerVisible] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [expandedKeys, setExpandedKeys] = useState<string[]>([])
  const [selectedKeys, setSelectedKeys] = useState<string[]>([])

  // 检测屏幕尺寸
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 1024)
    }
    
    checkIsMobile()
    window.addEventListener('resize', checkIsMobile)
    return () => window.removeEventListener('resize', checkIsMobile)
  }, [])

  useEffect(() => {
    if (docId) {
      loadDocumentById(docId)
    }
  }, [docId, loadDocumentById])

  // 使用currentSpace中的信息
  useEffect(() => {
    if (currentSpace) {
      setSpaceInfo({ 
        id: currentSpace.id, 
        name: currentSpace.name, 
        slug: currentSpace.slug 
      })
    }
  }, [currentSpace])

  // 当文档加载完成后，使用currentSpace设置空间信息
  useEffect(() => {
    if (currentSpace) {
      setSpaceInfo({ 
        id: currentSpace.id, 
        name: currentSpace.name, 
        slug: currentSpace.slug 
      })
    }
  }, [currentSpace])

  // 当文档加载完成后，设置选中状态
  useEffect(() => {
    if (currentDocument?.id) {
      setSelectedKeys([currentDocument.id])
    }
  }, [currentDocument])


  // 从markdown内容中提取标题
  useEffect(() => {
    if (currentDocument?.content) {
      const headingRegex = /^(#{1,6})\s+(.+)$/gm
      const matches = []
      let match

      while ((match = headingRegex.exec(currentDocument.content)) !== null) {
        matches.push({
          id: `heading-${matches.length}`,
          text: match[2],
          level: match[1].length
        })
      }
      setHeadings(matches)
    }
  }, [currentDocument?.content])

  const handleShare = () => {
    const url = window.location.href
    navigator.clipboard.writeText(url)
    message.success('链接已复制到剪贴板')
  }

  const handleExport = async (format: 'pdf' | 'html' | 'markdown') => {
    if (!currentDocument) return
    
    try {
      // 注意：这里需要有空间slug，可能需要从空间信息中获取
      // 暂时使用文档ID作为标识
      message.info(`导出功能开发中，格式：${format}`)
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


  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Spin size="large" />
          <div className="mt-3 text-gray-500">加载中...</div>
        </div>
      </div>
    )
  }

  if (!currentDocument) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Empty 
          description="文档未找到" 
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </div>
    )
  }

  const anchorItems = headings.map(heading => ({
    key: heading.id,
    href: `#${heading.id}`,
    title: heading.text
  }))

  // 目录内容组件
  const TableOfContents = () => (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow-md p-4 mb-4">
        <div className="flex items-center mb-4">
          <BookOutlined className="mr-3 text-blue-500 text-xl" />
          <Text strong className="text-lg text-gray-800">目录导航</Text>
        </div>
        <div className="max-h-96 overflow-y-auto">
          <Anchor
            items={anchorItems.map(item => ({
              ...item,
              title: (
                <span className="text-gray-600 hover:text-blue-600 transition-colors leading-relaxed">
                  {item.title}
                </span>
              )
            }))}
            offsetTop={100}
            bounds={20}
            className="text-sm"
          />
        </div>
      </div>
      
      {/* 文档信息卡片 */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-800 mb-2">
            {currentDocument.word_count || 0}
          </div>
          <div className="text-sm text-gray-500 mb-4">字数统计</div>
          <div className="text-xs text-gray-400">
            最后更新：{dayjs(currentDocument.updated_at).format('YYYY-MM-DD HH:mm')}
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <Layout className="min-h-screen" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <Content className="max-w-7xl mx-auto p-3 sm:p-6">
        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
          {/* 头部工具栏 */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100 px-4 sm:px-8 py-4 sm:py-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              {/* 面包屑导航 */}
              <Breadcrumb
                className="text-gray-600 flex-1 min-w-0"
                items={[
                  {
                    title: (
                      <span className="cursor-pointer hover:text-blue-600 transition-colors" onClick={() => navigate('/dashboard')}>
                        <HomeOutlined className="text-blue-500" />
                        <span className="ml-2">首页</span>
                      </span>
                    ),
                  },
                  ...(spaceInfo
                    ? [{
                        title: (
                          <span className="cursor-pointer hover:text-green-600 transition-colors" onClick={() => navigate(`/spaces/${spaceInfo.slug}`)}>
                            <FolderOpenOutlined className="text-green-500" />
                            <span className="ml-2">{spaceInfo.name}</span>
                          </span>
                        ),
                      }]
                    : []),
                  {
                    title: (
                      <span>
                        <FileTextOutlined className="text-purple-500" />
                        <span className="ml-2 font-medium text-gray-800 truncate">{currentDocument.title}</span>
                      </span>
                    ),
                  },
                ]}
              />

              {/* 操作按钮 */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* 移动端按钮 */}
                {isMobile && (
                  <>
                    {documentTree.length > 0 && (
                      <Button
                        icon={<FolderOpenOutlined />}
                        onClick={() => setTreeDrawerVisible(true)}
                        className="shadow-md hover:shadow-lg transition-shadow"
                      />
                    )}
                    {headings.length > 0 && (
                      <Button
                        icon={<MenuOutlined />}
                        onClick={() => setDrawerVisible(true)}
                        className="shadow-md hover:shadow-lg transition-shadow"
                      />
                    )}
                  </>
                )}
                
                <Space size="small" wrap>
                  <Button
                    type="primary"
                    size={isMobile ? "middle" : "large"}
                    icon={<EditOutlined />}
                    onClick={() => navigate(`/docs/${docId}/edit`)}
                    className="shadow-md hover:shadow-lg transition-shadow"
                  >
                    {isMobile ? '编辑' : '编辑文档'}
                  </Button>
                  <Button
                    size={isMobile ? "middle" : "large"}
                    icon={<ShareAltOutlined />}
                    onClick={handleShare}
                    className="shadow-md hover:shadow-lg transition-shadow"
                  >
                    分享
                  </Button>
                  <Dropdown
                    menu={{
                      items: [
                        {
                          key: 'pdf',
                          label: '导出为PDF',
                          icon: <DownloadOutlined />,
                          onClick: () => handleExport('pdf')
                        },
                        {
                          key: 'html',
                          label: '导出为HTML',
                          icon: <DownloadOutlined />,
                          onClick: () => handleExport('html')
                        },
                        {
                          key: 'markdown',
                          label: '导出为Markdown',
                          icon: <DownloadOutlined />,
                          onClick: () => handleExport('markdown')
                        }
                      ]
                    }}
                  >
                    <Button 
                      size={isMobile ? "middle" : "large"} 
                      icon={<MoreOutlined />} 
                      className="shadow-md hover:shadow-lg transition-shadow"
                    >
                      {isMobile ? '' : '更多操作'}
                    </Button>
                  </Dropdown>
                </Space>
              </div>
            </div>
          </div>

          {/* 文档内容区域 */}
          <div className="bg-white flex flex-row h-full">
            {/* 文档树侧边栏 - 桌面端 */}
            {!isMobile && documentTree.length > 0 && (
              <div className="w-80 bg-gray-50 border-r border-gray-200 flex-shrink-0">
                <div className="p-4 h-full overflow-y-auto">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-lg font-semibold text-gray-800">
                      文档列表
                    </div>
                    {spaceInfo && (
                      <Button 
                        type="text" 
                        size="small"
                        onClick={() => navigate(`/spaces/${spaceInfo.slug}`)}
                      >
                        返回空间
                      </Button>
                    )}
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
              </div>
            )}
            
            {/* 主内容 */}
            <div className="flex-1 px-4 sm:px-8 lg:px-12 py-6 sm:py-8">
              <div className={`${!isMobile && headings.length > 0 ? 'lg:pr-80' : ''}`}>
                <article className="prose prose-lg max-w-none">
                  {/* 文档头部信息 */}
                  <div className="mb-8 sm:mb-12 pb-6 sm:pb-8 border-b-2 border-gray-100">
                    <div className="text-center mb-6 sm:mb-8">
                      <Title 
                        level={1} 
                        className="mb-4 sm:mb-6 text-gray-800 font-bold"
                        style={{ 
                          fontSize: isMobile ? '1.75rem' : '2.5rem',
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text'
                        }}
                      >
                        {currentDocument.title}
                      </Title>
                    </div>
                    
                    <div className="flex items-center justify-center flex-wrap gap-3 sm:gap-6 text-gray-600">
                      <div className="flex items-center bg-blue-50 px-3 sm:px-4 py-2 rounded-full">
                        <ClockCircleOutlined className="text-blue-500 mr-2" />
                        <Text type="secondary" className="font-medium text-xs sm:text-sm">
                          {dayjs(currentDocument.updated_at).fromNow()}更新
                        </Text>
                      </div>
                      
                      <div className="flex items-center bg-green-50 px-3 sm:px-4 py-2 rounded-full">
                        <EyeOutlined className="text-green-500 mr-2" />
                        <Text type="secondary" className="font-medium text-xs sm:text-sm">
                          阅读时间约 {currentDocument.reading_time || 1} 分钟
                        </Text>
                      </div>
                      
                      <Tag 
                        color={currentDocument.is_public ? 'green' : 'orange'}
                        className="px-3 sm:px-4 py-1 text-xs sm:text-sm font-medium rounded-full"
                      >
                        {currentDocument.is_public ? '🌍 公开文档' : '🔒 私有文档'}
                      </Tag>
                    </div>
                  </div>

                  {/* Markdown 内容渲染 */}
                  <div 
                    className="markdown-body leading-relaxed"
                    style={{
                      lineHeight: '1.8',
                      fontSize: isMobile ? '14px' : '16px',
                      color: '#374151'
                    }}
                  >
                  <ReactMarkdown
                    components={{
                      code({ node, className, children, ...props }: any) {
                        const match = /language-(\w+)/.exec(className || '')
                        const isInline = !match
                        return !isInline ? (
                          <div className="my-6 rounded-lg overflow-hidden shadow-md">
                            <SyntaxHighlighter
                              style={tomorrow as any}
                              language={match[1]}
                              PreTag="div"
                              customStyle={{
                                margin: 0,
                                borderRadius: '0.5rem',
                                fontSize: '14px',
                                lineHeight: '1.6'
                              }}
                              {...props}
                            >
                              {String(children).replace(/\n$/, '')}
                            </SyntaxHighlighter>
                          </div>
                        ) : (
                          <code 
                            className={`${className} bg-gray-100 px-2 py-1 rounded text-sm font-mono text-red-600`} 
                            {...props}
                          >
                            {children}
                          </code>
                        )
                      },
                      h1: ({ children }) => (
                        <h1 
                          id={`heading-${headings.findIndex(h => h.text === String(children))}`}
                          className="text-3xl font-bold mt-12 mb-6 text-gray-800 border-b-2 border-blue-200 pb-3"
                        >
                          {children}
                        </h1>
                      ),
                      h2: ({ children }) => (
                        <h2 
                          id={`heading-${headings.findIndex(h => h.text === String(children))}`}
                          className="text-2xl font-bold mt-10 mb-5 text-gray-800"
                        >
                          {children}
                        </h2>
                      ),
                      h3: ({ children }) => (
                        <h3 
                          id={`heading-${headings.findIndex(h => h.text === String(children))}`}
                          className="text-xl font-bold mt-8 mb-4 text-gray-800"
                        >
                          {children}
                        </h3>
                      ),
                      h4: ({ children }) => (
                        <h4 
                          id={`heading-${headings.findIndex(h => h.text === String(children))}`}
                          className="text-lg font-bold mt-6 mb-3 text-gray-800"
                        >
                          {children}
                        </h4>
                      ),
                      h5: ({ children }) => (
                        <h5 
                          id={`heading-${headings.findIndex(h => h.text === String(children))}`}
                          className="text-base font-bold mt-5 mb-2 text-gray-800"
                        >
                          {children}
                        </h5>
                      ),
                      h6: ({ children }) => (
                        <h6 
                          id={`heading-${headings.findIndex(h => h.text === String(children))}`}
                          className="text-sm font-bold mt-4 mb-2 text-gray-800"
                        >
                          {children}
                        </h6>
                      ),
                      p: ({ children }) => (
                        <p className="mb-4 leading-relaxed text-gray-700">
                          {children}
                        </p>
                      ),
                      ul: ({ children }) => (
                        <ul className="mb-4 ml-6 space-y-2">
                          {children}
                        </ul>
                      ),
                      ol: ({ children }) => (
                        <ol className="mb-4 ml-6 space-y-2">
                          {children}
                        </ol>
                      ),
                      li: ({ children }) => (
                        <li className="text-gray-700 leading-relaxed">
                          {children}
                        </li>
                      ),
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-4 border-blue-400 bg-blue-50 pl-6 py-4 my-6 italic text-gray-700 rounded-r-lg">
                          {children}
                        </blockquote>
                      ),
                      table: ({ children }) => (
                        <div className="overflow-x-auto my-6">
                          <table className="min-w-full border border-gray-200 rounded-lg overflow-hidden">
                            {children}
                          </table>
                        </div>
                      ),
                      th: ({ children }) => (
                        <th className="bg-gray-50 border border-gray-200 px-4 py-3 text-left font-semibold text-gray-800">
                          {children}
                        </th>
                      ),
                      td: ({ children }) => (
                        <td className="border border-gray-200 px-4 py-3 text-gray-700">
                          {children}
                        </td>
                      ),
                    }}
                  >
                      {currentDocument.content}
                    </ReactMarkdown>
                  </div>
                </article>
              </div>
            </div>
            
            {/* 桌面端右侧目录 */}
            {!isMobile && headings.length > 0 && (
              <div className="fixed-toc">
                <TableOfContents />
              </div>
            )}
          </div>
          
          {/* 移动端文档树抽屉 */}
          <Drawer
            title={
              <div className="flex items-center">
                <FolderOpenOutlined className="mr-2 text-green-500" />
                <span>文档列表</span>
              </div>
            }
            placement="left"
            onClose={() => setTreeDrawerVisible(false)}
            open={treeDrawerVisible}
            width={280}
          >
            <div className="p-4">
              {spaceInfo && (
                <div className="mb-4">
                  <Button 
                    type="text" 
                    size="small"
                    onClick={() => navigate(`/spaces/${spaceInfo.slug}`)}
                    className="mb-2"
                  >
                    返回空间
                  </Button>
                </div>
              )}
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
          </Drawer>
          
          {/* 移动端目录抽屉 */}
          <Drawer
            title={
              <div className="flex items-center">
                <BookOutlined className="mr-2 text-blue-500" />
                <span>目录导航</span>
              </div>
            }
            placement="right"
            onClose={() => setDrawerVisible(false)}
            open={drawerVisible}
            width={280}
          >
            <TableOfContents />
          </Drawer>
        </div>
      </Content>

      {/* 回到顶部按钮 */}
      <FloatButton.BackTop
        style={{
          right: 24,
          bottom: 24,
        }}
      />
    </Layout>
  )
}

export default DocumentByIdViewPage
