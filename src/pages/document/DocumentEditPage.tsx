import React, { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Layout,
  Typography,
  Button,
  Breadcrumb,
  Spin,
  Empty,
  Card,
  Input,
  Switch,
  message,
  Form,
  Space,
  Tabs,
  Affix,
  Modal
} from 'antd'
import {
  SaveOutlined,
  EyeOutlined,
  HomeOutlined,
  FolderOpenOutlined,
  FileTextOutlined,
  SettingOutlined,
  ArrowLeftOutlined,
  ExclamationCircleOutlined,
  EditOutlined,
  SplitCellsOutlined
} from '@ant-design/icons'
import { useDocStore } from '@/stores/docStore'
import { useSpaceStore } from '@/stores/spaceStore'
import type { RouteParams } from '@/types'
import MDEditor from '@uiw/react-md-editor'
import '@uiw/react-md-editor/markdown-editor.css'
import '@uiw/react-markdown-preview/markdown.css'
import debounce from 'lodash/debounce'

const { Content } = Layout
const { Text } = Typography

interface DocumentParams extends RouteParams {
  spaceSlug?: string
  docSlug?: string
  docId?: string
}

const DocumentEditPage: React.FC = () => {
  const { spaceSlug, docSlug, docId } = useParams<DocumentParams>()
  const navigate = useNavigate()
  const { 
    currentDocument, 
    currentSpace,
    loadDocument, 
    loadDocumentById,
    updateDocument,
    updateDocumentById,
    loading,
    saving,
    hasUnsavedChanges,
    editingContent,
    updateEditingContent,
    startEditing,
    stopEditing
  } = useDocStore()
  const { loadSpace } = useSpaceStore()
  
  const [form] = Form.useForm()
  const [activeTab, setActiveTab] = useState('edit')
  const [isSettingsVisible, setIsSettingsVisible] = useState(false)
  const [autoSave, setAutoSave] = useState(true)

  // 防抖保存函数
  const debouncedSave = useCallback(
    debounce(async (content: string) => {
      if (autoSave && hasUnsavedChanges && currentDocument) {
        try {
          if (docId) {
            // 使用ID模式
            await updateDocumentById(docId, { content })
          } else if (currentSpace && spaceSlug && docSlug) {
            // 使用传统模式
            await updateDocument(currentSpace.slug, currentDocument.slug, { content })
          }
          message.success('自动保存成功', 1)
        } catch (error) {
          message.error('自动保存失败', 1)
        }
      }
    }, 3000),
    [autoSave, hasUnsavedChanges, currentDocument, currentSpace, updateDocument, updateDocumentById, docId, spaceSlug, docSlug]
  )

  useEffect(() => {
    if (docId) {
      // 使用ID模式加载文档
      loadDocumentById(docId)
    } else if (spaceSlug && docSlug) {
      // 使用传统模式加载文档
      loadSpace(spaceSlug)
      loadDocument(spaceSlug, docSlug)
    }
  }, [spaceSlug, docSlug, docId])

  useEffect(() => {
    if (currentDocument) {
      startEditing()
      form.setFieldsValue({
        title: currentDocument.title,
        is_published: currentDocument.is_published
      })
    }
  }, [currentDocument])

  useEffect(() => {
    if (editingContent && autoSave) {
      debouncedSave(editingContent)
    }
  }, [editingContent, autoSave, debouncedSave])

  // 监听页面离开事件
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = ''
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges])

  const handleContentChange = (value?: string) => {
    updateEditingContent(value || '')
  }

  const handleSave = async () => {
    if (!currentDocument || !currentSpace) return

    try {
      const values = await form.validateFields()
      await updateDocument(currentSpace.slug, currentDocument.slug, {
        title: values.title,
        content: editingContent,
        is_published: values.is_published
      })
      message.success('保存成功')
    } catch (error) {
      message.error('保存失败')
    }
  }

  const handlePreview = () => {
    if (docId) {
      // 使用ID模式路由
      navigate(`/docs/${docId}`)
    } else if (spaceSlug && docSlug) {
      // 使用传统模式路由
      navigate(`/spaces/${spaceSlug}/docs/${docSlug}`)
    }
  }

  const handleBack = () => {
    const navigateToView = () => {
      if (docId) {
        // 使用ID模式路由
        navigate(`/docs/${docId}`)
      } else if (spaceSlug && docSlug) {
        // 使用传统模式路由
        navigate(`/spaces/${spaceSlug}/docs/${docSlug}`)
      } else {
        // 兜底路由，返回仪表板
        navigate('/dashboard')
      }
    }

    if (hasUnsavedChanges) {
      Modal.confirm({
        title: '确认离开',
        icon: <ExclamationCircleOutlined />,
        content: '您有未保存的更改，确定要离开吗？',
        onOk: () => {
          stopEditing()
          navigateToView()
        }
      })
    } else {
      navigateToView()
    }
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
      <Content>
        <div className="p-6">
          {/* 顶部工具栏 */}
          <Affix offsetTop={0}>
            <Card className="mb-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Button 
                    icon={<ArrowLeftOutlined />}
                    onClick={handleBack}
                  >
                    返回
                  </Button>
                  
                  <Breadcrumb
                    items={[
                      {
                        title: (
                          <span className="cursor-pointer" onClick={() => navigate('/dashboard')}>
                            <HomeOutlined />
                            <span className="ml-1">首页</span>
                          </span>
                        ),
                      },
                      ...(currentSpace
                        ? [{
                            title: (
                              <span className="cursor-pointer" onClick={() => navigate(`/spaces/${currentSpace.slug}`)}>
                                <FolderOpenOutlined />
                                <span className="ml-1">{currentSpace.name}</span>
                              </span>
                            ),
                          }]
                        : []),
                      {
                        title: (
                          <span>
                            <FileTextOutlined />
                            <span className="ml-1">编辑: {currentDocument.title}</span>
                          </span>
                        ),
                      },
                    ]}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  {hasUnsavedChanges && (
                    <Text type="warning" className="mr-2">
                      有未保存的更改
                    </Text>
                  )}
                  
                  <Button
                    icon={<SettingOutlined />}
                    onClick={() => setIsSettingsVisible(true)}
                  >
                    设置
                  </Button>
                  
                  <Button
                    icon={<EyeOutlined />}
                    onClick={handlePreview}
                  >
                    预览
                  </Button>
                  
                  <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    loading={saving}
                    onClick={handleSave}
                  >
                    {saving ? '保存中...' : '保存'}
                  </Button>
                </div>
              </div>
            </Card>
          </Affix>

          {/* 文档标题和设置 */}
          <Card className="mb-4">
            <Form form={form} layout="vertical">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Form.Item
                  label="文档标题"
                  name="title"
                  rules={[{ required: true, message: '请输入文档标题' }]}
                  className="md:col-span-2"
                >
                  <Input size="large" placeholder="请输入文档标题" />
                </Form.Item>

                <Form.Item
                  label="发布状态"
                  name="is_published"
                  valuePropName="checked"
                >
                  <Switch 
                    size="default"
                    checkedChildren="已发布" 
                    unCheckedChildren="草稿" 
                  />
                </Form.Item>
              </div>
            </Form>
          </Card>

          {/* Markdown编辑器 */}
          <Card className="h-full">
            <MDEditor
              value={editingContent}
              onChange={handleContentChange}
              preview={activeTab === 'preview' ? 'preview' : activeTab === 'edit' ? 'edit' : 'live'}
              hideToolbar={false}
              visibleDragbar={false}
              data-color-mode="light"
              height={window.innerHeight - 400}
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
                <span>字符数: {editingContent?.length || 0}</span>
                <span>|</span>
                <span>支持粘贴Markdown格式内容</span>
              </div>
            </div>
          </Card>
        </div>
      </Content>

      {/* 设置模态框 */}
      <Modal
        title="编辑器设置"
        open={isSettingsVisible}
        onCancel={() => setIsSettingsVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsSettingsVisible(false)}>
            关闭
          </Button>
        ]}
      >
        <Form layout="vertical">
          <Form.Item label="自动保存">
            <Switch 
              checked={autoSave}
              onChange={setAutoSave}
              checkedChildren="开启" 
              unCheckedChildren="关闭"
            />
            <div className="text-gray-500 text-sm mt-1">
              开启后将每3秒自动保存一次
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  )
}

export default DocumentEditPage
