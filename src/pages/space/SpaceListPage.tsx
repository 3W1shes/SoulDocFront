import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Card,
  List,
  Button,
  Input,
  Space,
  Tag,
  Empty,
  Spin,
  Avatar,
  Dropdown,
  Modal,
  Form,
  Switch,
  message,
  Row,
  Col,
  Typography,
  Breadcrumb
} from 'antd'
import {
  PlusOutlined,
  SearchOutlined,
  FolderOpenOutlined,
  FileTextOutlined,
  TeamOutlined,
  MoreOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  HomeOutlined,
  SettingOutlined
} from '@ant-design/icons'
import { useSpaceStore } from '@/stores/spaceStore'
import type { Space as SpaceType, CreateSpaceRequest } from '@/types'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'

dayjs.extend(relativeTime)

const { Title, Text } = Typography
const { Search } = Input

const SpaceListPage: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { spaces, loading, loadSpaces, createSpace, deleteSpace } = useSpaceStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [createModalVisible, setCreateModalVisible] = useState(false)
  const [createForm] = Form.useForm()


  useEffect(() => {
    loadSpaces()
  }, [])

  useEffect(() => {
    if (location.pathname === '/spaces/create') {
      setCreateModalVisible(true)
    }
  }, [location.pathname])

  const handleCreateSpace = async (values: CreateSpaceRequest) => {
    try {
      await createSpace(values)
      message.success('空间创建成功')
      setCreateModalVisible(false)
      createForm.resetFields()
      if (location.pathname === '/spaces/create') {
        navigate('/spaces', { replace: true })
      }
    } catch (error) {
      message.error('创建空间失败')
    }
  }

  const handleCancelCreate = () => {
    setCreateModalVisible(false)
    if (location.pathname === '/spaces/create') {
      navigate('/spaces', { replace: true })
    }
  }

  const handleDeleteSpace = (space: SpaceType) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除空间 "${space.name}" 吗？此操作不可恢复。`,
      onOk: async () => {
        try {
          await deleteSpace(space.slug)
          message.success('空间删除成功')
        } catch (error) {
          message.error('删除空间失败')
        }
      }
    })
  }

  const filteredSpaces = spaces.filter(space =>
    space.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    space.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const renderSpaceCard = (space: SpaceType) => (
    <Card
      key={space.id}
      className="mb-4 hover:shadow-lg transition-shadow cursor-pointer"
      onClick={() => navigate(`/spaces/${space.slug}`)}
      actions={[
        <div
          key="view"
          onClick={(e) => {
            e.stopPropagation()
            navigate(`/spaces/${space.slug}`)
          }}
        >
          <EyeOutlined /> 查看
        </div>,
        <div
          key="settings"
          onClick={(e) => {
            e.stopPropagation()
            navigate(`/spaces/${space.slug}/settings`)
          }}
        >
          <SettingOutlined /> 设置
        </div>,
        <Dropdown
          key="more"
          menu={{
            items: [
              {
                key: 'edit',
                label: '编辑',
                icon: <EditOutlined />,
                onClick: () => navigate(`/spaces/${space.slug}/edit`)
              },
              {
                key: 'delete',
                label: '删除',
                icon: <DeleteOutlined />,
                danger: true,
                onClick: () => handleDeleteSpace(space)
              }
            ]
          }}
          trigger={['click']}
        >
          <div onClick={(e) => e.stopPropagation()}>
            <MoreOutlined /> 更多
          </div>
        </Dropdown>
      ]}
    >
      <Card.Meta
        avatar={
          <Avatar
            size={64}
            icon={<FolderOpenOutlined />}
            className="bg-blue-100 text-blue-600"
          />
        }
        title={
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold">{space.name}</span>
            <div className="flex items-center space-x-2">
              <Tag color={space.is_public ? 'green' : 'orange'}>
                {space.is_public ? '公开' : '私有'}
              </Tag>
            </div>
          </div>
        }
        description={
          <div className="space-y-2">
            <Text type="secondary" className="text-base">
              {space.description || '暂无描述'}
            </Text>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span>
                <FileTextOutlined className="mr-1" />
                0 篇文档
              </span>
              <span>
                <TeamOutlined className="mr-1" />
                1 名成员
              </span>
              <span>
                创建于 {dayjs(space.created_at).format('YYYY-MM-DD')}
              </span>
            </div>
          </div>
        }
      />
    </Card>
  )

  return (
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
                <span className="ml-1">空间管理</span>
              </span>
            ),
          },
        ]}
      />

      {/* 页面标题和操作 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Title level={2} className="mb-2">
            空间管理
          </Title>
          <Text type="secondary">
            管理您的文档空间，组织和分享您的知识
          </Text>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setCreateModalVisible(true)}
        >
          创建空间
        </Button>
      </div>

      {/* 搜索和过滤 */}
      <Card className="mb-6">
        <Row gutter={16}>
          <Col span={8}>
            <Search
              placeholder="搜索空间名称或描述"
              allowClear
              enterButton={<SearchOutlined />}
              size="large"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </Col>
        </Row>
      </Card>

      {/* 空间列表 */}
      <div>
        {loading ? (
          <div className="flex justify-center items-center h-96">
            <div className="text-center">
          <Spin size="large" />
          <div className="mt-3 text-gray-500">加载中...</div>
        </div>
          </div>
        ) : filteredSpaces.length === 0 ? (
          <Empty
            description={
              searchTerm ? '没有找到匹配的空间' : '您还没有创建任何空间'
            }
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            {!searchTerm && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setCreateModalVisible(true)}
              >
                创建第一个空间
              </Button>
            )}
          </Empty>
        ) : (
          <Row gutter={[16, 16]}>
            {filteredSpaces.map(space => (
              <Col key={space.id} xs={24} sm={12} lg={8} xl={6}>
                {renderSpaceCard(space)}
              </Col>
            ))}
          </Row>
        )}
      </div>

      {/* 创建空间模态框 */}
      <Modal
        title="创建新空间"
        open={createModalVisible}
        onCancel={handleCancelCreate}
        footer={null}
      >
        <Form
          form={createForm}
          onFinish={handleCreateSpace}
          layout="vertical"
        >
          <Form.Item
            label="空间名称"
            name="name"
            rules={[{ required: true, message: '请输入空间名称' }]}
          >
            <Input placeholder="请输入空间名称" />
          </Form.Item>
          
          <Form.Item
            label="空间标识"
            name="slug"
            rules={[{ required: true, message: '请输入空间标识' }]}
          >
            <Input placeholder="space-slug" />
          </Form.Item>
          
          <Form.Item
            label="空间描述"
            name="description"
          >
            <Input.TextArea 
              rows={3} 
              placeholder="请输入空间描述（可选）" 
            />
          </Form.Item>
          
          <Form.Item
            label="公开访问"
            name="is_public"
            valuePropName="checked"
            initialValue={false}
          >
            <Switch />
          </Form.Item>
          
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                创建空间
              </Button>
              <Button onClick={() => setCreateModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}

export default SpaceListPage
