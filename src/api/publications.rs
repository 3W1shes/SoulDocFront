use super::api_get;
use serde::Deserialize;

#[derive(Debug, Clone, Deserialize)]
pub struct Publication {
    pub id: Option<serde_json::Value>,
    pub slug: Option<String>,
    pub name: Option<String>,
    pub description: Option<String>,
    pub status: Option<String>,
    pub domain: Option<String>,
    pub space_id: Option<String>,
    pub created_at: Option<String>,
    pub updated_at: Option<String>,
}

#[derive(Deserialize)]
struct Wrap<T> {
    data: T,
}

pub async fn list_publications(space_id: &str) -> Result<Vec<Publication>, String> {
    let path = format!("/api/docs/publications/spaces/{}/publications", space_id);
    let resp: Wrap<Vec<Publication>> = api_get(&path).await?;
    Ok(resp.data)
}
