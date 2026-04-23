use super::{api_delete, api_get, api_post};
use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Deserialize, Clone, PartialEq)]
pub struct ChangeRequest {
    pub id: Option<Value>,
    pub title: Option<String>,
    pub description: Option<String>,
    pub space_id: Option<String>,
    pub document_id: Option<String>,
    pub document_title: Option<String>,
    pub author_id: Option<String>,
    pub reviewer_id: Option<String>,
    pub status: Option<String>,
    pub diff_content: Option<String>,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
}

#[derive(Deserialize)]
struct Wrap<T> {
    data: T,
}

#[derive(Deserialize)]
struct ListData {
    items: Vec<ChangeRequest>,
}

pub async fn list_crs(
    status: Option<&str>,
    space_id: Option<&str>,
) -> Result<Vec<ChangeRequest>, String> {
    let mut path = "/api/docs/change-requests?per_page=50".to_string();
    if let Some(s) = status {
        path.push_str(&format!("&status={}", s));
    }
    if let Some(sid) = space_id {
        path.push_str(&format!("&space_id={}", sid));
    }
    let resp: Wrap<ListData> = api_get(&path).await?;
    Ok(resp.data.items)
}

#[derive(Serialize)]
pub struct CreateCrRequest {
    pub title: String,
    pub description: Option<String>,
    pub space_id: String,
    pub document_id: String,
    pub document_title: Option<String>,
    pub diff_content: Option<String>,
    pub reviewer_id: Option<String>,
}

pub async fn create_cr(req: CreateCrRequest) -> Result<Value, String> {
    let resp: Wrap<Value> = api_post("/api/docs/change-requests", &req).await?;
    Ok(resp.data)
}

pub async fn approve_cr(id: &str) -> Result<(), String> {
    let path = format!("/api/docs/change-requests/{}/approve", id);
    let _: Value = api_post(&path, &serde_json::json!({})).await?;
    Ok(())
}

pub async fn reject_cr(id: &str) -> Result<(), String> {
    let path = format!("/api/docs/change-requests/{}/reject", id);
    let _: Value = api_post(&path, &serde_json::json!({})).await?;
    Ok(())
}

pub async fn delete_cr(id: &str) -> Result<(), String> {
    let path = format!("/api/docs/change-requests/{}", id);
    api_delete(&path).await
}

fn extract_id(cr: &ChangeRequest) -> String {
    cr.id
        .as_ref()
        .and_then(|v| v.get("id"))
        .and_then(|v| v.as_str())
        .or_else(|| cr.id.as_ref().and_then(|v| v.as_str()))
        .unwrap_or("")
        .to_string()
}
