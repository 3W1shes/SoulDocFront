use super::api_get;
use crate::models::SearchResult;
use serde::Deserialize;

#[derive(Deserialize)]
struct SuccessData<T> {
    data: T,
}

#[derive(Deserialize)]
pub struct SearchData {
    pub results: Option<Vec<SearchResult>>,
    pub total: Option<u64>,
}

pub async fn search(query: &str, page: u32, per_page: u32) -> Result<SearchData, String> {
    let path = format!(
        "/api/docs/search?q={}&page={}&per_page={}",
        urlencoding(query),
        page,
        per_page
    );
    let resp: SuccessData<SearchData> = api_get(&path).await?;
    Ok(resp.data)
}

pub async fn suggest(query: &str) -> Result<Vec<String>, String> {
    let path = format!("/api/docs/search/suggest?q={}", urlencoding(query));
    let resp: SuccessData<Vec<String>> = api_get(&path).await?;
    Ok(resp.data)
}

fn urlencoding(s: &str) -> String {
    js_sys::encode_uri_component(s).into()
}
