use super::{api_delete, api_get, api_post, api_put};
use serde_json::Value;

pub async fn list_templates() -> Result<Vec<Value>, String> {
    let resp: Value = api_get("/api/docs/templates").await?;
    Ok(resp
        .get("data")
        .and_then(|d| d.get("items"))
        .and_then(|v| v.as_array())
        .cloned()
        .unwrap_or_default())
}

pub async fn get_template(id: &str) -> Result<Value, String> {
    let path = format!("/api/docs/templates/{}", id);
    let resp: Value = api_get(&path).await?;
    Ok(resp.get("data").cloned().unwrap_or(Value::Null))
}

pub async fn create_template(body: &Value) -> Result<Value, String> {
    let resp: Value = api_post("/api/docs/templates", body).await?;
    Ok(resp.get("data").cloned().unwrap_or(Value::Null))
}

pub async fn update_template(id: &str, body: &Value) -> Result<Value, String> {
    let path = format!("/api/docs/templates/{}", id);
    let resp: Value = api_put(&path, body).await?;
    Ok(resp.get("data").cloned().unwrap_or(Value::Null))
}

pub async fn delete_template(id: &str) -> Result<(), String> {
    let path = format!("/api/docs/templates/{}", id);
    api_delete(&path).await
}

pub async fn use_template(id: &str) -> Result<Value, String> {
    let raw_id = id.trim_start_matches("doc_template:");
    let path = format!("/api/docs/templates/{}/use", raw_id);
    let resp: Value = api_post(&path, &serde_json::json!({})).await?;
    Ok(resp.get("data").cloned().unwrap_or(Value::Null))
}
