import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Layout,
  Typography,
  Breadcrumb,
  Spin,
  Empty,
  Tabs,
  Card
} from 'antd'
import {
  HomeOutlined,
  FolderOpenOutlined,
  SettingOutlined,
  TeamOutlined,
  GlobalOutlined,
  InfoCircleOutlined
} from '@ant-design/icons'
import { useSpaceStore } from '@/stores/spaceStore'
import { useAuthStore } from '@/stores/authStore'
import SpaceMemberManager from '@/components/space/SpaceMemberManager'
import PublicationList from '@/components/publication/PublicationList'
import PublishDialog from '@/components/publication/PublishDialog'
import type { Publication } from '@/services/publicationService'

const { Content } = Layout
const { Title } = Typography

type SpaceParams = {
  spaceSlug: string
}

const SpaceSettingsPage: React.FC = () => {
  const { spaceSlug } = useParams() as SpaceParams
  const navigate = useNavigate()
  const { currentSpace, loadSpace, loading: spaceLoading } = useSpaceStore()
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState('members')
  const [publishDialogVisible, setPublishDialogVisible] = useState(false)

  useEffect(() => {
    if (spaceSlug) {
      loadSpace(spaceSlug)
    }
  }, [spaceSlug])

  const handlePublishSuccess = (publication: Publication) => {
    setPublishDialogVisible(false)
    // 可以在这里显示发布成功的提示或跳转到发布详情
    window.open(publication.public_url, '_blank')
  }

  if (spaceLoading) {
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

  if (!user) {
    return (
      <div className="flex items-center justify-center h-96">
        <Empty description="用户未登录" />
      </div>
    )
  }

  return (
    <Layout className="min-h-screen bg-gray-50">
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
            {
              title: (
                <span className="cursor-pointer" onClick={() => navigate(`/spaces/${spaceSlug}`)}>
                  {currentSpace.name}
                </span>
              ),
            },
            {
              title: (
                <span>
                  <SettingOutlined />
                  <span className="ml-1">设置</span>
                </span>
              ),
            },
          ]}
        />

        {/* 页面标题 */}
        <div className="mb-6">
          <Title level={2} className="mb-0">
            <SettingOutlined className="mr-2" />
            空间设置
          </Title>
        </div>

        {/* 设置标签页 */}
        <Card>
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={[
              {
                key: 'members',
                label: (
                  <span>
                    <TeamOutlined />
                    成员管理
                  </span>
                ),
                children: (
                  <SpaceMemberManager 
                    spaceSlug={spaceSlug!}
                    spaceId={currentSpace.id} 
                    currentUserId={user.id}
                  />
                ),
              },
              {
                key: 'publications',
                label: (
                  <span>
                    <GlobalOutlined />
                    发布管理
                  </span>
                ),
                children: (
                  <PublicationList
                    spaceId={currentSpace.id}
                    spaceName={currentSpace.name}
                    onPublish={() => setPublishDialogVisible(true)}
                  />
                ),
              },
              {
                key: 'info',
                label: (
                  <span>
                    <InfoCircleOutlined />
                    基本信息
                  </span>
                ),
                children: (
                  <Card title="空间信息">
                    <div className="space-y-4">
                      <div>
                        <span className="text-gray-500">空间名称：</span>
                        <span className="font-medium">{currentSpace.name}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">空间标识：</span>
                        <code className="bg-gray-100 px-2 py-1 rounded">{currentSpace.slug}</code>
                      </div>
                      <div>
                        <span className="text-gray-500">描述：</span>
                        <span>{currentSpace.description || '暂无描述'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">访问权限：</span>
                        <span>{currentSpace.is_public ? '公开' : '私有'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">创建时间：</span>
                        <span>{new Date(currentSpace.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                  </Card>
                ),
              },
            ]}
          />
        </Card>

        {/* 发布对话框 */}
        {currentSpace && (
          <PublishDialog
            visible={publishDialogVisible}
            spaceId={currentSpace.id}
            spaceName={currentSpace.name}
            onClose={() => setPublishDialogVisible(false)}
            onSuccess={handlePublishSuccess}
          />
        )}
      </Content>
    </Layout>
  )
}

export default SpaceSettingsPage
