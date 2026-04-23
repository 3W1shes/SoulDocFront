use super::{api_delete, api_get, api_post, api_put};
use crate::models::Tag;
use serde::{Deserialize, Serialize};

#[derive(Deserialize)]
struct SuccessData<T> {
    data: T,
}

#[derive(Deserialize)]
pub struct TagListData {
    pub tags: Option<Vec<Tag>>,
    pub total_count: Option<i64>,
}

pub async fn list_tags(
    space_id: Option<&str>,
    page: u32,
    per_page: u32,
) -> Result<TagListData, String> {
    let mut path = format!("/api/docs/tags?page={}&per_page={}", page, per_page);
    if let Some(sid) = space_id {
        path.push_str(&format!("&space_id={}", sid));
    }
    let resp: SuccessData<TagListData> = api_get(&path).await?;
    Ok(resp.data)
}

#[derive(Serialize)]
pub struct CreateTagRequest {
    pub name: String,
    pub color: Option<String>,
    pub description: Option<String>,
    pub space_id: Option<String>,
}

pub async fn create_tag(req: CreateTagRequest) -> Result<Tag, String> {
    let resp: SuccessData<Tag> = api_post("/api/docs/tags", &req).await?;
    Ok(resp.data)
}

#[derive(Serialize)]
pub struct UpdateTagRequest {
    pub name: Option<String>,
    pub color: Option<String>,
    pub description: Option<String>,
}

pub async fn update_tag(tag_id: &str, req: UpdateTagRequest) -> Result<Tag, String> {
    let path = format!("/api/docs/tags/{}", tag_id);
    let resp: SuccessData<Tag> = api_put(&path, &req).await?;
    Ok(resp.data)
}

pub async fn delete_tag(tag_id: &str) -> Result<(), String> {
    let path = format!("/api/docs/tags/{}", tag_id);
    api_delete(&path).await
}

pub async fn get_popular_tags(space_id: Option<&str>, limit: u32) -> Result<Vec<Tag>, String> {
    let mut path = format!("/api/docs/tags/popular?limit={}", limit);
    if let Some(sid) = space_id {
        path.push_str(&format!("&space_id={}", sid));
    }
    let resp: SuccessData<Vec<Tag>> = api_get(&path).await?;
    Ok(resp.data)
}
