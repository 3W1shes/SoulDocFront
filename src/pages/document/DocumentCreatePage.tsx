import React, { useState, useCallback, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import {
  App,
  Layout,
  Typography,
  Button,
  Breadcrumb,
  Card,
  Input,
  Switch,
  message,
  Space,
  Tabs
} from 'antd'
import {
  SaveOutlined,
  HomeOutlined,
  FolderOpenOutlined,
  FileTextOutlined,
  ArrowLeftOutlined,
  EditOutlined,
  EyeOutlined,
  SplitCellsOutlined
} from '@ant-design/icons'
import { useDocStore } from '@/stores/docStore'
import { useSpaceStore } from '@/stores/spaceStore'
import type { RouteParams, CreateDocumentRequest } from '@/types'
import MDEditor from '@uiw/react-md-editor'
import '@uiw/react-md-editor/markdown-editor.css'
import '@uiw/react-markdown-preview/markdown.css'

const { Content } = Layout
const { Title, Text } = Typography

interface DocumentCreateParams extends RouteParams {
  spaceSlug: string
}

// URL查询参数类型
interface CreateDocumentQuery {
  parent_id?: string
  parent_title?: string
}

const DocumentCreatePage: React.FC = () => {
  const { message } = App.useApp()
  const { spaceSlug } = useParams<DocumentCreateParams>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { createDocument } = useDocStore()
  const { currentSpace, loadSpace } = useSpaceStore()
  
  // 通用ID清理函数
  const cleanId = (id: string | null | undefined): string | null => {
    if (!id) return null
    return id.replace(/^(document|space|user):/, '')
  }

  // 从URL参数获取父文档信息，并清理ID格式
  const rawParentId = searchParams.get('parent_id')
  const parentId = cleanId(rawParentId)
  const parentTitle = searchParams.get('parent_title')
  
  
  const [content, setContent] = useState(`# 新文档

欢迎使用Markdown编辑器！

## 功能特性

- ✅ **实时预览**：支持编辑和预览同时显示
- ✅ **语法高亮**：代码块自动高亮显示
- ✅ **工具栏**：丰富的编辑工具
- ✅ **粘贴支持**：可以直接粘贴Markdown格式内容

## 示例内容

### 代码块
\`\`\`javascript
function hello() {
  console.log("Hello, World!");
}
\`\`\`

### 表格
| 列1 | 列2 | 列3 |
|-----|-----|-----|
| 数据1 | 数据2 | 数据3 |

### 列表
1. 有序列表项1
2. 有序列表项2
   - 嵌套项目
   - 另一个嵌套项目

> 这是一个引用块，可以用来突出重要信息。

**开始编写您的文档内容吧！**`)
  const [title, setTitle] = useState('')
  const [activeTab, setActiveTab] = useState('split')
  const [isPublic, setIsPublic] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (spaceSlug && (!currentSpace || currentSpace.slug !== spaceSlug)) {
      loadSpace(spaceSlug)
    }
  }, [spaceSlug]) // 只依赖 spaceSlug，不依赖 currentSpace


  const handleSave = useCallback(async () => {
    if (!spaceSlug || !title.trim()) {
      message.error('请填写文档标题')
      return
    }

    // 生成slug - 支持中文
    // 将中文转换为拼音或使用时间戳作为slug
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 8)
    
    // 如果标题包含英文，尝试提取英文部分作为slug
    const englishPart = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
    
    // 如果有英文部分就使用，否则使用时间戳
    const slug = englishPart || `doc-${timestamp}-${randomStr}`

    setSaving(true)
    try {
      // parent_id已经在上面清理过了，直接使用
      
      const documentData: CreateDocumentRequest = {
        title: title.trim(),
        slug,
        content,
        is_public: isPublic,
        parent_id: parentId || undefined
      }

      const createdDocument = await createDocument(spaceSlug, documentData)
      message.success('文档创建成功')
      
      // 使用清理函数处理文档ID
      const cleanDocId = cleanId(createdDocument.id)
      
      if (cleanDocId) {
        // 使用清理后的文档ID跳转到基于ID的路由
        navigate(`/docs/${cleanDocId}`)
      } else {
        // 如果ID清理失败，回退到空间页面
        navigate(`/spaces/${spaceSlug}`)
      }
    } catch (error) {
      message.error('创建文档失败')
      console.error('Create document error:', error)
    } finally {
      setSaving(false)
    }
  }, [spaceSlug, title, content, isPublic, createDocument, navigate])

  const handleBack = () => {
    navigate(`/spaces/${spaceSlug}`)
  }

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
            ...(parentTitle
              ? [{
                  title: (
                    <span>
                      <FileTextOutlined />
                      <span className="ml-1">{parentTitle}</span>
                    </span>
                  ),
                }]
              : []),
            {
              title: (
                <span>
                  <FileTextOutlined />
                  <span className="ml-1">{parentTitle ? '创建子文档' : '创建文档'}</span>
                </span>
              ),
            },
          ]}
        />

        {/* 顶部操作栏 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button 
              icon={<ArrowLeftOutlined />} 
              onClick={handleBack}
            >
              返回空间
            </Button>
            <Title level={3} className="mb-0">
              {parentTitle ? `创建 "${parentTitle}" 的子文档` : '创建新文档'}
            </Title>
            {parentTitle && (
              <Text type="secondary" className="ml-2">
                父文档：{parentTitle}
              </Text>
            )}
          </div>
          
          <Space>
            <div className="flex items-center space-x-2">
              <Text>公开发布：</Text>
              <Switch 
                checked={isPublic}
                onChange={setIsPublic}
              />
            </div>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              loading={saving}
              onClick={handleSave}
              disabled={!title.trim()}
            >
              创建文档
            </Button>
          </Space>
        </div>

        {/* 文档标题输入 */}
        <Card className="mb-4">
          <Input
            size="large"
            placeholder="请输入文档标题..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-xl font-semibold border-none shadow-none"
            style={{ padding: 0 }}
          />
        </Card>

        {/* Markdown编辑器 */}
        <Card className="h-full">
          <MDEditor
            value={content}
            onChange={(value) => setContent(value || '')}
            preview={activeTab === 'preview' ? 'preview' : activeTab === 'edit' ? 'edit' : 'live'}
            hideToolbar={false}
            visibleDragbar={false}
            data-color-mode="light"
            height={window.innerHeight - 320}
            style={{
              backgroundColor: 'transparent'
            }}
          />
          
          {/* 底部工具栏 */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <div className="flex items-center space-x-4">
              <Text type="secondary">编辑模式：</Text>
              <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                size="small"
                items={[
                  {
                    key: 'edit',
                    label: (
                      <span>
                        <EditOutlined className="mr-1" />
                        编辑
                      </span>
                    )
                  },
                  {
                    key: 'split',
                    label: (
                      <span>
                        <SplitCellsOutlined className="mr-1" />
                        分屏
                      </span>
                    )
                  },
                  {
                    key: 'preview',
                    label: (
                      <span>
                        <EyeOutlined className="mr-1" />
                        预览
                      </span>
                    )
                  }
                ]}
              />
            </div>
            
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <span>字符数: {content.length}</span>
              <span>|</span>
              <span>支持粘贴Markdown格式内容</span>
            </div>
          </div>
        </Card>
      </Content>
    </Layout>
  )
}

export default DocumentCreatePage
