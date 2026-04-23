use super::{api_get, api_put};
use serde_json::Value;

pub async fn get_settings() -> Result<Value, String> {
    let resp: Value = api_get("/api/docs/settings").await?;
    Ok(resp.get("data").cloned().unwrap_or(Value::Null))
}

pub async fn update_general(body: &Value) -> Result<Value, String> {
    let resp: Value = api_put("/api/docs/settings/general", body).await?;
    Ok(resp.get("data").cloned().unwrap_or(Value::Null))
}

pub async fn update_ai(body: &Value) -> Result<Value, String> {
    let resp: Value = api_put("/api/docs/settings/ai", body).await?;
    Ok(resp.get("data").cloned().unwrap_or(Value::Null))
}

pub async fn update_notifications(body: &Value) -> Result<Value, String> {
    let resp: Value = api_put("/api/docs/settings/notifications", body).await?;
    Ok(resp.get("data").cloned().unwrap_or(Value::Null))
}

pub async fn update_security(body: &Value) -> Result<Value, String> {
    let resp: Value = api_put("/api/docs/settings/security", body).await?;
    Ok(resp.get("data").cloned().unwrap_or(Value::Null))
}

pub async fn update_appearance(body: &Value) -> Result<Value, String> {
    let resp: Value = api_put("/api/docs/settings/appearance", body).await?;
    Ok(resp.get("data").cloned().unwrap_or(Value::Null))
}
