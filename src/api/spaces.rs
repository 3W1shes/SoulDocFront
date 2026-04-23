use super::{api_delete, api_get, api_post, api_put};
use crate::models::{CreateSpaceRequest, Space};
use serde::{Deserialize, Serialize};

#[derive(Deserialize)]
struct SuccessData<T> {
    data: T,
}

#[derive(Deserialize)]
pub struct SpaceListData {
    pub spaces: Option<Vec<Space>>,
    pub items: Option<Vec<Space>>,
    pub total: Option<u64>,
    pub page: Option<u32>,
    pub page_size: Option<u32>,
    pub limit: Option<u32>,
}

pub async fn list_spaces(page: u32, page_size: u32) -> Result<SpaceListData, String> {
    let path = format!("/api/docs/spaces?page={}&limit={}", page, page_size);
    let resp: SuccessData<SpaceListData> = api_get(&path).await?;
    Ok(normalize_space_list(resp.data))
}

pub async fn create_space(req: CreateSpaceRequest) -> Result<Space, String> {
    let resp: SuccessData<Space> = api_post("/api/docs/spaces", &req).await?;
    Ok(normalize_space(resp.data))
}

pub async fn get_space(slug: &str) -> Result<Space, String> {
    let path = format!("/api/docs/spaces/{}", slug);
    let resp: SuccessData<Space> = api_get(&path).await?;
    Ok(normalize_space(resp.data))
}

#[derive(Serialize)]
pub struct UpdateSpaceRequest {
    pub name: Option<String>,
    pub description: Option<String>,
    pub is_public: Option<bool>,
}

pub async fn update_space(slug: &str, req: UpdateSpaceRequest) -> Result<Space, String> {
    let path = format!("/api/docs/spaces/{}", slug);
    let resp: SuccessData<Space> = api_put(&path, &req).await?;
    Ok(normalize_space(resp.data))
}

pub async fn delete_space(slug: &str) -> Result<(), String> {
    let path = format!("/api/docs/spaces/{}", slug);
    api_delete(&path).await
}

#[derive(Deserialize)]
pub struct SpaceStats {
    #[serde(alias = "document_count")]
    pub doc_count: Option<u32>,
    pub member_count: Option<u32>,
    pub tag_count: Option<u32>,
    pub public_document_count: Option<u32>,
    pub comment_count: Option<u32>,
    pub view_count: Option<u32>,
}

pub async fn get_space_stats(slug: &str) -> Result<SpaceStats, String> {
    let path = format!("/api/docs/spaces/{}/stats", slug);
    let resp: SuccessData<SpaceStats> = api_get(&path).await?;
    Ok(resp.data)
}

fn normalize_space_list(mut data: SpaceListData) -> SpaceListData {
    if let Some(spaces) = data.spaces.take() {
        data.spaces = Some(spaces.into_iter().map(normalize_space).collect());
    }
    if let Some(items) = data.items.take() {
        data.items = Some(items.into_iter().map(normalize_space).collect());
    }
    data
}

fn normalize_space(mut space: Space) -> Space {
    if let Some(stats) = &space.stats {
        if space.doc_count.is_none() {
            space.doc_count = stats.document_count;
        }
        if space.member_count.is_none() {
            space.member_count = stats.member_count;
        }
        if space.tag_count.is_none() {
            space.tag_count = stats.tag_count;
        }
    }
    space
}
