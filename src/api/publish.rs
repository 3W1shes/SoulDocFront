use super::{api_get, api_post, api_put};
use serde_json::Value;

pub async fn get_seo_metadata(space_slug: &str) -> Result<Value, String> {
    let path = format!("/api/docs/publish/seo/{}", space_slug);
    let resp: Value = api_get(&path).await?;
    Ok(resp.get("data").cloned().unwrap_or(Value::Null))
}

pub async fn update_seo_metadata(space_slug: &str, body: &Value) -> Result<Value, String> {
    let path = format!("/api/docs/publish/seo/{}", space_slug);
    let resp: Value = api_put(&path, body).await?;
    Ok(resp.get("data").cloned().unwrap_or(Value::Null))
}

pub async fn ai_analyze_seo(space_slug: &str) -> Result<Value, String> {
    let path = format!("/api/docs/publish/seo/{}/analyze", space_slug);
    let resp: Value = api_post(&path, &serde_json::json!({})).await?;
    Ok(resp.get("data").cloned().unwrap_or(Value::Null))
}

pub async fn list_publish_targets() -> Result<Vec<Value>, String> {
    let resp: Value = api_get("/api/docs/publish/targets").await?;
    Ok(resp
        .get("data")
        .and_then(|d| d.get("items"))
        .and_then(|v| v.as_array())
        .cloned()
        .unwrap_or_default())
}

pub async fn trigger_publish(target_id: &str, version: &str) -> Result<Value, String> {
    let path = format!("/api/docs/publish/targets/{}/publish", target_id);
    let resp: Value = api_post(&path, &serde_json::json!({ "version": version })).await?;
    Ok(resp.get("data").cloned().unwrap_or(Value::Null))
}

pub async fn list_release_history() -> Result<Vec<Value>, String> {
    let resp: Value = api_get("/api/docs/publish/history").await?;
    Ok(resp
        .get("data")
        .and_then(|d| d.get("items"))
        .and_then(|v| v.as_array())
        .cloned()
        .unwrap_or_default())
}
