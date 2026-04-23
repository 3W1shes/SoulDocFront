use super::{api_get, api_post, api_put};
use serde::{Deserialize, Serialize};
use serde_json::Value;

#[derive(Deserialize, Clone)]
pub struct SpaceLanguage {
    pub language_code: Option<String>,
    pub language_name: Option<String>,
    pub is_default: Option<bool>,
    pub enabled: Option<bool>,
}

#[derive(Deserialize, Clone)]
pub struct DocLanguage {
    pub language_code: Option<String>,
    pub language_name: Option<String>,
    pub status: Option<String>,
    pub is_default: Option<bool>,
    pub updated_at: Option<String>,
}

#[derive(Deserialize)]
struct Wrap<T> {
    data: T,
}

pub async fn list_space_languages(space_slug: &str) -> Result<Vec<SpaceLanguage>, String> {
    let path = format!("/api/docs/language/spaces/{}/languages", space_slug);
    let resp: Wrap<Vec<SpaceLanguage>> = api_get(&path).await?;
    Ok(resp.data)
}

#[derive(Serialize)]
pub struct AddLanguageRequest {
    pub language_code: String,
    pub is_default: Option<bool>,
}

pub async fn add_space_language(space_slug: &str, code: String) -> Result<Value, String> {
    let path = format!("/api/docs/language/spaces/{}/languages", space_slug);
    let resp: Wrap<Value> = api_post(
        &path,
        &AddLanguageRequest {
            language_code: code,
            is_default: Some(false),
        },
    )
    .await?;
    Ok(resp.data)
}

pub async fn list_doc_languages(
    space_slug: &str,
    doc_slug: &str,
) -> Result<Vec<DocLanguage>, String> {
    let path = format!(
        "/api/docs/language/documents/{}/{}/languages",
        space_slug, doc_slug
    );
    let resp: Wrap<Vec<DocLanguage>> = api_get(&path).await?;
    Ok(resp.data)
}

#[derive(Serialize)]
pub struct UpdateDocLangRequest {
    pub status: Option<String>,
    pub content: Option<String>,
}

pub async fn update_doc_language(
    space_slug: &str,
    doc_slug: &str,
    code: &str,
    req: UpdateDocLangRequest,
) -> Result<Value, String> {
    let path = format!(
        "/api/docs/language/documents/{}/{}/languages/{}",
        space_slug, doc_slug, code
    );
    let resp: Wrap<Value> = api_put(&path, &req).await?;
    Ok(resp.data)
}

pub async fn request_translation(
    space_slug: &str,
    doc_slug: &str,
    code: &str,
) -> Result<Value, String> {
    let path = format!(
        "/api/docs/language/documents/{}/{}/languages/{}/translate",
        space_slug, doc_slug, code
    );
    let resp: Wrap<Value> = api_post(&path, &serde_json::json!({})).await?;
    Ok(resp.data)
}
