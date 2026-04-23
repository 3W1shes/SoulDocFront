use super::{api_get, api_post, api_put};
use serde_json::Value;

pub async fn list_tool_configs() -> Result<Vec<Value>, String> {
    let resp: Value = api_get("/api/docs/tool-configs").await?;
    Ok(resp
        .get("data")
        .and_then(|d| d.get("items"))
        .and_then(|v| v.as_array())
        .cloned()
        .unwrap_or_default())
}

pub async fn update_tool_config(id: &str, body: &Value) -> Result<Value, String> {
    let path = format!("/api/docs/tool-configs/{}", id);
    let resp: Value = api_put(&path, body).await?;
    Ok(resp.get("data").cloned().unwrap_or(Value::Null))
}

pub async fn test_tool_config(id: &str) -> Result<Value, String> {
    let path = format!("/api/docs/tool-configs/{}/test", id);
    let resp: Value = api_post(&path, &serde_json::json!({})).await?;
    Ok(resp.get("data").cloned().unwrap_or(Value::Null))
}
