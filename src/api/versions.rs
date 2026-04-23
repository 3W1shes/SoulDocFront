use super::api_get;
use crate::models::Version;
use serde::Deserialize;

#[derive(Deserialize)]
struct VersionListResponse {
    versions: Vec<Version>,
    total_count: i64,
    page: i64,
    per_page: i64,
}

pub async fn list_versions(
    document_id: &str,
    page: u32,
    per_page: u32,
) -> Result<Vec<Version>, String> {
    let path = format!(
        "/api/docs/versions/{}/versions?page={}&per_page={}",
        document_id, page, per_page
    );
    let resp: VersionListResponse = api_get(&path).await?;
    Ok(resp.versions)
}
