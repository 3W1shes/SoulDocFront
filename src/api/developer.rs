use super::{api_delete, api_get, api_post, api_put};
use serde_json::Value;

pub async fn list_api_keys() -> Result<Vec<Value>, String> {
    let resp: Value = api_get("/api/docs/developer/api-keys").await?;
    Ok(resp
        .get("data")
        .and_then(|d| d.get("items"))
        .and_then(|v| v.as_array())
        .cloned()
        .unwrap_or_default())
}

pub async fn create_api_key(body: &Value) -> Result<Value, String> {
    let resp: Value = api_post("/api/docs/developer/api-keys", body).await?;
    Ok(resp.get("data").cloned().unwrap_or(Value::Null))
}

pub async fn delete_api_key(id: &str) -> Result<(), String> {
    let path = format!("/api/docs/developer/api-keys/{}", id);
    api_delete(&path).await
}

pub async fn list_webhooks() -> Result<Vec<Value>, String> {
    let resp: Value = api_get("/api/docs/developer/webhooks").await?;
    Ok(resp
        .get("data")
        .and_then(|d| d.get("items"))
        .and_then(|v| v.as_array())
        .cloned()
        .unwrap_or_default())
}

pub async fn create_webhook(body: &Value) -> Result<Value, String> {
    let resp: Value = api_post("/api/docs/developer/webhooks", body).await?;
    Ok(resp.get("data").cloned().unwrap_or(Value::Null))
}

pub async fn update_webhook(id: &str, body: &Value) -> Result<Value, String> {
    let path = format!("/api/docs/developer/webhooks/{}", id);
    let resp: Value = api_put(&path, body).await?;
    Ok(resp.get("data").cloned().unwrap_or(Value::Null))
}

pub async fn delete_webhook(id: &str) -> Result<(), String> {
    let path = format!("/api/docs/developer/webhooks/{}", id);
    api_delete(&path).await
}

pub async fn test_webhook(id: &str) -> Result<Value, String> {
    let path = format!("/api/docs/developer/webhooks/{}/test", id);
    let resp: Value = api_post(&path, &serde_json::json!({})).await?;
    Ok(resp.get("data").cloned().unwrap_or(Value::Null))
}

pub async fn list_ai_users() -> Result<Vec<Value>, String> {
    let resp: Value = api_get("/api/docs/developer/ai-users").await?;
    Ok(resp
        .get("data")
        .and_then(|d| d.get("items"))
        .and_then(|v| v.as_array())
        .cloned()
        .unwrap_or_default())
}

pub async fn get_manifest() -> Result<Value, String> {
    api_get("/api/docs/developer/manifest").await
}
