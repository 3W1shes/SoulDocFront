import React, { useState } from 'react'
import { Layout, Menu, Dropdown, Avatar, Button, Input, Badge } from 'antd'
import { 
  MenuFoldOutlined, 
  MenuUnfoldOutlined,
  SearchOutlined,
  BellOutlined,
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
  HomeOutlined,
  FolderOutlined
} from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { FORUM_LOGIN_URL } from '@/App'
import NotificationDropdown from '@/components/notifications/NotificationDropdown'
import type { MenuProps } from 'antd'

const { Header, Sider, Content } = Layout
const { Search } = Input

interface MainLayoutProps {
  children: React.ReactNode
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuthStore()

  // 用户下拉菜单
  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人资料',
      onClick: () => navigate('/profile'),
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '设置',
      onClick: () => navigate('/settings'),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: () => {
        logout()
        window.location.replace(FORUM_LOGIN_URL)
      },
    },
  ]

  // 侧边栏菜单项
  const sideMenuItems: MenuProps['items'] = [
    {
      key: '/dashboard',
      icon: <HomeOutlined />,
      label: '仪表板',
      onClick: () => navigate('/dashboard'),
    },
    {
      key: 'spaces',
      icon: <FolderOutlined />,
      label: '空间管理',
      children: [
        {
          key: '/spaces',
          label: '所有空间',
          onClick: () => navigate('/spaces'),
        },
      ],
    },
    {
      key: '/notifications',
      icon: <BellOutlined />,
      label: '通知中心',
      onClick: () => navigate('/notifications'),
    },
  ]

  // 获取当前选中的菜单项
  const getSelectedKeys = () => {
    const path = location.pathname
    if (path.startsWith('/spaces/')) {
      return ['spaces']
    }
    return [path]
  }

  // 搜索处理
  const handleSearch = (value: string) => {
    if (value.trim()) {
      navigate(`/search?q=${encodeURIComponent(value.trim())}`)
    }
  }

  return (
    <Layout className="h-screen">
      {/* 侧边栏 */}
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed}
        className="bg-white border-r border-gray-200"
        width={240}
      >
        {/* Logo区域 */}
        <div className="h-16 flex items-center justify-center border-b border-gray-200">
          {collapsed ? (
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">R</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">R</span>
              </div>
              <span className="text-xl font-bold text-gray-800">Rainbow Docs</span>
            </div>
          )}
        </div>

        {/* 菜单 */}
        <Menu
          mode="inline"
          selectedKeys={getSelectedKeys()}
          items={sideMenuItems}
          className="border-none"
          style={{ height: 'calc(100% - 64px)' }}
        />
      </Sider>

      {/* 主内容区域 */}
      <Layout>
        {/* 顶部导航栏 */}
        <Header className="bg-white border-b border-gray-200 px-6 flex items-center justify-between h-16">
          <div className="flex items-center space-x-4">
            {/* 折叠按钮 */}
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              className="text-gray-600 hover:text-gray-800"
            />

            {/* 搜索框 */}
            <Search
              placeholder="搜索文档、空间..."
              allowClear
              onSearch={handleSearch}
              style={{ width: 300 }}
              className="hidden md:block"
            />
          </div>

          <div className="flex items-center space-x-4">
            {/* 移动端搜索按钮 */}
            <Button
              type="text"
              icon={<SearchOutlined />}
              onClick={() => navigate('/search')}
              className="md:hidden text-gray-600 hover:text-gray-800"
            />

            {/* 通知 */}
            <NotificationDropdown />

            {/* 用户菜单 */}
            <Dropdown
              menu={{ items: userMenuItems }}
              placement="bottomRight"
              trigger={['click']}
            >
              <div className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded-lg">
                <Avatar 
                  src={user?.avatar_url}
                  icon={<UserOutlined />}
                  size="small"
                />
                <span className="text-gray-700 font-medium hidden sm:block">
                  {user?.display_name || user?.username}
                </span>
              </div>
            </Dropdown>
          </div>
        </Header>

        {/* 内容区域 */}
        <Content className="overflow-auto">
          {children}
        </Content>
      </Layout>
    </Layout>
  )
}

export default MainLayout
