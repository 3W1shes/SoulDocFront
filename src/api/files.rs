use super::{api_delete, api_get};
use serde::Deserialize;

#[derive(Debug, Clone, Deserialize)]
pub struct FileItem {
    pub id: String,
    pub filename: String,
    pub original_name: String,
    pub file_size: i64,
    pub file_type: String,
    pub mime_type: String,
    pub url: String,
    pub thumbnail_url: Option<String>,
    pub space_id: Option<String>,
    pub document_id: Option<String>,
    pub uploaded_by: String,
    pub created_at: String,
}

#[derive(Deserialize)]
pub struct FileListResponse {
    pub files: Vec<FileItem>,
    pub total_count: i64,
}

pub async fn list_files(space_id: &str) -> Result<Vec<FileItem>, String> {
    let path = format!("/api/docs/files?space_id={}&per_page=50", space_id);
    let resp: FileListResponse = api_get(&path).await?;
    Ok(resp.files)
}

pub async fn delete_file(file_id: &str) -> Result<(), String> {
    let path = format!("/api/docs/files/{}", file_id);
    api_delete(&path).await
}
