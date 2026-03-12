import React, { useState, useRef } from 'react'
import { Dropdown, Card, Button } from 'antd'
import { useNavigate } from 'react-router-dom'
import NotificationBadge, { NotificationBadgeRef } from './NotificationBadge'
import NotificationList from './NotificationList'

const NotificationDropdown: React.FC = () => {
  const [visible, setVisible] = useState(false)
  const badgeRef = useRef<NotificationBadgeRef>(null)
  const navigate = useNavigate()

  const handleNotificationUpdate = () => {
    // 更新未读数量徽章
    badgeRef.current?.refreshCount()
  }

  const handleViewAll = () => {
    setVisible(false)
    navigate('/notifications')
  }

  const dropdownContent = (
    <Card className="w-96 max-h-96 overflow-auto shadow-lg">
      <div className="max-h-80 overflow-y-auto">
        <NotificationList onNotificationUpdate={handleNotificationUpdate} />
      </div>
      <div className="border-t pt-2 mt-2 text-center">
        <Button type="link" onClick={handleViewAll}>
          查看全部通知
        </Button>
      </div>
    </Card>
  )

  return (
    <Dropdown
      popupRender={() => dropdownContent}
      trigger={['click']}
      open={visible}
      onOpenChange={setVisible}
      placement="bottomRight"
      overlayClassName="notification-dropdown"
    >
      <div>
        <NotificationBadge 
          ref={badgeRef}
          onClick={() => setVisible(!visible)}
        />
      </div>
    </Dropdown>
  )
}

export default NotificationDropdown
