use super::api_get;
use serde::Deserialize;

#[derive(Deserialize, Clone, Default)]
pub struct OverviewStats {
    pub space_count: i64,
    pub document_count: i64,
    pub tag_count: i64,
    pub open_change_requests: i64,
    pub active_ai_tasks: i64,
}

#[derive(Deserialize)]
struct Wrap {
    data: OverviewStats,
}

pub async fn get_overview() -> Result<OverviewStats, String> {
    let resp: Wrap = api_get("/api/docs/stats/overview").await?;
    Ok(resp.data)
}
