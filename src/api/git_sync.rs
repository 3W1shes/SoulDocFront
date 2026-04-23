use super::{api_delete, api_get, api_post, api_put};
use serde_json::Value;

pub async fn list_repos() -> Result<Vec<Value>, String> {
    let resp: Value = api_get("/api/docs/git-sync/repositories").await?;
    Ok(resp
        .get("data")
        .and_then(|d| d.get("items"))
        .and_then(|v| v.as_array())
        .cloned()
        .unwrap_or_default())
}

pub async fn create_repo(body: &Value) -> Result<Value, String> {
    let resp: Value = api_post("/api/docs/git-sync/repositories", body).await?;
    Ok(resp.get("data").cloned().unwrap_or(Value::Null))
}

pub async fn update_repo(id: &str, body: &Value) -> Result<Value, String> {
    let path = format!("/api/docs/git-sync/repositories/{}", id);
    let resp: Value = api_put(&path, body).await?;
    Ok(resp.get("data").cloned().unwrap_or(Value::Null))
}

pub async fn delete_repo(id: &str) -> Result<(), String> {
    let path = format!("/api/docs/git-sync/repositories/{}", id);
    api_delete(&path).await
}

pub async fn trigger_sync(id: &str) -> Result<Value, String> {
    let path = format!("/api/docs/git-sync/repositories/{}/sync", id);
    let resp: Value = api_post(&path, &serde_json::json!({})).await?;
    Ok(resp.get("data").cloned().unwrap_or(Value::Null))
}

pub async fn sync_logs(id: &str) -> Result<Vec<Value>, String> {
    let path = format!("/api/docs/git-sync/repositories/{}/logs", id);
    let resp: Value = api_get(&path).await?;
    Ok(resp
        .get("data")
        .and_then(|d| d.get("items"))
        .and_then(|v| v.as_array())
        .cloned()
        .unwrap_or_default())
}
