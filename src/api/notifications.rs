use super::{api_delete, api_get, api_post, api_put};
use crate::models::Notification;
use serde::Deserialize;
use serde_json::Value;

#[derive(Deserialize)]
struct SuccessData<T> {
    data: T,
}

#[derive(Deserialize)]
pub struct NotificationListData {
    pub notifications: Option<Vec<Notification>>,
    pub total: Option<u64>,
}

pub async fn list_notifications(page: u32, page_size: u32) -> Result<NotificationListData, String> {
    let path = format!("/api/docs/notifications?page={}&limit={}", page, page_size);
    let resp: SuccessData<NotificationListData> = api_get(&path).await?;
    Ok(resp.data)
}

#[derive(Deserialize)]
pub struct UnreadCountData {
    pub count: u32,
    pub unread_count: Option<u32>,
}

pub async fn get_unread_count() -> Result<u32, String> {
    let resp: SuccessData<UnreadCountData> =
        api_get("/api/docs/notifications/unread-count").await?;
    Ok(resp.data.unread_count.unwrap_or(resp.data.count))
}

pub async fn mark_as_read(notification_id: &str) -> Result<(), String> {
    let path = format!("/api/docs/notifications/{}", notification_id);
    let _: Value = api_put(&path, &serde_json::json!({})).await?;
    Ok(())
}

pub async fn mark_all_read() -> Result<(), String> {
    let _: Value = api_post(
        "/api/docs/notifications/mark-all-read",
        &serde_json::json!({}),
    )
    .await?;
    Ok(())
}

pub async fn delete_notification(notification_id: &str) -> Result<(), String> {
    let path = format!("/api/docs/notifications/{}", notification_id);
    api_delete(&path).await
}
